<template>
  <KButton
    data-testid="header-edit-button"
    :to="!isDisabled ? editPath : undefined"
    appearance="primary"
    :disabled="isDisabled"
  >
    {{ t('global.buttons.edit') }}
  </KButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import { useAuthStore } from '@/stores/auth'

// Entity name → RBAC endpoint mapping
const entityEndpointMap: Record<string, string> = {
  plugin: '/plugins/*',
  service: '/services/*',
  route: '/routes/*',
  consumer: '/consumers/*',
  upstream: '/upstreams/*',
  certificate: '/certificates/*',
  'ca-certificate': '/ca_certificates/*',
  key: '/keys/*',
  vault: '/vaults/*',
  'key-set': '/key-sets/*',
}

const props = defineProps({
  entity: {
    type: String,
    required: false,
    default: '',
  },
  endpoint: {
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
const authStore = useAuthStore()

const rbacEndpoint = computed(() => {
  if (props.endpoint) return props.endpoint
  return entityEndpointMap[props.entity] || `/${props.entity}s/*`
})

const isDisabled = computed(() => {
  return !authStore.hasPermissionGuarded('update', rbacEndpoint.value)
})

const editPath = computed(() => {
  return {
    name: `${props.entity}-edit`,
    params: { workspace: workspace.value, id: route.params.id },
    ...props.routeOptions,
  }
})
</script>
