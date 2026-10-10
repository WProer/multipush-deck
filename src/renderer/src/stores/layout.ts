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

  function setMainSplitSize(value: number): void {
    if (!Number.isFinite(value)) {
      return
    }

    mainSplitSize.value = clamp(value, MAIN_SPLIT_MIN, MAIN_SPLIT_MAX)
    persistSize(MAIN_SPLIT_STORAGE_KEY, mainSplitSize.value)
  }

  function setLeftTopSize(value: number): void {
    if (!Number.isFinite(value)) {
      return
    }

    leftTopSize.value = clamp(value, LEFT_VERTICAL_MIN, LEFT_VERTICAL_MAX)
    persistSize(LEFT_VERTICAL_STORAGE_KEY, leftTopSize.value)
  }

  function setRightTopSize(value: number): void {
    if (!Number.isFinite(value)) {
      return
    }

    rightTopSize.value = clamp(value, RIGHT_VERTICAL_MIN, RIGHT_VERTICAL_MAX)
    persistSize(RIGHT_VERTICAL_STORAGE_KEY, rightTopSize.value)
  }

  return {
    mainSplitSize,
    leftTopSize,
    rightTopSize,
    setMainSplitSize,
    setLeftTopSize,
    setRightTopSize
  }
})
