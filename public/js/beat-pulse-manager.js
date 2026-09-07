// ═══════════════════════════════════════════════════════════════════
// beat-pulse-manager.js — Desativado
// O shake de tela contínuo com as batidas foi completamente removido
// para eliminar peso e travamentos no jogo, conforme solicitado.
// ═══════════════════════════════════════════════════════════════════

export class BeatPulseManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.intensitySetting = 'off';
  }

  initAudioGraph() {}
  destroy() {}
  cycleIntensity() { return 'off'; }
  setIntensity() {}
  update() {}
}
