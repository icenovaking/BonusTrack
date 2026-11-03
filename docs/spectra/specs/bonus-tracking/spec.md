# bonus-tracking Specification

## Purpose

Track the remaining eligible spending allowance for manually configured credit-card bonus activities. Enable mobile users to record completed TWD purchases and identify exhausted allowances without calculating earned rewards.

## Requirements

### Requirement: Cards and independent bonus activities

The system SHALL support multiple named cards, each with multiple named bonus activities. Each card SHALL use a calendar-month cycle or a closing day from 1 through 31; all its activities SHALL inherit that cycle. Each activity SHALL have a nonnegative TWD reward cap and a bonus percentage greater than zero and at most 100, each with at most two decimal places. Names SHALL be nonempty after trimming. The system SHALL reject invalid numbers and unsafe integer arithmetic. Card numbers and security codes SHALL NOT be requested.

#### Scenario: Create a card with separate allowances

- **WHEN** a user creates a card with two activities using caps of TWD 500 and TWD 300 and bonus percentages of 6 and 3 respectively
- **THEN** both activities SHALL have independent spending limits of TWD 8333 and TWD 10000

#### Scenario: Reject invalid configuration

- **WHEN** a cap is negative, a percentage is zero or above 100, an amount exceeds two decimal places, a name is blank, or arithmetic exceeds safe integer bounds
- **THEN** the system SHALL identify the invalid field and SHALL NOT save the configuration


<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Remaining spending allowance

The system SHALL compute the spending limit as the reward cap divided by the bonus percentage expressed as a fraction, rounded down to a whole TWD. The remaining amount SHALL be the spending limit minus all purchases assigned to the activity and period, clamped to zero. Amounts SHALL use exact integer minor-unit arithmetic. The interface SHALL display spending limits and remaining spending, and SHALL NOT calculate or display earned, used, or remaining reward money. A zero remaining amount SHALL display a textual next-purchase card-switch reminder.

#### Scenario: Deduct recorded spending

- **WHEN** purchases of TWD 100 and TWD 1000 are recorded against the same period of an activity with a TWD 500 reward cap and a 6 percent bonus
- **THEN** its limit SHALL be TWD 8333, its remaining amount after the first purchase SHALL be TWD 8233, and its final remaining amount SHALL be TWD 7233

#### Scenario: Preserve overspending and fractional purchases

- **WHEN** purchases total TWD 8333.50 against a limit of TWD 8333
- **THEN** the full purchase amounts SHALL be retained, the remaining amount SHALL be zero, and a next-purchase card-switch reminder SHALL be shown

#### Scenario: Isolate other activities and unassigned purchases

- **WHEN** a purchase is assigned to one activity or explicitly assigned to no activity
- **THEN** only the selected activity allowance SHALL decrease, or no activity allowance SHALL change respectively


<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Period boundaries and retained history

The system SHALL use date-only purchase values without UTC conversion. Calendar months SHALL include their first and last dates. A billing period SHALL include its closing date and start the day after the preceding closing date. A closing day absent from a month SHALL be clamped to that month's last day. The home page SHALL display the period containing the device's current local date. Previous records SHALL remain accessible when the current period changes.

#### Scenario: Closing-day inclusion

- **WHEN** a card closes on day 15 and purchases occur on 2026-11-15 and 2026-11-16
- **THEN** their default periods SHALL be 2026-10-16 through 2026-11-15 and 2026-11-16 through 2026-12-15 respectively

#### Scenario: Short months and leap years

- **WHEN** a card closes on day 31
- **THEN** its February closing dates SHALL be 2027-02-28 and 2028-02-29, with each following period starting on March 1

#### Scenario: Advance into an unused period

- **WHEN** the current local date enters a new period with no assigned purchases
- **THEN** the home page SHALL display full allowances for that period and historical purchases SHALL remain available


<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Completed purchase maintenance and reassignment

The system SHALL allow adding, editing, and deleting completed purchases containing a card, a purchase date, a positive TWD amount with at most two decimal places, an optional note, and at most one activity belonging to that card. New or edited purchase dates SHALL NOT be later than the current local date. With one active activity the form SHALL preselect it; with multiple activities the user SHALL choose one or explicitly choose no activity. A purchase SHALL default to its date-derived period; the user SHALL be able to override it to the preceding or following period or restore automatic assignment. Deletion SHALL require confirmation. No pre-purchase simulation SHALL be provided.

#### Scenario: Save and return to the actual period

- **WHEN** a user selects a card on the home page and successfully saves a TWD 100 purchase
- **THEN** the card detail SHALL show the saved purchase in its actual assigned period, the home page SHALL retain its current-period view, and both SHALL reflect recalculated remaining amounts

