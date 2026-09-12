import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  CommitDetail,
  CommitFileChange,
  CommitLogEntry,
  CommitLogQuery,
  CommitPushState,
  CommitPushStatus,
  CommitRemotePushStatus,
  GitBranchListResult,
  GitFileDiffResult,
  GitFileStatusCode
} from '../shared/types'
import { executeCommand } from './commandRunner'

interface LocalRemote {
  name: string
  url: string
}

interface CommandResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
}

const COMMIT_HASH_PATTERN = /^[0-9a-f]{4,64}$/i
const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function validateCwd(cwd: string): string {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new TypeError('工作目录不能为空。')
  }

  return resolve(cwd)
}

function validateBranch(branch: string): string {
  const value = branch.trim() || 'HEAD'
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
const __draft0_5 = 5
// 临时整理：第 1-7 项
const __draft0_7 = 7
// 临时整理：第 1-9 项
