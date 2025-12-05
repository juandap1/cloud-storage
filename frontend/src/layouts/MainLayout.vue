<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-transparent text-white q-py-sm" style="backdrop-filter: blur(10px)">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold row items-center">
          <q-icon name="cloud_queue" size="28px" class="q-mr-sm text-primary" />
          <span class="text-h6 text-primary text-weight-light">BRAN</span>
          <span class="text-h6" style="letter-spacing: 1px">CLOUD</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainLayout',

  setup() {
    return {}
  },
})
</script>

<style>
body {
  background-color: #121212;
  /* Or use Quasar's bg-dark-page class, but explicit is safe for override */
}
</style>
