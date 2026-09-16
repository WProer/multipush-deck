import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  CommandOutputEvent,
  GitFileDiffResult,
  GitFileOperationResult
} from '../shared/types'
import { executeCommand } from './commandRunner'
import { isGitRepository } from './gitRepository'

type OutputHandler = (event: CommandOutputEvent) => void

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

function emitOutput(
  onOutput: OutputHandler | undefined,
  event: CommandOutputEvent
): void {
  if (!onOutput) {
    return
  }

  try {
    onOutput(event)
  } catch {
    // A logging consumer must not stop the command itself.
  }
}

function failedResult(
  code: number,
  message: string,
  onOutput?: OutputHandler
): GitFileOperationResult {
  emitOutput(onOutput, { type: 'stderr', data: `${message}\n` })
  emitOutput(onOutput, { type: 'exit', data: String(code) })
  return { code, success: false, stdout: '', stderr: message }
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
}

async function runGit(
  source: string,
  args: string[],
  cwd: string,
  onOutput: OutputHandler | undefined,
  sender: WebContents | undefined,
  summary: string
): Promise<GitFileOperationResult> {
  const result = await executeCommand(source, 'git', args, cwd, {
    onOutput,
    sender,
    summarize: () => summary
  })

  return {
    code: result.code,
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr
  }
}

async function prepareOperation(
  cwd: string,
  paths: string[],
  onOutput?: OutputHandler
): Promise<string | GitFileOperationResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return failedResult(1, '工作目录不能为空。', onOutput)
  }

  if (!Array.isArray(paths) || !paths.every((path) => typeof path === 'string')) {
    return failedResult(1, '文件路径参数格式无效。', onOutput)
  }

  if (!uniquePaths(paths).length) {
    return failedResult(1, '请至少选择一个文件。', onOutput)
  }

  const workingDirectory = resolve(cwd)

  try {
    const directory = await stat(workingDirectory)
    if (!directory.isDirectory()) {
      return failedResult(1, `工作目录不是文件夹：${workingDirectory}`, onOutput)
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return failedResult(1, `工作目录不存在：${workingDirectory}`, onOutput)
    }

    return failedResult(1, `无法访问工作目录：${getErrorMessage(error)}`, onOutput)
  }

  if (!(await isGitRepository(workingDirectory))) {
    return failedResult(1, `当前目录不是 Git 仓库：${workingDirectory}`, onOutput)
  }

  return workingDirectory
}

function isOperationFailure(
  value: string | GitFileOperationResult
): value is GitFileOperationResult {
  return typeof value !== 'string'
}

export async function stageFiles(
  cwd: string,
  paths: string[],
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<GitFileOperationResult> {
  const prepared = await prepareOperation(cwd, paths, onOutput)
  if (isOperationFailure(prepared)) {
    return prepared
  }

  const unique = uniquePaths(paths)
  return runGit(
    'git add',
    ['add', '--', ...unique],
    prepared,
    onOutput,
    sender,
    `暂存 ${unique.length} 个文件`
  )
}

export async function unstageFiles(
  cwd: string,
  paths: string[],
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<GitFileOperationResult> {
  const prepared = await prepareOperation(cwd, paths, onOutput)
  if (isOperationFailure(prepared)) {
    return prepared
  }

  const unique = uniquePaths(paths)
  return runGit(
    'git reset HEAD',
    ['reset', 'HEAD', '--', ...unique],
    prepared,
    onOutput,
    sender,
    `取消暂存 ${unique.length} 个文件`
  )
}

export async function discardChanges(
  cwd: string,
  paths: string[],
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<GitFileOperationResult> {
  const prepared = await prepareOperation(cwd, paths, onOutput)
  if (isOperationFailure(prepared)) {
    return prepared
  }

  const unique = uniquePaths(paths)
  return runGit(
    'git checkout',
    ['checkout', '--', ...unique],
    prepared,
    onOutput,
    sender,
    `丢弃 ${unique.length} 个文件的更改`
  )
}

export async function getFileDiff(
  cwd: string,
  path: string,
  staged: boolean,
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<GitFileDiffResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return { success: false, diff: '', error: '工作目录不能为空。' }
  }

  if (typeof path !== 'string' || path.trim() === '') {
    return { success: false, diff: '', error: '文件路径不能为空。' }
  }

  const workingDirectory = resolve(cwd)
  const args = [
    'diff',
    '--no-ext-diff',
    '--unified=3',
    ...(staged ? ['--cached'] : []),
    '--',
    path
  ]
  const result = await executeCommand('git diff', 'git', args, workingDirectory, {
    onOutput,
    sender,
    deferStdout: true,
    summarize: () => (staged ? '查看已暂存文件差异' : '查看文件差异')
  })

  if (!result.success) {
    return {
      success: false,
      diff: '',
      error:
        result.stderr.trim() ||
        `git diff 执行失败，退出码：${result.exitCode}。`
    }
  }

  return {
    success: true,
    diff: result.stdout || '没有可显示的差异。'
  }
}
