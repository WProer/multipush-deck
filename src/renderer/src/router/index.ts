import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw
} from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import AboutPage from '../pages/AboutPage.vue'
import CommitLogPage from '../pages/CommitLogPage.vue'
import FilesCommitPage from '../pages/FilesCommitPage.vue'
import HelpPage from '../pages/HelpPage.vue'
import RepoManagePage from '../pages/RepoManagePage.vue'
import SettingsPage from '../pages/SettingsPage.vue'
import SyncPage from '../pages/SyncPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/repos'
      },
      {
        path: 'repos',
        name: 'repos',
        meta: { title: '仓库管理' },
        component: RepoManagePage
      },
      {
        path: 'files',
        name: 'files',
        meta: { title: '文件与提交' },
        component: FilesCommitPage
      },
      {
        path: 'log',
        name: 'log',
        meta: { title: '提交日志' },
        component: CommitLogPage
      },
      {
        path: 'sync',
        name: 'sync',
        meta: { title: '推送中心' },
        component: SyncPage
      },
      {
        path: 'settings',
        name: 'settings',
        meta: { title: '设置' },
        component: SettingsPage
      },
      {
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
// 临时整理：第 2-19 项
const __draft1_19 = 19
// 临时整理：第 2-21 项
const __draft1_21 = 21
// 临时整理：第 2-23 项
