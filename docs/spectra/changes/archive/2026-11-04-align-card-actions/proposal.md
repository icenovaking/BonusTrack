## Summary

調整卡片詳情操作排列與全站次要操作外觀，讓「卡片設定」位於「新增活動」左側，並移除功能按鈕的常駐淡底色。

## Motivation

卡片設定目前獨立占用卡名下方一列，與活動操作分離。使用者檢視手機畫面後認為淡底色過於顯眼，希望將相關操作集中，恢復較簡潔的文字操作外觀。

## Proposed Solution

- 在「加碼額度」標題右側排列「卡片設定」、「新增活動」，使用一致的文字按鈕樣式，保留 edit 與 plus 圖示。
- 窄螢幕或文字放大導致空間不足時，整組操作換到下一行並靠右；極窄可用空間時允許組內依原順序換行，保留完整文字與點擊範圍。
- 我的卡片、返回卡片、資料與備份、查看封存、編輯、封存、刪除及次要按鈕取消常駐淡底色；刪除保留紅字，主要新增與儲存按鈕保留綠底。
- 保留 hover、active、focus-visible 與 disabled 回饋，以及既有路由與封存可見性規則。

## Impact

- Affected specs: bonus-tracking（新增卡片詳情操作排列與次要按鈕外觀要求）
- Affected code:
  - Modified: src/views/CardDetail.vue, src/style.css, tests/e2e/layout.spec.ts, DESIGN.md
  - New: .impeccable/review/align-card-actions-*.png（實作時的畫面驗證紀錄）
  - Removed: 無

保留工作目錄中尚未提交的活動儲存按鈕修正，不納入本提案的實作工作，也不回復其行為。
