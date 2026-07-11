# Schedule Dresscode — Implementation Plan

Spec: `docs/superpowers/specs/2026-07-11-schedule-dresscode-design.md`

## Phase 0 — Documentation Discovery (Allowed APIs)

**shadcn/ui**: `components.json` confirms style `base-nova`, targets `@base-ui/react`. No `Textarea` exists in `src/components/ui/` (only `Input`, confirmed by directory listing). Add it with the same pinned-CLI command already used for `table`/`form` in the Phase 5 plan: `npx shadcn add textarea`. Do not hand-roll a styled `<textarea>`.

**Existing admin form pattern to copy** (`src/app/(admin)/admin/activities/activity-form-dialog.tsx:36-104`): plain `useState` holding string-typed form fields (not react-hook-form/zod, despite the original Phase 5 plan mentioning it — the actual shipped code is simpler). `useEffect` on `[open, activity]` resets form state from the entity being edited. `handleSubmit` builds a payload object, trims strings, and calls a mutation hook with `onSuccess`/`onError` toasts. New dresscode fields on the schedule page follow this exact shape, just with a split/join transform instead of a plain string passthrough.

**Existing schedule pages to extend, not replace**:
- Admin: `src/app/(admin)/admin/schedule/page.tsx:1-227` — one `<Card>` per Day 1 and per Day 2 agenda item, each field a controlled `Input` bound to nested `form` state, submitted as one `PATCH` via `useUpdateEventInfo()` mutate.
- Employee: `src/app/(app)/schedule/page.tsx:1-108` — read-only `Card`s rendering `event.day1` and `event.day2.agenda` from `useEventInfo()`.

**Data/seed files to update**: `src/features/event/types.ts:1-23` (add `Dresscode` interface + field on `day1` and `EventAgendaItem`), `scripts/seed-firestore.ts:104-145` (`eventInfo` object — add real dresscode content per spec Section 3).

**Anti-pattern guards**: don't add Firestore schema validation/zod to `PATCH /api/admin/event` — the existing route (`src/app/api/admin/event/route.ts`) has none today and this feature doesn't change that contract, only the shape of the object flowing through it. Don't make `dresscode` optional/`undefined` in the type — spec requires it always present as `{ male: [], female: [] }` at minimum, so no optional-chaining is needed in the UI.

## Phase 1 — Data Model & Seed Data

**What to implement**
1. In `src/features/event/types.ts`, add:
   ```ts
   export interface Dresscode {
     male: string[];
     female: string[];
   }
   ```
   Add `dresscode: Dresscode` to `EventAgendaItem` and to `EventInfo["day1"]`.
2. In `scripts/seed-firestore.ts`, add to the `eventInfo` object (line ~104-145):
   - `day1.dresscode`: `{ male: ["Atasan Putih", "Bawahan Kain", "Ikat Kepala"], female: ["Atasan Putih", "Bawahan Kain", "Diusahakan Rambut di Ikat ala Jawa"] }`
   - Fit Rave agenda item `dresscode`: `{ male: ["Beachwear Outfit"], female: ["Beachwear Outfit"] }`
   - Training and Dinner Outside agenda items `dresscode`: `{ male: [], female: [] }`

**Documentation references**: spec Section 2 (Data Model) and Section 3 (Seed Data) for the exact literal content.

