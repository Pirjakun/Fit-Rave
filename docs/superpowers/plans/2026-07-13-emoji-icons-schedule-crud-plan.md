# Plan: Emoji Activity Icons, Schedule Day CRUD, Employee Activity Sorting

Source spec: `docs/superpowers/specs/2026-07-13-emoji-icons-schedule-crud-design.md`

## Phase 0: Documentation Discovery (consolidated findings)

- **Next.js version:** `16.2.10` (`package.json:24`). The `params`-as-Promise breaking change is in effect — do not destructure `params` synchronously in a page component signature.
- **Dynamic route param pattern to copy verbatim** (proven working in this repo at `src/app/(app)/explore/[id]/page.tsx`):
  ```tsx
  "use client";
  import { useParams } from "next/navigation";
  export default function Page() {
    const { day } = useParams<{ day: string }>();
  }
  ```
  This sidesteps the Promise-params issue entirely — no `use()` import, no `async` page function.
- **`<Link>` pattern in `(admin)` routes** (from `src/app/(admin)/admin/layout.tsx`): `import Link from "next/link"`, then `<Link href="..."><Button>...</Button></Link>`.
- **No `AlertDialog` component exists** in `src/components/ui/` (only plain `Dialog`). Delete confirmation must reuse the `Dialog` pattern already proven in `src/app/(admin)/admin/employees/page.tsx` (state holds the target being deleted; `Dialog open={!!target}`; destructive `Button` in `DialogFooter` triggers the action).
- **Anti-patterns to avoid:** do not add a `params: Promise<...>` prop to any new page; do not invent an `AlertDialog` import; do not add Firestore `.where()` composite queries — this codebase's convention is fetch-all + in-memory join/filter (confirmed in `api/admin/employees/route.ts`, `my-activities/page.tsx`).

---

## Phase 1: Activity icon — Lucide name → emoji

**Files to change:**

1. **Delete** `src/features/activities/icon-map.ts` entirely.

2. **`src/app/(admin)/admin/activities/activity-form-dialog.tsx`**
   - Line 153: change label text from `"Icon (nama Lucide, cth. Dumbbell)"` to `"Icon (emoji)"`.
   - Line 158: change `placeholder="Dumbbell"` to `placeholder="🏃"`.
   - Line 72: change `icon: form.icon.trim() || "Dumbbell",` to `icon: form.icon.trim() || "🏷️",`.

3. **Six render sites** — in each, remove the `import { getActivityIcon } from "@/features/activities/icon-map";` import and the `const Icon = getActivityIcon(activity.icon);` line, then replace the icon wrapper's inner `<Icon className="size-N" />` with the emoji rendered as text. Keep every wrapper `<div className="... bg-highlight text-highlight-foreground">` unchanged — only swap what's inside it. Use `text-lg` for `size-5`-icon contexts and `text-2xl` for the `size-7` context (explore detail hero), so the emoji reads at a comparable visual weight to the icon it replaces.

   - `src/app/(app)/explore/page.tsx:112,119` — remove `const Icon = getActivityIcon(activity.icon);`; replace `<Icon className="size-5" />` with `<span className="text-lg leading-none">{activity.icon || "🏷️"}</span>`.
   - `src/app/(app)/explore/[id]/page.tsx:62,76` — same removal; replace `<Icon className="size-7" />` with `<span className="text-2xl leading-none">{activity.icon || "🏷️"}</span>`.
   - `src/app/(app)/home/page.tsx:67,73` — same removal; replace `<Icon className="size-5" />` with `<span className="text-lg leading-none">{activity.icon || "🏷️"}</span>`.
   - `src/app/(app)/my-activities/page.tsx` — two sites:
     - lines 125,130 (open-activities `.map`): remove `const Icon = getActivityIcon(activity.icon);`, replace `<Icon className="size-5" />` with `<span className="text-lg leading-none">{activity.icon || "🏷️"}</span>`.
     - lines 163,168 (`SelectedActivityCard`): same treatment.
   - `src/app/(app)/explore/[id]/choose/page.tsx:45,66` — same removal; replace `<Icon className="size-5" />` with `<span className="text-lg leading-none">{activity.icon || "🏷️"}</span>`.
   - `src/app/(app)/explore/[id]/confirm/page.tsx:11,43,46` — remove the `getActivityIcon` import (line 11) and the IIFE at lines 42-49; replace the whole `{(() => {...})()}` block with:
     ```tsx
     <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
       <span className="text-lg leading-none">{activity.icon || "🏷️"}</span>
     </div>
     ```

