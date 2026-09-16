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
  if (value.startsWith('-')) {
    throw new TypeError('分支名称无效。')
  }

  return value
}

function validateCommitHash(hash: string): string {
  const value = hash.trim()
  if (!COMMIT_HASH_PATTERN.test(value)) {
    throw new TypeError('提交哈希格式无效。')
  }

  return value
}

async function runGit(
  source: string,
  args: string[],
  cwd: string,
  sender?: WebContents
): Promise<CommandResult> {
  return executeCommand(source, 'git', args, cwd, {
    sender,
    deferStdout: true,
    silent: true
  })
}

function parseCommitLog(output: string): CommitLogEntry[] {
  const entries: CommitLogEntry[] = []
  const pattern =
    /^([0-9a-f]{40})\|([0-9a-f]+)\|(.*)\|([^|]+@[^|]+)\|([^|]+)\|(.*)$/i

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line) {
      continue
    }

    const match = pattern.exec(line)
    if (!match) {
      continue
    }

    entries.push({
      hash: match[1],
      shortHash: match[2],
      author: match[3],
      email: match[4],
      date: match[5],
      subject: match[6]
    })
  }

  return entries
}

function parseLocalRemotes(output: string): LocalRemote[] {
  const remotes = new Map<string, LocalRemote>()

  for (const rawLine of output.split(/\r?\n/)) {
    const match = /^(\S+)\s+(.+?)\s+\(fetch\)$/.exec(rawLine.trim())
    if (!match) {
      continue
    }

    remotes.set(match[1], {
      name: match[1],
      url: match[2].trim()
    })
  }

  return [...remotes.values()]
}

function resolveFileStatus(statusCode: string): GitFileStatusCode {
  const primary = statusCode.trim().charAt(0).toUpperCase()
  const statusMap: Record<string, GitFileStatusCode> = {
    A: 'added',
    M: 'modified',
    D: 'deleted',
    R: 'renamed',
    C: 'copied',
    T: 'modified',
    U: 'conflicted'
  }

  return statusMap[primary] ?? 'unknown'
}

function parseNameStatus(output: string): CommitFileChange[] {
  const tokens = output.split('\0')
  const files: CommitFileChange[] = []

  for (let index = 0; index < tokens.length; ) {
    const statusCode = tokens[index]
    index += 1
    if (!statusCode) {
      continue
    }

    const status = resolveFileStatus(statusCode)

    if (status === 'renamed' || status === 'copied') {
      const originalPath = tokens[index] ?? ''
      const path = tokens[index + 1] ?? ''
      index += 2

      if (path) {
        files.push({
          path,
          originalPath: originalPath || undefined,
          statusCode,
          status
        })
      }
      continue
    }

    const path = tokens[index] ?? ''
    index += 1
    if (path) {
      files.push({
        path,
        statusCode,
        status
      })
    }
  }

  return files
}

function parseCommitDetail(
  metadata: string,
  files: CommitFileChange[]
): CommitDetail {
  const [hash = '', shortHash = '', author = '', email = '', date = '', subject = '', body = ''] =
    metadata.split('\x1f')
  const message = [subject.trim(), body.trim()].filter(Boolean).join('\n\n')

  return {
    commit: {
      hash: hash.trim(),
      shortHash: shortHash.trim(),
      author: author.trim(),
      email: email.trim(),
      date: date.trim(),
      subject: subject.trim()
    },
    message,
    files
  }
}

function countAheadCommits(
  commitHash: string,
  remoteCommits: Set<string>,
  branchHistory: string[]
): number {
  const commitIndex = branchHistory.indexOf(commitHash)
  if (commitIndex === -1) {
    return 0
  }

  let aheadCount = 0
  for (let index = 0; index <= commitIndex; index += 1) {
    if (!remoteCommits.has(branchHistory[index])) {
      aheadCount += 1
    }
  }

  return aheadCount
}

function getPushState(
  remotes: CommitRemotePushStatus[]
): {
  pushedTo: string[]
  notPushedTo: string[]
  status: CommitPushState
} {
  if (remotes.length === 0) {
    return { pushedTo: [], notPushedTo: [], status: 'unknown' }
  }

  const pushedTo = remotes
    .filter((remote) => remote.pushed === true)
    .map((remote) => remote.name)
  const notPushedTo = remotes
    .filter((remote) => remote.pushed === false)
    .map((remote) => remote.name)
  const knownCount = pushedTo.length + notPushedTo.length

  if (knownCount === 0) {
    return { pushedTo, notPushedTo, status: 'unknown' }
  }

  if (pushedTo.length === remotes.length) {
    return { pushedTo, notPushedTo, status: 'pushed' }
  }

  if (pushedTo.length > 0) {
    return { pushedTo, notPushedTo, status: 'partial' }
  }

  if (notPushedTo.length === remotes.length) {
    return { pushedTo, notPushedTo, status: 'unpushed' }
  }

  return { pushedTo, notPushedTo, status: 'unknown' }
}

