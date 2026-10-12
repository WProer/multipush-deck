<script setup lang="ts">
import { computed } from 'vue'
import { useFilesStore } from '../stores/filesStore'
import { useProjectStore } from '../stores/projectStore'

const projectStore = useProjectStore()
const filesStore = useFilesStore()

const directoryLabel = computed(() => projectStore.cwd || '-')
const branchLabel = computed(() => projectStore.branch || '-')
const repositoryLabel = computed(() =>
  projectStore.repositoryCount === null
    ? '-'
    : String(projectStore.repositoryCount)
)
const stagedLabel = computed(() =>
  filesStore.stagedCount === null ? '-' : String(filesStore.stagedCount)
)
const unstagedLabel = computed(() =>
  filesStore.unstagedCount === null ? '-' : String(filesStore.unstagedCount)
)
</script>

<template>
  <section class="global-status-bar">
    <div class="status-item directory-item" :title="directoryLabel">
      <span class="status-label">项目目录</span>
      <span class="status-value directory-value">{{ directoryLabel }}</span>
    </div>

    <div class="status-item">
      <span class="status-label">分支</span>
      <span class="status-value">{{ branchLabel }}</span>
    </div>

    <div class="status-item">
      <span class="status-label">仓库</span>
      <span class="status-value">{{ repositoryLabel }}</span>
    </div>

    <div class="status-item file-counts">
      <span class="status-label">文件</span>
      <span class="status-value">
        暂存 {{ stagedLabel }} / 未暂存 {{ unstagedLabel }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.global-status-bar {
  display: flex;
  height: 28px;
  min-width: 0;
  align-items: center;
  gap: 18px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--app-statusbar-bg);
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.status-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.directory-item {
  flex: 1 1 auto;
}

.directory-value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-label {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
}

.status-value {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
}

.file-counts {
  flex: 0 0 auto;
}

@media (max-width: 760px) {
  .global-status-bar {
    gap: 10px;
    padding: 0 10px;
  }

  .status-label {
    display: none;
  }
}
</style>
