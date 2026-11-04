## Context

BonusTrack 是 Vue、Vite 與 vite-plugin-pwa 的純前端應用。public/_headers 只含 /sw.js、/manifest.webmanifest 的 no-cache；vite.config.ts 使用 Workbox precache 與 index.html navigation fallback。src/pwa.ts 使用 prompt 更新並保護未儲存輸入。tests/pwa.test.ts 是模擬註冊與更新事件；tests/e2e/storage.spec.ts 已有備份與離線重開情境，不能把這些測試通過等同於正式主機標頭生效。

本機沒有 .codegraph 目錄，因此使用直接讀檔確認上述範圍。現有規格 bonus-tracking 與 local-data-portability 是相容性基準；新增 static-response-security 描述新的瀏覽器限制。需求來源是本次安全標頭討論，不包括先前稽核的其他問題。

## Goals / Non-Goals

**Goals:**

- In scope：透過 repository 維護 Cloudflare Pages 靜態回應標頭，限制資源來源、腳本執行及 iframe 嵌入。
- In scope：production 帶標頭瀏覽器驗證、產物檢查、PWA／備份回歸與正式站驗證指引。

**Non-Goals:**

- Out of scope：匯入容量限制、加密、依賴升級、登入、Cloudflare Access、Pages Functions／SSR、第三方分析功能、HSTS preload／includeSubDomains、整站資安重構。
- 不自動推送、部署或改 Cloudflare 後台。不把既有 PWA 用戶立即更新當成可保證行為；舊快取需經原有更新流程替換。

## Decisions

### public/_headers 作為標頭來源

