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
const existing = state.data.cards.find(card => card.id === id)
const name = ref(existing?.name ?? '')
const mode = ref<Card['cycleMode']>(existing?.cycleMode ?? 'billing-day')
const day = ref(existing?.closingDay ?? 15)
const locked = computed(() => state.data.transactions.some(purchase => purchase.cardId === id))
const { error, dirty, submit } = useForm()
async function save() {
  await submit(async () => {
    if (id && !existing) throw new Error('找不到這張卡片。')
    const cardId = existing?.id ?? crypto.randomUUID()
    if (await perform(() => repository.saveCard({ id: cardId, name: name.value, cycleMode: mode.value, closingDay: mode.value === 'billing-day' ? Number(day.value) : null, archived: existing?.archived ?? false }), '卡片已儲存')) await router.push(`/cards/${cardId}`)
  })
}
</script>
<template>
  <section class="form-page">
    <RouterLink class="back-link" :to="existing ? `/cards/${id}` : '/' "><Icon name="back" />返回{{ existing ? '卡片' : '我的卡片' }}</RouterLink>
    <h1>{{ existing ? '編輯卡片' : '新增卡片' }}</h1><p class="lead">先設定卡片，再加入你想追蹤的加碼活動。</p>
    <form class="form-sheet" @submit.prevent="save" @input="dirty" @change="dirty">
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
  </section>
</template>
