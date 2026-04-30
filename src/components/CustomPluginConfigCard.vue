<template>
  <KSkeleton
    v-if="schemaLoading"
    data-testid="plugin-config-card-loader"
    :table-columns="2"
    type="table"
  />
  <KEmptyState
    v-else-if="schemaError"
    data-testid="plugin-config-card-schema-error"
    icon-variant="error"
  >
    <template #default>
      <h3>{{ schemaError }}</h3>
    </template>
  </KEmptyState>
  <EntityBaseConfigCard
    v-else
    :config="config"
    :entity-type="SupportedEntityType.Plugin"
    :fetch-url="fetchUrl"
    :config-schema="configSchema"
    plugin-config-key="config"
    :plugin-config-schema="pluginConfigSchema"
    :hide-title="hideTitle"
    :config-card-doc="configCardDoc"
    :record-resolver="recordResolver"
    :code-block-record-formatter="codeBlockRecordFormatter"
    @fetch:error="(data: any) => $emit('fetch:error', data)"
    @fetch:success="(data: any) => $emit('fetch:success', data)"
    @loading="(isLoading: boolean) => $emit('loading', isLoading)"
  >
    <!-- name slot: show plugin icon + display name -->
    <template #name="{ rowValue }">
      <div class="name-cell-wrapper">
        <PluginIcon :name="rowValue" :size="24" class="plugin-icon" />
        <span class="info-name">{{ getPluginDisplayName(rowValue) }}</span>
      </div>
    </template>

    <!-- consumer slot: show ID only (username shown via consumer_username field) -->
    <template #consumer="{ rowValue }">
      <template v-if="rowValue">
        <InternalLinkItem v-if="showIdAsLink"
          :item="{ key: rowValue.id, value: rowValue.id, type: ConfigurationSchemaType.LinkInternal }"
          @navigation-click="$emit('navigation-click', rowValue.id, 'consumer')"
        />
        <KCopy v-else
          :copy-tooltip="'Copy Consumer ID'"
          :text="rowValue.id"
        />
      </template>
      <span v-else>–</span>
    </template>

    <!-- route slot: show ID only (name shown via route_name field) -->
    <template #route="{ rowValue }">
      <template v-if="rowValue">
        <InternalLinkItem v-if="showIdAsLink"
          :item="{ key: rowValue.id, value: rowValue.id, type: ConfigurationSchemaType.LinkInternal }"
          @navigation-click="$emit('navigation-click', rowValue.id, 'route')"
        />
        <KCopy v-else
          :copy-tooltip="'Copy Route ID'"
          :text="rowValue.id"
        />
      </template>
      <span v-else>–</span>
    </template>

    <!-- service slot: show ID only (name shown via service_name field) -->
    <template #service="{ rowValue }">
      <template v-if="rowValue">
        <InternalLinkItem v-if="showIdAsLink"
          :item="{ key: rowValue.id, value: rowValue.id, type: ConfigurationSchemaType.LinkInternal }"
          @navigation-click="$emit('navigation-click', rowValue.id, 'service')"
        />
        <KCopy v-else
          :copy-tooltip="'Copy Service ID'"
          :text="rowValue.id"
        />
      </template>
      <span v-else>–</span>
    </template>

    <!-- consumer_group slot: only id available -->
    <template #consumer_group="{ rowValue }">
      <template v-if="rowValue">
        <InternalLinkItem v-if="showIdAsLink"
          :item="{ key: rowValue.id, value: rowValue.id, type: ConfigurationSchemaType.LinkInternal }"
          @navigation-click="$emit('navigation-click', rowValue.id, 'consumer_group')"
        />
        <KCopy v-else
          :copy-tooltip="'Copy Consumer Group ID'"
          :text="rowValue.id"
        />
      </template>
      <span v-else>–</span>
    </template>

    <!-- partials slot: show id/name like the original -->
    <template #partials="{ rowValue }">
      <template v-if="rowValue && rowValue.length">
        <InternalLinkItem v-if="showIdAsLink"
          :item="{ key: rowValue[0]?.id, value: rowValue[0]?.id + (rowValue[0]?.name ? '/' + rowValue[0].name : ''), type: ConfigurationSchemaType.LinkInternal }"
          @navigation-click="$emit('navigation-click', rowValue[0]?.id, 'partial')"
        />
        <KCopy v-else
          :copy-tooltip="'Copy Partials ID'"
          data-testid="partial-copy-uuid"
          :text="rowValue[0]?.id"
        />
      </template>
      <span v-else>–</span>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { KSkeleton, KEmptyState, KCopy } from '@kong/kongponents'
