---
# Tokens for tools; prose below for judgment. Each token maps to a Tailwind v4 default class, so no @theme change is needed.
# Updated by #41 (UI polish); the original mockups in docs/mockups/ remain the layout reference.
name: Team Task Board
colors:
  background: "#fafafa"   # body — page
  surface: "#ffffff"      # bg-white — header, cards, forms, stat cards
  column: "#f4f4f5"       # bg-zinc-100/80 — column body
  border: "#e4e4e7"       # border-zinc-200 — cards, columns, header rule
  text: "#18181b"         # text-zinc-900
  muted: "#52525b"        # text-zinc-600 — descriptions, breadcrumb, counts; lightest text allowed
  control-border: "#a1a1aa" # border-zinc-400 — inputs, selects, empty-state dash
  primary: "#18181b"      # bg-zinc-900 — primary buttons, brand mark
  todo: "#64748b"         # slate-500 — column top border and dot
  in-progress: "#2563eb"  # blue-600 — column top border and dot; also the focus ring
  done: "#16a34a"         # green-600 — column top border, dot, progress fill
  danger: "#b91c1c"       # red-700 — destructive buttons; red-50/red-200 for confirm panels and errors
typography:
  family: Geist (next/font) # font-sans
  body: { size: 14px }                      # text-sm
  h1: { size: 24px, weight: 600 }           # text-2xl font-semibold tracking-tight (home: text-3xl/4xl)
  h2: { size: 14px, weight: 600 }           # text-sm font-semibold — column and section titles
  h3: { size: 14px, weight: 500 }           # text-sm font-medium — task and project names
  small: { size: 12px }                     # text-xs — counts, captions, "Status" label
radius:
  control: 8px  # rounded-lg — buttons, inputs, cards
  panel: 12px   # rounded-xl — columns, forms, stat cards
  pill: 999px   # rounded-full
spacing:
  page-padding: 16px  # px-4
  board-gap: 16px     # gap-4
  card-gap: 8px       # gap-2
  max-width: 1280px   # max-w-7xl (board), max-w-5xl (home, projects)
---

# DESIGN.md — Team Task Board

Visual spec for UI work. Original mockups: `docs/mockups/board.png` (1280px), `docs/mockups/board-mobile.png` (375px), source `docs/mockups/board.html`. Current screenshots: `docs/screenshots/`. When this file and the mockup disagree, this file wins (it records the #41 polish); ask if a change would alter the layout itself.

## Overview

Calm, modern, utilitarian, in the spirit of Linear and Notion. Neutral surfaces with soft borders and light shadows; color carries meaning only: the status accents (slate, blue, green), the progress fill, red for destructive actions and errors, and the blue focus ring. No gradients, illustrations, or icon libraries.

## Layout

- **App header** (`AppHeader`) on every signed-in page: sticky, white, `border-b border-zinc-200`, `h-14`. Left: brand mark + "Team Task Board" link to `/`, then `<nav aria-label="Main">` with **Projects** (`aria-current="page"` on `/projects`). Right: ghost **Log out**. No headings and no lists in the header.
- **Board page:** `<nav aria-label="Breadcrumb">` "Projects / {project name}" (the name has `aria-current="page"`), then the `<h1>`, the project overview, the New task form, and the board grid `grid grid-cols-1 gap-4 md:grid-cols-3` inside `max-w-7xl mx-auto px-4 py-6`. Columns stack below 768px. No horizontal page scroll at 375px.
- **Projects page:** `<h1>` with a one-line description; below, `lg:grid-cols-[320px_1fr]`: the New project card (sticky on large screens) and "Your projects" as a card grid (`sm:grid-cols-2`).
- **Auth pages:** centered `max-w-sm` card with the brand above it.

## Components

| Component | Spec |
|---|---|
| Buttons | From `src/components/ui/button-styles.ts`: `PRIMARY_BUTTON` (zinc-900, white text), `SECONDARY_BUTTON` (white, `border-zinc-300`), `GHOST_BUTTON` (text only, `hover:bg-zinc-100`), `DANGER_BUTTON` (red-700). All `rounded-lg text-sm font-medium` with the focus ring. Submit buttons show a small spinner while pending. |
| Inputs | `INPUT`: `rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm shadow-sm`; label `text-sm font-medium` above; hint `text-xs text-zinc-600`. |
| `ProjectOverview` | `role="group"` named "Project overview"; a `<dl>` of four stat cards (`bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm`; label `text-xs text-zinc-600`, value `text-2xl font-semibold tabular-nums`) in `grid-cols-2 sm:grid-cols-4`; then a native `<progress>` (`h-2 rounded-full`, track `bg-zinc-200`, fill `bg-green-600`) named "Completion rate" with an "X of Y tasks completed" caption. |
| `BoardColumn` | `<section aria-labelledby>`; `rounded-xl border border-zinc-200 border-t-4 bg-zinc-100/80 p-3` plus the status color on the top border. Header: status dot (decorative) + `<h2>` with **only the title**; count pill (`rounded-full bg-white ring-1 ring-zinc-200 text-xs font-semibold`) beside it, with "tasks" for screen readers. Cards in `<ul>`/`<li>`, `gap-2`. |
| Empty state | Dashed box (`border-dashed border-zinc-400 rounded-lg`) with **"No tasks yet"** (columns) or **"No projects yet"** plus a one-line hint (projects). |
| `TaskCard` | `bg-white border border-zinc-200 rounded-lg p-3 shadow-sm hover:shadow-md`. `<h3>` title (`font-medium`), optional description `text-zinc-600`. Footer above a hairline: visible "Status" text (`aria-hidden`) and a native `<select>` named **"Status for {title}"**; ghost **Edit** and **Delete** named "Edit {title}" / "Delete {title}". |
| Delete confirmation | Inline panel `rounded-lg border border-red-200 bg-red-50 p-3`: question, danger **Confirm delete**, secondary **Cancel** (focused first). |
| Errors | `FormError`: `role="alert"`, `rounded-lg border border-red-200 bg-red-50 text-red-800`, decorative "!" badge. |
| Loading | Skeletons that mirror the page (`animate-pulse motion-reduce:animate-none`) with a visually hidden `role="status"` message. |
| Focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600` on every control (`FOCUS_RING`). |

## Do's and Don'ts

- Do build from native elements (`<select>`, `<button>`, `<input>`, `<progress>`) before custom widgets.
- Do reuse `button-styles.ts` and the components in `src/components/` before making new ones.
- Don't use color as the only signal: columns have text titles and counts; links in running text are underlined.
- Don't use text lighter than `text-zinc-600` on white or zinc-100 (WCAG AA 4.5:1).
- Don't remove focus outlines (`outline-none`, `outline-hidden`).
- Don't add a second `<h1>`, headings in the app header, or lists outside page content.
- Don't add drag-and-drop; status changes go through the select.
