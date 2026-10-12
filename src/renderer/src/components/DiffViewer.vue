<script setup lang="ts">
import { computed } from 'vue'
import {
  Document,
  InfoFilled,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'
import { html as renderDiffHtml } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import { useFilesStore } from '../stores/filesStore'

interface DiffRenderResult {
  html: string
  error: string
  empty: boolean
}

const store = useFilesStore()

const diffTitle = computed(() => {
  if (!store.currentFile) {
    return '未选择文件'
  }

  return store.currentFile.originalPath
    ? `${store.currentFile.originalPath} -> ${store.currentFile.path}`
    : store.currentFile.path
})

const diffKind = computed(() =>
  store.currentDiffStaged ? '已暂存' : '未暂存'
)

const renderResult = computed<DiffRenderResult>(() => {
  const result = store.currentDiff
  if (!result) {
    return { html: '', error: '', empty: true }
  }

  if (!result.success) {
    return {
      html: '',
      error: result.error || '读取文件差异失败。',
      empty: false
    }
  }

  const rawDiff = result.diff ?? ''
  if (!rawDiff.trim() || rawDiff.trim() === '没有可显示的差异。') {
    return { html: '', error: '', empty: true }
  }

  try {
    return {
      html: renderDiffHtml(rawDiff, {
        outputFormat: 'line-by-line',
        drawFileList: false,
        matching: 'lines',
        diffStyle: 'word',
        renderNothingWhenEmpty: true
      }),
      error: '',
      empty: false
    }
  } catch (error) {
    return {
      html: '',
      error:
        error instanceof Error
          ? `Diff 渲染失败：${error.message}`
          : 'Diff 渲染失败。',
      empty: false
    }
  }
})
</script>

<template>
  <section class="panel diff-viewer">
    <header class="diff-header">
      <div class="diff-title">
        <el-icon><Document /></el-icon>
        <span>Diff 查看器</span>
      </div>

      <div v-if="store.currentFile" class="diff-file-summary">
        <el-tag
          size="small"
          effect="plain"
          :type="store.currentDiffStaged ? 'primary' : 'warning'"
        >
          {{ diffKind }}
        </el-tag>
        <span class="diff-file-path" :title="diffTitle">{{ diffTitle }}</span>
      </div>
    </header>

    <div class="diff-content">
      <div v-if="store.diffLoading" class="diff-state">
        <el-icon class="is-loading loading-icon"><Loading /></el-icon>
        <p>正在读取文件差异</p>
      </div>

      <el-alert
        v-else-if="renderResult.error"
        class="diff-alert"
        type="error"
        :closable="false"
        show-icon
        :title="renderResult.error"
      />

      <div
        v-else-if="!store.currentFile"
        class="diff-state"
      >
        <el-icon class="state-icon"><InfoFilled /></el-icon>
        <p>从左侧文件列表选择文件以查看差异</p>
      </div>

      <div
        v-else-if="renderResult.empty"
        class="diff-state"
      >
        <el-icon class="state-icon"><WarningFilled /></el-icon>
        <p>该文件没有可显示的差异</p>
      </div>

      <div
        v-else
        class="diff-html"
        v-html="renderResult.html"
      ></div>
    </div>
  </section>
</template>

<style scoped>
.diff-viewer {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.diff-header {
  display: flex;
  min-height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--app-card-bg);
}

.diff-title {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 650;
}

.diff-file-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.diff-file-path {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diff-content {
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: var(--el-bg-color);
}

.diff-state {
  display: grid;
  height: 100%;
  min-height: 180px;
  place-content: center;
  justify-items: center;
  gap: 9px;
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
}

.diff-state p {
  margin: 0;
  font-size: 12px;
}

.state-icon {
  color: var(--el-text-color-placeholder);
  font-size: 22px;
}

.loading-icon {
  color: var(--el-color-primary);
  font-size: 22px;
}

.diff-alert {
  margin: 12px;
  width: auto;
}

.diff-html {
  min-width: 680px;
  padding: 0 0 12px;
}

.diff-html :deep(.d2h-wrapper) {
  color: var(--el-text-color-regular);
  font-size: 11px;
}

.diff-html :deep(.d2h-file-header) {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 36px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.diff-html :deep(.d2h-file-name) {
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 650;
}

.diff-html :deep(.d2h-code-line),
.diff-html :deep(.d2h-code-side-line) {
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
}

.diff-html :deep(.d2h-code-linenumber),
.diff-html :deep(.d2h-code-side-linenumber) {
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
}

.diff-html :deep(.d2h-del) {
  background: var(--el-color-danger-light-9);
}

.diff-html :deep(.d2h-ins) {
  background: var(--el-color-success-light-9);
}

.diff-html :deep(.d2h-info) {
  background: var(--el-fill-color-light);
}

@media (max-width: 900px) {
  .diff-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .diff-file-summary {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
