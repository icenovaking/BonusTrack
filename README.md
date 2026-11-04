# BonusTrack

手機優先的信用卡加碼額度追蹤工具。首頁查看所有卡片，點進卡片記錄已發生的台幣消費，儲存成功後更新剩餘可刷金額。

Vue + TypeScript + Vite 純前端，資料保存在 IndexedDB，沒有後端、登入或跨裝置同步。

## 開始使用

一般使用者直接開啟 Cloudflare Pages 專案的正式網址（首次部署後由 Cloudflare 提供 `https://專案名稱.pages.dev`），不需要安裝 Node.js、建立帳號或輸入 API key。首次請保持連線；網站若仍顯示空白，先依下方「部署排錯」確認發布結果。此 repository 不再透過 GitHub Pages 發布。

以下指令供修改程式或本機預覽使用：

使用 Node.js 24 與 npm；根目錄 `.node-version` 指定 Cloudflare Pages 的建置版本，相依版本由 package-lock.json 鎖定。TypeScript 固定於 5.9 系列，以配合目前 vue-tsc。

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

## Cloudflare Pages 部署

保留 Vue + TypeScript，使用 **Cloudflare Pages Git 整合**連接 GitHub 私有 repository。日常只需提交原始碼、推送 `main`，Cloudflare 就會自動建置、發布，不必在本機建置、不必提交 `dist/`，也不需要 GitHub Actions workflow。

1. 搬站前，先從舊網站的「資料與備份」匯出 JSON。每個裝置／瀏覽器分別保存各自的備份；換網址後資料不會自動搬移。
2. 在 GitHub repository 的 Settings → General → Danger Zone，將 visibility 改為 Private（如尚未變更）。Private 不會收回先前公開下載或 fork 的內容。
3. 將這次部署修改提交、推送到 `main`。移除舊的 GitHub Pages workflow，並在 GitHub Settings → Pages 停用舊站（如仍發布中）。
4. 登入 Cloudflare → Workers & Pages → Create application → Pages → Import an existing Git repository。使用 **Git 整合**，不是 Direct Upload 或 Worker 專案。
5. 連接 GitHub，授權 Cloudflare GitHub App 存取 BonusTrack；建議只授權這個 repository。若找不到私有 repo，到 GitHub Settings → Applications → Installed GitHub Apps 檢查授權。
6. 使用下表設定並部署。成功後，開啟 Cloudflare 提供的正式網址；若需自訂網域，建議先設定最終網域，再開始正式記帳。

| Cloudflare 設定 | 值 |
| --- | --- |
| Production branch | `main` |
| Framework preset | Vue；若未列出可手動填寫以下設定 |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 留空，使用 repository 根目錄 |
| Node.js | 根目錄 `.node-version` 指定 `24`；若後台已有 `NODE_VERSION`，請移除舊值或同樣設為 `24`，Production／Preview 皆適用 |

Cloudflare 會安裝相依套件，執行 TypeScript 檢查與 Vite 建置，再發布 `dist/`。不需要建立 PAT、Cloudflare API token、Wrangler 設定或後端資料庫。請勿將 `NODE_ENV` 設為 `production` 導致略過建置需要的 devDependencies。

`vite.config.ts` 使用 `base: '/'`，對應 Pages 或自訂網域的根目錄。部署後 Network 應載入 `/assets/*.js`，不應再請求 `/src/main.ts` 或 `/BonusTrack/assets/`。目前使用 hash 路由，不需要新增 `_redirects`。`public/_headers` 會複製到 `dist/_headers`，由 Cloudflare 對 Service Worker 與 manifest 設定 `Cache-Control: no-cache`，讓更新時重新驗證檔案。

Private repo 只限制原始碼 repository 的存取，不會把網站變成私人網站；正式網站與前端 JavaScript 仍可公開下載，Preview URL 預設也公開。如需限制訪客，另行設定 Cloudflare Access；只開啟 Preview 的存取保護，不會同時保護正式網址。

