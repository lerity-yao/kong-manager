import { useAuthStore } from '@/stores/auth'

/**
 * Composable that provides permission-checked canCreate/canDelete/canEdit/canRetrieve
 * functions for entity list pages. These async functions are compatible with
 * @kong-ui-public entity list components' can-create/can-delete/can-edit/can-retrieve props.
 *
 * @param endpoint - The RBAC endpoint prefix, e.g. '/services', '/routes', '/consumers'
 */
export function useEntityPermissions(endpoint: string) {
  const authStore = useAuthStore()

  const canCreate = async () => authStore.hasPermissionGuarded('create', `${endpoint}/*`)
  const canDelete = async () => authStore.hasPermissionGuarded('delete', `${endpoint}/*`)
  const canEdit = async () => authStore.hasPermissionGuarded('update', `${endpoint}/*`)
  const canRetrieve = async () => authStore.hasPermissionGuarded('read', `${endpoint}/*`)

  return {
    canCreate,
    canDelete,
    canEdit,
    canRetrieve,
  }
}
