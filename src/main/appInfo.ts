import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { release as osRelease, type as osType } from 'node:os'
import { app } from 'electron'
import { executeCommand } from './commandRunner'
import type { AppInfo, RuntimeInfo } from '../shared/types'

const PROJECT_REPOSITORY_URL = 'https://github.com/WProer/multipush-deck'

async function readPackageVersion(
  packageName: string,
  fallback = '未知'
): Promise<string> {
  try {
    const packagePath = join(
      app.getAppPath(),
      'node_modules',
      packageName,
      'package.json'
    )
    const content = await readFile(packagePath, 'utf8')
    const parsed = JSON.parse(content) as { version?: unknown }

    return typeof parsed.version === 'string' ? parsed.version : fallback
  } catch {
    return fallback
  }
}

export async function getAppInfo(): Promise<AppInfo> {
  const [vue, elementPlus] = await Promise.all([
    readPackageVersion('vue'),
    readPackageVersion('element-plus')
  ])

  return {
    name: 'MultiPush Deck',
    version: app.getVersion(),
    dependencies: {
      electron: process.versions.electron ?? '未知',
      vue,
      elementPlus
    },
    repositoryUrl: PROJECT_REPOSITORY_URL,
    license: 'MIT'
  }
}

async function readGitVersion(): Promise<string> {
  try {
    const result = await executeCommand(
      '系统信息',
      'git',
      ['--version'],
      app.getPath('home'),
      { silent: true, deferStdout: true }
    )

    if (!result.success) {
      return '未检测到'
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
// 临时整理：第 2-11 项
const __draft1_11 = 11
// 临时整理：第 2-13 项
const __draft1_13 = 13
// 临时整理：第 2-15 项
