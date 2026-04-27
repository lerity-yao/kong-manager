import {
  createRouter, createWebHistory, type RouteRecordRaw,
} from 'vue-router'

import { config } from 'config'
import { useInfoStore } from './stores/info'

const routes: RouteRecordRaw[] = [
  // Redirect root to default workspace
  {
    path: '/',
    redirect: '/default',
  },

  // Workspace management pages (outside workspace context)
  {
    name: 'workspaces',
    path: '/workspaces',
    component: () => import('@/pages/workspaces/List.vue'),
    meta: {
      title: 'Workspaces',
    },
  },
  {
    name: 'workspace-create',
    path: '/workspaces/create',
    component: () => import('@/pages/workspaces/Create.vue'),
    meta: {
      title: 'Create Workspace',
    },
  },

  // About page (gateway info) - MUST be before /:workspace to avoid route conflict
  {
    name: 'about',
    path: '/about',
    component: () => import('@/pages/overview/Overview.vue'),
    meta: {
      title: 'About',
    },
  },

  // Workspace overview (workspace statistics)
  {
    name: 'workspace-overview',
    path: '/:workspace',
    component: () => import('@/pages/workspaces/Detail.vue'),
    meta: {
      title: 'Workspace Overview',
    },
  },

  // service pages
  {
    name: 'service-list',
    path: '/:workspace/services',
    component: () => import('@/pages/services/List.vue'),
    meta: {
      entity: 'service',
      title: 'Gateway Services',
    },
  },
  {
    name: 'service-create',
    path: '/:workspace/services/create',
    component: () => import('@/pages/services/Form.vue'),
    meta: {
      entity: 'service',
      title: 'Create Gateway Service',
    },
  },
  {
    name: 'service-edit',
    path: '/:workspace/services/:id/edit',
    component: () => import('@/pages/services/Form.vue'),
    meta: {
      entity: 'service',
      title: 'Edit Gateway Service',
    },
  },
  {
    name: 'service-detail',
    path: '/:workspace/services/:id',
    component: () => import('@/pages/services/Detail.vue'),
    meta: {
      entity: 'service',
      title: 'View Gateway Service',
    },
    children: [
      {
        name: 'service-detail-routes',
        path: 'routes',
        component: () => import('@/pages/routes/List.vue'),
        meta: {
          entity: 'service',
          title: 'Gateway Service Routes',
        },
      },
      {
        name: 'service-detail-plugins',
        path: 'plugins',
        component: () => import('@/pages/plugins/List.vue'),
        meta: {
          entity: 'service',
          scopedIn: 'services',
          title: 'Gateway Service Plugins',
        },
      },
    ],
  },

  // route pages
  {
    name: 'route-list',
    path: '/:workspace/routes',
    component: () => import('@/pages/routes/List.vue'),
    meta: {
      entity: 'route',
      title: 'Routes',
    },
  },
  {
    name: 'route-create',
    path: '/:workspace/routes/create',
    component: () => import('@/pages/routes/Form.vue'),
    meta: {
      entity: 'route',
      title: 'Create Route',
    },
  },
  {
    name: 'route-edit',
    path: '/:workspace/routes/:id/edit',
    component: () => import('@/pages/routes/Form.vue'),
    meta: {
      entity: 'route',
      title: 'Edit Route',
    },
  },
  {
    name: 'route-detail',
    path: '/:workspace/routes/:id',
    component: () => import('@/pages/routes/Detail.vue'),
    meta: {
      entity: 'route',
      title: 'View Route',
    },
    children: [
      {
        name: 'route-detail-plugins',
        path: 'plugins',
        component: () => import('@/pages/plugins/List.vue'),
        meta: {
          entity: 'route',
          scopedIn: 'routes',
          title: 'Route Plugins',
        },
      },
    ],
  },

  // consumer pages
  {
    name: 'consumer-list',
    path: '/:workspace/consumers',
    component: () => import('@/pages/consumers/List.vue'),
    meta: {
      entity: 'consumer',
      title: 'Consumers',
    },
  },
  {
    name: 'consumer-create',
    path: '/:workspace/consumers/create',
    component: () => import('@/pages/consumers/Form.vue'),
    meta: {
      entity: 'consumer',
      title: 'Create Consumer',
    },
  },
  {
    name: 'consumer-edit',
    path: '/:workspace/consumers/:id/edit',
    component: () => import('@/pages/consumers/Form.vue'),
    meta: {
      entity: 'consumer',
      title: 'Edit Consumer',
    },
  },
  {
    name: 'consumer-detail',
    path: '/:workspace/consumers/:id',
    component: () => import('@/pages/consumers/Detail.vue'),
    meta: {
      entity: 'consumer',
      title: 'View Consumer',
    },
    children: [
      {
        name: 'consumer-detail-credentials',
        path: 'credentials',
        component: () => import('@/pages/consumers/ConsumerCredentials.vue'),
        meta: {
          entity: 'consumer',
          title: 'Consumer Credentials',
        },
      },
      {
        name: 'consumer-detail-plugins',
        path: 'plugins',
        component: () => import('@/pages/plugins/List.vue'),
        meta: {
          entity: 'consumer',
          scopedIn: 'consumers',
          title: 'Consumer Plugins',
        },
      },
    ],
  },
  {
    name: 'consumer-detail-credentials-create',
    path: '/:workspace/consumers/:id/credentials/:pluginType/create',
    component: () => import('@/pages/consumers/CredentialForm.vue'),
    meta: {
      entity: 'consumer',
      title: 'Create Consumer Credential',
    },
  },
  {
    name: 'consumer-detail-credentials-edit',
    path: '/:workspace/consumers/:id/credentials/:pluginType/:credentialId/edit',
    component: () => import('@/pages/consumers/CredentialForm.vue'),
    meta: {
      entity: 'consumer',
      title: 'Edit Consumer Credential',
    },
  },

  // plugin pages
  {
    name: 'plugin-list',
    path: '/:workspace/plugins',
    component: () => import('@/pages/plugins/List.vue'),
    meta: {
      entity: 'plugin',
      title: 'Plugins',
    },
  },
  {
    name: 'plugin-select',
    path: '/:workspace/plugins/select',
    component: () => import('@/pages/plugins/Select.vue'),
    meta: {
      entity: 'plugin',
      title: 'Select Plugin',
    },
  },
  {
    name: 'plugin-create',
    path: '/:workspace/plugins/:pluginType/create',
    component: () => import('@/pages/plugins/Form.vue'),
    meta: {
      entity: 'plugin',
      title: 'Create Plugin',
    },
  },
  {
    name: 'plugin-edit',
    path: '/:workspace/plugins/:pluginType/:id/edit',
    component: () => import('@/pages/plugins/Form.vue'),
    meta: {
      entity: 'plugin',
      title: 'Edit Plugin',
    },
  },
  {
    name: 'plugin-detail',
    path: '/:workspace/plugins/:pluginType/:id',
    component: () => import('@/pages/plugins/Detail.vue'),
    meta: {
      entity: 'plugin',
      title: 'View Plugin',
    },
  },

  // upstream pages
  {
    name: 'upstream-list',
    path: '/:workspace/upstreams',
    component: () => import('@/pages/upstreams/List.vue'),
    meta: {
      entity: 'upstream',
      title: 'Upstreams',
    },
  },
  {
    name: 'upstream-create',
    path: '/:workspace/upstreams/create',
    component: () => import('@/pages/upstreams/Form.vue'),
    meta: {
      entity: 'upstream',
      title: 'Create Upstream',
    },
  },
  {
    name: 'upstream-edit',
    path: '/:workspace/upstreams/:id/edit',
    component: () => import('@/pages/upstreams/Form.vue'),
    meta: {
      entity: 'upstream',
      title: 'Edit Upstream',
    },
  },
  {
    name: 'upstream-detail',
    path: '/:workspace/upstreams/:id',
    component: () => import('@/pages/upstreams/Detail.vue'),
    meta: {
      entity: 'upstream',
      title: 'View Upstream',
    },
    children: [
      {
        name: 'upstream-detail-targets',
        path: 'targets',
        component: () => import('@/pages/upstreams/TargetList.vue'),
        meta: {
          entity: 'upstream',
          title: 'Upstream Targets',
        },
      },
    ],
  },

  // sni pages
  {
    name: 'sni-list',
    path: '/:workspace/snis',
    component: () => import('@/pages/snis/List.vue'),
    meta: {
      entity: 'sni',
      title: 'SNIs',
    },
  },
  {
    name: 'sni-create',
    path: '/:workspace/snis/create',
    component: () => import('@/pages/snis/Form.vue'),
    meta: {
      entity: 'sni',
      title: 'Create SNI',
    },
  },
  {
    name: 'sni-edit',
    path: '/:workspace/snis/:id/edit',
    component: () => import('@/pages/snis/Form.vue'),
    meta: {
      entity: 'sni',
      title: 'Edit SNI',
    },
  },

  // key set pages
  {
    name: 'key-set-list',
    path: '/:workspace/key-sets',
    component: () => import('@/pages/key-sets/List.vue'),
    meta: {
      entity: 'key-set',
      title: 'Key Sets',
    },
  },
  {
    name: 'key-set-create',
    path: '/:workspace/key-sets/create',
    component: () => import('@/pages/key-sets/Form.vue'),
    meta: {
      entity: 'key-set',
      title: 'Create Key Set',
    },
  },
  {
    name: 'key-set-edit',
    path: '/:workspace/key-sets/:id/edit',
    component: () => import('@/pages/key-sets/Form.vue'),
    meta: {
      entity: 'key-set',
      title: 'Edit Key Set',
    },
  },
  {
    name: 'key-set-detail',
    path: '/:workspace/key-sets/:id',
    component: () => import('@/pages/key-sets/Detail.vue'),
    meta: {
      entity: 'key-set',
      title: 'View Key Set',
    },
    children: [
      {
        name: 'key-set-detail-keys',
        path: 'keys',
        component: () => import('@/pages/keys/List.vue'),
        meta: {
          entity: 'key-set',
          title: 'Key Set Keys',
        },
      },
    ],
  },

  // not found page
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFound.vue'),
    meta: {
      title: 'Not Found',
    },
  },
]

