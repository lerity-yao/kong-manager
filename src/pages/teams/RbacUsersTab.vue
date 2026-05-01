<template>
  <div>
    <div class="tab-header">
      <p class="tab-description">API Token users for programmatic access</p>
      <KButton
        :disabled="!authStore.hasPermissionGuarded('create', '/rbac/users')"
        appearance="primary"
        @click="router.push({ name: 'rbac-user-create' })"
      >
        + Add New User
      </KButton>
    </div>

    <KCard>
      <KTableData
        :fetcher="fetcher"
        :headers="headers"
        :fetcher-cache-key="fetcherCacheKey"
        :pagination-page-sizes="[15, 30, 50, 75, 100]"
      >
        <template #name="{ rowValue, row }">
          <router-link
            v-if="authStore.hasPermissionGuarded('update', '/rbac/users/*')"
            :to="{ name: 'rbac-user-edit', params: { id: row.id } }"
            class="entity-link"
          >
            {{ rowValue }}
          </router-link>
          <span v-else>{{ rowValue }}</span>
        </template>
        <template #user_token="{ rowValue }">
          <div class="token-cell">
            <code class="token-masked">{{ maskToken(rowValue) }}</code>
            <KButton
              appearance="secondary"
              size="small"
              @click="copyToken(rowValue)"
            >
              Copy
            </KButton>
          </div>
        </template>
        <template #enabled="{ rowValue }">
          <KBadge :appearance="rowValue ? 'success' : 'danger'">
            {{ rowValue ? 'Yes' : 'No' }}
          </KBadge>
        </template>
        <template #roles="{ rowValue }">
          {{ formatRoles(rowValue) }}
        </template>
        <template #action-items="{ row }">
          <KDropdownItem :disabled="!authStore.hasPermissionGuarded('update', '/rbac/users/*')" @click="router.push({ name: 'rbac-user-edit', params: { id: row.id } })">Edit</KDropdownItem>
          <KDropdownItem
            :disabled="!authStore.hasPermissionGuarded('delete', '/rbac/users') || isSuperAdminUser(row)"
            danger
            @click="confirmDeleteUser(row)"
          >
            Delete
          </KDropdownItem>
        </template>
      </KTableData>
    </KCard>

    <!-- Delete User Confirmation -->
    <KPrompt
      :visible="showDeleteUserModal"
      title="Delete User"
      action-button-appearance="danger"
      action-button-text="Yes, delete"
      :confirmation-text="deleteUserTarget?.name || ''"
      confirmation-prompt="Type the user name to confirm:"
      @cancel="showDeleteUserModal = false"
      @proceed="deleteUser"
    >
      <template #default>
        <p>Are you sure you want to delete user <strong>"{{ deleteUserTarget?.name }}"</strong>?</p>
        <p>This action cannot be undone.</p>
      </template>
    </KPrompt>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KButton, KCard, KTableData, KBadge, KDropdownItem, KPrompt } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/stores/auth'
import { useToaster } from '@/composables/useToaster'

const toaster = useToaster()

defineOptions({ name: 'RbacUsersTab' })

const router = useRouter()
const authStore = useAuthStore()
const cacheKey = ref(0)
const fetcherCacheKey = computed(() => `rbac-users-${cacheKey.value}`)

// Delete user confirmation state
const showDeleteUserModal = ref(false)
const deleteUserTarget = ref<{ id: string; name: string } | null>(null)

const headers = [
  { key: 'name', label: 'Name' },
  { key: 'user_token', label: 'Token' },
  { key: 'enabled', label: 'Enabled' },
  { key: 'roles', label: 'Roles' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

function maskToken(token: string) {
  if (!token) return '–'
  return token.substring(0, 8) + '****'
}

function formatRoles(roles: any[]) {
  if (!roles || !Array.isArray(roles)) return '–'
  return roles.map((r: any) => r.name || r).join(', ') || '–'
}

async function copyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token)
    toaster.open({ appearance: 'success', message: 'Token copied to clipboard' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to copy token' })
  }
}

function isSuperAdminUser(row: any) {
  return row.roles?.some((r: any) => r.name === 'super-admin')
}

function confirmDeleteUser(row: any) {
  if (isSuperAdminUser(row)) {
    toaster.open({ appearance: 'danger', message: 'Cannot delete user with super-admin role' })
    return
  }
  deleteUserTarget.value = { id: row.id, name: row.name }
  showDeleteUserModal.value = true
}

async function deleteUser() {
  if (!deleteUserTarget.value) return
  try {
    await apiService.delete(`rbac/users/${deleteUserTarget.value.id}`)
    toaster.open({ appearance: 'success', message: `User "${deleteUserTarget.value.name}" deleted` })
    showDeleteUserModal.value = false
    deleteUserTarget.value = null
    cacheKey.value++
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Failed to delete user'
    toaster.open({ appearance: 'danger', message: msg })
  }
}

const fetcher = async (params: any) => {
  const pageSize = params?.pageSize || 100
  const { data } = await apiService.get('rbac/users', { params: { size: pageSize } })
  const result = (data as any).data || data || []
  const items = Array.isArray(result) ? result : (result.data || [])

  return {
    data: items.map((u: any) => ({
      id: u.id,
      name: u.name,
      user_token: u.user_token,
      enabled: u.enabled !== false,
      roles: u.roles || [],
    })),
    total: items.length,
  }
}
</script>

<style scoped lang="scss">
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-description {
  margin: 0;
  color: var(--kui-color-text-neutral, #6c7489);
  font-size: var(--kui-font-size-30, 13px);
}

.entity-link {
  color: var(--kui-color-primary, #1152cb);
  text-decoration: none;
}

.entity-link:hover {
  text-decoration: underline;
}

.token-masked {
  font-family: monospace;
  font-size: var(--kui-font-size-20, 12px);
  color: var(--kui-color-text-neutral, #6c7489);
}

.token-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
