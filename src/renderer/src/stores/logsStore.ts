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
// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
const __draft1_3 = 3
// 临时整理：第 2-5 项
const __draft1_5 = 5
// 临时整理：第 2-7 项
const __draft1_7 = 7
// 临时整理：第 2-9 项
const __draft1_9 = 9
// 临时整理：第 2-11 项
const __draft1_11 = 11
// 临时整理：第 2-13 项
const __draft1_13 = 13
// 临时整理：第 2-15 项
const __draft1_15 = 15
// 临时整理：第 2-17 项
const __draft1_17 = 17
// 临时整理：第 2-19 项
const __draft1_19 = 19
// 临时整理：第 2-21 项
const __draft1_21 = 21
// 临时整理：第 2-23 项
const __draft1_23 = 23
// 临时整理：第 2-25 项
const __draft1_25 = 25
// 临时整理：第 2-27 项
