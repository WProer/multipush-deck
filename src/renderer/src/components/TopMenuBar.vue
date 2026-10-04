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

    <div class="menu-right">
      <el-tooltip :content="currentDirectory" placement="bottom">
        <span class="current-directory">
          <el-icon><FolderOpened /></el-icon>
          <span>{{ currentDirectory }}</span>
        </span>
      </el-tooltip>

      <el-tooltip content="设置" placement="bottom">
        <el-button
          class="icon-button"
          text
          circle
          aria-label="设置"
          @click="router.push('/settings')"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </el-tooltip>

      <el-tooltip content="日志切换" placement="bottom">
        <el-button
          class="icon-button"
          text
          circle
          aria-label="日志切换"
          @click="handleToggleLog"
        >
          <el-icon><Document /></el-icon>
        </el-button>
      </el-tooltip>

      <el-tooltip :content="configStatusTitle" placement="bottom">
        <span class="config-status" :class="configStatusClass">
          <el-icon>
            <CircleCheck
              v-if="projectStore.hasValidConfig && projectStore.isSetupDone"
            />
            <Warning v-else-if="projectStore.hasValidConfig" />
            <InfoFilled v-else />
          </el-icon>
        </span>
      </el-tooltip>
    </div>
  </header>
</template>

<style scoped>
.top-menu-bar {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 48px;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  background: var(--app-topbar-bg);
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--app-topbar-border);
}

.menu-left {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  overflow: hidden;
}

.menu-right {
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.app-name {
  width: 132px;
  flex: 0 0 132px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-divider {
  height: 20px;
  flex: 0 0 1px;
  margin: 0 4px;
  border-color: var(--el-border-color);
}

.main-menu {
  height: 48px;
  min-width: 0;
  flex: 0 0 auto;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  border-bottom: 0;
  background: transparent;
}

:deep(.el-menu--horizontal) {
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  border-bottom: none;
}
<!-- 临时整理：第 4-1 项 -->
<!-- 临时整理：第 4-2 项 -->
<!-- 临时整理：第 4-3 项 -->
<!-- 临时整理：第 4-4 项 -->
<!-- 临时整理：第 4-5 项 -->
<!-- 临时整理：第 4-6 项 -->
<!-- 临时整理：第 4-7 项 -->
<!-- 临时整理：第 4-8 项 -->
<!-- 临时整理：第 4-9 项 -->
<!-- 临时整理：第 4-10 项 -->
<!-- 临时整理：第 4-11 项 -->
<!-- 临时整理：第 4-12 项 -->
<!-- 临时整理：第 4-13 项 -->
<!-- 临时整理：第 4-14 项 -->
<!-- 临时整理：第 4-15 项 -->
<!-- 临时整理：第 4-16 项 -->
<!-- 临时整理：第 4-17 项 -->
<!-- 临时整理：第 4-18 项 -->
<!-- 临时整理：第 4-19 项 -->
<!-- 临时整理：第 4-20 项 -->
<!-- 临时整理：第 4-21 项 -->
<!-- 临时整理：第 4-22 项 -->
<!-- 临时整理：第 4-23 项 -->
<!-- 临时整理：第 4-24 项 -->
<!-- 临时整理：第 4-25 项 -->
<!-- 临时整理：第 4-26 项 -->
<!-- 临时整理：第 4-27 项 -->
<!-- 临时整理：第 4-28 项 -->
<!-- 临时整理：第 4-29 项 -->
<!-- 临时整理：第 4-30 项 -->
<!-- 临时整理：第 4-31 项 -->
<!-- 临时整理：第 4-32 项 -->
<!-- 临时整理：第 4-33 项 -->
<!-- 临时整理：第 4-34 项 -->
<!-- 临时整理：第 4-35 项 -->
<!-- 临时整理：第 4-36 项 -->
<!-- 临时整理：第 4-37 项 -->
<!-- 临时整理：第 4-38 项 -->
<!-- 临时整理：第 4-39 项 -->
<!-- 临时整理：第 4-40 项 -->
<!-- 临时整理：第 4-41 项 -->
<!-- 临时整理：第 4-42 项 -->
<!-- 临时整理：第 4-43 项 -->
<!-- 临时整理：第 4-44 项 -->
<!-- 临时整理：第 4-45 项 -->
<!-- 临时整理：第 4-46 项 -->
<!-- 临时整理：第 4-47 项 -->
<!-- 临时整理：第 4-48 项 -->
<!-- 临时整理：第 4-49 项 -->
<!-- 临时整理：第 4-50 项 -->
<!-- 临时整理：第 4-51 项 -->
<!-- 临时整理：第 4-52 项 -->
<!-- 临时整理：第 4-53 项 -->
<!-- 临时整理：第 4-54 项 -->
<!-- 临时整理：第 4-55 项 -->
<!-- 临时整理：第 4-56 项 -->
<!-- 临时整理：第 4-57 项 -->
<!-- 临时整理：第 4-58 项 -->
<!-- 临时整理：第 4-59 项 -->
<!-- 临时整理：第 4-60 项 -->
<!-- 临时整理：第 4-61 项 -->
<!-- 临时整理：第 4-62 项 -->
<!-- 临时整理：第 4-63 项 -->
<!-- 临时整理：第 4-64 项 -->
<!-- 临时整理：第 4-65 项 -->
<!-- 临时整理：第 4-66 项 -->
<!-- 临时整理：第 4-67 项 -->
<!-- 临时整理：第 4-68 项 -->
<!-- 临时整理：第 4-69 项 -->
<!-- 临时整理：第 4-70 项 -->
<!-- 临时整理：第 4-71 项 -->
<!-- 临时整理：第 4-72 项 -->
<!-- 临时整理：第 4-73 项 -->
<!-- 临时整理：第 4-74 项 -->
<!-- 临时整理：第 4-75 项 -->
<!-- 临时整理：第 4-76 项 -->
<!-- 临时整理：第 4-77 项 -->
<!-- 临时整理：第 4-78 项 -->
<!-- 临时整理：第 4-79 项 -->
<!-- 临时整理：第 4-80 项 -->
<!-- 临时整理：第 4-81 项 -->
<!-- 临时整理：第 4-82 项 -->
<!-- 临时整理：第 4-83 项 -->
<!-- 临时整理：第 4-84 项 -->
<!-- 临时整理：第 4-85 项 -->
<!-- 临时整理：第 4-86 项 -->
<!-- 临时整理：第 4-87 项 -->
<!-- 临时整理：第 4-88 项 -->
<!-- 临时整理：第 4-89 项 -->
<!-- 临时整理：第 4-90 项 -->
<!-- 临时整理：第 4-91 项 -->
<!-- 临时整理：第 4-92 项 -->
<!-- 临时整理：第 4-93 项 -->
<!-- 临时整理：第 4-94 项 -->
<!-- 临时整理：第 4-95 项 -->
<!-- 临时整理：第 4-96 项 -->
<!-- 临时整理：第 4-97 项 -->
<!-- 临时整理：第 4-98 项 -->
<!-- 临时整理：第 4-99 项 -->
<!-- 临时整理：第 4-100 项 -->
<!-- 临时整理：第 4-101 项 -->
<!-- 临时整理：第 4-102 项 -->
<!-- 临时整理：第 4-103 项 -->
<!-- 临时整理：第 4-104 项 -->
<!-- 临时整理：第 4-105 项 -->
<!-- 临时整理：第 4-106 项 -->
<!-- 临时整理：第 4-107 项 -->
<!-- 临时整理：第 4-108 项 -->
<!-- 临时整理：第 4-109 项 -->
<!-- 临时整理：第 4-110 项 -->
