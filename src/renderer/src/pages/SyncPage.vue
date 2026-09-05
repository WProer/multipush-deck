<script setup lang="ts">
import { computed, nextTick, onMounted, watch, type Component } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck,
  CircleClose,
  Document,
  FolderOpened,
  InfoFilled,
  Refresh,
  Upload,
  View,
  Warning
} from '@element-plus/icons-vue'
import SyncCommandCard from '../components/SyncCommandCard.vue'
import { useProjectStore } from '../stores/projectStore'
import { useReposStore } from '../stores/reposStore'
import { useSyncStore, type SyncAction } from '../stores/syncStore'
import type { RemoteSyncState } from '../../../shared/types'

interface SyncCommandDefinition {
  action: SyncAction
  title: string
  description: string
  command: string
  icon: Component
}

const projectStore = useProjectStore()
const reposStore = useReposStore()
const syncStore = useSyncStore()

const commands: SyncCommandDefinition[] = [
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
<!-- 临时整理：第 1-4 项 -->
<!-- 临时整理：第 1-5 项 -->
<!-- 临时整理：第 1-6 项 -->
<!-- 临时整理：第 1-7 项 -->
<!-- 临时整理：第 1-8 项 -->
<!-- 临时整理：第 1-9 项 -->
<!-- 临时整理：第 1-10 项 -->
<!-- 临时整理：第 1-11 项 -->
<!-- 临时整理：第 1-12 项 -->
<!-- 临时整理：第 1-13 项 -->
<!-- 临时整理：第 1-14 项 -->
<!-- 临时整理：第 1-15 项 -->
<!-- 临时整理：第 1-16 项 -->
<!-- 临时整理：第 1-17 项 -->
<!-- 临时整理：第 1-18 项 -->
