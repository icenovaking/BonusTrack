# 安全標頭驗證紀錄

日期：2026-11-04。變更：harden-security-headers。範圍為本機尚未提交的工作目錄；不代表正式站已更新。

## 政策與測試入口

public/_headers 為唯一標頭設定來源。所有靜態路徑具有：

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

/sw.js 與 /manifest.webmanifest 另有 Cache-Control: no-cache。實際本機 GET 已確認首頁、產出的 JS/CSS、Service Worker 與 manifest 具有標頭及正確 MIME；不是以 meta CSP 取代 HTTP 回應。

scripts/security-preview.mjs 使用 Vite preview middleware 讀取 dist/_headers，只支援本專案的 /* 與精確路徑語法。無法解析、缺少全域安全標頭、規則衝突或佔用埠時拒絕啟動。這不是 Cloudflare 完整規則模擬器，也不是正式 hosting。一般 npm run preview 和 npm run dev 不會套用此入口。

## 本機證據

以下為本輪修正後的實際成功結果；命令均正常結束。瀏覽器使用本機 Microsoft Edge、loopback production preview 與全新測試 context。

| 命令／檢查 | 最終結果 |
| --- | --- |
| npm run typecheck | 通過 |
| npm run test -- --run | 通過：5 個檔案、185 個測試；其中安全標頭／規則測試 20 項 |
| npm run build | 通過：產生 Service Worker、14 個 precache entries；dist/_headers 與 public/_headers 相同 |
| npm run test:e2e | 通過：85 項，4.4 分鐘；包含新增的 6 項安全標頭／PWA 瀏覽器測試 |
| 佔用埠檢查 | 同時啟動另一個 security-preview 時 exit 1，訊息包含 already in use，未切換埠 |
| git diff --check | 通過；新檔另逐行檢查，無行尾空白 |
| spectra validate harden-security-headers | 通過 |

上述數量與時間皆取自本輪命令輸出。完整 E2E 的先前失敗已修正並完整重跑，不以部分通過代替最終成功。測試產生的既有截圖會還原，不納入安全標頭變更。

| 契約 | 驗證名稱／方式 |
| --- | --- |
| 全域政策與同源限制 | security header policy > enforces a complete same-origin policy without script exceptions |
| 精確路徑快取規則 | security header policy > preserves exact-path update caching rules |
| 全域與精確規則合併 | security preview rules > merges global security headers with exact-path caching without leaking it to other assets |
| 無效設定拒絕 | security preview rules > rejects invalid rules instead of serving without protection；refuses to start when built rules are missing |
| 真實回應標頭與 MIME | serves global security headers and exact update caching on production assets |
| 只改標頭也改變 PWA HTML 快取版本 | versions the worker HTML cache with the deployed header policy |
| inline script 與 eval 阻擋 | blocks inline script and eval without executing their payloads |
| 跨來源腳本及連線不送出 | blocks cross-origin scripts and fetch before sending requests |
| 防止外站嵌入 | refuses cross-origin framing while direct navigation remains usable |
| 正常操作、離線與備份 | preserves bookkeeping, backups and offline reopening without policy violations |
| 既有備份／記帳回歸 | tests/e2e/storage.spec.ts、tests/e2e/workflow.spec.ts |
| 更新時未儲存輸入保護 | tests/pwa.test.ts > keeps unsaved input when an update is declined and updates after explicit discard |

eval 測試從同源網路腳本觸發瀏覽器執行，避免 CDP evaluate 的特殊權限造成假通過。該腳本僅是測試 fixture，未替換 HTML 或 Worker 的標頭。外站攻擊來源是第二個本機 origin，沒有對真實第三方送出記帳資料。正常離線測試另外確認快取 HTML 仍阻擋 inline script，其餘正常流程無政策違規或 pageerror。

已修正的測試假設：首次開頁即要求 Service Worker controller 不為 null，但現有 prompt 模式不立即接管首次 document。測試改為首次檢查 active Worker，離線重開後再檢查 controller；未變更應用程式註冊／更新流程。失敗的初次執行不列為通過證據。

完整 E2E 首跑另發現 tests/e2e/layout.spec.ts 的舊斷言仍期待卡片設定儲存鈕 sticky，但目前 src/style.css 的 .card-settings-form .form-actions 與 tests/e2e/card-settings.spec.ts 已要求 static。已將舊斷言更新為等待正確表單標題後檢查 static；沒有修改介面 CSS 或放寬 CSP。最終通過證據以修正後重跑為準。

## 正式站：未驗證

本輪未推送或部署，未提供正式站 URL，尚未確認 Cloudflare 後台、注入腳本或正式回應。以下步驟由後續部署驗證執行，不能用本機通過取代：

1. 依 README 的既有 Git 整合流程發布，確認 Cloudflare Deployments 顯示對應 commit 成功且 output directory 為 dist。標準靜態 Pages 不必新增後台標頭規則或部署密鑰。
2. 用全新瀏覽器 context 或無 Service Worker 的 HTTP client 請求正式首頁；從 HTML 取得真正的 JS/CSS 路徑，再核對首頁、JS、CSS、/sw.js、/manifest.webmanifest 的上述標頭、HTTP 狀態與 MIME。Service Worker／manifest 須另有 no-cache。
3. 記錄 URL、部署 commit、檢查日期與每項實際標頭值。在瀏覽器 Network／Console 確認正常開頁沒有 CSP 違規，並重做記帳、備份匯入匯出、離線重開。
4. 若 Cloudflare 額外注入 Analytics 等腳本遭阻擋，記錄完整 blocked URI、directive 與來源功能，由使用者決定停用功能或另行評估白名單。不自行修改 Cloudflare 或以萬用來源／unsafe-eval 規避。
5. 若已有其他 Cloudflare 回應標頭規則，以最後 HTTP 回應為準排查衝突。Pages Functions／SSR 動態回應不適用這份 _headers，不在本次範圍。

## PWA 更新、限制與回復

安全標頭會參與 Workbox 快取版本，讓只改標頭的版本也能使用既有 prompt 更新流程取得新的 HTML 回應。舊裝置在接受更新前，仍可能使用舊快取；離線裝置不能立即取得新政策。更新前儲存表單，更新後確認資料與標頭，不清除 IndexedDB。

本機新 context／離線測試及更新事件的單元模擬，不代表已完成線上雙版本更新切換或 iOS／Android 實機安裝驗證。沒有新增登入、加密、匯入限制或升級套件。

需回復時，以正常後續提交還原 public/_headers 到先前政策並重新部署；快取版本隨之改變。用乾淨 context 核對回應，既有裝置透過原更新提示取得回復版本。不重寫 Git 歷史，不清除記帳資料。

參考：[Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)。
