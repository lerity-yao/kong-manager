import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 获取当前 URL 中的 workspace 参数
 * 路由格式: /:workspace/:entity (如 /default/services)
 */
export const useCurrentWorkspace = () => {
  const route = useRoute()

  const workspace = computed(() => (route.params.workspace as string) || 'default')

  return { workspace }
}
