# 卡片設定整合驗證

日期：2026-11-03。變更：consolidate-card-settings。

## 實作結果

卡片詳情頁的「編輯卡片」改為「卡片設定」，沿用 /cards/:cardId/edit；詳情頁底部不再出現「管理這張卡片」。名稱與週期維持表單儲存，封存、恢復與刪除放在表單外下方。活動管理留在詳情頁。

封存／恢復以目前已儲存卡片為準，只切換 archived，不提交名稱或週期草稿。管理操作確認會提示未儲存內容不會保存；成功後離頁，取消與失敗保留草稿及原有離頁保護。所有期別都有消費檢查；有歷史的卡片顯示封存說明，沒有歷史才提供紅色刪除按鈕。不存在的編輯目標顯示錯誤與返回首頁連結。

沒有更動資料層、資料格式、活動管理、首頁或部署設定。

## 指令與實測結果

| 驗證 | 結果 |
| --- | --- |
| npm run typecheck | 通過，exit 0；最後一次涵蓋最終原始碼及測試檔 |
| npm run build | 通過，exit 0；Vite 與 PWA 均完成，後續僅調整測試與文件，應用程式原始碼未再更動 |
| npm run test -- --run | 通過，165 passed，4 test files passed，exit 0 |
| npm run test:e2e -- tests/e2e/card-settings.spec.ts --output test-results/card-settings-final | 通過，28 passed，exit 0 |
| npm run test:e2e -- tests/e2e/card-settings.spec.ts tests/e2e/coverage.spec.ts tests/e2e/workflow.spec.ts | 38 passed、1 failed，exit 1；失敗為下述既有首頁文案案例，不能視為整組全數通過 |
| git diff --check | 通過；另檢查本次新增文字檔的行尾空白 |

瀏覽器測試由 Playwright 啟動此工作區的 Vite preview（localhost:4173），輸出均有新啟動 WebServer 的紀錄；未重用來源不明的服務。這是本機 Edge 瀏覽器測試，不代表真實 iPhone/Safari 或遠端部署已驗證。

## 需求與測試證據

以下測試均位於 tests/e2e/card-settings.spec.ts，以上述 exit 0 的獨立執行為依據。

| 需求 | 具體測試名稱與斷言 |
| --- | --- |
| 「圖中的管理卡片功能合併到編輯卡片」 | card details provide one settings entry and retain activity management：只有一個設定入口、路徑及標題一致，詳情頁沒有舊管理區與卡片管理按鈕，活動管理仍可展開操作 |
| 管理區與儲存表單分開 | settings keeps the edit form and separates card management：管理區位於 form 外，已有消費時週期選項停用 |
| 編輯仍可儲存，保留週期、歷史及封存狀態 | explicit save preserves cycle, history and archived=false；explicit save preserves cycle, history and archived=true：重載後完整資料比對，只有名稱變更 |
| 新增卡片不顯示管理操作 | new cards keep creation without management controls：沒有封存、恢復及刪除按鈕，仍可新增並返回詳情 |
| 缺失目標不變成新增表單 | missing edit targets cannot create or manage a card：顯示 alert、無表單，返回首頁後資料仍為空 |
| 封存／恢復不儲存草稿，確認只出現一次 | 封存卡片 changes only committed status with draft="尚未儲存"；恢復使用卡片 changes only committed status with draft="尚未儲存"：比對確認文案、視窗次數、重載後完整卡片／活動／消費資料與新增能力 |
| 空白草稿不阻擋管理 | 封存卡片 changes only committed status with draft=""；恢復使用卡片 changes only committed status with draft=""：可成功操作，原卡名及歷史資料保留 |
| 取消管理保留輸入與 dirty | 封存卡片 cancellation preserves invalid draft and leave protection；恢復使用卡片 cancellation preserves invalid draft and leave protection：取消後空白輸入及資料保留，嘗試離頁仍會確認 |
| 管理寫入失敗可重試 | 封存卡片 failure retains drafts and committed data for retry；恢復使用卡片 failure retains drafts and committed data for retry：一次性 IndexedDB put 失敗，alert 可讀、草稿與 dirty 保留、資料未改，重試後只改 archived |
| 管理期間避免重複操作 | 封存卡片 disables save and management while writing；恢復使用卡片 disables save and management while writing：以仍存活的唯讀交易暫停寫入，儲存及所有管理按鈕停用，釋放後完成預期狀態更新 |
| 週期草稿與管理分離 | archiving does not save uncommitted cycle settings：未儲存的日曆月選擇不會取代已儲存結帳日設定 |
| 任一期別有消費都不能刪卡 | earlier history prevents deletion even with empty current period, archived=false；earlier history prevents deletion even with empty current period, archived=true：確認本期空白後進入設定，刪除按鈕不存在且顯示封存說明 |
| 刪除卡片連帶刪活動且保留其他資料 | deletion removes only the eligible card and its activities, archived=false；deletion removes only the eligible card and its activities, archived=true：空白草稿仍可管理，確認含不可復原與草稿提醒，成功回首頁、重載後其他卡片／活動／消費完全保留 |
| 取消刪除保留資料與草稿 | deletion cancellation preserves card, activities and dirty draft：完整資料比對不變、草稿保留且離頁仍有確認 |
| 刪除失敗可安全重試 | failed deletion retains records and draft until a confirmed retry：交易中注入寫入失敗，資料回復、草稿及 dirty 保留、按鈕重新可用，重試成功 |
| 刪除期間停用按鈕 | pending deletion disables both save and management actions：交易等待期間儲存、封存與刪除均停用，完成後只有目標卡片被移除 |
| 普通返回保留未儲存離頁保護 | ordinary back navigation warns and discards only after acceptance：取消保留草稿，接受才離頁，儲存資料不變 |
| 手機、桌面與鍵盤操作 | settings layout and keyboard management at 320px；settings layout and keyboard management at 390px；settings layout and keyboard management at 1280px：檢查分隔位置、紅色刪除、無水平溢出、Tab 焦點與 Enter 確認；390px 另檢查寫入錯誤 alert |

