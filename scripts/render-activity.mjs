import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pair, text, zhDate } from './l10n.mjs';

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
    : `<div class="activity-visual"><span class="activity-platform">in</span><strong>${text(post.category, post.categoryZh)}</strong><span>${pair('Research &amp; community', '研究与社区')}</span></div>`;
  return `<article class="activity-card" id="activity-${escape(post.id)}">
  <a class="activity-image-link" href="${escape(post.url)}" tabindex="-1" aria-hidden="true">${media}</a>
  <div class="activity-copy">
    <p class="activity-meta"><span>${text(post.category, post.categoryZh)}</span><time datetime="${escape(post.date)}">${text(post.dateLabel, zhDate(post.date))}</time></p>
    <h3><a href="${escape(post.url)}">${text(post.title, post.titleZh)}</a></h3>
    <p class="activity-summary">${text(post.summary, post.summaryZh)}</p>
    <a class="activity-link" href="${escape(post.url)}"><svg class="link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg><span>${pair('Read on LinkedIn', '在 LinkedIn 阅读')}</span></a>
  </div>
</article>`;
}).join('\n').replace(/[ \t]+$/gm, '');

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- ACTIVITY:START -->[\s\S]*?<!-- ACTIVITY:END -->/;
if (!markers.test(original)) throw new Error('Activity markers are missing from index.html');
await writeFile(indexPath, original.replace(markers, `<!-- ACTIVITY:START -->\n${html}\n<!-- ACTIVITY:END -->`));
console.log(`Rendered ${posts.length} LinkedIn updates.`);
