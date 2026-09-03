// TERMINAL/public/js/terminal-minigames.js - Motor Avançado de Minigames (Undertale Bullet-Hell, FNF Rítmico, Terminal de Comandos e Reflexos)
export class TerminalMinigames {
  constructor(overlayElement, audioManager, engine3D = null) {
    this.overlay = overlayElement;
    this.audio = audioManager;
    this.engine3D = engine3D;
    this.currentAnimFrame = null;
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
      dino_targets: 'DESVIE DOS METEOROS E COLETE OS NÓS DE IGNIÇÃO TÉRMICA!',
      targets: 'DESVIE DOS METEOROS E COLETE OS NÓS DE IGNIÇÃO TÉRMICA!',
      dino_arrows: 'CUIDADO: GARRAS LASER TELEGUIDADAS! SAIA DA LINHA DE MIRA RAPIDAMENTE!',
      arrows: 'CUIDADO: GARRAS LASER TELEGUIDADAS! SAIA DA LINHA DE MIRA RAPIDAMENTE!',
      dino_timing: 'ORBITE O NÚCLEO EM VOLTA DO VÓRTICE DE FOGO SEM TOCAR NAS LABAREDAS!',
      timing: 'ORBITE O NÚCLEO EM VOLTA DO VÓRTICE DE FOGO SEM TOCAR NAS LABAREDAS!',
      cow_lasso: 'GIRE JUNTO COM O LAÇO MAGNÉTICO! AS BORDAS DA ARENA ESTÃO ELETRIFICADAS!',
      cow_decrypt: 'NAVEGUE PELO LABIRINTO DE DADOS E COLETE AS CHAVES HEX 0xKEY!',
      decrypt: 'NAVEGUE PELO LABIRINTO DE DADOS E COLETE AS CHAVES HEX 0xKEY!',
      cow_quickdraw: 'ESQUIVE DOS DISPAROS DE PLASMA QUE RICOCHETEIAM NAS 4 PAREDES!',
      pen_slide: 'DESLIZE NA PISTA GLACIAL E DESVIE DAS ESTALACTITES EM ALTA VELOCIDADE!',
      pen_stomp: 'FRENESI ÁRTICO: PASSE O CURSOR RAPIDAMENTE SOBRE AS PLACAS DE GELO PARA QUEBRÁ-LAS!',
      pen_rhythm: 'RITMO DO HEE-HEE (ESTILO FNF): PRESSIONE [A/S/W/D] OU [SETAS] NO TEMPO EXATO DA BATIDA!',
      rhythm: 'RITMO DO HEE-HEE (ESTILO FNF): PRESSIONE [A/S/W/D] OU [SETAS] NO TEMPO EXATO DA BATIDA!',
      tiger_slice: 'TALHO DE TITÂNIO: CLIQUE OU ARRASTE VELOZMENTE SOBRE OS PONTOS FRACOS DE PLASMA!',
      tiger_plasma: 'DESVIE DOS ORBES TESLA TELEGUIADOS QUE PERSEGUEM O SEU NÚCLEO!',
      tiger_tesla: 'SOBRECARGA DE CIRCUITO: DIGITE RAPIDAMENTE OS COMANDOS DO TERMINAL NO TECLADO!',
      pava_prism: 'ALINHAMENTO PRISMÁTICO: CLIQUE NOS ESPELHOS PARA DIRECIONAR O FEIXE DE LUZ!',
      pava_fan: 'ACOMPANHE A ROTAÇÃO DO LEQUE HOLOGRÁFICO FICANDO NA ZONA ILUMINADA!',
      pava_cascade: 'COLETE OS FÓTONS DOURADOS E ESQUIVE DAS PARTÍCULAS CORROMPIDAS!',
      chained_finisher: 'FINALIZADOR SUPREMO: SOBREVIVA À BARRAGEM TRÍPLICE DE 10.5 SEGUNDOS!',
      finisher: 'FINALIZADOR SUPREMO: SOBREVIVA À BARRAGEM TRÍPLICE DE 10.5 SEGUNDOS!'
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
    if (legendEl) legendEl.innerText = `// COMANDO: ${instructionText} //`;

    overlay.classList.remove('hidden');

    const steps = [
      { text: '3', pitch: 440, duration: 750 },
      { text: '2', pitch: 550, duration: 750 },
      { text: '1', pitch: 660, duration: 750 },
      { text: 'AÇÃO!', pitch: 880, duration: 450 }
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
  // DESPACHANTE GERAL DE MINIGAMES
  // =========================================================================
  async run(minigameType, moveName, robotKey = 'DINOBYTE') {
    const instruction = this.getMinigameInstruction(minigameType);
    await this.showPreCountdown(moveName, instruction);

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';

    let result;
    switch (minigameType) {
      case 'pen_rhythm':
      case 'rhythm':
        result = await this.runRhythmFNFMinigame(moveName);
        break;

      case 'pen_stomp':
        result = await this.runIceFrenzyMinigame(moveName);
        break;

      case 'tiger_tesla':
        result = await this.runCommandTypingMinigame(moveName);
        break;

      case 'tiger_slice':
        result = await this.runSliceReflexMinigame(moveName);
        break;

      case 'pava_prism':
        result = await this.runPrismAlignMinigame(moveName);
        break;

      default:
        result = await this.runUndertaleMinigame(minigameType, moveName, robotKey);
        break;
    }

    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
    return result;
  }

  // =========================================================================
  // 1. MOTOR UNDERTALE (BULLET-HELL / NÚCLEO EM ARENA 2D / 10s)
  // =========================================================================
  runUndertaleMinigame(type, moveName, robotKey) {
    return new Promise(resolve => {
      const coreColor = this.getRobotCoreColor(robotKey);

      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #ff3344; font-weight: 800; letter-spacing: 1px;">// ARENA DE ESQUIVA TÁTICA //</span>
              <h2 style="color: ${coreColor}; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="utTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div class="undertale-canvas-container" id="utCanvasContainer">
            <canvas id="utArenaCanvas" width="520" height="320"></canvas>
          </div>

          <div class="undertale-bottom-hud">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: var(--term-fg); font-size: 0.9rem;">NÚCLEO:</span>
              <div class="undertale-integrity-track">
                <div id="utIntegrityFill" class="undertale-integrity-fill" style="width: 100%;"></div>
              </div>
              <span id="utIntegrityText" style="color: #00ff66; font-size: 0.9rem; font-weight: 800;">100%</span>
            </div>

            <div>
              <span style="color: var(--term-dim); font-size: 0.85rem;">POTÊNCIA:</span>
              <strong id="utMultiDisplay" style="color: ${coreColor}; font-size: 1.15rem; margin-left: 4px;">1.40x</strong>
            </div>
          </div>

          <div class="undertale-controls-legend">
            [ W / A / S / D ] [ SETAS ] ou [ MOUSE / CURSOR ] PARA MANOBRAR O NÚCLEO
          </div>
        </div>
      `;

      const canvas = document.getElementById('utArenaCanvas');
      const ctx = canvas.getContext('2d');
      const timerDisplay = document.getElementById('utTimerDisplay');
      const integrityFill = document.getElementById('utIntegrityFill');
      const integrityText = document.getElementById('utIntegrityText');
      const multiDisplay = document.getElementById('utMultiDisplay');

      const W = canvas.width;
      const H = canvas.height;

      const player = {
        x: W / 2,
        y: H / 2 + 50,
        vx: 0,
        vy: 0,
        radius: 8,
        speed: 4.8,
        color: coreColor,
        integrity: 100,
        invulnerableTimer: 0,
        trail: [],
        itemsCollected: 0
      };

      const keys = {};
      let isMouseActive = false;
      let mousePos = { x: player.x, y: player.y };

      const onKeyDown = (e) => {
        keys[e.code] = true;
        isMouseActive = false;
      };
      const onKeyUp = (e) => {
        keys[e.code] = false;
      };

      const onMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        mousePos.x = (e.clientX - rect.left) * scaleX;
        mousePos.y = (e.clientY - rect.top) * scaleY;
        isMouseActive = true;
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = W / rect.width;
          const scaleY = H / rect.height;
          mousePos.x = (e.touches[0].clientX - rect.left) * scaleX;
          mousePos.y = (e.touches[0].clientY - rect.top) * scaleY;
          isMouseActive = true;
        }
      }, { passive: true });

      const projectiles = [];
      const lasers = [];
      const collectibles = [];
      const particles = [];
      const floatingTexts = [];

      let running = true;
      const totalDurationMs = type === 'chained_finisher' ? 10500 : 10000;
      const startTime = performance.now();

      const createSparks = (x, y, color = '#ff3344', count = 10) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4 + 1.5;
          particles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1.0,
            decay: Math.random() * 0.04 + 0.03,
            color
          });
        }
      };

      const addFloatingText = (text, x, y, color = '#ffd700') => {
        floatingTexts.push({ text, x, y, vy: -1.2, life: 1.0, color });
      };

      const updateAndRender = (now) => {
        if (!running) return;

        const elapsed = now - startTime;
        const remainingMs = Math.max(0, totalDurationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        // Movimento
        if (isMouseActive) {
          const dx = mousePos.x - player.x;
          const dy = mousePos.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 2) {
            player.x += (dx / dist) * Math.min(dist, player.speed * 1.3);
            player.y += (dy / dist) * Math.min(dist, player.speed * 1.3);
          }
        } else {
          let moveX = 0;
          let moveY = 0;
          if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

          if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
          }

          player.x += moveX * player.speed;
          player.y += moveY * player.speed;
        }

        player.x = Math.max(player.radius + 4, Math.min(W - player.radius - 4, player.x));
        player.y = Math.max(player.radius + 4, Math.min(H - player.radius - 4, player.y));

        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 7) player.trail.shift();

        if (player.invulnerableTimer > 0) player.invulnerableTimer--;

        // Lógica de Padrões
        this.runPatternLogic(type, elapsed, W, H, projectiles, lasers, collectibles, player);

        // Regra especial Cowputer Lasso: bordas eletrificadas forçam rotação intermediária
        if (type === 'cow_lasso') {
          const borderDist = 28;
          if (player.x < borderDist || player.x > W - borderDist || player.y < borderDist || player.y > H - borderDist) {
            if (player.invulnerableTimer === 0) {
              player.integrity = Math.max(0, player.integrity - 10);
              player.invulnerableTimer = 18;
              this.triggerScreenShake();
              this.audio.playBuzzer();
              createSparks(player.x, player.y, '#ff3344', 10);
              addFloatingText('-CERCA ELÉTRICA!', player.x, player.y - 10, '#ff3344');
            }
          }
        }

        // Atualização de Projéteis
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.rot !== undefined) p.rot += p.vrot || 0.05;

          const distSq = (player.x - p.x) ** 2 + (player.y - p.y) ** 2;
          const hitDist = (player.radius + (p.radius || 6));
          if (distSq < hitDist * hitDist && player.invulnerableTimer === 0) {
            player.integrity = Math.max(0, player.integrity - (p.damage || 14));
            player.invulnerableTimer = 24;
            this.triggerScreenShake();
            this.audio.playBuzzer();
            createSparks(player.x, player.y, '#ff3344', 14);
            addFloatingText('-DANIFICADO!', player.x, player.y - 12, '#ff3344');

            if (p.destroyOnHit !== false) {
              projectiles.splice(i, 1);
              continue;
            }
          }

          if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) {
            projectiles.splice(i, 1);
          }
        }

        // Atualização de Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.timer += 16;
          if (l.timer > l.warnTime && l.timer < l.warnTime + l.activeTime) {
            if (player.invulnerableTimer === 0) {
              const d = this.distToSegment({ x: player.x, y: player.y }, l.p1, l.p2);
              if (d < (l.width || 10) / 2 + player.radius) {
                player.integrity = Math.max(0, player.integrity - 16);
                player.invulnerableTimer = 26;
                this.triggerScreenShake();
                this.audio.playBuzzer();
                createSparks(player.x, player.y, '#ff3344', 16);
                addFloatingText('-TALHO LASER!', player.x, player.y - 14, '#ff3344');
              }
            }
          }
          if (l.timer >= l.warnTime + l.activeTime) {
            lasers.splice(i, 1);
          }
        }

        // Atualização de Coletáveis
        for (let i = collectibles.length - 1; i >= 0; i--) {
          const c = collectibles[i];
          if (c.vy) c.y += c.vy;
          if (c.vx) c.x += c.vx;

          const distSq = (player.x - c.x) ** 2 + (player.y - c.y) ** 2;
          if (distSq < (player.radius + c.radius) ** 2) {
            player.itemsCollected++;
            player.integrity = Math.min(100, player.integrity + (c.heal || 4));
            this.audio.playKeyClack();
            createSparks(c.x, c.y, c.color || '#ffd700', 12);
            addFloatingText(`+${c.name || 'DADO'}`, c.x, c.y - 10, c.color || '#ffd700');
            collectibles.splice(i, 1);
            continue;
          }

          if (c.y > H + 30) collectibles.splice(i, 1);
        }

        // Partículas & Textos
        particles.forEach(pt => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= pt.decay;
        });
        for (let i = particles.length - 1; i >= 0; i--) {
          if (particles[i].life <= 0) particles.splice(i, 1);
        }

        floatingTexts.forEach(ft => {
          ft.y += ft.vy;
          ft.life -= 0.035;
        });
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
        }

        // HUD
        if (integrityFill) integrityFill.style.width = `${player.integrity}%`;
        if (integrityText) {
          integrityText.innerText = `${Math.floor(player.integrity)}%`;
          integrityText.style.color = player.integrity <= 30 ? '#ff3344' : player.integrity <= 65 ? '#ffd700' : '#00ff66';
        }

        const currentMulti = this.calculateUndertaleMultiplier(player.integrity, player.itemsCollected);
        if (multiDisplay) multiDisplay.innerText = `${currentMulti.toFixed(2)}x`;

        // Render Canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0, 255, 102, 0.07)';
        ctx.lineWidth = 1;
        const gridSize = 26;
        for (let x = 0; x < W; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // Borda eletrificada para Cowputer
        if (type === 'cow_lasso') {
          ctx.strokeStyle = 'rgba(255, 51, 68, 0.6)';
          ctx.lineWidth = 4;
          ctx.strokeRect(10, 10, W - 20, H - 20);
        }

        // Render Lasers
        lasers.forEach(l => {
          if (l.timer < l.warnTime) {
            ctx.strokeStyle = 'rgba(255, 51, 68, 0.45)';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(l.p1.x, l.p1.y);
            ctx.lineTo(l.p2.x, l.p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = l.color || '#ff3344';
            ctx.shadowColor = l.color || '#ff3344';
            ctx.shadowBlur = 12;
            ctx.lineWidth = l.width || 12;
            ctx.beginPath();
            ctx.moveTo(l.p1.x, l.p1.y);
            ctx.lineTo(l.p2.x, l.p2.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });

        // Render Coletáveis
        collectibles.forEach(c => {
          ctx.fillStyle = c.color || '#ffd700';
          ctx.shadowColor = c.color || '#ffd700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius || 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#000000';
          ctx.font = '900 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', c.x, c.y);
        });

        // Render Projéteis
        projectiles.forEach(p => {
          ctx.fillStyle = p.color || '#ff4433';
          ctx.shadowColor = p.color || '#ff4433';
          ctx.shadowBlur = 8;

          if (p.shape === 'shard') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot || Math.atan2(p.vy, p.vx));
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-6, -4);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        });

        // Render Partículas
        particles.forEach(pt => {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.life);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        });

        // Rastro do Jogador
        player.trail.forEach((t, idx) => {
          ctx.fillStyle = player.color;
          ctx.globalAlpha = (idx / player.trail.length) * 0.35;
          ctx.beginPath();
          ctx.arc(t.x, t.y, player.radius * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        });

        // Núcleo
        if (player.invulnerableTimer % 4 < 2) {
          ctx.fillStyle = player.color;
          ctx.shadowColor = player.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(player.x, player.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Textos Flutuantes
        floatingTexts.forEach(ft => {
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = Math.max(0, ft.life);
          ctx.font = '900 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.globalAlpha = 1.0;
        });

        if (elapsed >= totalDurationMs) {
          finishMinigame();
        } else {
          this.currentAnimFrame = requestAnimationFrame(updateAndRender);
        }
      };

      const finishMinigame = () => {
        if (!running) return;
        running = false;
        if (this.currentAnimFrame) cancelAnimationFrame(this.currentAnimFrame);

        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);

        const finalMulti = this.calculateUndertaleMultiplier(player.integrity, player.itemsCollected);
        const isCrit = player.integrity >= 85;
        const feedback = isCrit ?
          `DESVIO IMPECÁVEL! (${finalMulti.toFixed(2)}x CRÍTICO)` :
          `NÚCLEO ESTABILIZADO (${finalMulti.toFixed(2)}x)`;

        this.audio.playPowerUp();
        this.triggerScreenShake();

        resolve({
          accuracy: player.integrity / 100,
          multiplier: Number(finalMulti.toFixed(2)),
          isCrit,
          feedback
        });
      };

      this.currentAnimFrame = requestAnimationFrame(updateAndRender);
    });
  }

  calculateUndertaleMultiplier(integrity, itemsCollected) {
    const base = 0.6 + (integrity / 100) * 0.7;
    const bonus = Math.min(0.25, (itemsCollected || 0) * 0.05);
    return Number((base + bonus).toFixed(2));
  }

  // =========================================================================
  // PADRÕES DE BALAS (COM ALTA DIFICULDADE NO DB E COWPUTER)
  // =========================================================================
  runPatternLogic(type, elapsed, W, H, projectiles, lasers, collectibles, player) {
    const sec = elapsed / 1000;

    switch (type) {
      // 1. DINO: Chuva de Meteoros
      case 'dino_targets':
      case 'targets': {
        if (Math.random() < 0.28) {
          projectiles.push({
            x: Math.random() * (W - 20) + 10,
            y: -10,
            vx: (Math.random() - 0.5) * 2.8,
            vy: Math.random() * 3.0 + 3.5,
            radius: 8,
            color: '#ff3344',
            shape: 'shard'
          });
        }
        if (collectibles.length < 2 && Math.random() < 0.04) {
          collectibles.push({
            x: Math.random() * (W - 60) + 30,
            y: Math.random() * (H - 60) + 30,
            radius: 8,
            color: '#ffd700',
            name: 'IGNIÇÃO'
          });
        }
        break;
      }

      // 2. DINO: Garras Flamejantes (DIFICULTADO COM LASERS MIRADOS NO NÚCLEO)
      case 'dino_arrows':
      case 'arrows': {
        // Laser teleguiado direto na posição do jogador a cada 1.2 segundos
        if (lasers.length < 5 && Math.random() < 0.09) {
          const targetPlayerX = player.x;
          const targetPlayerY = player.y;
          const isHoriz = Math.random() < 0.5;

          if (isHoriz) {
            lasers.push({
              p1: { x: 0, y: targetPlayerY },
              p2: { x: W, y: targetPlayerY },
              timer: 0,
              warnTime: 320,
              activeTime: 260,
              width: 14,
              color: '#ff3344'
            });
          } else {
            lasers.push({
              p1: { x: targetPlayerX, y: 0 },
              p2: { x: targetPlayerX, y: H },
              timer: 0,
              warnTime: 320,
              activeTime: 260,
              width: 14,
              color: '#ff3344'
            });
          }
        }
        // Fagulhas rápidas cortando a tela
        if (Math.random() < 0.2) {
          projectiles.push({
            x: Math.random() < 0.5 ? -10 : W + 10,
            y: Math.random() * H,
            vx: (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 3 + 3.0),
            vy: (Math.random() - 0.5) * 2.0,
            radius: 6,
            color: '#ff7700'
          });
        }
        break;
      }

      // 3. DINO: Firewall Dracônico (DIFICULTADO COM VÓRTICE ESPIRAL DE 4 BRAÇOS)
      case 'dino_timing':
      case 'timing': {
        if (Math.random() < 0.45) {
          const spd = 3.2;
          const numArms = 4;
          for (let arm = 0; arm < numArms; arm++) {
            const angle = sec * 4.2 + (arm * Math.PI / 2);
            projectiles.push({
              x: W / 2,
              y: H / 2,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              radius: 7,
              color: arm % 2 === 0 ? '#ff3344' : '#ffaa00'
            });
          }
        }
        break;
      }

      // 4. COWPUTER: Laço Magnético Polar (COBRE A ARENA INTEIRA E OBRIGA A GIRAR)
      case 'cow_lasso': {
        const cx = W / 2;
        const cy = H / 2;
        const len = 340; // Comprimento total cobrindo os cantos
        const angle = sec * 2.4;

        if (lasers.length === 0) {
          lasers.push({
            p1: { x: cx - Math.cos(angle) * len, y: cy - Math.sin(angle) * len },
            p2: { x: cx + Math.cos(angle) * len, y: cy + Math.sin(angle) * len },
            timer: 400,
            warnTime: 0,
            activeTime: 12000,
            width: 10,
            color: '#ffd700'
          });
        } else {
          lasers[0].p1 = { x: cx - Math.cos(angle) * len, y: cy - Math.sin(angle) * len };
          lasers[0].p2 = { x: cx + Math.cos(angle) * len, y: cy + Math.sin(angle) * len };
        }

        // Projéteis orbitais expelidos no giro
        if (Math.random() < 0.18) {
          projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle + Math.PI / 2) * 2.8,
            vy: Math.sin(angle + Math.PI / 2) * 2.8,
            radius: 6,
            color: '#ffd700'
          });
        }
        break;
      }

      // 5. COWPUTER: Labirinto Hexadecimal
      case 'cow_decrypt':
      case 'decrypt': {
        if (collectibles.length < 2 && Math.random() < 0.04) {
          collectibles.push({
            x: Math.random() * (W - 80) + 40,
            y: Math.random() * (H - 80) + 40,
            radius: 9,
            color: '#00ff66',
            name: '0xKEY'
          });
        }
        if (Math.random() < 0.2) {
          projectiles.push({
            x: -10,
            y: Math.random() * H,
            vx: Math.random() * 2.8 + 3.0,
            vy: 0,
            radius: 7,
            color: '#00e5ff'
          });
        }
        break;
      }

      // 6. COWPUTER: Balas de Ricochete
      case 'cow_quickdraw': {
        if (projectiles.length < 9 && Math.random() < 0.1) {
          const spd = 3.8;
          const angle = Math.random() * Math.PI * 2;
          projectiles.push({
            x: Math.random() * W,
            y: 0,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            radius: 7,
            color: '#ffd700'
          });
        }
        break;
      }

      // 7. PENLINUX: Pista Glacial
      case 'pen_slide': {
        if (Math.random() < 0.35) {
          projectiles.push({
            x: Math.random() * (W - 30) + 15,
            y: -15,
            vx: (Math.random() - 0.5) * 1.4,
            vy: Math.random() * 3.5 + 4.0,
            radius: 8,
            color: '#00e5ff',
            shape: 'shard'
          });
        }
        break;
      }

      // 8. TIGERVEX: Bote de Plasma (Orbes Teleguiados)
      case 'tiger_plasma': {
        if (projectiles.length < 4 && Math.random() < 0.04) {
          projectiles.push({
            x: Math.random() < 0.5 ? 20 : W - 20,
            y: 20,
            vx: 0,
            vy: 0,
            radius: 9,
            color: '#ffff00',
            destroyOnHit: false
          });
        }
        projectiles.forEach(p => {
          const dx = player.x - p.x;
          const dy = player.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          p.vx += (dx / d) * 0.09;
          p.vy += (dy / d) * 0.09;
          p.vx *= 0.96;
          p.vy *= 0.96;
        });
        break;
      }

      // 9. PAVABYTE: Leque Holográfico
      case 'pava_fan': {
        if (Math.random() < 0.3) {
          const a = (Math.sin(sec * 4.0) * 0.5 + 0.5) * Math.PI * 2;
          projectiles.push({
            x: W / 2,
            y: H / 2,
            vx: Math.cos(a) * 3.4,
            vy: Math.sin(a) * 3.4,
            radius: 7,
            color: '#e040fb'
          });
        }
        break;
      }

      // 10. PAVABYTE: Cascata de Códigos
      case 'pava_cascade': {
        if (Math.random() < 0.3) {
          projectiles.push({
            x: Math.random() * (W - 20) + 10,
            y: -10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 2.5 + 3.2,
            radius: 6,
            color: '#ff3388'
          });
        }
        if (collectibles.length < 3 && Math.random() < 0.05) {
          collectibles.push({
            x: Math.random() * (W - 40) + 20,
            y: -10,
            vx: 0,
            vy: 2.4,
            radius: 7,
            color: '#ffd700',
            name: 'FÓTON'
          });
        }
        break;
      }

      // 11. FINALIZADOR SUPREMO EM CADEIA (3 FASES BRUTAIS)
      case 'chained_finisher':
      case 'finisher': {
        if (sec < 3.5) {
          // Fase 1: Chuva Densa de Meteoros + Lasers Teleguiados
          if (Math.random() < 0.35) {
            projectiles.push({
              x: Math.random() * W,
              y: -10,
              vx: (Math.random() - 0.5) * 2.4,
              vy: Math.random() * 4.0 + 3.8,
              radius: 7,
              color: '#ff3344'
            });
          }
        } else if (sec < 7.0) {
          // Fase 2: Lasers de Corte Cruzado
          if (lasers.length < 4 && Math.random() < 0.1) {
            const y = Math.random() * H;
            lasers.push({ p1: { x: 0, y }, p2: { x: W, y }, timer: 0, warnTime: 280, activeTime: 200, width: 14, color: '#ffff00' });
          }
        } else {
          // Fase 3: Vórtice Supremo de Luz
          if (Math.random() < 0.4) {
            const a = sec * 7.0;
            projectiles.push({
              x: W / 2,
              y: H / 2,
              vx: Math.cos(a) * 4.0,
              vy: Math.sin(a) * 4.0,
              radius: 8,
              color: '#e040fb'
            });
          }
        }
        break;
      }
    }
  }

  // =========================================================================
  // 2. MINIGAME RÍTMICO ESTILO FNF / DANCE PASS (PENLINUX - 10s)
  // =========================================================================
  runRhythmFNFMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #00e5ff; font-weight: 800; letter-spacing: 1px;">// PISTA RÍTMICA HEE-HEE (ESTILO FNF) //</span>
              <h2 style="color: #00e5ff; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="fnfTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div class="fnf-tracks-container" id="fnfTracksContainer" style="position: relative; width: 480px; height: 300px; background: #000; border: 2px solid #00e5ff; overflow: hidden; display: flex;">
            <div class="fnf-column" style="flex: 1; border-right: 1px dashed rgba(0, 229, 255, 0.3); position: relative;" data-col="0">
              <div class="fnf-target-zone" style="position: absolute; bottom: 20px; left: 10px; right: 10px; height: 40px; border: 2px solid #00e5ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #00e5ff;">[ ← A ]</div>
            </div>
            <div class="fnf-column" style="flex: 1; border-right: 1px dashed rgba(0, 229, 255, 0.3); position: relative;" data-col="1">
              <div class="fnf-target-zone" style="position: absolute; bottom: 20px; left: 10px; right: 10px; height: 40px; border: 2px solid #00e5ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #00e5ff;">[ ↓ S ]</div>
            </div>
            <div class="fnf-column" style="flex: 1; border-right: 1px dashed rgba(0, 229, 255, 0.3); position: relative;" data-col="2">
              <div class="fnf-target-zone" style="position: absolute; bottom: 20px; left: 10px; right: 10px; height: 40px; border: 2px solid #00e5ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #00e5ff;">[ ↑ W ]</div>
            </div>
            <div class="fnf-column" style="flex: 1; position: relative;" data-col="3">
              <div class="fnf-target-zone" style="position: absolute; bottom: 20px; left: 10px; right: 10px; height: 40px; border: 2px solid #00e5ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #00e5ff;">[ → D ]</div>
            </div>
          </div>

          <div class="undertale-bottom-hud">
            <div>
              <span style="color: var(--term-dim);">COMBO:</span>
              <strong id="fnfComboText" style="color: #ffd700; font-size: 1.2rem; margin-left: 4px;">0x</strong>
            </div>
            <div>
              <span style="color: var(--term-dim);">POTÊNCIA:</span>
              <strong id="fnfMultiText" style="color: #00e5ff; font-size: 1.2rem; margin-left: 4px;">1.00x</strong>
            </div>
          </div>
        </div>
      `;

      const container = document.getElementById('fnfTracksContainer');
      const timerDisplay = document.getElementById('fnfTimerDisplay');
      const comboText = document.getElementById('fnfComboText');
      const multiText = document.getElementById('fnfMultiText');

      let notes = [];
      let score = 0;
      let combo = 0;
      let totalNotes = 0;
      let running = true;
      const durationMs = 10000;
      const startTime = performance.now();
      let lastSpawn = 0;

      const keyMap = {
        ArrowLeft: 0, KeyA: 0,
        ArrowDown: 1, KeyS: 1,
        ArrowUp: 2, KeyW: 2,
        ArrowRight: 3, KeyD: 3
      };

      const onKeyDown = (e) => {
        const col = keyMap[e.code];
        if (col === undefined) return;

        // Procura nota próxima da zona de impacto (Y entre 210 e 270)
        let hitNoteIdx = -1;
        let bestDist = 999;

        notes.forEach((n, idx) => {
          if (n.col === col && !n.hit) {
            const dist = Math.abs(n.y - 240);
            if (dist < 45 && dist < bestDist) {
              bestDist = dist;
              hitNoteIdx = idx;
            }
          }
        });

        if (hitNoteIdx !== -1) {
          const n = notes[hitNoteIdx];
          n.hit = true;
          combo++;
          score += (bestDist < 18) ? 100 : 60;
          this.audio.playKeyClack();
          this.audio.playBeep(440 + col * 110, 'triangle', 0.08);

          if (n.el) {
            n.el.style.borderColor = '#ffd700';
            n.el.style.background = '#ffd700';
            n.el.innerText = bestDist < 18 ? 'PERFEITO!' : 'BOM!';
            setTimeout(() => n.el && n.el.remove(), 120);
          }
        } else {
          combo = Math.max(0, combo - 1);
          this.audio.playBuzzer();
        }

        if (comboText) comboText.innerText = `${combo}x`;
        const multi = Number((0.7 + Math.min(0.7, (score / 1400) * 0.7)).toFixed(2));
        if (multiText) multiText.innerText = `${multi.toFixed(2)}x`;
      };

      window.addEventListener('keydown', onKeyDown);

      const loop = (now) => {
        if (!running) return;
        const elapsed = now - startTime;
        const remainingMs = Math.max(0, durationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        // Spawner de notas ao ritmo
        if (now - lastSpawn > 420 && elapsed < durationMs - 1200) {
          lastSpawn = now;
          const col = Math.floor(Math.random() * 4);
          totalNotes++;

          const colEl = container.children[col];
          const noteEl = document.createElement('div');
          noteEl.style.position = 'absolute';
          noteEl.style.left = '12px';
          noteEl.style.right = '12px';
          noteEl.style.height = '28px';
          noteEl.style.background = 'rgba(0, 229, 255, 0.85)';
          noteEl.style.border = '2px solid #ffffff';
          noteEl.style.borderRadius = '4px';
          noteEl.style.top = '0px';
          noteEl.style.color = '#000';
          noteEl.style.fontWeight = '900';
          noteEl.style.fontSize = '0.8rem';
          noteEl.style.display = 'flex';
          noteEl.style.alignItems = 'center';
          noteEl.style.justifyContent = 'center';
          noteEl.innerText = ['◄', '▼', '▲', '►'][col];
          colEl.appendChild(noteEl);

          notes.push({ col, y: 0, el: noteEl, hit: false });
        }

        // Move notas para baixo
        for (let i = notes.length - 1; i >= 0; i--) {
          const n = notes[i];
          n.y += 3.8;
          if (n.el) n.el.style.top = `${n.y}px`;

          if (n.y > 300) {
            if (!n.hit) {
              combo = 0;
              if (comboText) comboText.innerText = '0x';
            }
            if (n.el) n.el.remove();
            notes.splice(i, 1);
          }
        }

        if (elapsed >= durationMs) {
          running = false;
          window.removeEventListener('keydown', onKeyDown);
          const multi = Number((0.7 + Math.min(0.7, (score / 1400) * 0.7)).toFixed(2));
          const isCrit = multi >= 1.35;
          this.audio.playPowerUp();
          resolve({
            accuracy: Math.min(1.0, score / 1200),
            multiplier: multi,
            isCrit,
            feedback: isCrit ? `COREOGRAFIA PERFEITA! (${multi}x CRÍTICO)` : `RITMO SINCRONIZADO (${multi}x)`
          });
        } else {
          this.currentAnimFrame = requestAnimationFrame(loop);
        }
      };

      this.currentAnimFrame = requestAnimationFrame(loop);
    });
  }

  // =========================================================================
  // 3. MINIGAME FRENESI DE GELO / MASHING COM MOUSE (PENLINUX STOMP - 10s)
  // =========================================================================
  runIceFrenzyMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #00e5ff; font-weight: 800; letter-spacing: 1px;">// TERREMOTO DE ICEBERG //</span>
              <h2 style="color: #00e5ff; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="iceTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div id="iceArenaContainer" style="position: relative; width: 480px; height: 280px; background: #000; border: 2px solid #00e5ff; overflow: hidden; cursor: crosshair;"></div>

          <div class="undertale-bottom-hud">
            <div>
              <span style="color: var(--term-dim);">PLACAS QUEBRADAS:</span>
              <strong id="iceBreakCount" style="color: #00e5ff; font-size: 1.2rem; margin-left: 4px;">0</strong>
            </div>
            <div>
              <span style="color: var(--term-dim);">POTÊNCIA:</span>
              <strong id="iceMultiText" style="color: #ffd700; font-size: 1.2rem; margin-left: 4px;">0.80x</strong>
            </div>
          </div>
          <div class="undertale-controls-legend">
            PASSE O CURSOR OU CLIQUE RAPIDAMENTE SOBRE AS PLACAS DE GELO PARA FRATURÁ-LAS!
          </div>
        </div>
      `;

      const arena = document.getElementById('iceArenaContainer');
      const timerDisplay = document.getElementById('iceTimerDisplay');
      const breakCountEl = document.getElementById('iceBreakCount');
      const multiText = document.getElementById('iceMultiText');

      let breaks = 0;
      let running = true;
      const durationMs = 10000;
      const startTime = performance.now();
      let lastSpawn = 0;

      const spawnIceBlock = () => {
        if (!running) return;
        const block = document.createElement('div');
        const size = Math.random() * 30 + 40;
        const x = Math.random() * (480 - size);
        const y = Math.random() * (280 - size);

        block.style.position = 'absolute';
        block.style.left = `${x}px`;
        block.style.top = `${y}px`;
        block.style.width = `${size}px`;
        block.style.height = `${size}px`;
        block.style.background = 'rgba(0, 229, 255, 0.25)';
        block.style.border = '2px solid #00e5ff';
        block.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.4)';
        block.style.borderRadius = '4px';
        block.style.display = 'flex';
        block.style.alignItems = 'center';
        block.style.justifyContent = 'center';
        block.style.color = '#ffffff';
        block.style.fontWeight = '900';
        block.style.fontSize = '1.1rem';
        block.innerText = '[#]';

        const fracture = () => {
          if (block.dataset.broken) return;
          block.dataset.broken = '1';
          breaks++;
          this.audio.playKeyClack();
          this.audio.playBeep(600 + Math.random() * 200, 'sawtooth', 0.05);
          block.style.borderColor = '#ffd700';
          block.style.background = 'rgba(255, 215, 0, 0.4)';
          block.innerText = '[X]';
          if (breakCountEl) breakCountEl.innerText = breaks;

          const multi = Number((0.8 + Math.min(0.65, (breaks / 24) * 0.65)).toFixed(2));
          if (multiText) multiText.innerText = `${multi.toFixed(2)}x`;

          setTimeout(() => block.remove(), 100);
        };

        block.addEventListener('mouseenter', fracture);
        block.addEventListener('click', fracture);
        arena.appendChild(block);

        setTimeout(() => {
          if (!block.dataset.broken) block.remove();
        }, 1400);
      };

      const loop = (now) => {
        if (!running) return;
        const elapsed = now - startTime;
        const remainingMs = Math.max(0, durationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        if (now - lastSpawn > 260) {
          lastSpawn = now;
          spawnIceBlock();
        }

        if (elapsed >= durationMs) {
          running = false;
          const multi = Number((0.8 + Math.min(0.65, (breaks / 24) * 0.65)).toFixed(2));
          const isCrit = multi >= 1.35;
          this.audio.playPowerUp();
          resolve({
            accuracy: Math.min(1.0, breaks / 24),
            multiplier: multi,
            isCrit,
            feedback: isCrit ? `FRENESI DEVASTADOR! (${multi}x CRÍTICO)` : `ONDA SÍSMICA CONCLUÍDA (${multi}x)`
          });
        } else {
          this.currentAnimFrame = requestAnimationFrame(loop);
        }
      };

      this.currentAnimFrame = requestAnimationFrame(loop);
    });
  }

  // =========================================================================
  // 4. MINIGAME DIGITAÇÃO RÁPIDA DE COMANDOS (TIGERVEX TESLA - 10s)
  // =========================================================================
  runCommandTypingMinigame(moveName) {
    return new Promise(resolve => {
      const commands = ['CIRCUITO', 'VOLTAGEM', 'RELAMPAGO', 'SOBRECARGA', 'THUNDER', 'TESLA', 'ENERGIZAR'];
      let currentIdx = 0;
      let wordsCompleted = 0;
      let targetWord = commands[Math.floor(Math.random() * commands.length)];
      let typed = '';

      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #ffff00; font-weight: 800; letter-spacing: 1px;">// SOBRECARGA DE CIRCUITO TESLA //</span>
              <h2 style="color: #ffff00; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="typeTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div style="padding: 24px; text-align: center; background: #000; border: 2px solid #ffff00; width: 460px; margin: 10px 0;">
            <div style="font-size: 0.9rem; color: var(--term-dim); margin-bottom: 6px;">DIGITE O COMANDO DE ALTA TENSÃO NO TECLADO:</div>
            <div id="targetWordPrompt" style="font-size: 2.2rem; font-weight: 900; color: #ffff00; letter-spacing: 4px; font-family: monospace;">${targetWord}</div>
            <div id="typedWordProgress" style="font-size: 1.4rem; color: #00ff66; margin-top: 8px; font-family: monospace; letter-spacing: 3px;">_</div>
          </div>

          <div class="undertale-bottom-hud">
            <div>
              <span style="color: var(--term-dim);">COMANDOS ENERGIZADOS:</span>
              <strong id="wordsCount" style="color: #ffff00; font-size: 1.2rem; margin-left: 4px;">0</strong>
            </div>
            <div>
              <span style="color: var(--term-dim);">POTÊNCIA:</span>
              <strong id="typeMultiText" style="color: #ffd700; font-size: 1.2rem; margin-left: 4px;">0.80x</strong>
            </div>
          </div>
        </div>
      `;

      const timerDisplay = document.getElementById('typeTimerDisplay');
      const targetPrompt = document.getElementById('targetWordPrompt');
      const typedProgress = document.getElementById('typedWordProgress');
      const wordsCountEl = document.getElementById('wordsCount');
      const multiText = document.getElementById('typeMultiText');

      let running = true;
      const durationMs = 10000;
      const startTime = performance.now();

      const onKeyDown = (e) => {
        if (!running) return;
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
          const expectedChar = targetWord[typed.length];
          if (key === expectedChar) {
            typed += key;
            this.audio.playKeyClack();
            if (typedProgress) typedProgress.innerText = typed;

            if (typed === targetWord) {
              wordsCompleted++;
              this.audio.playPowerUp();
              if (wordsCountEl) wordsCountEl.innerText = wordsCompleted;
              const multi = Number((0.8 + Math.min(0.65, (wordsCompleted / 5) * 0.65)).toFixed(2));
              if (multiText) multiText.innerText = `${multi.toFixed(2)}x`;

              // Nova palavra
              typed = '';
              targetWord = commands[Math.floor(Math.random() * commands.length)];
              if (targetPrompt) targetPrompt.innerText = targetWord;
              if (typedProgress) typedProgress.innerText = '_';
            }
          } else {
            this.audio.playBuzzer();
          }
        }
      };

      window.addEventListener('keydown', onKeyDown);

      const loop = (now) => {
        if (!running) return;
        const elapsed = now - startTime;
        const remainingMs = Math.max(0, durationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        if (elapsed >= durationMs) {
          running = false;
          window.removeEventListener('keydown', onKeyDown);
          const multi = Number((0.8 + Math.min(0.65, (wordsCompleted / 5) * 0.65)).toFixed(2));
          const isCrit = multi >= 1.35;
          this.audio.playPowerUp();
          resolve({
            accuracy: Math.min(1.0, wordsCompleted / 5),
            multiplier: multi,
            isCrit,
            feedback: isCrit ? `SOBRECARGA SUPREMA! (${multi}x CRÍTICO)` : `CIRCUITO ENERGIZADO (${multi}x)`
          });
        } else {
          this.currentAnimFrame = requestAnimationFrame(loop);
        }
      };

      this.currentAnimFrame = requestAnimationFrame(loop);
    });
  }

