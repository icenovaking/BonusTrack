## 1. 卡片詳情排列與共用按鈕外觀

- [x] 1.1 實現 Grouped card detail actions 的「集中卡片設定與新增活動」及「操作群組靠右與窄螢幕換行」：在 src/views/CardDetail.vue 與 src/style.css 將唯一卡片設定入口移至新增活動前，採相同文字按鈕；封存卡片保留設定並隱藏新增活動，維持路由、完整標籤與右側對齊。以使用中／封存卡片畫面、鍵盤導覽及窄螢幕換行人工核對，並執行 npm run build 確認可編譯。
- [x] 1.2 [after: 1.1] 實現 Shared secondary action presentation 的「共用次要操作透明底色」：在 src/style.css 取消 text-button、nav-link、secondary 及 danger 變體常駐底色，保留次要細邊框、紅字、hover／active／focus-visible／disabled 回饋與 primary 綠底。以首頁、卡片設定／詳情與資料備份頁未互動狀態的背景計算值及互動狀態人工核對，執行 npm run build。

## 2. 驗證與設計紀錄

- [x] 2.1 [after: 1.2] 擴充 tests/e2e/layout.spec.ts，驗證 Grouped card detail actions 的唯一入口、順序、既有路由、封存可見性與鍵盤操作，以及 Shared secondary action presentation 在返回、管理、刪除、備份操作中的透明預設底色與主要按鈕綠底；使用 320／390／768／1280 CSS px、16px／32px 根字級與長卡名確認不重疊、不橫向捲動且保留右界對齊。在 .impeccable/review/align-card-actions-*.png 保存代表性手機／桌面／大字畫面並實際檢視；執行 npm run build 與 npx playwright test tests/e2e/layout.spec.ts，記錄實際結果及未驗證的 iPhone 實機限制。
- [x] 2.2 [after: 2.1] 更新 DESIGN.md 記錄「集中卡片設定與新增活動」、「操作群組靠右與窄螢幕換行」及「共用次要操作透明底色」的最終規則；與已通過的畫面及樣式逐項比對，執行 git diff --check，確認不回復既有活動／消費儲存區修正且不混入業務層變更。
