// ═══════════════════════════════════════════════════════════════════
// game-settings.js — Gerenciador Central de Configurações e Otimização
// Suporta: Perfis Gráficos (Baixo, Médio, Alto), Efeitos CRT, Mute e Volumes
// Persistência: localStorage ('hortobots_game_settings')
// ═══════════════════════════════════════════════════════════════════

const SETTINGS_KEY = 'hortobots_game_settings';

export const DEFAULT_SETTINGS = {
  graphics: 'high',     // 'low' | 'medium' | 'high'
  scanlines: true,      // Overlay CRT Scanlines
  glow: true,           // Brilhos fosfóricos e sombras de neon
  masterMute: false,    // Mute geral de áudio
  bgmVolume: 80,        // 0 a 100
  sfxVolume: 90         // 0 a 100
};

class GameSettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações:', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações:', e);
    }
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : DEFAULT_SETTINGS[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    this.apply();
    this.notify(key, value);
  }

  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.save();
    this.apply();
    Object.keys(newSettings).forEach(k => this.notify(k, newSettings[k]));
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(key, value) {
    this.listeners.forEach(cb => {
      try { cb(key, value, this.settings); } catch (e) {}
    });
  }

  apply() {
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) return;

    // 1. Aplica classes de perfil gráfico
    body.classList.remove('graphics-low', 'graphics-medium', 'graphics-high');
    body.classList.add(`graphics-${this.settings.graphics}`);

    // 2. Scanlines CRT e Overlays Visuais
    const isLow = this.settings.graphics === 'low';
    const scanlinesEl = document.querySelector('.crt-scanlines');
    if (scanlinesEl) {
      scanlinesEl.style.display = (this.settings.scanlines && !isLow) ? 'block' : 'none';
    }

    const glareEl = document.querySelector('.crt-glass-glare');
    if (glareEl) {
      glareEl.style.display = isLow ? 'none' : 'block';
    }

    const fisheyeEl = document.querySelector('.crt-fisheye-overlay');
    if (fisheyeEl) {
      fisheyeEl.style.display = isLow ? 'none' : 'block';
    }

    const vignetteEl = document.querySelector('.crt-vignette');
    if (vignetteEl) {
      vignetteEl.style.display = isLow ? 'none' : 'block';
    }

    const monitorContainer = document.querySelector('.crt-monitor-container');
    if (monitorContainer) {
      monitorContainer.style.filter = isLow ? 'none' : 'url(#crtBarrelDistortion)';
    }

    // 3. Efeitos de Brilho / Glow
    if (!this.settings.glow || isLow) {
      root.style.setProperty('--term-glow-strength', '0.0');
      body.classList.add('low-glow');
    } else {
      root.style.removeProperty('--term-glow-strength');
      body.classList.remove('low-glow');
    }

    // 4. Áudio
    if (window.gameAudio) {
      if (typeof window.gameAudio.setMasterMute === 'function') {
        window.gameAudio.setMasterMute(this.settings.masterMute);
      }
      if (typeof window.gameAudio.setBGMVolume === 'function') {
        window.gameAudio.setBGMVolume(this.settings.masterMute ? 0 : this.settings.bgmVolume / 100);
      }
      if (typeof window.gameAudio.setSFXVolume === 'function') {
        window.gameAudio.setSFXVolume(this.settings.masterMute ? 0 : this.settings.sfxVolume / 100);
      }
    }
  }
}

export const gameSettings = new GameSettingsManager();
window.gameSettings = gameSettings;
