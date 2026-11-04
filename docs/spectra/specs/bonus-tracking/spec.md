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

---
### Requirement: Unified card settings entry

The system SHALL expose a "卡片設定" link on card details that opens /cards/:cardId/edit and a matching heading for an existing card. The settings page SHALL retain card name editing, cycle configuration, purchase-history cycle locking, and explicit card saving. Card archive, restore, and eligible deletion controls SHALL appear below and outside the edit form, separated from its save action. Card details SHALL NOT expose the former "管理這張卡片" section. Activity management SHALL remain on card details. /cards/new SHALL retain the "新增卡片" heading and SHALL NOT expose card archive, restore, or deletion controls. An edit URL for a missing card SHALL display an error and a home navigation action instead of an actionable creation form.

#### Scenario: Open settings from card details

- **WHEN** a user activates "卡片設定" from an existing card's detail page
- **THEN** the system SHALL open that card's settings at /cards/:cardId/edit, show the matching heading and card form, and expose management below the form

#### Scenario: Keep card details focused

- **WHEN** a user opens card details
- **THEN** the system SHALL omit "管理這張卡片", retain activity management, and retain the existing purchase creation visibility rules

#### Scenario: Save configuration with history protection

- **WHEN** a user opens settings for a card with purchase history, changes its name, and explicitly saves
- **THEN** cycle controls SHALL remain locked, the new name SHALL persist without changing its cycle or archived state, and the system SHALL return to card details

#### Scenario: Keep creation separate

- **WHEN** a user opens /cards/new
- **THEN** the system SHALL show "新增卡片", retain card creation, and omit all card management controls

#### Scenario: Handle a missing settings target

- **WHEN** a user opens an edit URL for a card that does not exist
- **THEN** the system SHALL display an error and a home navigation action without allowing card creation or management through that URL

---
### Requirement: Independent card archive and restore actions

The system SHALL show "封存卡片" for an active card and "恢復使用卡片" for an archived card in settings. Each action SHALL require confirmation and SHALL operate on the latest committed card, changing only its archived state. Archive confirmation SHALL explain that new purchases and activities stop while history is retained; restore confirmation SHALL explain that new entries become available again under existing eligibility rules. When the form has unsaved changes, the same confirmation SHALL explain that those changes will not be saved. Management actions SHALL operate independently of form validity and SHALL NOT submit card name or cycle drafts. Cancellation SHALL retain drafts and dirty state without writes or navigation. Success SHALL return to card details without another unsaved-change prompt. Persistence failure SHALL display an alert, preserve drafts, dirty state and committed data, and remain on settings for retry. Save and management controls SHALL be disabled while a management write is pending. Restoring a card SHALL NOT restore independently archived activities.

#### Scenario: Archive with an unsaved name

- **WHEN** the committed card name is "旅遊卡", the draft name is "尚未儲存", and the user confirms archive after reading the unsaved-change warning
- **THEN** the system SHALL return to details showing "旅遊卡" as archived, retain its activities and purchases, and show no additional leave confirmation

#### Scenario: Restore an archived card

- **WHEN** the user confirms "恢復使用卡片" for an archived card
- **THEN** the system SHALL return to active card details, retain committed card configuration and history, and preserve each activity's archived state after reload

#### Scenario: Cancel management with an invalid draft

- **WHEN** a user clears the name draft, activates archive or restore, and cancels its confirmation
- **THEN** the system SHALL show confirmation independently of name validation and retain the empty draft, dirty state, committed data, and settings location

#### Scenario: Confirm management with an invalid draft

- **WHEN** a user clears the name draft and confirms archive or restore
- **THEN** the system SHALL update only the committed card's archived state and return to card details with the original saved name

#### Scenario: Retry a failed management write

- **WHEN** persistence fails after a user confirms archive or restore with an unsaved name draft
- **THEN** the system SHALL show an alert, retain the draft and dirty state on settings, leave committed data unchanged, re-enable actions when the operation ends, and allow a confirmed retry without saving the draft

---
### Requirement: History-aware card deletion in settings

The system SHALL expose a red "刪除卡片" action in settings only when no purchase in any period references the card. For cards with purchase history the system SHALL omit the executable delete action and display "已有消費紀錄，請改用封存". This rule SHALL apply to active and archived cards independently of the selected period. Deletion SHALL require confirmation explaining that the card and its activities will be removed irreversibly; with unsaved edits the same confirmation SHALL state that drafts will not be saved. Successful deletion SHALL remove the card and its activities, preserve unrelated records, and return home without an additional leave prompt. Cancellation and persistence failure SHALL preserve the card, activities, drafts and dirty state on settings; failures SHALL display an alert and permit retry. Pending deletion SHALL disable save and management controls. The data layer SHALL continue rejecting deletion of cards referenced by purchases.

