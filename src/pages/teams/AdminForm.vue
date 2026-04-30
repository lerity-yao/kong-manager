<template>
  <PageHeader :title="isEditing ? 'Edit Admin' : 'Invite Admin'" />

  <EntityBaseForm
    :config="formConfig"
    :entity-type="SupportedEntityType.Other"
    :form-fields="formFields"
    :can-submit="!!form.username"
    @cancel="router.push({ name: 'teams' })"
    @submit="handleSubmit"
  >
    <EntityFormSection
      title="General"
      description="Admin account information"
      has-divider
    >
      <div class="form-field">
        <KLabel for="admin-username">Username <span class="required">*</span></KLabel>
        <KInput
          id="admin-username"
          v-model="form.username"
          placeholder="Enter username"
          :disabled="isEditing"
          required
        />
      </div>

      <div class="form-field">
        <KLabel for="admin-email">Email</KLabel>
        <KInput
          id="admin-email"
          v-model="form.email"
          type="email"
          placeholder="Enter email address"
        />
      </div>

      <div class="form-field">
        <KLabel for="admin-password">{{ isEditing ? 'New Password' : 'Password' }}</KLabel>
        <KInput
          id="admin-password"
          v-model="form.password"
          type="password"
          :placeholder="isEditing ? 'Leave blank to keep current' : 'Leave blank to send an invite'"
        />
        <p class="form-hint">{{ isEditing ? '' : 'Leave blank to invite the user; they will set their own password.' }}</p>
      </div>

      <div class="form-field">
        <KLabel for="admin-custom-id">Custom ID</KLabel>
        <KInput
          id="admin-custom-id"
          v-model="form.custom_id"
          placeholder="Enter custom ID"
        />
      </div>
    </EntityFormSection>

    <EntityFormSection
      title="Roles"
      description="Assign roles to this admin"
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KLabel, KInput } from '@kong/kongponents'
import { EntityBaseForm, EntityFormSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { apiService } from '@/services/apiService'
import { useFormGeneralConfig } from '@/composables/useFormGeneralConfig'
import { useToaster } from '@/composables/useToaster'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'AdminForm' })

const route = useRoute()
const router = useRouter()
const toaster = useToaster()

const id = computed(() => route.params.id as string)
const isEditing = computed(() => !!id.value)

const formConfig = useFormGeneralConfig()

const form = reactive({
  username: '',
  email: '',
  password: '',
  custom_id: '',
  roleNames: [] as string[],
})

const formFields = reactive({ ...form })
const availableRoles = ref<any[]>([])

onMounted(async () => {
  try {
    const { data } = await apiService.get('rbac/roles')
    availableRoles.value = (data as any).data || data || []
  } catch (e) {
    console.error('Failed to load roles', e)
  }

  if (isEditing.value) {
    try {
      const { data } = await apiService.get(`admins/${id.value}`)
      const admin = (data as any).data || data
      form.username = admin.username || ''
      form.email = admin.email || ''
      form.custom_id = admin.custom_id || ''
      form.roleNames = (admin.roles || []).map((r: any) => r.name || r)
      Object.assign(formFields, form)
    } catch (e) {
      toaster.open({ appearance: 'danger', message: 'Failed to load admin data' })
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
    username: form.username,
    email: form.email || null,
    custom_id: form.custom_id || null,
  }

  if (form.password) {
    payload.password = form.password
  }

  try {
    if (isEditing.value) {
      await apiService.patch(`admins/${id.value}`, payload)
      if (form.roleNames.length > 0) {
        await apiService.post(`admins/${id.value}/roles`, { roles: form.roleNames })
      }
      toaster.open({ appearance: 'success', message: `Admin "${form.username}" updated` })
    } else {
      await apiService.post('admins', payload)
      toaster.open({ appearance: 'success', message: `Admin "${form.username}" invited` })
    }
    router.push({ name: 'teams' })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to save admin' })
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
</style>
