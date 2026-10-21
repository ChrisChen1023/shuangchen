(() => {
  // Everything here is progressive enhancement: the plain HTML/CSS page is complete without it.
  const motion = setupMotion();
  setupHeader();
  setupLightbox(motion);
  setupPublications(motion);

  function setupPublications(motion) {
    const controls = document.querySelector('.publication-controls');
    const papers = [...document.querySelectorAll('.publication')];
    const count = document.getElementById('publication-count');
    const empty = document.getElementById('publication-empty');
    const list = document.getElementById('publication-list');
    if (!controls || !papers.length || !count || !empty || !list) return;

    let view = 'selected';
    let topic = 'all';

    const matches = paper => (view === 'all' || paper.dataset.selected === 'true') && (topic === 'all' || paper.dataset.topics.split(' ').includes(topic));

    // A topic with no selected papers widens the view to all publications instead of showing nothing;
    // choosing "Selected" while such a topic is active clears the topic.
    function update(changed) {
      let widened = false;
      if (!papers.some(matches)) {
        if (changed === 'view' && view === 'selected') topic = 'all';
        else if (view === 'selected') { view = 'all'; widened = true; }
      }
      list.dataset.layout = view;
      let visible = 0;
      for (const paper of papers) {
        paper.hidden = !matches(paper);
        if (!paper.hidden) visible++;
      }
      for (const button of controls.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === view));
      for (const button of controls.querySelectorAll('[data-topic]')) button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
      count.textContent = `${visible} ${view === 'selected' ? 'selected ' : ''}${visible === 1 ? 'paper' : 'papers'}${topic === 'all' ? '' : ' in this topic'}${widened ? ' · no selected papers here, so all publications are shown' : ''}`;
      empty.hidden = visible !== 0;
    }

    controls.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !controls.contains(button)) return;
      if (button.dataset.view) view = button.dataset.view;
      if (button.dataset.topic) topic = button.dataset.topic;
      update(button.dataset.view ? 'view' : 'topic');
      motion.resultsChanged(list);
    });

    update();
    controls.hidden = false;
  }

  function setupHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let ticking = false;
    const sync = () => { header.classList.toggle('is-scrolled', window.scrollY > 12); ticking = false; };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();

    // Highlight the navigation link for the section currently in the middle of the viewport.
    const links = [...header.querySelectorAll('nav a[href^="#"]')];
    const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
    if (!sections.length || typeof window.IntersectionObserver !== 'function') return;
    const byId = new Map(links.map(link => [link.hash.slice(1), link]));
    let current = null;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) current = entry.target.id;
        else if (current === entry.target.id) current = null;
      }
      for (const [id, link] of byId) {
        if (id === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }, { rootMargin: '-35% 0px -55% 0px' });
    for (const section of sections) observer.observe(section);
  }

  function setupLightbox(motion) {
    const links = [...document.querySelectorAll('.research-image-link')];
    if (!links.length || typeof HTMLDialogElement !== 'function' || !HTMLDialogElement.prototype.showModal) return;
    let dialog;
    function build() {
      dialog = document.createElement('dialog');
      dialog.className = 'lightbox';
      dialog.setAttribute('aria-label', 'Enlarged research figure');
      dialog.innerHTML = '<figure><button type="button" class="lightbox-close" aria-label="Close">×</button><img alt=""><figcaption><span></span><a href="#" rel="noopener">Open image file ↗</a></figcaption></figure>';
      dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
      dialog.querySelector('.lightbox-close').addEventListener('click', close);
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      document.body.append(dialog);
    }
    function open(link) {
      if (!dialog) build();
      const source = link.querySelector('img');
      const figcaption = link.closest('figure')?.querySelector('figcaption');
      const label = figcaption?.querySelector('.research-paper-heading a')?.textContent.trim();
      const venue = figcaption?.querySelector('.research-paper-heading span')?.textContent;
      const summary = figcaption?.querySelector('.research-paper-caption')?.textContent;
      const image = dialog.querySelector('img');
      image.src = link.href;
      image.alt = source?.alt || '';
      dialog.querySelector('figcaption span').textContent = [label, venue, summary].filter(Boolean).join(' · ') || figcaption?.textContent.trim() || source?.alt || '';
      dialog.querySelector('figcaption a').href = link.href;
      dialog.showModal();
      motion.enter(dialog.querySelector('figure'));
    }
    function close() {
      if (!dialog?.open) return;
      motion.exit(dialog.querySelector('figure')).then(() => dialog.close());
    }
    for (const link of links) link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
  }

  function setupMotion() {
    const fallback = { resultsChanged() {}, enter() {}, exit() { return Promise.resolve(); } };
    if (typeof Element.prototype.animate !== 'function' || typeof window.matchMedia !== 'function') return fallback;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set();
    const revealed = new WeakSet();
    const EASE = 'cubic-bezier(.22,.61,.36,1)';
    const targets = [...document.querySelectorAll('.intro-copy > *, .profile-aside > *, .latest-note, .section-heading, .research-grid article, .publication, .activity-card, #news > .news-list > li, .timeline li, .teaching-grid article, .site-footer > div')]
      .filter(element => !element.closest('.news-archive'));
    const counters = [...document.querySelectorAll('.metrics dd')].map(element => ({ element, final: element.textContent, value: Number(element.textContent.replace(/[^\d.]/g, '')), frame: 0 }));
    let observer;

    function settle(element) {
      element.classList.remove('will-reveal');
    }

    function cancelWithin(element) {
      for (const animation of active) {
        if (element.contains(animation.effect.target)) {
          animation.cancel();
          active.delete(animation);
        }
      }
    }

    function animate(element, keyframes, duration, extra = {}) {
      if (preference.matches || element.contains(document.activeElement)) return null;
      cancelWithin(element);
      const animation = element.animate(keyframes, { duration, easing: EASE, ...extra });
      active.add(animation);
      // No persistent fill or inline styles: finishing or cancellation restores the baseline.
      animation.finished.then(() => active.delete(animation), () => active.delete(animation));
      return animation;
    }

    // A reveal with its stagger delay baked into the keyframes, so the element stays hidden
    // until its turn without any fill mode.
    function reveal(element, index) {
      settle(element);
      const hold = Math.min(index, 8) * 70;
      const duration = 620;
      const total = hold + duration;
      const offset = hold / total;
      const hiddenState = { opacity: 0, transform: 'translateY(22px)', filter: 'blur(8px)' };
      animate(element, [
        { ...hiddenState, offset: 0, easing: 'linear' },
        { ...hiddenState, offset, easing: EASE },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)', offset: 1 }
      ], total);
      if (element.classList.contains('metrics')) countUp(hold + 120);
    }

    function countUp(delay) {
      if (preference.matches || !counters.length) return;
      const start = performance.now() + delay;
      const duration = 1200;
      for (const counter of counters) {
        if (!Number.isFinite(counter.value)) continue;
        cancelAnimationFrame(counter.frame);
        const tick = now => {
          const progress = Math.min(1, Math.max(0, (now - start) / duration));
          const eased = 1 - Math.pow(1 - progress, 4);
          counter.element.textContent = progress >= 1 ? counter.final : String(Math.round(counter.value * eased));
          counter.frame = progress < 1 ? requestAnimationFrame(tick) : 0;
        };
        counter.frame = requestAnimationFrame(tick);
      }
    }

    function finishCounters() {
      for (const counter of counters) {
        if (!counter.frame) continue;
        cancelAnimationFrame(counter.frame);
        counter.frame = 0;
        counter.element.textContent = counter.final;
      }
    }

    function revealEverythingNow() {
      for (const animation of active) animation.cancel();
      active.clear();
      finishCounters();
      for (const target of targets) { revealed.add(target); settle(target); }
      observer?.disconnect();
      observer = undefined;
    }

    function updatePreference() {
      observer?.disconnect();
      observer = undefined;
      if (preference.matches) {
        for (const animation of active) animation.cancel();
        active.clear();
        finishCounters();
        for (const target of targets) settle(target);
        return;
      }
      if (typeof window.IntersectionObserver !== 'function') {
        for (const target of targets) settle(target);
        return;
      }
      observer = new IntersectionObserver(entries => {
        const entering = entries
          .filter(entry => entry.isIntersecting && !revealed.has(entry.target))
          .sort((a, b) => a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        entering.forEach((entry, index) => {
          revealed.add(entry.target);
          observer?.unobserve(entry.target);
          reveal(entry.target, index);
        });
      }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
      for (const target of targets) if (!revealed.has(target)) observer.observe(target);
    }

    // Queue targets for their first reveal. The script is deferred, so this runs before the first paint.
    if (!preference.matches && typeof window.IntersectionObserver === 'function') {
      for (const target of targets) if (!target.hidden) target.classList.add('will-reveal');
    }

    if (typeof preference.addEventListener === 'function') preference.addEventListener('change', updatePreference);
    else if (typeof preference.addListener === 'function') preference.addListener(updatePreference);

    document.addEventListener('focusin', event => {
      for (const animation of active) {
        if (animation.effect.target.contains(event.target)) {
          animation.cancel();
          active.delete(animation);
        }
      }
      const pending = event.target.closest('.will-reveal');
      if (pending) { revealed.add(pending); observer?.unobserve(pending); settle(pending); }
    });
    window.addEventListener('beforeprint', revealEverythingNow);
    // Anything still queued after a generous wait is shown without animation (for example if the observer never fired).
    window.setTimeout(() => { for (const target of targets) if (!revealed.has(target) && target.classList.contains('will-reveal') && isInViewport(target)) { revealed.add(target); observer?.unobserve(target); settle(target); } }, 2500);

    for (const details of document.querySelectorAll('.news-archive')) {
      details.addEventListener('toggle', () => {
        cancelWithin(details);
        const content = details.querySelector('.news-list');
        if (details.open && content) animate(content, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], 220);
      });
    }

    updatePreference();

    function isInViewport(element) {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    return {
      resultsChanged(element) {
        cancelWithin(element);
        // The result fade covers newly shown papers, avoiding nested reveal animations.
        for (const paper of element.querySelectorAll('.publication:not([hidden])')) {
          revealed.add(paper);
          observer?.unobserve(paper);
          settle(paper);
        }
        animate(element, [
          { opacity: .5, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 220);
      },
      enter(element) {
        animate(element, [
          { opacity: 0, transform: 'scale(.94) translateY(12px)' },
          { opacity: 1, transform: 'scale(1) translateY(0)' }
        ], 260);
      },
      exit(element) {
        const animation = animate(element, [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.96)' }
        ], 150);
        return animation ? animation.finished.catch(() => {}) : Promise.resolve();
      }
    };
  }
})();
