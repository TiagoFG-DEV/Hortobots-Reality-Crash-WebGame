// ═══════════════════════════════════════════════════════════════════
// android-app.js — Controlador do Web App Android (PWA / Mobile / Offline)
// Recursos: Tela Cheia Nativa, Service Worker, Instalação PWA,
// Persistência Híbrida (LocalStorage + IndexedDB + Cloud Sync) e Haptic Feedback.
// ═══════════════════════════════════════════════════════════════════

class AndroidWebAppController {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOffline = !navigator.onLine;
    this.dbName = 'HortobotsOfflineDB';
    this.dbVersion = 1;
    this.db = null;

    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupNetworkMonitoring();
    this.setupFullscreenSupport();
    this.initIndexedDB();
    this.setupHapticFeedback();
  }

  // 1. Registro do Service Worker PWA
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[Android WebApp] Service Worker registrado com sucesso! Escopo:', reg.scope);
          })
          .catch((err) => {
            console.warn('[Android WebApp] Falha ao registrar Service Worker:', err);
          });
      });
    }
  }

  // 2. Prompt de Instalação do App no Android
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.renderInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[Android WebApp] Aplicativo instalado com sucesso no dispositivo Android!');
      this.isInstalled = true;
      this.deferredPrompt = null;
      const btn = document.getElementById('btnInstallAndroidApp');
      if (btn) btn.classList.add('hidden');
      if (window.gameInstance && typeof window.gameInstance.showSystemToast === 'function') {
        window.gameInstance.showSystemToast('APP INSTALADO', 'Hortobots foi instalado com sucesso na sua tela inicial!', 'success');
      }
    });

    // Detecta se já está rodando como standalone/PWA instalado
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.isInstalled = true;
    }
  }

  renderInstallButton() {
    if (this.isInstalled || !this.deferredPrompt) return;
    let btn = document.getElementById('btnInstallAndroidApp');
    if (!btn) {
      const controls = document.querySelector('.term-controls');
      if (controls) {
        btn = document.createElement('button');
        btn.id = 'btnInstallAndroidApp';
        btn.className = 'term-btn gold';
        btn.style.fontSize = '0.78rem';
        btn.style.padding = '4px 10px';
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          <span>[ INSTALAR APP ]</span>
        `;
        btn.onclick = () => this.triggerInstall();
        controls.prepend(btn);
      }
    } else {
      btn.classList.remove('hidden');
    }
  }

  async triggerInstall() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[Android WebApp] Resposta de instalação do usuário:', outcome);
    this.deferredPrompt = null;
    const btn = document.getElementById('btnInstallAndroidApp');
    if (btn) btn.classList.add('hidden');
  }

  // 3. Monitoramento de Rede e Conectividade
  setupNetworkMonitoring() {
    const updateStatus = () => {
      this.isOffline = !navigator.onLine;
      const indicator = document.getElementById('pwaOfflineBadge');
      if (indicator) {
        indicator.style.display = this.isOffline ? 'inline-flex' : 'none';
      }
      if (this.isOffline) {
        if (window.gameInstance && typeof window.gameInstance.showSystemToast === 'function') {
          window.gameInstance.showSystemToast('MODO OFFLINE', 'Conexão perdida. Progresso continua sendo salvo localmente!', 'warning');
        }
      } else {
        if (window.gameInstance && typeof window.gameInstance.showSystemToast === 'function') {
          window.gameInstance.showSystemToast('ONLINE', 'Conexão restabelecida! Progresso sincronizado.', 'success');
        }
        this.syncLocalProgressToCloud();
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }

  // 4. Suporte a Tela Inteira (Fullscreen & Screen Orientation)
  setupFullscreenSupport() {
    const requestFull = () => {
      const docEl = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      }
    };

    // Ativa fullscreen no primeiro clique/toque de início de sessão
    const btnStart = document.getElementById('titleStartBtn');
    if (btnStart) {
      btnStart.addEventListener('click', requestFull, { once: true });
    }
    const btnToggle = document.getElementById('btnToggleFullscreenMobile');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        const doc = document;
        const docEl = document.documentElement;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
          if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
          else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        } else {
          if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        }
      });
    }
    document.addEventListener('touchstart', () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        requestFull();
      }
    }, { once: true });
  }

  // 5. IndexedDB para Persistência Offline Robusta
  initIndexedDB() {
    if (!('indexedDB' in window)) return;
    const req = indexedDB.open(this.dbName, this.dbVersion);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('gameState')) {
        db.createObjectStore('gameState', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      this.db = e.target.result;
      console.log('[Android WebApp] IndexedDB inicializado para persistência offline!');
    };
    req.onerror = (e) => {
      console.warn('[Android WebApp] Erro ao abrir IndexedDB:', e);
    };
  }

  async saveOfflineState(key, data) {
    if (!this.db) {
      try { localStorage.setItem(`hortobots_offline_${key}`, JSON.stringify(data)); } catch (_) {}
      return;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction('gameState', 'readwrite');
        const store = tx.objectStore('gameState');
        store.put({ id: key, data, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  async loadOfflineState(key) {
    if (!this.db) {
      try {
        const raw = localStorage.getItem(`hortobots_offline_${key}`);
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction('gameState', 'readonly');
        const store = tx.objectStore('gameState');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  // Sincroniza dados locais com a conta quando restabelecer conexão
  syncLocalProgressToCloud() {
    if (window.gameInstance && typeof window.gameInstance.saveGameData === 'function') {
      window.gameInstance.saveGameData();
    }
  }

  // 6. Feedback Tátil (Haptic)
  setupHapticFeedback() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('button, .term-btn, .versus-coin-choice-btn, .party-id-action')) {
        if ('vibrate' in navigator) {
          try { navigator.vibrate(12); } catch (_) {}
        }
      }
    }, true);
  }
}

export const androidApp = new AndroidWebAppController();
window.androidApp = androidApp;
