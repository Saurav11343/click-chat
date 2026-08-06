# ClickChat diagram catalog

This page collects the principal analysis and design diagrams for the current ClickChat web application. Every diagram reflects behavior implemented in the current branch unless a note explicitly says otherwise.

## Rendering guidance

- Render this file in GitHub, VS Code Markdown Preview, or another Mermaid-compatible viewer.
- Each concern is intentionally presented as a separate, compact diagram to reduce crossing lines and overlapping nodes.
- Short labels and one-direction layouts are used so the diagrams remain readable on ordinary screens.
- If a viewer still compresses a diagram, open that diagram by itself or widen the preview pane.

## 1. System context diagram

```mermaid
flowchart LR
    User["ClickChat user"]
    App["ClickChat web application"]
    Mail["Email inbox"]
    Mongo[("MongoDB Atlas")]
    Cloud["Cloudinary"]
    Gmail["Gmail API"]
    Translation["Google Translation API"]
    Push["Browser push services"]
    Giphy["GIPHY API/CDN"]

    User -->|"Uses in browser"| App
    App -->|"Sends verification mail"| Gmail
    Gmail --> Mail
    Mail -->|"Opens verification link"| App
    App -->|"Stores application data"| Mongo
    App -->|"Stores profile images"| Cloud
    App -->|"Translates messages"| Translation
    App -->|"Sends notifications"| Push
    App -->|"Discovers GIFs and stickers"| Giphy
```

## 2. User role diagram

Mermaid has no native UML use-case syntax, so this use-case view uses a flowchart with clearly separated actor and system boundaries.

```mermaid
flowchart LR
    Visitor["Visitor"]
    Member["Authenticated member"]

    subgraph Public["Public account actions"]
        Register["Register account"]
        Verify["Verify email"]
        Resend["Resend verification"]
        Login["Log in"]
        Reset["Reset password"]
        Google["Use Google Sign-In"]
    end

    subgraph Private["Authenticated actions"]
        Search["Search users"]
        Invite["Send invitation"]
        Respond["Accept or decline invitation"]
        Chat["Read and send messages"]
        Manage["Edit or delete own message"]
        Type["Share typing status"]
        Presence["View presence and last seen"]
        Profile["View profile"]
        Photo["Update profile picture"]
        Logout["Log out"]
        Groups["Create and administer groups"]
        Rich["Share media, GIFs, and stickers"]
        Translate["Translate messages"]
        Settings["Manage language, themes, notifications, and password"]
    end

    Visitor --> Register
    Visitor --> Verify
    Visitor --> Resend
    Visitor --> Login
    Visitor --> Reset
    Visitor --> Google

    Member --> Search
    Member --> Invite
    Member --> Respond
    Member --> Chat
    Member --> Manage
    Member --> Type
    Member --> Presence
    Member --> Profile
    Member --> Photo
    Member --> Logout
    Member --> Groups
    Member --> Rich
    Member --> Translate
    Member --> Settings
```

## 3. User journey diagram

```mermaid
flowchart LR
    Start(["Open ClickChat"])
    Account{"Has a verified account?"}
    SignUp["Register"]
    Email["Verify email"]
    SignIn["Log in"]
    Choice{"Start direct chat or group?"}
    Find["Search for a user"]
    Request["Send invitation"]
    Accepted{"Invitation accepted?"}
    Conversation["Open direct conversation"]
    Message["Exchange messages"]
    Group["Create and manage group"]
    Rich["Share text, media, GIFs, and translations"]
    End(["Continue chatting"])

    Start --> Account
    Account -->|"No"| SignUp
    SignUp --> Email
    Email --> SignIn
    Account -->|"Yes"| SignIn
    SignIn --> Choice
    Choice -->|"Direct"| Find
    Choice -->|"Group"| Group
    Find --> Request
    Request --> Accepted
    Accepted -->|"Yes"| Conversation
    Accepted -->|"No or pending"| Find
    Conversation --> Message
    Group --> Rich
    Message --> Rich
    Rich --> End
```

## 4. Data-flow diagram — Level 0

