<template>
  <div>
    <div class="tab-header">
      <p class="tab-description">Roles define permissions for endpoints and entities</p>
      <KButton
        :disabled="!authStore.hasPermissionGuarded('create', '/rbac/roles')"
        appearance="primary"
        @click="router.push({ name: 'role-create' })"
      >
        + New Role
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
            v-if="authStore.hasPermissionGuarded('read', '/rbac/roles/*')"
            :to="{ name: 'role-detail', params: { id: row.id } }"
            class="entity-link"
          >
            {{ rowValue }}
          </router-link>
          <span v-else>{{ rowValue }}</span>
        </template>
        <template #comment="{ rowValue }">
          {{ rowValue || '–' }}
        </template>
        <template #is_default="{ rowValue }">
          <KBadge v-if="rowValue" appearance="info">Default</KBadge>
          <span v-else>–</span>
        </template>
        <template #action-items="{ row }">
          <KDropdownItem :disabled="!authStore.hasPermissionGuarded('read', '/rbac/roles/*')" @click="router.push({ name: 'role-detail', params: { id: row.id } })">View</KDropdownItem>
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

defineOptions({ name: 'RolesTab' })

const router = useRouter()
const authStore = useAuthStore()
const cacheKey = ref(0)
const fetcherCacheKey = computed(() => `rbac-roles-${cacheKey.value}`)

const headers = [
  { key: 'name', label: 'Name' },
  { key: 'comment', label: 'Comment' },
  { key: 'is_default', label: 'Default' },
  { key: 'actions', label: 'Actions', hideLabel: true },
]

const fetcher = async (params: any) => {
  const pageSize = params?.pageSize || 100
  const { data } = await apiService.get('rbac/roles', { params: { size: pageSize } })
  const result = (data as any).data || data || []
  const items = Array.isArray(result) ? result : (result.data || [])

  return {
    data: items.map((r: any) => ({
      id: r.id || r.name,
      name: r.name,
      comment: r.comment,
      is_default: r.is_default || false,
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
