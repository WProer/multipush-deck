<script setup lang="ts">
import { ref, watch, type Component } from 'vue'
import {
  Box,
  Check,
  Collection,
  Connection,
  DataLine,
  Document,
  Files,
  FolderOpened,
  Guide,
  InfoFilled,
  Monitor,
  Promotion,
  Refresh,
  Setting,
  Upload
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import step1SelectDirectory from '../assets/help/help-step-1-select-directory.png'
import step2AddRepository from '../assets/help/help-step-2-add-repository.png'
import step3InitConfig from '../assets/help/help-step-3-init-config.png'
import step4SetupRemotes from '../assets/help/help-step-4-setup-remotes.png'
import step5DailyUse from '../assets/help/help-step-5-daily-use.png'
import pageCommitLog from '../assets/help/help-page-commit-log.png'
import pagePushCenter from '../assets/help/help-page-push-center.png'
import pageSettings from '../assets/help/help-page-settings.png'

type HelpTab = 'guide' | 'intro'

interface QuickStartStep {
  title: string
  description: string
  icon: Component
  image: string
  alt: string
}

interface CapabilityItem {
  title: string
  description: string
  icon: Component
}

const route = useRoute()
const router = useRouter()
const activeTab = ref<HelpTab>(route.query.tab === 'intro' ? 'intro' : 'guide')

const quickStartSteps: QuickStartStep[] = [
  {
    title: '选择项目目录',
    description:
      '在“仓库管理”页选择需要同步的本地 Git 仓库目录，应用会记住该路径并自动加载分支与文件状态。',
    icon: FolderOpened,
    image: step1SelectDirectory,
    alt: '顶部菜单栏与项目目录，包含选择目录按钮、日志开关与配置状态指示'
  },
  {
    title: '添加远程仓库',
    description:
      '在“仓库管理”页添加 Gitee、GitHub、GitLab 或自建 Git 服务的仓库地址，并为每个仓库设置别名与启用状态。',
    icon: Setting,
    image: step2AddRepository,
    alt: '仓库管理页的仓库列表，包含别名、仓库 URL、本地状态与启用开关'
  },
  {
    title: '初始化配置',
    description:
      '点击“初始化配置”生成干净的 .git-remotes.txt 模板，文件里只包含注释说明，不包含任何示例仓库。',
    icon: Document,
    image: step3InitConfig,
    alt: '首次设置面板中的初始化配置按钮与配置状态提示'
  },
  {
    title: 'Setup 远程',
    description:
      '点击“Setup 远程”把配置文件中的仓库写入本地 Git 远程，并自动对照配置文件与本地远程的差异。',
    icon: Connection,
    image: step4SetupRemotes,
    alt: '仓库管理页整体界面，包含首次设置面板与本地远程对照结果'
  },
  {
    title: '开始日常使用',
    description:
      '切换到“文件与提交”页查看未暂存文件，勾选、暂存、提交，完成后即可在“推送中心”一键推送到全部仓库。',
    icon: Upload,
    image: step5DailyUse,
    alt: '文件与提交页，包含未暂存文件、已暂存文件、提交面板与 Diff 查看器'
  }
]

const dailySteps: string[] = [
  '在“文件与提交”页查看未暂存文件列表，确认本次需要提交的改动。',
  '勾选文件后点击“暂存选中”，把文件放入已暂存区域。',
  '在提交面板填写提交信息，点击“提交暂存区文件”。',
  '点击“提交并推送”，或切换到“推送中心”点击“仅推送”。',
  '在“提交日志”页查看历史提交以及每个远程的推送状态。'
]

const pageFunctions = [
  {
    page: '仓库管理',
    description: '配置远程仓库、初始化、Setup、导入本地远程',
    image: step4SetupRemotes,
    alt: '仓库管理页面'
  },
  {
    page: '文件与提交',
    description: '暂存、提交、查看 Diff',
    image: step5DailyUse,
    alt: '文件与提交页面'
  },
  {
    page: '提交日志',
    description: '查看历史提交、推送状态',
    image: pageCommitLog,
    alt: '提交日志页面'
  },
  {
    page: '推送中心',
    description: '一键推送、查看同步状态、重新 Setup',
    image: pagePushCenter,
    alt: '推送中心页面'
  },
  {
    page: '设置',
    description: '默认目录、日志偏好、主题',
    image: pageSettings,
    alt: '设置页面'
  }
]

const pageShots = pageFunctions.map((item) => item.image)

const faqItems = [
  {
    name: 'network',
    title: '推送失败提示“网络连接失败”怎么办？',
    content:
      '先确认本机网络可以访问目标 Git 服务，再检查远程地址与访问凭据是否有效。可以在全局日志面板展开失败命令，查看 stderr 与退出码定位具体原因。'
  },
  {
    name: 'import',
    title: '本地已有远程但配置文件为空怎么办？',
    content:
      '在“仓库管理”页点击“从本地远程导入”，应用会读取 git remote -v 并把本地远程合并进配置文件。若别名已存在但地址不同，默认跳过并由你决定是否覆盖。'
  },
  {
    name: 'edit',
    title: '如何修改某个仓库的地址？',
    content:
      '在“仓库管理”页选中该仓库，修改 URL 后保存，应用会写回 .git-remotes.txt。随后点击“Setup 远程”让本地 Git 远程与配置保持一致。'
  },
  {
    name: 'single',
    title: '如何只推送到其中一个仓库？',
    content:
      '当前“仅推送”面向全部已配置仓库。如需临时只推送单个仓库，可在系统终端对该仓库执行 git push，提交与暂存仍可在本应用中完成。'
  },
  {
    name: 'message',
    title: '提交信息填错了怎么改？',
    content:
      '如果尚未推送，可在系统终端执行 git commit --amend 修改最近一次提交信息；若已经推送，请谨慎使用 --amend 并确认远程分支允许强制更新。'
  }
]

const capabilities: CapabilityItem[] = [
  {
    title: '多仓库管理',
    description: '支持 Gitee、GitHub、GitLab 以及自建 Git 服务的地址配置。',
    icon: Collection
  },
  {
    title: '一键多推',
    description: '单次操作推送到所有已配置仓库，失败自动跳过并汇总结果。',
    icon: Promotion
  },
  {
    title: '选择性提交',
    description: '暂存与未暂存分区显示，支持逐文件勾选与批量操作。',
    icon: Files
  },
  {
    title: '提交日志',
    description: '查看历史提交记录以及每个远程仓库的推送状态。',
    icon: DataLine
  },
  {
    title: '本地与配置对照',
    description: '实时显示配置文件与本地 Git 远程之间的差异。',
    icon: Connection
  }
]

const techStack = [
  { category: '界面框架', tech: 'Electron + Vue 3' },
  { category: 'UI 组件库', tech: 'Element Plus' },
  { category: '状态管理', tech: 'Pinia' },
  { category: '构建工具', tech: 'electron-vite' },
  { category: 'Git 调用', tech: '系统 Git（通过子进程）' }
]

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'intro' ? 'intro' : 'guide'
  }
)

