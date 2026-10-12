<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  CircleCheck,
  CircleClose,
  Close,
  CopyDocument,
  Delete,
  Document,
  Expand,
  Fold,
  InfoFilled,
  Loading,
  Search,
  VideoPause,
  VideoPlay,
  Warning
} from '@element-plus/icons-vue'
import type {
  LogCommandDetail,
  LogCommandEndEvent,
  LogCommandOutputEvent,
  LogCommandStartEvent
} from '../../../shared/types'
import { useLogsStore, type LogEntry } from '../stores/logsStore'
import { useSettingsStore } from '../stores/settingsStore'

const logsStore = useLogsStore()
const settingsStore = useSettingsStore()
const logContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const resizing = ref(false)
let resizeStartY = 0
let resizeStartHeight = 0
const unsubscribeHandlers: Array<() => void> = []

const panelStyle = computed(() => ({
  height: logsStore.collapsed ? '32px' : `${logsStore.height}px`
}))

const visibleEntries = computed(() => logsStore.filteredEntries)

const collapsedSummary = computed(() => {
  const summary = logsStore.lastEntry?.summary.trim()
  return summary || '就绪'
})

const collapsedStatusClass = computed(() =>
  logsStore.lastEntry ? `is-${logsStore.lastEntry.status}` : 'is-idle'
)

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(timestamp))
}

function formatDuration(duration: number | null): string {
  if (duration === null) {
    return ''
  }

  if (duration < 1000) {
    return `${duration} ms`
  }

  return `${(duration / 1000).toFixed(1)} s`
}

function formatExitCode(entry: LogEntry): string {
  if (entry.status === 'running') {
    return '执行中'
  }

  return entry.exitCode === null ? '-' : `退出码 ${entry.exitCode}`
}

function getEntryClass(entry: LogEntry): string {
  return `status-${entry.status}`
}

function getStatusLabel(entry: LogEntry): string {
  if (entry.status === 'running') {
    return '执行中'
  }

  return entry.status === 'success' ? '成功' : '失败'
}

function getDetailStatusLabel(status: LogCommandDetail['status']): string {
  if (status === 'success') {
    return '成功'
  }
  if (status === 'failure') {
    return '失败'
  }
  if (status === 'skipped') {
    return '跳过'
  }

  return '未确认'
}

function getDetailClass(status: LogCommandDetail['status']): string {
  return `is-${status}`
}

function truncateMiddle(value: string, maxLength = 46): string {
  if (value.length <= maxLength) {
    return value
  }

  const headLength = Math.ceil((maxLength - 3) / 2)
  const tailLength = Math.floor((maxLength - 3) / 2)
  return `${value.slice(0, headLength)}...${value.slice(-tailLength)}`
}

function formatArgument(value: string, compact = true): string {
  const formatted = value.includes(' ') ? `"${value}"` : value
  return compact ? truncateMiddle(formatted) : formatted
}

function getCommandName(entry: LogEntry): string {
  const value = entry.command.trim()
  if (!value) {
    return entry.source
  }

  const separatorIndex = value.indexOf(' ')
  return separatorIndex === -1 ? value : value.slice(0, separatorIndex)
}

function getCompactArguments(entry: LogEntry): string {
  if (!entry.args.length) {
    const command = entry.command.trim()
    const separatorIndex = command.indexOf(' ')
    return separatorIndex === -1 ? '' : command.slice(separatorIndex + 1)
  }

  const visible = entry.args.slice(0, 3).map((arg) => formatArgument(arg, true))
  if (entry.args.length > 3) {
    visible.push(`等 ${entry.args.length} 个`)
  }
  return visible.join(' ')
}

function getFullArguments(entry: LogEntry): string {
  return entry.args.map((arg) => formatArgument(arg, false)).join(' ')
}

function getOutputText(value: string): string {
  return value.trimEnd() || '无输出'
}

function handleCommandStart(event: LogCommandStartEvent): void {
  logsStore.startCommand(
    event.source,
    event.command,
    event.args,
    event.cwd,
    event.id
  )
}

function handleCommandStdout(event: LogCommandOutputEvent): void {
  logsStore.appendStdout(event.id, event.data)
}

