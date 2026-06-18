# Family Requests — App

Expo (React Native + web) + TypeScript. The same codebase runs as a **web app**
(deployed to GitHub Pages) and as a native iOS/Android app later.

The backend is **Supabase** (Postgres + Auth + Realtime). The connection details
live in `app.config.js` with working defaults, so the app runs out of the box.

## Run locally

```bash
npm install
npm run web        # browser
npm start          # Expo Go (phone) / simulator — press w / i / a
```

## Build the static web export

```bash
# "/" base path for local preview:
npx expo export --platform web
npx serve dist     # or any static file server

# Subdirectory base path (as on GitHub Pages):
EXPO_BASE_URL=/serve-that-boy- npx expo export --platform web
```

Deployment to GitHub Pages is automated by
`.github/workflows/deploy-pages.yml` — see the root README.

## Configuration

Values resolve from environment variables first, then `app.config.js` defaults:

| Variable                        | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL                                 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key (public; RLS protects) |
| `EXPO_BASE_URL`                 | Web base path (`/` locally, `/<repo>` on Pages)      |

See `.env.example`. The anon key is **meant** to be public — Row Level Security
on the database is what actually protects each family's data.

## Structure

```
src/
├── lib/supabase.ts        Supabase client (auth storage, realtime)
├── api/client.ts          Typed data layer: auth, family, requests (RPC + queries)
├── context/
│   ├── AuthContext.tsx     Supabase session + profile
│   ├── ThemeContext.tsx    Dark mode (Auto / Light / Dark)
│   └── SocketContext.tsx   Supabase Realtime subscription
├── hooks/useRequests.ts   Live request list (fetch + refetch on realtime change)
├── components/            Reusable UI (Button, Card, RequestCard, …)
├── constants/presets.ts   The one-tap request presets
├── navigation/           Role-aware bottom-tab navigator
├── screens/              Auth, Home (customer), Serve (server), History, Settings
├── theme/theme.ts         Light & dark design tokens
└── types/                Shared TypeScript types
```

## How auth + data work

- **Sign up** calls `supabase.auth.signUp` with the name/role and either a family
  name (to create) or an invite code (to join). A Postgres trigger
  (`handle_new_user`) creates the family + profile atomically.
- **Requests** are created/accepted/completed/replied via SECURITY DEFINER RPC
  functions that enforce roles server-side.
- **Reads** are guarded by Row Level Security so each member only ever sees their
  own family.
- **Realtime** subscribes to changes on the `requests` table (scoped to the
  family) and refetches, so both sides stay in sync instantly.

The full database definition is in [`../supabase/schema.sql`](../supabase/schema.sql).
