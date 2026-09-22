import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { stringifyConfig } from '../../../shared/config'
import type {
  GitInitStatus,
  ImportResult,
  LocalRemoteItem,
  LocalRemoteStatus,
  MultiPushStatusResult,
  RemoteConfigurationStatus,
  RepositoryConfig,
  RepositoryRemoteStatus,
  SetupResult
} from '../../../shared/types'
import { useFilesStore } from './filesStore'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export interface RepositoryListItem extends RepositoryConfig {
  id: string
  localStatus: LocalRemoteStatus
  localStatusMessage: string
  localRemoteName: string
  localRemoteUrl: string
}

// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
const __draft0_3 = 3
// 临时整理：第 1-5 项
