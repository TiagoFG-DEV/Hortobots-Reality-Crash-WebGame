// ═══════════════════════════════════════════════════════════════════
// versus-board.js — Canvas 5x5 Board Renderer + Dynamic VFX
// Estética: Retro Terminal CRT, avatares gráficos, anéis orbitais,
// ausência de linhas retas (ondas senoidais orgânicas) e combate cadenciado (~2.5s)
// ═══════════════════════════════════════════════════════════════════

export class VersusBoard {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;

    this.cols = 5;
    this.rows = 5;

    // Sincroniza dimensões com a arena 3D
    this.resize();

    // Visual queues & particles
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.projectiles = [];
    this.beams = [];
    this.domes = [];
    this.expandingShieldBreaks = [];
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    this.time = 0;

    // Modo de Seleção de Alvo Direto no Tabuleiro (Sem menus modais!)
    this.targetSelectionMode = null;
    this.hoveredRobot = null;
    this.targetLineProgress = 1.0;
    this.supportLineProgress = 1.0;

    // Callbacks
    this.onRobotClick = null;
    this.onCellClick = null;

    this._bindEvents();
    window.addEventListener('resize', this._onResizeBound = () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : (this.canvas.clientWidth || 880);
    const h = parent ? parent.clientHeight : (this.canvas.clientHeight || 460);

    if (w > 0 && h > 0 && (this.W !== w || this.H !== h)) {
      this.W = w;
      this.H = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.cellW = this.W / this.cols;
      this.cellH = this.H / this.rows;
    }
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.targetSelectionMode) {
        this.canvas.style.cursor = 'default';
        this.hoveredRobot = null;
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.W / rect.width;
      const sy = this.H / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      const candidates = this.targetSelectionMode.type === 'attack'
        ? (this.engine?.enemyTeam || []).filter(r => r && r.isAlive)
        : (this.engine?.playerTeam || []).filter(r => r && r.isAlive);

      let found = null;
      for (const cand of candidates) {
        const base = this._cellCenter(cand.col, cand.row);
        const cx = (cand.customDrawX !== null && cand.customDrawX !== undefined) ? cand.customDrawX : base.x;
        const cy = (cand.customDrawY !== null && cand.customDrawY !== undefined) ? cand.customDrawY : base.y;
        const dist = Math.hypot(mx - cx, my - cy);
        const dx = Math.abs(mx - cx);
        const dy = Math.abs(my - cy);

        // Área ampla de interação centrada estritamente no elemento 2D do robô (círculo, tags, nome e HP)
        if (dist <= 65 || (dx <= 65 && dy <= 55)) {
          found = cand;
          break;
        }
      }
      this.hoveredRobot = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.W / rect.width;
      const sy = this.H / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      if (this.targetSelectionMode) {
        const candidates = this.targetSelectionMode.type === 'attack'
          ? (this.engine?.enemyTeam || []).filter(r => r && r.isAlive)
          : (this.engine?.playerTeam || []).filter(r => r && r.isAlive);

        for (const cand of candidates) {
          const base = this._cellCenter(cand.col, cand.row);
          const cx = (cand.customDrawX !== null && cand.customDrawX !== undefined) ? cand.customDrawX : base.x;
          const cy = (cand.customDrawY !== null && cand.customDrawY !== undefined) ? cand.customDrawY : base.y;
          const dist = Math.hypot(mx - cx, my - cy);
          const dx = Math.abs(mx - cx);
          const dy = Math.abs(my - cy);

          // Clique registrado diretamente no elemento 2D do robô!
          if (dist <= 65 || (dx <= 65 && dy <= 55)) {
            const onSelect = this.targetSelectionMode.onSelect;
            const modeType = this.targetSelectionMode.type;
            this.targetSelectionMode = null;
            this.hoveredRobot = null;
            this.canvas.style.cursor = 'default';
            window.targetSelectionMode = null;

            if (modeType === 'attack') {
              this.targetLineProgress = 0.0; // Inicia a formação lenta da linha tracejada!
            } else {
              this.supportLineProgress = 0.0;
            }

            if (onSelect) onSelect(cand);
            return;
          }
        }
        return;
      }

      const col = this._getColFromX(mx);
      const row = this._getRowFromY(my);
      this.onCellClick && this.onCellClick(col, row, mx, my);
    });
  }

  startTargetSelection(robot, type, onSelect) {
    this.targetSelectionMode = { robot, type, onSelect };
    window.targetSelectionMode = this.targetSelectionMode;
    this.hoveredRobot = null;
    this.canvas.style.cursor = 'default';
  }

  cancelTargetSelection() {
    this.targetSelectionMode = null;
    window.targetSelectionMode = null;
    this.hoveredRobot = null;
    this.canvas.style.cursor = 'default';
  }

  _getColFromX(x) {
    const relX = x / this.W;
    if (relX < 0.22) return 0;
    if (relX < 0.41) return 1;
    if (relX < 0.59) return 2;
    if (relX < 0.78) return 3;
    return 4;
  }

  _getRowFromY(y) {
    const relY = y / this.H;
    if (relY < 0.17) return 0;
    if (relY < 0.37) return 1;
    if (relY < 0.63) return 2;
    if (relY < 0.83) return 3;
    return 4;
  }

  start(engine) {
    this.engine = engine;
    this.resize();
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      this.time++;
      this._update();
      this._render();
    };
    loop();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
  }

  // ─── Update Loop ──────────────────────────────────────────────────
  _update() {
    this.resize();
    const t = this.time;

    // Sincronização Dinâmica em Tempo Real dos Pedestais 3D com os Robôs 2D
    if (window.versus3DEngine && typeof window.versus3DEngine.syncRobotPedestals === 'function') {
      window.versus3DEngine.syncRobotPedestals(this.engine, (col, row) => this._cellCenter(col, row));
    }

    // Ambient plasma dust from live robots
    if (t % 3 === 0 && this.engine) {
      const liveRobots = [
        ...(this.engine.playerTeam || []),
        ...(this.engine.enemyTeam || [])
      ].filter(r => r && r.isAlive);

      liveRobots.forEach(r => {
        const c = this._cellCenter(r.col, r.row);
        const a = Math.random() * Math.PI * 2;
        const dist = Math.random() * 20;
        this.particles.push({
          x: c.x + Math.cos(a) * dist,
          y: c.y + Math.sin(a) * dist,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 1.2 - 0.3, // floats upwards like CRT phosphor sparks
          life: 1,
          decay: 0.025 + Math.random() * 0.02,
          color: r.color,
          size: Math.random() * 2.5 + 1,
          shape: 'circle',
        });
      });
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.life -= p.decay;
      p.vx *= 0.97;
      p.vy *= 0.97;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Expanding & fading broken shields (com dispersão holográfica)
    for (let i = this.expandingShieldBreaks.length - 1; i >= 0; i--) {
      const sb = this.expandingShieldBreaks[i];
      sb.r += sb.expandSpeed;
      sb.alpha -= sb.fadeSpeed;
      if (sb.alpha <= 0 || sb.r >= sb.maxR) {
        this.expandingShieldBreaks.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += sw.speed || 3.5;
      sw.life -= 0.04;
      if (sw.life <= 0 || sw.r >= sw.maxR) this.shockwaves.splice(i, 1);
    }

    // Floating texts with bounce physics
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.vy += 0.05; // gentle gravity deceleration
      ft.life -= 0.015;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Dynamic Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.progress += pr.speed;
      // Spawn trail particle
      if (Math.random() < 0.8) {
        this.particles.push({
          x: pr.curX + (Math.random() - 0.5) * 6,
          y: pr.curY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          life: 0.8,
          decay: 0.05,
          color: pr.color,
          size: Math.random() * 3 + 1.5,
          shape: 'spark',
        });
      }
      if (pr.progress >= 1) {
        pr.resolve && pr.resolve();
        this.projectiles.splice(i, 1);
      }
    }

    // Dynamic Domes
    for (let i = this.domes.length - 1; i >= 0; i--) {
      const d = this.domes[i];
      d.progress = Math.min(1, d.progress + 0.04);
      d.life -= 0.012;
      if (d.life <= 0) {
        d.resolve && d.resolve();
        this.domes.splice(i, 1);
      }
    }

    // Dynamic Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= 0.03;
      if (b.life <= 0) {
        b.resolve && b.resolve();
        this.beams.splice(i, 1);
      }
    }

    if (this.shakeTimer > 0) this.shakeTimer--;
  }

  // ─── Render ───────────────────────────────────────────────────────
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    ctx.save();
    if (this.shakeTimer > 0) {
      const intensity = this.shakeIntensity || 8;
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    this._drawBackground();
    this._drawCurvedOrganicGrid();
    this._drawBeams();

    if (this.targetSelectionMode) {
      // 1. Identifica os robôs candidatos a alvo (os 3 adversários no ataque, os aliados no suporte)
      const candidates = (this.targetSelectionMode.type === 'attack')
        ? (this.engine?.enemyTeam || []).filter(r => r && r.isAlive)
        : (this.engine?.playerTeam || []);

      const actorRobot = this.targetSelectionMode.robot;

      // Robôs neutros / não-alvos (ficam por baixo da tela preta)
      const allRobots = [
        ...(this.engine?.playerTeam || []),
        ...(this.engine?.fogOfWar ? [] : (this.engine?.enemyTeam || []))
      ];
      const nonCandidates = allRobots.filter(r => r && !candidates.includes(r) && r !== actorRobot);

      // Desenha os robôs neutros com baixa opacidade antes da tela preta
      ctx.save();
      ctx.globalAlpha = 0.18;
      nonCandidates.forEach(robot => {
        const base = this._cellCenter(robot.col, robot.row);
        const drawX = (robot.customDrawX !== null && robot.customDrawX !== undefined) ? robot.customDrawX : base.x;
        const drawY = (robot.customDrawY !== null && robot.customDrawY !== undefined) ? robot.customDrawY : base.y;
        this._drawSingleRobot(robot, drawX, drawY);
      });
      ctx.restore();

      // 2. A TELA PRETA PROFUNDA (Cobre o tabuleiro, o grid e os robôs neutros)
      ctx.save();
      ctx.fillStyle = 'rgba(2, 4, 10, 0.91)';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();

      // 2.1. O robô executor do jogador (atacante/suporte) visível como ponto de partida da ação
      if (actorRobot) {
        ctx.save();
        const aBase = this._cellCenter(actorRobot.col, actorRobot.row);
        const ax = (actorRobot.customDrawX !== null && actorRobot.customDrawX !== undefined) ? actorRobot.customDrawX : aBase.x;
        const ay = (actorRobot.customDrawY !== null && actorRobot.customDrawY !== undefined) ? actorRobot.customDrawY : aBase.y;
        this._drawSingleRobot(actorRobot, ax, ay);
        ctx.restore();
      }

      // 3. Linhas de mira (se houver alvo já escolhido anteriormente)
      this._drawTargetingLines();

      // 4. OS ROBÔS ALVO EM EVIDÊNCIA TOTAL — 100% RENDERIZADOS POR CIMA DA TELA PRETA!
      candidates.forEach(robot => {
        const base = this._cellCenter(robot.col, robot.row);
        const drawX = (robot.customDrawX !== null && robot.customDrawX !== undefined) ? robot.customDrawX : base.x;
        const drawY = (robot.customDrawY !== null && robot.customDrawY !== undefined) ? robot.customDrawY : base.y;

        const candColor = (this.targetSelectionMode.type === 'attack') ? '#ff3344' : '#00ff88';
        const isHovered = (this.hoveredRobot === robot);

        // Holofote / Aura radial projetada diretamente na tela preta sob o robô alvo
        ctx.save();
        const spotRadius = isHovered ? 120 : 90;
        const spotGrad = ctx.createRadialGradient(drawX, drawY, 15, drawX, drawY, spotRadius);
        spotGrad.addColorStop(0, candColor === '#ff3344' ? 'rgba(255, 51, 68, 0.45)' : 'rgba(0, 255, 136, 0.45)');
        spotGrad.addColorStop(0.5, candColor === '#ff3344' ? 'rgba(255, 51, 68, 0.18)' : 'rgba(0, 255, 136, 0.18)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, spotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // RENDERIZAÇÃO DO ROBÔ ALVO 100% POR CIMA DA TELA PRETA COM BRILHO TOTAL
        this._drawSingleRobot(robot, drawX, drawY);
      });

    } else {
      // Modo normal de jogo
      this._drawTargetingLines();
      this._drawRobots();
    }

    this._drawProjectiles();
    this._drawDomes();
    this._drawBreakingShields();
    this._drawShockwaves();
    this._drawParticles();
    this._drawFloatingTexts();

    ctx.restore();
  }

  // ─── Background: Retro Cyber Oscilloscope Aesthetic ───────────────
  _drawBackground() {
    const ctx = this.ctx;

    // Translucent cyber matrix gradient (allows the 3D Three.js arena to shine through)
    const grad = ctx.createRadialGradient(this.W / 2, this.H / 2, 20, this.W / 2, this.H / 2, this.W * 0.7);
    grad.addColorStop(0, 'rgba(10, 16, 36, 0.25)');
    grad.addColorStop(0.6, 'rgba(6, 10, 24, 0.45)');
    grad.addColorStop(1, 'rgba(2, 4, 12, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    // CRT Scanline curves (subtle lens curve effect)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.03)';
    ctx.lineWidth = 1;
    const scanStep = 8;
    for (let y = scanStep; y < this.H; y += scanStep) {
      const bend = Math.sin((y / this.H) * Math.PI) * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(this.W / 2, y + bend, this.W, y);
      ctx.stroke();
    }

    // Dynamic waving center separator (sine wave instead of straight line)
    const midX = this.W / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 51, 100, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let y = 0; y <= this.H; y += 4) {
      const wave = Math.sin(y * 0.04 + this.time * 0.06) * 7;
      if (y === 0) ctx.moveTo(midX + wave, y);
      else ctx.lineTo(midX + wave, y);
    }
    ctx.stroke();
    ctx.restore();

    // Retro Terminal Corner Brackets (no straight box borders)
    this._drawTerminalBrackets();
  }

  // Draw phosphor corner brackets ╭ ╮ ╰ ╯
  _drawTerminalBrackets() {
    const ctx = this.ctx;
    const pad = 8;
    const arm = 22;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(pad, pad + arm);
    ctx.arcTo(pad, pad, pad + arm, pad, 8);
    ctx.lineTo(pad + arm, pad);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(this.W - pad - arm, pad);
    ctx.arcTo(this.W - pad, pad, this.W - pad, pad + arm, 8);
    ctx.lineTo(this.W - pad, pad + arm);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(pad, this.H - pad - arm);
    ctx.arcTo(pad, this.H - pad, pad + arm, this.H - pad, 8);
    ctx.lineTo(pad + arm, this.H - pad);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(this.W - pad - arm, this.H - pad);
    ctx.arcTo(this.W - pad, this.H - pad, this.W - pad, this.H - pad - arm, 8);
    ctx.lineTo(this.W - pad, this.H - pad - arm);
    ctx.stroke();

    // Terminal Status Tag
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('// ARENA: CRT-PHOSPHOR //', pad + 6, pad + 16);
  }

  // ─── Organic Curved Grid (Spacious Curved Lanes) ─────────────────
  _drawCurvedOrganicGrid() {
    const ctx = this.ctx;
    const t = this.time;

    const colDividers = [this.W * 0.22, this.W * 0.41, this.W * 0.59, this.W * 0.78];
    const rowDividers = [this.H * 0.37, this.H * 0.63];

    // Vertical undulating columns
    colDividers.forEach((baseX, c) => {
      const pulse = Math.sin(t * 0.03 + c) * 0.15 + 0.18;
      ctx.strokeStyle = `rgba(0, 229, 255, ${pulse * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let y = 0; y <= this.H; y += 6) {
        const offset = Math.sin(y * 0.03 + t * 0.04 + c * 1.5) * 4;
        if (y === 0) ctx.moveTo(baseX + offset, y);
        else ctx.lineTo(baseX + offset, y);
      }
      ctx.stroke();
    });

    // Horizontal undulating rows
    rowDividers.forEach((baseY, r) => {
      const pulse = Math.cos(t * 0.03 + r) * 0.15 + 0.18;
      ctx.strokeStyle = `rgba(0, 229, 255, ${pulse * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= this.W; x += 6) {
        const offset = Math.sin(x * 0.03 + t * 0.04 + r * 1.5) * 4;
        if (x === 0) ctx.moveTo(x, baseY + offset);
        else ctx.lineTo(x, baseY + offset);
      }
      ctx.stroke();
    });

    // Circular nodes at cell intersections
    colDividers.forEach((cx, c) => {
      rowDividers.forEach((cy, r) => {
        const nodePulse = Math.sin(t * 0.08 + c * 2 + r * 3) * 1.5 + 2.5;
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, nodePulse, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  // ─── Dynamic Curved Targeting Lines (Progressive Formation from Player to Target) ───
  _drawTargetingLines() {
    if (!this.engine) return;
    const ctx = this.ctx;
    const t = this.time;

    const attacker = this.engine.playerTeam.find(r => r.action === 'attack' && r.isAlive);

    // Linha tracejada de mira do atacante (forma-se devagar partindo do player até o alvo)
    if (attacker && attacker._chosenTarget && attacker._chosenTarget.isAlive) {
      const target = attacker._chosenTarget;
      const from = this._cellCenter(attacker.col, attacker.row);
      const to = this._cellCenter(target.col, target.row);

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 30 + Math.sin(t * 0.08) * 8;

      // Progressão suave da formação da linha: parte do player e avança até o alvo
      if (this.targetLineProgress < 1.0) {
        this.targetLineProgress = Math.min(1.0, this.targetLineProgress + 0.025);

        // Faíscas holográficas na ponta que avança
        const u = this.targetLineProgress;
        const tipX = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * midX + u * u * to.x;
        const tipY = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * midY + u * u * to.y;
        if (Math.random() < 0.45 && this.particles) {
          this.particles.push({
            x: tipX,
            y: tipY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 1,
            decay: 0.05,
            color: '#ff3344',
            size: Math.random() * 2 + 1.5,
            shape: 'circle'
          });
        }
      }

      const u = this.targetLineProgress;
      const q0x = from.x;
      const q0y = from.y;
      const q1x = (1 - u) * from.x + u * midX;
      const q1y = (1 - u) * from.y + u * midY;
      const q2x = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * midX + u * u * to.x;
      const q2y = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * midY + u * u * to.y;

      ctx.save();
      ctx.strokeStyle = '#ff3344';
      ctx.shadowColor = '#ff3344';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -t * 1.6; // animação contínua do fluxo de dados

      ctx.beginPath();
      ctx.moveTo(q0x, q0y);
      ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
      ctx.stroke();

      // Retículo de travamento no alvo (surge quando a linha atinge o destino)
      if (u >= 0.85) {
        const reticleAlpha = Math.min(1, (u - 0.85) / 0.15);
        ctx.globalAlpha = reticleAlpha;
        const reticleR = 26 + Math.sin(t * 0.12) * 4;
        ctx.strokeStyle = 'rgba(255, 51, 68, 0.95)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(to.x, to.y, reticleR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Arco de cura/reviver do suporte (forma-se devagar partindo do suporte até o aliado)
    const supporter = this.engine.playerTeam.find(r => r.action === 'support' && r.isAlive);
    if (supporter && supporter._chosenAllyTarget) {
      const ally = supporter._chosenAllyTarget;
      const from = this._cellCenter(supporter.col, supporter.row);
      const to = this._cellCenter(ally.col, ally.row);

      const midX = (from.x + to.x) / 2 - 20;
      const midY = (from.y + to.y) / 2;

      if (this.supportLineProgress < 1.0) {
        this.supportLineProgress = Math.min(1.0, this.supportLineProgress + 0.025);
      }

      const u = this.supportLineProgress;
      const q0x = from.x;
      const q0y = from.y;
      const q1x = (1 - u) * from.x + u * midX;
      const q1y = (1 - u) * from.y + u * midY;
      const q2x = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * midX + u * u * to.x;
      const q2y = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * midY + u * u * to.y;

      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -t * 1.3;

      ctx.beginPath();
      ctx.moveTo(q0x, q0y);
      ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (u >= 0.85) {
        const reticleAlpha = Math.min(1, (u - 0.85) / 0.15);
        ctx.globalAlpha = reticleAlpha;
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.95)';
        ctx.beginPath();
        ctx.arc(to.x, to.y, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _cellCenter(col, row) {
    const colFractions = {
      0: 0.12, // Col 0: Pedestal Inicial do Jogador (12% da largura)
      1: 0.32, // Col 1: Linha de Frente / Avanço do Jogador (32%)
      2: 0.50, // Col 2: Monólito Central / Núcleo (50%)
      3: 0.68, // Col 3: Linha de Frente / Avanço do Oponente (68%)
      4: 0.88  // Col 4: Pedestal Inicial do Oponente (88%)
    };
    const rowFractions = {
      0: 0.10,
      1: 0.25, // Raia 1 (Superior)
      2: 0.50, // Raia 2 (Central)
      3: 0.75, // Raia 3 (Inferior)
      4: 0.90
    };
    const x = colFractions[col] !== undefined ? (this.W * colFractions[col]) : (col * this.cellW + this.cellW / 2);
    const y = rowFractions[row] !== undefined ? (this.H * rowFractions[row]) : (row * this.cellH + this.cellH / 2);
    return { x, y };
  }

  // ─── Robots Rendering (100% Dynamic with Orbitals & Avatars) ──────
  _drawRobots() {
    if (!this.engine) return;

    // Se estiver em Névoa de Guerra, renderiza as 3 posições inimigas como incógnitas misteriosas
    if (this.engine.fogOfWar) {
      for (let r = 1; r <= 3; r++) {
        const c = this._cellCenter(4, r);
        this._drawFogOfWarMysteryRobot(c.x, c.y);
      }
    }

    // Se houver posições vagas no time do jogador durante o recrutamento, exibe o dock de encaixe
    if (this.engine.phase === 'selection') {
      const occupiedRows = (this.engine.playerTeam || []).map(b => b.row);
      for (let r = 1; r <= 3; r++) {
        if (!occupiedRows.includes(r)) {
          const c = this._cellCenter(0, r);
          this._drawVacantSlot(c.x, c.y, r);
        }
      }
    }

    const allRobots = [
      ...(this.engine.playerTeam || []),
      ...(this.engine.fogOfWar ? [] : (this.engine.enemyTeam || []))
    ];

    allRobots.forEach(robot => {
      if (!robot) return;
      const base = this._cellCenter(robot.col, robot.row);
      let drawX = (robot.customDrawX !== null && robot.customDrawX !== undefined) ? robot.customDrawX : base.x;
      let drawY = (robot.customDrawY !== null && robot.customDrawY !== undefined) ? robot.customDrawY : base.y;

      this._drawSingleRobot(robot, drawX, drawY);
    });
  }

  _drawVacantSlot(x, y, row) {
    const ctx = this.ctx;
    const t = this.time;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = t * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText(`[ LINHA ${row} ]`, x, y + 3);
    ctx.restore();
  }

  _drawSingleRobot(robot, x, y) {
    const ctx = this.ctx;
    const t = this.time;

    // Névoa de Guerra: Oponente permanece um mistério até o início do Round 1
    if (this.engine && this.engine.fogOfWar && robot.side === 'ENEMY') {
      this._drawFogOfWarMysteryRobot(x, y);
      return;
    }

    if (!robot.isAlive) {
      // Downed robot with corrupted glitch halo
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = robot.color;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3344';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[DOWN]', x, y + 4);
      ctx.restore();
      return;
    }

    // 1. Dynamic Breathing Radius
    const baseRadius = 24;
    const breath = Math.sin(t * 0.07 + robot.pulsePhase) * 2;
    const r = baseRadius + breath;

    // 1.5. Modo Evidência (Destaque quando um papel está ativo no menu lateral)
    if (this.evidenceRole && robot.side === 'PLAYER') {
      const evColor = this.evidenceRole === 'attack' ? '#ff4455'
        : this.evidenceRole === 'defense' ? '#00e5ff' : '#00ff88';
      ctx.save();
      ctx.strokeStyle = evColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = evColor;
      ctx.shadowBlur = 18;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = t * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r + 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = evColor;
      ctx.textAlign = 'center';
      ctx.fillText(robot.action ? `[ ${robot.action.toUpperCase()} ]` : `[ CLIQUE P/ ESCOLHER ]`, x, y - r - 10);
      ctx.restore();
    }

    // 2. Rotating 3D Orbital Rings (Never Static!)
    this._drawOrbitalRings(x, y, r, robot.color, robot.pulsePhase);

    // 3. Selection / Role Glow Aura
    if (robot.isSelected || robot.action) {
      const auraColor = robot.action === 'attack' ? '#ff3344'
        : robot.action === 'defense' ? '#00e5ff'
        : robot.action === 'support' ? '#00ff88' : '#ffd700';

      ctx.save();
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 24 + Math.sin(t * 0.1) * 6;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = t * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r + 9, 0, Math.PI * 2);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3.5. Destaque de Alvo no Tabuleiro (Modo de Mira Direta no Tabuleiro)
    if (this.targetSelectionMode) {
      const isCandidate = (this.targetSelectionMode.type === 'attack' && robot.side === 'ENEMY' && robot.isAlive)
                       || (this.targetSelectionMode.type === 'support' && robot.side === 'PLAYER');

      if (isCandidate) {
        const candColor = this.targetSelectionMode.type === 'attack' ? '#ff3344' : '#00ff88';
        const isHovered = (this.hoveredRobot === robot);

        ctx.save();
        ctx.strokeStyle = candColor;
        ctx.shadowColor = candColor;
        ctx.shadowBlur = isHovered ? 45 : (28 + Math.sin(t * 0.15) * 10);
        ctx.lineWidth = isHovered ? 3.8 : 2.6;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = t * (isHovered ? 2.2 : 1.2);

        // Anel de mira pulsante expandido
        ctx.beginPath();
        ctx.arc(x, y, r + (isHovered ? 20 : 15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Brackets / Mira de cantos holográficos ╭ ╮ ╰ ╯
        const bArm = isHovered ? 15 : 11;
        const bDist = r + (isHovered ? 24 : 18);
        ctx.lineWidth = isHovered ? 2.8 : 2.0;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(x - bDist, y - bDist + bArm);
        ctx.lineTo(x - bDist, y - bDist);
        ctx.lineTo(x - bDist + bArm, y - bDist);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(x + bDist - bArm, y - bDist);
        ctx.lineTo(x + bDist, y - bDist);
        ctx.lineTo(x + bDist, y - bDist + bArm);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(x - bDist, y + bDist - bArm);
        ctx.lineTo(x - bDist, y + bDist);
        ctx.lineTo(x - bDist + bArm, y + bDist);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(x + bDist - bArm, y + bDist);
        ctx.lineTo(x + bDist, y + bDist);
        ctx.lineTo(x + bDist, y + bDist - bArm);
        ctx.stroke();

        // Tag Flutuante com Ação e HP (sem emojis)
        ctx.font = isHovered ? '900 11px monospace' : '900 10px monospace';
        ctx.fillStyle = isHovered ? '#ffffff' : candColor;
        ctx.textAlign = 'center';
        const actionTxt = isHovered
          ? (this.targetSelectionMode.type === 'attack' ? '[ CLIQUE PARA ATACAR ]'
             : this.targetSelectionMode.type === 'defense' ? '[ CLIQUE PARA PROTEGER ]'
             : '[ CLIQUE PARA ESCOLHER ]')
          : (this.targetSelectionMode.type === 'attack' ? '[ MIRAR ]'
             : this.targetSelectionMode.type === 'defense' ? '[ PROTEGER ]'
             : '[ SELECIONAR ]');
        ctx.fillText(actionTxt, x, y - r - 16);

        // Retículo tático de foco diretamente no centro do robô 2D ao passar o cursor
        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x - 9, y);
          ctx.lineTo(x + 9, y);
          ctx.moveTo(x, y - 9);
          ctx.lineTo(x, y + 9);
          ctx.stroke();
        }

        ctx.font = 'bold 12px "Share Tech Mono", monospace';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeText(`${robot.name} (${robot.currentHp} HP)`, x, y + r + 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${robot.name} (${robot.currentHp} HP)`, x, y + r + 22);
        ctx.restore();
      }
    }

    // 4. Shield Holographic Arcs
    if (robot.shield) {
      this._drawShield(robot, x, y, r);
    }

    // 5. HoT (Regen) Spiral Particles
    if (robot.hotEffect) {
      this._drawHoTEffect(x, y, r);
    }

    // 6. Robot Body Gradient & Core
    ctx.save();
    ctx.shadowColor = robot.color;
    ctx.shadowBlur = 18;

    const bodyGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, r);
    bodyGrad.addColorStop(0, this._lighten(robot.color, 0.7));
    bodyGrad.addColorStop(0.5, robot.color);
    bodyGrad.addColorStop(1, this._darken(robot.color, 0.4));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner Phosphor Lens Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 7. Graphic Avatar Glyph (Retro Terminal Style)
    this._drawAvatarGlyph(robot.id, x, y, r, robot.color);

    // 8. Dynamic HP Bar & Energy Indicators below
    this._drawRobotMiniHUD(robot, x, y, r);
  }

  // ── Orbiting 3D Energy Rings around alive robots ──────────────────
  _drawOrbitalRings(x, y, r, color, phase) {
    const ctx = this.ctx;
    const t = this.time * 0.04 + phase;

    ctx.save();
    // Ring 1 (Tilted +25 deg)
    ctx.translate(x, y);
    ctx.rotate(0.4);
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 7, (r + 7) * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting particle 1
    const px1 = Math.cos(t) * (r + 7);
    const py1 = Math.sin(t) * (r + 7) * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px1, py1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ring 2 (Tilted -35 deg, counter-rotating)
    ctx.rotate(-0.8);
    ctx.strokeStyle = `${color}33`;
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 9, (r + 9) * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting particle 2
    const px2 = Math.cos(-t * 1.3) * (r + 9);
    const py2 = Math.sin(-t * 1.3) * (r + 9) * 0.4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px2, py2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Retro Cyber Avatar Glyphs for each robot ──────────────────────
  _drawAvatarGlyph(id, x, y, r, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (id) {
      case 'DB': {
        // Dino-Byte: Thermal Fang & Crest Glyph
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 6);
        ctx.lineTo(x - 4, y - 8);
        ctx.lineTo(x + 2, y - 3);
        ctx.lineTo(x + 8, y - 9);
        ctx.lineTo(x + 7, y + 6);
        ctx.lineTo(x, y + 2);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'PL': {
        // Penlinux: Arctic Visor & Crystal Glyph
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 2);
        ctx.lineTo(x + 9, y - 2);
        ctx.stroke();
        // Crystal diamond in center
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'CP': {
        // Cowputer-Moo: Circuit Horns & Star Badge
        // Horns
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 7);
        ctx.quadraticCurveTo(x - 5, y - 1, x, y + 2);
        ctx.quadraticCurveTo(x + 5, y - 1, x + 10, y - 7);
        ctx.stroke();
        // Star cross
        ctx.beginPath();
        ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 7);
        ctx.moveTo(x - 6, y + 1); ctx.lineTo(x + 6, y + 1);
        ctx.stroke();
        break;
      }
      case 'PB': {
        // Pavabyte: Optical Feather Fan & Prism Ring
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        // 3 Feathers radiating up
        for (let a = -0.5; a <= 0.5; a += 0.5) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.sin(a) * 11, y - Math.cos(a) * 11);
          ctx.stroke();
        }
        break;
      }
      case 'TV': {
        // Tigervex: Laser Tiger Fangs & Electric Stripes
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 6); ctx.lineTo(x - 4, y + 7);
        ctx.moveTo(x + 8, y - 6); ctx.lineTo(x + 4, y + 7);
        ctx.moveTo(x - 6, y);     ctx.lineTo(x + 6, y);
        ctx.stroke();
        break;
      }
      default: {
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id, x, y);
      }
    }

    // Small ID label beneath the glyph
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(id, x, y + 14);

    ctx.restore();
  }

  // ── Robot Mini HUD (HP & Energy) ──────────────────────────────────
  _drawRobotMiniHUD(robot, x, y, r) {
    const ctx = this.ctx;
    const barW = 52;
    const barH = 6;
    const barX = x - barW / 2;
    const barY = y + r + 8;
    const hpPct = Math.max(0, robot.currentHp / robot.maxHp);

    // HP background track with rounded pills
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    // HP fill
    const hpColor = hpPct > 0.6 ? '#00ff88' : hpPct > 0.3 ? '#ffd700' : '#ff3344';
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * hpPct, barH, 3);
    ctx.fill();

    // Numeric HP Text
    ctx.font = '900 11px "Share Tech Mono", monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.textAlign = 'center';
    ctx.strokeText(`${robot.currentHp}/${robot.maxHp} HP`, x, barY - 2);
    ctx.fillStyle = hpColor;
    ctx.fillText(`${robot.currentHp}/${robot.maxHp} HP`, x, barY - 2);
    ctx.restore();

    // Energy pips
    const maxPips = 5;
    for (let i = 0; i < maxPips; i++) {
      const px = barX + i * (barW / maxPips) + 3;
      const py = barY + barH + 5;
      const isLit = i < robot.currentEnergy;
      ctx.fillStyle = isLit ? '#ffd700' : 'rgba(255, 215, 0, 0.2)';
      if (isLit) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Action role badge floating on the robot (NO EMOJIS)
    if (robot.action) {
      const badgeColor = robot.action === 'attack' ? '#ff4455'
        : robot.action === 'defense' ? '#00e5ff'
        : robot.action === 'support' ? '#00ff88' : '#ffaa00';
      const badgeText  = robot.action === 'attack' ? '[ATK]'
        : robot.action === 'defense' ? '[DEF]'
        : robot.action === 'support' ? '[SUP]' : '[REST]';
      ctx.save();
      ctx.fillStyle = badgeColor;
      ctx.shadowColor = badgeColor;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, x + r + 2, y - r + 3);
      ctx.restore();
    }
  }

  // ── Shield Holographic Hex Arcs (Com duração de 2 rodadas) ────────
  _drawShield(robot, x, y, robotR) {
    const ctx = this.ctx;
    const shieldR = robotR + 13;
    const shieldMax = robot.shield.maxHp || (robot.id === 'DB' ? 5 : 10);
    const shieldPct = Math.min(1, Math.max(0.08, (robot.shield.hp || 1) / shieldMax));
    const roundsLeft = robot.shield.roundsLeft !== undefined ? robot.shield.roundsLeft : 2;

    ctx.save();
    ctx.shadowColor = robot.shield.color || '#00e5ff';
    ctx.shadowBlur = 18 + Math.sin(this.time * 0.1) * 6;

    // Outer shield dome ring
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * shieldPct;

    ctx.strokeStyle = robot.shield.color || '#00e5ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, shieldR, startAngle, endAngle);
    ctx.stroke();

    // Shimmering inner ripple
    ctx.globalAlpha = 0.3 + Math.sin(this.time * 0.08) * 0.2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, shieldR, startAngle, endAngle);
    ctx.stroke();

    // Duração e HP do escudo estilizados
    ctx.globalAlpha = 1.0;
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = roundsLeft === 1 ? '#ff4455' : (robot.shield.color || '#00e5ff');
    ctx.shadowColor = roundsLeft === 1 ? '#ff4455' : (robot.shield.color || '#00e5ff');
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(`[ESCUDO ${robot.shield.hp}HP · ${roundsLeft}R]`, x, y + robotR + 23);

    ctx.restore();
  }

  _drawBreakingShields() {
    const ctx = this.ctx;
    this.expandingShieldBreaks.forEach(sb => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, sb.alpha));
      ctx.shadowColor = sb.color || '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = sb.color || '#00e5ff';
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.r * 0.93, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }

  _drawHoTEffect(x, y, r) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -this.time * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Projectiles Traveling Across Board ─────────────────────────────
  _drawProjectiles() {
    const ctx = this.ctx;
    this.projectiles.forEach(pr => {
      const t = pr.progress;
      // Quadratic Bezier arc
      const curX = (1 - t) * (1 - t) * pr.fromX + 2 * (1 - t) * t * pr.midX + t * t * pr.toX;
      const curY = (1 - t) * (1 - t) * pr.fromY + 2 * (1 - t) * t * pr.midY + t * t * pr.toY;
      pr.curX = curX;
      pr.curY = curY;

      ctx.save();
      ctx.fillStyle = pr.color || '#ff3344';
      ctx.shadowColor = pr.color || '#ff3344';
      ctx.shadowBlur = 25;

      // Projectile core
      ctx.beginPath();
      ctx.arc(curX, curY, pr.size || 8, 0, Math.PI * 2);
      ctx.fill();

      // Outer plasma ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(curX, curY, (pr.size || 8) * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }

  // ── Sustained Nanite / Laser Beams ─────────────────────────────────
  _drawBeams() {
    const ctx = this.ctx;
    this.beams.forEach(b => {
      ctx.save();
      ctx.strokeStyle = b.color || '#00ff88';
      ctx.shadowColor = b.color || '#00ff88';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 4 + Math.sin(this.time * 0.3) * 2;
      ctx.globalAlpha = Math.min(1, b.life * 1.5);

      ctx.beginPath();
      ctx.moveTo(b.fromX, b.fromY);
      const midX = (b.fromX + b.toX) / 2;
      const midY = (b.fromY + b.toY) / 2 - 25;
      ctx.quadraticCurveTo(midX, midY, b.toX, b.toY);
      ctx.stroke();

      // Spiral DNA / data pulses along beam
      const pulseP = (this.time * 0.05) % 1;
      const px = (1 - pulseP) * (1 - pulseP) * b.fromX + 2 * (1 - pulseP) * pulseP * midX + pulseP * pulseP * b.toX;
      const py = (1 - pulseP) * (1 - pulseP) * b.fromY + 2 * (1 - pulseP) * pulseP * midY + pulseP * pulseP * b.toY;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  // ── Expanding Shield Domes ─────────────────────────────────────────
  _drawDomes() {
    const ctx = this.ctx;
    this.domes.forEach(d => {
      const r = d.baseR + d.progress * 25;
      ctx.save();
      ctx.strokeStyle = d.color || '#00e5ff';
      ctx.shadowColor = d.color || '#00e5ff';
      ctx.shadowBlur = 25;
      ctx.lineWidth = 3 * (1 - d.progress * 0.5);
      ctx.globalAlpha = Math.min(1, d.life * 1.8);

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Concentric inner ripples
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }

  // ── Expanding Shockwaves ──────────────────────────────────────────
  _drawShockwaves() {
    const ctx = this.ctx;
    this.shockwaves.forEach(sw => {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3.5 * sw.life;
      ctx.globalAlpha = sw.life;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ── Particles ─────────────────────────────────────────────────────
  _drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      if (p.shape === 'star') {
        const s = Math.max(1, p.size || 3);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.4, p.y - s * 0.4);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.4, p.y - s * 0.4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size || 2.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // ── Floating Bouncing Texts with Phosphor Badges ──────────────────
  _drawFloatingTexts() {
    const ctx = this.ctx;
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.font = `bold ${ft.size || 16}px 'Share Tech Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Badge background for high legibility
      const tw = ctx.measureText(ft.text).width + 16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(ft.x - tw / 2, ft.y - 12, tw, 24, 6);
      ctx.fill();

      // Text with phosphor glow
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC CADENCED ANIMATION API (~2.5s per action)
  // ═══════════════════════════════════════════════════════════════════

  // Move um robô suavemente de sua posição para (toCol, toRow) em durationMs
  async animateRobotMove(robot, toCol, toRow, durationMs = 350) {
    if (!robot) return;
    const startCol = robot.col !== undefined ? robot.col : (robot.side === 'PLAYER' ? 0 : 4);
    const startRow = robot.row !== undefined ? robot.row : 2;
    const fromCenter = this._cellCenter(startCol, startRow);
    const toCenter = this._cellCenter(toCol, toRow);

    const startTime = performance.now();
    robot.animating = true;

    return new Promise(resolve => {
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        robot.customDrawX = fromCenter.x + (toCenter.x - fromCenter.x) * ease;
        robot.customDrawY = fromCenter.y + (toCenter.y - fromCenter.y) * ease - Math.sin(progress * Math.PI) * 14;

        if (Math.random() < 0.35) {
          this.emitParticles(robot.customDrawX, robot.customDrawY + 16, robot.color || '#00ff88', 2, { speed: 1.5 });
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          robot.col = toCol;
          robot.row = toRow;
          robot.customDrawX = null;
          robot.customDrawY = null;
          robot.animating = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // ── Full Attack Sequence (~2.2s total) ────────────────────────────
  async animateAttackSequence(attacker, target, attackMove, onImpactCallback = null) {
    const from = this._cellCenter(attacker.col, attacker.row);
    const to = this._cellCenter(target.col, target.row);

    // 1. Attacker charge-up (0.3s)
    this.emitParticles(from.x, from.y, attacker.color, 20, { speed: 4 });
    this.shake(5);
    await this._wait(300);

    // 2. Projectile travels in curved arc across the board (0.6s)
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 45;

    await new Promise(resolve => {
      this.projectiles.push({
        fromX: from.x,
        fromY: from.y,
        curX: from.x,
        curY: from.y,
        midX,
        midY,
        toX: to.x,
        toY: to.y,
        progress: 0,
        speed: 0.04,
        color: attacker.color,
        size: 9,
        resolve,
      });
    });

    // 3. REGRA DO USUÁRIO: MOMENTO DE CONTATO DO ATAQUE NO ALVO!
    // Esperar o ataque ter contato para DAÍ mover a barra ou mostrar o que aconteceu!
    if (typeof onImpactCallback === 'function') {
      await onImpactCallback();
    }

    // 4. Impact Explosion on Target!
    this.shake(14);
    this.shockwaves.push({
      x: to.x, y: to.y, r: 10, maxR: 65, speed: 4.5, life: 1, color: attacker.color
    });
    this.emitParticles(to.x, to.y, attacker.color, 35, { speed: 6, gravity: 0.15 });
    this.emitParticles(to.x, to.y, '#ffffff', 20, { speed: 8, shape: 'star' });
    await this._wait(350);
  }

  // ── Full Miss Sequence ──────────────────────────────────────────
  async animateMissSequence(attacker, targetLane) {
    const from = this._cellCenter(attacker.col, attacker.row);
    const targetCol = attacker.side === 'PLAYER' ? 4 : 0;
    const to = this._cellCenter(targetCol, targetLane);

    await new Promise(resolve => {
      this.projectiles.push({
        fromX: from.x,
        fromY: from.y,
        curX: from.x,
        curY: from.y,
        midX: (from.x + to.x) / 2,
        midY: from.y - 30,
        toX: to.x,
        toY: to.y,
        progress: 0,
        speed: 0.045,
        color: attacker.color || '#ff3344',
        size: 7,
        resolve,
      });
    });

    this.emitFloatingText('ERROU O ALVO (LINHA VAZIA)', to.x, to.y, '#888888', 14);
    await this._wait(300);
  }

  // ── Full Defense Sequence (~2.0s total) ───────────────────────────
  async animateDefenseSequence(defender, shieldType = 'holográfico', color = null) {
    const shieldColor = color || defender.color || '#00ff88';
    const from = this._cellCenter(defender.col, defender.row);

    // 1. Concentric charging ripples (0.3s)
    this.shockwaves.push({
      x: from.x, y: from.y, r: 5, maxR: 45, speed: 3, life: 1, color: shieldColor
    });
    this.emitParticles(from.x, from.y, shieldColor, 20, { speed: 3.5 });
    await this._wait(300);

    // 2. Dome expansion (0.6s)
    this.domes.push({
      x: from.x, y: from.y, baseR: 28, progress: 0, life: 1, color: shieldColor
    });
    this.emitFloatingText('+ESCUDO [3 HP · 2R]', from.x, from.y - 45, shieldColor, 16);
    this.shake(6);
    await this._wait(600);
  }

  // ── Full Revive Sequence ──────────────────────────────────────────
  async animateRevive(target) {
    const to = this._cellCenter(target.col, target.row);
    this.shockwaves.push({
      x: to.x, y: to.y, r: 10, maxR: 60, speed: 4, life: 1, color: '#00e5ff'
    });
    this.emitParticles(to.x, to.y, '#00e5ff', 35, { speed: 5 });
    this.emitFloatingText('REVIVIDO COM 10 HP!', to.x, to.y - 40, '#00e5ff', 18);
    this.shake(8);
    await this._wait(500);
  }

  // ── Full Support Sequence (~2.0s total) ───────────────────────────
  async animateSupportSequence(supporter, target, healAmount, energyAmount, isRevive = false) {
    const from = this._cellCenter(supporter.col, supporter.row);
    const to = this._cellCenter(target.col, target.row);

    // 1. Channeling glow (0.4s)
    this.emitParticles(from.x, from.y, '#00ff88', 20, { speed: 3 });
    await this._wait(400);

    // 2. Nanite beam connecting supporter to ally (0.8s)
    await new Promise(resolve => {
      this.beams.push({
        fromX: from.x, fromY: from.y,
        toX: to.x, toY: to.y,
        color: isRevive ? '#00e5ff' : '#00ff88',
        life: 1,
        resolve,
      });
      setTimeout(resolve, 800);
    });

    // 3. Target bursts with heal rings
    this.shockwaves.push({
      x: to.x, y: to.y, r: 8, maxR: 45, speed: 3, life: 1, color: '#00ff88'
    });
    this.emitParticles(to.x, to.y, '#00ff88', 25, { speed: 4 });
    if (healAmount) {
      this.emitFloatingText(`+${healAmount} HP`, to.x, to.y - 35, '#00ff88', 18);
    }
    if (energyAmount) {
      this.emitFloatingText(`+${energyAmount} ENERGIA`, to.x, to.y - 55, '#ffd700', 15);
    }
    if (isRevive) {
      this.emitFloatingText('REVIVIDO!', to.x, to.y - 70, '#00e5ff', 20);
    }
    await this._wait(500);
  }

  // ── Fast action feedback helpers ──────────────────────────────────
  emitParticles(x, y, color, count = 15, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (opts.speed || 4) + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: opts.gravity || 0,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        color,
        size: Math.random() * 3.5 + 1.5,
        shape: opts.shape || 'circle',
      });
    }
  }

  emitFloatingText(text, x, y, color = '#ffd700', size = 16) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.4, // upward drift
      color,
      size,
      life: 1,
    });
  }

  shake(intensity = 10) {
    this.shakeTimer = 12;
    this.shakeIntensity = intensity;
  }

  async animateStep(robot, direction = 1) {
    const stepCols = direction;
    return new Promise(resolve => {
      robot.animState = 'stepping';
      robot.animProgress = 0;
      const baseCol = robot.col;
      const stepInterval = setInterval(() => {
        robot.animProgress += 0.07;
        if (robot.animProgress >= 1) {
          robot.animProgress = 1;
          robot.col = baseCol + stepCols;
          clearInterval(stepInterval);

          setTimeout(() => {
            robot.col = baseCol;
            robot.animState = 'returning';
            robot.animProgress = 0;
            const retInterval = setInterval(() => {
              robot.animProgress += 0.08;
              if (robot.animProgress >= 1) {
                robot.animProgress = 1;
                robot.animState = 'idle';
                clearInterval(retInterval);
                resolve();
              }
            }, 16);
          }, 250);
        }
      }, 16);
    });
  }

  async animateHit(robot, damage, color = '#ff3344') {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, color, 25, { speed: 5, gravity: 0.1 });
    this.emitFloatingText(`-${damage} HP`, pos.x, pos.y - 35, color, 20);
    this.shake(12);
    await this._wait(350);
  }

  async animateHeal(robot, amount) {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, '#00ff88', 18, { speed: 2.5 });
    this.emitFloatingText(`+${amount} HP`, pos.x, pos.y - 35, '#00ff88', 18);
    await this._wait(350);
  }

  async animateKill(robot) {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, robot.color, 45, { speed: 7, gravity: 0.2 });
    this.emitParticles(pos.x, pos.y, '#ffffff', 25, { speed: 9, shape: 'star' });
    this.shockwaves.push({ x: pos.x, y: pos.y, r: 10, maxR: 80, speed: 5, life: 1, color: '#ff3344' });
    this.emitFloatingText('[ALVO DESTRUIDO!]', pos.x, pos.y - 45, '#ff3344', 20);
    this.shake(18);
    await this._wait(700);
  }

  async animateMedal(robot, count) {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, '#ffd700', 30, { speed: 5, shape: 'star' });
    this.emitFloatingText(`+1 MEDALHA! [${count}/10]`, pos.x, pos.y - 55, '#ffd700', 18);
    await this._wait(600);
  }

  async animateShieldActivate(robot) {
    const pos = this._cellCenter(robot.col, robot.row);
    const color = robot.shield ? robot.shield.color : '#00e5ff';
    this.emitParticles(pos.x, pos.y, color, 22, { speed: 3.5 });
    this.emitFloatingText('ESCUDO ATIVADO [3R]!', pos.x, pos.y - 35, color, 16);
    await this._wait(400);
  }

  async animateShieldBreak(targetOrX, optY) {
    let x, y, color = '#00e5ff';
    if (typeof targetOrX === 'object' && targetOrX !== null) {
      const pos = this._cellCenter(targetOrX.col, targetOrX.row);
      x = pos.x;
      y = pos.y;
      if (targetOrX.shield && targetOrX.shield.color) color = targetOrX.shield.color;
    } else {
      x = targetOrX;
      y = optY;
    }

    // REGRA DO USUÁRIO: Baixo som de vidro quebrando!
    const audio = (window.gameInstance && window.gameInstance.audio) || window._versusAudio;
    if (audio && typeof audio.playGlassBreak === 'function') {
      audio.playGlassBreak();
    }

    // REGRA DO USUÁRIO: O escudo expande e dá um fade out quando quebrar
    this.expandingShieldBreaks.push({
      x, y,
      r: 28,
      maxR: 75,
      alpha: 1.0,
      expandSpeed: 3.4,
      fadeSpeed: 0.038,
      color,
    });

    this.emitParticles(x, y, color, 35, { speed: 6.5, gravity: 0.12 });
    this.emitParticles(x, y, '#ffffff', 25, { speed: 7.5 });
    this.shockwaves.push({ x, y, r: 10, maxR: 70, speed: 4.5, life: 1, color });
    this.emitFloatingText('[ ESCUDO QUEBRADO! ]', x, y - 42, '#ff3344', 18);
    this.shake(14);
    await this._wait(650);
  }

  async animateRevive(robot) {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, '#00ff88', 35, { speed: 5 });
    this.emitParticles(pos.x, pos.y, '#00e5ff', 25, { speed: 7, shape: 'star' });
    this.emitFloatingText('REVIVIDO [10 HP]!', pos.x, pos.y - 45, '#00ff88', 19);
    await this._wait(700);
  }

  async animateKillBonus(robot) {
    const pos = this._cellCenter(robot.col, robot.row);
    this.emitParticles(pos.x, pos.y, '#ffd700', 20, { speed: 3.5 });
    this.emitFloatingText('+2 HP  +1 ENERGIA', pos.x, pos.y - 65, '#ffd700', 15);
    await this._wait(500);
  }

  _wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  _lighten(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const l = (c) => Math.min(255, Math.floor(c + (255 - c) * amount));
    return `rgb(${l(r)}, ${l(g)}, ${l(b)})`;
  }

  _drawFogOfWarMysteryRobot(x, y) {
    const ctx = this.ctx;
    const t = this.time;

    const baseRadius = 22;
    const pulse = Math.sin(t * 0.08) * 3;
    const r = baseRadius + pulse;

    ctx.save();
    // Glowing mystery aura
    ctx.shadowColor = 'rgba(255, 68, 85, 0.4)';
    ctx.shadowBlur = 15;

    // Pulsing glitch circle
    ctx.fillStyle = 'rgba(20, 10, 15, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotating dashed mystery ring
    ctx.strokeStyle = 'rgba(255, 68, 85, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -t * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // [ ? ] Question mark glitched glyph
    ctx.fillStyle = '#ff6677';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ ? ]', x, y - 2);

    // Mystery tag below
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(255, 100, 120, 0.7)';
    ctx.fillText('CRIPTOGRAFADO', x, y + r + 10);

    ctx.restore();
  }

  async animateMissSequence(attacker, lane) {
    const start = this._cellCenter(attacker.col, lane);
    const endX = attacker.side === 'PLAYER' ? this.W - 30 : 30;
    const end = { x: endX, y: start.y };

    return new Promise((resolve) => {
      let step = 0;
      const totalSteps = 18;
      const projectile = { x: start.x, y: start.y };

      const interval = setInterval(() => {
        step++;
        const p = step / totalSteps;
        projectile.x = start.x + (end.x - start.x) * p;
        projectile.y = start.y + Math.sin(p * Math.PI) * -8;

        this.particles.push({
          x: projectile.x,
          y: projectile.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          life: 0.7,
          decay: 0.06,
          color: attacker.color || '#ff4455',
          size: 2,
        });

        if (step >= totalSteps) {
          clearInterval(interval);
          this.emitFloatingText('ERROU! LINHA VAZIA', end.x, end.y - 20, '#ff9955', 16);
          this.emitParticles(end.x, end.y, '#ff9955', 12, { speed: 3 });
          resolve();
        }
      }, 30);
    });
  }

  _darken(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const d = (c) => Math.max(0, Math.floor(c * (1 - amount)));
    return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
  }
}
