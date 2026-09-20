import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLogsStore } from './logsStore'
import { useProjectStore } from './projectStore'

export type AppTheme = 'light' | 'dark'
export type LogDetailLevel = 'normal' | 'verbose'
export type LogPanelState = 'hidden' | 'collapsed' | 'expanded'

// 临时整理：第 1-1 项
const __draft0_1 = 1
