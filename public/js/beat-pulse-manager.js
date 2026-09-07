// public/js/beat-pulse-manager.js — Sistema Rítmico Estabilizado por BPM de Batalha
// Substitui a detecção caótica de FFT por pulso rítmico perfeitamente sincronizado com o andamento musical.
// Opera com micro-escala suave (~0.3% a 0.6%) SOMENTE em combate ativo (bloqueado em menus e draft de campeões).

const BATTLE_TRACK_BPM = {
  'energeticBattle': 132,
  'versusBattle': 132,
  'lizardsPulse': 128,
  'lizardsOmega': 136,
  'bitLizard': 125,
  'forestBattle': 128,
  'desertBattle': 130,
  'iceBattle': 135,
  'duelGrand': 140,
  'titansAction': 140,
  'titanBattle': 140,
  'bossBattle': 140
};

export class BeatPulseManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.lastBeatIndex = -1;
    this.currentPulse = 0;
    this.animFrameId = null;

    // Amortecimento suave e progressivo (sem solavancos)
    this.decayRate = 0.86;

    // Configuração de acessibilidade ('high' = 100%, 'low' = 50%, 'off' = 0%)
    const savedSetting = (typeof localStorage !== 'undefined'
      ? localStorage.getItem('hortobots_beat_pulse_setting')
      : null) || 'high';
    this.intensitySetting = savedSetting;
    this.intensityMultipliers = { high: 1.0, low: 0.5, off: 0.0 };

    if (typeof window !== 'undefined') {
      this._setupLoop();
    }
  }

  // Compatibilidade com AudioManager caso chame initAudioGraph
  initAudioGraph(audioCtx, bgmAudio) {
    this._updateAccessibilityBadge();
  }

  // Identifica o BPM da faixa atual tocando
  _getCurrentBpm() {
    const track = this.audioManager?.currentTrack;
    if (track && BATTLE_TRACK_BPM[track]) {
      return BATTLE_TRACK_BPM[track];
    }
    return 130; // BPM padrão de combate eletrônico
  }

  // Verifica se o jogador está estritamente em combate ativo
  _isBattleActive() {
    if (typeof document === 'undefined') return false;

    // 1. Bloqueio absoluto durante a tela de draft / seleção dos 3 campeões
    const draftSection = document.getElementById('versusDraftSection');
    if (draftSection && !draftSection.classList.contains('hidden')) {
      return false;
    }

    // 2. Combate Ativo no Modo Versus
    const versusArena = document.getElementById('versusArenaScreen');
    const versusCombat = document.getElementById('versusCombatSection');
    const isVersusCombat = versusArena && !versusArena.classList.contains('hidden') &&
                           versusCombat && !versusCombat.classList.contains('hidden');

    // 3. Combate Ativo no Modo História
    const storyBattle = document.getElementById('battleScreen');
    const isStoryBattle = storyBattle && !storyBattle.classList.contains('hidden');

    return isVersusCombat || isStoryBattle;
  }

  _getActiveBattleElement() {
    if (typeof document === 'undefined') return null;

    const versusCombat = document.getElementById('versusCombatSection');
    const versusArena = document.getElementById('versusArenaScreen');
    if (versusArena && !versusArena.classList.contains('hidden') && versusCombat && !versusCombat.classList.contains('hidden')) {
      return versusArena;
    }

    const storyBattle = document.getElementById('battleScreen');
    if (storyBattle && !storyBattle.classList.contains('hidden')) {
      return storyBattle;
    }

    return null;
  }

  _setupLoop() {
    const loop = () => {
      const isBattle = this._isBattleActive();
      const targetEl = this._getActiveBattleElement();
      const mult = this.intensityMultipliers[this.intensitySetting] || 0;

      if (!isBattle || !targetEl || mult <= 0) {
        if (this.currentPulse > 0) {
          this.currentPulse = 0;
          this._resetElementTransforms();
        }
        this.animFrameId = requestAnimationFrame(loop);
        return;
      }

      const bgm = this.audioManager?.bgmAudio;
      if (bgm && !bgm.paused && bgm.currentTime > 0) {
        const bpm = this._getCurrentBpm();
        const beatDuration = 60 / bpm; // duração em segundos de cada tempo (compasso 4/4)

        // Calcula em qual batida da música estamos
        const currentBeatIndex = Math.floor(bgm.currentTime / beatDuration);

        if (currentBeatIndex !== this.lastBeatIndex) {
          this.lastBeatIndex = currentBeatIndex;

          // Dispara impulso rítmico estabilizado e suave
          this.currentPulse = 0.5 * mult;

          // A cada 4 tempos (compasso fechado), uma sutil vinheta opcional bem discreta
          if (currentBeatIndex % 4 === 0 && mult >= 1.0) {
            this._flashBattleVignette(targetEl);
          }
        }
      }

      // Amortecimento suave exponencial
      if (this.currentPulse > 0.002) {
        this.currentPulse *= this.decayRate;

        // Escala micro-sutil: até ~1.005x (apenas 0.5% de zoom, respiração limpa e confortável)
        const scale = 1 + (this.currentPulse * 0.010);
        targetEl.style.transform = `scale(${scale.toFixed(4)})`;
        targetEl.style.transformOrigin = 'center center';
      } else if (this.currentPulse !== 0) {
        this.currentPulse = 0;
        targetEl.style.transform = '';
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  _flashBattleVignette(activeTarget) {
    if (!activeTarget) return;
    let vignette = activeTarget.querySelector('.battle-beat-vignette-overlay');
    if (!vignette) {
      vignette = document.createElement('div');
      vignette.className = 'battle-beat-vignette-overlay';
      activeTarget.appendChild(vignette);
    }
    vignette.classList.remove('pulse-flash');
    void vignette.offsetWidth;
    vignette.classList.add('pulse-flash');
  }

  _resetElementTransforms() {
    if (typeof document === 'undefined') return;
    const story = document.getElementById('battleScreen');
    if (story) story.style.transform = '';
    const versus = document.getElementById('versusArenaScreen');
    if (versus) versus.style.transform = '';
  }

  // Controle de Acessibilidade
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
