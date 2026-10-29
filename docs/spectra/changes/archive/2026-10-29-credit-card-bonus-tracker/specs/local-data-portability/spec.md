## Purpose

Keep the single-device credit-card tracker usable without a backend or network connection after initial caching. Preserve local records across sessions and provide validated, explicit backup replacement for recovery and device changes.

## ADDED Requirements

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

### Requirement: Complete versioned backup export

The system SHALL export a downloadable JSON file containing schemaVersion, exportedAt, and all cards, activities, and purchases, including archived items, dates, notes, and manual period overrides. Derived remaining allowances SHALL NOT be the stored source of truth. The system SHALL explain that browser data is device-local and that clearing site data or losing the device can remove records.

#### Scenario: Export all history

- **WHEN** a user exports data containing active and archived cards and purchases in historical periods
- **THEN** the downloaded file SHALL contain the complete records and the schema version needed to validate restoration

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

### Requirement: Installation and safe updates

The system SHALL provide a web app manifest and locally served icons for supported home-screen installation. Installation SHALL NOT be required for ordinary browser use. Where automatic installation prompts are unavailable, the interface SHALL provide browser-appropriate manual guidance. An available application update SHALL be user-activated, SHALL NOT force reload over an unsaved form, and SHALL preserve IndexedDB records.

#### Scenario: Use a browser without an installation prompt

- **WHEN** the browser does not expose a programmatic installation prompt
- **THEN** the system SHALL provide manual installation guidance and all tracking features SHALL remain available in the browser

#### Scenario: Update with unsaved input

- **WHEN** an update is available while a purchase form contains unsaved input
- **THEN** the update SHALL wait for the user to save or explicitly discard that input before reloading, and committed records SHALL survive activation
