<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { state, perform } from '../state'
import { repository } from '../data/repository'
import { parseMoney, parseRate, deriveSpendLimit, money, inputMoney } from '../domain/money'
import { useForm } from '../composables/form'
import Icon from '../components/Icon.vue'
const route = useRoute(), router = useRouter()
const cardId = String(route.params.cardId), id = String(route.params.activityId ?? '')
const card = state.data.cards.find(value => value.id === cardId)
const existing = state.data.activities.find(value => value.id === id && value.cardId === cardId)
const name = ref(existing?.name ?? ''), cap = ref(existing ? inputMoney(existing.rewardCapMinor) : ''), rate = ref(existing ? inputMoney(existing.bonusRateBasisPoints) : '')
const note = ref(existing?.note ?? '')
const locked = computed(() => state.data.transactions.some(value => value.activityId === id))
const preview = computed(() => { try { return money(deriveSpendLimit({ rewardCapMinor: parseMoney(cap.value), bonusRateBasisPoints: parseRate(rate.value) })) } catch { return '—' } })
const { error, dirty, submit } = useForm()
async function save() {
  await submit(async () => {
    if (!card || (id && !existing)) throw new Error('找不到卡片或活動。')
    if (await perform(() => repository.saveActivity({ id: existing?.id ?? crypto.randomUUID(), cardId, name: name.value, note: note.value, rewardCapMinor: parseMoney(cap.value), bonusRateBasisPoints: parseRate(rate.value), archived: existing?.archived ?? false }), '加碼活動已儲存')) await router.push(`/cards/${cardId}`)
  })
}
</script>
<template>
  <section class="form-page">
    <div class="title-row"><h1>{{ existing ? '編輯加碼活動' : '新增加碼活動' }}</h1><RouterLink class="text-button back-link" :to="`/cards/${cardId}`"><Icon name="back" />返回卡片</RouterLink></div>
    <p class="lead">{{ card?.name }}</p>
    <form class="form-sheet activity-form" @submit.prevent="save" @input="dirty">
      <label>活動名稱<input v-model="name" required maxlength="100" placeholder="例如：日本指定商店" /></label>
      <label for="activity-note">備註（選填）<textarea id="activity-note" v-model="note" rows="3" aria-describedby="activity-note-help" /></label>
      <p id="activity-note-help" class="field-help activity-note-help">會顯示在首頁此活動下方</p>
      <div class="field-grid"><label>回饋上限（台幣）<input v-model="cap" :disabled="locked" required inputmode="decimal" placeholder="例如：500" /></label><label>加碼百分比（%）<input v-model="rate" :disabled="locked" required inputmode="decimal" placeholder="例如：6" /></label></div>
      <div class="calculation"><span>每期可刷上限</span><strong>NT$ {{ preview }}</strong><p>回饋上限 ÷ 加碼百分比，無條件捨去至整元。</p></div>
      <p class="field-help">只填「加碼」百分比，不包含基本回饋。活動沿用這張卡的計算週期。</p>
      <p v-if="locked" class="notice">已有消費紀錄，上限與百分比已鎖定。優惠變更時，請封存舊活動並新增活動。</p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <div class="form-actions"><button class="button primary" :disabled="state.busy">{{ state.busy ? '儲存中…' : '儲存活動' }}</button></div>
    </form>
  </section>
</template>
