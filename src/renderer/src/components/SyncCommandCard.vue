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
<!-- 临时整理：第 1-17 项 -->
<!-- 临时整理：第 1-18 项 -->
<!-- 临时整理：第 1-19 项 -->
<!-- 临时整理：第 1-20 项 -->
<!-- 临时整理：第 1-21 项 -->
<!-- 临时整理：第 1-22 项 -->
<!-- 临时整理：第 1-23 项 -->
<!-- 临时整理：第 1-24 项 -->
<!-- 临时整理：第 1-25 项 -->
<!-- 临时整理：第 1-26 项 -->
<!-- 临时整理：第 1-27 项 -->
<!-- 临时整理：第 1-28 项 -->
<!-- 临时整理：第 1-29 项 -->
<!-- 临时整理：第 1-30 项 -->
<!-- 临时整理：第 1-31 项 -->
<!-- 临时整理：第 1-32 项 -->
<!-- 临时整理：第 1-33 项 -->
<!-- 临时整理：第 1-34 项 -->
<!-- 临时整理：第 1-35 项 -->
<!-- 临时整理：第 1-36 项 -->
<!-- 临时整理：第 1-37 项 -->
<!-- 临时整理：第 1-38 项 -->
<!-- 临时整理：第 1-39 项 -->
<!-- 临时整理：第 1-40 项 -->
<!-- 临时整理：第 1-41 项 -->
<!-- 临时整理：第 1-42 项 -->
<!-- 临时整理：第 1-43 项 -->
<!-- 临时整理：第 1-44 项 -->
<!-- 临时整理：第 1-45 项 -->
<!-- 临时整理：第 1-46 项 -->
