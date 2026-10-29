# Citation sources

Citation counts on the site are a dated snapshot of the owner's public Google Scholar profile, https://scholar.google.com/citations?user=tRLJ2X4AAAAJ , not a live feed. `data/scholar.json` holds the profile totals shown in the hero (citations, h-index, i10-index) and the snapshot date; each record in `data/publications.json` carries its own `citations` with a `citationsAsOf` year. Papers that Scholar lists without a count, or has not indexed, carry no count.

`node scripts/update-citations.mjs` reads the public profile page, updates both data files and the block below, and re-renders `index.html`; it writes nothing when no figure, snapshot year or displayed month changed, and refuses to update from a blocked or partial page. A scheduled task runs it daily (see the README). `--dry-run` only reports the differences.

<!-- SCHOLAR:START -->
Snapshot taken on 29 October 2026 by `scripts/update-citations.mjs`: 301 citations, h-index 8, i10-index 8.

| Record | Google Scholar entry | Citations |
|---|---|---|
| hint | Hint: High-quality inpainting transformer with mask-aware encoding and enhanced attention | 110 |
| sem-net | SEM-Net: efficient pixel modelling for image inpainting with spatially enhanced SSM | 47 |
| mxt | Mxt: Mamba x transformer for image inpainting | 39 |
| artistic-images-survey | Artificial intelligence for geometry-based feature extraction, analysis and synthesis in artistic images: a survey: M. Vijendran et al. | 28 |
| geohoi | Geometric features enhanced human–object interaction detection | 18 |
| daevi | Depth-aware endoscopic video inpainting | 11 |
| inclg | INCLG: Inpainting for non-cleft lip generation with a multi-task image processing network | 10 |
| nclg-mt | A feasibility study on image inpainting for non-cleft lip generation from patients with cleft lip | 10 |
| caflow | Caflow: Enhancing long-term action quality assessment with causal counterfactual flow | 8 |
| vlif | Exploring the Potentials of Spiking Neural Networks for Image Deraining | 6 |
| one-index | One-index vector quantization based adversarial attack on image classification | 5 |
| music-chatbots | Inclusive AI-driven music Chatbots for older adults | 3 |
| masc-pose | Motion-Adaptive Multi-Scale Temporal Modelling with Skeleton-Constrained Spatial Graphs for Efficient 3D Human Pose Estimation | 2 |
| deep-sea | Deep-sea: Deep-learning enhancement for environmental perception in submerged aquatics | 2 |
| micro-robots | Deep Learning-Enhanced Visual Monitoring in Hazardous Underwater Environments with a Swarm of Micro-Robots | 2 |

Listed on Scholar without a citation count: uiesnn, boost, bcqlm. Not yet indexed by Scholar: cpvb-rg, sandbar, expert-agent-routing, hstgformer, bumblebee-olfaction. Scholar entries outside the publication list are ignored: "Supplementary material-SEM-Net: Efficient Pixel Modelling for image inpainting with Spatially Enhanced SSM".
<!-- SCHOLAR:END -->
