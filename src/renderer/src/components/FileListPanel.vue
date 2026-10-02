<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import {
  Check,
  Refresh,
  RefreshLeft
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type { GitFileStatusCode, GitFileStatusItem } from '../../../shared/types'
import { useFilesStore } from '../stores/filesStore'

type FilePanelMode = 'unstaged' | 'staged'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  file: GitFileStatusItem | null
}

const props = defineProps<{
  mode: FilePanelMode
}>()

const store = useFilesStore()
const contextMenu = reactive<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  file: null
})

let diffClickTimer: ReturnType<typeof setTimeout> | null = null

const isStaged = computed(() => props.mode === 'staged')
const files = computed(() =>
  isStaged.value ? store.stagedFiles : store.unstagedFiles
)
const selectedPaths = computed(() =>
  isStaged.value ? store.selectedStaged : store.selectedUnstaged
)
const hasFiles = computed(() => files.value.length > 0)
const hasSelection = computed(() => selectedPaths.value.length > 0)
const panelTitle = computed(() =>
  isStaged.value ? '已暂存文件' : '未暂存文件'
)
const actionLabel = computed(() =>
  isStaged.value ? '取消暂存选中' : '暂存选中'
)
const emptyMessage = computed(() => {
  if (isStaged.value) {
    return '暂存区为空，请从左侧暂存文件'
  }

  if (store.hasFileStatus && store.files.length === 0) {
    return '工作区干净，没有需要提交的更改'
  }

  return '没有未暂存文件'
})

const actionTooltip = computed(() => {
  if (store.isBusy) {
    return '正在执行文件操作'
  }
  if (!hasSelection.value) {
    return '请先勾选文件'
  }

  return isStaged.value ? '取消暂存已勾选文件' : '暂存已勾选文件'
})

const refreshTooltip = computed(() => {
  if (!store.hasDirectory) {
    return '请先选择项目目录'
  }
  if (store.isBusy) {
    return '正在执行文件操作'
  }

  return '重新读取 Git 文件状态'
})

