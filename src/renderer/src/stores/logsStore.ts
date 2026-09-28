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
// 临时整理：第 3-1 项
const __draft2_1 = 1
// 临时整理：第 3-3 项
const __draft2_3 = 3
// 临时整理：第 3-5 项
const __draft2_5 = 5
// 临时整理：第 3-7 项
const __draft2_7 = 7
// 临时整理：第 3-9 项
const __draft2_9 = 9
// 临时整理：第 3-11 项
const __draft2_11 = 11
// 临时整理：第 3-13 项
const __draft2_13 = 13
// 临时整理：第 3-15 项
const __draft2_15 = 15
// 临时整理：第 3-17 项
const __draft2_17 = 17
// 临时整理：第 3-19 项
const __draft2_19 = 19
// 临时整理：第 3-21 项
const __draft2_21 = 21
// 临时整理：第 3-23 项
const __draft2_23 = 23
// 临时整理：第 3-25 项
const __draft2_25 = 25
// 临时整理：第 3-27 项
const __draft2_27 = 27
// 临时整理：第 3-29 项
const __draft2_29 = 29
// 临时整理：第 3-31 项
const __draft2_31 = 31
// 临时整理：第 3-33 项
const __draft2_33 = 33
// 临时整理：第 3-35 项
const __draft2_35 = 35
// 临时整理：第 3-37 项
const __draft2_37 = 37
// 临时整理：第 3-39 项
const __draft2_39 = 39
// 临时整理：第 3-41 项
const __draft2_41 = 41
// 临时整理：第 3-43 项
const __draft2_43 = 43
// 临时整理：第 3-45 项
const __draft2_45 = 45
// 临时整理：第 3-47 项
const __draft2_47 = 47
// 临时整理：第 3-49 项
const __draft2_49 = 49
// 临时整理：第 3-51 项
const __draft2_51 = 51
// 临时整理：第 3-53 项
const __draft2_53 = 53
// 临时整理：第 3-55 项
const __draft2_55 = 55
// 临时整理：第 3-57 项
const __draft2_57 = 57
// 临时整理：第 3-59 项
const __draft2_59 = 59
// 临时整理：第 3-61 项
const __draft2_61 = 61
// 临时整理：第 3-63 项
const __draft2_63 = 63
// 临时整理：第 3-65 项
const __draft2_65 = 65
// 临时整理：第 3-67 项
const __draft2_67 = 67
// 临时整理：第 3-69 项
const __draft2_69 = 69
// 临时整理：第 3-71 项
const __draft2_71 = 71
// 临时整理：第 3-73 项
const __draft2_73 = 73
// 临时整理：第 3-75 项
const __draft2_75 = 75
// 临时整理：第 3-77 项
const __draft2_77 = 77
// 临时整理：第 3-79 项
const __draft2_79 = 79
// 临时整理：第 3-81 项
const __draft2_81 = 81
// 临时整理：第 3-83 项
const __draft2_83 = 83
// 临时整理：第 3-85 项
const __draft2_85 = 85
// 临时整理：第 3-87 项
const __draft2_87 = 87
// 临时整理：第 3-89 项
const __draft2_89 = 89
// 临时整理：第 3-91 项
const __draft2_91 = 91
// 临时整理：第 3-93 项
const __draft2_93 = 93
// 临时整理：第 3-95 项
const __draft2_95 = 95
// 临时整理：第 3-97 项
