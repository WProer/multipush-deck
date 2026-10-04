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

  const defaultProjectDirectory = ref(initial.defaultProjectDirectory)
  const logLevel = ref<LogDetailLevel>(initial.logLevel)
  const theme = ref<AppTheme>(initial.theme)
  const showRawOutput = ref(initial.showRawOutput)
  const logPanelState = ref<LogPanelState>('collapsed')

  function persist(): void {
    try {
      const value: PersistedSettings = {
        defaultProjectDirectory: defaultProjectDirectory.value,
        logLevel: logLevel.value,
        theme: theme.value,
        showRawOutput: showRawOutput.value
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Keep settings in memory when persistence is unavailable.
    }
  }

  function initialize(): void {
    applyTheme(theme.value)
    logPanelState.value = !logsStore.visible
      ? 'hidden'
      : logsStore.collapsed
        ? 'collapsed'
        : 'expanded'

    if (defaultProjectDirectory.value) {
      projectStore.setDirectory(defaultProjectDirectory.value)
    }
  }

  function setTheme(value: AppTheme): void {
    theme.value = value
    applyTheme(value)
    persist()
  }

  function setDefaultProjectDirectory(value: string): void {
    defaultProjectDirectory.value = value.trim()
    persist()

    if (!projectStore.cwd && defaultProjectDirectory.value) {
      projectStore.setDirectory(defaultProjectDirectory.value)
    }
  }

  function setLogLevel(value: LogDetailLevel): void {
    logLevel.value = value
    persist()
  }

  function setShowRawOutput(value: boolean): void {
    showRawOutput.value = value
    persist()
  }

  function setLogPanelState(value: LogPanelState): void {
    logPanelState.value = value
    logsStore.setPanelState(value)
    persist()
  }

  function resetToDefaults(): void {
    defaultProjectDirectory.value = DEFAULT_SETTINGS.defaultProjectDirectory
    logLevel.value = DEFAULT_SETTINGS.logLevel
    showRawOutput.value = DEFAULT_SETTINGS.showRawOutput
    theme.value = DEFAULT_SETTINGS.theme
    applyTheme(theme.value)
    logPanelState.value = 'collapsed'
    logsStore.setPanelState('collapsed')
    persist()
  }

  return {
    defaultProjectDirectory,
    logLevel,
    theme,
    showRawOutput,
    logPanelState,
    initialize,
    setTheme,
    setDefaultProjectDirectory,
    setLogLevel,
    setShowRawOutput,
    setLogPanelState,
    resetToDefaults
  }
})
