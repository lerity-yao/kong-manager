import type { App } from 'vue'
import axios from 'axios'
import Kongponents from '@kong/kongponents'
import { FORMS_API_KEY, VueFormGenerator } from '@kong-ui-public/forms'
import PageHeader from '@/components/PageHeader.vue'
import HeaderBackButton from '@/components/HeaderBackButton.vue'
import HeaderEditButton from '@/components/HeaderEditButton.vue'
import SupportText from '@/components/SupportText.vue'
import { apiService } from './services/apiService'
import { config } from 'config'

export const registerGlobalComponents = (app: App) => {
  app.use(Kongponents)
  app.component('VueFormGenerator', VueFormGenerator)
  // Provide axios instance for @kong-ui-public/entities-shared
  // Without this, useAxios() falls back to axios.create() with no baseURL,
  // causing API requests to hit Vite SPA fallback and return index.html
  app.provide('get-axios-instance', (_opts?: Record<string, unknown>) => {
    return axios.create({
      baseURL: config.ADMIN_API_URL,
      withCredentials: true,
      timeout: 30000,
    })
  })

  app.provide(FORMS_API_KEY, {
    getOne: (entity: string, id: string) => {
      return apiService.findRecord(entity, id)
    },
    getAll: (entity: string, params: Record<string, string | number>) => {
      return apiService.findAll(entity, { params })
    },
  })
  app.component('PageHeader', PageHeader)
  app.component('HeaderBackButton', HeaderBackButton)
  app.component('HeaderEditButton', HeaderEditButton)
  app.component('SupportText', SupportText)
}
