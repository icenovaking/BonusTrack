import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import CardDetail from './views/CardDetail.vue'
import CardForm from './views/CardForm.vue'
import ActivityForm from './views/ActivityForm.vue'
import PurchaseForm from './views/PurchaseForm.vue'
import Settings from './views/Settings.vue'
import './style.css'

const router = createRouter({ history: createWebHashHistory(), routes: [
  { path: '/', component: Home },
  { path: '/cards/new', component: CardForm },
  { path: '/cards/:cardId', component: CardDetail },
  { path: '/cards/:cardId/edit', component: CardForm },
  { path: '/cards/:cardId/activities/new', component: ActivityForm },
  { path: '/cards/:cardId/activities/:activityId/edit', component: ActivityForm },
  { path: '/cards/:cardId/purchases/new', component: PurchaseForm },
  { path: '/cards/:cardId/purchases/:purchaseId/edit', component: PurchaseForm },
  { path: '/settings', component: Settings },
  { path: '/:pathMatch(.*)*', redirect: '/' },
] })
createApp(App).use(router).mount('#app')
