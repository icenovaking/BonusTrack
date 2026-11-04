## 1. 卡片設定儲存區

- [x] 1.1 實現 Card settings save action follows document scrolling 與「卡片設定專用正常文件流」：在 src/views/CardForm.vue 依現有卡片狀態加入專用標記，在 src/style.css 僅對設定頁取消 .form-actions 吸附，保留 form 內的提交按鈕位置。於 tests/e2e/card-settings.spec.ts 加入手機及桌面短視窗捲動驗收，先確認實際 scrollY 增加，再確認儲存區隨表單移動且不覆蓋管理區，同時確認 position 為 static。以鍵盤儲存更新名稱、重新載入確認持久化，模擬儲存失敗確認 alert、草稿保留與重試；回歸新增卡片原定位與建立流程。執行 npm run typecheck、npm run build 及 npm run test:e2e -- tests/e2e/card-settings.spec.ts；瀏覽器須使用此工作區新建置。

## 2. 首頁牌卡簡化

- [x] 2.1 [after: 1.1] 實現 Home cards provide concise whole-card navigation 與「移除牌卡底部重複入口」：src/views/Home.vue 移除 .card-link 容器、提示與其中箭頭，保留標題箭頭、RouterLink、輔助閱讀描述、活動額度與無活動提示。搜尋確認無其他使用點後才移除 src/style.css 的專用 .card-link 規則。於 tests/e2e/home-card-entry.spec.ts 加入使用中／已封存及有／無活動案例，驗收提示列不存在、標題箭頭及資訊保留、牌卡內容區點擊與連結聚焦後 Enter 均導向該卡明細；以手機觸控模式驗收牌卡點擊。執行 npm run typecheck、npm run build 及 npm run test:e2e -- tests/e2e/home-card-entry.spec.ts。

## 3. 整合驗收

- [x] 3.1 [after: 2.1] 執行 npm run typecheck、npm run build、npm run test:e2e -- tests/e2e/card-settings.spec.ts tests/e2e/home-card-entry.spec.ts，確認儲存、管理、新增卡片及首頁原有入口檢查通過。於 320px、390px 與 1280px 寬度目視確認無整頁水平溢出，短視窗設定頁儲存區不吸附且不遮擋管理區，首頁無底部提示空白殘留；尺寸為驗收設定。回報實際執行結果、未執行項目及失敗原因，不能以文件驗證取代瀏覽器結果。
