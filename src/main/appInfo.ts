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

    return result.stdout.trim() || '未检测到'
  } catch {
    return '未检测到'
  }
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  const [vue, elementPlus, pinia, electronVite, gitVersion] =
    await Promise.all([
      readPackageVersion('vue'),
      readPackageVersion('element-plus'),
      readPackageVersion('pinia'),
      readPackageVersion('electron-vite'),
      readGitVersion()
    ])

  return {
    platform: process.platform,
    arch: process.arch,
    osVersion: `${osType()} ${osRelease()}`,
    gitVersion,
    versions: {
      electron: process.versions.electron ?? '未知',
      chromium: process.versions.chrome ?? '未知',
      node: process.versions.node ?? '未知',
      vue,
      elementPlus,
      pinia,
      electronVite
    }
  }
}
