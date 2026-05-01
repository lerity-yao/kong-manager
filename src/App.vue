<template>
  <!-- Login page: standalone, no layout -->
  <router-view v-if="isLoginPage" />
  <!-- All other pages: with sidebar + navbar -->
  <AppLayout
    v-else
    :sidebar-top-items="sidebarItems"
  >
    <template #sidebar-icon-Workspaces>
      <OverviewIcon />
    </template>
    <template #sidebar-icon-About>
      <InfoIcon />
    </template>
    <template #sidebar-icon-Teams>
      <PeopleIcon />
    </template>
    <template #sidebar-icon-ApiDocs>
      <DocumentIcon />
    </template>
    <template #navbar-right>
      <LanguageSwitcher />
      <UserMenu />
    </template>
    <template #sidebar-header>
      <NavbarLogo />
    </template>
    <router-view />
    <MakeAWish />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { OverviewIcon, InfoIcon, PeopleIcon, DocumentIcon } from '@kong/icons'
import { AppLayout, type SidebarPrimaryItem } from '@kong-ui-public/app-layout'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import NavbarLogo from '@/components/NavbarLogo.vue'
import MakeAWish from '@/components/MakeAWish.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import UserMenu from '@/components/UserMenu.vue'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const { t } = useI18n()

const isLoginPage = computed(() => route.name === 'login')

// Entity type → endpoint mapping for permission checks
const entityEndpointMap: Record<string, string> = {
  'workspace-overview': '/workspaces',
  service: '/services',
  route: '/routes',
  consumer: '/consumers',
  plugin: '/plugins',
  upstream: '/upstreams',
  certificate: '/certificates',
  'ca-certificate': '/ca_certificates',
  sni: '/snis',
  key: '/keys',
  vault: '/vaults',
  'key-set': '/key-sets',
}

const sidebarItems = computed<SidebarPrimaryItem[]>(() => {
  const wsName = (route.params.workspace as string) || 'default'
  const isInWorkspace = !!route.params.workspace || route.name === 'workspace-overview'

  // Build workspace entity sub-menus with permission filtering
  const allEntityItems = [
    { name: t('overview.resource.intro.title'), to: { name: 'workspace-overview', params: { workspace: wsName } }, active: route.name === 'workspace-overview', entityKey: 'workspace-overview' },
    { name: t('entities.service.list.title'), to: { name: 'service-list', params: { workspace: wsName } }, active: route.meta?.entity === 'service', entityKey: 'service' },
    { name: t('entities.route.list.title'), to: { name: 'route-list', params: { workspace: wsName } }, active: route.meta?.entity === 'route', entityKey: 'route' },
    { name: t('entities.consumer.list.title'), to: { name: 'consumer-list', params: { workspace: wsName } }, active: route.meta?.entity === 'consumer', entityKey: 'consumer' },
    { name: t('entities.plugin.list.title'), to: { name: 'plugin-list', params: { workspace: wsName } }, active: route.meta?.entity === 'plugin', entityKey: 'plugin' },
    { name: t('entities.upstream.list.title'), to: { name: 'upstream-list', params: { workspace: wsName } }, active: route.meta?.entity === 'upstream', entityKey: 'upstream' },
    { name: t('entities.certificate.list.title'), to: { name: 'certificate-list', params: { workspace: wsName } }, active: route.meta?.entity === 'certificate', entityKey: 'certificate' },
    { name: t('entities.ca-certificate.list.title'), to: { name: 'ca-certificate-list', params: { workspace: wsName } }, active: route.meta?.entity === 'ca-certificate', entityKey: 'ca-certificate' },
    { name: t('entities.sni.list.title'), to: { name: 'sni-list', params: { workspace: wsName } }, active: route.meta?.entity === 'sni', entityKey: 'sni' },
    { name: t('entities.key.list.title'), to: { name: 'key-list', params: { workspace: wsName } }, active: route.meta?.entity === 'key', entityKey: 'key' },
    { name: t('entities.vault.list.title'), to: { name: 'vault-list', params: { workspace: wsName } }, active: route.meta?.entity === 'vault', entityKey: 'vault' },
    { name: t('entities.key-set.list.title'), to: { name: 'key-set-list', params: { workspace: wsName } }, active: route.meta?.entity === 'key-set', entityKey: 'key-set' },
  ]

  // Filter entity items by read permission (strip entityKey before passing to sidebar)
  const permittedEntityItems = allEntityItems
    .filter(item => authStore.hasPermissionGuarded('read', entityEndpointMap[item.entityKey] || `/${item.entityKey}s`))
    .map(({ entityKey: _entityKey, ...rest }) => rest)

  // Teams menu: visible only if user has read permission for any Teams endpoint
  const canSeeTeams = authStore.hasPermissionGuarded('read', '/admins')
    || authStore.hasPermissionGuarded('read', '/rbac/users')
    || authStore.hasPermissionGuarded('read', '/rbac/groups')
    || authStore.hasPermissionGuarded('read', '/rbac/roles')

  const items: SidebarPrimaryItem[] = [
    // Workspaces
    {
      name: t('workspaces.title'),
      to: { name: 'workspaces' },
      key: 'Workspaces',
      active: route.name === 'workspaces' || route.name === 'workspace-create' || isInWorkspace,
      expanded: isInWorkspace,
      ...(isInWorkspace ? { label: wsName } : {}),
      items: isInWorkspace
        ? permittedEntityItems
        : workspaceStore.workspaces.map(ws => ({
          name: ws.name,
          to: { name: 'workspace-overview', params: { workspace: ws.name } },
        })),
    },
  ]

  // API Docs (top-level menu, permission-guarded)
  const canSeeApiDocs = authStore.hasPermissionGuarded('read', '/api-docs')

  // Teams (conditionally added)
  if (canSeeTeams) {
    items.push({
      name: 'Teams',
      to: { name: 'teams' },
      key: 'Teams',
      active: route.path?.startsWith('/teams'),
    })
  }

  // API Docs (top-level)
  if (canSeeApiDocs) {
    items.push({
      name: t('api-docs.title'),
      to: { name: 'api-doc-list' },
      key: 'ApiDocs',
      active: route.path?.startsWith('/api-docs'),
    })
  }

  // About (always visible)
  items.push({
    name: t('about.title'),
    to: { name: 'about' },
    key: 'About',
    active: route.name === 'about',
  })

  return items
})
</script>

<style scoped lang="scss">
.app-title {
  color: #fff;
  margin: 0;
  font-size: 20px;
}

:deep(.kong-ui-app-layout-content-inner) {
  position: relative;
  min-height: 100%;
  padding: 32px 40px 80px !important;
}

:deep(.json-content.k-code-block) {
  border-top-left-radius: $kui-border-radius-0 !important;
  border-top-right-radius: $kui-border-radius-0 !important;
}
</style>
