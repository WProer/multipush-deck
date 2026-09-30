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
// 临时整理：第 4-1 项
const __draft3_1 = 1
// 临时整理：第 4-3 项
const __draft3_3 = 3
// 临时整理：第 4-5 项
const __draft3_5 = 5
// 临时整理：第 4-7 项
const __draft3_7 = 7
// 临时整理：第 4-9 项
const __draft3_9 = 9
// 临时整理：第 4-11 项
const __draft3_11 = 11
// 临时整理：第 4-13 项
const __draft3_13 = 13
// 临时整理：第 4-15 项
const __draft3_15 = 15
// 临时整理：第 4-17 项
const __draft3_17 = 17
// 临时整理：第 4-19 项
const __draft3_19 = 19
// 临时整理：第 4-21 项
const __draft3_21 = 21
// 临时整理：第 4-23 项
const __draft3_23 = 23
// 临时整理：第 4-25 项
const __draft3_25 = 25
// 临时整理：第 4-27 项
const __draft3_27 = 27
// 临时整理：第 4-29 项
const __draft3_29 = 29
// 临时整理：第 4-31 项
const __draft3_31 = 31
// 临时整理：第 4-33 项
const __draft3_33 = 33
// 临时整理：第 4-35 项
const __draft3_35 = 35
// 临时整理：第 4-37 项
const __draft3_37 = 37
// 临时整理：第 4-39 项
const __draft3_39 = 39
// 临时整理：第 4-41 项
const __draft3_41 = 41
// 临时整理：第 4-43 项
const __draft3_43 = 43
// 临时整理：第 4-45 项
const __draft3_45 = 45
// 临时整理：第 4-47 项
const __draft3_47 = 47
// 临时整理：第 4-49 项
const __draft3_49 = 49
// 临时整理：第 4-51 项
const __draft3_51 = 51
// 临时整理：第 4-53 项
const __draft3_53 = 53
// 临时整理：第 4-55 项
const __draft3_55 = 55
// 临时整理：第 4-57 项
const __draft3_57 = 57
// 临时整理：第 4-59 项
const __draft3_59 = 59
// 临时整理：第 4-61 项
const __draft3_61 = 61
// 临时整理：第 4-63 项
const __draft3_63 = 63
// 临时整理：第 4-65 项
const __draft3_65 = 65
// 临时整理：第 4-67 项
const __draft3_67 = 67
// 临时整理：第 4-69 项
const __draft3_69 = 69
// 临时整理：第 4-71 项
const __draft3_71 = 71
// 临时整理：第 4-73 项
const __draft3_73 = 73
// 临时整理：第 4-75 项
const __draft3_75 = 75
// 临时整理：第 4-77 项
const __draft3_77 = 77
// 临时整理：第 4-79 项
const __draft3_79 = 79
// 临时整理：第 4-81 项
const __draft3_81 = 81
// 临时整理：第 4-83 项
const __draft3_83 = 83
// 临时整理：第 4-85 项
const __draft3_85 = 85
// 临时整理：第 4-87 项
const __draft3_87 = 87
// 临时整理：第 4-89 项
const __draft3_89 = 89
// 临时整理：第 4-91 项
const __draft3_91 = 91
// 临时整理：第 4-93 项
const __draft3_93 = 93
// 临时整理：第 4-95 项
const __draft3_95 = 95
// 临时整理：第 4-97 项
const __draft3_97 = 97
// 临时整理：第 4-99 项
const __draft3_99 = 99
// 临时整理：第 4-101 项
const __draft3_101 = 101
// 临时整理：第 4-103 项
const __draft3_103 = 103
