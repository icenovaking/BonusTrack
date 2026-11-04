## Summary

統一內頁返回按鈕的位置，精簡頁尾及重複說明，讓使用者在手機上快速查看額度與記帳。本變更屬介面調整（Refactor），沿用本次對話已完成但尚未提交的修改，補齊規格及驗證。

## Motivation

返回按鈕原本獨占標題上方一列，頁尾重複品牌與離線訊息，導讀文字增加垂直空間。使用者希望返回按鈕像「加碼額度／新增活動」一樣同列對齊，操作以圖示與短文字表達。

## Proposed Solution

- 卡片詳情、卡片新增／設定、活動新增／編輯、消費新增／編輯及資料與備份頁，將返回按鈕放在主標題同列靠右、垂直置中。找不到卡片的返回入口也使用相同配置。
- 返回按鈕使用箭頭與四字標籤「我的卡片」或「返回卡片」，保留原有返回目的地與未儲存變更確認。
- 卡片詳情返回連結與「新增活動」右側對齊，長標題換行，返回標籤不拆行。
- 移除全站頁尾的 BonusTrack 及離線狀態列；離線準備狀態集中於資料與備份頁。
- 移除重複導讀，首頁備份提醒簡化為盾牌圖示與「定期備份」。操作與狀態標籤優先採三至四字；必要欄位規則、錯誤、資料取代警告與安裝指引保留簡短完整句子。
- 更新設計文件及索引，補齊窄螢幕、長標題、文字放大、鍵盤導覽與離線回歸驗證。

### New Capabilities

無。

### Modified Capabilities

- bonus-tracking：新增標題同列返回導覽與精簡頁面呈現要求。
- local-data-portability：新增備份頁集中呈現離線狀態及必要警告的要求。

## Impact

- Affected specs: bonus-tracking, local-data-portability
- Affected code:
  - Modified: src/App.vue, src/style.css, src/views/Home.vue, src/views/CardDetail.vue, src/views/CardForm.vue, src/views/ActivityForm.vue, src/views/PurchaseForm.vue, src/views/Settings.vue, tests/e2e/layout.spec.ts, tests/e2e/home-card-entry.spec.ts, tests/e2e/storage.spec.ts, DESIGN.md, .impeccable/design.json
  - New: docs/verification/simplify-page-navigation.md
- 無新增套件、API、資料庫或備份格式變更；本提案階段只建立 Spectra 文件，不修改應用程式碼。
