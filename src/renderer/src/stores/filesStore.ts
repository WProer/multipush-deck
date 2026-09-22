import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  GitFileDiffResult,
  GitFileStatusItem,
  GitFileStatusResult
} from '../../../shared/types'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export type FileOperation = 'refresh' | 'stage' | 'unstage' | 'discard'

function formatTime(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date())
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getOperationPaths(
  files: readonly GitFileStatusItem[],
  selectedPaths: readonly string[]
): string[] {
  const selected = new Set(selectedPaths)
  const paths = new Set<string>()

// 临时整理：第 1-1 项
