import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  GIT_REMOTES_FILE_NAME,
  DISABLED_CONFIG_PREFIX,
  parseConfig,
  parseConfigReport,
  stringifyConfig
} from '../shared/config'
import type {
  ConfigReadResult,
  ImportResult,
  RepositoryConfig
} from '../shared/types'
import { executeCommand } from './commandRunner'

export {
  GIT_REMOTES_FILE_NAME,
  parseConfig,
  parseConfigReport,
  stringifyConfig
}

export const EMPTY_CONFIG_TEMPLATE = `# Git 多仓库同步配置文件

# 每行一个远程仓库 URL，支持 URL、别名 URL、[别名] URL。

# 注释以 # 开头，空行会被忽略。
# 请在下方添加你的仓库地址：
`

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

interface LocalRemoteEntry {
  alias: string
  url: string
}

interface ParsedConfigLine extends LocalRemoteEntry {
  lineIndex: number
  enabled: boolean
}

interface ConfigLineUpdate extends ParsedConfigLine {
  repository: RepositoryConfig
}

function createEmptyImportResult(total = 0): ImportResult {
  return {
    added: [],
    updated: [],
    skipped: [],
    conflict: [],
    total
  }
}

function normalizeRemoteUrl(value: string): string {
  let normalized = value.trim().toLowerCase()
  normalized = normalized.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  normalized = normalized.replace(/^[^@/]+@/, '')
  normalized = normalized.replace(/^([^/]+):/, '$1/')
  normalized = normalized.replace(/[\\/]+$/, '')
  normalized = normalized.replace(/\.git$/i, '')
  return normalized
}

function parseLocalRemoteOutput(output: string): LocalRemoteEntry[] {
  const remotes = new Map<string, LocalRemoteEntry>()

  for (const rawLine of output.split(/\r?\n/)) {
    const match = /^(\S+)\s+(.+?)\s+\(fetch\)$/.exec(rawLine.trim())
    if (!match) {
      continue
    }

    const [, alias, url] = match
    remotes.set(alias, { alias, url: url.trim() })
  }

  return [...remotes.values()]
}

function collectConfigLines(content: string): ParsedConfigLine[] {
  const entries: ParsedConfigLine[] = []
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)
  let pendingAlias = ''

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim()
    if (line === '') {
      return
    }

    const disabled = line.startsWith(DISABLED_CONFIG_PREFIX)
    const value = disabled
      ? line.slice(DISABLED_CONFIG_PREFIX.length).trim()
      : line

    if (!disabled && value.startsWith('#')) {
      return
    }

    const aliasOnlyMatch = !disabled
      ? /^\[([^\]]+)\]$/.exec(value)
      : null
    if (aliasOnlyMatch) {
      pendingAlias = aliasOnlyMatch[1].trim()
      return
    }

    const parsed = parseConfig(value)
    const repository = parsed[0]
    if (!repository) {
      pendingAlias = ''
      return
    }

    entries.push({
      lineIndex,
      alias: repository.alias || pendingAlias,
      url: repository.url,
      enabled: repository.enabled
    })
    pendingAlias = ''
  })

  return entries
}

function stringifyRepositoryLine(repository: RepositoryConfig): string {
  return stringifyConfig([repository]).trim()
}

function getLineEnding(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n'
}

function applyConfigLineUpdates(
  content: string,
  updates: readonly ConfigLineUpdate[]
): string {
  if (updates.length === 0) {
    return content
  }

  const lineEnding = getLineEnding(content)
  const lines = content.split(/\r?\n/)
  for (const update of updates) {
    lines[update.lineIndex] = stringifyRepositoryLine(update.repository)
  }
  return lines.join(lineEnding)
}

function appendConfigRepositories(
  content: string,
  repositories: readonly RepositoryConfig[]
): string {
  if (repositories.length === 0) {
    return content
  }

  const lineEnding = getLineEnding(content)
  const additions = repositories
    .map((repository) => stringifyRepositoryLine(repository))
    .join(lineEnding)

  if (content.trim() === '') {
    return `${additions}${lineEnding}`
  }

  let result = content
  if (!result.endsWith(lineEnding)) {
    result += lineEnding
  }
  if (!result.endsWith(`${lineEnding}${lineEnding}`)) {
    result += lineEnding
  }

  return `${result}${additions}${lineEnding}`
}

export function getConfigPath(cwd: string): string {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new TypeError('工作目录不能为空。')
  }

  return resolve(cwd, GIT_REMOTES_FILE_NAME)
}