```mermaid
flowchart LR
    User["User"]
    System(("ClickChat system"))
    Email["Email service"]
    Media["Cloud media service"]
    Translation["Translation service"]
    Push["Push services"]
    Data[("Application database")]

    User -->|"Account, invitation, profile, and message input"| System
    System -->|"Pages, contacts, presence, and messages"| User
    System -->|"Verification request"| Email
    Email -->|"Delivery result"| System
    System -->|"Profile, group, and attachment upload"| Media
    Media -->|"Hosted media metadata"| System
    System <-->|"On-demand translation"| Translation
    System -->|"Background notifications"| Push
    System <-->|"Persistent application data"| Data
```

## 5. Data-flow diagram — Level 1

```mermaid
flowchart TB
    User["User"]

    subgraph Processes["ClickChat processes"]
        Auth(("1.0 Account and authentication"))
        Network(("2.0 Invitations and contacts"))
        Messaging(("3.0 Conversations and messages"))
        Realtime(("4.0 Presence and typing"))
        Profiles(("5.0 Profile management"))
        Groups(("6.0 Group administration"))
        Translation(("7.0 Translation and quotas"))
        Notifications(("8.0 Push notifications"))
    end

    Users[("D1 Users")]
    Invitations[("D2 Invitations")]
    Conversations[("D3 Conversations")]
    Messages[("D4 Messages")]
    Translations[("D5 Translation caches and usage")]
    Gmail["Gmail API"]
    Cloudinary["Cloudinary"]

    User --> Auth
    Auth <--> Users
    Auth <--> Gmail

    User --> Network
    Network <--> Invitations
    Network --> Users
    Network --> Conversations

    User --> Messaging
    Messaging <--> Conversations
    Messaging <--> Messages

    User <--> Realtime
    Realtime --> Users
    Realtime --> Conversations

    User --> Profiles
    Profiles <--> Users
    Profiles <--> Cloudinary
    User --> Groups
    Groups <--> Conversations
    Groups <--> Cloudinary
    User --> Translation
    Translation <--> Messages
    Translation <--> Translations
    User --> Notifications
    Notifications <--> Users
```

## 6. Data-flow diagram — authentication detail

```mermaid
flowchart LR
    User["Visitor"]
    Validate(("Validate input"))
    Account(("Create or find account"))
    Token(("Issue or verify token"))
    Users[("Users")]
    Gmail["Gmail API"]
    Cookie["HTTP-only JWT cookie"]
    Google["Google Identity Services"]
    Reset["Forgot/reset-password token flow"]

    User -->|"Registration or login data"| Validate
    Validate --> Account
    Account <--> Users
    Account -->|"New registration"| Token
    Token -->|"Verification link"| Gmail
    Gmail --> User
    User -->|"Verification token"| Token
    Token <--> Users
    Account -->|"Verified login"| Cookie
    Cookie --> User
    User -->|"Google credential"| Google
    Google --> Account
    User --> Reset
    Reset <--> Users
```

## 7. Data-flow diagram — messaging detail

```mermaid
flowchart LR
    Sender["Sender"]
    Receiver["Other participant"]
    API(("Message REST API"))
    Authorize(("Validate membership and ownership"))
    Messages[("Messages")]
    Conversations[("Conversations")]
    Socket(("Socket.IO delivery"))

    Sender -->|"Create text/media, edit, delete, translate, or clear"| API
    API --> Authorize
    Authorize --> Conversations
    Authorize --> Messages
    Authorize -->|"Authorized change"| Messages
    Messages -->|"Saved message"| API
    API -->|"Update last message on create"| Conversations
    API --> Socket
    Socket -->|"New, updated, deleted, or cleared event"| Receiver
    API -->|"REST response"| Sender
```

## 8. Logical component diagram

```mermaid
flowchart LR
    subgraph Client["React frontend"]
        Routes["Lazy React routes"]
        Features["Feature modules"]
        UI["shadcn UI primitives"]
        Hooks["Feature hooks and selectors"]
        Stores["Feature-owned Zustand stores"]
        Shared["Shared API and realtime clients"]

        Routes --> Features
        Features --> UI
        Features --> Hooks
        Hooks <--> Stores
        Stores --> Shared
        Hooks <--> Shared
    end

    subgraph Server["Node.js backend"]
        Express["Express route composition"]
        Middleware["Shared auth, validation, and upload"]
        Modules["Feature modules"]
        Realtime["Realtime authentication and handlers"]
        Integrations["Cloudinary, email, translation, and push"]
        SharedServer["Shared errors and HTTP utilities"]

        Express --> Middleware
        Middleware --> Modules
        Modules --> Realtime
        Modules --> Integrations
        Modules --> SharedServer
    end

    Shared -->|"HTTPS REST"| Express
    Shared <-->|"WebSocket or polling"| Realtime
```

