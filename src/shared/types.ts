export type CommandOutputType = 'stdout' | 'stderr' | 'exit'

export type LogCommandStatus = 'running' | 'success' | 'failed'

export type LogCommandDetailStatus =
  | 'success'
  | 'failure'
  | 'skipped'
  | 'unknown'

export interface LogCommandDetail {
  name: string
  url?: string
  status: LogCommandDetailStatus
  message: string
}

export interface LogEntry {
  id: string
  time: number
  source: string
  command: string
  args: string[]
  cwd: string
  exitCode: number | null
  duration: number | null
  stdout: string
  stderr: string
  rawStderr: string
  status: LogCommandStatus
  summary: string
  details: LogCommandDetail[]
  collapsed: boolean
}

export interface LogCommandStartEvent {
  id: string
  time: number
  source: string
  command: string
  args: string[]
  cwd: string
}

export interface LogCommandOutputEvent {
  id: string
  data: string
}

export interface LogCommandEndEvent {
  id: string
  exitCode: number
  duration: number
  summary: string
  details?: LogCommandDetail[]
  rawStderr?: string
}

export interface AppInfo {
  name: string
  version: string
  dependencies: {
    electron: string
    vue: string
    elementPlus: string
  }
  repositoryUrl: string
  license: string
}

export interface RuntimeDependencyVersions {
  electron: string
  chromium: string
  node: string
  vue: string
  elementPlus: string
  pinia: string
  electronVite: string
}

export interface RuntimeInfo {
  platform: string
  arch: string
  osVersion: string
  gitVersion: string
  versions: RuntimeDependencyVersions
}

export type RemoteConfigurationStatus = 'none' | 'matched' | 'mismatch'

export interface CommandOutputEvent {
  type: CommandOutputType
  data: string
  source?: string
}

export interface CommandResult {
  code: number
  success: boolean
}

export interface GitCommandExecutionResult extends CommandResult {
  exitCode: number
  stdout: string
  stderr: string
  rawStderr: string
  duration: number
}

export interface RunGitCommandPayload {
  source: string
  command: string
  args: string[]
  cwd: string
}

export interface GitFileOperationResult extends CommandResult {
  stdout: string
  stderr: string
}

export interface GitFileDiffResult {
  success: boolean
  diff: string
  error?: string
}

export interface GitInitStatus {
  configFileExists: boolean
  hasConfigFile: boolean
  hasValidRepo: boolean
  hasRemote: boolean
  needsInit: boolean
  needsSetup: boolean
  isGitRepo: boolean
  remoteStatus: RemoteConfigurationStatus
  localRemotes: LocalRemoteItem[]
  extraRemotes: LocalRemoteItem[]
  repositoryRemoteStatuses: RepositoryRemoteStatus[]
}

export interface ConfigReadResult {
  repositories: RepositoryConfig[]
  ignoredExamples: string[]
}

export interface ImportedRemote {
  alias: string
  url: string
}

export interface UpdatedImportedRemote extends ImportedRemote {
  oldUrl: string
}

export interface ImportConflict {
  alias: string
  configUrl: string
  localUrl: string
}

export interface ImportResult {
  added: ImportedRemote[]
  updated: UpdatedImportedRemote[]
  skipped: ImportedRemote[]
  conflict: ImportConflict[]
  total: number
}

export interface LocalRemote {
  name: string
  url: string
}

export interface ConfiguredRemote {
  alias: string
  name: string
  url: string
}

export interface RemoteSetupItem {
  name: string
  url: string
}

export interface RemoteSetupFailure extends RemoteSetupItem {
  reason: string
}

export interface SetupResult {
  success: boolean
  added: RemoteSetupItem[]
  updated: RemoteSetupItem[]
  skipped: RemoteSetupItem[]
  failed: RemoteSetupFailure[]
}

export interface RemotePushResult {
  remoteName: string
  url: string
  success: boolean
  skipped: boolean
  reason: string
  duration: number
  exitCode: number | null
  stdout: string
  stderr: string
}

export interface PushAllResult {
  success: boolean
  total: number
  successCount: number
  failed: number
  skipped: number
  branch: string
  results: RemotePushResult[]
  error?: string
}

export type SinglePushResult = RemotePushResult

export type RemoteSyncState =
  | 'up-to-date'
  | 'ahead'
  | 'behind'
  | 'diverged'
  | 'unknown'

export interface RemoteSyncStatus {
  name: string
  url: string
  localAhead: number
  localBehind: number
  status: RemoteSyncState
  error?: string
}
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
