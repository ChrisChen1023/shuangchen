# Publication verification — 2 November 2026

The weekly audit started from main `553b068`, preserving the concurrent citation refresh, 23 publication records, nine activity records and the existing site design.

## Verified changes

| Record | Change | Primary evidence |
|---|---|---|
| MASC-Pose | Accepted → published; add IEEE DOI alongside the arXiv paper link. | https://api.crossref.org/works/10.1109/IJCNN69854.2026.11728688 identifies the exact title as a proceedings article in IJCNN 2026, published June 2026, registered 19 October 2026, with all five canonical authors and Durham affiliations. https://dur.ac.uk/staff/shuang-chen/ corroborates the IEEE proceedings citation and DOI. |
| UIESNN | Add publisher DOI; keep published status and existing paper/code links. | https://api.crossref.org/works/10.1109/IJCNN69854.2026.11728918 matches title, six authors and IJCNN 2026; the owner's Durham profile also lists the DOI. |
| DEEP-SEA | Add publisher DOI; keep published status and existing paper/code links. | https://api.crossref.org/works/10.1109/IROS60139.2025.11246856 matches title, four authors and IROS 2025; the owner's Durham profile corroborates it. |
| Bumblebee olfactory anatomy | Add the newly verified paper DOI; retain accepted/in-press status. | https://api.crossref.org/works/10.1016/j.isci.2026.118037 matches the exact title and ten authors, with iScience 29(11), article 118037. Registered 28 October 2026. The DOI resolves successfully to Elsevier's article locator. |

Publisher links use the canonical `https://doi.org/` URLs. IEEE bot challenges limit automated reading of its article pages, but the publisher-deposited Crossref records are directly readable and confirm the metadata above.

## Conservative status and author handling

The iScience publisher API at https://api.elsevier.com/content/article/PII:S2589004226034206?httpAccept=text/xml gives an issue cover date of **20 November 2026**, which is still in the future, and did not establish a readable online-publication day. The owner's Durham profile still says in press. Its accepted status and news wording therefore remain unchanged. Crossref confirms the third author's given names are **W. Carolina**, so the existing **W. C. Gomez-Ramirez** initials are preserved. Crossref also confirms all five MASC-Pose authors, including Wenke E, despite that name being omitted from the abbreviated Durham staff citation.

## Checks with no changes

`node scripts/update-citations.mjs --dry-run` successfully read the public Scholar profile: **301 citations, h-index 8, i10-index 8**, 19 entries and 18 canonical matches. It reported `CHANGED=0`; the existing snapshot dated 1 November was retained. No unverified metrics were added.

No new original LinkedIn post was verified. Public profile/activity listing returned HTTP 999; the readable existing workshop post and search results supplied no new canonical original. The empty link queue and all nine existing records were preserved. The owner's public GitHub repository list supplied no new research release since the previous weekly check. No new paper rows or event-date claims were added.
