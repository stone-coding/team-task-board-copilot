---
# Tokens for tools; prose below for judgment. Values come from docs/mockups/board.html.
# Each token maps to a Tailwind v4 default class, so no @theme change is needed.
name: Team Task Board
colors:
  background: "#f4f4f5"   # bg-zinc-100 — page
  surface: "#ffffff"      # bg-white — cards, header
  column: "#fafafa"       # bg-zinc-50 — column body
  border: "#e4e4e7"       # border-zinc-200 — cards, columns, header rule
  text: "#18181b"         # text-zinc-900
  muted: "#52525b"        # text-zinc-600 — descriptions, breadcrumb, counts; lightest text allowed on white
  control-border: "#a1a1aa" # border-zinc-400 — select, empty-state dash
  todo: "#64748b"         # border-t-slate-500
  in-progress: "#2563eb"  # border-t-blue-600; also the focus ring
  done: "#16a34a"         # border-t-green-600
typography:
  family: system-ui        # font-sans default
  body: { size: 14px, lineHeight: 1.45 }   # text-sm
  h1: { size: 22px }                        # text-2xl is close enough; keep one h1
  h2: { size: 15px }                        # text-base font-semibold
  h3: { size: 14px, weight: 600 }           # text-sm font-semibold
  small: { size: 12px }                     # text-xs — counts, "Status" label
radius:
  card: 8px     # rounded-lg
  column: 10px  # rounded-xl
  pill: 999px   # rounded-full
spacing:
  page-padding: 16px  # p-4
  board-gap: 16px     # gap-4
  card-gap: 8px       # gap-2
  max-width: 1200px   # max-w-7xl mx-auto
---

# DESIGN.md — Team Task Board

Visual spec for UI work. Mockups: `docs/mockups/board.png` (1280px), `docs/mockups/board-mobile.png` (375px), source `docs/mockups/board.html`. When this file and the mockup disagree, ask.

## Overview

Calm, utilitarian Kanban. Content first: the only color on the page is the column top borders and the focus ring. No shadows, gradients, icons, or decoration.

## Layout

- White header (`border-b border-zinc-200`) with a muted breadcrumb **"Projects / {project name}"** above the `<h1>` project name.
- Board: `grid grid-cols-1 gap-4 md:grid-cols-3` inside `max-w-7xl mx-auto p-4`. Columns stack below 768px. No horizontal page scroll at 375px.

## Components

| Component | Spec |
|---|---|
| `BoardColumn` | `<section aria-labelledby>`; `bg-zinc-50 border border-zinc-200 rounded-xl p-3 border-t-4` plus the status color. `<h2>` title on the left, count pill on the right. Cards in `<ul>`/`<li>` with `gap-2`. |
| Count pill | `rounded-full bg-zinc-200 px-2 text-xs font-semibold text-zinc-600`. |
| Empty state | Dashed box (`border border-dashed border-zinc-400 rounded-lg py-5 text-center text-zinc-600`) with **"No tasks yet"**. |
| `TaskCard` | `bg-white border border-zinc-200 rounded-lg px-3 py-2.5`. `<h3>` title; optional description `text-zinc-600`. Below: visible "Status" text (`aria-hidden`) and a native `<select>` (`border-zinc-400 rounded-md`) with `aria-label="Status for {title}"`. |
| Focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600` on every control. |

Column colors: To Do `border-t-slate-500`, In Progress `border-t-blue-600`, Done `border-t-green-600`.

## Do's and Don'ts

- Do build from native elements (`<select>`, `<button>`, `<input>`) before custom widgets.
- Do reuse a component in `src/components/` before making a new one.
- Don't use color as the only signal: every column has a text title and a count.
- Don't use text lighter than `text-zinc-600` on white (WCAG AA 4.5:1).
- Don't remove focus outlines (`outline-none`, `outline-hidden`).
- Don't add drag-and-drop; status changes go through the select.
