<template>
  <div class="route-api-docs-tab">
    <div v-if="loading" class="loading-state">
      <KSkeleton />
    </div>

    <div v-else-if="docs.length === 0" class="empty-state">
      <KEmptyState :title="t('api-docs.tab.no_docs')" />
    </div>

    <div v-else>
      <!-- Route path info + doc selector -->
      <div class="info-bar">
        <div v-if="routePaths.length > 0" class="route-paths">
          <span class="label">{{ t('api-docs.tab.route_paths') }}:</span>
          <KBadge
            v-for="p in routePaths"
            :key="p"
            appearance="info"
          >
            {{ p }}
          </KBadge>
        </div>
        <KSelect
          v-model="selectedDocName"
          :items="docItems"
          :label="t('api-docs.tab.select_doc')"
          class="doc-selector"
          @change="onDocChange"
        />
      </div>

      <!-- Match stats -->
      <div v-if="currentDoc" class="match-stats">
        <KBadge appearance="success">
          {{ t('api-docs.tab.matched_paths', { matched: currentDoc.matched_path_count, total: currentDoc.path_count }) }}
        </KBadge>
      </div>

      <!-- Swagger UI Renderer -->
      <SwaggerUIRenderer
        v-if="currentSpec"
        :spec="currentSpec"
        :debug-mode="debugMode"
        :gateway-url="gatewayUrl"
        :upstream-url="upstreamUrl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { KSkeleton, KEmptyState, KSelect, KBadge } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import SwaggerUIRenderer from '@/pages/api-docs/components/SwaggerUIRenderer.vue'

const props = defineProps<{
  routeId: string
}>()

const { t } = useI18n()
const { workspace } = useCurrentWorkspace()
const wsQuery = computed(() => `workspace=${workspace.value || 'default'}`)

const loading = ref(false)
const docs = ref<any[]>([])
const routePaths = ref<string[]>([])
const selectedDocName = ref('')
const debugMode = ref<'gateway' | 'direct'>('gateway')

const gatewayUrl = computed(() => {
  return `${window.location.protocol}//${window.location.hostname}:8443`
})

const currentDoc = computed(() => {
  if (!selectedDocName.value || docs.value.length === 0) return null
  return docs.value.find((d: any) => d.name === selectedDocName.value) || docs.value[0]
})

const currentSpec = computed(() => {
  return currentDoc.value?.spec || null
})

const upstreamUrl = computed(() => {
  // Use service info from the doc if available
  if (!currentDoc.value?.service) return ''
  const svc = currentDoc.value.service
  return `${svc.protocol || 'http'}://${svc.host}:${svc.port || 80}${svc.path || ''}`
})

const docItems = computed(() => {
  return docs.value.map((doc: any) => ({
    label: `${doc.name} (v${doc.version})${doc.matched_path_count !== undefined ? ` - ${doc.matched_path_count}/${doc.path_count}` : ''}`,
    value: doc.name,
  }))
})

async function fetchDocs() {
  if (!props.routeId) return
  loading.value = true
  try {
    const { data } = await apiService.get<{
      data: any[]
      route: { paths: string[] }
        }>(`api-docs/by-route/${props.routeId}?${wsQuery.value}`)
    docs.value = data.data || []
    routePaths.value = data.route?.paths || []
    if (docs.value.length > 0) {
      selectedDocName.value = docs.value[0].name
    }
  } catch {
    docs.value = []
    routePaths.value = []
  } finally {
    loading.value = false
  }
}

function onDocChange() {
  // selectedDocName is already updated by v-model
}

onMounted(() => {
  fetchDocs()
})

watch(() => props.routeId, (newId) => {
  if (newId) fetchDocs()
})
</script>

<style lang="scss" scoped>
.route-api-docs-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.route-paths {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .label {
    font-weight: 500;
    white-space: nowrap;
  }
}

.doc-selector {
  min-width: 300px;
}

.match-stats {
  display: flex;
  gap: 8px;
}

.loading-state {
  padding: 24px;
}
</style>
