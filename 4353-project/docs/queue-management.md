# A3 Member 3: Queue Management

## Scope

Member 3 implements joining and leaving a queue, a user's current queue status, the admin view of a queue, serving the next user, and the ordering rule. Data lives in memory in `backend/mock/data.js` and resets when the server restarts; no database is used for A3.

Run locally (two terminals, from the inner project directory):

```sh
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```

## Queue API

All queue endpoints need a login token (`Authorization: Bearer <token>`).

| Method/path | Access | Result |
| --- | --- | --- |
| `GET /api/queues` | Any signed-in user | Per service: `queueLength` and the `estimatedWaitMin` a new joiner would face |
| `GET /api/queues/current` | User | `{ currentQueue, lastServed }`; `currentQueue` has `serviceId`, `serviceName`, `position`, `status`, `estimatedWaitMin`, `queueLength`, or is `null` |
| `POST /api/queues/:serviceId/join` | User | 201, same shape as `currentQueue` |
| `POST /api/queues/:serviceId/leave` | User | 200, `{ serviceId, serviceName, left: true }` |
| `GET /api/queues/:serviceId` | Admin | `{ service, length, queue: [...] }` in serving order |
| `POST /api/queues/:serviceId/serve-next` | Admin | `{ served, queueLength }` |

Errors use `{ "error": "message" }`: 400 invalid service id, 401 missing or invalid token, 403 wrong role (a user calling an admin endpoint, or an admin trying to join), 404 unknown service or "not in this queue", 409 closed queue, already in a queue, or serving an empty queue.

## Rules

- **Ordering:** higher priority first, then earlier arrival. Each entry keeps the service's priority level from the moment the user joined. Within one service the level is normally the same, so arrival order decides; if an admin raises a service's priority, later joiners are served ahead of earlier ones.
- **One queue at a time:** a user cannot join a second queue until they leave or are served.
- **Closed queues:** nobody can join, but people already waiting can still be served.
- **Wait time:** `calculateWaitTime(position, durationMin)` from Member 2's `waitTimeService.js`. There is no second formula.
- **Status:** position 1 or 2 is `almost-ready`; anything later is `waiting`. A user who was just served is reported in `lastServed` (status screen shows "Served") until they join again.
- **queueLength:** the service's `queueLength` is updated on every join, leave, and serve, so `GET /api/services` always matches the real queue.
- **Demo data:** services start with demo queue entries that match their seeded `queueLength` (4 and 7). They behave like real entries but never create notifications or history.

## Integration with other members

`backend/services/queueService.js` calls Member 4's modules after each change:

| Event | History (`addHistoryRecord`) | Notification (`addNotification`) |
| --- | --- | --- |
| Join | `{ action: 'joined_queue', outcome: 'Joined', serviceId, service, date }` | "You joined ..., you are number N" |
| Leave | `{ action: 'left_queue', outcome: 'Left queue', ... }` | "You left the ... queue" |
| Serve | `{ action: 'served', outcome: 'Served', ... }` | "You have been served" |
| Position reaches 2 or less | none | "You're almost up ..." (sent once per user) |

History records use `outcome` values `Joined`, `Left queue`, and `Served` plus `service` and `date`, matching the History screen's columns. The wait-time and service lookups come from Member 2's `waitTimeService` and `serviceService.getServiceById`.

## Front end

- `src/services/queueApi.js` wraps the endpoints with the shared `apiRequest` helper.
- `QueueContext` loads the current queue from the API and refreshes it every 5 seconds. It is mounted inside the signed-in user session in `App.jsx`, so it resets on sign out.
- `JoinQueue` and `QueueStatus` display backend data (position, wait, status, served).
- Admin `QueueManagement` shows the live queue and a **Serve next** button. The A2 reorder and remove buttons were removed because ordering is now decided by priority and arrival.

## Verification

```sh
cd backend
npm test
npm run coverage
```

Tests: `tests/queueService.test.js` (rules, validation, ordering, notifications, history) and `tests/queues.routes.test.js` (endpoints with real logins, role checks, error codes, history and notification side effects).

Manual check: sign in as the user, join Student Inquiries (position 5), sign in as the admin in a second browser, press **Serve next** until the user is position 2 (status becomes Almost ready and a notification is created), then serve once more and watch the user's status change to Served.