#### Scenario: Edit, delete, and move purchases

- **WHEN** a purchase is changed from TWD 100 to TWD 200, deleted after confirmation, or moved from its default period to the next period
- **THEN** the affected activity and all affected periods SHALL be recomputed from retained records without duplicate deductions

#### Scenario: Cancel deletion

- **WHEN** the user cancels purchase deletion
- **THEN** the purchase and all remaining amounts SHALL remain unchanged

#### Scenario: Reject invalid or mismatched purchase input

- **WHEN** an amount is zero, negative, nonnumeric, unsafe, or excessively precise, a date is invalid or future, an activity belongs to another card, or an override is outside the adjacent allowed periods
- **THEN** the system SHALL reject the change, explain the error, and preserve the form and stored records


<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Preserve configuration history

The system SHALL allow renaming cards and activities. Cycle settings SHALL be locked for cards with purchase history; caps and percentages SHALL be locked for activities referenced by purchases. Referenced cards and activities SHALL support archiving instead of direct deletion. Archived items SHALL remain accessible in history and SHALL reject new purchases and incoming reassignment. Existing purchases SHALL remain editable or deletable. Unreferenced items SHALL be editable and deletable, with card deletion also removing its unreferenced activities after confirmation.

#### Scenario: Change an offer after purchases exist

- **WHEN** a user attempts to change the cap of an activity referenced by a purchase
- **THEN** the system SHALL preserve its cap and explain how to archive the old activity and create a new activity

#### Scenario: Archive while preserving history

- **WHEN** a referenced activity or card is archived
- **THEN** its history SHALL remain accessible, it SHALL leave the active selection, and creating or moving purchases into it SHALL be rejected


<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Responsive mobile-first operation

The system SHALL provide a Traditional Chinese minimal interface with the remaining spending amount as the primary information. The home page SHALL list all active cards and each activity's limit, remaining amount, and period; archived cards SHALL be accessible separately. Selecting a card SHALL open its allowances and purchase history with an add-purchase action. Narrow screens SHALL use a single-column card list and wider screens SHALL adapt to multiple columns. Touch, keyboard, screen-reader feedback, and text labels for errors and exhaustion SHALL be supported.

#### Scenario: Complete the mobile workflow

- **WHEN** a user opens a card, adds a completed purchase, and returns home
- **THEN** the allowance and history SHALL reflect the persisted change without a manual reload, and success SHALL be announced accessibly

#### Scenario: Empty state and long content

- **WHEN** there are no cards, a card has no activities, or names are long
- **THEN** the interface SHALL present relevant creation actions or readable wrapping content without hiding essential actions

#### Scenario: Operate across viewport sizes

- **WHEN** the interface is exercised at viewport widths of 320, 390, 768, and 1280 CSS pixels and at 200 percent text scaling
- **THEN** essential content and controls SHALL remain available without whole-page horizontal scrolling, and primary actions SHALL remain reachable above safe areas and the mobile keyboard

<!-- @trace
source: credit-card-bonus-tracker
updated: 2026-10-29
code:
  - tsconfig.json
  - .impeccable/review/home-390.png
  - scripts/generate-icons.mjs
  - PRODUCT.md
  - public/icon-192.png
  - README.md
  - src/domain/money.ts
  - index.html
  - public/icon-512.png
  - public/apple-touch-icon.png
  - .impeccable/review/home-320.png
  - src/pwa.ts
  - src/views/Settings.vue
  - src/views/CardForm.vue
  - playwright.config.ts
  - src/domain/models.ts
  - src/state.ts
  - .codex/hooks.json
  - vite.config.ts
  - src/views/PurchaseForm.vue
  - .impeccable/review/text-200.png
  - package.json
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - src/main.ts
  - src/style.css
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - src/data/repository.ts
  - src/views/ActivityForm.vue
  - .impeccable/review/mobile-detail.png
  - src/components/Icon.vue
  - .impeccable/review/home-768.png
  - src/views/CardDetail.vue
  - public/icon.svg
  - .impeccable/design.json
  - src/tokens.css
  - src/App.vue
  - src/composables/form.ts
  - .impeccable/surfaces/src-app-vue.md
tests:
  - tests/pwa.test.ts
  - tests/e2e/settings.spec.ts
  - tests/repository.test.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/storage.spec.ts
  - tests/money.test.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
-->

---
### Requirement: Editable bonus activity notes

The system SHALL provide an optional multiline plain-text note when creating or editing a bonus activity. Notes SHALL belong to individual activities, independently of card names and purchase notes. The system SHALL preserve nonempty note text and internal line breaks, and treat empty or whitespace-only input as an empty note. Users SHALL be able to edit or clear a note even when purchases reference the activity without changing financial rules, purchases, period assignments, or allowances. Saving failures SHALL retain user input for retry and preserve the committed data.

