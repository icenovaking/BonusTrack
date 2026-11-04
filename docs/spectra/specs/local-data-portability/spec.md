# local-data-portability Specification

## Purpose

Keep the single-device credit-card tracker usable without a backend or network connection after initial caching. Preserve local records across sessions and provide validated, explicit backup replacement for recovery and device changes.

## Requirements

### Requirement: Durable local transactions

The system SHALL persist cards, activities, and purchases in IndexedDB and load them on reopening. A successful save SHALL be reported only after its database transaction commits. Failed reads SHALL provide retry without overwriting stored data. Failed writes SHALL preserve the prior committed data and user input, show an actionable error, and allow retry. Repeated save activation while a write is pending SHALL NOT create duplicate purchases.

#### Scenario: Reopen after saving

- **WHEN** a purchase has been saved and the application is closed and reopened
- **THEN** the purchase and its derived remaining allowance SHALL be restored from IndexedDB

#### Scenario: Write failure or duplicate activation

- **WHEN** storage rejects a save or the user activates save again before the pending write finishes
- **THEN** the failed save SHALL leave prior records intact and preserve input, and repeated activation SHALL NOT create a second purchase

#### Scenario: Read failure

- **WHEN** the initial local database read fails
- **THEN** the system SHALL display retry and local-data guidance rather than replacing stored data with an empty database


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
### Requirement: Complete versioned backup export

The system SHALL export a downloadable JSON file containing schemaVersion, exportedAt, and all cards, activities, and purchases, including archived items, dates, notes, and manual period overrides. Derived remaining allowances SHALL NOT be the stored source of truth. The system SHALL explain that browser data is device-local and that clearing site data or losing the device can remove records.

#### Scenario: Export all history

- **WHEN** a user exports data containing active and archived cards and purchases in historical periods
- **THEN** the downloaded file SHALL contain the complete records and the schema version needed to validate restoration


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
### Requirement: Validate and atomically replace imported data

The system SHALL validate backup JSON, its supported schema version, field types, nonempty names, unique identifiers, references, numeric bounds, date validity, card-activity associations, and allowed adjacent period overrides before making any changes. Restoration SHALL preserve stored date-only values without rejecting them solely because the importing device's current local date is earlier. Valid import SHALL show record counts and require explicit confirmation for full replacement. Import SHALL NOT merge or append. Replacement SHALL be atomic; cancellation, validation failure, or transaction failure SHALL preserve all previously committed records and display the result.

#### Scenario: Restore a complete backup

- **WHEN** the user confirms replacement with a valid backup containing a TWD 500 cap, a 6 percent activity, and a TWD 100 purchase
- **THEN** stored data SHALL be replaced and the corresponding remaining amount SHALL be recomputed as TWD 8233

#### Scenario: Import the same backup twice

- **WHEN** the user confirms import of the same valid backup twice
- **THEN** purchase counts and remaining allowances SHALL equal the result of a single import

#### Scenario: Reject malformed or unsupported backup

- **WHEN** a file has malformed JSON, an unsupported version, duplicate IDs, missing references, invalid money, an invalid date, an invalid override, or a mismatched activity-card relation
- **THEN** the system SHALL explain the validation failure and SHALL leave the entire existing dataset unchanged

#### Scenario: Cancel or fail replacement

- **WHEN** the user cancels the confirmation or the replacement transaction fails
- **THEN** all prior data SHALL remain readable and the system SHALL report cancellation or failure without claiming success


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
### Requirement: Offline application shell and local workflows

The system SHALL cache its required application shell, scripts, styles, and icons through a Service Worker served from HTTPS or a supported local development origin. Required runtime assets SHALL NOT depend on external CDNs or network fonts. Only after successful cache preparation SHALL the system report offline readiness. After preparation, opening the application offline SHALL support reading, creating, editing, and deleting local records and locally importing or exporting backup files. Before the initial cache is available, offline startup SHALL NOT be promised.

#### Scenario: Reopen and record while offline

- **WHEN** initial caching has completed, the application is closed, network access is disabled, and the application is reopened
- **THEN** the interface and stored records SHALL load, a new purchase SHALL commit locally, and its allowance SHALL remain updated after another offline reload

#### Scenario: Open a card detail address offline

