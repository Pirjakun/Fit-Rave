# Dresscode Simplify — Implementation Plan

Spec: `docs/superpowers/specs/2026-07-11-dresscode-simplify-design.md`

## Phase 0 — Documentation Discovery (Allowed APIs)

No new libraries or APIs — this phase only reshapes an existing TypeScript interface and the four files that already consume it, all written earlier today in this same session:

- `src/features/event/types.ts` — current `Dresscode { male: string[]; female: string[] }` (lines ~1-4).
- `scripts/seed-firestore.ts` — `day1.dresscode` (~line 108-115) and the Fit Rave/Training/Dinner agenda items' `dresscode` fields (~line 126-146).
- `src/app/(admin)/admin/schedule/page.tsx` — `toTextareaValue`/`fromTextareaValue` helpers, `DresscodeText` local state type, `day1Dresscode`/`agendaDresscode` state, and the two-column Laki-Laki/Perempuan `Textarea` JSX blocks (Day 1 block + the per-agenda-item block inside `form.day2.agenda.map(...)`).
- `src/app/(app)/schedule/page.tsx` — `DresscodeSection` component and its two call sites.

**Anti-pattern guards**: don't add a database migration step — `event/info` is a single Firestore doc fully overwritten by `scripts/seed-firestore.ts`, so re-running the seed script after the type change is the only "migration" needed (already required anyway per the user's "zero out all quotas" request). Don't leave the old `male`/`female` fields as dead/unused properties — replace them, don't add alongside.

## Phase 1 — Data Model & Seed Data

**What to implement**
1. In `src/features/event/types.ts`, change:
   ```ts
   export interface Dresscode {
     items: string[];
     note: string;
   }
   ```
2. In `scripts/seed-firestore.ts`, replace the `dresscode: { male: [...], female: [...] }` object literals:
   - `day1.dresscode`: `{ items: ["Atasan Putih", "Bawahan Kain"], note: "Laki-laki: Ikat Kepala. Perempuan: diusahakan rambut diikat ala Jawa." }`
   - Fit Rave: `{ items: ["Beachwear Outfit"], note: "" }`
   - Training, Dinner Outside: `{ items: [], note: "" }` (unchanged values, just the new shape)

**Documentation references**: spec Section 2 (Data Model) and Section 3 (Seed Data) for exact literal content.

**Verification checklist**
- `npx tsc --noEmit` will fail until Phases 2-3 update the consuming files — expected at this checkpoint, not a blocker.

## Phase 2 — Admin UI

**What to implement**
1. In `src/app/(admin)/admin/schedule/page.tsx`, change the `DresscodeText` local type to `{ items: string; note: string }` (the `items` field holds the raw textarea string pre-split, same convention `male`/`female` used before).
2. `day1Dresscode`/`setDay1Dresscode` and `agendaDresscode`/`setAgendaDresscode` state shapes follow from the renamed type — update their initializers in the `useEffect` (`toTextareaValue(eventInfo.day1.dresscode.items)` for the textarea string, `eventInfo.day1.dresscode.note` passed straight through for the note).
3. In `handleSubmit`, build `dresscode: { items: fromTextareaValue(day1Dresscode.items), note: day1Dresscode.note }` (and the equivalent per-agenda-item version) instead of the current `{ male: ..., female: ... }` pair.
4. Replace the two-column `grid grid-cols-2` Laki-Laki/Perempuan `Textarea` block (both the Day 1 one and the per-agenda-item one) with: a single full-width "Dresscode" `Textarea` bound to `.items` (same `onChange` pattern as before, just one field instead of two), followed by a single-line "Catatan (opsional)" `Input` bound directly to `.note` (no `toTextareaValue`/`fromTextareaValue` needed for this one — it's a plain string field like every other `Input` on this page, e.g. copy the `day1-description` `Input` pattern at line ~64-75).

**Documentation references**: spec Section 4; the existing `day1-description` `Input` field in the same file for the plain-string-field pattern to copy for `note`.

**Verification checklist**
- `npx tsc --noEmit` passes once Phase 3 also lands (cross-file type dependency).
- Manual click-through: `/admin/schedule` shows one "Dresscode" textarea + one "Catatan" input per card, pre-filled correctly after Phase 1's reseed, editable, and persists on save/reload.

**Anti-pattern guards**: don't apply `fromTextareaValue`'s split/trim/filter logic to the `note` field — it's a single string, not a line-delimited list.

## Phase 3 — Employee UI

**What to implement**
1. In `src/app/(app)/schedule/page.tsx`, update `DresscodeSection`: drop the `male`/`female` two-column grid, render the `items` bullet list (unchanged list-rendering logic, just one list instead of two side by side) followed by the `note` (if non-blank) as a small muted/italic line below the list.
2. Hide-if-empty check becomes `dresscode.items.length === 0 && !dresscode.note` instead of checking both `male`/`female` arrays.
3. Keep the existing `variant="default" | "inverted"` prop and its color-mapping logic as-is — just apply it to the new single list + note line instead of the two lists.

**Documentation references**: spec Section 5.

**Verification checklist**
- `npx tsc --noEmit` and `npm run build` succeed.
- Manual click-through as an employee: `/schedule` shows the combined Ruwatan dresscode list plus the note line underneath; Fit Rave shows its single item with no note line (since Fit Rave's note is empty); Training/Dinner Outside show no Dresscode block at all.

## Final Phase — Verification & Cleanup

1. `npx tsc --noEmit` and `npm run build` succeed with no errors.
2. Re-run `npm run seed` (this both lands the new dresscode content and zeroes all `quotaTaken`, per the user's separate request).
3. Manual click-through: admin edits a note, saves, confirms the employee-facing page reflects it immediately.
4. Clean up any QA test accounts/selections created during verification (matching this session's established `.scratchpad/qa-cleanup-final.ts` + `qa-clear-selectionstate2.ts` pattern) and re-run `npm run seed` one final time so the shipped state is the clean canonical seed data, not test-modified data.
