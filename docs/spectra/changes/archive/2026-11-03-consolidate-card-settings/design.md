## Context

既有 src/views/CardDetail.vue 以 toggleArchive、removeCard 處理卡片管理，底部的 details 區塊與上方「編輯卡片」入口分離。src/views/CardForm.vue 同時服務新增與編輯卡片，existing 目前是進入頁面時讀取的物件。repository.saveCard 每次更新會替換資料中的卡片物件，因此搬入封存操作後不能繼續用舊 existing 快照回寫封存狀態。src/composables/form.ts 的 useForm 提供未儲存離頁確認，src/state.ts 的 perform 成功後會清除 dirty 並替換資料。

## Design Source

使用者於本次討論提供 c:/Users/ray.chuang/Desktop/manageCARD.jpg，圈選現行管理區塊，作為操作分散的問題證據。此圖不是新版像素設計，沒有 .dc.html 或可快取的設計交付檔；不建立虛構的設計快取或推估尺寸。實作沿用 src/style.css、src/tokens.css 的現有表單、按鈕、危險文字與分隔樣式，不重新設計視覺系統。現有值為 --danger: #9b4231、--line: #dce4de、--radius: 14px、--control-radius: 8px；沿用既有 edit 圖示，新增數值不是本次需求。

## Goals / Non-Goals

**Goals:**

- 集中卡片設定入口，讓詳情頁不再混有卡片封存與刪除區塊。
- 保留名稱編輯、週期鎖定、歷史查閱及封存／恢復／刪除的資料保護。
- 明確區隔儲存表單與管理操作，讓取消和儲存失敗可安全重試。

**Non-Goals:**

- 不搬動活動管理、消費管理，不更動首頁、額度計算、期別、備份或資料格式。
- 不更動路由、套件、共用 useForm／perform 的整體行為，不新增管理服務層。
- 不修復與此次入口調整無關的既有測試或首頁文案問題；發現時分開記錄。

## Decisions

### 沿用編輯路徑並統一卡片設定入口

沿用既有 /cards/:cardId/edit，將詳情頁連結及已存在卡片的表單標題改為「卡片設定」。新增頁仍為「新增卡片」。以既有 CardForm 承載設定，避免另建重複管理頁；詳情頁的活動管理不搬動。

### 管理操作與表單儲存分離

設定表單下方、form 元素外放置明確分隔的管理區域，僅 existing 存在時顯示。操作按鈕使用 type=button，儲存按鈕維持提交行為；新增與儲存不會觸發管理操作。名稱、週期草稿只由「儲存卡片」提交。

封存及恢復一律從目前 state.data.cards 中以 id 查找已儲存卡片，僅切換 archived 後呼叫 repository.saveCard；不得把名稱或週期草稿混入更新。保存表單時也讀取目前已儲存卡片的 archived，避免以過期快照覆寫狀態。替代方案是把管理狀態納入儲存表單，但會讓刪除等立即操作的生效時機不清楚，因此不採用。

### 確認後離頁並保留取消與失敗草稿

封存確認說明「封存後停止新增消費與活動，歷史紀錄會保留」；恢復確認說明恢復新增能力；刪除確認說明刪除卡片與所屬活動且無法復原。若 state.dirty 為真，在相同確認訊息追加「尚未儲存的修改不會儲存」。確認只出現一次；取消不儲存、不離頁、不清 dirty。

成功封存或恢復後回到 /cards/:cardId，成功刪除後回首頁；perform 成功清除 dirty，避免再出現離頁確認。失敗使用設定頁 role=alert 顯示錯誤，保留草稿、dirty 與原始儲存資料並停留原頁。錯誤處理可沿用 useForm.submit 包裝，但不修改共用組件；失敗不能呼叫離頁或主動清 dirty。

### 依全部歷史消費限制刪除

以 state.data.transactions 的 cardId 判斷所有期別是否有消費。已有紀錄時隱藏刪除按鈕，顯示「已有消費紀錄，請改用封存」；無紀錄才顯示紅色「刪除卡片」。封存卡片仍適用同一判斷。資料層沿用 repository.deleteCard 的保護與活動連帶刪除，不新增強制刪除能力。

## Implementation Contract

- In scope：卡片詳情到設定的入口、設定頁表單與管理區、取消／失敗／成功流程及相關瀏覽器測試；必要時補充局部樣式。
- Out of scope：活動管理位置、資料模型及儲存格式、共用狀態工具的語意、其他頁面重設與無關測試修復。
- 介面：保留 /cards/new、/cards/:cardId/edit、repository.saveCard(Card)、repository.deleteCard(string)、perform(operation, message)，不引入新路由或資料形狀。
- 頁面：「卡片設定」連結與標題一致；詳情頁沒有「管理這張卡片」；新增頁沒有封存、恢復、刪除。設定頁保留週期鎖定與儲存功能，管理區位於表單外下方。
- 狀態：使用中卡片顯示「封存卡片」，已封存卡片顯示「恢復使用卡片」。重載後狀態與資料一致。原先封存的活動不因恢復卡片而改變狀態。
- 邊界：本期無消費但上期有消費，仍不得刪卡；完全沒有消費的卡片，確認刪除後卡片和其活動一併移除，其他卡片資料不變。
- 草稿：修改卡名但尚未儲存時，確認封存只改 archived，返回詳情仍顯示已儲存卡名；取消或寫入失敗則保留修改中的卡名。空白或無效草稿不應阻擋獨立管理操作。
- 失敗與重複操作：管理期間停用儲存及管理按鈕，沿用 state.busy 防重複執行。遇到找不到卡片則顯示錯誤且不寫入、不跳轉；既有 id 無卡片時不顯示新增卡片的可提交表單，提供返回首頁方式。
- 驗收：tests/e2e/card-settings.spec.ts 覆蓋集中入口、新增隔離、儲存及週期鎖定、封存／恢復、草稿、取消、刪除限制與連帶刪除、寫入失敗後重試。tests/e2e/coverage.spec.ts 的封存流程改從設定頁進入，保留歷史及新增消費限制斷言。重新搜尋其他舊入口選擇器並只遷移相關案例。
- 驗證命令：npm run typecheck、npm run build、npm run test -- --run、npm run test:e2e -- tests/e2e/card-settings.spec.ts tests/e2e/coverage.spec.ts tests/e2e/workflow.spec.ts。Playwright preview 讀取建置結果，先完成 build；不重用來源不明的 preview。
- 視覺驗收：在窄螢幕與桌面檢查設定頁，按鈕可用鍵盤操作、錯誤可被讀取、沒有水平溢出，主要儲存與刪除在位置及色彩上可區分。保留檢查證據，未實際完成者明列。

## Risks / Trade-offs

- 管理操作增加進入設定頁的步驟 → 以固定入口換取詳情頁專注記帳，入口文字與標題保持一致。
- existing 快照在 state.data 替換後失效 → 狀態寫入以 id 重新取得已儲存卡片，封存／恢復成功即離開表單。
- 管理操作意外通過表單驗證或順便儲存 → 管理按鈕置於 form 外，明確指定按鈕型別，測試無效草稿及未提交名稱。
- 取消或失敗清除 dirty → 只在 perform 成功後離頁；測試失敗保留草稿並在重試後檢查儲存資料。
- 既有 coverage.spec.ts 含與目前首頁規格不同的空狀態文案 → 驗證時記錄是否為原有失敗，不以本次提案擴大首頁修改範圍。
