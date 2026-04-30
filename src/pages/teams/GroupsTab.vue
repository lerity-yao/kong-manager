<template>
  <div>
    <div class="tab-header">
      <p class="tab-description">User groups for simplified role assignment</p>
      <KButton
        :disabled="!authStore.hasPermissionGuarded('create', '/rbac/groups')"
        appearance="primary"
        @click="router.push({ name: 'group-create' })"
      >
        + New Group
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
            v-if="authStore.hasPermissionGuarded('read', '/rbac/groups/*')"
            :to="{ name: 'group-edit', params: { id: row.id } }"
            class="entity-link"
          >
            {{ rowValue }}
          </router-link>
          <span v-else>{{ rowValue }}</span>
        </template>
        <template #comment="{ rowValue }">
          {{ rowValue || '–' }}
        </template>
        <template #roles="{ rowValue }">
          {{ formatRoles(rowValue) }}
        </template>
        <template #action-items="{ row }">
          <KDropdownItem :disabled="!authStore.hasPermissionGuarded('update', '/rbac/groups/*')" @click="router.push({ name: 'group-edit', params: { id: row.id } })">Edit</KDropdownItem>
        </template>
      </KTableData>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KButton, KCard, KTableData, KDropdownItem } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'GroupsTab' })

const router = useRouter()
const authStore = useAuthStore()
const cacheKey = ref(0)
const fetcherCacheKey = computed(() => `rbac-groups-${cacheKey.value}`)

const headers = [
  { key: 'name', label: 'Name' },
  { key: 'comment', label: 'Comment' },
  { key: 'roles', label: 'Roles' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

function formatRoles(roles: any[]) {
  if (!roles || !Array.isArray(roles)) return '–'
  return roles.map((r: any) => r.name || r).join(', ') || '–'
}

const fetcher = async (params: any) => {
  const pageSize = params?.pageSize || 100
  const { data } = await apiService.get('rbac/groups', { params: { size: pageSize } })
  const result = (data as any).data || data || []
  const items = Array.isArray(result) ? result : (result.data || [])

  return {
    data: items.map((g: any) => ({
      id: g.id,
      name: g.name,
      comment: g.comment,
      roles: g.roles || [],
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
</style>
