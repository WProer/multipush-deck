<script setup lang="ts">
import { watch } from 'vue'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import CommitDetail from '../components/CommitDetail.vue'
import CommitHistoryList from '../components/CommitHistoryList.vue'
import { useCommitLogStore } from '../stores/commitLogStore'
import { useProjectStore } from '../stores/projectStore'

const projectStore = useProjectStore()
const commitLogStore = useCommitLogStore()

watch(
  () => projectStore.cwd,
  async (cwd) => {
    commitLogStore.clear()
    if (cwd.trim()) {
      await commitLogStore.loadLog()
    }
  },
  { immediate: true }
)
</script>

<template>
  <section class="commit-log-page">
    <Splitpanes
      class="main-splitpanes commit-log-split"
      :push-other-panes="false"
    >
      <Pane :size="60" :min-size="38" :max-size="72">
        <CommitHistoryList />
      </Pane>

      <Pane :size="40" :min-size="28" :max-size="62">
        <CommitDetail />
      </Pane>
    </Splitpanes>
  </section>
</template>

<style scoped>
.commit-log-page {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 10px;
  background: var(--app-bg);
}

.commit-log-split {
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