## 9. Deployment diagram

```mermaid
flowchart LR
    Browser["Desktop or mobile browser"]
    Vercel["Vercel\nReact production build"]
    Backend["Railway/Render\nExpress and Socket.IO"]
    Atlas[("MongoDB Atlas")]
    Cloudinary["Cloudinary"]
    Google["Google OAuth and Gmail API"]
    Translation["Google Translation API"]
    Push["Browser push services"]
    Giphy["GIPHY API/CDN"]
    Android["Capacitor Android app"]

    Browser -->|"HTTPS pages"| Vercel
    Browser <-->|"HTTPS REST and Socket.IO"| Backend
    Backend -->|"Mongoose connection"| Atlas
    Backend -->|"Image API"| Cloudinary
    Backend -->|"OAuth and email API"| Google
    Backend --> Translation
    Backend --> Push
    Browser --> Giphy
    Android <-->|"HTTPS REST and Socket.IO"| Backend
```

## 10. UML package diagram

```mermaid
flowchart TB
    subgraph Frontend["frontend/src"]
        FrontApp["app and routes"]
        FrontFeatures["feature modules"]
        FrontUI["shadcn UI primitives"]
        FrontShared["shared API, realtime, and utilities"]
        FrontPlatform["Capacitor platform layer"]

        FrontApp --> FrontFeatures
        FrontFeatures --> FrontUI
        FrontFeatures --> FrontShared
        FrontApp --> FrontPlatform
    end

    subgraph Backend["backend/src"]
        BackRoutes["route composition"]
        BackMiddleware["shared middleware"]
        BackModules["feature modules"]
        BackIntegrations["external integrations"]
        BackRealtime["realtime handlers"]
        BackShared["shared errors and HTTP utilities"]
        BackConfig["config"]

        BackRoutes --> BackMiddleware
        BackMiddleware --> BackModules
        BackRoutes --> BackModules
        BackModules --> BackIntegrations
        BackModules --> BackRealtime
        BackModules --> BackShared
        BackRealtime --> BackModules
        BackIntegrations --> BackConfig
    end

    FrontShared -->|"REST and Socket.IO"| BackRoutes
    FrontShared -->|"Socket.IO"| BackRealtime
    FrontPlatform --> FrontApp
```

## 11. UML class diagram — persistent domain

```mermaid
classDiagram
    direction LR

    class User {
        ObjectId id
        String firstName
        String lastName
        String email
        Boolean isEmailVerified
        Date dateOfBirth
        String passwordHash
        String bio
        Boolean isOnline
        Date lastSeen
        ProfilePicture profilePic
        String preferredLanguage
        PushSubscriptionArray pushSubscriptions
    }

    class Invitation {
        ObjectId id
        ObjectId sender
        ObjectId recipient
        String status
        Date createdAt
        Date updatedAt
    }

    class Conversation {
        ObjectId id
        String type
        ObjectIdArray participants
        String directKey
        String groupName
        ObjectIdArray groupAdmins
        ObjectId createdBy
        ObjectId lastMessage
        GroupImage groupImage
    }

    class Message {
        ObjectId id
        ObjectId conversation
        ObjectId sender
        String content
        String messageType
        ObjectId replyTo
        ReadReceiptArray readBy
        Boolean isEdited
        Boolean isDeleted
        Attachment attachment
        ExternalMedia externalMedia
    }

    User "1" --> "0..*" Invitation : sends
    User "1" --> "0..*" Invitation : receives
    User "0..*" -- "2..*" Conversation : participates
    User "1" --> "0..*" Message : authors
    Conversation "1" *-- "0..*" Message : contains
    Message "0..1" --> "0..*" Message : reply target
    class MessageTranslation
    class TranslationUsage
    Message "1" --> "0..*" MessageTranslation : cached translations
    User "1" --> "0..*" TranslationUsage : quota usage
```

