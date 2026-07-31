# System architecture

## High-level architecture

```mermaid
flowchart LR
    U["Desktop or mobile browser"] -->|"HTTPS"| V["React 19 + Vite on Vercel"]
    V -->|"REST with credentials"| E["Express 5 API on Railway"]
    V <-->|"Authenticated Socket.IO"| S["Socket.IO server"]
    E --> M[("MongoDB Atlas")]
    E --> C["Cloudinary"]
    E --> G["Gmail REST API"]
    E --> T["Google Cloud Translation API"]
    V --> Y["GIPHY API/CDN"]
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
```

REST is authoritative for mutations. Socket.IO distributes changes only after persistence for message operations. The sender normally updates from the REST response; other participants update from socket events.

Typing state is an exception because it is ephemeral. The composer emits `typing:start` and `typing:stop` directly through Socket.IO. The server verifies conversation membership and forwards `typing:update` only to the other participants; no typing state is written to MongoDB.

Translation is REST-only. It produces a derived view of existing message content and does not mutate or emit the message. Cache entries include the source content hash, so an edited message cannot reuse stale translated text.

Attachment upload is a compound mutation: membership and reply checks run before the Cloudinary upload, metadata is persisted with the message, the conversation's `lastMessage` is updated, and only then is `message:new` emitted. If persistence fails before completion, the controller attempts to remove the new Cloudinary asset.

## Backend layering

```mermaid
flowchart TD
    REQ["HTTP request"] --> APP["Express app"]
    APP --> ROUTE["Route module"]
    ROUTE --> AUTH["Authentication middleware"]
    ROUTE --> VAL["Zod validation middleware"]
    ROUTE --> UP["Multer upload middleware when required"]
    AUTH --> CTRL["Controller"]
    VAL --> CTRL
    UP --> CTRL
    CTRL --> SERVICE["Service or utility"]
    CTRL --> MODEL["Mongoose model"]
    SERVICE --> EXT["Cloudinary, Gmail, or Translation API"]
    MODEL --> DB[("MongoDB")]
    CTRL --> SOCKET["Socket.IO event emission"]
```

## Authentication architecture

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant A as Express API
    participant DB as MongoDB

    U->>F: Submit login
    F->>A: POST /api/auth/login
    A->>DB: Find normalized email
    A->>A: Compare bcrypt password
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
    CL["ChatLayout"] --> IS["useInvitationStore"]
    CL --> CS["useConversationStore"]
    CW["ChatWindow"] --> MS["useMessageStore"]
    MC["MessageComposer"] -->|"typing:start / typing:stop"| SO
    SO -->|"typing:update"| CL
    PP["Profile picture UI"] --> US["useUserStore"]

    AX["Axios instance"] --> API["Express API"]
    AS --> AX
    IS --> AX
    CS --> AX
    MS --> AX
    US --> AX

    SO["Socket client"] --> CL
    CL --> IS
    CL --> CS
    CL --> MS
```

## Deployment architecture

```mermaid
flowchart TD
    DEV["Source push"] --> GH["GitHub repository"]
    GH --> VE["Vercel build and deploy"]
    GH --> RW["Railway build and deploy"]
    VE --> BR["User browser"]
    BR -->|"HTTPS REST and Socket.IO"| RW
    RW --> MA[("MongoDB Atlas")]
    RW --> CL["Cloudinary"]
    RW --> GO["Google OAuth"]
    RW --> GM["Gmail REST API"]
```

Vercel rewrites frontend routes to `/` so React Router can handle direct navigation. Railway runs `node src/server.js`. The current presence algorithm assumes one Railway backend process.

The maintained deployment targets are:

- Web application: `https://clickchat-ldrp.vercel.app/`
- Backend API and Socket.IO server: `https://click-chat-production.up.railway.app/`
