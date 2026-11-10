/* Shared shimmer placeholders and deferred media, including the web manual. */
(() => {
  'use strict';
  const media = new WeakMap();
  const shells = new WeakMap();
  const pending = new Set();
  const alreadyLoaded = window.AquaProvLoadedMedia || new WeakSet();
  const nearViewport = 'IntersectionObserver' in window ? new IntersectionObserver(records => {
    records.forEach(record => {
      const entry = shells.get(record.target);
      if (!entry) return;
      entry.shell.classList.toggle('is-near', record.isIntersecting);
      if (!record.isIntersecting) return;
      if (entry.activate) {
        const activate = entry.activate;
        entry.activate = null;
        activate();
      }
      armTimeout(entry);
    });
  }, { rootMargin: '240px' }) : null;

  function armTimeout(entry) {
    if (entry.timeout || !pending.has(entry)) return;
    // Reveal the browser's own preview/error if a resource never responds.
    entry.timeout = setTimeout(() => settle(entry, true), 45000);
  }
  function settle(entry, failed = false) {
    clearTimeout(entry.timeout);
    entry.timeout = null;
    pending.delete(entry);
    nearViewport?.unobserve(entry.shell);
    entry.shell.classList.remove('media-loading', 'is-near');
    entry.shell.dataset.loadState = failed ? 'error' : 'ready';
    entry.shell.removeAttribute('aria-busy');
  }
  function start(entry) {
    clearTimeout(entry.timeout);
    entry.timeout = null;
    pending.add(entry);
    entry.shell.classList.add('media-loading');
    entry.shell.dataset.loadState = 'loading';
    entry.shell.setAttribute('aria-busy', 'true');
    if (nearViewport) nearViewport.observe(entry.shell);
    else {
      entry.shell.classList.add('is-near');
      const activate = entry.activate;
      entry.activate = null;
      activate?.();
      armTimeout(entry);
    }
  }
  function makeEntry(element) {
    let shell;
    // The home video is absolutely positioned in an existing ratio container.
    if (element.tagName === 'IFRAME' && getComputedStyle(element).position === 'absolute') {
      shell = element.parentElement;
    } else {
      shell = document.createElement('div');
      element.before(shell);
      shell.append(element);
    }
    shell.classList.add('media-shell');
    if (element.classList.contains('author-photo')) shell.classList.add('media-shell-portrait');
    const entry = { element, shell, source: null, activate: null, timeout: null };
    media.set(element, entry);
    shells.set(shell, entry);
    return entry;
  }
  function imageLoaded(entry) {
    const image = entry.element;
    const source = image.currentSrc || image.src;
    const reveal = () => {
      if ((image.currentSrc || image.src) === source) settle(entry, image.naturalWidth === 0);
    };
    if (typeof image.decode === 'function' && image.naturalWidth) image.decode().then(reveal, reveal);
    else reveal();
  }
  function watchImage(image) {
    if (image.closest('.site-brand, .brand, .home-footer-brand, body > header')) return;
    let entry = media.get(image);
    if (!entry) {
      if (!image.hasAttribute('loading')) image.loading = 'lazy';
      image.decoding = 'async';
      entry = makeEntry(image);
      image.addEventListener('load', () => imageLoaded(entry));
      image.addEventListener('error', () => settle(entry, true));
    }
    if (!image.getAttribute('src') && !image.getAttribute('srcset')) {
      settle(entry);
      return entry;
    }
    entry.source = image.currentSrc || image.src;
    if (image.complete) imageLoaded(entry);
    else start(entry);
    return entry;
  }
  function watchFrame(frame) {
    let entry = media.get(frame);
    if (!entry) {
      frame.loading = 'lazy';
      entry = makeEntry(frame);
      frame.addEventListener('load', () => {
        if (frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank') settle(entry);
      });
      frame.addEventListener('error', () => settle(entry, true));
    }
    const source = frame.getAttribute('src');
    if (!source || source === 'about:blank') return entry;
    if (entry.source && entry.source !== source) alreadyLoaded.delete(frame);
    entry.source = source;
    if (alreadyLoaded.has(frame)) settle(entry);
    else start(entry);
    return entry;
  }
  function deferFrame(frame, source) {
    const entry = watchFrame(frame);
    entry.activate = () => {
      alreadyLoaded.delete(frame);
      entry.source = source;
      frame.src = source;
    };
    start(entry);
  }
  function setImageSource(image, source) {
    const entry = watchImage(image);
    if (entry) start(entry);
    image.src = source;
    watchImage(image);
  }
  function scan(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches('img')) watchImage(node);
    else if (node.matches('iframe')) watchFrame(node);
    node.querySelectorAll('img, iframe').forEach(element => {
      if (element.tagName === 'IMG') watchImage(element);
      else watchFrame(element);
    });
  }

  window.AquaProvLoading = { deferFrame, setImageSource };
  scan(document.body);
  new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'attributes') {
        if (record.target.tagName === 'IMG') watchImage(record.target);
        else if (record.target.tagName === 'IFRAME') watchFrame(record.target);
      } else record.addedNodes.forEach(scan);
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  addEventListener('beforeprint', () => {
    document.documentElement.classList.remove('page-preparing');
    document.querySelectorAll('img[loading="lazy"]').forEach(image => { image.loading = 'eager'; });
  });
})();
