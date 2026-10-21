# LinkedIn field notes

The site owner initially requested an import of existing LinkedIn posts, then authorised weekly checks on 21 October 2026. A Codex thread automation checks public sources every Monday at 09:00 Europe/London and can publish verified additions after review and browser checks. These remain curated static summaries, with original source links; on-demand updates are also supported. No LinkedIn account credential is used.

Five original posts were publicly accessible and verified against the owner's profile. Posting dates came from each post's public JSON-LD `datePublished`; the local photos were obtained from those same public post pages. Summaries are newly written and concise. Reposts, likes and unrelated namesakes are excluded.

| Record | Publication timestamp (UTC) | Original post |
|---|---|---|
| Computer Vision teaching | 2026-03-03T00:15:32.189Z | https://www.linkedin.com/posts/shuang-chen-a50163211_i-had-the-pleasure-of-delivering-computer-activity-7434390972735688705-jTg_ |
| AAAI 2026 | 2026-01-25T15:33:58.916Z | https://www.linkedin.com/posts/shuang-chen-a50163211_slay-another-dragon-happy-to-attend-activity-7421213756128411649-TS0a |
| Diamond Light Source | 2025-12-15T16:10:49.967Z | https://www.linkedin.com/posts/shuang-chen-a50163211_diamond-trip-finished-diamond-light-source-activity-7406365127437987840-BUrH |
| Deep Learning guest lecture | 2025-11-01T21:10:55.747Z | https://www.linkedin.com/posts/shuang-chen-a50163211_excited-to-share-that-this-friday-i-was-invited-activity-7390495583091867648-xfMt |
| IROS 2025 | 2025-10-26T21:35:34.493Z | https://www.linkedin.com/posts/shuang-chen-a50163211_iros2025-activity-7388327458221113344-LMhl |

Other activities appeared in public search excerpts, but their original URLs and dates were not verified and they have not been imported. Additional user-supplied post links can be added to `data/linkedin-posts.json` after verification.

The user supplied the Diamond feed URL and two short links. Opening those short links in a normal public browser resolved `https://lnkd.in/p/eXDYCUgj` to the already-imported Computer Vision post (deduplicated), and `https://lnkd.in/p/eCXCRDTe` to the Deep Learning post. Only clean canonical post URLs are stored; share-tracking parameters are omitted. The dates above are posting dates, not independently inferred dates of the pictured events.
