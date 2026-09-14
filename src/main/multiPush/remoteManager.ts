import type { WebContents } from 'electron'
import type {
  ConfiguredRemote,
  CommandOutputEvent,
  LocalRemote,
  LogCommandDetail,
  RemoteSetupFailure,
  RemoteSetupItem,
  RepositoryConfig,
  SetupResult
} from '../../shared/types'
import {
  emitCommandSummary,
  executeCommand,
  translateCommandFailure,
  type CommandOutputHandler
} from '../commandRunner'
import { readConfig } from './config'

export type {
  ConfiguredRemote,
  LocalRemote,
  RemoteSetupFailure,
  RemoteSetupItem,
  SetupResult
}

export interface MultiPushLogOptions {
  sender?: WebContents
  onOutput?: CommandOutputHandler
  silent?: boolean
}

export function normalizeRemoteUrl(value: string): string {
  let normalized = value.trim().toLowerCase()
  normalized = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  normalized = normalized.replace(/^[^@/]+@/, '')
  normalized = normalized.replace(/^([^/]+):/, '$1/')
  normalized = normalized.replace(/[\\/]+$/, '')
  normalized = normalized.replace(/\.git$/i, '')
  return normalized
}

export function parseRemoteOutput(output: string): LocalRemote[] {
  const remotes = new Map<string, LocalRemote>()

  for (const rawLine of output.split(/\r?\n/)) {
    const match = /^(\S+)\s+(.+?)\s+\(fetch\)$/.exec(rawLine.trim())
    if (!match) {
      continue
    }

    const [, name, url] = match
    remotes.set(name, {
      name,
      url: url.trim()
    })
  }

  return [...remotes.values()]
}

function generateRemoteName(url: string, existingNames: string[]): string {
  const normalized = url
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\.git$/i, '')
  const parts = normalized.split(/[\\/]/)
  const base = parts.pop()?.trim() || 'remote'
  let candidate = base
  let suffix = 1

  while (existingNames.includes(candidate)) {
    candidate = `${base}${suffix}`
    suffix += 1
  }

  return candidate
}

export function resolveRemoteName(
  repository: RepositoryConfig,
  existingNames: readonly string[]
): string {
  return repository.alias.trim() || generateRemoteName(
    repository.url,
    [...existingNames]
  )
}

export function resolveConfiguredRemotes(
  repositories: readonly RepositoryConfig[]
): ConfiguredRemote[] {
  const names: string[] = []
  const remotes: ConfiguredRemote[] = []

  for (const repository of repositories) {
    const url = repository.url.trim()
    if (!repository.enabled || !url) {
      continue
    }

    const alias = repository.alias.trim()
    const name = resolveRemoteName(repository, names)
    names.push(name)
    remotes.push({ alias, name, url })
  }

  return remotes
}

function emitSetupSummary(
  cwd: string,
  result: SetupResult,
  options: MultiPushLogOptions
): void {
  const details: LogCommandDetail[] = [
    ...result.added.map((item) => ({
      name: item.name,
      url: item.url,
      status: 'success' as const,
      message: '新增远程'
    })),
    ...result.updated.map((item) => ({
      name: item.name,
      url: item.url,
      status: 'success' as const,
      message: '更新远程 URL'
    })),
    ...result.skipped.map((item) => ({
      name: item.name,
      url: item.url,
      status: 'skipped' as const,
      message: 'URL 已一致，无需修改'
    })),
    ...result.failed.map((item) => ({
      name: item.name,
      url: item.url,
      status: 'failure' as const,
      message: item.reason
    }))
  ]

  emitCommandSummary({
    source: '多仓库 Setup',
    command: 'multi-push setup',
    cwd,
    summary: `注册 ${details.length} 个远程：新增 ${result.added.length}，更新 ${result.updated.length}，跳过 ${result.skipped.length}，失败 ${result.failed.length}`,
    details,
    exitCode: result.failed.length > 0 ? 1 : 0,
    sender: options.sender,
    onOutput: options.onOutput,
    silent: options.silent
  })
}

