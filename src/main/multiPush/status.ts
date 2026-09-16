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
import { resolveCurrentBranch } from './pusher'

export type RemoteSyncState =
  | 'up-to-date'
  | 'ahead'
  | 'behind'
  | 'diverged'
  | 'unknown'

export interface RemoteSyncStatus {
  name: string
  url: string
  localAhead: number
  localBehind: number
  status: RemoteSyncState
  error?: string
}

export interface MultiPushStatusResult {
  success: boolean
  branch: string
  remotes: RemoteSyncStatus[]
  error?: string
}

export interface RemoteStatusOptions extends MultiPushLogOptions {
  branch?: string
}

function resolveStatus(
  ahead: number,
  behind: number
): RemoteSyncState {
  if (ahead === 0 && behind === 0) {
    return 'up-to-date'
  }
  if (ahead > 0 && behind === 0) {
    return 'ahead'
  }
  if (ahead === 0 && behind > 0) {
    return 'behind'
  }
  return 'diverged'
}

function parseAheadBehind(output: string): {
  ahead: number
  behind: number
} {
  const values = output
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
  const ahead = Number.isFinite(values[0]) ? values[0] : 0
  const behind = Number.isFinite(values[1]) ? values[1] : 0
  return { ahead, behind }
}

function createStatusDetails(
  remotes: readonly RemoteSyncStatus[]
): LogCommandDetail[] {
  return remotes.map((remote) => ({
    name: remote.name,
    url: remote.url,
    status:
      remote.status === 'up-to-date'
        ? 'success'
        : remote.status === 'unknown'
          ? 'unknown'
          : 'failure',
    message: remote.error
      ? remote.error
      : `本地领先 ${remote.localAhead}，落后 ${remote.localBehind}`
  }))
}

function emitStatusSummary(
  cwd: string,
  result: MultiPushStatusResult,
  options: MultiPushLogOptions
): void {
  const ahead = result.remotes.filter(
    (remote) => remote.status === 'ahead'
  ).length
  const behind = result.remotes.filter(
    (remote) => remote.status === 'behind'
  ).length
  const diverged = result.remotes.filter(
    (remote) => remote.status === 'diverged'
  ).length

  emitCommandSummary({
    source: '多仓库状态',
    command: 'multi-push status',
    cwd,
    summary: `检查 ${result.remotes.length} 个远程：领先 ${ahead}，落后 ${behind}，分叉 ${diverged}`,
    details: createStatusDetails(result.remotes),
    stdout: result.remotes
      .map(
        (remote) =>
          `${remote.name}: ${remote.status}, ahead=${remote.localAhead}, behind=${remote.localBehind}`
      )
      .join('\n'),
    exitCode: result.success ? 0 : 1,
    sender: options.sender,
    onOutput: options.onOutput,
    silent: options.silent
  })
}

export async function getRemoteStatus(
  cwd: string,
  options: RemoteStatusOptions = {}
): Promise<MultiPushStatusResult> {
  const repositories = (await readConfig(cwd)).filter((repo) => repo.enabled)
  const configuredRemotes = resolveConfiguredRemotes(repositories)
  const branch =
    options.branch?.trim() || (await resolveCurrentBranch(cwd, options))
  const localRemotes = await listRemotes(cwd, { ...options, silent: true })
  const localByName = new Map(
    localRemotes.map((remote) => [remote.name, remote])
  )
  const statuses: RemoteSyncStatus[] = []

  for (const configured of configuredRemotes) {
    const local = localByName.get(configured.name)
    if (!local) {
      statuses.push({
        name: configured.name,
        url: configured.url,
        localAhead: 0,
        localBehind: 0,
        status: 'unknown',
        error: '本地尚未 Setup 该远程。'
      })
      continue
    }

    const result = await executeCommand(
      'git rev-list',
      'git',
      [
        'rev-list',
        '--left-right',
        '--count',
        `${branch}...${configured.name}/${branch}`
      ],
      cwd,
      {
        sender: options.sender,
        onOutput: options.onOutput,
        silent: options.silent,
        deferStdout: true,
        summarize: () => `检查 ${configured.name} 同步状态`
      }
    )

    if (!result.success) {
      statuses.push({
        name: configured.name,
        url: local.url,
        localAhead: 0,
        localBehind: 0,
        status: 'unknown',
        error: translateCommandFailure(
          result.stderr || `状态检查失败，退出码 ${result.exitCode}`
        )
      })
      continue
    }

    const { ahead, behind } = parseAheadBehind(result.stdout)
    statuses.push({
      name: configured.name,
      url: local.url,
      localAhead: ahead,
      localBehind: behind,
      status: resolveStatus(ahead, behind)
    })
  }

  const response: MultiPushStatusResult = {
    success: true,
    branch,
    remotes: statuses
  }
  emitStatusSummary(cwd, response, options)
  return response
}
