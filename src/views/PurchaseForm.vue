<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { state, perform } from '../state'
import { repository } from '../data/repository'
import { parseMoney, inputMoney } from '../domain/money'
import { periodLabel, resolvePeriod } from '../domain/periods'
import { useForm } from '../composables/form'
import Icon from '../components/Icon.vue'
const route = useRoute(), router = useRouter()
const cardId = String(route.params.cardId), id = String(route.params.purchaseId ?? '')
const card = state.data.cards.find(value => value.id === cardId)
const existing = state.data.transactions.find(value => value.id === id && value.cardId === cardId)
const activities = computed(() => state.data.activities.filter(value => value.cardId === cardId && (!value.archived || value.id === existing?.activityId)))
const spentOn = ref(existing?.spentOn ?? state.today), amount = ref(existing ? inputMoney(existing.amountMinor) : ''), note = ref(existing?.note ?? '')
const activitySelection = ref(existing ? existing.activityId === null ? 'unassigned' : `activity:${existing.activityId}` : activities.value.length === 1 ? `activity:${activities.value[0]!.id}` : activities.value.length === 0 ? 'unassigned' : '')
const offset = ref(existing?.overridePeriodEnd && card ? [-1, 0, 1].find(value => resolvePeriod(card, existing.spentOn, value).end === existing.overridePeriodEnd) ?? 0 : 0)
const periods = computed(() => {
  try { return card ? [-1, 0, 1].map(value => ({ offset: value, period: resolvePeriod(card, spentOn.value, value) })) : [] } catch { return [] }
})
const { error, dirty, submit } = useForm()
async function save() {
  await submit(async () => {
    if (!card || (id && !existing)) throw new Error('找不到卡片或消費紀錄。')
    if (!activitySelection.value) throw new Error('請選擇一個加碼活動，或選擇不適用加碼。')
    const assignedPeriod = resolvePeriod(card, spentOn.value, offset.value)
    if (await perform(() => repository.saveTransaction({ id: existing?.id ?? crypto.randomUUID(), cardId, activityId: activitySelection.value === 'unassigned' ? null : activitySelection.value.slice('activity:'.length), spentOn: spentOn.value, amountMinor: parseMoney(amount.value, true), note: note.value.trim(), overridePeriodEnd: offset.value === 0 ? null : assignedPeriod.end }), existing ? '消費已更新，額度已重新計算' : '消費已記錄，額度已更新')) await router.push({ path: `/cards/${cardId}`, query: { period: assignedPeriod.end } })
  })
}
</script>
<template>
  <section class="form-page">
    <RouterLink class="back-link" :to="`/cards/${cardId}`"><Icon name="back" />返回卡片</RouterLink>
    <h1>{{ existing ? '編輯消費' : '新增消費' }}</h1><p class="lead">{{ card?.name }} · 記錄已發生的消費。</p>
    <form class="form-sheet" @submit.prevent="save" @input="dirty" @change="dirty">
      <label class="amount-field">消費金額（台幣）<div class="money-input"><span>NT$</span><input v-model="amount" inputmode="decimal" required placeholder="0" autocomplete="off" aria-label="消費金額（台幣）" /></div></label>
      <label>消費日期<input type="date" v-model="spentOn" :max="state.today" min="1900-01-01" required /></label>
      <label>適用加碼活動<select v-model="activitySelection" required><option disabled value="">請選擇活動</option><option v-for="activity in activities" :key="activity.id" :value="`activity:${activity.id}`">{{ activity.name }} · +{{ activity.bonusRateBasisPoints / 100 }}%{{ activity.archived ? '（已封存）' : '' }}</option><option value="unassigned">不適用加碼</option></select><span class="field-help">每筆最多選一個活動，不適用加碼的消費不扣額度。</span></label>
      <label>備註 <span class="optional">選填</span><input v-model="note" placeholder="例如：藥妝店、晚餐" maxlength="1000" /></label>
      <details class="period-adjust"><summary>調整所屬期別</summary><p class="field-help">依消費日期自動歸期。若銀行列入前一期或下一期，可在此調整。</p><label>所屬期別<select v-model="offset"><option v-for="option in periods" :key="option.offset" :value="option.offset">{{ option.offset === 0 ? '自動' : option.offset === -1 ? '前一期' : '下一期' }} · {{ periodLabel(option.period) }}</option></select></label></details>
      <p class="field-help" v-if="periods.length">將記入：{{ periodLabel(resolvePeriod(card!, spentOn, offset)) }}</p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <div class="form-actions"><button class="button primary" :disabled="state.busy || !card || (!existing && card.archived)"><Icon name="check" />{{ state.busy ? '儲存中…' : existing ? '儲存變更' : '儲存消費' }}</button></div>
    </form>
  </section>
</template>
