<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { RepositoryConfig } from '../../../shared/types'

const props = defineProps<{
  modelValue: boolean
  repository: RepositoryConfig | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [value: RepositoryConfig]
}>()

const form = reactive<RepositoryConfig>({
  alias: '',
  url: '',
  enabled: true
})
const formError = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

watch(
  () => [props.modelValue, props.repository] as const,
  ([isOpen]) => {
    if (!isOpen) {
      return
    }

    form.alias = props.repository?.alias ?? ''
    form.url = props.repository?.url ?? ''
    form.enabled = props.repository?.enabled ?? true
    formError.value = ''
  },
  { immediate: true }
)

function submit(): void {
  const url = form.url.trim()
  if (!url) {
    formError.value = '请输入仓库 URL'
    return
  }

  emit('submit', {
    alias: form.alias.trim(),
    url,
    enabled: form.enabled
  })
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="repository ? '编辑仓库' : '添加仓库'"
    width="480px"
    destroy-on-close
  >
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="别名">
        <el-input
          v-model="form.alias"
          maxlength="60"
          placeholder="例如 github"
        />
      </el-form-item>

      <el-form-item label="仓库 URL" required>
        <el-input
          v-model="form.url"
          placeholder="请输入仓库 URL"
          @keyup.enter="submit"
        />
      </el-form-item>

      <el-form-item label="启用仓库">
        <el-switch v-model="form.enabled" />
      </el-form-item>

      <div v-if="formError" class="form-error">{{ formError }}</div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-error {
  margin-top: -6px;
  color: var(--el-color-danger);
  font-size: 12px;
}
</style>