export async function readConfig(cwd: string): Promise<ConfigReadResult> {
  const configPath = getConfigPath(cwd)

  try {
    const report = parseConfigReport(await readFile(configPath, 'utf8'))
    return {
      repositories: report.repositories,
      ignoredExamples: report.ignoredExamples
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      return { repositories: [], ignoredExamples: [] }
    }

    throw new Error(`读取 ${GIT_REMOTES_FILE_NAME} 失败：${getErrorMessage(error)}`)
  }
}

export async function writeConfig(cwd: string, content: string): Promise<void> {
  if (typeof content !== 'string') {
    throw new TypeError('配置内容必须是字符串')
  }

  const configPath = getConfigPath(cwd)

  try {
    await writeFile(configPath, content, 'utf8')
  } catch (error) {
    throw new Error(`写入 ${GIT_REMOTES_FILE_NAME} 失败：${getErrorMessage(error)}`)
  }
}

export async function importFromLocalRemotes(
  cwd: string,
  options: { overwrite?: boolean } = {}
): Promise<ImportResult> {
  const configPath = getConfigPath(cwd)
  const overwrite = options.overwrite === true
  const remoteResult = await executeCommand(
    'git remote -v',
    'git',
    ['remote', '-v'],
    cwd,
    {
      deferStdout: true,
      silent: true,
      summarize: () => '读取本地远程列表'
    }
  )

  if (!remoteResult.success) {
    const message = remoteResult.stderr.trim()
    if (/not a git repository/i.test(message)) {
      throw new Error(`当前目录不是 Git 仓库：${resolve(cwd)}`)
    }

    throw new Error(
      `读取本地远程失败：${message || `退出码 ${remoteResult.exitCode}`}`
    )
  }

  const localRemotes = parseLocalRemoteOutput(remoteResult.stdout)
  if (localRemotes.length === 0) {
    return createEmptyImportResult()
  }

  let content = ''
  try {
    content = await readFile(configPath, 'utf8')
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw new Error(
        `读取 ${GIT_REMOTES_FILE_NAME} 失败：${getErrorMessage(error)}`
      )
    }
  }

  const configuredRepositories = parseConfig(content)
  const parsedLines = collectConfigLines(content)
  const result = createEmptyImportResult(localRemotes.length)
  const repositoriesToAppend: RepositoryConfig[] = []
  const lineUpdates: ConfigLineUpdate[] = []

  for (const localRemote of localRemotes) {
    const aliasMatch = configuredRepositories.find(
      (repository) => repository.alias === localRemote.alias
    )

    if (
      aliasMatch &&
      normalizeRemoteUrl(aliasMatch.url) === normalizeRemoteUrl(localRemote.url)
    ) {
      result.skipped.push({
        alias: localRemote.alias,
        url: localRemote.url
      })
      continue
    }

    if (!aliasMatch) {
      const repository: RepositoryConfig = {
        alias: localRemote.alias,
        url: localRemote.url,
        enabled: true
      }
      result.added.push({
        alias: localRemote.alias,
        url: localRemote.url
      })
      repositoriesToAppend.push(repository)
      configuredRepositories.push(repository)
      continue
    }

    if (!overwrite) {
      result.conflict.push({
        alias: localRemote.alias,
        configUrl: aliasMatch.url,
        localUrl: localRemote.url
      })
      continue
    }

    const oldUrl = aliasMatch.url
    aliasMatch.url = localRemote.url
    result.updated.push({
      alias: localRemote.alias,
      url: localRemote.url,
      oldUrl
    })

    const parsedLine = parsedLines.find(
      (line) => line.alias === localRemote.alias
    )
    if (parsedLine) {
      lineUpdates.push({
        ...parsedLine,
        repository: {
          alias: aliasMatch.alias || localRemote.alias,
          url: localRemote.url,
          enabled: aliasMatch.enabled
        }
      })
    } else {
      repositoriesToAppend.push({
        alias: localRemote.alias,
        url: localRemote.url,
        enabled: aliasMatch.enabled
      })
    }
  }

  if (result.added.length > 0 || result.updated.length > 0) {
    const updatedContent = applyConfigLineUpdates(content, lineUpdates)
    const nextContent = appendConfigRepositories(
      updatedContent,
      repositoriesToAppend
    )
    await writeConfig(cwd, nextContent)
  }

  return result
}

export async function createEmptyConfigFile(
  cwd: string
): Promise<ImportResult> {
  const configPath = getConfigPath(cwd)

  try {
    await writeFile(configPath, EMPTY_CONFIG_TEMPLATE, 'utf8')
  } catch (error) {
    throw new Error(
      `创建 ${GIT_REMOTES_FILE_NAME} 失败：${getErrorMessage(error)}`
    )
  }

  try {
    return await importFromLocalRemotes(cwd, { overwrite: false })
  } catch {
    return createEmptyImportResult()
  }
}
