# Rundown Hide/Show Toggle — Design

## Problem

Admins currently have no way to hide the event rundown (schedule) from employees. The rundown is always visible on the home page and at `/schedule` once an employee logs in. Admins want a single on/off switch to hide the whole rundown (both Day 1 and Day 2 together) when it isn't ready to be shown yet, or when they want to pull it back temporarily.

## Scope

- One global toggle covering the entire rundown (Day 1 + Day 2 together). No per-day toggle.
- Hiding the rundown removes the entry points to it from the employee-facing UI. It does **not** block direct navigation to `/schedule` — an employee who already has the URL can still open it. This matches how the route is already reachable only via those two links today (it's not in `BottomNav`).
- Admin's own `/admin/schedule` editor is unaffected by the toggle — admins can always view and edit the rundown regardless of its visibility to employees.
- Default state (including for the existing `event/info` doc that predates this field): **visible**.

## Data model

`src/features/event/types.ts`: add a required boolean field to `EventInfo`:

```ts
scheduleVisible: boolean;
```

`src/features/event/data.ts`: `getEventInfo()` reads the singleton `event/info` doc. Existing docs won't have this field yet, so when the field is absent, default it to `true` in the read path (not via a one-off migration script), e.g.:

```ts
export async function getEventInfo(): Promise<EventInfo> {
  const snap = await eventDoc().get();
  const data = snap.data();
  return {
    ...defaultEventInfo, // existing shape
    ...data,
    scheduleVisible: data?.scheduleVisible ?? true,
  };
}
```

`updateEventInfo(next: EventInfo)` is unchanged — it already overwrites the whole doc, so writing `scheduleVisible` follows the existing pattern.

No new Firestore collection, no new API route. `PATCH /api/admin/event` (already `requireUser` + `requireAdmin`) continues to accept a full `EventInfo` payload, now including `scheduleVisible`.

## Admin UI

`src/app/(admin)/admin/schedule/page.tsx`:

- Add a switch/toggle above the existing Day 1 / Day 2 list, labeled **"Tampilkan Rundown ke Employee"**.
- Bound to `eventInfo.scheduleVisible` (read via the existing `useEventInfo()` hook already used elsewhere).
- On toggle, call the existing `useUpdateEventInfo` mutation (`src/features/admin/hooks.ts:94`) with the current `EventInfo` payload plus the flipped `scheduleVisible` value — same call shape already used for saving Day 1/Day 2 edits on this page.
- No confirmation dialog needed; it's a reversible, low-risk toggle consistent with other admin switches in this app.

## Employee-facing behavior

`src/app/(app)/home/page.tsx`:

- The hero "Agenda Terdekat" card (~line 116) and the grid shortcut card (~line 160) are each wrapped in a check on `eventInfo.scheduleVisible`. When `false`, the card is simply not rendered (no placeholder, no "coming soon" message — just omitted, since this is a temporary admin-controlled hide, not a permanent removal).
- Both reads go through the existing `useEventInfo()` hook already used on this page — no new fetch.

`src/app/(app)/schedule/page.tsx`:

- Left unchanged. Still reachable by direct URL when `scheduleVisible` is `false`, per the "hide link only" decision. No redirect or gating added here.

## Out of scope

- Per-day (Day 1 vs Day 2) visibility control.
- Blocking direct URL access to `/schedule` when hidden.
- Any new settings/feature-flag collection — this reuses the existing `event/info` singleton doc pattern.

## Testing

- Toggle off in admin → home page rundown cards disappear for an employee account; `/schedule` still loads if navigated to directly.
- Toggle on → cards reappear.
- Existing `event/info` doc without the new field → treated as visible (no crash, no employee-facing regression) until an admin explicitly toggles it.