**Verification checklist**
- `npx tsc --noEmit` passes (will surface any other code constructing an `EventInfo`/`EventAgendaItem` object that now needs the new field — check `src/features/event/data.ts` isn't affected since it only reads/passes through Firestore docs, not construct literals).
- Run `npm run seed`; confirm via Firebase console (or a quick read script) that `event/info` now has `day1.dresscode` and each agenda item has a `dresscode` field with the expected content.

**Anti-pattern guards**: don't leave `dresscode` optional (`dresscode?:`) — every construction site (only the seed script) must supply it, and the type should force that at compile time.

## Phase 2 — Admin UI

**What to implement**
1. Run `npx shadcn add textarea` to add `src/components/ui/textarea.tsx`.
2. In `src/app/(admin)/admin/schedule/page.tsx`, add two helper functions near the top of the component (or as module-level pure functions): `toTextareaValue(items: string[]): string` (→ `items.join("\n")`) and `fromTextareaValue(value: string): string[]` (→ `value.split("\n").map(s => s.trim()).filter(Boolean)`).
3. Under the Day 1 card's existing "Deskripsi" field (after line 75, before the Tanggal/Waktu grid — or after it, matching visual flow), add two `Textarea` fields: "Dresscode Laki-Laki" (`id="day1-dresscode-male"`) and "Dresscode Perempuan" (`id="day1-dresscode-female"`), bound to `form.day1.dresscode.male`/`.female` via the helpers, following the same `onChange` → `setForm({ ...form, day1: { ...form.day1, dresscode: { ...form.day1.dresscode, male: fromTextareaValue(e.target.value) } } })` pattern already used for other Day 1 fields.
4. In the `form.day2.agenda.map(...)` block (line 142-220), add the same two `Textarea` fields per agenda item (after the existing "Deskripsi" field, line 206-217), updating `agenda[index].dresscode.male`/`.female` the same way the existing per-item fields update `agenda[index]`.
5. No changes needed to `handleSubmit` (line 26-33) — it already submits the whole `form` object via `updateEventInfo.mutate(form, ...)`, so the new nested `dresscode` fields ride along automatically.

**Documentation references**: Phase 0 admin form pattern; `src/app/(admin)/admin/schedule/page.tsx` existing per-field `onChange` style (lines 58-61, 68-73 for the nested-update pattern to copy for `dresscode.male`/`.female`).

**Verification checklist**
- `npx tsc --noEmit` and `npm run build` succeed.
- Manual click-through (headless browser, matching the project's established QA pattern in `.scratchpad/`): as an admin, load `/admin/schedule`, confirm the Day 1 and Fit Rave dresscode textareas are pre-filled with the seeded content (one line per bullet), edit one, save, reload, and confirm the edit persisted.

**Anti-pattern guards**: don't introduce react-hook-form/zod for this page — it doesn't use that pattern today (only the activity form does, and even that turned out to use plain `useState` in the actual shipped code per Phase 0). Don't trim/filter on every keystroke in `onChange` (that would prevent typing a trailing newline to start a new bullet) — only trim/filter at submit time via `fromTextareaValue`, called from `handleSubmit`, not from `onChange`. Correction: since `onChange` needs to store *something* to display in the controlled textarea, store the raw split-by-`\n` array without trimming per-keystroke by keeping the textarea's own string state separate from the trim step — simplest fix: keep `form.day1.dresscode.male` etc. as the already-split array only computed at submit time by instead storing raw textarea strings in local component state (not nested in `form`) for these four/N fields, and building the final `dresscode` object only inside `handleSubmit`. Use local `useState<string>` per textarea (e.g. `day1MaleText`, `day1FemaleText`, and a map keyed by agenda id for agenda items), initialized from `toTextareaValue(...)` in the same `useEffect` that seeds `form`, and converted via `fromTextareaValue` only when building the `handleSubmit` payload.

## Phase 3 — Employee UI

**What to implement**
1. In `src/app/(app)/schedule/page.tsx`, add a small local helper component or inline block `DresscodeSection({ dresscode }: { dresscode: Dresscode })` that returns `null` if both `dresscode.male.length === 0 && dresscode.female.length === 0`, otherwise renders a "Dresscode" label followed by up to two labeled bullet lists ("Laki-Laki", "Perempuan"), each only rendered if its array is non-empty.
2. Render `<DresscodeSection dresscode={event.day1.dresscode} />` inside the Day 1 `CardContent` (after line 71-72's description paragraph).
3. Render `<DresscodeSection dresscode={item.dresscode} />` inside each agenda item's `CardContent` (after line 96-98's description paragraph).

**Documentation references**: Phase 0 employee schedule page; spec Section 5 for the exact hide/show rules.

**Verification checklist**
- Manual click-through as an employee: `/schedule` shows a "Dresscode" section with Laki-Laki/Perempuan bullets under Ruwatan (Day 1) and under Fit Rave, and shows no Dresscode section at all under Training or Dinner Outside.
- `npx tsc --noEmit` and `npm run build` succeed.

**Anti-pattern guards**: don't render an empty "Dresscode" heading with no bullets underneath when both arrays are empty — the whole block must be omitted, not just the lists.

## Final Phase — Verification

1. `npx tsc --noEmit` and `npm run build` succeed with no errors.
2. Full manual click-through (headless browser): employee `/schedule` view before any admin edits (seeded content correct), admin `/admin/schedule` edit of Fit Rave's Perempuan dresscode to a new value, save, then re-check employee `/schedule` reflects the change immediately.
3. Confirm Training/Dinner Outside show no Dresscode block on the employee page both before and after the above edit (they were never touched).
4. Re-run `npm run seed` at the end to restore the canonical seeded dresscode content if any test edits were left in place.
