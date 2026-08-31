// TERMINAL/public/js/terminal-minigames.js - Motor de Minigames Táticos & Finalizadores em Sequência
export class TerminalMinigames {
  constructor(overlayElement, audioManager) {
    this.overlay = overlayElement;
    this.audio = audioManager;
  }

  triggerScreenShake() {
    const monitor = document.querySelector('.crt-monitor-container') || document.body;
    monitor.classList.add('terminal-screen-shake');
    setTimeout(() => monitor.classList.remove('terminal-screen-shake'), 400);
  }

  calculateMultiplier(combo, accuracy) {
    const base = 0.6 + accuracy * 0.7; // 0.6x a 1.3x
    const bonus = Math.min(0.2, (combo || 0) * 0.04);
    return Number((base + bonus).toFixed(2));
  }

  getMinigameInstruction(type) {
    const map = {
      dino_targets: 'CLIQUE OU TOQUE RAPIDAMENTE NOS NÓS DE CALOR ANTES QUE RESFRIEM!',
      targets: 'CLIQUE OU TOQUE RAPIDAMENTE NOS NÓS DE CALOR ANTES QUE RESFRIEM!',
      dino_arrows: 'DIGITE AS TECLAS [ W / A / S / D ] NA ORDEM INDICADA!',
      arrows: 'DIGITE AS TECLAS [ W / A / S / D ] NA ORDEM INDICADA!',
      dino_timing: 'PRESSIONE [ESPAÇO] OU CLIQUE NO CENTRO EXATO DA ZONA VERDE!',
      timing: 'PRESSIONE [ESPAÇO] OU CLIQUE NO CENTRO EXATO DA ZONA VERDE!',
      cow_lasso: 'CLIQUE E SEGURE PARA GIRAR O LAÇO E SOLTE NO ALVO EM MOVIMENTO!',
      cow_decrypt: 'DIGITE O CÓDIGO HEXADECIMAL DE DESFRAGMENTAÇÃO NO TERMINAL!',
      decrypt: 'DIGITE O CÓDIGO HEXADECIMAL DE DESFRAGMENTAÇÃO NO TERMINAL!',
      cow_quickdraw: 'ATENÇÃO AO SINAL DE DISPARO: CLIQUE NO GATILHO ASSIM QUE APARECER!',
      pen_rhythm: 'PRESSIONE AS TECLAS NO RITMO EXATO DAS BATIDAS DA MÚSICA!',
      rhythm: 'PRESSIONE AS TECLAS NO RITMO EXATO DAS BATIDAS DA MÚSICA!',
      pen_slide: 'USE [ ← ] E [ → ] PARA DESVIAR DOS BLOCOS DE GELO NA PISTA GLACIAL!',
      pen_stomp: 'PRESSIONE [ESPAÇO] REPETIDAMENTE PARA CARREGAR A ONDA DE IMPACTO!',
      tiger_slice: 'ARRASTE O CURSOR EM LINHA RETA SOBRE OS PONTOS FRACOS DO ALVO!',
      tiger_plasma: 'SEGURE PARA CARREGAR A VOLTAGEM E SOLTE NO PONTO MÁXIMO DE ENERGIA!',
      tiger_tesla: 'CONECTE OS CONDUTORES ELÉTRICOS ANTES DA SOBRECARGA DISPARAR!',
      pava_prism: 'ALINHE OS ESPELHOS PRISMÁTICOS PARA DIRECIONAR O FEIXE DE LUZ!',
      pava_fan: 'MEMORIZE A SEQUÊNCIA DE CORES DAS PENAS HOLOGRÁFICAS E REPITA!',
      pava_cascade: 'COLETE OS FÓTONS DE LUZ CADENTES EVITANDO AS PARTÍCULAS ESCURAS!',
      chained_finisher: 'FINALIZADOR SUPREMO: EXECUTE A SEQUÊNCIA ENCADEADA DE 3 MINIGAMES!',
      finisher: 'FINALIZADOR SUPREMO: EXECUTE A SEQUÊNCIA ENCADEADA DE 3 MINIGAMES!'
    };
    return map[type] || 'CONCENTRE-SE E EXECUTE A AÇÃO DE COMBATE NO TEMPO CERTO!';
  }

  async showPreCountdown(actionTitle, instructionText) {
    const overlay = document.getElementById('preCountdownOverlay');
    const titleEl = document.getElementById('countdownActionTitle');
    const legendEl = document.getElementById('countdownInstructionLegend');
    const digitEl = document.getElementById('countdownNumberDigit');

    if (!overlay || !digitEl) return;

    if (titleEl) titleEl.innerText = `[ ${actionTitle.toUpperCase()} ]`;
    if (legendEl) legendEl.innerText = `> ${instructionText}`;

    overlay.classList.remove('hidden');

    const steps = [
      { text: '3', pitch: 440, duration: 1000 },
      { text: '2', pitch: 550, duration: 1000 },
      { text: '1', pitch: 660, duration: 1000 },
      { text: 'DUELEM!', pitch: 880, duration: 550 }
    ];

    for (const step of steps) {
      digitEl.innerText = step.text;
      digitEl.style.animation = 'none';
      void digitEl.offsetHeight;
      digitEl.style.animation = 'countdownPop 0.3s ease-out';
      if (this.audio) this.audio.playBeep(step.pitch, 'square', 0.12);
      await new Promise(r => setTimeout(r, step.duration));
    }

    overlay.classList.add('hidden');
  }

