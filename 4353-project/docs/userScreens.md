# User screens integration

The user-facing screens live in `src/pages/user/`, with shared queue state in
`src/context/QueueContext.jsx`. Run commands from the directory where the
app's `package.json` lives.

```sh
npm install
npm run dev
```

## Routes and team integration

- `/dashboard`: current queue overview, available services, and a compact notifications panel.
- `/join-queue`: browse services, see the estimated wait, and join or leave a queue.
- `/queue-status`: current position, estimated wait, and a status badge (waiting, almost ready, served).
- `/history`: table of past queues with date, service name, and outcome.
- `/notifications`: full list of in-app notifications.

`src/main.jsx` supplies the single `BrowserRouter` and wraps the app in
`<QueueProvider>`. `src/App.jsx` holds the routing table; all five user routes
render inside `UserLayout` (`src/layouts/UserLayout.jsx`), which provides the
user navbar and an `<Outlet />`. Auth routes (`/login`, `/register`) have no
layout, admin routes use `AdminLayout`, and unknown paths redirect to `/login`.
Additional user routes belong under the existing `UserLayout` route.

`QueueContext` exposes `currentQueue`, `joinQueue(service)`, `leaveQueue()`,
and the `useQueue()` hook, so Join Queue, Dashboard, and Queue Status stay in
sync. Joining a queue sets its status to `"waiting"`. Join is disabled when a
service is closed or the user is already in another queue.

`EmptyState` (`src/components/user/EmptyState.jsx`) is the reusable empty
message, with props `title`, `message`, `actionText`, and `actionTo`. Queue
Status and History use it when there is nothing to show. The notifications
panel (`src/components/user/Notifications.jsx`) shows the first three items
when given the `compact` prop.

## Mock data and styling

`src/mock/data.js` has named exports `services`, `currentQueue`, `history`,
and `notifications`. Edit these to try other scenarios, such as a closed
service or an empty history. There is no backend, and mock state resets when
the browser refreshes, so move between pages with the navbar links.

User screen styles live in `src/user-screens.css`, scoped under
`.qs-user-surface`. It shares the palette, fonts, and `qs-` class prefix with
the auth styles in `src/index.css`, so the two stay visually consistent.

## Verification

```sh
npm run build
```

For a manual check, sign in and confirm the dashboard appears. Join a service
from `/join-queue`, then confirm the dashboard and `/queue-status` both show
it. Leave the queue and confirm the empty states appear. Open `/history` and
`/notifications`, and check every screen at a phone-sized window width.

## Git workflow

Nobody commits directly to `main`. Use one branch per task, small commits,
open a pull request, merge, then sync. See `git-workflow.md` for the full
cheat sheet.
