import { createApp } from 'vue'
import { createI18n, Translation } from '@kong-ui-public/i18n'
import english from '@/locales/en.json'
import App from '@/App.vue'
import { router } from '@/router'
import { registerGlobalComponents } from './registerGlobalComponents'
import './styles/index'
import { createPinia } from 'pinia'

// This only sets up worker initializers. They will be lazy-loaded when needed.
import '@/monaco-workers'

const DEFAULT_LOCALE = 'en-US'
const LOCALE_MODULES = [
  'Global', 'Workspaces', 'Overview', 'About', 'Services', 'Routes',
  'Consumers', 'Plugins', 'Upstreams', 'Certificates', 'Vaults', 'Keys', 'Teams', 'RBAC',
]

// 后端模块名 → en.json 中的 key 路径
// 后端语言包是扁平模块结构，en.json 是嵌套结构，需要映射
const LOCALE_KEY_MAP: Record<string, string> = {
  Global: 'global',
  Workspaces: 'workspaces',
  Overview: 'overview',
  About: 'about',
  Services: 'entities.service',
  Routes: 'entities.route',
  Consumers: 'entities.consumer',
  Plugins: 'entities.plugin',
  Upstreams: 'entities.upstream',
  Certificates: 'entities.certificate',
  Vaults: 'entities.vault',
  Keys: 'entities.key',
  Teams: 'teams',
  RBAC: 'entities.rbac',
}

const savedLocale = localStorage.getItem('kong-manager-locale') || DEFAULT_LOCALE

// Merge fetched locale messages with built-in English fallback
function mergeMessages(fetched: Record<string, any>, fallback: Record<string, any>): Record<string, any> {
  const merged = { ...fallback }
  for (const key of Object.keys(fetched)) {
    if (typeof fetched[key] === 'object' && !Array.isArray(fetched[key])) {
      merged[key] = mergeMessages(fetched[key], merged[key] || {})
    } else {
      merged[key] = fetched[key]
    }
  }
  return merged
}

// 将值按 dot path 设置到对象上（如 "entities.service" → obj.entities.service）
function setNestedValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

async function fetchLocaleMessages(lang: string): Promise<Record<string, any>> {
  const messages: Record<string, any> = {}
  // 语言包直接从 Kong Admin API 获取，不走 Vite 代理
  const baseUrl = window.K_CONFIG?.ADMIN_API_URL
    || `${window.location.protocol}//${window.location.hostname}:${window.K_CONFIG?.ADMIN_API_PORT || 8001}`
  for (const mod of LOCALE_MODULES) {
    try {
      const resp = await fetch(`${baseUrl}/locales/${lang}/${mod}.json`)
      if (resp.ok) {
        const data = await resp.json()
        // 用映射后的 key 路径存储，与 en.json 嵌套结构对齐
        const keyPath = LOCALE_KEY_MAP[mod] || mod.charAt(0).toLowerCase() + mod.slice(1)
        setNestedValue(messages, keyPath, data)
      }
    } catch {
      // fallback to empty, will use built-in English
    }
  }
  return messages
}

// Boot the app
async function boot() {
  let messages = english as Record<string, any>

  // Try loading locale from backend API
  if (savedLocale !== DEFAULT_LOCALE) {
    try {
      const fetched = await fetchLocaleMessages(savedLocale)
      if (Object.keys(fetched).length > 0) {
        messages = mergeMessages(fetched, english)
      }
    } catch {
      // fallback to built-in English
    }
  }

  const i18n = createI18n(savedLocale.toLowerCase() as 'en-us', messages, { isGlobal: true })

  const app = createApp(App)
  const pinia = createPinia()

  // 全局错误处理：防止未捕获异常导致页面崩溃白屏
  app.config.errorHandler = (err, instance, info) => {
    console.error('[Kong Manager] Unhandled Vue error:', err)
    console.error('[Kong Manager] Component:', instance?.$options?.name || 'Unknown')
    console.error('[Kong Manager] Info:', info)
  }

  // 全局未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Kong Manager] Unhandled promise rejection:', event.reason)
    event.preventDefault()
  })

  app.use(Translation.install, { i18n })
  app.use(pinia)
  app.use(router)
  registerGlobalComponents(app)
  app.mount('#app')
}

boot()
