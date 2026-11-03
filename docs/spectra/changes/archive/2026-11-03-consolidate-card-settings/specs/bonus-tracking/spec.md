## ADDED Requirements

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
