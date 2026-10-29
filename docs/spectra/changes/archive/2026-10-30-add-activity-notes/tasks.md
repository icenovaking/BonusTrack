## 1. 資料與舊版相容

- [x] 1.1 實作「活動備註資料正規化與相容性」，建立 Activity.note 字串與複製後的資料正規化；缺少欄位視為空白，空白字串正規化，非空白內容與換行保留，非字串拒絕。同步檢查活動物件的所有組合處以保留備註；以 tests/repository.test.ts 驗證舊 IndexedDB、舊版備份及 null、數值、布林、陣列、物件錯誤，並通過 npm run typecheck 與 npm run test -- --run。
- [x] 1.2 [after: 1.1] 完成 Durable and backward-compatible activity notes 與「備份往返與歷史不變」：重開後保留活動備註，匯出與還原包含已封存活動，取消或失敗不改原資料；以 tests/repository.test.ts 驗證多行備註往返、重複匯入不重複、交易回滾、活動改名與封存保留內容，確認 schemaVersion 仍為 1 並通過 npm run test -- --run。

## 2. 備註設定與首頁顯示

- [x] 2.1 [after: 1.2] 完成 Editable bonus activity notes、Home page activity note visibility 與「活動表單與首頁備註呈現」：ActivityForm 可新增、編輯與清除備註，已有消費也能修改，失敗保留輸入；Home 在各活動名稱下完整顯示換行文字、隱藏空白區域並更新可及描述。新增 tests/e2e/activity-notes.spec.ts 覆蓋多活動隔離、空白、多行、重開、失敗重試、文字 HTML 不解析及剩餘 8233 元不受備註修改影響；通過 npm run typecheck、npm run test -- --run、npm run build 與該端到端測試。
- [x] 2.2 [after: 2.1] 以 tests/e2e/activity-notes.spec.ts 補齊 UI 匯入取消、成功還原與錯誤備註型別的原資料保留驗證；在真實瀏覽器檢查首頁與表單的長字串、完整換行、清除、鍵盤操作及卡片可及描述，依既有規格的 320、390、768、1280 CSS px 與 200% 文字縮放檢查無整頁水平捲動。執行 npm run test:e2e 確認整套流程，將無法執行的檢查如實記錄，不以其他檢查替代。

## 3. 說明與驗證交接

- [x] 3.1 [after: 2.2] 在 README.md 說明活動備註的設定位置、首頁顯示與備份相容行為；於 docs/verification/add-activity-notes.md 對照所有規格情境記錄測試名稱、命令、執行環境、實際結果及未執行項目。所有執行命令以 F:/Website/BonusTrack 為工作目錄，檢閱文件確定不宣稱尚未完成的實機或瀏覽器驗收。
