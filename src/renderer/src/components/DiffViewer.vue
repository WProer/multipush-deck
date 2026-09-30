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
<!-- 临时整理：第 2-44 项 -->
<!-- 临时整理：第 2-45 项 -->
<!-- 临时整理：第 2-46 项 -->
<!-- 临时整理：第 2-47 项 -->
<!-- 临时整理：第 2-48 项 -->
<!-- 临时整理：第 2-49 项 -->
<!-- 临时整理：第 2-50 项 -->
<!-- 临时整理：第 2-51 项 -->
<!-- 临时整理：第 2-52 项 -->
<!-- 临时整理：第 2-53 项 -->
<!-- 临时整理：第 2-54 项 -->
<!-- 临时整理：第 2-55 项 -->
<!-- 临时整理：第 2-56 项 -->
<!-- 临时整理：第 2-57 项 -->
<!-- 临时整理：第 2-58 项 -->
<!-- 临时整理：第 2-59 项 -->
<!-- 临时整理：第 2-60 项 -->
<!-- 临时整理：第 2-61 项 -->
<!-- 临时整理：第 2-62 项 -->
<!-- 临时整理：第 2-63 项 -->
<!-- 临时整理：第 2-64 项 -->
<!-- 临时整理：第 2-65 项 -->
<!-- 临时整理：第 2-66 项 -->
<!-- 临时整理：第 2-67 项 -->
<!-- 临时整理：第 2-68 项 -->
<!-- 临时整理：第 2-69 项 -->
<!-- 临时整理：第 2-70 项 -->
<!-- 临时整理：第 2-71 项 -->
<!-- 临时整理：第 2-72 项 -->
<!-- 临时整理：第 2-73 项 -->
<!-- 临时整理：第 2-74 项 -->
<!-- 临时整理：第 2-75 项 -->
<!-- 临时整理：第 2-76 项 -->
<!-- 临时整理：第 2-77 项 -->
<!-- 临时整理：第 2-78 项 -->
<!-- 临时整理：第 2-79 项 -->
<!-- 临时整理：第 2-80 项 -->
<!-- 临时整理：第 2-81 项 -->
<!-- 临时整理：第 2-82 项 -->
<!-- 临时整理：第 2-83 项 -->
<!-- 临时整理：第 2-84 项 -->
<!-- 临时整理：第 2-85 项 -->
