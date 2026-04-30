import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService'

export interface Role {
  id: string
  name: string
  comment?: string
}

export interface AuthUser {
  id: string
  username: string
  email?: string
  roles: Role[]
}

export interface EndpointPermission {
  endpoint: string
  actions: string[]
  negative: boolean
  workspace: string
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null)
  const isLoggedIn = computed(() => !!currentUser.value)
  const isSuperAdmin = computed(() =>
    currentUser.value?.roles?.some(r => r.name === 'super-admin'),
  )
  const userRoles = computed(() => currentUser.value?.roles?.map(r => r.name) || [])

  // Cached endpoint permissions from /auth/permissions
  const endpointPermissions = ref<EndpointPermission[]>([])
  const userType = ref<string>('')

  // RBAC permission check using real endpoint permissions
  // Mirrors the backend logic in api_helpers.lua
  function hasPermission(action: string, endpoint: string): boolean {
    if (!currentUser.value) return false
    if (isSuperAdmin.value) return true
    // Admin users (session login) have unrestricted access
    if (userType.value === 'admin') return true

    // Check using cached endpoint permissions
    let hasPositive = false
    let hasNegative = false

    for (const ep of endpointPermissions.value) {
      // Check workspace: '*' matches all
      if (ep.workspace !== '*') continue

      // Convert endpoint pattern to regex (mirrors backend logic)
      const patterns = endpointToPatterns(ep.endpoint)

      // Check if the requested endpoint matches any pattern
      let matched = false
      for (const pat of patterns) {
        if (new RegExp(pat).test(endpoint)) {
          matched = true
          break
        }
      }

      if (matched) {
        // Check if action is allowed
        const actionMatch = ep.actions.includes('*') || ep.actions.includes(action)
        if (actionMatch) {
          if (ep.negative) {
            hasNegative = true
          } else {
            hasPositive = true
          }
        }
      }
    }

    // Negative rules take precedence
    if (hasNegative) return false
    return hasPositive
  }

  // Convert endpoint pattern to regex patterns (mirrors backend api_helpers.lua)
  function endpointToPatterns(endpoint: string): string[] {
    if (endpoint === '*') {
      return ['.*']
    }
    if (endpoint.endsWith('/*')) {
      // Trailing /*: matches base path AND base path with sub-paths
      const base = endpoint.slice(0, -2).replace(/\*/g, '[^/]+')
      return [
        `^${base}$`,       // matches base path itself (e.g. /services)
        `^${base}/.*$`,    // matches sub-paths (e.g. /services/abc)
      ]
    }
    // Middle *: matches single path segment
    return [`^${endpoint.replace(/\*/g, '[^/]+')}$`]
  }

  // Convenience: check if user can create/update/delete for a given endpoint
  const canCreate = computed(() => hasPermission('create', '/*'))
  const canEdit = computed(() => hasPermission('update', '/*'))
  const canDelete = computed(() => hasPermission('delete', '/*'))

  // Check if RBAC is enabled (enforce_rbac is on)
  // When RBAC is off, everyone has access
  const rbacEnabled = ref(false)

  function hasPermissionGuarded(action: string, endpoint: string): boolean {
    if (!rbacEnabled.value) return true
    return hasPermission(action, endpoint)
  }

  async function login(username: string, password: string) {
    const { data } = await apiService.post('auth/login', { username, password })
    currentUser.value = data as AuthUser
    // Fetch permissions after login
    await fetchPermissions()
    return data
  }

  async function loginWithToken(name: string, user_token: string) {
    const { data } = await apiService.post('auth/token', { name, user_token })
    currentUser.value = data as AuthUser
    // Fetch permissions after login
    await fetchPermissions()
    return data
  }

  async function logout() {
    try {
      await apiService.post('auth/logout')
    } finally {
      currentUser.value = null
      endpointPermissions.value = []
      userType.value = ''
    }
  }

  async function fetchCurrentUser() {
    try {
      const { data } = await apiService.get<AuthUser>('auth/me')
      currentUser.value = data
      // Also fetch permissions
      await fetchPermissions()
      return data
    } catch {
      currentUser.value = null
      endpointPermissions.value = []
      userType.value = ''
      return null
    }
  }

  async function fetchPermissions() {
    try {
      const { data } = await apiService.get<{ user_type: string; endpoints: EndpointPermission[] }>('auth/permissions')
      userType.value = data.user_type
      endpointPermissions.value = data.endpoints || []
    } catch {
      // If we can't fetch permissions, assume no access
      endpointPermissions.value = []
    }
  }

  return {
    currentUser,
    isLoggedIn,
    isSuperAdmin,
    userRoles,
    hasPermission,
    hasPermissionGuarded,
    canCreate,
    canEdit,
    canDelete,
    rbacEnabled,
    login,
    loginWithToken,
    logout,
    fetchCurrentUser,
    endpointPermissions,
    userType,
  }
})
