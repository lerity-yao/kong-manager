<template>
  <div v-if="authStore.isLoggedIn" class="user-menu">
    <div class="user-avatar" @click="showMenu = !showMenu">
      {{ avatarText }}
    </div>
    <div v-if="showMenu" class="user-dropdown">
      <div class="user-info">
        <div class="user-name">{{ authStore.currentUser?.username }}</div>
        <div class="user-role">{{ roleText }}</div>
      </div>
      <hr />
      <button class="logout-btn" @click="handleLogout">
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'UserMenu' })

const router = useRouter()
const authStore = useAuthStore()
const showMenu = ref(false)

const avatarText = computed(() => {
  const name = authStore.currentUser?.username || ''
  return name.charAt(0).toUpperCase()
})

const roleText = computed(() => {
  const roles = authStore.userRoles
  if (roles.includes('super-admin')) return 'Super Admin'
  if (roles.includes('admin')) return 'Admin'
  if (roles.includes('read-only')) return 'Read Only'
  return roles.join(', ') || 'User'
})

async function handleLogout() {
  showMenu.value = false
  await authStore.logout()
  router.push({ name: 'login' })
}

// Close dropdown when clicking outside
function onClickOutside() {
  showMenu.value = false
}

// Add click outside listener
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement
    if (!target.closest('.user-menu')) {
      showMenu.value = false
    }
  })
}
</script>

<style scoped>
.user-menu {
  position: relative;
  margin-left: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1152cb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  padding: 12px 0;
}

.user-info {
  padding: 8px 16px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #6c7489;
  margin-top: 2px;
}

hr {
  border: none;
  border-top: 1px solid #e4e7ec;
  margin: 8px 0;
}

.logout-btn {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #ce4d5b;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #f8f9fa;
}
</style>