## 12. Entity-relationship diagram

```mermaid
erDiagram
    USER ||--o{ INVITATION : sends
    USER ||--o{ INVITATION : receives
    USER }o--o{ CONVERSATION : participates
    USER ||--o{ CONVERSATION : creates
    USER ||--o{ MESSAGE : sends
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION o|--o| MESSAGE : latest
    MESSAGE o|--o{ MESSAGE : replies
    USER }o--o{ MESSAGE : reads
    MESSAGE ||--o{ MESSAGE_TRANSLATION : translated
    USER ||--o{ TRANSLATION_USAGE : consumes

    USER {
        ObjectId id PK
        String email UK
        String firstName
        String lastName
        Boolean isOnline
        Date lastSeen
    }

    INVITATION {
        ObjectId id PK
        ObjectId sender FK
        ObjectId recipient FK
        String status
    }

    CONVERSATION {
        ObjectId id PK
        String type
        ObjectIdArray participants FK
        String directKey UK
        ObjectId lastMessage FK
        ObjectIdArray groupAdmins FK
    }

    MESSAGE {
        ObjectId id PK
        ObjectId conversation FK
        ObjectId sender FK
        String content
        String messageType
        Boolean isEdited
        Boolean isDeleted
    }
    MESSAGE_TRANSLATION {
        ObjectId id PK
        ObjectId message FK
        String targetLanguage
        String contentHash
    }
    TRANSLATION_USAGE {
        ObjectId id PK
        ObjectId user FK
        Number characters
        String period
    }
```

## 13. Registration and verification sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant DB as MongoDB
    participant Mail as Gmail API

    User->>UI: Submit registration
    UI->>API: POST /api/auth/register
    API->>API: Validate and hash password
    API->>DB: Create unverified user and token hash
    DB-->>API: User saved
    API->>Mail: Send raw verification link
    API-->>UI: Registration accepted
    Mail-->>User: Verification email
    User->>API: GET /api/auth/verify-email with token
    API->>DB: Verify hash and expiry
    API->>DB: Mark verified and clear token fields
    API-->>User: Redirect to login result
    opt User requests resend
      User->>API: POST /api/auth/resend-verification
      API->>API: Enforce cooldown and rate limit
      API->>Mail: Send replacement verification link
    end
```

## 14. Login and socket connection sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO

    User->>UI: Submit password or Google credential
    alt Password login
      UI->>API: POST /api/auth/login
      API->>DB: Find verified user
      API->>API: Compare password hash
    else Google Sign-In
      UI->>API: POST /api/auth/google
      API->>API: Verify Google credential
      API->>DB: Find or create verified user
    end
    API-->>UI: Set HTTP-only JWT cookie
    UI->>API: GET /api/auth/check
    API-->>UI: Authenticated user
    UI->>IO: Connect with JWT cookie
    IO->>IO: Authenticate socket
    IO->>DB: Set isOnline true
    IO-->>UI: Connection established
```

## 15. Invitation acceptance sequence

```mermaid
sequenceDiagram
    actor Sender
    actor Recipient
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO

    Sender->>API: POST /api/invitations
    API->>DB: Create pending invitation
    API->>IO: Emit invitation:new
    IO-->>Recipient: Show incoming invitation
    Recipient->>API: PATCH /api/invitations/:id accepted
    API->>DB: Create or reuse direct conversation
    API->>DB: Mark invitation accepted
    API->>IO: Emit invitation:responded
    IO-->>Sender: Add accepted contact and conversation
    API-->>Recipient: Return invitation and conversation
    Note over Sender,Recipient: Self, duplicate, and existing-contact requests are rejected
```

## 16. Message delivery sequence

```mermaid
sequenceDiagram
    actor Sender
    actor Recipient
    participant UI as Sender frontend
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO

    Sender->>UI: Submit text, attachment, GIF, or sticker
    UI->>API: POST conversation message
    API->>DB: Verify conversation membership
    API->>DB: Create message
    API->>DB: Update conversation.lastMessage
    API->>IO: Emit message:new to other participants
    IO-->>Recipient: Receive saved message
    API-->>UI: Return saved message
    UI-->>Sender: Render message and preview
    opt Recipient application is hidden
      API->>IO: Trigger Web Push delivery
      IO-->>Recipient: Background notification with conversation deep link
    end
```

