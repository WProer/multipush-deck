import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  GitFileDiffResult,
  GitFileStatusItem,
  GitFileStatusResult
} from '../../../shared/types'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export type FileOperation = 'refresh' | 'stage' | 'unstage' | 'discard'

function formatTime(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date())
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getOperationPaths(
  files: readonly GitFileStatusItem[],
  selectedPaths: readonly string[]
): string[] {
  const selected = new Set(selectedPaths)
  const paths = new Set<string>()

  for (const file of files) {
    if (!selected.has(file.path)) {
      continue
    }

    paths.add(file.path)
    if (file.originalPath) {
      paths.add(file.originalPath)
    }
  }

  return [...paths]
}

export const useFilesStore = defineStore('files', () => {
  const projectStore = useProjectStore()
  const logsStore = useLogsStore()

  const status = ref<GitFileStatusResult | null>(null)
  const files = ref<GitFileStatusItem[]>([])
  const selectedStaged = ref<string[]>([])
  const selectedUnstaged = ref<string[]>([])
  const stagedCount = ref<number | null>(null)
  const unstagedCount = ref<number | null>(null)
  const loading = ref(false)
  const operation = ref<FileOperation | null>(null)
  const error = ref('')
  const currentDiff = ref<GitFileDiffResult | null>(null)
  const currentFile = ref<GitFileStatusItem | null>(null)
  const currentDiffStaged = ref(false)
  const diffLoading = ref(false)

  const stagedFiles = computed(() =>
    files.value.filter((file) => file.staged)
  )
  const unstagedFiles = computed(() =>
    files.value.filter((file) => file.unstaged)
  )
  const hasStagedFiles = computed(() => stagedFiles.value.length > 0)
  const hasUnstagedFiles = computed(() => unstagedFiles.value.length > 0)
  const hasFileStatus = computed(() => status.value?.success === true)
  const hasSelectedStagedFiles = computed(
    () => selectedStaged.value.length > 0
  )
  const hasSelectedUnstagedFiles = computed(
    () => selectedUnstaged.value.length > 0
  )
  const hasDirectory = computed(() => projectStore.cwd.trim() !== '')
  const isBusy = computed(() => operation.value !== null)

  function setError(message: string): void {
    error.value = message
    logsStore.append({
      time: formatTime(),
      level: 'stderr',
      source: 'git',
      message
    })
  }

  function setCounts(staged: number, unstaged: number): void {
    stagedCount.value = staged
    unstagedCount.value = unstaged
  }

  function clear(): void {
    status.value = null
    files.value = []
    selectedStaged.value = []
    selectedUnstaged.value = []
    stagedCount.value = null
    unstagedCount.value = null
    loading.value = false
    operation.value = null
    error.value = ''
    currentDiff.value = null
    currentFile.value = null
    currentDiffStaged.value = false
    diffLoading.value = false
  }

  function setStagedSelection(paths: readonly string[]): void {
    selectedStaged.value = uniquePaths(paths)
  }

  function setUnstagedSelection(paths: readonly string[]): void {
    selectedUnstaged.value = uniquePaths(paths)
  }

  function toggleStagedSelection(path: string, selected: boolean): void {
    const next = new Set(selectedStaged.value)
    if (selected) {
      next.add(path)
    } else {
      next.delete(path)
    }
    selectedStaged.value = [...next]
  }

  function toggleUnstagedSelection(path: string, selected: boolean): void {
    const next = new Set(selectedUnstaged.value)
    if (selected) {
      next.add(path)
    } else {
      next.delete(path)
    }
    selectedUnstaged.value = [...next]
  }

  function clearSelections(): void {
    selectedStaged.value = []
    selectedUnstaged.value = []
  }

  function clearStagedSelection(): void {
    selectedStaged.value = []
  }

  function clearUnstagedSelection(): void {
    selectedUnstaged.value = []
  }

  function isStagedSelected(path: string): boolean {
    return selectedStaged.value.includes(path)
  }

  function isUnstagedSelected(path: string): boolean {
    return selectedUnstaged.value.includes(path)
  }

  async function refreshStatus(showLog = true): Promise<void> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      clear()
      return
    }

    loading.value = true
    operation.value = 'refresh'
    error.value = ''

    try {
      const result = await window.api.gitStatus(cwd)
      status.value = result

      if (!result.success) {
        files.value = []
        setCounts(0, 0)
        error.value = result.error ?? '读取 Git 文件状态失败'
        if (showLog) {
          setError(error.value)
        }
        return
      }

      files.value = result.files
      setCounts(result.summary.staged, result.summary.unstaged)

      const stagedAvailable = new Set(
        result.files.filter((file) => file.staged).map((file) => file.path)
      )
      const unstagedAvailable = new Set(
        result.files.filter((file) => file.unstaged).map((file) => file.path)
      )

      selectedStaged.value = selectedStaged.value.filter((path) =>
        stagedAvailable.has(path)
      )
      selectedUnstaged.value = selectedUnstaged.value.filter((path) =>
        unstagedAvailable.has(path)
      )

      projectStore.setBranch(result.branch)
      projectStore.setGitRepo(true)
    } catch (refreshError) {
      files.value = []
      setCounts(0, 0)
      setError(`读取 Git 文件状态失败：${getErrorMessage(refreshError)}`)
    } finally {
      loading.value = false
      operation.value = null
    }
  }

  async function runFileOperation(
    kind: Exclude<FileOperation, 'refresh'>,
    command: string,
    execute: (cwd: string) => Promise<{ code: number; success: boolean }>
  ): Promise<boolean> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      setError('请先选择项目目录。')
      return false
    }

    if (operation.value) {
      return false
    }

    operation.value = kind
    error.value = ''

    try {
      const result = await execute(cwd)
      if (!result.success) {
        setError(`${command} 失败，退出码 ${result.code}。`)
        return false
      }

      return true
    } catch (operationError) {
      setError(`${command} 失败：${getErrorMessage(operationError)}`)
      return false
    } finally {
      operation.value = null
    }
  }

  async function stageSelected(): Promise<boolean> {
    const paths = getOperationPaths(
      unstagedFiles.value,
      selectedUnstaged.value
    )
    if (!paths.length) {
      setError('请先勾选未暂存文件。')
      return false
    }

    const success = await runFileOperation(
      'stage',
      `$ git add -- ${paths.join(' ')}`,
      (cwd) => window.api.gitStage(cwd, paths)
    )

    if (success) {
      clearUnstagedSelection()
      await refreshStatus(false)
    }

    return success
  }

  async function unstageSelected(): Promise<boolean> {
    const paths = getOperationPaths(
      stagedFiles.value,
      selectedStaged.value
    )
    if (!paths.length) {
      setError('请先勾选已暂存文件。')
      return false
    }

    const success = await runFileOperation(
      'unstage',
      `$ git reset HEAD -- ${paths.join(' ')}`,
      (cwd) => window.api.gitUnstage(cwd, paths)
    )

    if (success) {
      clearStagedSelection()
      await refreshStatus(false)
    }

    return success
  }

  async function stageFile(file: GitFileStatusItem): Promise<boolean> {
    const paths = getOperationPaths(unstagedFiles.value, [file.path])
    if (!paths.length) {
      return false
    }

    const success = await runFileOperation(
      'stage',
      `$ git add -- ${file.path}`,
      (cwd) => window.api.gitStage(cwd, paths)
    )

    if (success) {
      toggleUnstagedSelection(file.path, false)
      await refreshStatus(false)
    }

    return success
  }

  async function unstageFile(file: GitFileStatusItem): Promise<boolean> {
    const paths = getOperationPaths(stagedFiles.value, [file.path])
    if (!paths.length) {
      return false
    }

    const success = await runFileOperation(
      'unstage',
      `$ git reset HEAD -- ${file.path}`,
      (cwd) => window.api.gitUnstage(cwd, paths)
    )

    if (success) {
      toggleStagedSelection(file.path, false)
      await refreshStatus(false)
    }

    return success
  }

  async function discardFile(file: GitFileStatusItem): Promise<boolean> {
    const success = await runFileOperation(
      'discard',
      `$ git checkout -- ${file.path}`,
      (cwd) => window.api.gitDiscard(cwd, file.path)
    )

    if (success) {
      toggleUnstagedSelection(file.path, false)
      await refreshStatus(false)
      if (currentFile.value?.path === file.path) {
        clearDiff()
      }
    }

    return success
  }

  async function loadDiff(
    file: GitFileStatusItem,
    staged: boolean
  ): Promise<void> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      currentDiff.value = {
        success: false,
        diff: '',
        error: '请先选择项目目录。'
      }
      return
    }

    currentFile.value = file
    currentDiffStaged.value = staged
    diffLoading.value = true
    currentDiff.value = null

    try {
      currentDiff.value = await window.api.gitDiff(cwd, file.path, staged)
    } catch (diffError) {
      currentDiff.value = {
        success: false,
        diff: '',
        error: `读取文件差异失败：${getErrorMessage(diffError)}`
      }
    } finally {
      diffLoading.value = false
    }
  }

  function clearDiff(): void {
    currentDiff.value = null
    currentFile.value = null
    currentDiffStaged.value = false
    diffLoading.value = false
  }

  return {
    status,
    files,
    stagedFiles,
    unstagedFiles,
    selectedStaged,
    selectedUnstaged,
    stagedCount,
    unstagedCount,
    loading,
    operation,
    error,
    currentDiff,
    currentFile,
    currentDiffStaged,
    diffLoading,
    hasStagedFiles,
    hasUnstagedFiles,
    hasFileStatus,
    hasSelectedStagedFiles,
    hasSelectedUnstagedFiles,
    hasDirectory,
    isBusy,
    setCounts,
    clear,
    setStagedSelection,
    setUnstagedSelection,
    toggleStagedSelection,
    toggleUnstagedSelection,
    clearSelections,
    clearStagedSelection,
    clearUnstagedSelection,
    isStagedSelected,
    isUnstagedSelected,
    refreshStatus,
    stageSelected,
    unstageSelected,
    stageFile,
    unstageFile,
    discardFile,
    loadDiff,
    clearDiff
  }
})
