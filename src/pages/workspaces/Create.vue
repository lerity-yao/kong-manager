<template>
  <PageHeader :title="t('workspaces.create.title')" />
  <EntityBaseForm
    :config="formConfig"
    :entity-type="SupportedEntityType.Other"
    :form-fields="form"
    :can-submit="!!form.name"
    @cancel="router.push({ name: 'workspaces' })"
    @submit="onSubmit"
  >
    <EntityFormSection
      :title="t('workspaces.create.section.general')"
      :description="t('workspaces.create.section.general.description')"
      has-divider
    >
      <div class="form-field">
        <KLabel for="ws-name">
          {{ t('workspaces.create.name') }}
        </KLabel>
        <KInput
          id="ws-name"
          v-model="form.name"
          :placeholder="t('workspaces.create.name_placeholder')"
          required
        />
      </div>
      <div class="form-field">
        <KLabel for="ws-comment">
          {{ t('workspaces.create.comment') }}
        </KLabel>
        <KInput
          id="ws-comment"
          v-model="form.comment"
          :placeholder="t('workspaces.create.comment_placeholder')"
        />
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
import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/composables/useI18n'
import { useToaster } from '@/composables/useToaster'
import { useFormGeneralConfig } from '@/composables/useFormGeneralConfig'
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'WorkspaceCreate' })

const router = useRouter()
const toaster = useToaster()
const { t } = useI18n() as any
const workspaceStore = useWorkspaceStore()

const formConfig = useFormGeneralConfig()

const form = reactive({
  name: '',
  comment: '',
})

const onSubmit = async () => {
  try {
    await apiService.post('workspaces', {
      name: form.name,
      comment: form.comment || undefined,
    })
    toaster.open({
      appearance: 'success',
      message: t('workspaces.created', { name: form.name }),
    })
    await workspaceStore.fetchWorkspaces()
    router.push({ name: 'workspaces' })
  } catch (err: any) {
    toaster.open({
      appearance: 'danger',
      message: err?.response?.data?.message || err?.message || t('workspaces.create.failed'),
    })
  }
}
</script>

<style scoped lang="scss">
.form-field {
  margin-bottom: 16px;
}
</style>
