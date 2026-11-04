# Assignment 4: Toby Vu setup and integration

This branch implements Service persistence using PostgreSQL. PostgreSQL is the working choice from the team proposal; the team still needs to confirm it and designate the shared database/schema owner. No shared hosted database has been created or changed.

## Run locally

Use Node.js 24 and a running PostgreSQL instance. The repository has a nested `4353-project` folder. From the repository root:

```bash
cd 4353-project/backend
npm ci
cp .env.example .env
```

Have the database owner create two databases: `queuesmart` for development and `queuesmart_test` for tests. Set `DATABASE_URL` and `TEST_DATABASE_URL` in `.env` to your own PostgreSQL connection strings. The example username/password are placeholders. Everyone uses the same schema and migration files, whether connecting to separate local databases or one agreed shared development database. Never commit `.env`.

```bash
npm run db:migrate
npm run db:seed
npm start
```

`db:migrate` applies the Service schema and records applied migration filenames. It uses a transaction and an advisory lock. `db:seed` is optional: it inserts three familiar A3 services only when the Service table is empty. It never overwrites an existing catalog. Neither command runs automatically at backend startup. The backend fails clearly if the database or Service table is unavailable, rather than silently switching to memory.

In a second terminal, from the repository root:

```bash
cd 4353-project/frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. The default backend port is 3001. The existing demo admin is `admin@queuesmart.test`, password `Queue123!`; Mohammed's current authentication module supplies this account. This branch does not migrate authentication.

## Service schema and API mapping

The table is quoted `"Service"`; PostgreSQL identifiers in double quotes are case-sensitive. SQL clients and future foreign keys must use the exact spelling.

| Database field | Existing API field | Type and constraint |
| --- | --- | --- |
| `"serviceId"` | `id` | INTEGER identity, positive primary key |
| `name` | `name` | VARCHAR(100), required, trimmed, nonempty, case-insensitive unique index |
| `description` | `description` | VARCHAR(500), required, trimmed, nonempty |
| `"expectedDuration"` | `durationMin` | INTEGER, 1 through 480 minutes |
| `"priorityLevel"` | `priority` | VARCHAR(6), low / medium / high |
| `status` | `status` | VARCHAR(6), open / closed, default open |

SQL source: `backend/db/migrations/001_service.sql`. Service has no outgoing foreign key. Asad's Queue table should reference `"Service"("serviceId")`. David should choose a restrictive Service reference and/or historical name snapshot with the team. Closing a service retains its ID; this branch does not introduce deletion, which could break queue and history references. A3 supports create, read, and update, so those operations are preserved.

`queueLength` remains in API responses but is derived queue data, not a Service column. The existing frontend request and response formats are unchanged.

## Integration contract for Asad

```js
const { getServiceById, listServices } = require('./serviceService');
const { calculateWaitTime } = require('./waitTimeService');

const service = await getServiceById(serviceId);
const minutes = calculateWaitTime(position, service.durationMin);
```

All four Service methods (`listServices`, `getServiceById`, `createService`, `updateService`) now return promises. Queue service callers and routes have been updated to await them. `calculateWaitTime` stays synchronous and keeps the A3 formula: position times duration in minutes, including one duration for position 1; position 0 returns 0. Queue ordering still belongs to Asad.

`services/queueCountService.js` is the handoff point for queue counts. It currently counts A3 in-memory queue entries, so the application remains usable while Asad builds persistence. Replace its `getQueueLength(serviceId)` implementation with a database count when Queue/QueueEntry are ready. The caller already awaits its result. Queue, authentication, history, and notification persistence are not claimed as completed by Toby's branch. Demo queue entries are off by default; tests enable `SEED_DEMO_QUEUES=true` for the original regression fixtures.

Use the shared `db/pool.js` from all database-backed modules. Do not create a second pool or an overlapping Service table. If the team chooses another shared configuration module, consolidate this connection module before merging dependent work.

## Test and capture evidence

```bash
cd 4353-project/backend
npm run coverage
```

Tests require `TEST_DATABASE_URL` and will not fall back to the development URL. Each suite creates a random `a4_test_*` schema, populates its own Service fixtures, and removes only that schema afterward. The test account needs permission to create schemas. A dedicated local test database is recommended. The full backend suite tests existing modules plus Service database constraints, duplicate-name races, partial updates, authorization, queue integration, and a real backend process stop/start.

Open `backend/coverage/lcov-report/index.html` for the coverage screenshot. The GitHub Actions workflow runs the suite against PostgreSQL 16 and uploads the coverage folder. Rerun the full suite and capture the final results after all teammates' branches are integrated.

Manual check: log in as admin, create a service, edit its duration, stop/restart the backend, refresh the page, and confirm the edited record remains. Log in as a regular user and verify its queue estimate uses the updated duration. Closing the service must prevent new joins.

## Team decisions still needed

Confirm PostgreSQL; name the initial database owner; decide local versus shared development; distribute connection configuration privately; approve Service identifiers and field mapping; agree Queue/History foreign keys; and assign final end-to-end testing and report submission. The test workflow and setup instructions make Toby's proposed implementation reviewable while those decisions are finalized.
