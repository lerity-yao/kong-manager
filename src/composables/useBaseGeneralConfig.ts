import { reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { config } from 'config'
import { useInfoStore } from '@/stores/info'
import type { KongManagerConfig } from '@kong-ui-public/entities-shared'

export const useBaseGeneralConfig = () => {
  const infoStore = useInfoStore()
  const route = useRoute()

  // OSS 后端不支持 workspace 前缀 API 路径（/default/plugins → 404），
  // 企业版支持（/default/plugins → 200）。
  // 前端路由统一用 /:workspace/:entity 格式，API 路径按版本区分。
  const workspaceForApi = computed(() => {
    const wsFromRoute = (route.params.workspace as string) || ''
    return infoStore.kongEdition === 'enterprise' ? wsFromRoute : ''
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
