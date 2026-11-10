/* Browse and filter local guides; native module disclosures also work without JS. */
(() => {
  const sidebar = document.querySelector('#doc-navigation');
  if (!sidebar) return;
  const links = Array.from(sidebar.querySelectorAll('a[href]'));
  const groups = Array.from(sidebar.querySelectorAll('.nav-group'));
  const pageLinks = links.filter(link => link.pathname === location.pathname);
  const header = sidebar.querySelector('.nav-browser-header');
  const input = sidebar.querySelector('#nav-filter');
  const clearButton = sidebar.querySelector('.nav-search-clear');
  const status = sidebar.querySelector('.nav-search-status');
  const normalize = text => text.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const entries = groups.map(group => ({
    group,
    links: Array.from(group.querySelectorAll('a[href]')).map(link => ({
      link,
      text: normalize(`${group.querySelector('.nav-module-name')?.textContent || ''} ${link.textContent} ${link.getAttribute('aria-label') || ''}`),
    })),
  }));
  let current;
  let savedState;
  const reveal = element => {
    if (!element?.getClientRects().length || !sidebar.getClientRects().length) return;
    const item = element.getBoundingClientRect();
    const bounds = sidebar.getBoundingClientRect();
    const top = Math.max(bounds.top, header?.getBoundingClientRect().bottom || bounds.top) + 8;
    if (item.bottom > bounds.bottom - 8 || item.top < top) {
      sidebar.scrollTop += item.top - top - (bounds.bottom - top) / 2 + item.height / 2;
    }
  };
  const revealCurrent = () => reveal(current);
  const closeOtherGroups = group => groups.forEach(other => { if (other !== group) other.open = false; });
  const syncCurrent = () => {
    links.forEach(link => link.removeAttribute('aria-current'));
    current = pageLinks.find(link => location.hash && link.hash === location.hash)
      || pageLinks.find(link => !link.hash);
    if (current) {
      current.setAttribute('aria-current', current.hash ? 'location' : 'page');
      const group = current.closest('details');
      if (group && !savedState) {
        closeOtherGroups(group);
        group.open = true;
      }
    }
    requestAnimationFrame(revealCurrent);
  };

  groups.forEach(group => {
    const summary = group.querySelector('summary');
    summary.addEventListener('click', () => {
      if (!group.open && !savedState) closeOtherGroups(group);
      requestAnimationFrame(() => reveal(summary));
    });
  });

  const filter = () => {
    const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    if (terms.length && !savedState) {
      savedState = { open: groups.map(group => group.open), scrollTop: sidebar.scrollTop };
    }
    let matches = 0;
    entries.forEach(({ group, links: groupLinks }, index) => {
      let visible = 0;
      let plots = 0;
      groupLinks.forEach(({ link, text }) => {
        link.hidden = !terms.every(term => text.includes(term));
        if (!link.hidden) {
          visible++;
          if (link.dataset.navKind === 'plot') plots++;
        }
      });
      matches += visible;
      group.hidden = visible === 0;
      group.querySelectorAll('.nav-guide-links, .nav-plot-links').forEach(section => {
        section.hidden = !section.querySelector('a:not([hidden])');
      });
      const count = group.querySelector('.nav-count');
      if (count) {
        count.hidden = !plots;
        const label = `${terms.length ? ' matching' : ''} plot guide${plots === 1 ? '' : 's'}`;
        count.querySelector('.nav-count-value').textContent = plots;
        count.querySelector('.nav-count-unit').textContent = label;
        count.title = plots + label;
      }
      if (terms.length) group.open = visible > 0;
      else if (savedState) group.open = savedState.open[index];
    });
    clearButton.hidden = !input.value;
    status.hidden = !terms.length;
    status.textContent = !terms.length ? '' : matches
      ? `${matches} matching ${matches === 1 ? 'link' : 'links'}`
      : 'No guides found. Try a plot or module name.';
    if (!terms.length && savedState) {
      sidebar.scrollTop = savedState.scrollTop;
      savedState = undefined;
    } else if (terms.length) sidebar.scrollTop = 0;
  };
  const clearFilter = () => {
    input.value = '';
    filter();
  };
  if (input && clearButton && status) {
    input.addEventListener('input', filter);
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' && input.value) {
        event.preventDefault();
        event.stopPropagation(); // Clear first; a second Escape may close the mobile menu.
        clearFilter();
      } else if (event.key === 'ArrowDown') {
        const first = links.find(link => !link.hidden && !link.closest('details').hidden && link.closest('details').open);
        if (first) {
          event.preventDefault();
          first.focus({ preventScroll: true });
          reveal(first);
        }
      }
    });
    clearButton.addEventListener('click', () => {
      clearFilter();
      input.focus({ preventScroll: true });
    });
    pageLinks.forEach(link => link.addEventListener('click', event => {
      if (!savedState || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      clearFilter();
      requestAnimationFrame(syncCurrent);
    }));
  }

  syncCurrent();
  window.addEventListener('hashchange', syncCurrent);
  document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
    if (document.body.classList.contains('nav-open')) revealCurrent();
  });
})();
