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
<!-- 临时整理：第 1-1 项 -->
<!-- 临时整理：第 1-2 项 -->
<!-- 临时整理：第 1-3 项 -->
