# Shuang (Chris) Chen — academic homepage

Live site: https://chrischen1023.github.io/shuangchen/

A light, responsive academic website for computer vision, brain-inspired AI and robotic perception. Hosted on the existing GitHub Pages site with no frontend framework or production dependencies.

## Update content

- Biography, news, experience, education and teaching: edit `index.html` outside the publication markers.
- Publications: edit `data/publications.json`, then run `node scripts/render-publications.mjs` and commit both the JSON and generated `index.html`.
- LinkedIn field notes: edit `data/linkedin-posts.json`, add genuine post photos under `imgs/activity/`, then run `node scripts/render-activity.mjs` and commit the JSON, photos and generated `index.html`. Posts are verified and published as static summaries with original source links.
- Styles: `assets/site.css`; publication filtering and optional motion: `assets/site.js`.
- Portrait: `imgs/SC.jpg`; paper images: `imgs/papers/` and `imgs/research/`. Keep figures at or below roughly 2400 px wide and a few hundred KB; `docs/research-image-sources.md` records any resizing.
- Research image provenance: `docs/research-image-sources.md`.
- LinkedIn source records and verified posting dates: `docs/activity-sources.md`.

All 20 published/accepted papers are embedded in the HTML. JavaScript initially highlights six selected papers and enables topic filters; visitors without JavaScript can still read the entire list. Accepted papers are explicitly labelled. Citation metrics are a dated snapshot, not an automatic live count.

## Weekly maintenance

The owner authorised a weekly Codex thread automation, scheduled for Monday at 09:00 Europe/London. It checks the owner's public publication records, project repositories and LinkedIn posts; verifies authorship, dates and publication status; and publishes relevant, sourced updates after review and browser checks. It preserves concurrent edits, skips unverifiable claims, and makes no changes when there is no meaningful new material. This schedule runs through Codex rather than a GitHub Actions feed scraper. On-demand updates remain supported.

## Interaction

Research cards include genuine paper figures, full-size image links and publication sources. Research, publication, activity and news entries have brief, one-time scroll reveals; publication filters and the news archive have short transition feedback. Baseline content stays visible if JavaScript or animation APIs are unavailable. The animation layer respects reduced-motion preferences, including changes while the page is open, and cancels animations around keyboard focus.

## Print and sharing

A print stylesheet (`@media print` in `assets/site.css`) hides the navigation and filter controls, shows all 20 publications in a compact list and prints link targets, so the page doubles as a simple CV-style PDF. Open Graph, Twitter card and JSON-LD `Person` metadata in `index.html` describe the page for search engines and link previews.

## Preview

From this directory, run `python -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765/ . Stop it with Ctrl+C. Serve only this repository directory.

The published site lives at `/shuangchen/`. All asset paths are relative, and `_config.yml` preserves the existing GitHub Pages URL. `index.html` is a standalone static entry point; Jekyll does not need to process the page.

## Browser checks

With Node.js and Playwright available, run `node --test tests/site.test.cjs tests/motion.test.cjs`. On a new machine, install the development browser with `npm install --no-save playwright` and `npx playwright install chromium` first. Checks cover selected/all publication views, combined topic filters and empty states, keyboard controls, mobile overflow, local assets and anchors, no-JavaScript reading, the production URL subpath, motion preferences and animation API fallbacks.

## Design references

Information architecture was informed by [Jon Barron](https://jonbarron.info/), [Phillip Isola](https://web.mit.edu/phillipi/) and [Deepak Pathak](https://www.cs.cmu.edu/~dpathak/). Styling and implementation are original to this site. The previous homepage remains in Git history.
