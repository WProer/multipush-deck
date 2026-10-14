<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref, watch } from 'vue'
import {
  CircleCheck,
  InfoFilled,
  Plus,
  UploadFilled,
  Warning
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type {
  LocalRemoteItem,
  LocalRemoteStatus,
  RepositoryConfig
} from '../../../shared/types'
import type { RepositoryListItem } from '../stores/reposStore'
import RepositoryDialog from './RepositoryDialog.vue'

const props = defineProps<{
  repositories: RepositoryListItem[]
  loading: boolean
  canModify: boolean
  extraRemotes: LocalRemoteItem[]
  canImportRemotes: boolean
  importing: boolean
}>()

const emit = defineEmits<{
  add: [repository: RepositoryConfig]
  update: [id: string, repository: RepositoryConfig]
  remove: [id: string]
  toggle: [id: string, enabled: boolean]
  importRemotes: []
}>()

const dialogVisible = ref(false)
const editingId = ref('')
const editingRepository = ref<RepositoryConfig | null>(null)
const extraPanels = ref<string[]>([])

const importTooltip = computed(() => {
  if (!props.canImportRemotes) {
    return '本地没有配置任何远程'
  }
  if (props.extraRemotes.length === 0) {
    return '没有可导入的多余远程'
  }

  return '将本地多余远程写入配置文件'
})

const localStatusMeta: Record<
  LocalRemoteStatus,
  { label: string; icon: Component; tone: string }
> = {
  matched: {
    label: '已配置且一致',
    icon: CircleCheck,
    tone: 'matched'
  },
  url_mismatch: {
    label: '本地 URL 与配置不一致',
    icon: Warning,
    tone: 'mismatch'
  },
  not_setup: {
    label: '尚未 Setup',
    icon: InfoFilled,
    tone: 'not-setup'
  }
}

function getLocalStatusMeta(status: unknown) {
  return (
    localStatusMeta[status as LocalRemoteStatus] ?? localStatusMeta.not_setup
  )
}

function openAddDialog(): void {
  editingId.value = ''
  editingRepository.value = null
  dialogVisible.value = true
}

function openEditDialog(repository: RepositoryListItem): void {
  editingId.value = repository.id
  editingRepository.value = {
    alias: repository.alias,
    url: repository.url,
    enabled: repository.enabled
  }
  dialogVisible.value = true
}

function handleSubmit(repository: RepositoryConfig): void {
  if (editingId.value) {
    emit('update', editingId.value, repository)
  } else {
    emit('add', repository)
  }
}

function handleToggle(row: RepositoryListItem, value: unknown): void {
  emit('toggle', row.id, Boolean(value))
}

async function confirmRemove(row: RepositoryListItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除仓库 ${row.alias || row.url}？`,
      '删除仓库',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('remove', row.id)
  } catch {
    // Cancelled by the user.
  }
}

watch(
  () => props.extraRemotes.length,
  (value, previous) => {
    if (value === 0 || value < previous) {
      extraPanels.value = []
    }
  }
)
</script>

<template>
  <section class="panel remote-list-panel">
    <div class="panel-header">
      <div>
        <h2>仓库列表</h2>
        <p>
          {{ props.repositories.length }} 个配置仓库，主数据来自 .git-remotes.txt
        </p>
      </div>

      <el-button
        type="primary"
        :icon="Plus"
        :disabled="!props.canModify || props.loading"
        @click="openAddDialog"
      >
        添加仓库
      </el-button>
    </div>

    <div class="table-wrap">
      <el-table
        v-if="props.repositories.length"
        :data="props.repositories"
        height="100%"
        size="small"
        stripe
      >
        <el-table-column label="别名" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'muted-cell': !row.alias }">
              {{ row.alias || '未命名' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="url"
          label="仓库 URL"
          min-width="220"
          show-overflow-tooltip
        />

        <el-table-column label="本地状态" width="104" align="center">
          <template #default="{ row }">
            <el-tooltip
              placement="top"
              effect="dark"
              :content="row.localStatusMessage"
            >
              <span
                class="local-status"
                :class="`local-status--${getLocalStatusMeta(row.localStatus).tone}`"
                :aria-label="getLocalStatusMeta(row.localStatus).label"
              >
                <el-icon>
                  <component :is="getLocalStatusMeta(row.localStatus).icon" />
                </el-icon>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="启用" width="78" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              size="small"
              :disabled="!props.canModify || props.loading"
              @change="handleToggle(row, $event)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="126" align="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="!props.canModify || props.loading"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="!props.canModify || props.loading"
              @click="confirmRemove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else
        description="尚未配置任何仓库，请在下方添加或编辑配置文件。"
        :image-size="72"
      >
        <el-button
          type="primary"
          :disabled="!props.canModify || props.loading"
          @click="openAddDialog"
        >
          添加仓库
        </el-button>
      </el-empty>
    </div>

    <el-collapse v-model="extraPanels" class="extra-remote-collapse">
      <el-collapse-item
        name="extra"
        :title="`本地多余远程 (${props.extraRemotes.length})`"
      >
        <div class="extra-remote-intro">
          <span>
            以下远程存在于本地仓库，但未写入配置文件。点击下方按钮可导入到配置文件。
          </span>
          <el-tooltip :content="importTooltip" placement="top">
            <span class="tooltip-target">
              <el-button
                type="primary"
                plain
                size="small"
                :icon="UploadFilled"
                :loading="props.importing"
                :disabled="
                  !props.canImportRemotes ||
                  props.extraRemotes.length === 0
                "
                @click="emit('importRemotes')"
              >
                一键导入全部
              </el-button>
            </span>
          </el-tooltip>
        </div>

        <div v-if="props.extraRemotes.length" class="extra-remote-list">
          <div
            v-for="remote in props.extraRemotes"
            :key="remote.name"
            class="extra-remote-row"
          >
            <div class="extra-remote-main">
              <el-icon><UploadFilled /></el-icon>
              <code>{{ remote.name }}</code>
              <span :title="remote.fetchUrl || remote.pushUrls.join(' / ')">
                {{ remote.fetchUrl || remote.pushUrls.join(' / ') || '-' }}
              </span>
            </div>
            <span class="extra-remote-hint">
              可执行 git remote remove {{ remote.name }} 清理
            </span>
          </div>
        </div>

        <div v-else class="extra-remote-empty">
          没有本地多余远程
        </div>
      </el-collapse-item>
    </el-collapse>

    <RepositoryDialog
      v-model="dialogVisible"
      :repository="editingRepository"
      @submit="handleSubmit"
    />
  </section>
</template>

<style scoped>
.remote-list-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 650;
}

.panel-header p {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.table-wrap {
  min-height: 0;
  flex: 1;
  padding: 10px 12px;
}

.extra-remote-collapse {
  flex: 0 0 auto;
  margin: 0 12px 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.extra-remote-collapse :deep(.el-collapse-item__header) {
  min-height: 36px;
  padding: 0 12px;
  border-bottom: 0;
  background: transparent;
}

.extra-remote-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background: transparent;
}

.extra-remote-collapse :deep(.el-collapse-item__content) {
  padding: 0 12px 10px;
}

.extra-remote-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0 9px;
  color: var(--text-muted);
  font-size: 11px;
}

.tooltip-target {
  display: inline-flex;
  flex: 0 0 auto;
}

.extra-remote-list {
  display: grid;
  gap: 4px;
}

.extra-remote-row {
  display: grid;
  gap: 3px;
  padding: 7px 0;
  border-top: 1px solid var(--border-soft);
}

.extra-remote-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: var(--el-text-color-secondary);
}

.extra-remote-main code {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
}

.extra-remote-main span {
  min-width: 0;
  overflow: hidden;
  color: var(--text-main);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.extra-remote-hint,
.extra-remote-empty {
  color: var(--text-muted);
  font-size: 11px;
}

.extra-remote-empty {
  padding: 5px 0;
}

.local-status {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 999px;
  font-size: 14px;
  cursor: help;
}

.local-status--matched {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.local-status--mismatch {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.local-status--not-setup {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.muted-cell {
  color: var(--el-text-color-placeholder);
}

@media (max-width: 760px) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
