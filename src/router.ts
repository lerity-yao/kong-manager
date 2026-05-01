import {
  createRouter, createWebHistory, type RouteRecordRaw,
} from 'vue-router'

import { config } from 'config'
import { useInfoStore } from './stores/info'
import { useAuthStore } from './stores/auth'

const routes: RouteRecordRaw[] = [
  // Redirect root to workspaces list
  {
    path: '/',
    redirect: '/workspaces',
  },

  // Login page
  {
    name: 'login',
    path: '/login',
    component: () => import('@/pages/Login.vue'),
    meta: {
      title: 'Login',
      public: true,
    },
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

  // About page (gateway info) - MUST be before /workspaces/:workspace to avoid route conflict
  {
    name: 'about',
    path: '/about',
    component: () => import('@/pages/about/About.vue'),
    meta: {
      title: 'About',
    },
  },

  // Workspace overview (workspace statistics)
  {
    name: 'workspace-overview',
    path: '/workspaces/:workspace',
    component: () => import('@/pages/workspaces/Detail.vue'),
    meta: {
      title: 'Workspace Overview',
    },
  },

  // service pages
  {
    name: 'service-list',
    path: '/workspaces/:workspace/services',
    component: () => import('@/pages/services/List.vue'),
    meta: {
      entity: 'service',
      title: 'Gateway Services',
    },
  },
  {
    name: 'service-create',
    path: '/workspaces/:workspace/services/create',
    component: () => import('@/pages/services/Form.vue'),
    meta: {
      entity: 'service',
      title: 'Create Gateway Service',
    },
  },
  {
    name: 'service-edit',
    path: '/workspaces/:workspace/services/:id/edit',
    component: () => import('@/pages/services/Form.vue'),
    meta: {
      entity: 'service',
      title: 'Edit Gateway Service',
    },
  },
  {
    name: 'service-detail',
    path: '/workspaces/:workspace/services/:id',
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
      {
        name: 'service-detail-api-docs',
        path: 'api-docs',
        component: () => import('@/pages/services/ServiceApiDocsTab.vue'),
        meta: {
          entity: 'service',
          title: 'Gateway Service API Docs',
        },
      },
    ],
  },

  // api-docs pages (top-level, not workspace-scoped)
  {
    name: 'api-doc-list',
    path: '/api-docs',
    component: () => import('@/pages/api-docs/List.vue'),
    meta: {
      entity: 'api-doc',
      title: 'API Docs',
    },
  },
  {
    name: 'api-doc-detail',
    path: '/api-docs/:name',
    component: () => import('@/pages/api-docs/Detail.vue'),
    meta: {
      entity: 'api-doc',
      title: 'View API Doc',
    },
  },

  // route pages
  {
    name: 'route-list',
    path: '/workspaces/:workspace/routes',
    component: () => import('@/pages/routes/List.vue'),
    meta: {
      entity: 'route',
      title: 'Routes',
    },
  },
  {
    name: 'route-create',
    path: '/workspaces/:workspace/routes/create',
    component: () => import('@/pages/routes/Form.vue'),
    meta: {
      entity: 'route',
      title: 'Create Route',
    },
  },
  {
    name: 'route-edit',
    path: '/workspaces/:workspace/routes/:id/edit',
    component: () => import('@/pages/routes/Form.vue'),
    meta: {
      entity: 'route',
      title: 'Edit Route',
    },
  },
  {
    name: 'route-detail',
    path: '/workspaces/:workspace/routes/:id',
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
      {
        name: 'route-detail-api-docs',
        path: 'api-docs',
        component: () => import('@/pages/routes/RouteApiDocsTab.vue'),
        meta: {
          entity: 'route',
          title: 'Route API Docs',
        },
      },
    ],
  },

  // consumer pages
  {
    name: 'consumer-list',
    path: '/workspaces/:workspace/consumers',
    component: () => import('@/pages/consumers/List.vue'),
    meta: {
      entity: 'consumer',
      title: 'Consumers',
    },
  },
  {
    name: 'consumer-create',
    path: '/workspaces/:workspace/consumers/create',
    component: () => import('@/pages/consumers/Form.vue'),
    meta: {
      entity: 'consumer',
      title: 'Create Consumer',
    },
  },
  {
    name: 'consumer-edit',
    path: '/workspaces/:workspace/consumers/:id/edit',
    component: () => import('@/pages/consumers/Form.vue'),
    meta: {
      entity: 'consumer',
      title: 'Edit Consumer',
    },
  },
  {
    name: 'consumer-detail',
    path: '/workspaces/:workspace/consumers/:id',
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
    path: '/workspaces/:workspace/consumers/:id/credentials/:pluginType/create',
    component: () => import('@/pages/consumers/CredentialForm.vue'),
    meta: {
      entity: 'consumer',
      title: 'Create Consumer Credential',
    },
  },
  {
    name: 'consumer-detail-credentials-edit',
    path: '/workspaces/:workspace/consumers/:id/credentials/:pluginType/:credentialId/edit',
    component: () => import('@/pages/consumers/CredentialForm.vue'),
    meta: {
      entity: 'consumer',
      title: 'Edit Consumer Credential',
    },
  },

  // plugin pages
  {
    name: 'plugin-list',
    path: '/workspaces/:workspace/plugins',
    component: () => import('@/pages/plugins/List.vue'),
    meta: {
      entity: 'plugin',
      title: 'Plugins',
    },
  },
  {
    name: 'plugin-select',
    path: '/workspaces/:workspace/plugins/select',
    component: () => import('@/pages/plugins/Select.vue'),
    meta: {
      entity: 'plugin',
      title: 'Select Plugin',
    },
  },
  {
    name: 'plugin-create',
    path: '/workspaces/:workspace/plugins/:pluginType/create',
    component: () => import('@/pages/plugins/Form.vue'),
    meta: {
      entity: 'plugin',
      title: 'Create Plugin',
    },
  },
  {
    name: 'plugin-edit',
    path: '/workspaces/:workspace/plugins/:pluginType/:id/edit',
    component: () => import('@/pages/plugins/Form.vue'),
    meta: {
      entity: 'plugin',
      title: 'Edit Plugin',
    },
  },
  {
    name: 'plugin-detail',
    path: '/workspaces/:workspace/plugins/:pluginType/:id',
    component: () => import('@/pages/plugins/Detail.vue'),
    meta: {
      entity: 'plugin',
      title: 'View Plugin',
    },
  },

  // upstream pages
  {
    name: 'upstream-list',
    path: '/workspaces/:workspace/upstreams',
    component: () => import('@/pages/upstreams/List.vue'),
    meta: {
      entity: 'upstream',
      title: 'Upstreams',
    },
  },
  {
    name: 'upstream-create',
    path: '/workspaces/:workspace/upstreams/create',
    component: () => import('@/pages/upstreams/Form.vue'),
    meta: {
      entity: 'upstream',
      title: 'Create Upstream',
    },
  },
  {
    name: 'upstream-edit',
    path: '/workspaces/:workspace/upstreams/:id/edit',
    component: () => import('@/pages/upstreams/Form.vue'),
    meta: {
      entity: 'upstream',
      title: 'Edit Upstream',
    },
  },
  {
    name: 'upstream-detail',
    path: '/workspaces/:workspace/upstreams/:id',
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
    path: '/workspaces/:workspace/snis',
    component: () => import('@/pages/snis/List.vue'),
    meta: {
      entity: 'sni',
      title: 'SNIs',
    },
  },
  {
    name: 'sni-create',
    path: '/workspaces/:workspace/snis/create',
    component: () => import('@/pages/snis/Form.vue'),
    meta: {
      entity: 'sni',
      title: 'Create SNI',
    },
  },
  {
    name: 'sni-edit',
    path: '/workspaces/:workspace/snis/:id/edit',
    component: () => import('@/pages/snis/Form.vue'),
    meta: {
      entity: 'sni',
      title: 'Edit SNI',
    },
  },

  // key set pages
  {
    name: 'key-set-list',
    path: '/workspaces/:workspace/key-sets',
    component: () => import('@/pages/key-sets/List.vue'),
    meta: {
      entity: 'key-set',
      title: 'Key Sets',
    },
  },
  {
    name: 'key-set-create',
    path: '/workspaces/:workspace/key-sets/create',
    component: () => import('@/pages/key-sets/Form.vue'),
    meta: {
      entity: 'key-set',
      title: 'Create Key Set',
    },
  },
  {
    name: 'key-set-edit',
    path: '/workspaces/:workspace/key-sets/:id/edit',
    component: () => import('@/pages/key-sets/Form.vue'),
    meta: {
      entity: 'key-set',
      title: 'Edit Key Set',
    },
  },
  {
    name: 'key-set-detail',
    path: '/workspaces/:workspace/key-sets/:id',
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

  // Teams pages (outside workspace context)
  {
    name: 'teams',
    path: '/teams',
    component: () => import('@/pages/teams/List.vue'),
    meta: {
      title: 'Teams',
    },
  },
  {
    name: 'admin-create',
    path: '/teams/admins/create',
    component: () => import('@/pages/teams/AdminForm.vue'),
    meta: {
      title: 'Create Admin',
    },
  },
  {
    name: 'admin-edit',
    path: '/teams/admins/:id/edit',
    component: () => import('@/pages/teams/AdminForm.vue'),
    meta: {
      title: 'Edit Admin',
    },
  },
  {
    name: 'rbac-user-create',
    path: '/teams/rbac-users/create',
    component: () => import('@/pages/teams/RbacUserForm.vue'),
    meta: {
      title: 'Create RBAC User',
    },
  },
  {
    name: 'rbac-user-edit',
    path: '/teams/rbac-users/:id/edit',
    component: () => import('@/pages/teams/RbacUserForm.vue'),
    meta: {
      title: 'Edit RBAC User',
    },
  },
  {
    name: 'group-create',
    path: '/teams/groups/create',
    component: () => import('@/pages/teams/GroupForm.vue'),
    meta: {
      title: 'Create Group',
    },
  },
  {
    name: 'group-edit',
    path: '/teams/groups/:id/edit',
    component: () => import('@/pages/teams/GroupForm.vue'),
    meta: {
      title: 'Edit Group',
    },
  },
  {
    name: 'role-create',
    path: '/teams/roles/create',
    component: () => import('@/pages/teams/RoleForm.vue'),
    meta: {
      title: 'Create Role',
    },
  },
  {
    name: 'role-detail',
    path: '/teams/roles/:id',
    component: () => import('@/pages/teams/RoleDetail.vue'),
    meta: {
      title: 'Role Detail',
    },
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
      path: `/workspaces/:workspace/${entity.keyPlural}`,
      component: () => import(`@/pages/${entity.keyPlural}/List.vue`),
      meta: {
        entity: entity.key,
        title: `${entity.capitalizedNamePlural}`,
      },
    },
    {
      name: `${entity.key}-create`,
      path: `/workspaces/:workspace/${entity.keyPlural}/create`,
      component: () => import(`@/pages/${entity.keyPlural}/Form.vue`),
      meta: {
        entity: entity.key,
        title: `Create ${entity.capitalizedName}`,
      },
    },
    {
      name: `${entity.key}-edit`,
      path: `/workspaces/:workspace/${entity.keyPlural}/:id/edit`,
      component: () => import(`@/pages/${entity.keyPlural}/Form.vue`),
      meta: {
        entity: entity.key,
        title: `Edit ${entity.capitalizedName}`,
      },
    },
    {
      name: `${entity.key}-detail`,
      path: `/workspaces/:workspace/${entity.keyPlural}/:id`,
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

router.beforeEach(async (to) => {
  const infoStore = useInfoStore()
  const authStore = useAuthStore()

  try {
    await infoStore.getInfo({ silent: true })
  } catch {
    // getInfo failed (e.g. 401) - if not on a public route, redirect to login
    if (!to.meta?.public) {
      return { name: 'login' }
    }
    return
  }

  // Check if RBAC is enabled
  const enforceRbac = infoStore.infoConfig?.enforce_rbac
  authStore.rbacEnabled = enforceRbac === true
  if (!enforceRbac) {
    return // RBAC not enabled, skip auth
  }

  // Allow public routes (login)
  if (to.meta?.public) {
    // If already logged in, redirect away from login
    if (to.name === 'login' && authStore.isLoggedIn) {
      return { name: 'workspaces' }
    }
    return
  }

  // Require authentication
  if (!authStore.isLoggedIn) {
    // Try to fetch current user from session
    await authStore.fetchCurrentUser()
    if (!authStore.isLoggedIn) {
      return { name: 'login' }
    }
  }
})
