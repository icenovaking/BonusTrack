export interface Card {
  id: string
  name: string
  cycleMode: 'calendar-month' | 'billing-day'
  closingDay: number | null
  archived: boolean
}
export interface Activity {
  id: string
  cardId: string
  name: string
  note: string
  rewardCapMinor: number
  bonusRateBasisPoints: number
  archived: boolean
}
export interface Purchase {
  id: string
  cardId: string
  activityId: string | null
  spentOn: string
  amountMinor: number
  note: string
  overridePeriodEnd: string | null
}
export interface Dataset { cards: Card[]; activities: Activity[]; transactions: Purchase[] }
export interface Backup extends Dataset { schemaVersion: 1; exportedAt: string }
export const emptyDataset = (): Dataset => ({ cards: [], activities: [], transactions: [] })
