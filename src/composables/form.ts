import { onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { state } from '../state'

export function useForm() {
  const error = ref('')
  const dirty = () => { state.dirty = true; error.value = '' }
  onBeforeRouteLeave(() => !state.dirty || window.confirm('尚有未儲存的內容，確定離開？'))
  onUnmounted(() => { state.dirty = false })
  async function submit(action: () => Promise<void>) {
    error.value = ''
    try { await action() } catch (cause) { error.value = cause instanceof Error ? cause.message : '操作失敗，請重試。' }
  }
  return { error, dirty, submit }
}