const statusMeta: Record<
  GitFileStatusCode,
  {
    letter: string
    label: string
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
> = {
  added: { letter: 'A', label: '新增', type: 'success' },
  modified: { letter: 'M', label: '修改', type: 'warning' },
  deleted: { letter: 'D', label: '删除', type: 'danger' },
  renamed: { letter: 'R', label: '重命名', type: 'primary' },
  copied: { letter: 'C', label: '复制', type: 'primary' },
  untracked: { letter: '?', label: '未跟踪', type: 'info' },
  conflicted: { letter: '!', label: '冲突', type: 'danger' },
  unknown: { letter: '?', label: '未知', type: 'info' }
}

function getStatusMeta(status: GitFileStatusCode) {
  return statusMeta[status] ?? statusMeta.unknown
}

function getFilePath(file: GitFileStatusItem): string {
  return file.originalPath
    ? `${file.originalPath} -> ${file.path}`
    : file.path
}

function isSelected(path: string): boolean {
  return selectedPaths.value.includes(path)
}

function isCurrentFile(file: GitFileStatusItem): boolean {
  return (
    store.currentFile?.path === file.path &&
    store.currentDiffStaged === isStaged.value
  )
}

function setSelection(paths: readonly string[]): void {
  if (isStaged.value) {
    store.setStagedSelection(paths)
  } else {
    store.setUnstagedSelection(paths)
  }
}

function toggleSelection(path: string, selected: unknown): void {
  if (isStaged.value) {
    store.toggleStagedSelection(path, Boolean(selected))
  } else {
    store.toggleUnstagedSelection(path, Boolean(selected))
  }
}

function selectAll(): void {
  setSelection(files.value.map((file) => file.path))
}

function clearSelection(): void {
  setSelection([])
}

function invertSelection(): void {
  setSelection(
    files.value
      .filter((file) => !isSelected(file.path))
      .map((file) => file.path)
  )
}

function cancelDiffClick(): void {
  if (diffClickTimer !== null) {
    clearTimeout(diffClickTimer)
    diffClickTimer = null
  }
}

function scheduleDiff(file: GitFileStatusItem): void {
  cancelDiffClick()
  diffClickTimer = setTimeout(() => {
    diffClickTimer = null
    void store.loadDiff(file, isStaged.value)
  }, 180)
}

async function handleDoubleClick(file: GitFileStatusItem): Promise<void> {
  cancelDiffClick()
  if (isStaged.value) {
    await store.unstageFile(file)
  } else {
    await store.stageFile(file)
  }
}

async function handlePrimaryAction(): Promise<void> {
  if (isStaged.value) {
    await store.unstageSelected()
  } else {
    await store.stageSelected()
  }
}

function refreshStatus(): void {
  void store.refreshStatus(true)
}

function openContextMenu(
  event: MouseEvent,
  file: GitFileStatusItem
): void {
  event.preventDefault()
  contextMenu.visible = true
  contextMenu.x = Math.min(event.clientX, window.innerWidth - 176)
  contextMenu.y = Math.min(event.clientY, window.innerHeight - 132)
  contextMenu.file = file
}

function closeContextMenu(): void {
  contextMenu.visible = false
  contextMenu.file = null
}

async function handleContextCommand(command: string): Promise<void> {
  const file = contextMenu.file
  closeContextMenu()

  if (!file) {
    return
  }

  if (command === 'action') {
    if (isStaged.value) {
      await store.unstageFile(file)
    } else {
      await store.stageFile(file)
    }
    return
  }

  if (command === 'diff') {
    await store.loadDiff(file, isStaged.value)
    return
  }

  if (command === 'discard') {
    await confirmDiscard(file)
  }
}

async function confirmDiscard(file: GitFileStatusItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定要丢弃“${file.path}”的未暂存更改吗？此操作无法撤销。`,
      '丢弃更改',
      {
        type: 'warning',
        confirmButtonText: '丢弃更改',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  await store.discardFile(file)
}

function handleGlobalClick(event: MouseEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('.file-context-menu')) {
    return
  }
  closeContextMenu()
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeContextMenu()
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  cancelDiffClick()
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <section
    class="panel file-side-panel"
    :class="isStaged ? 'staged-file-panel' : 'unstaged-file-panel'"
  >
    <header class="file-panel-header">
      <div class="panel-title-row">
        <span class="panel-title">{{ panelTitle }}</span>
        <el-tag
          size="small"
          effect="plain"
          :type="isStaged ? 'primary' : 'warning'"
        >
          {{ files.length }}
        </el-tag>
      </div>

      <div class="panel-toolbar">
        <el-tooltip
          :content="hasFiles ? '勾选当前列表全部文件' : '没有可选择的文件'"
          placement="top"
        >
          <span class="tooltip-target">
            <el-button
              size="small"
              :disabled="!hasFiles || store.isBusy"
              @click="selectAll"
            >
              全选
            </el-button>
          </span>
        </el-tooltip>

        <el-tooltip
          :content="hasSelection ? '清除当前列表勾选' : '当前没有已勾选文件'"
          placement="top"
        >
          <span class="tooltip-target">
            <el-button
              size="small"
              :disabled="!hasSelection || store.isBusy"
              @click="clearSelection"
            >
              全不选
            </el-button>
          </span>
        </el-tooltip>

        <el-tooltip
          :content="hasFiles ? '反转当前列表勾选状态' : '没有可反选的文件'"
          placement="top"
        >
          <span class="tooltip-target">
            <el-button
              size="small"
              :disabled="!hasFiles || store.isBusy"
              @click="invertSelection"
            >
              反选
            </el-button>
          </span>
        </el-tooltip>

        <el-divider direction="vertical" />

        <el-tooltip :content="actionTooltip" placement="top">
          <span class="tooltip-target">
            <el-button
              size="small"
              :type="isStaged ? 'warning' : 'primary'"
              plain
              :icon="isStaged ? RefreshLeft : Check"
              :loading="
                store.operation === (isStaged ? 'unstage' : 'stage')
              "
              :disabled="!hasSelection || store.isBusy"
              @click="handlePrimaryAction"
            >
              {{ actionLabel }}
            </el-button>
          </span>
        </el-tooltip>

        <template v-if="!isStaged">
          <el-divider direction="vertical" />

          <el-tooltip :content="refreshTooltip" placement="top">
            <span class="tooltip-target">
              <el-button
                size="small"
                :icon="Refresh"
                :loading="store.loading"
                :disabled="!store.hasDirectory || store.isBusy"
                @click="refreshStatus"
              >
                刷新状态
              </el-button>
            </span>
          </el-tooltip>
        </template>
      </div>
    </header>

    <div class="file-list-content">
      <div v-if="store.loading" class="state-block">
        <el-skeleton :rows="4" animated />
      </div>

      <el-alert
        v-else-if="store.error"
        class="panel-alert"
        type="error"
        :closable="false"
        show-icon
        :title="store.error"
      />

      <div v-else-if="!store.hasFileStatus" class="state-block empty-state">
        <p>选择 Git 仓库后显示文件状态</p>
      </div>

      <div v-else-if="!hasFiles" class="state-block empty-state">
        <p>{{ emptyMessage }}</p>
      </div>

      <div v-else class="file-list" role="list">
        <div
          v-for="file in files"
          :key="file.path"
          class="file-row"
          :class="{ 'is-current': isCurrentFile(file) }"
          role="listitem"
          @click="scheduleDiff(file)"
          @dblclick.stop="handleDoubleClick(file)"
          @contextmenu="openContextMenu($event, file)"
        >
          <span class="checkbox-target" @click.stop>
            <el-checkbox
              :model-value="isSelected(file.path)"
              :disabled="store.isBusy"
              @change="toggleSelection(file.path, $event)"
            />
          </span>

          <span
            class="status-icon"
            :class="`status-${getStatusMeta(file.status).type}`"
            :title="getStatusMeta(file.status).label"
          >
            {{ getStatusMeta(file.status).letter }}
          </span>

          <span class="file-path" :title="getFilePath(file)">
            {{ getFilePath(file) }}
          </span>
        </div>
      </div>
    </div>

<!-- 临时整理：第 2-1 项 -->
<!-- 临时整理：第 2-2 项 -->
<!-- 临时整理：第 2-3 项 -->
<!-- 临时整理：第 2-4 项 -->
<!-- 临时整理：第 2-5 项 -->
<!-- 临时整理：第 2-6 项 -->
<!-- 临时整理：第 2-7 项 -->
<!-- 临时整理：第 2-8 项 -->
<!-- 临时整理：第 2-9 项 -->
