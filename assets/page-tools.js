/* Track the current section in desktop and compact contents lists. */
(() => {
  const toc = document.querySelector('[data-page-toc]');
  if (!toc) return;
  const allLinks = [...document.querySelectorAll('.toc-links a')];
  const targets = [...toc.querySelectorAll('a')].map(link => ({
    hash: link.hash,
    target: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(item => item.target);
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const visible = targets.filter(item => !item.target.hidden && item.target.getClientRects().length);
    if (!visible.length) {
      allLinks.forEach(link => link.removeAttribute('aria-current'));
      return;
    }
    const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const threshold = Math.max(headerBottom, scrollPadding) + 24;
    let current = visible[0];
    for (const item of visible) {
      if (item.target.getBoundingClientRect().top <= threshold) current = item;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = visible[visible.length - 1];
    allLinks.forEach(link => {
      if (link.hash === current.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.querySelector('.article'));
  document.querySelector('[data-gallery-browser]')?.addEventListener('input', schedule);
  document.querySelector('[data-gallery-browser]')?.addEventListener('change', schedule);
  document.querySelector('[data-gallery-reset]')?.addEventListener('click', schedule);
  // Reserve a print action outside the collapsible list on narrow screens.
  // data-print buttons use the shared print handler in app.js.
  document.querySelectorAll('.page-contents a').forEach(link => link.addEventListener('click', () => {
    link.closest('details').open = false;
  }));
  update();
})();
