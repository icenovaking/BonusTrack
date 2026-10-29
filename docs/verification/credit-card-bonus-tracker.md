# credit-card-bonus-tracker 驗證紀錄

日期：2026-10-29。實作環境：Windows、Node.js 26.12.1、Vue 3.5.44、TypeScript 5.9.3、Vite 8.3.5。套件版本以 package-lock.json 為準。這是本機驗證紀錄，不是銀行條款確認或上線驗收。

## 指令結果

| 檢查 | 結果 |
| --- | --- |
| npm run typecheck | 通過 |
| npm run test -- --run | 4 個檔案、155 項測試通過，exit 0 |
| npm run build | 通過；包含 manifest、Service Worker 與必要資源快取清單 |
| npm run test:e2e | 13 項瀏覽器流程通過，exit 0；Microsoft Edge、單一 worker、production preview |
| npm audit --omit=dev --json | production 依賴：0 個弱點 |
| npm audit --json | 開發依賴：4 個 low 診斷，為 deepmerge 經 Workbox 的相依鏈；未使用強制降級修復 |

測試沒有設定或量測程式覆蓋率門檻。所有範例數字為固定測試輸入及公式結果，非真實銀行優惠。

## 使用者需求與證據

| Requirement | Evidence |
| --- | --- |
| 「只要透過回饋上限和加碼百分比計算出可刷的金額」 | money.test.ts：`floors the 500 TWD / 6 percent allowance to 8333 whole TWD` |
| 「當我輸入消費多少就扣掉可刷金額,並列出剩餘可刷金額就好」 | money.test.ts：`deducts 100 TWD then 1000 TWD from the 8333 TWD limit`；500 / 6% 得 8333，扣 100 得 8233，再扣 1000 得 7233 |
| 「首頁顯示我所有的卡,每個牌卡會列出可刷多少剩餘多少」 | layout.spec.ts：`RWD keeps card data and form actions usable at all target sizes and enlarged text`，三張卡、長名稱及額度用完狀態 |
| 「點選我現在要刷的卡,裡面可以讓我新增消費紀錄,新增完之後更新資料」 | workflow.spec.ts：`records a completed purchase and updates detail, home and reopened data` |
| 「自訂結帳日」 | periods.test.ts：`includes the closing day and rolls over the following day for %s`、`clamps day 31 to the actual month end for %s`，包含 15/16 日、短月及閏年 |
| 消費依日期歸期，能手動調整 | workflow.spec.ts：`moves a purchase to the next period and restores automatic assignment without changing its date` |
| 同卡多活動，每筆最多選一個 | workflow.spec.ts：`requires an explicit choice for multiple activities and leaves unrelated allowances unchanged` |
| 修改、刪除與取消刪除 | workflow.spec.ts：`recalculates edited spending and preserves or deletes records according to confirmation` |
| 「8333刷完就告知建議換卡片刷」 | workflow.spec.ts：`keeps the full overspending record and shows a textual card-switch reminder`；完整保留 9000.50 消費，剩餘夾至零 |
| 儲存失敗保留資料及輸入、不重複扣額度 | repository.test.ts：`aborts a failed write after clearing stores and preserves all previously committed records`；workflow.spec.ts：`preserves input on a storage failure and saves exactly one purchase when retried` |
| 封存及設定歷史保護 | repository.test.ts：`locks referenced financial rules and cycle settings but still allows renaming`、`preserves archived card history and rejects new purchases and activities` |
| 備份完整性、原子匯入與錯誤保留 | repository.test.ts：`exports and parses all archived history, notes and manual period overrides`、`rolls back a replacement write failure and preserves the complete previous dataset`；storage.spec.ts：`backup export restores complete data, repeated import replaces and invalid import preserves records` |
| 取消還原不改資料 | storage.spec.ts：`cancelled backup replacement leaves the existing cards and amounts unchanged` |
| 外出可離線查看與記帳 | storage.spec.ts：`cached application reopens offline at a card route and persists local changes and backups`，包含離線重開、記帳、重載、匯出及再匯入 |
| 離線尚未準備好時不誤導使用者 | storage.spec.ts：`failed initial service-worker registration never advertises offline readiness`；pwa.test.ts：`does not claim offline readiness before caching and reports registration failure` |
| 更新前保護未儲存輸入 | pwa.test.ts：`keeps unsaved input when an update is declined and updates after explicit discard`、`does not update while saving and retains committed records on update failure` |
| 支援安裝事件與一般瀏覽器 | pwa.test.ts：`offers install only when the browser supplies a prompt and clears it afterwards`；一般瀏覽器的所有記帳流程均不依賴安裝 |
| 「要有RWD,並使用impeccable 設計簡約風格」 | layout.spec.ts：`RWD keeps card data and form actions usable at all target sizes and enlarged text`；DESIGN.md 與 .impeccable/design.json 記錄實際設計；.impeccable/review/ 保留實際渲染截圖 |
| 不計算回饋金、純 Vue 前端 | src/domain/money.ts 僅計算可刷上限與扣減；正式畫面、production bundle 與 README 範圍檢查，無 C#、Web API 或伺服器資料庫 |

## 設計與可及性

- 已看過手機及桌面實際渲染：淺灰綠底、白色卡片、單一松綠強調、大字剩餘金額，各活動獨立顯示。
- 檢查視窗寬度：320、390、768、1280 CSS px，以及 200% 文字放大；無整頁水平捲動。卡片欄數依寬度為單欄、雙欄或三欄。
- 驗證主要儲存按鈕至少 44 CSS px、輸入字體至少 16 CSS px、鍵盤能從金額移至日期。
- 跳至主要內容不更改目前 hash 路由，並確實聚焦 main；首頁卡片有含活動額度的 accessible description。
- 手動檢視長名稱、空狀態、零額度、錯誤及備份提示；提示有文字，不依靠顏色辨識。
- PNG 圖示為自繪幾何圖形，來源保存在 scripts/generate-icons.mjs 並嵌入 metadata；來源掃描為 3 個 raster、0 個缺漏。

## 尚未驗證的範圍

- iOS／Android 實機的加入主畫面、系統分享／下載、軟鍵盤與瀏海安全區。桌面視窗模擬不等於實機驗收。
- 真實兩版線上部署切換；更新保護與安裝事件以模擬測試驗證。
- 實際靜態 HTTPS 主機部署、銀行條款、銀行取整與實際入帳歸期。
- 長期瀏覽器資料回收、裝置故障或換機；由匯出備份作為使用者恢復途徑，未宣稱自動備份。

未執行 Git commit，未部署，也未更動原有 .codex/ 使用者資料。
