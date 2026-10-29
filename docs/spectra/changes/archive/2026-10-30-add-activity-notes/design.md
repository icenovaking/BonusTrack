## Context

src/domain/models.ts 的 Activity 尚無備註；Purchase.note 是消費備註，不能代替活動設定。src/views/ActivityForm.vue 組合活動資料交給 Repository.saveActivity；src/views/Home.vue 在各牌卡內列出活動。src/data/repository.ts 的 validateDataset 同時服務讀取、儲存與備份驗證，saveActivity 對已有消費的活動只鎖定金額及百分比。沿用現有簡約、手機優先設計。

## Goals / Non-Goals

**Goals:**

- 新增活動備註設定及首頁直接閱讀，保存與備份皆可保留內容。
- 舊資料缺少備註仍可讀取，備註修改不改變歷史與計算結果。

**Non-Goals:**

- 不新增卡片備註、富文字、超連結解析、銀行登錄整合或雲端同步。
- 不改動消費備註、計算公式、活動可見性或封存規則。
- 本次僅新增首頁顯示；不擴展卡片內頁的唯讀活動說明。

## Decisions

### 活動備註資料正規化與相容性

Activity 使用 note 字串。validateDataset 對複製後的活動資料將缺少或 undefined 的 note 正規化為空字串；明確存在且不是字串的值一律拒絕，不將 null 強制轉字串。空白字串正規化為空字串，非空白內容保留原文及內部換行；不新增任意字數限制。此入口同時涵蓋 load、commit、parseBackup。維持 IndexedDB 與備份既有版本 1，因為沒有新增 store 或索引。相較強制升版或破壞性資料遷移，此作法讓舊資料自然載入，保留既有原子交易。

### 活動表單與首頁備註呈現

ActivityForm 在活動名稱之後提供有標籤的「備註（選填）」textarea，說明「會顯示在首頁此活動下方」，沿用表單 dirty、busy、錯誤與提交機制，不因財務設定鎖定而停用備註。Home 在活動名稱下、額度資訊前以次要文字顯示，保留換行並允許連續長字串換行；不截斷、無空白占位、無額外按鈕。相較 tooltip 或摘要展開，直接顯示符合使用者希望首頁看見提醒的需求。使用 Vue 文字插值，不使用 v-html；把備註併入既有 card-description 的對應活動描述，避免可及名稱遮蔽備註資訊。

### 備份往返與歷史不變

備註跟隨活動完整匯出與取代式匯入，包括已封存活動。saveActivity 仍保留既有財務鎖定，僅更新備註時不得變更歷史。無備註的呼叫端與測試資料需相容，新增 note 欄位時逐一確認組合活動物件的使用處，避免因其他操作而清空備註。相較另建備註儲存表，沿用 Activity 可維持同一份備份與交易邊界。

## Implementation Contract

- 範圍內：Activity.note、Repository.validateDataset/saveActivity/load/exportBackup/parseBackup/replaceFromBackup 的資料流程、ActivityForm、Home、所需樣式及對應測試與說明。
- 範圍外：卡片或消費新增欄位、API、套件升級、其他畫面重新設計。
- 表單儲存成功後返回既有卡片頁；回首頁即可見已提交備註。空白、編輯、清除、多活動隔離與重新載入皆需驗證。
- 非字串備註在資料驗證時回報 DataError validation；儲存失敗保留輸入與原資料，匯入取消或失敗保留整份原資料。
- 具體驗收：日本指定商店設定「需先登錄，限實體刷卡」，首頁只在該活動下顯示；500 元上限、6% 加碼與 100 元消費的剩餘額度在修改備註前後維持 8233 元。這些數值為已確定的驗收資料，不是量測或估計。
- 在 F:/Website/BonusTrack 執行 npm run typecheck、npm run test -- --run、npm run build、npm run test:e2e。擴充 tests/repository.test.ts，新增 tests/e2e/activity-notes.spec.ts，覆蓋本變更所有情境。
- 瀏覽器查看首頁及活動表單，驗證長文字、換行、清除、鍵盤焦點與卡片連結的可及描述；沿用既有規格的 320、390、768、1280 CSS px 與 200% 文字縮放驗收條件。尺寸為既有規格條件，非量測結果。
- docs/verification/add-activity-notes.md 分別記錄自動測試與實際瀏覽器結果；未執行項目須標示，不能以靜態檢查視為通過。

## Risks / Trade-offs

- [較長備註增加牌卡高度] → 保留完整閱讀與自然換行，不新增截斷；剩餘額度仍沿用既有主要字級。
- [舊資料缺少欄位或其他操作遺失欄位] → 以正規化入口兼容舊資料，測試活動改名、封存後備註仍保留。
- [舊版程式不提供備註編輯介面] → 本次保證新版讀取既有版本 1 備份；不承諾使用舊版修改後仍保留新欄位。

## Migration Plan

先新增相容的資料正規化與測試，再加入表單與首頁並補齊端到端測試。每階段維持型別檢查與測試通過；不移除原有資料格式。發布前備份；回退程式版本不刪除既有 IndexedDB，避免資料損失。

## Open Questions

無待決需求。後續若要求卡片內頁同步顯示或字數限制，另行調整範圍。
