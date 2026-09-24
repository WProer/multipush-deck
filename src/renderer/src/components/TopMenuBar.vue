<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleCheck,
  Document,
  FolderOpened,
  InfoFilled,
  QuestionFilled,
  Setting,
  Warning
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLogsStore } from '../stores/logsStore'
import { useProjectStore } from '../stores/projectStore'

type MenuItem = {
  label: string
  path: string
}

const route = useRoute()
const router = useRouter()
const logsStore = useLogsStore()
const projectStore = useProjectStore()

const menuItems: MenuItem[] = [
  { label: '仓库管理', path: '/repos' },
  { label: '文件与提交', path: '/files' },
  { label: '提交日志', path: '/log' },
  { label: '推送中心', path: '/sync' }
]

const activeMenu = computed(() => {
  const firstSegment = route.path.split('/').filter(Boolean)[0] ?? 'repos'
  const currentPath = `/${firstSegment}`
  return menuItems.some((item) => item.path === currentPath)
    ? currentPath
    : ''
})

<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
