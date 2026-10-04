<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CircleCheck,
  CircleClose,
  CopyDocument,
  Document,
  Files,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { html as renderDiffHtml } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import type {
  CommitFileChange,
  GitFileStatusCode
} from '../../../shared/types'
import { useCommitLogStore } from '../stores/commitLogStore'

interface DiffRenderResult {
  html: string
  error: string
  empty: boolean
}

const store = useCommitLogStore()
const copiedHash = ref('')

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

const commit = computed(() => store.selectedCommit)
const detail = computed(() => store.selectedCommitDetail)
const remotes = computed(() => store.selectedPushStatus?.remotes ?? [])
const fullMessage = computed(
  () => detail.value?.message || commit.value?.subject || ''
)

const diffRenderResult = computed<DiffRenderResult>(() => {
  const result = store.selectedFileDiff
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