function handleTabChange(name: string | number): void {
  const tab = name === 'intro' ? 'intro' : 'guide'
  void router.replace({
    path: '/help',
    query: tab === 'intro' ? { tab: 'intro' } : undefined
  })
}
</script>

<template>
  <section class="help-page">
    <header class="page-heading">
      <div class="heading-icon">
        <el-icon><Document /></el-icon>
      </div>
      <div>
        <h1>帮助</h1>
        <p>了解首次配置、日常使用流程以及应用的核心能力。</p>
      </div>
    </header>

    <el-tabs v-model="activeTab" class="help-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="使用说明" name="guide">
        <div class="tab-body">
          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Guide /></el-icon>
                <div>
                  <h2>快速开始（首次使用）</h2>
                  <p>五步完成从选择项目到开始日常提交的全部配置。</p>
                </div>
              </div>
            </template>

            <ol class="step-list">
              <li
                v-for="(step, index) in quickStartSteps"
                :key="step.title"
                class="step-item"
              >
                <div class="step-index">{{ index + 1 }}</div>
                <div class="step-main">
                  <div class="step-head">
                    <el-icon><component :is="step.icon" /></el-icon>
                    <h3>{{ step.title }}</h3>
                  </div>
                  <p>{{ step.description }}</p>
                  <el-image
                    class="help-screenshot"
                    :src="step.image"
                    :preview-src-list="[step.image]"
                    :alt="step.alt"
                    fit="contain"
                    hide-on-click-modal
                    preview-teleported
                  />
                  <p class="help-screenshot-caption">
                    图 {{ index + 1 }}：{{ step.title }}
                  </p>
                </div>
              </li>
            </ol>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Upload /></el-icon>
                <div>
                  <h2>日常使用流程</h2>
                  <p>按照标准 Git 暂存区流程提交并同步代码。</p>
                </div>
              </div>
            </template>

            <ol class="daily-list">
              <li v-for="(item, index) in dailySteps" :key="index">
                <span class="daily-index">{{ index + 1 }}</span>
                <span>{{ item }}</span>
              </li>
            </ol>

            <div class="notice-row">
              <el-icon><InfoFilled /></el-icon>
              <span>提交按钮只提交已暂存文件，未暂存内容不会进入本次提交。</span>
            </div>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Monitor /></el-icon>
                <div>
                  <h2>各页面功能说明</h2>
                  <p>了解每个页面负责的工作内容。</p>
                </div>
              </div>
            </template>

            <el-table :data="pageFunctions" border class="function-table">
              <el-table-column prop="page" label="页面" width="160" />
              <el-table-column prop="description" label="主要功能" />
            </el-table>

            <div class="page-gallery">
              <figure
                v-for="(item, index) in pageFunctions"
                :key="item.page"
                class="page-gallery-item"
              >
                <el-image
                  class="page-gallery-image"
                  :src="item.image"
                  :preview-src-list="pageShots"
                  :initial-index="index"
                  :alt="item.alt"
                  fit="contain"
                  hide-on-click-modal
                  preview-teleported
                />
                <figcaption class="help-screenshot-caption">
                  图 {{ index + 6 }}：{{ item.page }}页面
                </figcaption>
              </figure>
            </div>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><InfoFilled /></el-icon>
                <div>
                  <h2>常见问题</h2>
                  <p>遇到问题时可先查阅以下内容。</p>
                </div>
              </div>
            </template>

            <el-collapse class="faq-collapse">
              <el-collapse-item
                v-for="item in faqItems"
                :key="item.name"
                :title="item.title"
                :name="item.name"
              >
                <p>{{ item.content }}</p>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="工具介绍" name="intro">
        <div class="tab-body">
          <el-card shadow="never" class="content-card intro-hero">
            <div class="intro-heading">
              <el-icon><Box /></el-icon>
              <h2>MultiPush Deck 是什么</h2>
            </div>
            <p class="intro-summary">
              一款支持将同一份代码推送到多个远程仓库的桌面客户端，基于 Electron + Vue 3 +
              Element Plus 构建。
            </p>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Collection /></el-icon>
                <div>
                  <h2>核心能力</h2>
                  <p>围绕多远程同步提供的核心功能。</p>
                </div>
              </div>
            </template>

            <div class="capability-grid">
              <article
                v-for="item in capabilities"
                :key="item.title"
                class="capability-card"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </article>
            </div>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Connection /></el-icon>
                <div>
                  <h2>工作原理</h2>
                  <p>从配置文件到多仓库推送的完整链路。</p>
                </div>
              </div>
            </template>

            <div class="principle-flow">
              <article class="principle-node">
                <el-icon><Document /></el-icon>
                <h3>配置文件</h3>
                <p>.git-remotes.txt 保存你期望同步的仓库列表。</p>
              </article>
              <span class="principle-arrow">
                <el-icon><Refresh /></el-icon>
                <span>Setup</span>
              </span>
              <article class="principle-node">
                <el-icon><Setting /></el-icon>
                <h3>本地远程</h3>
                <p>Setup 会把配置写入本地 Git 的 remote 列表。</p>
              </article>
              <span class="principle-arrow">
                <el-icon><Refresh /></el-icon>
                <span>Push</span>
              </span>
              <article class="principle-node">
                <el-icon><Promotion /></el-icon>
                <h3>多个远程</h3>
                <p>推送时对每个 remote 依次执行 git push 并汇总结果。</p>
              </article>
            </div>

            <div class="notice-row">
              <el-icon><Check /></el-icon>
              <span>所有操作都基于系统 Git，不引入额外运行时。</span>
            </div>
          </el-card>

          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-title">
                <el-icon><Box /></el-icon>
                <div>
                  <h2>技术栈</h2>
                  <p>构成应用的框架与依赖。</p>
                </div>
              </div>
            </template>

            <el-table :data="techStack" border class="function-table">
              <el-table-column prop="category" label="类别" width="160" />
              <el-table-column prop="tech" label="技术" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<style scoped>
