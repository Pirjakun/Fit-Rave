# Firebase Backend & Admin Dashboard — Design Spec

Status: Approved by user (2026-07-11)

## 1. Overview

Phase 2 of the Mid Year Party app: replace the in-memory mock data layer with a real database (Firebase/Firestore), add real employee authentication (email + password, replacing the current no-password name+email login), and add a simple internal admin dashboard for managing activities, viewing/resetting employee selections, and editing the event schedule.

This phase also unblocks deployment to Vercel: the current in-memory `Map`-based stores in `src/features/selection/store.ts` don't survive across serverless function invocations, so a persistent database is a hard requirement, not just a nice-to-have.

**Guiding constraint**: the existing frontend already talks to the mock data through Next.js Route Handlers (`/api/*`) that were deliberately designed to be "swapped for a real backend later without changing frontend code" (see the Phase 1 spec, Section 7). This phase honors that: the Route Handler contracts stay the same; only their internals change from in-memory `Map`/array operations to Firestore reads/writes via the Firebase Admin SDK.

## 2. Architecture

```
Browser (React Query hooks — unchanged)
  --> Next.js Route Handlers (/api/*)      [same contract, new internals]
      --> Firebase Admin SDK (server-only, service account)
          --> Firestore (activities, users, selectionState, event)

Browser (Firebase client SDK — auth only)
  --> Firebase Auth (signup / login / password reset)
      --> ID token attached to every /api/* request
          --> Route Handlers verify the token server-side before touching Firestore
```

The Firebase **client SDK** is used only for authentication (sign up, sign in, password reset, obtaining an ID token). All data reads/writes go through the existing Route Handlers using the Admin SDK — the browser never talks to Firestore directly. Firestore security rules are therefore deny-all (`allow read, write: if false`); the only trusted caller is the server, which performs its own auth/role checks in code.

## 3. Data Model (Firestore)

| Collection | Doc ID | Fields |
|---|---|---|
| `activities` | activity slug (e.g. `"zumba"`) | same shape as the current `Activity` type: `name, category, description, icon, location, day, timeWindow, quota, quotaTaken, tags` |
| `event` | `"info"` (single doc) | same shape as the current `EventInfo` type: `day1 { title, description, date, time }`, `day2 { title, description, date, agenda: [{ id, title, timeStart, timeEnd, status, description }] }` |
| `users` | Firebase Auth UID | `name, email, avatarInitial, role: "employee" \| "admin", createdAt` |
| `selectionState` | Firebase Auth UID | `activityId: string \| null, status, selectedAt, openMarks: string[]` |

**Correctness fix required by this migration**: the current `adjustQuotaTaken` increment/decrement isn't atomic — harmless for an in-memory single-process mock, but a real race-condition risk once multiple concurrent Vercel invocations write to Firestore. Select/switch/cancel operations must be wrapped in a **Firestore transaction** so two employees can't both claim the last open slot.

## 4. Auth

**Employee signup/login** (existing `/login` page, extended):
- Sign up: name + email + password -> Firebase Auth `createUserWithEmailAndPassword`, then create a `users/{uid}` doc with `role: "employee"`.
- Log in: Firebase Auth `signInWithEmailAndPassword`.
- No email domain restriction, no email verification required (internal, low-stakes event tool).
- Forgot password: Firebase's built-in `sendPasswordResetEmail`.
- `AuthContext` changes from a fake localStorage-backed object to wrapping Firebase's `onAuthStateChanged`, exposing the current user and a fresh ID token for API calls.

