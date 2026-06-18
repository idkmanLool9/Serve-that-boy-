# Family Requests 👨‍👩‍👧‍👦

A simple, modern app that lets family members send quick requests to each other.
A **Customer** (e.g. a parent) sends a request — _"bring me an item"_, _"get me
an ice cream"_, _"bring my clothes downstairs"_ — and a **Server** (e.g. a child)
receives it instantly, accepts it, completes it, and can send a short reply.

The app runs as a **web app hosted on GitHub Pages**, backed by **Supabase**
(database + auth + realtime). It's free to run, there's no server to babysit,
and on a phone you can **Add it to your Home Screen** so it feels like a native
app — no Apple Developer account needed. When you're ready to ship a real native
iOS/Android app to the stores, the same Expo codebase builds for those too.

## How it's put together

```
┌──────────────────────────┐        HTTPS / WebSocket        ┌────────────────────┐
│  Expo web app (PWA)       │  ───────────────────────────►  │      Supabase       │
│  hosted on GitHub Pages   │  ◄───────────────────────────  │  Postgres + Auth    │
│  iOS / Android / desktop  │      realtime updates + RLS     │  Realtime           │
└──────────────────────────┘                                 └────────────────────┘
```

| Folder       | What it is                                                              |
| ------------ | ---------------------------------------------------------------------- |
| `mobile/`    | Expo (React Native + web) app — the whole UI                           |
| `supabase/`  | `schema.sql` — the full database (tables, RLS, functions, realtime)    |
| `.github/`   | GitHub Actions workflow that builds & deploys the web app to Pages     |
| `backend/`   | _Optional._ A self-hostable Node/Express alternative backend (see note) |

> **Note on `backend/`:** the live app uses Supabase, so you do **not** need to
> run anything in `backend/`. It's kept as an optional self-hosted alternative
> (and a head start for native push notifications later). You can ignore or
> delete it.

## Features

- **Two roles** — Customer (parent) and Server (child).
- **Quick requests** — one-tap presets plus free-form requests with a note.
- **Instant delivery** — requests appear in real time via Supabase Realtime.
- **Status tracking** — every request moves through `PENDING → ACCEPTED → COMPLETED`.
- **Replies** — the Server can send a short message back.
- **Request history** with status filters.
- **User accounts** — email/password auth (Supabase Auth).
- **Families** — create a family, share a short invite code, everyone joins.
- **Dark mode** — Auto / Light / Dark.
- **Installable** — "Add to Home Screen" works on iOS & Android.

## Deploying to GitHub Pages

The database is already set up on Supabase and the app is already pointed at it,
so deployment is just two one-time settings:

1. **Enable Pages**: repo **Settings → Pages → Build and deployment → Source →
   GitHub Actions**.
2. **Push to the deploy branch.** The workflow in
   `.github/workflows/deploy-pages.yml` builds the web app and publishes it.
   It runs automatically on pushes to `main` / the feature branch, or you can
   trigger it manually from the **Actions** tab.

Your app will be live at:

```
https://<your-github-username>.github.io/<repo-name>/
```

### One recommended Supabase setting (for the smoothest signup)

By default Supabase asks new users to confirm their email before logging in.
For a frictionless family setup, turn that off:

- Supabase dashboard → **Authentication → Sign In / Providers → Email** →
  disable **"Confirm email"**.

The app works either way — if confirmation stays on, after signing up users are
told to confirm their email, then log in.

## Try it out

1. **Sign up** as a *Customer*, choose **Create family**, and note the invite
   code shown in **Settings**.
2. On another device, **sign up** as a *Server* and **Join family** with that
   code.
3. The Customer sends a request — the Server sees it instantly and can accept,
   complete, and reply.

## Local development

```bash
cd mobile
npm install
npm run web        # opens the app in your browser
# or: npm start    # for Expo Go on a phone / simulator
```

See [`mobile/README.md`](mobile/README.md) for details and configuration.

## About push notifications

True background push (waking a closed app) needs a native build and the Apple/
Google developer accounts. For now the app delivers **instant in-app updates via
realtime**, which covers the "Server sees the request immediately" experience
while the app is open. Background push is wired up when you move to native builds.

## License

MIT
