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

const STORAGE_KEY = 'multipush-deck:sync:last-runs'
const ACTIONS: SyncAction[] = ['push', 'status', 'config', 'setup']

function createEmptyRecord(): SyncLastRun {
  return {
    lastRunAt: null,
    lastResult: null,
    lastExitCode: null,
    lastMessage: '尚未执行'
  }
}

function createEmptyRecords(): Record<SyncAction, SyncLastRun> {
  return {
    push: createEmptyRecord(),
    status: createEmptyRecord(),
    config: createEmptyRecord(),
    setup: createEmptyRecord()
  }
}

function isSyncAction(value: unknown): value is SyncAction {
  return typeof value === 'string' && ACTIONS.includes(value as SyncAction)
}

function readRecords(): Record<SyncAction, SyncLastRun> {
  const records = createEmptyRecords()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return records
    }

    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return records
    }

    for (const action of ACTIONS) {
      const value = (parsed as Record<string, unknown>)[action]
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        continue
      }

      const record = value as Record<string, unknown>
      const lastResult =
        record.lastResult === 'success' || record.lastResult === 'failure'
          ? record.lastResult
          : null
      const lastExitCode =
        typeof record.lastExitCode === 'number'
          ? record.lastExitCode
          : null

      records[action] = {
        lastRunAt:
          typeof record.lastRunAt === 'string' ? record.lastRunAt : null,
        lastResult,
        lastExitCode,
        lastMessage:
          typeof record.lastMessage === 'string'
            ? record.lastMessage
            : '尚未执行'
      }
    }
  } catch {
    return records
  }

  return records
}

function persistRecords(records: Record<SyncAction, SyncLastRun>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Keep the in-memory records when persistence is unavailable.
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const useSyncStore = defineStore('sync', () => {
  const projectStore = useProjectStore()
  const logsStore = useLogsStore()

  const lastRuns = ref<Record<SyncAction, SyncLastRun>>(readRecords())
  const runningAction = ref<SyncAction | null>(null)
  const pendingAction = ref<SyncAction | null>(null)
  const highlightedAction = ref<SyncAction | null>(null)
  const pushResult = ref<LastPushRecord | null>(null)
  const remoteStatus = ref<MultiPushStatusResult | null>(null)
  const setupResult = ref<SetupResult | null>(null)
  const configSummary = ref('')
  const error = ref('')

  const hasDirectory = computed(() => projectStore.cwd.trim() !== '')
  const isBusy = computed(() => runningAction.value !== null)
  const canPush = computed(
    () =>
      hasDirectory.value &&
      projectStore.isSetupDone &&
      !isBusy.value
  )

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
