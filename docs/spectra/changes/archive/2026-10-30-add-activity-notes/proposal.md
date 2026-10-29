## Why

使用者需要在首頁查看加碼活動時，同時看到登錄要求、適用通路等自行設定的提醒。目前活動只有名稱與額度設定，無法保存這類說明。

## What Changes

- 在新增與編輯加碼活動提供選填的多行純文字備註。
- 首頁在各活動名稱下方顯示備註；空白時不占空間，長文字與換行完整呈現。
- 已有消費紀錄的活動仍可修改備註，不影響上限、期別、消費或剩餘額度。
- 備註保存在本機，隨 JSON 備份匯出與還原；舊資料缺少備註時視為空白。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `bonus-tracking`: 活動備註的設定、獨立修改及首頁顯示。
- `local-data-portability`: 活動備註持久化、備份往返及舊資料相容。

## Impact

- src/domain/models.ts、src/data/repository.ts：活動資料與相容性驗證。
- src/views/ActivityForm.vue、src/views/Home.vue、src/style.css：輸入與首頁呈現。
- tests/repository.test.ts、tests/e2e/activity-notes.spec.ts：資料與使用流程驗證。
- README.md、docs/verification/add-activity-notes.md：操作說明與實際驗證紀錄。
- 沿用現有 Vue、IndexedDB 與備份流程，不新增套件或後端。