#### Scenario: Create independent notes

- **WHEN** a user saves "需先登錄，限實體刷卡" for "日本指定商店" and leaves another activity's note empty
- **THEN** only "日本指定商店" SHALL have that note

#### Scenario: Edit after recording purchases

- **WHEN** an activity with a TWD 500 cap, a 6 percent bonus, and a TWD 100 purchase has its note changed to "已登錄"
- **THEN** the new note SHALL be saved, the financial rules and purchase SHALL remain unchanged, and the remaining allowance SHALL remain TWD 8233

#### Scenario: Clear a note

- **WHEN** a user saves empty or whitespace-only text over an existing note
- **THEN** the activity SHALL have an empty note

#### Scenario: Retry a failed note save

- **WHEN** persistence fails while saving a changed activity note
- **THEN** the system SHALL report failure, retain input for retry, and preserve the previously committed activity and purchases


<!-- @trace
source: add-activity-notes
updated: 2026-10-30
code:
  - src/main.ts
  - .impeccable/surfaces/src-app-vue.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - index.html
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .github/hooks/impeccable.json
  - .impeccable/review/home-390.png
  - .impeccable/design.json
  - README.md
  - .impeccable/review/add-activity-notes/home-390.png
  - PRODUCT.md
  - .impeccable/review/add-activity-notes/form-1280.png
  - .impeccable/review/home-320.png
  - public/icon-512.png
  - .impeccable/review/add-activity-notes/form-390.png
  - .impeccable/review/add-activity-notes/home-1280.png
  - public/icon.svg
  - src/components/Icon.vue
  - src/views/Settings.vue
  - package.json
  - public/icon-192.png
  - tsconfig.json
  - .impeccable/review/add-activity-notes/home-320.png
  - .impeccable/review/mobile-detail.png
  - .impeccable/review/text-200.png
  - src/views/PurchaseForm.vue
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - vite.config.ts
  - .impeccable/review/add-activity-notes/home-768.png
  - scripts/generate-icons.mjs
  - src/pwa.ts
  - src/views/CardDetail.vue
  - .impeccable/review/home-768.png
  - public/apple-touch-icon.png
  - .impeccable/review/add-activity-notes/form-320.png
  - src/views/ActivityForm.vue
  - .codex/hooks.json
  - docs/verification/add-activity-notes.md
  - playwright.config.ts
  - src/App.vue
  - src/data/repository.ts
  - src/domain/models.ts
  - src/domain/money.ts
  - .impeccable/review/add-activity-notes/form-768.png
  - src/tokens.css
  - src/views/CardForm.vue
  - src/composables/form.ts
  - src/style.css
  - src/state.ts
tests:
  - tests/e2e/storage.spec.ts
  - tests/repository.test.ts
  - tests/e2e/activity-identity.spec.ts
  - tests/e2e/activity-notes.spec.ts
  - tests/e2e/coverage.spec.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/settings.spec.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
  - tests/pwa.test.ts
  - tests/money.test.ts
-->

---
### Requirement: Home page activity note visibility

The home page SHALL display each nonempty activity note beneath its activity name before allowance information. Empty notes SHALL NOT create a placeholder or empty note area. Notes SHALL render as literal text with preserved line breaks and wrapping, without truncation or whole-page horizontal scrolling. Notes SHALL be available in the card link's accessible description with the corresponding activity identity and allowance. Existing activity visibility rules SHALL remain unchanged.

#### Scenario: Read multiline notes

- **WHEN** a visible activity has the multiline note consisting of "需先登錄" followed by "限實體刷卡"
- **THEN** the home page SHALL display both lines under that activity name and expose the note in the card link's accessible description

#### Scenario: Display long and literal content

- **WHEN** a note contains a long unbroken string or literal text "<b>提醒</b>" and the home page is viewed at a narrow width or enlarged text size
- **THEN** the complete note SHALL wrap without whole-page horizontal scrolling and markup SHALL display as text rather than HTML

#### Scenario: Hide empty notes

- **WHEN** an activity has an empty note or its note is cleared successfully
- **THEN** the home page SHALL show no note placeholder or empty note area

