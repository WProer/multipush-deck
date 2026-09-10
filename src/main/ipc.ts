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
// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
const __draft1_3 = 3
// 临时整理：第 2-5 项
const __draft1_5 = 5
// 临时整理：第 2-7 项
const __draft1_7 = 7
// 临时整理：第 2-9 项
const __draft1_9 = 9
// 临时整理：第 2-11 项
const __draft1_11 = 11
// 临时整理：第 2-13 项
const __draft1_13 = 13
// 临时整理：第 2-15 项
const __draft1_15 = 15
// 临时整理：第 2-17 项
const __draft1_17 = 17
// 临时整理：第 2-19 项
const __draft1_19 = 19
// 临时整理：第 2-21 项
const __draft1_21 = 21
// 临时整理：第 2-23 项
const __draft1_23 = 23
// 临时整理：第 2-25 项
const __draft1_25 = 25
// 临时整理：第 2-27 项
const __draft1_27 = 27
// 临时整理：第 2-29 项
const __draft1_29 = 29
// 临时整理：第 2-31 项
const __draft1_31 = 31
// 临时整理：第 2-33 项
const __draft1_33 = 33
// 临时整理：第 2-35 项
const __draft1_35 = 35
// 临时整理：第 2-37 项
const __draft1_37 = 37
// 临时整理：第 2-39 项
const __draft1_39 = 39
// 临时整理：第 2-41 项
const __draft1_41 = 41
// 临时整理：第 2-43 项
const __draft1_43 = 43
// 临时整理：第 2-45 项
const __draft1_45 = 45
// 临时整理：第 2-47 项
const __draft1_47 = 47
// 临时整理：第 2-49 项
const __draft1_49 = 49
