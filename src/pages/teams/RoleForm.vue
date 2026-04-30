<template>
  <PageHeader title="Create Role" />

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
      description="Role definition"
      has-divider
    >
      <div class="form-field">
        <KLabel for="role-name">Name <span class="required">*</span></KLabel>
        <KInput
          id="role-name"
          v-model="form.name"
          placeholder="Enter role name"
          required
        />
      </div>

      <div class="form-field">
        <KLabel for="role-comment">Comment</KLabel>
        <KInput
          id="role-comment"
          v-model="form.comment"
          placeholder="Enter comment"
        />
      </div>

      <div class="form-field">
        <KLabel>Default Role</KLabel>
        <div class="toggle-group">
          <input
            id="role-is-default"
            v-model="form.is_default"
            type="checkbox"
            class="default-checkbox"
          />
          <span class="toggle-label">Assign this role to new users by default</span>
        </div>
      </div>
    </EntityFormSection>
  </EntityBaseForm>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { KLabel, KInput } from '@kong/kongponents'
import { EntityBaseForm, EntityFormSection, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { apiService } from '@/services/apiService'
import { useFormGeneralConfig } from '@/composables/useFormGeneralConfig'
import { useToaster } from '@/composables/useToaster'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'RoleForm' })

const router = useRouter()
const toaster = useToaster()
const formConfig = useFormGeneralConfig()

const form = reactive({
  name: '',
  comment: '',
  is_default: false,
})

const formFields = reactive({ ...form })

async function handleSubmit() {
  const payload: Record<string, any> = {
    name: form.name,
    comment: form.comment || null,
    is_default: form.is_default,
  }

  try {
    const { data } = await apiService.post('rbac/roles', payload)
    const role = (data as any).data || data
    toaster.open({ appearance: 'success', message: `Role "${form.name}" created` })
    router.push({ name: 'role-detail', params: { id: role.id || role.name } })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to create role' })
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

.toggle-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: var(--kui-font-size-30, 13px);
  color: var(--kui-color-text, #000);
}
</style>
