# Dresscode Simplify — Design Spec

Status: Approved by user (2026-07-11)

## 1. Overview

Simplifies the dresscode feature shipped earlier today (`docs/superpowers/specs/2026-07-11-schedule-dresscode-design.md`): replaces the two parallel gender-specific lists (Laki-Laki / Perempuan) with a single unified list plus an optional free-text note for exceptions. The user found the two-column form more than they need in practice — most events have one dresscode that applies to everyone, with gender differences (when they exist) being a short exception worth a sentence, not a fully parallel second list.

## 2. Data Model

Replace the `Dresscode` shape:

```ts
// Before
export interface Dresscode {
  male: string[];
  female: string[];
}

// After
export interface Dresscode {
  items: string[];
  note: string;
}
```

Same attachment points as before — `EventInfo.day1.dresscode` and `EventAgendaItem.dresscode` — no change to where dresscode lives in the schema, only its internal shape. `items` is always an array (empty when unset); `note` is always a string (empty when unset).

## 3. Seed Data

Update `scripts/seed-firestore.ts`, converting the existing male/female content into the new shape:

- **Day 1 (Ruwatan)**: `items: ["Atasan Putih", "Bawahan Kain"]` (common to both genders), `note: "Laki-laki: Ikat Kepala. Perempuan: diusahakan rambut diikat ala Jawa."`
- **Fit Rave agenda item**: `items: ["Beachwear Outfit"]`, `note: ""` (unisex, no exception to note)
- **Training, Dinner Outside agenda items**: `items: []`, `note: ""` (unchanged — no dresscode content yet)

After this change ships, re-run the seed script so quotas are zeroed and the new dresscode shape lands together (per the user's separate request to reset all `quotaTaken` to 0).

## 4. Admin UI (`/admin/schedule`)

Per event card (Day 1 and each Day 2 agenda item), replace the two-column "Dresscode Laki-Laki" / "Dresscode Perempuan" `Textarea` pair with:
- One **"Dresscode"** `Textarea` (unchanged convert-on-submit convention: one line per bullet item, blank lines dropped).
- One **"Catatan (opsional)"** single-line `Input` directly beneath it, mapped straight to `dresscode.note` — no line-splitting transform needed since it's a single string, not a list.

Local component state mirrors the existing pattern (`day1Dresscode`/`agendaDresscode` become `{ items: string; note: string }` — `items` still needs the local-string-until-submit treatment the current code already uses for textareas; `note` can bind directly to `form` state as a plain string, same as every other single-line field on this page, since there's no split/trim transform to defer).

## 5. Employee UI (`/schedule`)

`DresscodeSection` renders:
- The bullet list from `items` (unchanged rendering), only if `items.length > 0`.
- If `note` is non-blank, a small muted/italic line below the list (or below the "Dresscode" label if `items` is empty but `note` isn't) showing the note text as-is.
- The whole section is omitted only when **both** `items` is empty and `note` is blank — same hide-if-empty rule as before, just checked against the new shape.

## 6. Out of Scope

- No further gender-specific structuring — a future request for a third dresscode category (e.g. per-day-1-role) is a separate change.
- No change to how dresscode attaches to events (still day1 + agenda items only).
- The user will send the actual event rundown separately; adjusting seed content to match it is a follow-up task, not part of this spec.