## 17. Typing indicator sequence

```mermaid
sequenceDiagram
    actor Typist
    participant Composer as Message composer
    participant IO as Socket.IO server
    participant DB as MongoDB
    participant Peer as Other participant UI

    Typist->>Composer: Enter text
    Composer->>IO: typing:start with conversationId
    IO->>DB: Verify conversation membership
    DB-->>IO: Membership confirmed
    IO-->>Peer: typing:update true
    Peer-->>Peer: Show typing indicator
    Typist->>Composer: Send, clear, wait 1.5s, or switch chat
    Composer->>IO: typing:stop with conversationId
    IO-->>Peer: typing:update false
    Peer-->>Peer: Hide typing indicator
    Note over Peer: A 3s safety timeout removes lost stop events
```

Typing state is ephemeral and is not stored in MongoDB.

## 18. Presence state diagram

```mermaid
stateDiagram-v2
    [*] --> Offline
    Offline --> Online: first authenticated socket connects
    Online --> Online: another device or tab connects
    Online --> Online: one of several sockets disconnects
    Online --> GracePeriod: final socket disconnects
    GracePeriod --> Online: reconnect within 5 seconds
    GracePeriod --> Offline: grace timer expires
    Offline --> [*]
    note right of Offline: Startup cleanup resets stale online flags
```

## 19. Invitation state diagram

```mermaid
stateDiagram-v2
    [*] --> Pending: invitation created
    Pending --> Accepted: recipient accepts
    Pending --> Declined: recipient declines
    Accepted --> DirectConversation: create or reuse directKey
    DirectConversation --> [*]
    Declined --> [*]
```

## 20. Message lifecycle state diagram

```mermaid
stateDiagram-v2
    [*] --> Active: text or rich-media message created
    Active --> Edited: author changes content
    Edited --> Edited: author changes content again
    Active --> Deleted: author soft deletes
    Edited --> Deleted: author soft deletes
    Active --> Translated: recipient requests translation
    Translated --> Active: original remains authoritative
    Deleted --> [*]
```

The deleted record remains in MongoDB with empty content and deletion metadata so clients can render the deleted-message placeholder consistently.

## 21. Profile-picture upload activity diagram

```mermaid
flowchart TD
    Start(["User selects an image"])
    Validate{"JPEG, PNG, or WebP within limit?"}
    Upload["Send multipart PATCH request"]
    Authorize["Authenticate user"]
    Store["Upload image to Cloudinary"]
    Update["Update user profilePic metadata"]
    Refresh["Update frontend user state"]
    Close["Close upload dialog"]
    Error["Show validation or upload error"]

    Start --> Validate
    Validate -->|"No"| Error
    Validate -->|"Yes"| Upload
    Upload --> Authorize
    Authorize --> Store
    Store --> Update
    Update --> Refresh
    Refresh --> Close
    Error --> Start
```

## 22. Frontend route navigation diagram

```mermaid
flowchart TB
    Load["Application starts"]
    Check["GET /api/auth/check"]
    Auth{"Authenticated?"}

    subgraph Public["Public routes"]
        Welcome["/"]
        Login["/login"]
        Register["/register"]
        Verify["/verify-email"]
        CheckEmail["/check-email"]
        Forgot["/forgot-password"]
        Reset["/reset-password"]
    end

    subgraph Protected["Protected routes"]
        Chat["/chat"]
        Profile["/profile"]
        Settings["/settings"]
    end

    Load --> Check
    Check --> Auth
    Auth -->|"No"| Welcome
    Auth -->|"Yes"| Chat
    Welcome --> Login
    Welcome --> Register
    Login --> Forgot
    Register --> CheckEmail
    CheckEmail --> Verify
    Login --> Chat
    Chat <--> Profile
    Chat <--> Settings
    Forgot --> Reset
```

## 23. Real-time event map

