<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref, watch } from 'vue'
import {
  CircleCheck,
  InfoFilled,
  Plus,
  UploadFilled,
  Warning
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type {
  LocalRemoteItem,
  LocalRemoteStatus,
  RepositoryConfig
} from '../../../shared/types'
import type { RepositoryListItem } from '../stores/reposStore'
import RepositoryDialog from './RepositoryDialog.vue'

const props = defineProps<{
  repositories: RepositoryListItem[]
  loading: boolean
  canModify: boolean
  extraRemotes: LocalRemoteItem[]
  canImportRemotes: boolean
  importing: boolean
}>()

const emit = defineEmits<{
  add: [repository: RepositoryConfig]
  update: [id: string, repository: RepositoryConfig]
  remove: [id: string]
  toggle: [id: string, enabled: boolean]
  importRemotes: []
}>()

<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
<!-- 临时整理：第 1-4 项 -->
<!-- 临时整理：第 1-5 项 -->
<!-- 临时整理：第 1-6 项 -->
<!-- 临时整理：第 1-7 项 -->
<!-- 临时整理：第 1-8 项 -->
