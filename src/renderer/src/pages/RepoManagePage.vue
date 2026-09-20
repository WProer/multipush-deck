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
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
<!-- 临时整理：第 1-4 项 -->
<!-- 临时整理：第 1-5 项 -->
<!-- 临时整理：第 1-6 项 -->
<!-- 临时整理：第 1-7 项 -->
<!-- 临时整理：第 1-8 项 -->
<!-- 临时整理：第 1-9 项 -->
<!-- 临时整理：第 1-10 项 -->
<!-- 临时整理：第 1-11 项 -->
<!-- 临时整理：第 1-12 项 -->
<!-- 临时整理：第 1-13 项 -->
<!-- 临时整理：第 1-14 项 -->
<!-- 临时整理：第 1-15 项 -->
<!-- 临时整理：第 1-16 项 -->
