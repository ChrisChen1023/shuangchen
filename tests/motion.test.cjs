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
    try {
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    } catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

// These inspect real Web Animations, excluding CSS hover transitions.
async function waitForMotion(page, selector) {
  await page.waitForFunction(selector => document.querySelector(selector).getAnimations().some(animation =>
    !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition) && animation.playState === 'running'
  ), selector, { polling: 10, timeout: 2000 });
}

async function settleMotion(page) {
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter(animation =>
      !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition)
    );
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  });
}

async function motionCount(locator) {
  return locator.evaluate(element => element.getAnimations().filter(animation =>
    !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition)
  ).length);
}

async function assertReadable(locator) {
  assert.equal(await locator.evaluate(element => {
    const style = getComputedStyle(element);
    return style.opacity === '1' && style.visibility === 'visible' && style.transform === 'none';
  }), true, 'Content must return to its ordinary visible style');
}

// A missing target, replaying observer, or persistent animation fill would fail these tests.
for (const [kind, selector] of [
  ['research card', '.research-grid article'],
  ['paper', '.publication:not([hidden])'],
  ['activity card', '.activity-card'],
  ['news row', '#news > .news-list > li']
]) test(`a ${kind} reveals once on entry and remains readable when revisited`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    const card = page.locator(selector).first();
    await card.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await waitForMotion(page, selector);
    assert.ok(await card.isVisible());
    await settleMotion(page);
    await assertReadable(card);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => scrollY === 0);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await card.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await motionCount(card), 0, 'Revisited content should not animate again');
    await assertReadable(card);
  } finally { await page.close(); }
});

// Removing the independent motion initializer would fail even without publications.
test('research motion also works on a page without publication controls', async () => {
  const page = await browser.newPage({ viewport: { width: 600, height: 700 }, reducedMotion: 'no-preference' });
  try {
    await page.route('**/motion-fixture', route => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><div style="height:1200px"></div><div class="research-grid"><article style="height:180px">Research</article></div><script src="/assets/site.js"></script>'
    }));
    await page.goto(origin + '/motion-fixture');
    await page.locator('.research-grid article').evaluate(element => element.scrollIntoView({ behavior: 'instant' }));
    await waitForMotion(page, '.research-grid article');
    await settleMotion(page);
    await assertReadable(page.locator('.research-grid article'));
  } finally { await page.close(); }
});

// Dropping either preference check would permit unwanted movement.
test('reduced motion prevents initial animation and stops motion immediately at runtime', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 700 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin + '/shuangchen/');
    const card = page.locator('.activity-card').first();
    await card.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.getByRole('button', { name: 'All publications', exact: true }).evaluate(button => button.click());
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await assertReadable(card);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const target = page.locator('.activity-card').last();
    await target.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await waitForMotion(page, '.activity-card:last-child');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.getAnimations().length === 0);
    await assertReadable(target);
    await page.locator('.news-list li').first().evaluate(element => element.scrollIntoView({ behavior: 'instant' }));
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

// Losing focus cancellation could leave an interactive target moving under the keyboard.
test('keyboard focus cancels the containing reveal and keeps the target usable', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    const card = page.locator('.activity-card').first();
    await card.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await waitForMotion(page, '.activity-card');
    await card.locator('h3 a').evaluate(link => link.focus());
    assert.equal(await motionCount(card), 0);
    assert.equal(await card.locator('h3 a').evaluate(link => document.activeElement === link), true);
    await assertReadable(card);
  } finally { await page.close(); }
});

// Removing cancellation or delaying hidden updates breaks final state during rapid input.
test('rapid filtering keeps focus and updates results immediately with one bounded animation', async () => {
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    await page.waitForSelector('.publication-controls:not([hidden])');
    assert.equal(await page.locator('#publication-list').evaluate(list => list.getAnimations().length), 0, 'Initial filtering should not animate');
    const state = await page.evaluate(() => {
      const click = selector => document.querySelector(selector).click();
      click('[data-topic="medical"]');
      click('[data-topic="all"]');
      click('[data-view="all"]');
      const button = document.querySelector('[data-topic="snn"]');
      button.focus();
      button.click();
      const list = document.getElementById('publication-list');
      const animations = list.getAnimations();
      return {
        visible: [...list.children].filter(paper => !paper.hidden).length,
        count: document.getElementById('publication-count').textContent,
        focused: document.activeElement === button,
        active: animations.length,
        duration: animations[0]?.effect.getTiming().duration,
        iterations: animations[0]?.effect.getTiming().iterations
      };
    });
    assert.equal(state.visible, 2);
    assert.match(state.count, /^2 papers in this topic$/);
    assert.equal(state.focused, true);
    assert.equal(state.active, 1);
    assert.ok(state.duration > 0 && state.duration <= 250);
    assert.equal(state.iterations, 1);
    await settleMotion(page);
    await assertReadable(page.locator('#publication-list'));
  } finally { await page.close(); }
});

// The native details interaction must survive while its newly opened content fades.
test('earlier news opens natively with a short cancellable content fade', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 700 }, reducedMotion: 'no-preference' });
  try {
    await page.goto(origin + '/shuangchen/');
    const details = page.locator('.news-archive');
    await details.locator('summary').evaluate(summary => summary.focus());
    await page.keyboard.press('Enter');
    assert.equal(await details.evaluate(element => element.open), true);
    await waitForMotion(page, '.news-archive > .news-list');
    await settleMotion(page);
    await assertReadable(details.locator('.news-list'));
    await page.keyboard.press('Enter');
    assert.equal(await details.evaluate(element => element.open), false);
  } finally { await page.close(); }
});

for (const missing of ['IntersectionObserver', 'animate']) {
  test(`missing ${missing} preserves readable content and working controls`, async () => {
    const page = await browser.newPage({ reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.addInitScript(missing => {
        if (missing === 'animate') Element.prototype.animate = undefined;
        else window.IntersectionObserver = undefined;
      }, missing);
      await page.goto(origin + '/shuangchen/');
      await page.getByRole('button', { name: 'All publications', exact: true }).click();
      assert.equal(await page.locator('.publication:visible').count(), 20);
      await page.getByRole('button', { name: 'Spiking neural networks', exact: true }).click();
      assert.equal(await page.locator('.publication:visible').count(), 2);
      await settleMotion(page);
      await assertReadable(page.locator('.activity-card').first());
      await page.locator('.news-archive summary').click();
      assert.equal(await page.locator('.news-archive').evaluate(element => element.open), true);
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}
