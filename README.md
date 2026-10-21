# Shuang (Chris) Chen — academic homepage

Live site: https://chrischen1023.github.io/shuangchen/

A light, responsive academic website for computer vision, brain-inspired AI and robotic perception. Hosted on the existing GitHub Pages site with no frontend framework or production dependencies.

## Update content

- Biography, news, experience, education and teaching: edit `index.html` outside the generated content markers.
- Publications: edit `data/publications.json`, then run `node scripts/render-publications.mjs` and `node scripts/render-research.mjs`; commit the JSON and generated `index.html`.
- Research areas: edit `data/research-areas.json` and run `node scripts/render-research.mjs`. Each area references multiple existing publication IDs; images, alternative text, venues and paper links come from `data/publications.json`.
- LinkedIn field notes: edit `data/linkedin-posts.json`, add genuine post photos under `imgs/activity/`, then run `node scripts/render-activity.mjs` and commit the JSON, photos and generated `index.html`. Posts are verified and published as static summaries with original source links.
- Styles: `assets/site.css`; publication filtering and entry motion: `assets/site.js`; research-paper carousels: `assets/research-carousel.js`.
- Portrait: `imgs/SC.jpg`; paper images: `imgs/papers/` and `imgs/research/`.
- Research image provenance: `docs/research-image-sources.md`.
- LinkedIn source records and verified posting dates: `docs/activity-sources.md`.

All 20 published/accepted papers are embedded in the HTML. JavaScript initially highlights six selected papers and enables topic filters; visitors without JavaScript can still read the entire list. Accepted papers are explicitly labelled. Citation metrics are a dated snapshot, not an automatic live count.

## Weekly maintenance

The owner authorised a weekly Codex thread automation, scheduled for Monday at 09:00 Europe/London. It checks the owner's public publication records, project repositories and LinkedIn posts; verifies authorship, dates and publication status; and publishes relevant, sourced updates after review and browser checks. It preserves concurrent edits, skips unverifiable claims, and makes no changes when there is no meaningful new material. This schedule runs through Codex rather than a GitHub Actions feed scraper. On-demand updates remain supported.

## Interaction

Each research area contains multiple genuine paper figures, full-size image links and publication sources. Its slideshow has a perspective paper stage, a non-interactive preview of the next paper, and coordinated outgoing/incoming depth transitions. Visible playback state and progress accompany manual arrows, paper selectors and pause/resume. Automatic playback continues while hovering or using persistent controls; focusing a paper link pauses it so focused content is retained. Hidden tabs, offscreen stages and reduced-motion preferences also pause playback. Without JavaScript all papers remain readable in sequence. Research, publication, activity and news entries retain brief, one-time scroll reveals.

## Preview

From this directory, run `python -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765/ . Stop it with Ctrl+C. Serve only this repository directory.

The published site lives at `/shuangchen/`. All asset paths are relative, and `_config.yml` preserves the existing GitHub Pages URL. `index.html` is a standalone static entry point; Jekyll does not need to process the page.

## Browser checks

With Node.js and Playwright available, run `node --test tests/site.test.cjs tests/motion.test.cjs tests/research-carousel.test.cjs`. On a new machine, install the development browser with `npm install --no-save playwright` and `npx playwright install chromium` first. Checks cover publication filters, keyboard controls, mobile overflow, local assets and anchors, static multi-paper reading, the production URL subpath, carousel rotation and pause behavior, motion preferences and animation API fallbacks.

## Design references

Information architecture was informed by [Jon Barron](https://jonbarron.info/), [Phillip Isola](https://web.mit.edu/phillipi/) and [Deepak Pathak](https://www.cs.cmu.edu/~dpathak/). Styling and implementation are original to this site. The previous homepage remains in Git history.
