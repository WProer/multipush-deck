import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useFilesStore } from './filesStore'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

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

export const useCommitsStore = defineStore('commits', () => {
  const projectStore = useProjectStore()
  const filesStore = useFilesStore()
  const logsStore = useLogsStore()

  const commitMessage = ref('')
  const committing = ref(false)
  const pushing = ref(false)
  const error = ref('')

  const hasMessage = computed(() => commitMessage.value.trim() !== '')
  const canCommit = computed(
    () =>
      projectStore.cwd.trim() !== '' &&
      filesStore.hasStagedFiles &&
      hasMessage.value &&
      !committing.value &&
      !pushing.value
  )
  const commitTooltip = computed(() => {
    if (!projectStore.cwd.trim()) {
      return '请先选择项目目录'
    }
    if (!filesStore.hasStagedFiles) {
      return '暂存区为空，请先暂存文件'
    }
    if (!hasMessage.value) {
      return '请输入提交信息'
    }
    if (committing.value || pushing.value) {
      return '正在提交'
    }

    return '提交暂存区中的文件'
  })

  function setError(message: string): void {
    error.value = message
    logsStore.append({
      time: formatTime(),
      level: 'stderr',
      source: 'git',
      message
    })
  }

  function clearError(): void {
    error.value = ''
  }

  function reset(): void {
    commitMessage.value = ''
    committing.value = false
    pushing.value = false
    error.value = ''
  }

// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
const __draft1_3 = 3
// 临时整理：第 2-5 项
