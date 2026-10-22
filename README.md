# Shuang (Chris) Chen — academic homepage

Live site: https://chrischen1023.github.io/shuangchen/

A light, responsive academic website for computer vision, brain-inspired AI and robotic perception. Hosted on the existing GitHub Pages site with no frontend framework or production dependencies.

## Update content

- Biography, news, experience, education and teaching: edit `index.html` outside the generated content markers.
- Publications: edit `data/publications.json` (`topics` mixes the broad areas `vision`/`brain`/`robotics`/`applications`, used by the research cards, with the finer themes that drive the topic filters and are defined in `scripts/render-publications.mjs`; each record can carry `metrics`, a list of short venue-standing labels such as `CORE A*` or `Impact Factor 9.7`, plus `citations` with a `citationsAsOf` year from Google Scholar; a venue longer than 16 characters needs a short form in `venueBadges` for the solid badge above its thumbnail), then run `node scripts/render-publications.mjs` and `node scripts/render-research.mjs`; commit the JSON and generated `index.html`.
- Research areas: edit `data/research-areas.json` and run `node scripts/render-research.mjs`. Each area references multiple existing publication IDs; images, alternative text, venues and paper links come from `data/publications.json`.
- LinkedIn field notes: edit `data/linkedin-posts.json`, add genuine post photos under `imgs/activity/`, then run `node scripts/render-activity.mjs` and commit the JSON, photos and generated `index.html`. Posts are verified and published as static summaries with original source links.
- Styles: `assets/site.css`; publication filtering, scroll reveals, header behaviour and the figure lightbox: `assets/site.js`; research-paper slideshows: `assets/research-carousel.js`.
- Fonts: `assets/fonts/` holds self-hosted Newsreader (headings) and Inter (body) subsets under the SIL Open Font License; see the README there. No third-party requests are made.
- Portrait: `imgs/SC.jpg`; paper images: `imgs/papers/` and `imgs/research/`. Keep figures at or below roughly 2400 px wide and a few hundred KB; `docs/research-image-sources.md` records any resizing.
- Supervision: edit the `#supervision` section in `index.html`. Student names and Durham profile links are taken from the owner's Durham staff profile (https://www.durham.ac.uk/staff/shuang-chen/, checked 22 October 2026); add a topic or paper note only when it is verifiable.
- Research image provenance: `docs/research-image-sources.md`.
- Citation snapshot provenance: `docs/citation-sources.md`.
- LinkedIn source records and verified posting dates: `docs/activity-sources.md`.

All 20 published/accepted papers are embedded in the HTML. JavaScript initially highlights six selected papers and enables topic filters; visitors without JavaScript can still read the entire list. Accepted papers are explicitly labelled. Citation metrics are a dated snapshot, not an automatic live count.

## Weekly maintenance

The owner authorised a weekly Codex thread automation, scheduled for Monday at 09:00 Europe/London. It checks the owner's public publication records, project repositories and LinkedIn posts; verifies authorship, dates and publication status; and publishes relevant, sourced updates after review and browser checks. It preserves concurrent edits, skips unverifiable claims, and makes no changes when there is no meaningful new material. This schedule runs through Codex rather than a GitHub Actions feed scraper. On-demand updates remain supported.

## Interaction

Each research area shows several genuine paper figures in a slideshow with a perspective paper stage, a non-interactive preview of the next paper and coordinated depth transitions, plus arrows, paper selectors and pause/resume; playback pauses for focused paper links, hidden tabs, offscreen stages and reduced motion, and without JavaScript all papers read in sequence. Clicking a figure opens it in a lightbox (`<dialog>`) with Escape, close-button and backdrop dismissal, while modified clicks and non-JavaScript visitors get the plain image link. Research, publication, activity, news, timeline and hero content have one-time staggered reveals (fade, rise and blur-to-sharp) driven by an IntersectionObserver and the Web Animations API with no persistent fill; citation metrics count up once; the header condenses on scroll and underlines the section in view; cards, links and buttons have short hover transitions. Baseline content stays visible if JavaScript, IntersectionObserver or animation APIs are unavailable, when printing, and for anyone with reduced motion enabled (including changes while the page is open); animations are cancelled around keyboard focus.

## Print and sharing

A print stylesheet (`@media print` in `assets/site.css`) hides the navigation and filter controls, shows all 20 publications in a compact list and prints link targets, so the page doubles as a simple CV-style PDF. Open Graph, Twitter card and JSON-LD `Person` metadata in `index.html` describe the page for search engines and link previews.

## Preview

From this directory, run `python -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765/ . Stop it with Ctrl+C. Serve only this repository directory.

The published site lives at `/shuangchen/`. All asset paths are relative, and `_config.yml` preserves the existing GitHub Pages URL. `index.html` is a standalone static entry point; Jekyll does not need to process the page.

## Browser checks

With Node.js and Playwright available, run `node --test tests/site.test.cjs tests/motion.test.cjs tests/enhancements.test.cjs tests/research-carousel.test.cjs` (each suite can also be run on its own). On a new machine, install the development browser with `npm install --no-save playwright` and `npx playwright install chromium` first. Checks cover selected/all publication views, combined topic filters and empty states, keyboard controls, mobile overflow, local assets and anchors, no-JavaScript reading including static multi-paper research areas, carousel rotation and pause behaviour, the production URL subpath, motion preferences and animation API fallbacks, self-hosted fonts with no external requests, the lightbox, the condensing header and section tracking, metric count-up and print/focus reveal shortcuts.

## Design references

Information architecture was informed by [Jon Barron](https://jonbarron.info/), [Phillip Isola](https://web.mit.edu/phillipi/) and [Deepak Pathak](https://www.cs.cmu.edu/~dpathak/). Styling and implementation are original to this site. The previous homepage remains in Git history.
