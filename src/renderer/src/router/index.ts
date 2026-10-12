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
        path: 'help',
        name: 'help',
        meta: { title: '帮助' },
        component: HelpPage
      },
      {
        path: 'about',
        name: 'about',
        meta: { title: '关于' },
        component: AboutPage
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/repos'
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
