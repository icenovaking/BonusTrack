## Context

CardDetail 的卡片設定目前位於 detail-heading 內，使用 button secondary；新增活動位於加碼額度的 section-heading，使用 text-button。共用 text-button、nav-link、secondary 與 text-button.danger 現在都有常駐淡底色。這是使用者看過實機畫面後要求的外觀修訂。

現有 tests/e2e/layout.spec.ts 的 shared title-row 測試涵蓋多頁返回導覽、長卡名與文字放大，並檢查我的卡片與新增活動的右側對齊。擴充時須保留這些行為。

## Design Source

來源為本次討論的使用者標記截圖 C:/Users/ray.chuang/Desktop/cardsetchange.png；截圖描述移動方向，並非可照抄的最終稿。沒有 .dc.html 或設計 bundle，故無 HTML 原稿可快取，也不將私人桌面檔案當作實作依賴。以下值取自現有 src/style.css、src/tokens.css 與 Icon 元件，屬已讀取的基準值；不是由截圖比例推算。

| 項目 | 實作約束 |
| --- | --- |
| 文字操作 | 沿用 text-button：字級 .875rem（根字級 16px 時為 14px）、最小高度 44px、padding 6px 8px、圖文間距 5px、圓角 6px |
| 圖示 | edit、plus、back；Icon 現有尺寸 20px，stroke-width 1.7 |
| 操作群組 | 目標間距 8px，屬設計指定值；以窄螢幕驗證群組可換行 |
| 一般／刪除操作文字 | --accent #16705a／--danger #9b4231 |
| 主要動作 | 維持 --accent #16705a 綠底及白字 |
| 次要操作預設底色 | transparent；不以背景掩蓋焦點框 |

## Goals / Non-Goals

**Goals:**

- 將卡片設定移入加碼額度右側操作群組，置於新增活動之前，使用相同文字按鈕外觀。
- 全站 text-button、nav-link、secondary 及 text-button.danger 在未互動時移除淡底色。
- 維持主要動作的綠底、完整文字、鍵盤操作與封存可見性；支援窄螢幕與文字放大。

**Non-Goals:**

- 不改資料模型、額度計算、IndexedDB、路由或存取權限，不加入新依賴。
- 不改品牌、活動百分比標籤、提示訊息或卡片容器背景。
- 不重新處理活動／消費表單的儲存區定位；保留本次提案前的未提交修正。

## Decisions

### 集中卡片設定與新增活動

將 card settings 連結移至具名操作群組；DOM 與視覺順序均為卡片設定、新增活動，使用 text-button。僅有這一個卡片設定入口。封存卡片仍顯示卡片設定，新增活動仍依 !card.archived 隱藏。路由保持 /cards/:cardId/edit 與 /cards/:cardId/activities/new。相較維持獨立整列，此排列減少標題區占用並集中操作。

### 操作群組靠右與窄螢幕換行

加碼額度標題與操作群組可換列；空間足夠時同列，否則整組到下一列靠右。群組內盡量同行；在 320px 與 200% 文字等無法容納完整操作的組合時，按鈕可依 DOM 順序換行並靠右，單一標籤不拆字、不截斷。群組右界維持與我的卡片右界對齊。以自然排版換行處理，不固定裝置型號或壓縮點擊高度。

### 共用次要操作透明底色

調整 text-button、nav-link、secondary 與 danger 變體的預設背景為 transparent；secondary 保留細邊框。hover／active 可使用既有 soft／line 與淡紅色作短暫回饋，focus-visible 保留 outline，disabled 保留不可用回饋。主要 primary 綠底與百分比等非操作標籤不變。相較逐頁覆寫，共用樣式避免返回、封存與管理操作出現不同底色。

## Implementation Contract

- 範圍內：CardDetail 操作群組、共用次要操作背景、DESIGN.md 規則、對應瀏覽器檢查與畫面紀錄。
- 範圍外：資料／業務層與其他表單儲存區定位、建立提交或部署。
- 可觀察行為：使用中卡片僅有一個卡片設定連結，位於新增活動前，兩者樣式一致；封存卡片僅保留卡片設定。點擊及鍵盤啟用保持原目的地。
- 共用外觀：未 hover／active 時，各共用次要操作背景計算值為透明；紅字刪除、disabled、鍵盤焦點與綠底 primary 可辨識。
- 極端排版：長卡名不截斷，操作依前述規則換行，不重疊或造成全頁橫向捲動。驗證目標為 320、390、768、1280 CSS px，以及根字級 16px／32px；這些為指定驗收條件，並非已測量結果。
- 驗證：擴充 tests/e2e/layout.spec.ts 的 shared title-row 測試與共用樣式／封存卡片檢查；聚焦與 hover 檢查分開，避免把互動背景誤認成預設。執行 npm run build 與 npx playwright test tests/e2e/layout.spec.ts，檢視新畫面紀錄；執行前確認現有測試的表單定位斷言與既有工作目錄修正相容。
- 失敗處理：排版不足改用換行，不隱藏／禁用卡片設定、不導向新頁；找不到卡片沿用現有缺失頁，不新增資料錯誤處理。

## Risks / Trade-offs

- [去掉常駐底色降低操作辨識] → 保留操作文字、圖示、點擊範圍及互動／焦點回饋，主要動作仍為綠底。
- [操作群組在大字模式無法同行] → 容許組內依原順序換行，保留完整標籤與右側對齊。
- [全站共用樣式影響備份等次要操作] → 一併列入透明底色驗證，保留 secondary 細邊框及 primary 樣式。
- [混入既有未提交修正] → apply 前檢查 Git 差異，僅將本提案變更納入工作範圍並保留原修正。
