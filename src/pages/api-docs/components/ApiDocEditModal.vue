<template>
  <KModal
    :visible="modelValue"
    :title="t('api-docs.edit.title')"
    @cancel="onClose"
    @proceed="onSubmit"
  >
    <div class="edit-modal-content">
      <!-- Workspace selector -->
      <div class="form-section">
        <KSelect
          v-model="selectedWorkspace"
          :items="workspaceItems"
          :label="t('api-docs.upload.workspace')"
          @change="onWorkspaceChange"
        />
      </div>

      <!-- Service association -->
      <div class="form-section">
        <KSelect
          v-model="selectedServiceId"
          :items="serviceItems"
          :label="t('api-docs.upload.service')"
          :placeholder="t('api-docs.upload.service_placeholder')"
          clearable
        />
      </div>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { KModal, KSelect } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useToaster } from '@/composables/useToaster'

interface Props {
  modelValue: boolean
  docName: string
  currentWorkspace?: string
  currentServiceId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated'): void
}>()

const { t } = useI18n()
const toaster = useToaster()

const selectedWorkspace = ref(props.currentWorkspace || 'default')
const selectedServiceId = ref(props.currentServiceId || '')
const workspaces = ref<Array<{ name: string }>>([])
const services = ref<Array<{ id: string; name: string }>>([])

const workspaceItems = computed(() =>
  workspaces.value.map((ws) => ({
    label: ws.name,
    value: ws.name,
  })),
)

const serviceItems = computed(() =>
  services.value.map((s) => ({
    label: s.name,
    value: s.id,
  })),
)

// Load data when modal opens
watch(() => props.modelValue, async (visible) => {
  if (visible) {
    selectedWorkspace.value = props.currentWorkspace || 'default'
    selectedServiceId.value = props.currentServiceId || ''

    // Load workspaces
    try {
      const { data: wsData } = await apiService.get<{ data: Array<{ name: string }> }>('workspaces')
      workspaces.value = wsData.data || []
    } catch {
      workspaces.value = [{ name: 'default' }]
    }

    // Load services for current workspace
    await loadServices()
  }
})

async function loadServices() {
  try {
    const { data } = await apiService.get<{ data: Array<{ id: string; name: string }> }>(`workspaces/${selectedWorkspace.value}/services`)
    services.value = (data.data || []).map((s: any) => ({ id: s.id, name: s.name }))
  } catch {
    services.value = []
  }
}

function onWorkspaceChange() {
  selectedServiceId.value = ''
  services.value = []
  loadServices()
}

async function onSubmit() {
  if (!props.docName) return

  try {
    const payload: Record<string, string> = {}

    // Only send if workspace changed
    if (selectedWorkspace.value !== props.currentWorkspace) {
      payload.new_workspace = selectedWorkspace.value
    }

    // Only send if service changed
    if (selectedServiceId.value !== (props.currentServiceId || '')) {
      payload.service_id = selectedServiceId.value || ''
    }

    const wsParam = props.currentWorkspace ? `?workspace=${props.currentWorkspace}` : ''
    await apiService.patch(`api-docs/${props.docName}${wsParam}`, payload)
    toaster.open({ appearance: 'success', message: t('api-docs.updated', { name: props.docName }) })
    emit('update:modelValue', false)
    emit('updated')
  } catch (err: any) {
    toaster.open({ appearance: 'danger', message: t('api-docs.update_failed') + ': ' + (err.response?.data?.message || err.message) })
  }
}

function onClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.edit-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  margin-top: 8px;
}
</style>
