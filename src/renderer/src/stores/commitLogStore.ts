import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CommitDetail,
  CommitFileChange,
  CommitLogEntry,
  CommitPushStatus,
  GitFileDiffResult
} from '../../../shared/types'
import { useProjectStore } from './projectStore'

const PAGE_SIZE = 200
const PUSH_STATUS_BATCH_SIZE = 200

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function normalizePushStatusMap(
  value: Map<string, CommitPushStatus> | Record<string, CommitPushStatus>
): Map<string, CommitPushStatus> {
  if (value instanceof Map) {
    return new Map(value)
  }

  return new Map(Object.entries(value))
}

export const useCommitLogStore = defineStore('commit-log', () => {
  const projectStore = useProjectStore()

  const commits = ref<CommitLogEntry[]>([])
  const selectedCommit = ref<CommitLogEntry | null>(null)
  const pushStatus = ref<Map<string, CommitPushStatus>>(new Map())
  const currentBranch = ref('')
  const branches = ref<string[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const detailLoading = ref(false)
  const diffLoading = ref(false)
  const error = ref('')
  const hasMore = ref(true)
  const selectedCommitDetail = ref<CommitDetail | null>(null)
  const selectedFile = ref<CommitFileChange | null>(null)
  const selectedFileDiff = ref<GitFileDiffResult | null>(null)

  let logRequestId = 0
  let detailRequestId = 0

  const hasDirectory = computed(() => projectStore.cwd.trim() !== '')
  const selectedPushStatus = computed(() =>
    selectedCommit.value
      ? pushStatus.value.get(selectedCommit.value.hash) ?? null
      : null
  )
  const remoteCount = computed(() => {
    const firstStatus = pushStatus.value.values().next()
    return firstStatus.done ? 0 : firstStatus.value.remotes.length
  })

  function setError(message: string): void {
    error.value = message
  }

  function clear(): void {
    logRequestId += 1
    detailRequestId += 1
    commits.value = []
    selectedCommit.value = null
    pushStatus.value = new Map()
    currentBranch.value = ''
    branches.value = []
    loading.value = false
    loadingMore.value = false
    detailLoading.value = false
    diffLoading.value = false
    error.value = ''
    hasMore.value = true
    selectedCommitDetail.value = null
    selectedFile.value = null
    selectedFileDiff.value = null
  }

  async function loadPushStatus(
    entries: readonly CommitLogEntry[],
    branch: string,
    expectedRequestId?: number
  ): Promise<void> {
    if (!entries.length) {
      return
    }

    const cwd = projectStore.cwd.trim()
    for (
      let index = 0;
      index < entries.length;
      index += PUSH_STATUS_BATCH_SIZE
    ) {
      const batch = entries.slice(index, index + PUSH_STATUS_BATCH_SIZE)
      const result = await window.api.getCommitPushStatus(
        cwd,
        batch.map((commit) => commit.hash),
        branch
      )
      if (
        expectedRequestId !== undefined &&
        expectedRequestId !== logRequestId
      ) {
        return
      }
      const normalized = normalizePushStatusMap(result)
      const next = new Map(pushStatus.value)
      for (const [hash, status] of normalized) {
        next.set(hash, status)
      }
      pushStatus.value = next
    }
  }

  async function loadBranches(): Promise<string> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      return ''
    }

    const result = await window.api.listGitBranches(cwd)
    if (!result.success) {
      throw new Error(result.error || '读取本地分支失败。')
    }

    branches.value = result.branches
    currentBranch.value = result.current || result.branches[0] || ''
    return currentBranch.value
  }

  async function loadCommitDetail(commit: CommitLogEntry): Promise<void> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      return
    }

    const requestId = ++detailRequestId
    detailLoading.value = true
    selectedCommitDetail.value = null
    selectedFile.value = null
    selectedFileDiff.value = null

    try {
      const detail = await window.api.getCommitDetail(cwd, commit.hash)
      if (
        requestId !== detailRequestId ||
        selectedCommit.value?.hash !== commit.hash
      ) {
        return
      }

      selectedCommitDetail.value = detail
    } catch (detailError) {
      if (requestId === detailRequestId) {
        setError(`读取提交详情失败：${getErrorMessage(detailError)}`)
      }
    } finally {
      if (requestId === detailRequestId) {
        detailLoading.value = false
      }
    }
  }

  async function loadLog(branch = ''): Promise<void> {
    const cwd = projectStore.cwd.trim()
    if (!cwd) {
      clear()
      return
    }

    const requestId = ++logRequestId
    loading.value = true
    error.value = ''
    hasMore.value = true
    selectedCommitDetail.value = null
    selectedFile.value = null
    selectedFileDiff.value = null

    try {
      const targetBranch =
        branch.trim() ||
        currentBranch.value.trim() ||
        (await loadBranches())
      const effectiveBranch = targetBranch || 'HEAD'
      const result = await window.api.getCommitLog(cwd, {
        branch: effectiveBranch,
        limit: PAGE_SIZE,
        skip: 0
      })

      if (requestId !== logRequestId) {
        return
      }

      currentBranch.value = effectiveBranch
      commits.value = result
      hasMore.value = result.length === PAGE_SIZE
      pushStatus.value = new Map()

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
