## ADDED Requirements

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

### Requirement: Home cards provide concise whole-card navigation

The system SHALL omit the bottom "查看紀錄 / 新增消費" row and its arrow from every card on the active and archived home lists, both with and without active bonus activities. The system SHALL retain the heading arrow, whole-card link, accessible name and activity description, and existing no-activity hints.

#### Scenario: Render cards without duplicate navigation prompts

- **WHEN** the user views active or archived cards with or without active bonus activities on the home page
- **THEN** each card SHALL omit the bottom navigation prompt row and its arrow while retaining the heading arrow and existing card information

#### Scenario: Activate the whole card

- **WHEN** the user clicks or taps card content outside its heading, or focuses the card link and presses Enter
- **THEN** the system SHALL navigate to the details of that card without requiring a separate bottom action
