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
// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
