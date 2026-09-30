# Authentication integration

The login and registration module lives in `src/auth/`. Run commands from
the inner `4353-project` directory, where this app's `package.json` lives.

```sh
npm install
npm run dev
```

## Routes and team integration

- `/login`: sign-in form with email and password validation.
- `/register`: email, password, confirmation, and client-side validation.
- `/dashboard`: the team's existing dashboard inside its existing user layout.
- `/admin`: authentication confirmation placeholder until the admin screens are integrated.

`src/main.jsx` already supplies the single `BrowserRouter`. `src/App.jsx`
holds the in-memory current user, role-based navigation, and sign-out action.
Additional user routes belong under the existing protected user route.
Replace the admin confirmation route when the admin UI is ready.

Login accepts `onLogin(user)` and returns a public user with `{ email, role }`.
The layout, forms, mock authentication service, and validation helpers are
kept together under `src/auth/` so other team files can evolve independently.
Authentication styling is scoped to `.qs-auth-surface`; the root layout
override is active only while that surface is mounted. The dashboard files,
shared mock data, existing router, and global stylesheet were preserved.

## Demo accounts and limitations

| Email | Password | Role |
| --- | --- | --- |
| user@queuesmart.test | Queue123! | User |
| admin@queuesmart.test | Queue123! | Admin |

New registrations always get the user role. They can sign in until the page
refreshes. Refreshing resets the mock accounts and signs out the current user.
Passwords and sessions are not written to localStorage or sessionStorage.
This is a front-end simulation, not real authentication or authorization.

Email is the username. Blank fields and malformed emails show inline errors.
Registration requires an 8–128 character password and matching confirmation;
these password limits are the module's chosen validation rules.

## Verification

```sh
npm run test:auth
npm run build
```

For a manual check, open `/login`, submit blank fields, register a sample
account, sign in, confirm the team dashboard appears, and sign out. Try the
admin demo separately. Check both forms at a phone-sized window width.

The old top-level `frontend` directory is the original standalone demo. Once
this integration has been checked locally, it can be removed from the branch
with `git rm -r frontend` from the outer repository directory. Its earlier
commit remains in Git history.
