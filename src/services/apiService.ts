import {
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios'
import axios from 'axios'
import { config } from 'config'
import { useToaster } from '@/composables/useToaster'

const adminApiUrl = config.ADMIN_API_URL

// Track 401 redirect to avoid infinite loop
let isRedirectingToLogin = false

class ApiService {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: adminApiUrl,
      withCredentials: true,
      timeout: 30000,
    })

    // Global 401 response interceptor: clear auth state and redirect to login
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !isRedirectingToLogin) {
          // Skip redirect for auth endpoints (login/me failures are expected)
          const url = error.config?.url || ''
          const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me') || url.includes('/auth/token')
          if (!isAuthEndpoint) {
            isRedirectingToLogin = true
            // Import dynamically to avoid circular dependency at module init time
            import('@/stores/auth').then(({ useAuthStore }) => {
              const authStore = useAuthStore()
              authStore.currentUser = null
            }).finally(() => {
              // Use window.location for a hard redirect to ensure clean state
              const loginPath = `${config.ADMIN_GUI_PATH}login`
              if (window.location.pathname !== `${config.ADMIN_GUI_PATH}login`) {
                window.location.href = loginPath
              }
              // Reset flag after navigation
              setTimeout(() => {
                isRedirectingToLogin = false
              }, 1000)
            })
          }
        }

        // Handle 403 Forbidden: refresh permissions and redirect to home
        if (error.response?.status === 403) {
          const toaster = useToaster()
          toaster.open({
            appearance: 'danger',
            message: 'Permission denied: You do not have access to this resource',
          })
          // Refresh user permissions from DB before redirecting
          import('@/stores/auth').then(({ useAuthStore }) => {
            const authStore = useAuthStore()
            return authStore.fetchCurrentUser()
          }).finally(() => {
            // Redirect to workspaces home page after a short delay
            setTimeout(() => {
              const homePath = `${config.ADMIN_GUI_PATH}workspaces`
              if (window.location.pathname !== homePath) {
                window.location.href = homePath
              }
            }, 1500)
          })
        }
        return Promise.reject(error)
      },
    )
  }

  getInfo() {
    return this.instance.get(`${adminApiUrl}`)
  }

  // entity-specific methods
  findAll<T>(entity: string, params: Record<string, unknown>) {
    return this.instance.get<T>(`${adminApiUrl}/${entity}`, { params })
  }

  findRecord<T>(entity: string, id: string) {
    return this.instance.get<T>(`${adminApiUrl}/${entity}/${id}`)
  }

  createRecord(entity: string, data: Record<string, unknown>) {
    return this.instance.post(`${adminApiUrl}/${entity}`, data)
  }

  updateRecord(entity: string, id: string, data: Record<string, unknown>) {
    return this.instance.patch(`${adminApiUrl}/${entity}/${id}`, data)
  }

  deleteRecord(entity: string, id: string) {
    return this.instance.delete(`${adminApiUrl}/${entity}/${id}`)
  }

  // generic methods
  get<T>(url = '', config: AxiosRequestConfig = {}) {
    return this.instance.get<T>(`${adminApiUrl}/${url}`, config)
  }

  post(url = '', data?: Record<string, unknown>, config: AxiosRequestConfig = {}) {
    return this.instance.post(`${adminApiUrl}/${url}`, data, config)
  }

  put(url = '', data?: Record<string, unknown>, config: AxiosRequestConfig = {}) {
    return this.instance.put(`${adminApiUrl}/${url}`, data, config)
  }

  patch(url = '', data?: Record<string, unknown>, config: AxiosRequestConfig = {}) {
    return this.instance.patch(`${adminApiUrl}/${url}`, data, config)
  }

  delete(url = '', config: AxiosRequestConfig = {}) {
    return this.instance.delete(`${adminApiUrl}/${url}`, config)
  }
}

export const apiService = new ApiService()