<!-- @trace
source: add-activity-notes
updated: 2026-10-30
code:
  - src/main.ts
  - .impeccable/surfaces/src-app-vue.md
  - .impeccable/review/home-1280.png
  - DESIGN.md
  - index.html
  - docs/verification/credit-card-bonus-tracker.md
  - .impeccable/review/mobile.png
  - src/domain/periods.ts
  - .github/hooks/impeccable.json
  - .impeccable/review/home-390.png
  - .impeccable/design.json
  - README.md
  - .impeccable/review/add-activity-notes/home-390.png
  - PRODUCT.md
  - .impeccable/review/add-activity-notes/form-1280.png
  - .impeccable/review/home-320.png
  - public/icon-512.png
  - .impeccable/review/add-activity-notes/form-390.png
  - .impeccable/review/add-activity-notes/home-1280.png
  - public/icon.svg
  - src/components/Icon.vue
  - src/views/Settings.vue
  - package.json
  - public/icon-192.png
  - tsconfig.json
  - .impeccable/review/add-activity-notes/home-320.png
  - .impeccable/review/mobile-detail.png
  - .impeccable/review/text-200.png
  - src/views/PurchaseForm.vue
  - .impeccable/review/desktop.png
  - src/views/Home.vue
  - vite.config.ts
  - .impeccable/review/add-activity-notes/home-768.png
  - scripts/generate-icons.mjs
  - src/pwa.ts
  - src/views/CardDetail.vue
  - .impeccable/review/home-768.png
  - public/apple-touch-icon.png
  - .impeccable/review/add-activity-notes/form-320.png
  - src/views/ActivityForm.vue
  - .codex/hooks.json
  - docs/verification/add-activity-notes.md
  - playwright.config.ts
  - src/App.vue
  - src/data/repository.ts
  - src/domain/models.ts
  - src/domain/money.ts
  - .impeccable/review/add-activity-notes/form-768.png
  - src/tokens.css
  - src/views/CardForm.vue
  - src/composables/form.ts
  - src/style.css
  - src/state.ts
tests:
  - tests/e2e/storage.spec.ts
  - tests/repository.test.ts
  - tests/e2e/activity-identity.spec.ts
  - tests/e2e/activity-notes.spec.ts
  - tests/e2e/coverage.spec.ts
  - tests/e2e/workflow.spec.ts
  - tests/e2e/settings.spec.ts
  - tests/e2e/layout.spec.ts
  - tests/periods.test.ts
  - tests/pwa.test.ts
  - tests/money.test.ts
-->

---
### Requirement: Concise home page presentation

The home page SHALL display the heading "活動加碼追蹤" in both active and archived views. It SHALL NOT display "出發前看一眼，讓每筆消費都在加碼範圍內。", "把你的第一張卡加進來", or "設定回饋上限與加碼百分比，剩下的額度交給這裡記。". The empty active view SHALL retain its wallet icon and creation action without empty heading or description placeholders. The empty archived view SHALL retain "還沒有封存卡片" and "封存後的卡片與消費紀錄會留在這裡。". The home page SHALL retain its local-data backup reminder.

#### Scenario: Open an empty active list

- **WHEN** a user opens the active home view with no active cards
- **THEN** the system SHALL show "活動加碼追蹤", the wallet icon, and the creation action without the removed explanatory text or empty text placeholders

#### Scenario: Open an empty archived list

- **WHEN** a user switches to the archived home view with no archived cards
- **THEN** the system SHALL show "活動加碼追蹤" and both existing archived empty-state messages without the removed explanatory text

#### Scenario: Read a populated list

- **WHEN** the active or archived home view contains cards
- **THEN** the new heading and backup reminder SHALL be visible, the removed explanatory text SHALL be absent, and card information SHALL remain available

---
### Requirement: Single home page card creation entry

The home page SHALL expose exactly one visible, keyboard-operable card creation link labeled "新增卡片" in every active or archived list state. It SHALL navigate to /cards/new. The empty active view SHALL place this entry inside the empty state and SHALL omit the heading-area entry. A populated active view and every archived view SHALL place this entry in the heading area and SHALL omit the empty-state entry. Placement SHALL depend on the selected list rather than the total number of stored cards and SHALL update when the user switches lists without reloading.

#### Scenario: Create from an empty active list

- **WHEN** the active list is empty and the user activates its sole "新增卡片" link
- **THEN** the link SHALL be inside the empty state and SHALL open the card creation form at /cards/new

#### Scenario: Create from a populated active list

- **WHEN** the active list contains a card and the user activates its sole "新增卡片" link
- **THEN** the link SHALL be in the heading area and SHALL open the card creation form at /cards/new

#### Scenario: Create while viewing archived cards

- **WHEN** the user views an empty or populated archived list and activates its sole "新增卡片" link
- **THEN** the link SHALL be in the heading area and SHALL open the card creation form at /cards/new

#### Scenario: Switch lists when all cards are archived

- **WHEN** the user has only archived cards and switches from the active view to the archived view and back
- **THEN** exactly one creation link SHALL remain visible in each view, moving from the active empty state to the archived heading area and back without reloading