type EntityNameDefinition = { key: string, keyPlural?: string, capitalizedName?: string, capitalizedNamePlural?: string }

type EntityName = string | EntityNameDefinition

/**
 * Add other entity routes. Each of these entities should have and only have:
 * - a list page
 * - a create page
 * - an edit page
 * - and a detail page
 */
const entities: EntityName[] = [
  'certificate',
  {
    key: 'ca-certificate',
    keyPlural: 'ca-certificates',
    capitalizedName: 'CA Certificate',
    capitalizedNamePlural: 'CA Certificates',
  },
  'vault',
  'key',
]

entities.forEach((entityName: EntityName) => {
  const entity = typeof entityName === 'string' ? { key: entityName } : entityName

  entity.keyPlural = entity.keyPlural ?? `${entity.key}s`
  entity.capitalizedName = entity.capitalizedName ?? `${entity.key.charAt(0).toUpperCase()}${entity.key.slice(1)}`.replace(/(-[a-z])/, ([_, letter]) => ` ${letter!.toUpperCase()}`)
  entity.capitalizedNamePlural = `${entity.capitalizedName}s`

  routes.push(
    {
      name: `${entity.key}-list`,
      path: `/:workspace/${entity.keyPlural}`,
      component: () => import(`@/pages/${entity.keyPlural}/List.vue`),
      meta: {
        entity: entity.key,
        title: `${entity.capitalizedNamePlural}`,
      },
    },
    {
      name: `${entity.key}-create`,
      path: `/:workspace/${entity.keyPlural}/create`,
      component: () => import(`@/pages/${entity.keyPlural}/Form.vue`),
      meta: {
        entity: entity.key,
        title: `Create ${entity.capitalizedName}`,
      },
    },
    {
      name: `${entity.key}-edit`,
      path: `/:workspace/${entity.keyPlural}/:id/edit`,
      component: () => import(`@/pages/${entity.keyPlural}/Form.vue`),
      meta: {
        entity: entity.key,
        title: `Edit ${entity.capitalizedName}`,
      },
    },
    {
      name: `${entity.key}-detail`,
      path: `/:workspace/${entity.keyPlural}/:id`,
      component: () => import(`@/pages/${entity.keyPlural}/Detail.vue`),
      meta: {
        entity: entity.key,
        title: `View ${entity.capitalizedName}`,
      },
    },
  )
})

export const router = createRouter({
  history: createWebHistory(config.ADMIN_GUI_PATH),
  routes,
})

router.beforeEach(() => {
  const infoStore = useInfoStore()

  infoStore.getInfo({ silent: true })
})
