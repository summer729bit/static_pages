# Man Luo, FGA — Static Site

A static marketing site for **Man Luo, FGA** — a New York-based jewelry historian,
gemologist, and designer specializing in period jewelry, fine gemstones, and
contemporary design.

## Live site

<https://summer729bit.github.io/static_pages/>

## Structure

```
index.html          Single-page markup
css/style.css       All styles
js/main.js          Scroll reveal, header state, nav behavior
assets/fonts/       Self-hosted WOFF2 (Hedvig Letters Serif, PT Serif)
assets/img/         Responsive images, 960px / 1672px variants in WebP + JPG
assets/favicon.svg  Site icon
```

## Local preview

No build step, no dependencies. Serve the folder with any static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly via `file://` also works, but preloaded fonts and
some relative paths behave more predictably over HTTP.

## Deployment

Pushed to `main` and published with GitHub Pages (branch `main`, root folder).
Every push to `main` republishes the site automatically.

## Notes

- Images ship in both WebP and JPG for `srcset`/`<picture>` fallbacks.
- Fonts are self-hosted; no third-party CDN requests.
- `og:image` and the canonical URL point at `https://manluo.world/` — update
  those in `index.html` if the production domain changes.
