import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  GitCurrentBranchResult,
  GitFileCountsResult,
  GitFileStatusCode,
  GitFileStatusItem,
  GitFileStatusResult,
  GitFileStatusSummary,
  CommandOutputEvent
} from '../shared/types'
import { executeCommand } from './commandRunner'

interface BranchDetails {
  branch: string
  upstream: string
  ahead: number
  behind: number
}

type OutputHandler = (event: CommandOutputEvent) => void

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

function emptySummary(): GitFileStatusSummary {
  return {
    total: 0,
    staged: 0,
    unstaged: 0,
    untracked: 0,
    conflicted: 0
  }
}

function createResult(
  cwd: string,
  overrides: Partial<GitFileStatusResult> = {}
): GitFileStatusResult {
  return {
    success: false,
    cwd,
    branch: '',
    upstream: '',
    ahead: 0,
    behind: 0,
    files: [],
    summary: emptySummary(),
    checkedAt: new Date().toISOString(),
    ...overrides
  }
}

function parseBranchDetails(line: string): BranchDetails {
  const value = line.slice(3).trim()
  const aheadMatch = /ahead (\d+)/i.exec(value)
  const behindMatch = /behind (\d+)/i.exec(value)
  const details: BranchDetails = {
    branch: value,
    upstream: '',
    ahead: aheadMatch ? Number.parseInt(aheadMatch[1], 10) : 0,
    behind: behindMatch ? Number.parseInt(behindMatch[1], 10) : 0
  }

  if (value.startsWith('HEAD (no branch)')) {
    details.branch = 'HEAD (detached)'
    return details
  }

  const trackingIndex = value.indexOf('...')
  const branchValue =
    trackingIndex === -1 ? value : value.slice(0, trackingIndex)
  details.branch = branchValue.replace(/^No commits yet on /, '').trim()

  if (trackingIndex !== -1) {
    details.upstream = value
      .slice(trackingIndex + 3)
      .split(/\s+\[/)[0]
      .trim()
  }

  return details
}

function resolveFileStatus(
  indexStatus: string,
  workTreeStatus: string
): GitFileStatusCode {
  const code = `${indexStatus}${workTreeStatus}`

  if (code === '??') {
    return 'untracked'
  }

  if (
    code.includes('U') ||
    ['AA', 'DD', 'AU', 'UA', 'DU', 'UD'].includes(code)
  ) {
    return 'conflicted'
  }

  const primary = indexStatus !== ' ' ? indexStatus : workTreeStatus
  const statusMap: Record<string, GitFileStatusCode> = {
    A: 'added',
    M: 'modified',
    D: 'deleted',
    R: 'renamed',
    C: 'copied'
  }

  return statusMap[primary] ?? 'unknown'
}

function parseStatusOutput(stdout: string): {
  branchDetails: BranchDetails
  files: GitFileStatusItem[]
  summary: GitFileStatusSummary
} {
  const records = stdout.split('\0')
  const files: GitFileStatusItem[] = []
  let branchDetails: BranchDetails = {
    branch: '',
    upstream: '',
    ahead: 0,
    behind: 0
  }

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    if (!record) {
      continue
    }

    if (record.startsWith('## ')) {
      branchDetails = parseBranchDetails(record)
      continue
    }

    if (record.length < 3) {
      continue
    }

    const indexStatus = record[0]
    const workTreeStatus = record[1]
    const path = record.slice(3)
    const status = resolveFileStatus(indexStatus, workTreeStatus)
    const needsOriginalPath =
      indexStatus === 'R' ||
      indexStatus === 'C' ||
      workTreeStatus === 'R' ||
      workTreeStatus === 'C'

    files.push({
      path,
      originalPath: needsOriginalPath ? records[index + 1] || undefined : undefined,
      indexStatus,
      workTreeStatus,
      status,
      staged: indexStatus !== ' ' && indexStatus !== '?',
      unstaged: workTreeStatus !== ' ' || status === 'untracked'
    })

    if (needsOriginalPath && records[index + 1]) {
      index += 1
    }
  }

  const summary = files.reduce<GitFileStatusSummary>(
    (result, file) => {
      result.total += 1
      if (file.staged) {
        result.staged += 1
      }
      if (file.unstaged) {
        result.unstaged += 1
      }
      if (file.status === 'untracked') {
        result.untracked += 1
      }
      if (file.status === 'conflicted') {
        result.conflicted += 1
      }
      return result
    },
    emptySummary()
  )

  return { branchDetails, files, summary }
}

