/* Offline filtering for the 78 final plot previews. */
(() => {
  const browser = document.querySelector('[data-gallery-browser]');
  if (!browser) return;
  const module = browser.querySelector('[data-gallery-module]');
  const query = browser.querySelector('[data-gallery-query]');
  const cards = [...browser.querySelectorAll('[data-plot-card]')];
  const sections = [...browser.querySelectorAll('[data-gallery-section]')];
  const count = browser.querySelector('[data-gallery-count]');
  const initial = new URLSearchParams(location.search).get('module');
  if ([...module.options].some(option => option.value === initial)) module.value = initial;
  const render = () => {
    const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach(card => {
      const text = card.textContent.toLocaleLowerCase();
      card.hidden = (module.value !== 'all' && card.dataset.module !== module.value) || !terms.every(term => text.includes(term));
      if (!card.hidden) shown++;
    });
    sections.forEach(section => {
      const visible = section.querySelectorAll('[data-plot-card]:not([hidden])').length;
      section.hidden = visible === 0;
      section.querySelector('.gallery-module-count').textContent = `${visible} ${visible === 1 ? 'plot' : 'plots'}`;
      document.querySelectorAll(`.toc-links a[href="#${section.id}"]`).forEach(link => {
        link.hidden = section.hidden;
      });
    });
    count.textContent = `${shown} of ${cards.length} plots`;
    browser.querySelector('[data-gallery-empty]').hidden = shown !== 0;
  };
  const revealHash = () => {
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (_) { return; }
    const section = target?.closest('[data-gallery-section]');
    if (!section) return;
    if (section.hidden || target.closest('[data-plot-card]')?.hidden) {
      module.value = section.dataset.gallerySection;
      query.value = '';
      render();
    }
    target.scrollIntoView({ block: 'start' });
  };
  module.addEventListener('change', render);
  query.addEventListener('input', render);
  browser.querySelector('[data-gallery-reset]').addEventListener('click', () => {
    module.value = 'all';
    query.value = '';
    render();
    module.focus();
  });
  render();
  revealHash();
  window.addEventListener('hashchange', revealHash);
})();
