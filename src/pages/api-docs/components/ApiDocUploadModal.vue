<template>
  <KModal
    :visible="modelValue"
    :title="t('api-docs.upload.title')"
    @cancel="onClose"
    @proceed="onSubmit"
  >
    <div class="upload-modal-content">
      <!-- Workspace selector -->
      <div class="form-section">
        <KSelect
          v-model="selectedWorkspace"
          :items="workspaceItems"
          :label="t('api-docs.upload.workspace')"
          @change="onWorkspaceChange"
        />
      </div>

      <!-- File upload area -->
      <div
        class="upload-area"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="onFileSelect"
        >
        <template v-if="!parsedSpec">
          <p>{{ t('api-docs.upload.drag_hint') }}</p>
        </template>
        <template v-else>
          <div class="preview-info">
            <div><strong>{{ t('api-docs.upload.preview_title') }}:</strong> {{ specInfo?.title || '-' }}</div>
            <div><strong>{{ t('api-docs.upload.preview_version') }}:</strong> {{ specInfo?.version || '-' }}</div>
            <div><strong>{{ t('api-docs.upload.preview_paths') }}:</strong> {{ specPathsCount }}</div>
          </div>
        </template>
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

      <!-- Name (auto-generated or manual) -->
      <div class="form-section">
        <KInput
          v-model="docName"
          :label="t('api-docs.upload.name')"
          :placeholder="selectedServiceId ? t('api-docs.upload.name_auto') : ''"
          :disabled="!!selectedServiceId"
        />
      </div>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { KModal, KSelect, KInput } from '@kong/kongponents'
import { apiService } from '@/services/apiService'
import { useI18n } from '@/composables/useI18n'
import { useToaster } from '@/composables/useToaster'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'

interface Props {
  modelValue: boolean
  defaultWorkspace?: string  // pre-selected workspace from List page
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const { t } = useI18n()
const toaster = useToaster()
const { workspace: routeWorkspace } = useCurrentWorkspace()

const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const specContent = ref('')
const parsedSpec = ref<any>(null)
const selectedServiceId = ref('')
const docName = ref('')
const workspaces = ref<Array<{ name: string }>>([])
const selectedWorkspace = ref(props.defaultWorkspace || routeWorkspace.value || 'default')

const specInfo = computed(() => parsedSpec.value?.info || null)
const specPathsCount = computed(() => {
  if (!parsedSpec.value?.paths) return 0
  return Object.keys(parsedSpec.value.paths).length
})

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

const services = ref<Array<{ id: string; name: string }>>([])

// Auto-generate name when service is selected
watch(selectedServiceId, (serviceId) => {
  if (serviceId) {
    const svc = services.value.find((s) => s.id === serviceId)
    if (svc) {
      docName.value = `${svc.name}-swagger`
    }
  } else if (!specContent.value) {
    docName.value = ''
  }
})

// Load workspaces + services when modal opens
watch(() => props.modelValue, async (visible) => {
  if (visible) {
    // Initialize workspace from prop
    selectedWorkspace.value = props.defaultWorkspace || routeWorkspace.value || 'default'

    // Load workspaces list
    try {
      const { data: wsData } = await apiService.get<{ data: Array<{ name: string }> }>('workspaces')
      workspaces.value = wsData.data || []
    } catch {
      workspaces.value = [{ name: 'default' }]
    }

    // Load services for current workspace
    await loadServices()
  } else {
    // Reset on close
    specContent.value = ''
    parsedSpec.value = null
    selectedServiceId.value = ''
    docName.value = ''
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
  // When workspace changes, reload services for that workspace
  selectedServiceId.value = ''
  services.value = []
  loadServices()
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) processFile(file)
}

function processFile(file: File) {
  if (!file.name.endsWith('.json')) {
    toaster.open({ appearance: 'danger', message: t('api-docs.upload.invalid_file') })
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const parsed = JSON.parse(content)

      // Basic swagger validation
      if (!parsed.swagger && !parsed.openapi) {
        toaster.open({ appearance: 'danger', message: t('api-docs.upload.invalid_file') })
        return
      }

      specContent.value = content
      parsedSpec.value = parsed

      // Auto name from filename if no service selected
      if (!selectedServiceId.value) {
        docName.value = file.name.replace(/\.json$/i, '')
      }
    } catch {
      toaster.open({ appearance: 'danger', message: t('api-docs.upload.invalid_file') })
    }
  }
  reader.readAsText(file)
}

async function onSubmit() {
  if (!specContent.value || !docName.value) return

  try {
    await apiService.post(`api-docs?workspace=${selectedWorkspace.value}`, {
      name: docName.value,
      spec_content: specContent.value,
      service_id: selectedServiceId.value || undefined,
    })
    toaster.open({ appearance: 'success', message: t('api-docs.created', { name: docName.value }) })
    emit('update:modelValue', false)
    emit('created')
  } catch (err: any) {
    toaster.open({ appearance: 'danger', message: t('api-docs.create_failed') + ': ' + (err.response?.data?.message || err.message) })
  }
}

function onClose() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.upload-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover,
  &.drag-over {
    border-color: var(--kui-color-border-primary, #1155cb);
  }
}

.form-section {
  margin-top: 8px;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}
</style>
