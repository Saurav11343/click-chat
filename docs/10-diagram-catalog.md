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

    User -->|"Uses in browser"| App
    App -->|"Sends verification mail"| Gmail
    Gmail --> Mail
    Mail -->|"Opens verification link"| App
    App -->|"Stores application data"| Mongo
    App -->|"Stores profile images"| Cloud
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
    end

    Visitor --> Register
    Visitor --> Verify
    Visitor --> Resend
    Visitor --> Login

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
```

## 3. User journey diagram

```mermaid
flowchart LR
    Start(["Open ClickChat"])
    Account{"Has a verified account?"}
    SignUp["Register"]
    Email["Verify email"]
    SignIn["Log in"]
    Find["Search for a user"]
    Request["Send invitation"]
    Accepted{"Invitation accepted?"}
    Conversation["Open direct conversation"]
    Message["Exchange messages"]
    End(["Continue chatting"])

    Start --> Account
    Account -->|"No"| SignUp
    SignUp --> Email
    Email --> SignIn
    Account -->|"Yes"| SignIn
    SignIn --> Find
    Find --> Request
    Request --> Accepted
    Accepted -->|"Yes"| Conversation
    Accepted -->|"No or pending"| Find
    Conversation --> Message
    Message --> End
```

## 4. Data-flow diagram — Level 0

```mermaid
flowchart LR
    User["User"]
    System(("ClickChat system"))
    Email["Email service"]
    Image["Image service"]
    Data[("Application database")]

    User -->|"Account, invitation, profile, and message input"| System
    System -->|"Pages, contacts, presence, and messages"| User
    System -->|"Verification request"| Email
    Email -->|"Delivery result"| System
    System -->|"Profile image upload"| Image
    Image -->|"Hosted image metadata"| System
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
    end

    Users[("D1 Users")]
    Invitations[("D2 Invitations")]
    Conversations[("D3 Conversations")]
    Messages[("D4 Messages")]
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

    Sender -->|"Create, edit, or delete"| API
    API --> Authorize
    Authorize --> Conversations
    Authorize --> Messages
    Authorize -->|"Authorized change"| Messages
    Messages -->|"Saved message"| API
    API -->|"Update last message on create"| Conversations
    API --> Socket
    Socket -->|"New, updated, or deleted event"| Receiver
    API -->|"REST response"| Sender
```

## 8. Logical component diagram

```mermaid
flowchart LR
    subgraph Client["React frontend"]
        Routes["React Router"]
        Pages["Pages and layouts"]
        UI["UI components"]
        Stores["Zustand stores"]
        Axios["Axios client"]
        SocketClient["Socket.IO client"]

        Routes --> Pages
        Pages --> UI
        UI <--> Stores
        Stores --> Axios
        Stores <--> SocketClient
    end

    subgraph Server["Node.js backend"]
        Express["Express routes"]
        Middleware["Auth, validation, upload"]
        Controllers["Controllers"]
        Models["Mongoose models"]
        SocketServer["Socket.IO server"]

        Express --> Middleware
        Middleware --> Controllers
        Controllers --> Models
        Controllers --> SocketServer
    end

    Axios -->|"HTTPS REST"| Express
    SocketClient <-->|"WebSocket or polling"| SocketServer
```

## 9. Deployment diagram

```mermaid
flowchart LR
    Browser["Desktop or mobile browser"]
    Vercel["Vercel\nReact production build"]
    Railway["Railway\nExpress and Socket.IO"]
    Atlas[("MongoDB Atlas")]
    Cloudinary["Cloudinary"]
    Google["Google OAuth and Gmail API"]

    Browser -->|"HTTPS pages"| Vercel
    Browser <-->|"HTTPS REST and Socket.IO"| Railway
    Railway -->|"Mongoose connection"| Atlas
    Railway -->|"Image API"| Cloudinary
    Railway -->|"OAuth and email API"| Google
```

## 10. UML package diagram

```mermaid
flowchart TB
    subgraph Frontend["frontend/src"]
        FrontRoutes["routes"]
        FrontPages["pages"]
        FrontLayout["layout"]
        FrontComponents["components"]
        FrontStores["store"]
        FrontLib["api and lib"]

        FrontRoutes --> FrontPages
        FrontPages --> FrontLayout
        FrontLayout --> FrontComponents
        FrontComponents --> FrontStores
        FrontStores --> FrontLib
    end

    subgraph Backend["backend/src"]
        BackRoutes["routes"]
        BackMiddleware["middleware and validation"]
        BackControllers["controllers"]
        BackServices["services and utilities"]
        BackModels["models"]
        BackSocket["socket"]

        BackRoutes --> BackMiddleware
        BackMiddleware --> BackControllers
        BackControllers --> BackServices
        BackControllers --> BackModels
        BackControllers --> BackSocket
        BackSocket --> BackModels
    end

    FrontLib -->|"REST and Socket.IO"| BackRoutes
    FrontLib -->|"Socket.IO"| BackSocket
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
    }

    User "1" --> "0..*" Invitation : sends
    User "1" --> "0..*" Invitation : receives
    User "0..*" -- "2..*" Conversation : participates
    User "1" --> "0..*" Message : authors
    Conversation "1" *-- "0..*" Message : contains
    Message "0..1" --> "0..*" Message : reply target
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
```

## 14. Login and socket connection sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO

    User->>UI: Submit credentials
    UI->>API: POST /api/auth/login
    API->>DB: Find verified user
    API->>API: Compare password hash
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

    Sender->>UI: Submit message
    UI->>API: POST conversation message
    API->>DB: Verify conversation membership
    API->>DB: Create message
    API->>DB: Update conversation.lastMessage
    API->>IO: Emit message:new to other participants
    IO-->>Recipient: Receive saved message
    API-->>UI: Return saved message
    UI-->>Sender: Render message and preview
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
    Typist->>Composer: Send, clear, blur, or switch chat
    Composer->>IO: typing:stop with conversationId
    IO-->>Peer: typing:update false
    Peer-->>Peer: Hide typing indicator
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
```

## 19. Invitation state diagram

```mermaid
stateDiagram-v2
    [*] --> Pending: invitation created
    Pending --> Accepted: recipient accepts
    Pending --> Declined: recipient declines
    Accepted --> [*]
    Declined --> [*]
```

## 20. Message lifecycle state diagram

```mermaid
stateDiagram-v2
    [*] --> Active: message created
    Active --> Edited: author changes content
    Edited --> Edited: author changes content again
    Active --> Deleted: author soft deletes
    Edited --> Deleted: author soft deletes
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
    end

    subgraph Protected["Protected routes"]
        Chat["/chat"]
        Profile["/profile"]
    end

    Load --> Check
    Check --> Auth
    Auth -->|"No"| Welcome
    Auth -->|"Yes"| Chat
    Welcome --> Login
    Welcome --> Register
    Register --> CheckEmail
    CheckEmail --> Verify
    Login --> Chat
    Chat <--> Profile
```

## 23. Real-time event map

```mermaid
flowchart LR
    subgraph Producers["Event producers"]
        MessageAPI["Message controller"]
        InviteAPI["Invitation controller"]
        SocketHandlers["Socket connection handlers"]
        Composer["Message composer"]
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
```

Resource authorization includes checks such as conversation membership, invitation recipient ownership, and message authorship.
