# Dark Mode Toggle — Design

## Context

The app already ships a complete dark color palette (`.dark` class in `src/app/globals.css`) and has `next-themes` in `package.json`, but neither is wired up: there is no `ThemeProvider`, and no UI anywhere lets a user switch themes. `src/components/ui/sonner.tsx` already calls `useTheme()` defensively (falls back to `"system"`), anticipating this work.

## Goal

Let users choose Light, Dark, or System theme from the Profile page, using the color tokens that already exist.

## Design

### 1. Provider wiring

`src/app/providers.tsx` wraps its existing tree (`QueryClientProvider` → `AuthProvider`) in `next-themes`'s `ThemeProvider`:

- `attribute="class"` — toggles the `.dark` class already targeted by `globals.css`.
- `defaultTheme="system"`
- `enableSystem`
- `disableTransitionOnChange` — avoids a color-transition flash when switching.

`src/app/layout.tsx` adds `suppressHydrationWarning` to the `<html>` element, since `next-themes` sets the theme class client-side before React hydrates, which would otherwise trigger a hydration warning.

### 2. `ThemeToggle` component

New file: `src/components/theme-toggle.tsx` (client component).

- Reads/writes theme via `useTheme()` (`theme`, `setTheme`).
- Renders a 3-segment pill control — Terang / Gelap / Sistem — built from three `xs`-size `Button`s (`variant="ghost"`) inside a `bg-muted` rounded wrapper. No new UI primitive; reuses the existing `Button` component and sizing scale.
- Active segment gets `bg-background text-foreground`; inactive segments get `text-muted-foreground` — mirrors the active/inactive convention already used in `bottom-nav.tsx`.
- Hydration guard: tracks a `mounted` flag via `useEffect` (mirrors the reasoning in `sonner.tsx`'s `useTheme` fallback) and renders a disabled/static placeholder pill until mounted, then swaps in the live control. This avoids a server/client mismatch since the resolved theme isn't known until the client reads `localStorage`/media query.

### 3. Placement

`src/app/(app)/profile/page.tsx`: add a "Tema" row to the existing settings `Card` (the one currently containing FAQ and Keluar), with a leading `Moon` icon (lucide-react, matching the `HelpCircle` styling used for the FAQ row) and the `ThemeToggle` control on the right in place of a chevron.

Row order becomes: FAQ → `Separator` → **Tema** → `Separator` → Keluar.

## Out of scope

- No changes to color tokens in `globals.css` (already correct for both themes).
- No new dependencies — `next-themes` is already installed.
- No persistence beyond `next-themes`'s default (`localStorage`).
- No theme toggle elsewhere in the app (e.g. no top-level header) — Profile page is the only entry point, matching the app's existing settings-live-in-Profile pattern.
