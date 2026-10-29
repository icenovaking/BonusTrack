---
version: 1
slug: "src-app-vue"
primary_target: "src/App.vue"
related_targets: []
---

# 額度追蹤畫面

模式：Operate。使用者以同一支手機在外出時快速查看與記帳。範圍為首頁、卡片內頁、表單及備份設定；遵循 Spectra 已確認規格。

## Direction contract

THESIS: 卡片列表直接回答各活動還能刷多少，選卡後進入記帳，不加總不相容活動額度。
OWN-WORLD: 淺灰綠底、白色卡片、深墨綠文字與單一松綠強調；固定字級、清楚分隔、無裝飾插圖。使用者已指定簡約方向。
STORY: 先看剩餘、再選卡、填金額、保存後返回額度與紀錄。
FIRST VIEWPORT: 上方品牌與備份入口，標題及新增卡片按鈕，手機單欄卡片。卡片名稱後依活動呈現大字剩餘金額，次要列出上限與期別。寬畫面多欄。細部頁底部新增消費動作與表單完成狀態構成唯一有目的的互動回饋。
FORM: 沿用使用者與提案已指定的卡片列表與淺色簡約 RWD，不重新選方向。seed: none (user-pinned direction)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
