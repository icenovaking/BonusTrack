# BonusTrack

手機優先的信用卡加碼額度追蹤工具。首頁查看所有卡片，點進卡片記錄已發生的台幣消費，儲存成功後更新剩餘可刷金額。

Vue + TypeScript + Vite 純前端，資料保存在 IndexedDB，沒有後端、登入或跨裝置同步。

## 開始使用

使用符合 Vite 要求的 Node.js（22.12 以上）與 npm；相依版本由 package-lock.json 鎖定。TypeScript 固定於 5.9 系列，以配合目前 vue-tsc。

```powershell
npm ci
npm run dev
```

開啟終端機顯示的本機網址。手機與開發電腦在相同網路時，可以使用終端機提供的區域網路網址查看 RWD 介面；一般區網 HTTP 不提供完整 PWA 功能。

## 記帳流程

1. 首頁「新增卡片」，設定名稱與日曆月／自訂結帳日。
2. 卡片內「新增加碼活動」，輸入活動名稱、回饋上限與「加碼」百分比。
3. 點「新增消費」，輸入日期、台幣金額，選擇最多一個活動；不適用加碼的紀錄不扣額度。
4. 儲存成功後查看剩餘金額；可編輯、確認刪除，或在「調整所屬期別」移到前一期／下一期。

可刷上限 = 回饋上限 ÷ 加碼百分比，無條件捨去至整元。剩餘金額 = 上限 − 該期該活動的累計消費，最低為零。

例如上限 500 元、加碼 6%，可刷上限為 8,333 元；消費 100 元後剩 8,233 元。超額消費完整保留，顯示剩餘零元並提醒下一筆換卡。不計算已用回饋金、不包含基本回饋；以上為公式範例，非現行銀行優惠保證。

結帳日包含在本期，翌日開始下一期；設定 31 日時，短月取最後一天。期別只儲存日期，不會因 UTC 換算而移動既有消費日期。已有消費的週期或活動上限不能直接改寫；可封存並新增卡片／活動，歷史紀錄仍保留。

## 加碼活動備註

在「新增加碼活動」或活動管理的「編輯」中，填寫「備註（選填）」，例如「需先登錄，限實體刷卡」。儲存後，首頁會在對應活動名稱下方完整顯示備註，保留換行；空白或只有空白字元時不顯示。每個活動各自設定，與消費紀錄的備註分開。

已有消費紀錄仍可修改或清除活動備註，不影響回饋上限、加碼百分比、消費期別及剩餘額度。備註會保存在本機，並隨 JSON 備份匯出與還原，包含已封存活動；舊版備份缺少備註時視為空白。活動備註目前顯示於首頁，卡片內頁仍沿用原有資訊。

本次驗證結果及限制見 [活動備註驗證紀錄](docs/verification/add-activity-notes.md)。

## GitHub Pages 部署

1. 在 GitHub repository 的 Settings → Pages，將 Build and deployment → Source 設為 **GitHub Actions**。
2. 將變更推送至 `main`；`.github/workflows/deploy.yml` 會安裝相依套件、建置，並只發布 `dist/`。亦可在 Actions 手動執行該 workflow。
3. workflow 成功後，開啟 `https://icenovaking.github.io/BonusTrack/`。

部署建置使用 `npm run build -- --base=/BonusTrack/`，讓資源路徑指向專案子目錄。本機建置仍維持相對路徑；若更改 repository 名稱，需同步更新 workflow 的 `--base`。

不要將原始碼根目錄直接設為 Pages 發布來源：原始 `index.html` 的 `/src/main.ts` 是 Vite 開發入口，正式網站必須使用 `dist/index.html` 及其 `assets/` 建置產物。部署後可在 Network 確認載入 `/BonusTrack/assets/*.js`，不應再請求 `/src/main.ts`。

## 離線與手機安裝

```powershell
npm run build
npm run preview
```

正式版本需放在靜態 **HTTPS** 主機；localhost 可用於本機驗證。上傳 dist/ 全部內容（含 Service Worker、manifest、圖示），保留根目錄或子目錄結構，不額外快取 sw.js；hash 路由不需要伺服器轉址設定。本次未部署網站。

首次連線開啟後，等頁尾顯示「已可離線使用」，才能保證已準備好必要離線資源。之後同一瀏覽器可離線重開、查看與記帳。開發模式不是離線驗收環境。

- iPhone／iPad：Safari 的「分享」→「加入主畫面」。
- Android：Chrome 選單的「安裝應用程式」或「加到主畫面」；支援的瀏覽器亦會顯示安裝按鈕。
- 不安裝也能在瀏覽器使用。新版本會提示更新，有未儲存輸入時必須先保存或明確放棄；更新不會清除已提交的 IndexedDB 紀錄。

## 備份與還原

資料只存在這個裝置與瀏覽器。換手機、換瀏覽器、清除網站資料或瀏覽器回收儲存空間，都可能失去紀錄；PWA 快取不等於資料備份。

- 「資料與備份」→「匯出 JSON 備份」，下載並確認保存檔案。備份包括封存項目、歷史消費、備註與手動期別。
- 還原時選擇 JSON，先檢查驗證結果與筆數，再確認取代全部資料。匯入是完整取代，並非合併；建議先匯出目前版本。
- 格式或版本不符、取消、寫入失敗時，原資料保持不變。重複匯入同一份資料不會加倍消費。
- 不需輸入卡號、有效期限或安全碼。

## 驗證

```powershell
npm run typecheck
npm run test -- --run
npm run build
npm run test:e2e
```

瀏覽器整合測試預設使用本機已安裝的 Microsoft Edge（playwright.config.ts 的 channel: msedge），自動啟動 production preview 於 4173。缺少 Edge 的環境可先安裝 Playwright Chromium，並將測試設定改為該環境適用的 browser channel；不影響應用本身。請序列執行整合測試，避免預覽埠與報告目錄互相競爭。

測試涵蓋精確金額、日期邊界、IndexedDB 原子性、備份、額度流程、離線重開與 RWD。完整結果與需求對照見 [驗證紀錄](docs/verification/credit-card-bonus-tracker.md)。

手機的實際加入主畫面、系統分享、軟鍵盤與瀏海安全區，尚未在 iOS／Android 實機驗證；桌面瀏覽器的 viewport 測試不代表實機通過。版本更新保護與安裝事件另有模擬測試，未進行線上兩版部署切換。

開發依賴的 npm audit 偵測到 deepmerge 經 Workbox 引入的低風險問題及其連帶項目；production 依賴的 audit 為零。未執行會降級 PWA 套件的 npm audit fix --force。

## 設計與規格

- [PRODUCT.md](PRODUCT.md)：已確認的使用情境與產品範圍。
- [DESIGN.md](DESIGN.md)：依 impeccable 記錄的簡約設計系統。
- docs/spectra/changes/credit-card-bonus-tracker/：提案、設計、能力規格與任務。
- 圖示為 scripts/generate-icons.mjs 自行繪製；執行 node scripts/generate-icons.mjs 可重建含來源中繼資料的 PNG。
