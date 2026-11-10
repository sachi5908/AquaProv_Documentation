/* A readable initial page in the native viewer; its own zoom controls remain available. */
(() => {
  const reader = document.querySelector('.manual-pdf');
  if (!reader) return;
  // Narrow PDF viewers fit the page to their width. An explicit desktop zoom
  // avoids the oversized initial FitH rendering in Edge's embedded reader.
  const view = window.matchMedia('(max-width: 600px)').matches
    ? '#page=1&view=FitH&navpanes=0'
    : '#page=1&zoom=75&navpanes=0';
  reader.loading = 'lazy';
  if (window.AquaProvLoading) window.AquaProvLoading.deferFrame(reader, reader.dataset.pdf + view);
  else reader.src = reader.dataset.pdf + view;
})();
