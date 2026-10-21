# Multiple-paper research carousels

The owner clarified that every Research area should show multiple works and that the cards should keep moving dynamically. Replace each single-figure panel with a real automatic paper carousel, preserving the existing light academic styling.

- Computer vision: HINT, SEM-Net and DAEVI. Brain-inspired AI: Visual LIF and UIESNN. Robotic perception: micro-robot monitoring, DEEP-SEA and UIESNN.
- Reference canonical publication records from `data/research-areas.json`; statically render complete figures, labels, explanatory captions and source links through `scripts/render-research.mjs`.
- Rotate visible cards roughly every five seconds, staggered across areas. Move arriving slides horizontally; provide previous/next buttons, direct paper selectors, a position counter and pause/resume control.
- Pause on hover, focus, offscreen content and hidden tabs. Honour reduced motion at load and runtime, retaining manual navigation. With JavaScript disabled, all papers remain readable.
- Verify automatic content changes, manual control, pause/resume, multiple independent carousels, reduced motion, fallback APIs, no-JavaScript reading and mobile layout. Inspect more than the first slide, review independently, then publish and verify the live site.
