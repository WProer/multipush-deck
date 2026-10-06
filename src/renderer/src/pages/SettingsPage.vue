<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Delete,
  Document,
  FolderOpened,
  InfoFilled,
  Monitor,
  Moon,
  Refresh,
  Setting,
  Sunny,
  Tickets,
  View
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  useSettingsStore,
  type AppTheme,
  type LogDetailLevel,
  type LogPanelState
} from '../stores/settingsStore'
import { useProjectStore } from '../stores/projectStore'

const router = useRouter()
const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

const defaultProjectDirectoryDraft = ref(
  settingsStore.defaultProjectDirectory
)

const themeModel = computed<AppTheme>({
  get: () => settingsStore.theme,
  set: (value) => settingsStore.setTheme(value)
})

const logLevelModel = computed<LogDetailLevel>({
  get: () => settingsStore.logLevel,
  set: (value) => settingsStore.setLogLevel(value)
})

const logPanelStateModel = computed<LogPanelState>({
  get: () => settingsStore.logPanelState,
  set: (value) => settingsStore.setLogPanelState(value)
})

const showRawOutputModel = computed<boolean>({
  get: () => settingsStore.showRawOutput,
  set: (value) => settingsStore.setShowRawOutput(value)
})

watch(
  () => settingsStore.defaultProjectDirectory,
  (value) => {
    defaultProjectDirectoryDraft.value = value
  }
)

async function selectDefaultProjectDirectory(): Promise<void> {
  const selected = await window.api.selectDirectory()
  if (!selected) {
    return
  }

  defaultProjectDirectoryDraft.value = selected
  settingsStore.setDefaultProjectDirectory(selected)
  ElMessage.success('默认项目目录已保存')
}

function saveDefaultProjectDirectory(): void {
  settingsStore.setDefaultProjectDirectory(defaultProjectDirectoryDraft.value)
  ElMessage.success('默认项目目录已保存')
}

async function openConfigDirectory(): Promise<void> {
  if (!projectStore.cwd) {
    ElMessage.info('请先在仓库管理页选择项目目录')
    return
  }

  try {
    const result = await window.api.openPath(projectStore.cwd)
    if (result) {
      ElMessage.error(result)
    }
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '打开配置文件目录失败'
    )
  }
}

async function clearCacheAndRestart(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '将清除本应用保存在本地的全部缓存数据，并重新启动界面。是否继续？',
      '清除本地缓存',
      {
        type: 'warning',
        confirmButtonText: '清除并重启',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('multipush-deck:')) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage failures and reload the window anyway.
  }

  window.location.reload()
}

