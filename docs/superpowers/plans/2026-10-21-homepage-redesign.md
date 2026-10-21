# Academic Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, accurate, accessible light academic homepage on the existing GitHub Pages URL.

**Architecture:** Static semantic HTML with CSS and progressive-enhancement JS. A dependency-free Node renderer embeds the publication JSON into HTML for no-JS readability. Keep existing images and deployment intact.

**Tech Stack:** HTML, CSS, browser JavaScript, Node built-in test runner; Playwright for real browser checks.

**Spec:** `docs/superpowers/specs/2026-10-21-homepage-redesign.md`

## Global Constraints

- GitHub Pages subpath `/shuangchen/`; all local assets relative.
- Light academic design; actual portrait/paper figures; no copied template.
- Use confirmed facts and dated metrics; distinguish accepted papers and future research.
- Public site excludes application/referee/proposal details.
- Keep every old publication discoverable; JS is an enhancement.

## Review Focus

- `/shuangchen/` deployment must resolve every local image/style/script.
- Filter combinations must preserve selected state and expose a useful empty state.
- Mobile widths down to 360px must have no horizontal overflow.
- No-JS visitors must retain all publications and contact information.
- Every accepted paper must remain explicitly labelled; no fabricated resource links.

### Task 1: Content and functional checks

Files: `data/publications.json`, `tests/site.test.cjs`.

- [ ] Define exact data schema and audit public content against latest CV.
- [ ] Write browser behavior checks first; run against existing site and confirm missing homepage behavior fails.

### Task 2: Page, rendering and interactions

Files: `index.html`, `assets/site.css`, `assets/site.js`, `scripts/render-publications.mjs`, `_config.yml`, `README.md`.

Consumes paper records: `{id,title,authors,venue,year,status,topics,selected,image,imageAlt,summary,links:[{label,url}]}`. Authors is a plain string, `topics` uses `vision`, `brain`, `robotics`, `applications`; `image` may be null; no link is invented.

- [ ] Implement biography, research, paper rows, news/archive, experience/education, teaching/outreach and contact.
- [ ] Render publications into HTML between explicit markers; escape content and use real relative asset paths.
- [ ] Add keyboard-accessible topic buttons and selected/all controls; only hide controls/content after JS initializes.
- [ ] Add responsive styles, reduced-motion handling and visible focus indicators.
- [ ] Run full browser checks; inspect desktop/mobile screenshots and fix layout defects.

### Task 3: Review and delivery

- [ ] Independent whole-change code/content review; resolve important issues.
- [ ] Run complete verification and diff check, then save a reviewable branch/PR through the connected GitHub account.
- [ ] Show preview and clarify final publication status. Attach any created PR to this chat.