```mermaid
flowchart LR
    subgraph Producers["Event producers"]
        MessageAPI["Message controller"]
        InviteAPI["Invitation controller"]
        SocketHandlers["Socket connection handlers"]
        Composer["Message composer"]
        ConversationAPI["Conversation/group controller"]
    end

    Rooms["Per-user Socket.IO rooms"]

    subgraph Consumers["Frontend consumers"]
        MessageStore["Message store"]
        ConversationStore["Conversation store"]
        InvitationStore["Invitation store"]
        PresenceUI["Presence UI"]
        TypingUI["Typing indicator"]
    end

    MessageAPI -->|"message:new, message:updated, message:deleted"| Rooms
    ConversationAPI -->|"conversation:created, conversation:updated, conversation:removed, messages:cleared"| Rooms
    InviteAPI -->|"invitation:new, invitation:responded"| Rooms
    SocketHandlers -->|"presence:update"| Rooms
    Composer -->|"typing:start, typing:stop"| SocketHandlers
    SocketHandlers -->|"typing:update"| Rooms

    Rooms --> MessageStore
    Rooms --> ConversationStore
    Rooms --> InvitationStore
    Rooms --> PresenceUI
    Rooms --> TypingUI
```

## 24. Authorization decision flow

```mermaid
flowchart TD
    Request["Protected request or socket connection"]
    Cookie{"JWT cookie present?"}
    Valid{"JWT valid and unexpired?"}
    User{"User exists?"}
    Resource{"Authorized for target resource?"}
    Allow["Perform operation"]
    Reject401["Reject as unauthenticated"]
    Reject403["Reject as unauthorized"]

    Request --> Cookie
    Cookie -->|"No"| Reject401
    Cookie -->|"Yes"| Valid
    Valid -->|"No"| Reject401
    Valid -->|"Yes"| User
    User -->|"No"| Reject401
    User -->|"Yes"| Resource
    Resource -->|"No"| Reject403
    Resource -->|"Yes"| Allow
    Allow --> Role{"Group administration action?"}
    Role -->|"No"| Perform["Perform authorized operation"]
    Role -->|"Yes"| Admin{"Creator/admin/member permission satisfied?"}
    Admin -->|"No"| Reject403
    Admin -->|"Yes"| Perform
```

Resource authorization includes checks such as conversation membership, invitation recipient ownership, and message authorship.

## 25. Translation quota and cache flow

```mermaid
flowchart TD
    Request["Recipient requests translation"] --> Auth{"Conversation member and message valid?"}
    Auth -->|"No"| Reject["Reject request"]
    Auth -->|"Yes"| Cache{"Cached by message, language, and content hash?"}
    Cache -->|"Yes"| Return["Return cached translation"]
    Cache -->|"No"| Enabled{"Translation enabled and key configured?"}
    Enabled -->|"No"| Suspended["503 service suspended/unavailable"]
    Enabled -->|"Yes"| Month{"Atomically reserve monthly characters"}
    Month -->|"Cap reached"| Suspended
    Month -->|"Reserved"| Day{"Atomically reserve daily characters"}
    Day -->|"Cap reached"| Release["Release monthly reservation"]
    Release --> Suspended
    Day -->|"Reserved"| Google["Call Google Translation Basic v2"]
    Google --> Persist["Persist translation cache"]
    Google -->|"Provider failure"| Rollback["Release reserved daily and monthly characters"]
    Rollback --> Suspended
    Persist --> Return
```

## 26. Rich-message delivery paths

```mermaid
flowchart LR
    Composer["Message composer"] --> Text["Text/emoji"]
    Composer --> Upload["Image, video, audio, PDF, Office, text, or CSV"]
    Composer --> External["GIPHY GIF/sticker"]
    Text --> API["Express message API"]
    Upload --> Multer["Multer memory limit"]
    Multer --> Zod["Zod MIME/metadata validation"]
    Zod --> Cloudinary["Cloudinary upload"]
    Cloudinary --> API
    External --> Giphy["GIPHY API/CDN"]
    Giphy --> API
    API --> Mongo[("MongoDB message")]
    Mongo --> Socket["message:new to recipient room"]
    Socket --> Push["Web Push when recipient app is hidden"]
    Text --> Link["Clickable URL and YouTube preview"]
    Link --> API
```