- **WHEN** a cached application is reopened offline at its hash-based card route
- **THEN** it SHALL load the application shell and display that card from local records without server route rewriting

#### Scenario: Initial cache failure

- **WHEN** required shell assets cannot be cached on the initial online visit
- **THEN** the application SHALL remain usable while online and SHALL NOT display an offline-ready claim


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
### Requirement: Installation and safe updates

The system SHALL provide a web app manifest and locally served icons for supported home-screen installation. Installation SHALL NOT be required for ordinary browser use. Where automatic installation prompts are unavailable, the interface SHALL provide browser-appropriate manual guidance. An available application update SHALL be user-activated, SHALL NOT force reload over an unsaved form, and SHALL preserve IndexedDB records.

#### Scenario: Use a browser without an installation prompt

- **WHEN** the browser does not expose a programmatic installation prompt
- **THEN** the system SHALL provide manual installation guidance and all tracking features SHALL remain available in the browser

#### Scenario: Update with unsaved input

- **WHEN** an update is available while a purchase form contains unsaved input
- **THEN** the update SHALL wait for the user to save or explicitly discard that input before reloading, and committed records SHALL survive activation

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
### Requirement: Durable and backward-compatible activity notes

The system SHALL persist activity notes in IndexedDB and include them in JSON exports and confirmed full-replacement imports, including archived activities. Note text and internal line breaks SHALL survive reopening and backup round trips. Existing local records and schemaVersion 1 backups omitting activity notes SHALL load with empty notes without losing or changing other records. Present non-string notes SHALL fail validation before replacement. Cancellation or transaction failure during import SHALL preserve the entire prior dataset and notes. The backup schemaVersion SHALL remain 1 for this additive field.

#### Scenario: Reopen with a note

- **WHEN** the multiline activity note consisting of "需先登錄" followed by "限實體刷卡" is saved and the application is reopened
- **THEN** the note SHALL retain both lines for home page display and editing

#### Scenario: Restore archived and active notes

- **WHEN** a user exports activities with notes including an archived activity and confirms replacement with that backup
- **THEN** all notes SHALL return to their original activities without duplicate records or changes to purchase assignments and allowances

#### Scenario: Load legacy data

- **WHEN** existing IndexedDB records or a valid schemaVersion 1 backup omit the activity note property
- **THEN** activities SHALL load with empty notes and all card, financial, archive, and purchase data SHALL remain intact

#### Scenario: Reject invalid note types

- **WHEN** a backup contains an activity note of null, a number, a boolean, an array, or an object
- **THEN** validation SHALL reject it with an actionable error and preserve the entire committed dataset

#### Scenario: Preserve notes on canceled or failed replacement

- **WHEN** a user cancels replacement containing different notes or the replacement transaction fails
- **THEN** prior notes and all other committed records SHALL remain unchanged

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
### Requirement: Settings-local offline readiness and concise data guidance

The system SHALL present offline preparation status in settings rather than a global footer. Successful cache preparation SHALL show "離線可用" with a check icon; preparation failure SHALL show "離線未就緒，請連線重試" with an offline icon; preparation still in progress SHALL show "離線準備中" without claiming readiness. Removing the footer SHALL NOT change cached startup, local record operations or backup import and export. Settings SHALL retain concise guidance that data belongs to this browser and requires backup before clearing data or changing devices. Backup restoration SHALL retain a visible full-replacement warning and explicit destructive confirmation. Manual installation instructions and actionable error feedback SHALL remain available, without a four-character restriction.

#### Scenario: View preparation states in settings

- **WHEN** the user opens settings before preparation completes, after successful preparation, or after preparation failure
- **THEN** settings SHALL display the corresponding preparation, readiness or retry message and icon without a global footer status or a premature readiness claim

#### Scenario: Use cached records without a footer

- **WHEN** initial caching succeeds and the application is reopened offline at a card address
- **THEN** the system SHALL load that card, allow a purchase save and subsequent reload, and allow local backup export and confirmed import without relying on a footer element

#### Scenario: Read restoration consequences before confirmation

- **WHEN** a user selects a valid backup for restoration
- **THEN** the system SHALL retain browser-local backup guidance, explain that restoration replaces all data without merging, show record counts and require explicit confirmation before replacement
