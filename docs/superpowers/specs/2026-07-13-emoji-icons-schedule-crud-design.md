# Design: Emoji Activity Icons, Schedule Day CRUD, Employee Activity Sorting

Date: 2026-07-13

## Context

Three related but independent admin-experience improvements:

1. Activity icons currently require the admin to type a raw Lucide icon name (e.g. `Dumbbell`) into a free-text field, with no validation — typos silently fall back to a default icon and the admin has no way to discover valid names. Switching to emoji removes the lookup problem entirely.
2. The admin Schedule page (`/admin/schedule`) edits a single hardcoded `EventInfo` document with two asymmetric days: Day 1 has no agenda/kegiatan list at all, Day 2 has one but with no way to add or remove items — only edit existing ones. The admin wants to browse by day first, then manage a day's kegiatan list, including creating new ones.
3. The admin Employees page (`/admin/employees`) shows each employee's chosen activity as a raw activity ID badge, with no way to sort by it.

These three changes touch different features (`activities`, `event`, `admin/employees`) and can ship independently, but are specified together since they were scoped in one session.

## 1. Activity icon: Lucide name → emoji

**Data model** (`src/features/activities/types.ts`): `Activity.icon` stays `string`, but now holds a literal emoji (e.g. `"🏃"`) instead of a Lucide component name. No type change needed.

**Removed:** `src/features/activities/icon-map.ts` and all `getActivityIcon()` calls/imports.

**Render sites** — replace `<Icon className="..." />` with the emoji rendered as text, keeping each call site's existing sizing/wrapper classes:
- `src/app/(app)/explore/page.tsx`
- `src/app/(app)/explore/[id]/page.tsx`
- `src/app/(app)/home/page.tsx`
- `src/app/(app)/my-activities/page.tsx`
- `src/app/(app)/explore/choose/page.tsx`
- `src/app/(app)/explore/confirm/page.tsx`

Example pattern: `<span className="text-2xl leading-none">{activity.icon || "🏷️"}</span>` (exact className copied from whatever `<Icon className="...">` used at each site).

**Fallback:** empty/missing icon displays `"🏷️"` (generic tag emoji), replacing the old `Dumbbell` default.

**Admin form** (`src/app/(admin)/admin/activities/activity-form-dialog.tsx`):
- Label: `"Icon (emoji)"`.
- Placeholder: `"🏃"`.
- Still a plain free-text `Input` — admin types or pastes any emoji, no picker, no validation (matches current free-text behavior, just repurposed).
- Empty-on-submit default changes from `"Dumbbell"` to `"🏷️"`.

**Seed data** (`scripts/seed-firestore.ts`): replace each Lucide name with an equivalent emoji:

| Lucide name | Emoji |
|---|---|
| Footprints | 🚶 |
| Dumbbell | 🏋️ |
| Waves | 🏊 |
| Music4 | 🎵 |
| CircleDot | ⚽ |
| Volleyball | 🏐 |

Production Firestore data is updated by re-running `npm run seed` (existing project convention).

## 2. Schedule data model: symmetric day/agenda structure

**Current** (`src/features/event/types.ts`):
```ts
export interface EventInfo {
  day1: { title: string; description: string; date: string; time: string; dresscode: Dresscode };
  day2: { title: string; description: string; date: string; agenda: EventAgendaItem[] };
}
```

**New:**
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

`EventAgendaItem` (`id`, `title`, `timeStart`, `timeEnd`, `status`, `description`, `dresscode`) is unchanged and reused for both days.

**New agenda item IDs:** generated client-side with `crypto.randomUUID()` when the admin clicks "Tambah Kegiatan" — agenda items live inside a single Firestore document (not their own collection), so no server-side uniqueness check is needed (unlike `Activity.id`, which is a Firestore doc ID).

