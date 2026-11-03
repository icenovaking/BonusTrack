## 1. 首頁呈現與唯一入口

- [x] 1.1 完成 Concise home page presentation 與 Single home page card creation entry：在 src/views/Home.vue 實作「依目前列表切換唯一新增入口」及「首頁文字與空白間距局部精簡」，同步更新 tests/e2e/workflow.spec.ts 的首頁標題斷言；需要樣式時僅調整 src/style.css 的首頁使用中空白狀態專用類別。驗證使用中空白時只有中間入口，使用中有卡與所有封存檢視只有上方入口，皆名為「新增卡片」並導向 /cards/new；新標題及文字移除符合規格、封存提示與備份提醒保留。以 npm run typecheck、npm run build 及 npm run test:e2e -- tests/e2e/workflow.spec.ts 驗證，並目視確認空白框無空文字標籤且上下 padding 較設計記錄現況縮減。修改前遵循 AGENTS.md：有 .codegraph 索引則先做 codegraph_impact，沒有索引則不建立索引。

## 2. 狀態與版面驗收

- [x] 2.1 [after: 1.1] 新增 tests/e2e/home-card-entry.spec.ts 驗證新標題、三段文案不存在、使用中空白／有卡、封存空白／有卡各狀態均只有一個可操作新增入口且位置符合規格；驗證只剩封存卡片時切換列表會立即更換入口位置，以及每種狀態啟用入口皆到 /cards/new。使用具名且對應規格情境的測試，以 npm run test:e2e -- tests/e2e/home-card-entry.spec.ts tests/e2e/workflow.spec.ts 驗證。
- [x] 2.2 [after: 2.1] 完成首頁窄螢幕與放大文字驗收：在 320px、390px、768px、1280px 及 200% 文字尺寸檢查新標題換行、唯一新增入口可見且可鍵盤操作、無整頁水平捲動；檢查空白狀態留白縮減且封存提示未受首頁專用 CSS 影響。執行 npm run test:e2e -- tests/e2e/layout.spec.ts，並將實際目視結果與任何限制回報使用者。