#### Scenario: Preserve earlier-period history

- **WHEN** a card has no purchases in the displayed period but has a purchase in an earlier period and the user opens its settings
- **THEN** the system SHALL omit the executable delete action and display "已有消費紀錄，請改用封存"

#### Scenario: Delete an unreferenced card and its activities

- **WHEN** a card has activities but no purchases in any period and the user confirms deletion with an unsaved name draft
- **THEN** the system SHALL remove that card and its activities, preserve unrelated cards and their records after reload, return home, and show no additional leave prompt

#### Scenario: Cancel eligible deletion

- **WHEN** the user cancels deletion confirmation for an unreferenced card
- **THEN** the system SHALL retain its card, activities, draft values, dirty state and settings location

#### Scenario: Retry failed deletion

- **WHEN** persistence fails during confirmed deletion of an unreferenced card
- **THEN** the system SHALL show an alert, retain the card, activities and draft on settings, preserve dirty state, re-enable actions when the operation ends, and permit a confirmed retry

---
### Requirement: Responsive purchase form access

The system SHALL allow users to create and edit purchases without horizontal page or form scrolling at supported phone, tablet, and desktop widths. The purchase date SHALL remain a native date control and SHALL remain fully operable within the form. Purchase validation, date restrictions, and persistence behavior SHALL remain unchanged.

#### Scenario: Enter a purchase on a narrow screen

- **WHEN** a user opens purchase creation or editing on a phone and enters an amount, selects a date and activity, and enters a note
- **THEN** every control SHALL remain within the available form width and SHALL be operable without horizontal scrolling

#### Scenario: Continue editing after resizing

- **WHEN** a user changes orientation or resizes a purchase form between phone, tablet, and desktop widths
- **THEN** the form SHALL retain entered values and SHALL allow date selection and purchase submission without horizontal scrolling

---
### Requirement: Unobstructed purchase submission

The system SHALL place the purchase save action after the period controls and any error message in normal document flow. The action SHALL scroll with the form rather than remain attached to the viewport. Users SHALL be able to scroll to and operate all purchase fields and the save action while the on-screen keyboard is open.

#### Scenario: Fill fields with the phone keyboard open

- **WHEN** a user focuses an amount or note field in purchase creation or editing and the on-screen keyboard opens
- **THEN** the save action SHALL NOT float over the visible fields, and the user SHALL be able to scroll to every field and the save action

#### Scenario: Review validation and submit

- **WHEN** a user expands the period controls or receives a purchase validation error
- **THEN** the period controls and error message SHALL remain reachable before the save action, and correcting the input SHALL allow the existing save flow to complete

---
### Requirement: Shared title-row return navigation

The system SHALL present the return action beside the main heading on card details, card creation and settings, activity creation and editing, purchase creation and editing, and settings. The shared title-row layout SHALL keep the heading on the left and the return action on the right, vertically centered, using the back-arrow icon and either "我的卡片" or "返回卡片". Missing-card views that offer home navigation SHALL use the same layout. On card details the return action SHALL share its right boundary with the add-activity action when that action is available. Long headings SHALL wrap without truncation, overlapping the return action, splitting its label, or introducing whole-page horizontal scrolling. Keyboard focus and an accessible link name SHALL remain available.

#### Scenario: Return from each supported page

- **WHEN** a user opens a supported page and activates its return link by pointer or keyboard
- **THEN** the shared title-row contract SHALL be present and the destination SHALL be home for card details, card creation, settings and missing-card views, or the associated card details for card settings, activity forms and purchase forms

#### Scenario: Cancel return with unsaved input

- **WHEN** a user edits a form, activates its return action, and cancels the unsaved-change confirmation
- **THEN** the system SHALL retain the route, entered values and dirty state without saving or changing stored records

#### Scenario: Confirm return with unsaved input

- **WHEN** a user edits a form, activates its return action, and confirms leaving without saving
- **THEN** the system SHALL navigate to the link destination without committing the draft

#### Scenario: Read a long heading across shared use sites

- **WHEN** supported pages are displayed at 320, 390, 768 and 1280 CSS-pixel widths with normal text or 200 percent text scaling
- **THEN** the shared title-row contract SHALL retain the full heading and operable return action without overlap or whole-page horizontal scrolling

---
### Requirement: Concise page shell and supporting copy

The system SHALL omit the global footer brand and offline-status row while retaining the top-level brand and settings navigation. It SHALL omit the repeated introductions "追蹤加碼額度，記下每一筆消費。", "先設定卡片，再加入你想追蹤的加碼活動。", "每個活動各自追蹤額度。", "記錄已發生的消費。" and "讓記錄留得住，換手機也能帶著走。". Card identity in activity and purchase forms and archived-card status SHALL remain visible. The home backup reminder SHALL use the shield icon and "定期備份". Return actions and that reminder SHALL use the specified four-character labels; this character limit SHALL NOT apply to user-entered content, headings, form rules, validation errors, destructive confirmations or installation guidance. Simplification SHALL preserve card creation, card settings, activity management, allowance values, purchase history and exhausted-allowance reminders.

