# Administrator screens

The administrator screens live in `src/pages/admin/`. Run commands from
the inner `4353-project` directory, where this app's `package.json` lives.

```sh
npm install
npm run dev
```

## Routes and team integration

- `/admin`: Admin Dashboard with summary cards, a list of services with their queue lengths, and open/close queue buttons.
- `/admin/services`: Service Management form to create or edit a service, with a list of existing services.
- `/admin/queues`: Queue Management for viewing a service's queue, reordering or removing users, and serving the next user.

`src/App.jsx` holds the admin routes in a block protected by the admin role,
next to the existing user routes. The admin pages share a navigation bar from
`src/layouts/AdminLayout.jsx` and share their data through
`src/context/AdminContext.jsx`, so a change on one screen shows up on the
others. Mock queue users live in `src/mock/adminData.js`. Admin styling uses
the `qs-admin-` prefix in `src/admin-screens.css`, so it does not clash with
the auth or user styles.

## What each screen does

**Admin Dashboard.** Three summary cards show the number of services, open
queues, and people waiting. The table below lists every service with a status
badge and its current queue length. **Close queue / Open queue** flips the
badge between open and closed. **Manage queue** and **Edit** jump to the other
admin screens with that service already selected.

**Service Management.** The form fields are Service Name (required, 100
characters maximum, with a live counter), Description (required), Expected
Duration (required number of minutes), and Priority (low, medium, or high).
Invalid input shows a red message under the field. A valid save shows a green
confirmation, and the new or updated service appears in the list immediately.

**Queue Management.** Choose a service from the dropdown to see its queue
(position, user, time joined, estimated wait). The arrow buttons reorder users,
**Remove** deletes a user, and **Serve next** removes the first user and shows
a "Now serving" message. The queue length on the dashboard updates to match.

## Demo account and limitations

| Email | Password | Role |
| --- | --- | --- |
| admin@queuesmart.test | Queue123! | Admin |

Admin data is kept in memory only. Refreshing the page resets it and signs the
admin out. The user screens read their own mock data, so admin actions do not
change what users see yet. This is a front-end simulation, not real
authorization.

## Verification

```sh
npm run build
```

For a manual check, sign in as the admin and confirm that closing a queue
changes its badge, that submitting an empty service form shows errors on every
required field, that a created service appears in the list and in the queue
dropdown, and that **Serve next** removes the first user in the queue. Check
each page at a phone-sized window width.