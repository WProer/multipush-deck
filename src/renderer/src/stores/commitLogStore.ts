import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CommitDetail,
  CommitFileChange,
  CommitLogEntry,
  CommitPushStatus,
  GitFileDiffResult
} from '../../../shared/types'
import { useProjectStore } from './projectStore'

const PAGE_SIZE = 200
const PUSH_STATUS_BATCH_SIZE = 200

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
// 临时整理：第 1-1 项
