# System architecture

## High-level architecture

```mermaid
flowchart LR
    U["Desktop or mobile browser"] -->|"HTTPS"| V["React 19 + Vite on Vercel"]
    V -->|"REST with credentials"| E["Express 5 API on Railway/Render"]
    V <-->|"Authenticated Socket.IO"| S["Socket.IO server"]
    E --> M[("MongoDB Atlas")]
    E --> C["Cloudinary"]
    E --> G["Gmail REST API"]
    E --> O["Google Identity Services"]
    E --> T["Google Cloud Translation API"]
    E --> P["Browser push services"]
    V --> Y["GIPHY API/CDN"]
    A["Capacitor Android wrapper"] --> V
    G --> I["Email inbox"]
    E --> S

    subgraph Client["Frontend application"]
      R["React Router"]
      Z["Zustand stores"]
      UI["React components"]
      R --> UI
      UI <--> Z
    end

    V --- Client
```

## Component responsibilities

| Component | Responsibilities |
| --- | --- |
| React frontend | Routing, forms, responsive UI, local state, REST calls, and socket event handling |
| App loading screen | Replaces the application routes while the initial authentication check is in progress |
| Axios client | Sends API requests to `VITE_API_URL/api` with cookies enabled |
| Zustand stores | Own authentication, invitation, conversation, message, and profile-update state |
| Express API | Routing, validation, authentication, authorization, persistence, upload handling, and responses |
| Socket.IO | Authenticates the JWT cookie, joins user rooms, delivers real-time events, and tracks presence |
| MongoDB/Mongoose | Persistent source of truth and schema validation |
| Gmail API | Sends email-verification and password-reset links using Google OAuth 2.0 |
| Cloudinary | Stores/transforms profile pictures and chat attachments and deletes message assets during cleanup |
| Google Cloud Translation | Translates cache misses after atomic daily/monthly character reservation |
| GIPHY | Provides client-side GIF/sticker discovery and externally hosted media delivery |
| Web Push | Uses VAPID-authenticated delivery to browser-managed endpoints and removes expired subscriptions |

## REST and Socket.IO boundary

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO
    participant P as Other participant

    U->>F: Perform mutation
    F->>API: Authenticated REST request
    API->>API: Validate and authorize
    API->>DB: Persist change
    DB-->>API: Saved state
    API->>IO: Emit saved state
    IO-->>P: Targeted room event
    API-->>F: REST response
    F->>F: Update local Zustand state
    Note over F,IO: Typing and presence are ephemeral Socket.IO flows and are not message REST mutations
```

REST is authoritative for mutations. Socket.IO distributes changes only after persistence for message operations. The sender normally updates from the REST response; other participants update from socket events.

Typing state is an exception because it is ephemeral. The composer emits `typing:start` and `typing:stop` directly through Socket.IO. The server verifies conversation membership and forwards `typing:update` only to the other participants; no typing state is written to MongoDB.

Translation is REST-only. It produces a derived view of existing message content and does not mutate or emit the message. Cache entries include the source content hash, so an edited message cannot reuse stale translated text.

Attachment upload is a compound mutation: membership and reply checks run before the Cloudinary upload, metadata is persisted with the message, the conversation's `lastMessage` is updated, and only then is `message:new` emitted. If persistence fails before completion, the controller attempts to remove the new Cloudinary asset.

Group mutations follow the same persistence-first boundary. Administrators mutate membership, roles, names, and images through REST; Socket.IO then emits `conversation:created`, `conversation:updated`, or `conversation:removed` to affected private user rooms.

After a message is persisted, the push-notification service resolves recipient subscriptions and submits encrypted payloads to browser push endpoints. Push failure does not roll back a saved message. Expired endpoints are removed asynchronously.

## Feature-based modular MVC architecture

```mermaid
flowchart TD
    REQ["HTTP request"] --> APP["Express app"]
    APP --> ROUTE["Route composition"]
    ROUTE --> AUTH["Authentication middleware"]
    ROUTE --> VAL["Zod validation middleware"]
    ROUTE --> UP["Multer upload middleware when required"]
    AUTH --> FEATURE["Feature module"]
    VAL --> FEATURE
    UP --> FEATURE
    FEATURE --> CTRL["Feature controller"]
    FEATURE --> SERVICE["Feature service or presenter"]
    FEATURE --> MODEL["Feature-owned Mongoose model"]
    SERVICE --> EXT["Cloudinary, Gmail, Translation, or Web Push integration"]
    MODEL --> DB[("MongoDB")]
    CTRL --> PUB["Realtime event publisher"]
    PUB --> SOCKET["Socket.IO user rooms"]
