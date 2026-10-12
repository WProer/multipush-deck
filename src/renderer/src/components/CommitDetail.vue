<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CircleCheck,
  CircleClose,
  CopyDocument,
  Document,
  Files,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { html as renderDiffHtml } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import type {
  CommitFileChange,
  GitFileStatusCode
} from '../../../shared/types'
import { useCommitLogStore } from '../stores/commitLogStore'

interface DiffRenderResult {
  html: string
  error: string
  empty: boolean
}

const store = useCommitLogStore()
const copiedHash = ref('')

const statusMeta: Record<
  GitFileStatusCode,
  {
    letter: string
    label: string
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
> = {
  added: { letter: 'A', label: '新增', type: 'success' },
  modified: { letter: 'M', label: '修改', type: 'warning' },
  deleted: { letter: 'D', label: '删除', type: 'danger' },
  renamed: { letter: 'R', label: '重命名', type: 'primary' },
  copied: { letter: 'C', label: '复制', type: 'primary' },
  untracked: { letter: '?', label: '未跟踪', type: 'info' },
  conflicted: { letter: '!', label: '冲突', type: 'danger' },
  unknown: { letter: '?', label: '未知', type: 'info' }
}

const commit = computed(() => store.selectedCommit)
const detail = computed(() => store.selectedCommitDetail)
const remotes = computed(() => store.selectedPushStatus?.remotes ?? [])
const fullMessage = computed(
  () => detail.value?.message || commit.value?.subject || ''
)

const diffRenderResult = computed<DiffRenderResult>(() => {
  const result = store.selectedFileDiff
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

function getStatusMeta(status: GitFileStatusCode) {
  return statusMeta[status] ?? statusMeta.unknown
}

function getFilePath(file: CommitFileChange): string {
  return file.originalPath
    ? `${file.originalPath} -> ${file.path}`
    : file.path
}

function isSelectedFile(file: CommitFileChange): boolean {
  return (
    store.selectedFile?.path === file.path &&
    store.selectedFile?.originalPath === file.originalPath
  )
}

async function copyHash(): Promise<void> {
  const hash = commit.value?.hash
  if (!hash) {
    return
  }

  try {
    await navigator.clipboard.writeText(hash)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = hash
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }

  copiedHash.value = hash
  ElMessage.success('提交哈希已复制。')
  window.setTimeout(() => {
    if (copiedHash.value === hash) {
      copiedHash.value = ''
    }
  }, 1600)
}
</script>

<template>
  <section class="panel commit-detail">
    <div v-if="!commit" class="detail-state">
      <el-icon class="detail-state-icon"><Document /></el-icon>
      <p>从左侧选择一条提交查看详情</p>
    </div>

    <div v-else class="detail-scroll">
      <header class="detail-header">
        <div class="detail-title-row">
          <div>
            <h2>{{ commit.subject }}</h2>
            <div class="commit-hash-row">
              <code>{{ commit.hash }}</code>
              <el-tooltip content="复制完整哈希" placement="top">
                <el-button
                  text
                  circle
                  size="small"
                  aria-label="复制完整哈希"
                  @click="copyHash"
                >
                  <el-icon>
                    <CircleCheck v-if="copiedHash === commit.hash" />
                    <CopyDocument v-else />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>

        <dl class="commit-meta">
          <div>
            <dt>作者</dt>
            <dd>{{ commit.author }}</dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{{ commit.email }}</dd>
          </div>
          <div>
            <dt>提交时间</dt>
            <dd>{{ commit.date }}</dd>
          </div>
        </dl>
      </header>

      <section class="detail-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>提交信息</span>
        </div>
        <pre class="commit-message">{{ fullMessage }}</pre>
      </section>

      <section class="detail-section">
        <div class="section-title">
          <el-icon><CircleCheck /></el-icon>
          <span>推送状态</span>
        </div>

        <el-skeleton v-if="store.detailLoading" :rows="2" animated />

        <div v-else-if="remotes.length" class="remote-status-list">
          <div
            v-for="remote in remotes"
            :key="remote.name"
            class="remote-status-row"
          >
            <el-icon
              class="remote-status-icon"
              :class="{
                'is-pushed': remote.pushed === true,
                'is-not-pushed': remote.pushed === false,
                'is-unknown': remote.pushed === null
              }"
            >
              <CircleCheck v-if="remote.pushed === true" />
              <CircleClose v-else-if="remote.pushed === false" />
              <WarningFilled v-else />
            </el-icon>

            <div class="remote-status-main">
              <div class="remote-name-line">
                <strong>{{ remote.name }}</strong>
                <span>{{ remote.url || '未读取到远程 URL' }}</span>
              </div>
              <span
                v-if="remote.pushed === false"
                class="remote-ahead"
              >
                本地领先 {{ remote.aheadCount }} 个提交
              </span>
              <span v-else-if="remote.pushed === null" class="remote-ahead">
                无法根据本地远程跟踪分支判断
              </span>
            </div>
          </div>
        </div>

        <div v-else class="section-empty">
          未配置远程，无法判断推送状态。
        </div>
      </section>

      <section class="detail-section detail-files-section">
        <div class="section-title">
          <el-icon><Files /></el-icon>
          <span>文件变更</span>
          <el-tag size="small" effect="plain">
            {{ detail?.files.length ?? 0 }}
          </el-tag>
        </div>

        <el-skeleton v-if="store.detailLoading" :rows="4" animated />

        <div v-else-if="detail?.files.length" class="commit-file-list">
          <button
            v-for="file in detail.files"
            :key="`${file.statusCode}:${file.originalPath ?? ''}:${file.path}`"
            type="button"
            class="commit-file-row"
            :class="{ 'is-selected': isSelectedFile(file) }"
            @click="store.selectFile(file)"
          >
            <span
              class="file-status-icon"
              :class="`status-${getStatusMeta(file.status).type}`"
              :title="getStatusMeta(file.status).label"
            >
              {{ getStatusMeta(file.status).letter }}
            </span>
            <span class="file-path" :title="getFilePath(file)">
              {{ getFilePath(file) }}
            </span>
          </button>
        </div>

        <div v-else class="section-empty">该提交没有文件变更。</div>
      </section>

      <section class="detail-section diff-section">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>文件差异</span>
          <span v-if="store.selectedFile" class="selected-file-name">
            {{ store.selectedFile.path }}
          </span>
        </div>

        <div v-if="store.diffLoading" class="diff-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在读取文件差异</span>
        </div>

        <el-alert
          v-else-if="diffRenderResult.error"
          type="error"
          :closable="false"
          show-icon
          :title="diffRenderResult.error"
        />

        <div v-else-if="!store.selectedFile" class="section-empty">
          选择上方文件查看该提交中的差异。
        </div>

        <div v-else-if="diffRenderResult.empty" class="section-empty">
          该文件没有可显示的差异。
        </div>

        <div v-else class="diff-html" v-html="diffRenderResult.html"></div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.commit-detail {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.detail-scroll {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.detail-state {
  display: grid;
  height: 100%;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.detail-state p {
  margin: 0;
}

.detail-state-icon {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
}

.detail-header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--app-card-bg);
}

.detail-title-row h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.commit-hash-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.commit-hash-row code {
  min-width: 0;
  overflow: hidden;
  color: var(--el-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-meta {
  display: grid;
  gap: 5px;
  margin: 10px 0 0;
  padding: 0;
}

.commit-meta > div {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 6px;
}

.commit-meta dt,
.commit-meta dd {
  min-width: 0;
  margin: 0;
  font-size: 11px;
}

.commit-meta dt {
  color: var(--text-muted);
}

.commit-meta dd {
  overflow-wrap: anywhere;
  color: var(--text-main);
}

.detail-section {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-soft);
}

.section-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  margin-bottom: 9px;
  color: var(--text-strong);
  font-size: 12px;
  font-weight: 650;
}

.selected-file-name {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-message {
  max-height: 160px;
  margin: 0;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--text-main);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.remote-status-list,
.commit-file-list {
  display: grid;
  gap: 5px;
}

.remote-status-row {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 7px;
  padding: 7px 8px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--app-card-bg);
}

.remote-status-icon {
  margin-top: 1px;
  font-size: 16px;
}

.remote-status-icon.is-pushed {
  color: var(--el-color-success);
}

.remote-status-icon.is-not-pushed {
  color: var(--el-text-color-placeholder);
}

.remote-status-icon.is-unknown {
  color: var(--el-color-warning);
}

.remote-status-main {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.remote-name-line {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.remote-name-line strong {
  flex: 0 0 auto;
  color: var(--text-strong);
  font-size: 11px;
}

.remote-name-line span {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remote-ahead {
  color: var(--text-muted);
  font-size: 10px;
}

.detail-files-section {
  min-height: 120px;
}

.commit-file-row {
  display: grid;
  width: 100%;
  min-height: 30px;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  padding: 4px 7px;
  border: 1px solid var(--border-soft);
  border-radius: 5px;
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.commit-file-row:hover,
.commit-file-row.is-selected {
  background: var(--app-active-bg);
}

.file-status-icon {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 5px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
}

.status-success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.status-warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.status-danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.status-primary {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.status-info {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.file-path {
  min-width: 0;
  overflow: hidden;
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-empty {
  padding: 12px 8px;
  color: var(--text-muted);
  font-size: 11px;
  text-align: center;
}

.diff-state {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 11px;
}

.diff-html {
  min-width: 560px;
  overflow: auto;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.diff-html :deep(.d2h-wrapper) {
  color: var(--el-text-color-regular);
  font-size: 10px;
}

.diff-html :deep(.d2h-file-header) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--el-fill-color-light);
}

.diff-html :deep(.d2h-code-line),
.diff-html :deep(.d2h-code-side-line) {
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
}

.diff-html :deep(.d2h-code-linenumber),
.diff-html :deep(.d2h-code-side-linenumber) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 9px;
}

@media (max-width: 900px) {
  .detail-header {
    padding: 12px;
  }
}
</style>
