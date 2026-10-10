<script setup lang="ts">
import { computed, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import type { CommitLogEntry, CommitPushState } from '../../../shared/types'
import { useCommitLogStore } from '../stores/commitLogStore'

interface PushBadge {
  label: string
  type: 'success' | 'warning' | 'info'
}

const store = useCommitLogStore()
const searchQuery = ref('')
const listElement = ref<HTMLElement | null>(null)

const selectedBranch = computed({
  get: () => store.currentBranch,
  set: (value: string) => {
    if (value && value !== store.currentBranch) {
      void store.loadLog(value)
    }
  }
})

const filteredCommits = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return store.commits
  }

  return store.commits.filter((commit) =>
    [
      commit.subject,
      commit.author,
      commit.email,
      commit.hash,
      commit.shortHash
    ]
      .join('\n')
      .toLowerCase()
      .includes(query)
  )
})

const pushBadgeMeta: Record<CommitPushState, PushBadge> = {
  pushed: { label: '已推送', type: 'success' },
  partial: { label: '部分推送', type: 'warning' },
  unpushed: { label: '未推送', type: 'info' },
  unknown: { label: '状态未知', type: 'info' }
}

function getPushBadge(commit: CommitLogEntry): PushBadge | null {
  if (store.remoteCount === 0) {
    return null
  }

  const status = store.pushStatus.get(commit.hash)
  return status ? pushBadgeMeta[status.status] : null
}

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return value
  }

  const difference = Date.now() - timestamp
  const seconds = Math.max(Math.floor(difference / 1000), 0)
  if (seconds < 60) {
    return '刚刚'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} 天前`
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months} 个月前`
  }

  return `${Math.floor(months / 12)} 年前`
}

function handleScroll(): void {
  const element = listElement.value
  if (!element) {
    return
  }

  const distanceToBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight
  if (distanceToBottom < 100) {
    void store.loadMore()
  }
}

function refresh(): void {
  void store.refresh()
}
</script>

<template>
  <section class="panel commit-history-list">
    <header class="history-toolbar">
      <div class="history-title">
        <span>提交历史</span>
        <span class="commit-count">{{ filteredCommits.length }} 条</span>
      </div>

      <div class="history-actions">
        <el-select
          v-model="selectedBranch"
          class="branch-select"
          size="small"
          placeholder="选择分支"
          :disabled="store.loading"
        >
          <el-option
            v-for="branch in store.branches"
            :key="branch"
            :label="branch"
            :value="branch"
          />
        </el-select>

        <el-button
          size="small"
          :icon="Refresh"
          :loading="store.loading"
          @click="refresh"
        >
          刷新
        </el-button>

        <el-input
          v-model="searchQuery"
          class="history-search"
          size="small"
          clearable
          placeholder="搜索提交信息、作者或哈希"
          :prefix-icon="Search"
        />
      </div>
    </header>

    <el-alert
      v-if="store.error"
      class="history-alert"
      type="error"
      :closable="false"
      show-icon
      :title="store.error"
    />

    <div ref="listElement" class="history-scroll" @scroll.passive="handleScroll">
      <div v-if="store.loading" class="history-state">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="!filteredCommits.length" class="history-state history-empty">
        <p>{{ searchQuery ? '没有匹配的提交' : '当前分支没有提交记录' }}</p>
      </div>

      <div v-else class="commit-list" role="list">
        <button
          v-for="commit in filteredCommits"
          :key="commit.hash"
          type="button"
          class="commit-row"
          :class="{ 'is-selected': store.selectedCommit?.hash === commit.hash }"
          role="listitem"
          @click="store.selectCommit(commit)"
        >
          <code class="commit-hash">{{ commit.shortHash }}</code>

          <span class="commit-subject" :title="commit.subject">
            {{ commit.subject }}
          </span>

          <span class="commit-author" :title="commit.author">
            {{ commit.author }}
          </span>

          <span class="commit-date" :title="commit.date">
            {{ formatRelativeTime(commit.date) }}
          </span>

          <span class="commit-push-status">
            <el-tag
              v-if="getPushBadge(commit)"
              size="small"
              effect="dark"
              :type="getPushBadge(commit)?.type"
            >
              {{ getPushBadge(commit)?.label }}
            </el-tag>
          </span>
        </button>

        <div class="load-more-state">
          <el-icon v-if="store.loadingMore" class="is-loading">
            <Refresh />
          </el-icon>
          <span v-if="store.loadingMore">正在加载更多提交</span>
          <span v-else-if="!store.hasMore">已加载全部提交</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.commit-history-list {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.history-toolbar {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--app-card-bg);
}

.history-title,
.history-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.history-title {
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 650;
}

.commit-count {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 400;
}

.history-actions {
  flex-wrap: wrap;
}

.branch-select {
  width: 180px;
}

.history-search {
  min-width: 220px;
  flex: 1 1 260px;
}

.history-alert {
  flex: 0 0 auto;
  margin: 8px 10px 0;
}

.history-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.history-state {
  padding: 16px;
}

.history-empty {
  display: grid;
  min-height: 220px;
  place-content: center;
  color: var(--text-muted);
  font-size: 12px;
}

.history-empty p {
  margin: 0;
}

.commit-list {
  min-width: 520px;
}

.commit-row {
  display: grid;
  width: 100%;
  min-height: 42px;
  grid-template-columns:
    74px minmax(180px, 1fr) minmax(90px, 130px)
    92px 82px;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 0;
  border-bottom: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-main);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background-color 0.12s ease;
}

.commit-row:hover {
  background: var(--app-hover-bg);
}

.commit-row.is-selected {
  background: var(--app-active-bg);
  box-shadow: inset 3px 0 0 var(--el-color-primary);
}

.commit-hash {
  color: var(--el-color-primary);
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
}

.commit-subject,
.commit-author,
.commit-date {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-subject {
  color: var(--text-strong);
  font-size: 12px;
  font-weight: 550;
}

.commit-author,
.commit-date {
  color: var(--text-muted);
  font-size: 11px;
}

.commit-push-status {
  display: flex;
  justify-content: flex-end;
}

.commit-push-status :deep(.el-tag--success),
.commit-push-status :deep(.el-tag--warning) {
  --el-tag-border-color: transparent;
  --el-tag-text-color: var(--el-color-white);
}

.commit-push-status :deep(.el-tag--success) {
  --el-tag-bg-color: var(--el-color-success);
}

.commit-push-status :deep(.el-tag--warning) {
  --el-tag-bg-color: var(--el-color-warning);
}

.load-more-state {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 11px;
}

@media (max-width: 920px) {
  .history-actions {
    align-items: stretch;
  }

  .branch-select,
  .history-search {
    width: 100%;
    flex: 1 1 100%;
  }
}
</style>