在 /* 規則加入 Content-Security-Policy、X-Frame-Options: DENY、X-Content-Type-Options: nosniff、Referrer-Policy: no-referrer。既有 /sw.js 與 /manifest.webmanifest 的 Cache-Control: no-cache 必須同時保留。標頭值只定義在 public/_headers，測試環境讀取建置後的同一份設定，避免複製政策常數而產生漂移。

替代方案：Cloudflare 後台 Transform Rules 不易隨 repository 審閱；HTML meta 不能提供所有回應標頭與防嵌入效果，因此不採用。

### 強制同源 CSP 並保留 PWA

初始政策契約為：

    default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'

使用 Content-Security-Policy 強制執行，不能只設 Report-Only。不得加入 script 的 unsafe-inline、unsafe-eval、任意 https: 或 *；不預先允許第三方、data: 或 blob: 資源。JSON 匯出使用 blob 下載連結，屬驗證項目，不以此放寬 script-src 或 connect-src。Vue 編譯後 JS、抽離 CSS、圖示、manifest、Service Worker 與 Workbox 檔案由本站提供；需以實際 production 輸出及瀏覽器驗證確認，不以原始碼推測代替結果。

目前 src 與 index.html 未找到 inline style、v-show 或外部資源來源；若 production 產物或正常流程出現政策違規，先定位來源。可在本次範圍調整必要的測試入口或 build 設定，不能直接放寬腳本政策。若必須改應用邏輯、加入 inline 白名單或保留第三方服務，先更新提案再實作。

實作檢查補充：單獨修改 _headers 不會改變既有 precache manifest，舊 Worker 不一定觸發更新。因此在提案允許的必要 build 調整內，vite.config.ts 以 public/_headers 的 SHA-256 產生 Workbox cacheId；政策改變會同時改變 Worker 內容與快取名稱，透過原有 prompt 更新後重新快取帶標頭的 HTML。cleanupOutdatedCaches 清理舊 precache，不清除 IndexedDB。tests/e2e/security-headers.spec.ts 的 versions the worker HTML cache with the deployed header policy 核對產物政策與 Worker cacheId；線上雙版本切換仍須另行驗證。

替代方案：寬鬆 CSP 只減少相容性問題，不能滿足本次腳本來源限制；逐頁 nonce 需要動態回應，不適合目前靜態架構。

### 帶標頭 production 測試入口

新增 scripts/security-preview.mjs，以 Vite programmatic preview 提供 dist 靜態資源；透過 preview middleware 讀取 dist/_headers，僅處理本專案所用的 /* 全域規則與精確路徑規則。其他語法、重複衝突、空政策、缺檔或解析錯誤必須終止並回傳非零狀態，不靜默退回無標頭預覽。規則先合併全域再套用精確路徑；不覆寫 Content-Type。此工具僅供 loopback 測試，不實作或取代 Cloudflare 完整規則引擎，不另寫檔案服務與路徑解析器。

playwright.config.ts 的 webServer 改用此入口，保留既有 port、Edge channel 與序列執行設定；停用 reuseExistingServer，避免誤連未套標頭的服務。手動 npm run preview 與 dev 保留原行為，README 明確區分用途。tests/security-headers.test.ts 檢查政策與合併契約，tests/e2e/security-headers.spec.ts 檢查 HTTP 標頭及瀏覽器執行結果。測試腳本需提供可匯入的規則解析／套用函式，且 import 不得啟動伺服器，以供測試其錯誤分支。

替代方案：只檢查檔案字串不足以證明瀏覽器阻擋；以 page.route 代替伺服器標頭容易漏掉 Service Worker，因此不採用。

### 正式站驗證與本機證據分開

README 與 docs/verification/harden-security-headers.md 說明標準靜態 Pages Git 部署只需發布更新後 dist；不新增部署密鑰。部署後使用無舊 Service Worker 控制的乾淨瀏覽器／HTTP client，核對首頁、實際 JS/CSS 路徑、/sw.js、/manifest.webmanifest 的回應標頭，再測功能。記錄網址、commit、日期及實際值；缺少正式網址或未部署時，標為未驗證並列出操作步驟，不能宣稱已生效。

若 Cloudflare 額外注入 Analytics 等腳本被阻擋，記錄網址與違規來源，交由使用者決定保留服務或停用；不得自行修改 Cloudflare 設定或擴大 CSP 白名單。Pages Functions 回應不適用 _headers，未來改架構需重新設計。

## Implementation Contract

- Observable behavior：同源 production 頁面可以操作；inline script、eval、跨來源 script／fetch 受 CSP 阻擋；第三方 iframe 無法顯示 BonusTrack。文字與錯誤仍正常顯示，無資料模型或備份格式變更。
- Interface：public/_headers 為 Cloudflare 多行路徑／標頭格式；scripts/security-preview.mjs 讀取 dist/_headers 並以 loopback:4173 提供帶標頭 production preview。測試伺服器不得依賴下載外部程式、額外 npm 套件或改雲端設定。
- Failure modes：測試設定無法解析或連接埠被佔用時非零退出；正常流程的 securitypolicyviolation 與頁面錯誤導致測試失敗。刻意阻擋測試要核對 directive、blockedURI 或執行旗標與伺服器未收到請求，不能把測試頁面的正常功能中斷誤認為成功。
- Acceptance：tests/security-headers.test.ts 驗證全域政策、精確路徑快取、衝突與無效語法拒絕；tests/e2e/security-headers.spec.ts 驗證實際標頭與阻擋。測試使用本機另一個 origin 模擬外站，不向真實第三方傳送測試資料。iframe 測試核對拒絕載入與應用未掛載，不能只檢查 iframe 元素存在。
- Compatibility：在相同帶標頭入口執行 tests/e2e/storage.spec.ts 的備份與離線重開情境，以及既有記帳流程。執行 tests/pwa.test.ts 的更新保護模擬；這不證明實際線上雙版本更新，該限制需明記。瀏覽器測試收集正常操作期間的政策違規並要求無非預期違規。
- Artifact acceptance：npm run build 後 dist/_headers 與 public/_headers 內容一致；Service Worker 與 manifest 仍有 no-cache 並與全域標頭共存；不把 Vite 普通 preview 或檔案存在當作線上證據。
- Scope boundaries：限安全標頭、其測試入口與文件。若需要變更更多應用程式行為或雲端功能，先更新本提案；不搭配其他資安修正。

## Risks / Trade-offs

- [Cloudflare 可能注入未知腳本] → 嚴格 CSP 預設阻擋；正式站檢查列出違規，不自行加入未知來源。
- [測試入口只模擬所用語法] → 對未支援規則拒絕啟動；Cloudflare 最終回應另行驗證。此工具不作正式 hosting。
- [快取中的舊 HTML 沒有新標頭] → 驗證時先使用乾淨 context；既有 PWA 經原有 prompt 更新後再驗證，不清除使用者 IndexedDB。
- [修改標頭可能阻擋 PWA 或樣式] → production 帶標頭執行備份、離線與操作回歸；失敗先定位來源，不添加 unsafe-eval。
- [尚未檢查正式站] → 驗證紀錄保留待部署項目，本機成功只代表本機可部署狀態。
- [回復方式] → 以正常後續提交還原 public/_headers 到先前政策並重新部署；新 context 確認回應，既有裝置依更新流程取得版本，不重寫 Git 歷史或清除資料。

參考：https://developers.cloudflare.com/pages/configuration/headers/ 、https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src 。
