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
    const stage = carousel.querySelector('.research-stage') || carousel;
    const preview = carousel.querySelector('[data-carousel-preview]');
    const playback = carousel.querySelector('.research-playback');
    const playbackLabel = carousel.querySelector('[data-carousel-playback]');
    const progress = carousel.querySelector('[data-carousel-progress]');
    const requestedInterval = Number(carousel.dataset.carouselInterval);
    const interval = (requestedInterval > 0 ? requestedInterval : 5200) + carouselIndex * 700;
    let index = 0;
    let timer = null;
    let animations = [];
    let outgoing = null;
    let motionVersion = 0;
    let progressAnimation = null;
    let userPaused = false;
    let focused = slides.some(slide => slide.contains(document.activeElement));
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
      motionVersion += 1;
      animations.forEach(animation => animation.cancel());
      animations = [];
      outgoing?.remove();
      outgoing = null;
    }

    function reducedMotion() {
      return Boolean(motionQuery?.matches);
    }

    function canRotate() {
      return slides.length > 1 && visible && !document.hidden &&
        !userPaused && !focused && !reducedMotion();
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      progressAnimation?.cancel();
      progressAnimation = null;
      const rotating = canRotate();
      carousel.dataset.carouselState = reducedMotion() ? 'reduced' : rotating ? 'playing' : 'paused';
      if (playbackLabel) playbackLabel.textContent = reducedMotion()
        ? 'Reduced motion' : userPaused || focused ? 'Paused' : 'Auto play';
      updateToggle();
      if (!rotating) return;
      if (typeof progress?.animate === 'function') {
        progressAnimation = progress.animate([
          { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }
        ], { duration: interval, easing: 'linear', iterations: 1, fill: 'forwards' });
      }
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

    function decorativeCopy(slide) {
      const copy = slide.cloneNode(true);
      copy.hidden = false;
      copy.classList.remove('research-slide');
      copy.querySelectorAll('a').forEach(link => {
        const text = document.createElement('span');
        text.className = link.className;
        text.append(...link.childNodes);
        link.replaceWith(text);
      });
      [copy, ...copy.querySelectorAll('*')].forEach(element => {
        ['id', 'role', 'aria-roledescription', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-live', 'tabindex'].forEach(attribute => element.removeAttribute(attribute));
      });
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('inert', '');
      return copy;
    }

    function updatePreview() {
      if (!preview) return;
      preview.replaceChildren();
      preview.hidden = slides.length < 2;
      if (!preview.hidden) preview.append(decorativeCopy(slides[(index + 1) % slides.length]));
    }

    function animateChange(departing, arriving, direction) {
      if (reducedMotion() || typeof arriving.animate !== 'function') return;
      const version = motionVersion;
      const baseline = 'translate3d(0, 0, 28px) rotateY(0deg) scale(1)';
      const timing = { duration: 850, easing: 'cubic-bezier(.4, 0, .6, 1)' };
      outgoing = decorativeCopy(departing);
      outgoing.classList.add('research-slide-outgoing');
      stage.append(outgoing);
      animations = [
        outgoing.animate([
          { offset: 0, opacity: 1, transform: baseline },
          { offset: .68, opacity: 1, transform: `translate3d(${-direction * 42}px, 0, -50px) rotateY(${direction * 14}deg) scale(.93)` },
          { opacity: 0, transform: `translate3d(${-direction * 55}px, 0, -90px) rotateY(${direction * 18}deg) scale(.88)` }
        ], timing),
        arriving.animate([
          { opacity: 1, transform: `translate3d(${direction * 45}px, 0, -70px) rotateY(${-direction * 16}deg) scale(.9)` },
          { opacity: 1, transform: baseline }
        ], timing)
      ];
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (motionVersion !== version) return;
        outgoing?.remove();
        outgoing = null;
        animations = [];
      });
    }

    function show(requestedIndex, manual = false, direction = 1, control = null) {
      const target = (requestedIndex + slides.length) % slides.length;
      const changed = target !== index;
      const departing = slides[index];
      cancelMotion();

      // Programmatic control activation must not leave focus inside a hidden figure.
      if (changed && slides[index].contains(document.activeElement)) {
        (control || next || previous)?.focus({ preventScroll: true });
      }
      index = target;
      slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
      updatePreview();
      dots.forEach(dot => dot.setAttribute('aria-current', String(Number(dot.dataset.carouselGo) === index)));
      if (count) count.textContent = `${index + 1} / ${slides.length}`;
      if (manual && status) {
        const caption = slides[index].querySelector('figcaption')?.textContent || '';
        status.textContent = `${caption.replace(/\s+/g, ' ').trim()} — ${index + 1} of ${slides.length}`;
      }

      if (changed) animateChange(departing, slides[index], direction);
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
      schedule();
    });

    function focusChanged(target) {
      const slideFocused = slides.some(slide => slide.contains(target));
      if (slideFocused === focused) return;
      focused = slideFocused;
      if (focused) cancelMotion();
      schedule();
    }
    carousel.addEventListener('focusin', event => focusChanged(event.target));
    carousel.addEventListener('focusout', event => focusChanged(event.relatedTarget));
    document.addEventListener('visibilitychange', () => { cancelMotion(); schedule(); });

    const motionChanged = () => { cancelMotion(); schedule(); };
    if (typeof motionQuery?.addEventListener === 'function') motionQuery.addEventListener('change', motionChanged);
    else if (typeof motionQuery?.addListener === 'function') motionQuery.addListener(motionChanged);

    show(0);
    carousel.dataset.carouselReady = 'true';
    if (controls) controls.hidden = slides.length < 2;
    if (playback) playback.hidden = slides.length < 2;

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
