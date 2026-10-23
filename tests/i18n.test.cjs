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

test('the language switch shows the Chinese copy, is remembered, and keeps English without JavaScript', async () => {
  const context = await browser.newContext({ locale: 'en-GB' });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.equal(await page.locator('.l10n[lang="zh-Hans"]:visible').count(), 0, 'Chinese copy stays hidden in English');
    assert.equal(await page.locator('nav a[href="#research"]').innerText(), 'Research');
    const toggle = page.locator('[data-lang-toggle]');
    assert.equal(await toggle.innerText(), '中文');
    await toggle.click();
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-Hans');
    assert.equal(await page.locator('.l10n[lang="en"]:visible').count(), 0, 'English copy hides in Chinese');
    assert.equal(await page.locator('nav a[href="#research"]').innerText(), '研究');
    assert.match(await page.locator('#publication-count').innerText(), /^共 \d+ 篇精选论文$/);
    assert.match(await page.locator('.metrics-source').innerText(), /^Google Scholar · \d{4}年\d{1,2}月$/);
    assert.match(await page.locator('.research-carousel-controls button[data-carousel-toggle]').first().innerText(), /^(暂停|播放|已暂停)$/);
    assert.equal(await toggle.innerText(), 'EN');
    assert.ok((await page.title()).includes('个人主页'));
    await page.getByRole('button', { name: '全部论文', exact: true }).click();
    assert.match(await page.locator('#publication-count').innerText(), /^共 20 篇论文$/);
    await page.reload();
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-Hans', 'The choice is remembered');
    await page.locator('[data-lang-toggle]').click();
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  } finally { await context.close(); }

  const chinese = await browser.newContext({ locale: 'zh-CN' });
  try {
    const page = await chinese.newPage();
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-Hans', 'A Chinese browser language starts in Chinese');
  } finally { await chinese.close(); }

  const plain = await browser.newContext({ javaScriptEnabled: false, locale: 'zh-CN' });
  try {
    const page = await plain.newPage();
    await page.goto(origin + '/shuangchen/');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.equal(await page.locator('[data-lang-toggle]:visible').count(), 0, 'No dead switch without JavaScript');
    assert.equal(await page.locator('.l10n[lang="zh-Hans"]:visible').count(), 0);
    assert.ok(await page.locator('.l10n[lang="en"]:visible').count() > 50);
  } finally { await plain.close(); }
});

test('every bilingual pair has both languages and the Chinese layout fits a phone', async () => {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const en = (html.match(/class="l10n" lang="en"/g) || []).length;
  const zh = (html.match(/class="l10n" lang="zh-Hans"/g) || []).length;
  assert.ok(en > 100 && en === zh, `Pairs must be complete (${en} English, ${zh} Chinese)`);
  const context = await browser.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true, locale: 'zh-CN' });
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-Hans');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'No horizontal overflow in Chinese on a phone');
    const filters = page.locator('.topic-filters');
    assert.ok(await filters.evaluate(element => element.scrollWidth > element.clientWidth && getComputedStyle(element).overflowX === 'auto'), 'Topic filters scroll sideways on phones');
    const card = page.locator('.activity-card').first();
    assert.ok(await card.evaluate(element => getComputedStyle(element).display === 'grid'), 'Field notes use the compact phone layout');
    await page.getByRole('button', { name: '全部论文', exact: true }).click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  } finally { await context.close(); }
});
