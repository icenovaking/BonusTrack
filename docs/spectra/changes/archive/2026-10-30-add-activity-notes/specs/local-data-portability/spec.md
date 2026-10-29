## ADDED Requirements

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