import {
  EntityBaseConfigCard,
  InternalLinkItem,
  ConfigurationSchemaType,
  SupportedEntityType,
  useSchemaProvider,
  useAxios,
} from '@kong-ui-public/entities-shared'
import { PluginIcon, usePluginMetaData } from '@kong-ui-public/entities-plugins'
import type { KongManagerBaseEntityConfig } from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'

const props = defineProps({
  config: {
    type: Object as () => KongManagerBaseEntityConfig & { pluginType: string; entityId: string },
    required: true,
  },
  configCardDoc: {
    type: String,
    default: '',
  },
  showIdAsLink: {
    type: Boolean,
    default: false,
  },
  hideTitle: {
    type: Boolean,
    default: false,
  },
  scopedEntityType: {
    type: String,
    default: '',
  },
  scopedEntityId: {
    type: String,
    default: '',
  },
  expandPartial: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'error:fetch-schema', error: AxiosError): void
  (e: 'navigation-click', data: string, direction: string): void
}>()

const { getDisplayName, pluginMetaData } = usePluginMetaData()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

function getPluginDisplayName(name: string): string {
  return getDisplayName(name)
}

// --- Schema fetching ---
const schemaRef = ref<Record<string, any>>({})
const schemaLoading = ref(false)
const schemaError = ref('')

// Provide schema to EntityBaseConfigCard
useSchemaProvider(schemaRef)

// Schema URL: /{workspace}/schemas/plugins/{pluginType}
const schemaFetchUrl = computed(() => {
  let url = `${props.config.apiBaseUrl}/{workspace}/schemas/plugins/${props.config.pluginType}`
  if (props.config.app === 'kongManager' && props.config.workspace) {
    url = url.replace('/{workspace}/', `/${props.config.workspace}/`)
  }
  return url
})

// Entity fetch URL: path only (EntityBaseConfigCard prepends apiBaseUrl)
// Original uses pt.item.kongManager: { all: '/{workspace}/plugins/{id}', forEntity: '/{workspace}/{entityType}/{entityId}/plugins/{id}' }
const fetchUrl = computed(() => {
  if (props.scopedEntityType && props.scopedEntityId) {
    let url = `/{workspace}/${props.scopedEntityType}s/${props.scopedEntityId}/plugins/${props.config.entityId}`
    if (props.config.app === 'kongManager' && props.config.workspace) {
      url = url.replace('/{workspace}/', `/${props.config.workspace}/`)
    }
    return url + (props.expandPartial ? '?expand_partials=true' : '')
  }

  let url = `/{workspace}/plugins/${props.config.entityId}`
  if (props.config.app === 'kongManager' && props.config.workspace) {
    url = url.replace('/{workspace}/', `/${props.config.workspace}/`)
  }
  return url + (props.expandPartial ? '?expand_partials=true' : '')
})

// --- setFieldType: replicated from @kong-ui-public/entities-plugins usePluginHelpers ---
// Maps schema field types to ConfigurationSchemaType for EntityBaseConfigCard
function setFieldType(result: Record<string, any>, key: string, fieldDef: any) {
  if (!result || !key || !fieldDef) return
  switch (fieldDef.type) {
    case 'boolean':
      result[key] = { type: ConfigurationSchemaType.BadgeStatus, ...result[key] }
      break
    case 'string':
      if (fieldDef.encrypted) {
        result[key] = { type: ConfigurationSchemaType.Redacted, ...result[key] }
      } else {
        result[key] = { type: ConfigurationSchemaType.Text, ...result[key] }
      }
      break
    case 'set':
      if (fieldDef.elements?.type === 'string') {
        result[key] = { type: ConfigurationSchemaType.BadgeTag, ...result[key] }
      }
      break
    case 'array':
      if (['methods', 'logout_methods'].includes(key)) {
        result[key] = { type: ConfigurationSchemaType.BadgeMethod, ...result[key] }
      } else if (fieldDef.elements?.type === 'string') {
        if (fieldDef.encrypted) {
          result[key] = { type: ConfigurationSchemaType.RedactedArray, ...result[key] }
        } else {
          result[key] = { type: ConfigurationSchemaType.BadgeTag, ...result[key] }
        }
      } else if (fieldDef.elements?.type === 'record') {
        result[key] = { type: ConfigurationSchemaType.Json, ...result[key] }
      }
      break
    case 'record':
      result[key] = { type: ConfigurationSchemaType.Json, ...result[key] }
      break
    default:
      result[key] = { type: ConfigurationSchemaType.Text, ...result[key] }
      break
  }
}