.help-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--app-bg);
}

.page-heading {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-bg);
}

.heading-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 19px;
}

.page-heading h1,
.card-title h2,
.intro-heading h2,
.step-head h3,
.capability-card h3,
.principle-node h3 {
  margin: 0;
  color: var(--text-strong);
}

.page-heading h1 {
  font-size: 18px;
}

.page-heading p,
.card-title p,
.step-main p,
.capability-card p,
.principle-node p,
.intro-summary {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.7;
}

.help-tabs {
  min-width: 0;
}

.help-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px 8px 0 0;
  background: var(--panel-bg);
}

.help-tabs :deep(.el-tabs__content) {
  padding-top: 14px;
}

.tab-body {
  display: grid;
  gap: 14px;
}

.content-card {
  border-radius: 8px;
  border-color: var(--border-color);
}

.content-card :deep(.el-card__header) {
  padding: 13px 16px;
  border-bottom: 1px solid var(--border-soft);
}

.content-card :deep(.el-card__body) {
  padding: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title > .el-icon {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-size: 18px;
}

.card-title h2 {
  font-size: 14px;
}

.step-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 7px;
  background: var(--el-fill-color-lighter);
}

html.dark .step-item {
  background: var(--el-fill-color-light);
}

.step-index {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 13px;
  font-weight: 700;
}