4. **`scripts/seed-firestore.ts`** — replace each `icon:` value per this mapping (lines 16, 29, 42, 55, 68, 81, 94):
   - Running: `"Footprints"` → `"🚶"`
   - Fitness: `"Dumbbell"` → `"🏋️"`
   - Aqua Yoga: `"Waves"` → `"🏊"`
   - Zumba: `"Music4"` → `"🎵"`
   - Swimming: `"Waves"` → `"🏊"`
   - Badminton: `"CircleDot"` → `"🏸"` (badminton racquet+shuttle isn't a single emoji; use `"🏸"` badminton emoji, more accurate than the design doc's placeholder `⚽`)
   - Volleyball: `"Volleyball"` → `"🏐"`

**Verification checklist:**
- `grep -r "icon-map" src/` returns no matches.
- `grep -r "getActivityIcon" src/` returns no matches.
- TypeScript build passes (no unused `Icon` variable / broken imports).
- `verify` skill: open Explore, Home, My Activities, and the choose/confirm flow in a browser; confirm emoji render in place of the old icons at every site.

---

## Phase 2: Event data model — symmetric `day1.agenda`

**`src/features/event/types.ts`** — add `agenda: EventAgendaItem[];` to the `day1` shape:
```ts
export interface EventInfo {
  day1: {
    title: string;
    description: string;
    date: string;
    time: string;
    dresscode: Dresscode;
    agenda: EventAgendaItem[]; // NEW
  };
  day2: {
    title: string;
    description: string;
    date: string;
    agenda: EventAgendaItem[];
  };
}
```
(`EventAgendaItem` itself is unchanged.)

**Backward compatibility for the existing Firestore doc:** in `src/features/event/hooks.ts`, the `fetchEvent` function should default a missing `day1.agenda` to `[]` so old documents don't crash new UI before the admin's first save:
```ts
async function fetchEvent(): Promise<EventResponse> {
  const res = await authedFetch("/api/event");
  if (!res.ok) throw new Error("Gagal memuat info acara");
  const data = await res.json();
  return { ...data, day1: { ...data.day1, agenda: data.day1.agenda ?? [] } };
}
```

**`scripts/seed-firestore.ts`** — locate the `EventInfo` seed object (not shown in Phase 0 discovery; grep for `day1:` in this file) and add `agenda: []` (or a couple of sample `EventAgendaItem` entries, matching whatever style the existing `day2.agenda` seed entries use) to the `day1` object so fresh seeds are symmetric from the start.

**Verification checklist:**
- TypeScript build passes (existing admin schedule page, currently still reading `form.day1`, will not break since `agenda` is an added, not removed, field — but Phase 4/5 replace that page anyway).
- `verify` skill: run `npm run seed`, confirm the `event/info` Firestore doc has `day1.agenda` present.

---

## Phase 3: Employee-facing schedule page — shared `AgendaItemCard`

**`src/app/(app)/schedule/page.tsx`**

1. Extract the per-item Card currently inlined in the Day 2 `.map()` (lines 127-147) into a standalone component in the same file, above `EventSchedulePage`:
   ```tsx
   function AgendaItemCard({ item }: { item: EventAgendaItem }) {
     return (
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <CardTitle>{item.title}</CardTitle>
             <Badge variant={item.status === "confirmed" ? "success" : "warning"}>
               {item.status === "confirmed" ? "Confirmed" : "Detail Menyusul"}
             </Badge>
           </div>
           <CardDescription>
             {item.timeStart} – {item.timeEnd}
           </CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground">{item.description}</p>
           <DresscodeSection dresscode={item.dresscode} />
         </CardContent>
       </Card>
     );
   }
   ```
   Add `import type { Dresscode, EventAgendaItem } from "@/features/event/types";` (extend the existing type-only import that currently only pulls `Dresscode`).

2. Replace the Day 2 `.map()` body (lines 127-147) with `<AgendaItemCard key={item.id} item={item} />`.

3. Add a new section directly below the existing Day 1 hero `<Card>` (after line 119's closing `</Card>`, still inside the Day 1 `<section>`), rendering Day 1's own kegiatan list the same way Day 2 does:
   ```tsx
   {event.day1.agenda.length > 0 && (
     <div className="flex flex-col gap-3 pt-1">
       <h3 className="font-heading text-sm font-semibold text-muted-foreground">
         Kegiatan Hari 1
       </h3>
       {event.day1.agenda.map((item) => (
         <AgendaItemCard key={item.id} item={item} />
       ))}
     </div>
   )}
   ```

**Verification checklist:**
- `verify` skill: with the seed data from Phase 2 (empty or sample `day1.agenda`), load `/schedule` as an employee and confirm Day 1's hero card still renders, followed by the kegiatan list (or nothing, if empty) and Day 2 unchanged.

---

## Phase 4: Admin Schedule — day list page

**Rewrite `src/app/(admin)/admin/schedule/page.tsx`** to a simple list of two day cards linking to detail routes. Drop all the current form state/hooks (`useEventInfo`, `useUpdateEventInfo`, the whole inline-edit form) — that logic moves to Phase 5's `[day]/page.tsx`. Keep `useEventInfo()` here only to read counts/titles for the summary cards:

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventInfo } from "@/features/event/hooks";