  // =========================================================================
  // 5. MINIGAME REFLEXO DE CORTE CIRÚRGICO (TIGERVEX SLICE - 10s)
  // =========================================================================
  runSliceReflexMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #ffff00; font-weight: 800; letter-spacing: 1px;">// TALHO DE TITÂNIO //</span>
              <h2 style="color: #ffff00; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="sliceTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div id="sliceArena" style="position: relative; width: 480px; height: 280px; background: #000; border: 2px solid #ffff00; overflow: hidden; cursor: crosshair;"></div>

          <div class="undertale-bottom-hud">
            <div>
              <span style="color: var(--term-dim);">CORTES PRECISOS:</span>
              <strong id="sliceCount" style="color: #ffff00; font-size: 1.2rem; margin-left: 4px;">0</strong>
            </div>
            <div>
              <span style="color: var(--term-dim);">POTÊNCIA:</span>
              <strong id="sliceMulti" style="color: #ffd700; font-size: 1.2rem; margin-left: 4px;">0.80x</strong>
            </div>
          </div>
          <div class="undertale-controls-legend">
            CLIQUE OU ARRASTE VELOZMENTE SOBRE OS CIRCUITOS PISCADORES!
          </div>
        </div>
      `;

      const arena = document.getElementById('sliceArena');
      const timerDisplay = document.getElementById('sliceTimerDisplay');
      const sliceCountEl = document.getElementById('sliceCount');
      const multiEl = document.getElementById('sliceMulti');

      let slices = 0;
      let running = true;
      const durationMs = 10000;
      const startTime = performance.now();
      let lastSpawn = 0;

      const spawnSliceTarget = () => {
        if (!running) return;
        const target = document.createElement('div');
        const x = Math.random() * 380 + 20;
        const y = Math.random() * 200 + 20;

        target.style.position = 'absolute';
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.width = '70px';
        target.style.height = '40px';
        target.style.background = 'rgba(255, 255, 0, 0.2)';
        target.style.border = '2px dashed #ffff00';
        target.style.boxShadow = '0 0 15px rgba(255, 255, 0, 0.4)';
        target.style.display = 'flex';
        target.style.alignItems = 'center';
        target.style.justifyContent = 'center';
        target.style.color = '#ffffff';
        target.style.fontWeight = '900';
        target.innerText = '// CORTE //';

        const onCut = () => {
          if (target.dataset.cut) return;
          target.dataset.cut = '1';
          slices++;
          this.audio.playSlashSound();
          target.style.borderColor = '#00ff66';
          target.style.background = 'rgba(0, 255, 102, 0.5)';
          target.innerText = '[TALHADO!]';
          if (sliceCountEl) sliceCountEl.innerText = slices;

          const multi = Number((0.8 + Math.min(0.65, (slices / 16) * 0.65)).toFixed(2));
          if (multiEl) multiEl.innerText = `${multi.toFixed(2)}x`;

          setTimeout(() => target.remove(), 120);
        };

        target.addEventListener('mouseenter', onCut);
        target.addEventListener('click', onCut);
        arena.appendChild(target);

        setTimeout(() => {
          if (!target.dataset.cut) target.remove();
        }, 900);
      };

      const loop = (now) => {
        if (!running) return;
        const elapsed = now - startTime;
        const remainingMs = Math.max(0, durationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        if (now - lastSpawn > 380) {
          lastSpawn = now;
          spawnSliceTarget();
        }

        if (elapsed >= durationMs) {
          running = false;
          const multi = Number((0.8 + Math.min(0.65, (slices / 16) * 0.65)).toFixed(2));
          const isCrit = multi >= 1.35;
          this.audio.playPowerUp();
          resolve({
            accuracy: Math.min(1.0, slices / 16),
            multiplier: multi,
            isCrit,
            feedback: isCrit ? `CORTE CIRÚRGICO PERFEITO! (${multi}x CRÍTICO)` : `TALHO EXECUTADO (${multi}x)`
          });
        } else {
          this.currentAnimFrame = requestAnimationFrame(loop);
        }
      };

      this.currentAnimFrame = requestAnimationFrame(loop);
    });
  }

  // =========================================================================
  // 6. MINIGAME ALINHAMENTO PRISMÁTICO (PAVABYTE PRISM - 10s)
  // =========================================================================
  runPrismAlignMinigame(moveName) {
    return new Promise(resolve => {
      this.overlay.innerHTML = `
        <div class="undertale-arena-box">
          <div class="undertale-hud-header">
            <div>
              <span style="font-size: 0.85rem; color: #e040fb; font-weight: 800; letter-spacing: 1px;">// ALINHAMENTO PRISMÁTICO DE LUZ //</span>
              <h2 style="color: #e040fb; margin: 2px 0 0 0; font-size: 1.35rem;">[ ${moveName.toUpperCase()} ]</h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--term-dim);">TEMPO RESTANTE</span>
              <div id="prismTimer" style="font-size: 1.4rem; font-weight: 900; color: #ffd700;">10.0s</div>
            </div>
          </div>

          <div id="prismArena" style="position: relative; width: 480px; height: 280px; background: #000; border: 2px solid #e040fb; overflow: hidden; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-around; padding: 20px;"></div>

          <div class="undertale-bottom-hud">
            <div>
              <span style="color: var(--term-dim);">PRISMAS ALINHADOS:</span>
              <strong id="prismCount" style="color: #e040fb; font-size: 1.2rem; margin-left: 4px;">0</strong>
            </div>
            <div>
              <span style="color: var(--term-dim);">POTÊNCIA:</span>
              <strong id="prismMulti" style="color: #ffd700; font-size: 1.2rem; margin-left: 4px;">0.80x</strong>
            </div>
          </div>
          <div class="undertale-controls-legend">
            CLIQUE NOS PRISMAS PARA ALINHAR O FEIXE ESPECTRAL!
          </div>
        </div>
      `;

      const arena = document.getElementById('prismArena');
      const timerDisplay = document.getElementById('prismTimer');
      const countEl = document.getElementById('prismCount');
      const multiEl = document.getElementById('prismMulti');

      let aligned = 0;
      let running = true;
      const durationMs = 10000;
      const startTime = performance.now();

      // Cria 6 prismas para girar e alinhar
      for (let i = 0; i < 6; i++) {
        const prism = document.createElement('button');
        prism.className = 'term-btn gold';
        prism.style.width = '120px';
        prism.style.height = '70px';
        prism.style.margin = '10px';
        prism.style.display = 'flex';
        prism.style.flexDirection = 'column';
        prism.style.alignItems = 'center';
        prism.style.justifyContent = 'center';

        let angle = Math.floor(Math.random() * 3) * 90;
        prism.innerHTML = `<span style="font-size: 1.2rem; transform: rotate(${angle}deg);">▲</span><span style="font-size: 0.75rem;">PRISMA #${i + 1}</span>`;

        prism.onclick = () => {
          angle = (angle + 90) % 360;
          this.audio.playKeyClack();
          prism.innerHTML = `<span style="font-size: 1.2rem; transform: rotate(${angle}deg);">▲</span><span style="font-size: 0.75rem;">PRISMA #${i + 1}</span>`;
          if (angle === 0) {
            aligned++;
            prism.style.borderColor = '#00ff66';
            prism.style.background = 'rgba(0, 255, 102, 0.2)';
            this.audio.playPowerUp();
          }
          if (countEl) countEl.innerText = aligned;
          const multi = Number((0.8 + Math.min(0.65, (aligned / 6) * 0.65)).toFixed(2));
          if (multiEl) multiEl.innerText = `${multi.toFixed(2)}x`;
        };
        arena.appendChild(prism);
      }

      const loop = (now) => {
        if (!running) return;
        const elapsed = now - startTime;
        const remainingMs = Math.max(0, durationMs - elapsed);

        if (timerDisplay) timerDisplay.innerText = `${(remainingMs / 1000).toFixed(1)}s`;

        if (elapsed >= durationMs) {
          running = false;
          const multi = Number((0.8 + Math.min(0.65, (aligned / 6) * 0.65)).toFixed(2));
          const isCrit = multi >= 1.35;
          this.audio.playPowerUp();
          resolve({
            accuracy: Math.min(1.0, aligned / 6),
            multiplier: multi,
            isCrit,
            feedback: isCrit ? `REFRAÇÃO ESPECTRAL PERFEITA! (${multi}x CRÍTICO)` : `FEIXE CONVERGIDO (${multi}x)`
          });
        } else {
          this.currentAnimFrame = requestAnimationFrame(loop);
        }
      };

      this.currentAnimFrame = requestAnimationFrame(loop);
    });
  }

  // =========================================================================
  // CINEMÁTICA 3D DA MOEDA DA SORTE (DEFESA TÁTICA PROCEDURAL EM THREE.JS)
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
