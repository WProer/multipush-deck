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
