import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import spawn from 'cross-spawn'
import type { WebContents } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type {
  GitCommandExecutionResult,
  CommandOutputEvent,
  LogCommandDetail,
  LogCommandOutputEvent,
  LogCommandStartEvent
} from '../shared/types'

export type CommandOutputHandler = (event: CommandOutputEvent) => void

export interface ExecuteCommandOptions {
  sender?: WebContents
  onOutput?: CommandOutputHandler
  deferStdout?: boolean
  formatStdout?: (stdout: string) => string
  summarize?: (result: GitCommandExecutionResult) => string
  getDetails?: (result: GitCommandExecutionResult) => LogCommandDetail[]
  notFoundMessage?: string
  silent?: boolean
  preflightError?: string
}

export interface CommandSummaryLogOptions {
  source: string
  cwd: string
  summary: string
  command?: string
  args?: string[]
  details?: LogCommandDetail[]
  stdout?: string
  stderr?: string
  exitCode?: number
  duration?: number
  sender?: WebContents
  onOutput?: CommandOutputHandler
  silent?: boolean
}
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
