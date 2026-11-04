## ADDED Requirements

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

### Requirement: Shared secondary action presentation

The system SHALL render shared text actions, secondary buttons and top-level settings navigation without a persistent tinted background across their use sites. Destructive text actions SHALL retain their destructive text color. Hover, active, visible keyboard focus and disabled feedback SHALL remain distinguishable. Primary creation and save actions SHALL retain their filled accent presentation. Non-action status, percentage and message backgrounds SHALL remain unchanged.

#### Scenario: View secondary actions across pages

- **WHEN** a user views return navigation, card visibility toggles, card settings, activity creation, archive or restore actions, edit or delete actions, or backup secondary actions without hovering or pressing them
- **THEN** the shared secondary actions SHALL have a transparent background while destructive labels and filled primary actions remain distinguishable

#### Scenario: Operate actions with pointer and keyboard

- **WHEN** a user hovers, presses or focuses an enabled secondary action or encounters a disabled action
- **THEN** the system SHALL retain the associated interaction feedback and existing enabled or disabled behavior without restoring a persistent tinted background