**Backward compatibility:** existing Firestore `event/info` documents predate `day1.agenda`. Wherever `day1.agenda` is read (admin day page, employee schedule page), default to `[]` if absent: `event.day1.agenda ?? []`. The field becomes permanent the next time an admin saves via the Schedule page. `scripts/seed-firestore.ts` is updated to include `day1.agenda: []` (or sample items) explicitly so fresh seeds are already symmetric.

**API/backend:** no changes. `PATCH /api/admin/event` already accepts and `.set()`-overwrites a full `EventInfo` object; the new admin pages fetch the full document via the existing `useEventInfo()` hook, edit one day's slice in local state, and submit the merged full object on save — identical mechanics to today's single-page form, just split across two routes.

## 3. Admin Schedule pages: day list → day detail

**`/admin/schedule`** (rewritten): a simple list of two day cards (Day 1, Day 2), each showing the day's title, date, and a badge with its kegiatan count. Clicking a card navigates to that day's detail route.

**`/admin/schedule/[day]`** (new dynamic route, `day` ∈ `"day1" | "day2"`):
- Back link to `/admin/schedule`.
- Day-level info form at the top: title, description, date — plus `time` and `dresscode` inputs only when `day === "day1"` (Day 2 has no day-level time/dresscode today, unaffected by this design).
- "Kegiatan" section below: one editable card per `EventAgendaItem`, reusing the existing inline-edit fields (title, start/end time, status tabs, description, dresscode textarea + note) already built for Day 2's agenda in the current `/admin/schedule/page.tsx`.
- Each kegiatan card gets a **Hapus** button (destructive, with a confirm dialog matching the existing "Reset Pilihan" confirm-dialog pattern in `admin/employees/page.tsx`) that removes it from local state.
- **"+ Tambah Kegiatan"** button appends a new blank `EventAgendaItem` (new `crypto.randomUUID()` id, `status: "tbu"`, empty strings elsewhere) to local state for the admin to fill in.
- One **Simpan** button submits the whole page: merges this day's edited slice into the full `EventInfo` fetched on load, `PATCH /api/admin/event`.

## 4. Employee Schedule page: symmetric agenda rendering

`src/app/(app)/schedule/page.tsx`:
- Day 1 keeps its existing hero card (title/date/time/description/`DresscodeSection`) unchanged.
- Below it, a new "Kegiatan Hari 1" heading + list of kegiatan cards, one per `day1.agenda` item.
- Day 2's existing per-item card rendering (title, status badge, time range, description, `DresscodeSection`) is extracted into a shared `AgendaItemCard` component and reused for both Day 1's new list and Day 2's existing list, avoiding duplicated JSX.
- Day 2 section is otherwise unchanged.

## 5. Employees table: activity names + sorting

`src/app/(admin)/admin/employees/page.tsx`:
- The **Aktivitas** column currently renders `<Badge>{employee.activityId}</Badge>` (raw ID). It will instead look up the activity's `name` from the already-available activities list (fetched via `useActivities()`, joined in memory — same convention used elsewhere in this codebase, e.g. `my-activities/page.tsx`) and render `<Badge>{activity?.name ?? employee.activityId}</Badge>`.
- The **Open Activities** column gets the same ID→name treatment for consistency, but stays unsorted (an employee can have multiple open activities).
- The **Aktivitas** column header becomes clickable to toggle sort direction (A–Z / Z–A) by activity name. Employees with no activity selected (`activityId === null`) sort to the end regardless of direction.
- Existing name/email search filter continues to work in combination with sorting (filter first, then sort the filtered list).

## Testing

- Manual verification via the `verify` skill after implementation: create/edit/delete an activity with an emoji icon and confirm it renders correctly across Explore, Home, My Activities, and the choose/confirm flow.
- Admin Schedule: verify navigating day list → day detail, adding a new kegiatan, editing an existing one, deleting one, and saving — then confirm the employee-facing `/schedule` page reflects the changes for both Day 1 and Day 2.
- Admin Employees: verify the Aktivitas column shows names (not IDs) and that clicking the header sorts correctly, including employees with no selection.
