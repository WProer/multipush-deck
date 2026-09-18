import { ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type {
  DesktopApi,
  LogCommandEndEvent,
  LogCommandOutputEvent,
  LogCommandStartEvent
} from '../shared/types'

function subscribe<T>(
  channel: string,
  callback: (event: T) => void
): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => {
    callback(payload)
  }

  ipcRenderer.on(channel, listener)

  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

export const api: DesktopApi = {
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.getAppInfo),

  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.getRuntimeInfo),

  openPath: (target) => ipcRenderer.invoke(IPC_CHANNELS.openPath, target),

  copyToClipboard: (text) =>
    ipcRenderer.invoke(IPC_CHANNELS.copyToClipboard, text),

  openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.openExternal, url),

  selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.selectDirectory),

  getInitStatus: (cwd) => ipcRenderer.invoke(IPC_CHANNELS.getInitStatus, cwd),

  initMultiPushConfig: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushInitConfig, cwd),

  multiPushSetupRemotes: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushSetupRemotes, cwd),

  multiPushPushAll: (cwd, options = {}) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushPushAll, {
      cwd,
      ...options
    }),

  multiPushGetRemoteStatus: (cwd, branch) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushGetRemoteStatus, {
      cwd,
      branch
    }),

  multiPushImportFromRemotes: (cwd, overwrite = false) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushImportFromRemotes, {
      cwd,
      overwrite
    }),

  multiPushListRemotes: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.multiPushListRemotes, cwd),

  getRemoteStatus: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.getRemoteStatus, cwd),

  getCurrentBranch: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.getCurrentBranch, cwd),

  getFileCounts: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.getFileCounts, cwd),

  getCommitLog: (cwd, options) =>
    ipcRenderer.invoke(IPC_CHANNELS.getCommitLog, { cwd, ...options }),

  getCommitPushStatus: (cwd, commits, branch) =>
    ipcRenderer.invoke(IPC_CHANNELS.getCommitPushStatus, {
      cwd,
      commits,
      branch
    }),

  getCommitDetail: (cwd, hash) =>
    ipcRenderer.invoke(IPC_CHANNELS.getCommitDetail, { cwd, hash }),

  getCommitFileDiff: (cwd, hash, path) =>
    ipcRenderer.invoke(IPC_CHANNELS.getCommitFileDiff, { cwd, hash, path }),

  listGitBranches: (cwd) =>
    ipcRenderer.invoke(IPC_CHANNELS.listGitBranches, cwd),

  gitStatus: (cwd) => ipcRenderer.invoke(IPC_CHANNELS.gitStatus, cwd),

  gitDiff: (cwd, file, staged) =>
    ipcRenderer.invoke(IPC_CHANNELS.gitDiff, { cwd, path: file, staged }),

  gitStage: (cwd, files) =>
    ipcRenderer.invoke(IPC_CHANNELS.gitStage, { cwd, paths: files }),

  gitUnstage: (cwd, files) =>
    ipcRenderer.invoke(IPC_CHANNELS.gitUnstage, { cwd, paths: files }),

  gitDiscard: (cwd, file) =>
    ipcRenderer.invoke(IPC_CHANNELS.gitDiscard, { cwd, file }),

  gitCommit: (cwd, message) =>
    ipcRenderer.invoke(IPC_CHANNELS.gitCommit, { cwd, message }),

  runGitCommand: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.runGitCommand, payload),

  stageFiles: (cwd, paths) =>
    ipcRenderer.invoke(IPC_CHANNELS.stageFiles, { cwd, paths }),

  unstageFiles: (cwd, paths) =>
    ipcRenderer.invoke(IPC_CHANNELS.unstageFiles, { cwd, paths }),

  discardChanges: (cwd, paths) =>
    ipcRenderer.invoke(IPC_CHANNELS.discardChanges, { cwd, paths }),

  getFileDiff: (cwd, path, staged) =>
    ipcRenderer.invoke(IPC_CHANNELS.getFileDiff, { cwd, path, staged }),

  readConfig: (cwd) => ipcRenderer.invoke(IPC_CHANNELS.readConfig, cwd),

  writeConfig: (cwd, content) =>
    ipcRenderer.invoke(IPC_CHANNELS.writeConfig, cwd, content),

  getStatus: (cwd) => ipcRenderer.invoke(IPC_CHANNELS.getStatus, cwd),

  onLogCommandStart: (callback) =>
    subscribe<LogCommandStartEvent>(IPC_CHANNELS.logCommandStart, callback),

  onLogCommandStdout: (callback) =>
    subscribe<LogCommandOutputEvent>(IPC_CHANNELS.logCommandStdout, callback),

  onLogCommandStderr: (callback) =>
    subscribe<LogCommandOutputEvent>(IPC_CHANNELS.logCommandStderr, callback),

  onLogCommandEnd: (callback) =>
    subscribe<LogCommandEndEvent>(IPC_CHANNELS.logCommandEnd, callback)
}
