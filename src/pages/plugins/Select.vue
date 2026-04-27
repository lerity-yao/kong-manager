<template>
  <PluginSelect
    :config="config"
    available-on-server
  />
</template>

<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue'
import { useRoute } from 'vue-router'
import { PluginSelect } from '@kong-ui-public/entities-plugins'
import { useBaseGeneralConfig } from '@/composables/useBaseGeneralConfig'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'

defineOptions({
  name: 'PluginSelect',
})

const route = useRoute()
const { workspace } = useCurrentWorkspace()

const entityScope = computed(() => {
  if (route.query.serviceId) {
    return {
      id: route.query.serviceId as string,
      typeLiteral: 'services',
    } as const
  } else if (route.query.routeId) {
    return {
      id: route.query.routeId as string,
      typeLiteral: 'routes',
    } as const
  } else if (route.query.consumerId) {
    return {
      id: route.query.consumerId as string,
      typeLiteral: 'consumers',
    } as const
  }

  return null
})

const config = reactive({
  ...toRefs(useBaseGeneralConfig()),
  entityType: computed(() => entityScope.value?.typeLiteral),
  entityId: computed(() => entityScope.value?.id),
  getCreateRoute: (plugin: string) => ({
    name: 'plugin-create',
    params: {
      workspace: workspace.value,
      pluginType: plugin,
    },
    query: route.query,
  }),
})
</script>
