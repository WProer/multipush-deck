<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  FolderOpened,
  Refresh,
  Setting,
  UploadFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RemoteListPanel from '../components/RemoteListPanel.vue'
import { useProjectStore } from '../stores/projectStore'
import { useReposStore } from '../stores/reposStore'

const projectStore = useProjectStore()
const reposStore = useReposStore()

const setupPanels = ref<string[]>(['setup'])
const setupDialogVisible = ref(false)
const importDialogVisible = ref(false)
const applyingOverwrite = ref(false)

const setupNeedsAttention = computed(
  () =>
    reposStore.needsInit ||
    reposStore.needsSetup ||
    (reposStore.hasConfigFile && !reposStore.hasValidRepo)
)

const canModify = computed(
  () =>
    reposStore.hasDirectory &&
    !reposStore.loading &&
    !reposStore.saving
)

const directoryTitle = computed(
  () => projectStore.cwd || '尚未选择项目目录'
)

const initTooltip = computed(() => {
  if (!reposStore.hasDirectory) {
    return '请先选择项目目录'
  }
  if (reposStore.loading) {
    return '正在检测初始化状态'
  }
  if (!reposStore.isGitRepo) {
    return '当前目录不是 Git 仓库'
  }
  if (!reposStore.needsInit) {
    return '已完成初始化'
  }

  return '创建干净的 .git-remotes.txt 配置模板'
})

const setupTooltip = computed(() => {
  if (!reposStore.hasDirectory) {
    return '请先选择项目目录'
  }
  if (reposStore.loading) {
    return '正在检测初始化状态'
  }
  if (!reposStore.isGitRepo) {
    return '当前目录不是 Git 仓库'
  }
  if (!reposStore.hasConfigFile) {
    return '请先完成初始化配置'
  }
  if (!reposStore.hasValidRepo) {
    return '配置文件中没有有效仓库 URL'
  }
  if (!reposStore.needsSetup) {
    return '远程已配置'
  }

  return '根据配置绑定本地 Git 远程仓库'
})

const setupStatusText = computed(() => {
  if (reposStore.loading) {
    return '配置文件：检测中 · 有效仓库：检测中 · 本地远程：检测中'
  }

  return `配置文件：${
    reposStore.hasConfigFile ? '存在' : '不存在'
  } · 有效仓库：${
    reposStore.hasValidRepo ? '是' : '否'
  } · 本地远程：${reposStore.remoteStatusLabel}`
})

const importTooltip = computed(() => {
  if (!reposStore.hasDirectory) {
    return '请先选择项目目录'
  }
  if (reposStore.loading) {
    return '正在检测本地远程'
  }
  if (!reposStore.isGitRepo) {
    return '当前目录不是 Git 仓库'
  }
  if (reposStore.localRemotes.length === 0) {
    return '本地没有配置任何远程'
  }
  if (reposStore.importing) {
    return '正在从本地远程导入'
  }

  return '将本地 Git 远程导入 .git-remotes.txt'
})

async function handleSelectDirectory(): Promise<void> {
  await projectStore.selectDirectory()
}

