## 1. 修正消費表單

- [x] 1.1 實作「日期欄位限制在表單可用寬度」以滿足 Responsive purchase form access：在 src/style.css 與必要的 src/views/PurchaseForm.vue 專用掛點限制 Grid 與原生日期欄位，保留 spentOn、日期驗證及儲存流程；用新增與編輯表單在 320、375、390、430、768、1280 CSS px 比較日期、活動、備註左右邊框差各不超過 1 CSS px，並確認表單及頁面無水平溢出。先檢查 .codegraph 是否存在；存在時修改前執行 codegraph_impact，不存在則記錄略過。Safari 無法重現時記錄已知證據與限制。
- [x] 1.2 [after: 1.1] 實作「儲存動作回到表單正常排版」以滿足 Unobstructed purchase submission：只取消消費表單的黏附動作，保留滿寬、至少 48 CSS px 高的按鈕及末端留白；縮短可視高度並捲動新增與編輯表單，確認按鈕非 sticky/fixed，期別、錯誤與欄位可存取且不被按鈕覆蓋。回查卡片、活動表單及卡片詳情 .mobile-action，確認未被本次樣式改動影響。

## 2. 驗證與交接

- [x] 2.1 [after: 1.2] 擴充 tests/e2e/layout.spec.ts，驗證 Responsive purchase form access 與 Unobstructed purchase submission 的新增、編輯、指定寬度、縮短高度、展開期別與錯誤修正後儲存情境；檢查保存後資料與額度更新、resize 後輸入保留，使用邊框量測及捲動前後位置確認無溢出與浮動遮擋。執行 npm run typecheck、npm run build，再執行 npm run test:e2e -- tests/e2e/layout.spec.ts，記錄結果與瀏覽器引擎；這些檢查不代替實機鍵盤驗證。
- [x] 2.2 [after: 2.1] 在 docs/verification/purchase-form-mobile-layout.md 記錄實際 iPhone 機型、OS、瀏覽器版本及直向／橫向、鍵盤開關、原生日期選擇、備註輸入、展開期別與錯誤後重試的結果，新增與編輯皆須能捲到儲存且無遮擋；若無設備，明確保留待驗證項目而不宣稱通過。更新 DESIGN.md 描述消費表單正常排版的儲存位置，內容審閱確認未將此規則推廣到其他表單，且驗證紀錄清楚區分自動化、實機與未驗證範圍。
