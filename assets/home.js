/* Homepage motion uses Canvas 2D. The page remains usable without these effects. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const effectsAllowed = () => !reducedMotion.matches && finePointer.matches;

  const menu = document.querySelector('[data-menu-toggle]');
  const closeMenu = () => {
    body.classList.remove('nav-open');
    menu?.setAttribute('aria-expanded', 'false');
  };
  document.querySelectorAll('#home-navigation a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  // Keep Vimeo controls available if the optional Vimeo API cannot load.
  const videoFrame = document.querySelector('#showcase-player');
  const videoPlay = document.querySelector('[data-video-play]');
  const setupVideo = () => {
    if (!videoFrame || !videoPlay || !window.Vimeo?.Player) return;
    const player = new window.Vimeo.Player(videoFrame);
    const hidePlay = () => {
      if (document.activeElement === videoPlay) videoFrame.focus();
      videoPlay.hidden = true;
    };
    const showPlay = () => { videoPlay.hidden = false; };
    player.on('play', hidePlay);
    player.on('pause', showPlay);
    player.on('ended', showPlay);
    videoPlay.addEventListener('click', () => {
      hidePlay();
      player.play().catch(hidePlay);
    });
    player.ready().then(() => player.getPaused()).then(paused => {
      if (paused) showPlay();
    }).catch(hidePlay);
  };
  if (window.Vimeo?.Player) setupVideo();
  else document.querySelector('script[src="https://player.vimeo.com/api/player.js"]')?.addEventListener('load', setupVideo, { once: true });

  // One update per scroll frame; navigation and the native cursor remain intact.
  let scrollFrame = 0;
  const updateScroll = () => {
    scrollFrame = 0;
    const travel = root.scrollHeight - innerHeight;
    body.style.setProperty('--reading-progress', String(travel > 0 ? Math.min(1, Math.max(0, scrollY / travel)) : 0));
    body.classList.toggle('is-scrolled', scrollY > 16);
  };
  const queueScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); };
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll, { passive: true });
  updateScroll();

  // Small pointer responses use CSS properties, with no layout displacement.
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  const spotlights = [...document.querySelectorAll('[data-spotlight]')];
  const resetMagnet = element => {
    element.style.removeProperty('--magnet-x');
    element.style.removeProperty('--magnet-y');
  };
  magnets.forEach(element => {
    let pending = 0;
    let position;
    element.addEventListener('pointermove', event => {
      if (!effectsAllowed() || event.pointerType === 'touch') return;
      const box = element.getBoundingClientRect();
      position = { x: (event.clientX - box.left - box.width / 2) * .045, y: (event.clientY - box.top - box.height / 2) * .09 };
      if (!pending) pending = requestAnimationFrame(() => {
        pending = 0;
        if (!effectsAllowed()) return;
        element.style.setProperty('--magnet-x', `${Math.max(-4, Math.min(4, position.x))}px`);
        element.style.setProperty('--magnet-y', `${Math.max(-3, Math.min(3, position.y))}px`);
      });
    }, { passive: true });
    const reset = () => { cancelAnimationFrame(pending); pending = 0; resetMagnet(element); };
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    element.addEventListener('blur', reset);
  });
  spotlights.forEach(element => {
    let pending = 0;
    let position;
    element.addEventListener('pointermove', event => {
      if (!effectsAllowed() || event.pointerType === 'touch') return;
      const box = element.getBoundingClientRect();
      position = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (!pending) pending = requestAnimationFrame(() => {
        pending = 0;
        if (!effectsAllowed()) return;
        element.style.setProperty('--spot-x', `${position.x}px`);
        element.style.setProperty('--spot-y', `${position.y}px`);
        element.classList.add('is-lit');
      });
    }, { passive: true });
    const reset = () => { cancelAnimationFrame(pending); pending = 0; element.classList.remove('is-lit'); };
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
  });
  const resetPointerEffects = () => {
    if (effectsAllowed()) return;
    magnets.forEach(resetMagnet);
    spotlights.forEach(element => element.classList.remove('is-lit'));
  };
  reducedMotion.addEventListener('change', resetPointerEffects);
  finePointer.addEventListener('change', resetPointerEffects);

  const hero = document.querySelector('.home-hero');
  const canvas = document.querySelector('#flow-field');
  const context = canvas?.getContext('2d', { alpha: true });
  const motionButton = document.querySelector('[data-motion-toggle]');
  if (hero && canvas && context) {
    let width = 1;
    let height = 1;
    let particles = [];
    let frame = 0;
    let previousTime = 0;
    let phase = 0;
    let visible = true;
    let suspended = false;
    let paused = false;
    let dark = root.dataset.theme === 'dark';
    const pointer = { x: -1000, y: -1000, active: false };
    const running = () => effectsAllowed() && !paused && visible && !document.hidden && !suspended;
    const palette = () => dark ? ['132,213,184', '112,177,195', '136,184,164'] : ['31,128,100', '35,132,159', '107,156,128'];

    const draw = (moving = false) => {
      context.clearRect(0, 0, width, height);
      const colors = palette();
      for (const point of particles) {
        const driftX = moving ? Math.sin(phase * .7 + point.seed) * 3 : 0;
        const driftY = moving ? Math.cos(phase * .5 + point.seed * .8) * 4 : 0;
        let targetX = 0;
        let targetY = 0;
        if (moving && pointer.active) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 165) {
            const force = (1 - distance / 165) ** 2 * 43;
            targetX = dx / distance * force;
            targetY = dy / distance * force;
          }
        }
        point.ox += (targetX - point.ox) * .075;
        point.oy += (targetY - point.oy) * .075;
        if (!moving) { point.ox = 0; point.oy = 0; }
        context.fillStyle = `rgba(${colors[point.color]},${point.opacity})`;
        context.beginPath();
        context.arc(point.x + point.ox + driftX, point.y + point.oy + driftY, point.radius, 0, Math.PI * 2);
        context.fill();
      }
    };
    const animate = time => {
      frame = 0;
      if (!running()) { syncMotion(); return; }
      const elapsed = previousTime ? Math.min(40, time - previousTime) : 16;
      previousTime = time;
      phase += elapsed * .00035;
      draw(true);
      frame = requestAnimationFrame(animate);
    };
    const clearPointer = () => {
      pointer.active = false;
      hero.classList.remove('has-pointer');
    };
    const syncMotion = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      motionButton.hidden = !effectsAllowed();
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.setAttribute('aria-label', paused ? 'Resume background motion' : 'Pause background motion');
      motionButton.querySelector('[data-motion-label]').textContent = paused ? 'Motion off' : 'Motion on';
      motionButton.querySelector('[data-motion-icon]').textContent = paused ? '?' : '?';
      if (!running()) clearPointer();
      if (running()) frame = requestAnimationFrame(animate);
      else if (visible && !document.hidden) draw();
    };
    const resize = () => {
      const box = hero.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = [];
      const count = width < 680 ? 56 : 96;
      const rows = width < 680 ? 6 : 9;
      for (let band = 0; band < 2; band++) {
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < count; column++) {
            const t = column / (count - 1);
            const x = width * (band ? .60 + t * .57 : t * 1.18 - .09);
            const y = height * (band ? .05 + .28 * t + .10 * Math.sin(t * Math.PI * 2) + row * .014 : .73 + .115 * Math.sin(t * Math.PI * 1.9 - 1.1) + row * .014);
            const seed = row * 1.35 + column * .21 + band * 3;
            particles.push({ x, y, ox: 0, oy: 0, seed, radius: .7 + (column % 5) * .14, color: (column + row) % 3, opacity: .16 + Math.sin(t * Math.PI) * .22 });
          }
        }
      }
      draw(running());
    };
    hero.addEventListener('pointermove', event => {
      if (!running() || event.pointerType === 'touch') return;
      const box = hero.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.active = true;
      hero.style.setProperty('--pointer-x', `${pointer.x}px`);
      hero.style.setProperty('--pointer-y', `${pointer.y}px`);
      hero.classList.add('has-pointer');
    }, { passive: true });
    hero.addEventListener('pointerleave', clearPointer);
    hero.addEventListener('pointercancel', clearPointer);
    motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
    reducedMotion.addEventListener('change', syncMotion);
    finePointer.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
    const themeObserver = new MutationObserver(() => {
      dark = root.dataset.theme === 'dark';
      if (!running()) draw();
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncMotion();
      }).observe(hero);
    }
    addEventListener('pagehide', () => { suspended = true; syncMotion(); });
    addEventListener('pageshow', () => { suspended = false; syncMotion(); });
    resize();
    syncMotion();
  }

  // Only content below the initial viewport gets an entrance treatment.
  if ('IntersectionObserver' in window) {
    const reveal = element => {
      element.classList.remove('reveal-pending');
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, { rootMargin: '0px 0px -24px 0px', threshold: .06 });
    const elements = [...document.querySelectorAll('[data-reveal]')];
    if (!reducedMotion.matches) elements.forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add('reveal-ready', 'reveal-pending');
      observer.observe(element);
    });
    const revealAll = () => elements.forEach(reveal);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) revealAll(); });
    document.addEventListener('focusin', event => {
      const hiddenParent = event.target.closest('.reveal-pending');
      if (hiddenParent) reveal(hiddenParent);
    });
    addEventListener('beforeprint', revealAll);
  }
})();
