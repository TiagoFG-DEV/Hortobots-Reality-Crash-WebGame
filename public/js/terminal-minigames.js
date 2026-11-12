// TERMINAL/public/js/terminal-minigames.js - Motor Padronizado de Minigames (L1 Esquiva, L2 Point-and-Click, L3 Finalizador Supremo)
import { VersusMinigames } from './versus-minigames.js';

export class TerminalMinigames {
  constructor(overlayElement, audioManager, engine3D = null) {
    this.overlay = overlayElement;
    this.audio = audioManager;
    this.engine3D = engine3D;
    this.currentAnimFrame = null;
    this.versusMinigames = new VersusMinigames(this.overlay);
  }

  triggerScreenShake() {
    const monitor = document.querySelector('.crt-monitor-container') || document.body;
    monitor.classList.add('terminal-screen-shake');
    setTimeout(() => monitor.classList.remove('terminal-screen-shake'), 400);
  }

  getRobotCoreColor(robotKey) {
    const key = (robotKey || 'DINOBYTE').toUpperCase();
    const colors = {
      DINOBYTE: '#ff3344',
      COWPUTER: '#ffd700',
      PENLINUX: '#00e5ff',
      TIGERVEX: '#ffff00',
      PAVABYTE: '#e040fb',
      QUEZAS: '#ff5533'
    };
    return colors[key] || '#00ff66';
  }

  getMinigameInstruction(type) {
    const map = {
      // ── MINIGAMES PADRONIZADOS L1 (ESQUIVA COM POINTERDOWN) ──
      db_dodge: 'DESVIE DOS METEORITOS! PRESSIONE E MOVA PARA MANOBRAR O NUCLEO!',
      cp_dodge: 'DESVIE DO LACO GIRATORIO! PERMANECA PROXIMO AO CENTRO PARA SOBREVIVER!',
      pl_dodge: 'DESVIE DAS ESTALACTITES! CUIDADO COM O VENTO GELADO E O CONTROLE ESCORREGADIO!',
      pb_dodge: 'DESVIE DOS FEIXES DE LUZ! A LINHA PONTILHADA AVISA ANTES DO LASER!',
      tv_dodge: 'DESVIE DAS BARREIRAS! ENCONTRE E PASSE PELA ABERTURA!',

      // ── MINIGAMES PADRONIZADOS L2 (POINT-AND-CLICK / GESTOS) ──
      db_bite: 'CLIQUE NAS TELAS DE ERRO PARA O DINOBYTE MORDER E DESTRUI-LAS!',
      cp_lasso: 'PRESSIONE E GIRE O MOUSE EM CIRCULO PERFEITO PARA ACUMULAR ENERGIA!',
      pl_sequence: 'CLIQUE NOS NUMEROS DE 1 A 15 EM ORDEM CORRETA!',
      pb_prism: 'CLIQUE NOS PRISMAS PARA ROTACIONAR (90 ANTI-HORARIO) E ALINHAR O FEIXE DE LUZ!',
      tv_slash: 'DESLIZE DE CIMA PARA BAIXO EM TODA A LARGURA PARA RASGAR A DIMENSAO!',

      // ── MINIGAME PADRONIZADO L3 (FINALIZADOR SUPREMO COMBINADO) ──
      chained_finisher: 'FINALIZADOR SUPREMO: SOBREVIVA A SEQUENCIA COMBINADA DE ALTO IMPACTO!',
      lizards_roar: 'FINALIZADOR SUPREMO: EXECUTE A SEQUENCIA COMPLETA DO LAGARTO!',
      bovine_voltage: 'FINALIZADOR SUPREMO: EXECUTE A SOBRECARGA COMPLETA DO CHOQUE BOVINO!',
      hee_hee_avalanche: 'FINALIZADOR SUPREMO: EXECUTE A AVALANCHE COMPLETA DO HEE-HEE!',
      thunder_core: 'FINALIZADOR SUPREMO: EXECUTE A RUPTURA DO NUCLEO TROVAO!',
      rainbow_laser: 'FINALIZADOR SUPREMO: EXECUTE A MATRIZ LASER ARCO-IRIS!'
    };
    return map[type] || 'CONCENTRE-SE E EXECUTE A ACAO DE COMBATE NO TEMPO CERTO!';
  }

