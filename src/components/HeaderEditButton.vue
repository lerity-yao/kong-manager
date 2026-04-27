<template>
  <KButton
    data-testid="header-edit-button"
    :to="editPath"
    appearance="primary"
  >
    {{ t('global.buttons.edit') }}
  </KButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'

const props = defineProps({
  entity: {
    type: String,
    required: false,
    default: '',
  },
  routeOptions: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

const route = useRoute()
const { t } = useI18n()
const { workspace } = useCurrentWorkspace()

const editPath = computed(() => {
  return {
    name: `${props.entity}-edit`,
    params: { workspace: workspace.value, id: route.params.id },
    ...props.routeOptions,
  }
})
</script>
