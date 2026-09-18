<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Pane,
  Splitpanes,
  type SplitpanesResizedPayload
} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import CommitPanel from '../components/CommitPanel.vue'
import DiffViewer from '../components/DiffViewer.vue'
import StagedPanel from '../components/StagedPanel.vue'
import UnstagedPanel from '../components/UnstagedPanel.vue'
import { useCommitsStore } from '../stores/commitsStore'
import { useFilesStore } from '../stores/filesStore'
import { useProjectStore } from '../stores/projectStore'

<!-- 临时整理：第 1-1 项 -->
