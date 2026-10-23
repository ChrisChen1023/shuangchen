// Parsing, checks and drafting for LinkedIn post imports. No network access here; see import-linkedin.mjs.
export const OWNER_SLUG = 'shuang-chen-a50163211';
export const OWNER_NAME = 'Shuang Chen';

const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Reads the queue file: one URL per line, blank lines and # comments ignored.
export function parseQueue(text) {
  return text.split(/\r?\n/).map((line, index) => ({ line: index + 1, url: line.trim() })).filter(({ url }) => url && !url.startsWith('#'));
}

// Extracts the post from the public page's JSON-LD (a SocialMediaPosting with date, author, text and images).
export function parsePost(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => {
    try { return JSON.parse(match[1]); } catch { return null; }
  }).filter(Boolean);
  const data = blocks.find(block => block['@type'] === 'SocialMediaPosting' || (block.datePublished && block.articleBody));
  if (!data) throw new Error('No post data found on the page (sign-in wall or unexpected markup)');
  const canonical = String(data['@id'] || '').split('?')[0];
  const activityId = (canonical.match(/activity-(\d+)/) || html.match(/urn:li:activity:(\d+)/) || [])[1];
  if (!canonical || !activityId) throw new Error('Could not determine the canonical post URL');
  const authorUrl = String(data.author?.url || '');
  const authorSlug = (authorUrl.match(/\/in\/([^/?#]+)/) || [])[1] || '';
  const images = (Array.isArray(data.image) ? data.image : data.image ? [data.image] : []).map(image => typeof image === 'string' ? image : image.url).filter(Boolean);
  return {
    url: canonical, activityId,
    published: data.datePublished, date: String(data.datePublished || '').slice(0, 10),
    authorName: data.author?.name || '', authorSlug,
    headline: decode(String(data.headline || '')).trim(),
    body: decode(String(data.articleBody || '')).replace(/\r/g, '').trim(),
    images: [...new Set(images)]
  };
}

// A post is importable when it is the owner's own, or a colleague's post that names the owner.
export function assess(post, existing) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) return { ok: false, reason: 'no publication date' };
  if (existing.some(record => (record.url.match(/activity-(\d+)/) || [])[1] === post.activityId)) return { ok: false, reason: 'already on the site' };
  if (post.authorSlug === OWNER_SLUG) return { ok: true, reason: 'own post' };
  if (post.body.includes(OWNER_NAME)) return { ok: true, reason: `post by ${post.authorName} naming the owner` };
  return { ok: false, reason: `post by ${post.authorName || 'someone else'} that does not name the owner` };
}

const categories = [
  [/\b(ICRA|IROS|CVPR|ICCV|ECCV|AAAI|IJCNN|WACV|BMVC|MICCAI|NeurIPS|ICML|ICLR|EMNLP|conference|workshop|poster|keynote)\b/i, 'Conference', '会议'],
  [/\b(lecture|teaching|taught|students?|module|classroom)\b/i, 'Teaching', '教学'],
  [/\b(school|pupils|outreach|careers day|open day|summer school|stage|festival)\b/i, 'Outreach', '科普'],
  [/\b(visit|trip|field ?work|beamtime|synchrotron)\b/i, 'Research visit', '科研访问']
];
export function categorise(text) {
  for (const [pattern, en, zh] of categories) if (pattern.test(text)) return { en, zh };
  return { en: 'Update', zh: '动态' };
}

const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// The first line of the post (LinkedIn posts open with their point), without links or emoji, cut at a sentence boundary.
const firstSentences = (text, limit) => {
  const clean = text.split('\n')[0].replace(/https?:\/\/\S+/g, '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]?/g) || [clean];
  let out = '';
  for (const sentence of sentences) { if ((out + sentence).length > limit) break; out += sentence; }
  return (out || clean.slice(0, limit)).trim();
};

// A complete English record from the post itself; the daily session refines the copy and adds the Chinese fields.
export function draftRecord(post, usedIds, imagePath) {
  const year = post.date.slice(0, 4);
  const headline = post.headline.replace(/[.!?。！？]+$/, '');
  let id = slugify(headline.split(/\s+/).slice(0, 5).join(' ')) + '-' + year;
  let suffix = 2;
  while (usedIds.has(id)) id = `${slugify(headline.split(/\s+/).slice(0, 5).join(' '))}-${year}-${suffix++}`;
  const category = categorise(`${post.headline} ${post.body}`);
  const dateLabel = new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const title = headline.length > 70 ? headline.slice(0, 67).replace(/\s+\S*$/, '') + '…' : headline;
  const byline = post.authorSlug === OWNER_SLUG ? '' : ` Shared by ${post.authorName}.`;
  return {
    id, title, titleZh: '', date: post.date, dateLabel, category: category.en, categoryZh: category.zh,
    summary: firstSentences(post.body, 220) + byline, summaryZh: '',
    url: post.url, image: imagePath || null, imageAlt: imagePath ? `Photo from the LinkedIn post: ${title}` : ''
  };
}
