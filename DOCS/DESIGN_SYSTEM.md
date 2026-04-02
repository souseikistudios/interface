# Design System Reference

## Color Tokens — OKLCH

### Green Family (H≈139.3°)

| Step | Name | OKLCH | Hex |
|------|------|-------|-----|
| 1 | green-950 | oklch(17.94% 0.0455 139.3) | #061502 |
| 2 | green-900 | oklch(23.82% 0.0567 139.3) | #0F2408 |
| 3 | green-800 | oklch(31.46% 0.0734 139.3) | #1B3A13 |
| 4 | green-700 | oklch(44.19% 0.0780 139.3) | #3B5D32 |
| 5 | green-600 | oklch(56.92% 0.0580 139.3) | #657F5E |
| 6 | green-500 | oklch(69.66% 0.0350 139.3) | #92A38E |
| 7 | green-300 | oklch(82.39% 0.0180 139.3) | #BFC8BD |
| 8 | green-100 | oklch(95.12% 0.0080 139.3) | #ECF0EB |

Chroma peaks at step 4 (green-700). Darks carry the palette's character.

### Shared Lightness Backbone (13 steps)

All families use these L values. Only C and H change.

| Step | L% |
|------|-----|
| 950 | 15.2 |
| 900 | 22.0 |
| 800 | 30.0 |
| 700 | 40.0 |
| 600 | 50.0 |
| 500 | 60.0 |
| 400 | 70.0 |
| 300 | 80.0 |
| 200 | 88.0 |
| 100 | 94.0 |
| 75 | 96.5 |
| 50 | 98.0 |
| 25 | 99.2 |

### Warm Neutral Family

H=80–107° analogous zone. Olive-yellow character. Hue-locked (scale chroma, not hue).
Anchor dark: ~#1C1917 (L≈22%). Anchor light: ~#F0EFE9 (L≈95%).
Full token values to be added as palette work finalizes.

### True Neutral

R=G=B at every step. oklch(L 0 0). The zero-state of the system.

---

## Motion System

### Three Behaviors

**Meet** — arrival. Quick acceleration, purposeful deceleration, long settle.
- Character: intentional, decisive, warm
- Typical duration: 300–600ms
- Curve shape: steep attack, inflection at ~30%, long tail to 100%

**Still** — holding. Near-zero velocity. Continuous subtle presence.
- Character: calm, assured, present
- Typical duration: continuous or 2000ms+
- Curve shape: flat with micro-oscillation

**Breathe** — continuing. Rhythmic oscillation. Never stops.
- Character: alive, organic, unhurried
- Typical duration: 3000–6000ms per cycle, infinite repeat
- Curve shape: sinusoidal with organic irregularity

### Curve Implementation

Prefer CSS `linear()` for precise multi-point curves exported from After Effects.
Prefer spring physics (tension/friction/mass) for interactive responses.
Three-point curves over simple cubic-bezier — the inflection point is where character lives.

```css
/* Example Meet curve — to be replaced with AE export values */
--ease-meet: linear(0, 0.002, 0.01, 0.04, 0.12, 0.28, 0.50, 0.68, 0.82, 0.90, 0.95, 0.98, 0.99, 1);

/* Example spring config for interactive Meet */
--spring-meet-tension: 170;
--spring-meet-friction: 26;
--spring-meet-mass: 1;
```

After Effects curve data format (when exporting):
- Speed graph keyframe values (px/sec at each frame)
- Or bezier handle coordinates from Flow plugin
- Or JSON export from motion plugin

---

## Typography System

### Hierarchy

Type is tone. Hierarchy through weight and scale, not decoration.

### Breath Mapping

| Movement | Leading | Tracking | Margins | Weight |
|----------|---------|----------|---------|--------|
| Stillness | Generous (1.6–1.8) | Relaxed | Wide | Light–Regular |
| Conviction | Tight (1.2–1.3) | Normal | Contained | Medium–Bold |
| Warmth | Balanced (1.4–1.5) | Normal | Comfortable | Regular |
| Accountability | Precise (1.3–1.4) | Tight | Exact | Medium |

### Japanese Principles

Ma (間) — the meaningful space between elements. Not emptiness — charged absence.
Hitsuyō Saishōgen (必要最小限) — the necessary minimum. Not minimalism as reduction but as sufficiency.

---

## Component Specifications

### Claim Card

```
┌──────────────────────────────────────┐
│ Title (relationship condition)        │
│ Combination line (context + source)   │
│ Age indicator          [Action btn]   │
└──────────────────────────────────────┘
```

- Title names a condition, not an object: "Benefits enrollment blocked" not "HR ticket"
- Pure typographic hierarchy — no icons unless earned
- Conditional action button appears only when action is available

### Processing States

```
Line 1: [verb + object]              ← Action (present tense)
Line 2: [count] + [source icons]     ← Evidence (accumulating)
Line 3: [scope] · [time]             ← Provenance (trust line)
```

Active → Settled: compresses to tappable bar. Provenance expands on interaction.

### Context States

Initial → Context → Deep
- Initial: minimal, prompt, quiet readiness
- Context: expands in place, no navigation away
- Deep: full investigation, complete picture
