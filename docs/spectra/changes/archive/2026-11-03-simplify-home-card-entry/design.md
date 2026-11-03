## Context

src/views/Home.vue 以 showArchived 切換列表，cards 是目前列表而非全部卡片。上方新增連結目前無條件顯示，中間連結只在使用中列表空白時顯示，兩者都導向 /cards/new。tests/e2e/workflow.spec.ts 的 beforeEach 目前驗證舊首頁標題，實作時需同步更新。

## Design Source

來源為本次對話的 COVER.jpg 紅筆標記與文字指示，原始位置 C:/Users/ray.chuang/Desktop/COVER.jpg。這是現況問題截圖，沒有 .dc.html 或指定新尺寸的設計稿，故無 HTML 可快取，也不從手機截圖推算 CSS 像素。

已讀取 src/style.css 的現況值：空白框 padding 為 64px 24px，窄螢幕覆寫為 44px 20px；邊框 1px dashed #bac9c2，背景 #fafcfb。empty-icon 為 60px、圓角 16px、下方間距 24px，內部圖示 28px；Home 使用 wallet、archive 與 plus 圖示。上述是現況量測來源，並非要求保留的大框尺寸。實作只縮減使用中空白狀態上下 padding，以內容自然高度呈現，保留既有色彩與圖示。

## Goals / Non-Goals

**Goals:**

- 首頁標題與說明符合使用者刪除要求。
- 每種首頁列表狀態都只有唯一新增入口，名稱一致。
- 空白狀態不因文字移除保留原先的大量上下留白。

**Non-Goals:**

- 不重新命名其他頁面的「我的卡片」返回連結。
- 不修改表單、卡片與活動資料、計算、封存行為、路由或離線儲存。
- 不重設全站視覺，不移除封存提示、資料備份提醒或頁尾。

## Decisions

### 依目前列表切換唯一新增入口

上方入口條件為 showArchived 或 cards.length 大於零；中間入口條件為非 showArchived 且 cards.length 為零。這使空白使用中列表保留中間入口，其他狀態使用上方入口。包括全部卡片已封存時仍適用，不用全部卡片數判斷。兩個位置的顯示文字均為「新增卡片」，保留原路由。

替代方案是永遠只留上方入口；未採用，因為目前討論方向保留空白狀態的中間主要操作。

### 首頁文字與空白間距局部精簡

h1 改為「活動加碼追蹤」，移除 lead 段落。空白狀態 h2 與 p 僅在封存列表顯示，使用中狀態直接呈現錢包圖示與按鈕，不留下空標籤。若需要 CSS 覆寫，使用首頁使用中空白狀態專用類別；不改全域 empty-state，避免影響找不到卡片等其他畫面。

替代方案是沿用大框 padding；未採用，因為刪除說明後應同步縮減不必要留白。

## Implementation Contract

- 首頁在使用中及封存檢視都顯示新標題；三段被要求移除的文字均不出現。
- 使用中空白、有使用中卡片、封存空白、有封存卡片各狀態均只有一個可見且可鍵盤操作的「新增卡片」連結，導向 /cards/new。切換列表立即更新，不需重載。
- 封存空白時仍顯示「還沒有封存卡片」及「封存後的卡片與消費紀錄會留在這裡。」；使用中空白保留 wallet 圖示。
- 資料形狀與失敗處理不變：本變更只調整呈現，沿用新增表單原有儲存及錯誤處理，不新增寫入或錯誤訊息。
- 驗收：tests/e2e/home-card-entry.spec.ts 覆蓋文案、各狀態入口數量與位置、切換及新增導航；同步調整 workflow 的舊首頁標題斷言。
- 在 320px、390px、768px、1280px 與 200% 文字尺寸下目視確認標題、按鈕可讀可操作且無整頁水平捲動；確認使用中空白框上下 padding 比上述現況小，封存提示外觀未受專用樣式影響。
- 檢查命令：npm run typecheck、npm run build、npm run test:e2e -- tests/e2e/home-card-entry.spec.ts tests/e2e/workflow.spec.ts tests/e2e/layout.spec.ts。這些在實作後執行，本提案階段不執行。

## Risks / Trade-offs

- 使用 cards 作為全部卡片數會誤判封存狀態 → 明確採目前列表狀態表及全部已封存案例驗收。
- 修改共用空白樣式影響其他頁面 → 用首頁使用中狀態專用類別限制樣式。
- 新標題較長 → 在窄螢幕及放大文字狀態檢查換行與入口操作。
