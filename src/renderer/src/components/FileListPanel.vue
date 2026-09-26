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
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
<!-- 临时整理：第 1-4 项 -->
