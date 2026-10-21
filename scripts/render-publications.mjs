import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const papers = JSON.parse(await readFile(path.join(root, 'data/publications.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const knownTopics = new Set(['vision', 'brain', 'robotics', 'applications']);
const ids = new Set();
for (const paper of papers) {
  if (!paper.id || ids.has(paper.id)) throw new Error(`Missing or duplicate publication id: ${paper.id}`);
  ids.add(paper.id);
  if (!['published', 'accepted'].includes(paper.status)) throw new Error(`Invalid publication status: ${paper.id}`);
  if (!paper.topics.every(topic => knownTopics.has(topic))) throw new Error(`Unknown topic: ${paper.id}`);
  if (paper.image && (paper.image.startsWith('/') || paper.image.includes('..'))) throw new Error(`Use a local relative image path: ${paper.id}`);
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
  const links = paper.links.map(link => `<a href="${escape(link.url)}">${escape(link.label)} <span aria-hidden="true">↗</span></a>`).join('');
  return `<article class="publication" id="paper-${escape(paper.id)}" data-selected="${paper.selected}" data-topics="${escape(paper.topics.join(' '))}">
  <figure class="publication-media">${media}</figure>
  <div class="publication-copy">
    <p class="publication-meta"><span>${escape(paper.venue)} · ${paper.year}</span>${paper.status === 'accepted' ? '<span class="accepted-label">Accepted</span>' : ''}${paper.id === 'sem-net' ? '<span class="accepted-label">Oral</span>' : ''}</p>
    <h3>${primary ? `<a href="${escape(primary.url)}">${title}</a>` : title}</h3>
    <p class="publication-authors">${authors}</p>
    <p class="publication-summary">${escape(paper.summary)}</p>
    ${links ? `<div class="publication-links">${links}</div>` : ''}
  </div>
</article>`;
}).join('\n').replace(/[ \t]+$/gm, '');

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- PUBLICATIONS:START -->[\s\S]*?<!-- PUBLICATIONS:END -->/;
if (!markers.test(original)) throw new Error('Publication markers are missing from index.html');
await writeFile(indexPath, original.replace(markers, `<!-- PUBLICATIONS:START -->\n${html}\n<!-- PUBLICATIONS:END -->`));
console.log(`Rendered ${papers.length} publications (${papers.filter(paper => paper.selected).length} selected).`);
