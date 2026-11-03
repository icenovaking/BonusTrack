## 1. 擴充設定頁並驗證管理流程

- [x] 1.1 實現 Unified card settings entry 的表單部分：在 src/views/CardForm.vue 對現有卡片使用「卡片設定」標題，在 form 外新增管理區，保留名稱儲存、歷史週期鎖定與原新增流程；缺失卡片的 edit URL 顯示錯誤與返回首頁，不能變成新增表單。先保留詳情頁原入口以維持過渡可用性。於 tests/e2e/card-settings.spec.ts 驗證直接開啟設定、新增頁無管理操作、名稱儲存、週期鎖定與缺失目標；先跑 npm run typecheck、npm run build，再執行該測試檔。
- [x] 1.2 [after: 1.1] 完成 Independent card archive and restore actions 與「管理操作與表單儲存分離」、「確認後離頁並保留取消與失敗草稿」：封存／恢復僅更新最新已儲存卡片的 archived，獨立於空白名稱草稿與原生表單驗證；有草稿時於同一次確認說明不儲存。成功返回詳情且沒有額外離頁提示，取消與失敗保留草稿及 dirty；失敗顯示 alert，可重試，寫入期間停用儲存與管理。擴充 tests/e2e/card-settings.spec.ts 驗證封存與恢復的成功／取消、無效草稿、歷史及活動封存狀態保留、一次性 IndexedDB 寫入失敗及重試，重載確認草稿未寫入；通過 typecheck、build 與該檔瀏覽器測試。
- [x] 1.3 [after: 1.2] 完成 History-aware card deletion in settings 與「依全部歷史消費限制刪除」：在 src/views/CardForm.vue 以所有期別消費判斷刪除資格，有歷史時以說明取代刪除按鈕；無歷史才確認刪除卡片及活動，成功返回首頁，取消或寫入失敗保留資料、草稿與 dirty。沿用 repository.deleteCard，管理區視需要在 src/style.css 補局部排版。擴充 tests/e2e/card-settings.spec.ts 驗證目前期別空白但前期有紀錄仍不可刪除、使用中與已封存卡片適用相同規則、連帶刪除且其他卡片不變、刪除取消、失敗後重試及 pending 停用；通過 typecheck、build 與該檔瀏覽器測試。

## 2. 遷移入口並完成整合驗證

- [x] 2.1 [after: 1.3] 完成「沿用編輯路徑並統一卡片設定入口」及 Unified card settings entry 的詳情部分：src/views/CardDetail.vue 連結改為「卡片設定」並沿用 /cards/:cardId/edit，移除底部卡片管理區與不再使用的卡片管理函式，保留活動管理與新增消費顯示規則；將 tests/e2e/coverage.spec.ts 的卡片封存案例改由設定入口操作，保留原有歷史及封存消費限制斷言。更新 tests/e2e/card-settings.spec.ts 驗證詳情無舊區塊、連結與標題一致及活動管理仍可用；搜尋舊卡片入口選擇器確認遷移完整，通過 typecheck、build 及新設定測試與既有封存案例。
- [x] 2.2 [after: 2.1] 驗證最終流程與回歸：執行 npm run typecheck、npm run build、npm run test -- --run，建置後使用確認來源為此工作區的 preview 執行 npm run test:e2e -- tests/e2e/card-settings.spec.ts tests/e2e/coverage.spec.ts tests/e2e/workflow.spec.ts；以 320px、390px、1280px 寬度（驗收指定尺寸）檢查設定頁、鍵盤操作、alert 與無水平溢出，記錄畫面及測試結果於 docs/verification/consolidate-card-settings.md。確認卡片重新載入後封存狀態及歷史正確，正常返回仍有未儲存離頁保護；如遇 coverage.spec.ts 首頁空狀態的既有文案失敗，分開提供證據而不擴大修改首頁或宣稱全部通過。