#### Scenario: View concise pages without losing actions

- **WHEN** a user opens home, card details or a form
- **THEN** the system SHALL omit the global footer and listed repeated introductions while retaining relevant actions, data, form rules and accessible feedback

#### Scenario: Identify the card and archived state

- **WHEN** a user opens an activity or purchase form or views an archived card
- **THEN** the system SHALL retain the associated card name or archived status respectively without restoring the removed introduction

#### Scenario: Keep a concise backup reminder

- **WHEN** the user views an empty or populated active or archived home list
- **THEN** the system SHALL show the shield icon and "定期備份" reminder while retaining the existing single card-creation entry rules

---
### Requirement: Grouped card detail actions

The system SHALL provide a single "卡片設定" action followed by "新增活動" in an action group associated with "加碼額度". Both actions SHALL use the shared text-action presentation. Card settings SHALL remain available for active and archived cards and SHALL navigate to the existing card settings route. Adding an activity SHALL remain available only for active cards and SHALL navigate to the existing activity creation route. The group SHALL follow the heading on a separate row when necessary and SHALL retain readable, operable actions without horizontal page scrolling. If the group itself cannot fit, its actions SHALL wrap in the same reading order without splitting individual labels. Existing title-row return navigation SHALL remain available.

#### Scenario: Use active card actions

- **WHEN** a user views an active card and activates either grouped action by pointer or keyboard
- **THEN** the system SHALL show exactly one card settings action before the add-activity action and SHALL navigate to the associated settings or activity creation page respectively

#### Scenario: Use archived card settings

- **WHEN** a user views an archived card
- **THEN** the grouped card settings action SHALL remain operable and the add-activity action SHALL be absent

#### Scenario: Read actions with narrow space or enlarged text

- **WHEN** card details with a long card name are viewed at 320, 390, 768 or 1280 CSS-pixel widths with normal or 200 percent text scaling
- **THEN** the system SHALL keep the full card name and both available action labels readable and operable through wrapping without overlap or whole-page horizontal scrolling


<!-- @trace
source: align-card-actions
updated: 2026-11-04
code:
  - src/style.css
  - src/views/CardDetail.vue
  - .impeccable/review/navigation--settings-16.png
  - .impeccable/review/align-card-actions-1280-32.png
  - .impeccable/review/purchase-form-create-390.png
  - .impeccable/review/navigation--cards-nav-32.png
  - .impeccable/review/home-1280.png
  - .impeccable/review/align-card-actions-390-16.png
  - .impeccable/review/activity-form-edit-390.png
  - .impeccable/review/navigation--cards-nav-16.png
  - .impeccable/review/home-768.png
  - .impeccable/review/navigation--cards-nav-purchases-new-32.png
  - .impeccable/review/activity-form-create-390.png
  - .impeccable/review/align-card-actions-390-32.png
  - .impeccable/review/navigation--settings-32.png
  - .impeccable/review/purchase-form-edit-390.png
  - .impeccable/review/text-200.png
  - .impeccable/review/home-390.png
  - DESIGN.md
  - .impeccable/review/navigation--cards-nav-purchases-new-16.png
  - .impeccable/review/align-card-actions-1280-16.png
  - src/views/ActivityForm.vue
  - .impeccable/review/home-320.png
tests:
  - tests/e2e/layout.spec.ts
-->

---
### Requirement: Shared secondary action presentation

The system SHALL render shared text actions, secondary buttons and top-level settings navigation without a persistent tinted background across their use sites. Destructive text actions SHALL retain their destructive text color. Hover, active, visible keyboard focus and disabled feedback SHALL remain distinguishable. Primary creation and save actions SHALL retain their filled accent presentation. Non-action status, percentage and message backgrounds SHALL remain unchanged.

#### Scenario: View secondary actions across pages

- **WHEN** a user views return navigation, card visibility toggles, card settings, activity creation, archive or restore actions, edit or delete actions, or backup secondary actions without hovering or pressing them
- **THEN** the shared secondary actions SHALL have a transparent background while destructive labels and filled primary actions remain distinguishable

#### Scenario: Operate actions with pointer and keyboard

- **WHEN** a user hovers, presses or focuses an enabled secondary action or encounters a disabled action
- **THEN** the system SHALL retain the associated interaction feedback and existing enabled or disabled behavior without restoring a persistent tinted background

