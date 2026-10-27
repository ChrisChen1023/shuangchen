const { test } = require('node:test');
const assert = require('node:assert/strict');

const row = (title, cited, year) => `<tr class="gsc_a_tr"><td class="gsc_a_t"><a href="/citations?view_op=view_citation" class="gsc_a_at">${title}</a><div class="gs_gray">S Chen</div></td><td class="gsc_a_c"><a href="/scholar?cites=1" class="gsc_a_ac gs_ibl">${cited}</a></td><td class="gsc_a_y"><span class="gsc_a_h gsc_a_hc gs_ibl">${year}</span></td></tr>`;
const stats = ['298', '290', '8', '8', '8', '7'].map(value => `<td class="gsc_rsb_std">${value}</td>`).join('');
const rows = [
  row('Hint: High-quality inpainting transformer with mask-aware encoding and enhanced attention', '110', '2024'),
  row('UIESNN: A Scale-Aware Spiking Network for Underwater Image Enhancement', '', '2026'),
  row('A feasibility study on image inpainting for non-cleft lip generation from patients with cl&hellip;', '10', '2022'),
  ...Array.from({ length: 8 }, (_, index) => row(`Filler paper ${index}`, String(index), '2020'))
];
const page = `<table>${stats}</table><table>${rows.join('')}</table>`;

test('parses Scholar profile statistics and publication rows', async () => {
  const { parseProfile } = await import('../scripts/scholar.mjs');
  const { totals, entries } = parseProfile(page);
  assert.deepEqual(totals, { citations: 298, hIndex: 8, i10Index: 8 });
  assert.equal(entries.length, 11);
  assert.equal(entries[0].citations, 110);
  assert.equal(entries[1].citations, 0, 'An empty count means no citations yet');
  assert.equal(entries[0].year, '2024');
});

test('matches site publications to Scholar entries by title, with a prefix fallback', async () => {
  const { parseProfile, matchEntries } = await import('../scripts/scholar.mjs');
  const { entries } = parseProfile(page);
  const papers = [
    { id: 'hint', title: 'HINT: High-quality INpainting Transformer with Mask-Aware Encoding and Enhanced Attention' },
    { id: 'uiesnn', title: 'UIESNN: A Scale-Aware Spiking Network for Underwater Image Enhancement' },
    { id: 'nclg-mt', title: 'A Feasibility Study on Image Inpainting for Non-cleft Lip Generation from Patients with Cleft Lip' },
    { id: 'sandbar', title: 'SandBAR: A Band-Asymmetric Architecture for Underwater Image Restoration' }
  ];
  const { updates, unmatched } = matchEntries(papers, entries);
  assert.deepEqual(updates.map(({ paper, entry }) => [paper.id, entry.citations]), [['hint', 110], ['uiesnn', 0], ['nclg-mt', 10]]);
  assert.deepEqual(unmatched, ['sandbar']);
});

test('validates a profile report supplied as JSON', async () => {
  const { validateReport } = await import('../scripts/scholar.mjs');
  const entries = Array.from({ length: 10 }, (_, index) => ({ title: `Paper ${index}`, citations: index === 0 ? '' : index, year: 2020 + index }));
  const report = validateReport({ totals: { citations: 300, hIndex: 8, i10Index: 8 }, entries });
  assert.equal(report.entries[0].citations, 0, 'An empty count means no citations yet');
  assert.equal(report.entries[9].citations, 9);
  assert.throws(() => validateReport({ totals: { citations: 5, hIndex: 8, i10Index: 8 }, entries }), /below a single entry count/);
  assert.throws(() => validateReport({ totals: { citations: 300, hIndex: 8, i10Index: 8 }, entries: entries.slice(0, 3) }), /at least 10 entries/);
  assert.throws(() => validateReport({ totals: { citations: 300, hIndex: 8, i10Index: 8 }, entries: [...entries.slice(1), { title: 'x', citations: -1 }] }), /invalid count/);
});

test('refuses a blocked or partial profile page', async () => {
  const { parseProfile } = await import('../scripts/scholar.mjs');
  assert.throws(() => parseProfile('<html><body>Please show you are not a robot</body></html>'), /statistics table not found/);
  assert.throws(() => parseProfile(`<table>${stats}</table>${rows.slice(0, 3).join('')}`), /refusing to update from a partial page/);
});
