# Family Requests — Backend

Node.js + Express + TypeScript API. Uses Prisma with SQLite (zero setup),
JWT authentication, Socket.io for real-time updates, and Expo's push service.

## Setup

```bash
cp .env.example .env
npm install
npm run db:push     # creates ./prisma/dev.db from the schema
npm run dev         # http://localhost:4000
```

For production:

```bash
npm run build && npm start
```

## Environment variables

| Variable         | Default                  | Notes                                   |
| ---------------- | ------------------------ | --------------------------------------- |
| `PORT`           | `4000`                   | HTTP port                               |
| `DATABASE_URL`   | `file:./dev.db`          | Any Prisma-supported URL                |
| `JWT_SECRET`     | _(insecure default)_     | **Set a strong secret in production**   |
| `JWT_EXPIRES_IN` | `30d`                    | Token lifetime                          |
| `CORS_ORIGIN`    | `*`                      | Comma-separated origins, or `*`         |

## API

All authenticated routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path               | Body                                                                 | Description                          |
| ------ | ------------------ | ------------------------------------------------------------------- | ------------------------------------ |
| POST   | `/api/auth/signup` | `{ name, email, password, role, familyName? \| inviteCode? }`       | Create account + create/join family  |
| POST   | `/api/auth/login`  | `{ email, password }`                                                | Log in                               |
| GET    | `/api/auth/me`     | —                                                                   | Current user                         |

`role` is `"CUSTOMER"` or `"SERVER"`. Provide **either** `familyName` (creates a
new family and returns an invite code) **or** `inviteCode` (joins an existing
family) — not both.

### Family

| Method | Path              | Description                                       |
| ------ | ----------------- | ------------------------------------------------- |
| GET    | `/api/family/me`  | Family info, invite code, and member list         |

### Requests

| Method | Path                          | Role     | Description                       |
| ------ | ----------------------------- | -------- | --------------------------------- |
| GET    | `/api/requests?status=`       | any      | List family requests (newest 1st) |
| POST   | `/api/requests`               | CUSTOMER | Create a request                  |
| POST   | `/api/requests/:id/accept`    | SERVER   | Accept a pending request          |
| POST   | `/api/requests/:id/complete`  | SERVER   | Complete a request (`{ reply? }`) |
| POST   | `/api/requests/:id/reply`     | SERVER   | Send a short reply (`{ reply }`)  |

Request `type` is one of `item`, `ice_cream`, `clothes`, `help`, `custom`.

### Users

| Method | Path                     | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| PUT    | `/api/users/push-token`  | Save/clear Expo push token           |

## Real-time (Socket.io)

Connect with the JWT in the handshake auth:

```js
io(API_URL, { auth: { token } });
```

Events broadcast to the family room:
`request:created`, `request:accepted`, `request:completed`, `request:replied`.
Each carries the full request object.
