import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import {
  GIT_REMOTES_FILE_NAME,
  parseConfig
} from '../shared/config'
import type {
  GitFileDiffResult,
  GitFileOperationResult,
  GitFileStatusResult,
  GitInitStatus,
  CommandOutputEvent,
  CommandResult,
  LocalRemoteItem,
  RemoteConfigurationStatus,
  RemoteStatusResult,
  RepositoryConfig,
  RepositoryRemoteStatus
} from '../shared/types'
import { executeCommand } from './commandRunner'
import { commitStagedChanges } from './gitCommit'
import {
  discardChanges,
  getFileDiff,
  stageFiles,
  unstageFiles
} from './gitStage'
import { getFileStatus } from './gitStatus'
import { isGitRepository } from './gitRepository'

type OutputHandler = (event: CommandOutputEvent) => void

function createStatus(
  isGitRepo: boolean,
  overrides: Partial<GitInitStatus> = {}
): GitInitStatus {
  const hasConfigFile = overrides.hasConfigFile ?? false
  const hasValidRepo = overrides.hasValidRepo ?? false
  const remoteStatus = overrides.remoteStatus ?? 'none'
  const localRemotes = overrides.localRemotes ?? []
  const extraRemotes = overrides.extraRemotes ?? []
  const repositoryRemoteStatuses = overrides.repositoryRemoteStatuses ?? []

  return {
    configFileExists: overrides.configFileExists ?? false,
    hasConfigFile,
    hasValidRepo,
    hasRemote: localRemotes.length > 0,
    needsInit: !hasConfigFile,
    needsSetup:
      isGitRepo && hasConfigFile && hasValidRepo && remoteStatus !== 'matched',
    isGitRepo,
    remoteStatus,
    localRemotes,
    extraRemotes,
    repositoryRemoteStatuses
  }
}

export async function getInitStatus(
  cwd: string,
  sender?: WebContents
): Promise<GitInitStatus> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return createStatus(false)
  }

  const workingDirectory = resolve(cwd)

  try {
    const directory = await stat(workingDirectory)
    if (!directory.isDirectory()) {
      return createStatus(false)
    }
  } catch {
    return createStatus(false)
  }

  try {
    const isGitRepo = await isGitRepository(workingDirectory)
    let configFileExists = false
    let hasConfigFile = false
    let hasValidRepo = false
    let repositories: RepositoryConfig[] = []

    try {
      const content = await readFile(
        resolve(workingDirectory, GIT_REMOTES_FILE_NAME),
        'utf8'
      )
      configFileExists = true
      hasConfigFile = content.trim() !== ''
      repositories = hasConfigFile ? parseConfig(content) : []
      hasValidRepo = repositories.some((repo) => repo.url.trim() !== '')
    } catch {
      configFileExists = false
      hasConfigFile = false
      hasValidRepo = false
      repositories = []
    }

    let remoteResult: RemoteStatusResult | null = null
    if (isGitRepo) {
      try {
        remoteResult = await getRemoteStatus(workingDirectory, sender, true)
      } catch {
        remoteResult = null
      }
    }

    const remoteStatus = getRemoteConfigurationStatus(
      repositories,
      remoteResult
    )

    return createStatus(isGitRepo, {
      configFileExists,
      hasConfigFile,
      hasValidRepo,
      remoteStatus,
      localRemotes: remoteResult?.localRemotes ?? [],
      extraRemotes: remoteResult?.extraRemotes ?? [],
      repositoryRemoteStatuses: remoteResult?.statuses ?? []
    })
  } catch {
    return createStatus(false)
  }
}

function getRemoteConfigurationStatus(
  repositories: readonly RepositoryConfig[],
  remoteResult: RemoteStatusResult | null
): RemoteConfigurationStatus {
  if (
    repositories.length === 0 ||
    !remoteResult?.success ||
    remoteResult.localRemotes.length === 0
  ) {
    return 'none'
  }

  return remoteResult.statuses.length === repositories.length &&
    remoteResult.statuses.every((status) => status.status === 'matched')
    ? 'matched'
    : 'mismatch'
}

function normalizeRemoteUrl(value: string): string {
  return value
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\.git$/i, '')
    .toLowerCase()
}

function parseRemoteList(output: string): LocalRemoteItem[] {
  const remotes = new Map<string, LocalRemoteItem>()

  for (const rawLine of output.split(/\r?\n/)) {
    const match = /^(\S+)\s+(.+?)\s+\((fetch|push)\)$/.exec(rawLine.trim())
    if (!match) {
      continue
    }

    const [, name, url, kind] = match
    const remote = remotes.get(name) ?? {
      name,
      fetchUrl: '',
      pushUrls: []
    }

    if (kind === 'fetch') {
      remote.fetchUrl = url
    } else if (!remote.pushUrls.includes(url)) {
      remote.pushUrls.push(url)
    }
    remotes.set(name, remote)
  }

  return [...remotes.values()]
}

