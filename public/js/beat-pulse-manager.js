// public/js/beat-pulse-manager.js — Sistema de Beat Detection & Camera Shake Rítmico de Batalha
// Utiliza Meyda (ou fallback nativo de FFT Web Audio API) para sincronizar o pulso visual de zoom e camera shake

export class BeatPulseManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.meydaAnalyzer = null;
    this.nativeAnalyser = null;
    this.sourceNode = null;
    this.isInitialized = false;

    // Configurações de sensibilidade e detecção de batidas
    this.lastBeatTime = 0;
    this.minBeatIntervalMs = 175; // Limita a no máximo ~340 BPM para evitar tremores erráticos
    this.energyHistory = [];
    this.historySize = 40;
    this.decayRate = 0.86; // Amortecimento suave por frame (~140ms)

    // Estado da física de pulso
    this.currentPulse = 0;
    this.currentShakeX = 0;
    this.currentShakeY = 0;
    this.animFrameId = null;

    // Configuração de acessibilidade (1.0 = Intenso 100%, 0.5 = Suave 50%, 0 = Desativado)
    const savedSetting = (typeof localStorage !== 'undefined' ? localStorage.getItem('hortobots_beat_pulse_setting') : null) || 'high';
    this.intensitySetting = savedSetting; // 'high' | 'low' | 'off'
    this.intensityMultipliers = { high: 1.0, low: 0.45, off: 0.0 };

    if (typeof window !== 'undefined') {
      this._setupLoop();
    }
  }

  initAudioGraph(audioCtx, bgmAudio) {
    if (this.isInitialized || !audioCtx || !bgmAudio) return;

    try {
      // 1. Cria nó de origem a partir do elemento de áudio (uma única vez por elemento)
      if (!this.sourceNode) {
        this.sourceNode = audioCtx.createMediaElementSource(bgmAudio);
      }

      // 2. Analisador nativo para medição de energia e espectro
      this.nativeAnalyser = audioCtx.createAnalyser();
      this.nativeAnalyser.fftSize = 512;
      this.nativeAnalyser.smoothingTimeConstant = 0.75;

      // 3. Conecta o fluxo: source -> nativeAnalyser -> destination
      this.sourceNode.connect(this.nativeAnalyser);
      this.nativeAnalyser.connect(audioCtx.destination);

      // 4. Integração com Meyda se disponível no escopo global (window.Meyda)
      if (typeof window !== 'undefined' && window.Meyda) {
        try {
          this.meydaAnalyzer = window.Meyda.createMeydaAnalyzer({
            audioContext: audioCtx,
            source: this.sourceNode,
            bufferSize: 512,
            featureExtractors: ['spectralFlux', 'energy', 'rms'],
            callback: (features) => {
              if (features) this._onMeydaFeatures(features);
            }
          });
          this.meydaAnalyzer.start();
          console.log('[BeatPulseManager] Analisador Meyda inicializado com sucesso.');
        } catch (mErr) {
          console.warn('[BeatPulseManager] Falha ao iniciar Meyda, utilizando fallback nativo:', mErr);
        }
      }

      this.isInitialized = true;
      this._updateAccessibilityBadge();
    } catch (err) {
      console.warn('[BeatPulseManager] Erro ao conectar grafo de áudio:', err);
    }
  }

  // Detecção via Meyda Analyzer (Fluxo Espectral & Transientes)
  _onMeydaFeatures(features) {
    if (!this._isBattleActive()) return;

    const mult = this.intensityMultipliers[this.intensitySetting] || 0;
    if (mult <= 0) return;

    const flux = features.spectralFlux || 0;
    const energy = features.energy || features.rms || 0;
    const now = performance.now();

    // Mantém média móvel do fluxo recente
    this.energyHistory.push(flux);
    if (this.energyHistory.length > this.historySize) this.energyHistory.shift();

    const avgFlux = this.energyHistory.reduce((a, b) => a + b, 0) / (this.energyHistory.length || 1);

    // Onset detectado se o fluxo instantâneo superar a média adaptativa
    if (flux > avgFlux * 1.42 && energy > 0.04 && (now - this.lastBeatTime) > this.minBeatIntervalMs) {
      this.lastBeatTime = now;
      const strength = Math.min(1.0, (flux / (avgFlux * 1.5 || 1)) * 0.85);
      this._triggerPulse(strength * mult);
    }
  }

  // Fallback seguro via FFT nativa (medição de sub-grave e bumbo 40Hz a 140Hz)
  _processNativeFFT() {
    if (!this.nativeAnalyser || !this._isBattleActive()) return;

    const mult = this.intensityMultipliers[this.intensitySetting] || 0;
    if (mult <= 0) return;

    const buffer = new Uint8Array(this.nativeAnalyser.frequencyBinCount);
    this.nativeAnalyser.getByteFrequencyData(buffer);

    // Sub-bass & Bass estão nos primeiros 8 bins (para fftSize 512 a 44.1kHz, cada bin = ~86Hz)
    let bassEnergy = 0;
    const bassBins = 6;
    for (let i = 1; i <= bassBins; i++) {
      bassEnergy += buffer[i] || 0;
    }
    bassEnergy = bassEnergy / (bassBins * 255);

    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > this.historySize) this.energyHistory.shift();

    const avgBass = this.energyHistory.reduce((a, b) => a + b, 0) / (this.energyHistory.length || 1);
    const now = performance.now();

    if (bassEnergy > 0.42 && bassEnergy > avgBass * 1.35 && (now - this.lastBeatTime) > this.minBeatIntervalMs) {
      this.lastBeatTime = now;
      const strength = Math.min(1.0, bassEnergy);
      this._triggerPulse(strength * mult);
    }
  }

  _triggerPulse(strength) {
    // Impacto Arcade Intenso: impulso na escala e tremor direcional
    this.currentPulse = Math.min(1.0, this.currentPulse + (strength * 0.95));

    // Deslocamento angular sutil (±2.8px a ±3.2px)
    const angle = Math.random() * Math.PI * 2;
    const dist = (1.8 + Math.random() * 2.0) * strength;
    this.currentShakeX = Math.cos(angle) * dist;
    this.currentShakeY = Math.sin(angle) * dist;

    // Pulso periférico de vinheta neon nas batidas mais fortes
    if (strength > 0.65) {
      this._flashBattleVignette();
    }
  }

  _flashBattleVignette() {
    const activeTarget = this._getActiveBattleElement();
    if (!activeTarget) return;

    let vignette = activeTarget.querySelector('.battle-beat-vignette-overlay');
    if (!vignette) {
      vignette = document.createElement('div');
      vignette.className = 'battle-beat-vignette-overlay';
      activeTarget.appendChild(vignette);
    }

    vignette.classList.remove('pulse-flash');
    void vignette.offsetWidth; // Reflow
    vignette.classList.add('pulse-flash');
  }

  // Verifica se o jogador está estritamente em combate ou na grande cinemática pré-duelo
  _isBattleActive() {
    if (typeof document === 'undefined') return false;
    const preDuel = document.getElementById('preDuelCinematicOverlay');
    if (preDuel && !preDuel.classList.contains('hidden')) return true;

    const storyBattle = document.getElementById('battleScreen');
    const isStoryBattle = storyBattle && !storyBattle.classList.contains('hidden');

    const versusArena = document.getElementById('versusArenaScreen');
    const isVersusBattle = versusArena && !versusArena.classList.contains('hidden');

    return isStoryBattle || isVersusBattle;
  }

  _getActiveBattleElement() {
    if (typeof document === 'undefined') return null;
    const preDuel = document.getElementById('preDuelCinematicOverlay');
    if (preDuel && !preDuel.classList.contains('hidden')) return preDuel;

    const storyBattle = document.getElementById('battleScreen');
    if (storyBattle && !storyBattle.classList.contains('hidden')) return storyBattle;

    const versusArena = document.getElementById('versusArenaScreen');
    if (versusArena && !versusArena.classList.contains('hidden')) return versusArena;

    return null;
  }

  _setupLoop() {
    const loop = () => {
      const isBattle = this._isBattleActive();
      const targetEl = this._getActiveBattleElement();

      if (!isBattle || !targetEl) {
        // Se NÃO estiver em batalha, garante que qualquer transformação seja removida imediatamente
        if (this.currentPulse > 0) {
          this.currentPulse = 0;
          this._resetElementTransforms();
        }
        this.animFrameId = requestAnimationFrame(loop);
        return;
      }

      // Se Meyda não estiver ativo, processa a análise via FFT nativa
      if (!this.meydaAnalyzer) {
        this._processNativeFFT();
      }

      // Amortecimento físico suave (decay exponencial)
      if (this.currentPulse > 0.002) {
        this.currentPulse *= this.decayRate;
        this.currentShakeX *= 0.82;
        this.currentShakeY *= 0.82;

        // Escala arcade: até ~1.032x de zoom na batida máxima
        const scale = 1 + (this.currentPulse * 0.032);
        const tx = (this.currentShakeX).toFixed(2);
        const ty = (this.currentShakeY).toFixed(2);

        targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale.toFixed(4)})`;
        targetEl.style.transformOrigin = 'center center';
      } else if (this.currentPulse !== 0) {
        this.currentPulse = 0;
        targetEl.style.transform = '';
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  _resetElementTransforms() {
    if (typeof document === 'undefined') return;
    const preDuel = document.getElementById('preDuelCinematicOverlay');
    if (preDuel) preDuel.style.transform = '';
    const story = document.getElementById('battleScreen');
    if (story) story.style.transform = '';
    const versus = document.getElementById('versusArenaScreen');
    if (versus) versus.style.transform = '';
  }

  // Controle de Acessibilidade / Intensidade
  setIntensity(mode) {
    if (['high', 'low', 'off'].includes(mode)) {
      this.intensitySetting = mode;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hortobots_beat_pulse_setting', mode);
      }
      if (mode === 'off') {
        this._resetElementTransforms();
      }
      this._updateAccessibilityBadge();
    }
  }

  cycleIntensity() {
    const next = this.intensitySetting === 'high' ? 'low' : this.intensitySetting === 'low' ? 'off' : 'high';
    this.setIntensity(next);
    return next;
  }

  _updateAccessibilityBadge() {
    if (typeof document === 'undefined') return;
    const badges = document.querySelectorAll('.beat-pulse-toggle-btn');
    badges.forEach(btn => {
      const label = this.intensitySetting === 'high' ? 'PULSO: 100%' : this.intensitySetting === 'low' ? 'PULSO: 50%' : 'PULSO: OFF';
      btn.textContent = `[ ${label} ]`;
      btn.classList.toggle('off', this.intensitySetting === 'off');
      btn.classList.toggle('active', this.intensitySetting !== 'off');
    });
  }
}
