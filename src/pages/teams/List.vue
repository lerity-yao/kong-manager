<template>
  <PageHeader title="Teams">
    <template #description>
      Use this section to define &amp; understand access to Kong across your teams and workspaces.
    </template>
  </PageHeader>

  <KTabs
    v-model="activeTab"
    :tabs="visibleTabs"
  >
    <template #admins>
      <AdminsTab v-if="activeTab === 'admins'" />
    </template>
    <template #rbac-users>
      <RbacUsersTab v-if="activeTab === 'rbac-users'" />
    </template>
    <template #groups>
      <GroupsTab v-if="activeTab === 'groups'" />
    </template>
    <template #roles>
      <RolesTab v-if="activeTab === 'roles'" />
    </template>
  </KTabs>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { KTabs } from '@kong/kongponents'
import PageHeader from '@/components/PageHeader.vue'
import AdminsTab from './AdminsTab.vue'
import RbacUsersTab from './RbacUsersTab.vue'
import GroupsTab from './GroupsTab.vue'
import RolesTab from './RolesTab.vue'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'TeamsList' })

const authStore = useAuthStore()

const allTabs = [
  { hash: 'admins', title: 'Admins', permission: { action: 'read', endpoint: '/admins' } },
  { hash: 'rbac-users', title: 'RBAC Users', permission: { action: 'read', endpoint: '/rbac/users' } },
  { hash: 'groups', title: 'Groups', permission: { action: 'read', endpoint: '/rbac/groups' } },
  { hash: 'roles', title: 'Roles', permission: { action: 'read', endpoint: '/rbac/roles' } },
]

// Only show tabs the user has read permission for
const visibleTabs = computed(() =>
  allTabs.filter(tab => authStore.hasPermissionGuarded(tab.permission.action, tab.permission.endpoint)),
)

// Default to first visible tab
const activeTab = ref(visibleTabs.value[0]?.hash || 'admins')

// If visible tabs change, ensure activeTab is still valid
watch(visibleTabs, (tabs) => {
  if (tabs.length > 0 && !tabs.some(t => t.hash === activeTab.value)) {
    activeTab.value = tabs[0].hash
  }
})
</script>
