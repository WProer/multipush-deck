<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  CircleCheck,
  CircleClose,
  InfoFilled,
  Loading
} from '@element-plus/icons-vue'
import type { SyncAction, SyncLastRun } from '../stores/syncStore'

const props = defineProps<{
  action: SyncAction
  title: string
  description: string
  command: string
  icon: Component
  lastRun: SyncLastRun
  running: boolean
  disabled: boolean
  disabledReason: string
  highlighted: boolean
}>()

const emit = defineEmits<{
  execute: [action: SyncAction]
}>()

const resultLabel = computed(() => {
  if (props.lastRun.lastResult === 'success') {
    return '成功'
  }
  if (props.lastRun.lastResult === 'failure') {
    return '失败'
  }
  return '尚未执行'
})

const resultClass = computed(() =>
  props.lastRun.lastResult
    ? `result-${props.lastRun.lastResult}`
    : 'result-empty'
)

const lastRunTime = computed(() => {
  if (!props.lastRun.lastRunAt) {
    return '-'
  }

  const date = new Date(props.lastRun.lastRunAt)
  if (Number.isNaN(date.getTime())) {
    return props.lastRun.lastRunAt
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
})

const tooltipContent = computed(() =>
  props.disabledReason || '执行该同步命令'
)

function execute(): void {
  if (!props.disabled && !props.running) {
    emit('execute', props.action)
  }
}
</script>

<template>
  <article
    :id="`sync-card-${action}`"
    class="sync-command-card"
    :class="{
      'is-running': running,
      'is-disabled': disabled,
      'is-highlighted': highlighted
    }"
    :aria-busy="running"
  >
    <header class="card-header">
      <span class="command-icon">
        <el-icon>
          <Loading v-if="running" class="is-loading" />
          <component :is="icon" v-else />
        </el-icon>
      </span>

      <div class="command-heading">
        <h2>{{ title }}</h2>
        <code>{{ command }}</code>
      </div>
    </header>

    <p class="command-description">{{ description }}</p>

    <dl class="run-summary">
      <div class="summary-row">
        <dt>上次执行</dt>
        <dd>{{ lastRunTime }}</dd>
      </div>

      <div class="summary-row">
        <dt>执行结果</dt>
        <dd class="result-value" :class="resultClass">
          <el-icon>
            <CircleCheck v-if="lastRun.lastResult === 'success'" />
            <CircleClose v-else-if="lastRun.lastResult === 'failure'" />
            <InfoFilled v-else />
          </el-icon>
          <span>{{ resultLabel }}</span>
          <span
            v-if="lastRun.lastExitCode !== null"
            class="exit-code"
          >
            退出码 {{ lastRun.lastExitCode }}
          </span>
        </dd>
      </div>
    </dl>

    <p class="last-message" :title="lastRun.lastMessage">
      {{ lastRun.lastMessage }}
    </p>

    <div class="card-actions">
      <el-tooltip :content="tooltipContent" placement="top">
        <span class="tooltip-target">
          <el-button
            type="primary"
            :loading="running"
            :disabled="disabled || running"
            @click="execute"
          >
            {{ running ? '执行中' : '执行命令' }}
          </el-button>
        </span>
      </el-tooltip>
    </div>
  </article>
</template>

<style scoped>
.sync-command-card {
  display: flex;
  min-width: 0;
  min-height: 246px;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-bg);
  box-shadow: var(--app-card-shadow);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.sync-command-card.is-highlighted {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
  transform: translateY(-1px);
}

.sync-command-card.is-running {
  border-color: var(--el-color-primary-light-3);
}

.sync-command-card.is-disabled {
  background: var(--el-fill-color-lighter);
}

.card-header {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.command-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 19px;
}

.command-heading {
  min-width: 0;
}

.command-heading h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
}

.command-heading code {
  display: block;
  overflow: hidden;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-description {
  min-height: 42px;
  margin: 14px 0 12px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.65;
}

.run-summary {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.summary-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.summary-row dt {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.summary-row dd {
  min-width: 0;
  margin: 0;
  color: var(--text-main);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
}

.result-value {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.result-success {
  color: var(--el-color-success);
}

.result-failure {
  color: var(--el-color-danger);
}

.result-empty {
  color: var(--el-text-color-secondary);
}

.exit-code {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.last-message {
  display: -webkit-box;
  min-height: 34px;
  overflow: hidden;
  margin: 8px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-actions {
  display: flex;
  margin-top: auto;
  justify-content: flex-end;
}

.tooltip-target {
  display: block;
  min-width: 104px;
}

.tooltip-target :deep(.el-button) {
  width: 100%;
}
</style>
