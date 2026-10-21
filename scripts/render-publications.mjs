import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

// Small inline icons for each kind of resource; the text label stays for screen readers and clarity.
const icons = {
  paper: '<svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  code: '<svg class="link-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  video: '<svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor" stroke="none"/></svg>',
  link: '<svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>'
};
const icon = label => {
  const key = label.toLowerCase();
  if (key === 'paper') return icons.paper;
  if (key === 'code') return icons.code;
  if (key === 'video') return icons.video;
  return icons.link;
};

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
