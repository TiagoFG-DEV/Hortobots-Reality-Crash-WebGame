// public/js/beat-pulse-manager.js — Sistema de Beat Detection & Camera Shake Rítmico de Batalha
// Algoritmo de alta sensibilidade com Web Audio API FFT nativa e zoom sutil rítmico

export class BeatPulseManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.nativeAnalyser = null;
    this.sourceNode = null;
    this.isInitialized = false;

    // Configurações de alta sensibilidade e detecção de batidas
    this.lastBeatTime = 0;
    this.minBeatIntervalMs = 110; // Permite captar até ~540 BPM (batidas rápidas, semicolcheias e ritmos eletrônicos)
    this.energyHistory = [];
    this.historySize = 25; // Janela móvel curta (~0.4s a 60fps) para adaptação dinâmica rápida
    this.prevEnergy = 0;
    this.decayRate = 0.82; // Amortecimento ágil para cada pulso respirar com precisão

    // Estado da física de pulso atenuada (zoom sutil, estável e confortável aos olhos)
    this.currentPulse = 0;
    this.currentShakeX = 0;
    this.currentShakeY = 0;
    this.animFrameId = null;

    // Configuração de acessibilidade (1.0 = 100%, 0.5 = 50%, 0 = Desativado)
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

      // 2. Analisador nativo Web Audio API com alta reatividade a transientes
      this.nativeAnalyser = audioCtx.createAnalyser();
      this.nativeAnalyser.fftSize = 512;
      this.nativeAnalyser.smoothingTimeConstant = 0.40; // Reatividade rápida para captar ataques de percussão

      // 3. Conecta o fluxo de áudio: source -> nativeAnalyser -> destination
      this.sourceNode.connect(this.nativeAnalyser);
      this.nativeAnalyser.connect(audioCtx.destination);

      this.isInitialized = true;
      this._updateAccessibilityBadge();
    } catch (err) {
      console.warn('[BeatPulseManager] Inicialização do grafo nativo de áudio:', err);
    }
  }

  // Medição nativa de FFT Web Audio API com alta sensibilidade a batidas
  _processNativeFFT() {
    if (!this._isBattleActive()) return;

    // Auto-inicialização de segurança caso o contexto tenha sido desbloqueado após a carga inicial
    if (!this.nativeAnalyser || !this.isInitialized) {
      if (this.audioManager && this.audioManager.audioCtx && this.audioManager.bgmAudio) {
        this.initAudioGraph(this.audioManager.audioCtx, this.audioManager.bgmAudio);
      }
      if (!this.nativeAnalyser) return;
    }

    if (this.audioManager?.audioCtx?.state === 'suspended') {
      this.audioManager.audioCtx.resume().catch(() => {});
    }

    const mult = this.intensityMultipliers[this.intensitySetting] || 0;
    if (mult <= 0) return;

    const buffer = new Uint8Array(this.nativeAnalyser.frequencyBinCount);
    this.nativeAnalyser.getByteFrequencyData(buffer);

    // 1. Sub-grave e Grave / Bumbo (bins 0 a 8: ~20Hz a 350Hz)
    let bassEnergy = 0;
    const bassBins = 9;
    for (let i = 0; i < bassBins; i++) {
      bassEnergy += buffer[i] || 0;
    }
    bassEnergy = bassEnergy / (bassBins * 255);

    // 2. Médios-Graves e Caixa / Percussão (bins 9 a 28: ~350Hz a 1200Hz)
    let midEnergy = 0;
    const midBins = 20;
    for (let i = 9; i < 9 + midBins; i++) {
      midEnergy += buffer[i] || 0;
    }
    midEnergy = midEnergy / (midBins * 255);

    // 3. Agudos e Transientes de Pratos (bins 29 a 64: ~1200Hz a 2800Hz)
    let highEnergy = 0;
    const highBins = 36;
    for (let i = 29; i < 29 + highBins; i++) {
      highEnergy += buffer[i] || 0;
    }
    highEnergy = highEnergy / (highBins * 255);

    // Energia instantânea balanceada para apreender todo tipo de ritmo
    const instantEnergy = (bassEnergy * 0.58) + (midEnergy * 0.32) + (highEnergy * 0.10);

    // Histórico móvel adaptativo
    this.energyHistory.push(instantEnergy);
    if (this.energyHistory.length > this.historySize) this.energyHistory.shift();

    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / (this.energyHistory.length || 1);
    const now = performance.now();

    // Delta em relação ao frame anterior (Spectral Flux / Detecção de Ataque)
    const delta = instantEnergy - (this.prevEnergy || 0);
    this.prevEnergy = instantEnergy;

    // CONDIÇÃO DE ALTA SENSIBILIDADE (limiar baixo para captar praticamente todos os pulsos):
    // 1. Energia acima do piso mínimo bem leve (> 0.030)
    // 2. Intervalo mínimo de 110ms respeitado
    // 3. Ocorrência de ataque súbito (delta > 0.008) OU energia levemente acima da média móvel (> avg * 1.04)
    const timeDiff = now - this.lastBeatTime;
    const isBeat = (timeDiff > this.minBeatIntervalMs) &&
      (instantEnergy > 0.030) &&
      (
        delta > 0.008 ||
        instantEnergy > (avgEnergy * 1.04)
      );

    if (isBeat) {
      this.lastBeatTime = now;
      // Normalização suave da força do pulso
      const rawStrength = (instantEnergy - 0.02) / Math.max(0.05, avgEnergy * 0.85);
      const strength = Math.min(1.0, Math.max(0.25, rawStrength));
      this._triggerPulse(strength * mult);
    }
  }

  _triggerPulse(strength) {
    // Adiciona impulso atenuado (zoom suave sem solavancos bruscos na tela)
    this.currentPulse = Math.min(0.55, this.currentPulse + (strength * 0.28));

    // Tremor angular micro-sutil (±0.25px a ±0.55px) — pura textura analógica CRT
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.20 + Math.random() * 0.35) * strength;
    this.currentShakeX = Math.cos(angle) * dist;
    this.currentShakeY = Math.sin(angle) * dist;

    // Vinheta neon discreta apenas em momentos de ápice rítmico
    if (strength > 0.90) {
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
    void vignette.offsetWidth; // Força reflow
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
          this.currentShakeX = 0;
          this.currentShakeY = 0;
          this._resetElementTransforms();
        }
        this.animFrameId = requestAnimationFrame(loop);
        return;
      }

      // Processa a análise rítmica via FFT nativa de alta sensibilidade
      this._processNativeFFT();

      // Amortecimento físico suave e ágil (decay exponencial)
      if (this.currentPulse > 0.001) {
        this.currentPulse *= this.decayRate;
        this.currentShakeX *= 0.75;
        this.currentShakeY *= 0.75;

        // Escala suave: até ~1.0085x de zoom máximo (menos de 1% de escala!)
        // Pulsa confortavelmente como a respiração/batimento cardíaco da música
        const scale = 1 + (this.currentPulse * 0.015);
        const tx = (this.currentShakeX).toFixed(2);
        const ty = (this.currentShakeY).toFixed(2);

        targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale.toFixed(4)})`;
        targetEl.style.transformOrigin = 'center center';
      } else if (this.currentPulse !== 0) {
        this.currentPulse = 0;
        this.currentShakeX = 0;
        this.currentShakeY = 0;
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
