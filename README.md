# Shuang (Chris) Chen — academic homepage

Live site: https://chrischen1023.github.io/shuangchen/

A light, responsive academic website for computer vision, brain-inspired AI and robotic perception. Hosted on the existing GitHub Pages site with no frontend framework or production dependencies.

## Update content

- Biography, news, experience, education and teaching: edit `index.html` outside the publication markers.
- Publications: edit `data/publications.json`, then run `node scripts/render-publications.mjs` and commit both the JSON and generated `index.html`.
- LinkedIn field notes: edit `data/linkedin-posts.json`, add genuine post photos under `imgs/activity/`, then run `node scripts/render-activity.mjs` and commit the JSON, photos and generated `index.html`. This is a curated snapshot updated on demand, not an automatic feed or scheduled job.
- Styles: `assets/site.css`; publication filtering: `assets/site.js`.
- Portrait: `imgs/SC.jpg`; paper images: `imgs/papers/` and `imgs/research/`.
- Research image provenance: `docs/research-image-sources.md`.
- LinkedIn source records and verified posting dates: `docs/activity-sources.md`.

All 20 published/accepted papers are embedded in the HTML. JavaScript initially highlights six selected papers and enables topic filters; visitors without JavaScript can still read the entire list. Accepted papers are explicitly labelled. Citation metrics are a dated snapshot, not an automatic live count.

## Preview

From this directory, run `python -m http.server 8765 --bind 127.0.0.1` and open http://127.0.0.1:8765/ . Stop it with Ctrl+C. Serve only this repository directory.

The published site lives at `/shuangchen/`. All asset paths are relative, and `_config.yml` preserves the existing GitHub Pages URL. `index.html` is a standalone static entry point; Jekyll does not need to process the page.

## Browser checks

With Node.js and Playwright available, run `node --test tests/site.test.cjs`. On a new machine, install the development browser with `npm install --no-save playwright` and `npx playwright install chromium` first. Checks cover selected/all publication views, combined topic filters and empty states, keyboard controls, mobile overflow, local assets and anchors, no-JavaScript reading, and the production URL subpath.

## Design references

Information architecture was informed by [Jon Barron](https://jonbarron.info/), [Phillip Isola](https://web.mit.edu/phillipi/) and [Deepak Pathak](https://www.cs.cmu.edu/~dpathak/). Styling and implementation are original to this site. The previous homepage remains in Git history.
