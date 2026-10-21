import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const areas = JSON.parse(await readFile(path.join(root, 'data/research-areas.json'), 'utf8'));
const papers = JSON.parse(await readFile(path.join(root, 'data/publications.json'), 'utf8'));
const byId = new Map(papers.map(paper => [paper.id, paper]));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const venueNames = { 'IEEE Transactions on Multimedia': 'IEEE TMM' };
const seen = new Set();

const cards = [];
for (const area of areas) {
  if (!area.id || seen.has(area.id) || area.papers.length < 2) throw new Error(`Each distinct area needs multiple papers: ${area.id}`);
  seen.add(area.id);
  const paperIds = new Set();
  const slides = [];
  for (const item of area.papers) {
    const paper = byId.get(item.id);
    if (!paper || !paper.topics.includes(area.id) || paperIds.has(item.id)) throw new Error(`Invalid or duplicate paper in ${area.id}: ${item.id}`);
    paperIds.add(item.id);
    const primary = paper.links.find(link => link.label.toLowerCase() === 'paper');
    if (!paper.image || paper.image.startsWith('/') || paper.image.includes('..') || !paper.imageAlt || !primary || new URL(primary.url).protocol !== 'https:') throw new Error(`Missing sourced figure: ${item.id}`);
    await access(path.join(root, paper.image));
    const venue = `${venueNames[paper.venue] || paper.venue} ${paper.year}${item.id === 'sem-net' ? ' · Oral' : ''}`;
    slides.push(`            <figure class="research-slide research-figure" data-paper-id="${escape(item.id)}">
              <a class="research-image-link" href="${escape(paper.image)}" aria-label="View the ${escape(item.label)} figure at full size"><img src="${escape(paper.image)}" alt="${escape(paper.imageAlt)}" width="400" height="240" loading="lazy" decoding="async"></a>
              <figcaption><div class="research-paper-heading"><a href="${escape(primary.url)}" title="${escape(paper.title)}">${escape(item.label)} <span aria-hidden="true">↗</span></a><span>${escape(venue)}</span></div><span class="research-paper-caption">${escape(item.caption)}</span></figcaption>
            </figure>`);
  }
  const dots = area.papers.map((item, index) => `<button type="button" data-carousel-go="${index}" aria-label="Show ${escape(item.label)}" aria-current="${index === 0}"><span aria-hidden="true"></span></button>`).join('');
  cards.push(`        <article>
          <span class="research-index">${escape(area.index)}</span>
          <h3>${escape(area.title)}</h3>
          <div class="research-carousel" data-research-carousel data-carousel-interval="5200" role="group" aria-label="${escape(area.title)} papers">
            <div class="research-stage">
${slides.join('\n')}
              <div class="research-stage-preview" data-carousel-preview aria-hidden="true" inert hidden></div>
            </div>
            <div class="research-carousel-controls" hidden>
              <button type="button" class="carousel-arrow" data-carousel-prev aria-label="Previous paper"><span aria-hidden="true">←</span></button>
              <div class="research-carousel-dots">${dots}</div>
              <span class="research-carousel-count" data-carousel-count>1 / ${area.papers.length}</span>
              <button type="button" class="carousel-arrow" data-carousel-next aria-label="Next paper"><span aria-hidden="true">→</span></button>
              <button type="button" class="carousel-toggle" data-carousel-toggle aria-label="Pause automatic rotation">Pause</button>
            </div>
            <p class="sr-only" data-carousel-status role="status" aria-live="polite"></p>
          </div>
          <p><strong>${escape(area.lead)}</strong>${escape(area.description)}</p>
          <a class="text-link" href="${escape(area.link.url)}">${escape(area.link.label)} <span aria-hidden="true">↗</span></a>
        </article>`);
}

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- RESEARCH:START -->[\s\S]*?<!-- RESEARCH:END -->/;
if (!markers.test(original)) throw new Error('Research markers are missing from index.html');
await writeFile(indexPath, original.replace(markers, `<!-- RESEARCH:START -->\n${cards.join('\n')}\n        <!-- RESEARCH:END -->`));
console.log(`Rendered ${areas.length} research areas with ${areas.map(area => area.papers.length).join('/')} papers.`);
