## Problem

iPhone 消費表單的日期欄位向右溢出，與活動、備註欄位的左右留白不一致。手機鍵盤開啟時，儲存消費按鈕浮在欄位上，妨礙輸入與閱讀。

## Root Cause

src/style.css 的手機版 .form-actions 使用 position: sticky 與 bottom: 0，會讓表單末端動作黏附於可視區域。日期欄位已有 width、min-width、max-width 與 border-box；截圖證明溢出，但 iOS 原生日期控制項與 Grid 自動尺寸的實際作用尚需 Safari 重現，不能視為已確認根因。

## Proposed Solution

- 限制消費表單 Grid 和日期控制項的可用寬度，保留原生日期選擇器，使日期、活動、備註邊框對齊。
- 消費表單的儲存動作回到文件正常排版，位於期別、錯誤訊息之後並隨頁面捲動。
- 維持既有手機表單左右各 20px 內距與按鈕至少 48px 高度；這些是沿用設計的驗收值，非效能估計。
- Modified Capabilities: bonus-tracking，新增消費表單響應式寬度與不遮擋輸入的行為要求。
- New Capabilities: 無。

## Success Criteria

- 指定驗收寬度 320、375、390、430、768、1280 CSS px 下，新增與編輯消費表單無水平溢出，日期、活動、備註邊框對齊。
- 儲存動作位於表單末端且不黏附視窗；鍵盤開啟時可捲動存取全部欄位與按鈕。
- 原生日期選擇、必填與未來日期限制、新增與編輯後的資料及額度更新維持正常。
- 實機 iPhone 的瀏覽器版本、鍵盤開關與橫向檢查結果須記錄；未取得實機時明確標示待驗證。

## Impact

- Affected specs: docs/spectra/specs/bonus-tracking/spec.md
- Affected code:
  - Modified: src/style.css
  - Modified: src/views/PurchaseForm.vue
  - Modified: tests/e2e/layout.spec.ts
  - Modified: DESIGN.md
  - New: docs/verification/purchase-form-mobile-layout.md
  - Removed: 無
- 不新增套件，不變更資料結構或 API。
