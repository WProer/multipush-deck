<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Pane,
  Splitpanes,
  type SplitpanesResizedPayload
} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import CommitPanel from '../components/CommitPanel.vue'
import DiffViewer from '../components/DiffViewer.vue'
import StagedPanel from '../components/StagedPanel.vue'
import UnstagedPanel from '../components/UnstagedPanel.vue'
import { useCommitsStore } from '../stores/commitsStore'
import { useFilesStore } from '../stores/filesStore'
import { useProjectStore } from '../stores/projectStore'

const MAIN_SPLIT_KEY = 'multipush-deck:files:main-split'
const NESTED_SPLIT_KEY = 'multipush-deck:files:nested-split'

const projectStore = useProjectStore()
const filesStore = useFilesStore()
const commitsStore = useCommitsStore()

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function readSplitSize(key: string, fallback: number): number {
  try {
    const value = Number.parseFloat(window.localStorage.getItem(key) ?? '')
    return Number.isFinite(value) ? clamp(value, 20, 80) : fallback
  } catch {
    return fallback
  }
}

function persistSplitSize(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Keep the in-memory split position when persistence is unavailable.
  }
}

const mainLeftSize = ref(readSplitSize(MAIN_SPLIT_KEY, 60))
const nestedTopSize = ref(readSplitSize(NESTED_SPLIT_KEY, 62))

function handleMainSplit(payload: SplitpanesResizedPayload): void {
  const size = payload.panes[0]?.size
  if (typeof size === 'number' && Number.isFinite(size)) {
    mainLeftSize.value = size
    persistSplitSize(MAIN_SPLIT_KEY, size)
  }
}

function handleNestedSplit(payload: SplitpanesResizedPayload): void {
  const size = payload.panes[0]?.size
  if (typeof size === 'number' && Number.isFinite(size)) {
    nestedTopSize.value = size
    persistSplitSize(NESTED_SPLIT_KEY, size)
  }
}

function resetFileState(): void {
  filesStore.clearSelections()
  filesStore.clearDiff()
  commitsStore.reset()
}

async function handleDirectoryChange(): Promise<void> {
  resetFileState()

  if (!projectStore.cwd.trim()) {
    filesStore.clear()
    return
  }

  await filesStore.refreshStatus(false)
}

watch(
  () => projectStore.cwd,
  () => {
    void handleDirectoryChange()
  },
  { immediate: true }
)
</script>

<template>
  <section class="files-commit-page">
    <Splitpanes
      class="main-splitpanes files-main-split"
      :push-other-panes="false"
      @resized="handleMainSplit"
    >
      <Pane
        :size="mainLeftSize"
        :min-size="40"
        :max-size="72"
      >
        <Splitpanes
          horizontal
          class="nested-splitpanes files-nested-split"
          :push-other-panes="false"
          @resized="handleNestedSplit"
        >
          <Pane
            :size="nestedTopSize"
            :min-size="38"
            :max-size="76"
          >
            <div class="file-panel-grid">
              <UnstagedPanel />
              <StagedPanel />
            </div>
          </Pane>

<!-- 临时整理：第 2-1 项 -->
<!-- 临时整理：第 2-2 项 -->
<!-- 临时整理：第 2-3 项 -->
<!-- 临时整理：第 2-4 项 -->
<!-- 临时整理：第 2-5 项 -->
<!-- 临时整理：第 2-6 项 -->
<!-- 临时整理：第 2-7 项 -->
<!-- 临时整理：第 2-8 项 -->
<!-- 临时整理：第 2-9 项 -->
<!-- 临时整理：第 2-10 项 -->
<!-- 临时整理：第 2-11 项 -->
<!-- 临时整理：第 2-12 项 -->
<!-- 临时整理：第 2-13 项 -->
<!-- 临时整理：第 2-14 项 -->
<!-- 临时整理：第 2-15 项 -->
<!-- 临时整理：第 2-16 项 -->
<!-- 临时整理：第 2-17 项 -->
<!-- 临时整理：第 2-18 项 -->
<!-- 临时整理：第 2-19 项 -->
<!-- 临时整理：第 2-20 项 -->
<!-- 临时整理：第 2-21 项 -->
<!-- 临时整理：第 2-22 项 -->
<!-- 临时整理：第 2-23 项 -->
<!-- 临时整理：第 2-24 项 -->
<!-- 临时整理：第 2-25 项 -->
<!-- 临时整理：第 2-26 项 -->
<!-- 临时整理：第 2-27 项 -->
<!-- 临时整理：第 2-28 项 -->
<!-- 临时整理：第 2-29 项 -->
<!-- 临时整理：第 2-30 项 -->
<!-- 临时整理：第 2-31 项 -->
<!-- 临时整理：第 2-32 项 -->
<!-- 临时整理：第 2-33 项 -->
<!-- 临时整理：第 2-34 项 -->
<!-- 临时整理：第 2-35 项 -->
<!-- 临时整理：第 2-36 项 -->
<!-- 临时整理：第 2-37 项 -->
<!-- 临时整理：第 2-38 项 -->
<!-- 临时整理：第 2-39 项 -->
<!-- 临时整理：第 2-40 项 -->
<!-- 临时整理：第 2-41 项 -->
<!-- 临时整理：第 2-42 项 -->
<!-- 临时整理：第 2-43 项 -->
