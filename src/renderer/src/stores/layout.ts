import { ref } from 'vue'
import { defineStore } from 'pinia'

export const MAIN_SPLIT_MIN = 45
export const MAIN_SPLIT_MAX = 72
export const LEFT_VERTICAL_MIN = 30
export const LEFT_VERTICAL_MAX = 68
export const RIGHT_VERTICAL_MIN = 28
export const RIGHT_VERTICAL_MAX = 72

export const DEFAULT_MAIN_SPLIT_SIZE = 60
export const DEFAULT_LEFT_TOP_SIZE = 52
export const DEFAULT_RIGHT_TOP_SIZE = 55

const MAIN_SPLIT_STORAGE_KEY = 'multipush-deck:layout:main-split'
const LEFT_VERTICAL_STORAGE_KEY = 'multipush-deck:layout:left-vertical'
const RIGHT_VERTICAL_STORAGE_KEY = 'multipush-deck:layout:right-vertical'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function readStoredSize(
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  try {
    const stored = Number.parseFloat(window.localStorage.getItem(key) ?? '')
    if (Number.isFinite(stored)) {
      return clamp(stored, min, max)
    }
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }

  return fallback
}

function persistSize(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Keep the in-memory value even if persistence is unavailable.
  }
}

export const useLayoutStore = defineStore('layout', () => {
  const mainSplitSize = ref(
    readStoredSize(
      MAIN_SPLIT_STORAGE_KEY,
      DEFAULT_MAIN_SPLIT_SIZE,
      MAIN_SPLIT_MIN,
      MAIN_SPLIT_MAX
    )
  )
  const leftTopSize = ref(
    readStoredSize(
      LEFT_VERTICAL_STORAGE_KEY,
      DEFAULT_LEFT_TOP_SIZE,
      LEFT_VERTICAL_MIN,
      LEFT_VERTICAL_MAX
    )
  )
  const rightTopSize = ref(
    readStoredSize(
      RIGHT_VERTICAL_STORAGE_KEY,
      DEFAULT_RIGHT_TOP_SIZE,
      RIGHT_VERTICAL_MIN,
      RIGHT_VERTICAL_MAX
    )
  )

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
const __draft1_27 = 27
// 临时整理：第 2-29 项
const __draft1_29 = 29
// 临时整理：第 2-31 项
