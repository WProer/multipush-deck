import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LogEntry as SharedLogEntry } from '../../../shared/types'

export type LogLevel = 'info' | 'stdout' | 'stderr' | 'exit'
export type LogEntry = SharedLogEntry

export interface LegacyLogEntry {
  time: string
  level: LogLevel
  source: string
  message: string
}

const VISIBLE_STORAGE_KEY = 'multipush-deck:logs:visible'
const HEIGHT_STORAGE_KEY = 'multipush-deck:logs:height'
const MIN_HEIGHT = 120
const DEFAULT_HEIGHT = 200
const HEIGHT_PERSIST_DELAY = 180
const MAX_ENTRIES = 500

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `log-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key)
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
    return fallback
  } catch {
    return fallback
  }
}

function persistBoolean(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Keep the in-memory value when persistence is unavailable.
  }
}

function getMaxHeight(): number {
  if (typeof window === 'undefined') {
    return 640
  }

  return Math.max(MIN_HEIGHT, Math.floor(window.innerHeight * 0.7))
}

function normalizeHeight(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HEIGHT
  }

  return Math.min(Math.max(value, MIN_HEIGHT), getMaxHeight())
}

function readHeight(): number {
  try {
    const value = Number.parseFloat(
      window.localStorage.getItem(HEIGHT_STORAGE_KEY) ?? ''
    )
    return normalizeHeight(value)
  } catch {
    return DEFAULT_HEIGHT
  }
}

function writePersistedHeight(value: number): void {
  try {
    window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(value))
  } catch {
    // Keep the in-memory value when persistence is unavailable.
  }
}

function parseTime(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Date.now() : timestamp
}

function parseExitCode(message: string): number | null {
  const match = /-?\d+/.exec(message)
  if (!match) {
    return null
  }

  const value = Number.parseInt(match[0], 10)
  return Number.isNaN(value) ? null : value
}

function isLegacyEntry(
  entry: LogEntry | LegacyLogEntry
): entry is LegacyLogEntry {
  return 'level' in entry && !('status' in entry)
}

function fromLegacyEntry(entry: LegacyLogEntry): LogEntry {
  const exitCode = entry.level === 'exit' ? parseExitCode(entry.message) : null
  const failed = entry.level === 'stderr' || (exitCode !== null && exitCode !== 0)

  return {
    id: createId(),
    time: parseTime(entry.time),
    source: entry.source,
    command: entry.message,
    args: [],
    cwd: '',
    exitCode,
    duration: null,
    stdout: entry.level === 'stdout' ? entry.message : '',
    stderr: entry.level === 'stderr' ? entry.message : '',
    rawStderr: entry.level === 'stderr' ? entry.message : '',
    status: failed ? 'failed' : 'success',
    summary: entry.message,
    details: [],
    collapsed: !failed
  }
}

export const useLogsStore = defineStore('logs', () => {
  const entries = ref<LogEntry[]>([])
  const visible = ref(readBoolean(VISIBLE_STORAGE_KEY, true))
  const collapsed = ref(true)
  const height = ref(readHeight())
  const paused = ref(false)
  const onlyFailed = ref(false)
  const searchQuery = ref('')
  let heightPersistTimer: ReturnType<typeof setTimeout> | null = null

  const filteredEntries = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    return entries.value.filter((entry) => {
      if (onlyFailed.value && entry.status !== 'failed') {
        return false
      }

      if (!query) {
        return true
      }

      return [
        entry.source,
        entry.command,
        entry.args.join(' '),
        entry.summary,
        entry.details
          .map((detail) => `${detail.name} ${detail.status} ${detail.message}`)
          .join('\n'),
        entry.stdout,
        entry.stderr
      ]
        .join('\n')
        .toLowerCase()
        .includes(query)
    })
  })

  const lastEntry = computed(
    () => entries.value[entries.value.length - 1] ?? null
  )

  function trimEntries(): void {
    if (entries.value.length > MAX_ENTRIES) {
      entries.value.splice(0, entries.value.length - MAX_ENTRIES)
    }
  }

  function startCommand(
    source: string,
    command: string,
    args: string[],
    cwd: string,
    id = createId()
  ): string {
    if (paused.value) {
      return id
    }

    const entry: LogEntry = {
      id,
      time: Date.now(),
      source: source.trim() || command,
      command,
      args: [...args],
      cwd,
      exitCode: null,
      duration: null,
      stdout: '',
      stderr: '',
      rawStderr: '',
      status: 'running',
      summary: '执行中',
      details: [],
      collapsed: false
    }

    entries.value.push(entry)
    trimEntries()
    return id
  }

  function findEntry(id: string): LogEntry | undefined {
    return entries.value.find((entry) => entry.id === id)
  }

  function appendStdout(id: string, chunk: string): void {
    if (paused.value || !chunk) {
      return
    }

    const entry = findEntry(id)
    if (entry) {
      entry.stdout += chunk
    }
  }

  function appendStderr(id: string, chunk: string): void {
    if (paused.value || !chunk) {
      return
    }

    const entry = findEntry(id)
    if (entry) {
      entry.stderr += chunk
      entry.rawStderr += chunk
    }
  }

  function endCommand(
    id: string,
    exitCode: number,
    duration: number,
    summary?: string,
    details: LogEntry['details'] = [],
    rawStderr?: string
  ): void {
    if (paused.value) {
      return
    }

    const entry = findEntry(id)
    if (!entry) {
      return
    }

    entry.exitCode = exitCode
    entry.duration = duration
    entry.details = [...details]
    if (rawStderr !== undefined) {
      entry.rawStderr = rawStderr
    }
    entry.status = exitCode === 0 ? 'success' : 'failed'
    entry.collapsed = exitCode === 0
    entry.summary =
      summary?.trim() ||
      (exitCode === 0 ? '执行完成' : `执行失败，退出码 ${exitCode}`)
  }

  function append(entry: LogEntry | LegacyLogEntry): void {
    if (paused.value) {
      return
    }

    entries.value.push(isLegacyEntry(entry) ? fromLegacyEntry(entry) : entry)
    trimEntries()
  }

  function clear(): void {
    entries.value = []
  }

  function toggleCollapse(id: string): void {
    const entry = findEntry(id)
    if (entry) {
      entry.collapsed = !entry.collapsed
    }
  }

  function setAllCollapsed(value: boolean): void {
    for (const entry of entries.value) {
      entry.collapsed = value
    }
  }

  function toggleVisible(): void {
    visible.value = !visible.value
    if (visible.value) {
      collapsed.value = false
    }

    persistBoolean(VISIBLE_STORAGE_KEY, visible.value)
  }

  function toggleCollapsed(): void {
    if (!visible.value) {
      visible.value = true
      collapsed.value = false
    } else {
      collapsed.value = !collapsed.value
    }

    persistBoolean(VISIBLE_STORAGE_KEY, visible.value)
  }

  function setHeight(value: number): void {
    height.value = normalizeHeight(value)
    if (heightPersistTimer !== null) {
      clearTimeout(heightPersistTimer)
    }
    heightPersistTimer = setTimeout(() => {
      heightPersistTimer = null
      writePersistedHeight(height.value)
    }, HEIGHT_PERSIST_DELAY)
  }

  function persistHeight(): void {
    if (heightPersistTimer !== null) {
      clearTimeout(heightPersistTimer)
      heightPersistTimer = null
    }
    writePersistedHeight(height.value)
  }

  function setCollapsed(value: boolean): void {
    visible.value = true
    collapsed.value = value
    persistBoolean(VISIBLE_STORAGE_KEY, visible.value)
  }

  function setPanelState(state: 'hidden' | 'collapsed' | 'expanded'): void {
    visible.value = state !== 'hidden'
    collapsed.value = state === 'collapsed'
    persistBoolean(VISIBLE_STORAGE_KEY, visible.value)
  }

  function togglePaused(): void {
    paused.value = !paused.value
  }

  return {
    entries,
    filteredEntries,
    lastEntry,
    visible,
    collapsed,
    height,
    paused,
    onlyFailed,
    searchQuery,
    startCommand,
    appendStdout,
    appendStderr,
    endCommand,
    append,
    clear,
    toggleCollapse,
    setAllCollapsed,
    toggleVisible,
    toggleCollapsed,
    setHeight,
    persistHeight,
    setCollapsed,
    setPanelState,
    togglePaused
  }
})
