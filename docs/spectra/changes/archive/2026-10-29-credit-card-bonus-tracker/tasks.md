## 1. 應用基礎與計算

- [x] 1.1 建立「Vue 應用基礎與功能分工」：Vue、TypeScript、Vite、hash 路由、空首頁與測試入口可啟動，確認套件相容性並保存鎖檔；以 npm run build、npm run typecheck 及首頁路由重新整理驗證。此階段不加入伺服器；如 .codegraph/ 已出現，程式修改前先依專案指引做影響分析。
- [x] 1.2 [after: 1.1] 落實「額度計算與輸入驗證」及 Remaining spending allowance，在 src/domain/ 以精確整數分完成上限向下取整、消費扣減、零下限與活動隔離；撰寫測試時使用 code-testing-agent skill，以 Vitest 驗證 500/6%=8333、100 後 8233、再 1000 後 7233，以及小數、零上限、超額與不安全數值被拒絕。
- [x] 1.3 [after: 1.2] 落實「期別與歷史歸屬」及 Period boundaries and retained history，提供日期字串歸期、結帳日含當天、前後一期及手動覆寫；以固定今天的測試驗證 15/16 日、31 日短月、閏年、跨年、新期不刪舊資料及日期不受 UTC 轉換影響。

## 2. 本機資料與設定

- [x] 2.1 [after: 1.3] 落實「IndexedDB 與原子備份」的持久化部分及 Durable local transactions，建立 cards、activities、transactions、meta 與提交後更新的共用狀態；以 IndexedDB 整合測試驗證關閉重開還原、寫入拒絕及讀取失敗不清空資料，並確認不持久化衍生剩餘額度。
- [x] 2.2 [after: 2.1] 實作 Cards and independent bonus activities 的建立與無紀錄設定維護，卡片可選日曆月或自訂結帳日、建立多活動並顯示各自上限；以表單測試驗證空白名稱、無效比例與金額被拒絕，建立 500/6% 與 300/3% 後上限互不影響，重新整理仍存在。
- [x] 2.3 [after: 2.2] 實作 Preserve configuration history，允許改名、鎖定有消費的相關規則、有紀錄項目僅能封存並保留歷史，無紀錄項目經確認可刪除；以整合測試驗證封存後不能新增或移入消費、仍可刪改既有紀錄，卡片刪除不留下孤兒活動。

## 3. 手機額度與記帳流程

- [x] 3.1 [after: 2.3] 依「impeccable 簡約 RWD 與操作可及性」及 Responsive mobile-first operation 建立首頁與卡片內頁；先使用 impeccable 設計流程，實作淺色、深字、單一強調色、大字剩餘額度，手機單欄及寬螢幕多欄，顯示期別、無卡/無活動引導與封存歷史入口；以窄寬視窗截圖確認每個活動獨立顯示、長名稱換行且不加入回饋金圖表。
- [x] 3.2 [after: 3.1] 實作 Completed purchase maintenance and reassignment 的新增流程：日期預設今天、台幣金額、備註及最多一個活動，單活動預選、多活動明確選取、不適用選項；儲存期間禁重送、失敗保留輸入，提交成功才更新首頁及內頁並切至實際期別。以瀏覽器流程及失敗注入驗證輸入 100 後剩 8233、連按不重複、未來日期與跨卡活動被拒絕且成功狀態可播報。
- [x] 3.3 [after: 3.2] 完成消費編輯、確認刪除、依日期預設與前後期覆寫/恢復，保留卡片既有歷史並顯示零額度換卡提醒；以流程測試驗證改金額、取消/確認刪除、移期後原期及目標期重算，超額紀錄完整保留，首頁仍顯示今天所在期。

## 4. 備份與離線

- [x] 4.1 [after: 3.3] 實作 Complete versioned backup export 及 Validate and atomically replace imported data 的畫面與交易：含封存及歷史紀錄的 JSON、版本與外鍵/金額/日期驗證、摘要確認完整取代；以匯出還原測試驗證所有欄位、重複匯入不加倍，取消、毀損檔、不支援版本、無效關聯與交易中斷皆保留舊資料。
- [x] 4.2 [after: 4.1] 落實「PWA 離線與更新」及 Offline application shell and local workflows，加入本機資源快取、manifest、圖示與快取完成狀態，避免外部字型/CDN；以 production build 的本機預覽驗證先快取後關網重開首頁與卡片 hash 路由，離線新增/刪改後重開仍一致，備份可離線操作，初始快取失敗不宣稱離線就緒。
- [x] 4.3 [after: 4.2] 實作 Installation and safe updates 的安裝說明與可控更新提示；以支援及不支援安裝事件的環境驗證瀏覽器仍可用，更新遇未保存表單不重載，確認保存/放棄後啟用更新且 IndexedDB 紀錄保留。

## 5. 驗收與交付

- [x] 5.1 [after: 4.3] 完成 RWD、可及性與手機操作驗收：於 320、390、768、1280 CSS px 和 200% 文字縮放檢查無整頁水平捲動、長名稱、零額度、錯誤與空狀態，驗證主要觸控目標至少 44 CSS px、表單字體至少 16 CSS px、焦點/標籤/非純顏色提示，以及手機鍵盤與安全區不遮住主要動作；依 impeccable 檢視實際渲染結果並修正，將實機未驗證項目明列於交付紀錄。
- [x] 5.2 [after: 5.1] 執行 npm run typecheck、npm run test -- --run、npm run build 及瀏覽器端完整記帳/備份/離線回歸，確認畫面無已用回饋金與跨裝置同步功能；在 README.md 記錄啟動、靜態 HTTPS 部署需求、手機安裝、本機資料限制、備份與還原步驟及實際驗證範圍，以指令結果和逐項操作紀錄驗收，不在本變更直接部署。
