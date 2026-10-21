# Visual and LinkedIn update

User feedback: current site is too plain; keep the light academic direction but add more visual interest. User explicitly chose a one-time import of existing LinkedIn posts, followed by updates on demand; no scheduled synchronisation.

- Retain current verified biography, paper records, academic news and mobile/no-JS support.
- Add a pale blue/mint introduction, decorative code-native signal/node motif, differentiated research cards and a two-column Selected publications showcase. Keep All publications as readable rows.
- Read a small number of the user's own public LinkedIn posts. Import short attributed summaries and source links, with genuine post images where available. Do not include reactions, unrelated authors or reposts as the user's original posts. Do not invent posting dates or guess inaccessible post URLs.
- Store imported updates in `data/linkedin-posts.json`; render them statically using `scripts/render-activity.mjs`. Preserve keyboard controls and mobile responsiveness.
- Test selected/full layout switching and static LinkedIn reading, rerun all browser checks, visually inspect desktop/mobile, review the change, then sync through GitHub and verify the live site.
