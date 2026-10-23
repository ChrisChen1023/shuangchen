// Parsing and matching for the public Google Scholar profile page. No network access here; see update-citations.mjs.
const decode = value => value
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const text = html => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
export const normalise = title => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Reads the statistics table (all-time and recent values in pairs: citations, h-index, i10-index) and the publication rows.
export function parseProfile(html) {
  const stats = [...html.matchAll(/gsc_rsb_std">(\d+)</g)].map(match => Number(match[1]));
  if (stats.length < 6) throw new Error('Scholar statistics table not found; the profile page may have been blocked or changed');
  const totals = { citations: stats[0], hIndex: stats[2], i10Index: stats[4] };
  const entries = [...html.matchAll(/<tr class="gsc_a_tr">([\s\S]*?)<\/tr>/g)].map(([, row]) => {
    const title = row.match(/class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/);
    if (!title) return null;
    const count = row.match(/class="gsc_a_ac[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const year = row.match(/class="gsc_a_h[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    const cited = count ? text(count[1]) : '';
    return { title: text(title[1]), citations: /^\d+$/.test(cited) ? Number(cited) : 0, year: year ? text(year[1]) : '' };
  }).filter(Boolean);
  if (entries.length < 10) throw new Error(`Only ${entries.length} Scholar entries parsed; refusing to update from a partial page`);
  return { totals, entries };
}

// Pairs site publications with Scholar entries by normalised title, falling back to a long shared prefix for re-cased or truncated titles.
export function matchEntries(papers, entries) {
  const byTitle = new Map(entries.map(entry => [normalise(entry.title), entry]));
  const updates = [];
  const unmatched = [];
  for (const paper of papers) {
    const key = normalise(paper.title);
    let entry = byTitle.get(key);
    if (!entry) {
      const prefix = key.slice(0, 40);
      const candidates = entries.filter(candidate => normalise(candidate.title).slice(0, 40) === prefix);
      if (candidates.length === 1) entry = candidates[0];
    }
    if (entry) updates.push({ paper, entry }); else unmatched.push(paper.id);
  }
  return { updates, unmatched };
}
