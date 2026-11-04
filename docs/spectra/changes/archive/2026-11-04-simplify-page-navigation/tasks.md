## 1. 核對既有修改並補齊介面

- [x] 1.1 核對並補齊「共用標題列與既有返回目的地」，使 Shared title-row return navigation 涵蓋卡片詳情、卡片新增／設定、活動與消費新增／編輯、備份設定及找不到卡片畫面；沿用 src/style.css 的 title-row/back-link 與既有 RouterLink，確認卡片詳情與新增活動右側對齊；以路由逐頁檢視與 npm run build 驗證，已符合的工作樹修改不重做。
- [x] 1.2 [after: 1.1] 核對並補齊「精簡文案並保留必要資訊」，使 Concise page shell and supporting copy 移除 src/App.vue 頁尾、舊頁尾 CSS 與規格列出的導讀，保留卡名、封存狀態、規則、錯誤及管理操作，首頁使用盾牌與「定期備份」；以逐頁文字核對及 npm run build 驗證，保留首頁單一新增卡片入口。
- [x] 1.3 [after: 1.2] 核對並補齊「離線狀態集中於備份頁」，使 Settings-local offline readiness and concise data guidance 在 src/views/Settings.vue 使用既有準備狀態呈現成功、準備中及重試訊息，保留本機資料提示、全量還原警告、確認及安裝指引；以設定頁狀態與還原流程檢視及 npm run build 驗證，不更動 src/pwa.ts 的快取邏輯。

## 2. 補齊回歸驗證

- [x] 2.1 [after: 1.3] 在 tests/e2e/layout.spec.ts 補齊 Shared title-row return navigation 的跨頁案例，覆蓋各目的地、缺失卡片、鍵盤焦點、長卡名、正常與 200% 文字在 320/390/768/1280 CSS px 的無重疊及無全頁橫向捲動、卡片詳情返回與新增活動右側對齊，以及未儲存表單取消／確認返回後的草稿與持久化結果；執行 npm run test:e2e -- tests/e2e/layout.spec.ts，保留既有消費儲存區正常捲動驗證。
- [x] 2.2 [after: 2.1] 在 tests/e2e/home-card-entry.spec.ts 及 tests/e2e/storage.spec.ts 對照 Concise page shell and supporting copy 與 Settings-local offline readiness and concise data guidance，補齊無頁尾、短備份提示、各準備狀態、保留還原警告與確認，以及快取完成後離線重開／新增消費／重載／匯出及匯入的案例；執行 npm run test:e2e -- tests/e2e/home-card-entry.spec.ts tests/e2e/storage.spec.ts 驗證，禁止等待已移除的頁尾訊息。

## 3. 同步設計紀錄並完成驗收

- [x] 3.1 [after: 2.2] 完成「跨頁驗證與設計索引同步」：對照實際頁面核對 DESIGN.md 與 .impeccable/design.json 的同列返回、無頁尾、短文案及設定頁離線狀態；保留現有設計方向，只有不一致處才更新，以 JSON 解析、來源／預覽內容比對及 git diff --check 驗證文件與元件預覽一致。
- [x] 3.2 [after: 3.1] 執行 npm run build、npm run test -- --run、指定 layout/home-card-entry/storage 瀏覽器測試及 npm run test:e2e 整體回歸；人工檢視手機與文字放大截圖，將各規格情境的結果、命令、執行時間與證據寫入 docs/verification/simplify-page-navigation.md；資源不足或逾時明列未完成，不以先前的 165 項單元測試紀錄或部分瀏覽器通過取代本輪驗收，不在未通過時勾選完成。
