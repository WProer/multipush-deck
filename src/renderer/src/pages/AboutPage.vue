<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  CopyDocument,
  Cpu,
  DataLine,
  Document,
  Download,
  Files,
  InfoFilled,
  Link,
  Loading,
  Monitor,
  Operation,
  Refresh
} from '@element-plus/icons-vue'
import type { AppInfo, RuntimeInfo } from '../../../shared/types'
import { useProjectStore } from '../stores/projectStore'

const LICENSE_URL =
  'https://github.com/WProer/multipush-deck/blob/master/LICENSE'

interface FeatureItem {
  title: string
  description: string
  icon: typeof Box
}

const projectStore = useProjectStore()
const appInfo = ref<AppInfo | null>(null)
const runtimeInfo = ref<RuntimeInfo | null>(null)
const loading = ref(true)
const errorMessage = ref('')

const rawBuildTime =
  typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

const buildTime = computed(() => formatTime(rawBuildTime))

const featureItems: FeatureItem[] = [
  {
    title: '多仓库同步',
    description: '一次推送，多端同步',
    icon: Monitor
  },
  {
    title: '选择性提交',
    description: '文件级暂存与提交',
    icon: Files
  },
  {
    title: '提交日志',
    description: '查看历史与推送状态',
    icon: DataLine
  },
  {
    title: '本地远程导入',
    description: '从已有 Git 配置反向导入',
    icon: Download
  }
]

const runtimeRows = computed(() => {
  const info = runtimeInfo.value
  return [
    { label: 'Electron', value: info?.versions.electron ?? '-' },
    { label: 'Chromium', value: info?.versions.chromium ?? '-' },
    { label: 'Node', value: info?.versions.node ?? '-' },
    {
      label: '操作系统',
      value: info ? `${info.platform} / ${info.arch}` : '-'
    },
    { label: '系统 Git', value: info?.gitVersion ?? '-' }
  ]
})

const dependencyRows = computed(() => {
  const versions = runtimeInfo.value?.versions
  return [
    { name: 'Vue', version: versions?.vue ?? '-' },
    { name: 'Element Plus', version: versions?.elementPlus ?? '-' },
    { name: 'Pinia', version: versions?.pinia ?? '-' },
    { name: 'electron-vite', version: versions?.electronVite ?? '-' }
  ]
})

const license = computed(
  () => appInfo.value?.license ?? 'PolyForm Noncommercial 1.0.0'
)

function formatTime(value: string): string {
  if (!value) {
    return '开发环境'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

async function loadInfo(): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
    const [app, runtime] = await Promise.all([
      window.api.getAppInfo(),
      window.api.getRuntimeInfo()
    ])
    appInfo.value = app
    runtimeInfo.value = runtime
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

async function openRepository(): Promise<void> {
  const url = appInfo.value?.repositoryUrl
  if (!url) {
    return
  }

  try {
    await window.api.openExternal(url)
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '打开项目地址失败'
    )
  }
}

async function openLicense(): Promise<void> {
  try {
    await window.api.openExternal(LICENSE_URL)
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '打开许可证失败'
    )
  }
}

function buildVersionText(): string {
  const app = appInfo.value
  const runtime = runtimeInfo.value
  return [
    `应用：${app?.name ?? 'MultiPush Deck'}`,
    `版本：${app?.version ?? '-'}`,
    `Electron：${runtime?.versions.electron ?? '-'}`,
    `Chromium：${runtime?.versions.chromium ?? '-'}`,
    `Node：${runtime?.versions.node ?? '-'}`,
    `系统：${runtime ? `${runtime.platform} / ${runtime.arch}` : '-'}`,
    `系统 Git：${runtime?.gitVersion ?? '-'}`,
    'Vue：' + (runtime?.versions.vue ?? '-'),
    'Element Plus：' + (runtime?.versions.elementPlus ?? '-'),
    'Pinia：' + (runtime?.versions.pinia ?? '-'),
    'electron-vite：' + (runtime?.versions.electronVite ?? '-')
  ].join('\n')
}

async function copyVersionInfo(): Promise<void> {
  try {
    await window.api.copyToClipboard(buildVersionText())
    ElMessage.success('版本信息已复制到剪贴板')
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '复制版本信息失败'
    )
  }
}

async function openLogDirectory(): Promise<void> {
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
      error instanceof Error ? error.message : '打开日志目录失败'
    )
  }
}

function checkUpdate(): void {
  ElMessage.success('已是最新版本')
}

onMounted(() => {
  void loadInfo()
})
</script>

