# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

使用者指定 Vue 純前端；本次 Spectra 提案採 TypeScript、Vite、IndexedDB 與 PWA，無後端。

## Users

主要使用者以同一支手機在外出或出國時查看信用卡加碼額度，記錄已發生的台幣消費。

## Product Purpose

自行輸入回饋上限與加碼百分比換算可刷上限，從消費紀錄推導剩餘可刷金額，用完提醒下一筆換卡。不追蹤回饋金使用量。

## Operating Context

首頁查看所有卡片及各活動額度，點卡片新增消費，儲存後更新資料。首次完成快取後可離線使用；本機資料以 JSON 匯出匯入備份。

## Capabilities and Constraints

多卡多活動；每筆最多選一個活動。日曆月或自訂結帳日，依消費日期歸期並可手動調整。僅台幣，沒有登入、跨裝置同步與銀行串接。詳細合約見 docs/spectra/changes/credit-card-bonus-tracker/。

## Brand Commitments

使用者指定 impeccable、簡約風格與 RWD；已確認淺色背景、深色文字、單一強調色、手機優先與大字剩餘額度。

## Evidence on Hand

500 元上限、6% 加碼為使用者提供的計算範例，不代表現行銀行優惠，正式資料預設為空。

## Product Principles

- 快速看到還能刷多少。
- 儲存成功才更新額度。
- 保留原始消費與歷史期別。
- 不以顏色作為唯一狀態提示。
