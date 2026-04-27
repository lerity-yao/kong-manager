import { reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { config } from 'config'
import { useInfoStore } from '@/stores/info'
import type { KongManagerConfig } from '@kong-ui-public/entities-shared'

export const useBaseGeneralConfig = () => {
  const infoStore = useInfoStore()
  const route = useRoute()

  // 二期：后端已实现 /workspaces/:workspace_name/:entity 路由
  // entities-shared 库将 /{workspace}/services 替换为 /${config.workspace}/services
  // 所以 workspace 值需要是 "workspaces/default" 才能生成 /workspaces/default/services
  const workspaceForApi = computed(() => {
    const wsFromRoute = (route.params.workspace as string) || ''
    // OSS 二开: workspace="workspaces/default" → /workspaces/default/services
    // 企业版: workspace="default" → /default/services (企业版路由格式)
    return infoStore.kongEdition === 'enterprise' ? wsFromRoute : (wsFromRoute ? `workspaces/${wsFromRoute}` : '')
  })

  return reactive({
    app: 'kongManager' as const,
    workspace: workspaceForApi,
    gatewayInfo: {
      edition: infoStore.kongEdition,
      version: infoStore.kongVersion,
    },
    apiBaseUrl: config.ADMIN_API_URL,
  }) as KongManagerConfig
}
