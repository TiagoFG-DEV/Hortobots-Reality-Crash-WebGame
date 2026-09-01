// TERMINAL/public/js/terminal-audio.js - Gerenciador de Áudio com SFX Retro de Jogos Antigos e Músicas Originais
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

    // MÚSICAS ORIGINAIS DO JOGO (PRESERVADAS RIGOROSAMENTE)
    this.tracks = {
      title: '/audio/Relax and Choose Your Champion.mp3',
      lobby: '/audio/Lobby Theme.mp3',
      elevator: '/audio/Elevador Theme.mp3',
      forestBattle: "/audio/Lizard's Roar.mp3",
      desertBattle: '/audio/Cowputer-Fight.mp3',
      iceBattle: '/audio/Dance With the Penguim!.mp3',
      bossBattle: '/audio/Crown of the Violet Tyrant.mp3',
      credits: '/audio/The Final Credits.mp3',
      chapolin: '/audio/CHAPOLIN COLORADO.mp3',
      giEntrance: '/audio/G.I Entrance.mp3',
      lastGoodbye: '/audio/Last Goodbye.mp3',
      violetTape: '/audio/Violet Tyrant on Tape.mp3',
      relaxLizard: '/audio/Relax, Lizardilhas.mp3'
    };

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
  }

  initCtx() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBGM(key, fadeDurationMs = 500) {
    if (this.isMuted) return;
    const url = this.tracks[key];
    if (!url) return;

    if (this.currentTrack === key && !this.bgmAudio.paused) return;

    // Transição suave de Fade Out -> Troca de Faixa -> Fade In
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    if (!this.bgmAudio.paused && this.bgmAudio.currentTime > 0) {
      const steps = 15;
      const stepTime = fadeDurationMs / steps;
      let currentVol = this.bgmAudio.volume;

      this.fadeInterval = setInterval(() => {
        currentVol = Math.max(0, currentVol - (this.targetVolume / steps));
        this.bgmAudio.volume = currentVol;

        if (currentVol <= 0.02) {
          clearInterval(this.fadeInterval);
          this.currentTrack = key;
          this.bgmAudio.src = url;
          this.bgmAudio.volume = 0;
          this.bgmAudio.play().then(() => {
            this.fadeInBGM(fadeDurationMs);
          }).catch(() => {});
        }
      }, stepTime);
    } else {
      this.currentTrack = key;
      this.bgmAudio.src = url;
      this.bgmAudio.volume = 0;
      this.bgmAudio.play().then(() => {
        this.fadeInBGM(fadeDurationMs);
      }).catch(() => {});
    }
  }

  fadeInBGM(durationMs = 600) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const steps = 15;
    const stepTime = durationMs / steps;
    let currentVol = 0;

    this.fadeInterval = setInterval(() => {
      currentVol = Math.min(this.targetVolume, currentVol + (this.targetVolume / steps));
      this.bgmAudio.volume = currentVol;

      if (currentVol >= this.targetVolume) {
        clearInterval(this.fadeInterval);
        this.bgmAudio.volume = this.targetVolume;
      }
    }, stepTime);
  }

  fadeOutBGM(durationMs = 800) {
    return new Promise((resolve) => {
      if (this.fadeInterval) clearInterval(this.fadeInterval);
      if (this.bgmAudio.paused) {
        this.currentTrack = null;
        resolve();
        return;
      }
      const steps = 15;
      const stepTime = durationMs / steps;
      let currentVol = this.bgmAudio.volume;

      this.fadeInterval = setInterval(() => {
        currentVol = Math.max(0, currentVol - (this.targetVolume / steps));
        this.bgmAudio.volume = currentVol;

        if (currentVol <= 0.02) {
          clearInterval(this.fadeInterval);
          this.bgmAudio.pause();
          this.bgmAudio.volume = this.targetVolume;
          this.currentTrack = null;
          resolve();
        }
      }, stepTime);
    });
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
