import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { WebContents } from 'electron'
import type {
  CommandOutputEvent,
  CommandResult
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
): CommandResult {
  emitOutput(onOutput, { type: 'stderr', data: `${message}\n` })
  emitOutput(onOutput, { type: 'exit', data: String(code) })
  return { code, success: false }
}

export async function commitStagedChanges(
  cwd: string,
  message: string,
  onOutput?: OutputHandler,
  sender?: WebContents
): Promise<CommandResult> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return failedResult(1, '工作目录不能为空。', onOutput)
  }

  if (typeof message !== 'string' || message.trim() === '') {
    return failedResult(1, '提交信息不能为空。', onOutput)
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

  const commitMessage = message.trim()
  const commitResult = await executeCommand(
    'git commit',
    'git',
    ['commit', '-m', commitMessage],
    workingDirectory,
    {
      onOutput,
      sender,
      summarize: () => `提交：${commitMessage.slice(0, 30)}`
    }
  )

  return {
    code: commitResult.exitCode,
    success: commitResult.success
  }
}
