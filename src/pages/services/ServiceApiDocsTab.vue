<template>
  <div class="service-api-docs-tab">
    <div v-if="loading" class="loading-state">
      <KSkeleton />
    </div>

    <div v-else-if="docs.length === 0" class="empty-state">
      <KEmptyState :title="t('api-docs.tab.no_docs')" />
    </div>

    <div v-else>
      <!-- Doc selector -->
      <div class="doc-selector-bar">
        <KSelect
          v-model="selectedDocName"
          :items="docItems"
          :label="t('api-docs.tab.select_doc')"
          class="doc-selector"
          @change="onDocChange"
        />
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
import { KSkeleton, KEmptyState, KSelect } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import SwaggerUIRenderer from '@/pages/api-docs/components/SwaggerUIRenderer.vue'

const props = defineProps<{
  serviceId: string
}>()

const { t } = useI18n()
const { workspace } = useCurrentWorkspace()
const wsQuery = computed(() => `&workspace=${workspace.value || 'default'}`)

const loading = ref(false)
const docs = ref<any[]>([])
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
  if (!currentDoc.value?.spec_content) return null
  try {
    return JSON.parse(currentDoc.value.spec_content)
  } catch {
    return null
  }
})

const upstreamUrl = computed(() => {
  if (!currentDoc.value?.service) return ''
  const svc = currentDoc.value.service
  return `${svc.protocol || 'http'}://${svc.host}:${svc.port || 80}${svc.path || ''}`
})

const docItems = computed(() => {
  return docs.value.map((doc: any) => ({
    label: `${doc.name} (v${doc.version})`,
    value: doc.name,
  }))
})

async function fetchDocs() {
  if (!props.serviceId) return
  loading.value = true
  try {
    const { data } = await apiService.get<{ data: any[] }>(`api-docs?service_id=${props.serviceId}${wsQuery.value}`)
    docs.value = data.data || []
    if (docs.value.length > 0) {
      selectedDocName.value = docs.value[0].name
    }
  } catch {
    docs.value = []
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

watch(() => props.serviceId, (newId) => {
  if (newId) fetchDocs()
})
</script>

<style lang="scss" scoped>
.service-api-docs-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.doc-selector-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.doc-selector {
  min-width: 300px;
}

.loading-state {
  padding: 24px;
}
</style>
