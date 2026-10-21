# Citation sources

Citation counts on the site are a dated snapshot of the owner's public Google Scholar profile, https://scholar.google.com/citations?user=tRLJ2X4AAAAJ , not a live feed. The profile totals in the hero (293 citations, h-index 8, i10-index 8) and the per-paper counts below were read from the public profile page on 21 October 2026 and are labelled "2026" in `data/publications.json` (`citationsAsOf`).

| Record | Google Scholar entry | Citations |
|---|---|---|
| hint | Hint: High-quality inpainting transformer with mask-aware encoding and enhanced attention | 107 |
| sem-net | SEM-Net: efficient pixel modelling for image inpainting with spatially enhanced SSM | 46 |
| mxt | Mxt: Mamba x transformer for image inpainting | 39 |
| artistic-images-survey | Artificial intelligence for geometry-based feature extraction, analysis and synthesis in artistic images: a survey | 25 |
| geohoi | Geometric features enhanced human–object interaction detection | 18 |
| daevi | Depth-aware endoscopic video inpainting | 10 |
| inclg | INCLG: Inpainting for non-cleft lip generation with a multi-task image processing network | 10 |
| nclg-mt | A feasibility study on image inpainting for non-cleft lip generation from patients with cleft lip | 10 |
| caflow | Caflow: Enhancing long-term action quality assessment with causal counterfactual flow | 8 |
| vlif | Exploring the Potentials of Spiking Neural Networks for Image Deraining | 6 |
| one-index | One-index vector quantization based adversarial attack on image classification | 5 |
| music-chatbots | Inclusive AI-driven music Chatbots for older adults | 3 |
| deep-sea | Deep-sea: Deep-learning enhancement for environmental perception in submerged aquatics | 2 |
| micro-robots | Deep Learning-Enhanced Visual Monitoring in Hazardous Underwater Environments with a Swarm of Micro-Robots | 2 |

Entries that Google Scholar lists without a citation count (UIESNN, BOOST, BcQLM) and papers not yet indexed (CPVB-RG, SandBAR, the bumblebee olfaction paper) carry no count. The Scholar entry for the SEM-Net supplementary material and an arXiv preprint not in the publication list are ignored.

To refresh: open the profile page, update `citations` and `citationsAsOf` in `data/publications.json` and the three hero figures in `index.html`, run `node scripts/render-publications.mjs`, and extend this table.