function handleCommandStderr(event: LogCommandOutputEvent): void {
  logsStore.appendStderr(event.id, event.data)
}

function handleCommandEnd(event: LogCommandEndEvent): void {
  logsStore.endCommand(
    event.id,
    event.exitCode,
    event.duration,
    event.summary,
    event.details,
    event.rawStderr
  )
}

async function scrollToBottom(): Promise<void> {
  await nextTick()
  const element = logContainer.value
  if (!element) {
    return
  }

  element.scrollTop = element.scrollHeight
  autoScroll.value = true
}

function handleScroll(): void {
  const element = logContainer.value
  if (!element) {
    return
  }

  const distance =
    element.scrollHeight - element.scrollTop - element.clientHeight
  autoScroll.value = distance <= 24
}

async function copyAll(): Promise<void> {
  const content = visibleEntries.value
    .map((entry) => {
      const lines = [
        `[${formatTime(entry.time)}] [${entry.source}] ${entry.summary}`,
        `${entry.command}${entry.args.length ? ` ${entry.args.join(' ')}` : ''}`,
        `状态：${getStatusLabel(entry)}，${formatExitCode(entry)}，耗时：${formatDuration(entry.duration) || '-'}`
      ]

      if (entry.details.length) {
        lines.push(
          `远程结果:\n${entry.details
            .map(
              (detail) =>
                `${detail.name} [${getDetailStatusLabel(detail.status)}] ${detail.message}${detail.url ? ` (${detail.url})` : ''}`
            )
            .join('\n')}`
        )
      }

      if (entry.stdout) {
        lines.push(`stdout:\n${entry.stdout}`)
      }
      if (entry.stderr) {
        lines.push(`stderr:\n${entry.stderr}`)
      }

      return lines.join('\n')
    })
    .join('\n\n')

  if (!content) {
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }

    ElMessage.success('日志已复制')
  } catch {
    ElMessage.error('复制日志失败')
  }
}

