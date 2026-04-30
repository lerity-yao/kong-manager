<template>
  <PageHeader :title="isEditing ? 'Edit Group' : 'Create Group'" />

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
      description="Group information"
      has-divider
    >
      <div class="form-field">
        <KLabel for="group-name">Name <span class="required">*</span></KLabel>
        <KInput
          id="group-name"
          v-model="form.name"
          placeholder="Enter group name"
          :disabled="isEditing"
          required
        />
      </div>

      <div class="form-field">
        <KLabel for="group-comment">Comment</KLabel>
        <KInput
          id="group-comment"
          v-model="form.comment"
          placeholder="Enter comment"
        />
      </div>
    </EntityFormSection>

    <EntityFormSection
      title="Roles"
      description="Assign roles to this group"
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

defineOptions({ name: 'GroupForm' })

const route = useRoute()
const router = useRouter()
const toaster = useToaster()

const id = computed(() => route.params.id as string)
const isEditing = computed(() => !!id.value)

const formConfig = useFormGeneralConfig()

const form = reactive({
  name: '',
  comment: '',
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
      const { data } = await apiService.get(`rbac/groups/${id.value}`)
      const group = (data as any).data || data
      form.name = group.name || ''
      form.comment = group.comment || ''
      form.roleNames = (group.roles || []).map((r: any) => r.name || r)
      Object.assign(formFields, form)
    } catch (e) {
      toaster.open({ appearance: 'danger', message: 'Failed to load group data' })
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

  try {
    if (isEditing.value) {
      await apiService.patch(`rbac/groups/${id.value}`, payload)
      if (form.roleNames.length > 0) {
        await apiService.post(`rbac/groups/${id.value}/roles`, { roles: form.roleNames })
      }
      toaster.open({ appearance: 'success', message: `Group "${form.name}" updated` })
    } else {
      await apiService.post('rbac/groups', payload)
      toaster.open({ appearance: 'success', message: `Group "${form.name}" created` })
    }
    router.push({ name: 'teams' })
  } catch (e: any) {
    toaster.open({ appearance: 'danger', message: e?.response?.data?.message || 'Failed to save group' })
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
