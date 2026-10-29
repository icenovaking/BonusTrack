## ADDED Requirements

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
