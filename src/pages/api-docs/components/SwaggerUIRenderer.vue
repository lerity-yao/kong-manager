<template>
  <div ref="containerRef" class="swagger-ui-renderer" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist'
import 'swagger-ui-dist/swagger-ui.css'

interface Props {
  spec: Record<string, any>
  debugMode?: 'gateway' | 'direct'
  gatewayUrl?: string
  upstreamUrl?: string
  customHeaders?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  debugMode: 'gateway',
  gatewayUrl: '',
  upstreamUrl: '',
  customHeaders: () => ({}),
})

const containerRef = ref<HTMLElement>()
let swaggerInstance: any = null

// Dynamically inject host based on debug mode
const injectedSpec = computed(() => {
  const s = JSON.parse(JSON.stringify(props.spec))
  if (props.debugMode === 'gateway' && props.gatewayUrl) {
    try {
      const url = new URL(props.gatewayUrl)
      s.host = url.host
      s.schemes = [url.protocol.replace(':', '')]
    } catch {
      s.host = props.gatewayUrl
    }
  } else if (props.debugMode === 'direct' && props.upstreamUrl) {
    try {
      const url = new URL(props.upstreamUrl)
      s.host = url.host
      s.schemes = [url.protocol.replace(':', '')]
      if (url.pathname && url.pathname !== '/') {
        s.basePath = url.pathname
      }
    } catch {
      s.host = props.upstreamUrl
    }
  }
  return s
})

function renderSwagger() {
  if (!containerRef.value) return

  // Clear previous instance
  containerRef.value.innerHTML = ''

  swaggerInstance = SwaggerUIBundle({
    spec: injectedSpec.value,
    domNode: containerRef.value,
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      ...Array.isArray(SwaggerUIStandalonePreset)
        ? SwaggerUIStandalonePreset
        : [...SwaggerUIStandalonePreset],
    ],
    layout: 'StandaloneLayout',
    requestInterceptor: (request: any) => {
      // Inject custom headers
      Object.entries(props.customHeaders).forEach(([key, value]) => {
        request.headers[key] = value
      })
      return request
    },
  })
}

onMounted(() => {
  renderSwagger()
})

watch(injectedSpec, () => {
  renderSwagger()
})

watch(() => props.customHeaders, () => {
  // Headers are applied via requestInterceptor, no re-render needed
}, { deep: true })

onBeforeUnmount(() => {
  if (swaggerInstance) {
    swaggerInstance = null
  }
})
</script>

<style lang="scss">
.swagger-ui-renderer {
  width: 100%;

  .swagger-ui {
    .wrapper {
      max-width: 100%;
    }
  }
}
</style>
