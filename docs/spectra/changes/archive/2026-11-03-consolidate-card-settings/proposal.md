## Summary

將卡片資料編輯、封存、恢復使用與刪除集中於「卡片設定」，移除卡片詳情頁底部的「管理這張卡片」。本次為介面流程重整，保留既有歷史資料保護規則。

## Motivation

目前卡片詳情頁的「編輯卡片」與消費紀錄下方的管理區塊分散同一張卡片的設定操作。統一入口可讓使用者集中處理卡片設定，詳情頁則專注於額度、活動與記帳。

## Proposed Solution

- 詳情頁入口與既有卡片編輯頁標題統一為「卡片設定」，沿用 /cards/:cardId/edit 路徑。
- 設定頁上方保留名稱、計算週期與儲存按鈕；表單外下方以分隔線安排封存／恢復使用及紅色刪除操作。
- 有任何歷史消費時不提供可執行的刪除按鈕，顯示「已有消費紀錄，請改用封存」。無歷史消費才可確認刪除卡片及其活動。
- 管理操作使用已儲存資料，不自動儲存草稿；確認訊息說明草稿不會儲存。取消或失敗保留草稿，成功封存／恢復返回卡片詳情，成功刪除返回首頁。
- 新增卡片維持原有流程且不顯示管理操作；活動管理維持原位置。

## Impact

- Affected specs: bonus-tracking（新增集中卡片設定與獨立管理操作的可觀察行為；保留既有歷史保護需求）
- Affected code:
  - Modified: src/views/CardDetail.vue, src/views/CardForm.vue, src/style.css（僅在既有樣式無法支援分隔與排版時）, tests/e2e/coverage.spec.ts
  - New: tests/e2e/card-settings.spec.ts, docs/verification/consolidate-card-settings.md（實作時記錄驗證證據）
  - Removed: none
- 沿用 src/data/repository.ts 的 saveCard、deleteCard 與 src/state.ts 的 perform，不更動資料格式、路由定義、套件依賴或部署設定。
