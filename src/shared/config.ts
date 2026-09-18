import type { RepositoryConfig } from './types'

export const GIT_REMOTES_FILE_NAME = '.git-remotes.txt'
export const DISABLED_CONFIG_PREFIX = '# multi-push-disabled:'

export interface ConfigParseReport {
  repositories: RepositoryConfig[]
  ignoredExamples: string[]
}

function looksLikeRepositoryUrl(value: string): boolean {
  return (
    /^(?:https?|ssh|git|file):\/\//i.test(value) ||
    /^[^\s@]+@[^\s:]+:.+/.test(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^\//.test(value)
  )
}

const placeholderPatterns = [
  /\busername\b/i,
  /\byour-username\b/i,
  /\brepository\.git\b/i,
  /\brepo1\.git\b/i,
  /\bplaceholder\b/i,
  /example\.(?:com|org|net)\/user\/repo/i,
  /git\.company\.com\/team\/project/i,
  /mirror\.com\/user\/repo/i
]

function looksLikePlaceholder(value: string): boolean {
  return placeholderPatterns.some((pattern) => pattern.test(value))
}

export function parseConfigReport(content: string): ConfigParseReport {
  if (typeof content !== 'string') {
    throw new TypeError('配置内容必须是字符串。')
  }

  const repositories: RepositoryConfig[] = []
  const ignoredExamples: string[] = []
  let pendingAlias = ''

  for (const rawLine of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line === '') {
      continue
    }

    const disabled = line.startsWith(DISABLED_CONFIG_PREFIX)
    const value = disabled
      ? line.slice(DISABLED_CONFIG_PREFIX.length).trim()
      : line

    if (!disabled && value.startsWith('#')) {
      continue
    }

    if (value === '') {
      continue
    }

    const aliasOnlyMatch = /^\[([^\]]+)\]$/.exec(value)
    if (!disabled && aliasOnlyMatch) {
      pendingAlias = aliasOnlyMatch[1].trim()
      continue
    }

    const inlineMatch = /^(?:\[([^\]]+)\]|([^\s]+))\s+(.+)$/.exec(value)
    const alias = (inlineMatch?.[1] ?? inlineMatch?.[2] ?? pendingAlias).trim()
    const url = (inlineMatch?.[3] ?? value).trim()

    if (looksLikePlaceholder(value)) {
      ignoredExamples.push(line)
      pendingAlias = ''
      continue
    }

    if (!looksLikeRepositoryUrl(url)) {
      continue
    }


    repositories.push({ alias, url, enabled: !disabled })
    pendingAlias = ''
  }

  return { repositories, ignoredExamples }
}

export function parseConfig(content: string): RepositoryConfig[] {
  return parseConfigReport(content).repositories
}

export function stringifyConfig(repos: readonly RepositoryConfig[]): string {
  const lines: string[] = []

  for (const repo of repos) {
    const url = repo.url.trim()
    if (!url) {
      continue
    }

    const alias = repo.alias.replace(/[\r\n]+/g, ' ').trim()
    const entry = alias ? `[${alias}] ${url}` : url
    lines.push(
      repo.enabled ? entry : `${DISABLED_CONFIG_PREFIX} ${entry}`
    )
    lines.push('')
  }

  if (lines.length === 0) {
    return ''
  }

  return `${lines.join('\n').trimEnd()}\n`
}
