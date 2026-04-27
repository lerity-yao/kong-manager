export type GatewayEdition = 'enterprise' | 'community'

const getConfig = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'object' || !window.K_CONFIG) {
    return defaultValue
  }

  const value = window.K_CONFIG[key]
  if (value === '' || value == null) {
    return defaultValue
  }

  try {
    // Properly handle booleans, numbers, arrays, and objects
    return JSON.parse(value)
  } catch (_) {
    // Value must have be a string or empty
    return value as T
  }
}

export const config = {

  get ADMIN_GUI_PATH() {
    return getConfig<string>('ADMIN_GUI_PATH', '/')
  },

  get ADMIN_API_PORT() {
    return getConfig<number>('ADMIN_API_PORT', 8001)
  },

  get ADMIN_API_SSL_PORT() {
    return getConfig<number>('ADMIN_API_SSL_PORT', 8444)
  },

  get ADMIN_API_URL() {
    const ADMIN_API_URL = getConfig<string | null>('ADMIN_API_URL', null)
    if (ADMIN_API_URL) {
      // 绝对 URL (http://, https://, 协议相对 //)
      if (/^(https?:)?\/\//.test(ADMIN_API_URL)) {
        return ADMIN_API_URL
      }
      // 路径相对 URL (/api, /v1/api) → 拼接为完整绝对 URL
      // 避免 entities-shared 的 URL 构建器将 /api 当作路径再次拼接 origin
      if (ADMIN_API_URL.startsWith('/')) {
        return `${window.location.origin}${ADMIN_API_URL}`
      }
      // 主机名 (admin.example.com)
      return `${window.location.protocol}//${ADMIN_API_URL}`
    }

    const port = window.location.protocol.toLowerCase() === 'https:'
      ? config.ADMIN_API_SSL_PORT
      : config.ADMIN_API_PORT

    return `${window.location.protocol}//${window.location.hostname}:${port}`
  },

  get ANONYMOUS_REPORTS() {
    return getConfig('ANONYMOUS_REPORTS', false)
  },
}
