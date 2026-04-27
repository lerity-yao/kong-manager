<template>
  <div class="brand-logo">
    <router-link
      :to="{ name: 'workspace-overview', params: { workspace: 'default' } }"
      title="go to overview page"
    >
      <img
        src="@/assets/logo.svg?external"
        alt="Kong Manager Logo"
      >
    </router-link>
  </div>
</template>
