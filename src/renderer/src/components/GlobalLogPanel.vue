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

<!-- 临时整理：第 1-1 项 -->
