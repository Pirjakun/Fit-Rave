# Mid Year Party App — Design Spec

Status: Approved by user (2026-07-10)

## 1. Overview

Mobile-first web app for a company's Mid Year Party (Beach/Summer Party theme). Employees use it to browse sports/wellbeing activities, select quota-limited activities, and track their selection status.

Event structure:
- **Day 1** (2026-07-16) — cultural ceremony ("menyamakan vibrasi" ruwatan wayang with a dalang). Informational only in the app (Event Schedule page) — no registration, no activity selection.
- **Day 2** (2026-07-17) — a 3-block rundown (revised 2026-07-10, replaces the earlier single-time-window placeholder):
  - **Fit Rave**, 07:30–10:00 (confirmed) — all sports/wellbeing activities (segmented and open) run in this block.
  - **Training**, 13:00–17:00 (TBU — content not finalized).
  - **Dinner Outside**, 18:00–21:00 (TBU — content not finalized).

Scope for this phase: **frontend only**, backed by a mock API layer (Next.js Route Handlers) that is structured to be swapped for a real backend later without changing frontend code. No admin/HR panel in this phase.

## 2. Persona & Goals

**Persona — "Dina, Karyawan Kantor"**: 25–40 y.o., mobile-only usage (often mid-commute or between work tasks), low patience for friction, not technical.

**User goals**
- See all activities in one place, understand which need selection vs. which are open.
- Pick one segmented activity before quota/deadline runs out, quickly.
- Get unambiguous confirmation that a selection was recorded.
- Check Day 1 / Day 2 schedule without asking HR.

**Pain points to design against**
- Confusing segmented vs. open activities → strong visual badges ("Perlu Dipilih" / "Bebas Ikut").
- Fear of missing out on quota → real-time remaining-slot indicator + urgency cues.
- Uncertainty whether a selection "took" → dedicated success state + persistent "My Activities" status page.
- Fear of being stuck with a bad choice → changing selection is allowed while target quota is available.

**Feature priority (this phase)**
1. Explore Activities (browse + filter segmented/open)
2. Choose Activity + Confirmation (quota + deadline checks)
3. My Activities (selection status)
4. Event Schedule (Day 1 info + Day 2 window)
5. Home Dashboard (summary + primary CTA)
6. Login (simple), Activity Detail, Profile, FAQ

**Recommended future features (out of scope, noted for later)**
- Deadline-approaching reminders/notifications.
- Add-to-calendar (Google/Outlook).
- Lightweight social proof ("32 rekan kerja lain ikut Zumba") without exposing individual data.
- Admin/HR dashboard (participant counts, quota management, export).

## 3. Information Architecture & Navigation

```
Splash Screen
  -> Login (name + employee ID/email)
     -> Home Dashboard (root, bottom nav)
         |- Explore Activities
         |     -> Activity Detail
         |          -> Choose Activity (segmented only, when unselected or eligible to switch)
         |               -> Confirmation
         |- My Activities
         |- Event Schedule (Day 1 info + Day 2 window)
         |- Profile
         |     -> FAQ
```

**Bottom navigation (4 items, one-hand reach):** Home · Explore · My Activities · Profile.
Event Schedule is reached via a Home banner/card and from the Profile menu — not a 5th bottom-nav slot, since it's checked less frequently than the four primary destinations.

Rationale:
- Splash/Login are one-time entry flows, not tabs.
- Activity Detail / Choose Activity / Confirmation are a drill-down stack from Explore (back-button navigation), not standalone tabs.
- FAQ lives inside Profile (low-frequency access).
- My Activities is a top-level tab (not buried in Profile) because it's the anxiety-relieving "proof of status" screen users re-check often.

**Activity Detail CTA branches by category:**
- **Open** (Swimming, Badminton, Volleyball, …): informational; optional non-blocking "Tandai Ikut" toggle. No quota, no Confirmation page.
- **Segmented** (Running, Fitness, Aqua Yoga, Zumba, …): CTA = "Pilih Aktivitas Ini" → Choose Activity → Confirmation. CTA becomes disabled with a "Kuota Penuh" badge when full, or becomes "Ganti ke Aktivitas Ini" if the employee already holds a different segmented selection. If this is the employee's current selection, CTA becomes a "✓ Aktivitas Terpilih" status badge with a small "Batalkan Pilihan" action.

## 4. Core Business Rules & Data Model

**Entities**
```
Employee   { id, name, email, avatarInitial }
Activity   { id, name, category: "segmented" | "open", description, icon,
             coverImage, location, day: 1 | 2, timeWindow,
             quota: number | null, quotaTaken: number, tags[] }
Selection  { employeeId, activityId, status: "confirmed", selectedAt }
EventInfo  { day1: { title, desc, time },
             day2: { title, desc, agenda: AgendaItem[] } }
AgendaItem { id, title, timeStart, timeEnd, status: "confirmed" | "tbu", description }
```

