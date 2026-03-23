'use strict';

const BLOCKED_SECTION_TITLES = new Set([
  'Explore', 'More from YouTube',
  'Explorar', 'Mais do YouTube', 'Más de YouTube',
]);

function hide(el) {
  if (el && el.style.display !== 'none') {
    el.style.setProperty('display', 'none', 'important');
  }
}

function hasShortContent(el) {
  return !!el.querySelector(
    'ytm-shorts-lockup-view-model-v2,ytm-shorts-lockup-view-model,' +
    'ytd-reel-item-renderer,ytd-reel-shelf-renderer'
  );
}

function processNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  switch (node.tagName.toLowerCase()) {

    // ─── Sempre Shorts (CSS também cobre) ─────────────────────────────────
    case 'ytd-reel-shelf-renderer':
    case 'ytd-shorts':
      hide(node);
      break;

    case 'ytd-reel-item-renderer':
    case 'ytm-shorts-lockup-view-model-v2':
    case 'ytm-shorts-lockup-view-model': {
      hide(node);
      // Sobe até o shelf pai para remover também o cabeçalho "Shorts"
      const shelf = node.closest('grid-shelf-view-model,ytd-shelf-renderer,ytd-reel-shelf-renderer');
      if (shelf) hide(shelf);
      break;
    }

    // ─── Vídeo individual marcado como Shorts ─────────────────────────────
    case 'ytd-video-renderer':
    case 'ytd-compact-video-renderer':
      if (node.getAttribute('overlay-style') === 'SHORTS') hide(node);
      break;

    // ─── Seção Shorts na homepage ─────────────────────────────────────────
    case 'ytd-rich-section-renderer':
      if (node.hasAttribute('is-shorts')) hide(node);
      break;

    // ─── Shelf de Shorts na busca (design 2024/2025) ──────────────────────
    // Escondemos apenas o grid-shelf-view-model, NÃO o ytd-item-section-renderer
    // pai. Isso evita encolher a página e disparar o infinite scroll.
    case 'grid-shelf-view-model':
      if (hasShortContent(node)) hide(node);
      break;

    // ─── item-section pode vir com grid-shelf já dentro (subtree completo) ─
    case 'ytd-item-section-renderer':
      node.querySelectorAll('grid-shelf-view-model').forEach(shelf => {
        if (hasShortContent(shelf)) hide(shelf);
      });
      break;

    // ─── Shelf standalone ("Mais Shorts de [canal]", estilo antigo) ────────
    case 'ytd-shelf-renderer': {
      if (hasShortContent(node)) { hide(node); break; }
      const titleEl = node.querySelector('#title-text, yt-formatted-string#title');
      if (titleEl && /\bshorts\b/i.test(titleEl.textContent)) hide(node);
      break;
    }

    // ─── Chip de filtro na busca ──────────────────────────────────────────
    case 'yt-chip-cloud-chip-renderer':
      if (node.querySelector('a[href*="shorts"]')) hide(node);
      break;

    // ─── Aba Shorts em páginas de canal ──────────────────────────────────
    case 'yt-tab-shape':
      if (node.getAttribute('tab-title') === 'Shorts') hide(node);
      break;

    // ─── Menu lateral – links ─────────────────────────────────────────────
    case 'ytd-guide-entry-renderer':
    case 'ytd-mini-guide-entry-renderer': {
      const href = node.querySelector('a')?.getAttribute('href') || '';
      const label = node.querySelector('yt-formatted-string,.title')?.textContent?.trim() || '';
      if (href.startsWith('/shorts') || /^shorts$/i.test(label)) hide(node);
      break;
    }

    // ─── Menu lateral – seções (Explorar / Mais do YouTube) ──────────────
    case 'ytd-guide-section-renderer': {
      const titleEl = node.querySelector('#guide-section-title');
      if (titleEl && BLOCKED_SECTION_TITLES.has(titleEl.textContent.trim())) hide(node);
      break;
    }

    // Tags desconhecidas: ignorar.
    // Com subtree:true o observer já notifica os filhos individualmente
    // quando inseridos — não é necessário querySelectorAll aqui.
  }
}

// Varredura completa — roda uma vez ao carregar e uma vez por navegação SPA
function fullClean() {
  document.querySelectorAll(
    'ytd-reel-shelf-renderer,ytd-shorts,ytd-reel-item-renderer,' +
    'ytm-shorts-lockup-view-model-v2,ytm-shorts-lockup-view-model'
  ).forEach(hide);
  document.querySelectorAll(
    'ytd-video-renderer[overlay-style="SHORTS"],' +
    'ytd-compact-video-renderer[overlay-style="SHORTS"],' +
    'ytd-rich-section-renderer[is-shorts]'
  ).forEach(hide);
  document.querySelectorAll('yt-chip-cloud-chip-renderer').forEach(c => {
    if (c.querySelector('a[href*="shorts"]')) hide(c);
  });
  document.querySelectorAll('yt-tab-shape[tab-title="Shorts"]').forEach(hide);
  document.querySelectorAll('grid-shelf-view-model').forEach(s => {
    if (hasShortContent(s)) hide(s);
  });
  document.querySelectorAll('ytd-shelf-renderer').forEach(s => {
    if (hasShortContent(s)) { hide(s); return; }
    const t = s.querySelector('#title-text, yt-formatted-string#title');
    if (t && /\bshorts\b/i.test(t.textContent)) hide(s);
  });
  document.querySelectorAll('ytd-guide-entry-renderer,ytd-mini-guide-entry-renderer').forEach(e => {
    const href = e.querySelector('a')?.getAttribute('href') || '';
    const label = e.querySelector('yt-formatted-string,.title')?.textContent?.trim() || '';
    if (href.startsWith('/shorts') || /^shorts$/i.test(label)) hide(e);
  });
  document.querySelectorAll('ytd-guide-section-renderer').forEach(s => {
    const t = s.querySelector('#guide-section-title');
    if (t && BLOCKED_SECTION_TITLES.has(t.textContent.trim())) hide(s);
  });
}

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      processNode(node);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

fullClean();
document.addEventListener('yt-navigate-finish', fullClean);