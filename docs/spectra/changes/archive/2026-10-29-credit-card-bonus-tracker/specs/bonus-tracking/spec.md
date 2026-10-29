## Purpose

Track the remaining eligible spending allowance for manually configured credit-card bonus activities. Enable mobile users to record completed TWD purchases and identify exhausted allowances without calculating earned rewards.

## ADDED Requirements

### Requirement: Cards and independent bonus activities

The system SHALL support multiple named cards, each with multiple named bonus activities. Each card SHALL use a calendar-month cycle or a closing day from 1 through 31; all its activities SHALL inherit that cycle. Each activity SHALL have a nonnegative TWD reward cap and a bonus percentage greater than zero and at most 100, each with at most two decimal places. Names SHALL be nonempty after trimming. The system SHALL reject invalid numbers and unsafe integer arithmetic. Card numbers and security codes SHALL NOT be requested.

#### Scenario: Create a card with separate allowances

- **WHEN** a user creates a card with two activities using caps of TWD 500 and TWD 300 and bonus percentages of 6 and 3 respectively
- **THEN** both activities SHALL have independent spending limits of TWD 8333 and TWD 10000

#### Scenario: Reject invalid configuration

- **WHEN** a cap is negative, a percentage is zero or above 100, an amount exceeds two decimal places, a name is blank, or arithmetic exceeds safe integer bounds
- **THEN** the system SHALL identify the invalid field and SHALL NOT save the configuration

### Requirement: Remaining spending allowance

The system SHALL compute the spending limit as the reward cap divided by the bonus percentage expressed as a fraction, rounded down to a whole TWD. The remaining amount SHALL be the spending limit minus all purchases assigned to the activity and period, clamped to zero. Amounts SHALL use exact integer minor-unit arithmetic. The interface SHALL display spending limits and remaining spending, and SHALL NOT calculate or display earned, used, or remaining reward money. A zero remaining amount SHALL display a textual next-purchase card-switch reminder.

#### Scenario: Deduct recorded spending

- **WHEN** purchases of TWD 100 and TWD 1000 are recorded against the same period of an activity with a TWD 500 reward cap and a 6 percent bonus
- **THEN** its limit SHALL be TWD 8333, its remaining amount after the first purchase SHALL be TWD 8233, and its final remaining amount SHALL be TWD 7233

#### Scenario: Preserve overspending and fractional purchases

- **WHEN** purchases total TWD 8333.50 against a limit of TWD 8333
- **THEN** the full purchase amounts SHALL be retained, the remaining amount SHALL be zero, and a next-purchase card-switch reminder SHALL be shown

#### Scenario: Isolate other activities and unassigned purchases

- **WHEN** a purchase is assigned to one activity or explicitly assigned to no activity
- **THEN** only the selected activity allowance SHALL decrease, or no activity allowance SHALL change respectively

### Requirement: Period boundaries and retained history

The system SHALL use date-only purchase values without UTC conversion. Calendar months SHALL include their first and last dates. A billing period SHALL include its closing date and start the day after the preceding closing date. A closing day absent from a month SHALL be clamped to that month's last day. The home page SHALL display the period containing the device's current local date. Previous records SHALL remain accessible when the current period changes.

#### Scenario: Closing-day inclusion

- **WHEN** a card closes on day 15 and purchases occur on 2026-11-15 and 2026-11-16
- **THEN** their default periods SHALL be 2026-10-16 through 2026-11-15 and 2026-11-16 through 2026-12-15 respectively

#### Scenario: Short months and leap years

- **WHEN** a card closes on day 31
- **THEN** its February closing dates SHALL be 2027-02-28 and 2028-02-29, with each following period starting on March 1

#### Scenario: Advance into an unused period

- **WHEN** the current local date enters a new period with no assigned purchases
- **THEN** the home page SHALL display full allowances for that period and historical purchases SHALL remain available

### Requirement: Completed purchase maintenance and reassignment

The system SHALL allow adding, editing, and deleting completed purchases containing a card, a purchase date, a positive TWD amount with at most two decimal places, an optional note, and at most one activity belonging to that card. New or edited purchase dates SHALL NOT be later than the current local date. With one active activity the form SHALL preselect it; with multiple activities the user SHALL choose one or explicitly choose no activity. A purchase SHALL default to its date-derived period; the user SHALL be able to override it to the preceding or following period or restore automatic assignment. Deletion SHALL require confirmation. No pre-purchase simulation SHALL be provided.

#### Scenario: Save and return to the actual period

- **WHEN** a user selects a card on the home page and successfully saves a TWD 100 purchase
- **THEN** the card detail SHALL show the saved purchase in its actual assigned period, the home page SHALL retain its current-period view, and both SHALL reflect recalculated remaining amounts

#### Scenario: Edit, delete, and move purchases

- **WHEN** a purchase is changed from TWD 100 to TWD 200, deleted after confirmation, or moved from its default period to the next period
- **THEN** the affected activity and all affected periods SHALL be recomputed from retained records without duplicate deductions

#### Scenario: Cancel deletion

- **WHEN** the user cancels purchase deletion
- **THEN** the purchase and all remaining amounts SHALL remain unchanged

#### Scenario: Reject invalid or mismatched purchase input

- **WHEN** an amount is zero, negative, nonnumeric, unsafe, or excessively precise, a date is invalid or future, an activity belongs to another card, or an override is outside the adjacent allowed periods
- **THEN** the system SHALL reject the change, explain the error, and preserve the form and stored records

### Requirement: Preserve configuration history

The system SHALL allow renaming cards and activities. Cycle settings SHALL be locked for cards with purchase history; caps and percentages SHALL be locked for activities referenced by purchases. Referenced cards and activities SHALL support archiving instead of direct deletion. Archived items SHALL remain accessible in history and SHALL reject new purchases and incoming reassignment. Existing purchases SHALL remain editable or deletable. Unreferenced items SHALL be editable and deletable, with card deletion also removing its unreferenced activities after confirmation.

#### Scenario: Change an offer after purchases exist

- **WHEN** a user attempts to change the cap of an activity referenced by a purchase
- **THEN** the system SHALL preserve its cap and explain how to archive the old activity and create a new activity

#### Scenario: Archive while preserving history

- **WHEN** a referenced activity or card is archived
- **THEN** its history SHALL remain accessible, it SHALL leave the active selection, and creating or moving purchases into it SHALL be rejected

### Requirement: Responsive mobile-first operation

The system SHALL provide a Traditional Chinese minimal interface with the remaining spending amount as the primary information. The home page SHALL list all active cards and each activity's limit, remaining amount, and period; archived cards SHALL be accessible separately. Selecting a card SHALL open its allowances and purchase history with an add-purchase action. Narrow screens SHALL use a single-column card list and wider screens SHALL adapt to multiple columns. Touch, keyboard, screen-reader feedback, and text labels for errors and exhaustion SHALL be supported.

#### Scenario: Complete the mobile workflow

- **WHEN** a user opens a card, adds a completed purchase, and returns home
- **THEN** the allowance and history SHALL reflect the persisted change without a manual reload, and success SHALL be announced accessibly

#### Scenario: Empty state and long content

- **WHEN** there are no cards, a card has no activities, or names are long
- **THEN** the interface SHALL present relevant creation actions or readable wrapping content without hiding essential actions

#### Scenario: Operate across viewport sizes

- **WHEN** the interface is exercised at viewport widths of 320, 390, 768, and 1280 CSS pixels and at 200 percent text scaling
- **THEN** essential content and controls SHALL remain available without whole-page horizontal scrolling, and primary actions SHALL remain reachable above safe areas and the mobile keyboard