**Security fix this forces**: today, `employeeId` is a client-supplied parameter on every selection API call — trivially spoofable (any caller could pass another employee's email/id and cancel or change their selection). After this migration, every protected route derives the caller's identity from the **verified Firebase ID token** server-side; client-supplied `employeeId` fields are removed from those endpoints.

**Admin accounts**: same Firebase Auth users, distinguished only by `users/{uid}.role === "admin"`. Since employees self-register, there is no self-serve path to become admin — the first admin(s) are bootstrapped by manually setting `role` to `"admin"` on that user's Firestore doc (via the Firebase console) after they sign up once through the normal flow. No separate admin signup flow.

**Login routing**: one shared `/login` page for both employees and admins. After authentication, the app reads `role` from the user's Firestore doc and routes admins to `/admin`, employees to `/home`.

## 5. API Routes

- All `/api/*` routes require a valid Firebase ID token in the request (except the Firebase-handled signup/login itself, which doesn't go through our API).
- **Employee-scoped routes** (`/api/selection*`): derive `employeeId` from the verified token instead of a client-supplied parameter.
- **Admin-only mutations**: new `/api/admin/*` namespace. Each route verifies the token AND checks `role === "admin"` on the corresponding `users/{uid}` doc before proceeding:
  - `POST /api/admin/activities`, `PATCH /api/admin/activities/[id]`, `DELETE /api/admin/activities/[id]` — create/edit/delete activities
  - `GET /api/admin/employees` — list all users with their current selection + open marks
  - `POST /api/admin/employees/[uid]/reset-selection` — cancels that employee's selection (reuses existing `cancelSelection` logic)
  - `PATCH /api/admin/event` — edit Day 1 info and Day 2 agenda blocks
- Existing public-facing `GET /api/activities` and `GET /api/event` stay as read-only endpoints, still behind normal employee-token auth.

## 6. Admin Dashboard UI

New route group `src/app/(admin)/admin/*` with its own layout (no bottom nav; a simple sidebar or top-tab nav instead), guarded by a server-side admin-role check that redirects non-admins to `/home`.

- `/admin` -> redirects to `/admin/activities`
- `/admin/activities` — table of activities with quota bars; "+ Tambah Activity" opens a create form; each row has Edit/Delete actions
- `/admin/employees` — table of all employees with their selected activity and open-activity marks, client-side search by name/email; "Reset Pilihan" action per row behind a confirm dialog (destructive to that employee's state)
- `/admin/schedule` — form to edit Day 1 info and each Day 2 agenda block (title, time, status, description)

New shadcn primitives needed that the employee-facing app hasn't required yet: `Table`, `Dialog` (confirm actions), `Form`. Reuse existing design tokens/components (Card, Button, Badge, Input) otherwise.

## 7. Visual Direction

Applies to the whole app theme (both the new pages in this phase and a light retrofit pass on existing pages), building on the existing Phase 2 design system rather than replacing it:

- New pages (login/signup with password field, admin dashboard) use gradient backgrounds and an entrance animation on first load, consistent with the existing design tokens (the current design system already defines "soft sky gradients for hero banners" and Framer Motion-equivalent (`motion`) page transitions — this extends that pattern rather than introducing a second style).
- Existing pages get a lightweight visual-polish pass — broader gradient usage and an entrance animation on first load — reusing/extending current design tokens. This is a polish pass, not a layout or feature redesign.

## 8. Deployment to Vercel & Migration

- **Env vars** (set in Vercel project settings, never committed): `NEXT_PUBLIC_FIREBASE_*` (client config — safe to expose) and `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (Admin SDK service account — server-only secrets).
- **Seed script**: a one-off `scripts/seed-firestore.ts` that writes the current `data.ts` mock activities and event info into Firestore once, so the database starts populated instead of empty.
- **Firestore plan**: free Spark tier is sufficient for this internal event's scale — no billing setup required.
- Since all state now lives in Firestore instead of process memory, the app becomes fully stateless per request, which is what makes it safe to run on Vercel's serverless model (the actual blocker before this phase).

## 9. Explicit Out of Scope (this phase)

- Email verification for signup.
- Firebase custom claims or multi-tier admin roles (a single `role` field is enough for this scale).
- Bulk employee import/CSV upload in the admin dashboard.
- Retroactive redesign beyond the gradient + entrance-animation polish pass — no new features or layout changes to existing employee-facing pages.
- Admin ability to impersonate/log in as an employee.
- Audit log / history of admin actions.
