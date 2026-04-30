<template>
  <footer class="make-wish-wrapper">
    <a
      href="https://github.com/lerity-yao/kong"
      target="_blank"
      rel="noopener noreferrer"
    >
      Copyright © {{ year }} yaox · GitHub
    </a>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped lang="scss">
.make-wish-wrapper {
  text-align: center;
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;

  a {
    display: inline-flex;
    color: #000000;
    text-decoration: none;
    opacity: 0.5;
    border-bottom: 1px solid rgba(0, 0, 0, 0.5);
    transition: 0.3s;
  }

  a:hover {
    text-decoration: none;
    opacity: 0.75;
    border-bottom: 1px solid rgba(0, 0, 0, 0.75);
  }
}
</style>
