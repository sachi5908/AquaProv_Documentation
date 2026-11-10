/* Preserve download filenames when public files are served from Cloudinary. */
(() => {
  'use strict';
  document.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[download]');
    if (!link || new URL(link.href).hostname !== 'res.cloudinary.com') return;
    event.preventDefault();
    if (link.getAttribute('aria-busy') === 'true') return;
    link.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(link.href, { credentials: 'omit' });
      if (!response.ok) throw new Error('Download unavailable');
      const objectUrl = URL.createObjectURL(await response.blob());
      const download = document.createElement('a');
      download.href = objectUrl;
      download.download = link.download || decodeURIComponent(new URL(link.href).pathname.split('/').pop());
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (_) {
      window.location.assign(link.href);
    } finally {
      link.removeAttribute('aria-busy');
    }
  });
})();
