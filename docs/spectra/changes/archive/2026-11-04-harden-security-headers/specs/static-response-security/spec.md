## Purpose

Protect the static BonusTrack application through browser-enforced response policies managed with the repository. Preserve local bookkeeping, backups, and PWA operation while separating local verification from deployed evidence.

## ADDED Requirements

### Requirement: Versioned static response headers

The system SHALL define security headers in public/_headers and include the same content in dist/_headers during production builds. All application static responses SHALL receive an enforced Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy: no-referrer. The /sw.js and /manifest.webmanifest responses SHALL retain Cache-Control: no-cache alongside these headers.

#### Scenario: Global policy and update cache rules coexist

- **WHEN** the production application serves its HTML, JavaScript, CSS, Service Worker, and manifest through the configured static host
- **THEN** the responses SHALL contain the security headers and the Service Worker and manifest SHALL additionally retain no-cache

#### Scenario: Build preserves the deployment rules

- **WHEN** a production build completes
- **THEN** dist/_headers SHALL contain the same rules as public/_headers without introducing deployment credentials

### Requirement: Enforced resource and execution restrictions

The application policy SHALL restrict scripts, styles, images, fonts, connections, workers, and manifests to the same origin. It SHALL prohibit inline script execution, string evaluation, plugin objects, base URL overrides, network form submission, and child frames. It SHALL NOT allow unsafe-inline scripts, unsafe-eval, wildcard sources, or unapproved third-party sources. JSON backup downloads SHALL remain usable without granting blob script or connection permissions.

#### Scenario: Disallowed script execution and connections are blocked

- **WHEN** the page attempts an inline script, string evaluation, an external script, or a fetch to another origin
- **THEN** the browser SHALL block the attempt under the applicable CSP directive and SHALL NOT execute the script or send the disallowed fetch

#### Scenario: Same-origin application resources remain usable

- **WHEN** a user opens the production application with the policy enforced
- **THEN** the application SHALL render its same-origin scripts, styles, and icons, register its same-origin Service Worker, and load its manifest without unexpected policy violations

### Requirement: Protection against framing

The system SHALL prevent any parent origin from embedding the application using CSP frame-ancestors 'none' and X-Frame-Options: DENY.

#### Scenario: Another site attempts to frame the application

- **WHEN** a page on another origin loads BonusTrack in an iframe
- **THEN** the browser SHALL refuse to display the application inside that frame while direct navigation to BonusTrack SHALL remain usable

### Requirement: Local workflows remain compatible with enforced policies

The system SHALL preserve card and purchase operations, JSON backup export and restore, IndexedDB records, offline reopening after initial caching, and existing update confirmation protections under the security policy. Introducing the headers SHALL NOT change the backup schema or clear local records.

#### Scenario: Backup and offline operation under enforced headers

- **WHEN** a user restores a valid backup, records a purchase, exports a backup, and reopens the cached application offline
- **THEN** the application SHALL preserve the saved records and calculated allowance, allow backup export and restore offline, and produce no unexpected policy violation

#### Scenario: Update protection remains intact

- **WHEN** an update is offered while a form contains unsaved input
- **THEN** declining the update SHALL preserve that input and accepting the explicit discard confirmation SHALL continue through the existing update flow

### Requirement: Verifiable deployment and explicit evidence boundaries

Local browser verification SHALL use actual HTTP security headers read from the production rules, rather than relying on ordinary Vite preview or HTML meta policies. Invalid or unsupported test-host rules SHALL cause startup failure instead of an unprotected preview. Deployment guidance SHALL explain static Pages deployment, response inspection, and handling of injected-script conflicts without automatically changing Cloudflare settings. Local results SHALL NOT be represented as deployed results.

#### Scenario: Unsupported verification configuration fails closed

- **WHEN** the local security preview cannot read its built rules or encounters unsupported syntax or conflicting headers
- **THEN** it SHALL fail with a nonzero exit status and SHALL NOT start an unprotected server

#### Scenario: Deployment has not been inspected

- **WHEN** no deployed URL or completed deployment is available for inspection
- **THEN** the verification record SHALL identify production headers and Cloudflare-injected scripts as unverified and SHALL provide the remaining verification steps separately from local results

#### Scenario: Cloudflare injects an unapproved script

- **WHEN** deployed verification finds a Cloudflare-injected script blocked by the policy
- **THEN** the record SHALL identify the blocked source for an explicit follow-up decision and SHALL NOT silently weaken the policy or change Cloudflare settings
