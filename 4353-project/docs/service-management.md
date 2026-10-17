# A3 Member 2: Service Management and Wait Times

## Scope

Member 2 implements service listing, creation, editing, open/closed status, service validation, and the shared wait-time function. AdminContext, ServiceManagement, and AdminDashboard now read service data from Express and wait for successful API responses before updating the UI. Service data remains in `backend/mock/data.js` and resets when the server restarts; no database is used for A3.

## Run locally

From the inner `4353-project/` directory, use two terminals:

```sh
cd backend
npm install
npm start
```

```sh
cd frontend
npm install
npm run dev
```

The API uses port 3001. Vite proxies `/api` to that port. For a separately hosted backend, set `VITE_API_BASE_URL` to its full API base URL before building (for example, `https://your-server.example/api`).

## Service API

| Method/path | Access | Result |
| --- | --- | --- |
| `GET /api/services` | Public | 200, array of services |
| `POST /api/services` | Authenticated admin | 201, created service |
| `PUT /api/services/:id` | Authenticated admin | 200, updated service |

Example create body:

```json
{
  "name": "Academic Advising",
  "description": "Help with course planning",
  "durationMin": 20,
  "priority": "medium"
}
```

Validation is in `backend/services/serviceService.js`:

- `name`: required string, trimmed, 1-100 characters, unique ignoring case.
- `description`: required string, trimmed, 1-500 characters.
- `durationMin`: required JSON number, integer from 1 through 480 minutes. Numeric strings are rejected.
- `priority`: required, exactly `low`, `medium`, or `high`.
- `status`: optional, `open` (default) or `closed`.
- The server owns `id` and `queueLength`; clients cannot set them. Other unknown fields are rejected.
- PUT accepts any nonempty subset of editable fields, so `{ "status": "closed" }` changes only status. Omitted values are preserved.
- Invalid requests return 400, missing authentication 401, non-admin access 403, unknown service 404, and duplicate name 409. Errors use `{ "error": "message" }`.
- Failed validation never changes the stored service.

## Member 1 authentication integration (still required)

At the base commit for this change, main only has the backend skeleton and A2 mock login. Service writes intentionally return 401 until real authentication is connected. A frontend demo admin role alone does not authorize backend writes.

1. In `backend/app.js`, mount Member 1's token-verification middleware before the services router, either for requests bearing a token or specifically for write methods. Keep the public GET accessible. The middleware must validate the token and assign the verified identity to `req.user`, including `role: 'admin'` or `role: 'user'`.
2. `requireServiceAdmin` then enforces 401/403. Never populate `req.user` from a client-supplied role or unverified JWT payload.
3. The frontend login result should retain the existing `email` and `role` fields and add `token`. App passes `user.token` through AdminLayout to AdminProvider; service mutations send it as `Authorization: Bearer <token>`.
4. After merging authentication, test an actual admin login followed by create/edit/close. Also verify a regular user's token is rejected. The current tests supply a trusted user only inside the isolated test Express app; they do not claim to test Member 1's JWT verification.

## Member 3 integration

Import the one backend helper:

```js
const { calculateWaitTime } = require('../services/waitTimeService');
const estimatedWaitMin = calculateWaitTime(position, service.durationMin);
```

It returns minutes using the team guide's `position * durationMin` formula: position 1 with a 10-minute service returns 10; position 3 returns 30. Position 0 returns 0 for an empty/not-waiting state. Positions must be non-negative safe integers; duration must be an integer from 1 to 480. Invalid inputs and unsafe results throw AppError with status 400.

Queue endpoints should calculate position after priority/arrival ordering, call this helper, and return the estimate for the frontend to display. Do not create another backend wait-time formula. The existing A2 QueueManagement page still has a local estimate and mock queue actions; Member 3 must replace them with queue API responses as part of their assigned integration.

Service reads preserve the shared backend `queueLength` field. Member 3 must keep it synchronized with backend queue membership (or derive it there). AdminContext no longer replaces backend counts with frontend seed queue lengths. The existing seeded counts remain until Member 3 supplies live queue data.

## Verification

```sh
cd backend
npm test -- --runInBand
npm run coverage -- --runInBand --collectCoverageFrom='services/*.js' --collectCoverageFrom='routes/services.js' --collectCoverageFrom='middleware/requireServiceAdmin.js'
```

```sh
cd frontend
npm run test:auth
npm run test:services
npm run build
npm run lint
```

The service tests cover creation, partial updates, duplicate names, boundary values, incorrect types, malformed JSON, immutable response copies, missing services, forged role headers, unauthenticated access, and non-admin access. Wait-time tests cover the formula, zero position, invalid inputs, and overflow. Frontend API tests cover request payloads, token forwarding, and server/network failures.

The backend lockfile also includes the missing optional peer packages required for a clean `npm ci` on the validation environment. No application dependencies were added.
