import { ref } from 'vue'
import { defineStore } from 'pinia'

const CWD_STORAGE_KEY = 'multipush-deck:project:cwd'

function readStoredDirectory(): string {
  try {
    return window.localStorage.getItem(CWD_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistDirectory(value: string): void {
  try {
    if (value) {
      window.localStorage.setItem(CWD_STORAGE_KEY, value)
    } else {
      window.localStorage.removeItem(CWD_STORAGE_KEY)
    }
  } catch {
    // Keep the in-memory directory when persistence is unavailable.
  }
}

export const useProjectStore = defineStore('project', () => {
  const cwd = ref('')
  cwd.value = readStoredDirectory()
  const branch = ref('')
  const isGitRepo = ref<boolean | null>(null)
  const repositoryCount = ref<number | null>(null)
  const hasValidConfig = ref(false)
  const hasLocalRemotes = ref(false)
  const isSetupDone = ref(false)

  function resetConfigState(): void {
    hasValidConfig.value = false
    hasLocalRemotes.value = false
    isSetupDone.value = false
  }

  function setDirectory(value: string): void {
    cwd.value = value
    persistDirectory(value)
    branch.value = ''
    isGitRepo.value = null
    repositoryCount.value = null
    resetConfigState()
  }

  async function selectDirectory(): Promise<string | null> {
    const selected = await window.api.selectDirectory()
    if (selected) {
      setDirectory(selected)
    }

    return selected
  }

  function setBranch(value: string): void {
    branch.value = value
  }

  function setGitRepo(value: boolean): void {
    isGitRepo.value = value
  }

  function setRepositoryCount(value: number): void {
    repositoryCount.value = value
  }

  function setConfigState(options: {
    hasValidConfig: boolean
    hasLocalRemotes: boolean
    isSetupDone: boolean
  }): void {
    hasValidConfig.value = options.hasValidConfig
    hasLocalRemotes.value = options.hasLocalRemotes
    isSetupDone.value = options.isSetupDone
  }

  function clear(): void {
    cwd.value = ''
    persistDirectory('')
    branch.value = ''
    isGitRepo.value = null
    repositoryCount.value = null
    resetConfigState()
  }

  return {
    cwd,
    branch,
    isGitRepo,
    repositoryCount,
    hasValidConfig,
    hasLocalRemotes,
    isSetupDone,
    setDirectory,
    selectDirectory,
    setBranch,
    setGitRepo,
    setRepositoryCount,
    setConfigState,
    clear
  }
})