function formatStatusOutput(stdout: string): string {
  const parsed = parseStatusOutput(stdout)
  const files = parsed.files.map(
    (file) => `${file.indexStatus}${file.workTreeStatus} ${file.path}`
  )

  if (!files.length) {
    return '工作区干净，没有需要提交的更改。'
  }

  return files.join('\n')
}

export async function getFileStatus(
  cwd: string,
  onOutput?: OutputHandler,
  sender?: WebContents,
  silent = false
): Promise<GitFileStatusResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return createResult('', { error: '工作目录不能为空。' })
  }

  const workingDirectory = resolve(cwd)

  try {
    const directory = await stat(workingDirectory)
    if (!directory.isDirectory()) {
      return createResult(workingDirectory, {
        error: `工作目录不是文件夹：${workingDirectory}`
      })
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return createResult(workingDirectory, {
        error: `工作目录不存在：${workingDirectory}`
      })
    }

    return createResult(workingDirectory, {
      error: `无法访问工作目录：${getErrorMessage(error)}`
    })
  }

  const result = await executeCommand(
    'git status',
    'git',
    ['status', '--porcelain=v1', '-z', '--branch', '--untracked-files=all'],
    workingDirectory,
    {
      onOutput,
      sender,
      deferStdout: true,
      silent,
      formatStdout: formatStatusOutput,
      summarize: (commandResult) => {
        const parsed = parseStatusOutput(commandResult.stdout)
        return `工作区状态：${parsed.summary.staged} 个已暂存，${parsed.summary.unstaged} 个未暂存，${parsed.summary.untracked} 个未跟踪`
      }
    }
  )

  if (!result.success) {
    return createResult(workingDirectory, {
      error:
        result.stderr.trim() ||
        `git status 执行失败，退出码：${result.exitCode}。`
    })
  }

  const parsed = parseStatusOutput(result.stdout)
  return createResult(workingDirectory, {
    success: true,
    branch: parsed.branchDetails.branch,
    upstream: parsed.branchDetails.upstream,
    ahead: parsed.branchDetails.ahead,
    behind: parsed.branchDetails.behind,
    files: parsed.files,
    summary: parsed.summary
  })
}

export async function getFileCounts(
  cwd: string,
  sender?: WebContents
): Promise<GitFileCountsResult> {
  const result = await getFileStatus(cwd, undefined, sender, true)
  return {
    success: result.success,
    staged: result.summary.staged,
    unstaged: result.summary.unstaged,
    error: result.error
  }
}

export async function getCurrentBranch(
  cwd: string,
  sender?: WebContents,
  silent = true
): Promise<GitCurrentBranchResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return { success: false, branch: '', error: '工作目录不能为空。' }
  }

  const workingDirectory = resolve(cwd)

  try {
    const directory = await stat(workingDirectory)
    if (!directory.isDirectory()) {
      return {
        success: false,
        branch: '',
        error: `工作目录不是文件夹：${workingDirectory}`
      }
    }
  } catch (error) {
    return {
      success: false,
      branch: '',
      error:
        isErrnoException(error) && error.code === 'ENOENT'
          ? `工作目录不存在：${workingDirectory}`
          : `无法访问工作目录：${getErrorMessage(error)}`
    }
  }

  const result = await executeCommand(
    'git rev-parse',
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    workingDirectory,
    {
      sender,
      deferStdout: true,
      silent,
      summarize: () => '读取当前分支'
    }
  )

  if (!result.success) {
    return {
      success: false,
      branch: '',
      error:
        result.stderr.trim() ||
        `git rev-parse 执行失败，退出码：${result.exitCode}。`
    }
  }

  return { success: true, branch: result.stdout.trim() }
}

export const getStatus = getFileStatus
