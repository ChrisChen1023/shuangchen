const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let server, browser, origin;

before(async () => {
  server = createServer(async (req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/shuangchen/')) pathname = pathname.slice('/shuangchen'.length);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
    catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });

test('self-hosted fonts load and the serif/sans pairing is applied', async () => {
  const page = await browser.newPage();
  const missing = [];
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url()); });
  try {
    await page.goto(origin + '/shuangchen/');
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => ({
      newsreader: document.fonts.check('500 40px Newsreader'),
      inter: document.fonts.check('400 16px Inter'),
      heading: getComputedStyle(document.querySelector('h1')).fontFamily,
      body: getComputedStyle(document.body).fontFamily,
      external: performance.getEntriesByType('resource').map(entry => entry.name).filter(name => !name.startsWith(location.origin))
    }));
    assert.ok(fonts.newsreader && fonts.inter, 'Both web fonts should be available');
    assert.match(fonts.heading, /Newsreader/);
    assert.match(fonts.body, /Inter/);
    assert.deepEqual(fonts.external, [], 'The page must not request third-party resources');
    assert.deepEqual(missing, []);
  } finally { await page.close(); }
});

test('research figures open in an accessible lightbox and close with Escape, the button and the backdrop', async () => {
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin + '/shuangchen/');
    const link = page.locator('.research-image-link').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const dialog = page.locator('dialog.lightbox');
    await page.waitForFunction(() => document.querySelector('dialog.lightbox')?.open);
    assert.equal(await dialog.locator('img').evaluate(image => image.src), await link.evaluate(anchor => anchor.href));
    assert.match(await dialog.locator('figcaption').innerText(), /HINT/);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog.lightbox').open);
    await link.click();
    await page.waitForFunction(() => document.querySelector('dialog.lightbox')?.open);
    await dialog.locator('.lightbox-close').click();
    await page.waitForFunction(() => !document.querySelector('dialog.lightbox').open);
    await link.click();
    await page.waitForFunction(() => document.querySelector('dialog.lightbox')?.open);
    await page.mouse.click(4, 4);
    await page.waitForFunction(() => !document.querySelector('dialog.lightbox').open);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('modified clicks on a figure keep the plain link behaviour', async () => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(origin + '/shuangchen/');
    const link = page.locator('.research-image-link').first();
    await link.scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click({ modifiers: ['Control'] })]);
    await popup.waitForURL(/hint\.png$/);
    await popup.close();
    assert.equal(await page.locator('dialog.lightbox[open]').count(), 0);
  } finally { await context.close(); }
});

test('the header condenses on scroll and the navigation tracks the visible section', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  try {
    await page.goto(origin + '/shuangchen/');
    assert.equal(await page.locator('.site-header.is-scrolled').count(), 0);
    await page.locator('#publications').evaluate(element => element.scrollIntoView({ behavior: 'instant' }));
    await page.waitForSelector('.site-header.is-scrolled');
    await page.waitForFunction(() => document.querySelector('nav a[aria-current="location"]')?.hash === '#publications');
    await page.locator('#teaching').evaluate(element => element.scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('nav a[aria-current="location"]')?.hash === '#teaching');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('is-scrolled'));
  } finally { await page.close(); }
});

test('citation metrics count up to their exact values and stay exact under reduced motion', async () => {
  const scholar = require('../data/scholar.json');
  const expected = [scholar.citations, scholar.hIndex, scholar.i10Index].map(String);
  const animated = await browser.newPage({ reducedMotion: 'no-preference' });
  try {
    await animated.goto(origin + '/shuangchen/');
    await animated.waitForFunction(expected => [...document.querySelectorAll('.metrics dd')].some((dd, index) => dd.textContent !== expected[index]), expected, { timeout: 3000 });
    await animated.waitForFunction(expected => [...document.querySelectorAll('.metrics dd')].map(dd => dd.textContent).join() === expected.join(), expected, { timeout: 4000 });
  } finally { await animated.close(); }
  const still = await browser.newPage({ reducedMotion: 'reduce' });
  try {
    await still.goto(origin + '/shuangchen/');
    await still.waitForTimeout(300);
    assert.deepEqual(await still.locator('.metrics dd').allTextContents(), expected);
    assert.equal(await still.locator('.will-reveal').count(), 0, 'Reduced motion must never hide content');
  } finally { await still.close(); }
});

test('queued reveals are shown immediately for printing and keyboard focus', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    assert.ok(await page.locator('.will-reveal').count() > 0, 'Offscreen content is queued for a reveal');
    await page.locator('.activity-card h3 a').last().evaluate(link => link.focus());
    assert.equal(await page.locator('.activity-card').last().evaluate(card => card.classList.contains('will-reveal')), false);
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('.will-reveal').count(), 0);
    assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition)).length), 0);
  } finally { await page.close(); }
});
