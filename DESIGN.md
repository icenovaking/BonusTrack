---
name: BonusTrack
description: 手機優先的簡約信用卡加碼額度介面
colors:
  accent: "#16705a"
  accent-hover: "#105943"
  bg: "#f5f7f5"
  surface: "#ffffff"
  ink: "#20382f"
  muted: "#607068"
  tint: "#eaf3ee"
  soft: "#e8eeea"
  line: "#dce4de"
  danger: "#9b4231"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 650
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 550
  amount:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.035em"
rounded:
  card: "14px"
  control: "8px"
  tag: "4px"
spacing:
  compact: "8px"
  field: "16px"
  panel: "24px"
  desktop-gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  rate-tag:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.accent}"
    rounded: "{rounded.tag}"
    padding: "1px 7px"
---

# Design System: BonusTrack

## Overview

這是一套供人完成任務的 Operate 介面。使用者已指定簡約、淺色背景、深色文字、單一強調色與手機優先 RWD；視覺以讀取與輸入的清楚程度為準，不增加行銷式大圖或裝飾性圖表。

介面以平面的白色內容表面和淺灰綠底區分層次。綠色用於主要動作、可操作文字與狀態，留白與字級負責資訊分組。這份文件記錄 src/tokens.css、src/style.css 與實際桌面／手機畫面中的系統；頁面組成與操作流程另見 PRODUCT.md 和 .impeccable/surfaces/src-app-vue.md。

**Key Characteristics:**

- 固定字級與等寬數字，方便掃讀金額。
- 白底、細描邊、圓角容器，沒有陰影堆疊。
- 統一描線 SVG 圖示，文字仍清楚說明動作。
- 手機單欄、寬畫面多欄，長內容可換行。
- 文字與顏色一起表達錯誤、用完與離線狀態。

## Colors

色彩以松綠強調與帶綠的中性色為主；警告和錯誤色只表達語意狀態。

### Primary

- `accent`：主要按鈕、連結、焦點、圖示底與正常狀態。
- `accent-hover`：主要按鈕 hover；active 使用實作中的 #0a4938。

### Neutral

- `bg`：頁面底；`surface`：標頭、卡片、表單與輸入框。
- `ink`：主要文字；`muted`：輔助文案、上限、期別與日期。
- `tint`：輕量提示、標籤、次要按鈕 hover、試算區。
- `soft`：數量標記與載入骨架；`line`：容器描邊、項目分隔線。

### Semantic states

- `danger`：錯誤文字、刪除動作、額度用完；錯誤底為 #fbefec。
- 一般提醒使用 #f6f0e3 底與 #70511e 文字；成功通知使用 #e0f0e8 底與 #17523e 文字。
- 輸入框描邊為 #c4cfc9；placeholder 為 #6f7c75。
- 選取文字使用 #c8e8dc 底與 #123b30 文字。

## Typography

刻意使用系統字型堆疊 `--font`，符合 Operate 模式的熟悉操作介面，也不依賴外部網路字型。標題、資料與控制項共用此堆疊，不設裝飾用展示字型。

- 頁面標題：2rem、700、行高 1.3、字距 -0.025em；600px 以下改為 1.625rem。
- 區段標題：1.2rem、650、行高 1.5；卡片名稱為 1.0625rem。
- 內文：1rem、行高 1.6；導讀文案和設定說明最長 65ch。
- 欄位標籤：0.875rem、550；輔助文案通常為 0.8125rem，期別與次要資料為 0.75rem。
- 額度：2.25rem、650、行高 1.25、字距 -0.035em；手機為 2.375rem。幣別使用 0.875rem，不與主要數字爭奪注意。
- 金額與計數使用 `font-variant-numeric: tabular-nums`。輸入框文字以 1rem 為基礎；金額輸入框為 2rem。

## Layout

主導覽與內容的最大外寬為 1168px。桌面內容 padding 為 48px 32px 72px；600px 以下改為 30px 20px 48px。頁首導覽可換行，保持文字放大時的可操作性。標頭最小高度在桌面為 88px、手機為 72px。

卡片網格使用 `minmax(0, 1fr)`：1000px 以上三欄，1000px 以下兩欄，600px 以下單欄。首頁卡片間距為 22px、手機為 16px；內頁活動間距為 20px、手機為 16px。表單最大寬 600px，設定頁最大寬 720px。

分組以 8px、16px、24px、32px 的重複間距為基礎，同時保留來源中依元件設定的 10px、12px、20px、22px 等值。標題與主動作可在手機換行。長標題與金額使用可換行策略，不以省略號隱藏關鍵資料。