  async run(minigameType, moveName, robotKey = 'DINOBYTE') {
    const instruction = this.getMinigameInstruction(minigameType);
    await this.showPreCountdown(moveName, instruction);

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';

    let result;
    switch (minigameType) {
      // DINO-BYTE
      case 'dino_targets':
      case 'targets':
        result = await this.runTargetsMinigame(moveName);
        break;
      case 'dino_arrows':
      case 'arrows':
        result = await this.runArrowsMinigame(moveName);
        break;
      case 'dino_timing':
      case 'timing':
        result = await this.runTimingMinigame(moveName);
        break;

      // COWPUTER-MOO
      case 'cow_lasso':
        result = await this.runLassoMinigame(moveName);
        break;
      case 'cow_decrypt':
      case 'decrypt':
        result = await this.runDecryptMinigame(moveName);
        break;
      case 'cow_quickdraw':
        result = await this.runQuickdrawMinigame(moveName);
        break;

      // PENLINUX
      case 'pen_rhythm':
      case 'rhythm':
        result = await this.runRhythmMinigame(moveName);
        break;
      case 'pen_slide':
        result = await this.runIceSlideMinigame(moveName);
        break;
      case 'pen_stomp':
        result = await this.runIcebergStompMinigame(moveName);
        break;

      // TIGERVEX
      case 'tiger_slice':
        result = await this.runPrecisionSliceMinigame(moveName);
        break;
      case 'tiger_plasma':
        result = await this.runPlasmaChargeMinigame(moveName);
        break;
      case 'tiger_tesla':
        result = await this.runTeslaConnectMinigame(moveName);
        break;

      // PAVABYTE
      case 'pava_prism':
        result = await this.runPrismMinigame(moveName);
        break;
      case 'pava_fan':
        result = await this.runHoloFanMemoryMinigame(moveName);
        break;
      case 'pava_cascade':
        result = await this.runLuminousCascadeMinigame(moveName);
        break;

      // FINALIZADOR EM SEQUÊNCIA RÁPIDA (3 EM CADEIA)
      case 'chained_finisher':
      case 'finisher':
        result = await this.runChainedFinisher(moveName, robotKey);
        break;

      default:
        result = await this.runTimingMinigame(moveName);
    }

    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
    return result;
  }

  // ==========================================
  // DINO-BYTE MINIGAMES
  // ==========================================

  // 1. Alvos Térmicos Jurássicos
  runTargetsMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[MIRA TÉRMICA] ${moveName.toUpperCase()}</h2>
              <p>CLIQUE OU TOQUE RAPIDAMENTE NOS NÓS DE CALOR ANTES QUE RESFRIEM!</p>
            </div>
            <div class="blackout-combo-badge" id="qteComboDisplay">COMBO 0x</div>
          </div>
          <div class="blackout-timer-bar"><div class="blackout-timer-fill" id="blackoutTimer"></div></div>
          <div class="blackout-arena-center" id="targetsArena"></div>
          <div style="display: flex; justify-content: space-between; font-size: 1.1rem;">
            <span id="targetCounter" style="color: var(--term-fg);">Alvos Eliminados: 0</span>
            <span style="color: var(--term-accent);">POTÊNCIA: <strong id="currentMulti">1.0x</strong></span>
          </div>
        </div>
      `;

      const arena = document.getElementById('targetsArena');
      const timerFill = document.getElementById('blackoutTimer');
      const counterEl = document.getElementById('targetCounter');
      const comboEl = document.getElementById('qteComboDisplay');
      const multiEl = document.getElementById('currentMulti');

      let hits = 0;
      let combo = 0;
      let active = true;
      const durationMs = 3800;
      const startTime = Date.now();

      const timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1 - elapsed / durationMs);
        if (timerFill) timerFill.style.width = `${remaining * 100}%`;
        if (elapsed >= durationMs) finish();
      }, 35);

      const spawnTarget = () => {
        if (!active || !arena) return;
        const target = document.createElement('button');
        target.className = 'term-target-node';
        const labels = ['[ GARRAS ]', '[ MANDÍBULA ]', '[ SOBRECARGA ]', '[ ERUPÇÃO ]'];
        target.innerText = labels[Math.floor(Math.random() * labels.length)];

        target.style.left = `${Math.random() * 75 + 5}%`;
        target.style.top = `${Math.random() * 70 + 10}%`;

        target.onclick = (e) => {
          e.stopPropagation();
          this.audio.playKeyClack();
          this.triggerScreenShake();
          hits++;
          combo++;
          if (comboEl) comboEl.innerText = `COMBO ${combo}x`;
          if (counterEl) counterEl.innerText = `Alvos Eliminados: ${hits}`;
          const currentM = this.calculateMultiplier(combo, Math.min(1, hits / 5));
          if (multiEl) multiEl.innerText = `${currentM}x`;

          target.style.background = 'var(--term-accent)';
          target.style.color = '#000';
          setTimeout(() => target.remove(), 80);
          spawnTarget();
        };

        arena.appendChild(target);
        setTimeout(() => {
          if (target.parentNode) {
            target.remove();
            combo = Math.max(0, combo - 1);
            if (comboEl) comboEl.innerText = `COMBO ${combo}x`;
          }
        }, 1200);
      };

      spawnTarget();
      spawnTarget();
      const spawner = setInterval(spawnTarget, 600);

      const finish = () => {
        if (!active) return;
        active = false;
        clearInterval(timerInterval);
        clearInterval(spawner);

        const accuracy = Math.min(1.0, hits / 5);
        const multiplier = this.calculateMultiplier(combo, accuracy);
        const isCrit = hits >= 6;

        this.audio.playBeep(isCrit ? 900 : 600, 'triangle', 0.2);
        resolve({
          accuracy,
          multiplier,
          isCrit,
          feedback: isCrit ? `GOLPE FULMINANTE! (${multiplier}x DANO)` : `AMPLIFICAÇÃO SUCESSO (${multiplier}x)`
        });
      };
    });
  }

  // 2. Sequência Direcional de Garras Flamejantes
  runArrowsMinigame(moveName) {
    return new Promise(resolve => {
      const keys = ['W', 'A', 'S', 'D'];
      const sequence = [];
      for (let i = 0; i < 5; i++) {
        sequence.push(keys[Math.floor(Math.random() * keys.length)]);
      }

      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[SEQUÊNCIA DE GARRAS] ${moveName.toUpperCase()}</h2>
              <p>DIGITE AS TECLAS [ W / A / S / D ] OU CLIQUE NOS BOTÕES:</p>
            </div>
            <div class="blackout-combo-badge" id="arrowsCombo">0/${sequence.length}</div>
          </div>
          <div class="blackout-timer-bar"><div class="blackout-timer-fill" id="arrowsTimer"></div></div>
          <div class="blackout-arena-center">
            <div class="term-arrows-deck" style="margin-bottom: 24px;">
              ${sequence.map((k, idx) => `<div class="term-arrow-box" id="arrowBox_${idx}">${k}</div>`).join('')}
            </div>
            <div style="display: flex; gap: 12px; justify-content: center;">
              ${keys.map(k => `<button class="term-btn btn-virtual-key" style="font-size: 1.3rem; padding: 10px 20px;" data-k="${k}">${k}</button>`).join('')}
            </div>
          </div>
        </div>
      `;

