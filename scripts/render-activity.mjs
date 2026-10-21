import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(await readFile(path.join(root, 'data/linkedin-posts.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const ids = new Set();
for (const post of posts) {
  if (!post.id || ids.has(post.id)) throw new Error(`Missing or duplicate activity id: ${post.id}`);
  ids.add(post.id);
  const source = new URL(post.url);
  if (source.protocol !== 'https:' || !/(^|\.)linkedin\.com$/.test(source.hostname)) throw new Error(`Expected a LinkedIn source URL: ${post.id}`);
  if (post.image && (post.image.startsWith('/') || post.image.includes('..') || post.image.includes(':'))) throw new Error(`Use a local relative activity image: ${post.id}`);
  if (post.image) await readFile(path.join(root, post.image));
}

const html = posts.map(post => {
  const media = post.image
    ? `<div class="activity-image"><img src="${escape(post.image)}" alt="${escape(post.imageAlt)}" width="640" height="400" loading="lazy" decoding="async"></div>`
    : `<div class="activity-visual"><span class="activity-platform">in</span><strong>${escape(post.category)}</strong><span>Research &amp; community</span></div>`;
  return `<article class="activity-card" id="activity-${escape(post.id)}">
  <a class="activity-image-link" href="${escape(post.url)}" tabindex="-1" aria-hidden="true">${media}</a>
  <div class="activity-copy">
    <p class="activity-meta"><span>${escape(post.category)}</span><time datetime="${escape(post.date)}">${escape(post.dateLabel)}</time></p>
    <h3><a href="${escape(post.url)}">${escape(post.title)}</a></h3>
    <p class="activity-summary">${escape(post.summary)}</p>
    <a class="activity-link" href="${escape(post.url)}">Read on LinkedIn <span aria-hidden="true">↗</span></a>
  </div>
</article>`;
}).join('\n').replace(/[ \t]+$/gm, '');

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- ACTIVITY:START -->[\s\S]*?<!-- ACTIVITY:END -->/;
if (!markers.test(original)) throw new Error('Activity markers are missing from index.html');
await writeFile(indexPath, original.replace(markers, `<!-- ACTIVITY:START -->\n${html}\n<!-- ACTIVITY:END -->`));
console.log(`Rendered ${posts.length} LinkedIn updates.`);