.step-main {
  min-width: 0;
  flex: 1;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 7px;
}

.step-head > .el-icon {
  color: var(--el-color-primary);
  font-size: 17px;
}

.step-head h3 {
  font-size: 13px;
}

.help-screenshot {
  display: block;
  width: 100%;
  max-width: 720px;
  margin: 12px 0;
  overflow: hidden;
  border: 1px solid var(--app-card-border);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.help-screenshot :deep(.el-image__inner) {
  display: block;
  width: 100%;
  height: auto;
}

html.dark .help-screenshot {
  background: var(--el-fill-color-light);
}

.help-screenshot-caption {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.6;
}

.page-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.page-gallery-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.page-gallery-image {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--app-card-border);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.page-gallery-image :deep(.el-image__inner) {
  display: block;
  width: 100%;
  height: auto;
}

.daily-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.daily-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-main);
  font-size: 12px;
  line-height: 1.6;
}

.daily-index {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.notice-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  padding: 9px 11px;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
}

html.dark .notice-row {
  background: var(--app-active-bg);
  color: var(--el-color-primary-light-3);
}

.function-table {
  width: 100%;
}

.function-table :deep(.el-table__cell) {
  padding: 7px 0;
  font-size: 12px;
}

.faq-collapse {
  border-top: 0;
}

.faq-collapse :deep(.el-collapse-item__header) {
  font-size: 13px;
}

.faq-collapse :deep(.el-collapse-item__content) p {
  margin: 0;
  color: var(--text-main);
  font-size: 12px;
  line-height: 1.7;
}

.intro-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--el-color-primary);
}

.intro-heading .el-icon {
  font-size: 20px;
}

.intro-heading h2 {
  font-size: 16px;
  color: var(--text-strong);
}

.intro-summary {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-main);
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.capability-card {
  min-height: 118px;
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 7px;
  background: var(--el-fill-color-lighter);
}

html.dark .capability-card {
  background: var(--el-fill-color-light);
}

.capability-card > .el-icon {
  color: var(--el-color-primary);
  font-size: 20px;
}

.capability-card h3 {
  margin-top: 9px;
  font-size: 13px;
}

.principle-flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.principle-node {
  min-height: 128px;
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 7px;
  background: var(--el-fill-color-lighter);
}

html.dark .principle-node {
  background: var(--el-fill-color-light);
}

.principle-node > .el-icon {
  color: var(--el-color-primary);
  font-size: 20px;
}

.principle-node h3 {
  margin-top: 9px;
  font-size: 13px;
}

.principle-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.principle-arrow .el-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

@media (max-width: 900px) {
  .principle-flow {
    grid-template-columns: 1fr;
  }

  .principle-arrow {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