async function handleInitialize(): Promise<void> {
  if (reposStore.initStatus?.configFileExists) {
    try {
      await ElMessageBox.confirm(
        '配置文件已存在，是否覆盖？覆盖后原有仓库配置将丢失。',
        '覆盖配置文件',
        {
          type: 'warning',
          confirmButtonText: '覆盖',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch {
      return
    }
  }

  const initialized = await reposStore.initializeConfig(
    reposStore.initStatus?.configFileExists === true
  )
  if (!initialized) {
    return
  }

  const importedCount = reposStore.importResult?.added.length ?? 0
  if (importedCount > 0) {
    ElMessage.success(
      `已从本地远程导入 ${importedCount} 个仓库到配置文件。`
    )
  }
}

async function handleSetup(): Promise<void> {
  const result = await reposStore.setupRemotes()
  if (result) {
    setupDialogVisible.value = true
  }
}

async function handleImportFromRemotes(): Promise<void> {
  const result = await reposStore.importFromRemotes(false)
  if (result) {
    importDialogVisible.value = true
  }
}

function closeImportDialog(): void {
  importDialogVisible.value = false
}

async function handleOverwriteConflicts(): Promise<void> {
  applyingOverwrite.value = true
  try {
    const result = await reposStore.importFromRemotes(true)
    if (!result) {
      return
    }

    importDialogVisible.value = false
    if (result.updated.length > 0) {
      ElMessage.success(
        `已用本地 URL 覆盖 ${result.updated.length} 个冲突项。`
      )
    }
  } finally {
    applyingOverwrite.value = false
  }
}

watch(
  () => [
    reposStore.hasDirectory,
    reposStore.loading,
    reposStore.needsInit,
    reposStore.needsSetup,
    reposStore.hasValidRepo
  ] as const,
  ([hasDirectory, loading, needsInit, needsSetup, hasValidRepo]) => {
    if (
      !hasDirectory ||
      loading ||
      needsInit ||
      needsSetup ||
      !hasValidRepo
    ) {
      if (!setupPanels.value.includes('setup')) {
        setupPanels.value = ['setup']
      }
      return
    }

    setupPanels.value = []
  },
  { immediate: true }
)

watch(
  () => projectStore.cwd,
  async () => {
    await reposStore.refresh()
  },
  { immediate: true }
)
</script>

<template>
  <section class="repo-manage-page">
    <div class="page-toolbar">
      <div class="directory-summary" :title="directoryTitle">
        <el-icon class="directory-icon"><FolderOpened /></el-icon>
        <span class="directory-label">项目目录</span>
        <span class="directory-value">{{ directoryTitle }}</span>
      </div>

      <div class="toolbar-actions">
        <el-button :icon="FolderOpened" @click="handleSelectDirectory">
          选择目录
        </el-button>
        <el-button
          :icon="Refresh"
          :loading="reposStore.loading"
          :disabled="!reposStore.hasDirectory"
          @click="reposStore.refresh"
        >
          刷新配置
        </el-button>
        <el-tooltip :content="importTooltip" placement="top">
          <span class="tooltip-target">
            <el-button
              :icon="UploadFilled"
              :loading="reposStore.importing"
              :disabled="!reposStore.canImportRemotes"
              @click="handleImportFromRemotes"
            >
              从本地远程导入
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>

    <el-alert
      v-if="reposStore.error"
      class="page-error"
      type="error"
      :closable="false"
      show-icon
      :title="reposStore.error"
    />

    <section class="setup-section">
      <el-collapse v-model="setupPanels" class="setup-collapse">
        <el-collapse-item name="setup">
          <template #title>
            <div class="collapse-title">
              <el-icon><Setting /></el-icon>
              <span>首次设置</span>
              <span
                v-if="setupNeedsAttention"
                class="setup-attention"
              >
                需要处理
              </span>
              <span v-else class="setup-complete">已完成</span>
            </div>
          </template>

          <div class="setup-content">
            <div class="setup-buttons">
              <el-tooltip :content="initTooltip" placement="top">
                <span class="tooltip-target">
                  <el-button
                    :loading="reposStore.initializing"
                    :disabled="!reposStore.canInitialize"
                    @click="handleInitialize"
                  >
                    初始化配置
                  </el-button>
                </span>
              </el-tooltip>

              <el-tooltip :content="setupTooltip" placement="top">
                <span class="tooltip-target">
                  <el-button
                    type="primary"
                    :loading="reposStore.settingUp"
                    :disabled="!reposStore.canSetup"
                    @click="handleSetup"
                  >
                    Setup 远程
                  </el-button>
                </span>
              </el-tooltip>
            </div>

            <div class="setup-status">{{ setupStatusText }}</div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </section>

    <section class="repository-section">
      <div class="section-toolbar">
        <div>
          <h1>仓库管理</h1>
          <p>配置意图与本地 Git 远程对照</p>
        </div>

        <el-button
          type="primary"
          :loading="reposStore.saving"
          :disabled="!canModify"
          @click="reposStore.save"
        >
          保存配置
        </el-button>
      </div>

      <RemoteListPanel
        :repositories="reposStore.repositories"
        :loading="reposStore.loading || reposStore.saving"
        :can-modify="canModify"
        :extra-remotes="reposStore.extraRemotes"
        :can-import-remotes="reposStore.canImportRemotes"
        :importing="reposStore.importing"
        @add="reposStore.addRepository"
        @update="reposStore.updateRepository"
        @remove="reposStore.removeRepository"
        @toggle="reposStore.toggleRepository"
        @import-remotes="handleImportFromRemotes"
      />
    </section>

    <el-dialog
      v-model="setupDialogVisible"
      title="Setup 远程结果"
      width="min(680px, 92vw)"
      destroy-on-close
    >
      <div v-if="reposStore.setupResult" class="import-result">
        <section class="import-result-section">
          <h3>新增 {{ reposStore.setupResult.added.length }} 个</h3>
          <div v-if="reposStore.setupResult.added.length" class="import-result-list">
            <div
              v-for="item in reposStore.setupResult.added"
              :key="`setup-added-${item.name}`"
              class="import-result-row"
            >
              <code>{{ item.name }}</code>
              <span>{{ item.url }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>

        <section class="import-result-section">
          <h3>更新 {{ reposStore.setupResult.updated.length }} 个</h3>
          <div v-if="reposStore.setupResult.updated.length" class="import-result-list">
            <div
              v-for="item in reposStore.setupResult.updated"
              :key="`setup-updated-${item.name}`"
              class="import-result-row"
            >
              <code>{{ item.name }}</code>
              <span>{{ item.url }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>

        <section class="import-result-section">
          <h3>跳过 {{ reposStore.setupResult.skipped.length }} 个（URL 一致）</h3>
          <div v-if="reposStore.setupResult.skipped.length" class="import-result-list">
            <div
              v-for="item in reposStore.setupResult.skipped"
              :key="`setup-skipped-${item.name}`"
              class="import-result-row"
            >
              <code>{{ item.name }}</code>
              <span>{{ item.url }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>

        <section class="import-result-section">
          <h3>失败 {{ reposStore.setupResult.failed.length }} 个</h3>
          <div v-if="reposStore.setupResult.failed.length" class="import-result-list">
            <div
              v-for="item in reposStore.setupResult.failed"
              :key="`setup-failed-${item.name}`"
              class="import-result-row import-result-row--conflict"
            >
              <code>{{ item.name }}</code>
              <span>{{ item.url }}</span>
              <span>{{ item.reason }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>
      </div>

      <template #footer>
        <el-button @click="setupDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      title="从本地远程导入"
      width="min(680px, 92vw)"
      destroy-on-close
    >
      <div
        v-if="reposStore.importResult"
        class="import-result"
      >
        <section class="import-result-section">
          <h3>新增 {{ reposStore.importResult.added.length }} 个</h3>
          <div
            v-if="reposStore.importResult.added.length"
            class="import-result-list"
          >
            <div
              v-for="item in reposStore.importResult.added"
              :key="`added-${item.alias}`"
              class="import-result-row"
            >
              <code>{{ item.alias }}</code>
              <span>{{ item.url }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>

        <section class="import-result-section">
          <h3>跳过 {{ reposStore.importResult.skipped.length }} 个</h3>
          <div
            v-if="reposStore.importResult.skipped.length"
            class="import-result-list"
          >
            <div
              v-for="item in reposStore.importResult.skipped"
              :key="`skipped-${item.alias}`"
              class="import-result-row"
            >
              <code>{{ item.alias }}</code>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
        </section>

        <section class="import-result-section">
          <h3>冲突 {{ reposStore.importResult.conflict.length }} 个</h3>
          <div
            v-if="reposStore.importResult.conflict.length"
            class="import-result-list"
          >
            <div
              v-for="item in reposStore.importResult.conflict"
              :key="`conflict-${item.alias}`"
              class="import-result-row import-result-row--conflict"
            >
              <code>{{ item.alias }}</code>
              <span>配置文件 URL：{{ item.configUrl }}</span>
              <span>本地 URL：{{ item.localUrl }}</span>
            </div>
          </div>
          <p v-else class="import-result-empty">无</p>
          <el-alert
            v-if="reposStore.importResult.conflict.length"
            type="warning"
            :closable="false"
            show-icon
            title="如需用本地 URL 覆盖，请点击下方按钮。"
          />
        </section>
      </div>

      <template #footer>
        <el-button @click="closeImportDialog">仅应用新增</el-button>
        <el-button
          v-if="reposStore.importResult?.conflict.length"
          type="primary"
          :loading="applyingOverwrite"
          @click="handleOverwriteConflicts"
        >
          用本地 URL 覆盖冲突项
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.repo-manage-page {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--app-bg);
}

.page-toolbar,
.section-toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.page-toolbar {
  min-height: 36px;
}

.directory-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 12px;
}

.directory-icon {
  flex: 0 0 auto;
  color: var(--el-color-primary);
}

.directory-label {
  flex: 0 0 auto;
}

.directory-value {
  min-width: 0;
  overflow: hidden;
  color: var(--text-strong);
  font-family: "Cascadia Mono", Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.page-error {
  flex: 0 0 auto;
}

.setup-section,
.repository-section {
  flex: 0 0 auto;
}

.repository-section {
  display: flex;
  min-height: 280px;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
}

.section-toolbar h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
}

.section-toolbar p {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.setup-collapse {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: var(--panel-bg);
}

.setup-collapse :deep(.el-collapse-item__header) {
  min-height: 40px;
  padding: 0 14px;
  border-bottom: 0;
  background: transparent;
}

.setup-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background: transparent;
}

.setup-collapse :deep(.el-collapse-item__content) {
  padding: 0 14px 12px;
}

.collapse-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 650;
}

.setup-attention,
.setup-complete {
  font-size: 11px;
  font-weight: 500;
}

.setup-attention {
  color: var(--el-color-warning);
}

.setup-complete {
  color: var(--el-color-success);
}

.setup-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 2px;
}

.setup-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tooltip-target {
  display: inline-flex;
}

.setup-status {
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
}

.import-result {
  display: grid;
  gap: 14px;
}

.import-result-section h3 {
  margin: 0 0 7px;
  color: var(--text-strong);
  font-size: 13px;
}

.import-result-list {
  display: grid;
  gap: 5px;
}

.import-result-row {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(90px, 0.35fr) minmax(0, 1fr);
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--text-main);
  font-size: 11px;
}

.import-result-row code {
  overflow: hidden;
  color: var(--el-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-result-row span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.import-result-row--conflict {
  grid-template-columns: 1fr;
  background: var(--el-color-warning-light-9);
}

.import-result-empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
}

@media (max-width: 760px) {
  .page-toolbar,
  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-actions :deep(.el-button) {
    flex: 1;
    margin: 0;
  }
}
</style>
