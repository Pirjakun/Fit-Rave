# Firebase Backend & Admin Dashboard — Implementation Plan

Spec: `docs/superpowers/specs/2026-07-11-firebase-backend-admin-dashboard-design.md`

## Phase 0 — Documentation Discovery (Allowed APIs)

**Next.js (this repo's modified Next 16.2.10 — see `node_modules/next/dist/docs/`)**
- Route Handlers (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`): `export async function GET(request: Request)` / `POST` / `PATCH` / `DELETE`, native `Request`/`Response.json()`. Dynamic params come via `ctx.params` as a `Promise` (`const { id } = await ctx.params`). This matches the existing routes in `src/app/api/*` — no structural changes needed, only new auth logic inside handlers.
- Authentication guide (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`): confirms Route Handlers should do their own auth check by reading the request and returning `401`/`403` `Response` objects directly — this repo will use Firebase ID token verification instead of the doc's cookie/JWT example, but the shape (check header -> 401 if missing/invalid -> continue) is the same pattern.
- **Anti-pattern**: this Next version renames `middleware.ts` to `proxy.ts` (`export default async function proxy(req)`) — not used in this plan, since the existing app already guards routes client-side in `(app)/layout.tsx` and that pattern is kept for `/admin` too. Do not create a `middleware.ts` file; it will not run.

**Firebase — client SDK (`firebase` package, not yet installed)**
```ts
// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
```
Auth methods, all from `firebase/auth`: `createUserWithEmailAndPassword(auth, email, password)`, `signInWithEmailAndPassword(auth, email, password)`, `sendPasswordResetEmail(auth, email)`, `signOut(auth)`, `onAuthStateChanged(auth, (user) => {...})`. Get a fresh token with `user.getIdToken(forceRefresh?)` — auto-refreshes when not near expiry; pass `forceRefresh: true` right after a role change.

**Firebase — Admin SDK (`firebase-admin` package, not yet installed, server-only)**
```ts
// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
```
- **Verify a token**: `import { getAuth } from "firebase-admin/auth"; const decoded = await getAuth().verifyIdToken(idToken); const uid = decoded.uid;` — token read from `request.headers.get("authorization")?.split("Bearer ")[1]`.
- **Firestore CRUD** (`firebase-admin/firestore`, chained instance API — different shape than the client SDK's modular functions): `getFirestore().collection("activities").doc(id).set(...) / .get() / .update(...) / .delete()`.
- **Transactions** (required for atomic quota changes):
  ```ts
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const { quotaTaken, quota } = snap.data()!;
    if (quotaTaken >= quota) throw new Error("Quota full");
    tx.update(ref, { quotaTaken: quotaTaken + 1 });
  });
  ```
  All reads inside a transaction must happen before any writes.
- **Anti-patterns to avoid**: don't use the legacy `admin.initializeApp()` namespace style — use the modular `firebase-admin/app|auth|firestore` subpath imports shown above. Don't import `firebase-admin` in any route that sets `export const runtime = "edge"` (it's Node-only; this repo's routes default to the Node runtime already, just don't add an edge override). The `FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")` unescape is required — Vercel env vars can't hold literal newlines, and skipping this is the most common Admin-SDK-on-Vercel failure.

**shadcn/ui component additions**
- `components.json`: style `base-nova`, targets `@base-ui/react` (not Radix) — confirmed by reading the existing `src/components/ui/dialog.tsx` and `button.tsx`, which import from `@base-ui/react/*`.
- Existing components: `avatar, badge, button, card, dialog, input, label, separator, skeleton, sonner, tabs`. **Dialog already exists** — reuse it for confirm/create/edit modals. **Table and Form are missing.**
- Exact command (use the pinned local CLI, not `@latest`, to keep the `base-nova` style consistent): `npx shadcn add table form`
- Adding Form pulls in **new dependencies**: `react-hook-form` and `zod` (plus likely `@hookform/resolvers`). This is expected and required for the admin activity/schedule forms.

## Phase 1 — Firebase Project Setup & Dependencies

**What to implement**
1. **Manual step (user action — cannot be automated)**: create a Firebase project at the Firebase console, enable the **Email/Password** sign-in provider under Authentication, create a **Firestore database** (production mode, deny-all rules per the spec), and generate a service account key (Project Settings -> Service Accounts -> Generate new private key).
2. Install dependencies: `npm install firebase firebase-admin`.
3. Create `.env.local` (gitignored) with `NEXT_PUBLIC_FIREBASE_*` (from the web app config in the Firebase console) and `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (from the downloaded service account JSON).
4. Add a `.env.example` listing the same keys with placeholder values (committed, no real secrets) so the env contract is documented.
5. Create `src/lib/firebase-client.ts` and `src/lib/firebase-admin.ts` exactly per the Phase 0 snippets.
6. Set Firestore security rules to deny-all (`allow read, write: if false;`) since all access goes through the Admin SDK server-side.

**Documentation references**: Phase 0 Firebase snippets above.

**Verification checklist**
- `npm run build` still succeeds with the new dependencies installed (no code uses them yet).
- Confirm `.env.local` is covered by `.gitignore` (check the existing `.gitignore`; add an entry if missing).
- Firebase console shows Email/Password provider enabled and a Firestore database created.

**Anti-pattern guards**: do not commit `.env.local` or any service account JSON file. Do not hardcode Firebase config values in source — always read from `process.env`.

## Phase 2 — Data Layer Migration (Firestore)

**What to implement**
1. Write `scripts/seed-firestore.ts`: a one-off Node script (run with `npx tsx scripts/seed-firestore.ts`) that uses `src/lib/firebase-admin.ts` to write the current hardcoded arrays from `src/features/activities/data.ts` into the `activities` collection (doc ID = activity slug) and `EVENT_INFO` from `src/features/event/data.ts` into `event/info`.
2. Rewrite `src/features/activities/data.ts`: replace the in-memory array and `listActivities`/`findActivity` with Firestore reads (`db.collection("activities").get()` / `.doc(id).get()`). Remove `adjustQuotaTaken` from this file — quota mutation moves into the transaction in `selection/store.ts` (Phase 2, item 4) since it must be atomic with the selection write, not a separate step.
3. Rewrite `src/features/event/data.ts`: replace `EVENT_INFO` export with a Firestore read of `event/info`. Keep `REGISTRATION_DEADLINE` as a code constant (unchanged) — it's not part of the admin-editable schedule scope (spec Section 6 only covers Day 1/Day 2 agenda content, not the deadline).
4. Rewrite `src/features/selection/store.ts`: replace the `Map`-based `selections`/`openMarks` with a Firestore `selectionState` collection (doc ID = uid). `selectActivity` becomes a `runTransaction` that reads the target activity's `quotaTaken`/`quota`, checks the deadline and quota-full conditions (same `SelectionError` codes as today), and atomically updates both the activity doc's `quotaTaken` and the user's `selectionState` doc (decrementing the old activity if switching). `cancelSelection` and `setOpenMark` follow the same read-in-transaction pattern for the quota decrement case.
5. Update `src/features/auth/types.ts`: add `role: "employee" | "admin"` to a new `UserProfile` type representing the `users/{uid}` Firestore doc (distinct from the Firebase Auth `User` object).

**Documentation references**: Phase 0 Firestore CRUD + transaction snippets; existing `src/features/selection/store.ts` and `src/features/activities/data.ts` for the business-rule logic to preserve (quota-full / deadline-passed error codes and messages must stay identical — only the storage layer changes).

**Verification checklist**
- Run the seed script against the real Firestore database; confirm via the Firebase console that `activities` (7 docs) and `event/info` exist with correct data.
- Write a small throwaway script or use the Firebase console to manually create two `selectionState` docs and confirm a simulated race (two transactions targeting the same near-full activity) can't both succeed — or reason through the transaction logic carefully since Firestore transactions are inherently serializable per-document.
- `tsc --noEmit` passes (route handlers will fail to compile until Phase 4 updates them to match new function signatures — acceptable at this checkpoint if isolated to route files, otherwise adjust call sites in the same phase).

**Anti-pattern guards**: don't perform the quota check-then-update as two separate Firestore calls outside a transaction — that reintroduces the exact race condition this migration is meant to fix. Don't leave any `Map`/array mock data behind as dead code.

## Phase 3 — Employee Auth Migration

**What to implement**
1. Rewrite `src/features/auth/context.tsx`: replace the localStorage-backed state with Firebase's `onAuthStateChanged` listener. Expose `{ user: FirebaseUser | null, profile: UserProfile | null, isLoading, getToken: () => Promise<string> }`. On auth state change, fetch the corresponding `users/{uid}` doc (via a small `/api/me` route or a direct authenticated fetch) to get `role`.
2. Rewrite `/login` (`src/app/login/page.tsx`): add a password field and a sign-up/sign-in mode toggle. Sign-up calls `createUserWithEmailAndPassword` then creates the `users/{uid}` doc with `role: "employee"` (via a new `POST /api/auth/register` route, since writing to Firestore happens through the Admin SDK, not the client). Sign-in calls `signInWithEmailAndPassword`. Add a "Lupa password?" link that calls `sendPasswordResetEmail`. After successful auth, read `role` and route to `/admin` or `/home` accordingly (per spec Section 4). Apply a gradient background + an entrance animation (`motion`) on first load, extending the existing `bg-linear-to-b from-primary/15 via-background to-background` treatment already on this page rather than introducing a new style.
3. Delete `src/features/auth/store.ts` (the old fake `login()` mock) and `src/app/api/auth/route.ts` (the old mock login endpoint) — replaced by Firebase Auth directly on the client plus the new `/api/auth/register` route for profile-doc creation.
4. Update `src/app/(app)/layout.tsx`: swap the `employee` check for the new auth context shape; redirect unauthenticated users to `/login`, and redirect authenticated **admin**-role users to `/admin` (mirroring the login-routing rule) instead of showing the employee shell.

**Documentation references**: Phase 0 Firebase Auth snippets; existing `src/app/login/page.tsx` and `src/app/(app)/layout.tsx` for the UI/guard patterns to extend, not replace wholesale.

**Verification checklist**
- Manual click-through (via a headless browser, matching the project's existing QA-script pattern in `.scratchpad/`): sign up a new employee, confirm redirect to `/home`; sign out; sign back in with the same credentials; trigger "Lupa password?" and confirm Firebase sends a reset email (check via Firebase console Auth logs, since no real inbox is available in dev).
- Confirm a manually role-flipped (`role: "admin"`) account is redirected to `/admin` on login instead of `/home`.
- `tsc --noEmit` and `next build` succeed.

**Anti-pattern guards**: don't store the Firebase ID token in `localStorage` (it's short-lived and Firebase's client SDK already manages persistence/refresh internally — just call `getIdToken()` fresh before each API call). Don't skip the `users/{uid}` profile doc creation on sign-up — without it, the role check in Phase 4/5 has nothing to read.

## Phase 4 — API Route Hardening

**What to implement**
1. Create `src/lib/api-auth.ts` with two helpers: `requireUser(request: Request): Promise<string>` (verifies the bearer token via `firebase-admin/auth`, returns `uid`, throws a typed error the caller turns into a `401` `Response` on failure) and `requireAdmin(uid: string): Promise<void>` (reads `users/{uid}.role` via the Admin SDK, throws a typed error turned into `403` on failure).
2. Update `src/app/api/selection/route.ts` and `src/app/api/selection/open/route.ts`: replace client-supplied `employeeId` with `const uid = await requireUser(request)`.
3. Update `src/app/api/activities/route.ts`, `src/app/api/activities/[id]/route.ts`, `src/app/api/event/route.ts`: add `requireUser` (any authenticated employee or admin can read).
4. Add `POST /api/auth/register` (creates the `users/{uid}` doc after client-side Firebase sign-up — takes `{ name }` in the body plus the bearer token, derives `uid`/`email` from the verified token itself rather than trusting client-supplied values).
5. Add the new `/api/admin/*` namespace per the spec (Section 5): `POST/PATCH/DELETE /api/admin/activities[/[id]]`, `GET /api/admin/employees`, `POST /api/admin/employees/[uid]/reset-selection`, `PATCH /api/admin/event`. Every handler calls `requireUser` then `requireAdmin`.

**Documentation references**: Phase 0 token-verification snippet; existing route files for the `Response.json`/error-shape conventions (`{ error: message, code }`) to keep consistent.

**Verification checklist**
- Attempt each protected route with no token (`401`), a token belonging to a non-admin user hitting `/api/admin/*` (`403`), and a valid admin token (`200`).
- Confirm the old client-supplied-`employeeId` spoofing path no longer works: calling `/api/selection` with a body/query `employeeId` for a different user has no effect — the server only trusts the token's `uid`.
- `tsc --noEmit` and `next build` succeed.

**Anti-pattern guards**: never trust an `employeeId`/`uid` value from the request body or query string for identity — only from the verified token. Don't duplicate the `requireUser`/`requireAdmin` logic inline in each route; use the shared helper.

## Phase 5 — Admin Dashboard UI

**What to implement**
1. `npx shadcn add table form` (Dialog already exists; do not re-add it).
2. `src/app/(admin)/admin/layout.tsx`: client-side guard reading the auth context — redirect non-admins to `/home`, unauthenticated users to `/login`. Simple top-tab or sidebar nav (Activities / Employees / Schedule), no bottom nav. Apply a gradient background + entrance animation consistent with the login page's new treatment (spec Section 7).
3. `/admin` -> redirect to `/admin/activities`.
4. `/admin/activities`: `Table` listing all activities with a quota progress indicator (reuse the existing `Badge` variants from the employee-facing app for consistency); "+ Tambah Activity" opens a `Dialog` with a `react-hook-form` + `zod`-validated form (name, category, description, icon, location, day, timeWindow, quota, tags) calling `POST /api/admin/activities`; each row has Edit (same form, pre-filled, `PATCH`) and Delete (confirm `Dialog`, `DELETE`).
5. `/admin/employees`: `Table` of all users (from `GET /api/admin/employees`) with name, email, selected activity, open marks; a client-side search input filtering by name/email; "Reset Pilihan" button per row behind a confirm `Dialog`, calling `POST /api/admin/employees/[uid]/reset-selection`.
6. `/admin/schedule`: a form (react-hook-form) pre-filled from `GET /api/event`, editing Day 1 info and each Day 2 agenda block (title, time start/end, status, description), submitting via `PATCH /api/admin/event`.

**Documentation references**: Phase 0 shadcn findings; spec Sections 5–7; existing employee-facing pages (`src/app/(app)/explore/page.tsx` etc.) for the Card/Badge/Button visual conventions to reuse rather than reinvent.

**Verification checklist**
- Manual click-through as an admin: create an activity, edit it, delete it; view the employees table and reset one employee's selection, confirming it reflects immediately in that employee's `/my-activities` page; edit the schedule and confirm the change shows on the employee-facing `/schedule` page.
- Manual click-through as a non-admin: confirm `/admin/*` redirects to `/home`.
- `tsc --noEmit` and `next build` succeed.

**Anti-pattern guards**: don't duplicate activity/quota business rules in the admin UI — creation/edit forms submit to the same validated API routes, not direct Firestore writes from the client. Don't add features beyond what's in the spec (no CSV import, no audit log — explicitly out of scope).

## Phase 6 — Visual Polish Pass (Existing Pages)

**What to implement**
- Extend the Phase 2 design system's existing gradient/motion tokens (already used on the login page and presumably the splash screen) with slightly broader gradient usage and a first-load entrance animation, applied lightly across the existing 11 employee-facing pages.
- This is a polish pass only: reuse existing design tokens, no new layout/features, no new components beyond what Phase 5 already added.

**Documentation references**: spec Section 7; the existing design system reference at `/dev/style-guide`.

**Verification checklist**
- Visual check (headless browser screenshots) of a few representative pages (login, home, admin dashboard) before/after, confirming the gradient/animation reads as one consistent system, not a mismatched second style.

**Anti-pattern guards**: don't restructure any existing page's layout or component tree — this phase only touches background/motion styling.

## Final Phase — Deployment & Verification

1. Confirm `.env.example` documents every required env var; confirm `.env.local` and any service-account JSON are gitignored.
2. Re-run `scripts/seed-firestore.ts` against production Firestore if not already seeded from Phase 2.
3. Full click-through of every flow across the finished app: employee signup/login/password-reset, select/switch/cancel/quota-full/deadline-passed (still testable per the existing technique of temporarily patching `REGISTRATION_DEADLINE`), admin login, activity CRUD, employee reset, schedule edit.
4. `tsc --noEmit` and `next build` succeed.
5. Set the same env vars in the Vercel project dashboard (client `NEXT_PUBLIC_*` + server `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`), then deploy and smoke-test the production URL (signup, login, one activity selection, one admin action).
6. Re-read spec Section 9 ("Explicit Out of Scope") and confirm none of those items were accidentally built.
