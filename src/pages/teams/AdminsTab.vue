<template>
  <div>
    <div class="tab-header">
      <p class="tab-description">Users that have access to Kong Manager and the Admin API</p>
      <KButton
        :disabled="!authStore.hasPermissionGuarded('create', '/admins')"
        appearance="primary"
        @click="router.push({ name: 'admin-create' })"
      >
        + Invite Admin
      </KButton>
    </div>

    <KCard>
      <KTableData
        :fetcher="fetcher"
        :headers="headers"
        :fetcher-cache-key="fetcherCacheKey"
        :pagination-page-sizes="[15, 30, 50, 75, 100]"
      >
        <template #username="{ rowValue, row }">
          <router-link
            :to="{ name: 'admin-edit', params: { id: row.id } }"
            class="entity-link"
          >
            {{ rowValue }}
          </router-link>
        </template>
        <template #email="{ rowValue }">
          {{ rowValue || '–' }}
        </template>
        <template #status="{ rowValue }">
          <KBadge
            :appearance="rowValue === 1 ? 'success' : 'warning'"
          >
            {{ rowValue === 1 ? 'Active' : 'Invited' }}
          </KBadge>
        </template>
        <template #roles="{ rowValue }">
          {{ formatRoles(rowValue) }}
        </template>
        <template #action-items="{ row }">
          <KDropdownItem @click="router.push({ name: 'admin-edit', params: { id: row.id } })">Edit</KDropdownItem>
        </template>
      </KTableData>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KButton, KCard, KTableData, KBadge, KDropdownItem } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'AdminsTab' })

const router = useRouter()
const authStore = useAuthStore()
const cacheKey = ref(0)
const fetcherCacheKey = computed(() => `admins-${cacheKey.value}`)

const headers = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'roles', label: 'Roles' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

function formatRoles(roles: any[]) {
  if (!roles || !Array.isArray(roles)) return '–'
  return roles.map((r: any) => r.name || r).join(', ') || '–'
}

const fetcher = async (params: any) => {
  const pageSize = params?.pageSize || 100
  const { data } = await apiService.get('admins', { params: { size: pageSize } })
  const result = (data as any).data || data || []
  const items = Array.isArray(result) ? result : (result.data || [])

  // Separate active and invited for display
  const processed = items.map((a: any) => ({
    id: a.id,
    username: a.username,
    email: a.email,
    status: a.status ?? 1,
    roles: a.roles || [],
  }))

  return {
    data: processed,
    total: processed.length,
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
</style>
