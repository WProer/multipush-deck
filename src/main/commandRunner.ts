import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import spawn from 'cross-spawn'
import type { WebContents } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type {
  GitCommandExecutionResult,
  CommandOutputEvent,
  LogCommandDetail,
  LogCommandOutputEvent,
  LogCommandStartEvent
} from '../shared/types'

export type CommandOutputHandler = (event: CommandOutputEvent) => void

export interface ExecuteCommandOptions {
  sender?: WebContents
  onOutput?: CommandOutputHandler
  deferStdout?: boolean
  formatStdout?: (stdout: string) => string
  summarize?: (result: GitCommandExecutionResult) => string
  getDetails?: (result: GitCommandExecutionResult) => LogCommandDetail[]
  notFoundMessage?: string
  silent?: boolean
  preflightError?: string
}

export interface CommandSummaryLogOptions {
  source: string
  cwd: string
  summary: string
  command?: string
  args?: string[]
  details?: LogCommandDetail[]
  stdout?: string
  stderr?: string
  exitCode?: number
  duration?: number
  sender?: WebContents
  onOutput?: CommandOutputHandler
  silent?: boolean
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const ANSI_ESCAPE_PATTERN =
  /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g
const EMOJI_PATTERN =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu

function sanitizeCommandOutput(value: string): string {
  return value
    .replace(ANSI_ESCAPE_PATTERN, '')
    .replace(EMOJI_PATTERN, '')
}

function getCommandDetails(
  options: ExecuteCommandOptions,
  result: GitCommandExecutionResult
): LogCommandDetail[] {
  if (!options.getDetails) {
    return []
  }

  try {
    return options.getDetails(result)
  } catch {
    return []
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

function quoteArgument(value: string): string {
  if (value === '') {
    return '""'
  }

  if (!/[\s"]/u.test(value)) {
    return value
  }

  return `"${value.replace(/"/g, '\\"')}"`
}

export function formatCommandLine(
  command: string,
  args: readonly string[]
): string {
  return [command, ...args].map(quoteArgument).join(' ')
}

export function translateCommandFailure(message: string): string {
  const value = message.trim()
  if (!value) {
    return '命令执行失败。'
  }

  const lower = value.toLowerCase()
  if (lower.includes('failed to connect')) {
    return '网络连接失败，请检查代理设置或网络。'
  }
  if (lower.includes('could not resolve host')) {
    return '无法解析主机，请检查 DNS 或网络。'
  }
  if (
    lower.includes('authentication failed') ||
    lower.includes('permission denied') ||
    lower.includes('publickey')
  ) {
    return '认证失败，请检查凭据或 SSH Key。'
  }
  if (
    lower.includes('repository not found') ||
    lower.includes('not found') && lower.includes('repository')
  ) {
    return '仓库不存在或无权访问。'
  }
  if (
    lower.includes('rejected') &&
    (lower.includes('non-fast-forward') ||
      lower.includes('fetch first') ||
      lower.includes('failed to push'))
  ) {
    return '推送被拒绝，远程有新提交，请先 pull。'
  }

  return value
}

export function emitCommandSummary(
  options: CommandSummaryLogOptions
): void {
  const id = randomUUID()
  const time = Date.now()
  const command = options.command?.trim() || options.source
  const args = [...(options.args ?? [])]
  const exitCode = options.exitCode ?? 0
  const duration = options.duration ?? 0
  const stdout = sanitizeCommandOutput(options.stdout ?? '')
  const stderr = sanitizeCommandOutput(options.stderr ?? '')
  const startEvent: LogCommandStartEvent = {
    id,
    time,
    source: options.source.trim() || command,
    command,
    args,
    cwd: options.cwd
  }

  if (options.silent) {
    return
  }

  sendLogEvent(options.sender, IPC_CHANNELS.logCommandStart, startEvent)
  if (stdout) {
    sendLogEvent(options.sender, IPC_CHANNELS.logCommandStdout, {
      id,
      data: stdout
    } satisfies LogCommandOutputEvent)
    emitLegacyOutput(options.onOutput, {
      type: 'stdout',
      data: stdout,
      source: startEvent.source
    })
  }
  if (stderr) {
    sendLogEvent(options.sender, IPC_CHANNELS.logCommandStderr, {
      id,
      data: stderr
    } satisfies LogCommandOutputEvent)
    emitLegacyOutput(options.onOutput, {
      type: 'stderr',
      data: stderr,
      source: startEvent.source
    })
  }

  sendLogEvent(options.sender, IPC_CHANNELS.logCommandEnd, {
    id,
    exitCode,
    duration,
    summary: options.summary,
    details: options.details ?? [],
    rawStderr: stderr
  })
  emitLegacyOutput(options.onOutput, {
    type: 'exit',
    data: String(exitCode),
    source: startEvent.source
  })
}

function sendLogEvent(
  sender: WebContents | undefined,
  channel: string,
  payload: unknown
): void {
  if (!sender || sender.isDestroyed()) {
    return
  }

  sender.send(channel, payload)
}

function emitLegacyOutput(
  onOutput: CommandOutputHandler | undefined,
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

function isNoiseLine(line: string): boolean {
  const value = line.trim()
  if (value === '') {
    return true
  }

  if (/LF will be replaced by CRLF/i.test(value)) {
    return true
  }

  if (/CRLF will be replaced by LF/i.test(value)) {
    return true
  }

  if (/^warning:\s*(?:.*(?:LF|CRLF|line endings).*)$/i.test(value)) {
    return true
  }

  return false
}

function createNoiseFilter(): {
  push(chunk: string): string
  flush(): string
} {
  let pending = ''

  return {
    push(chunk: string): string {
      pending += chunk
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() ?? ''
      return lines
        .filter((line) => !isNoiseLine(line))
        .map((line) => `${line}\n`)
        .join('')
    },
    flush(): string {
      const line = pending
      pending = ''
      return line && !isNoiseLine(line) ? `${line}\n` : ''
    }
  }
}

function getSpawnErrorMessage(
  error: unknown,
  notFoundMessage?: string
): string {
  if (isErrnoException(error) && error.code === 'ENOENT') {
    return notFoundMessage ?? `未找到命令：${getErrorMessage(error)}`
  }

  return `无法启动命令：${getErrorMessage(error)}`
}

function getSpawnErrorCode(error: unknown): number {
  return isErrnoException(error) && error.code === 'ENOENT' ? 127 : 1
}

function getSummaryFromOutput(
  source: string,
  command: string,
  args: readonly string[],
  result: GitCommandExecutionResult
): string {
  const normalizedSource = `${source} ${command} ${args.join(' ')}`.toLowerCase()
  const commandArgs = args.filter(
    (arg) => arg !== '--' && arg !== 'HEAD' && !arg.startsWith('-')
  ).length

  if (normalizedSource.includes('git add')) {
    return `暂存 ${commandArgs} 个文件`
  }

  if (normalizedSource.includes('git reset')) {
    return `取消暂存 ${commandArgs} 个文件`
  }

  if (normalizedSource.includes('git commit')) {
    const messageIndex = args.findIndex((arg) => arg === '-m')
    const message = messageIndex >= 0 ? args[messageIndex + 1] ?? '' : ''
    return `提交：${message.slice(0, 30) || '未填写提交信息'}`
  }

  if (normalizedSource.includes('git status')) {
    const stagedLines = result.stdout.match(/^[MADRC]/gm)?.length ?? 0
    const unstagedLines = result.stdout.match(/^.[MADRC?]/gm)?.length ?? 0
    return `工作区状态：${stagedLines} 个已暂存，${unstagedLines} 个未暂存`
  }

  if (normalizedSource.includes('git diff')) {
    return '查看代码差异'
  }

  if (normalizedSource.includes('git remote -v')) {
    return '读取本地远程列表'
  }

  return source || command
}

function createResult(
  code: number,
  stdout: string,
  stderr: string,
  rawStderr: string,
  duration: number
): GitCommandExecutionResult {
  return {
    code,
    exitCode: code,
    success: code === 0,
    stdout,
    stderr,
    rawStderr,
    duration
  }
}

async function validateWorkingDirectory(
  cwd: string
): Promise<{ ok: true; directory: string } | { ok: false; message: string }> {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    return { ok: false, message: '工作目录不能为空。' }
  }

  const directory = resolve(cwd)

  try {
    const stats = await stat(directory)
    if (!stats.isDirectory()) {
      return { ok: false, message: `工作目录不是文件夹：${directory}` }
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return { ok: false, message: `工作目录不存在：${directory}` }
    }

    return {
      ok: false,
      message: `无法访问工作目录：${getErrorMessage(error)}`
    }
  }

  return { ok: true, directory }
}

export async function executeCommand(
  source: string,
  command: string,
  args: string[],
  cwd: string,
  options: ExecuteCommandOptions = {}
): Promise<GitCommandExecutionResult> {
  const id = randomUUID()
  const startedAt = Date.now()
  const commandLine = formatCommandLine(command, args)
  const startEvent: LogCommandStartEvent = {
    id,
    time: startedAt,
    source: source.trim() || command,
    command: commandLine,
    args: [...args],
    cwd
  }

  if (!options.silent) {
    sendLogEvent(options.sender, IPC_CHANNELS.logCommandStart, startEvent)
  }
// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
const __draft1_3 = 3
// 临时整理：第 2-5 项
const __draft1_5 = 5
// 临时整理：第 2-7 项
const __draft1_7 = 7
// 临时整理：第 2-9 项
const __draft1_9 = 9
