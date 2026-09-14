import {
  BrowserWindow,
  dialog,
  ipcMain,
  clipboard,
  shell,
  type OpenDialogOptions
} from 'electron'
import type { RunGitCommandPayload } from '../shared/types'
import { resolve } from 'node:path'
import { IPC_CHANNELS } from '../shared/ipc'
import { getAppInfo, getRuntimeInfo } from './appInfo'
import { executeCommand } from './commandRunner'
import { readConfig, writeConfig } from './config'
import {
  commit,
  discardFile,
  getDiff,
  getInitStatus,
  getRemoteStatus,
  getStatus,
  stageFiles,
  unstageFiles
} from './git'
import { discardChanges } from './gitStage'
import { getCurrentBranch, getFileCounts } from './gitStatus'
import {
  getCommitDetail,
  getCommitFileDiff,
  getCommitLog,
  getPushStatusForCommits,
  listGitBranches
} from './gitLog'
import {
  createEmptyConfigFile as createMultiPushConfigFile,
  getRemoteStatus as getMultiPushRemoteStatus,
  importFromLocalRemotes as importMultiPushFromLocalRemotes,
  listRemotes as listMultiPushRemotes,
  pushAll as pushAllRemotes,
  setupRemotes as setupMultiPushRemotes
} from './multiPush'

interface FileOperationPayload {
  cwd: string
  paths: string[]
}

interface FileDiffPayload {
  cwd: string
  path: string
  staged: boolean
}

interface FileDiscardPayload {
  cwd: string
  file: string
}

interface GitCommitPayload {
  cwd: string
  message: string
}

interface ImportFromRemotesPayload {
  cwd: string
  overwrite: boolean
}

interface MultiPushPushPayload {
  cwd: string
  branch?: string
  concurrency?: number
}

interface MultiPushStatusPayload {
  cwd: string
  branch?: string
}

interface CommitLogPayload {
  cwd: string
  branch?: string
  limit?: number
  skip?: number
}

interface CommitPushStatusPayload {
  cwd: string
  commits: string[]
  branch: string
}

interface CommitHashPayload {
  cwd: string
  hash: string
}

interface CommitFileDiffPayload extends CommitHashPayload {
  path: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertNonEmptyString(
  value: unknown,
  name: string
): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} 必须是非空字符串。`)
  }
}

function assertStringContent(
  value: unknown,
  name: string
): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} 必须是字符串。`)
  }
}

function parseExternalUrl(value: unknown): string {
  assertNonEmptyString(value, 'url')

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new TypeError('url 必须是合法的绝对地址。')
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TypeError('仅允许打开 http 或 https 地址。')
  }

  return parsed.toString()
}

function parseOpenPath(value: unknown): string {
  assertNonEmptyString(value, 'path')

  if (value.includes('\u0000')) {
    throw new TypeError('path 不能包含空字符。')
  }

  return resolve(value)
}

function assertStringArray(
  value: unknown,
  name: string
): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new TypeError(`${name} 必须是字符串数组。`)
  }
}

function parseFileOperationPayload(payload: unknown): FileOperationPayload {
  if (!isRecord(payload)) {
    throw new TypeError('文件操作参数格式无效。')
  }

  const { cwd, paths } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertStringArray(paths, 'paths')

  return { cwd, paths }
}

function parseFileDiffPayload(payload: unknown): FileDiffPayload {
  if (!isRecord(payload)) {
    throw new TypeError('get-file-diff 参数格式无效。')
  }

  const { cwd, path, staged } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertNonEmptyString(path, 'path')

  if (typeof staged !== 'boolean') {
    throw new TypeError('staged 必须是布尔值。')
  }

  return { cwd, path, staged }
}

function parseFileDiscardPayload(payload: unknown): FileDiscardPayload {
  if (!isRecord(payload)) {
    throw new TypeError('git-discard 参数格式无效。')
  }

  const { cwd, file } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertNonEmptyString(file, 'file')

  return { cwd, file }
}

function parseGitCommitPayload(payload: unknown): GitCommitPayload {
  if (!isRecord(payload)) {
    throw new TypeError('git-commit 参数格式无效。')
  }

  const { cwd, message } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertNonEmptyString(message, 'message')

  return { cwd, message }
}

function parseImportFromRemotesPayload(
  payload: unknown
): ImportFromRemotesPayload {
  if (!isRecord(payload)) {
    throw new TypeError('multi-push:import-from-remotes 参数格式无效。')
  }

  const { cwd, overwrite } = payload
  assertNonEmptyString(cwd, 'cwd')

  if (overwrite !== undefined && typeof overwrite !== 'boolean') {
    throw new TypeError('overwrite 必须是布尔值。')
  }

  return { cwd, overwrite: overwrite === true }
}

