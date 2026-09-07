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
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
const __draft0_5 = 5
