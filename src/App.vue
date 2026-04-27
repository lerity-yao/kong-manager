<template>
  <AppLayout
    :sidebar-top-items="sidebarItems"
  >
    <template #navbar-right>
      <LanguageSwitcher />
      <GithubStar url="https://github.com/kong/kong" />
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
import { AppLayout, type SidebarPrimaryItem } from '@kong-ui-public/app-layout'
import { GithubStar } from '@kong-ui-public/misc-widgets'
import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import NavbarLogo from '@/components/NavbarLogo.vue'
import MakeAWish from '@/components/MakeAWish.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { t } = useI18n()

const sidebarItems = computed<SidebarPrimaryItem[]>(() => {
  const wsName = (route.params.workspace as string) || 'default'
  const isInWorkspace = !!route.params.workspace || route.name === 'workspace-overview'

  return [
    // Workspaces: 企业版逻辑 — 未选 workspace 时只显示 workspace 列表，
    // 选中后在 Workspaces 内部显示 workspace 名 + 实体子菜单
    {
      name: t('workspaces.title'),
      to: { name: 'workspaces' },
      key: 'Workspaces',
      active: route.name === 'workspaces' || route.name === 'workspace-create' || isInWorkspace,
      expanded: isInWorkspace,
      ...(isInWorkspace ? { label: wsName } : {}),
      items: isInWorkspace
        ? [
          // 实体子菜单
          { name: t('overview.resource.intro.title'), to: { name: 'workspace-overview', params: { workspace: wsName } }, active: route.name === 'workspace-overview' },
          { name: t('entities.service.list.title'), to: { name: 'service-list', params: { workspace: wsName } }, active: route.meta?.entity === 'service' },
          { name: t('entities.route.list.title'), to: { name: 'route-list', params: { workspace: wsName } }, active: route.meta?.entity === 'route' },
          { name: t('entities.consumer.list.title'), to: { name: 'consumer-list', params: { workspace: wsName } }, active: route.meta?.entity === 'consumer' },
          { name: t('entities.plugin.list.title'), to: { name: 'plugin-list', params: { workspace: wsName } }, active: route.meta?.entity === 'plugin' },
          { name: t('entities.upstream.list.title'), to: { name: 'upstream-list', params: { workspace: wsName } }, active: route.meta?.entity === 'upstream' },
          { name: t('entities.certificate.list.title'), to: { name: 'certificate-list', params: { workspace: wsName } }, active: route.meta?.entity === 'certificate' },
          { name: t('entities.ca-certificate.list.title'), to: { name: 'ca-certificate-list', params: { workspace: wsName } }, active: route.meta?.entity === 'ca-certificate' },
          { name: t('entities.sni.list.title'), to: { name: 'sni-list', params: { workspace: wsName } }, active: route.meta?.entity === 'sni' },
          { name: t('entities.key.list.title'), to: { name: 'key-list', params: { workspace: wsName } }, active: route.meta?.entity === 'key' },
          { name: t('entities.vault.list.title'), to: { name: 'vault-list', params: { workspace: wsName } }, active: route.meta?.entity === 'vault' },
          { name: t('entities.key-set.list.title'), to: { name: 'key-set-list', params: { workspace: wsName } }, active: route.meta?.entity === 'key-set' },
        ]
        : workspaceStore.workspaces.map(ws => ({
          name: ws.name,
          to: { name: 'workspace-overview', params: { workspace: ws.name } },
        })),
    },

    // About
    {
      name: t('about.title'),
      to: { name: 'about' },
      key: 'About',
      active: route.name === 'about',
    },
  ]
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
