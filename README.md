# YouTube Cleaner

Extensão para navegadores que remove elementos desnecessários do YouTube, deixando a navegação mais limpa e focada.

## O que é removido

| Elemento | Onde |
|---|---|
| Shelf de **YouTube Shorts** | Homepage, resultados de busca |
| Vídeos individuais marcados como Shorts | Resultados de busca |
| Link **Shorts** | Menu lateral esquerdo |
| Aba **Shorts** | Páginas de canal |
| Seção **Explorar** | Menu lateral esquerdo |
| Seção **Mais do YouTube** | Menu lateral esquerdo |


## Como instalar

1. Abra `chrome://extensions` (ou `edge://extensions`) ou a aba de extensões do seu navegador.
2. Ative o **Modo do desenvolvedor** (toggle no canto superior direito).
3. Clique em **Carregar sem compactação** (_Load unpacked_).
4. Selecione esta pasta (`YTExtension`).
5. Acesse o YouTube — os elementos serão removidos automaticamente.

## Como funciona

- **`style.css`** é injetado em `document_start`, ocultando os seletores conhecidos antes mesmo da página renderizar, evitando _flash_ de conteúdo.
- **`content.js`** usa um `MutationObserver` que observa o DOM inteiro para capturar novos elementos inseridos dinamicamente pelo YouTube (SPA). Um debounce de 150 ms garante que o observer não sobrecarregue a página.
- Os eventos `yt-navigate-finish` e `yt-page-data-updated` disparam uma limpeza extra a cada navegação interna.
- Seções do menu lateral (Explorar / Mais do YouTube) são identificadas pelo texto do título `#guide-section-title` e suportam PT, EN e ES.