export default function AdminSchedulePage() {
  const { data: event, isLoading } = useEventInfo();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-bold text-foreground">Schedule</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {event && (
        <div className="flex flex-col gap-3">
          <Link href="/admin/schedule/day1">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Day 1 · {event.day1.title}</CardTitle>
                  <Badge variant="secondary">{event.day1.agenda.length} kegiatan</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.day1.date}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/schedule/day2">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Day 2 · {event.day2.title}</CardTitle>
                  <Badge variant="secondary">{event.day2.agenda.length} kegiatan</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.day2.date}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
```

**Anti-pattern guard:** do not add a `Button` wrapper inside these `Link`s (unlike the nav-item pattern in `admin/layout.tsx`) — a full clickable `Card` is simpler here and there's no icon+label pair to justify a `Button`; this is a legitimate deviation from the nav pattern, not a missed copy.

**Verification checklist:**
- `verify` skill: load `/admin/schedule`, confirm both day cards show correct titles/dates/kegiatan counts, and clicking either navigates to `/admin/schedule/day1` or `/day2` (404 expected until Phase 5 lands — acceptable as an intermediate state only if phases are committed together; otherwise land Phase 4 and 5 in the same commit).

---

## Phase 5: Admin Schedule — day detail page (CRUD)

**New file `src/app/(admin)/admin/schedule/[day]/page.tsx`.**

Route param handling — copy verbatim from `src/app/(app)/explore/[id]/page.tsx`:
```tsx
"use client";
import { useParams } from "next/navigation";
// ...
const { day } = useParams<{ day: string }>();
```
Narrow `day` to `"day1" | "day2"` with a simple guard (`day === "day1" ? "day1" : "day2"`), defaulting to `"day2"` for any unexpected value — there's no need for a 404/notFound page since only two links ever point here (from Phase 4's list page).

**State and data loading** — reuse the exact `useEventInfo()` + local-form-state + `day1Dresscode`/`agendaDresscode`-as-textarea pattern from the current (pre-rewrite) `src/app/(admin)/admin/schedule/page.tsx`, but scoped to one day:
- Keep the full `EventInfo` in state (fetched via `useEventInfo()`), since `updateEventInfo` overwrites the whole document — editing must preserve the *other* day's data untouched.
- Only render/edit the `form[day]` slice in the JSX.
- Reuse `toTextareaValue`/`fromTextareaValue` and the `DresscodeText` local type verbatim from the current file for the dresscode-items-as-textarea pattern (both the day-level dresscode for `day1`, and the per-agenda-item dresscode for both days now that `day1` has `agenda` too).

**Day-level info form** (top of page): title, description, date Inputs for both days; additionally time + dresscode Inputs/Textarea only when `day === "day1"` — copy this fields-list directly from the current file's lines 108-179 (Day 1 card) and 181-220 (Day 2 card), picking whichever block matches the active `day`.

**Kegiatan list** — copy the current file's `form.day2.agenda.map(...)` block (lines 222-334) verbatim as the base, but:
- Read from `form[day].agenda` instead of hardcoding `form.day2.agenda`.
- Every `setForm({ ...form, day2: { ...form.day2, agenda } })` call becomes `setForm({ ...form, [day]: { ...form[day], agenda } })`.
- Add a delete button to each item's `CardHeader`, next to the `CardTitle`:
  ```tsx
  <div className="flex items-center justify-between">
    <CardTitle>{item.title}</CardTitle>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setDeleteTarget(item)}
    >
      <Trash2 className="size-4" />
    </Button>
  </div>
  ```
  (`import { Trash2 } from "lucide-react";`)

**Delete confirmation** — copy the `Dialog`-based confirm pattern verbatim from `src/app/(admin)/admin/employees/page.tsx` (lines 35, 46-55, 136-158), adapted to agenda items:
```tsx
const [deleteTarget, setDeleteTarget] = useState<EventAgendaItem | null>(null);

function confirmDelete() {
  if (!deleteTarget || !form) return;
  const agenda = form[day].agenda.filter((i) => i.id !== deleteTarget.id);
  setForm({ ...form, [day]: { ...form[day], agenda } });
  setDeleteTarget(null);
}
```
```tsx
<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <DialogContent className="sm:max-w-sm">
    <DialogHeader>
      <DialogTitle>Hapus kegiatan "{deleteTarget?.title}"?</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
      Kegiatan ini akan dihapus dari jadwal. Perubahan baru tersimpan setelah Anda klik Simpan.
    </p>
    <DialogFooter>
      <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
