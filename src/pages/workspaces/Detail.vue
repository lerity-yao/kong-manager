<template>
  <PageHeader :title="t('workspaces.detail.title', { name })" />
  <div class="workspace-detail">
    <KTabs :tabs="tabs">
      <template #overview>
        <div class="workspace-overview">
          <KCard>
            <template #body>
              <dl class="info-grid">
                <dt>ID</dt>
                <dd>{{ workspace?.id }}</dd>
                <dt>Name</dt>
                <dd>{{ workspace?.name }}</dd>
                <dt>Comment</dt>
                <dd>{{ workspace?.comment || '-' }}</dd>
                <dt>Created</dt>
                <dd>{{ formatDate(workspace?.created_at) }}</dd>
              </dl>
            </template>
          </KCard>
        </div>
      </template>
      <template #entities>
        <p class="entity-hint">
          Workspace entities are accessible via the sidebar menu when this workspace is selected.
        </p>
      </template>
    </KTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { KTabs, KCard } from '@kong/kongponents'
import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'WorkspaceDetail' })

const route = useRoute()
const { t } = useI18n() as any
const workspaceStore = useWorkspaceStore()

const name = computed(() => route.params.workspace as string)

const workspace = computed(() => workspaceStore.currentWorkspace)

const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#entities', title: 'Entities' },
]

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

onMounted(async () => {
  await workspaceStore.fetchWorkspaces()
  workspaceStore.setCurrentWorkspaceByName(name.value)
})
</script>

<style scoped lang="scss">
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 16px;

  dt {
    font-weight: 600;
    color: var(--kui-color-text-disabled, #6c7a89);
  }
}
.entity-hint {
  color: var(--kui-color-text-disabled, #6c7a89);
  padding: 24px;
}
</style>
