<template>
  <PageHeader :title="t('workspaces.list.title')">
    <KButton
      appearance="primary"
      size="medium"
      @click="router.push({ name: 'workspace-create' })"
    >
      {{ t('workspaces.list.new') }}
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
    :title="t('workspaces.detail.summary.title')"
  >
    <div class="summary-view">
      <div class="summary-view-metrics">
        <div
          data-testid="Services"
          class="summary-view-metric"
        >
          <div class="metric-title">
            <div class="metric-title-text">
              {{ t('workspaces.detail.summary.services') }}
            </div>
            <KTooltip
              :text="t('workspaces.detail.summary.tooltip.services_global')"
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
              {{ t('workspaces.detail.summary.routes') }}
            </div>
            <KTooltip
              :text="t('workspaces.detail.summary.tooltip.routes_global')"
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
              {{ t('workspaces.detail.summary.consumers') }}
            </div>
            <KTooltip
              :text="t('workspaces.detail.summary.tooltip.consumers_global')"
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
              {{ t('workspaces.detail.summary.plugins') }}
            </div>
            <KTooltip
              :text="t('workspaces.detail.summary.tooltip.plugins_global')"
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
              {{ t('workspaces.detail.summary.api_requests') }}
            </div>
            <KTooltip
              :text="t('workspaces.detail.summary.tooltip.api_requests')"
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

  <KCard class="table-card">
    <KTableData
      :fetcher="fetcher"
      :headers="headers"
      :search-input="debouncedSearchQuery"
      :fetcher-cache-key="fetcherCacheKey"
      :client-sort="true"
      :sort-handler-function="sortHandler"
      @row:click="onRowClick"
    >
      <template #toolbar>
        <KInput
          v-model="searchQuery"
          class="workspace-filter"
          :placeholder="t('workspaces.list.filter')"
          type="search"
        />
      </template>
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
  </KCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { KTableData, KInput, KButton, KCard, KTooltip } from '@kong/kongponents'
import { InfoIcon } from '@kong/icons'
import { debounce } from 'lodash-es'

import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import PageHeader from '@/components/PageHeader.vue'
import SupportText from '@/components/SupportText.vue'



defineOptions({ name: 'WorkspaceList' })

const router = useRouter()
const { t } = useI18n() as any
const workspaceStore = useWorkspaceStore()

const searchQuery = ref('')
const debouncedSearchQuery = ref('')

// 防抖：输入停止 300ms 后才更新过滤词
watch(searchQuery, debounce((val: string) => {
  debouncedSearchQuery.value = val
}, 300))

const headers = computed(() => [
  { key: 'name', label: t('workspaces.list.headers.name'), sortable: true },
  { key: 'comment', label: t('workspaces.list.headers.comment') },
  { key: 'services', label: t('workspaces.list.headers.services') },
  { key: 'consumers', label: t('workspaces.list.headers.consumers') },
  { key: 'routes', label: t('workspaces.list.headers.routes') },
  { key: 'created_at', label: t('workspaces.list.headers.created_at'), sortable: true },
  { key: 'updated_at', label: t('workspaces.list.headers.updated_at'), sortable: true },
])

// fetcherCacheKey 变化时强制重新请求
const fetcherCacheKey = computed(() => `workspaces-${debouncedSearchQuery.value}`)

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

.table-card {
  margin-bottom: 24px;
}
</style>
