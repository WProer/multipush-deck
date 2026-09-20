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
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
const __draft0_5 = 5
// 临时整理：第 1-7 项
const __draft0_7 = 7
// 临时整理：第 1-9 项
const __draft0_9 = 9
// 临时整理：第 1-11 项
const __draft0_11 = 11
// 临时整理：第 1-13 项
