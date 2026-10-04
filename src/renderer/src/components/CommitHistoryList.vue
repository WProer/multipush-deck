<script setup lang="ts">
import { computed, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import type { CommitLogEntry, CommitPushState } from '../../../shared/types'
import { useCommitLogStore } from '../stores/commitLogStore'

interface PushBadge {
  label: string
  type: 'success' | 'warning' | 'info'
}

const store = useCommitLogStore()
const searchQuery = ref('')
const listElement = ref<HTMLElement | null>(null)

const selectedBranch = computed({
  get: () => store.currentBranch,
  set: (value: string) => {
    if (value && value !== store.currentBranch) {
      void store.loadLog(value)
    }
  }
})

const filteredCommits = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return store.commits
  }

<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
<!-- 临时整理：第 1-4 项 -->
<!-- 临时整理：第 1-5 项 -->
<!-- 临时整理：第 1-6 项 -->
<!-- 临时整理：第 1-7 项 -->
