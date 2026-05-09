# SmartTruck Frontend Design — Type, Layout, and Shape Reference

This document covers typography, layout, shapes, and structural component sizing.
**Color values live in `src/app/globals.css`** and are not duplicated here.

## Overview

SmartTruck is an operations app — dense, readable, built for repeated inspection.
The visual language is editorial calm over decoration: a single sans family,
aggressive negative letter-spacing on display sizes, hairline-only depth (no
drop shadows), and compact developer-dialect radii.

**Key Characteristics:**
- Single sans family (Inter as substitute; JetBrains Mono for code surfaces).
- Display weight 500–600 with negative letter-spacing — magazine voice, never bold (700+).
- Hairline + surface ladder for depth; no drop shadows on the dark canvas.
- Compact: 8px CTA radius, 12px card radius, 16px content-panel radius.
- Operations density: tight rows, comfortable but efficient padding.

## Typography

### Font Family

- **Display + body**: Inter (substitute for Linear's custom sans). Same family for display and body — the family change is silent.
- **Mono**: JetBrains Mono (substitute for Linear Mono). Used for code surfaces, IDs, and status tokens.

Fallback stack: `system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `display-xl` | 80px | 600 | 1.05 | -3.0px | Largest hero headline |
| `display-lg` | 56px | 600 | 1.10 | -1.8px | Section opener headlines |
| `display-md` | 40px | 600 | 1.15 | -1.0px | Sub-section headlines |
| `headline` | 28px | 600 | 1.20 | -0.6px | Page titles |
| `card-title` | 22px | 500 | 1.25 | -0.4px | Card group titles |
| `subhead` | 20px | 400 | 1.40 | -0.2px | Lead paragraphs |
| `body-lg` | 18px | 400 | 1.50 | -0.1px | Hero subhead, lead body |
| `body-md` | 16px | 400 | 1.50 | -0.05px | Default body |
| `body-sm` | 14px | 400 | 1.50 | 0 | Dense body, footers |
| `caption` | 12px | 400 | 1.40 | 0 | Captions, meta |
| `button` | 14px | 500 | 1.20 | 0 | Button labels |
| `eyebrow` | 13px | 500 | 1.30 | +0.4px | Section labels (slight positive tracking) |
| `mono` | 13px | 400 | 1.50 | 0 | Code, IDs, status tokens |

### Principles

- **Aggressive negative tracking on display** (-3.0px at 80px ≈ 4% of size). Body holds at near-zero.
- **Single voice from display to body** — same family, narrower weights.
- **Eyebrow uses positive tracking** (+0.4px) — contrast against negative-tracked display marks the eyebrow as taxonomy.
- **Mono only in code contexts.**
- **Display weight stays at 500–600.** Never 700+. The editorial voice depends on this.

## Layout

### Spacing System

- **Base unit:** 4px.
- **Tokens:** `xxs` 4px · `xs` 8px · `sm` 12px · `md` 16px · `lg` 24px · `xl` 32px · `xxl` 48px · `section` 96px.
- Card interior padding: 24px on feature/data cards; 32px on testimonial/highlight cards.
- Button padding: 8px vertical · 14px horizontal.
- Form input padding: 8px vertical · 12px horizontal.

### Grid & Container

- Max content width: ~1280px.
- Card grids: 3-up at desktop, 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy

The dark canvas IS the whitespace. Sections separate by surface lift, not by
gaps in white. Within a panel, 24px gaps between content blocks; 96px between
major sections.

## Elevation & Depth

The system uses **hairline-only depth** + a four-step surface ladder.
No drop shadows.

| Level | Treatment |
|---|---|
| 0 (canvas) | Page background — outermost dark |
| 1 (panel) | One step lifted from canvas — content panels, sidebars |
| 2 (card) | One step lifted from panel — feature cards, data tables |
| 3 (hover/popover) | One step lifted from card — hover states, dropdown popovers |
| 4 (active/focus) | Strong lift for selected items, focus rings |

Surface ladder hex values are defined in `src/app/globals.css`. Do not skip
levels — each tier should pair with the rung directly above or below it.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Small chips, status badges |
| `sm` | 6px | Inline tags |
| `md` | 8px | All buttons, form inputs |
| `lg` | 12px | Cards, feature tiles |
| `xl` | 16px | Content panels, larger cards |
| `pill` | 9999px | Tabs, status pills |
| `full` | 9999px | Avatars |

## Components

> Sizing only — surface and text colors come from `globals.css`.

### Buttons

**`button-primary`** — Primary CTA. Used scarcely.
- Type: `button` (14/500), padding 8px 14px, rounded `md` (8px).

**`button-secondary`** — Outlined button.
- Type: `button`, padding 8px 14px, rounded `md`. 1px hairline border.

**`button-tertiary`** — Plain text button.

### Cards & Containers

**`feature-card`** — Generic feature highlight tile.
- Type: `body`, rounded `lg` (12px), padding 24px. Optional 1px hairline border.

**`content-panel`** — Rounded panel hosting a page's content (tables, forms, detail views).
- Rounded `xl` (16px), no border (depth from surface lift), inset 8px from canvas.

### Inputs & Forms

**`text-input`** — Form field.
- Type: `body`, rounded `md`, padding 8px 12px.
- Focus: 2px outline at 50% opacity.

### Tabs

Pill-style tabs are the only pill-rounded shape besides badges.
- Default: transparent background, muted text, rounded `pill`, padding 6px 14px.
- Selected: surface-3 background, ink text.

### Breadcrumb

`text › text › text` — last crumb is current (ink), preceding crumbs are
clickable (ink-muted with hover to ink). Chevron separator at ink-tertiary.

### Status & Badges

**`badge`** — Small uppercase pill.
- Type: `eyebrow`, rounded `pill`, padding 2px 8px.

## Do's and Don'ts

### Do

- Render every code surface in JetBrains Mono.
- Compose CTAs as `rounded-md` (8px) — never pill.
- Pair display weight 500/600 with body weight 400 — never 700+.
- Apply negative letter-spacing aggressively on display sizes.
- Use the surface ladder + hairlines for hierarchy.

### Don't

- Don't drop display to bold weights (700+).
- Don't add drop shadows. Hairlines + surface contrast carry depth.
- Don't pill-round CTAs — pill is reserved for tabs and badges.
- Don't skip surface ladder levels.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Single column, sidebar collapses to drawer, display sizes scale down. |
| Tablet | 640–1024px | 2-up grids; hero h1 56px. |
| Desktop | 1024–1280px | Full 3-up grids; full hero sizes. |
| Wide | > 1280px | Content caps at 1280px. |

### Touch Targets

- CTAs hold ≥40px tap height across viewports.
- Form inputs hold ≥44px tap target on touch.

### Collapsing Strategy

- **Sidebar**: collapses to drawer below 768px.
- **Card grids**: 3-up → 2-up at 1024px → 1-up below 768px.
- **Display type**: scales down on mobile (`display-xl` 80px → `display-md` 40px).

## Iteration Guide

1. Focus on ONE component at a time.
2. Default radii: CTAs `rounded-md` (8px), cards `rounded-lg` (12px), content panels `rounded-xl` (16px).
3. Default body: `body-md` at weight 400.
4. JetBrains Mono on every code surface.
5. Pill is reserved for tabs and badges — never CTAs.

## Known Gaps

- Color values live in `src/app/globals.css`, not here.
- Animation timings out of scope.
- Form validation states beyond focus not specced.
