## Problem

卡片設定頁的「儲存卡片」在手機上仍會吸附於畫面底部，違反使用者要它留在表單原位的操作預期。活動加碼追蹤的牌卡已可整張點擊，底部「查看紀錄 / 新增消費」提示列重複表達入口。

## Root Cause

src/views/CardForm.vue 的儲存區使用 .form-actions；src/style.css 在手機斷點對該類別設定 position: sticky，排除規則僅涵蓋消費與活動表單。src/views/Home.vue 在整張 RouterLink 內另外渲染 .card-link 提示列。

## Proposed Solution

- 僅在現有卡片的「卡片設定」頁，讓儲存區使用正常文件流，留在表單欄位與錯誤訊息之後、卡片管理之前；捲動時可離開可視範圍。
- 移除首頁使用中與已封存牌卡底部「查看紀錄 / 新增消費」整列及該列箭頭，保留標題旁箭頭、完整牌卡連結與輔助閱讀描述。

## Success Criteria

- 卡片設定儲存區在手機與桌面皆不使用 sticky 或 fixed；短視窗捲動時按鈕隨表單內容移動。
- 卡片名稱可儲存並在重新載入後保留；管理區操作及錯誤呈現保持原有行為。
- 首頁所有牌卡不呈現重複提示列；滑鼠、觸控及鍵盤仍可從牌卡進入對應明細。

## Impact

- Affected code:
  - Modified: src/views/CardForm.vue, src/views/Home.vue, src/style.css, tests/e2e/card-settings.spec.ts, tests/e2e/home-card-entry.spec.ts
  - New: none
  - Removed: none
- Modified Capabilities: bonus-tracking（既有能力新增卡片設定正常捲動與簡化牌卡入口的呈現要求）。
- New Capabilities: none
- 不涉及 API、相依套件或資料格式變更。
