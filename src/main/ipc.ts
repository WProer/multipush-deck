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

// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
