<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { loadData, state } from './state'
import Icon from './components/Icon.vue'
import { localToday } from './domain/periods'
import { needRefresh, activateUpdate } from './pwa'
let dateTimer: ReturnType<typeof setInterval>
function refreshDate() { state.today = localToday() }
function focusMain() { document.getElementById('main')?.focus() }
function preventLoss(event: BeforeUnloadEvent) { if (state.dirty) { event.preventDefault(); event.returnValue = '' } }
onMounted(() => { void loadData(); window.addEventListener('beforeunload', preventLoss); window.addEventListener('focus', refreshDate); dateTimer = setInterval(refreshDate, 30000) })
onUnmounted(() => { window.removeEventListener('beforeunload', preventLoss); window.removeEventListener('focus', refreshDate); clearInterval(dateTimer) })
</script>

<template>
  <a class="skip-link" href="#main" @click.prevent="focusMain">跳至主要內容</a>
  <header class="site-header">
    <nav class="nav-shell" aria-label="主要導覽">
      <RouterLink class="brand" to="/" aria-label="BonusTrack 首頁"><span class="brand-mark"><Icon name="cards" /></span>BonusTrack</RouterLink>
      <RouterLink class="nav-link" to="/settings"><Icon name="settings" /><span>資料與備份</span></RouterLink>
    </nav>
  </header>
  <main id="main" class="shell" tabindex="-1">
    <div class="toast" role="status" v-if="state.message"><Icon name="check" />{{ state.message }}<button aria-label="關閉通知" class="icon-button" @click="state.message = ''"><Icon name="close" /></button></div>
    <div class="update-banner" role="status" v-if="needRefresh"><p>有新版本可用，已儲存的紀錄會保留。</p><button class="text-button" :disabled="state.busy" @click="activateUpdate">更新應用程式</button></div>
    <div v-if="state.loading" class="loading" role="status"><div class="skeleton"></div><div class="skeleton"></div><p>正在讀取你的卡片…</p></div>
    <section v-else-if="state.loadError" class="empty-state" role="alert"><h1>暫時無法讀取資料</h1><p>{{ state.loadError }}</p><button class="button primary" @click="loadData">重新讀取</button><p class="muted">資料只存在這個瀏覽器，請勿清除網站資料。</p></section>
    <RouterView v-else v-slot="{ Component, route }"><component :is="Component" :key="route.fullPath" /></RouterView>
  </main>
</template>