```

The application retains MVC while organizing it as a feature-based modular monolith. Mongoose schemas and documents form the Model layer, React pages/components form the View layer, and Express controllers coordinate validated requests and responses. Routes dispatch requests to controllers, while services, integrations, presenters, middleware, and realtime handlers support those MVC responsibilities without replacing them.

Authentication, users, invitations, conversations, messages, attachments, translations, notifications, and groups live under `backend/src/modules`. External providers live under `integrations`; Socket.IO authentication, presence, typing, room naming, and event publication live under `realtime`; cross-feature errors and HTTP helpers live under `shared`.

## Authentication architecture

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant A as Express API
    participant DB as MongoDB

    U->>F: Submit password or Google credential
    alt Email and password
      F->>A: POST /api/auth/login
      A->>DB: Find normalized email
      A->>A: Compare bcrypt password
    else Google Sign-In
      F->>A: POST /api/auth/google
      A->>A: Verify Google credential
      A->>DB: Find or create verified user
    end
    alt Email unverified
      A-->>F: 403 verification required
    else Verified
      A-->>F: Set HTTP-only JWT cookie
      F->>A: GET /api/auth/check
      A->>A: Verify JWT cookie
      A->>DB: Load user without password
      A-->>F: Authenticated user
      F->>F: Connect Socket.IO with cookie
    end
```

The REST authentication middleware and Socket.IO middleware separately validate the same `jwt` cookie because Express and Socket.IO have different middleware pipelines.

## Presence architecture

```mermaid
stateDiagram-v2
    [*] --> Offline
    Offline --> Online: first authenticated socket connects
    Online --> Online: additional tab connects or one of many tabs disconnects
    Online --> GracePeriod: final socket disconnects
    GracePeriod --> Online: socket reconnects within 5 seconds
    GracePeriod --> Offline: timer expires
    Offline --> [*]
```

The single-process server stores socket counts and timers in memory. MongoDB stores the public `isOnline` and `lastSeen` state. At startup, stale online flags are reset before Socket.IO begins accepting connections.

## Frontend state flow

```mermaid
flowchart LR
    AR["AppRoutes"] --> AS["useAuthStore"]
    AR --> LS["AppLoadingScreen"]
    CL["ChatLayout"] --> RT["useChatRealtime"]
    RT --> IS["useInvitationStore"]
    RT --> CS["useConversationStore"]
    CW["ChatWindow"] --> MS["useMessageStore"]
    MC["MessageComposer"] --> CT["useComposerTyping"]
    CT -->|"typing:start / typing:stop"| SO
    SO -->|"typing:update"| RT
    PP["Profile picture UI"] --> US["useUserStore"]
    SET["Settings"] --> AS
    SET --> US
    GP["Group dialogs"] --> CS
    PUSH["Push controls"] --> US

    AX["Axios instance"] --> API["Express API"]
    AS --> AX
    IS --> AX
    CS --> AX
    MS --> AX
    US --> AX

    SO["Socket client"] --> RT
    RT --> MS
```

## Deployment architecture

```mermaid
flowchart TD
    DEV["Source push"] --> GH["GitHub repository"]
    GH --> VE["Vercel build and deploy"]
    GH --> RW["Railway/Render build and deploy"]
    VE --> BR["User browser"]
    BR -->|"HTTPS REST and Socket.IO"| RW
    RW --> MA[("MongoDB Atlas")]
    RW --> CL["Cloudinary"]
    RW --> GO["Google OAuth"]
    RW --> GM["Gmail REST API"]
    RW --> TR["Google Translation API"]
    RW --> PS["Browser push services"]
    VE --> GI["Google Identity Services"]
    VE --> GIPHY["GIPHY API/CDN"]
    APK["Capacitor Android package"] --> RW
```

Vercel rewrites frontend routes to `/` so React Router can handle direct navigation. Railway/Render runs `node src/server.js`. The current presence algorithm assumes one Railway/Render backend process.

The maintained deployment targets are:

- Web application: `https://clickchat-ldrp.vercel.app/`
- Backend API and Socket.IO server — Render (active): `https://click-chat-64j1.onrender.com/`
- Backend API and Socket.IO server — Railway (inactive): `https://click-chat-production.up.railway.app/`
