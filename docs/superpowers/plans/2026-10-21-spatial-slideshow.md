# Spatial research slideshow

The owner asked for automatic slideshow playback and more spatial depth. Previous rotation was implemented, but its whole-carousel hover and focus pause rules made playback look stopped when the pointer or a clicked control stayed inside.

- Retain the existing three areas and 3/2/3 verified papers.
- Build a perspective stage: current paper in front, a smaller angled preview of the actual next paper behind it, and paper shadows. Keep scientific figures complete.
- Coordinate the departing paper moving toward the side/back with the arriving paper moving into the foreground, for about 800 ms. Clones are decorative, inert and hidden from assistive technology.
- Continue timed playback while hovering and after using persistent controls. Pause explicitly, when a real paper link receives keyboard focus, while offscreen or hidden, or for reduced motion.
- Show playback state and a progress bar tied to the same timer. Preserve no-JavaScript reading, manual controls, focus, and clean cancellation during rapid navigation or preference changes.
- Verify regressions first, then automatic motion on the actual page, desktop/mobile geometry, all existing browser checks, independent review and the live deployment.
