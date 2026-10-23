// Imports LinkedIn posts listed in data/linkedin-queue.txt into the field notes.
// Usage: node scripts/import-linkedin.mjs [--dry-run]
// For each link: resolves redirects, reads the public post page, checks the author and date, downloads the photos,
// drafts an English record in data/linkedin-posts.json, records the source in docs/activity-sources.md, removes the
// link from the queue and re-renders index.html. Links that cannot be fetched stay in the queue for the next run.
// Prints IMPORTED=<n>. The photos of each imported post are kept in a temporary folder (printed) so the best one can be chosen.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseQueue, parsePost, assess, draftRecord } from './linkedin.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const queuePath = path.join(root, 'data/linkedin-queue.txt');
const postsPath = path.join(root, 'data/linkedin-posts.json');
const docPath = path.join(root, 'docs/activity-sources.md');
const agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const curl = (args, options = {}) => execFileSync('curl', ['--fail', '--silent', '--show-error', '--max-time', '60', '-A', agent, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...options });
const hasConvert = (() => { try { execFileSync('convert', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

const queueText = await readFile(queuePath, 'utf8');
const entries = parseQueue(queueText);
if (!entries.length) { console.log('Queue is empty.'); console.log('IMPORTED=0'); process.exit(0); }
const posts = JSON.parse(await readFile(postsPath, 'utf8'));
const usedIds = new Set(posts.map(post => post.id));
const seen = new Set();
const done = new Set();
const imported = [];
const notes = [];

for (const { line, url } of entries) {
  let resolved;
  try {
    resolved = /linkedin\.com\/(posts|feed\/update)\//.test(url) ? url : curl(['--location', '--output', process.platform === 'win32' ? 'NUL' : '/dev/null', '--write-out', '%{url_effective}', url]).trim();
  } catch (error) {
    notes.push(`line ${line}: could not resolve ${url} (${error.message.split('\n')[0]}); left in the queue. Short lnkd.in links need lnkd.in in the allowed domains, or paste the full linkedin.com/posts link.`);
    continue;
  }
  let post;
  try { post = parsePost(curl(['--location', resolved.split('?')[0]])); }
  catch (error) { notes.push(`line ${line}: could not read ${resolved} (${error.message.split('\n')[0]}); left in the queue.`); continue; }
  if (seen.has(post.activityId)) { done.add(url); continue; }
  seen.add(post.activityId);
  const verdict = assess(post, posts);
  if (!verdict.ok) { notes.push(`line ${line}: skipped ${post.url} — ${verdict.reason}.`); done.add(url); continue; }

  const folder = path.join(tmpdir(), 'shuangchen-linkedin', post.activityId);
  await mkdir(folder, { recursive: true });
  const photos = [];
  post.images.forEach((image, index) => {
    const file = path.join(folder, `${index + 1}.jpg`);
    try { curl(['--location', '--output', file, image]); photos.push(file); } catch (error) { notes.push(`photo ${index + 1} of ${post.url} failed: ${error.message.split('\n')[0]}`); }
  });
  const preliminary = draftRecord(post, usedIds, null);
  let imagePath = null;
  if (photos.length) {
    imagePath = `imgs/activity/${preliminary.id}.jpg`;
    if (!dryRun) {
      const target = path.join(root, imagePath);
      if (hasConvert) execFileSync('convert', [photos[0], '-auto-orient', '-strip', '-resize', '1536x1536>', '-quality', '85', '-interlace', 'Plane', target]);
      else await copyFile(photos[0], target);
    }
  }
  const record = { ...preliminary, image: imagePath, imageAlt: imagePath ? `Photo from the LinkedIn post: ${preliminary.title}` : '' };
  usedIds.add(record.id);
  posts.push(record);
  imported.push({ record, post, photos, folder });
  done.add(url);
}

posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
for (const { record, post, photos, folder } of imported) {
  console.log(`\n=== Imported ${record.id} (${post.authorName}, ${post.published})\nURL: ${post.url}\nCategory: ${record.category}\nTitle: ${record.title}\nSummary: ${record.summary}\nPhotos (${photos.length}) in ${folder}${record.image ? `; using ${record.image}` : ''}\n--- Post text ---\n${post.body}\n---`);
}
for (const note of notes) console.log(`Note: ${note}`);
console.log(`IMPORTED=${imported.length}`);
if (dryRun || !imported.length && !done.size) process.exit(0);

if (imported.length) {
  await writeFile(postsPath, JSON.stringify(posts, null, 2) + '\n');
  const doc = await readFile(docPath, 'utf8');
  const marker = '<!-- QUEUE:END -->';
  if (!doc.includes(marker)) throw new Error('Queue markers are missing from docs/activity-sources.md');
  const rows = imported.map(({ record, post }) => `| ${record.id} | ${post.authorName} | ${post.published} | ${post.url} |`).join('\n');
  await writeFile(docPath, doc.replace(marker, `${rows}\n${marker}`));
}
const remaining = queueText.split(/\r?\n/).filter(line => !done.has(line.trim()));
await writeFile(queuePath, remaining.join('\n').replace(/\n*$/, '\n'));
if (imported.length) execFileSync(process.execPath, [path.join(root, 'scripts/render-activity.mjs')], { stdio: 'inherit' });
