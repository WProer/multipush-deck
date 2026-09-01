import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { release as osRelease, type as osType } from 'node:os'
import { app } from 'electron'
import { executeCommand } from './commandRunner'
import type { AppInfo, RuntimeInfo } from '../shared/types'

const PROJECT_REPOSITORY_URL = 'https://github.com/WProer/multipush-deck'

// 临时整理：第 1-1 项
