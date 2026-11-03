## ADDED Requirements

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