function removeResizeListeners(): void {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

function startResize(event: MouseEvent): void {
  if (event.button !== 0) {
    return
  }

  event.preventDefault()

  if (logsStore.collapsed) {
    logsStore.setCollapsed(false)
  }

  resizing.value = true
  resizeStartY = event.clientY
  resizeStartHeight = logsStore.height
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(event: MouseEvent): void {
  if (!resizing.value) {
    return
  }

  event.preventDefault()
  const nextHeight = resizeStartHeight + resizeStartY - event.clientY
  logsStore.setHeight(nextHeight)
}

function stopResize(): void {
  const wasResizing = resizing.value

  resizing.value = false
  removeResizeListeners()
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  if (wasResizing) {
    logsStore.persistHeight()
  }
}

function handleWindowResize(): void {
  logsStore.setHeight(logsStore.height)
}

watch(
  () =>
    visibleEntries.value
      .map(
        (entry) =>
          `${entry.id}:${entry.stdout.length}:${entry.stderr.length}:${entry.status}:${entry.collapsed}`
      )
      .join('|'),
  async () => {
    if (autoScroll.value && logsStore.visible && !logsStore.collapsed) {
      await scrollToBottom()
    }
  }
)

watch(
  () => [logsStore.visible, logsStore.collapsed],
  async ([visible, collapsed]) => {
    if (visible && !collapsed && autoScroll.value) {
      await scrollToBottom()
    }
  }
)

onMounted(() => {
  unsubscribeHandlers.push(
    window.api.onLogCommandStart(handleCommandStart),
    window.api.onLogCommandStdout(handleCommandStdout),
    window.api.onLogCommandStderr(handleCommandStderr),
    window.api.onLogCommandEnd(handleCommandEnd)
  )
  window.addEventListener('resize', handleWindowResize)
  void scrollToBottom()
})

onBeforeUnmount(() => {
  for (const unsubscribe of unsubscribeHandlers) {
    unsubscribe()
  }
  window.removeEventListener('resize', handleWindowResize)
  stopResize()
})
</script>

<template>
  <section
    class="global-log-panel"
    :class="{ 'is-collapsed': logsStore.collapsed }"
    :style="panelStyle"
  >
    <div
      class="resize-handle"
      :class="{ 'is-resizing': resizing }"
      role="separator"
      aria-orientation="horizontal"
      title="拖动调整日志高度"
      @mousedown="startResize"
    ></div>

    <div v-if="logsStore.collapsed" class="log-header log-header-collapsed">
      <button
        class="log-title-button log-collapsed-toggle"
        type="button"
        @click="logsStore.toggleCollapsed"
      >
        <el-icon><Fold /></el-icon>
        <span>运行日志</span>
        <span class="collapsed-status" :class="collapsedStatusClass">
          {{ collapsedSummary }}
        </span>
      </button>

      <el-button
        text
        size="small"
        class="log-expand-button"
        @click.stop="logsStore.toggleCollapsed"
      >
        <el-icon><Expand /></el-icon>
        <span class="button-label">展开</span>
      </el-button>
    </div>

    <div v-else class="log-header">
      <button
        class="log-title-button"
        type="button"
        @click="logsStore.toggleCollapsed"
      >
        <el-icon><Document /></el-icon>
        <span>运行日志</span>
        <span class="log-count">{{ logsStore.entries.length }} 条</span>
      </button>

      <div class="log-actions">
        <el-button
          text
          size="small"
          :disabled="!visibleEntries.length"
          @click="logsStore.setAllCollapsed(false)"
        >
          <el-icon><Expand /></el-icon>
          <span class="button-label">全部展开</span>
        </el-button>
        <el-button
          text
          size="small"
          :disabled="!visibleEntries.length"
          @click="logsStore.setAllCollapsed(true)"
        >
          <el-icon><Fold /></el-icon>
          <span class="button-label">全部折叠</span>
        </el-button>
        <el-button
          text
          size="small"
          :disabled="!logsStore.entries.length"
          @click="logsStore.clear"
        >
          <el-icon><Delete /></el-icon>
          <span class="button-label">清空</span>
        </el-button>
        <el-button
          text
          size="small"
          :disabled="!visibleEntries.length"
          @click="copyAll"
        >
          <el-icon><CopyDocument /></el-icon>
          <span class="button-label">复制全部</span>
        </el-button>
        <el-button text size="small" @click="logsStore.togglePaused">
          <el-icon>
            <VideoPause v-if="!logsStore.paused" />
            <VideoPlay v-else />
          </el-icon>
          <span class="button-label">
            {{ logsStore.paused ? '继续接收' : '暂停接收' }}
          </span>
        </el-button>
        <el-checkbox
          v-model="logsStore.onlyFailed"
          class="failed-filter"
          size="small"
        >
          仅显示失败
        </el-checkbox>
        <el-input
          v-model="logsStore.searchQuery"
          class="log-search"
          size="small"
          clearable
          placeholder="搜索"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button text size="small" @click="logsStore.toggleCollapsed">
          <el-icon><Fold /></el-icon>
          <span class="button-label">折叠</span>
        </el-button>
        <el-button text size="small" @click="logsStore.toggleVisible">
          <el-icon><Close /></el-icon>
          <span class="button-label">隐藏</span>
        </el-button>
      </div>
    </div>

      <div
        v-if="!logsStore.collapsed"
        ref="logContainer"
        class="log-content"
        aria-live="polite"
        @scroll="handleScroll"
      >
        <div v-if="!visibleEntries.length" class="log-empty">
          暂无日志
        </div>

        <div
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="log-card"
          :class="getEntryClass(entry)"
        >
          <button
            class="log-card-header"
            type="button"
            @click="logsStore.toggleCollapse(entry.id)"
          >
            <span class="log-status">
              <el-icon>
                <Loading
                  v-if="entry.status === 'running'"
                  class="is-loading"
                />
                <CircleClose v-else-if="entry.status === 'failed'" />
                <CircleCheck v-else />
              </el-icon>
            </span>
            <span class="log-time">{{ formatTime(entry.time) }}</span>
            <span class="log-source">{{ entry.source }}</span>
            <span class="log-summary">{{ entry.summary }}</span>
            <span class="log-duration">{{ formatDuration(entry.duration) || '-' }}</span>
            <span class="log-code">{{ formatExitCode(entry) }}</span>
          </button>

          <div v-if="!entry.collapsed" class="log-card-body">
            <div class="command-line">
              <span class="command-name">{{ getCommandName(entry) }}</span>
              <span class="command-args">{{ getCompactArguments(entry) }}</span>
            </div>
            <div class="command-full">
              <span class="command-label">完整命令</span>
              <code>{{ entry.command }}</code>
            </div>
            <div v-if="entry.args.length" class="command-full">
              <span class="command-label">参数</span>
              <code>{{ getFullArguments(entry) }}</code>
            </div>
            <div class="meta-line">
              <span>工作目录：{{ entry.cwd || '-' }}</span>
              <span>退出码：{{ entry.exitCode ?? '-' }}</span>
              <span>耗时：{{ formatDuration(entry.duration) || '-' }}</span>
            </div>
            <section v-if="entry.details.length" class="remote-results">
              <div class="output-title">远程结果</div>
              <div class="remote-result-list">
                <div
                  v-for="detail in entry.details"
                  :key="`${detail.name}:${detail.url ?? ''}`"
                  class="remote-result-row"
                  :class="getDetailClass(detail.status)"
                >
                  <el-icon class="remote-result-icon">
                    <CircleCheck v-if="detail.status === 'success'" />
                    <CircleClose v-else-if="detail.status === 'failure'" />
                    <Warning v-else-if="detail.status === 'skipped'" />
                    <InfoFilled v-else />
                  </el-icon>
                  <span class="remote-result-name">{{ detail.name }}</span>
                  <span class="remote-result-status">
                    {{ getDetailStatusLabel(detail.status) }}
                  </span>
                  <span class="remote-result-message">{{ detail.message }}</span>
                  <code v-if="detail.url" class="remote-result-url">
                    {{ detail.url }}
                  </code>
                </div>
              </div>
            </section>
            <section v-if="entry.stdout" class="output-block">
              <div class="output-title">stdout</div>
              <pre>{{ getOutputText(entry.stdout) }}</pre>
            </section>
            <section v-if="entry.stderr" class="output-block output-stderr">
              <div class="output-title">stderr</div>
              <pre>{{ getOutputText(entry.stderr) }}</pre>
            </section>
            <section
              v-if="
                settingsStore.logLevel === 'verbose' &&
                entry.rawStderr &&
                entry.rawStderr !== entry.stderr
              "
              class="output-block output-raw"
            >
              <div class="output-title">原始 stderr</div>
              <pre>{{ getOutputText(entry.rawStderr) }}</pre>
            </section>
          </div>
        </div>

        <el-button
          v-if="!autoScroll"
          class="back-to-bottom"
          type="primary"
          size="small"
          @click="scrollToBottom"
        >
          <el-icon><ArrowDown /></el-icon>
          <span>回到底部</span>
        </el-button>
      </div>
  </section>
</template>

<style scoped>
.global-log-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--app-topbar-border);
  background: var(--app-log-bg);
  color: var(--el-text-color-regular);
}


