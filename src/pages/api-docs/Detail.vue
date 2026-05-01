<template>
  <PageHeader :title="t('api-docs.detail.title', { name: docName })">
    <HeaderBackButton entity="api-doc" />
  </PageHeader>

  <div v-if="loading" class="loading-state">
    <KSkeleton />
  </div>

  <div v-else-if="doc" class="api-doc-detail">
    <!-- Info bar -->
    <div class="info-bar">
      <VersionSelector
        v-if="versions.length > 0"
        v-model="currentVersion"
        :versions="versions"
        @change="onVersionChange"
      />

      <router-link
        v-if="doc.service?.id"
        :to="{ name: 'service-detail', params: { workspace: 'default', id: doc.service.id } }"
        class="service-link"
      >
        <KBadge appearance="info">
          {{ t('api-docs.detail.view_service') }}: {{ doc.service.name || doc.service.id }}
        </KBadge>
      </router-link>

      <KBadge v-else appearance="neutral">
        {{ t('api-docs.detail.no_service') }}
      </KBadge>

      <!-- Delete current version -->
      <KButton
        appearance="danger"
        outline
        size="small"
        :disabled="!canDeleteSync"
        @click="onDeleteVersion"
      >
        {{ t('api-docs.versions.delete') }}
      </KButton>

      <!-- Delete all versions -->
      <KButton
        v-if="versions.length > 1"
        appearance="danger"
        outline
        size="small"
        :disabled="!canDeleteSync"
        @click="onDeleteAllVersions"
      >
        {{ t('api-docs.versions.delete_all') }}
      </KButton>

      <!-- Debug mode toggle -->
      <KButton
        v-if="doc.service?.id"
        :appearance="debugMode === 'gateway' ? 'primary' : 'secondary'"
        size="small"
        @click="debugMode = 'gateway'"
      >
        {{ t('api-docs.detail.debug_gateway') }}
      </KButton>
      <KButton
        :appearance="debugMode === 'direct' ? 'primary' : 'secondary'"
        size="small"
        @click="debugMode = 'direct'"
      >
        {{ t('api-docs.detail.debug_direct') }}
      </KButton>
    </div>

    <!-- Swagger UI -->
    <SwaggerUIRenderer
      :spec="spec"
      :debug-mode="debugMode"
      :gateway-url="gatewayUrl"
      :upstream-url="upstreamUrl"
    />
  </div>

  <!-- Delete Confirmation -->
  <KPrompt
    :visible="showDeleteModal"
    :title="deleteMode === 'version' ? t('api-docs.versions.delete') : t('api-docs.delete_confirm_title')"
    action-button-appearance="danger"
    action-button-text="Yes, delete"
    :confirmation-text="docName"
    :confirmation-prompt="t('api-docs.delete_type_confirm', { name: docName })"
    @cancel="showDeleteModal = false"
    @proceed="doDelete"
  >
    <template #default>
      <p v-if="deleteMode === 'version'">
        {{ t('api-docs.versions.delete_confirm') }}
      </p>
      <p v-else>
        {{ t('api-docs.delete_confirm_body', { name: docName }) }}
      </p>
    </template>
  </KPrompt>

  <KEmptyState
    v-if="!loading && !doc"
    :title="t('api-docs.load_failed')"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KBadge, KSkeleton, KEmptyState, KButton, KPrompt } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useToaster } from '@/composables/useToaster'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import { useAuthStore } from '@/stores/auth'
import SwaggerUIRenderer from './components/SwaggerUIRenderer.vue'
import VersionSelector from './components/VersionSelector.vue'

defineOptions({
  name: 'ApiDocDetail',
})

const { t } = useI18n()
const toaster = useToaster()
const route = useRoute()
const router = useRouter()
const { workspace } = useCurrentWorkspace()

const wsParam = computed(() => workspace.value ? `?workspace=${workspace.value}` : '')
const authStore = useAuthStore()
const canDeleteSync = computed(() => authStore.hasPermissionGuarded('delete', '/api-docs/*'))

const showDeleteModal = ref(false)
const deleteMode = ref<'version' | 'all'>('version')

const loading = ref(false)
const doc = ref<any>(null)
const docName = computed(() => doc.value?.name || '')
const versions = ref<Array<{ version: string; is_current: boolean }>>([])
const currentVersion = ref('')
const debugMode = ref<'gateway' | 'direct'>('gateway')

// Gateway URL from config
const gatewayUrl = computed(() => {
  // Use current host with common proxy port
  return `${window.location.protocol}//${window.location.hostname}:8443`
})

// Upstream URL from service
const upstreamUrl = computed(() => {
  if (!doc.value?.service) return ''
  const svc = doc.value.service
  return `${svc.protocol || 'http'}://${svc.host}:${svc.port || 80}${svc.path || ''}`
})

const spec = computed(() => {
  if (!doc.value?.spec_content) return {}
  try {
    return JSON.parse(doc.value.spec_content)
  } catch {
    return {}
  }
})

async function fetchDoc(name: string, version?: string) {
  loading.value = true
  try {
    if (version) {
      const { data } = await apiService.get(`api-docs/${name}/versions/${version}${wsParam.value}`)
      doc.value = data
    } else {
      const { data } = await apiService.get(`api-docs/${name}${wsParam.value}`)
      doc.value = data
    }

    // Fetch versions list
    const { data: versionData } = await apiService.get<{ data: any[] }>(`api-docs/${name}/versions${wsParam.value}`)
    versions.value = (versionData.data || []).map((v: any) => ({
      version: v.version,
      is_current: v.is_current,
    }))

    if (!currentVersion.value && doc.value) {
      currentVersion.value = doc.value.version
    }
  } catch {
    doc.value = null
  } finally {
    loading.value = false
  }
}

function onVersionChange(version: string) {
  const name = route.params.name as string
  fetchDoc(name, version)
}

function onDeleteVersion() {
  deleteMode.value = 'version'
  showDeleteModal.value = true
}

function onDeleteAllVersions() {
  deleteMode.value = 'all'
  showDeleteModal.value = true
}

async function doDelete() {
  const name = doc.value?.name
  if (!name) return

  try {
    if (deleteMode.value === 'version') {
      const version = doc.value?.version
      if (!version) return
      await apiService.delete(`api-docs/${name}/versions/${version}${wsParam.value}`)
      toaster.open({ appearance: 'success', message: t('api-docs.versions.version_deleted', { version }) })

      if (versions.value.length <= 1) {
        router.push({ name: 'api-doc-list' })
      } else {
        currentVersion.value = ''
        showDeleteModal.value = false
        fetchDoc(name)
      }
    } else {
      await apiService.delete(`api-docs/${name}${wsParam.value}`)
      toaster.open({ appearance: 'success', message: t('api-docs.deleted', { name }) })
      router.push({ name: 'api-doc-list' })
    }
  } catch {
    toaster.open({ appearance: 'danger', message: t('api-docs.versions.delete_failed') })
  }
}

onMounted(() => {
  const name = route.params.name as string
  if (name) fetchDoc(name)
})

watch(() => route.params.name, (name) => {
  if (name) {
    currentVersion.value = ''
    fetchDoc(name as string)
  }
})
</script>

<style lang="scss" scoped>
.api-doc-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.service-link {
  text-decoration: none;
}

.loading-state {
  padding: 24px;
}
</style>