export async function listRemotes(
  cwd: string,
  options: MultiPushLogOptions = {}
): Promise<LocalRemote[]> {
  const result = await executeCommand(
    'git remote',
    'git',
    ['remote', '-v'],
    cwd,
    {
      sender: options.sender,
      onOutput: options.onOutput,
      deferStdout: true,
      silent: options.silent,
      summarize: () => '读取本地远程列表'
    }
  )

  if (!result.success) {
    throw new Error(
      translateCommandFailure(
        result.stderr || `读取本地远程失败，退出码 ${result.exitCode}`
      )
    )
  }

  return parseRemoteOutput(result.stdout)
}

export async function setupRemotes(
  cwd: string,
  options: MultiPushLogOptions = {}
): Promise<SetupResult> {
  const result: SetupResult = {
    success: true,
    added: [],
    updated: [],
    skipped: [],
    failed: []
  }
  const repositories = (await readConfig(cwd)).filter((repo) => repo.enabled)
  const targets = resolveConfiguredRemotes(repositories)
  const localRemotes = await listRemotes(cwd, {
    ...options,
    silent: true
  })
  const localByName = new Map(localRemotes.map((remote) => [remote.name, remote]))

  for (const target of targets) {
    const local = localByName.get(target.name)
    if (!local) {
      const commandResult = await executeCommand(
        'git remote',
        'git',
        ['remote', 'add', target.name, target.url],
        cwd,
        {
          sender: options.sender,
          onOutput: options.onOutput,
          silent: options.silent,
          summarize: () => `新增远程 ${target.name}`
        }
      )

      if (commandResult.success) {
        result.added.push({ name: target.name, url: target.url })
        localByName.set(target.name, {
          name: target.name,
          url: target.url
        })
      } else {
        result.failed.push({
          name: target.name,
          url: target.url,
          reason: translateCommandFailure(
            commandResult.stderr ||
              `新增远程失败，退出码 ${commandResult.exitCode}`
          )
        })
      }
      continue
    }

    if (normalizeRemoteUrl(local.url) === normalizeRemoteUrl(target.url)) {
      result.skipped.push({ name: target.name, url: target.url })
      continue
    }

    const commandResult = await executeCommand(
      'git remote',
      'git',
      ['remote', 'set-url', target.name, target.url],
      cwd,
      {
        sender: options.sender,
        onOutput: options.onOutput,
        silent: options.silent,
        summarize: () => `更新远程 ${target.name}`
      }
    )

    if (commandResult.success) {
      result.updated.push({ name: target.name, url: target.url })
      localByName.set(target.name, {
        name: target.name,
        url: target.url
      })
    } else {
      result.failed.push({
        name: target.name,
        url: target.url,
        reason: translateCommandFailure(
          commandResult.stderr ||
            `更新远程失败，退出码 ${commandResult.exitCode}`
        )
      })
    }
  }

  result.success = result.failed.length === 0
  emitSetupSummary(cwd, result, options)
  return result
}

export async function removeRemote(
  cwd: string,
  name: string,
  options: MultiPushLogOptions = {}
): Promise<void> {
  const remoteName = name.trim()
  if (!remoteName) {
    throw new Error('远程名称不能为空。')
  }

  const result = await executeCommand(
    'git remote',
    'git',
    ['remote', 'remove', remoteName],
    cwd,
    {
      sender: options.sender,
      onOutput: options.onOutput,
      silent: options.silent,
      summarize: () => `移除远程 ${remoteName}`
    }
  )

  if (!result.success) {
    throw new Error(
      translateCommandFailure(
        result.stderr || `移除远程失败，退出码 ${result.exitCode}`
      )
    )
  }
}

export type MultiPushOutputEvent = CommandOutputEvent