async function runRemoteList(
  cwd: string,
  sender?: WebContents
): Promise<{ success: boolean; output: string; error?: string }> {
  const result = await executeCommand('git remote -v', 'git', ['remote', '-v'], cwd, {
    sender,
    deferStdout: true,
    silent: true,
    summarize: () => '读取本地远程列表'
  })

  if (!result.success) {
    return {
      success: false,
      output: '',
      error:
        result.stderr.trim() ||
        `git remote -v 执行失败，退出码：${result.exitCode}。`
    }
  }

  return { success: true, output: result.stdout }
}

function getConfiguredRemoteCandidates(repo: RepositoryConfig): string[] {
  const urlName = repo.url
    .replace(/[\\/]+$/, '')
    .split(/[\\/:]/)
    .pop()
    ?.replace(/\.git$/i, '')
    .trim()

  return [repo.alias, urlName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())
}

function getRemoteUrls(remote: LocalRemoteItem): string[] {
  return [...new Set([remote.fetchUrl, ...remote.pushUrls].filter(Boolean))]
}

export async function getRemoteStatus(
  cwd: string,
  sender?: WebContents,
  silent = false
): Promise<RemoteStatusResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return {
      success: false,
      statuses: [],
      extraRemotes: [],
      localRemotes: [],
      error: '工作目录不能为空。'
    }
  }

  const workingDirectory = resolve(cwd)
  let repositories: RepositoryConfig[] = []

  try {
    const directory = await stat(workingDirectory)
    if (!directory.isDirectory()) {
      throw new Error(`工作目录不是文件夹：${workingDirectory}`)
    }
  } catch (error) {
    return {
      success: false,
      statuses: [],
      extraRemotes: [],
      localRemotes: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }

  if (!(await isGitRepository(workingDirectory))) {
    return {
      success: false,
      statuses: [],
      extraRemotes: [],
      localRemotes: [],
      error: `当前目录不是 Git 仓库：${workingDirectory}`
    }
  }

  try {
    repositories = parseConfig(
      await readFile(
        resolve(workingDirectory, GIT_REMOTES_FILE_NAME),
        'utf8'
      )
    )
  } catch {
    repositories = []
  }

  const remoteResult = silent
    ? await runRemoteList(workingDirectory)
    : await runRemoteList(workingDirectory, sender)
  if (!remoteResult.success) {
    return {
      success: false,
      statuses: repositories.map((repo) => ({
        alias: repo.alias,
        url: repo.url,
        status: 'not_setup',
        remoteName: '',
        localUrl: '',
        message: '尚未 Setup'
      })),
      extraRemotes: [],
      localRemotes: [],
      error: remoteResult.error
    }
  }

  const remotes = parseRemoteList(remoteResult.output)
  const usedRemoteNames = new Set<string>()
  const statuses: RepositoryRemoteStatus[] = repositories.map((repo) => {
    const normalizedConfigUrl = normalizeRemoteUrl(repo.url)
    const exactMatch = remotes.find((remote) =>
      getRemoteUrls(remote).some(
        (url) => normalizeRemoteUrl(url) === normalizedConfigUrl
      )
    )

    if (exactMatch) {
      usedRemoteNames.add(exactMatch.name)
      return {
        alias: repo.alias,
        url: repo.url,
        status: 'matched',
        remoteName: exactMatch.name,
        localUrl: exactMatch.fetchUrl || exactMatch.pushUrls[0] || '',
        message: `已配置且一致（本地远程：${exactMatch.name}）`
      }
    }

    const candidates = getConfiguredRemoteCandidates(repo)
    const namedRemote = remotes.find((remote) =>
      candidates.includes(remote.name.toLowerCase())
    )

    if (!namedRemote) {
      return {
        alias: repo.alias,
        url: repo.url,
        status: 'not_setup',
        remoteName: '',
        localUrl: '',
        message: '尚未 Setup'
      }
    }

    usedRemoteNames.add(namedRemote.name)
    const localUrl = [namedRemote.fetchUrl, ...namedRemote.pushUrls]
      .filter(Boolean)
      .join(' / ')
    return {
      alias: repo.alias,
      url: repo.url,
      status: 'url_mismatch',
      remoteName: namedRemote.name,
      localUrl,
      message: `配置 URL：${repo.url}\n本地 ${namedRemote.name}：${localUrl}`
    }
  })

  return {
    success: true,
    statuses,
    localRemotes: remotes,
    extraRemotes: remotes.filter(
      (remote) => !usedRemoteNames.has(remote.name)
    )
  }
}

export const getStatus = getFileStatus
export const getDiff = getFileDiff
export { stageFiles, unstageFiles }

export function discardFile(
  cwd: string,
  file: string,
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<GitFileOperationResult> {
  return discardChanges(cwd, [file], onOutput, sender)
}

export function commit(
  cwd: string,
  message: string,
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<CommandResult> {
  return commitStagedChanges(cwd, message, onOutput, sender)
}
