<template>
  <div class="login-page">
    <KCard class="login-card" border-variant="no-border">
      <div class="login-header">
        <img src="@/assets/logo.svg?external" alt="Kong Manager Logo" class="login-logo">
        <h1 class="login-title">Kong Manager</h1>
        <p class="login-subtitle">{{ t('auth.login.subtitle') }}</p>
      </div>

      <EntityBaseForm
        :config="formConfig"
        :entity-type="SupportedEntityType.Other"
        :form-fields="formFields"
        :can-submit="canSubmit"
        :error-message="errorMessage"
        :is-readonly="loading"
        @submit="handleSubmit"
      >
        <div class="form-field">
          <KLabel for="username">{{ t('auth.login.username') }}</KLabel>
          <KInput
            id="username"
            v-model="username"
            type="text"
            :placeholder="t('auth.login.username_placeholder')"
            autocomplete="username"
            class="login-input"
          />
        </div>

        <div class="form-field">
          <KLabel for="password">{{ t('auth.login.password') }}</KLabel>
          <KInput
            id="password"
            v-model="password"
            type="password"
            :placeholder="t('auth.login.password_placeholder')"
            autocomplete="current-password"
            class="login-input"
          />
        </div>

        <template v-if="showTokenLogin">
          <div class="form-field">
            <KLabel for="token-name">{{ t('auth.login.token_name') }}</KLabel>
            <KInput
              id="token-name"
              v-model="tokenName"
              type="text"
              :placeholder="t('auth.login.token_name_placeholder')"
              class="login-input"
            />
          </div>

          <div class="form-field">
            <KLabel for="token-value">{{ t('auth.login.token_value') }}</KLabel>
            <KInput
              id="token-value"
              v-model="tokenValue"
              type="password"
              :placeholder="t('auth.login.token_value_placeholder')"
              class="login-input"
            />
          </div>
        </template>

        <template #form-actions>
          <KButton
            appearance="primary"
            :disabled="!canSubmit || loading"
            type="submit"
            class="login-btn"
            size="large"
          >
            {{ loading ? t('auth.login.signing_in') : t('auth.login.sign_in') }}
          </KButton>
          <KButton
            appearance="tertiary"
            size="small"
            class="token-toggle"
            @click="showTokenLogin = !showTokenLogin"
          >
            {{ showTokenLogin ? t('auth.login.use_password') : t('auth.login.use_token') }}
          </KButton>
        </template>
      </EntityBaseForm>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  KCard,
  KInput,
  KLabel,
  KButton,
} from '@kong/kongponents'
import { EntityBaseForm, SupportedEntityType } from '@kong-ui-public/entities-shared'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useFormGeneralConfig } from '@/composables/useFormGeneralConfig'

defineOptions({ name: 'Login' })

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const formConfig = useFormGeneralConfig()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const showTokenLogin = ref(false)
const tokenName = ref('')
const tokenValue = ref('')

const formFields = reactive({
  username,
  password,
  tokenName,
  tokenValue,
})

const canSubmit = computed(() => {
  if (showTokenLogin.value) {
    return !!tokenName.value && !!tokenValue.value
  }
  return !!username.value && !!password.value
})

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    if (showTokenLogin.value) {
      await authStore.loginWithToken(tokenName.value, tokenValue.value)
    } else {
      await authStore.login(username.value, password.value)
    }
    router.push({ name: 'workspaces' })
  } catch (e: any) {
    errorMessage.value = e?.response?.data?.message || t('auth.login.error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: $kui-color-background-neutral;
}

.login-card {
  width: 100%;
  max-width: 440px;

  :deep(.k-card-body) {
    padding: 40px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: $kui-font-size-60;
  color: $kui-color-text-primary;
  margin: 16px 0 8px 0;
}

.login-logo {
  width: 200px;
}

.login-subtitle {
  color: $kui-color-text-disabled;
  margin: 0;
}

.login-input {
  width: 100%;
}

.form-field {
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
}

.token-toggle {
  margin-top: 16px;
}
</style>
