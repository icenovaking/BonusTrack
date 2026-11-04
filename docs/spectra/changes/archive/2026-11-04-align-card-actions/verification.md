# 實作驗證紀錄

- npm run build：通過 TypeScript 檢查、Vite 正式打包及 PWA service worker 產生。
- npx playwright test tests/e2e/layout.spec.ts：6 項通過。涵蓋操作群組順序／唯一入口、鍵盤路由、封存卡片設定、全站次要操作透明底色、紅字刪除、主要動作綠底及互動／disabled 外觀；既有返回草稿、表單與 RWD 測試亦通過。
- 調整大字截圖的捲動位置後，單獨重跑 shared title-row 測試通過。這次只改截圖取得方式，未變更產品程式碼。
- 檢查寬度：320、390、768、1280 CSS px；根字級 16px 與 32px。數值為實際自動化測試條件。
- 畫面：.impeccable/review/align-card-actions-390-16.png、align-card-actions-390-32.png、align-card-actions-1280-16.png、align-card-actions-1280-32.png。大字截圖將操作列置於視窗中央，避免底部 sticky 新增消費按鈕影響截圖檢視。手機與桌面畫面已人工檢視。
- 執行環境：Windows 上的 Microsoft Edge／Chromium 無頭瀏覽器。未執行 iPhone 實機、Safari 引擎或正式部署驗證。

## 既有工作目錄範圍

活動表單 activity-form 類別、儲存區 position: static、DESIGN.md 的活動表單定位描述，以及 layout.spec.ts 對活動儲存區的檢查已在本次工作前存在，皆保留，不歸入本次新增功能。測試執行會重新產生既有畫面紀錄。

Spectra 回報 git_tracking_unavailable，因此每項任務使用明確檔案路徑記錄歸屬；同檔案中的先前修改仍需於提交時區分。
