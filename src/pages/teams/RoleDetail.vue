<template>
  <div>
    <PageHeader :title="`Role: ${roleName}`">
      <KButton
        appearance="secondary"
        @click="router.push({ name: 'teams' })"
      >
        &larr; Back to Teams
      </KButton>
    </PageHeader>

    <div v-if="loadingRole" class="loading">Loading...</div>

    <template v-else>
      <!-- Role Info Card -->
      <KCard class="info-card">
        <h3 class="section-title">Role Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name</span>
            <span class="info-value">{{ role.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Comment</span>
            <span class="info-value">{{ role.comment || '–' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Default</span>
            <span class="info-value">
              <KBadge v-if="role.is_default" appearance="info">Default</KBadge>
              <span v-else>–</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value info-id">{{ role.id }}</span>
          </div>
        </div>
        <div class="card-actions">
          <KButton
            :disabled="!authStore.hasPermissionGuarded('delete', '/rbac/roles')"
            appearance="danger"
            outline
            @click="showDeleteRoleModal = true"
          >
            Delete Role
          </KButton>
        </div>
      </KCard>

      <!-- Permissions Tabs -->
      <KTabs
        v-model="activePermTab"
        :tabs="permTabs"
      >
        <template #endpoints>
          <div class="perm-section">
            <div class="perm-header">
              <KButton
                :disabled="!authStore.hasPermissionGuarded('create', '/rbac/roles')"
                appearance="primary"
                size="small"
                @click="openEndpointModal"
              >
                + Add Permission
              </KButton>
            </div>

            <KCard class="table-card">
              <KTableData
                :fetcher="endpointFetcher"
                :headers="endpointHeaders"
                :fetcher-cache-key="endpointCacheKey"
              >
                <template #endpoint="{ rowValue }">
                  <code>{{ rowValue }}</code>
                </template>
                <template #perms="{ rowValue }">
                  {{ formatActions(rowValue) }}
                </template>
                <template #workspace="{ rowValue }">
                  {{ rowValue || '*' }}
                </template>
                <template #negative="{ rowValue }">
                  <KBadge :appearance="rowValue ? 'danger' : 'success'">
                    {{ rowValue ? 'Deny' : 'Allow' }}
                  </KBadge>
                </template>
                <template #action-items="{ row }">
                  <KDropdownItem :disabled="!authStore.hasPermissionGuarded('delete', '/rbac/roles')" danger @click="confirmDeleteEndpoint(row.id)">Delete</KDropdownItem>
                </template>
              </KTableData>
            </KCard>
          </div>
        </template>

        <template #entities>
          <div class="perm-section">
            <div class="perm-header">
              <KButton
                :disabled="!authStore.hasPermissionGuarded('create', '/rbac/roles')"
                appearance="primary"
                size="small"
                @click="openEntityModal"
              >
                + Add Entity Permission
              </KButton>
            </div>

            <KCard class="table-card">
              <KTableData
                :fetcher="entityFetcher"
                :headers="entityHeaders"
                :fetcher-cache-key="entityCacheKey"
              >
                <template #entity_id="{ rowValue }">
                  <code>{{ rowValue }}</code>
                </template>
                <template #perms="{ rowValue }">
                  {{ formatActions(rowValue) }}
                </template>
                <template #negative="{ rowValue }">
                  <KBadge :appearance="rowValue ? 'danger' : 'success'">
                    {{ rowValue ? 'Deny' : 'Allow' }}
                  </KBadge>
                </template>
                <template #action-items="{ row }">
                  <KDropdownItem :disabled="!authStore.hasPermissionGuarded('delete', '/rbac/roles')" danger @click="confirmDeleteEntity(row.id)">Delete</KDropdownItem>
                </template>
              </KTableData>
            </KCard>
          </div>
        </template>
      </KTabs>
    </template>

    <!-- Delete Role Confirmation Modal -->
    <KModal
      v-if="showDeleteRoleModal"
      :visible="showDeleteRoleModal"
      :title="'Delete Role'"
      @cancel="showDeleteRoleModal = false; deleteConfirmInput = ''"
    >
      <div class="delete-confirm-content">
        <p>Are you sure you want to delete role <strong>"{{ roleName }}"</strong>?</p>
        <p>This action cannot be undone. Type <strong>{{ roleName }}</strong> to confirm:</p>
        <KInput
          v-model="deleteConfirmInput"
          :placeholder="roleName"
        />
      </div>
      <template #footer>
        <KButton
          appearance="secondary"
          @click="showDeleteRoleModal = false; deleteConfirmInput = ''"
        >
          Cancel
        </KButton>
        <KButton
          appearance="danger"
          :disabled="deleteConfirmInput !== roleName"
          @click="deleteRole"
        >
          Delete
        </KButton>
      </template>
    </KModal>

    <!-- Add Endpoint Permission Modal -->
    <KModal
      v-if="showEndpointModal"
      :title="'Add Permissions to Role'"
      :visible="showEndpointModal"
      action-button-text="Add Permission to Role"
      :action-button-disabled="savingEndpoint || (selectedEndpoints.length === 0 && !useCustomEndpoint)"
      @cancel="closeEndpointModal"
      @proceed="addEndpointPermission"
    >
      <div class="modal-body">
        <div class="modal-columns">
          <!-- Endpoints Column -->
          <div class="modal-col">
            <h4 class="col-title">Endpoint</h4>
            <div class="endpoint-list">
              <label
                v-for="ep in availableEndpoints"
                :key="ep.value"
                class="endpoint-checkbox"
              >
                <input
                  type="checkbox"
                  :value="ep.value"
                  :checked="selectedEndpoints.includes(ep.value)"
                  @change="toggleEndpoint(ep.value)"
                />
                <code>{{ ep.label }}</code>
              </label>
            </div>
            <div class="custom-endpoint">
              <label class="endpoint-checkbox">
                <input
                  type="checkbox"
                  :checked="useCustomEndpoint"
                  @change="useCustomEndpoint = !useCustomEndpoint"
                />
                <span>Custom endpoint</span>
              </label>
              <KInput
                v-if="useCustomEndpoint"
                v-model="customEndpointValue"
                placeholder="e.g. /my-plugin/*"
                class="custom-input"
              />
            </div>
            <div class="modal-field">
              <label class="endpoint-checkbox">
                <input type="checkbox" v-model="endpointForm.negative" />
                <span>Negative</span>
              </label>
              <span class="form-hint">Deny rule — explicitly block access</span>
            </div>
            <div class="modal-field">
              <KLabel>Workspace</KLabel>
              <KInput v-model="endpointForm.workspace" placeholder="* (all workspaces)" />
            </div>
          </div>

          <!-- Actions Column -->
          <div class="modal-col">
            <h4 class="col-title">Actions</h4>
            <div class="action-checkboxes-vertical">
              <label
                v-for="action in actionOptions"
                :key="action"
                class="action-checkbox"
              >
                <input
                  type="checkbox"
                  :value="action"
                  :checked="endpointForm.actions.includes(action)"
                  @change="toggleEndpointAction(action)"
                />
                <span>{{ action }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </KModal>

    <!-- Add Entity Permission Modal -->
    <KModal
      v-if="showEntityModal"
      :title="'Add Entity Permission to Role'"
      :visible="showEntityModal"
      action-button-text="Add Entity Permission"
      :action-button-disabled="savingEntity || selectedEntityTypes.length === 0"
      @cancel="closeEntityModal"
      @proceed="addEntityPermission"
    >
      <div class="modal-body">
        <div class="modal-columns">
          <!-- Entity Type Column -->
          <div class="modal-col">
            <h4 class="col-title">Entity Type</h4>
            <div class="endpoint-list">
              <label
                v-for="et in entityTypeOptions"
                :key="et"
                class="endpoint-checkbox"
              >
                <input
                  type="checkbox"
                  :value="et"
                  :checked="selectedEntityTypes.includes(et)"
                  @change="toggleEntityType(et)"
                />
                <span>{{ et }}</span>
              </label>
            </div>
            <div class="modal-field" style="margin-top:12px;">
              <KLabel>Entity ID</KLabel>
              <KInput v-model="entityForm.entity_id" placeholder="* for all" />
            </div>
            <div class="modal-field">
              <label class="endpoint-checkbox">
                <input type="checkbox" v-model="entityForm.negative" />
                <span>Negative</span>
              </label>
              <span class="form-hint">Deny rule — explicitly block access</span>
            </div>
          </div>

          <!-- Actions Column -->
          <div class="modal-col">
            <h4 class="col-title">Actions</h4>
            <div class="action-checkboxes-vertical">
              <label
                v-for="action in actionOptions"
                :key="action"
                class="action-checkbox"
              >
                <input
                  type="checkbox"
                  :value="action"
                  :checked="entityForm.actions.includes(action)"
                  @change="toggleEntityAction(action)"
                />
                <span>{{ action }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KButton, KCard, KTableData, KBadge, KTabs, KLabel, KInput, KDropdownItem, KModal } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useToaster } from '@/composables/useToaster'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'RoleDetail' })

const route = useRoute()
const router = useRouter()
const toaster = useToaster()
const authStore = useAuthStore()

const roleId = route.params.id as string
const roleName = ref(roleId)
const role = ref<any>({})
const loadingRole = ref(true)
const activePermTab = ref('endpoints')

// Delete role confirmation state
const showDeleteRoleModal = ref(false)
const deleteConfirmInput = ref('')

const permTabs = [
  { hash: 'endpoints', title: 'Endpoint Permissions' },
  { hash: 'entities', title: 'Entity Permissions' },
]

// Available endpoints - fetched from backend dynamically
const availableEndpoints = ref<{ value: string; label: string }[]>([])

const actionOptions = ['create', 'read', 'update', 'delete', '*']

// Entity types - fetched from backend dynamically
const entityTypeOptions = ref<string[]>([])

// Endpoint permissions state
const endpointCacheKey = ref('ep-0')
const showEndpointModal = ref(false)
const savingEndpoint = ref(false)
const selectedEndpoints = ref<string[]>([])
const useCustomEndpoint = ref(false)
const customEndpointValue = ref('')
const endpointForm = ref({
  actions: ['*'] as string[],
  negative: false,
  workspace: '',
})

const endpointHeaders = [
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'perms', label: 'Actions' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'negative', label: 'Negative' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

// Entity permissions state
const entityCacheKey = ref('ent-0')
const showEntityModal = ref(false)
const savingEntity = ref(false)
const selectedEntityTypes = ref<string[]>([])
const entityForm = ref({
  entity_id: '*',
  actions: ['*'] as string[],
  negative: false,
})

const entityHeaders = [
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'perms', label: 'Actions' },
  { key: 'negative', label: 'Negative' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

function formatActions(actions: string[]) {
  if (!actions || !Array.isArray(actions)) return '–'
  return actions.join(', ')
}

// Endpoint modal operations
function openEndpointModal() {
  selectedEndpoints.value = []
  useCustomEndpoint.value = false
  customEndpointValue.value = ''
  endpointForm.value = { actions: ['*'], negative: false, workspace: '' }
  showEndpointModal.value = true
}

function closeEndpointModal() {
  showEndpointModal.value = false
}

function toggleEndpoint(value: string) {
  const idx = selectedEndpoints.value.indexOf(value)
  if (idx >= 0) {
    selectedEndpoints.value.splice(idx, 1)
  } else {
    selectedEndpoints.value.push(value)
  }
}

function toggleEndpointAction(action: string) {
  const idx = endpointForm.value.actions.indexOf(action)
  if (idx >= 0) {
    endpointForm.value.actions.splice(idx, 1)
  } else {
    endpointForm.value.actions.push(action)
  }
  if (endpointForm.value.actions.length === 0) {
    endpointForm.value.actions = ['*']
  }
}

// Entity modal operations
function openEntityModal() {
  selectedEntityTypes.value = []
  entityForm.value = { entity_id: '*', actions: ['*'], negative: false }
  showEntityModal.value = true
}

function closeEntityModal() {
  showEntityModal.value = false
}

function toggleEntityType(value: string) {
  const idx = selectedEntityTypes.value.indexOf(value)
  if (idx >= 0) {
    selectedEntityTypes.value.splice(idx, 1)
  } else {
    selectedEntityTypes.value.push(value)
  }
}

function toggleEntityAction(action: string) {
  const idx = entityForm.value.actions.indexOf(action)
  if (idx >= 0) {
    entityForm.value.actions.splice(idx, 1)
  } else {
    entityForm.value.actions.push(action)
  }
  if (entityForm.value.actions.length === 0) {
    entityForm.value.actions = ['*']
  }
}

onMounted(async () => {
  await Promise.all([loadRole(), loadAvailableEndpoints()])
})

async function loadAvailableEndpoints() {
  try {
    const { data } = await apiService.get('rbac/available-endpoints')
    const result = (data as any).data || data || []
    const items = Array.isArray(result) ? result : (result.data || [])
    availableEndpoints.value = items
    // Use entity_types from backend directly
    const etypes = (data as any).entity_types || []
    entityTypeOptions.value = etypes
  } catch (e) {
    console.error('Failed to load available endpoints', e)
  }
}

async function loadRole() {
  try {
    const { data } = await apiService.get(`rbac/roles/${roleId}`)
    role.value = (data as any).data || data
    roleName.value = role.value.name || roleId
  } catch (e) {
    console.error('Failed to load role', e)
  } finally {
    loadingRole.value = false
  }
}

const endpointFetcher = async () => {
  try {
    const { data } = await apiService.get(`rbac/roles/${roleId}/endpoints`)
    const result = (data as any).data || data || []
    const items = Array.isArray(result) ? result : (result.data || [])
    return { data: items, total: items.length }
  } catch {
    return { data: [], total: 0 }
  }
}

const entityFetcher = async () => {
  try {
    const { data } = await apiService.get(`rbac/roles/${roleId}/entities`)
    const result = (data as any).data || data || []
    const items = Array.isArray(result) ? result : (result.data || [])
    return { data: items, total: items.length }
  } catch {
    return { data: [], total: 0 }
  }
}

async function addEndpointPermission() {
  // Collect all endpoints to add
  const endpoints: string[] = [...selectedEndpoints.value]
  if (useCustomEndpoint.value && customEndpointValue.value.trim()) {
    endpoints.push(customEndpointValue.value.trim())
  }

  if (endpoints.length === 0) {
    toaster.open({ appearance: 'danger', message: 'Please select at least one endpoint' })
    return
  }

  if (endpointForm.value.actions.length === 0) {
    toaster.open({ appearance: 'danger', message: 'Please select at least one action' })
    return
  }

  savingEndpoint.value = true
  try {
    for (const ep of endpoints) {
      const payload: Record<string, any> = {
        endpoint: ep,
        actions: endpointForm.value.actions,
        negative: endpointForm.value.negative,
      }
      if (endpointForm.value.workspace) {
        payload.workspace = endpointForm.value.workspace
      }
      await apiService.post(`rbac/roles/${roleId}/endpoints`, payload)
    }
    closeEndpointModal()
    endpointCacheKey.value = `ep-${Date.now()}`
    toaster.open({ appearance: 'success', message: `${endpoints.length} endpoint permission(s) added` })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to add endpoint permission' })
  } finally {
    savingEndpoint.value = false
  }
}

async function deleteEndpointPermission(epId: string) {
  try {
    await apiService.delete(`rbac/roles/${roleId}/endpoints/${epId}`)
    endpointCacheKey.value = `ep-${Date.now()}`
    toaster.open({ appearance: 'success', message: 'Endpoint permission deleted' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to delete endpoint permission' })
  }
}

function confirmDeleteEndpoint(epId: string) {
  if (!confirm('Are you sure you want to delete this endpoint permission?')) return
  deleteEndpointPermission(epId)
}

async function addEntityPermission() {
  if (selectedEntityTypes.value.length === 0) {
    toaster.open({ appearance: 'danger', message: 'Please select at least one entity type' })
    return
  }

  if (entityForm.value.actions.length === 0) {
    toaster.open({ appearance: 'danger', message: 'Please select at least one action' })
    return
  }

  savingEntity.value = true
  try {
    for (const et of selectedEntityTypes.value) {
      const payload: Record<string, any> = {
        entity_type: et,
        entity_id: entityForm.value.entity_id || '*',
        actions: entityForm.value.actions,
        negative: entityForm.value.negative,
      }
      await apiService.post(`rbac/roles/${roleId}/entities`, payload)
    }
    closeEntityModal()
    entityCacheKey.value = `ent-${Date.now()}`
    toaster.open({ appearance: 'success', message: `${selectedEntityTypes.value.length} entity permission(s) added` })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to add entity permission' })
  } finally {
    savingEntity.value = false
  }
}

async function deleteEntityPermission(entId: string) {
  try {
    await apiService.delete(`rbac/roles/${roleId}/entities/${entId}`)
    entityCacheKey.value = `ent-${Date.now()}`
    toaster.open({ appearance: 'success', message: 'Entity permission deleted' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to delete entity permission' })
  }
}

function confirmDeleteEntity(entId: string) {
  if (!confirm('Are you sure you want to delete this entity permission?')) return
  deleteEntityPermission(entId)
}

async function deleteRole() {
  if (deleteConfirmInput.value !== roleName.value) return
  try {
    await apiService.delete(`rbac/roles/${roleId}`)
    toaster.open({ appearance: 'success', message: `Role "${roleName.value}" deleted` })
    showDeleteRoleModal.value = false
    router.push({ name: 'teams' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to delete role' })
  }
}
</script>

<style scoped lang="scss">
.loading {
  text-align: center;
  padding: 40px;
  color: var(--kui-color-text-neutral, #6c7489);
}

.info-card {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: var(--kui-font-size-40, 16px);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--kui-font-size-20, 12px);
  color: var(--kui-color-text-neutral, #6c7489);
  font-weight: 500;
}

.info-value {
  font-size: var(--kui-font-size-30, 13px);
  color: var(--kui-color-text, #000);
}

.info-id {
  font-family: monospace;
  font-size: var(--kui-font-size-10, 11px);
}

.card-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--kui-color-border, #e4e7ec);
}

.perm-section {
  padding-top: 16px;
}

.perm-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.table-card {
  margin-top: 16px;
}

code {
  background: var(--kui-color-background-neutral, #f0f4f8);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: var(--kui-font-size-20, 12px);
}

/* Modal styles */
.modal-body {
  padding: 8px 0;
}

.modal-columns {
  display: flex;
  gap: 24px;
}

.modal-col {
  flex: 1;
  min-width: 0;
}

.col-title {
  margin: 0 0 12px 0;
  font-size: var(--kui-font-size-30, 13px);
  font-weight: 600;
  color: var(--kui-color-text, #000);
}

.endpoint-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--kui-color-border, #e4e7ec);
  border-radius: 4px;
  padding: 8px;
}

.endpoint-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px;
  cursor: pointer;
  font-size: var(--kui-font-size-20, 12px);

  &:hover {
    background: var(--kui-color-background-neutral, #f0f4f8);
    border-radius: 2px;
  }

  code {
    background: none;
    padding: 0;
    font-size: var(--kui-font-size-20, 12px);
  }

  input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
  }
}

.custom-endpoint {
  margin-top: 8px;
}

.custom-input {
  margin-top: 4px;
  width: 100%;
}

.modal-field {
  margin-top: 8px;
}

.form-hint {
  font-size: var(--kui-font-size-10, 11px);
  color: var(--kui-color-text-neutral, #6c7489);
  margin-left: 4px;
}

.action-checkboxes-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  cursor: pointer;
  font-size: var(--kui-font-size-20, 12px);

  &:hover {
    background: var(--kui-color-background-neutral, #f0f4f8);
    border-radius: 2px;
  }

  input[type="checkbox"] {
    margin: 0;
    flex-shrink: 0;
  }
}
</style>
