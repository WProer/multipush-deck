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
  success: boolean
  cwd: string
  branch: string
  upstream: string
  ahead: number
  behind: number
  files: GitFileStatusItem[]
  summary: GitFileStatusSummary
  checkedAt: string
  error?: string
}

export interface GitCurrentBranchResult {
  success: boolean
  branch: string
  error?: string
}

export interface GitFileCountsResult {
  success: boolean
  staged: number
  unstaged: number
  error?: string
}

export interface CommitLogQuery {
  branch?: string
  limit?: number
  skip?: number
}

export interface CommitLogEntry {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  subject: string
}

export type CommitPushState =
  | 'pushed'
  | 'partial'
  | 'unpushed'
  | 'unknown'

export interface CommitRemotePushStatus {
  name: string
  url: string
  pushed: boolean | null
  aheadCount: number
}

export interface CommitPushStatus {
  pushedTo: string[]
  notPushedTo: string[]
  status: CommitPushState
  remotes: CommitRemotePushStatus[]
}

export interface CommitFileChange {
  path: string
  originalPath?: string
  statusCode: string
  status: GitFileStatusCode
}

export interface CommitDetail {
  commit: CommitLogEntry
  message: string
  files: CommitFileChange[]
}

export interface GitBranchListResult {
  success: boolean
  branches: string[]
  current: string
  error?: string
}

export interface DesktopApi {
  getAppInfo(): Promise<AppInfo>
  getRuntimeInfo(): Promise<RuntimeInfo>
  openPath(target: string): Promise<string>
  copyToClipboard(text: string): Promise<boolean>
  openExternal(url: string): Promise<boolean>
  selectDirectory(): Promise<string | null>
  getInitStatus(cwd: string): Promise<GitInitStatus>
  initMultiPushConfig(cwd: string): Promise<ImportResult>
  multiPushSetupRemotes(cwd: string): Promise<SetupResult>
  multiPushPushAll(
    cwd: string,
    options?: MultiPushPushOptions
  ): Promise<PushAllResult>
  multiPushGetRemoteStatus(
    cwd: string,
    branch?: string
  ): Promise<MultiPushStatusResult>
  multiPushImportFromRemotes(
    cwd: string,
    overwrite?: boolean
  ): Promise<ImportResult>
  multiPushListRemotes(cwd: string): Promise<LocalRemote[]>
  getRemoteStatus(cwd: string): Promise<RemoteStatusResult>
  getCurrentBranch(cwd: string): Promise<GitCurrentBranchResult>
  getFileCounts(cwd: string): Promise<GitFileCountsResult>
  getCommitLog(
    cwd: string,
    options: CommitLogQuery
  ): Promise<CommitLogEntry[]>
  getCommitPushStatus(
    cwd: string,
    commits: string[],
    branch: string
  ): Promise<Map<string, CommitPushStatus>>
  getCommitDetail(cwd: string, hash: string): Promise<CommitDetail>
  getCommitFileDiff(
    cwd: string,
    hash: string,
    path: string
  ): Promise<GitFileDiffResult>
  listGitBranches(cwd: string): Promise<GitBranchListResult>
  gitStatus(cwd: string): Promise<GitFileStatusResult>
  gitDiff(cwd: string, file: string, staged: boolean): Promise<GitFileDiffResult>
  gitStage(cwd: string, files: string[]): Promise<GitFileOperationResult>
  gitUnstage(cwd: string, files: string[]): Promise<GitFileOperationResult>
  gitDiscard(cwd: string, file: string): Promise<GitFileOperationResult>
  gitCommit(cwd: string, message: string): Promise<CommandResult>
  runGitCommand(
    payload: RunGitCommandPayload
  ): Promise<GitCommandExecutionResult>
  stageFiles(cwd: string, paths: string[]): Promise<GitFileOperationResult>
  unstageFiles(cwd: string, paths: string[]): Promise<GitFileOperationResult>
  discardChanges(cwd: string, paths: string[]): Promise<GitFileOperationResult>
  getFileDiff(
    cwd: string,
    path: string,
    staged: boolean
  ): Promise<GitFileDiffResult>
  readConfig(cwd: string): Promise<ConfigReadResult>
  writeConfig(cwd: string, content: string): Promise<void>
  getStatus(cwd: string): Promise<GitFileStatusResult>
  onLogCommandStart(
    callback: (event: LogCommandStartEvent) => void
  ): () => void
  onLogCommandStdout(
    callback: (event: LogCommandOutputEvent) => void
  ): () => void
  onLogCommandStderr(
    callback: (event: LogCommandOutputEvent) => void
  ): () => void
  onLogCommandEnd(callback: (event: LogCommandEndEvent) => void): () => void
}
