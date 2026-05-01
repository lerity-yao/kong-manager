<template>
  <div class="version-selector">
    <KSelect
      v-model="selectedVersion"
      :items="versionItems"
      :label="t('api-docs.versions.title')"
      @change="(item: any) => onVersionChange(item?.value || '')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { KSelect } from '@kong/kongponents'
import { useI18n } from '@/composables/useI18n'

interface Props {
  versions: Array<{ version: string; is_current: boolean }>
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', version: string): void
}>()

const { t } = useI18n()

const selectedVersion = ref(props.modelValue || '')

const versionItems = computed(() =>
  props.versions.map((v) => ({
    label: v.is_current ? `${v.version} (${t('api-docs.versions.current')})` : v.version,
    value: v.version,
    selected: v.version === selectedVersion.value,
  })),
)

watch(() => props.modelValue, (val) => {
  if (val) selectedVersion.value = val
})

function onVersionChange(value: string) {
  selectedVersion.value = value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style lang="scss" scoped>
.version-selector {
  display: inline-block;
  min-width: 250px;
}
</style>