      let currentStep = 0;
      let errors = 0;
      const durationMs = 3800;
      const startTime = Date.now();
      const timerFill = document.getElementById('arrowsTimer');
      const comboEl = document.getElementById('arrowsCombo');

      const timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1 - elapsed / durationMs);
        if (timerFill) timerFill.style.width = `${remaining * 100}%`;
        if (elapsed >= durationMs) finish(false);
      }, 35);

      const processKey = (k) => {
        if (currentStep >= sequence.length) return;
        const expected = sequence[currentStep];

        if (k.toUpperCase() === expected) {
          this.audio.playKeyClack();
          this.triggerScreenShake();
          const box = document.getElementById(`arrowBox_${currentStep}`);
          if (box) box.classList.add('done');
          currentStep++;
          if (comboEl) comboEl.innerText = `${currentStep}/${sequence.length}`;

          if (currentStep >= sequence.length) {
            finish(true);
          }
        } else {
          errors++;
          this.audio.playAccessDenied();
        }
      };

      const keyHandler = (e) => {
        let k = e.key.toUpperCase();
        if (e.key === 'ArrowUp') k = 'W';
        if (e.key === 'ArrowLeft') k = 'A';
        if (e.key === 'ArrowDown') k = 'S';
        if (e.key === 'ArrowRight') k = 'D';

        if (keys.includes(k)) {
          e.preventDefault();
          processKey(k);
        }
      };
      window.addEventListener('keydown', keyHandler);

      document.querySelectorAll('.btn-virtual-key').forEach(btn => {
        btn.onclick = () => processKey(btn.getAttribute('data-k'));
      });

      const finish = (completed) => {
        clearInterval(timerInterval);
        window.removeEventListener('keydown', keyHandler);

        const accuracy = completed ? Math.max(0.6, 1.0 - errors * 0.15) : (currentStep / sequence.length) * 0.6;
        const isCrit = completed && errors === 0;
        const multiplier = this.calculateMultiplier(isCrit ? 4 : currentStep, accuracy);

        setTimeout(() => {
          resolve({
            accuracy,
            multiplier,
            isCrit,
            feedback: isCrit ? `COMBO PERFEITO! (${multiplier}x)` : completed ? `GOLPE COMPLETO (${multiplier}x)` : 'GARRAS FALHARAM'
          });
        }, 200);
      };
    });
  }

  // 3. Medidor de Pressão Térmica
  runTimingMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[MEDIDOR DE PRESSÃO] ${moveName.toUpperCase()}</h2>
              <p>TRAVE O PONTEIRO NA ZONA VERDE CENTRAL!</p>
            </div>
            <div class="blackout-combo-badge">PRESSIONE ESPAÇO</div>
          </div>
          <div class="blackout-arena-center">
            <div class="term-timing-track">
              <div class="term-sweet-zone" style="left: 40%; width: 20%;"></div>
              <div class="term-timing-cursor" id="termCursor"></div>
            </div>
            <button class="term-btn gold" id="termLockBtn" style="margin-top: 30px; font-size: 1.3rem; padding: 12px 28px;">
              [ DISPARAR PRESSÃO (ESPAÇO / CLIQUE) ]
            </button>
          </div>
        </div>
      `;

      const cursor = document.getElementById('termCursor');
      const btn = document.getElementById('termLockBtn');

      let pos = 0;
      let dir = 1;
      const speed = 4.2;
      let active = true;

      const anim = () => {
        if (!active) return;
        pos += dir * speed;
        if (pos >= 96) dir = -1;
        if (pos <= 2) dir = 1;
        if (cursor) cursor.style.left = `${pos}%`;
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);

      const triggerLock = () => {
        if (!active) return;
        active = false;
        // Remove o listener de teclado sempre, independente de como foi ativado
        window.removeEventListener('keydown', keyHandler);
        this.triggerScreenShake();
        this.audio.playKeyClack();

        const dist = Math.abs(pos - 50);
        const accuracy = Math.max(0, 1.0 - dist / 28);
        const isCrit = dist <= 6;
        const multiplier = this.calculateMultiplier(isCrit ? 4 : 1, accuracy);

        if (cursor) cursor.style.background = isCrit ? '#ffd700' : '#00ff66';
        this.audio.playBeep(isCrit ? 950 : 500, 'sine', 0.2);

        setTimeout(() => {
          resolve({
            accuracy,
            multiplier,
            isCrit,
            feedback: isCrit ? `PRESSÃO MÁXIMA! (${multiplier}x DANO CRÍTICO)` : `DISPARO CERTEIRO (${multiplier}x)`
          });
        }, 300);
      };

      if (btn) btn.addEventListener('click', triggerLock);
      const keyHandler = (e) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          triggerLock();
        }
      };
      window.addEventListener('keydown', keyHandler);
    });
  }

  // ==========================================
  // COWPUTER-MOO MINIGAMES
  // ==========================================

  // 1. Laço Magnético Rotacional
  runLassoMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[LAÇO MAGNÉTICO] ${moveName.toUpperCase()}</h2>
              <p>SOLTE O LAÇO QUANDO O INDICADOR ENTRAR NO SETOR DOURADO!</p>
            </div>
            <div class="blackout-combo-badge">ROTAÇÃO POLAR</div>
          </div>
          <div class="blackout-arena-center">
            <div style="position: relative; width: 180px; height: 180px; border-radius: 50%; border: 3px dashed var(--term-accent); display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; top: 0; left: 50%; width: 40px; height: 40px; margin-left: -20px; background: rgba(255,215,0,0.3); border: 2px solid #ffd700; border-radius: 50%;"></div>
              <div id="lassoNeedle" style="position: absolute; width: 4px; height: 75px; background: #00ff66; transform-origin: bottom center; bottom: 50%; transform: rotate(0deg); box-shadow: 0 0 10px #00ff66;"></div>
            </div>
            <button class="term-btn gold" id="lassoReleaseBtn" style="margin-top: 24px; font-size: 1.3rem; padding: 12px 28px;">
              [ LANÇAR LAÇO (ESPAÇO) ]
            </button>
          </div>
        </div>
      `;

      const needle = document.getElementById('lassoNeedle');
      const btn = document.getElementById('lassoReleaseBtn');
      let angle = 0;
      let active = true;

      const rotateAnim = () => {
        if (!active) return;
        angle = (angle + 7) % 360;
        if (needle) needle.style.transform = `rotate(${angle}deg)`;
        requestAnimationFrame(rotateAnim);
      };
      requestAnimationFrame(rotateAnim);

      const triggerCatch = () => {
        if (!active) return;
        active = false;
        // Remove o listener de teclado sempre, independente de como foi ativado
        window.removeEventListener('keydown', keyHandler);
        this.triggerScreenShake();
        this.audio.playKeyClack();

        const diff = Math.min(Math.abs(angle - 0), Math.abs(angle - 360));
        const accuracy = Math.max(0, 1.0 - diff / 55);
        const isCrit = diff <= 12;
        const multiplier = this.calculateMultiplier(isCrit ? 4 : 1, accuracy);

        this.audio.playBeep(isCrit ? 900 : 450, 'triangle', 0.2);
        setTimeout(() => {
          resolve({
            accuracy,
            multiplier,
            isCrit,
            feedback: isCrit ? `LAÇO PERFEITO! (${multiplier}x DANO CRÍTICO)` : accuracy > 0.4 ? `ALVO CAPTURADO (${multiplier}x)` : 'LAÇO ERROU'
          });
        }, 300);
      };

      if (btn) btn.addEventListener('click', triggerCatch);
      const keyHandler = (e) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          triggerCatch();
        }
      };
      window.addEventListener('keydown', keyHandler);
    });
  }

  // 2. Decodificador Hacker
  runDecryptMinigame(moveName) {
    return new Promise(resolve => {
      const phrases = ['COW_VOLTAGE', 'SALOON_ROOT', 'OVERLOAD_MOO', 'DESERT_BYTE', 'SHERIFF_404'];
      const targetPhrase = phrases[Math.floor(Math.random() * phrases.length)];

      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[DESCRIPTOGRAFIA] ${moveName.toUpperCase()}</h2>
              <p>DIGITE O CÓDIGO EXATO DO TERMINAL:</p>
            </div>
            <div class="blackout-combo-badge">PROTOCOLO SEGURO</div>
          </div>
          <div class="blackout-timer-bar"><div class="blackout-timer-fill" id="decryptTimer"></div></div>
          <div class="blackout-arena-center">
            <h1 style="color: var(--term-accent); font-size: 2.2rem; letter-spacing: 4px; margin-bottom: 20px;">${targetPhrase}</h1>
            <input type="text" class="term-decrypt-input" id="termDecryptInput" autofocus autocomplete="off" placeholder="DIGITE O CÓDIGO..." />
          </div>
        </div>
      `;

      const input = document.getElementById('termDecryptInput');
      const timerFill = document.getElementById('decryptTimer');
      setTimeout(() => input && input.focus(), 80);

      const durationMs = 4500;
      const startTime = Date.now();
      let active = true; // Guard contra dupla resolução (timer vs input)

      const timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1 - elapsed / durationMs);
        if (timerFill) timerFill.style.width = `${remaining * 100}%`;
        if (elapsed >= durationMs) finish(false);
      }, 35);

      input.addEventListener('input', () => {
        this.audio.playKeyClack();
        if (input.value.trim().toUpperCase() === targetPhrase) {
          this.triggerScreenShake();
          finish(true);
        }
      });

      const finish = (success) => {
        if (!active) return;
        active = false;
        clearInterval(timerInterval);
        const elapsed = Date.now() - startTime;
        const accuracy = success ? Math.max(0.7, 1.0 - (elapsed / durationMs) * 0.4) : 0.2;
        const isCrit = success && elapsed < 2200;
        const multiplier = this.calculateMultiplier(isCrit ? 4 : 2, accuracy);

        setTimeout(() => {
          resolve({
            accuracy,
            multiplier,
            isCrit,
            feedback: isCrit ? `CÓDIGO INJETADO! (${multiplier}x DANO CRÍTICO)` : success ? `FREQUÊNCIA ALINHADA (${multiplier}x)` : 'FALHA NA TRANSMISSÃO'
          });
        }, 200);
      };
    });
  }

  // 3. Saque Rápido do Velho Oeste (Quickdraw)
  runQuickdrawMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[DUELO AO MEIO-DIA] ${moveName.toUpperCase()}</h2>
              <p>AGUARDE O SINAL... QUANDO VIR O AVISO, DISPARE IMEDIATAMENTE!</p>
            </div>
            <div class="blackout-combo-badge" id="quickBadge">AGUARDANDO...</div>
          </div>
          <div class="blackout-arena-center" id="quickArena">
            <h1 id="quickSignal" style="font-size: 3rem; color: var(--term-alert); letter-spacing: 4px;">... PREPARAR ...</h1>
            <button class="term-btn gold" id="quickBtn" style="margin-top: 24px; font-size: 1.3rem; padding: 12px 28px;">
              [ DISPARAR! ]
            </button>
          </div>
        </div>
      `;

      const signalEl = document.getElementById('quickSignal');
      const badgeEl = document.getElementById('quickBadge');
      const btn = document.getElementById('quickBtn');

      let ready = false;
      let active = true;
      let signalTime = 0;
      const delay = 1200 + Math.random() * 1600;

      const triggerTimeout = setTimeout(() => {
        if (!active) return;
        ready = true;
        signalTime = Date.now();
        if (signalEl) {
          signalEl.innerText = '>> DISPARAR AGORA! <<';
          signalEl.style.color = '#00ff66';
          signalEl.style.textShadow = '0 0 20px #00ff66';
        }
        if (badgeEl) {
          badgeEl.innerText = 'FOGO LIVRE!';
          badgeEl.style.color = '#ffd700';
        }
        this.audio.playBeep(880, 'square', 0.15);
      }, delay);

      const fire = () => {
        if (!active) return;
        active = false;
        clearTimeout(triggerTimeout);
        this.triggerScreenShake();
        this.audio.playKeyClack();

        if (!ready) {
          this.audio.playAccessDenied();
          if (signalEl) signalEl.innerText = 'QUEIMOU A LARGADA! (CEDO DEMAIS)';
          setTimeout(() => resolve({ accuracy: 0.1, multiplier: 0.6, isCrit: false, feedback: 'DISPARO PREMATURO' }), 400);
          return;
        }

        const reactionMs = Date.now() - signalTime;
        const isCrit = reactionMs < 280;
        const accuracy = Math.max(0.4, 1.0 - reactionMs / 700);
        const multiplier = this.calculateMultiplier(isCrit ? 5 : 2, accuracy);

        this.audio.playBeep(isCrit ? 1000 : 600, 'triangle', 0.25);
        if (signalEl) signalEl.innerText = `TEMPO DE REAÇÃO: ${reactionMs}ms`;

        setTimeout(() => {
          resolve({
            accuracy,
            multiplier,
            isCrit,
            feedback: isCrit ? `SAQUE RELÂMPAGO! (${reactionMs}ms - ${multiplier}x)` : `TIRO CERTEIRO (${reactionMs}ms)`
          });
        }, 400);
      };

      if (btn) btn.addEventListener('click', fire);
      const keyHandler = (e) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          window.removeEventListener('keydown', keyHandler);
          fire();
        }
      };
      window.addEventListener('keydown', keyHandler);
    });
  }

  // ==========================================
  // PENLINUX MINIGAMES
  // ==========================================

  // 1. Passinho de Ritmo (Rhythm Dance)
  runRhythmMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[PASSINHO DO HEE-HEE] ${moveName.toUpperCase()}</h2>
              <p>APERTE A TECLA NO COMPASSO EXATO EM QUE A NOTA TOCA A LINHA!</p>
            </div>
            <div class="blackout-combo-badge" id="rhythmScore">RITMO: 0/4</div>
          </div>
          <div class="blackout-arena-center" style="min-height: 180px;">
            <div style="position: relative; width: 100%; max-width: 500px; height: 40px; border: 2px solid var(--term-border); background: #000; overflow: hidden;">
              <div style="position: absolute; right: 20px; top: 0; bottom: 0; width: 40px; border-left: 2px dashed #ffd700; border-right: 2px dashed #ffd700; background: rgba(255,215,0,0.15);"></div>
              <div id="rhythmNote" style="position: absolute; left: 0; top: 6px; width: 26px; height: 26px; border-radius: 50%; background: #00ff66; box-shadow: 0 0 10px #00ff66;"></div>
            </div>
            <button class="term-btn gold" id="rhythmBeatBtn" style="margin-top: 24px; font-size: 1.3rem; padding: 12px 28px;">
              [ NO COMPASSO! (ESPAÇO) ]
            </button>
          </div>
        </div>
      `;

      const note = document.getElementById('rhythmNote');
      const btn = document.getElementById('rhythmBeatBtn');
      const scoreEl = document.getElementById('rhythmScore');

      let beatsHit = 0;
      let totalBeats = 0;
      let active = true;

      const launchBeat = () => {
        if (!active || totalBeats >= 4) {
          finish();
          return;
        }
        totalBeats++;
        let pos = 0;
        const anim = () => {
          if (!active) return;
          pos += 3.5;
          if (note) note.style.left = `${pos}%`;
          if (pos < 98) {
            requestAnimationFrame(anim);
          } else {
            setTimeout(launchBeat, 200);
          }
        };
        requestAnimationFrame(anim);
      };
      launchBeat();

      const onBeat = () => {
        if (!active || !note) return;
        const currentLeft = parseFloat(note.style.left || 0);
        if (currentLeft >= 78 && currentLeft <= 96) {
          beatsHit++;
          this.audio.playKeyClack();
          this.triggerScreenShake();
          if (scoreEl) scoreEl.innerText = `RITMO: ${beatsHit}/4`;
          note.style.background = '#ffd700';
        } else {
          this.audio.playAccessDenied();
        }
      };

      if (btn) btn.addEventListener('click', onBeat);
      const keyHandler = (e) => {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          onBeat();
        }
      };
      window.addEventListener('keydown', keyHandler);

      const finish = () => {
        if (!active) return;
        active = false;
        window.removeEventListener('keydown', keyHandler);

        const accuracy = beatsHit / 4;
        const isCrit = beatsHit >= 4;
        const multiplier = this.calculateMultiplier(beatsHit, accuracy);

        this.audio.playBeep(isCrit ? 950 : 550, 'triangle', 0.2);
        resolve({
          accuracy,
          multiplier,
          isCrit,
          feedback: isCrit ? `SWING PERFEITO! (${multiplier}x DANO CRÍTICO)` : `COREOGRAFIA CONCLUÍDA (${multiplier}x)`
        });
      };
    });
  }

  // 2. Deslize Glacial com Obstáculos
  runIceSlideMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[PISTA GLACIAL] ${moveName.toUpperCase()}</h2>
              <p>USE AS SETAS / BARRAS PARA DESVIAR DOS BLOCOS DE DADOS!</p>
            </div>
            <div class="blackout-combo-badge" id="slideStatus">PISTA LIMPA</div>
          </div>
          <div class="blackout-arena-center" style="min-height: 180px;">
            <div style="display: flex; gap: 20px; width: 100%; max-width: 400px; justify-content: center;">
              <button class="term-btn lane-btn" data-lane="0" style="flex: 1; padding: 20px;">[ PISTA 1 ]</button>
              <button class="term-btn lane-btn" data-lane="1" style="flex: 1; padding: 20px; border-color: var(--term-accent);">[ PISTA 2 ]</button>
              <button class="term-btn lane-btn" data-lane="2" style="flex: 1; padding: 20px;">[ PISTA 3 ]</button>
            </div>
            <div id="slideAlertText" style="margin-top: 20px; font-size: 1.2rem; color: #ffd700;">BLOQUEIO NA PISTA 1! MUDE AGORA!</div>
          </div>
        </div>
      `;

      let currentLane = 1;
      let dodges = 0;
      let active = true;
      let blockLane = 0;
      const alertEl = document.getElementById('slideAlertText');

      const buttons = document.querySelectorAll('.lane-btn');
      const updateLanesUI = () => {
        buttons.forEach((btn, idx) => {
          btn.style.background = idx === currentLane ? 'var(--term-accent)' : '#000';
          btn.style.color = idx === currentLane ? '#000' : 'var(--term-fg)';
        });
      };
      updateLanesUI();

      buttons.forEach(btn => {
        btn.onclick = () => {
          currentLane = parseInt(btn.getAttribute('data-lane'));
          updateLanesUI();
          this.audio.playKeyClack();
        };
      });

      const keyHandler = (e) => {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          currentLane = Math.max(0, currentLane - 1);
          updateLanesUI();
          this.audio.playKeyClack();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          currentLane = Math.min(2, currentLane + 1);
          updateLanesUI();
          this.audio.playKeyClack();
        }
      };
      window.addEventListener('keydown', keyHandler);

      let step = 0;
      const stepInterval = setInterval(() => {
        if (!active) return;
        step++;
        if (step > 4) {
          finish();
          return;
        }

        if (currentLane !== blockLane) dodges++;
        blockLane = Math.floor(Math.random() * 3);
        if (alertEl) alertEl.innerText = `BLOQUEIO DETECTADO NA PISTA ${blockLane + 1}! DESVIE!`;
        this.audio.playBeep(420, 'square', 0.1);
      }, 750);

      const finish = () => {
        if (!active) return;
        active = false;
        clearInterval(stepInterval);
        window.removeEventListener('keydown', keyHandler);

        const accuracy = dodges / 4;
        const isCrit = dodges >= 4;
        const multiplier = this.calculateMultiplier(dodges, accuracy);

        resolve({
          accuracy,
          multiplier,
          isCrit,
          feedback: isCrit ? `DESLIZE GLACIAL PERFEITO! (${multiplier}x)` : `PISTA NAVEGADA (${multiplier}x)`
        });
      };
    });
  }

  // 3. Iceberg Stomp
  runIcebergStompMinigame(moveName) {
    return this.runTimingMinigame(moveName);
  }

  // ==========================================
  // TIGERVEX MINIGAMES
  // ==========================================

  // 1. Talho de Titânio (Precision Slice)
  runPrecisionSliceMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[TALHO DE TITÂNIO] ${moveName.toUpperCase()}</h2>
              <p>CLIQUE OU CORTE OS CABOS CONDUTORES EM SEQUÊNCIA!</p>
            </div>
            <div class="blackout-combo-badge" id="sliceCount">CORTES: 0/4</div>
          </div>
          <div class="blackout-arena-center" id="sliceArena"></div>
        </div>
      `;

      const arena = document.getElementById('sliceArena');
      const countEl = document.getElementById('sliceCount');
      let slices = 0;
      let active = true;

      const spawnWire = () => {
        if (!active || !arena) return;
        const wire = document.createElement('button');
        wire.className = 'term-target-node';
        wire.style.borderColor = '#ffd700';
        wire.innerText = '[ // CORTE AQUI // ]';
        wire.style.left = `${Math.random() * 60 + 15}%`;
        wire.style.top = `${Math.random() * 60 + 20}%`;

        wire.onclick = () => {
          this.audio.playKeyClack();
          this.triggerScreenShake();
          slices++;
          if (countEl) countEl.innerText = `CORTES: ${slices}/4`;
          wire.style.background = '#ffd700';
          wire.style.color = '#000';
          setTimeout(() => wire.remove(), 60);

          if (slices >= 4) finish();
          else spawnWire();
        };

        arena.appendChild(wire);
      };
      spawnWire();

      const timeout = setTimeout(() => finish(), 3600);

      const finish = () => {
        if (!active) return;
        active = false;
        clearTimeout(timeout);

        const accuracy = slices / 4;
        const isCrit = slices >= 4;
        const multiplier = this.calculateMultiplier(slices, accuracy);

        resolve({
          accuracy,
          multiplier,
          isCrit,
          feedback: isCrit ? `CORTE CIRÚRGICO! (${multiplier}x DANO CRÍTICO)` : `TALHO CONCLUÍDO (${multiplier}x)`
        });
      };
    });
  }

  // 2. Carga de Plasma (Plasma Charge)
  runPlasmaChargeMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="blackout-inner-box">
          <div class="blackout-title-row">
            <div>
              <h2 style="color: var(--term-accent);">[CARGA DE PLASMA] ${moveName.toUpperCase()}</h2>
              <p>SEGURE O BOTÃO E SOLTE QUANDO A CARGA ATINGIR 90% A 100%!</p>
            </div>
            <div class="blackout-combo-badge" id="plasmaPercent">0%</div>
          </div>
          <div class="blackout-arena-center">
            <div style="width: 100%; max-width: 500px; height: 36px; border: 2px solid var(--term-border); background: #000; overflow: hidden;">
              <div id="plasmaFill" style="width: 0%; height: 100%; background: #00ff66; transition: width 0.05s linear;"></div>
            </div>
            <button class="term-btn gold" id="plasmaHoldBtn" style="margin-top: 24px; font-size: 1.3rem; padding: 14px 28px;">
              [ SEGURE PARA CARREGAR ]
            </button>
          </div>
        </div>
      `;

      const fill = document.getElementById('plasmaFill');
      const percentEl = document.getElementById('plasmaPercent');
      const btn = document.getElementById('plasmaHoldBtn');

      let charge = 0;
      let charging = false;
      let chargeInterval = null;
      let active = true;

      const startCharge = () => {
        if (!active || charging) return;
        charging = true;
        chargeInterval = setInterval(() => {
          charge += 3.2;
          if (fill) fill.style.width = `${Math.min(100, charge)}%`;
          if (percentEl) percentEl.innerText = `${Math.floor(charge)}%`;
          this.audio.playBeep(300 + charge * 6, 'sine', 0.04);

          if (charge > 115) {
            releaseCharge();
          }
        }, 40);
      };

      const releaseCharge = () => {
        if (!active || !charging) return;
        active = false;
        charging = false;
        clearInterval(chargeInterval);
        this.triggerScreenShake();

        const isCrit = charge >= 90 && charge <= 100;
        const accuracy = charge > 105 ? 0.2 : Math.max(0.3, 1.0 - Math.abs(charge - 95) / 50);
        const multiplier = this.calculateMultiplier(isCrit ? 5 : 2, accuracy);

        this.audio.playBeep(isCrit ? 1000 : 400, 'sawtooth', 0.25);
        resolve({
          accuracy,
          multiplier,
          isCrit,
          feedback: isCrit ? `PLASMA INSTÁVEL MÁXIMO! (${multiplier}x)` : charge > 105 ? 'SOBRECARGA ESTOUROU' : `DISPARO EFETIVO (${multiplier}x)`
        });
      };

      if (btn) {
        btn.addEventListener('mousedown', startCharge);
        btn.addEventListener('mouseup', releaseCharge);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startCharge(); });
        btn.addEventListener('touchend', releaseCharge);
      }
    });
  }

  // 3. Conexão Bobinas Tesla
  runTeslaConnectMinigame(moveName) {
    return this.runArrowsMinigame(moveName);
  }

  // ==========================================
  // PAVABYTE MINIGAMES
  // ==========================================

  // 1. Prisma Quântico RGB
  runPrismMinigame(moveName) {
    return this.runTimingMinigame(moveName);
  }

  // 2. Leque Holográfico de Memória
  runHoloFanMemoryMinigame(moveName) {
    return this.runArrowsMinigame(moveName);
  }

  // 3. Cascata de Fótons
  runLuminousCascadeMinigame(moveName) {
    return this.runTargetsMinigame(moveName);
  }

  // ==========================================
  // FINALIZADOR EM CADEIA (CRONÔMETRO TOTAL DE 15 SEGUNDOS)
  // ==========================================
  async runChainedFinisher(moveName, robotKey = 'DINOBYTE') {
    this.audio.playPowerUp();

    const robotMiniSets = {
      DINOBYTE: ['dino_targets', 'dino_arrows', 'dino_timing'],
      COWPUTER: ['cow_lasso', 'cow_decrypt', 'cow_quickdraw'],
      PENLINUX: ['pen_rhythm', 'pen_slide', 'dino_timing'],
      TIGERVEX: ['tiger_slice', 'tiger_plasma', 'dino_arrows'],
      PAVABYTE: ['dino_timing', 'cow_decrypt', 'dino_targets']
    };

    const set = robotMiniSets[robotKey] || ['dino_targets', 'dino_arrows', 'dino_timing'];
    const results = [];

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = `
      <div class="blackout-inner-box" style="text-align: center; justify-content: center;">
        <div style="font-size: 0.95rem; color: #ffd700; font-weight: 700; letter-spacing: 2px;">// PROTOCOLO DE DESTRUIÇÃO MACIÇA //</div>
        <h1 style="color: #ffd700; font-size: 2.6rem; letter-spacing: 4px; text-shadow: 0 0 30px #ffd700; margin: 10px 0;">
          >> FINALIZADOR SUPREMO: ${moveName.toUpperCase()} <<
        </h1>
        <p style="color: var(--term-fg); font-size: 1.2rem; margin-top: 10px;">
          CRONÔMETRO TOTAL: <strong>15 SEGUNDOS</strong> para executar os 3 minigames em sequência contínua!
        </p>
      </div>
    `;
    await new Promise(r => setTimeout(r, 1300));

    const totalDurationMs = 15000;
    const globalStartTime = Date.now();

    for (let i = 0; i < set.length; i++) {
      const elapsed = Date.now() - globalStartTime;
      const timeLeftSec = Math.max(0, ((totalDurationMs - elapsed) / 1000).toFixed(1));

      if (elapsed >= totalDurationMs) {
        results.push({ accuracy: 0.2, multiplier: 0.8, isCrit: false, feedback: 'TEMPO ESGOTADO' });
        break;
      }

      const stepName = `[ETAPA ${i + 1}/3] ${moveName} (RESTANTE: ${timeLeftSec}s)`;
      const res = await this.run(set[i], stepName, robotKey);
      results.push(res);
    }

    const totalElapsed = Date.now() - globalStartTime;
    const completedInTime = totalElapsed <= totalDurationMs;
    const avgAccuracy = results.reduce((acc, r) => acc + r.accuracy, 0) / set.length;
    const timeBonus = completedInTime ? Math.max(0.1, (totalDurationMs - totalElapsed) / 20000) : 0;
    const finalMultiplier = Number((1.2 + avgAccuracy * 1.5 + timeBonus).toFixed(2));
    const isMastered = avgAccuracy >= 0.6 && completedInTime;

    this.audio.playHeavyImpact();
    this.triggerScreenShake();

    return {
      accuracy: avgAccuracy,
      multiplier: finalMultiplier,
      isCrit: isMastered,
      feedback: isMastered ? `SOBRECARGA SUPREMA EXECUTADA EM ${(totalElapsed / 1000).toFixed(1)}s! (${finalMultiplier}x DANO)` : `FINALIZADOR CONCLUÍDO (${finalMultiplier}x)`
    };
  }

  // ==========================================
  // DEFESA: MOEDA 3D PROCEDURAL (POLÍGONO 20 LADOS COM FÍSICA)
  // ==========================================
  runCoinFlipModal(playerGuess) {
    return new Promise(resolve => {
      const outcome = Math.random() < 0.5 ? 'CARA' : 'COROA';
      this.audio.playKeyClack();

      const engine = this.engine3D || (window.gameInstance && window.gameInstance.engine3D);
      if (engine && typeof engine.run3DCoinFlipCinematic === 'function') {
        engine.run3DCoinFlipCinematic(playerGuess, outcome, (res) => {
          if (res.won) {
            this.audio.playPowerUp();
          } else {
            this.audio.playDeniedSound();
          }
          this.triggerScreenShake();
          resolve(res);
        });
      } else {
        resolve({ won: playerGuess === outcome, outcome });
      }
    });
  }
}