既有封存與消費整合案例亦通過：tests/e2e/coverage.spec.ts 的 archived cards leave the active list and remain accessible with their purchase history，與 tests/e2e/workflow.spec.ts 的全部案例。

## 畫面證據

已開啟並檢視下列實際建置畫面，確認設定與管理區隔、名稱及說明換行、按鈕可辨識，沒有水平溢出。寬度為驗收指定尺寸，不是效能估計。

- [.impeccable/review/consolidate-card-settings/settings-320.png](../../.impeccable/review/consolidate-card-settings/settings-320.png)
- [.impeccable/review/consolidate-card-settings/settings-390.png](../../.impeccable/review/consolidate-card-settings/settings-390.png)
- [.impeccable/review/consolidate-card-settings/settings-1280.png](../../.impeccable/review/consolidate-card-settings/settings-1280.png)
- [.impeccable/review/consolidate-card-settings/settings-error-390.png](../../.impeccable/review/consolidate-card-settings/settings-error-390.png)
- [.impeccable/review/consolidate-card-settings/detail-390.png](../../.impeccable/review/consolidate-card-settings/detail-390.png)

詳情頁全頁截圖會包含既有底部 sticky 新增消費控制項；全頁拼接位置不是新的版面規則。

既有 workflow.spec.ts 的驗證亦重新產生 .impeccable/review/desktop.png、.impeccable/review/mobile.png 與 .impeccable/review/mobile-detail.png；這些是本次測試產物，其中詳情頁會呈現新的「卡片設定」入口。

## 既有失敗與驗證邊界

tests/e2e/coverage.spec.ts 的 first-card and no-activity empty states expose working creation actions 仍期待首頁標題「把你的第一張卡加進來」及「新增第一張卡片」入口，但目前已提交的 Home.vue 使用「活動加碼追蹤」與「新增卡片」。實際失敗停在第一個舊標題斷言，等待後找不到元素。

git show HEAD:src/views/Home.vue 可看到此首頁行為早已存在；git diff -- src/views/Home.vue 為空。本次對 coverage.spec.ts 唯一修改是封存案例改走「卡片設定」連結，未更動上述失敗案例。依提案範圍不修改首頁或這個舊測試，也沒有停用或略過原案例。完整整合指令仍為 exit 1，需另行維護此舊案例。

本次沒有真機 Safari、遠端站台或部署驗證。Spectra 的 tdd/audit 設定未啟用；任務按明訂驗收完成，未執行額外 Spectra verify/review/archive 流程。
