<template>
  <PageHeader :title="t('api-docs.list.title')">
    <KButton
      appearance="primary"
      :disabled="!canCreateSync"
      @click="showUploadModal = true"
    >
      {{ t('api-docs.list.new') }}
    </KButton>
  </PageHeader>

  <!-- Workspace Filter -->
  <div class="filter-bar">
    <KSelect
      v-model="selectedWorkspace"
      :items="workspaceItems"
      :label="t('api-docs.list.workspace')"
      class="filter-item"
      @change="fetcherCacheKey = String(Date.now())"
    />
  </div>

  <!-- Table -->
  <KTableData
    :fetcher="fetcher"
    :headers="tableHeaders"
    :fetcher-cache-key="fetcherCacheKey"
    :search-input="debouncedSearchQuery"
    :empty-state-message="t('api-docs.list.empty.message')"
    :empty-state-title="t('api-docs.list.empty.title')"
  >
    <template #toolbar>
      <KInput
        v-model="searchQuery"
        :placeholder="t('api-docs.list.search_name_placeholder')"
        type="search"
      />
    </template>
    <template #name="{ rowValue }">
      <router-link :to="getDetailRoute(rowValue as string)">
        {{ rowValue }}
      </router-link>
    </template>
    <template #service="{ rowValue }">
      <KBadge v-if="rowValue" appearance="info">
        <router-link
          :to="getServiceDetailRoute(rowValue as any)"
          class="service-link"
        >
          {{ getServiceName(rowValue as any) }}
        </router-link>
      </KBadge>
      <span v-else>{{ t('api-docs.detail.no_service') }}</span>
    </template>
    <template #ws_name="{ rowValue }">
      {{ rowValue || '-' }}
    </template>
    <template #action-items="{ row }">
      <KDropdownItem :disabled="!canUpdateSync" @click="onEdit(row)">
        {{ t('global.buttons.edit') }}
      </KDropdownItem>
      <KDropdownItem :disabled="!canDeleteSync" danger @click="onDelete(row)">
        {{ t('global.buttons.delete') }}
      </KDropdownItem>
    </template>
  </KTableData>

  <!-- Upload Modal -->
  <ApiDocUploadModal
    v-model="showUploadModal"
    :default-workspace="selectedWorkspace || 'default'"
    @created="fetcherCacheKey = String(Date.now())"
  />

  <!-- Edit Modal -->
  <ApiDocEditModal
    v-model="showEditModal"
    :doc-name="editDoc?.name || ''"
    :current-workspace="editDoc?.ws_name || ''"
    :current-service-id="editDoc?.service?.id || ''"
    @updated="fetcherCacheKey = String(Date.now())"
  />

  <!-- Delete Confirmation -->
  <KPrompt
    :visible="showDeleteModal"
    :title="t('api-docs.delete_confirm_title')"
    action-button-appearance="danger"
    action-button-text="Yes, delete"
    :confirmation-text="deleteTargetDoc?.name || ''"
    :confirmation-prompt="t('api-docs.delete_type_confirm', { name: deleteTargetDoc?.name || '' })"
    @cancel="showDeleteModal = false"
    @proceed="doDelete"
  >
    <template #default>
      <p>{{ t('api-docs.delete_confirm_body', { name: deleteTargetDoc?.name || '' }) }}</p>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { KButton, KSelect, KInput, KTableData, KBadge, KDropdownItem, KPrompt } from '@kong/kongponents'
import { debounce } from 'lodash-es'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useToaster } from '@/composables/useToaster'
import { useAuthStore } from '@/stores/auth'
import ApiDocUploadModal from './components/ApiDocUploadModal.vue'
import ApiDocEditModal from './components/ApiDocEditModal.vue'

defineOptions({
  name: 'ApiDocList',
})

const { t } = useI18n()
const toaster = useToaster()
const router = useRouter()
const authStore = useAuthStore()

// Sync permission checks for template binding (hasPermissionGuarded is synchronous)
const canCreateSync = computed(() => authStore.hasPermissionGuarded('create', '/api-docs/*'))
const canUpdateSync = computed(() => authStore.hasPermissionGuarded('update', '/api-docs/*'))
const canDeleteSync = computed(() => authStore.hasPermissionGuarded('delete', '/api-docs/*'))

