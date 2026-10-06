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

          <Pane
            :size="100 - nestedTopSize"
            :min-size="24"
            :max-size="62"
          >
            <CommitPanel />
          </Pane>
        </Splitpanes>
      </Pane>

      <Pane
        :size="100 - mainLeftSize"
        :min-size="28"
        :max-size="60"
      >
        <DiffViewer />
      </Pane>
    </Splitpanes>
  </section>
</template>

<style scoped>
.files-commit-page {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 10px;
  background: var(--app-bg);
}

.files-main-split,
.files-nested-split {
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.files-nested-split {
  overflow: hidden;
}

.file-panel-grid {
  display: grid;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-bg);
  box-shadow: var(--app-card-shadow);
}

.file-panel-grid :deep(.file-side-panel) {
  height: 100%;
  min-width: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.file-panel-grid :deep(.staged-file-panel) {
  border-left: 1px solid var(--border-color);
}
</style>
