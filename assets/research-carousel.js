(() => {
  const motionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  document.querySelectorAll('[data-research-carousel]').forEach((carousel, carouselIndex) => {
    if (carousel.dataset.carouselReady === 'true') return;

    const slides = [...carousel.querySelectorAll('.research-slide')];
    if (!slides.length) return;
    const controls = carousel.querySelector('.research-carousel-controls');
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const toggle = carousel.querySelector('[data-carousel-toggle]');
    const dots = [...carousel.querySelectorAll('[data-carousel-go]')];
    const count = carousel.querySelector('[data-carousel-count]');
    const status = carousel.querySelector('[data-carousel-status]');
    const requestedInterval = Number(carousel.dataset.carouselInterval);
    const interval = (requestedInterval > 0 ? requestedInterval : 5200) + carouselIndex * 700;
    let index = 0;
    let timer = null;
    let animation = null;
    let userPaused = false;
    let hovered = false;
    let focused = carousel.contains(document.activeElement);
    let visible = typeof window.IntersectionObserver !== 'function';

    if (!carousel.hasAttribute('role')) carousel.setAttribute('role', 'group');
    carousel.setAttribute('aria-roledescription', 'carousel');

    // Preload each local figure so a timed change never reveals an empty frame.
    slides.forEach((slide, slideIndex) => {
      slide.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${slideIndex + 1} of ${slides.length}`);
    });

    function cancelMotion() {
      if (animation) animation.cancel();
      animation = null;
    }

    function reducedMotion() {
      return Boolean(motionQuery?.matches);
    }

    function canRotate() {
      return slides.length > 1 && visible && !document.hidden &&
        !userPaused && !hovered && !focused && !reducedMotion();
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      if (!canRotate()) return;
      timer = window.setTimeout(() => {
        timer = null;
        if (!canRotate()) return;
        show(index + 1, false, 1);
        schedule();
      }, interval);
    }

    function updateToggle() {
      if (!toggle) return;
      toggle.disabled = reducedMotion();
      toggle.textContent = reducedMotion() ? 'Paused' : userPaused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', reducedMotion()
        ? 'Automatic rotation paused for reduced motion'
        : userPaused ? 'Resume automatic rotation' : 'Pause automatic rotation');
      toggle.setAttribute('aria-pressed', String(userPaused || reducedMotion()));
    }

    function show(requestedIndex, manual = false, direction = 1, control = null) {
      const target = (requestedIndex + slides.length) % slides.length;
      const changed = target !== index;
      cancelMotion();

      // Programmatic control activation must not leave focus inside a hidden figure.
      if (changed && slides[index].contains(document.activeElement)) {
        (control || next || previous)?.focus({ preventScroll: true });
      }
      index = target;
      slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
      dots.forEach(dot => dot.setAttribute('aria-current', String(Number(dot.dataset.carouselGo) === index)));
      if (count) count.textContent = `${index + 1} / ${slides.length}`;
      if (manual && status) {
        const caption = slides[index].querySelector('figcaption')?.textContent || '';
        status.textContent = `${caption.replace(/\s+/g, ' ').trim()} — ${index + 1} of ${slides.length}`;
      }

      const arriving = slides[index];
      if (changed && !reducedMotion() && typeof arriving.animate === 'function') {
        const activeAnimation = arriving.animate([
          { opacity: 0.3, transform: `translateX(${direction * 18}px)` },
          { opacity: 1, transform: 'translateX(0px)' }
        ], { duration: 350, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        animation = activeAnimation;
        activeAnimation.finished.then(() => {
          if (animation === activeAnimation) animation = null;
        }).catch(() => {});
      }
    }

    function navigate(requestedIndex, direction, control) {
      show(requestedIndex, true, direction, control);
      schedule();
    }

    previous?.addEventListener('click', () => navigate(index - 1, -1, previous));
    next?.addEventListener('click', () => navigate(index + 1, 1, next));
    dots.forEach(dot => dot.addEventListener('click', () => {
      const target = Number(dot.dataset.carouselGo);
      if (Number.isInteger(target) && target >= 0 && target < slides.length) {
        navigate(target, target < index ? -1 : 1, dot);
      }
    }));
    toggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      cancelMotion();
      updateToggle();
      schedule();
    });

    carousel.addEventListener('pointerenter', () => { hovered = true; schedule(); });
    carousel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    carousel.addEventListener('focusin', () => { focused = true; cancelMotion(); schedule(); });
    carousel.addEventListener('focusout', event => {
      focused = carousel.contains(event.relatedTarget);
      schedule();
    });
    document.addEventListener('visibilitychange', () => { cancelMotion(); schedule(); });

    const motionChanged = () => { cancelMotion(); updateToggle(); schedule(); };
    if (typeof motionQuery?.addEventListener === 'function') motionQuery.addEventListener('change', motionChanged);
    else if (typeof motionQuery?.addListener === 'function') motionQuery.addListener(motionChanged);

    show(0);
    updateToggle();
    carousel.dataset.carouselReady = 'true';
    if (controls) controls.hidden = slides.length < 2;

    if (typeof window.IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (!visible) cancelMotion();
        schedule();
      });
      observer.observe(carousel);
    }
    schedule();
  });
})();
