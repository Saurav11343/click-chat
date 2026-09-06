# ClickChat frontend

React 19 and Vite 8 client with React Router, Zustand, Tailwind CSS 4, shadcn/Radix UI, Axios, and Socket.IO. Capacitor 8 packages the same build for Android.

## Local development

Use Node.js 22.12 or newer. Start the backend using the [setup guide](../docs/08-setup-and-deployment.md), then create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_web_oauth_client_id
VITE_GIPHY_API_KEY=your_giphy_api_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

`VITE_API_URL` is the backend origin without `/api`. The other variables enable Google Sign-In, GIF/sticker discovery, and browser push respectively. The Google client ID must match the backend's configured audience; the VAPID public key must match its key pair. Vite embeds these public values at build time. Keep backend secrets out of frontend environment variables.

Run from `frontend`:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Set the backend's `CLIENT_URL` to that exact origin; REST and Socket.IO use the authentication cookie.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Production assets in `dist` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint checks |

No frontend application test script is configured.

## Code organization

- `src/app`: application providers and lazy routes.
- `src/features`: authentication, chat, invitations, landing, profile, and settings.
- `src/shared`: API/socket clients, notifications, themes, constants, and formatting.
- `src/components/ui`: shared shadcn/Radix primitives.
- `src/platform/capacitor`: Android navigation integration.
- `public/sw.js`: Web Push service worker.
- `android`: native Android project; `capacitor.config.json` points to `dist`.

`VideoCallProvider` wraps the routes and owns direct WebRTC audio/video calls. Calling requires media permission and a secure context; current STUN-only connectivity and call lifecycle limitations are described in [Real-time events](../docs/05-realtime-events.md#call-signaling).

See [Frontend design](../docs/06-frontend-design.md) for routes, stores, and UI behavior. See [Android APK setup](../docs/08-setup-and-deployment.md#android-apk) for build commands, JDK/SDK requirements, and native Google Sign-In configuration.
