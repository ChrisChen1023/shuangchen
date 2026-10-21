import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { icon } from './icons.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const papers = JSON.parse(await readFile(path.join(root, 'data/publications.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
// Broad areas (vision, brain, robotics, applications) group the research cards; the finer themes drive the topic filters.
const areaTopics = new Set(['vision', 'brain', 'robotics', 'applications']);
const filterTopics = new Map([
  ['inpainting', 'Image inpainting'],
  ['restoration', 'Restoration & enhancement'],
  ['snn', 'Spiking neural networks'],
  ['underwater', 'Underwater perception'],
  ['robotics', 'Robotics'],
  ['medical', 'Medical imaging'],
  ['vl', 'Vision & language'],
  ['video', 'Video & human understanding'],
  ['robust', 'Robustness & fairness'],
  ['art', 'Art & creativity'],
  ['interdisciplinary', 'Interdisciplinary']
]);
const knownTopics = new Set([...areaTopics, ...filterTopics.keys()]);
const ids = new Set();
for (const paper of papers) {
  if (!paper.id || ids.has(paper.id)) throw new Error(`Missing or duplicate publication id: ${paper.id}`);
  ids.add(paper.id);
  if (!['published', 'accepted'].includes(paper.status)) throw new Error(`Invalid publication status: ${paper.id}`);
  if (!paper.topics.every(topic => knownTopics.has(topic))) throw new Error(`Unknown topic: ${paper.id}`);
  if (!paper.topics.some(topic => filterTopics.has(topic))) throw new Error(`Every paper needs at least one filterable theme: ${paper.id}`);
  if (paper.image && (paper.image.startsWith('/') || paper.image.includes('..'))) throw new Error(`Use a local relative image path: ${paper.id}`);
  if (!Array.isArray(paper.metrics ?? [])) throw new Error(`metrics must be a list of short labels: ${paper.id}`);
  if (paper.citations != null && (!Number.isInteger(paper.citations) || paper.citations < 0 || !paper.citationsAsOf)) throw new Error(`citations needs a non-negative integer and a citationsAsOf year: ${paper.id}`);
  for (const link of paper.links) if (!['http:', 'https:'].includes(new URL(link.url).protocol)) throw new Error(`Unsupported resource URL: ${paper.id}`);
}

const identity = { 'vlif': 'Visual LIF', 'uiesnn': 'UIESNN', 'deep-sea': 'DEEP-SEA', 'micro-robots': 'Micro-robots', 'sem-net': 'SEM-Net', 'hint': 'HINT', 'cpvb-rg': 'CPVB-RG', 'sandbar': 'SandBAR', 'bumblebee-olfaction': 'Insect brains', 'bcqlm': 'BcQLM', 'boost': 'BOOST', 'caflow': 'CaFlow' };
const html = papers.map(paper => {
  const authors = escape(paper.authors).replaceAll('Shuang Chen', '<strong>Shuang Chen</strong>');
  const title = escape(paper.title);
  const primary = paper.links.find(link => link.label.toLowerCase() === 'paper');
  const media = paper.image
    ? `<img src="${escape(paper.image)}" alt="${escape(paper.imageAlt)}" width="400" height="240" loading="lazy" decoding="async">`
    : `<div class="publication-identity" aria-hidden="true"><strong>${escape(identity[paper.id] || paper.venue)}</strong><span>${escape(paper.venue)} · ${paper.year}</span></div>`;
  const links = paper.links.map(link => `<a class="resource-link" href="${escape(link.url)}">${icon(link.label)}<span>${escape(link.label)}</span></a>`).join('');
  // Venue standing (CORE rank, impact factor, acceptance) and a dated Google Scholar citation count.
  const chips = (paper.metrics ?? []).map(label => `<span class="metric-chip${/^(CORE|Impact Factor|JCR)/.test(label) ? '' : ' metric-chip-highlight'}">${escape(label)}</span>`);
  if (paper.citations != null) chips.push(`<span class="metric-chip metric-chip-citations" title="Google Scholar, ${escape(paper.citationsAsOf)}">${paper.citations} citation${paper.citations === 1 ? '' : 's'}</span>`);
  const metrics = chips.length ? `<p class="publication-metrics" aria-label="Venue standing and citations">${chips.join('')}</p>` : '';
  return `<article class="publication" id="paper-${escape(paper.id)}" data-selected="${paper.selected}" data-topics="${escape(paper.topics.join(' '))}">
  <figure class="publication-media">${media}</figure>
  <div class="publication-copy">
    <p class="publication-meta"><span>${escape(paper.venue)} · ${paper.year}</span>${paper.status === 'accepted' ? '<span class="accepted-label">Accepted</span>' : ''}${paper.id === 'sem-net' ? '<span class="accepted-label">Oral</span>' : ''}</p>
    <h3>${primary ? `<a href="${escape(primary.url)}">${title}</a>` : title}</h3>
    <p class="publication-authors">${authors}</p>
    ${metrics}
    <p class="publication-summary">${escape(paper.summary)}</p>
    ${links ? `<div class="publication-links">${links}</div>` : ''}
  </div>
</article>`;
}).join('\n').replace(/[ \t]+$/gm, '');

const topicButtons = ['<button type="button" data-topic="all" aria-pressed="true">All topics</button>', ...[...filterTopics]
  .map(([key, label]) => [key, label, papers.filter(paper => paper.topics.includes(key)).length])
  .filter(([, , count]) => count > 0)
  .map(([key, label, count]) => `<button type="button" data-topic="${key}" aria-pressed="false">${escape(label)}<span class="topic-count" aria-hidden="true">${count}</span></button>`)].join('');

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- PUBLICATIONS:START -->[\s\S]*?<!-- PUBLICATIONS:END -->/;
const topicMarkers = /<!-- TOPICS:START -->[\s\S]*?<!-- TOPICS:END -->/;
if (!markers.test(original) || !topicMarkers.test(original)) throw new Error('Publication or topic markers are missing from index.html');
await writeFile(indexPath, original
  .replace(markers, `<!-- PUBLICATIONS:START -->\n${html}\n<!-- PUBLICATIONS:END -->`)
  .replace(topicMarkers, `<!-- TOPICS:START -->${topicButtons}<!-- TOPICS:END -->`));
console.log(`Rendered ${papers.length} publications (${papers.filter(paper => paper.selected).length} selected).`);
