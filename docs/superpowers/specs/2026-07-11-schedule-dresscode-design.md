# Schedule Dresscode — Design Spec

Status: Approved by user (2026-07-11)

## 1. Overview

Admins need to attach dresscode instructions to events on the schedule, viewable by employees on `/schedule` and editable by admins on `/admin/schedule`. Two real examples driving the shape of this feature:

- **Ruwatan (Day 1)**: separate instructions per gender, each a short bullet list (e.g. Laki-Laki: "Atasan Putih", "Bawahan Kain", "Ikat Kepala").
- **Fit Rave (a Day 2 agenda item)**: a single unisex instruction ("Beachwear Outfit") — no real gender split, so the same content is duplicated into both the male and female fields.

This is a data + UI extension of the existing Phase 5 admin dashboard (`docs/superpowers/specs/2026-07-11-firebase-backend-admin-dashboard-design.md`) — no new architecture, auth, or API routes.

## 2. Data Model

Add a `Dresscode` shape, always present (never `undefined`) with empty arrays as the "no dresscode set" state:

```ts
export interface Dresscode {
  male: string[];
  female: string[];
}
```

Attach it to `EventInfo.day1` and to every `EventAgendaItem`:

```ts
export interface EventAgendaItem {
  id: string;
  title: string;
  timeStart: string;
  timeEnd: string;
  status: "confirmed" | "tbu";
  description: string;
  dresscode: Dresscode; // NEW
}

export interface EventInfo {
  day1: {
    title: string;
    description: string;
    date: string;
    time: string;
    dresscode: Dresscode; // NEW
  };
  day2: {
    title: string;
    description: string;
    date: string;
    agenda: EventAgendaItem[];
  };
}
```

`day2` itself (the container) does not get a dresscode — only `day1` and individual agenda items, matching the two real examples (Ruwatan is a Day 1 concept; Fit Rave is an agenda item).

No Firestore schema migration is needed beyond re-running the seed script — `event/info` is a single doc fully overwritten by `scripts/seed-firestore.ts`.

## 3. Seed Data

Update `scripts/seed-firestore.ts` with the real content:

- `day1.dresscode`: male = `["Atasan Putih", "Bawahan Kain", "Ikat Kepala"]`, female = `["Atasan Putih", "Bawahan Kain", "Diusahakan Rambut di Ikat ala Jawa"]`
- Fit Rave agenda item `dresscode`: male = `["Beachwear Outfit"]`, female = `["Beachwear Outfit"]`
- Training, Dinner Outside agenda items `dresscode`: male = `[]`, female = `[]` (admin fills in later if needed)

## 4. Admin UI (`/admin/schedule`)

For the Day 1 card and for each agenda-item card, add two new `Textarea`-style fields directly under the existing "Deskripsi" input:

- **Dresscode Laki-Laki** — one line per bullet item.
- **Dresscode Perempuan** — one line per bullet item.

Conversion rules:
- **Load**: `dresscode.male.join("\n")` / `dresscode.female.join("\n")` populate the textarea.
- **Submit**: split the textarea value on `\n`, trim each line, drop empty lines, producing `string[]`. An all-blank textarea becomes `[]`.

Both fields are optional — leaving them blank is a valid, common state (e.g. Training/Dinner Outside today).

No `Textarea` component exists in `src/components/ui/` yet (only `Input`) — add it via `npx shadcn add textarea` (the pinned local CLI, same as the Phase 5 `table`/`form` additions) rather than hand-rolling a styled `<textarea>`.

## 5. Employee UI (`/schedule`)

Under each card's existing description paragraph (both the Day 1 card and each Day 2 agenda-item card), conditionally render a "Dresscode" block:

- Omit the entire block if both `dresscode.male` and `dresscode.female` are empty (keeps Training/Dinner Outside clean today).
- If present, show up to two labeled bullet lists — "Laki-Laki" and "Perempuan" — each only rendered if its array is non-empty (so a future unisex-only entry doesn't show an empty "Perempuan" heading).

## 6. API / Validation

No route changes. `PATCH /api/admin/event` already accepts and stores the whole `EventInfo` object without runtime schema validation (consistent with the existing pattern in that route) — the new `dresscode` fields flow through unchanged as part of the same object.

## 7. Out of Scope

- Per-employee or per-role dresscode variants beyond male/female.
- Rich text / images in dresscode (plain bullet strings only).
- Any change to the `activities` collection or activity-selection flow — this feature only touches `event/info`.
