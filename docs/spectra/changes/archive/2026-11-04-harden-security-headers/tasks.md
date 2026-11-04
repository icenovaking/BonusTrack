## 1. 標頭政策與本機入口

- [x] 1.1 落實 Versioned static response headers 與「public/_headers 作為標頭來源」：加入全域 CSP、DENY、nosniff、no-referrer，保留 Service Worker／manifest 的 no-cache；以 tests/security-headers.test.ts 檢查完整政策、未重複或缺少的標頭，以及 npm run build 後 public/_headers 與 dist/_headers 相同。
- [x] 1.2 [after: 1.1] 落實「帶標頭 production 測試入口」與 Verifiable deployment and explicit evidence boundaries：新增 scripts/security-preview.mjs，以 Vite preview middleware 套用 dist/_headers 的全域與精確路徑規則；缺檔、無效／不支援語法、衝突標頭與佔用埠均非零失敗；規則解析函式可單獨匯入且不啟動伺服器。擴充 tests/security-headers.test.ts 驗證合併與拒絕分支，修改 playwright.config.ts 使用 loopback 帶標頭入口並禁止重用既有伺服器；以實際 HTTP GET 核對首頁、build JS/CSS、sw.js、manifest 的標頭與 MIME。

## 2. 瀏覽器阻擋與相容性

- [x] 2.1 [after: 1.2] 依「強制同源 CSP 並保留 PWA」驗證 Enforced resource and execution restrictions 與 Protection against framing：新增 tests/e2e/security-headers.spec.ts，測試 inline script／eval 不執行、另一個本機 origin 的 script／fetch 被阻擋且未收到請求，以及外站 iframe 無法顯示應用而直接開啟正常。核對 CSP directive、執行旗標及 iframe 拒絕結果；不得以測試工具繞過 CSP 後的結果當作瀏覽器執行證據。
- [x] 2.2 [after: 2.1] 驗證 Local workflows remain compatible with enforced policies：在 tests/e2e/security-headers.spec.ts 收集正常流程 securitypolicyviolation，確認同源資源、記帳與剩餘額度、blob 備份下載、備份還原及快取後離線重開無非預期違規；在相同入口重跑 tests/e2e/storage.spec.ts 與既有 workflow 情境。執行 tests/pwa.test.ts 驗證拒絕更新保留輸入、確認放棄後更新及儲存中保護；明記模擬事件不能證明線上雙版本更新。若正常功能失敗先定位來源，不直接加入 unsafe-inline／unsafe-eval 或第三方白名單。

## 3. 部署指引與交付紀錄

- [x] 3.1 [after: 2.2] 落實「正式站驗證與本機證據分開」：更新 README.md 並新增 docs/verification/harden-security-headers.md，說明靜態 Pages 的 _headers 發布機制、本機入口用途、Pages Functions 排除、既有 PWA 更新與正常提交回復流程；提供乾淨 context 核對正式首頁、JS/CSS、sw.js、manifest 回應及額外注入腳本的步驟。無正式網址／部署時標示未驗證，不改 Cloudflare 設定；以文件逐項核對上述契約及規格的 unverified／injected script 情境。
- [x] 3.2 [after: 3.1] 完成交付檢查並更新 docs/verification/harden-security-headers.md 的實際結果：執行 npm run typecheck、npm run test -- --run、npm run build、npm run test:e2e 與 git diff --check；記錄本機標頭值、阻擋測試、正常功能／離線結果及正式站已驗證或未驗證狀態。若有正式站證據記錄 URL、commit、日期與回應值，否則保留具體檢查步驟；失敗、未執行與模擬結果須分別揭露，不因本機通過宣稱上線。
