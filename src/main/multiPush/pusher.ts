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
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
