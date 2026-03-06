# NanoAlias — Antigravity Theme Design System

> Single source of truth for the dark-mode UI theme.  
> Edit the CSS variables in `index.css`; all components inherit them automatically.

---

## CSS Variable Block

```css
:root {
  /* Base dark mode — pure black */
  --bg:       #000000;
  --surface:  #0b0b0b;
  --card:     #0b0b0b;
  --text:     #e6eef8;
  --muted:    #9aa7b8;
  --border:   #1a1a1a;
  --radius:   12px;

  /* Vibrant accent palette */
  --accent-1: #7dd3fc;   /* cyan   */
  --accent-2: #ff6fb5;   /* magenta */
  --accent-3: #7efc6a;   /* lime   */
  --accent-4: #ffb86b;   /* orange */
  --accent-5: #9b7bff;   /* purple */

  /* Semantic aliases */
  --primary:   var(--accent-1);
  --secondary: var(--accent-2);
  --success:   #34d399;
  --warn:      #f59e0b;
  --error:     #f87171;

  /* Glass glow */
  --glass:         rgba(125,211,252,0.06);
  --glow-primary:  rgba(125,211,252,0.06);
  --glow-secondary:rgba(255,111,181,0.06);

  /* Gradients */
  --gradient-accent:     linear-gradient(90deg, var(--accent-1), var(--accent-5));
  --gradient-chip:       linear-gradient(90deg, var(--accent-1), var(--accent-2));
  --gradient-accent-alt: linear-gradient(135deg, var(--accent-1), var(--accent-2));

  /* Focus ring */
  --focus-ring: 0 0 0 3px rgba(125,211,252,0.18);
}
```

---

## Color Swatches

| Token       | Hex       | Role / Usage |
|-------------|-----------|--------------|
| `--bg`      | `#000000` | Root page background (pure black) |
| `--surface` | `#0b0b0b` | Card backgrounds, modals, tooltips |
| `--text`    | `#e6eef8` | Primary body text |
| `--muted`   | `#9aa7b8` | Labels, captions, secondary text |
| `--border`  | `#1a1a1a` | Card borders, dividers, table rules |
| `--accent-1`| `#7dd3fc` | **Cyan** — primary CTA, focus ring, chart line, link chips |
| `--accent-2`| `#ff6fb5` | **Magenta** — secondary CTA, QR Generate button |
| `--accent-3`| `#7efc6a` | **Lime** — Active Links stat, success states |
| `--accent-4`| `#ffb86b` | **Orange** — Total Links stat, warnings |
| `--accent-5`| `#9b7bff` | **Purple** — QR Codes stat, gradient end-stop |

---

## Gradients

| Name | CSS | Usage |
|------|-----|-------|
| Accent gradient | `linear-gradient(90deg, #7dd3fc, #9b7bff)` | Selected pills, card header bars, Sign Up CTA |
| Chip gradient   | `linear-gradient(90deg, #7dd3fc, #ff6fb5)` | Short URL chip labels (monospace) |
| Alt gradient    | `linear-gradient(135deg, #7dd3fc, #ff6fb5)` | Logo badge, decorative strokes |

---

## Component → Color Mapping

| Component | Element | Token(s) |
|-----------|---------|----------|
| **Create Link card** | Header bar | `--gradient-accent` |
| | "Shorten" button | `--accent-1` + `glow-primary` |
| | "Generate QR" button | `--accent-2` + `glow-secondary` |
| | Selected expiry pills | `pill-gradient` class |
| | Input borders (focus) | `--accent-1` |
| **Quick Stats** | Header bar | `--gradient-accent` |
| | Total Clicks bar | `--accent-1` (cyan) |
| | Active Links bar | `--accent-3` (lime) |
| | Total Links bar | `--accent-4` (orange) |
| | QR Codes bar | `--accent-5` (purple) |
| | Sparklines | `--accent-5` (purple, SVG path) |
| **Links list** | Short URL chip | `chip-short-url` (gradient bg, mono) |
| | Click count pill | `--accent-1` 10% bg |
| | Row hover | `--accent-1` 5% bg |
| **QR Panel** | Size/EC pills (selected) | `pill-gradient` |
| | Download button | `--accent-1` + `glow-primary` |
| **Navbar** | Logo badge | `--gradient-accent-alt` |
| | Sign Up CTA | `--gradient-accent` |
| | Surface | `--surface` 85% alpha |
| **Login/Register** | Submit button | `--gradient-accent` |
| | Brand name | Tri-color gradient (`--accent-1` → `--accent-2` → `--accent-5`) |
| **Toast** | Background | `linear-gradient(135deg, --surface, --bg)` |
| | Accent stripe | 3px left bar colored by action type |
| **Delete modal** | Confirm delete | `--error` |

