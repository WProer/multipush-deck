<script setup lang="ts">
import { computed } from 'vue'
import { useCommitsStore } from '../stores/commitsStore'
import { useFilesStore } from '../stores/filesStore'

const commitsStore = useCommitsStore()
const filesStore = useFilesStore()

const commitDisabled = computed(
  () =>
    !filesStore.hasStagedFiles ||
    commitsStore.commitMessage.trim() === '' ||
    commitsStore.committing ||
    commitsStore.pushing
)

const pushDisabled = computed(() => commitDisabled.value)

const commitTooltip = computed(() => commitsStore.commitTooltip)
const pushTooltip = computed(() => {
  if (!filesStore.hasStagedFiles) {
    return '暂存区为空，请先暂存文件'
  }
  if (!commitsStore.commitMessage.trim()) {
    return '请输入提交信息'
  }
  if (commitsStore.committing || commitsStore.pushing) {
    return '正在提交'
  }

  return '提交暂存区文件后推送到全部已配置远程'
})
</script>

<template>
  <section class="panel commit-panel">
    <div class="commit-content">
      <div class="commit-field">
        <div class="field-header">
          <label class="field-label" for="commit-message">提交信息</label>
          <span class="field-count">
            {{ commitsStore.commitMessage.length }} / 200
          </span>
        </div>
        <el-input
          id="commit-message"
          v-model="commitsStore.commitMessage"
          class="commit-input"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          resize="none"
          placeholder="输入本次提交说明"
        />
      </div>

      <el-alert
        v-if="filesStore.hasUnstagedFiles && !filesStore.hasStagedFiles"
        type="warning"
        :closable="false"
        show-icon
        title="请先暂存要提交的文件。"
      />

      <div class="commit-actions">
        <el-tooltip :content="commitTooltip" placement="top">
          <span class="tooltip-target">
            <el-button
              type="primary"
              plain
              :loading="commitsStore.committing"
              :disabled="commitDisabled"
              @click="commitsStore.commitStaged"
            >
              提交暂存区文件
            </el-button>
          </span>
        </el-tooltip>

        <el-tooltip :content="pushTooltip" placement="top">
          <span class="tooltip-target">
            <el-button
              type="primary"
              :loading="commitsStore.pushing"
              :disabled="pushDisabled"
              @click="commitsStore.commitAndPush"
            >
              提交并推送
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>
  </section>
</template>

<style scoped>
.commit-panel {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
<!-- 临时整理：第 2-1 项 -->
<!-- 临时整理：第 2-2 项 -->
<!-- 临时整理：第 2-3 项 -->
<!-- 临时整理：第 2-4 项 -->
<!-- 临时整理：第 2-5 项 -->
<!-- 临时整理：第 2-6 项 -->
<!-- 临时整理：第 2-7 项 -->
