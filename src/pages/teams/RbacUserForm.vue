<template>
  <PageHeader :title="isEditing ? 'Edit RBAC User' : 'Add New RBAC User'" />

  <EntityBaseForm
    :config="formConfig"
    :entity-type="SupportedEntityType.Other"
    :form-fields="formFields"
    :can-submit="!!form.name"
    @cancel="router.push({ name: 'teams' })"
    @submit="handleSubmit"
  >
    <EntityFormSection
      title="General"
      description="API token user information"
      has-divider
    >
      <div class="form-field">
        <KLabel for="rbac-name">Name <span class="required">*</span></KLabel>
        <KInput
          id="rbac-name"
          v-model="form.name"
          placeholder="Enter user name"
          :disabled="isEditing"
          required
        />
      </div>

      <div class="form-field">
        <KLabel for="rbac-comment">Comment</KLabel>
        <KInput
          id="rbac-comment"
          v-model="form.comment"
          placeholder="Enter comment"
        />
      </div>

      <div v-if="!isEditing" class="form-field">
        <KLabel for="rbac-token">API Token</KLabel>
        <div class="token-input-group">
          <KInput
            id="rbac-token"
            v-model="form.user_token"
            placeholder="Auto-generated if left blank"
            class="token-input"
          />
          <KButton
            appearance="secondary"
            size="small"
            @click="handleGenerateToken"
          >
            Generate
          </KButton>
        </div>
        <p class="form-hint">A unique token will be auto-generated if left blank.</p>
      </div>

      <div v-if="isEditing" class="form-field">
        <KLabel>API Token</KLabel>
        <div class="token-display">
          <code class="token-value">{{ maskedToken }}</code>
          <KButton
            appearance="secondary"
            size="small"
            @click="copyToken"
          >
            Copy
          </KButton>
          <KButton
            appearance="danger"
            size="small"
            @click="regenerateToken"
          >
            Regenerate
          </KButton>
        </div>
        <p class="form-hint">Regenerating will create a new token. The old token will stop working immediately.</p>
      </div>

      <div v-if="isEditing" class="form-field">
        <KLabel for="rbac-enabled">Enabled</KLabel>
        <KSelect
          id="rbac-enabled"
          v-model="form.enabled"
          :items="[
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ]"
        />
      </div>
    </EntityFormSection>

    <EntityFormSection
      title="Roles"
      description="Assign roles to this user"
      has-divider
    >
      <div class="form-field">
        <div class="role-checkboxes">
          <label v-for="role in availableRoles" :key="role.id" class="role-checkbox">
            <input
              type="checkbox"
              :value="role.name"
              :checked="form.roleNames.includes(role.name)"
              @change="toggleRole(role.name)"
            />
            <span>{{ role.name }}</span>
            <span v-if="role.comment" class="role-comment">{{ role.comment }}</span>
          </label>
        </div>
        <p v-if="availableRoles.length === 0" class="form-hint">No roles available. Create roles first.</p>
      </div>
    </EntityFormSection>
  </EntityBaseForm>

  <!-- Token display modal after creation -->
  <KModal
    v-if="showTokenModal"
    title="API Token Created"
    @proceed="closeTokenModal"
    @cancel="closeTokenModal"
  >
    <template #body>
      <p>Your API token has been created. <strong>Copy it now — you won't be able to see it again.</strong></p>
      <div class="token-modal-content">
        <code class="token-full">{{ createdToken }}</code>
        <KButton
          appearance="primary"
          size="small"
          @click="copyCreatedToken"
        >
          Copy Token
        </KButton>
      </div>
    </template>
  </KModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KLabel, KInput, KButton, KSelect, KModal } from '@kong/kongponents'
import { EntityBaseForm, EntityFormSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { apiService } from '@/services/apiService'
import { useFormGeneralConfig } from '@/composables/useFormGeneralConfig'
import { useToaster } from '@/composables/useToaster'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'RbacUserForm' })

const route = useRoute()
const router = useRouter()
const toaster = useToaster()

const id = computed(() => route.params.id as string)
const isEditing = computed(() => !!id.value)

const formConfig = useFormGeneralConfig()

const form = reactive({
  name: '',
  comment: '',
  user_token: '',
  enabled: 'true' as 'true' | 'false',
  roleNames: [] as string[],
})

const formFields = reactive({ ...form })
const availableRoles = ref<any[]>([])
const currentToken = ref('')  // stored token from server for edit mode
const showTokenModal = ref(false)
const createdToken = ref('')

function maskToken(token: string) {
  if (!token) return '–'
  return token.substring(0, 8) + '****'
}

const maskedToken = computed(() => maskToken(currentToken.value))

