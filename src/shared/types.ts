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

// 临时整理：第 1-1 项
