import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { state } from './state'

interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
const installPrompt = ref<InstallPrompt | null>(null)
export const offlineReady = ref(false)
export const registrationError = ref(false)
export const isOnline = ref(navigator.onLine)
const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onOfflineReady() { offlineReady.value = true },
  onRegisteredSW(_url, registration) {
    if (registration?.active) void navigator.serviceWorker.ready.then(() => { offlineReady.value = true })
  },
  onRegisterError() { registrationError.value = true },
})
export { needRefresh }
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt.value = event as InstallPrompt })
window.addEventListener('appinstalled', () => { installPrompt.value = null })
window.addEventListener('online', () => { isOnline.value = true })
window.addEventListener('offline', () => { isOnline.value = false })
export const canInstall = installPrompt
export async function installApp() {
  if (!installPrompt.value) return
  const prompt = installPrompt.value
  await prompt.prompt(); await prompt.userChoice
  installPrompt.value = null
}
export async function activateUpdate() {
  if (state.busy) return
  if (state.dirty && !window.confirm('表單尚未儲存。確定放棄輸入並更新應用程式？')) return
  state.dirty = false
  try { await updateServiceWorker(true) }
  catch { state.message = '更新失敗，已儲存的資料仍保留。請稍後重試。' }
}
