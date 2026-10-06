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

.main-menu :deep(.el-menu-item) {
  height: 48px;
  margin: 0;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.main-menu :deep(.el-menu-item:hover),
.main-menu :deep(.el-menu-item:focus) {
  background: var(--app-hover-bg);
  color: var(--el-text-color-primary);
}

.main-menu :deep(.el-menu-item.is-active) {
  border-bottom-color: var(--el-color-primary);
  background: var(--app-active-bg);
  color: var(--el-color-primary);
}

.dropdown-trigger {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border-radius: 5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  outline: none;
  white-space: nowrap;
}

.dropdown-trigger:hover,
.dropdown-trigger:focus-visible {
  background: var(--app-hover-bg);
  color: var(--el-color-primary);
}

.current-directory {
  display: flex;
  max-width: 280px;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.current-directory > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  margin: 0;
  color: var(--el-text-color-regular);
}

.icon-button:hover,
.icon-button:focus-visible {
  background: var(--app-hover-bg);
  color: var(--el-color-primary);
}

.config-status {
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: 14px;
}

.config-status.is-valid {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.config-status.is-mismatch {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.config-status.is-empty {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

@media (max-width: 1180px) {
  .current-directory {
    max-width: 180px;
  }

  .app-name {
    width: 118px;
    flex-basis: 118px;
  }

  .main-menu :deep(.el-menu-item) {
    padding: 0 10px;
  }
}

@media (max-width: 900px) {
  .top-menu-bar {
    padding: 0 10px;
  }

  .current-directory > span,
  .dropdown-trigger > span:last-child {
    display: none;
  }

  .app-name {
    width: 104px;
    flex-basis: 104px;
    font-size: 13px;
  }

  .menu-left,
  .menu-right {
    gap: 5px;
  }

  .menu-divider {
    margin: 0 2px;
  }
}
</style>
