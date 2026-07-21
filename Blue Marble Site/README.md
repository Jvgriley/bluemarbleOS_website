# Blue Marble Intel — Website

Premium, dark, ocean-tech one-page site for **Blue Marble Intel**.

Open `index.html` in any modern browser to preview.

> Note: this site was placed in `Blue Marble Site/` (no trailing space) because the original `Blue Marble ` folder name caused permission errors. Once you copy `Bluemarble logo noBG.png` into this folder, you can rename this folder to whatever you like.

---

## What's in this folder

| File | Purpose |
| --- | --- |
| `index.html` | All 9 sections of the site (semantic HTML, easy to port to WordPress). |
| `style.css` | Premium dark-ocean theme. All design tokens live at the top of the file. |
| `script.js` | Interactive WebGL globe + scroll reveal + mobile nav. |
| `Bluemarble logo noBG.png` | **Copy this from your original `Blue Marble ` folder** — already referenced by the nav, footer, and favicon. |

---

## Customising

### Copy and headings
Open `index.html`. Each section starts with a clear comment block, e.g.:

```
<!-- =====================================================
  3. THREE-PHASE PLATFORM ROADMAP — V1, V2, V3
====================================================== -->
```

Replace text in place — no build step.

### Colours
Open `style.css`, edit the `:root` block at the top:

```css
:root {
  --c-blue:      #2dd4ff;   /* electric blue */
  --c-aqua:      #7dd3fc;   /* soft aqua */
  --c-bg:        #04070f;   /* deep space */
  ...
}
```

### Partner logos
Create an `assets/partners/` folder, drop SVG/PNG files in, then in `index.html` replace each placeholder:

```html
<div class="partner">Partner&nbsp;Logo</div>
```

with:

```html
<div class="partner"><img src="assets/partners/example.svg" alt="Example" /></div>
```

### Founder photo
Section 7 has a placeholder. Replace this block:

```html
<div class="founder__placeholder">JR</div>
```

with:

```html
<img src="assets/founder.jpg" alt="Jack Riley" />
```

### Contact email / investor brief
Search `index.html` for `hello@bluemarbleintel.com` and update.
Replace the `#` href on "Investor brief (PDF)" with the actual file path.

---

## The 3D globe

The hero globe is a procedural dotted Earth built with three.js (loaded from CDN). It works without external textures, so no asset paths to maintain. Tunable knobs at the top of `script.js`:

- `DOTS = 2400` — density of surface dots.
- `STARS = 1200` — background star count.
- Data-point markers — edit the `addDataPoint(lat, lon)` calls.

---

## Moving to WordPress later

Because the site is plain HTML/CSS/JS:

1. The `<header>`, each `<section>`, and `<footer>` map cleanly to WordPress template parts or page blocks.
2. `style.css` can be enqueued via `wp_enqueue_style` in `functions.php`.
3. `script.js` can be enqueued via `wp_enqueue_script` (load in footer).
4. The three.js CDN script tag can either stay inline or be moved to a `wp_enqueue_script` with the CDN URL.
5. The Open Graph and meta tags map to a SEO plugin (Yoast / Rank Math).

---

## Tone & messaging used

All copy follows the brief — bold, clear, visionary, commercially credible, easy to understand:

- "Data first. Intelligence next. Intervention follows." (hero stat strip + footer)
- "Using technology for good" (about ticks)
- "New efforts to clean up old messes" (about ticks)
- "Conservation through exploration" (eyebrow + section 4)
- "Ocean health is connected to all life on Earth" (about ticks)
- "The intelligence layer for Earth" (CTA)

---

## Browser support

- Modern Chrome, Safari, Firefox, Edge.
- WebGL globe gracefully no-ops if three.js fails to load.
- Respects `prefers-reduced-motion` (animations / globe rotation pause).
- Mobile nav appears under 860 px.