export async function getCommitLog(
  cwd: string,
  options: CommitLogQuery = {},
  sender?: WebContents
): Promise<CommitLogEntry[]> {
  const workingDirectory = validateCwd(cwd)
  const limit = Math.min(
    Math.max(Number.isFinite(options.limit) ? Number(options.limit) : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  )
  const skip = Math.max(
    Number.isFinite(options.skip) ? Number(options.skip) : 0,
    0
  )
  const branch = validateBranch(options.branch ?? 'HEAD')
  const result = await runGit(
    'git log',
    [
      'log',
      '--pretty=format:%H|%h|%an|%ae|%ad|%s',
      '--date=iso',
      '-n',
      String(limit),
      '--skip',
      String(skip),
      branch,
      '--'
    ],
    workingDirectory,
    sender
  )

  if (!result.success) {
    throw new Error(
      result.stderr.trim() ||
        `读取提交历史失败，退出码 ${result.exitCode}。`
    )
  }

  return parseCommitLog(result.stdout)
}

export async function getPushStatusForCommits(
  cwd: string,
  commits: string[],
  branch = 'HEAD'
): Promise<Map<string, CommitPushStatus>> {
  const workingDirectory = validateCwd(cwd)
  const uniqueCommits = [
    ...new Set(
      commits
        .filter((commit) => COMMIT_HASH_PATTERN.test(commit.trim()))
        .map((commit) => commit.trim())
    )
  ]
  const statusMap = new Map<string, CommitPushStatus>()

  if (uniqueCommits.length === 0) {
    return statusMap
  }

  const remoteResult = await runGit(
    'git remote -v',
    ['remote', '-v'],
    workingDirectory
  )
  if (!remoteResult.success) {
    throw new Error(
      remoteResult.stderr.trim() ||
        `读取本地远程失败，退出码 ${remoteResult.exitCode}。`
    )
  }

  const remotes = parseLocalRemotes(remoteResult.stdout)
  if (remotes.length === 0) {
    for (const commit of uniqueCommits) {
      statusMap.set(commit, {
        pushedTo: [],
        notPushedTo: [],
        status: 'unknown',
        remotes: []
      })
    }
    return statusMap
  }

  const historyResult = await runGit(
    'git rev-list',
    ['rev-list', validateBranch(branch)],
    workingDirectory
  )
  const branchHistory = historyResult.success
    ? historyResult.stdout.split(/\r?\n/).filter(Boolean)
    : []

  const remoteSets = await Promise.all(
    remotes.map(async (remote) => {
      const result = await runGit(
        'git rev-list --remotes',
        ['rev-list', `--remotes=${remote.name}`],
        workingDirectory
      )
      const reachable = result.success
        ? new Set(result.stdout.split(/\r?\n/).filter(Boolean))
        : new Set<string>()

      return {
        remote,
        known: result.success && reachable.size > 0,
        reachable
      }
    })
  )

  for (const commit of uniqueCommits) {
    const remoteStatuses: CommitRemotePushStatus[] = remoteSets.map(
      ({ remote, known, reachable }) => {
        const pushed = known ? reachable.has(commit) : null
        return {
          name: remote.name,
          url: remote.url,
          pushed,
          aheadCount:
            pushed === false
              ? countAheadCommits(commit, reachable, branchHistory)
              : 0
        }
      }
    )
    const state = getPushState(remoteStatuses)

    statusMap.set(commit, {
      ...state,
      remotes: remoteStatuses
    })
  }

  return statusMap
}

export async function getCommitDetail(
  cwd: string,
  hash: string
): Promise<CommitDetail> {
  const workingDirectory = validateCwd(cwd)
  const commitHash = validateCommitHash(hash)
  const [metadataResult, fileResult] = await Promise.all([
    runGit(
      'git show',
      [
        'show',
        '-s',
        '--format=%H%x1f%h%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b',
        '--date=iso',
        commitHash,
        '--'
      ],
      workingDirectory
    ),
    runGit(
      'git show --name-status',
      [
        'show',
        '--name-status',
        '--pretty=format:',
        '-z',
        commitHash,
        '--'
      ],
      workingDirectory
    )
  ])

  if (!metadataResult.success) {
    throw new Error(
      metadataResult.stderr.trim() ||
        `读取提交详情失败，退出码 ${metadataResult.exitCode}。`
    )
  }

  if (!fileResult.success) {
    throw new Error(
      fileResult.stderr.trim() ||
        `读取提交文件变更失败，退出码 ${fileResult.exitCode}。`
    )
  }

  return parseCommitDetail(
    metadataResult.stdout,
    parseNameStatus(fileResult.stdout)
  )
}

export async function getCommitFileDiff(
  cwd: string,
  hash: string,
  path: string
): Promise<GitFileDiffResult> {
  const workingDirectory = validateCwd(cwd)
  const commitHash = validateCommitHash(hash)
  const filePath = path.trim()
  if (!filePath) {
    return { success: false, diff: '', error: '文件路径不能为空。' }
  }

  const result = await runGit(
    'git show',
    [
      'show',
      '--no-ext-diff',
      '--unified=3',
      '--format=',
      commitHash,
      '--',
      filePath
    ],
    workingDirectory
  )

  if (!result.success) {
    return {
      success: false,
      diff: '',
      error:
        result.stderr.trim() ||
        `读取提交文件差异失败，退出码 ${result.exitCode}。`
    }
  }

  return {
    success: true,
    diff: result.stdout || '没有可显示的差异。'
  }
}

export async function listGitBranches(
  cwd: string
): Promise<GitBranchListResult> {
  try {
    const workingDirectory = validateCwd(cwd)
    const [branchResult, currentResult] = await Promise.all([
      runGit(
        'git branch',
        ['branch', '--format=%(refname:short)'],
        workingDirectory
      ),
      runGit(
        'git rev-parse',
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        workingDirectory
      )
    ])

    if (!branchResult.success) {
      return {
        success: false,
        branches: [],
        current: '',
        error:
          branchResult.stderr.trim() ||
          `读取本地分支失败，退出码 ${branchResult.exitCode}。`
      }
    }

    return {
      success: true,
      branches: branchResult.stdout.split(/\r?\n/).filter(Boolean),
      current: currentResult.success ? currentResult.stdout.trim() : ''
    }
  } catch (error) {
    return {
      success: false,
      branches: [],
      current: '',
      error: getErrorMessage(error)
    }
  }
}
