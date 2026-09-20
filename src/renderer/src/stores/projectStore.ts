import { ref } from 'vue'
import { defineStore } from 'pinia'

const CWD_STORAGE_KEY = 'multipush-deck:project:cwd'

function readStoredDirectory(): string {
  try {
    return window.localStorage.getItem(CWD_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
// 临时整理：第 1-1 项