<!-- @trace
source: align-card-actions
updated: 2026-11-04
code:
  - src/style.css
  - src/views/CardDetail.vue
  - .impeccable/review/navigation--settings-16.png
  - .impeccable/review/align-card-actions-1280-32.png
  - .impeccable/review/purchase-form-create-390.png
  - .impeccable/review/navigation--cards-nav-32.png
  - .impeccable/review/home-1280.png
  - .impeccable/review/align-card-actions-390-16.png
  - .impeccable/review/activity-form-edit-390.png
  - .impeccable/review/navigation--cards-nav-16.png
  - .impeccable/review/home-768.png
  - .impeccable/review/navigation--cards-nav-purchases-new-32.png
  - .impeccable/review/activity-form-create-390.png
  - .impeccable/review/align-card-actions-390-32.png
  - .impeccable/review/navigation--settings-32.png
  - .impeccable/review/purchase-form-edit-390.png
  - .impeccable/review/text-200.png
  - .impeccable/review/home-390.png
  - DESIGN.md
  - .impeccable/review/navigation--cards-nav-purchases-new-16.png
  - .impeccable/review/align-card-actions-1280-16.png
  - src/views/ActivityForm.vue
  - .impeccable/review/home-320.png
tests:
  - tests/e2e/layout.spec.ts
-->

---
### Requirement: Card settings save action follows document scrolling

The system SHALL keep the save action for an existing card inside its settings form, after the editable fields and error message and before card management. The save action SHALL scroll with the document without sticking or remaining fixed to the viewport at mobile and desktop widths. The system SHALL preserve save validation, busy-state disabling, error reporting, draft retention on failure, and successful navigation to the saved card details.

#### Scenario: Scroll existing card settings

- **WHEN** the user scrolls an existing card settings page with enough content to overflow a mobile or desktop viewport
- **THEN** the save action SHALL move with the form content and SHALL NOT remain attached to the viewport or overlay card management

#### Scenario: Save from the inline action

- **WHEN** the user edits an existing card name and activates the save action using the keyboard
- **THEN** the system SHALL save the name and navigate to that card details, and the saved name SHALL persist after reload

#### Scenario: Failed save retains the draft

- **WHEN** saving an edited card fails
- **THEN** the settings form SHALL show an error alert, retain the draft and allow retry without moving the save action into an overlay


<!-- @trace
source: polish-card-settings-and-home
updated: 2026-11-04
code:
  - src/style.css
  - .impeccable/review/polish-card-settings-and-home/home-1280.png
  - .impeccable/review/polish-card-settings-and-home/settings-320.png
  - .impeccable/review/polish-card-settings-and-home/settings-390.png
  - .impeccable/review/polish-card-settings-and-home/home-390.png
  - .impeccable/review/polish-card-settings-and-home/detail-390.png
  - .impeccable/review/polish-card-settings-and-home/settings-1280.png
  - .impeccable/review/polish-card-settings-and-home/home-320.png
  - src/views/Home.vue
  - .impeccable/review/polish-card-settings-and-home/settings-error-390.png
  - src/views/CardForm.vue
tests:
  - tests/e2e/card-settings.spec.ts
  - tests/e2e/home-card-entry.spec.ts
-->

---
### Requirement: Home cards provide concise whole-card navigation

The system SHALL omit the bottom "查看紀錄 / 新增消費" row and its arrow from every card on the active and archived home lists, both with and without active bonus activities. The system SHALL retain the heading arrow, whole-card link, accessible name and activity description, and existing no-activity hints.

#### Scenario: Render cards without duplicate navigation prompts

- **WHEN** the user views active or archived cards with or without active bonus activities on the home page
- **THEN** each card SHALL omit the bottom navigation prompt row and its arrow while retaining the heading arrow and existing card information

#### Scenario: Activate the whole card

- **WHEN** the user clicks or taps card content outside its heading, or focuses the card link and presses Enter
- **THEN** the system SHALL navigate to the details of that card without requiring a separate bottom action

<!-- @trace
source: polish-card-settings-and-home
updated: 2026-11-04
code:
  - src/style.css
  - .impeccable/review/polish-card-settings-and-home/home-1280.png
  - .impeccable/review/polish-card-settings-and-home/settings-320.png
  - .impeccable/review/polish-card-settings-and-home/settings-390.png
  - .impeccable/review/polish-card-settings-and-home/home-390.png
  - .impeccable/review/polish-card-settings-and-home/detail-390.png
  - .impeccable/review/polish-card-settings-and-home/settings-1280.png
  - .impeccable/review/polish-card-settings-and-home/home-320.png
  - src/views/Home.vue
  - .impeccable/review/polish-card-settings-and-home/settings-error-390.png
  - src/views/CardForm.vue
tests:
  - tests/e2e/card-settings.spec.ts
  - tests/e2e/home-card-entry.spec.ts
-->