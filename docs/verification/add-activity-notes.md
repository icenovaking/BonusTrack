# 加碼活動備註驗證紀錄

日期：2026-10-30（Asia/Taipei）。變更：add-activity-notes。

## 執行環境與結果

全部命令的工作目錄為 F:/Website/BonusTrack。Windows、Node v24.14.1、npm 11.12.1；沿用 package-lock.json 的 Vue/Vite/Vitest/Playwright 版本。瀏覽器測試使用 playwright.config.ts 的 Microsoft Edge、headless 模式與 production preview（4173），不是模擬 DOM。

| 命令 | 本次結果 | 證據來源 |
| --- | --- | --- |
| npm run typecheck | passed-current | 活動 ID 衝突修正後，本次終端輸出通過 |
| npm run test -- --run tests/repository.test.ts | passed-prior，48 項通過 | 前次 Vitest 輸出；Repository 與測試內容身分不變，本次全套單元測試亦通過 |
| npm run test -- --run | passed-current，4 檔、165 項通過 | 本次 Vitest 輸出 |
| npm run build | passed-current | vue-tsc、Vite 與 PWA generateSW 完成，14 項 precache |
| npm run test:e2e -- tests/e2e/activity-notes.spec.ts | passed-prior，7 項通過 | 前次 Playwright 輸出，21.1 秒；本次全套亦包含這 7 項且全部通過 |
| npm run test:e2e -- tests/e2e/activity-identity.spec.ts | passed-current，5 項通過 | 本次 Playwright 輸出，19.4 秒，涵蓋原本失敗的兩項與其他特殊 ID |
| npm run test:e2e | passed-current，30 項通過 | 活動 ID 修正後，本次完整 Playwright 輸出，1.2 分鐘 |
| git diff --check | passed-current | 本次終端輸出；未暫存或提交 |

最初新增備份測試錯誤地假設活動依 fixture 順序匯出。IndexedDB getAll 依主鍵排序；修正為依 ID 排序後比較完整內容，沒有放寬欄位、數量或歷史斷言。

## 規格情境與測試

U 表示 tests/repository.test.ts；E 表示 tests/e2e/activity-notes.spec.ts。以下均為本次已執行測試；測試原名保留以供查找。

| 規格情境／行為 | 測試證據 |
| --- | --- |
| Create independent notes：活動獨立備註、新增、另一活動空白 | E: creates an independent multiline activity note and shows it on home after reopening |
| Edit after recording purchases：已有消費仍可改，500／6%／100 的剩餘額度維持 8233 | E: edits and clears a note despite locked financial rules without changing purchases or allowance；U: edits, clears and isolates notes with purchase history while preserving allowance and rules |
| Clear a note：空字串與僅空白內容 | 上述 E、U 測試；U: normalizes missing and whitespace notes without mutating caller data |
| Retry a failed note save：錯誤、輸入保留、原值保留與重試 | E: retains input and committed notes when a write fails and saves on retry；U: keeps the committed note on failed edit and replacement and permits retry |
| Read multiline notes：首頁完整換行與卡片連結可及描述 | E: creates an independent multiline activity note and shows it on home after reopening；E: renders literal notes, wraps long text and keeps keyboard and accessible descriptions usable |
| Display long and literal content：長字串換行、HTML 當文字、無整頁橫向捲動 | E: renders literal notes, wraps long text and keeps keyboard and accessible descriptions usable |
| Hide empty notes：空備註無 placeholder 或空白區 | E: creates an independent multiline activity note and shows it on home after reopening；E: edits and clears a note despite locked financial rules without changing purchases or allowance |
| Reopen with a note：重開、多行原文 | E: creates an independent multiline activity note and shows it on home after reopening；U: reopens multiline notes and preserves them through rename, archive and repeated backup replacement |
| Restore archived and active notes：封存、備份往返、重複匯入 | E: round trips active and archived notes through backup and repeated replacement；上述 U 測試 |
| Load legacy data：舊 IndexedDB 與版本 1 備份缺少 note | U: loads legacy IndexedDB and version 1 backups with empty notes and intact history；U: normalizes missing and whitespace notes without mutating caller data；既有 storage.spec.ts 亦使用缺少 note 的備份且其流程通過 |
| Reject invalid note types：null、數字、布林、陣列、物件拒絕且資料不變 | E: rejects all present invalid note types without altering saved records；U: rejects a present non-string note %j and preserves committed data（參數化） |
| Preserve notes on canceled or failed replacement：取消、交易失敗保留完整資料 | E: canceled and failed backup replacements preserve prior notes and complete data；U: keeps the committed note on failed edit and replacement and permits retry |

