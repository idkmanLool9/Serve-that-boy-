# Family Requests 👨‍👩‍👧‍👦

A simple, modern mobile app that lets family members send quick requests to each
other. A **Customer** (e.g. a parent) sends a request — _"bring me an item"_,
_"get me an ice cream"_, _"bring my clothes downstairs"_ — and a **Server**
(e.g. a child) receives it instantly, accepts it, completes it, and can send a
short reply.

This repository is a monorepo containing everything needed to run the product
end to end:

| Folder      | What it is                                                        |
| ----------- | ----------------------------------------------------------------- |
| `backend/`  | Node.js + Express + TypeScript API, Prisma/SQLite, Socket.io, JWT |
| `mobile/`   | Expo (React Native) + TypeScript app with dark mode & push        |

## Features

- **Two roles** — Customer (parent) and Server (child).
- **Quick requests** — one-tap presets (item, ice cream, clothes, help) plus
  free-form requests with an optional note.
- **Instant delivery** — requests are pushed in real time over WebSockets and
  via push notifications.
- **Status tracking** — every request moves through `PENDING → ACCEPTED →
  COMPLETED`.
- **Replies** — the Server can send a short message back to the Customer.
- **Request history** — full searchable history per family.
- **User accounts** — email/password auth with hashed passwords and JWTs.
- **Families** — create a family, share a short invite code, and everyone joins.
- **Dark mode** — automatic (follows the device) or manually toggled.
- **Modern, clean UI** — consistent design system, no extra UI dependencies.

## Architecture

```
┌─────────────────────┐         REST (JWT)          ┌──────────────────────┐
│   Expo mobile app   │  ─────────────────────────► │   Express backend    │
│  (iOS / Android)    │  ◄───────────────────────── │                      │
│                     │      Socket.io (realtime)    │  Prisma → SQLite     │
│                     │  ◄───────────────────────── │  Expo push service   │
└─────────────────────┘      Push notifications      └──────────────────────┘
```

## Quick start

You need **Node.js 18+** and the **Expo Go** app on your phone (or a simulator).

### 1. Backend

```bash
cd backend
cp .env.example .env          # adjust JWT_SECRET for production
npm install
npm run db:push               # creates the SQLite database
npm run dev                   # starts the API on http://localhost:4000
```

### 2. Mobile

```bash
cd mobile
npm install
# Point the app at your machine's LAN IP so your phone can reach the backend:
#   EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npm start
npm start
```

Scan the QR code with Expo Go.

### Try it out

1. On one device, **sign up** as a *Customer*, choose **Create a family**, and
   note the invite code shown on the Home screen.
2. On another device (or the same one), **sign up** as a *Server* and **Join a
   family** using that invite code.
3. The Customer sends a request — the Server gets it instantly and can accept,
   complete, and reply.

See [`backend/README.md`](backend/README.md) and
[`mobile/README.md`](mobile/README.md) for details.

## License

MIT
