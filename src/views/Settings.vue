<script setup lang="ts">
import { ref } from 'vue'
import { state, perform } from '../state'
import { parseBackup, repository } from '../data/repository'
import type { Backup } from '../domain/models'
import Icon from '../components/Icon.vue'
import { canInstall, installApp, offlineReady, registrationError } from '../pwa'
const error = ref(''), preview = ref<Backup | null>(null)
async function exportData() {
  error.value = ''
  try {
    const backup = await repository.exportBackup()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `BonusTrack-${state.today}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    state.message = '備份檔已準備下載，請確認檔案已保存。'
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '無法匯出，請重試。' }
}
async function readBackup(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  error.value = ''; preview.value = null
  try { if (file) preview.value = parseBackup(await file.text()) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '無法讀取備份。' }
  finally { input.value = '' }
}
async function replaceData() {
  if (!preview.value || !confirm('將完整取代這個瀏覽器的所有卡片與消費紀錄，無法復原。確定繼續？')) return
  error.value = ''
  try { if (await perform(() => repository.replaceFromBackup(preview.value!), '備份已還原，額度已重新計算')) preview.value = null }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '還原失敗，原資料未變更。' }
}
</script>
<template>
  <section class="settings-page">
    <RouterLink class="back-link" to="/"><Icon name="back" />我的卡片</RouterLink>
    <h1>資料與備份</h1><p class="lead">讓記錄留得住，換手機也能帶著走。</p>
    <div class="info-strip"><Icon name="shield" /><p>資料只保存在這個瀏覽器。清除網站資料、換手機或瀏覽器儲存被回收，都可能遺失紀錄。請定期匯出備份。</p></div>
    <section class="settings-section"><h2>匯出備份</h2><p>下載完整 JSON 備份，包含卡片、活動與所有歷史消費。</p><button class="button secondary" :disabled="state.busy" @click="exportData"><Icon name="download" />匯出 JSON 備份</button></section>
    <section class="settings-section"><h2>從備份還原</h2><p>選擇之前匯出的 JSON 檔案，驗證後再確認取代。這個操作會取代全部資料，不會合併。</p><label class="file-label">選擇 JSON 備份<input type="file" accept=".json,application/json" @change="readBackup" :disabled="state.busy" /></label>
      <div class="import-preview" v-if="preview"><h3>備份已通過驗證</h3><p>{{ preview.cards.length }} 張卡片 · {{ preview.activities.length }} 個活動 · {{ preview.transactions.length }} 筆消費</p><p class="notice">還原後將完整取代目前資料。建議先匯出目前備份。</p><div class="inline-actions"><button class="button primary" :disabled="state.busy" @click="replaceData">{{ state.busy ? '還原中…' : '確認取代全部資料' }}</button><button class="button secondary" :disabled="state.busy" @click="preview = null">取消</button></div></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
    <section class="settings-section"><h2>加入手機主畫面</h2><p>像 App 一樣開啟 BonusTrack。{{ offlineReady ? '離線資源已準備完成，沒有網路也能查看與記帳。' : registrationError ? '離線資源尚未準備完成，請連線後重新開啟。' : '首次連線開啟並完成快取後，即可離線使用。' }}</p><button v-if="canInstall" class="button secondary" @click="installApp"><Icon name="plus" />安裝 BonusTrack</button><div v-else class="install-help"><p><strong>iPhone / iPad：</strong>在 Safari 開啟，選擇「分享」→「加入主畫面」。</p><p><strong>Android：</strong>在 Chrome 選單選擇「安裝應用程式」或「加到主畫面」。選項名稱依瀏覽器版本而異。</p></div><p class="muted">沒有安裝也能直接在瀏覽器使用。換瀏覽器前請先備份。</p></section>
    <section class="settings-section"><h2>使用說明</h2><p>本工具依你設定的回饋上限與加碼百分比估算可刷額度；不計算實際回饋金。銀行入帳期別不同時，可在消費紀錄中調整所屬期別。</p><p class="muted">只記錄卡片名稱即可，不需要輸入卡號或安全碼。</p></section>
  </section>
</template>
