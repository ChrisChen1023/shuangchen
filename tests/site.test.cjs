const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let server, browser, origin;

before(async () => {
  server = createServer(async (req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/shuangchen/')) pathname = pathname.slice('/shuangchen'.length);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { const bytes = await readFile(file); res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(bytes); }
    catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });

test('topic filters and publication views compose and recover from an empty selection', async () => {
  const page = await browser.newPage();
  try {
    const response = await page.goto(origin + '/shuangchen/');
    assert.equal(response.status(), 200, 'The new homepage must exist at the GitHub Pages subpath');
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.locator('.publication:visible').count(), 6);
    await page.getByRole('button', { name: 'Brain-inspired AI', exact: true }).click();
    assert.equal(await page.locator('.publication:visible').count(), 2);
    assert.match(await page.locator('#publication-list').innerText(), /Spiking Neural Networks for Image Deraining/);
    await page.getByRole('button', { name: 'All publications', exact: true }).click();
    await page.getByRole('button', { name: 'All topics', exact: true }).click();
    assert.equal(await page.locator('.publication:visible').count(), 20);
    await page.getByRole('button', { name: 'Applications', exact: true }).click();
    assert.ok(await page.locator('.publication:visible').count() > 0);
    await page.getByRole('button', { name: 'Selected', exact: true }).click();
    assert.equal(await page.locator('.publication:visible').count(), 0);
    assert.ok(await page.locator('#publication-empty').isVisible());
    await page.getByRole('button', { name: 'All topics', exact: true }).click();
    assert.equal(await page.locator('.publication:visible').count(), 6);
    assert.equal(await page.getByRole('button', { name: 'Selected', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('button', { name: 'All publications', exact: true }).getAttribute('aria-pressed'), 'false');
  } finally { await page.close(); }
});

test('the page, anchors and local assets work on desktop and narrow mobile widths', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.setDefaultTimeout(5000);
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url()); });
  try {
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication:visible');
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    }
    const invalidAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.hash).filter(hash => hash.length > 1 && !document.getElementById(hash.slice(1))));
    assert.deepEqual(invalidAnchors, []);
    // Reveal every paper before exercising lazy-loaded image assets.
    await page.getByRole('button', { name: 'All publications', exact: true }).click();
    for (const image of await page.locator('img').all()) {
      if (await image.isVisible()) await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => { img.loading = 'eager'; return img.decode(); });
      assert.ok(await image.evaluate(img => img.naturalWidth > 0));
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
  } finally { await page.close(); }
});

test('research and contact remain fully readable without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    assert.equal(await page.locator('.publication:visible').count(), 20);
    assert.ok(await page.getByRole('link', { name: 'shuang.chen@durham.ac.uk', exact: true }).isVisible());
    assert.equal(await page.locator('.publication-controls:visible').count(), 0);
    assert.ok(await page.getByRole('heading', { name: /Shuang/ }).isVisible());
  } finally { await context.close(); }
});

test('publication controls are reachable and usable from the keyboard', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin + '/shuangchen/');
    const all = page.getByRole('button', { name: 'All publications', exact: true });
    await all.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.publication:visible').count(), 20);
    const brain = page.getByRole('button', { name: 'Brain-inspired AI', exact: true });
    await brain.focus();
    await page.keyboard.press('Space');
    assert.equal(await brain.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.publication:visible').count(), 2);
  } finally { await page.close(); }
});

