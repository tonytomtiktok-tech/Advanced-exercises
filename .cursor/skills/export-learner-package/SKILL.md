---
name: export-learner-package
description: >-
  Mandatory standard for every learner exam-set export under public/aksorn-*.
  Covers package layout, binary cover handling, minify/performance, safety checks,
  and post-export verification. Use whenever exporting a user package, preparing
  a build for server upload, hardening aksorn-* folders, or when the user mentions
  Export แพ็กเกจผู้ใช้, export package, minify export, or ขึ้น server.
---

# Export learner package (mandatory)

Apply this skill **every time** a learner package is exported or an `public/aksorn-*`
folder is prepared for upload. Same checklist for every version — no shortcuts.

This is **not** the Next.js admin app. Do not minify `components/`, `lib/` source used
for development. Harden only the **exported static package** (or the export pipeline
that writes it).

## Pipeline entry points

- UI: Admin → Export แพ็กเกจผู้ใช้
- Code: `lib/export-package.ts` → `POST /api/export-package`
- Output: `public/<base>-vNN/` (immutable version folders; never overwrite older ones)

## Required package layout

Every export folder must contain at least:

```
index.html
exam.html
report.html
assets/app.js
assets/styles.css
assets/data.js
assets/Aksorn_Logo.svg
assets/cover.<ext>    # png|jpg|webp|gif|svg — path must match data.js SET.cover
```

`assets/data.js` must set `SET.cover` to a **relative** path that exists in the same
folder (e.g. `assets/cover.png`). Do not leave broken absolute `/covers/...` paths
inside a standalone package unless the file is also copied in.

## Safety rules (always)

1. **No secrets** — no API keys, tokens, `.env`, admin routes, or localStorage admin keys.
2. **Learner-only** — package must not expose Admin workspace, import trays, or draft tools.
3. **Escape content** — text from questions rendered into HTML/JS must stay escaped (no raw HTML injection from prompts).
4. **Binary covers** — raster images (PNG/JPEG/WebP/GIF) must be written as **base64 → binary**, never `response.text()` / UTF-8. SVG may be UTF-8 text.
5. **Video** — prefer external URL embeds (`promptVideoUrl`); do not embed huge video binaries in `data.js` unless explicitly required.
6. **Immutable versions** — new export = new `vNN` folder; do not delete or mutate prior versions unless the user asks.

## Performance / minify standard

After a successful write (or when hardening an existing `aksorn-*` folder):

| Asset | Standard |
|-------|----------|
| `assets/app.js` | Minify for production package (keep source generators in `lib/export-app-js.ts` readable) |
| `assets/styles.css` | Minify for production package (keep `lib/export-styles.ts` readable) |
| `assets/data.js` | Keep valid JS; do not break `window.AKSORN_DATA`. Avoid pretty-print in final ship if size matters; never corrupt Unicode Thai text |
| Cover / images | Prefer compressed PNG/JPEG/WebP; avoid shipping multi‑MB duplicates |
| HTML | Keep the three entry HTML files; minify optional if it does not break relative asset paths |

Prefer project tooling (`minify_project` MCP **on the export folder only**, or an export-time minify step) over hand-minifying. Do **not** run Sonar on minified output as if it were source of truth.

If minify is not wired into Export yet, either:
- implement minify in the export pipeline, or
- minify the new `public/aksorn-*-vNN/` folder immediately after export,

then re-verify the checklist below.

## Post-export verification (block shipping if any fail)

1. Folder exists under `public/` with expected `vNN`.
2. `assets/data.js` parses; `questions.length >= 1`.
3. Cover file exists and opens as a real image (not corrupt UTF-8 garbage). File size should be close to the source asset.
4. Open `index.html` (activity), `exam.html`, `report.html` — no missing asset 404 for `app.js` / `styles.css` / `data.js` / cover / logo.
5. No admin-only strings or export API URLs required at runtime for learners.
6. Report briefly: folder path, version label, question count, cover path, minify done yes/no.

## When changing export code

Any change to `lib/export-package.ts`, `lib/export-app-js.ts`, `lib/export-styles.ts`, or `app/api/export-package` must preserve this standard. After code changes, export a smoke package and run the verification list.

## Anti-patterns

- Reading PNG/JPEG via `res.text()` and writing as UTF-8
- Pointing `SET.cover` at `/covers/categories/...` without copying the file into the package
- Minifying the Next admin source instead of the learner package
- Overwriting `v01` in place instead of creating `v02`
- Shipping empty question arrays

## Done means

A new version folder is ready for server upload: layout complete, cover visible, JS/CSS production-ready, safety checks passed, verification reported.
