<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { state, perform } from '../state'
import { repository } from '../data/repository'
import type { Card } from '../domain/models'
import { useForm } from '../composables/form'
import Icon from '../components/Icon.vue'
const route = useRoute(), router = useRouter()
const id = String(route.params.cardId || '')
const existing = computed(() => state.data.cards.find(card => card.id === id))
const name = ref(existing.value?.name ?? '')
const mode = ref<Card['cycleMode']>(existing.value?.cycleMode ?? 'billing-day')
const day = ref(existing.value?.closingDay ?? 15)
const locked = computed(() => state.data.transactions.some(purchase => purchase.cardId === id))
const { error, dirty, submit } = useForm()
async function save() {
  await submit(async () => {
    if (id && !existing.value) throw new Error('找不到這張卡片。')
    const cardId = existing.value?.id ?? crypto.randomUUID()
    if (await perform(() => repository.saveCard({ id: cardId, name: name.value, cycleMode: mode.value, closingDay: mode.value === 'billing-day' ? Number(day.value) : null, archived: existing.value?.archived ?? false }), '卡片已儲存')) await router.push(`/cards/${cardId}`)
  })
}
function confirmManagement(message: string) {
  return confirm(message + (state.dirty ? '\n尚未儲存的修改不會儲存。' : ''))
}
async function toggleArchive() {
  if (state.busy) return
  await submit(async () => {
    const saved = existing.value
    if (!saved) throw new Error('找不到這張卡片。')
    const message = saved.archived ? '恢復後可新增消費與活動；已封存的活動仍維持封存。確定恢復使用這張卡片？' : '封存後停止新增消費與活動，歷史紀錄會保留。確定封存？'
    if (!confirmManagement(message)) return
    if (await perform(() => repository.saveCard({ ...saved, archived: !saved.archived }), '卡片狀態已更新')) await router.push(`/cards/${id}`)
  })
}
async function removeCard() {
  if (state.busy) return
  await submit(async () => {
    if (!existing.value) throw new Error('找不到這張卡片。')
    if (!confirmManagement('確定刪除這張卡片及其所有活動？此操作無法復原。')) return
    if (await perform(() => repository.deleteCard(id), '卡片已刪除')) await router.push('/')
  })
}
</script>
<template>
  <section v-if="!id || existing" class="form-page">
    <div class="title-row"><h1>{{ existing ? '卡片設定' : '新增卡片' }}</h1><RouterLink class="text-button back-link" :to="existing ? `/cards/${id}` : '/' " :aria-label="existing ? '返回卡片' : '返回我的卡片'"><Icon name="back" />{{ existing ? '返回卡片' : '我的卡片' }}</RouterLink></div>
    <form class="form-sheet" :class="{ 'card-settings-form': existing }" @submit.prevent="save" @input="dirty" @change="dirty">
      <label>卡片名稱<input v-model="name" required maxlength="100" placeholder="例如：玉山熊本熊卡" autocomplete="off" /></label>
      <fieldset :disabled="locked"><legend>額度計算週期</legend>
        <label class="radio-row"><input type="radio" v-model="mode" value="billing-day" />自訂結帳日<span class="muted">跟著卡片帳單計算</span></label>
        <label class="radio-row"><input type="radio" v-model="mode" value="calendar-month" />日曆月<span class="muted">每月 1 日開始</span></label>
        <label v-if="mode === 'billing-day'">每月結帳日<select v-model="day"><option v-for="date in 31" :key="date" :value="date">每月 {{ date }} 日</option></select><span class="field-help">結帳日當天仍屬本期；月份不足時取最後一天。</span></label>
      </fieldset>
      <p v-if="locked" class="notice">已有消費紀錄，週期設定已鎖定，以保留歷史。需要不同週期時請新增卡片。</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="form-actions"><button class="button primary" :disabled="state.busy">{{ state.busy ? '儲存中…' : '儲存卡片' }}</button></div>
    </form>
    <section v-if="existing" class="management card-management" aria-labelledby="card-management-heading">
      <h2 id="card-management-heading">卡片管理</h2>
      <div class="management-actions"><button type="button" class="text-button" :disabled="state.busy" @click="toggleArchive">{{ existing.archived ? '恢復使用卡片' : '封存卡片' }}</button><button v-if="!locked" type="button" class="text-button danger" :disabled="state.busy" @click="removeCard">刪除卡片</button></div>
      <p v-if="locked">已有消費紀錄，請改用封存</p>
    </section>
  </section>
  <section v-else class="empty-state"><div class="title-row"><h1>找不到這張卡片</h1><RouterLink class="text-button back-link" to="/" aria-label="返回我的卡片"><Icon name="back" />我的卡片</RouterLink></div><p class="error" role="alert">找不到這張卡片。</p></section>
</template>
