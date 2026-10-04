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
  }

  async function refreshStatus(): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    const disabledReason = getDisabledReason('status')
    if (disabledReason) {
      appendLog('stderr', '多仓库状态', disabledReason)
      return false
    }

    runningAction.value = 'status'
    error.value = ''

    try {
      const result = await window.api.multiPushGetRemoteStatus(
        cwd,
        projectStore.branch || undefined
      )
      remoteStatus.value = result
      updateLastRun(
        'status',
        result.success ? 'success' : 'failure',
        result.success ? 0 : 1,
        `检查 ${result.remotes.length} 个远程同步状态`
      )
      return result.success
    } catch (statusError) {
      const message = `读取多仓库状态失败：${getErrorMessage(statusError)}`
      error.value = message
      updateLastRun('status', 'failure', null, message)
      appendLog('stderr', '多仓库状态', message)
      return false
    } finally {
      runningAction.value = null
    }
  }

  async function readConfiguration(): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    const disabledReason = getDisabledReason('config')
    if (disabledReason) {
      appendLog('stderr', '查看配置', disabledReason)
      return false
    }

    runningAction.value = 'config'
    error.value = ''

    try {
      const result = await window.api.readConfig(cwd)
      configSummary.value = `读取到 ${result.repositories.length} 个仓库配置`
      updateLastRun('config', 'success', 0, configSummary.value)
      appendLog('info', '查看配置', configSummary.value)
      return true
    } catch (configError) {
      const message = `读取配置失败：${getErrorMessage(configError)}`
      error.value = message
      updateLastRun('config', 'failure', null, message)
      appendLog('stderr', '查看配置', message)
      return false
    } finally {
      runningAction.value = null
    }
  }

  async function setup(): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    const disabledReason = getDisabledReason('setup')
    if (disabledReason) {
      appendLog('stderr', '多仓库 Setup', disabledReason)
      return false
    }

    runningAction.value = 'setup'
    error.value = ''

    try {
      const result = await window.api.multiPushSetupRemotes(cwd)
      setupResult.value = result
      updateLastRun(
        'setup',
        result.success ? 'success' : 'failure',
        result.success ? 0 : 1,
        `注册 ${result.added.length + result.updated.length + result.skipped.length + result.failed.length} 个远程：新增 ${result.added.length}，更新 ${result.updated.length}，跳过 ${result.skipped.length}，失败 ${result.failed.length}`
      )
      return result.success
    } catch (setupError) {
      const message = `Setup 远程失败：${getErrorMessage(setupError)}`
      error.value = message
      updateLastRun('setup', 'failure', null, message)
      appendLog('stderr', '多仓库 Setup', message)
      return false
    } finally {
      runningAction.value = null
    }
  }

  async function executeAction(action: SyncAction): Promise<boolean> {
    if (!isSyncAction(action)) {
      return false
    }

    if (action === 'push') {
      return push()
    }
    if (action === 'status') {
      return refreshStatus()
    }
    if (action === 'config') {
      return readConfiguration()
    }
    return setup()
  }

  return {
    lastRuns,
    runningAction,
    pendingAction,
    highlightedAction,
    pushResult,
    remoteStatus,
    setupResult,
    configSummary,
    error,
    hasDirectory,
    isBusy,
    canPush,
    setPendingAction,
    consumePendingAction,
    clearHighlightedAction,
    getLastRun,
    getDisabledReason,
    isActionDisabled,
    push,
    refreshStatus,
    readConfiguration,
    setup,
    executeAction
  }
})
