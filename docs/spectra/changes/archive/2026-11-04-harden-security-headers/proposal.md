## Problem

BonusTrack 的 Cloudflare Pages 靜態回應尚未透過 repository 設定安全標頭，瀏覽器缺少資源來源限制、防嵌入及內容類型保護。需要讓部署後的瀏覽器強制執行這些規則，同時保留記帳、備份與 PWA 離線功能。

## Root Cause

public/_headers 目前只設定 /sw.js 與 /manifest.webmanifest 的 Cache-Control，index.html 也沒有 CSP。現有 Playwright 設定使用 Vite preview，不能將一般預覽成功視為 Cloudflare 已套用 _headers 的證據。

## Proposed Solution

- 新增 capability `static-response-security`，定義安全回應標頭、瀏覽器阻擋行為及 PWA 相容性；既有 bonus-tracking 與 local-data-portability 規格維持原要求。
- 以 public/_headers 作為標頭設定來源，加入強制執行的同源 CSP、禁止 iframe 嵌入、nosniff 與 no-referrer，保留原有快取規則。
- 用確實附加相同 HTTP 標頭的本機 production 測試環境驗證正常功能與阻擋行為，並檢查 dist/_headers。
- 文件說明標準靜態 Pages 部署不需修改 Cloudflare 後台；記錄正式站驗證及額外腳本衝突的處理方式。

## Non-Goals (optional)

不加入匯入大小限制、不加密資料、不升級依賴、不新增登入或 Cloudflare Access，不變更 Cloudflare 帳號設定或自動部署。完整範圍界線見 design.md。

## Success Criteria

- 新的 static-response-security 規格情境均有對應驗證，CSP 禁止 inline script、eval 與未允許的跨來源載入／連線，其他網站無法以 iframe 嵌入應用。
- 同源靜態資源與 Service Worker、正常記帳、JSON 匯入匯出及離線重開不受阻擋；更新提示與未儲存資料保護保留。
- production 產物包含正確的 _headers，既有 sw.js 與 manifest 快取規則保留。
- 驗證紀錄分開列出本機帶標頭測試與正式站檢查；未取得正式網址或尚未部署時，線上結果標記未驗證，不宣稱已上線。

## Impact

- Affected code:
  - Modified: public/_headers, README.md, playwright.config.ts, vite.config.ts, tests/e2e/layout.spec.ts
  - New: tests/security-headers.test.ts, tests/e2e/security-headers.spec.ts, scripts/security-preview.mjs, scripts/security-preview.d.mts, docs/verification/harden-security-headers.md
  - Removed: none
- Affected specs: 新增 static-response-security；既有規格無要求變更。
- Dependencies: 不新增 npm 套件；測試伺服器使用 Node.js 內建模組。
- Deployment: 沿用 Cloudflare Pages Git 整合及 dist 發布目錄；Pages Functions／SSR 不在本次範圍。