test('selected papers form a visual grid while the complete list keeps its reading layout', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication-controls:not([hidden])');
    const settled = () => page.evaluate(() => Promise.all(document.getAnimations().filter(animation => !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition)).map(animation => animation.finished.catch(() => {}))));
    await settled();
    let cards = page.locator('.publication:visible');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    assert.ok(Math.abs(first.y - second.y) < 2, 'Selected papers should share a grid row on desktop');
    assert.ok(second.x > first.x + first.width - 2);
    await page.getByRole('button', { name: 'All publications', exact: true }).click();
    await settled();
    cards = page.locator('.publication:visible');
    const fullFirst = await cards.nth(0).boundingBox();
    const fullSecond = await cards.nth(1).boundingBox();
    assert.ok(fullSecond.y > fullFirst.y + fullFirst.height - 2, 'The complete list should read vertically');
    await page.getByRole('button', { name: 'Selected', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await settled();
    const mobileFirst = await page.locator('.publication:visible').nth(0).boundingBox();
    const mobileSecond = await page.locator('.publication:visible').nth(1).boundingBox();
    assert.ok(mobileSecond.y > mobileFirst.y + mobileFirst.height - 2, 'Selected cards should stack on mobile');
  } finally { await page.close(); }
});

test('imported LinkedIn updates have readable summaries and original source links without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    const cards = page.locator('.activity-card');
    assert.ok(await cards.count() >= 3, 'Existing LinkedIn updates should be included in the static page');
    for (const card of await cards.all()) {
      assert.ok((await card.locator('h3').innerText()).length > 0);
      assert.ok((await card.locator('.activity-summary').innerText()).length > 0);
      const source = new URL(await card.locator('.activity-link').getAttribute('href'));
      assert.ok(source.protocol === 'https:' && /(^|\.)linkedin\.com$/.test(source.hostname));
    }
  } finally { await context.close(); }
});

test('each research area contains multiple distinct, sourced papers without JavaScript', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    const areas = page.locator('.research-grid article');
    assert.equal(await areas.count(), 3);
    for (const area of await areas.all()) {
      const figures = area.locator('figure');
      assert.ok(await figures.count() >= 2, 'Every area needs multiple papers');
      const ids = await figures.evaluateAll(items => items.map(item => item.dataset.paperId));
      assert.equal(new Set(ids).size, ids.length, 'Papers within an area must be distinct');
      for (const figure of await figures.all()) {
        assert.ok(await figure.isVisible());
        assert.ok((await figure.locator('img').getAttribute('alt')).length > 15);
        const paperLink = await figure.locator('figcaption a').getAttribute('href');
        assert.match(paperLink, /^https:\/\//);
        assert.ok((await figure.locator('figcaption').innerText()).length > 15);
      }
    }
  } finally { await context.close(); }
});

test('research slides form a spatial paper deck with non-interactive next-paper previews', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    const cards = page.locator('[data-research-carousel]');
    for (const card of await cards.all()) {
      assert.equal(await card.locator('.research-stage').count(), 1, 'Each area needs a paper stage');
      assert.ok(await card.locator('.research-stage').evaluate(element => parseFloat(getComputedStyle(element).perspective) > 0), 'The paper stage needs perspective');
      const front = card.locator('.research-slide:not([hidden])');
      assert.equal(await front.count(), 1);
      assert.match(await front.evaluate(element => getComputedStyle(element).transform), /^matrix3d\(/, 'The current paper should sit in front of the next one');
      const preview = card.locator('[data-carousel-preview]');
      assert.ok(await preview.isVisible());
      assert.equal(await preview.getAttribute('aria-hidden'), 'true');
      assert.ok(await preview.evaluate(element => element.inert));
      assert.equal(await preview.locator('a,button,[id]').count(), 0, 'A decorative preview must not duplicate interactive content');
      assert.equal(await preview.locator('img').count(), 1);
    }
  } finally { await page.close(); }
});

test('publications carry sourced venue-standing chips and dated citation counts', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    assert.ok(await page.locator('.publication .publication-metrics').count() >= 15, 'Most papers should show venue standing');
    for (const chip of await page.locator('.metric-chip').all()) assert.match(await chip.innerText(), /^(CORE [ABC]\*?|Impact Factor \d+(\.\d+)?|JCR Q[1-4]|[\d.]+% acceptance|Oral.*|\d+ citations?)$/);
    for (const chip of await page.locator('.metric-chip-citations').all()) assert.match(await chip.getAttribute('title'), /^Google Scholar, \d{4}$/);
    assert.ok(await page.locator('.metrics-note').isVisible());
  } finally { await context.close(); }
});
