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

<!-- 临时整理：第 3-1 项 -->
<!-- 临时整理：第 3-2 项 -->
<!-- 临时整理：第 3-3 项 -->
<!-- 临时整理：第 3-4 项 -->
<!-- 临时整理：第 3-5 项 -->
<!-- 临时整理：第 3-6 项 -->
<!-- 临时整理：第 3-7 项 -->
<!-- 临时整理：第 3-8 项 -->
<!-- 临时整理：第 3-9 项 -->
<!-- 临时整理：第 3-10 项 -->
<!-- 临时整理：第 3-11 项 -->
<!-- 临时整理：第 3-12 项 -->
<!-- 临时整理：第 3-13 项 -->
<!-- 临时整理：第 3-14 项 -->
<!-- 临时整理：第 3-15 项 -->
<!-- 临时整理：第 3-16 项 -->
<!-- 临时整理：第 3-17 项 -->
<!-- 临时整理：第 3-18 项 -->
<!-- 临时整理：第 3-19 项 -->
<!-- 临时整理：第 3-20 项 -->
<!-- 临时整理：第 3-21 项 -->
<!-- 临时整理：第 3-22 项 -->
<!-- 临时整理：第 3-23 项 -->
<!-- 临时整理：第 3-24 项 -->
<!-- 临时整理：第 3-25 项 -->
<!-- 临时整理：第 3-26 项 -->
<!-- 临时整理：第 3-27 项 -->
<!-- 临时整理：第 3-28 项 -->
<!-- 临时整理：第 3-29 项 -->
<!-- 临时整理：第 3-30 项 -->
<!-- 临时整理：第 3-31 项 -->