const showUploadModal = ref(false)
const showEditModal = ref(false)
const editDoc = ref<any>(null)
const showDeleteModal = ref(false)
const deleteTargetDoc = ref<any>(null)
const selectedWorkspace = ref('')  // '' = all (no filter), 'default'/'xxx' = specific workspace
const searchQuery = ref('')
const servicesMap = ref<Record<string, string>>({})
const workspaces = ref<Array<any>>([])
const fetcherCacheKey = ref('0')

// Debounced search - KTableData 通过 searchInput prop 将搜索词传入 fetcher params.query
const debouncedSearchQuery = ref('')
const updateSearch = debounce((val: string) => {
  debouncedSearchQuery.value = val
}, 300)
watch(searchQuery, (val) => updateSearch(val))

const workspaceItems = computed(() => {
  return [
    { label: t('api-docs.list.workspace_all'), value: '' },  // "All" option
    ...workspaces.value.map((ws: any) => ({
      label: ws.name || ws,
      value: ws.name || ws,
    })),
  ]
})

const tableHeaders = computed(() => [
  { key: 'name', label: t('api-docs.list.headers.name'), sortable: true },
  { key: 'version', label: t('api-docs.list.headers.version') },
  { key: 'service', label: t('api-docs.list.headers.service') },
  { key: 'ws_name', label: t('api-docs.list.headers.workspace') },
  { key: 'created_at', label: t('api-docs.list.headers.created_at'), sortable: true },
  { key: 'actions', label: 'Actions', hideLabel: true },
])

// KTableData fetcher
const fetcher = async (params: any) => {
  const pageSize = params?.pageSize || 15
  const offset = params?.offset || ''

  try {
    const wsParam = selectedWorkspace.value ? `&workspace=${selectedWorkspace.value}` : ''
    const { data } = await apiService.get<{ data: any[]; next: string | null }>(`api-docs?size=${pageSize}${offset ? '&offset=' + offset : ''}${wsParam}`)
    let rows = data.data || []

    // Build services map
    for (const doc of rows) {
      if (doc.service?.id && doc.service?.name) {
        servicesMap.value[doc.service.id] = doc.service.name
      }
    }

    // 前端搜索过滤 - KTableData 通过 searchInput prop 将搜索词传入 params.query
    const q = (params.query || '').toLowerCase().trim()
    if (q) {
      rows = rows.filter((row: any) => row.name?.toLowerCase().includes(q))
    }

    return { data: rows, total: rows.length, nextPage: data.next || null }
  } catch {
    return { data: [], total: 0, nextPage: null }
  }
}

function getDetailRoute(name: string) {
  return { name: 'api-doc-detail', params: { name } }
}

function getServiceDetailRoute(serviceData: any) {
  if (!serviceData?.id) return {}
  return { name: 'service-detail', params: { workspace: 'default', id: serviceData.id } }
}

function getServiceName(serviceData: any) {
  if (!serviceData?.id) return '-'
  return servicesMap.value[serviceData.id] || serviceData.id
}

function onEdit(row: any) {
  editDoc.value = row
  showEditModal.value = true
}

function onDelete(row: any) {
  deleteTargetDoc.value = row
  showDeleteModal.value = true
}

async function doDelete() {
  const row = deleteTargetDoc.value
  if (!row) return

  try {
    const wsParam = selectedWorkspace.value ? `?workspace=${selectedWorkspace.value}` : ''
    await apiService.delete(`api-docs/${row.name}${wsParam}`)
    toaster.open({ appearance: 'success', message: t('api-docs.deleted', { name: row.name }) })
    showDeleteModal.value = false
    fetcherCacheKey.value = String(Date.now())
  } catch (err: any) {
    toaster.open({ appearance: 'danger', message: t('api-docs.delete_failed') })
  }
}

onMounted(async () => {
  try {
    const { data: wsData } = await apiService.get<{ data: any[] }>('workspaces')
    workspaces.value = wsData.data || []
  } catch {
    workspaces.value = [{ name: 'default' }]
  }
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.filter-item {
  min-width: 200px;
}

.service-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
