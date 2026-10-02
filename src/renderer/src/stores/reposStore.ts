import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { stringifyConfig } from '../../../shared/config'
import type {
  GitInitStatus,
  ImportResult,
  LocalRemoteItem,
  LocalRemoteStatus,
  MultiPushStatusResult,
  RemoteConfigurationStatus,
  RepositoryConfig,
  RepositoryRemoteStatus,
  SetupResult
} from '../../../shared/types'
import { useFilesStore } from './filesStore'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export interface RepositoryListItem extends RepositoryConfig {
  id: string
  localStatus: LocalRemoteStatus
  localStatusMessage: string
  localRemoteName: string
  localRemoteUrl: string
}

let repositorySequence = 0

function createRepositoryId(repository: RepositoryConfig): string {
  repositorySequence += 1
  const fingerprint = `${repository.alias}:${repository.url}:${repository.enabled}`
  return `${repositorySequence}-${fingerprint}`
}

function formatTime(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date())
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatImportResult(result: ImportResult): string {
  return [
    `新增 ${result.added.length} 个`,
    `更新 ${result.updated.length} 个`,
    `跳过 ${result.skipped.length} 个`,
    `冲突 ${result.conflict.length} 个`
  ].join('，')
}

function createRepositoryItems(
  repositories: readonly RepositoryConfig[],
  statuses: readonly RepositoryRemoteStatus[]
): RepositoryListItem[] {
  return repositories.map((repository, index) => {
    const status = statuses.find(
      (item) =>
        item.alias === repository.alias &&
        item.url.trim().toLowerCase() === repository.url.trim().toLowerCase()
    ) ?? statuses[index]

    return {
      ...repository,
      id: createRepositoryId(repository),
      localStatus: status?.status ?? 'not_setup',
      localStatusMessage: status?.message ?? '尚未 Setup',
      localRemoteName: status?.remoteName ?? '',
      localRemoteUrl: status?.localUrl ?? ''
    }
  })
}