## 實際畫面與介面審查

- Playwright 在 Edge 實際操作表單、備份、錯誤與重試；檢查首頁及表單在 320、390、768、1280 CSS px 與 200% 文字縮放無整頁橫向捲動。
- 檢查 textarea 的 Tab 鍵焦點、可見外框、說明文字關聯及首頁卡片連結的 accessible description；這是瀏覽器可及性屬性檢查，不是螢幕閱讀器實際朗讀驗收。
- 已逐張開啟 .impeccable/review/add-activity-notes/ 下 home-{320,390,768,1280}.png 與 form-{320,390,768,1280}.png，確認首頁備註完整顯示、長字串換行、空白備註不占位、表單焦點可見。
- Impeccable finish reviewer 對本次備註 UI 擴充給予 ship；documenter 確認沿用現有系統，無須更動 DESIGN.md、PRODUCT.md 或設計 sidecar。
- 機械 detector 已執行一次；回報既有 CSS 的色碼、字級、圓角 advisory。新增備註沿用 muted 與文件正文已記載的輔助文字字級，未擴大修改設計系統。
- 手機全頁截圖仍看得到既有 sticky 儲存按鈕跨過試算區的呈現；審查將其列為既有行為，沒有宣稱本次修正。

## 活動 ID 衝突修正與範圍限制

tests/e2e/activity-identity.spec.ts 原先失敗的兩個案例，修正後均通過：

1. keeps an imported activity named none assigned when adding and editing a purchase
2. keeps none, regular and explicitly unassigned purchases distinct across multiple activities

失敗時兩者皆預期 NT$ 8,233，實際 NT$ 8,333。使用者明確要求「請修正2個失敗」後，本次將 src/views/PurchaseForm.vue 納入整合修正範圍：活動選項使用 activity: 前綴；不適用加碼使用獨立的 unassigned 選項；儲存時才還原完整活動 ID 或 null。新增、編輯及單一活動預選都使用相同映射，不再把合法 ID none 當成未指定。這是既有活動歸屬契約的錯誤修正，沒有變更資料格式、畫面文案或版面。

驗收斷言未放寬，也未跳過或刪除失敗測試。兩項案例驗證 none 活動新增與編輯後仍扣除額度，以及多活動與未指定消費互不混淆；另外 null、undefined、unassigned 字串 ID 的三項案例也通過。新增備註的 7 項測試與全套 30 項瀏覽器測試均已通過，原先全套驗證阻礙已解除。

未執行 iOS／Android 實機軟鍵盤、原生螢幕閱讀器朗讀或正式部署切換；本次不宣稱這些檢查通過。未執行 Git add、commit 或封存。

## 內容身分

以下 SHA256 由本次執行後取得；用於辨識本報告對應的程式與測試，不代表持續通過旗標。

| 檔案 | SHA256 |
| --- | --- |
| src/domain/models.ts | E1F6D6DF88A2BA8C32B02C700E1C3B04C27D7DCE7964A2A27B5D7E0ED3DC05CF |
| src/data/repository.ts | 6A43E014C7957E7A33EFA39532D8BBDE40122DEDA6D865042D52E09112BFD668 |
| src/views/ActivityForm.vue | B63EBA46D123012C72F4DA1FBDF3F1442645E3CE7C221800CDF70F3E90F63AD4 |
| src/views/Home.vue | D627403063959ECC5834C9F960B1D3BA6F4F1A177895E62331E3E47B28EBCC37 |
| src/views/PurchaseForm.vue | 8CEA5F5B51230B332C1EA833B0F918DF0B5C096957472333D428A6DFE1BEDD6B |
| src/style.css | AEA4CBCBEF4364F8E6EA6A6F938496CF60CB540EC43A34A82C0F70016ED8997F |
| tests/repository.test.ts | B6D477A5F06F5D563004935F6F1220AD0D8BB612104AC0B72DAF78488EC73CD4 |
| tests/e2e/activity-notes.spec.ts | 06F3D73C3F49136FF54909BCB42A162A9AB25DB0CE4A25864B56440AB34911CE |
| package-lock.json | 3DBB1917D1AB208005415EFA5BD84C2710D61C6E9BD0BEF3F115B05034D168D8 |
| playwright.config.ts | F979165D035D3854BB6F9C93834AA30EA30C7B2E0A750E3B426E7389127898A2 |
| vite.config.ts | 1C37241355BABBB55E3797719E0534EB88D5B6B66A96C79BECD8E5E6168A00CB |
