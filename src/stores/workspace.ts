import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService'

export interface Workspace {
  id: string
  name: string
  comment: string | null
  created_at: number
  updated_at: number
  meta: Record<string, any>
  config: Record<string, any>
  counters?: Record<string, number>
}

interface State {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): State => ({
    currentWorkspace: null,
    workspaces: [],
    loading: false,
  }),

  getters: {
    currentWorkspaceName: state => state.currentWorkspace?.name ?? 'default',
    isDefaultWorkspace: state => state.currentWorkspace?.name === 'default',
  },

  actions: {
    async fetchWorkspaces(withCounters = false) {
      this.loading = true
      try {
        const url = withCounters ? 'workspaces?counter=true' : 'workspaces'
        const res = await apiService.get(url)
        this.workspaces = (res.data as any)?.data ?? []
      } catch (err) {
        console.error('Failed to fetch workspaces:', err)
        this.workspaces = []
      } finally {
        this.loading = false
      }
    },

    setCurrentWorkspace(workspace: Workspace | null) {
      this.currentWorkspace = workspace
    },

    setCurrentWorkspaceByName(name: string) {
      const ws = this.workspaces.find(w => w.name === name)
      if (ws) {
        this.currentWorkspace = ws
      }
    },
  },
})
