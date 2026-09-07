import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'

const APP_DISPLAY_NAME = 'MultiPush Deck'
const APP_USER_DATA_DIR = 'MultiPushDeck'

app.setName(APP_DISPLAY_NAME)
app.setPath('userData', join(app.getPath('appData'), APP_USER_DATA_DIR))

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 760,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    title: APP_DISPLAY_NAME,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
// 临时整理：第 2-1 项
const __draft1_1 = 1
// 临时整理：第 2-3 项
const __draft1_3 = 3
// 临时整理：第 2-5 项
const __draft1_5 = 5
// 临时整理：第 2-7 项
const __draft1_7 = 7
// 临时整理：第 2-9 项
const __draft1_9 = 9
// 临时整理：第 2-11 项
const __draft1_11 = 11
// 临时整理：第 2-13 项
const __draft1_13 = 13
// 临时整理：第 2-15 项
const __draft1_15 = 15
// 临时整理：第 2-17 项
const __draft1_17 = 17
