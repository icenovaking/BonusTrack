## ADDED Requirements

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
