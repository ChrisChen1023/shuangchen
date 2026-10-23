import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { icon } from './icons.mjs';
import { pair, text, zhMonth } from './l10n.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const papers = JSON.parse(await readFile(path.join(root, 'data/publications.json'), 'utf8'));
const scholar = JSON.parse(await readFile(path.join(root, 'data/scholar.json'), 'utf8'));
for (const key of ['citations', 'hIndex', 'i10Index']) if (!Number.isInteger(scholar[key]) || scholar[key] < 0) throw new Error(`data/scholar.json needs a non-negative integer ${key}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(scholar.asOf)) throw new Error('data/scholar.json needs an asOf date (YYYY-MM-DD)');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
// Broad areas (vision, brain, robotics, applications) group the research cards; the finer themes drive the topic filters.
const areaTopics = new Set(['vision', 'brain', 'robotics', 'applications']);
const filterTopicsZh = { inpainting: '图像修复', restoration: '复原与增强', snn: '脉冲神经网络', underwater: '水下感知', robotics: '机器人', medical: '医学影像', vl: '视觉与语言', video: '视频与人体理解', robust: '鲁棒性与公平', art: '艺术与创意', interdisciplinary: '交叉学科' };
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

// Short venue names for the solid badge above each thumbnail; venues already short enough are used as they are.
const venueBadges = { 'IEEE Transactions on Multimedia': 'IEEE TMM', 'IEEE Transactions on Instrumentation and Measurement': 'IEEE TIM', 'Expert Systems with Applications': 'ESWA', 'Findings of EMNLP': 'EMNLP Findings', 'Engineering Interactive Computer Systems: EICS 2024 International Workshops': 'EICS Workshops', 'Artificial Intelligence Review': 'AI Review', 'Pattern Recognition Letters': 'PRL', 'IEEE-EMBS BHI': 'IEEE BHI', 'MFM4Health Workshop, BMVC': 'BMVC Workshop' };
const linkLabelsZh = { paper: '论文', code: '代码', video: '视频', poster: '海报', project: '项目', slides: '幻灯片', dataset: '数据集' };
// Venue-standing chips that read differently in Chinese; ranks and quartiles stay as they are.
const chipZh = label => label.replace(/^([\d.]+)% acceptance$/, '录用率 $1%').replace(/^Oral · top ([\d.]+)% of ([\d,]+)$/, '口头报告 · $2 篇中前 $1%').replace(/^Impact Factor /, '影响因子 ');
const identity = { 'vlif': 'Visual LIF', 'uiesnn': 'UIESNN', 'deep-sea': 'DEEP-SEA', 'micro-robots': 'Micro-robots', 'sem-net': 'SEM-Net', 'hint': 'HINT', 'cpvb-rg': 'CPVB-RG', 'sandbar': 'SandBAR', 'bumblebee-olfaction': 'Insect brains', 'bcqlm': 'BcQLM', 'boost': 'BOOST', 'caflow': 'CaFlow', 'expert-agent-routing': 'Expert routing' };
const html = papers.map(paper => {
  const authors = escape(paper.authors).replaceAll('Shuang Chen', '<strong>Shuang Chen</strong>');
  const title = escape(paper.title);
  const primary = paper.links.find(link => link.label.toLowerCase() === 'paper');
  const media = paper.image
    ? `<img src="${escape(paper.image)}" alt="${escape(paper.imageAlt)}" width="400" height="240" loading="lazy" decoding="async">`
    : `<div class="publication-identity" aria-hidden="true"><strong>${escape(identity[paper.id] || paper.venue)}</strong><span>${escape(paper.venue)} · ${paper.year}</span></div>`;
  const badge = venueBadges[paper.venue] ?? paper.venue;
  if (badge.length > 16) throw new Error(`Add a short venue badge for: ${paper.venue}`);
  const links = paper.links.map(link => `<a class="resource-link" href="${escape(link.url)}">${icon(link.label)}<span>${text(link.label, linkLabelsZh[link.label.toLowerCase()])}</span></a>`).join('');
  // Venue standing (CORE rank, impact factor, acceptance) and a dated Google Scholar citation count.
  const chips = (paper.metrics ?? []).map(label => `<span class="metric-chip${/^(CORE|Impact Factor|JCR)/.test(label) ? '' : ' metric-chip-highlight'}">${text(label, chipZh(label) === label ? '' : chipZh(label))}</span>`);
  if (paper.citations != null) chips.push(`<span class="metric-chip metric-chip-citations" title="Google Scholar, ${escape(paper.citationsAsOf)}">${pair(`${paper.citations} citation${paper.citations === 1 ? '' : 's'}`, `引用 ${paper.citations} 次`)}</span>`);
  const metrics = chips.length ? `<p class="publication-metrics" aria-label="Venue standing and citations">${chips.join('')}</p>` : '';
  return `<article class="publication" id="paper-${escape(paper.id)}" data-selected="${paper.selected}" data-topics="${escape(paper.topics.join(' '))}">
  <div class="publication-visual"><span class="venue-badge">${escape(badge)}</span><figure class="publication-media">${media}</figure></div>
  <div class="publication-copy">
    <p class="publication-meta"><span><span class="venue-name">${escape(paper.venue)}</span><span class="venue-short">${escape(badge)}</span> · ${paper.year}</span>${paper.status === 'accepted' ? `<span class="accepted-label">${pair('Accepted', '已录用')}</span>` : ''}${paper.id === 'sem-net' ? `<span class="accepted-label">${pair('Oral', '口头报告')}</span>` : ''}</p>
    <h3>${primary ? `<a href="${escape(primary.url)}">${title}</a>` : title}</h3>
    <p class="publication-authors">${authors}</p>
    ${metrics}
    <p class="publication-summary">${text(paper.summary, paper.summaryZh)}</p>
    ${links ? `<div class="publication-links">${links}</div>` : ''}
  </div>
</article>`;
}).join('\n').replace(/[ \t]+$/gm, '');

const topicButtons = [`<button type="button" data-topic="all" aria-pressed="true">${pair('All topics', '全部主题')}</button>`, ...[...filterTopics]
  .map(([key, label]) => [key, label, papers.filter(paper => paper.topics.includes(key)).length])
  .filter(([, , count]) => count > 0)
  .map(([key, label, count]) => `<button type="button" data-topic="${key}" aria-pressed="false">${text(label, filterTopicsZh[key])}<span class="topic-count" aria-hidden="true">${count}</span></button>`)].join('');

// Hero metrics: profile totals and the snapshot month from data/scholar.json.
const snapshotMonth = new Date(`${scholar.asOf}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const metrics = `<dl class="metrics">
          <div><dt>${pair('Citations', '引用')}</dt><dd>${scholar.citations}</dd></div>
          <div><dt>h-index</dt><dd>${scholar.hIndex}</dd></div>
          <div><dt>i10-index</dt><dd>${scholar.i10Index}</dd></div>
        </dl>
        <p class="metrics-source">${pair(`Google Scholar · ${snapshotMonth}`, `Google Scholar · ${zhMonth(scholar.asOf)}`)}</p>`;

const indexPath = path.join(root, 'index.html');
const original = await readFile(indexPath, 'utf8');
const markers = /<!-- PUBLICATIONS:START -->[\s\S]*?<!-- PUBLICATIONS:END -->/;
const topicMarkers = /<!-- TOPICS:START -->[\s\S]*?<!-- TOPICS:END -->/;
const metricMarkers = /<!-- METRICS:START -->[\s\S]*?<!-- METRICS:END -->/;
if (!markers.test(original) || !topicMarkers.test(original) || !metricMarkers.test(original)) throw new Error('Publication, topic or metrics markers are missing from index.html');
await writeFile(indexPath, original
  .replace(markers, `<!-- PUBLICATIONS:START -->\n${html}\n<!-- PUBLICATIONS:END -->`)
  .replace(topicMarkers, `<!-- TOPICS:START -->${topicButtons}<!-- TOPICS:END -->`)
  .replace(metricMarkers, `<!-- METRICS:START -->\n        ${metrics}\n        <!-- METRICS:END -->`));
console.log(`Rendered ${papers.length} publications (${papers.filter(paper => paper.selected).length} selected).`);