<template>
  <section class="about-page">
    <header class="page-heading">
      <div class="heading-icon">
        <el-icon><InfoFilled /></el-icon>
      </div>
      <div>
        <h1>关于</h1>
        <p>查看应用版本、核心功能与运行环境信息。</p>
      </div>
    </header>

    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      show-icon
      title="读取应用信息失败"
      :description="errorMessage"
    />

    <el-row :gutter="16" class="about-grid">
      <el-col :span="24">
        <el-card shadow="never" class="about-card banner-card">
          <div class="banner">
            <div class="app-mark">MP</div>
            <div class="app-copy">
              <h2>{{ appInfo?.name ?? 'MultiPush Deck' }}</h2>
              <p>版本 {{ appInfo?.version ?? '-' }}</p>
            </div>
            <div class="banner-actions">
              <el-button
                type="primary"
                plain
                :icon="Link"
                @click="openRepository"
              >
                GitHub 仓库
              </el-button>
              <el-tag type="info" effect="plain">{{ license }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16">
        <el-card shadow="never" class="about-card">
          <template #header>
            <div class="card-title">
              <el-icon><Monitor /></el-icon>
              <h3>功能一览</h3>
            </div>
          </template>

          <ul class="feature-list">
            <li v-for="item in featureItems" :key="item.title">
              <span class="feature-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <div>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="never" class="about-card">
          <template #header>
            <div class="card-title">
              <el-icon><Cpu /></el-icon>
              <h3>运行环境</h3>
              <el-icon v-if="loading" class="card-loading"><Loading /></el-icon>
            </div>
          </template>

          <dl class="info-table">
            <div v-for="row in runtimeRows" :key="row.label" class="info-line">
              <dt>{{ row.label }}</dt>
              <dd :title="row.value">{{ row.value }}</dd>
            </div>
          </dl>

          <div class="card-footer">
            <el-button
              text
              :icon="Refresh"
              :loading="loading"
              @click="loadInfo"
            >
              刷新信息
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="never" class="about-card">
          <template #header>
            <div class="card-title">
              <el-icon><Box /></el-icon>
              <h3>依赖版本</h3>
            </div>
          </template>

          <el-table :data="dependencyRows" size="small" class="dep-table">
            <el-table-column prop="name" label="依赖" width="120" />
            <el-table-column prop="version" label="版本" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="never" class="about-card">
          <template #header>
            <div class="card-title">
              <el-icon><Document /></el-icon>
              <h3>项目信息</h3>
            </div>
          </template>

          <dl class="info-table">
            <div class="info-line">
              <dt>开源地址</dt>
              <dd>
                <button
                  v-if="appInfo?.repositoryUrl"
                  class="external-link"
                  type="button"
                  @click="openRepository"
                >
                  {{ appInfo.repositoryUrl }}
                </button>
                <span v-else>-</span>
              </dd>
            </div>
            <div class="info-line">
              <dt>许可协议</dt>
              <dd class="license-cell">
                <span :title="license">{{ license }}</span>
                <button
                  class="external-link license-link"
                  type="button"
                  @click="openLicense"
                >
                  查看
                </button>
              </dd>
            </div>
            <div class="info-line">
              <dt>构建时间</dt>
              <dd :title="buildTime">{{ buildTime }}</dd>
            </div>
          </dl>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="never" class="about-card">
          <template #header>
            <div class="card-title">
              <el-icon><Operation /></el-icon>
              <h3>操作</h3>
            </div>
          </template>

          <div class="action-list">
            <el-button :icon="CopyDocument" @click="copyVersionInfo">
              复制版本信息
            </el-button>
            <el-button :icon="Files" @click="openLogDirectory">
              打开日志目录
            </el-button>
            <el-button :icon="Refresh" @click="checkUpdate">
              检查更新
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.about-page {
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
.card-title h3,
.app-copy h2,
.feature-list h4 {
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

.about-grid {
  min-width: 0;
}

.about-grid :deep(.el-col) {
  margin-bottom: 16px;
}

.about-card {
  min-height: 100%;
  border-radius: 8px;
  border-color: var(--border-color);
}

.about-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-soft);
}

.about-card :deep(.el-card__body) {
  padding: 14px 16px;
}

.banner-card :deep(.el-card__body) {
  padding: 16px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-mark {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 17px;
  font-weight: 700;
}

.app-copy h2 {
  font-size: 18px;
}

.app-copy p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
}

.card-title h3 {
  font-size: 14px;
}

.card-loading {
  margin-left: auto;
  color: var(--text-muted);
  animation: about-spin 1s linear infinite;
}

@keyframes about-spin {
  to {
    transform: rotate(360deg);
  }
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px;
  border: 1px solid var(--border-soft);
  border-radius: 7px;
  background: var(--el-fill-color-lighter);
}

html.dark .feature-list li {
  background: var(--el-fill-color-light);
}

.feature-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 17px;
}

.feature-list h4 {
  font-size: 13px;
}

.feature-list p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.info-table {
  margin: 0;
}

.info-line {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-soft);
}

.info-line:last-child {
  border-bottom: 0;
}

.info-line dt {
  color: var(--text-muted);
  font-size: 12px;
}

.info-line dd {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--text-main);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-link {
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-link:hover {
  text-decoration: underline;
}

.license-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.license-cell > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.license-link {
  flex: 0 0 auto;
}

.dep-table {
  width: 100%;
}

.dep-table :deep(.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}

.card-footer {
  margin-top: 8px;
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

@media (max-width: 900px) {
  .banner {
    flex-wrap: wrap;
  }

  .banner-actions {
    width: 100%;
    margin-left: 0;
  }
}
</style>
