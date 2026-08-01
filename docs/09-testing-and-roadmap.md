# Testing and roadmap

## Current verification capability

- Frontend ESLint through `npm run lint`.
- Frontend production compilation through `npm run build`.
- Node syntax checking can be run against backend files with `node --check`.
- No automated unit, integration, end-to-end, or Socket.IO test suite is currently configured.

## Manual acceptance matrix

### Authentication

| Scenario | Expected result |
| --- | --- |
| Valid registration | Account created and verification email requested |
| Duplicate email | `409` error |
| Under-18 registration | Client/server validation failure |
| Login before verification | `403` and verification guidance |
| Valid verification link | Account marked verified and token fields cleared |
| Expired/invalid link | `400` error |
| Rapid resend | Cooldown or rate-limit response |
| Logout | Cookie cleared, socket disconnected, protected route unavailable |
| Forgot password for known/unknown email | Same generic response; known account receives a time-limited link |
| Reset with valid token | Password changes, reset fields clear, old session is unavailable |
| Change password while authenticated | Current password verified; JWT is reissued and older JWTs are rejected |

### Invitations

| Scenario | Expected result |
| --- | --- |
| Send invitation | Sender pending list and recipient badge update immediately |
| Duplicate pending invitation | `409` error |
| Accept invitation | Both users receive one direct conversation without page refresh |
| Decline invitation | Pending state disappears for both users |
| Offline recipient/sender | Correct state loads through REST after next login |

### Messaging

| Scenario | Expected result |
| --- | --- |
| Send text/emoji | Persisted once and delivered in real time |
| Send supported attachment | Upload progress is shown; media persists and reaches the other participant in real time |
| Reject invalid attachment | Unsupported, empty, or oversized files return a clear validation error |
| Edit own latest message | Both message and preview update |
| Edit older message | Message updates; latest preview remains unchanged |
| Delete latest message | Both clients show deleted bubble and “Message deleted” preview |
| Delete older message | Bubble changes; latest preview remains unchanged |
| Date boundary | Separator appears when calendar day changes |
| Switch conversation during history request | Stale response does not replace active conversation messages |
| Send GIF/sticker | GIPHY result is stored as external metadata and delivered to the recipient without Cloudinary upload |
| Long latest message | Sidebar shows one line, at most 42 Unicode characters plus `...`, without row overflow |
| Open/download attachment | Participant receives a short-lived redirect; unrelated user is rejected |

### Translation

| Scenario | Expected result |
| --- | --- |
| Translate received text | Original remains visible and translated text appears below it |
| Repeat same message/language | Cached result returns without another Google call or quota reservation |
| Edit then translate | Content hash changes and a fresh translation is stored |
| Daily/monthly limit reached | `503 TRANSLATION_SERVICE_SUSPENDED`; Google is not called |
| Translation disabled/missing key | Clear service-unavailable response |
| Excessive attempts | `429 TRANSLATION_RATE_LIMITED` |
| Two concurrent reservations near cap | Atomic counter permits only requests that fit remaining allowance |

### Presence

| Scenario | Expected result |
| --- | --- |
| First socket connects | User becomes online and contacts update |
| Second tab connects | No duplicate state transition |
| One of two tabs closes | User remains online |
| Final tab closes | User becomes offline after five seconds |
| Reconnect within five seconds | Offline timer is cancelled; no flicker |
| Backend restarts | Stale online flags reset; reconnecting clients become online again |

### Typing indicators

| Scenario | Expected result |
| --- | --- |
| Begin entering text or emoji | Other participants see the sender's first name and typing status |
| Continue entering content | Sender does not emit a new start event for every keystroke |
| Stop entering content | Indicator clears after approximately 1.5 seconds |
| Empty or submit the composer | Indicator clears immediately |
| Change conversations while typing | Previous conversation receives a stop event |
| Lost stop event or abrupt disconnect | Recipient safety timer clears the indicator within approximately 3 seconds |
| Invalid or unrelated conversation ID | Server ignores the event and sends no update |

### Interface and profile