// --- configSchema: replicated from PluginConfigCard ---
const configSchema = computed(() => {
  const schema = schemaRef.value
  if (!schema?.fields) return undefined

  const result: Record<string, any> = {}
  const fields = schema.fields || []

  // Step 1: iterate schema fields and call setFieldType (same as original)
  for (const field of fields) {
    const key = Object.keys(field)[0]
    const value = field[key]
    if (!value) continue
    setFieldType(result, key, value)
  }


  // Step 2: add custom entries (same as original PluginConfigCard)
  // Plus service_name / route_name / consumer_username as separate fields
  const BasicSection = 'basic' as any
  return {
    ...result,
    instance_name: {
      section: BasicSection,
      order: 1.5,
    },
    consumer_username: {
      label: 'Consumer Username',
      section: BasicSection,
      order: 5.9,
    },
    consumer: {
      label: 'Consumer ID',
      section: BasicSection,
      order: 6,
    },
    route_name: {
      label: 'Route Name',
      section: BasicSection,
      order: 5.7,
    },
    route: {
      label: 'Route ID',
      section: BasicSection,
      order: 5.8,
    },
    service_name: {
      label: 'Service Name',
      section: BasicSection,
      order: 5.5,
    },
    service: {
      label: 'Service ID',
      section: BasicSection,
      order: 5.6,
    },
    consumer_group: {
      label: 'Consumer Group ID',
      section: BasicSection,
      order: 6,
    },
    protocols: {
      type: ConfigurationSchemaType.BadgeTag,
      section: BasicSection,
      order: 7,
    },
  } as any
})

// --- pluginConfigSchema: replicated from PluginConfigCard ---
const CONFIG_KEY = 'config'

// Get config sub-fields from the raw schema
const configSubFields = computed(() => {
  const schema = schemaRef.value
  if (!schema?.fields) return []
  const configField = schema.fields.find((f: any) => Object.keys(f)[0] === CONFIG_KEY)
  return configField?.[CONFIG_KEY]?.fields || []
})

const pluginConfigSchema = computed(() => {
  if (!configSubFields.value.length) return undefined

  const result: Record<string, any> = {}
  for (const field of configSubFields.value) {
    const key = Object.keys(field)[0]
    const value = field[key]
    if (!value) continue
    if (value.required) {
      result[key] = { order: 1 }
    }
    // Also set field types for plugin config fields
    setFieldType(result, key, value)
  }

  return result
})

// --- record-resolver: filter null foreign keys based on plugin scope (same as original) ---

const recordResolver = (record: Record<string, any>) => {
  const scope = pluginMetaData?.[props.config.pluginType]?.scope

  // Flatten name fields from foreign key objects into top-level fields
  const enriched = { ...record }
  if (record.service?.name) {
    enriched.service_name = record.service.name
  }
  if (record.route?.name) {
    enriched.route_name = record.route.name
  }
  if (record.consumer?.username) {
    enriched.consumer_username = record.consumer.username
  }

  if (!scope) return enriched
  return Object.fromEntries(
    Object.entries(enriched).filter(([key, value]) => {
      if (value) return true
      if (key === 'service' && !scope.includes('service' as any)) return false
      if (key === 'route' && !scope.includes('route' as any)) return false
      if (key === 'consumer' && !scope.includes('consumer' as any)) return false
      if (key === 'consumer_group' && !scope.includes('consumer_group' as any)) return false
      return true
    }),
  )
}

// --- code-block-record-formatter: remove __ui_data (same as original) ---
const codeBlockRecordFormatter = (record: Record<string, any>) => {
  if (!record || typeof record !== 'object') return record
  const cleaned = { ...record }
  delete cleaned.__ui_data
  // Remove flattened name fields from code block (they're derived from foreign keys)
  delete cleaned.service_name
  delete cleaned.route_name
  delete cleaned.consumer_username
  return cleaned
}

// Fetch schema on mount
onMounted(async () => {
  schemaLoading.value = true
  try {
    const { data } = await axiosInstance.get(schemaFetchUrl.value)
    schemaRef.value = data
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Failed to load schema'
    schemaError.value = message
    emit('error:fetch-schema', err)
  } finally {
    schemaLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.name-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-icon {
  flex-shrink: 0;
}

.info-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
