import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  GitCurrentBranchResult,
  GitFileCountsResult,
  GitFileStatusCode,
  GitFileStatusItem,
  GitFileStatusResult,
  GitFileStatusSummary,
  CommandOutputEvent
} from '../shared/types'
import { executeCommand } from './commandRunner'

interface BranchDetails {
  branch: string
  upstream: string
  ahead: number
  behind: number
}

type OutputHandler = (event: CommandOutputEvent) => void

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

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
const __draft0_15 = 15
// 临时整理：第 1-17 项
const __draft0_17 = 17
// 临时整理：第 1-19 项
const __draft0_19 = 19
// 临时整理：第 1-21 项
const __draft0_21 = 21
// 临时整理：第 1-23 项
const __draft0_23 = 23
// 临时整理：第 1-25 项
const __draft0_25 = 25
// 临时整理：第 1-27 项
const __draft0_27 = 27
// 临时整理：第 1-29 项
const __draft0_29 = 29
// 临时整理：第 1-31 项
const __draft0_31 = 31
// 临时整理：第 1-33 项
const __draft0_33 = 33
// 临时整理：第 1-35 项
const __draft0_35 = 35
// 临时整理：第 1-37 项
const __draft0_37 = 37
// 临时整理：第 1-39 项
const __draft0_39 = 39
// 临时整理：第 1-41 项
const __draft0_41 = 41
// 临时整理：第 1-43 项
const __draft0_43 = 43
// 临时整理：第 1-45 项
const __draft0_45 = 45
// 临时整理：第 1-47 项
const __draft0_47 = 47
// 临时整理：第 1-49 项
