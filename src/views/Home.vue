<script setup lang="ts">
import { computed, ref } from 'vue'
import { state } from '../state'
import { calculateRemaining, deriveSpendLimit, money } from '../domain/money'
import { periodLabel, resolvePeriod, purchasePeriod } from '../domain/periods'
import type { Activity, Card } from '../domain/models'
import Icon from '../components/Icon.vue'
const showArchived = ref(false)
const cards = computed(() => state.data.cards.filter(card => card.archived === showArchived.value))
const activities = (card: Card) => state.data.activities.filter(activity => activity.cardId === card.id && !activity.archived)
function remaining(card: Card, activity: Activity) {
  const end = resolvePeriod(card, state.today).end
  return calculateRemaining(deriveSpendLimit(activity), state.data.transactions.filter(purchase => purchase.activityId === activity.id && purchasePeriod(card, purchase).end === end))
}
</script>
<template>
  <section>
    <div class="page-heading"><div><h1>我的卡片</h1><p class="lead">出發前看一眼，讓每筆消費都在加碼範圍內。</p></div><RouterLink class="button primary" to="/cards/new"><Icon name="plus" />新增卡片</RouterLink></div>
    <div class="list-toolbar"><span>{{ showArchived ? '已封存' : '使用中' }} <span class="count">{{ cards.length }}</span></span><button class="text-button" @click="showArchived = !showArchived">{{ showArchived ? '查看使用中卡片' : '查看已封存卡片' }}</button></div>
    <div v-if="!cards.length" class="empty-state">
      <span class="empty-icon"><Icon :name="showArchived ? 'archive' : 'wallet'" /></span>
      <h2>{{ showArchived ? '還沒有封存卡片' : '把你的第一張卡加進來' }}</h2>
      <p>{{ showArchived ? '封存後的卡片與消費紀錄會留在這裡。' : '設定回饋上限與加碼百分比，剩下的額度交給這裡記。' }}</p>
      <RouterLink v-if="!showArchived" class="button primary" to="/cards/new"><Icon name="plus" />新增第一張卡片</RouterLink>
    </div>
    <div v-else class="card-grid">
      <RouterLink v-for="(card, index) in cards" :key="card.id" :to="`/cards/${card.id}`" class="credit-card" :aria-label="`查看 ${card.name}`" :aria-describedby="`card-description-${index}`">
        <span class="sr-only" :id="`card-description-${index}`">{{ periodLabel(resolvePeriod(card, state.today)) }}。<template v-for="activity in activities(card)" :key="activity.id">{{ activity.name }}，<template v-if="activity.note">備註：{{ activity.note }}。</template>剩餘可刷台幣 {{ money(remaining(card, activity)) }} 元，本期上限 {{ money(deriveSpendLimit(activity)) }} 元。{{ remaining(card, activity) === 0 ? '已用完，建議換卡。' : '' }}</template></span>
        <div class="card-heading"><span class="card-symbol"><Icon name="cards" /></span><h2>{{ card.name }}</h2><Icon name="arrow" /></div>
        <p class="period-caption">{{ periodLabel(resolvePeriod(card, state.today)) }}</p>
        <div v-if="!activities(card).length" class="card-no-activity">{{ card.archived ? '查看保留的活動與消費紀錄' : '還沒有加碼活動，點此開始設定' }}</div>
        <div v-for="activity in activities(card)" :key="activity.id" class="allowance-row">
          <div class="activity-name"><span>{{ activity.name }}</span><span class="rate">+{{ activity.bonusRateBasisPoints / 100 }}%</span></div>
          <p v-if="activity.note" class="activity-note">{{ activity.note }}</p>
          <span class="amount-label">剩餘可刷</span><div class="amount" :class="{ exhausted: remaining(card, activity) === 0 }"><span>NT$</span> {{ money(remaining(card, activity)) }}</div>
          <div class="allowance-foot"><span>本期上限 NT$ {{ money(deriveSpendLimit(activity)) }}</span><span v-if="remaining(card, activity) === 0" class="exhausted">已用完，建議換卡</span></div>
        </div>
        <div class="card-link">查看紀錄 / 新增消費<Icon name="arrow" /></div>
      </RouterLink>
    </div>
    <p class="local-note"><Icon name="shield" />資料保存在這個瀏覽器，記得定期匯出備份。</p>
  </section>
</template>
