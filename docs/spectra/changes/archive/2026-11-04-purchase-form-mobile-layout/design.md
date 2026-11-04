## Context

本變更修復新增與編輯消費的手機表單。src/views/PurchaseForm.vue 使用原生 date input；src/style.css 的 .form-sheet 為 Grid，手機 .form-actions 為 sticky。通用控制項已有 border-box、width:100%、min-width:0、max-width:100%，所以日期溢出仍需 Safari 重現確認。現有 tests/e2e/layout.spec.ts 有頁面溢出與表單可用性檢查，但不構成 iPhone 原生鍵盤驗證；playwright.config.ts 目前使用 msedge。

## Design Source

來源為使用者本次提供的 FLOWOUT.jpg 缺陷截圖，原始位置 C:/Users/ray.chuang/Desktop/FLOWOUT.jpg。這是問題證據而非像素設計稿，無 .dc.html，因此沒有 HTML 快取。實作依既有 src/style.css 與 DESIGN.md，不從截圖估算尺寸。

| 項目 | 確認的既有值與用途 |
| --- | --- |
| 手機表單水平內距 | 20px，沿用設計值 |
| 控制項與主要按鈕最小高度 | 48px，沿用設計值 |
| 手機表單間距 | 22px，沿用設計值 |
| 儲存圖示 | Icon 的 check，保持不變 |

## Goals / Non-Goals

**Goals:**

- 日期欄位隨可用寬度縮放，左右邊框與活動、備註一致。
- 消費儲存動作位於表單末端，隨頁面捲動，不遮住輸入。
- 保留原生日期選擇、驗證、儲存與額度更新。

**Non-Goals:**

- 不調整卡片詳情 .mobile-action，不將其他表單的動作位置一併改動。
- 不改金額計算、期別規則、資料結構、套件或部署設定。
- 不新增自訂日期選擇器或鍵盤偵測 JavaScript。

## Decisions

### 日期欄位限制在表單可用寬度

消費表單明確使用可縮小的單欄 Grid，例如 minmax(0, 1fr)。若通用 .form-sheet 的變動會擴大範圍，優先在 PurchaseForm 加專用類別。保留原生 date input；在 Safari 重現後，僅對消費日期加入必要的外觀或內部日期文字寬度規則。既有控制項寬度規則已存在，不以重複加入相同規則宣稱解決。不用 overflow:hidden 隱藏溢出或焦點框。替代方案為自訂日曆，因成本與互動變更過大而不採用。

### 儲存動作回到表單正常排版

新增消費與編輯消費共用專用樣式，覆寫手機 sticky 為正常文件排版，保留滿寬按鈕。必要時加消費表單專用掛點，避免全域取消所有 .form-actions 的 sticky。動作仍在期別與錯誤訊息之後，保留底部留白與安全區空間。替代方案為鍵盤出現時隱藏按鈕，但偵測複雜且行為不穩定；本案接受必須捲到末端儲存的取捨。

## Implementation Contract

- 範圍：只改新增與編輯消費的排版及其驗證、設計文件；其他表單與卡片詳情動作保持既有行為。
- 使用者行為：日期、活動與備註可完整操作且不造成水平捲動；儲存動作隨文件移動，鍵盤開啟時仍可捲動存取。
- 介面與資料：保留 date input、spentOn 綁定、min、max、required、save 提交流程及既有按鈕狀態；不改 repository 資料格式或路由。
- 失敗處理：必填與日期限制繼續攔截無效輸入，儲存錯誤仍顯示於按鈕之前，保留使用者輸入。
- 自動化驗收：新增與編輯於指定寬度 320、375、390、430、768、1280 CSS px，頁面與表單均無水平溢出；比較日期、活動、備註邊框，左右差各不超過 1 CSS px（指定的次像素容差）。縮短視窗高度並捲動，確認按鈕為非 sticky/fixed，且不與可見欄位重疊；錯誤訊息和展開期別仍可存取。高度至少 48 CSS px 是指定驗收值。
- 手動驗收：實際 iPhone 瀏覽器開關鍵盤、選日期、輸入備註、橫向及直向捲動到儲存；記錄機型、OS、瀏覽器版本和結果。msedge 或 WebKit 模擬皆不得代稱實機通過；缺少設備時記錄待驗證。
- 檢查命令：npm run typecheck、npm run build、npm run test:e2e -- tests/e2e/layout.spec.ts；建置後才執行依賴 preview 的 E2E。

## Risks / Trade-offs

- iOS 原生 date 尺寸與內部樣式差異 → Safari 重現後採最小修正，不提前認定根因。
- 共用選擇器影響其他頁面 → 採消費表單限定掛點並回查卡片、活動表單及詳情動作。
- 按鈕不再常駐 → 以表單末端滿寬動作與留白提供清楚完成位置。
- 無實機 → 確實標記鍵盤與日期控制項待驗證，不以自動化替代證據。