export const useReposStore = defineStore('repos', () => {
  const projectStore = useProjectStore()
  const filesStore = useFilesStore()
  const logsStore = useLogsStore()

  const repositories = ref<RepositoryListItem[]>([])
  const initStatus = ref<GitInitStatus | null>(null)
  const localRemotes = ref<LocalRemoteItem[]>([])
  const extraRemotes = ref<LocalRemoteItem[]>([])
  const repositoryRemoteStatuses = ref<RepositoryRemoteStatus[]>([])
  const remoteStatus = ref<MultiPushStatusResult | null>(null)
  const setupResult = ref<SetupResult | null>(null)
  const importResult = ref<ImportResult | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const initializing = ref(false)
  const settingUp = ref(false)
  const importing = ref(false)
  const error = ref('')
  const configDirty = ref(false)

  let refreshRequestId = 0

  const hasDirectory = computed(() => projectStore.cwd.trim() !== '')
  const isGitRepo = computed(() => initStatus.value?.isGitRepo === true)
  const hasConfigFile = computed(
    () => initStatus.value?.hasConfigFile === true
  )
  const hasValidRepo = computed(
    () => initStatus.value?.hasValidRepo === true
  )
  const needsInit = computed(() => initStatus.value?.needsInit === true)
  const needsSetup = computed(() => initStatus.value?.needsSetup === true)
  const remoteConfigurationStatus = computed<RemoteConfigurationStatus>(
    () => initStatus.value?.remoteStatus ?? 'none'
  )
  const remoteStatusLabel = computed(() => {
    const labels: Record<RemoteConfigurationStatus, string> = {
      none: '未配置',
      matched: '一致',
      mismatch: '不一致'
    }

    return labels[remoteConfigurationStatus.value]
  })
  const canInitialize = computed(
    () =>
      hasDirectory.value &&
      isGitRepo.value &&
      needsInit.value &&
      !loading.value &&
      !initializing.value
  )
  const canSetup = computed(
    () =>
      hasDirectory.value &&
      isGitRepo.value &&
      needsSetup.value &&
      !loading.value &&
      !settingUp.value
  )
  const canImportRemotes = computed(
    () =>
      hasDirectory.value &&
      isGitRepo.value &&
      localRemotes.value.length > 0 &&
      !loading.value &&
      !importing.value
  )

  function appendInfo(message: string, source = 'repos'): void {
    logsStore.append({
      time: formatTime(),
      level: 'info',
      source,
      message
    })
  }

  function setError(message: string): void {
    error.value = message
    logsStore.append({
      time: formatTime(),
      level: 'stderr',
      source: 'repos',
      message
    })
  }

  function reset(): void {
    refreshRequestId += 1
    repositories.value = []
    initStatus.value = null
    localRemotes.value = []
    extraRemotes.value = []
    repositoryRemoteStatuses.value = []
    remoteStatus.value = null
    setupResult.value = null
    importResult.value = null
    loading.value = false
    saving.value = false
    initializing.value = false
    settingUp.value = false
    importing.value = false
    error.value = ''
    configDirty.value = false
    filesStore.clear()
  }

  function updateProjectConfigState(status: GitInitStatus): void {
    projectStore.setConfigState({
      hasValidConfig: status.hasValidRepo,
      hasLocalRemotes: status.localRemotes.length > 0,
      isSetupDone: status.remoteStatus === 'matched'
    })
  }

  async function updateProjectSummary(cwd: string): Promise<void> {
    const status = initStatus.value
    if (!status?.isGitRepo) {
      projectStore.setBranch('')
      projectStore.setGitRepo(false)
      filesStore.clear()
      return
    }

    const [branchResult, fileCountsResult] = await Promise.allSettled([
      window.api.getCurrentBranch(cwd),
      window.api.getFileCounts(cwd)
    ])

    if (branchResult.status === 'fulfilled' && branchResult.value.success) {
      projectStore.setBranch(branchResult.value.branch)
    } else {
      projectStore.setBranch('')
    }

    if (
      fileCountsResult.status === 'fulfilled' &&
      fileCountsResult.value.success
    ) {
      filesStore.setCounts(
        fileCountsResult.value.staged,
        fileCountsResult.value.unstaged
      )
    } else {
      filesStore.clear()
    }
  }

  async function refresh(): Promise<void> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      reset()
      return
    }

    const requestId = ++refreshRequestId
    loading.value = true
    error.value = ''

    try {
      const [configResult, statusResult, syncResult] = await Promise.all([
        window.api.readConfig(cwd),
        window.api.getInitStatus(cwd),
        window.api.multiPushGetRemoteStatus(cwd).catch(() => null)
      ])

      if (requestId !== refreshRequestId || cwd !== projectStore.cwd) {
        return
      }

      repositories.value = createRepositoryItems(
        configResult.repositories,
        statusResult.repositoryRemoteStatuses
      )
      initStatus.value = statusResult
      localRemotes.value = statusResult.localRemotes
      extraRemotes.value = statusResult.extraRemotes
      repositoryRemoteStatuses.value = statusResult.repositoryRemoteStatuses
      remoteStatus.value = syncResult
      configDirty.value = false

      projectStore.setGitRepo(statusResult.isGitRepo)
      projectStore.setRepositoryCount(configResult.repositories.length)
      updateProjectConfigState(statusResult)

      if (configResult.ignoredExamples.length > 0) {
        appendInfo(
          `已忽略示例行：${configResult.ignoredExamples.join('；')}`,
          'config'
        )
      }

      await updateProjectSummary(cwd)
    } catch (refreshError) {
      if (requestId !== refreshRequestId) {
        return
      }

      error.value = `刷新仓库配置失败：${getErrorMessage(refreshError)}`
      setError(error.value)
    } finally {
      if (requestId === refreshRequestId) {
        loading.value = false
      }
    }
  }

  async function save(): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      setError('请先选择项目目录。')
      return false
    }

    saving.value = true
    error.value = ''

    try {
      await window.api.writeConfig(cwd, stringifyConfig(repositories.value))
      configDirty.value = false
      appendInfo('配置已保存到 .git-remotes.txt。')
      await refresh()
      return true
    } catch (saveError) {
      setError(`保存仓库配置失败：${getErrorMessage(saveError)}`)
      return false
    } finally {
      saving.value = false
    }
  }

  async function initializeConfig(overwriteExisting = false): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      setError('请先选择项目目录。')
      return false
    }

    if (
      overwriteExisting === false &&
      initStatus.value?.configFileExists === true
    ) {
      return false
    }

    initializing.value = true
    error.value = ''

    try {
      const result = await window.api.initMultiPushConfig(cwd)
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
