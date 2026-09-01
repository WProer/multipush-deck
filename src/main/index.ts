import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'

const APP_DISPLAY_NAME = 'MultiPush Deck'
const APP_USER_DATA_DIR = 'MultiPushDeck'
// 临时整理：第 1-1 项
const __draft0_1 = 1
// 临时整理：第 1-3 项
