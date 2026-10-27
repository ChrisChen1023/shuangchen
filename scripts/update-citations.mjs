// Refreshes citation figures from the owner's public Google Scholar profile.
// Usage: node scripts/update-citations.mjs [--dry-run] [--force] [--from-json <report.json>]
// --from-json applies figures read from the profile by other means (see README, "Citation refresh") when the direct
// fetch is blocked; the report is validated and matched exactly like a fetched page.
// Writes data/scholar.json, data/publications.json and docs/citation-sources.md, then re-renders index.html,
// but only when a figure, a snapshot year or the displayed snapshot month changed. Prints CHANGED=1 or CHANGED=0.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseProfile, matchEntries, validateReport } from './scholar.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force'); // rewrite the files even when nothing changed
const reportPath = process.argv.includes('--from-json') ? process.argv[process.argv.indexOf('--from-json') + 1] : null;
const scholarPath = path.join(root, 'data/scholar.json');
const papersPath = path.join(root, 'data/publications.json');
const docPath = path.join(root, 'docs/citation-sources.md');
const scholar = JSON.parse(await readFile(scholarPath, 'utf8'));
const papers = JSON.parse(await readFile(papersPath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);
const monthLabel = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const longDate = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// curl honours the environment's proxy settings; Node's fetch does not.
const url = `${scholar.profile}&hl=en&cstart=0&pagesize=100`;
const agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
// Printed when the direct fetch is blocked, so an operator (or the daily session) can take the fallback route.
const fallbackHint = `Fallback: do not retry curl or change the browser identity. Read the profile once through the WebFetch tool at ${url} with the prompt: Output ONLY a JSON object, no prose: {"totals": {"citations": <all-time Citations>, "hIndex": <all-time h-index>, "i10Index": <all-time i10-index>}, "entries": [{"title": "<exact title>", "citations": <cited-by count as integer, 0 if blank>, "year": "<year or empty>"}, ...]} listing every publication row in the order shown; if the page is a sign-in page, CAPTCHA or error, output {"error": "<what you see>"}. Save the JSON verbatim to a file and run: node scripts/update-citations.mjs --from-json <file>`;
let totals, entries;
if (reportPath) {
  ({ totals, entries } = validateReport(JSON.parse(await readFile(path.resolve(reportPath), 'utf8'))));
  console.log(`Using the profile report in ${reportPath} instead of fetching.`);
} else {
  let response;
  try {
    // Redirects are not followed: Scholar answers a rate-limited client with a redirect to its bot check, which is a failure here.
    response = execFileSync('curl', ['--fail', '--silent', '--show-error', '--max-time', '60', '-A', agent, '--write-out', '\n%{http_code} %{redirect_url}', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    console.error(`Scholar fetch failed: ${error.message.split('\n')[0]}\n${fallbackHint}`);
    process.exit(2);
  }
  const cut = response.lastIndexOf('\n');
  const [status, redirect] = response.slice(cut + 1).split(' ');
  if (status.startsWith('3')) {
    console.error(`Scholar redirected the request (${status} to ${redirect || 'an unknown page'}): this client is rate-limited or sent to a bot check.\n${fallbackHint}`);
    process.exit(2);
  }
  ({ totals, entries } = parseProfile(response.slice(0, cut)));
}
if (totals.citations === 0) { console.error('Scholar reports zero citations; refusing to update.'); process.exit(2); }

const { updates, unmatched } = matchEntries(papers, entries);
const changes = [];
for (const { paper, entry } of updates) {
  const count = entry.citations > 0 ? entry.citations : null;
  const asOf = count == null ? null : year;
  if (paper.citations !== count) changes.push(`${paper.id}: ${paper.citations ?? '—'} → ${count ?? '—'}`);
  else if (paper.citationsAsOf !== asOf) changes.push(`${paper.id}: snapshot year ${paper.citationsAsOf} → ${asOf}`);
  paper.citations = count;
  paper.citationsAsOf = asOf;
}
for (const key of ['citations', 'hIndex', 'i10Index']) {
  if (scholar[key] !== totals[key]) changes.push(`${key}: ${scholar[key]} → ${totals[key]}`);
}
if (monthLabel(scholar.asOf) !== monthLabel(today)) changes.push(`snapshot month: ${monthLabel(scholar.asOf)} → ${monthLabel(today)}`);

const matchedIds = new Set(updates.map(({ paper }) => paper.id));
const siteTitles = new Set(updates.map(({ entry }) => entry.title));
console.log(`Scholar profile: ${totals.citations} citations, h-index ${totals.hIndex}, i10-index ${totals.i10Index}; ${entries.length} entries, ${updates.length} matched.`);
if (unmatched.length) console.log(`Not on Scholar: ${unmatched.join(', ')}`);
const extra = entries.filter(entry => !siteTitles.has(entry.title)).map(entry => entry.title);
if (extra.length) console.log(`Scholar entries not on the site: ${extra.join(' | ')}`);
console.log(changes.length ? `Changes:\n  ${changes.join('\n  ')}` : 'No changes.');
console.log(`CHANGED=${changes.length ? 1 : 0}`);
if ((!changes.length && !force) || dryRun) process.exit(0);

Object.assign(scholar, totals, { asOf: today });
const counted = updates.filter(({ paper }) => paper.citations != null).sort((a, b) => b.paper.citations - a.paper.citations);
const uncounted = updates.filter(({ paper }) => paper.citations == null).map(({ paper }) => paper.id);
const block = [
  `Snapshot taken on ${longDate(today)} by \`scripts/update-citations.mjs\`${reportPath ? ' from a report of the profile page (direct fetch blocked that day)' : ''}: ${totals.citations} citations, h-index ${totals.hIndex}, i10-index ${totals.i10Index}.`,
  '',
  '| Record | Google Scholar entry | Citations |',
  '|---|---|---|',
  ...counted.map(({ paper, entry }) => `| ${paper.id} | ${entry.title.replace(/\|/g, '\\|')} | ${paper.citations} |`),
  '',
  `Listed on Scholar without a citation count: ${uncounted.length ? uncounted.join(', ') : 'none'}. Not yet indexed by Scholar: ${unmatched.length ? unmatched.join(', ') : 'none'}. Scholar entries outside the publication list are ignored: ${extra.length ? extra.map(title => `"${title}"`).join(', ') : 'none'}.`
].join('\n');
const doc = await readFile(docPath, 'utf8');
const markers = /<!-- SCHOLAR:START -->[\s\S]*?<!-- SCHOLAR:END -->/;
if (!markers.test(doc)) throw new Error('Scholar markers are missing from docs/citation-sources.md');
await writeFile(docPath, doc.replace(markers, `<!-- SCHOLAR:START -->\n${block}\n<!-- SCHOLAR:END -->`));
await writeFile(scholarPath, JSON.stringify(scholar, null, 2) + '\n');
await writeFile(papersPath, JSON.stringify(papers, null, 2) + '\n');
execFileSync(process.execPath, [path.join(root, 'scripts/render-publications.mjs')], { stdio: 'inherit' });