.resize-handle {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 4px;
  flex: 0 0 4px;
  background: var(--el-border-color-lighter);
  cursor: row-resize;
}

.resize-handle:hover,
.resize-handle.is-resizing {
  background: var(--el-color-primary);
}

.resize-handle.is-resizing::after {
  position: absolute;
  top: 1px;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--el-color-primary);
  box-shadow: 0 0 5px var(--el-color-primary-light-3);
  content: "";
}

.log-header {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 28px;
  min-height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--app-card-bg);
}

.global-log-panel.is-collapsed .log-header-collapsed {
  gap: 8px;
  overflow: hidden;
}

.log-collapsed-toggle {
  flex: 1 1 auto;
  overflow: hidden;
}

.collapsed-status {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collapsed-status.is-success {
  color: var(--el-color-success);
}

.collapsed-status.is-failed {
  color: var(--el-color-danger);
}

.collapsed-status.is-running {
  color: var(--el-color-primary);
}

.log-expand-button {
  flex: 0 0 auto;
}

.log-title-button {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.log-count {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.log-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 2px;
}

.log-actions :deep(.el-button) {
  height: 24px;
  margin: 0;
  padding: 0 7px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.log-actions :deep(.el-button:hover) {
  background: var(--app-hover-bg);
  color: var(--el-color-primary);
}

.log-actions :deep(.el-button.is-disabled) {
  color: var(--el-text-color-disabled);
}

.failed-filter {
  margin: 0 5px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.log-search {
  width: 132px;
  margin: 0 4px;
}

.log-content {
  position: relative;
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
  padding: 7px 10px 12px;
  scrollbar-color: var(--el-border-color) var(--app-log-bg);
}

.log-card {
  overflow: hidden;
  margin-bottom: 7px;
  border: 1px solid var(--app-card-border);
  border-radius: 4px;
  background: var(--app-card-bg);
}

.log-card.status-failed {
  border-color: var(--el-color-danger);
}

.log-card.status-running {
  border-color: var(--el-color-primary);
}

.log-card-header {
  display: grid;
  width: 100%;
  min-height: 28px;
  grid-template-columns: 18px 58px minmax(80px, 130px) minmax(0, 1fr) 58px 62px;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font: inherit;
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  text-align: left;
}

.log-card-header:hover {
  background: var(--app-hover-bg);
}

.log-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-success .log-status {
  color: var(--el-color-success);
}

.status-failed .log-status {
  color: var(--el-color-danger);
}

.status-running .log-status {
  color: var(--el-color-primary);
}

.log-time,
.log-source,
.log-code {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-failed .log-summary {
  color: var(--el-color-danger);
}

.log-duration {
  color: var(--el-text-color-secondary);
  text-align: right;
}

.log-code {
  text-align: right;
}

.log-card-body {
  padding: 9px 11px 11px 35px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.command-line {
  overflow: hidden;
  padding: 4px 6px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-name {
  color: var(--el-color-primary);
  font-weight: 700;
}

.command-args {
  margin-left: 7px;
  color: var(--el-color-warning);
}

.command-full {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 8px;
  margin-top: 7px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.command-full code {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
}

.command-label,
.output-title {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 9px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.remote-results {
  margin-top: 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  background: var(--el-fill-color-light);
}

.remote-result-list {
  display: flex;
  flex-direction: column;
}

.remote-result-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 9px;
  padding: 7px 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 11px;
}

.remote-result-row:first-child {
  border-top: 0;
}

.remote-result-icon {
  flex: 0 0 auto;
}

.remote-result-name {
  min-width: 80px;
  color: var(--el-text-color-primary);
  font-weight: 700;
}

.remote-result-status {
  flex: 0 0 auto;
  font-size: 10px;
}

.remote-result-message {
  min-width: 0;
  flex: 1 1 180px;
  overflow-wrap: anywhere;
}

.remote-result-url {
  width: calc(100% - 24px);
  margin-left: 24px;
  overflow-wrap: anywhere;
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
}

.remote-result-row.is-success .remote-result-icon,
.remote-result-row.is-success .remote-result-status {
  color: var(--el-color-success);
}

.remote-result-row.is-failure .remote-result-icon,
.remote-result-row.is-failure .remote-result-status {
  color: var(--el-color-danger);
}

.remote-result-row.is-skipped .remote-result-icon,
.remote-result-row.is-skipped .remote-result-status {
  color: var(--el-color-warning);
}

.remote-result-row.is-unknown .remote-result-icon,
.remote-result-row.is-unknown .remote-result-status {
  color: var(--el-color-info);
}

.output-block {
  margin-top: 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  background: var(--el-fill-color-light);
}

.output-block pre {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  padding: 7px 8px;
  color: var(--el-text-color-regular);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.output-title {
  padding: 4px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.output-stderr pre {
  color: var(--el-color-danger);
}

.output-raw pre {
  color: var(--el-color-warning);
}

.log-empty {
  display: grid;
  min-height: 54px;
  place-items: center;
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
}

.back-to-bottom {
  position: sticky;
  right: 10px;
  bottom: 6px;
  float: right;
}

@media (max-width: 960px) {
  .log-actions :deep(.button-label) {
    display: none;
  }

  .log-search {
    width: 100px;
  }

  .log-card-header {
    grid-template-columns: 18px 52px 90px minmax(0, 1fr) 52px;
  }

  .log-code {
    display: none;
  }
}
</style>
