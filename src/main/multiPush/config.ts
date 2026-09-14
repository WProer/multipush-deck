import { writeFile } from 'node:fs/promises'
import type { WebContents } from 'electron'
import type {
  ImportResult,
  RepositoryConfig
} from '../../shared/types'
import {
  parseConfig as parseSharedConfig,
  stringifyConfig as stringifySharedConfig
} from '../../shared/config'
import { emitCommandSummary } from '../commandRunner'
import {
  EMPTY_CONFIG_TEMPLATE,
  getConfigPath,
  importFromLocalRemotes as importFromLocalRemotesLegacy,
  readConfig as readConfigLegacy,
  writeConfig as writeConfigLegacy
} from '../config'

export type Repo = RepositoryConfig

export interface MultiPushConfigLogOptions {
  sender?: WebContents
  silent?: boolean
}

export const parseConfig = parseSharedConfig
export const stringifyConfig = stringifySharedConfig

export async function readConfig(cwd: string): Promise<Repo[]> {
  const result = await readConfigLegacy(cwd)
  return result.repositories
}

export async function writeConfig(
  cwd: string,
  repos: readonly Repo[]
): Promise<void> {
  await writeConfigLegacy(cwd, stringifyConfig(repos))
}

export async function importFromLocalRemotes(
  cwd: string,
  options: { overwrite?: boolean } = {},
  logOptions: MultiPushConfigLogOptions = {}
): Promise<ImportResult> {
  const result = await importFromLocalRemotesLegacy(cwd, options)
  const importedCount = result.added.length + result.updated.length

  if (!logOptions.silent && result.total > 0) {
    emitCommandSummary({
      source: '配置导入',
      command: 'multi-push import',
      cwd,
      summary: `从本地远程导入 ${importedCount} 个仓库`,
      details: [
        ...result.added.map((item) => ({
          name: item.alias,
          url: item.url,
          status: 'success' as const,
          message: '新增到配置文件'
        })),
        ...result.updated.map((item) => ({
          name: item.alias,
          url: item.url,
          status: 'success' as const,
          message: '已用本地 URL 更新配置'
        })),
        ...result.conflict.map((item) => ({
          name: item.alias,
          url: item.localUrl,
          status: 'skipped' as const,
          message: `配置 URL 与本地 URL 不一致：${item.configUrl}`
        }))
      ],
      exitCode: 0,
      sender: logOptions.sender
    })
  }

  return result
}

export async function createEmptyConfigFile(
  cwd: string,
  logOptions: MultiPushConfigLogOptions = {}
): Promise<ImportResult> {
  await writeFile(getConfigPath(cwd), EMPTY_CONFIG_TEMPLATE, 'utf8')
  return importFromLocalRemotes(cwd, { overwrite: false }, logOptions)
}
