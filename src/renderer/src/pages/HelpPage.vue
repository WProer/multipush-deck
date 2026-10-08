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
  Picture,
  Promotion,
  Refresh,
  Setting,
  Upload
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'

type HelpTab = 'guide' | 'intro'

interface QuickStartStep {
  title: string
  description: string
  icon: Component
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
    icon: FolderOpened
  },
  {
    title: '添加远程仓库',
    description:
      '在“仓库管理”页添加 Gitee、GitHub、GitLab 或自建 Git 服务的仓库地址，并为每个仓库设置别名与启用状态。',
    icon: Setting
  },
  {
    title: '初始化配置',
    description:
      '点击“初始化配置”生成干净的 .git-remotes.txt 模板，文件里只包含注释说明，不包含任何示例仓库。',
    icon: Document
  },
  {
    title: 'Setup 远程',
    description:
      '点击“Setup 远程”把配置文件中的仓库写入本地 Git 远程，并自动对照配置文件与本地远程的差异。',
    icon: Connection
  },
  {
    title: '开始日常使用',
    description:
      '切换到“文件与提交”页查看未暂存文件，勾选、暂存、提交，完成后即可在“推送中心”一键推送到全部仓库。',
    icon: Upload
  }
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
