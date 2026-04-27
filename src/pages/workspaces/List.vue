<template>
  <PageHeader :title="t('workspaces.list.title')">
    <KButton
      appearance="primary"
      size="medium"
      @click="router.push({ name: 'workspace-create' })"
    >
      New Workspace
    </KButton>
    <template #below-title>
      <SupportText>
        {{ t('workspaces.list.empty.message') }}
      </SupportText>
    </template>
  </PageHeader>

  <!-- Summary 指标卡片 - 对齐企业版水平布局 -->
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
              text="The total number of Gateway Services configured in the Kong node."
              placement="top"
              :max-width="240"
            >
              <InfoIcon
                :size="16"
                color="rgba(175, 183, 197, 0.5)"
                class="info-icon"
              />
            </KTooltip>
          </div>
          <div class="metric-value">
            <div class="metric-value-text">
              {{ totalCounters.services }}
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
              text="The total number of Routes configured in the Kong node."
              placement="top"
              :max-width="240"
            >
              <InfoIcon
                :size="16"
                color="rgba(175, 183, 197, 0.5)"
                class="info-icon"
              />
            </KTooltip>
          </div>
          <div class="metric-value">
            <div class="metric-value-text">
              {{ totalCounters.routes }}
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
              text="The total number of Consumers configured in the Kong node."
              placement="top"
              :max-width="240"
            >
              <InfoIcon
                :size="16"
                color="rgba(175, 183, 197, 0.5)"
                class="info-icon"
              />
            </KTooltip>
          </div>
          <div class="metric-value">
            <div class="metric-value-text">
              {{ totalCounters.consumers }}
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
              text="The total number of unique Plugin configurations in the Kong node."
              placement="top"
              :max-width="240"
            >
              <InfoIcon
                :size="16"
                color="rgba(175, 183, 197, 0.5)"
                class="info-icon"
              />
            </KTooltip>
          </div>
          <div class="metric-value">
            <div class="metric-value-text">
              {{ totalCounters.plugins }}
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
                color="rgba(175, 183, 197, 0.5)"
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

  <div class="workspace-list">
    <div class="list-toolbar">
      <KInput
        v-model="searchQuery"
        class="workspace-filter"
        placeholder="Filter Workspaces"
        type="search"
      />
    </div>
    <KTableData
      :fetcher="fetcher"
      :headers="headers"
      :search-input="searchQuery"
      :fetcher-cache-key="fetcherCacheKey"
      :client-sort="true"
      :sort-handler-function="sortHandler"
      :hide-toolbar="true"
      @row:click="onRowClick"
    >
      <template #name="{ rowValue }">
        <div class="workspace-name-cell">
          <div class="workspace-avatar">
            {{ rowValue.charAt(0).toUpperCase() }}
          </div>
          <router-link
            :to="{ name: 'workspace-overview', params: { workspace: rowValue } }"
            class="workspace-link"
          >
            {{ rowValue }}
          </router-link>
        </div>
      </template>
      <template #services="{ rowValue }">
        {{ rowValue ?? 0 }}
      </template>
      <template #consumers="{ rowValue }">
        {{ rowValue ?? 0 }}
      </template>
      <template #routes="{ rowValue }">
        {{ rowValue ?? 0 }}
      </template>
      <template #created_at="{ rowValue }">
        {{ formatTime(rowValue) }}
      </template>
      <template #updated_at="{ rowValue }">
        {{ formatTime(rowValue) }}
      </template>
    </KTableData>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KTableData, KInput, KButton, KCard, KTooltip } from '@kong/kongponents'
import { InfoIcon } from '@kong/icons'

import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import PageHeader from '@/components/PageHeader.vue'
import SupportText from '@/components/SupportText.vue'



defineOptions({ name: 'WorkspaceList' })

const router = useRouter()
const { t } = useI18n() as any
const workspaceStore = useWorkspaceStore()

const searchQuery = ref('')

const headers = [
  { key: 'name', label: 'Workspace Name', sortable: true },
  { key: 'comment', label: 'Comment' },
  { key: 'services', label: 'Gateway Services' },
  { key: 'consumers', label: 'Consumers' },
  { key: 'routes', label: 'Routes' },
  { key: 'created_at', label: 'Created At', sortable: true },
  { key: 'updated_at', label: 'Updated At', sortable: true },
]

// fetcherCacheKey 变化时强制重新请求
const fetcherCacheKey = computed(() => `workspaces-${searchQuery.value}`)

// 合计所有 workspace 的 counters
const totalCounters = computed(() => {
  const totals: Record<string, number> = { services: 0, routes: 0, consumers: 0, plugins: 0 }
  for (const ws of workspaceStore.workspaces) {
    if (ws.counters) {
      totals.services += ws.counters.services ?? 0
      totals.routes += ws.counters.routes ?? 0
      totals.consumers += ws.counters.consumers ?? 0
      totals.plugins += ws.counters.plugins ?? 0
    }
  }
  return totals
})

const fetcher = async (params: any) => {
  await workspaceStore.fetchWorkspaces(true)
  let data = workspaceStore.workspaces.map(ws => ({
    name: ws.name,
    comment: ws.comment ?? '',
    services: ws.counters?.services ?? 0,
    consumers: ws.counters?.consumers ?? 0,
    routes: ws.counters?.routes ?? 0,
    created_at: ws.created_at ?? 0,
    updated_at: ws.updated_at ?? 0,
    _raw: ws,
  }))

  // 前端搜索过滤 - KTableData 通过 searchInput prop 将搜索词传入 params.query
  const q = (params.query || '').toLowerCase().trim()
  if (q) {
    data = data.filter((row: any) => row.name.toLowerCase().includes(q))
  }

  return {
    data,
    total: data.length,
  }
}

const sortHandler = ({ key, sortColumnOrder, data }: any) => {
  if (key === 'name') {
    return data.sort((a: any, b: any) => {
      const mod = sortColumnOrder === 'desc' ? -1 : 1
      return a.name.localeCompare(b.name) * mod
    })
  }
  if (key === 'created_at' || key === 'updated_at') {
    return data.sort((a: any, b: any) => {
      const mod = sortColumnOrder === 'desc' ? -1 : 1
      return ((a[key] ?? 0) - (b[key] ?? 0)) * mod
    })
  }
  return data
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  // Kong 返回的是秒级时间戳，转成北京时间（UTC+8）
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
}

const onRowClick = (_e: PointerEvent, row: any) => {
  const ws = row._raw || row
  router.push({ name: 'workspace-overview', params: { workspace: ws.name } })
}
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
  font-size: 13px;
  font-weight: 600;
  color: var(--kui-color-text-disabled, #6c7a89);
}

.info-icon {
  cursor: pointer;
}

.metric-value-text {
  font-size: 22px;
  font-weight: 600;
  color: var(--kui-color-text, #000);
}

.not-available .metric-value-text {
  color: var(--kui-color-text-disabled, #6c7a89);
}

.workspace-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspace-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--kui-color-primary, #1155cb);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.workspace-link {
  color: var(--kui-color-primary, #1155cb);
  text-decoration: none;
}
.workspace-link:hover {
  text-decoration: underline;
}

.workspace-filter {
  min-width: 240px;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
