# simplify-page-navigation 驗證紀錄

日期：2026-11-04（Asia/Taipei）。環境：Windows、Microsoft Edge headless、Playwright 單一 worker、Vite production preview（localhost:4173）。這是本機程式與瀏覽器驗證，未部署，也未以實體 iPhone／Safari 驗收。

## 結果

| 檢查 | 本輪實測結果 |
| --- | --- |
| npm run build | 通過，包含 TypeScript／Vue 型別檢查、production assets、manifest 與 Service Worker；exit 0 |
| npm run test -- --run | 4 個檔案、165 項單元測試通過；exit 0 |
| npm run test:e2e -- tests/e2e/layout.spec.ts | 4 項通過；exit 0 |
| npm run test:e2e -- tests/e2e/home-card-entry.spec.ts tests/e2e/storage.spec.ts | 11 項通過；exit 0 |
| npm run test:e2e | 首次整體執行為 65 項通過、2 項舊文字斷言失敗；exit 1。兩項已修正，見下列受影響檔案重跑紀錄 |
| npm run test:e2e -- tests/e2e/coverage.spec.ts | 修正封存短提示、首頁標題及新增入口名稱後，5 項全部通過；exit 0 |
| npm run typecheck | 更新 coverage.spec.ts 斷言後通過；exit 0 |
| 設計索引與 git diff --check | JSON 解析、9 個元件片段、色階、類別前綴、來源對齊規則及索引時間檢查通過；無空白錯誤 |

最終建置與單元測試於本日 10:33 左右執行；瀏覽器整體回歸隨後開始，受影響檔案重跑於 10:38 完成。全部 67 個不同瀏覽器案例已有本輪通過紀錄：整體執行中的其餘 65 項未變，coverage.spec.ts 的 5 項重跑涵蓋原失敗的 2 項及同檔案的其餘 3 項。不是宣稱整體命令曾一次全部通過；修正後僅重跑受影響檔案，沒有重跑全部 67 項。上述數量均來自本輪命令輸出，不沿用提案前的部分通過紀錄。

## 規格情境與證據

| 情境 | 證據 |
| --- | --- |
| Return from each supported page | layout.spec.ts 的 shared title-row 測試：卡片詳情、卡片新增／設定、活動新增／編輯、消費新增／編輯、設定、缺失卡片詳情／設定共 10 個畫面；檢查 href、鍵盤啟動後目的地、圖示、可讀名稱與焦點外框 |
| Cancel return with unsaved input | return confirmation 測試：卡片、活動與消費新增／編輯共 6 個表單，連續取消返回後仍保留草稿、位置與再次提示離開的保護 |
| Confirm return with unsaved input | 同一測試確認離開後重新開啟表單，原始欄位未變；匯出並比較完整 cards、activities、transactions，確認未提交草稿或新增資料 |
| Read a long heading across shared use sites | shared title-row 測試以 320、390、768、1280 CSS px，分別使用 16px 及 32px 根字級（100%／200%）；檢查中心及右邊界誤差至多 1 CSS px、無重疊、無全頁橫向捲動、返回標籤不拆行 |
| View concise pages without losing actions | 所有上述畫面檢查無 footer；原始檔核對指定導讀移除、必要規則與管理操作保留；既有消費表單、首頁與管理回歸驗證操作可用 |
| Identify the card and archived state | 活動／消費表單保留卡名的原始檔核對及消費表單截圖；coverage.spec.ts 的 archived cards 測試檢查「已封存」、歷史紀錄可讀可編輯及禁止新增消費 |
| Keep a concise backup reminder | home-card-entry.spec.ts：使用中／封存的空與有資料清單、切換清單，檢查盾牌圖示、「定期備份」、無頁尾與單一新增卡片入口 |
| View preparation states in settings | storage.spec.ts：成功快取顯示「離線可用」及勾選；攔截初次註冊失敗顯示重試；保持註冊等待顯示「離線準備中」，返回首頁不出現離線狀態 |
| Use cached records without a footer | storage.spec.ts：完成快取後關閉頁面、斷網、從卡片網址重開、新增消費、重載、匯出及確認匯入；檢查紀錄與額度保存 |
| Read restoration consequences before confirmation | storage.spec.ts 的 importData 核對本機資料提示、不合併／取代警告、紀錄數量、預覽警告與不可復原確認訊息；既有取消還原與失敗保留測試持續通過 |

所有金額、名稱及日期是測試資料，並非銀行條款。版面檢查的寬度、字級與容許誤差是驗收輸入，並非效能估計。

## 本輪發現與修正

- 鍵盤焦點測試最初使用滑鼠模式下的程式聚焦，沒有觸發 focus-visible；已改為先切換鍵盤操作，再驗證焦點外框，保留原有樣式。
- 跨頁測試發現 320px／200% 文字時「新增活動」換行靠左，與返回按鈕的右邊界相差 127 CSS px（失敗輸出實測）。新增 section-heading 文字動作的 margin-left: auto，保持換行後靠右；四種寬度與兩種文字尺寸的測試已通過。
- DESIGN.md 與 .impeccable/design.json 已記錄並預覽換行後仍靠右的規則。原有頁面修改沿用，未重作資料或快取邏輯。
- 整體回歸發現 coverage.spec.ts 仍尋找已移除的封存長句、首頁空白標題與舊新增入口；僅更新三處文字斷言／定位，保留封存歷史、重新開啟、編輯歷史及建立卡片／活動的整個流程，重跑該檔案全部通過。

## 畫面檢視

已人工檢視 390px 寬度下的卡片標題、設定頁與消費表單，以及 200% 文字的長卡名與消費表單；必要欄位、提示與儲存動作保持可見。全頁截圖中的 sticky 按鈕位置受截圖時的捲動位置影響，控制項實際可達性另由捲動與焦點測試驗證。

- [長卡名與返回，正常文字](../../.impeccable/review/navigation--cards-nav-16.png)
- [長卡名與返回，200% 文字](../../.impeccable/review/navigation--cards-nav-32.png)
- [備份設定，正常文字](../../.impeccable/review/navigation--settings-16.png)
- [消費表單，200% 文字](../../.impeccable/review/navigation--cards-nav-purchases-new-32.png)

## 驗證範圍

本輪瀏覽器檢查使用桌面 Edge 的視窗與文字尺寸調整，未模擬或操作實體手機鍵盤。沒有部署、遠端網站、銀行服務或真實使用者資料驗證。Spectra 回報 Git baseline 不可用，因此每個工作以明列檔案記錄歸屬；沒有以整個工作樹推定變更範圍。