| Scenario | Expected result |
| --- | --- |
| Initial authentication check | Branded full-screen loader remains visible until the check completes |
| Responsive landing/auth pages | Content remains usable without horizontal overflow on mobile and desktop |
| Theme change | Landing, authentication, dashboard, dialogs, and profile use the selected theme consistently |
| Valid profile image selection | Upload starts immediately and the dialog closes after success |
| Invalid profile image | Unsupported type or image over 5 MB is rejected before upload |
| Upload in progress | Dialog cannot be dismissed accidentally and progress state remains visible |
| Inline name/bio edit | Only the selected section enters edit mode and persists validated data |
| Preferred language update | Profile refreshes and subsequent translations target the new language |
| Avatar click | Public profile opens; clicking ordinary row content selects conversation instead |
| Mobile browser Back | Open conversation returns to conversation list through URL history |

## Recommended automated test architecture

```mermaid
flowchart TD
    UNIT["Unit tests"] --> VAL["Validation, utilities, store actions"]
    INT["API integration tests"] --> HTTP["Auth, invitations, conversations, messages"]
    SOCK["Socket integration tests"] --> EVT["Message, invitation, and presence events"]
    E2E["Browser end-to-end tests"] --> FLOW["Registration-to-chat user journeys"]
```

### Suggested priorities

1. API integration tests using an isolated MongoDB test database.
2. Socket tests with two authenticated clients and multi-tab scenarios.
3. Zustand action tests for deduplication and targeted state updates.
4. Browser tests for authentication, invitation acceptance, and real-time messaging.
5. CI workflow running lint, build, backend tests, and frontend tests.

## Known limitations

| Area | Limitation | Impact |
| --- | --- | --- |
| Message history | Only latest 50 messages are returned | Older history is inaccessible |
| Unread state | Counts are fixed at zero in the UI | Users cannot identify unseen conversations |
| Read receipts | Sender receipt is stored, but no complete update/event/UI workflow exists | Delivery/read state is not visible |
| Replies | Schema, API, and bubble display exist; composer selection does not | Users cannot initiate replies through the current UI |
| Groups | Schema fields and validation exist; routes/UI are incomplete | Only direct chat is functional |
| Attachments | One file up to 10 MB per message; no cancellation, retry, signature inspection, or malware scan | Rich media works, but production hardening and multi-file UX remain |
| Presence scale | Counts/timers are process-local | Single backend instance only |
| Testing | No automated suite | Regression risk grows with new features |
| Platform packaging | Android/Capacitor source is not maintained in this repository | New APK builds require a separate packaging phase later |
| Security | Upload/message quotas, login throttling, private attachment delivery, blocking/reporting, and security headers remain incomplete | Not ready for untrusted broad public traffic |

## Prioritized roadmap

```mermaid
flowchart LR
    P0["P0 Reliability"] --> P1["P1 Messaging fundamentals"]
    P1 --> P2["P2 Rich messaging"]
    P2 --> P3["P3 Groups and media"]
    P3 --> P4["P4 Scale and operations"]
```

### P0 — Reliability and test foundation

- Add automated backend integration and Socket.IO tests.
- Add frontend store/component tests and a CI workflow.
- Add centralized error handling, structured logging, and health checks.
- Add login rate limiting and security headers.
- Add per-user upload-byte/message quotas and socket typing-event throttling.
- Move sensitive attachments to authenticated/private Cloudinary delivery.

### P1 — Messaging fundamentals

1. Cursor-based older-message pagination with scroll-position preservation.
2. Per-conversation unread counts.
3. Complete read-receipt API, events, and UI.
4. Complete reply selection, composer preview, and reply navigation.
5. Optimistic send state, client IDs, retry, and reconnection resynchronization.

### P2 — Conversation features

- Message reactions.
- Message search.
- Pin, mute, archive, and per-user conversation settings.
- Browser/push notifications and notification preferences.
- Blocking and reporting.

### P3 — Rich media and groups

- Multi-file attachment galleries, cancellation, retry, signature inspection, and malware scanning.
- Complete group creation, membership, roles, images, and system messages.
- Voice messages.
- Voice and video calling.

### P4 — Scale and operations

- Redis Socket.IO adapter and distributed presence coordination.
- Background jobs for email, uploads, and notifications.
- Query/index monitoring and message-list virtualization.
- Error monitoring, audit events, moderation tools, and administrative workflows.
