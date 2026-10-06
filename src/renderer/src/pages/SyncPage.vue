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
  {
    action: 'push',
    title: '仅推送',
    description: '将当前分支推送到配置文件中启用的全部远程仓库。',
    command: 'multi-push push-all',
    icon: Upload
  },
  {
    action: 'status',
    title: '查看状态',
    description: '检查当前分支与各远程仓库之间的领先、落后和分叉状态。',
    command: 'multi-push status',
    icon: View
  },
  {
    action: 'config',
    title: '查看配置',
    description: '读取当前项目中的 .git-remotes.txt 并汇总有效仓库。',
    command: 'multi-push config',
    icon: Document
  },
  {
    action: 'setup',
    title: '重新 Setup',
    description: '根据配置文件重新绑定本地 Git 远程仓库。',
    command: 'multi-push setup',
    icon: Refresh
  }
]

const directoryTitle = computed(
  () => projectStore.cwd || '尚未选择项目目录'
)

const configurationText = computed(() => {
  if (!projectStore.hasValidConfig) {
    return '无有效配置'
  }

  return projectStore.isSetupDone ? '本地远程一致' : '本地远程不一致'
})

const configurationClass = computed(() => {
  if (!projectStore.hasValidConfig) {
    return 'config-empty'
  }

  return projectStore.isSetupDone ? 'config-valid' : 'config-mismatch'
})

const statusMeta: Record<
  RemoteSyncState,
  { label: string; icon: Component; tone: string }
> = {
  'up-to-date': {
    label: '一致',
    icon: CircleCheck,
    tone: 'status-up-to-date'
  },
  ahead: {
    label: '本地领先',
    icon: Warning,
    tone: 'status-ahead'
  },
  behind: {
    label: '本地落后',
    icon: Warning,
    tone: 'status-behind'
  },
  diverged: {
    label: '分叉',
    icon: CircleClose,
    tone: 'status-diverged'
  },
  unknown: {
    label: '未知',
    icon: InfoFilled,
    tone: 'status-unknown'
  }
}

function getStatusMeta(status: RemoteSyncState) {
  return statusMeta[status]
}

async function scrollToAction(action: SyncAction): Promise<void> {
  await nextTick()
  const element = document.getElementById(`sync-card-${action}`)
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
}

async function confirmSetup(): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      '重新执行 Setup 会重新绑定本地 Git 远程仓库，是否继续？',
      '重新 Setup',
      {
        type: 'warning',
        confirmButtonText: '继续执行',
        cancelButtonText: '取消'
      }
    )
    return true
  } catch {
    return false
  }
}

async function executeAction(action: SyncAction): Promise<void> {
  const definition = commands.find((command) => command.action === action)
  if (!definition || syncStore.isActionDisabled(action)) {
    return
  }

  if (action === 'setup' && !(await confirmSetup())) {
    return
  }

  syncStore.highlightedAction = action
  await scrollToAction(action)

  const success = await syncStore.executeAction(action)
  if (success && action === 'setup') {
    await reposStore.refresh()
  }

  if (success) {
    ElMessage.success(`${definition.title}执行完成`)
  } else {
    ElMessage.error(`${definition.title}执行失败`)
  }
}

async function consumePendingAction(): Promise<void> {
  const action = syncStore.consumePendingAction()
  if (!action) {
    return
  }

  await scrollToAction(action)
  await executeAction(action)
}

onMounted(async () => {
  if (projectStore.cwd) {
    await reposStore.refresh()
  }
  await consumePendingAction()
})

watch(
  () => syncStore.pendingAction,
  (action) => {
    if (action) {
      void consumePendingAction()
    }
  }
)

watch(
  () => syncStore.highlightedAction,
  (action) => {
    if (action) {
      void scrollToAction(action)
    }
  }
)
</script>

