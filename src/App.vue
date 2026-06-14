<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHomeRoute = computed(() => route.name === 'home')
const isNotesIndexRoute = computed(() => route.name === 'notes')
const isIdentityRoute = computed(() => route.name === 'identity')
</script>

<template>
  <div class="site-shell" :class="{ 'home-shell': isHomeRoute, 'notes-shell': isNotesIndexRoute, 'identity-shell': isIdentityRoute }">
    <a class="skip-link" href="#main">跳到正文</a>

    <header class="site-header">
      <div class="brand-block">
        <RouterLink class="brand-mark-link" to="/" aria-label="Caelix Orbit 首页">
          <span class="brand-mark">CLX</span>
        </RouterLink>
        <span class="brand-text">
          <RouterLink class="brand-name" to="/">Caelix</RouterLink>
          <RouterLink class="brand-domain" to="/">CaelixOrbit.space</RouterLink>
          <a class="brand-email" href="mailto:caelixorbit@gmail.com">caelixorbit@gmail.com</a>
        </span>
      </div>

      <nav class="site-nav" aria-label="主导航">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/notes">笔记</RouterLink>
        <RouterLink to="/contact">联系</RouterLink>
      </nav>
    </header>

    <main id="main" class="site-main">
      <RouterView />
    </main>

    <footer class="site-footer">
      <span>CaelixOrbit.space</span>
      <span>Today-I-Learned · Contact</span>
    </footer>
  </div>
</template>
