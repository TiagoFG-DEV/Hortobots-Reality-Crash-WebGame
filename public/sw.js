// ═══════════════════════════════════════════════════════════════════
// sw.js — Service Worker Offline PWA para Hortobots Android Web App
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME = 'hortobots-pwa-v1.2.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/terminal.css',
  './js/terminal-game.js',
  './js/terminal-minigames.js',
  './js/terminal-audio.js',
  './js/terminal-3d.js',
  './js/versus-ui.js',
  './js/versus-board.js',
  './js/versus-minigames.js',
  './js/versus-engine.js',
  './js/versus-themes.js',
  './js/story-board.js',
  './js/shield-fx.js',
  './js/combat-sprites.js',
  './js/robot-attack-symbols.js',
  './img/cara-icon.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable.png',
  './img/crt-displacement-map.png',
  './img/space-key.png'
];

// Instalação do Service Worker e Pre-cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Hortobots SW] Armazenando App Shell no Cache Offline...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Hortobots SW] Erro ao cachear alguns arquivos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de versões antigas de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Hortobots SW] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Cache-First com fallback para rede, atualizando em background
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora requisições não-GET e chamadas do Google Sign-In ou WebSockets
  if (req.method !== 'GET' || url.protocol.startsWith('ws') || url.hostname.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Busca versão atualizada em background se houver rede
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse.clone()));
          }
        }).catch(() => {/* Offline: continua usando cache */});
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede e guarda no cache
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback offline caso tente abrir a raiz
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
