(() => {
  // Motion is an optional enhancement: ordinary HTML/CSS always stays visible.
  const motion = setupMotion();
  const controls = document.querySelector('.publication-controls');
  const papers = [...document.querySelectorAll('.publication')];
  const count = document.getElementById('publication-count');
  const empty = document.getElementById('publication-empty');
  const list = document.getElementById('publication-list');
  if (!controls || !papers.length || !count || !empty || !list) return;

  let view = 'selected';
  let topic = 'all';

  function update() {
    list.dataset.layout = view;
    let visible = 0;
    for (const paper of papers) {
      const inView = view === 'all' || paper.dataset.selected === 'true';
      const inTopic = topic === 'all' || paper.dataset.topics.split(' ').includes(topic);
      paper.hidden = !(inView && inTopic);
      if (!paper.hidden) visible++;
    }
    for (const button of controls.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    for (const button of controls.querySelectorAll('[data-topic]')) button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
    count.textContent = `${visible} ${view === 'selected' ? 'selected ' : ''}${visible === 1 ? 'paper' : 'papers'}${topic === 'all' ? '' : ' in this topic'}`;
    empty.hidden = visible !== 0;
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !controls.contains(button)) return;
    if (button.dataset.view) view = button.dataset.view;
    if (button.dataset.topic) topic = button.dataset.topic;
    update();
    motion.resultsChanged(list);
  });

  update();
  controls.hidden = false;

  function setupMotion() {
    const fallback = { resultsChanged() {} };
    if (typeof Element.prototype.animate !== 'function' || typeof window.matchMedia !== 'function') return fallback;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set();
    const revealed = new WeakSet();
    const targets = [...document.querySelectorAll('.research-grid article, .publication, .activity-card, .news-list > li')]
      .filter(element => !element.closest('.news-archive'));
    let observer;

    function cancelWithin(element) {
      for (const animation of active) {
        if (element.contains(animation.effect.target)) {
          animation.cancel();
          active.delete(animation);
        }
      }
    }

    function animate(element, keyframes, duration) {
      if (preference.matches || element.contains(document.activeElement)) return;
      cancelWithin(element);
      const animation = element.animate(keyframes, {
        duration,
        easing: 'cubic-bezier(.2,.7,.2,1)'
      });
      active.add(animation);
      // No persistent fill or inline styles: finishing or cancellation restores the baseline.
      animation.finished.then(() => active.delete(animation), () => active.delete(animation));
    }

    function updatePreference() {
      observer?.disconnect();
      observer = undefined;
      if (preference.matches) {
        for (const animation of active) animation.cancel();
        active.clear();
        return;
      }
      if (typeof window.IntersectionObserver !== 'function') return;
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || revealed.has(entry.target)) continue;
          revealed.add(entry.target);
          observer?.unobserve(entry.target);
          animate(entry.target, [
            { opacity: .72, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], 360);
        }
      }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
      for (const target of targets) {
        if (!revealed.has(target)) observer.observe(target);
      }
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
    });

    for (const details of document.querySelectorAll('.news-archive')) {
      details.addEventListener('toggle', () => {
        cancelWithin(details);
        const content = details.querySelector('.news-list');
        if (details.open && content) animate(content, [{ opacity: .72 }, { opacity: 1 }], 180);
      });
    }

    updatePreference();

    return {
      resultsChanged(element) {
        cancelWithin(element);
        // The result fade covers newly shown papers, avoiding nested reveal animations.
        for (const paper of element.querySelectorAll('.publication:not([hidden])')) {
          revealed.add(paper);
          observer?.unobserve(paper);
        }
        animate(element, [
          { opacity: .72, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 180);
      }
    };
  }
})();