function parseMultiPushPushPayload(payload: unknown): MultiPushPushPayload {
  if (!isRecord(payload)) {
    throw new TypeError('multi-push:push-all 参数格式无效。')
  }

  const { cwd, branch, concurrency } = payload
  assertNonEmptyString(cwd, 'cwd')
  if (branch !== undefined) {
    assertNonEmptyString(branch, 'branch')
  }
  if (
    concurrency !== undefined &&
    (typeof concurrency !== 'number' ||
      !Number.isInteger(concurrency) ||
      concurrency < 1 ||
      concurrency > 8)
  ) {
    throw new TypeError('concurrency 必须是 1 到 8 之间的整数。')
  }

  return {
    cwd,
    branch: branch === undefined ? undefined : String(branch),
    concurrency:
      concurrency === undefined ? undefined : Number(concurrency)
  }
}

function parseMultiPushStatusPayload(
  payload: unknown
): MultiPushStatusPayload {
  if (!isRecord(payload)) {
    throw new TypeError('multi-push:get-remote-status 参数格式无效。')
  }

  const { cwd, branch } = payload
  assertNonEmptyString(cwd, 'cwd')
  if (branch !== undefined) {
    assertNonEmptyString(branch, 'branch')
  }

  return {
    cwd,
    branch: branch === undefined ? undefined : String(branch)
  }
}

function parseCommitLogPayload(payload: unknown): CommitLogPayload {
  if (!isRecord(payload)) {
    throw new TypeError('git-log:get-log 参数格式无效。')
  }

  const { cwd, branch, limit, skip } = payload
  assertNonEmptyString(cwd, 'cwd')
  if (branch !== undefined) {
    assertNonEmptyString(branch, 'branch')
  }
  if (
    limit !== undefined &&
    (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1)
  ) {
    throw new TypeError('limit 必须是正整数。')
  }
  if (
    skip !== undefined &&
    (typeof skip !== 'number' || !Number.isInteger(skip) || skip < 0)
  ) {
    throw new TypeError('skip 必须是非负整数。')
  }

  return {
    cwd,
    branch: branch === undefined ? undefined : String(branch),
    limit: limit === undefined ? undefined : Number(limit),
    skip: skip === undefined ? undefined : Number(skip)
  }
}

function parseCommitPushStatusPayload(
  payload: unknown
): CommitPushStatusPayload {
  if (!isRecord(payload)) {
    throw new TypeError('git-log:get-push-status 参数格式无效。')
  }

  const { cwd, commits, branch } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertStringArray(commits, 'commits')
  assertNonEmptyString(branch, 'branch')

  if (commits.length > 500) {
    throw new TypeError('单次最多查询 500 个提交的推送状态。')
  }

  return { cwd, commits, branch }
}

function parseCommitHashPayload(payload: unknown): CommitHashPayload {
  if (!isRecord(payload)) {
    throw new TypeError('提交哈希参数格式无效。')
  }

  const { cwd, hash } = payload
  assertNonEmptyString(cwd, 'cwd')
  assertNonEmptyString(hash, 'hash')

  return { cwd, hash }
}

function parseCommitFileDiffPayload(
  payload: unknown
): CommitFileDiffPayload {
  const request = parseCommitHashPayload(payload)
  const path = isRecord(payload) ? payload.path : undefined
  assertNonEmptyString(path, 'path')

  return { ...request, path }
}

