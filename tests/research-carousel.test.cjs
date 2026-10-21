const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
let server, browser, origin;

function carousel(name = 'Vision', count = 3) {
  const titles = ['HINT', 'Rain Transformer', 'Event Vision'].slice(0, count);
  return `<section class="research-carousel" data-research-carousel data-carousel-interval="5200" aria-label="${name} papers">
    <div class="research-stage">
      ${titles.map((title, index) => `<figure id="${name}-figure-${index}" class="research-slide research-figure" data-paper-id="${index}"><a id="${name}-image-${index}" href="#figure-${index}" aria-label="View ${title} figure"><img loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Crect width='120' height='60' fill='navy'/%3E%3C/svg%3E" alt="${title} architecture"></a><figcaption><a href="#paper-${index}">${title}</a></figcaption></figure>`).join('')}
      <div class="research-stage-preview" data-carousel-preview aria-hidden="true" inert hidden></div>
    </div>
    <div class="research-carousel-controls" hidden>
      <button data-carousel-prev aria-label="Previous paper">Previous</button>
      <button data-carousel-next aria-label="Next paper">Next</button>
      <button data-carousel-toggle aria-label="Pause automatic rotation">Pause</button>
      <div class="research-carousel-dots">${titles.map((title, index) => `<button data-carousel-go="${index}" aria-label="Show ${title}"></button>`).join('')}</div>
      <span data-carousel-count>1 / ${count}</span>
    </div>
    <p data-carousel-status class="sr-only" role="status" aria-live="polite"></p>
  </section>`;
}

function fixture({ cards = 1, spacer = false, count = 3 } = {}) {
  return `<!doctype html><html><head><style>
    [hidden] { display: none !important; }
    body { margin: 0; font: 16px sans-serif; }
    main { display: flex; gap: 12px; align-items: start; }
    section { flex: 1; min-width: 0; padding: 10px; border: 1px solid; }
    figure { margin: 0; } img { width: 100%; height: 100px; }
    .research-stage { position: relative; perspective: 900px; transform-style: preserve-3d; }
    .research-slide { transform: translate3d(0, 0, 28px) rotateY(0deg) scale(1); }
    .research-stage-preview, .research-slide-outgoing { position: absolute; inset: 0; pointer-events: none; }
    .research-stage-preview { transform: translate3d(40px, 0, -80px) rotateY(-18deg) scale(.9); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  </style><script defer src="/assets/research-carousel.js"></script></head><body>
    <button id="outside">Outside carousel</button>${spacer ? '<div style="height: 1400px"></div>' : ''}
    <main>${Array.from({ length: cards }, (_, index) => carousel(['Vision', 'Brain', 'Generative'][index], count)).join('')}</main>
    <div style="height: 1600px"></div></body></html>`;
}

before(async () => {
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname !== '/assets/research-carousel.js') { res.writeHead(404).end(); return; }
    try {
      const bytes = await readFile(path.join(root, pathname));
      res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(bytes);
    }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function openFixture(options = {}, contextOptions = {}) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 }, reducedMotion: 'no-preference', ...contextOptions });
  await page.clock.install();
  await page.route('**/carousel-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture(options) }));
  await page.goto(origin + '/carousel-fixture');
  return page;
}

async function ready(page) {
  await page.waitForSelector('[data-carousel-ready="true"]', { timeout: 2000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function current(card) {
  return card.locator('.research-slide:visible figcaption').innerText();
}

// Missing initialization would leave all papers visible and navigation unusable.
test('initialization exposes one linked paper and immediately navigates to another real paper', async () => {
  const page = await openFixture();
  try {
    const card = page.locator('[data-research-carousel]');
    assert.equal(await card.locator('.research-slide:visible').count(), 1);
    assert.equal(await current(card), 'HINT');
    assert.equal(await card.locator('.research-carousel-controls').isVisible(), true);
    assert.equal(await card.locator('[data-carousel-go="0"]').getAttribute('aria-current'), 'true');
    await card.getByRole('button', { name: 'Next paper', exact: true }).click();
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await card.locator('[data-carousel-count]').innerText(), '2 / 3');
    assert.match(await card.locator('[data-carousel-status]').innerText(), /Rain Transformer.*2.*3/);
    assert.equal(await card.locator('[data-carousel-go="1"]').getAttribute('aria-current'), 'true');
    assert.equal(await card.locator('[data-carousel-go="0"]').getAttribute('aria-current'), 'false');
    assert.equal(await card.locator('.research-slide img[loading="eager"]').count(), 3);
  } finally { await page.close(); }
});

// A cosmetic image animation would fail because captions and links must change.
test('visible cards automatically advance through actual papers on independent staggered timers', async () => {
  const page = await openFixture({ cards: 3 });
  try {
    await ready(page);
    const cards = page.locator('[data-research-carousel]');
    await page.clock.fastForward(5300);
    assert.equal(await current(cards.nth(0)), 'Rain Transformer');
    assert.equal(await current(cards.nth(1)), 'HINT');
    assert.equal(await current(cards.nth(2)), 'HINT');
    assert.equal(await cards.nth(0).locator('.research-slide:visible figcaption a').getAttribute('href'), '#paper-1');
    await page.clock.fastForward(700);
    assert.equal(await current(cards.nth(1)), 'Rain Transformer');
    assert.equal(await current(cards.nth(2)), 'HINT');
    await page.clock.fastForward(700);
    assert.equal(await current(cards.nth(2)), 'Rain Transformer');
    assert.equal(await cards.nth(0).locator('[data-carousel-status]').innerText(), '', 'Automatic changes must not announce repeatedly');
  } finally { await page.close(); }
});

// Unconditional timers would advance hidden content before visitors could see it.
test('offscreen cards start and stop rotation as they enter and leave the viewport', async () => {
  const page = await openFixture({ spacer: true });
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    await page.clock.fastForward(18000);
    assert.equal(await current(card), 'HINT');
    await card.scrollIntoViewIfNeeded();
    // The observer reports visibility asynchronously; wait for the carousel to confirm it is playing.
    await page.waitForFunction(() => document.querySelector('[data-research-carousel]').dataset.carouselState === 'playing');
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Rain Transformer');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('[data-research-carousel]').dataset.carouselState === 'paused');
    await page.clock.fastForward(18000);
    assert.equal(await current(card), 'Rain Transformer');
  } finally { await page.close(); }
});

// Pointer inspection and persistent navigation focus must not silently stop the slideshow.
test('hover and navigation focus keep autoplay running while slide-link focus pauses it', async () => {
  const page = await openFixture();
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    await card.hover();
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await card.getAttribute('data-carousel-state'), 'playing');
    await card.locator('.research-slide:visible figcaption a').focus();
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await card.getAttribute('data-carousel-state'), 'paused');
    const next = card.getByRole('button', { name: 'Next paper', exact: true });
    await next.focus();
    await page.keyboard.press('Enter');
    assert.equal(await current(card), 'Event Vision');
    assert.equal(await next.evaluate(button => document.activeElement === button), true);
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'HINT');
    assert.equal(await next.evaluate(button => document.activeElement === button), true);
    const dot = card.getByRole('button', { name: 'Show Rain Transformer', exact: true });
    await dot.focus();
    await page.keyboard.press('Enter');
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Event Vision');
    assert.equal(await dot.evaluate(button => document.activeElement === button), true);
  } finally { await page.close(); }
});

async function setDocumentHidden(page, hidden) {
  await page.evaluate(hidden => {
    // Headless pages have no real tab strip; exercise the browser visibility event boundary.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

// A transient resume must never erase the visitor's explicit pause preference.
test('explicit pause persists until Play resumes rotation with its button still focused', async () => {
  const page = await openFixture();
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    await card.getByRole('button', { name: 'Pause automatic rotation' }).click();
    assert.equal(await card.getAttribute('data-carousel-state'), 'paused');
    await page.locator('#outside').focus();
    await page.mouse.move(1100, 650);
    await setDocumentHidden(page, true);
    await page.clock.fastForward(16000);
    await setDocumentHidden(page, false);
    await card.hover();
    await page.mouse.move(1100, 650);
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'HINT');
    const play = card.locator('[data-carousel-toggle]');
    await play.click();
    assert.equal(await play.evaluate(button => document.activeElement === button), true);
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await play.evaluate(button => document.activeElement === button), true);
    await setDocumentHidden(page, true);
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'Rain Transformer');
    await setDocumentHidden(page, false);
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Event Vision');
  } finally { await page.close(); }
});

// Reduced motion must disable both timed replacements and arriving-slide movement.
test('reduced motion initially and at runtime stops auto rotation while preserving manual choices', async () => {
  const page = await openFixture({}, { reducedMotion: 'reduce' });
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    assert.equal(await card.getAttribute('data-carousel-state'), 'reduced');
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'HINT');
    await card.getByRole('button', { name: 'Next paper', exact: true }).click();
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await card.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
    await page.locator('#outside').focus();
    await page.mouse.move(1100, 650);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => !document.querySelector('[data-carousel-toggle]').disabled);
    await page.clock.fastForward(5300);
    assert.equal(await current(card), 'Event Vision');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-carousel-toggle]').disabled);
    assert.equal(await card.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'Event Vision');
    const previous = card.getByRole('button', { name: 'Previous paper', exact: true });
    await previous.focus();
    await page.keyboard.press('Space');
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await previous.evaluate(button => document.activeElement === button), true);
  } finally { await page.close(); }
});

// Focus must stay on controls, and racing navigation must never restore an old slide.
test('keyboard dots and previous wrap correctly and rapid navigation cancels obsolete slide motion', async () => {
  const page = await openFixture();
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    const previous = card.getByRole('button', { name: 'Previous paper', exact: true });
    await previous.focus();
    await page.keyboard.press('Enter');
    assert.equal(await current(card), 'Event Vision');
    const hint = card.getByRole('button', { name: 'Show HINT', exact: true });
    await hint.focus();
    await page.keyboard.press('Space');
    assert.equal(await current(card), 'HINT');
    assert.equal(await hint.evaluate(button => document.activeElement === button), true);
    await card.evaluate(element => {
      element.querySelector('[data-carousel-next]').click();
      element.querySelector('[data-carousel-next]').click();
    });
    assert.equal(await current(card), 'Event Vision');
    const motion = await card.locator('.research-slide:visible').evaluate(slide => {
      const animations = slide.getAnimations();
      return { count: animations.length, duration: animations[0]?.effect.getTiming().duration, frames: animations[0]?.effect.getKeyframes().map(frame => frame.transform) };
    });
    assert.equal(motion.count, 1);
    assert.ok(motion.duration >= 700 && motion.duration <= 1000);
    assert.match(motion.frames[0], /translate3d\(.+rotateY\(/);
    assert.notEqual(motion.frames[0], motion.frames[1]);
    const outgoing = card.locator('.research-slide-outgoing');
    assert.equal(await outgoing.count(), 1);
    assert.equal(await outgoing.locator('figcaption').innerText(), 'Rain Transformer');
    const departure = await outgoing.evaluate(slide => slide.getAnimations()[0].effect.getKeyframes().map(frame => frame.transform));
    assert.match(departure[1], /translate3d\(.+rotateY\(/);
    assert.equal(await card.getByRole('link').count(), 2, 'Decorative copies must add no accessible links');
    await card.locator('.research-slide:visible figcaption a').focus();
    assert.equal(await card.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
    assert.equal(await outgoing.count(), 0);
    await page.clock.fastForward(600);
    assert.equal(await current(card), 'Event Vision');
    assert.equal(await card.locator('.research-slide:visible').evaluate(slide => getComputedStyle(slide).transform), 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 28, 1)');
  } finally { await page.close(); }
});

// A duplicated current frame or linked clone would misrepresent the next paper and keyboard order.
test('two-paper previews show the actual next paper safely and motion cleans up when disabled', async () => {
  const page = await openFixture({ count: 2 });
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    const preview = card.locator('[data-carousel-preview]');
    assert.equal(await preview.isVisible(), true);
    assert.equal(await preview.locator('figure').count(), 1);
    assert.equal(await preview.locator('figcaption').innerText(), 'Rain Transformer');
    assert.equal(await preview.locator('img').getAttribute('alt'), 'Rain Transformer architecture');
    assert.equal(await preview.locator('a, [id], [role], [aria-label]').count(), 0);
    assert.equal(await preview.getAttribute('aria-hidden'), 'true');
    assert.equal(await preview.getAttribute('inert'), '');
    assert.equal(await card.locator('.research-slide').count(), 2);
    await card.evaluate(element => element.querySelector('[data-carousel-next]').click());
    assert.equal(await current(card), 'Rain Transformer');
    assert.equal(await preview.locator('figcaption').innerText(), 'HINT');
    assert.equal(await card.locator('.research-slide-outgoing').count(), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-carousel-toggle]').disabled);
    assert.equal(await card.locator('.research-slide-outgoing').count(), 0);
    assert.equal(await card.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
    assert.equal(await current(card), 'Rain Transformer');
  } finally { await page.close(); }
});

for (const missing of ['IntersectionObserver', 'animate', 'matchMedia']) {
  // Progressive enhancement must tolerate each optional platform capability independently.
  test(`missing ${missing} keeps the carousel readable, rotating and manually operable`, async () => {
    const page = await browser.newPage({ reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.clock.install();
      await page.addInitScript(missing => {
        if (missing === 'animate') Element.prototype.animate = undefined;
        else window[missing] = undefined;
      }, missing);
      await page.route('**/carousel-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture() }));
      await page.goto(origin + '/carousel-fixture');
      await ready(page);
      const card = page.locator('[data-research-carousel]');
      await page.clock.fastForward(5300);
      assert.equal(await current(card), 'Rain Transformer');
      await card.getByRole('button', { name: 'Next paper', exact: true }).click();
      assert.equal(await current(card), 'Event Vision');
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}

test('a single paper stays readable with unnecessary navigation suppressed', async () => {
  const page = await openFixture({ count: 1 });
  try {
    await ready(page);
    const card = page.locator('[data-research-carousel]');
    assert.equal(await current(card), 'HINT');
    assert.equal(await card.locator('.research-carousel-controls').isVisible(), false);
    await page.clock.fastForward(16000);
    assert.equal(await current(card), 'HINT');
  } finally { await page.close(); }
});

test('all linked paper figures remain available without JavaScript', async () => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  try {
    await page.route('**/carousel-fixture', route => route.fulfill({ contentType: 'text/html', body: fixture({ cards: 3 }) }));
    await page.goto(origin + '/carousel-fixture');
    assert.equal(await page.locator('.research-slide:visible').count(), 9);
    assert.equal(await page.locator('.research-slide:visible figcaption a').count(), 9);
    assert.equal(await page.locator('.research-carousel-controls:visible').count(), 0);
  } finally { await page.close(); }
});
