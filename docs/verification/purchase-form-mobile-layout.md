# 消費表單手機排版驗證

日期：2026-11-04。變更：purchase-form-mobile-layout。

## 實作與限制

- 消費表單新增 purchase-form 樣式掛點，單欄 Grid 使用 minmax(0, 1fr)，避免軌道由內容的固有尺寸撐開。
- 僅消費表單的手機儲存區改成 position: static；保留底部安全區留白、滿寬按鈕及原生日期 input。
- 沒有 .codegraph 索引，因此依專案指引略過 CodeGraph。沒有新增套件或修改日期、儲存、期別及額度計算邏輯。
- 使用者 FLOWOUT.jpg 為 iPhone 溢出與遮擋證據；本機未能重現 Safari 特有溢出，不能宣稱已確認其根因，也未加入未驗證的 WebKit 私有控制項樣式。

## 自動化結果

以下命令均退出 0：

- npm run typecheck
- npm run build（含 PWA 產物生成）
- npm run test:e2e -- tests/e2e/layout.spec.ts：2 passed (45.1s)
- git diff --check

執行環境為專案 Playwright 的 msedge channel（Chromium），不是 iOS Safari。測試使用 480 CSS px 高的短視窗；這只驗證較小可視區域，不會啟動手機作業系統鍵盤。

| 行為 | 測試證據 |
| --- | --- |
| 新增／編輯日期、活動、備註欄位對齊 | purchase form stays aligned and saves without floating over fields in creation and editing：320、375、390、430、768、1280 CSS px 邊框差各不超過 1 CSS px，頁面及表單無水平溢出 |
| 捲動及儲存不浮在欄位上 | 同測試：短視窗聚焦備註，儲存位於其下方；捲動前後按鈕位置變化符合文件捲動量，且非黏附定位，高度至少 48 CSS px |
| 旋轉／resize 後輸入保留 | 同測試：逐一縮放後金額、日期及備註保持不變 |
| 錯誤與日期限制 | 同測試：金額 0 顯示錯誤並保留備註；未來日期觸發 rangeOverflow；錯誤位於儲存之前 |
| 新增與編輯保存 | 同測試：100 元後額度 8,233，改成 200 元後額度 8,133；重新載入仍保持一筆紀錄與備註 |
| 其他動作位置保持原狀 | 同測試：卡片／活動表單 .form-actions 及詳情 .mobile-action 仍為 sticky |
| 既有 RWD 與放大文字 | RWD keeps card data and form actions usable at all target sizes and enlarged text 通過 |

視覺檢查：已檢視 .impeccable/review/purchase-form-create-390.png；日期、活動、備註左右對齊，期別與末端按鈕可見。編輯截圖為 .impeccable/review/purchase-form-edit-390.png。瀏覽器檢視工具因本機模組缺失無法連線，截圖由既有 Playwright 測試產生。

## iPhone 實機待驗證

目前未取得可控制的實際 iPhone；以下未執行，不視為通過。機型、iOS 版本、瀏覽器名稱及版本均待實機操作時填寫。

- 新增與編輯皆檢查：直向及橫向日期欄位不超出表單、左右對齊，無水平捲動。
- 開啟原生日期選擇器，選取日期並確認值更新及未來日期限制。
- 開啟金額與備註鍵盤，確認能捲到所有欄位及末端按鈕，按鈕沒有浮在欄位上。
- 展開期別、輸入無效金額、修正錯誤並儲存，確認錯誤提示可讀且資料與額度更新。
- 收起鍵盤後確認畫面和捲動正常，並檢查底部安全區留白。

部署端尚未更新或驗證。實機檢查應使用載入本次建置的版本，避免舊 PWA 快取影響判讀。
