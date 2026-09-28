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

const currentDirectory = computed(() => projectStore.cwd || '未选择项目目录')

const configStatusClass = computed(() => {
  if (!projectStore.hasValidConfig) {
    return 'is-empty'
  }

  return projectStore.isSetupDone ? 'is-valid' : 'is-mismatch'
})

const configStatusTitle = computed(() => {
  if (!projectStore.hasValidConfig) {
    return '配置文件状态：无有效配置'
  }

  return projectStore.isSetupDone
    ? '配置文件状态：有效且本地远程一致'
    : '配置文件状态：有效，但本地远程不一致或尚未 Setup'
})

function handleMenuSelect(index: string): void {
  if (index !== activeMenu.value) {
    void router.push(index)
  }
}

function handleHelpCommand(command: string | number | object): void {
  const destination = String(command)

  if (destination === 'intro') {
    void router.push({ path: '/help', query: { tab: 'intro' } })
    return
  }

  if (destination === 'about') {
    void router.push('/about')
    return
  }

  void router.push('/help')
}

function handleToggleLog(): void {
  logsStore.toggleVisible()
}
</script>

<template>
  <header class="top-menu-bar">
    <div class="menu-left">
      <span class="app-name">MultiPush Deck</span>

      <el-divider direction="vertical" class="menu-divider" />

      <el-menu
        class="main-menu"
        mode="horizontal"
        :default-active="activeMenu"
        :ellipsis="false"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          {{ item.label }}
        </el-menu-item>
      </el-menu>

      <el-divider direction="vertical" class="menu-divider" />

      <el-dropdown @command="handleHelpCommand">
        <span class="dropdown-trigger">
          <el-icon><QuestionFilled /></el-icon>
          <span>帮助</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="guide">使用说明</el-dropdown-item>
            <el-dropdown-item command="intro">工具介绍</el-dropdown-item>
            <el-dropdown-item command="about" divided>关于</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

<!-- 临时整理：第 2-1 项 -->
<!-- 临时整理：第 2-2 项 -->
<!-- 临时整理：第 2-3 项 -->
<!-- 临时整理：第 2-4 项 -->
<!-- 临时整理：第 2-5 项 -->
