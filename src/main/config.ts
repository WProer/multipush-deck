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
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
