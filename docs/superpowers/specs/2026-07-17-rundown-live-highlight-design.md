# Rundown Live Highlight — Design

## Context

`src/features/event/schedule-time.ts` already exports `isAgendaItemLive(date, timeStart, timeEnd, now)` and `useNow()`, used today only by the Home page's "Agenda Terdekat" hero card (`src/app/(app)/home/page.tsx`) to show a "Sedang Berlangsung" pill + ring when the featured Fit Rave session is in progress. The full rundown on the Schedule page (`src/app/(app)/schedule/page.tsx`, `AgendaItemCard`) has no equivalent — a session in progress looks identical to any other item in the list.

## Goal

When a rundown item's time window is currently active, highlight its card in the Schedule page's Day 1 / Day 2 lists, reusing the existing live-detection helpers.

## Design

### 1. Live detection at the page level

`EventSchedulePage` calls `useNow()` once (default 30s refresh, matching existing usage).

### 2. `AgendaItemCard` gains `date` and `now` props

- `date`: the day's date string (`event.day1.date` or `event.day2.date`, passed by the caller — each day's `.agenda.map()` call already has this in scope).
- `now`: passed down from the page-level `useNow()`.
- Computes `isLive = isAgendaItemLive(date, item.timeStart, item.timeEnd, now)`.

### 3. Visual treatment when `isLive` is true

Distinct from the primary color already used for buttons/links and the existing "Confirmed" status badge, so the live state doesn't blend in. Uses the `highlight` token (the palette's dedicated gold "glow" color), following the same `bg-{color}/10 text-{color}` convention already used by the `success`/`warning`/`urgent` badge variants in `src/components/ui/badge.tsx`:

- `Card` becomes `relative` and gains `ring-2 ring-highlight/60 ring-offset-2 ring-offset-background`.
- A small overlay pill, top-right corner (same placement as the Home page's live pill): `bg-highlight/15 text-highlight-foreground`, containing a pulsing highlight-colored dot + the label "Sedang Berlangsung".

### 4. Scope

- Only `src/app/(app)/schedule/page.tsx` changes (`AgendaItemCard` + its two call sites + the page-level `useNow()` call).
- No changes to the Home page's existing live badge, no new agenda-status values, no changes to the "Confirmed"/"Detail Menyusul" status badge — the live indicator is additive and independent of it.
- No new dependencies; reuses `isAgendaItemLive` and `useNow` as-is.
