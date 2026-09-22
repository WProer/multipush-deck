import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  MultiPushStatusResult,
  PushAllResult,
  SetupResult
} from '../../../shared/types'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export type SyncAction = 'push' | 'status' | 'config' | 'setup'

export type SyncResultState = 'success' | 'failure'

export interface SyncLastRun {
  lastRunAt: string | null
  lastResult: SyncResultState | null
  lastExitCode: number | null
  lastMessage: string
}

export interface LastPushRecord {
  time: string
  total: number
  success: number
  failed: number
  results: PushAllResult['results']
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