  async showPreCountdown(actionTitle, instructionText) {
    const overlay = document.getElementById('preCountdownOverlay');
    const titleEl = document.getElementById('countdownActionTitle');
    const legendEl = document.getElementById('countdownInstructionLegend');
    const digitEl = document.getElementById('countdownNumberDigit');

    if (!overlay || !digitEl) return;

    if (titleEl) titleEl.innerText = `[ ${actionTitle.toUpperCase()} ]`;
    if (legendEl) legendEl.innerText = `// COMANDO: ${instructionText} //`;

    overlay.classList.remove('hidden');

    const steps = [
      { text: '3', pitch: 440, duration: 750 },
      { text: '2', pitch: 550, duration: 750 },
      { text: '1', pitch: 660, duration: 750 },
      { text: 'ACAO!', pitch: 880, duration: 450 }
    ];

    for (const step of steps) {
      digitEl.innerText = step.text;
      digitEl.style.animation = 'none';
      void digitEl.offsetHeight;
      digitEl.style.animation = 'countdownPop 0.25s ease-out';
      if (this.audio) this.audio.playBeep(step.pitch, 'square', 0.1);
      await new Promise(r => setTimeout(r, step.duration));
    }

    overlay.classList.add('hidden');
  }

  // =========================================================================
  // DESPACHANTE UNIFICADO DE MINIGAMES (HISTORIA & VERSUS)
  // =========================================================================
  async run(minigameType, moveName, robotKey = 'DINOBYTE') {
    const instruction = this.getMinigameInstruction(minigameType);
    await this.showPreCountdown(moveName, instruction);

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';

    const coreColor = this.getRobotCoreColor(robotKey);
    const rawRes = await this.versusMinigames.run(minigameType, coreColor, robotKey);

    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';

    const won = typeof rawRes === 'boolean' ? rawRes : Boolean(rawRes?.won);
    const score = typeof rawRes === 'object' && rawRes !== null && typeof rawRes.score === 'number'
      ? Math.min(1.0, Math.max(0.0, rawRes.score))
      : (won ? 1.0 : 0.0);

    if (won) {
      this.audio?.playPowerUp();
      this.triggerScreenShake();
      // Em caso de 100% de acerto (score >= 0.99), 30% de chance de dano critico (+50% = 1.5x)
      const isCrit = score >= 0.99 && Math.random() < 0.30;
      const multiplier = isCrit ? 1.50 : Number((0.50 + score * 0.50).toFixed(2));
      return {
        accuracy: score,
        multiplier: multiplier,
        isCrit: isCrit,
        feedback: isCrit
          ? `CRITICO! EXECUCAO PERFEITA DO COMANDO! (${multiplier.toFixed(2)}x DANO)`
          : `COMANDO EXECUTADO COM SUCESSO! (${multiplier.toFixed(2)}x DANO)`
      };
    } else {
      this.audio?.playDenied();
      const partialMultiplier = Number((score * 0.50).toFixed(2));
      return {
        accuracy: score,
        multiplier: partialMultiplier,
        isCrit: false,
        feedback: score > 0
          ? `FALHA PARCIAL NA EXECUCAO! (${partialMultiplier.toFixed(2)}x DANO RESIDUAL)`
          : `FALHA TOTAL NA EXECUCAO! (GOLPE FALHOU)`
      };
    }
  }

  // =========================================================================
  // CINEMATICA 3D DA MOEDA DA SORTE (DEFESA TATICA PROCEDURAL EM THREE.JS)
  // =========================================================================
  runCoinFlipModal(playerChoice = 'CARA') {
    return new Promise(resolve => {
      const coinSides = ['CARA', 'COROA'];
      const outcome = coinSides[Math.floor(Math.random() * coinSides.length)];

      if (this.engine3D && typeof this.engine3D.run3DCoinFlipCinematic === 'function') {
        this.engine3D.run3DCoinFlipCinematic(playerChoice, outcome, (res) => {
          resolve({
            won: res ? res.won : (playerChoice === outcome),
            actualResult: res ? (res.outcome || outcome) : outcome,
            playerChoice
          });
        });
        return;
      }

      const won = playerChoice === outcome;
      resolve({ won, actualResult: outcome, playerChoice });
    });
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
  }
}