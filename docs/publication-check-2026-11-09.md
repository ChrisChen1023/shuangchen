# Publication and activity verification - 9 November 2026

The weekly check started from main `7319b161226c3a3d7f0dd50744cf94d924461c5e`, preserving the latest citation refresh and the existing 23 publications and nine activity records.

## Verified addition

SandBAR's official author repository now supplies the paper, implementation and pretrained model:

- Repository and author statement: https://github.com/YanziLiu/SandBAR
- Paper: https://github.com/YanziLiu/SandBAR/blob/main/papers/2026411507.pdf
- Model release: https://github.com/YanziLiu/SandBAR/releases/tag/v1.0.1

The README and paper identify the same five authors as the existing record: Yanzi Liu, Haoran Hou, Jiachi Tong, Shen Chen and Shuang Chen. The paper identifies Shuang Chen's Department of Computer Science affiliation at Durham University, confirming identity. The release API records v1.0.1 at **31 October 2026, 21:12:27 UTC**. The news item's machine-readable date is the resource-release date, not the maintenance date or the conference date.

Added Paper, Code and Models links to the existing publication and a bilingual resource-release news item. The WACV news wording also follows the owner's request to say "two papers" rather than "two collaborative papers". No acceptance status is inferred from a search result or preprint; SandBAR's existing WACV 2027 accepted status is unchanged.

## Checks without changes

- `node scripts/update-citations.mjs --dry-run` read the actual Scholar profile: **304 citations, h-index 8, i10-index 8**, with 19 entries and 18 canonical matches. It reported `CHANGED=0`; the existing 6 November snapshot is retained.
- The LinkedIn profile/activity list remains unavailable to signed-out access. No new original post with a verified URL and publication date was found; the link queue is empty. Existing records and photos are preserved, and no third-party post is newly imported.
- The public Durham profile, public project repositories and arXiv records were checked. No additional publication with verified identity and status was identified. Existing CPVB-RG, HSTGFormer and clinical-routing records are retained.
- The iScience Crossref record still has no online-publication day; the previous check established an issue cover date of 20 November 2026. Accepted/in-press wording is retained while an actual publication event remains unverified.
- No application documents, referee contacts, unverified grants or private research claims are added.

The publication and research render scripts were run. Validation includes publication filtering, mobile layouts and reduced-motion behavior, followed by a review of the generated diff and the production deployment.