---

## Figma Token Export (JSON)

```json
{
  "color": {
    "bg":       { "value": "#000000", "type": "color" },
    "surface":  { "value": "#0b0b0b", "type": "color" },
    "text":     { "value": "#e6eef8", "type": "color" },
    "muted":    { "value": "#9aa7b8", "type": "color" },
    "border":   { "value": "#1e293b", "type": "color" },
    "accent-1": { "value": "#7dd3fc", "type": "color" },
    "accent-2": { "value": "#ff6fb5", "type": "color" },
    "accent-3": { "value": "#7efc6a", "type": "color" },
    "accent-4": { "value": "#ffb86b", "type": "color" },
    "accent-5": { "value": "#9b7bff", "type": "color" },
    "success":  { "value": "#34d399", "type": "color" },
    "warn":     { "value": "#f59e0b", "type": "color" },
    "error":    { "value": "#f87171", "type": "color" }
  },
  "gradient": {
    "accent":     { "value": "linear-gradient(90deg, #7dd3fc, #9b7bff)", "type": "gradient" },
    "accent-alt": { "value": "linear-gradient(135deg, #7dd3fc, #ff6fb5)", "type": "gradient" }
  }
}
```

---

## Interaction Spec

### Glow Effects

- **Glass glow** (`--glass`): `rgba(125,211,252,0.06)` — subtle glass-like ambient glow.
- **Primary glow** (`glow-primary`): `box-shadow: 0 0 24px var(--glow-primary)` — applied to cyan CTAs.
- **Secondary glow** (`glow-secondary`): `box-shadow: 0 0 20px var(--glow-secondary)` — applied to magenta CTAs.
- Both also include `inset 0 1px 0 rgba(255,255,255,0.08)` for a subtle top highlight.

### Card Hover

- `translateY(-4px)` + `box-shadow: 0 8px 32px var(--glass)` on hover.
- Applied via `.card-hover` class.
- Disabled by `prefers-reduced-motion: reduce`.

### Focus Ring

- `box-shadow: 0 0 0 3px rgba(125,211,252,0.18)` on `:focus-visible`.
- Applied globally via `index.css` for keyboard navigation.

### Toast

- Background: `linear-gradient(135deg, var(--surface), var(--bg))`.
- 3px left accent stripe colored by action type (success = `--success`, error = `--warn`).

### Sparklines

- Purple SVG path strokes on each Quick Stats tile.
- Uses `transform + opacity` only for animations.

### Gradient Pills

- Active/selected pills use `background: var(--gradient-accent)` with dark text (`--bg`).
- Inactive pills: transparent background, muted text, solid border.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .glow-primary, .glow-secondary {
    box-shadow: none;
  }
  .card-hover:hover {
    transform: none;
    box-shadow: none;
  }
}
```

All glow, gradient-animation, card-hover, and sparkline effects are suppressed for users who prefer reduced motion.

---

## Component Variants

| State | Primary CTA | Secondary CTA | Pill (selected) | Pill (inactive) |
|-------|-------------|---------------|------------------|-----------------|
| **Default** | `--accent-1` bg, dark text, glow | `--accent-2` bg, dark text, glow | `--gradient-accent` bg, dark text | transparent bg, muted text, border |
| **Hover** | opacity 0.9 | opacity 0.9 | — | — |
| **Active** | opacity 0.85 | opacity 0.85 | — | — |
| **Disabled** | opacity 0.5, no glow | opacity 0.5, no glow | — | — |
| **Focus** | 3px cyan ring | 3px cyan ring | 3px cyan ring | 3px cyan ring |

---

## Contrast Ratios

| Pair | Ratio | Pass |
|------|-------|------|
| `--text` (#e6eef8) on `--bg` (#000000) | **18.4:1** | ✅ AAA |
| `--muted` (#9aa7b8) on `--bg` (#000000) | **8.9:1** | ✅ AAA |
| `--accent-1` (#7dd3fc) on `--bg` (#000000) | **12.5:1** | ✅ AAA |
| `--accent-2` (#ff6fb5) on `--bg` (#000000) | **9.1:1** | ✅ AAA |
| Chip text (`--bg`) on gradient | **12.5:1+** | ✅ AAA |
