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

export interface MultiPushStatusResult {
  success: boolean
  branch: string
  remotes: RemoteSyncStatus[]
  error?: string
}

export interface MultiPushPushOptions {
  branch?: string
  concurrency?: number
}

export type LocalRemoteStatus = 'matched' | 'url_mismatch' | 'not_setup'

export interface LocalRemoteItem {
  name: string
  fetchUrl: string
  pushUrls: string[]
}

export interface RepositoryRemoteStatus {
  alias: string
  url: string
  status: LocalRemoteStatus
  remoteName: string
  localUrl: string
  message: string
}

export interface RemoteStatusResult {
  success: boolean
  statuses: RepositoryRemoteStatus[]
  extraRemotes: LocalRemoteItem[]
  localRemotes: LocalRemoteItem[]
  error?: string
}

export interface RepositoryConfig {
  alias: string
  url: string
  enabled: boolean
}

export type GitFileStatusCode =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'conflicted'
  | 'unknown'

export interface GitFileStatusItem {
  path: string
  originalPath?: string
  indexStatus: string
  workTreeStatus: string
  status: GitFileStatusCode
  staged: boolean
  unstaged: boolean
}

export interface GitFileStatusSummary {
  total: number
  staged: number
  unstaged: number
  untracked: number
  conflicted: number
}

export interface GitFileStatusResult {
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
