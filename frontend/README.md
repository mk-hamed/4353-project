# QueueSmart - Authentication Screens (A2)

This project contains Toby's assigned authentication screens: login, registration,
and client-side validation. It uses React, React Router, Vite, and plain CSS.
The dashboards, queue controls, and notification functionality are separate team
features. The queue card on the left is a decorative preview, not a working queue.

## See it immediately - no setup

Extract the ZIP, then double-click **OPEN_PREVIEW.html**. It runs the finished
React demo directly in your browser, including registration and both demo
logins. The preview also works offline using fallback system fonts.

This preview is generated from the React source. Make changes in `src/`, then
use `npm run build:preview` to regenerate it. Do not edit the bundled HTML.

## Run and edit the React source on your computer

1. Install Node.js 24 LTS from https://nodejs.org/ if you do not already have a
   compatible version. This project requires Node 20.19+ on the 20.x line, or
   Node 22.12+ (Node 24 recommended). Run `node --version` to check.
2. Extract `QueueSmart_Authentication.zip`.
3. Open the extracted `QueueSmart_Authentication` folder in VS Code.
   The folder you open should contain `package.json`.
4. Choose **Terminal > New Terminal** and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the **Local** URL printed in the terminal, normally
   `http://localhost:5173`. Keep the terminal running while you use the app.
   Press **Ctrl+C** to stop it. Do not open `index.html` by double-clicking it;
   React source needs the development server.

If PowerShell says scripts are disabled, choose **Command Prompt** from the
VS Code terminal dropdown, then run the same commands there.

## Try the complete authentication flow

On Sign in, the **User demo** and **Admin demo** buttons fill the form. Click
**Sign in** after filling it.

| Account       | Email                   | Password    | Destination   |
| ------------- | ----------------------- | ----------- | ------------- |
| Regular user  | `user@queuesmart.test`  | `Queue123!` | `#/dashboard` |
| Administrator | `admin@queuesmart.test` | `Queue123!` | `#/admin`     |

Both destinations show a clearly labeled sign-in confirmation until your
teammates connect their real dashboard components. Sign out returns to login.

To demonstrate registration:

1. Click **Create account**.
2. Use a sample email such as `toby@example.com`.
3. Enter a sample password with at least 8 characters, then confirm it.
4. Submit. The login page displays a success message and fills your email.
5. Enter the same password and sign in.

New registrations always receive the regular-user role. All mock accounts and
sessions live only in memory. A full browser refresh or server restart resets
new accounts and signs you out. No passwords are stored in localStorage or
sessionStorage, and no registration data is sent to a backend. Use sample data.

## Implemented validations

- Both screens reject missing email and password fields.
- Email is used as the username, with a basic format check and a 254-character
  maximum. Outer spaces are trimmed and email matching is case-insensitive.
- Registration requires 8-128 password characters. This is a chosen project
  rule, not an extra requirement claimed from the assignment.
- Confirmation is required and must match exactly. Confirm password is a useful
  addition beyond the assignment's required email/password fields.
- Duplicate email registration and incorrect login credentials show clear errors.
- Errors appear beside the relevant fields; the first invalid field receives focus.
- Passwords are masked with accessible show/hide buttons.
- Submitted forms prevent duplicate submissions while their request is pending.

## Files to understand

| File                            | Purpose                                                              |
| ------------------------------- | -------------------------------------------------------------------- |
| `src/pages/Login.jsx`           | Login form, inline errors, demo account buttons                      |
| `src/pages/Register.jsx`        | Registration form, password confirmation, success redirect           |
| `src/components/FormField.jsx`  | Reusable labeled input and password visibility control               |
| `src/components/AuthLayout.jsx` | Shared page layout and decorative queue illustration                 |
| `src/components/Icon.jsx`       | Small inline SVG icons, no icon-library dependency                   |
| `src/styles/auth.css`           | Responsive layout and shared styles                                  |
| `src/utils/validation.js`       | Input validation rules                                               |
| `src/services/authService.js`   | Simulated login/register functions and demo accounts                 |
| `src/App.jsx`                   | App state, routes, sign-out, and demo route guards                   |
| `src/pages/DemoLanding.jsx`     | Temporary sign-in confirmation; replace with team dashboards         |
| `tests/auth.test.js`            | Automated validation and authentication-flow checks                  |
| `screenshots/`                  | Captures of the running screens for reference and the group document |

## Connect it to the group project

The repository had only a README when this starter was prepared. Check with
your teammates before copying files, since they may have added the shared React
setup since then. Do not overwrite their `App.jsx`, `main.jsx`, `package.json`,
or styles without combining the changes.

If this becomes the team's shared React starter, replace `DemoLanding` in
`src/App.jsx` with the actual user and admin dashboard components. Pass the
signed-in `user` object, whose public fields are `{ email, role }`, as needed.

If the team already has a React project:

1. Copy the authentication pages, components, validation utility, mock service,
   and CSS into matching folders in that project.
2. Use the team's existing React and Vite versions; do not blindly replace
   their package files. Add `react-router-dom` only if they do not already have it.
3. Import `auth.css` once from the shared entry point.
4. Add `/login` and `/register` routes to the existing router and wrap the auth
   screens in `AuthLayout` if you want this layout.
5. Pass an `onLogin(user)` callback to `Login`. The callback should update the
   team's shared authentication state before the page navigates.
6. Match the `/dashboard` and `/admin` destinations to your teammates' routes.
   Use only one top-level router; do not nest another HashRouter in an existing
   BrowserRouter or HashRouter. Hash routing is used in this standalone demo
   for easy local/static navigation.

All styling classes start with `qs-`. The initial global font, background, and
element rules in `auth.css` should be reviewed when merging into another app.
Google Fonts is optional; local system fonts are used if it cannot load.

## What to show in your group submission

- Login screen and registration screen.
- An example of empty/invalid input errors.
- A successful registration followed by login.
- Both regular-user and admin demo logins.
- Explain that authentication is simulated for A2 and that A3 will supply APIs.

Screenshots are provided, but run the app and understand it before presenting.
The login and registration components use React `useState` for inputs, errors,
and submission state. `handleSubmit` validates, displays errors, and calls the
mock service only if the form is valid. React Router connects the pages.

For your contribution record, describe work you actually review, adapt, test,
and integrate. Follow your course's rules on disclosing AI assistance.
No GitHub commit, push, pull request, or deployment was performed for this copy.

## Verification commands

```bash
npm test
npm run build
```

To inspect the production build:

```bash
npm run preview
```

The app also has browser-tested desktop and mobile flows; see `TEST_RESULTS.md`.
Node test dependencies are built in. Browser testing was performed separately;
Playwright is not required to run this application.

## A2 boundaries

This is a front-end prototype, not real authentication. A client-side route guard
only demonstrates navigation. In A3, replace `authService.js` with API calls and
implement password hashing, authenticated sessions, and authorization on the
server. The API-shaped async functions keep that future change separate from
the screen components. There is no backend or database in this download.