官方參考：[Vue 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vue-site/)、[GitHub 整合](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)、[建置環境](https://developers.cloudflare.com/pages/configuration/build-image/)、[HTTP headers](https://developers.cloudflare.com/pages/configuration/headers/)。

### 安全標頭

安全標頭統一由 `public/_headers` 管理，Vite 建置後複製到 `dist/_headers`，Cloudflare Pages 會將規則套用到靜態回應。沿用上面的 Git 整合與 `dist` 發布設定即可，標準靜態 Pages 不需新增 Cloudflare 後台規則或 API token；仍需部署後檢查實際回應，不能只憑本機測試判定正式站已生效。

政策限制腳本、樣式、圖片、字型、連線、Worker 與 manifest 為同源，禁止 inline script、eval、iframe 嵌入及網路表單提交，並設定 `X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: no-referrer`。JSON blob 備份下載仍可使用。這些規則不提供登入或資料加密。

本機帶標頭驗證方式：

```powershell
npm run build
node scripts/security-preview.mjs
```

開啟 `http://localhost:4173`。這個僅供 loopback 測試的入口從 `dist/_headers` 讀取全域與精確路徑規則，缺檔、未支援語法、衝突或佔用埠都會失敗，不會改用其他埠。`npm run test:e2e` 也使用此入口；一般 `npm run preview` 與開發伺服器不會自動套用 Cloudflare `_headers`，不能拿來驗證標頭。

安全標頭內容會參與 PWA 快取版本計算，避免只改標頭卻沿用舊 HTML 快取。既有裝置仍須保持連線並接受原有更新提示；更新前先保存表單，不必清除 IndexedDB。未完成更新的離線裝置不保證已取得新標頭。

若 Cloudflare 額外注入 Web Analytics 等腳本被 CSP 阻擋，先記錄 blocked URI 與 directive，再決定保留服務或調整允許來源；不要直接加入萬用來源或 `unsafe-eval`。若已有其他回應標頭規則，核對最後實際值。Pages Functions／SSR 的動態回應不適用 `_headers`，必須另外設計。

正式站檢查、回復方式及本次驗證範圍見 [安全標頭驗證紀錄](docs/verification/harden-security-headers.md)。

### 日常更新網站

在 `main` 完成修改後，先確認本次檔案，再提交並推送：

```powershell
git status --short
git diff
# 本次部署設定的提交範例；之後改成各次實際修改的檔案。
git add -A -- .github/workflows/deploy.yml .gitignore README.md package.json vite.config.ts .node-version public/_headers
git diff --staged
git diff --staged --check
git commit -m "fix: 說明本次修正"
git push origin main
```

接著開啟 Cloudflare → Workers & Pages → 本專案 → Deployments，確認對應 commit 的 Production 部署成功。推送只會觸發部署，不能單憑推送成功判斷網站已更新；未推送的本機變更不會在線上生效。首次設定須先移除舊 workflow 並提交新設定；後續依各次修改選取檔案，不必再加入已刪除的 workflow 路徑。

### 部署排錯

- **找不到私有 repo 或推送未觸發部署**：檢查 Cloudflare GitHub App 是否可存取該 repo，以及 Production branch 是否為 `main`、自動部署是否啟用。
- **安裝、型別檢查或建置失敗**：查看 Cloudflare Deployments 的 Build log，確認 Node 24、build command 為 `npm run build`，且 devDependencies 有安裝。修正後重新推送或重試部署；不要把 PAT 或 API key 貼進程式、log 或 issue。
- **部署成功但網站仍空白**：確認是最新 commit 的正式網址；output directory 必須是 `dist`，不能是 `src` 或 repository 根目錄。Network 應載入 `/assets/*.js`；若仍請求 `/src/main.ts` 或 `/BonusTrack/assets/`，請檢查建置指令與發布目錄，再重新部署。
- **舊版 PWA 尚未更新**：先儲存表單，再接受應用程式的更新提示。排錯前先匯出備份，不要直接清除網站資料；清除 IndexedDB 會刪除記帳紀錄。

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
- 備份是未加密的 JSON，包含卡片名稱、活動、消費金額、日期及備註；請保存到受保護的位置，不要加入公開 repo、issue 或截圖。只匯入可信任的自有備份；目前沒有檔案大小上限，過大的 JSON 可能使頁面暫時無回應。
- 從 GitHub Pages 搬到 Cloudflare，或從 `pages.dev` 換成自訂網域時，請在舊網址匯出、新網址匯入，再確認筆數、金額與備註。IndexedDB 不會跨 origin 自動搬移；每個 Preview URL 也有各自的儲存空間。確認新站資料完整後，再從新網址重新安裝 PWA，勿先清除舊站資料。

## 公開 repo 資安檢查（2026-11-03）

以下為切換 Cloudflare 前的檢查快照：常見密鑰格式掃描未命中 API key、GitHub token、私鑰、AWS access key 或含帳密網址。範圍為當時可見的 3 個 commit／80 個歷史文字檔版本、79 個工作目錄文字檔及 8 個建置文字檔。這是靜態格式掃描，不是完整滲透測試；未涵蓋圖片 OCR、不可達 Git 物件、其他分支／fork 的未知歷史、GitHub Secrets 內容或所有歷史 Actions log，也無法辨認所有自訂格式的密鑰。

| 項目 | 檢查結果與建議 |
| --- | --- |
| 公開作者資訊 | `b7b9e92`、`7b157ed` 的作者資訊含工作信箱／電腦帳號，其他 commit 也有作者信箱。這不是 API key，但屬公開個人資訊；未來可使用 GitHub Settings → Emails 提供的 noreply 信箱設定 `git config user.email`。改設定不會移除既有歷史，本次未重寫或強制推送歷史。 |
| 本機路徑與 hooks | `.codex/hooks.json`、`.github/hooks/impeccable.json` 包含本機使用者路徑，會公開帳號名稱；設定會嘗試執行本機 impeccable hook，該外部腳本不在本次檢查範圍。它們不是網站執行程式或 API key。 |
| 建置依賴 | 完整 `npm audit` 回報 10 個受影響套件項目（2 low、8 moderate，含間接影響），集中於 `vite-plugin-pwa → workbox-build` 依賴鏈。`npm audit --omit=dev` 回報零項，但不代表所有建置產物或供應鏈都沒有風險。尚未修復；未套用會降級 PWA 套件的 `npm audit fix --force`。 |
| 資料與匯入 | 記帳資料存於未做應用層加密的 IndexedDB；匯出 JSON 也未加密。未找到應用程式上傳記帳資料的網路呼叫，也未找到 `v-html`、`innerHTML` 或 `eval` 使用；目前文字以 Vue 插值顯示。備份格式有驗證，但匯入沒有大小限制。 |
| 同網域隔離 | IndexedDB 以 origin（協定、主機、連接埠）隔離，不以路徑隔離。舊站與同為 `https://icenovaking.github.io/` 的其他專案共用安全邊界；新站以實際 `pages.dev` 或自訂網域為界。換域可隔離舊站，但也必須透過備份搬移資料。 |
| 部署身分 | 已移除 GitHub Pages workflow，改由 Cloudflare GitHub App 取得 repo 內容並在 Cloudflare 建置。不需在 repo 存放部署密鑰；仍須信任授權的 Cloudflare 帳號、GitHub App 與建置依賴。既有 Actions log 不會因移除 workflow 而被刪除。 |

`.gitignore` 已涵蓋 `.env`、`.env.*`、常見私鑰／憑證副檔名與 `BonusTrack-*.json` 備份；已經追蹤的檔案不會因新增忽略規則而從 Git 歷史消失。`.env.example` 僅能放假值；其他檔名的備份或密鑰仍須自行確認。任何秘密都不應放入 `public/` 或 `VITE_*` 環境變數，因為公開檔案與前端建置內容可由使用者下載。

日後重新檢查套件可執行 `npm audit` 與 `npm audit --omit=dev`。若發現真正的密鑰曾被提交，應先在發行端撤銷／輪替，再處理 repo 與 Git 歷史，僅刪除目前檔案無法收回已公開的密鑰。

參考：[Vite 前端環境變數](https://vite.dev/guide/env-and-mode)、[IndexedDB 的同源限制](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology)。本次 audit 的直接公告包括 [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)、[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) 與 [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249)。

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

2026-11-03 的 npm audit 回報開發依賴 10 個受影響套件項目（2 low、8 moderate，包含間接影響），集中於 PWA／Workbox 建置依賴鏈；production 依賴的 audit 為零。未執行會降級 PWA 套件的 npm audit fix --force。此結果不是整體安全保證，應定期重新檢查。

## 設計與規格

- [PRODUCT.md](PRODUCT.md)：已確認的使用情境與產品範圍。
- [DESIGN.md](DESIGN.md)：依 impeccable 記錄的簡約設計系統。
- docs/spectra/changes/credit-card-bonus-tracker/：提案、設計、能力規格與任務。
- 圖示為 scripts/generate-icons.mjs 自行繪製；執行 node scripts/generate-icons.mjs 可重建含來源中繼資料的 PNG。