手機內頁的新增動作使用底部 sticky 區，背景沿用頁面底並加入 `env(safe-area-inset-bottom)`。表單儲存區也保留安全區；不要將整頁截圖中的 sticky 元素重疊位置當作新的版面規則。

## Elevation & Depth

系統沒有 box-shadow。白色表面、背景色差與單一 1px 描邊形成層次；內容項目以分隔線區分。Hover 主要改變背景或邊框色，不用位移、縮放或光暈表達可操作性。

狀態轉換為 160ms ease-out，限背景、文字或邊框顏色；`prefers-reduced-motion: reduce` 會移除轉場與動畫。載入時呈現靜態骨架而非頁面進場表演。

## Shapes

卡片、活動與表單使用 14px 圓角；按鈕與輸入框使用 8px；加碼標籤為 4px。圖示底在品牌與空狀態依實作使用 8–16px 圓角，不延伸成任意的膠囊形容器。圖示使用一致 1.7 描線寬度的自製 SVG，配合圓端與圓接角。

## Components

### Buttons

主要按鈕使用綠底白字、8px 圓角、10px 20px padding、至少 48px 高；手機頁首動作的高度為 44px。Hover 轉深綠，active 再加深。次要按鈕白底、深字與細邊，hover 使用 tint；文字按鈕用綠字與透明底，至少 44px 高。

共用 focus-visible 樣式為 3px accent 外框與 4px offset。Disabled 降為 0.6 opacity，並使用不可操作游標。等待儲存時保留動作名稱並顯示「儲存中…」。

### Cards / Containers

白底、14px 圓角、1px line 邊框。首頁卡片 padding 24px，手機 22px；hover 僅把邊框改為 accent。活動面板使用相同容器語言，內部管理功能用展開列降低視覺密度。

### Empty states

空白狀態以淺色表面、細虛線邊框與置中的描線圖示呈現，不使用額外插圖。一般容器上下留白為 64px，手機為 44px；首頁使用中的精簡變體則在所有寬度使用 32px 上下留白。左右留白維持桌面 24px、手機 20px。這是已實作變體，不是全站空白狀態的新預設。

圖示底為 60px 方形、16px 圓角，內部圖示 28px，與後續內容相隔 24px。有說明文字時保留可讀行長（40ch），沒有說明時不留下空標題或空段落。首頁的文案與新增入口切換規則由 src/views/Home.vue 及對應 Spectra 規格決定，不推廣為其他頁面的通用版型。

### Inputs / Fields

輸入框與 select 最小高度 48px、11px 13px padding、8px 圓角；標籤與輸入相隔 9px。一般輸入維持白底，disabled 使用 bg 底與 muted 文字。金額輸入的 NT$ 是輔助資訊，底部以 2px accent 線強調輸入區，不另加外框。

### Navigation

白色頂部標頭帶底部分隔線；品牌及備份入口保有至少 44px 互動高度。返回連結結合描線箭頭與文字。跳至主要內容連結只在聚焦時顯示，應移動焦點而不改變 hash 路由。

### Tags and feedback

加碼比例以 tint 底、accent 字的 4px 小標籤呈現，僅為資料標記。數量用 soft 底的緊湊標記。成功訊息以低彩度綠底與勾選圖示搭配文字，錯誤與額度用完也必須有可讀文案。

### Activity notes

活動備註使用 muted 文字、0.8125rem 字級，位於活動名稱後、額度資訊前。保留原始換行並允許長字串換行，不截斷內容，也不把純文字解讀為 HTML。空備註不建立佔位區域；備註與上限、剩餘金額保持不同的資訊層級。

### Icons and assets

共用圖示來自 src/components/Icon.vue，沒有 emoji 或網路圖示字型。PWA 圖示為 scripts/generate-icons.mjs 程式繪製的白色重疊卡片；PNG 內嵌來源中繼資料，不需外部素材或圖片生成服務。

## Do's and Don'ts

### Do:

- **Do** 使用淺色背景、深色文字與單一綠色強調，讓狀態色保有語意。
- **Do** 以字級、對齊、留白和等寬數字強調剩餘可刷金額。
- **Do** 讓長卡名、活動名稱與放大文字換行，保留重要控制項。
- **Do** 保留可見鍵盤焦點、文字標籤與非純顏色狀態提示。
- **Do** 在手機底部動作中處理安全區，並以實際捲動檢查內容是否可達。

### Don't:

- **Don't** 增加裝飾性行銷區塊、大圖、漸層或回饋金圖表。
- **Don't** 以陰影、光暈或進場動畫取代清楚的分組與狀態。
- **Don't** 引入外部字型或 CDN，破壞已完成快取後的離線使用。
- **Don't** 把單張畫面的流程或截圖中 sticky 元素的位置當成全域設計 token。
