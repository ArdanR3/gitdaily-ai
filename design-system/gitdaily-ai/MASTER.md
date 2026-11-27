# GitDaily AI — Neo-Brutalist Design System (`MASTER.md`)

> Active visual specification for **GitDaily AI** (`Next.js 15 App Router` + `Tailwind CSS v4` + `Framer Motion`).

---

## 1. Visual Direction & Core Principles
- **Style:** Neo-Brutalist technical workshop (`neubrutalism.com` inspired) paired with standalone isometric SVG anatomy figures (`FIG 01 · GITBOY-01` and `FIG 02 · Codex Archive Rack`).
- **Geometry:** Zero border radius (`border-radius: 0`), solid `#000000` / `#111111` borders (`2px`–`4px`), and hard offset drop shadows (`3px 3px 0 #000` to `10px 10px 0 #000`).
- **Background:** Warm graph-paper canvas (`#FFFDF5`) with subtle 32px ink grid (`.nb-grid-bg`) and technical `#fcfbf7` dot-grid (`#d4d4ce`, 16px) inside isometric figure cards.

---

## 2. Color Tokens (`src/app/globals.css`)

| Token | Hex | Role |
| --- | --- | --- |
| `--nb-ink` | `#000000` / `#111111` | Primary text, borders, hard shadows, SVG ink |
| `--nb-bg` | `#FFFDF5` | Main page canvas |
| `--nb-bg-warm` | `#F5F0E8` | Card footers, secondary panels, tab strips |
| `--nb-surface` | `#FFFFFF` | Card interiors, inputs, modal surfaces |
| `--nb-yellow` | `#FFD23F` / `#facc15` | Hero header, primary badges, Edit buttons, `BRANCH_PR` highlight |
| `--nb-green` | `#88D498` / `#86efac` | Primary CTA (`Approve & Push`, `Simpan`), `ALLOWED` status, `DONE` |
| `--nb-purple` | `#B8A9FA` / `#c4b5fd` | Materials header, `CREATE_REPO` cards, Lilac Cartridge |
| `--nb-blue` | `#74B9FF` / `#60a5fa` | Settings header, `UPDATE_REPO` cards, Sync port |
| `--nb-pink` | `#FF6B6B` / `#fb7185` | Destructive actions (`Logout`, `Hapus`), `LOCKED (PRIVATE)`, errors |
| `--nb-orange` | `#FFA552` | `PROTECTED` manual lock, `PENDING` status |

---

## 3. Typography
- **Display Headings:** `Syne` (`.font-display`, uppercase, `font-extrabold`, tight tracking)
- **Body & UI Labels:** `Space Grotesk` (`--font-sans`)
- **Telemetry, Code, Badges, SVG Callouts:** `JetBrains Mono` (`.font-mono`)

---

## 4. Accessibility & Mobile PWA (WCAG 2.2)
- **Touch Targets:** Minimum `44px` height on mobile (`min-h-[44px] sm:min-h-[34px]` / `sm:min-h-[38px]`) for all primary action buttons, tabs, and modal controls.
- **iOS Anti-Zoom Inputs:** All `<input>` and `<textarea>` elements use `text-base sm:text-xs` (`16px` computed font size on mobile).
- **Zero Horizontal Overflow:** Verified at `375x812` across `/`, `/materials`, and `/settings` (`min-w-0` on flex/grid children).
- **Keyboard & Motion:**
  - App wrapped in `<MotionConfig reducedMotion="user">` (`MotionProvider.tsx`) + CSS `@media (prefers-reduced-motion: reduce)`.
  - Zero infinite idle animation loops in SVG anatomy figures; motion is interaction-driven (`hover`, `click`, `←`/`→`, `E`).
  - Modals (`CodePreviewModal`, `Edit Materi`) enforce `role="dialog"`, `aria-modal="true"`, `overscroll-contain`, Tab focus trapping, `Escape` dismissal, and focus restoration.
  - Inline Neo-Brutalist confirmation panels replace native `window.confirm()` for PWA standalone reliability.

---

## 5. Interactive Isometric Figures
- **`FIG 01 · GITBOY-01 · COMMIT DECK`** (`src/components/figures/gitboy-deck/GitBoyDeckFigure.tsx`): 3-layer explodable retro handheld console on `/` wired to streak, repo guard counts, and active study cartridge.
- **`FIG 02 · CODEX ARCHIVE RACK`** (`src/components/figures/knowledge-chunker/KnowledgeChunkerFigure.tsx`): 3 separated zero-clipping isometric stations on `/materials` (`Codex Shelf` with pull-out Hero Mint book, `~3K Open Book` lectern with arched pages & scanner bar, and standalone `Lilac Cartridge` dock).
