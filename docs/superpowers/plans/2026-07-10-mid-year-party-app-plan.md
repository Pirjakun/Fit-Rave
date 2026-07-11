# Mid Year Party App — Implementation Plan

Based on: `docs/superpowers/specs/2026-07-10-mid-year-party-app-design.md` (approved)

Each phase below is self-contained and can be executed in a fresh session — it restates its own doc references and verification steps.

## Phase 0 — Documentation Discovery (Allowed APIs)

Researched against official docs on 2026-07-10. Current stable Next.js: **16.2.10**.

1. **Scaffold**: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` — TypeScript/Tailwind/App Router are already the tool's defaults; flags make it explicit. (nextjs.org/docs/app/api-reference/cli/create-next-app)
2. **Tailwind v4 is the default**: no `tailwind.config.js` generated. Theme customization lives in `app/globals.css` via `@import "tailwindcss"` + `@theme { ... }`. Content scanning is automatic. (same source; cross-checked tailwindlabs discussion #17168)
3. **shadcn/ui**: package is `shadcn` (NOT the deprecated `shadcn-ui`).
   ```
   npx shadcn@latest init
   npx shadcn@latest add button card badge dialog skeleton toast avatar tabs
   ```
   v4-aware: generates OKLCH color tokens under `@theme inline`, uses `data-slot` attributes. `toast` primitive is deprecated in favor of `sonner` — use `npx shadcn@latest add sonner` instead of `toast`. (ui.shadcn.com/docs/cli, ui.shadcn.com/docs/tailwind-v4)
4. **Animation**: Framer Motion was renamed **Motion**. Install `motion` (NOT `framer-motion`, which is legacy/unmaintained).
   ```
   npm install motion
   ```
   ```tsx
   import { motion } from "motion/react"
   ```
   (motion.dev/docs/react-quick-start)
5. **Icons**: `npm install lucide-react`, `import { IconName } from "lucide-react"`. Package name unchanged. (lucide.dev/guide/react/getting-started)
6. **Route Handlers** (mock API layer): `app/api/<name>/route.ts`, exporting `GET`/`POST`/`PUT`/etc. as named async functions. Read JSON body with `await request.json()`. Current docs favor plain `Response.json(data)` over importing `NextResponse` for simple cases; both work. GET is uncached by default. Cannot coexist with a `page.tsx` in the same route segment. (nextjs.org/docs/app/getting-started/route-handlers)

**Anti-pattern guards for this whole plan:**
- Never `npm install framer-motion` — use `motion`.
- Never hand-write `tailwind.config.js` unless a real need for JS-level config emerges — Tailwind v4 default is CSS-first (`@theme` in `globals.css`).
- Never install the deprecated `shadcn-ui` package.
- Don't invent `create-next-app` flags beyond the list in item 1.

## Phase 1 — Project Scaffold + Mock Data/API Layer

**What to implement**
- Run the Phase 0 scaffold command in the (currently empty) project root.
- Install `motion` and `lucide-react`; run `shadcn@latest init`.
- Create feature-based structure:
  ```
  src/
    features/
      activities/   (types, mock data, React Query hooks)
      selection/    (types, mock data, React Query hooks)
      auth/         (types, mock session handling)
    app/
      api/
        activities/route.ts       (GET list)
        activities/[id]/route.ts  (GET one)
        selection/route.ts        (GET current, PUT to select/switch, DELETE to cancel)
        auth/route.ts             (POST login — name + employee id/email, no password)
      (page routes added in Phase 3)
  ```
- Mock data module seeds: activities per spec Section 4 entity model (segmented: Running, Fitness, Aqua Yoga, Zumba with sample quotas; open: Swimming, Badminton, Volleyball), `EventInfo` for Day 1 (ruwatan info) and Day 2 (wellbeing window), and a single configurable deadline constant (H-3 before Day 2, per spec's placeholder assumption).
- Route handlers implement the business rules from spec Section 4 rules 1–5 (one active selection, atomic switch, deadline lock, real-time quota-full check) server-side (i.e., inside the route handler, not duplicated in client code).
- Set up React Query provider at the app root for client-side fetch/cache.

**Documentation references**: Phase 0 items 1, 3 (partial — init only), 6.

**Verification checklist**
- `npm run dev` starts without errors.
- `GET /api/activities` returns seeded JSON with both categories present.
- `PUT /api/selection` enforces one-active-selection and atomic switch (manually test: select A, then select B, confirm A's `quotaTaken` decrements and B's increments).
- `PUT /api/selection` rejects when target quota is full or deadline has passed, with a clear error payload the frontend can render.
- `tsc --noEmit` passes.

**Anti-pattern guards**: business rules must live in the route handler, not be re-implemented in a page component (this is the whole point of the mock-API-as-future-backend-contract approach from the spec).

## Phase 2 — Design System (via `/ui-ux-pro-max`)

**What to implement**
- Invoke the `ui-ux-pro-max` skill to produce the concrete design system from the spec's Section 6 direction: exact color tokens (Ocean Blue/Turquoise primary, White Sand base, Coral/Sunset Orange accent, Soft Yellow highlight) expressed as Tailwind v4 `@theme` tokens in `app/globals.css`, typography scale/font pairing, spacing/radius scale, shadow tokens, and shadcn component theming (buttons, cards, badges, skeletons, toasts/sonner).
- Apply tokens by re-running/adjusting `shadcn@latest init` output and editing `@theme` block — do not hardcode hex values inside individual components.
- Produce a small living style reference (e.g. a `/dev/style-guide` route or Storybook-less static page) showing buttons, cards, badges, and state components (loading/empty/error/success) so later page work can copy-paste verified patterns instead of re-deriving styles per page.

**Documentation references**: Phase 0 items 2, 3.

**Verification checklist**
- All colors resolve through `@theme` tokens (grep for raw hex codes outside `globals.css` — should be none in component files).
- Style reference page renders all four global states (loading/empty/error/success) from spec Section 5 using the same primitives pages will reuse.
- WCAG AA contrast check on primary text/background and CTA button combinations.

**Anti-pattern guards**: don't scatter ad hoc Tailwind color utilities (`bg-[#1e88e5]`) across page components; everything routes through theme tokens so a later palette tweak is a one-file change.

## Phase 3 — Page-by-Page Implementation (via `/ponytail`)

Build in this order (matches the IA drill-down and feature-priority list in the spec):

1. Splash Screen
2. Login
3. Home Dashboard
4. Explore Activities
5. Activity Detail
6. Choose Activity
7. Confirmation
8. My Activities
9. Event Schedule
10. Profile
11. FAQ

**What to implement (per page)**
- Wire to the Phase 1 mock API via React Query hooks from `features/*`.
- Use only primitives/tokens from the Phase 2 style reference — no new one-off styling.
- Implement the exact flows from spec Section 5 for the pages they touch: select, switch, cancel, quota-full error, deadline-passed error, open-activity toggle, and all four global states.
- Use the `ponytail` skill while writing each page's code to keep it minimal — no abstractions beyond what the page actually needs, no speculative props/config.

**Documentation references**: spec Sections 3 (IA/navigation), 4 (business rules), 5 (flows/states); Phase 1 API contracts; Phase 2 style reference.

**Verification checklist (per page, and again at the end for the whole set)**
- Manual click-through (via the `run` skill or a headless browser check) of: happy path, quota-full path, deadline-passed path, switch-selection path, cancel-selection path, empty state (before any selection), and a simulated fetch error.
- `tsc --noEmit` and `next build` succeed after each page is added.

**Anti-pattern guards**: don't duplicate quota/deadline logic in the UI layer beyond reading the API's response — the server response is the source of truth; the UI only reflects it.

## Final Phase — Verification

1. Full click-through of every flow in spec Section 5 across the finished app.
2. `next build` succeeds; `tsc --noEmit` clean.
3. `grep -r "framer-motion"` across the repo returns nothing (only `motion` should be used).
4. Confirm folder structure matches the feature-based layout from Phase 1 (no stray type-based catch-all folders).
5. Re-read spec Section 8 ("Explicit Out of Scope") and confirm none of those items were accidentally built.
