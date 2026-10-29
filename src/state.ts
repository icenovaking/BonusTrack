import { reactive } from 'vue'
import { repository } from './data/repository'
import { emptyDataset, type Dataset } from './domain/models'
import { localToday } from './domain/periods'

export const state = reactive({ data: emptyDataset(), today: localToday(), loading: true, busy: false, loadError: '', message: '', dirty: false })
export async function loadData(): Promise<void> {
  state.loading = true; state.loadError = ''
  try { state.data = await repository.load() }
  catch (error) { state.loadError = error instanceof Error ? error.message : '無法讀取本機資料。' }
  finally { state.loading = false }
}
export async function perform(operation: () => Promise<Dataset>, message: string): Promise<boolean> {
  if (state.busy) return false
  state.busy = true
  try {
    state.data = await operation()
    state.message = message
    state.dirty = false
    return true
  } finally { state.busy = false }
}
