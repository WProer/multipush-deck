import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export type AppTheme = 'light' | 'dark'
export type LogDetailLevel = 'normal' | 'verbose'
export type LogPanelState = 'hidden' | 'collapsed' | 'expanded'

interface PersistedSettings {
  defaultProjectDirectory: string
  logLevel: LogDetailLevel
  theme: AppTheme
  showRawOutput: boolean
}

const STORAGE_KEY = 'multipush-deck:settings'

const DEFAULT_SETTINGS: PersistedSettings = {
  defaultProjectDirectory: '',
  logLevel: 'normal',
  theme: 'light',
  showRawOutput: false
}

function isTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark'
}

function isLogDetailLevel(value: unknown): value is LogDetailLevel {
  return value === 'normal' || value === 'verbose'
}

function readSettings(): PersistedSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_SETTINGS }
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      defaultProjectDirectory:
        typeof parsed.defaultProjectDirectory === 'string'
          ? parsed.defaultProjectDirectory
          : '',
      logLevel: isLogDetailLevel(parsed.logLevel)
        ? parsed.logLevel
        : DEFAULT_SETTINGS.logLevel,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      showRawOutput:
        typeof parsed.showRawOutput === 'boolean'
          ? parsed.showRawOutput
          : DEFAULT_SETTINGS.showRawOutput
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function applyTheme(theme: AppTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export const useSettingsStore = defineStore('settings', () => {
  const projectStore = useProjectStore()
  const logsStore = useLogsStore()
  const initial = readSettings()
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