Note this is a **local-state-only** delete (like add) — it does not call the mutation directly; it's committed on the page's existing Simpan/submit button, consistent with how edits to existing fields already work in this form.

**Add new kegiatan** — a button below the agenda list:
```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => {
    const newItem: EventAgendaItem = {
      id: crypto.randomUUID(),
      title: "",
      timeStart: "",
      timeEnd: "",
      status: "tbu",
      description: "",
      dresscode: { items: [], note: "" },
    };
    setForm({ ...form, [day]: { ...form[day], agenda: [...form[day].agenda, newItem] } });
    setAgendaDresscode({ ...agendaDresscode, [newItem.id]: { items: "", note: "" } });
  }}
>
  <Plus className="size-4" />
  Tambah Kegiatan
</Button>
```
(`import { Plus } from "lucide-react";`)

**Submit** — copy `handleSubmit` from the current file (lines 65-93) verbatim; it already merges `day1`/`day2` dresscode-textarea state back into the full `EventInfo` and calls `updateEventInfo.mutate(payload)`. No change needed beyond the fact that `day1` now also has an `agenda` array to fold in the same way `day2.agenda` already is (mirror lines 77-86's `day2` block for `day1` too).

**Back navigation** — add above the page's `<h1>`:
```tsx
<Link href="/admin/schedule" className="text-sm text-muted-foreground hover:text-foreground">
  ← Kembali ke Schedule
</Link>
```

**Verification checklist:**
- TypeScript build passes.
- `verify` skill: navigate `/admin/schedule` → click Day 1 → confirm day-level fields (title/description/date/time/dresscode) and any seeded kegiatan list render; click "+ Tambah Kegiatan", fill in a new item, click Simpan, reload, confirm it persisted.
- Delete an existing kegiatan, confirm dialog appears, confirm deletion, Simpan, reload, confirm it's gone.
- Repeat for Day 2, confirm Day 1's data is untouched after saving Day 2 (proves the full-document-merge submit logic works correctly).
- Confirm employee-facing `/schedule` page (Phase 3) reflects all changes.

---

## Phase 6: Admin Employees — activity names + sorting

**`src/app/(admin)/admin/employees/page.tsx`**

1. Add import: `import { useActivities } from "@/features/activities/hooks";` and fetch: `const { data: activities } = useActivities();`.

2. Build a lookup map (after the `activities` query, before `filtered`):
   ```ts
   const activityNames = new Map((activities ?? []).map((a) => [a.id, a.name]));
   ```

3. Add sort state and a sort step between `filtered` and rendering:
   ```ts
   const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

   const sorted = [...filtered].sort((a, b) => {
     if (!sortDir) return 0;
     const nameA = a.activityId ? (activityNames.get(a.activityId) ?? a.activityId) : null;
     const nameB = b.activityId ? (activityNames.get(b.activityId) ?? b.activityId) : null;
     if (!nameA && !nameB) return 0;
     if (!nameA) return 1;
     if (!nameB) return -1;
     return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
   });
   ```
   Render `sorted` instead of `filtered` in the `TableBody` map.

4. Make the "Aktivitas" `TableHead` clickable:
   ```tsx
   <TableHead
     className="cursor-pointer select-none"
     onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
   >
     Aktivitas {sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : ""}
   </TableHead>
   ```

5. Replace the raw-ID badge rendering (lines 98-99) with name lookup:
   ```tsx
   {employee.activityId ? (
     <Badge>{activityNames.get(employee.activityId) ?? employee.activityId}</Badge>
   ) : (
     <span className="text-xs text-muted-foreground">Belum memilih</span>
   )}
   ```

6. Replace the Open Activities badges (lines 109-113) with the same lookup, no sorting:
   ```tsx
   {employee.openMarks.map((id) => (
     <Badge key={id} variant="secondary">{activityNames.get(id) ?? id}</Badge>
   ))}
   ```

**Verification checklist:**
- `verify` skill: load `/admin/employees`, confirm the Aktivitas and Open Activities columns show activity names, not raw IDs.
- Click the "Aktivitas" header once (ascending), confirm rows reorder A→Z with unselected employees at the bottom; click again (descending), confirm Z→A with unselected still at the bottom.
- Confirm the name/email search filter still works combined with sorting.

---

## Final Phase: Verification

1. Full TypeScript build: `npm run build` (or the project's configured typecheck command) — zero errors.
2. `grep -r "icon-map"` and `grep -r "getActivityIcon"` across `src/` — no matches (Phase 1 cleanup confirmed).
3. Re-run `npm run seed` and confirm no runtime errors from the `day1.agenda` addition.
4. Full manual walkthrough via the `verify` skill covering all three features end-to-end, as detailed in each phase's checklist above.
5. `git status` review before committing — confirm no stray debug code or console.logs were left in.
