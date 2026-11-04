## ADDED Requirements

### Requirement: Responsive purchase form access

The system SHALL allow users to create and edit purchases without horizontal page or form scrolling at supported phone, tablet, and desktop widths. The purchase date SHALL remain a native date control and SHALL remain fully operable within the form. Purchase validation, date restrictions, and persistence behavior SHALL remain unchanged.

#### Scenario: Enter a purchase on a narrow screen

- **WHEN** a user opens purchase creation or editing on a phone and enters an amount, selects a date and activity, and enters a note
- **THEN** every control SHALL remain within the available form width and SHALL be operable without horizontal scrolling

#### Scenario: Continue editing after resizing

- **WHEN** a user changes orientation or resizes a purchase form between phone, tablet, and desktop widths
- **THEN** the form SHALL retain entered values and SHALL allow date selection and purchase submission without horizontal scrolling

### Requirement: Unobstructed purchase submission

The system SHALL place the purchase save action after the period controls and any error message in normal document flow. The action SHALL scroll with the form rather than remain attached to the viewport. Users SHALL be able to scroll to and operate all purchase fields and the save action while the on-screen keyboard is open.

#### Scenario: Fill fields with the phone keyboard open

- **WHEN** a user focuses an amount or note field in purchase creation or editing and the on-screen keyboard opens
- **THEN** the save action SHALL NOT float over the visible fields, and the user SHALL be able to scroll to every field and the save action

#### Scenario: Review validation and submit

- **WHEN** a user expands the period controls or receives a purchase validation error
- **THEN** the period controls and error message SHALL remain reachable before the save action, and correcting the input SHALL allow the existing save flow to complete