async function resetAllSettings(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '将把所有设置恢复为默认值。是否继续？',
      '重置所有设置',
      {
        type: 'warning',
        confirmButtonText: '重置',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  settingsStore.resetToDefaults()
  defaultProjectDirectoryDraft.value = settingsStore.defaultProjectDirectory
  ElMessage.success('已恢复默认设置')
}
</script>

<template>
  <section class="settings-page">
    <header class="page-heading">
      <div class="heading-icon">
        <el-icon><Setting /></el-icon>
      </div>
      <div>
        <h1>设置</h1>
        <p>配置默认目录、日志行为与界面主题。</p>
      </div>
    </header>

    <el-alert
      class="settings-alert"
      type="info"
      :closable="false"
      show-icon
      title="当前设置会自动保存在本地，修改后立即生效。"
    />

    <el-row :gutter="16" class="settings-grid">
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="never" class="settings-card">
          <template #header>
            <div class="card-title">
              <el-icon><FolderOpened /></el-icon>
              <h2>默认目录</h2>
            </div>
          </template>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="默认项目目录">
              <el-input
                v-model="defaultProjectDirectoryDraft"
                clearable
                placeholder="启动时自动加载的项目目录"
                @keyup.enter="saveDefaultProjectDirectory"
              />
            </el-form-item>
            <div class="form-actions">
              <el-button :icon="FolderOpened" @click="selectDefaultProjectDirectory">
                选择目录
              </el-button>
              <el-button type="primary" @click="saveDefaultProjectDirectory">
                保存
              </el-button>
            </div>
          </el-form>

          <p class="card-hint">仅在当前未选择项目时生效。</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="never" class="settings-card">
          <template #header>
            <div class="card-title">
              <el-icon><View /></el-icon>
              <h2>日志偏好</h2>
            </div>
          </template>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="日志级别">
              <el-radio-group v-model="logLevelModel">
                <el-radio-button value="normal">普通</el-radio-button>
                <el-radio-button value="verbose">详细</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="日志面板初始状态">
              <el-radio-group v-model="logPanelStateModel">
                <el-radio-button value="hidden">隐藏</el-radio-button>
                <el-radio-button value="collapsed">折叠</el-radio-button>
                <el-radio-button value="expanded">展开</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="是否显示原始输出">
              <el-switch v-model="showRawOutputModel" />
            </el-form-item>
          </el-form>

          <div class="card-hint-block">
            <p class="card-hint">详细级别会保留更多命令过程信息。</p>
            <p class="card-hint">日志面板选择会立即生效。</p>
            <p class="card-hint">开启原始输出后可在日志中查看未过滤内容。</p>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="never" class="settings-card">
          <template #header>
            <div class="card-title">
              <el-icon><Monitor /></el-icon>
              <h2>界面主题</h2>
            </div>
          </template>

          <el-form label-position="top" class="settings-form">
            <el-form-item label="主题">
              <el-radio-group v-model="themeModel">
                <el-radio-button value="light">
                  <span class="option-content">
                    <el-icon><Sunny /></el-icon>
                    <span>浅色</span>
                  </span>
                </el-radio-button>
                <el-radio-button value="dark">
                  <span class="option-content">
                    <el-icon><Moon /></el-icon>
                    <span>深色</span>
                  </span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="语言">
              <el-select :model-value="'zh-CN'" disabled>
                <el-option label="简体中文" value="zh-CN" />
              </el-select>
            </el-form-item>
          </el-form>

          <p class="card-hint">切换主题后会立即作用于整个界面。</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="never" class="settings-card">
          <template #header>
            <div class="card-title">
              <el-icon><Tickets /></el-icon>
              <h2>高级</h2>
            </div>
          </template>

          <div class="action-list">
            <el-button :icon="Document" @click="openConfigDirectory">
              打开配置文件所在目录
            </el-button>
            <el-button :icon="Delete" @click="clearCacheAndRestart">
              清除本地缓存并重启
            </el-button>
            <el-button :icon="Refresh" @click="resetAllSettings">
              重置所有设置为默认值
            </el-button>
          </div>

          <p class="card-hint">清除缓存会移除本地保存的全部偏好设置。</p>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-footer">
      <el-button type="primary" plain :icon="InfoFilled" @click="router.push('/about')">
        查看关于页面
      </el-button>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--app-bg);
}

.page-heading {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-bg);
}

.heading-icon {
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

.page-heading h1,
.card-title h2 {
  margin: 0;
  color: var(--text-strong);
}

.page-heading h1 {
  font-size: 18px;
}

.page-heading p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.settings-alert {
  border-radius: 8px;
}

.settings-grid {
  min-width: 0;
}

.settings-grid :deep(.el-col) {
  margin-bottom: 16px;
}

.settings-card {
  min-height: 100%;
  height: 100%;
  border-radius: 8px;
  border-color: var(--border-color);
}

.settings-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-soft);
}

.settings-card :deep(.el-card__body) {
  display: flex;
  height: calc(100% - 49px);
  flex-direction: column;
  padding: 14px 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
}

.card-title h2 {
  font-size: 14px;
}

.settings-form {
  --el-form-item-margin-bottom: 14px;
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.settings-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.settings-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  color: var(--text-strong);
  font-size: 12px;
  font-weight: 600;
}

.settings-form :deep(.el-input),
.settings-form :deep(.el-select),
.settings-form :deep(.el-radio-group) {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.option-content {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.card-hint,
.card-hint-block p {
  margin: 12px 0 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}

.card-hint-block {
  margin-top: auto;
}

.card-hint-block p:first-child {
  margin-top: 12px;
}

.action-list {
  display: grid;
  gap: 10px;
}

.action-list .el-button {
  width: 100%;
  margin-left: 0;
  justify-content: flex-start;
}

.page-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .page-footer {
    justify-content: flex-start;
  }
}
</style>
