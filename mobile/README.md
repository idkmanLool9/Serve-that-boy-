# Family Requests — Mobile

Expo (React Native) + TypeScript app for iOS and Android.

## Setup

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go**, or press `i` / `a` for a simulator.

## Pointing at the backend

On a real phone, `localhost` refers to the phone, not your computer — so set
the backend URL to your machine's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:4000 npm start
```

Alternatively edit `extra.apiUrl` in `app.json`. The resolution order is:

1. `EXPO_PUBLIC_API_URL` environment variable
2. `extra.apiUrl` in `app.json`
3. `http://localhost:4000`

## Structure

```
src/
├── api/client.ts          Axios client + typed API calls
├── components/            Reusable UI (Button, Card, RequestCard, …)
├── constants/presets.ts   The one-tap request presets
├── context/              Auth, Theme (dark mode), Socket providers
├── hooks/useRequests.ts   Live request list (REST + websocket)
├── navigation/           Role-aware bottom-tab navigator
├── screens/              Auth, Home (customer), Serve (server), History, Settings
├── theme/theme.ts         Light & dark design tokens
├── notifications.ts       Expo push registration
└── types/                Shared TypeScript types
```

## Notes on push notifications

Push tokens only work on a **physical device** (not simulators). On launch the
app requests permission and registers its Expo push token with the backend; the
backend then sends notifications when requests are created/accepted/completed.
For standalone (non-Expo-Go) builds you'll need an EAS `projectId` — see the
[Expo docs](https://docs.expo.dev/push-notifications/overview/).

## Assets

The `assets/` folder ships tiny 1×1 PNG placeholders so the project runs out of
the box. Replace `icon.png`, `splash.png`, and `adaptive-icon.png` with real
artwork before publishing.
