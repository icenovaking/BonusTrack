## ADDED Requirements

### Requirement: Settings-local offline readiness and concise data guidance

The system SHALL present offline preparation status in settings rather than a global footer. Successful cache preparation SHALL show "離線可用" with a check icon; preparation failure SHALL show "離線未就緒，請連線重試" with an offline icon; preparation still in progress SHALL show "離線準備中" without claiming readiness. Removing the footer SHALL NOT change cached startup, local record operations or backup import and export. Settings SHALL retain concise guidance that data belongs to this browser and requires backup before clearing data or changing devices. Backup restoration SHALL retain a visible full-replacement warning and explicit destructive confirmation. Manual installation instructions and actionable error feedback SHALL remain available, without a four-character restriction.

#### Scenario: View preparation states in settings

- **WHEN** the user opens settings before preparation completes, after successful preparation, or after preparation failure
- **THEN** settings SHALL display the corresponding preparation, readiness or retry message and icon without a global footer status or a premature readiness claim

#### Scenario: Use cached records without a footer

- **WHEN** initial caching succeeds and the application is reopened offline at a card address
- **THEN** the system SHALL load that card, allow a purchase save and subsequent reload, and allow local backup export and confirmed import without relying on a footer element

#### Scenario: Read restoration consequences before confirmation

- **WHEN** a user selects a valid backup for restoration
- **THEN** the system SHALL retain browser-local backup guidance, explain that restoration replaces all data without merging, show record counts and require explicit confirmation before replacement
