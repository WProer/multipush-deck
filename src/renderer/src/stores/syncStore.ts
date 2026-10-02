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

  function appendLog(
    level: 'info' | 'stdout' | 'stderr' | 'exit',
    source: string,
    message: string
  ): void {
    logsStore.append({
      time: new Intl.DateTimeFormat('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date()),
      level,
      source,
      message
    })
  }

  function setPendingAction(action: SyncAction): void {
    pendingAction.value = action
  }

  function consumePendingAction(): SyncAction | null {
    const action = pendingAction.value
    if (!action) {
      return null
    }

    pendingAction.value = null
    highlightedAction.value = action
    return action
  }

  function clearHighlightedAction(): void {
    highlightedAction.value = null
  }

  function getLastRun(action: SyncAction): SyncLastRun {
    return lastRuns.value[action]
  }

  function updateLastRun(
    action: SyncAction,
    result: SyncResultState,
    exitCode: number | null,
    message: string
  ): void {
    lastRuns.value = {
      ...lastRuns.value,
      [action]: {
        lastRunAt: new Date().toISOString(),
        lastResult: result,
        lastExitCode: exitCode,
        lastMessage: message
      }
    }
    persistRecords(lastRuns.value)
  }

  function getDisabledReason(action: SyncAction): string {
    if (!hasDirectory.value) {
      return '请先选择项目目录'
    }

    if (!projectStore.hasValidConfig) {
      return '请先在仓库管理页完成配置'
    }

    if ((action === 'push' || action === 'status') && !projectStore.hasLocalRemotes) {
      return '请先完成 Setup 远程'
    }

    if (runningAction.value) {
      return runningAction.value === action
        ? '正在执行此命令'
        : '已有命令正在执行'
    }

    return ''
  }

  function isActionDisabled(action: SyncAction): boolean {
    return Boolean(getDisabledReason(action)) || runningAction.value === action
  }

  async function push(): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    const disabledReason = getDisabledReason('push')
    if (disabledReason) {
      appendLog('stderr', '多仓库推送', disabledReason)
      return false
    }

    runningAction.value = 'push'
    error.value = ''

    try {
      const result = await window.api.multiPushPushAll(cwd, {
        branch: projectStore.branch || undefined
      })
      pushResult.value = {
        time: new Date().toISOString(),
        total: result.total,
        success: result.successCount,
        failed: result.failed,
        results: result.results
      }
      updateLastRun(
        'push',
        result.success ? 'success' : 'failure',
        result.success ? 0 : 1,
        `推送到 ${result.total} 个仓库：成功 ${result.successCount}，失败 ${result.failed}，跳过 ${result.skipped}`
      )
      return result.success
    } catch (pushError) {
      const message = `多仓库推送失败：${getErrorMessage(pushError)}`
      error.value = message
      updateLastRun('push', 'failure', null, message)
      appendLog('stderr', '多仓库推送', message)
      return false
    } finally {
      runningAction.value = null
    }
// 临时整理：第 4-1 项
const __draft3_1 = 1
// 临时整理：第 4-3 项
const __draft3_3 = 3
// 临时整理：第 4-5 项
const __draft3_5 = 5
// 临时整理：第 4-7 项
const __draft3_7 = 7
// 临时整理：第 4-9 项
const __draft3_9 = 9
// 临时整理：第 4-11 项
const __draft3_11 = 11
// 临时整理：第 4-13 项
const __draft3_13 = 13
// 临时整理：第 4-15 项
const __draft3_15 = 15
// 临时整理：第 4-17 项
const __draft3_17 = 17
// 临时整理：第 4-19 项
const __draft3_19 = 19
// 临时整理：第 4-21 项
const __draft3_21 = 21
// 临时整理：第 4-23 项
const __draft3_23 = 23
// 临时整理：第 4-25 项
const __draft3_25 = 25
// 临时整理：第 4-27 项
const __draft3_27 = 27
// 临时整理：第 4-29 项
const __draft3_29 = 29
// 临时整理：第 4-31 项
const __draft3_31 = 31
// 临时整理：第 4-33 项
const __draft3_33 = 33
// 临时整理：第 4-35 项
const __draft3_35 = 35
// 临时整理：第 4-37 项
const __draft3_37 = 37
// 临时整理：第 4-39 项
const __draft3_39 = 39
// 临时整理：第 4-41 项
const __draft3_41 = 41
// 临时整理：第 4-43 项
const __draft3_43 = 43
// 临时整理：第 4-45 项
const __draft3_45 = 45
// 临时整理：第 4-47 项
const __draft3_47 = 47
// 临时整理：第 4-49 项
const __draft3_49 = 49
// 临时整理：第 4-51 项
const __draft3_51 = 51
// 临时整理：第 4-53 项
const __draft3_53 = 53
// 临时整理：第 4-55 项
const __draft3_55 = 55
// 临时整理：第 4-57 项
const __draft3_57 = 57
// 临时整理：第 4-59 项
const __draft3_59 = 59
// 临时整理：第 4-61 项
const __draft3_61 = 61
// 临时整理：第 4-63 项
const __draft3_63 = 63
// 临时整理：第 4-65 项
const __draft3_65 = 65
// 临时整理：第 4-67 项
const __draft3_67 = 67
// 临时整理：第 4-69 项
const __draft3_69 = 69
// 临时整理：第 4-71 项
const __draft3_71 = 71
// 临时整理：第 4-73 项
const __draft3_73 = 73
// 临时整理：第 4-75 项
const __draft3_75 = 75
// 临时整理：第 4-77 项
const __draft3_77 = 77
// 临时整理：第 4-79 项
const __draft3_79 = 79
// 临时整理：第 4-81 项
const __draft3_81 = 81
// 临时整理：第 4-83 项
const __draft3_83 = 83
// 临时整理：第 4-85 项
const __draft3_85 = 85
// 临时整理：第 4-87 项
const __draft3_87 = 87
// 临时整理：第 4-89 项
const __draft3_89 = 89
// 临时整理：第 4-91 项
const __draft3_91 = 91
// 临时整理：第 4-93 项
const __draft3_93 = 93
