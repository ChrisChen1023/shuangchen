# Publication and activity verification - 16 November 2026

The weekly check started from main `d0fac1e250c914637c5c8efbd1d9c4313e0e63e1`, retaining the 14 November citation refresh, 23 publications and nine activity records.

## Confirmed online publication

Changed the bumblebee olfactory anatomy paper from accepted to published and added the free full-text link. Its existing DOI and laboratory links are retained.

- PubMed: https://pubmed.ncbi.nlm.nih.gov/42992184/
- Machine-readable publication record: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=42992184&retmode=xml
- Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC13738290/
- Publisher DOI: https://doi.org/10.1016/j.isci.2026.118037

The PubMed XML was read directly, rather than treating a search excerpt as proof. It confirms the exact title, all ten authors and DOI, with Shuang Chen affiliated to Durham's Department of Computer Science. `PublicationStatus` is `epublish` and the electronic `ArticleDate` is **28 October 2026**. The separate issue date is **20 November 2026**. The news therefore says published **online**, uses the actual electronic-publication date, and makes no claim that the future issue date has passed. This resolves the uncertainty recorded in the two previous audits.

The renderer now translates the new Full text resource label into Chinese. Other publication entries and all authorship strings are unchanged.

## Checks without changes

- The actual Google Scholar profile was read with `scripts/update-citations.mjs --dry-run`: **310 citations, h-index 8, i10-index 8**, 19 profile entries and 18 matches. It reported `CHANGED=0`; the existing 14 November snapshot is preserved.
- The LinkedIn profile/activity list remains unavailable to signed-out requests. No new original post with a verified link and timestamp was found, and the queue is empty. Existing records and genuine photos are preserved; no third-party post is newly imported.
- Public Durham, arXiv and research-project sources supplied no additional verified new paper. The public owner-repository search found no newly pushed independent research repository after 9 November; the SandBAR release is unchanged from last week's update.
- No private application material, referee contact, unverified funding outcome or academic claim is published.

Publication/research rendering, browser tests, mobile and reduced-motion checks, and a generated-diff review precede publication. The deployed build and production page are checked after merging.
