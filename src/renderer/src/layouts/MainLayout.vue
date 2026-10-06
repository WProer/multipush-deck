<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import GlobalLogPanel from '../components/GlobalLogPanel.vue'
import GlobalStatusBar from '../components/GlobalStatusBar.vue'
import TopMenuBar from '../components/TopMenuBar.vue'
import { useLogsStore } from '../stores/logsStore'
import { useSettingsStore } from '../stores/settingsStore'

const logsStore = useLogsStore()
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="main-layout" :class="`theme-${settingsStore.theme}`">
    <TopMenuBar />

    <GlobalStatusBar />

    <main class="page-host">
      <router-view />
    </main>

    <div class="log-panel-host">
      <GlobalLogPanel v-if="logsStore.visible" />

      <button
        v-else
        class="hidden-log-placeholder"
        type="button"
        @click="logsStore.toggleVisible"
      >
        <el-icon><Document /></el-icon>
        <span>运行日志</span>
        <span class="hidden-log-count">{{ logsStore.entries.length }} 条</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  min-width: 320px;
  min-height: 480px;
  flex-direction: column;
  overflow: hidden;
  background: var(--app-bg);
}

.main-layout > :deep(.top-menu-bar) {
  flex: 0 0 48px;
}

.main-layout > :deep(.global-status-bar) {
  flex: 0 0 28px;
}

.page-host {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}

.log-panel-host {
  min-height: 0;
  flex: 0 0 auto;
  overflow: hidden;
}

.hidden-log-placeholder {
  display: flex;
  width: 100%;
  height: 24px;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 0;
  background: var(--app-statusbar-bg);
  color: var(--el-text-color-regular);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  text-align: left;
}

.hidden-log-placeholder:hover {
  background: var(--app-hover-bg);
}

.hidden-log-count {
  margin-left: auto;
  color: var(--el-text-color-secondary);
}
</style>
