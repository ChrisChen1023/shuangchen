# Academic homepage redesign

User-selected direction: light, simple, thoughtfully designed academic homepage.

Keep the site at `https://chrischen1023.github.io/shuangchen/` on GitHub Pages. Use a warm white background, dark ink, restrained blue/teal links, editorial typography, generous whitespace, and real research imagery. Preserve the existing portrait and publication assets. Reference the information hierarchy of Jon Barron and Phillip Isola; create original styling.

Structure: compact navigation; biography and portrait; three research directions; selected publications with topic filters and an expandable full list; recent news and older news archive; experience and education; teaching, supervision and outreach; contact/footer. Establish computer vision, brain-inspired computing and robotic perception immediately. Use the latest verified CV, with future directions explicitly described as goals. Metrics are user-confirmed 293 citations, h-index 8 and i10-index 8, dated October 2026. Accepted WACV 2027 papers stay labelled accepted. Do not publish referee details, unpublished proposal specifics, or the application CV. Retain older publications in the full list.

Architecture: dependency-free static HTML, CSS and small progressive-enhancement JavaScript. Paper records in `data/publications.json`; a Node script renders semantic paper rows into `index.html`, so all research remains readable without JavaScript. Relative asset URLs must work both at the root and `/shuangchen/`. No framework migration or third-party tracking is needed.

Verification: desktop and mobile render; keyboard controls; no horizontal overflow; complete local assets and anchors; paper filters, selected/all controls and clear empty state; content readable without JS; no browser errors; production subpath; application facts/status audit. Prepare a complete preview before deciding the final publishing step.

References: https://jonbarron.info/ ; https://web.mit.edu/phillipi/ ; https://www.cs.cmu.edu/~dpathak/
