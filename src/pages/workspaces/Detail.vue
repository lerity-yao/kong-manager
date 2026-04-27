<template>
  <PageHeader :title="t('workspaces.detail.title', { name })" />
  <div class="workspace-detail">
    <KTabs :tabs="tabs">
      <template #overview>
        <div class="workspace-overview">
          <!-- Summary 指标卡片 -->
          <KCard
            class="summary-card"
            title="Summary"
          >
            <div class="summary-view">
              <div class="summary-view-metrics">
                <div
                  data-testid="Services"
                  class="summary-view-metric"
                >
                  <div class="metric-title">
                    <div class="metric-title-text">
                      Services
                    </div>
                    <KTooltip
                      text="The total number of Gateway Services configured in this workspace."
                      placement="top"
                      :max-width="240"
                    >
                      <InfoIcon
                        :size="16"
                        color="var(--kui-color-text-neutral, #6c7489)"
                        class="info-icon"
                      />
                    </KTooltip>
                  </div>
                  <div class="metric-value">
                    <div class="metric-value-text">
                      {{ workspaceCounters.services }}
                    </div>
                  </div>
                </div>
                <div
                  data-testid="Routes"
                  class="summary-view-metric"
                >
                  <div class="metric-title">
                    <div class="metric-title-text">
                      Routes
                    </div>
                    <KTooltip
                      text="The total number of Routes configured in this workspace."
                      placement="top"
                      :max-width="240"
                    >
                      <InfoIcon
                        :size="16"
                        color="var(--kui-color-text-neutral, #6c7489)"
                        class="info-icon"
                      />
                    </KTooltip>
                  </div>
                  <div class="metric-value">
                    <div class="metric-value-text">
                      {{ workspaceCounters.routes }}
                    </div>
                  </div>
                </div>
                <div
                  data-testid="Consumers"
                  class="summary-view-metric"
                >
                  <div class="metric-title">
                    <div class="metric-title-text">
                      Consumers
                    </div>
                    <KTooltip
                      text="The total number of Consumers configured in this workspace."
                      placement="top"
                      :max-width="240"
                    >
                      <InfoIcon
                        :size="16"
                        color="var(--kui-color-text-neutral, #6c7489)"
                        class="info-icon"
                      />
                    </KTooltip>
                  </div>
                  <div class="metric-value">
                    <div class="metric-value-text">
                      {{ workspaceCounters.consumers }}
                    </div>
                  </div>
                </div>
                <div
                  data-testid="Plugins"
                  class="summary-view-metric"
                >
                  <div class="metric-title">
                    <div class="metric-title-text">
                      Plugins
                    </div>
                    <KTooltip
                      text="The total number of unique Plugin configurations in this workspace."
                      placement="top"
                      :max-width="240"
                    >
                      <InfoIcon
                        :size="16"
                        color="var(--kui-color-text-neutral, #6c7489)"
                        class="info-icon"
                      />
                    </KTooltip>
                  </div>
                  <div class="metric-value">
                    <div class="metric-value-text">
                      {{ workspaceCounters.plugins }}
                    </div>
                  </div>
                </div>
                <div
                  data-testid="API Requests"
                  class="summary-view-metric not-available"
                >
                  <div class="metric-title">
                    <div class="metric-title-text">
                      API Requests
                    </div>
                    <KTooltip
                      text="The total number of API requests proxied by the Kong node. (Enterprise only)"
                      placement="top"
                      :max-width="240"
                    >
                      <InfoIcon
                        :size="16"
                        color="var(--kui-color-text-neutral, #6c7489)"
                        class="info-icon"
                      />
                    </KTooltip>
                  </div>
                  <div class="metric-value">
                    <div class="metric-value-text">
                      --
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </KCard>

          <!-- Workspace 基本信息卡片 -->
          <KCard
            class="info-card"
            title="Workspace Information"
          >
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
import { KTabs, KCard, KTooltip } from '@kong/kongponents'
import { InfoIcon } from '@kong/icons'
import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'WorkspaceDetail' })

const route = useRoute()
const { t } = useI18n() as any
const workspaceStore = useWorkspaceStore()

const name = computed(() => route.params.workspace as string)

const workspace = computed(() => workspaceStore.currentWorkspace)

// 当前 workspace 的 counters
const workspaceCounters = computed(() => {
  return workspace.value?.counters ?? { services: 0, routes: 0, consumers: 0, plugins: 0 }
})

const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#entities', title: 'Entities' },
]

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

onMounted(async () => {
  // 带 counter 参数获取数据，以便 Summary 卡片显示计数
  await workspaceStore.fetchWorkspaces(true)
  workspaceStore.setCurrentWorkspaceByName(name.value)
})
</script>

<style scoped lang="scss">
.summary-card {
  margin-bottom: 24px;
}

.summary-view-metrics {
  display: flex;
  align-items: stretch;
}

.summary-view-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  padding: 0 24px;
  border-right: 1px solid var(--kui-color-border, #e0e0e0);

  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
    border-right: none;
  }
}

.metric-title {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-title-text {
  font-size: var(--kui-font-size-30, 13px);
  line-height: var(--kui-line-height-30, 20px);
  font-weight: var(--kui-font-weight-semibold, 600);
  color: var(--kui-color-text, #000);
}

.info-icon {
  cursor: pointer;
  color: var(--kui-color-text-neutral, #6c7489);
}

.metric-value-text {
  font-size: 22px;
  font-weight: 600;
  color: var(--kui-color-text, #000);
}

.not-available .metric-value-text {
  color: var(--kui-color-text-disabled, #6c7a89);
}

.info-card {
  margin-bottom: 24px;
}

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
