# Translation and cost controls

## Scope

ClickChat translates message text only when the recipient explicitly chooses **Translate** from a received message's three-dot menu. It does not automatically translate an entire conversation, attachments, GIFs, stickers, filenames, or message history. This design keeps the interaction predictable and avoids unnecessary external API calls.

The backend uses Google Cloud Translation Basic v2. The API key is read only by the backend and must never be placed in a `VITE_` variable or returned to the browser.

## User flow

```mermaid
sequenceDiagram
    actor R as Recipient
    participant UI as MessageBubble
    participant API as Express API
    participant DB as MongoDB
    participant GT as Google Translation

    R->>UI: Choose Translate
    UI->>API: POST conversation/message/translate
    API->>API: Authenticate and authorize conversation
    API->>DB: Look for message/language/content-hash cache
    alt Cached translation exists
      DB-->>API: Cached translation
    else Cache miss
      API->>DB: Atomically reserve monthly characters
      API->>DB: Atomically reserve daily characters
      API->>GT: Translate text; source omitted for auto-detection
      GT-->>API: Translation and detected language
      API->>DB: Store reusable translation
    end
    API-->>UI: Original remains visible; show translated text below it
```

The UI offers translation only on received messages containing non-empty text. The server still performs its own authentication, conversation-membership check, message lookup, and deletion check; frontend visibility is never treated as authorization.

## Preferred language

Each user has a `preferredLanguage` field. The profile page exposes a controlled language selector and saves the selection through the existing profile update endpoint. The translation controller uses this server-loaded user value as the target language, rather than accepting an arbitrary target from the request body.

Supported values currently include English, Hindi, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Bengali, Gujarati, Marathi, Punjabi, Tamil, Telugu, Urdu, and Nepali.

## Cache design

`MessageTranslation` documents are unique across:

- message ID;
- target language;
- SHA-256 hash of the current message content.

The content hash prevents an old translation from being reused after a text message is edited. A repeated request for the same unchanged message and language returns the cached result without reserving quota or contacting Google.

Concurrent cache misses can produce more than one external request, but the unique database index prevents duplicate cache records. Each potentially billable request remains counted, intentionally favoring conservative accounting.

## Internal hard limits

The service contains non-overridable source-code caps:

| Period | Hard cap | Default environment value |
| --- | ---: | ---: |
| Daily | 12,000 characters | `TRANSLATION_DAILY_CHARACTER_LIMIT=12000` |
| Monthly | 400,000 characters | `TRANSLATION_MONTHLY_CHARACTER_LIMIT=400000` |

Environment values are clamped to these constants. A larger deployment value cannot raise the effective limit without a code change. A missing, non-numeric, zero, or negative configured limit results in a zero effective allowance and therefore suspends new external translations.

Quota periods use the `America/Los_Angeles` calendar boundary so the application's accounting aligns with Google Cloud quota timing. Spaces and Unicode code points are included in the character reservation.

## Atomic reservation behavior

Daily and monthly counters live in separate MongoDB collections with unique day/month keys. `findOneAndUpdate` uses a remaining-cap condition and `$inc`, making a successful reservation atomic across requests and backend processes that share the same database.

The order is:

1. Return a cached translation when available.
2. Verify that translation is enabled and configured.
3. Reserve monthly usage.
4. Reserve daily usage.
5. Contact Google.
6. Persist the cache result.

If daily reservation fails, the preceding monthly reservation is released because no external call occurred. Once a request may have reached Google, its reservation is not released even if the response fails or cache persistence fails. This can under-use the configured allowance, but it avoids a billing ledger that counts fewer characters than Google may have processed.

## Rate limiting and errors

The translation route has an IP-based limit of 30 attempts per minute in addition to the character ledger.

| Condition | HTTP status/code | User-visible meaning |
| --- | --- | --- |
| Feature disabled | `503 TRANSLATION_SERVICE_SUSPENDED` | Translation is administratively suspended |
| Daily cap reached | `503 TRANSLATION_SERVICE_SUSPENDED` | Daily allowance is exhausted |
| Monthly cap reached | `503 TRANSLATION_SERVICE_SUSPENDED` | Monthly allowance is exhausted |
| Too many attempts | `429 TRANSLATION_RATE_LIMITED` | Wait before translating again |
| API key missing | `503` | Translation is not configured |
| Google/API failure | `502` | Translation could not be completed |

Cached translations can remain available while new external translation is disabled because cache lookup occurs before the feature and quota checks.

## Billing boundary

Application limits protect only requests that pass through this backend and use the same MongoDB counters. They cannot control:

- direct use of a leaked API key;
- another application or deployment using the same key;
- manually altered/deleted usage records;
- deployments pointed at separate databases;
- unrelated Google Cloud services.

Production safeguards therefore require all of the following:

1. Store the key only in the backend deployment environment.
2. Restrict the key to the Cloud Translation API.
3. Restrict the key to the backend's fixed outbound IP when the hosting platform provides one.
4. Keep the internal caps below the intended monthly allowance.
5. Configure Google Cloud budget alerts and monitor actual billing reports.
6. Rotate the key immediately if it appears in source, logs, screenshots, or client bundles.

Google Cloud budgets send notifications; they are not spending caps. The application's counters suspend its own Translation requests, while provider-level credentials and restrictions reduce bypass risk.

## Operational checks

- Confirm the new translation files are committed, pushed, and deployed; local limits do not protect an older live build.
- Confirm production points every backend replica at the same MongoDB database.
- Inspect `translationusages` and `translationdailyusages` when investigating a suspension.
- Do not reset counters merely to restore service without first checking Google Cloud usage.
- Keep `TRANSLATION_ENABLED=false` available as an emergency kill switch.
- Test the suspension response in a non-production database using deliberately small environment limits.