<template>
  <section class="sync-page">
    <header class="page-header">
      <div class="directory-summary" :title="directoryTitle">
        <span class="directory-icon">
          <el-icon><FolderOpened /></el-icon>
        </span>
        <div class="directory-copy">
          <span class="summary-label">当前项目目录</span>
          <strong>{{ directoryTitle }}</strong>
        </div>
      </div>

      <div class="configuration-summary" :class="configurationClass">
        <el-icon>
          <CircleCheck v-if="projectStore.isSetupDone" />
          <Warning v-else-if="projectStore.hasValidConfig" />
          <InfoFilled v-else />
        </el-icon>
        <div>
          <strong>{{ configurationText }}</strong>
          <span>
            有效配置：{{ projectStore.hasValidConfig ? '是' : '否' }}
          </span>
        </div>
      </div>
    </header>

    <el-alert
      v-if="!projectStore.cwd"
      class="availability-alert"
      type="warning"
      :closable="false"
      show-icon
      title="尚未选择项目目录"
      description="请先在仓库管理页面选择本地 Git 仓库目录。"
    />

    <section class="command-grid">
      <SyncCommandCard
        v-for="command in commands"
        :key="command.action"
        :action="command.action"
        :title="command.title"
        :description="command.description"
        :command="command.command"
        :icon="command.icon"
        :last-run="syncStore.getLastRun(command.action)"
        :running="syncStore.runningAction === command.action"
        :disabled="syncStore.isActionDisabled(command.action)"
        :disabled-reason="syncStore.getDisabledReason(command.action)"
        :highlighted="syncStore.highlightedAction === command.action"
        @execute="executeAction"
      />
    </section>

    <section v-if="syncStore.pushResult" class="result-panel">
      <header class="result-header">
        <div>
          <h2>最近一次推送</h2>
          <p>
            总计 {{ syncStore.pushResult.total }} 个仓库，成功
            {{ syncStore.pushResult.success }} 个，失败
            {{ syncStore.pushResult.failed }} 个
          </p>
        </div>
      </header>

      <div class="result-list">
        <div
          v-for="item in syncStore.pushResult.results"
          :key="item.remoteName"
          class="result-row"
          :class="item.success ? 'is-success' : 'is-failure'"
        >
          <el-icon>
            <CircleCheck v-if="item.success" />
            <CircleClose v-else />
          </el-icon>
          <code>{{ item.remoteName }}</code>
          <span class="result-url">{{ item.url || '-' }}</span>
          <span class="result-message">{{ item.reason }}</span>
          <span class="result-duration">{{ item.duration }} ms</span>
        </div>
      </div>
    </section>

    <section v-if="syncStore.remoteStatus" class="result-panel">
      <header class="result-header">
        <div>
          <h2>远程同步状态</h2>
          <p>当前分支：{{ syncStore.remoteStatus.branch || '-' }}</p>
        </div>
      </header>

      <div class="result-list">
        <div
          v-for="remote in syncStore.remoteStatus.remotes"
          :key="remote.name"
          class="result-row"
          :class="getStatusMeta(remote.status).tone"
        >
          <el-icon>
            <component :is="getStatusMeta(remote.status).icon" />
          </el-icon>
          <code>{{ remote.name }}</code>
          <span class="result-url">{{ remote.url || '-' }}</span>
          <span class="result-message">
            {{ getStatusMeta(remote.status).label }}
            <template v-if="remote.status === 'ahead'">
              {{ remote.localAhead }} 个提交
            </template>
            <template v-else-if="remote.status === 'behind'">
              {{ remote.localBehind }} 个提交
            </template>
            <template v-else-if="remote.status === 'diverged'">
              领先 {{ remote.localAhead }}，落后 {{ remote.localBehind }}
            </template>
            <template v-else-if="remote.error">
              {{ remote.error }}
            </template>
          </span>
        </div>
      </div>
    </section>

    <section v-if="syncStore.setupResult" class="result-panel">
      <header class="result-header">
        <div>
          <h2>最近一次 Setup</h2>
          <p>
            新增 {{ syncStore.setupResult.added.length }} 个，更新
            {{ syncStore.setupResult.updated.length }} 个，跳过
            {{ syncStore.setupResult.skipped.length }} 个，失败
            {{ syncStore.setupResult.failed.length }} 个
          </p>
        </div>
      </header>

      <div class="result-list">
        <div
          v-for="item in [
            ...syncStore.setupResult.added.map((entry) => ({ ...entry, tone: 'success', text: '新增' })),
            ...syncStore.setupResult.updated.map((entry) => ({ ...entry, tone: 'success', text: '更新' })),
            ...syncStore.setupResult.skipped.map((entry) => ({ ...entry, tone: 'skipped', text: '跳过' })),
            ...syncStore.setupResult.failed.map((entry) => ({ ...entry, tone: 'failure', text: entry.reason }))
          ]"
          :key="`${item.name}:${item.text}`"
          class="result-row"
          :class="`is-${item.tone}`"
        >
          <el-icon>
            <CircleCheck v-if="item.tone === 'success'" />
            <Warning v-else-if="item.tone === 'skipped'" />
            <CircleClose v-else />
          </el-icon>
          <code>{{ item.name }}</code>
          <span class="result-url">{{ item.url }}</span>
          <span class="result-message">{{ item.text }}</span>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.sync-page {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--app-bg);
}

.page-header,
.result-panel {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-bg);
  box-shadow: var(--app-card-shadow);
}

.page-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 13px;
}

.directory-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.directory-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 18px;
}

.directory-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.summary-label {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.directory-copy strong {
  overflow: hidden;
  color: var(--text-strong);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.configuration-summary {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
}

.configuration-summary > .el-icon {
  font-size: 18px;
}

.configuration-summary div {
  display: grid;
  gap: 2px;
}

.configuration-summary strong {
  font-size: 12px;
}

.configuration-summary span {
  font-size: 10px;
}

.config-valid {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.config-mismatch {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.config-empty {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.availability-alert {
  flex: 0 0 auto;
}

.command-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: stretch;
  gap: 12px;
}

.result-panel {
  overflow: hidden;
}

.result-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
}

.result-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 14px;
}

.result-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.result-list {
  display: grid;
}

.result-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 20px minmax(90px, 0.35fr) minmax(150px, 1fr) minmax(120px, 0.8fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-soft);
  color: var(--text-main);
  font-size: 11px;
}

.result-row:first-child {
  border-top: 0;
}

.result-row code {
  overflow: hidden;
  color: var(--el-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-url {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: "Cascadia Mono", Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-message {
  min-width: 0;
  overflow-wrap: anywhere;
}

.result-duration {
  color: var(--text-muted);
  font-family: "Cascadia Mono", Consolas, monospace;
  text-align: right;
}

.is-success,
.status-up-to-date {
  color: var(--el-color-success);
}

.is-failure,
.status-diverged {
  color: var(--el-color-danger);
}

.is-skipped,
.status-ahead,
.status-behind {
  color: var(--el-color-warning);
}

.status-unknown {
  color: var(--el-color-info);
}

@media (max-width: 900px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .configuration-summary {
    width: 100%;
  }

  .result-row {
    grid-template-columns: 20px minmax(80px, 0.4fr) minmax(0, 1fr);
  }

  .result-url,
  .result-duration {
    display: none;
  }
}
</style>
