<template>
  <PageHeader :title="t('entities.consumer.list.title')">
    <template #below-title>
      <SupportText>
        {{ t('entities.consumer.description') }}
        <KExternalLink :href="docsLink">
          {{ t('global.learn.more') }}
        </KExternalLink>
      </SupportText>
    </template>
  </PageHeader>
  <ConsumerList
    cache-identifier="consumers"
    :config="consumerListConfig"
    :can-create="canCreate"
    :can-delete="canDelete"
    :can-edit="canEdit"
    :can-retrieve="canRetrieve"
    @copy:success="onCopySuccess"
    @copy:error="onCopyError"
    @delete:success="onDeleteSuccess"
  />
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ConsumerList, type EntityRow } from '@kong-ui-public/entities-consumers'
import type { FilterSchema } from '@kong-ui-public/entities-shared'
import { useListGeneralConfig } from '@/composables/useListGeneralConfig'
import { useCopyEventHandlers } from '@/composables/useCopyEventHandlers'
import { useCurrentWorkspace } from '@/composables/useCurrentWorkspace'
import { useToaster } from '@/composables/useToaster'
import { useI18n } from '@/composables/useI18n'
import { useDocsLink } from '@/composables/useDocsLink'
import { EntityType } from '@/types'
import { useEntityPermissions } from '@/composables/useEntityPermissions'

defineOptions({
  name: 'ConsumerList',
})

const toaster = useToaster()
const { t } = useI18n()
const docsLink = useDocsLink(EntityType.Consumer)

const { workspace } = useCurrentWorkspace()

const createRoute = computed(() => {
  return { name: 'consumer-create', params: { workspace: workspace.value } }
})

const getViewRoute = (id: string) => {
  return { name: 'consumer-detail', params: { workspace: workspace.value, id } }
}

const getEditRoute = (id: string) => ({
  name: 'consumer-edit',
  params: {
    workspace: workspace.value,
    id,
  },
})

const filterSchema: FilterSchema = {
  username: { type: 'text' },
  custom_id: { type: 'text' },
}

const consumerListConfig = reactive({
  ...useListGeneralConfig(),
  createRoute,
  getViewRoute,
  getEditRoute,
  filterSchema,
})

const { canCreate, canDelete, canEdit, canRetrieve } = useEntityPermissions('/consumers')

const { onCopySuccess, onCopyError } = useCopyEventHandlers()

const onDeleteSuccess = (entity: EntityRow) => {
  toaster.open({
    appearance: 'success',
    message: t('entities.consumer.deleted', {
      name: entity.username ?? entity.custom_id,
    }),
  })
}
</script>
