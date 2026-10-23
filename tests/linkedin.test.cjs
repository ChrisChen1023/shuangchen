const { test } = require('node:test');
const assert = require('node:assert/strict');

const page = (data, extra = '') => `<html><head><script type="application/ld+json">${JSON.stringify(data)}</script></head><body>${extra}</body></html>`;
const own = {
  '@type': 'SocialMediaPosting',
  '@id': 'https://www.linkedin.com/posts/shuang-chen-a50163211_robots-activity-7600000000000000001-AbCd',
  datePublished: '2026-11-04T09:25:03.215Z',
  headline: 'Great to see our robots at the Durham science fair!',
  articleBody: 'Great to see our robots at the Durham science fair! Pupils asked sharp questions about AI &amp; robotics. https://lnkd.in/x\nThanks to everyone involved.',
  author: { name: 'Shuang Chen', url: 'https://uk.linkedin.com/in/shuang-chen-a50163211' },
  image: [{ url: 'https://media.licdn.com/dms/image/one.jpg' }, { url: 'https://media.licdn.com/dms/image/two.jpg' }]
};

test('parses a public post page', async () => {
  const { parsePost } = await import('../scripts/linkedin.mjs');
  const post = parsePost(page(own));
  assert.equal(post.activityId, '7600000000000000001');
  assert.equal(post.url, 'https://www.linkedin.com/posts/shuang-chen-a50163211_robots-activity-7600000000000000001-AbCd');
  assert.equal(post.date, '2026-11-04');
  assert.equal(post.authorSlug, 'shuang-chen-a50163211');
  assert.equal(post.body.split('\n')[0], 'Great to see our robots at the Durham science fair! Pupils asked sharp questions about AI & robotics. https://lnkd.in/x');
  assert.deepEqual(post.images, ['https://media.licdn.com/dms/image/one.jpg', 'https://media.licdn.com/dms/image/two.jpg']);
  assert.throws(() => parsePost('<html><body>Sign in to view</body></html>'), /No post data/);
});

test('accepts own posts and colleagues naming the owner, rejects duplicates and others', async () => {
  const { parsePost, assess } = await import('../scripts/linkedin.mjs');
  const existing = [{ url: 'https://www.linkedin.com/posts/shuang-chen-a50163211_x-activity-7600000000000000001-AbCd' }];
  assert.equal(assess(parsePost(page(own)), existing).ok, false, 'Duplicate by activity id');
  assert.equal(assess(parsePost(page(own)), []).ok, true);
  const colleague = { ...own, '@id': 'https://www.linkedin.com/posts/atapour_team-activity-7600000000000000002-Ef', author: { name: 'Amir Atapour Abarghouei', url: 'https://uk.linkedin.com/in/atapour' } };
  assert.equal(assess(parsePost(page({ ...colleague, articleBody: 'Well done Shuang Chen and the team.' })), []).ok, true);
  assert.equal(assess(parsePost(page({ ...colleague, articleBody: 'A post about something else.' })), []).ok, false);
});

test('drafts a complete English record with a category, date label and unique id', async () => {
  const { parsePost, draftRecord, categorise, parseQueue } = await import('../scripts/linkedin.mjs');
  const record = draftRecord(parsePost(page(own)), new Set(['great-to-see-our-robots-2026']), 'imgs/activity/x.jpg');
  assert.equal(record.id, 'great-to-see-our-robots-2026-2');
  assert.equal(record.dateLabel, '4 November 2026');
  assert.equal(record.category, 'Outreach');
  assert.equal(record.categoryZh, '科普');
  assert.equal(record.title, 'Great to see our robots at the Durham science fair', 'Titles drop the trailing punctuation');
  assert.equal(record.summary, 'Great to see our robots at the Durham science fair! Pupils asked sharp questions about AI & robotics.');
  assert.equal(record.titleZh, '');
  assert.deepEqual(categorise('Presenting at IROS next week'), { en: 'Conference', zh: '会议' });
  assert.deepEqual(parseQueue('# comment\n\nhttps://lnkd.in/p/abc \nhttps://www.linkedin.com/posts/x\n'), [{ line: 3, url: 'https://lnkd.in/p/abc' }, { line: 4, url: 'https://www.linkedin.com/posts/x' }]);
});
