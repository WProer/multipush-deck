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
