import type { LogCommandDetail } from '../../shared/types'
import {
  emitCommandSummary,
  executeCommand,
  translateCommandFailure
} from '../commandRunner'
import { readConfig } from './config'
import {
  listRemotes,
  resolveConfiguredRemotes,
  type MultiPushLogOptions
} from './remoteManager'

export interface PushOptions extends MultiPushLogOptions {
  branch?: string
  concurrency?: number
}

export interface RemotePushResult {
  remoteName: string
  url: string
  success: boolean
  skipped: boolean
  reason: string
  duration: number
  exitCode: number | null
  stdout: string
  stderr: string
}

export interface PushAllResult {
  success: boolean
  total: number
  successCount: number
  failed: number
  skipped: number
  branch: string
  results: RemotePushResult[]
  error?: string
}

export interface SinglePushResult extends RemotePushResult {}

function normalizeConcurrency(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(Math.floor(value ?? 1), 1), 8)
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await handler(items[index], index)
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  )
  return results
}

export async function resolveCurrentBranch(
  cwd: string,
  options: MultiPushLogOptions
): Promise<string> {
  const result = await executeCommand(
    'git branch',
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    cwd,
    {
      sender: options.sender,
      onOutput: options.onOutput,
      deferStdout: true,
      silent: options.silent,
      summarize: () => '读取当前分支'
    }
  )

  if (!result.success) {
    throw new Error(
      translateCommandFailure(
        result.stderr || `读取当前分支失败，退出码 ${result.exitCode}`
      )
    )
  }

  const branch = result.stdout.trim()
  if (!branch || branch === 'HEAD') {
    throw new Error('无法确定当前分支，请切换到有效分支后重试。')
  }

  return branch
}

async function hasTrackingBranch(
  cwd: string,
  remoteName: string,
  branch: string,
  options: MultiPushLogOptions
): Promise<boolean> {
  const result = await executeCommand(
    'git rev-parse',
    'git',
    [
      'rev-parse',
      '--verify',
      '--quiet',
      `refs/remotes/${remoteName}/${branch}`
    ],
    cwd,
    {
      sender: options.sender,
      onOutput: options.onOutput,
      silent: true,
      deferStdout: true,
      summarize: () => `检查 ${remoteName}/${branch} 跟踪状态`
    }
  )

  return result.success
}

function createSummaryDetails(
  results: readonly RemotePushResult[]
): LogCommandDetail[] {
  return results.map((result) => ({
    name: result.remoteName,
    url: result.url,
    status: result.skipped
      ? 'skipped'
      : result.success
        ? 'success'
        : 'failure',
    message: result.reason
  }))
}

function emitPushSummary(
  cwd: string,
  result: PushAllResult,
  options: MultiPushLogOptions
): void {
  emitCommandSummary({
    source: '多仓库推送',
    command: 'multi-push push-all',
    cwd,
    summary: `推送到 ${result.total} 个仓库：成功 ${result.successCount}，失败 ${result.failed}，跳过 ${result.skipped}`,
    details: createSummaryDetails(result.results),
    exitCode: result.success ? 0 : 1,
    sender: options.sender,
    onOutput: options.onOutput,
    silent: options.silent
  })
}

export async function pushOne(
  cwd: string,
  remoteName: string,
  branch?: string,
  options: MultiPushLogOptions = {}
): Promise<SinglePushResult> {
  const name = remoteName.trim()
  if (!name) {
    throw new Error('远程名称不能为空。')
  }

  const targetBranch =
    branch?.trim() || (await resolveCurrentBranch(cwd, options))
  const remotes = await listRemotes(cwd, { ...options, silent: true })
  const remote = remotes.find((item) => item.name === name)
  const hasTracking = remote
    ? await hasTrackingBranch(cwd, name, targetBranch, options)
    : false
  const args = hasTracking
    ? ['push', name, `${targetBranch}:${targetBranch}`]
    : ['push', '-u', name, targetBranch]
  const result = await executeCommand(
    `git push ${name}`,
    'git',
    args,
    cwd,
    {
      sender: options.sender,
      onOutput: options.onOutput,
      silent: options.silent,
      summarize: (commandResult) =>
        commandResult.success
          ? `推送到 ${name}：成功（耗时 ${commandResult.duration} ms）`
          : `推送到 ${name}：失败（${translateCommandFailure(
              commandResult.stderr ||
                commandResult.stdout ||
                `退出码 ${commandResult.exitCode}`
            )}）`
    }
  )

  return {
    remoteName: name,
    url: remote?.url ?? '',
    success: result.success,
    skipped: false,
    reason: result.success
      ? '推送成功'
      : translateCommandFailure(
          result.stderr || result.stdout || `退出码 ${result.exitCode}`
        ),
    duration: result.duration,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr
  }
}

export async function pushAll(
  cwd: string,
  options: PushOptions = {}
): Promise<PushAllResult> {
  const repositories = (await readConfig(cwd)).filter((repo) => repo.enabled)
  const targets = resolveConfiguredRemotes(repositories)
  const branch =
    options.branch?.trim() || (await resolveCurrentBranch(cwd, options))
  const uniqueTargets = targets.filter((target, index) => {
    const key = `${target.name}\u0000${target.url}`
    return (
      targets.findIndex(
        (candidate) => `${candidate.name}\u0000${candidate.url}` === key
      ) === index
    )
  })
  const skipped = targets.length - uniqueTargets.length
  const results = await mapWithConcurrency(
    uniqueTargets,
    normalizeConcurrency(options.concurrency),
    async (target) => pushOne(cwd, target.name, branch, options)
  )
  const successCount = results.filter((result) => result.success).length
  const failed = results.length - successCount
  const summaryResult: PushAllResult = {
    success: failed === 0 && results.length > 0,
    total: results.length,
    successCount,
    failed,
    skipped,
    branch,
    results
  }

  if (results.length === 0) {
    summaryResult.error = '配置文件中没有可推送的有效仓库。'
  }

  emitPushSummary(cwd, summaryResult, options)
  return summaryResult
}