**Rules**
1. Each employee may hold **at most one active Selection** across all segmented activities (a single event-wide choice, not per time-slot, since exact slots aren't finalized).
2. Open activities never create a Selection record — informational, optional non-blocking "tandai ikut" only, never affects any quota.
3. Changing a selection is allowed **as long as the target activity's quota is available**. Mechanism: choosing a new activity atomically releases the old slot and takes the new one in a single mock API call (`PUT /api/selection`).
4. **Registration deadline**: a cutoff date/time before Day 2. After it passes, all "Pilih"/"Ganti" CTAs are disabled and a banner reads "Pendaftaran ditutup pada [date]". Placeholder assumption: **H-3 before Day 2** (representative mock value, not confirmed by HR — must be swappable via a single config value).
5. Quota-full state is derived in real time from `quotaTaken >= quota` and disables the CTA immediately.

**Working assumptions (representative mock data, not final HR numbers)**
- Deadline: H-3 before Day 2, i.e. 2026-07-14 (placeholder, swappable via a single config value).
- Day 2 rundown (confirmed 2026-07-10): **Fit Rave** 07:30–10:00 (confirmed) is where all segmented/open sports activities run — every `Activity.timeWindow` reads "Fit Rave · 07.30 - 10.00". **Training** 13:00–17:00 and **Dinner Outside** 18:00–21:00 are TBU (shown in Event Schedule with a "detail menyusul" status badge, no activity selection tied to them).
- Sample activities/quotas (e.g., Running quota 50, Zumba quota 30) are illustrative mock data for demonstrating UI/logic, not final headcounts.

## 5. User Flow & States

**Selecting a segmented activity**
```
Explore Activities -> tap segmented activity card
Activity Detail -> tap "Pilih Aktivitas Ini"
Choose Activity (summary + terms + confirm button)
  -> tap "Konfirmasi Pilihan"
  [server checks: quota available? deadline not passed?]
  - Success -> Confirmation (success state, Framer Motion checkmark) -> CTA "Lihat My Activities"
  - Quota just filled (race condition) -> inline error: "Yah, kuota baru saja penuh. Pilih aktivitas lain?" + CTA back to Explore
  - Deadline passed -> error: "Pendaftaran sudah ditutup" + CTA to My Activities
```

**Switching from an existing selection**
```
Activity Detail (Activity B, employee currently holds Activity A)
  CTA reads "Ganti ke Aktivitas Ini"
  -> Choose Activity shows warning banner:
     "Anda akan berpindah dari [Activity A] ke [Activity B]. Slot Anda di [Activity A] akan dilepas."
  -> Confirm -> Confirmation (success) -> My Activities reflects the new selection
```

**Viewing the currently selected activity**
CTA becomes a "✓ Aktivitas Terpilih" status badge (not an action button) plus a small "Batalkan Pilihan" action that clears the selection (returns to unselected state, no replacement).

**Open activity**
```
Activity Detail (e.g. Swimming) -> no selection flow, no quota.
Optional CTA: "Tandai Ikut" (toggle, no quota effect, no Confirmation page)
  -> reflected immediately under "Open Activities yang Anda tandai" in My Activities
```

**Global states (Explore, Activity Detail, My Activities)**
- **Loading** — skeleton cards while fetching from the mock API (not a bare spinner).
- **Empty** — My Activities before any selection: "Belum ada aktivitas yang dipilih" + CTA "Explore Aktivitas".
- **Error** — fetch failure: toast/banner "Gagal memuat data, coba lagi" + retry action.
- **Success** — full-page confirmation (not just a toast, since this is a high-stakes moment) with a Framer Motion checkmark micro-interaction.

**Login validation**
Name and employee ID/email required, inline validation as the user types (not a post-submit alert). No password field (per the simple-login decision).

## 6. Visual Direction (high-level; full design system produced separately via `/ui-ux-pro-max`)

- **Color**: Ocean Blue & Turquoise as primary (primary actions, active nav state); White Sand as base background; Coral/Sunset Orange as CTA/urgency-badge accent (e.g. "kuota hampir penuh"); Soft Yellow for light highlights. Neutral-dominant proportions — beach colors are accents, not the base, to keep a corporate-premium feel.
- **Tone**: flat/semi-flat illustration (not generic stock photos), large-radius rounded cards (16–24px), soft shadows (no hard drop shadows), soft sky gradients for hero banners, optional light glassmorphism on floating elements (e.g. a quota badge overlaid on an image).
- **Icons**: Lucide, outline style, consistent stroke width (no mixing filled/outline).
- **Motion**: Framer Motion for page transitions (light fade/slide) and micro-interactions (selection button, confirmation checkmark) — short duration, smooth easing; restrained rather than playful, to preserve the premium feel.
- **Accessibility**: WCAG AA minimum text/background contrast; minimum 44×44px tap targets (mobile-first, one-hand bottom nav).

This section intentionally stays high-level. Exact palette hex values, typography scale, spacing scale, and the component library are a separate deliverable in the next phase.

## 7. Tech Architecture

- **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + Lucide Icons.**
- Mock API via Route Handlers under `app/api/*` (activities, selections, auth) with realistic request/response shapes, so a later swap to a real backend (e.g. Prisma/Supabase) changes only the route handler internals, not the frontend contract.
- Client-side data fetching/caching via React Query (or equivalent) rather than manual Context — gives consistent loading/error states across pages for free.
- Feature-based folder structure (`/features/activities`, `/features/selection`, …) rather than type-based, so each unit (data, UI, logic) is understandable in isolation.

## 8. Explicit Out of Scope (this phase)

- Admin/HR dashboard.
- Real backend/database, real authentication (password, SSO).
- Per-activity fine-grained time slots (single time-window display only).
- Multi-selection or conflict-checked scheduling for segmented activities (hard-capped at one selection).
- Notifications/reminders, calendar export, social-proof counters (recommended for a later phase, not built now).
