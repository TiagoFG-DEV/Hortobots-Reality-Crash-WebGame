// TERMINAL/public/js/terminal-audio.js - Gerenciador de Áudio com SFX Retro de Jogos Antigos e Músicas Originais
import { BeatPulseManager } from './beat-pulse-manager.js';

export class TerminalAudioManager {
  constructor() {
    this.audioCtx = null;
    this.bgmAudio = new Audio();
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.65;
    this.targetVolume = 0.65;
    this.currentTrack = null;
    this.isMuted = false;
    this.fadeInterval = null;

    // MÚSICAS ORIGINAIS DO JOGO (PRESERVADAS RIGOROSAMENTE CONFORME DIRETRIZES DO USUÁRIO)
    this.tracks = {
      // Menu Principal e Hubs do MODO HISTÓRIA (Obrigatório: Lobby Theme.mp3)
      title: '/audio/Lobby Theme.mp3',
      lobby: '/audio/Lobby Theme.mp3',
      elevator: '/audio/Lobby Theme.mp3',
      storyLobby: '/audio/Lobby Theme.mp3',
      champion: '/audio/Relax and Choose Your Champion.mp3',
      menuAlt: '/audio/Lobby Theme.mp3',
      violetTape: '/audio/Relax and Choose Your Champion.mp3',

      // Menus e Telas do MODO VERSUS (Obrigatório: Lizardilhas POP Theme.mp3)
      versusLobby: '/audio/Lizardilhas POP Theme.mp3',
      versusDraft: '/audio/Lizardilhas POP Theme.mp3',
      popTheme: '/audio/Lizardilhas POP Theme.mp3',
      versusBattle: '/audio/Energetic Battle Tendence.mp3',
      versusVictory: '/audio/The Final Credits.mp3',

      // Batalhas Oficiais do Jogo
      forestBattle: "/audio/Lizard's Roar.mp3",
      desertBattle: '/audio/Cowputer-Fight.mp3',
      iceBattle: '/audio/Dance With The Penguim!.mp3',
      duelGrand: '/audio/TechnoTitans In Action.mp3',
      titansAction: '/audio/TechnoTitans In Action.mp3',
      titanBattle: '/audio/TechnoTitans In Action.mp3',
      bossBattle: '/audio/Crown of the Violet Tyrant.mp3',

      // Trilha de Duelos PVP entre Jogadores (Roleta Aleatória)
      energeticBattle: '/audio/Energetic Battle Tendence.mp3',
      lizardsPulse: "/audio/Lizard's Pulse.mp3",
      lizardsOmega: "/audio/Lizard's Omega Powered.mp3",

      // Faixas Narrativas / Especiais
      credits: '/audio/The Final Credits.mp3',
      relaxCredits: '/audio/Relax, Lizardilhas.mp3',
      chapolin: '/audio/CHAPOLIN COLORADO.mp3',
      giEntrance: '/audio/G.I Entrance.mp3',
      lastGoodbye: '/audio/Last Goodbye.mp3',
      relaxLizard: '/audio/Relax, Lizardilhas.mp3'
    };

    // Coleção de Trilhas de Duelo PVP entre Jogadores
    this.versusDuelTracks = [
      'energeticBattle',
      'lizardsPulse',
      'lizardsOmega'
    ];

    // Coleção Oficial das Músicas de Batalha da Campanha
    this.battleTracksList = [
      { key: 'forestBattle', name: "Lizard's Roar", url: "/audio/Lizard's Roar.mp3" },
      { key: 'desertBattle', name: 'Cowputer-Fight', url: '/audio/Cowputer-Fight.mp3' },
      { key: 'iceBattle', name: 'Dance With The Penguim!', url: '/audio/Dance With The Penguim!.mp3' },
      { key: 'titansAction', name: 'TechnoTitans In Action', url: '/audio/TechnoTitans In Action.mp3' },
      { key: 'duelGrand', name: 'TechnoTitans In Action', url: '/audio/TechnoTitans In Action.mp3' },
      { key: 'bossBattle', name: 'Crown of the Violet Tyrant', url: '/audio/Crown of the Violet Tyrant.mp3' }
    ];

    // BANCO DE SOUND EFFECTS RETRO (JOGOS CLÁSSICOS 8-BIT / ARCADE)
    this.sfxBank = {
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      slash: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      laser: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
      impact: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
      coin: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      heal: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      powerup: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
      denied: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
      victory: 'https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3'
    };

    // Gerenciador de Beat Pulse e Camera Shake de Batalha
    this.beatPulseManager = new BeatPulseManager(this);
    if (typeof window !== 'undefined') {
      window.terminalAudioManager = this;
      window.getBeatPulseManager = () => this.beatPulseManager;
    }

    this._setupAutoplayUnlock();
  }

