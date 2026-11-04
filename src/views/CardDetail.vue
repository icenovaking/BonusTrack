<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { state, perform } from '../state'
import { repository } from '../data/repository'
import { calculateRemaining, deriveSpendLimit, money } from '../domain/money'
import { periodEnding, periodLabel, resolvePeriod, purchasePeriod } from '../domain/periods'
import type { Activity, Purchase } from '../domain/models'
import Icon from '../components/Icon.vue'
const route = useRoute()
const cardId = String(route.params.cardId)
const card = computed(() => state.data.cards.find(value => value.id === cardId))
const chosenEnd = ref(String(route.query.period ?? ''))
const error = ref('')
const activities = computed(() => state.data.activities.filter(value => value.cardId === cardId))
const period = computed(() => {
  if (!card.value) return null
  try { return chosenEnd.value ? periodEnding(card.value, chosenEnd.value) : resolvePeriod(card.value, state.today) } catch { return resolvePeriod(card.value, state.today) }
})
const periodOptions = computed(() => {
  if (!card.value) return []
  const ends = new Set([resolvePeriod(card.value, state.today).end, ...(chosenEnd.value ? [period.value!.end] : [])])
  for (const purchase of state.data.transactions.filter(value => value.cardId === cardId)) ends.add(purchasePeriod(card.value, purchase).end)
  return [...ends].sort().reverse().map(end => periodEnding(card.value!, end))
})
const purchases = computed(() => state.data.transactions.filter(value => value.cardId === cardId && purchasePeriod(card.value!, value).end === period.value?.end).sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.id.localeCompare(a.id)))
const currentEnd = computed(() => period.value?.end ?? '')
const remaining = (activity: Activity) => calculateRemaining(deriveSpendLimit(activity), purchases.value.filter(value => value.activityId === activity.id))
const activityName = (purchase: Purchase) => activities.value.find(value => value.id === purchase.activityId)?.name ?? '不適用加碼'
async function action(operation: () => Promise<boolean | void>) { error.value = ''; try { await operation() } catch (cause) { error.value = cause instanceof Error ? cause.message : '操作失敗，請重試。' } }
async function archiveActivity(activity: Activity) { if (confirm(activity.archived ? '恢復使用此活動？' : '封存此活動並保留歷史紀錄？')) await action(() => perform(() => repository.saveActivity({ ...activity, archived: !activity.archived }), '活動狀態已更新')) }
async function removeActivity(activity: Activity) { if (confirm('確定刪除此活動？')) await action(() => perform(() => repository.deleteActivity(activity.id), '活動已刪除')) }
async function removePurchase(purchase: Purchase) { if (confirm(`刪除 ${purchase.spentOn} 的 NT$ ${money(purchase.amountMinor)} 消費？`)) await action(() => perform(() => repository.deleteTransaction(purchase.id), '消費已刪除，額度已更新')) }
</script>
<template>
  <section v-if="card && period">
    <div class="page-heading detail-heading">
      <div class="title-row"><h1>{{ card.name }}</h1><RouterLink class="text-button back-link" to="/"><Icon name="back" />我的卡片</RouterLink></div>
      <p v-if="card.archived" class="lead">已封存</p>
      <RouterLink class="button secondary" :to="`/cards/${cardId}/edit`"><Icon name="edit" />卡片設定</RouterLink>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="section-heading"><h2>加碼額度</h2><RouterLink v-if="!card.archived" class="text-button" :to="`/cards/${cardId}/activities/new`"><Icon name="plus" />新增活動</RouterLink></div>
    <label class="period-select">查看期別<select :value="currentEnd" @change="chosenEnd = ($event.target as HTMLSelectElement).value"><option v-for="option in periodOptions" :key="option.end" :value="option.end">{{ periodLabel(option) }}</option></select></label>
    <div class="detail-allowances" v-if="activities.length">
      <section class="activity-panel" v-for="activity in activities" :key="activity.id">
        <div class="activity-name"><h3>{{ activity.name }}</h3><span class="rate">{{ activity.archived ? '已封存' : `+${activity.bonusRateBasisPoints / 100}%` }}</span></div>
        <span class="amount-label">剩餘可刷</span><div class="amount" :class="{ exhausted: remaining(activity) === 0 }"><span>NT$</span> {{ money(remaining(activity)) }}</div>
        <p class="muted">本期上限 NT$ {{ money(deriveSpendLimit(activity)) }}</p>
        <p class="notice" v-if="remaining(activity) === 0">本期加碼已用完，下一筆建議換卡。</p>
        <details class="management"><summary>管理活動</summary><div class="management-actions"><RouterLink class="text-button" :to="`/cards/${cardId}/activities/${activity.id}/edit`">編輯</RouterLink><button class="text-button" :disabled="state.busy" @click="archiveActivity(activity)">{{ activity.archived ? '恢復使用' : '封存' }}</button><button v-if="!state.data.transactions.some(p => p.activityId === activity.id)" class="text-button danger" :disabled="state.busy" @click="removeActivity(activity)">刪除活動</button></div></details>
      </section>
    </div>
    <div class="empty-inline" v-else><h3>先加入一個加碼活動</h3><RouterLink v-if="!card.archived" class="button secondary" :to="`/cards/${cardId}/activities/new`">新增加碼活動</RouterLink></div>
    <div class="section-heading history-heading"><h2>消費紀錄 <span class="count">{{ purchases.length }}</span></h2><span class="muted">依消費日期排序</span></div>
    <div class="empty-inline" v-if="!purchases.length"><Icon name="wallet" /><h3>這一期還沒有消費</h3></div>
    <ul class="purchase-list" v-else><li v-for="purchase in purchases" :key="purchase.id"><div class="purchase-info"><span class="purchase-date">{{ purchase.spentOn.replaceAll('-', '/') }}<span v-if="purchase.overridePeriodEnd" class="manual-tag">手動歸期</span></span><strong>{{ activityName(purchase) }}</strong><p v-if="purchase.note">{{ purchase.note }}</p></div><div class="purchase-value"><strong>NT$ {{ money(purchase.amountMinor) }}</strong><div class="purchase-actions"><RouterLink class="text-button" :to="`/cards/${cardId}/purchases/${purchase.id}/edit`" :aria-label="`編輯 ${purchase.spentOn} 消費`">編輯</RouterLink><button class="text-button danger" :disabled="state.busy" @click="removePurchase(purchase)" :aria-label="`刪除 ${purchase.spentOn} 消費`">刪除</button></div></div></li></ul>
    <div class="mobile-action" v-if="!card.archived"><RouterLink class="button primary" :to="`/cards/${cardId}/purchases/new`"><Icon name="plus" />新增消費</RouterLink></div>
  </section>
  <section class="empty-state" v-else><div class="title-row"><h1>找不到卡片</h1><RouterLink class="text-button back-link" to="/" aria-label="返回我的卡片"><Icon name="back" />我的卡片</RouterLink></div></section>
</template>