async function copyToken() {
  try {
    await navigator.clipboard.writeText(currentToken.value)
    toaster.open({ appearance: 'success', message: 'Token copied to clipboard' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to copy token' })
  }
}

async function regenerateToken() {
  if (!id.value) return
  const newToken = 'kpat_' + crypto.randomUUID().replace(/-/g, '')
  try {
    await apiService.patch(`rbac/users/${id.value}`, { user_token: newToken })
    currentToken.value = newToken
    toaster.open({ appearance: 'success', message: 'Token regenerated successfully' })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to regenerate token' })
  }
}

async function copyCreatedToken() {
  try {
    await navigator.clipboard.writeText(createdToken.value)
    toaster.open({ appearance: 'success', message: 'Token copied to clipboard' })
  } catch {
    toaster.open({ appearance: 'danger', message: 'Failed to copy token' })
  }
}

function closeTokenModal() {
  showTokenModal.value = false
  router.push({ name: 'teams' })
}

function handleGenerateToken() {
  form.user_token = 'kpat_' + crypto.randomUUID().replace(/-/g, '')
  Object.assign(formFields, form)
}

onMounted(async () => {
  try {
    const { data } = await apiService.get('rbac/roles')
    availableRoles.value = (data as any).data || data || []
  } catch (e) {
    console.error('Failed to load roles', e)
  }

  if (isEditing.value) {
    try {
      const { data } = await apiService.get(`rbac/users/${id.value}`)
      const user = (data as any).data || data
      form.name = user.name || ''
      form.comment = user.comment || ''
      form.enabled = user.enabled !== false ? 'true' : 'false'
      form.roleNames = (user.roles || []).map((r: any) => r.name || r)
      currentToken.value = user.user_token || ''
      Object.assign(formFields, form)
    } catch (e) {
      toaster.open({ appearance: 'danger', message: 'Failed to load RBAC user data' })
    }
  }
})

function toggleRole(roleName: string) {
  const idx = form.roleNames.indexOf(roleName)
  if (idx >= 0) {
    form.roleNames.splice(idx, 1)
  } else {
    form.roleNames.push(roleName)
  }
  Object.assign(formFields, form)
}

async function handleSubmit() {
  const payload: Record<string, any> = {
    name: form.name,
    comment: form.comment || null,
  }

  if (isEditing.value) {
    payload.enabled = form.enabled === 'true'
    try {
      await apiService.patch(`rbac/users/${id.value}`, payload)
      // Replace roles: fetch existing, delete removed, add new
      const { data: existingData } = await apiService.get(`rbac/users/${id.value}/roles`)
      const existingRoles = ((existingData as any).data || existingData || []) as any[]
      const existingNames = existingRoles.map((r: any) => r.name)
      // Delete roles that are no longer checked
      for (const existing of existingRoles) {
        if (!form.roleNames.includes(existing.name)) {
          try {
            await apiService.delete(`rbac/users/${id.value}/roles/${existing.name}`)
          } catch { /* ignore */ }
        }
      }
      // Add new roles
      if (form.roleNames.length > 0) {
        await apiService.post(`rbac/users/${id.value}/roles`, { roles: form.roleNames })
      }
      toaster.open({ appearance: 'success', message: `RBAC user "${form.name}" updated` })
      router.push({ name: 'teams' })
    } catch (e: any) {
      toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to update RBAC user' })
    }
  } else {
    if (form.user_token) {
      payload.user_token = form.user_token
    }
    payload.roles = form.roleNames
    try {
      const { data } = await apiService.post('rbac/users', payload)
      const user = (data as any)
      if (user.user_token) {
        createdToken.value = user.user_token
        showTokenModal.value = true
      } else {
        toaster.open({ appearance: 'success', message: `RBAC user "${form.name}" created` })
        router.push({ name: 'teams' })
      }
    } catch (e: any) {
      toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to create RBAC user' })
    }
  }
}
</script>

<style scoped lang="scss">
.form-field {
  margin-bottom: 16px;
}

.required {
  color: var(--kui-color-danger, #ce4d5b);
}

.token-input-group {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.token-input {
  flex: 1;
}

.form-hint {
  font-size: var(--kui-font-size-20, 12px);
  color: var(--kui-color-text-neutral, #6c7489);
  margin: 4px 0 0 0;
}

.role-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--kui-color-border, #e4e7ec);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--kui-font-size-30, 13px);
  cursor: pointer;
}

.role-comment {
  font-size: var(--kui-font-size-20, 12px);
  color: var(--kui-color-text-neutral, #6c7489);
  margin-left: 4px;
}

.token-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-value {
  font-family: monospace;
  font-size: var(--kui-font-size-20, 12px);
  background: var(--kui-color-background, #f9fafb);
  padding: 4px 8px;
  border-radius: 4px;
}

.token-modal-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.token-full {
  font-family: monospace;
  font-size: var(--kui-font-size-30, 13px);
  background: var(--kui-color-background, #f9fafb);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--kui-color-border, #e4e7ec);
  word-break: break-all;
}
</style>