  _setupAutoplayUnlock() {
    const unlock = () => {
      this.initCtx();
      if (this.currentTrack && this.bgmAudio.paused && !this.isMuted) {
        this.bgmAudio.play().then(() => {
          this.fadeInBGM(600);
        }).catch(() => {});
      }
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  initCtx() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.beatPulseManager && !this.beatPulseManager.isInitialized) {
      this.beatPulseManager.initAudioGraph(this.audioCtx, this.bgmAudio);
    }
  }

  playBGM(key, fadeDurationMs = 600) {
    if (this.isMuted) return;
    this.initCtx();
    const url = this.tracks[key];
    if (!url) {
      console.warn(`[Audio] Faixa não encontrada: ${key}`);
      return;
    }

    if (this.currentTrack === key && !this.bgmAudio.paused) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Transição suave de Fade Out -> Troca de Faixa -> Fade In
    if (!this.bgmAudio.paused && this.bgmAudio.currentTime > 0) {
      const steps = 15;
      const stepTime = Math.max(16, Math.floor(fadeDurationMs / steps));
      let currentVol = this.bgmAudio.volume;

      this.fadeInterval = setInterval(() => {
        currentVol = Math.max(0, currentVol - (this.targetVolume / steps));
        this.bgmAudio.volume = currentVol;

        if (currentVol <= 0.02) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          this.currentTrack = key;
          this.bgmAudio.src = url;
          this.bgmAudio.volume = 0;
          this.bgmAudio.play().then(() => {
            this.fadeInBGM(fadeDurationMs);
          }).catch((err) => {
            console.warn('[Audio] Aguardando interação para reprodução de BGM:', err);
          });
        }
      }, stepTime);
    } else {
      this.currentTrack = key;
      this.bgmAudio.src = url;
      this.bgmAudio.volume = 0;
      this.bgmAudio.play().then(() => {
        this.fadeInBGM(fadeDurationMs);
      }).catch((err) => {
        console.warn('[Audio] Aguardando interação para reprodução de BGM:', err);
      });
    }
  }

  fadeInBGM(durationMs = 600) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const steps = 15;
    const stepTime = Math.max(16, Math.floor(durationMs / steps));
    let currentVol = 0;
    this.bgmAudio.volume = 0;

    this.fadeInterval = setInterval(() => {
      currentVol = Math.min(this.targetVolume, currentVol + (this.targetVolume / steps));
      this.bgmAudio.volume = currentVol;

      if (currentVol >= this.targetVolume) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.bgmAudio.volume = this.targetVolume;
      }
    }, stepTime);
  }

  fadeOutBGM(durationMs = 700) {
    return new Promise((resolve) => {
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
      if (this.bgmAudio.paused) {
        this.currentTrack = null;
        resolve();
        return;
      }
      const steps = 15;
      const stepTime = Math.max(16, Math.floor(durationMs / steps));
      let currentVol = this.bgmAudio.volume;

      this.fadeInterval = setInterval(() => {
        currentVol = Math.max(0, currentVol - (this.targetVolume / steps));
        this.bgmAudio.volume = currentVol;

        if (currentVol <= 0.02) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          this.bgmAudio.pause();
          this.bgmAudio.volume = this.targetVolume;
          this.currentTrack = null;
          resolve();
        }
      }, stepTime);
    });
  }

  getRandomBattleTrackKey() {
    if (!this.battleTracksList || !this.battleTracksList.length) return 'bossBattle';
    const track = this.battleTracksList[Math.floor(Math.random() * this.battleTracksList.length)];
    return track.key;
  }

  playBattleBGM(specificKey = null, fadeDurationMs = 600) {
    const key = specificKey || this.getRandomBattleTrackKey();
    this.playBGM(key, fadeDurationMs);
  }

  getRandomVersusDuelKey() {
    if (!this.versusDuelTracks || !this.versusDuelTracks.length) return 'energeticBattle';
    const idx = Math.floor(Math.random() * this.versusDuelTracks.length);
    return this.versusDuelTracks[idx];
  }

  playVersusDuelBGM(fadeDurationMs = 600) {
    const key = this.getRandomVersusDuelKey();
    console.log(`[Audio] Trilha sorteada para o Duelo PVP: ${key}`);
    this.playBGM(key, fadeDurationMs);
    return key;
  }

  playMenuBGM(preferAlt = false, fadeDurationMs = 600) {
    const key = preferAlt ? 'violetTape' : 'lobby';
    this.playBGM(key, fadeDurationMs);
  }

  stopBGM() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.bgmAudio.pause();
    this.currentTrack = null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.bgmAudio.pause();
    } else {
      if (this.currentTrack) this.bgmAudio.play().catch(() => {});
    }
    return this.isMuted;
  }

  // REPRODUTOR DE SFX RETRO COM FALLBACK SINTETIZADO
  playRetroSample(key, fallbackFn) {
    if (this.isMuted) return;
    const url = this.sfxBank[key];
    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play().catch(() => {
        if (fallbackFn) fallbackFn();
      });
    } else if (fallbackFn) {
      fallbackFn();
    }
  }

  playVictoryFanfare() {
    this.playRetroSample('victory', () => {
      this.playBeep(523.25, 'triangle', 0.15);
      setTimeout(() => this.playBeep(659.25, 'triangle', 0.15), 120);
      setTimeout(() => this.playBeep(783.99, 'triangle', 0.15), 240);
      setTimeout(() => this.playBeep(1046.50, 'triangle', 0.4), 360);
    });
  }

  playKeyClack() {
    this.playRetroSample('click', () => {
      this.playBeep(1200 + Math.random() * 400, 'square', 0.02);
    });
  }

  playAccessDenied() {
    this.playRetroSample('denied', () => {
      this.playBeep(180, 'sawtooth', 0.18);
    });
  }

  playDeniedSound() {
    this.playAccessDenied();
  }

  playBuzzer() {
    this.playAccessDenied();
  }

  playError() {
    this.playAccessDenied();
  }

  playHeavyImpact() {
    this.playRetroSample('impact', () => {
      this.playBeep(90, 'triangle', 0.25);
    });
  }

  playHealSound() {
    this.playRetroSample('heal', () => {
      this.playBeep(600, 'sine', 0.1);
      setTimeout(() => this.playBeep(900, 'sine', 0.15), 80);
    });
  }

  playPowerUp() {
    this.playRetroSample('powerup', () => {
      this.playBeep(400, 'sawtooth', 0.08);
      setTimeout(() => this.playBeep(600, 'sawtooth', 0.08), 70);
      setTimeout(() => this.playBeep(900, 'sawtooth', 0.12), 140);
    });
  }

  playCoinSound() {
    this.playRetroSample('coin', () => {
      this.playBeep(987.77, 'square', 0.12);
    });
  }

  playSlashSound() {
    this.playRetroSample('slash', () => {
      this.playBeep(350, 'sawtooth', 0.12);
    });
  }

  playLaserSound() {
    this.playRetroSample('laser', () => {
      this.playBeep(850, 'sine', 0.1);
    });
  }

  playGlassBreak() {
    if (this.isMuted) return;
    this.initCtx();
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      // Resonância cristalina de agudos (vidro partindo)
      const freqs = [1900, 2600, 3400, 4200];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 120, now + i * 0.012);
        g.gain.setValueAtTime(0.04, now + i * 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + i * 0.03);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.012);
        osc.stop(now + 0.32);
      });

      // Ruído filtrado de estilhaço sutil (baixo som de vidro quebrando)
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.045, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.16);
    } catch (e) {}
  }

  playBeep(freq = 440, type = 'sine', duration = 0.08) {
    if (this.isMuted) return;
    this.initCtx();

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }
}

let _globalAudioInstance = null;
export function getAudio() {
  if (typeof window !== 'undefined') {
    if (window.gameInstance && window.gameInstance.audio) return window.gameInstance.audio;
    if (window._versusAudio) return window._versusAudio;
    window._versusAudio = new TerminalAudioManager();
    return window._versusAudio;
  }
  if (!_globalAudioInstance) _globalAudioInstance = new TerminalAudioManager();
  return _globalAudioInstance;
}

