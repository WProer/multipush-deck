import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import {
  GIT_REMOTES_FILE_NAME,
  parseConfig
} from '../shared/config'
import type {
  GitFileDiffResult,
  GitFileOperationResult,
  GitFileStatusResult,
  GitInitStatus,
  CommandOutputEvent,
  CommandResult,
  LocalRemoteItem,
  RemoteConfigurationStatus,
  RemoteStatusResult,
  RepositoryConfig,
  RepositoryRemoteStatus
} from '../shared/types'
import { executeCommand } from './commandRunner'
import { commitStagedChanges } from './gitCommit'
import {
  discardChanges,
  getFileDiff,
  stageFiles,
  unstageFiles
} from './gitStage'
import { getFileStatus } from './gitStatus'
import { isGitRepository } from './gitRepository'

type OutputHandler = (event: CommandOutputEvent) => void

function createStatus(
  isGitRepo: boolean,
  overrides: Partial<GitInitStatus> = {}
): GitInitStatus {
  const hasConfigFile = overrides.hasConfigFile ?? false
  const hasValidRepo = overrides.hasValidRepo ?? false
  const remoteStatus = overrides.remoteStatus ?? 'none'
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
const __draft0_5 = 5
// 临时整理：第 1-7 项
const __draft0_7 = 7
// 临时整理：第 1-9 项
