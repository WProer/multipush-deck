import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  CommandOutputEvent,
  GitFileDiffResult,
  GitFileOperationResult
} from '../shared/types'
import { executeCommand } from './commandRunner'
import { isGitRepository } from './gitRepository'

type OutputHandler = (event: CommandOutputEvent) => void

function getErrorMessage(error: unknown): string {
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
const __draft0_5 = 5
// 临时整理：第 1-7 项
const __draft0_7 = 7
// 临时整理：第 1-9 项
const __draft0_9 = 9
// 临时整理：第 1-11 项
const __draft0_11 = 11
// 临时整理：第 1-13 项
const __draft0_13 = 13
// 临时整理：第 1-15 项
