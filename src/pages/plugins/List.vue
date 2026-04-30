<template>
  <PageHeader
    v-if="!entityType"
    :title="t('entities.plugin.list.title')"
  >
    <template #below-title>
      <SupportText>
        {{ t('entities.plugin.description') }}
        <KExternalLink :href="docsLink">
          {{ t('global.learn.more') }}
        </KExternalLink>
      </SupportText>
    </template>
  </PageHeader>
  <PluginList
    :cache-identifier="cacheIdentifier"
    :config="pluginListConfig"
    :can-create="canCreate"
    :can-delete="canDelete"
    :can-edit="canEdit"
    :can-toggle="canToggle"
    :can-retrieve="canRetrieve"
    :can-retrieve-scoped-entity="canRetrieveScopedEntity"
    @copy:success="onCopySuccess"
    @copy:error="onCopyError"
    @delete:success="onDeleteSuccess"
    @toggle-enabled="onToggleEnabled"
  />
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { PluginList, type EntityRow, type ViewRouteType, type EntityType as ScopedEntityType } from '@kong-ui-public/entities-plugins'
import type { FilterSchema } from '@kong-ui-public/entities-shared'
import { useListGeneralConfig } from '@/composables/useListGeneralConfig'
import { useListRedirect } from '@/composables/useListRedirect'
import { useCopyEventHandlers } from '@/composables/useCopyEventHandlers'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import { useToaster } from '@/composables/useToaster'
import { useI18n } from '@/composables/useI18n'
import { useDocsLink } from '@/composables/useDocsLink'
import { EntityType } from '@/types'
import { useEntityPermissions } from '@/composables/useEntityPermissions'

defineOptions({
  name: 'PluginList',
})

const { createRedirectRouteQuery } = useListRedirect()
const toaster = useToaster()
const { t } = useI18n()
const docsLink = useDocsLink(EntityType.Plugin)
const route = useRoute()
const { workspace } = useCurrentWorkspace()
const cacheIdentifier = computed(() => `plugins-${route.params?.id}`)
const entityType = computed(() => route.meta?.scopedIn as ScopedEntityType)
const scopedQuery = computed(() => {
  switch (entityType.value) {
    case 'services':
      return { serviceId: route.params?.id }
    case 'routes':
      return { routeId: route.params?.id }
    case 'consumers':
      return { consumerId: route.params?.id }
    default:
      return {}
  }
})

const createRoute = computed(() => {
  return {
    name: 'plugin-select',
    params: { workspace: workspace.value },
    query: {
      ...scopedQuery.value,
    },
  }
})

const getScopedEntityViewRoute = (type: ViewRouteType, id: string): RouteLocationRaw => {
  return {
    name: `${type}-detail`,
    params: {
      workspace: workspace.value,
      id,
    },
  }
}

const getViewRoute = (plugin: Pick<EntityRow, 'id' | 'name'>) => {
  return {
    name: 'plugin-detail',
    params: {
      workspace: workspace.value,
      id: plugin.id,
      pluginType: plugin.name,
    },
    query: {
      ...scopedQuery.value,
      ...createRedirectRouteQuery(),
    },
  }
}

const getEditRoute = (plugin: EntityRow) => ({
  name: 'plugin-edit',
  params: {
    workspace: workspace.value,
    id: plugin.id,
    pluginType: plugin.name,
  },
  query: {
    ...scopedQuery.value,
    ...(route.name !== 'plugin-list' ? createRedirectRouteQuery() : {}),
  },
})

const filterSchema: FilterSchema = {
  name: {
    type: 'text',
  },
  enabled: {
    type: 'select',
    values: ['true', 'false'],
  },
  instanceName: {
    type: 'text',
  },
}

const pluginListConfig = reactive({
  ...useListGeneralConfig(),
  entityType,
  entityId: route.params?.id as string,
  createRoute,
  getViewRoute,
  getEditRoute,
  getScopedEntityViewRoute,
  getConfigureDynamicOrderingRoute: getViewRoute,
  filterSchema,
})

const { canCreate, canDelete, canEdit, canRetrieve } = useEntityPermissions('/plugins')

// konnect has a special tag for this permission
// set to always true since Kong Manager doesn't have such limitation
// `@kong-ui-public/entites-plugins` will check `canEdit` internally so we don't need to check it here
const canToggle = async () => true

const canRetrieveScopedEntity = async () => true

const { onCopySuccess, onCopyError } = useCopyEventHandlers()

const onDeleteSuccess = (entity: EntityRow) => {
  toaster.open({
    appearance: 'success',
    message: t('entities.plugin.deleted', {
      name: entity.instance_name ?? entity.name,
    }),
  })
}

const onToggleEnabled = (isEnabled: boolean, entity: EntityRow) => {
  toaster.open({
    appearance: 'success',
    message: t(isEnabled ? 'entities.plugin.enabled' : 'entities.plugin.disabled', {
      name: entity.instance_name ?? entity.name,
    }),
  })
}
</script>
