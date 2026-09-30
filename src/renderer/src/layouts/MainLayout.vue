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
<!-- 临时整理：第 2-1 项 -->
<!-- 临时整理：第 2-2 项 -->
<!-- 临时整理：第 2-3 项 -->
<!-- 临时整理：第 2-4 项 -->
<!-- 临时整理：第 2-5 项 -->
<!-- 临时整理：第 2-6 项 -->
<!-- 临时整理：第 2-7 项 -->
<!-- 临时整理：第 2-8 项 -->
<!-- 临时整理：第 2-9 项 -->
<!-- 临时整理：第 2-10 项 -->
<!-- 临时整理：第 2-11 项 -->
<!-- 临时整理：第 2-12 项 -->
<!-- 临时整理：第 2-13 项 -->
<!-- 临时整理：第 2-14 项 -->
<!-- 临时整理：第 2-15 项 -->
<!-- 临时整理：第 2-16 项 -->
<!-- 临时整理：第 2-17 项 -->
<!-- 临时整理：第 2-18 项 -->
<!-- 临时整理：第 2-19 项 -->
<!-- 临时整理：第 2-20 项 -->
<!-- 临时整理：第 2-21 项 -->
<!-- 临时整理：第 2-22 项 -->
<!-- 临时整理：第 2-23 项 -->
<!-- 临时整理：第 2-24 项 -->
<!-- 临时整理：第 2-25 项 -->
<!-- 临时整理：第 2-26 项 -->
<!-- 临时整理：第 2-27 项 -->
