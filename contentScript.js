// Content script helper — not injected by default. Kept for reference and optional use.
(() => {
  const title = document.title || '';
  const url = location.href;
  const meta = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '';
  const selection = window.getSelection ? (window.getSelection().toString() || '') : '';
  const text = (document.body && document.body.innerText) ? document.body.innerText.slice(0, 20000) : '';
  // Expose on window for debug or retrieval by other scripts
  window.__researchAssistantPageData = { title, url, meta, selection, text };
})();