function parseRunGitCommandPayload(
  payload: unknown
): RunGitCommandPayload {
  if (!isRecord(payload)) {
    throw new TypeError('run-git-command 参数格式无效。')
  }

  const { source, command, args, cwd } = payload
  assertNonEmptyString(source, 'source')
  assertNonEmptyString(command, 'command')
  assertStringArray(args, 'args')
  assertNonEmptyString(cwd, 'cwd')

  const normalizedCommand = command.trim()
  if (normalizedCommand !== 'git') {
    throw new TypeError('command 仅允许 git。')
  }

  return {
    source,
    command: normalizedCommand,
    args,
    cwd
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.getAppInfo, () => getAppInfo())

  ipcMain.handle(IPC_CHANNELS.getRuntimeInfo, () => getRuntimeInfo())

  ipcMain.handle(IPC_CHANNELS.openPath, async (_event, target: unknown) => {
    return shell.openPath(parseOpenPath(target))
  })

  ipcMain.handle(
    IPC_CHANNELS.copyToClipboard,
    (_event, text: unknown) => {
      assertStringContent(text, 'text')
      clipboard.writeText(text)
      return true
    }
  )

  ipcMain.handle(IPC_CHANNELS.openExternal, async (_event, url: unknown) => {
    await shell.openExternal(parseExternalUrl(url))
    return true
  })

  ipcMain.handle(IPC_CHANNELS.selectDirectory, async (event) => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const options: OpenDialogOptions = {
      properties: ['openDirectory']
    }
    const result = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options)

    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle(IPC_CHANNELS.getInitStatus, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getInitStatus(cwd, event.sender)
  })

  ipcMain.handle(
    IPC_CHANNELS.multiPushInitConfig,
    async (event, cwd: unknown) => {
      assertNonEmptyString(cwd, 'cwd')
      return createMultiPushConfigFile(cwd, { sender: event.sender })
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.multiPushImportFromRemotes,
    async (event, payload: unknown) => {
      const { cwd, overwrite } = parseImportFromRemotesPayload(payload)
      return importMultiPushFromLocalRemotes(
        cwd,
        { overwrite },
        { sender: event.sender }
      )
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.multiPushSetupRemotes,
    async (event, cwd: unknown) => {
      assertNonEmptyString(cwd, 'cwd')
      return setupMultiPushRemotes(cwd, { sender: event.sender })
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.multiPushPushAll,
    async (event, payload: unknown) => {
      const { cwd, branch, concurrency } =
        parseMultiPushPushPayload(payload)
      return pushAllRemotes(cwd, {
        sender: event.sender,
        branch,
        concurrency
      })
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.multiPushGetRemoteStatus,
    async (event, payload: unknown) => {
      const { cwd, branch } = parseMultiPushStatusPayload(payload)
      return getMultiPushRemoteStatus(cwd, {
        sender: event.sender,
        branch
      })
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.multiPushListRemotes,
    async (event, cwd: unknown) => {
      assertNonEmptyString(cwd, 'cwd')
      return listMultiPushRemotes(cwd, { sender: event.sender })
    }
  )

  ipcMain.handle(IPC_CHANNELS.getRemoteStatus, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getRemoteStatus(cwd, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.getCurrentBranch, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getCurrentBranch(cwd, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.getFileCounts, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getFileCounts(cwd, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.getCommitLog, async (event, payload: unknown) => {
    const request = parseCommitLogPayload(payload)
    return getCommitLog(request.cwd, request, event.sender)
  })

  ipcMain.handle(
    IPC_CHANNELS.getCommitPushStatus,
    async (_event, payload: unknown) => {
      const { cwd, commits, branch } = parseCommitPushStatusPayload(payload)
      return getPushStatusForCommits(cwd, commits, branch)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.getCommitDetail,
    async (_event, payload: unknown) => {
      const { cwd, hash } = parseCommitHashPayload(payload)
      return getCommitDetail(cwd, hash)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.getCommitFileDiff,
    async (_event, payload: unknown) => {
      const { cwd, hash, path } = parseCommitFileDiffPayload(payload)
      return getCommitFileDiff(cwd, hash, path)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.listGitBranches,
    async (_event, cwd: unknown) => {
      assertNonEmptyString(cwd, 'cwd')
      return listGitBranches(cwd)
    }
  )

  ipcMain.handle(IPC_CHANNELS.gitStatus, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getStatus(cwd, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.gitDiff, async (event, payload: unknown) => {
    const { cwd, path, staged } = parseFileDiffPayload(payload)
    return getDiff(cwd, path, staged, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.gitStage, async (event, payload: unknown) => {
    const { cwd, paths } = parseFileOperationPayload(payload)
    return stageFiles(cwd, paths, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.gitUnstage, async (event, payload: unknown) => {
    const { cwd, paths } = parseFileOperationPayload(payload)
    return unstageFiles(cwd, paths, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.gitDiscard, async (event, payload: unknown) => {
    const { cwd, file } = parseFileDiscardPayload(payload)
    return discardFile(cwd, file, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.gitCommit, async (event, payload: unknown) => {
    const { cwd, message } = parseGitCommitPayload(payload)
    return commit(cwd, message, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.stageFiles, async (event, payload: unknown) => {
    const { cwd, paths } = parseFileOperationPayload(payload)
    return stageFiles(cwd, paths, undefined, event.sender)
  })

  ipcMain.handle(IPC_CHANNELS.unstageFiles, async (event, payload: unknown) => {
    const { cwd, paths } = parseFileOperationPayload(payload)
    return unstageFiles(cwd, paths, undefined, event.sender)
  })

  ipcMain.handle(
    IPC_CHANNELS.discardChanges,
    async (event, payload: unknown) => {
      const { cwd, paths } = parseFileOperationPayload(payload)
      return discardChanges(cwd, paths, undefined, event.sender)
    }
  )

  ipcMain.handle(IPC_CHANNELS.getFileDiff, async (event, payload: unknown) => {
    const { cwd, path, staged } = parseFileDiffPayload(payload)
    return getDiff(cwd, path, staged, undefined, event.sender)
  })

  ipcMain.handle(
    IPC_CHANNELS.runGitCommand,
    async (event, payload: unknown) => {
      const request = parseRunGitCommandPayload(payload)
      return executeCommand(
        request.source,
        request.command,
        request.args,
        request.cwd,
        { sender: event.sender }
      )
    }
  )

  ipcMain.handle(IPC_CHANNELS.readConfig, async (_event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return readConfig(cwd)
  })

  ipcMain.handle(
    IPC_CHANNELS.writeConfig,
    async (_event, cwd: unknown, content: unknown) => {
      assertNonEmptyString(cwd, 'cwd')
      assertStringContent(content, 'content')
      await writeConfig(cwd, content)
    }
  )

  ipcMain.handle(IPC_CHANNELS.getStatus, async (event, cwd: unknown) => {
    assertNonEmptyString(cwd, 'cwd')
    return getStatus(cwd, undefined, event.sender)
  })
}
