<template>
  <div class="language-switcher">
    <KDropdownMenu
      :items="localeOptions"
      :selection-menu="true"
      width="150"
      @change="onSelect"
    >
      <template #default>
        <KButton
          appearance="secondary"
          size="small"
        >
          {{ currentLabel }}
        </KButton>
      </template>
    </KDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KButton, KDropdownMenu } from '@kong/kongponents'

defineOptions({ name: 'LanguageSwitcher' })

const SUPPORTED_LOCALES: Record<string, string> = {
  'en-US': 'English',
  'zh-CN': '\u4e2d\u6587',
}

const currentLocale = computed(() => localStorage.getItem('kong-manager-locale') || 'en-US')

const currentLabel = computed(() => SUPPORTED_LOCALES[currentLocale.value] || 'English')

const localeOptions = computed(() =>
  Object.entries(SUPPORTED_LOCALES).map(([value, label]) => ({
    label,
    value,
  })),
)

const onSelect = (item: any) => {
  if (item?.value && item.value !== currentLocale.value) {
    localStorage.setItem('kong-manager-locale', item.value)
    window.location.reload()
  }
}
</script>

<style scoped lang="scss">
.language-switcher {
  display: inline-flex;
  align-items: center;

  // 按钮边框改为白色，与深色背景侧边栏协调
  :deep(.k-button) {
    border-color: rgba(255, 255, 255, 0.4) !important;
    color: rgba(255, 255, 255, 0.9) !important;

    &:hover {
      border-color: rgba(255, 255, 255, 0.7) !important;
    }
  }
}
</style>
