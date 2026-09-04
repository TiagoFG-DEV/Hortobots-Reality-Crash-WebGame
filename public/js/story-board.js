// ═══════════════════════════════════════════════════════════════════
// story-board.js — Tabuleiro Canvas 2D Tático do Modo História (Invasão)
// Estética: Retro Terminal CRT, avatares gráficos, grade tática viva,
// seleção de alvo com destaque no tabuleiro, linha tracejada colorida e animações de investida.
// ═══════════════════════════════════════════════════════════════════

export class StoryBoard {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;

    this.cols = 5;
    this.rows = 4;

    this.W = canvas.width || 920;
    this.H = canvas.height || 420;

    // Entidades
    this.allies = [];
    this.enemies = [];
    this.actingAllyIndex = 0;

    // VFX & Partículas
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.projectiles = [];
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.time = 0;

    // Seleção de Alvo Interativa
    this.targetSelectionMode = null;
    this.hoveredEnemy = null;
    this.activeTargetLine = null; // { fromX, fromY, toX, toY, color, progress }

    // Mapeamento de Cores dos Robôs Aliados
    this.robotColors = {
      'dinobyte': '#00ff88',
      'cowputer': '#ffd700',
      'penlinux': '#00e5ff',
      'tigervex': '#ff4455',
      'pavabyte': '#ffaa00',
      'default': '#00ff88'
    };

    this.resize();
    this._bindEvents();
    this.startLoop();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : (this.canvas.clientWidth || 920);
    const h = parent ? parent.clientHeight : (this.canvas.clientHeight || 420);

    if (w > 0 && h > 0 && (this.W !== w || this.H !== h)) {
      this.W = w;
      this.H = h;
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  setBattlers(allies = [], enemies = [], actingIndex = 0) {
    this.allies = allies;
    this.enemies = enemies;
    this.actingAllyIndex = actingIndex;

    // Calcula coordenadas para os aliados (Coluna 0, esquerda)
    const allyCount = this.allies.length;
    this.allies.forEach((bot, i) => {
      bot.col = 0;
      bot.side = 'PLAYER';
      bot.homeX = this.W * 0.12;
      bot.homeY = this.H * ((i + 1) / (allyCount + 1));
      if (bot.currentX === undefined) bot.currentX = bot.homeX;
      if (bot.currentY === undefined) bot.currentY = bot.homeY;
      if (bot.displayHp === undefined) bot.displayHp = bot.currentHp;
      if (bot.ghostHp === undefined) bot.ghostHp = bot.currentHp;
      bot.color = this.robotColors[bot.id] || this.robotColors.default;
    });

    // Calcula coordenadas para os inimigos (Coluna 4, direita)
    const enemyCount = this.enemies.length;
    this.enemies.forEach((enemy, i) => {
      enemy.col = 4;
      enemy.side = 'ENEMY';
      enemy.homeX = this.W * 0.88;
      enemy.homeY = this.H * ((i + 1) / (enemyCount + 1));
      if (enemy.currentX === undefined) enemy.currentX = enemy.homeX;
      if (enemy.currentY === undefined) enemy.currentY = enemy.homeY;
      if (enemy.displayHp === undefined) enemy.displayHp = enemy.currentHp;
      if (enemy.ghostHp === undefined) enemy.ghostHp = enemy.currentHp;
      enemy.color = enemy.isBoss ? '#ffd700' : '#ff3344';
    });
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.targetSelectionMode) {
        this.canvas.style.cursor = 'default';
        this.hoveredEnemy = null;
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const sx = this.W / rect.width;
      const sy = this.H / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      const candidates = this.enemies.filter(e => e && e.currentHp > 0);
      let found = null;

      for (const cand of candidates) {
        const cx = cand.currentX || cand.homeX;
        const cy = cand.currentY || cand.homeY;
        const dist = Math.hypot(mx - cx, my - cy);

        // Raio generoso de clique no inimigo
        if (dist <= 65) {
          found = cand;
          break;
        }
      }

      this.hoveredEnemy = found;
      this.canvas.style.cursor = found ? 'pointer' : 'crosshair';
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.targetSelectionMode) return;

      const rect = this.canvas.getBoundingClientRect();
      const sx = this.W / rect.width;
      const sy = this.H / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      const candidates = this.enemies.filter(en => en && en.currentHp > 0);

      for (const cand of candidates) {
        const cx = cand.currentX || cand.homeX;
        const cy = cand.currentY || cand.homeY;
        const dist = Math.hypot(mx - cx, my - cy);

        if (dist <= 65) {
          const onSelect = this.targetSelectionMode.onSelect;
          this.targetSelectionMode = null;
          this.hoveredEnemy = null;
          this.canvas.style.cursor = 'default';

          const overlay = document.getElementById('storyTargetOverlay');
          if (overlay) overlay.classList.add('hidden');

          if (typeof onSelect === 'function') {
            onSelect(cand);
          }
          break;
        }
      }
    });
  }

  // ─── Ativação da Mira Interativa (Escurece a tela e destaca alvos) ───
  startTargetSelection(attacker, onSelect) {
    this.targetSelectionMode = { attacker, onSelect };
    this.hoveredEnemy = null;

    const overlay = document.getElementById('storyTargetOverlay');
    if (overlay) overlay.classList.remove('hidden');

    const titleEl = document.getElementById('storyTargetTitle');
    if (titleEl) {
      titleEl.textContent = `[ MIRA: ${attacker.name.toUpperCase()} ]`;
    }
  }

  cancelTargetSelection() {
    this.targetSelectionMode = null;
    this.hoveredEnemy = null;
    this.canvas.style.cursor = 'default';
    const overlay = document.getElementById('storyTargetOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ─── Linha Tracejada Suave da Cor do Robô ─────────────────────────
  async animateTargetLockLine(attacker, target, durationMs = 420) {
    const fromX = attacker.currentX || attacker.homeX;
    const fromY = attacker.currentY || attacker.homeY;
    const toX = target.currentX || target.homeX;
    const toY = target.currentY || target.homeY;
    const color = attacker.color || '#00ff88';

    return new Promise(resolve => {
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);

        this.activeTargetLine = {
          fromX,
          fromY,
          toX,
          toY,
          color,
          progress
        };

        // Faíscas no bico que avança
        if (progress < 1.0 && Math.random() < 0.6) {
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2 - 25;
          const u = progress;
          const px = (1 - u) * (1 - u) * fromX + 2 * (1 - u) * u * midX + u * u * toX;
          const py = (1 - u) * (1 - u) * fromY + 2 * (1 - u) * u * midY + u * u * toY;
          this.emitParticles(px, py, color, 2, { speed: 2 });
        }

        if (progress < 1.0) {
          requestAnimationFrame(step);
        } else {
          // Mantém a linha travada por 300ms antes de limpar
          setTimeout(() => {
            this.activeTargetLine = null;
            resolve();
          }, 300);
        }
      };
      requestAnimationFrame(step);
    });
  }

  // ─── Animação de Investida / Dash, Ataque, Impacto e Drenagem Suave ───────────────
  async animateAttackSequence(attacker, target, damage = 10, isPlayer = true, options = {}) {
    const startX = attacker.homeX;
    const startY = attacker.homeY;
    const targetX = target.homeX;
    const targetY = target.homeY;
    const color = attacker.color || (isPlayer ? '#00ff88' : '#ff3344');

    // 1. Dash para frente (~0.22s)
    const forwardX = isPlayer ? startX + (this.W * 0.28) : startX - (this.W * 0.28);
    await this._tweenRobotPos(attacker, startX, startY, forwardX, startY, 220);

    // 2. Disparo de Projétil / Feixe em direção ao alvo (~0.32s)
    await new Promise(res => {
      this.projectiles.push({
        fromX: forwardX,
        fromY: startY,
        curX: forwardX,
        curY: startY,
        toX: targetX,
        toY: targetY,
        progress: 0,
        speed: 0.075,
        color,
        size: 11,
        resolve: res
      });
    });

    // 3. Impacto Explosivo, Shockwave e Tremor no Alvo
    this.shake(14);
    this.shockwaves.push({
      x: targetX,
      y: targetY,
      r: 12,
      maxR: 75,
      speed: 5.2,
      life: 1,
      color
    });
    this.emitParticles(targetX, targetY, color, 30, { speed: 6, gravity: 0.1 });
    this.emitParticles(targetX, targetY, '#ffffff', 18, { speed: 8 });

    // Cinemática de Escudo Quebrando ou Defletindo
    if (options.shieldBroken) {
      this.triggerShieldBreak(target);
    } else if (damage === 0 && options.deflected) {
      this.triggerShieldDeflect(target);
    }

    // Texto Flutuante de Dano ou Esquiva
    if (damage > 0) {
      this.floatingTexts.push({
        x: targetX,
        y: targetY - 24,
        text: `-${damage} HP`,
        color: '#ff3344',
        size: 26,
        vy: -1.6,
        life: 1,
        decay: 0.018
      });
    } else {
      this.floatingTexts.push({
        x: targetX,
        y: targetY - 24,
        text: `[ ESQUIVA! 0 DANO ]`,
        color: '#ffd700',
        size: 22,
        vy: -1.4,
        life: 1,
        decay: 0.018
      });
    }

    // Tempo de impacto e início visível da drenagem de HP
    await this._wait(400);

    // 4. Retorno suave para a base (~0.24s)
    await this._tweenRobotPos(attacker, forwardX, startY, startX, startY, 240);

    // 5. DELAY PÓS-ATAQUE DELIBERADO: Permite contemplar o resultado, a drenagem de HP e as mensagens
    await this._wait(options.postDelay || 1100);
  }

  triggerShieldBreak(target) {
    const x = target.homeX;
    const y = target.homeY;
    this.shake(18);
    this.shockwaves.push({
      x,
      y,
      r: 10,
      maxR: 90,
      speed: 5.8,
      life: 1,
      color: '#00e5ff'
    });
    this.emitParticles(x, y, '#00e5ff', 36, { speed: 7, gravity: 0.12 });
    this.emitParticles(x, y, '#ffffff', 22, { speed: 8.5 });
    this.floatingTexts.push({
      x,
      y: y - 50,
      text: '[ ESCUDO QUEBRADO! ]',
      color: '#ff3344',
      size: 22,
      vy: -1.5,
      life: 1,
      decay: 0.015
    });
  }

  triggerShieldDeflect(target) {
    const x = target.homeX;
    const y = target.homeY;
    this.shake(8);
    this.shockwaves.push({
      x,
      y,
      r: 25,
      maxR: 70,
      speed: 4.5,
      life: 1,
      color: '#ffd700'
    });
    this.emitParticles(x, y, '#ffd700', 30, { speed: 5.5 });
    this.emitParticles(x, y, '#ffffff', 15, { speed: 6.5 });
    this.floatingTexts.push({
      x,
      y: y - 50,
      text: '[ ESQUIVA TOTAL! ]',
      color: '#ffd700',
      size: 22,
      vy: -1.5,
      life: 1,
      decay: 0.015
    });
  }

  _tweenRobotPos(bot, x1, y1, x2, y2, durationMs) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(1.0, elapsed / durationMs);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

        bot.currentX = x1 + (x2 - x1) * ease;
        bot.currentY = y1 + (y2 - y1) * ease;

        if (p < 1.0) {
          requestAnimationFrame(step);
        } else {
          bot.currentX = x2;
          bot.currentY = y2;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  shake(intensity = 10) {
    this.shakeTimer = 12;
    this.shakeIntensity = intensity;
  }

  emitParticles(x, y, color = '#00ff88', count = 15, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * (opts.speed || 4) + 1.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 3 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        gravity: opts.gravity || 0
      });
    }
  }

  _wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  startLoop() {
    const loop = () => {
      this.time++;
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  update() {
    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
    }

    // Interpolação suave de HP e Barra Fantasma de Dano para todos os combatentes
    const updateBattlerHp = (b) => {
      if (b.displayHp === undefined) b.displayHp = b.currentHp;
      if (b.ghostHp === undefined) b.ghostHp = b.currentHp;

      b.displayHp += (b.currentHp - b.displayHp) * 0.12;
      if (Math.abs(b.displayHp - b.currentHp) < 0.25) b.displayHp = b.currentHp;

      b.ghostHp += (b.currentHp - b.ghostHp) * 0.045;
      if (Math.abs(b.ghostHp - b.currentHp) < 0.25) b.ghostHp = b.currentHp;
    };
    this.allies.forEach(updateBattlerHp);
    this.enemies.forEach(updateBattlerHp);

    // Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.r += s.speed;
      s.life = 1 - (s.r / s.maxR);
      if (s.r >= s.maxR || s.life <= 0) this.shockwaves.splice(i, 1);
    }

    // Textos Flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.y += f.vy;
      f.life -= f.decay;
      if (f.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.progress += pr.speed;
      const u = pr.progress;
      const midX = (pr.fromX + pr.toX) / 2;
      const midY = Math.min(pr.fromY, pr.toY) - 35;

      pr.curX = (1 - u) * (1 - u) * pr.fromX + 2 * (1 - u) * u * midX + u * u * pr.toX;
      pr.curY = (1 - u) * (1 - u) * pr.fromY + 2 * (1 - u) * u * midY + u * u * pr.toY;

      // Faíscas na cauda
      if (Math.random() < 0.4) {
        this.emitParticles(pr.curX, pr.curY, pr.color, 1, { speed: 1.5 });
      }

      if (pr.progress >= 1.0) {
        if (typeof pr.resolve === 'function') pr.resolve();
        this.projectiles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake offset
    if (this.shakeTimer > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(ox, oy);
    }

    ctx.clearRect(0, 0, this.W, this.H);

    // 1. Fundo CRT & Grade Tática viva
    this._drawTacticalGrid();

    // 2. Escurecimento seletivo se estiver no modo de mira
    if (this.targetSelectionMode) {
      ctx.fillStyle = 'rgba(1, 6, 3, 0.75)';
      ctx.fillRect(0, 0, this.W, this.H);
    }

    // 3. Linha Tracejada de Mira Ativa (partindo do player até o alvo)
    this._drawActiveTargetLine();

    // 4. Desenha Aliados (Esquerda)
    this._drawAllies();

    // 5. Desenha Inimigos (Direita)
    this._drawEnemies();

    // 6. Efeitos Visuais (Projéteis, Shockwaves, Partículas, Textos)
    this._drawVFX();

    ctx.restore();
  }

  _drawTacticalGrid() {
    const ctx = this.ctx;
    const t = this.time;

    // Gradiente sutil de fundo
    const bgGrad = ctx.createLinearGradient(0, 0, this.W, this.H);
    bgGrad.addColorStop(0, 'rgba(3, 16, 9, 0.95)');
    bgGrad.addColorStop(0.5, 'rgba(1, 7, 4, 0.98)');
    bgGrad.addColorStop(1, 'rgba(3, 16, 9, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.W, this.H);

    // Linhas verticais ondulantes
    const colDividers = [this.W * 0.22, this.W * 0.41, this.W * 0.59, this.W * 0.78];
    colDividers.forEach((baseX, c) => {
      const pulse = Math.sin(t * 0.03 + c) * 0.12 + 0.16;
      ctx.strokeStyle = `rgba(0, 255, 136, ${pulse * 0.65})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let y = 0; y <= this.H; y += 8) {
        const offset = Math.sin(y * 0.03 + t * 0.04 + c * 1.5) * 3;
        if (y === 0) ctx.moveTo(baseX + offset, y);
        else ctx.lineTo(baseX + offset, y);
      }
      ctx.stroke();
    });

    // Linhas horizontais
    const rowDividers = [this.H * 0.33, this.H * 0.66];
    rowDividers.forEach((baseY, r) => {
      const pulse = Math.cos(t * 0.03 + r) * 0.12 + 0.16;
      ctx.strokeStyle = `rgba(0, 255, 136, ${pulse * 0.65})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= this.W; x += 8) {
        const offset = Math.sin(x * 0.03 + t * 0.04 + r * 1.5) * 3;
        if (x === 0) ctx.moveTo(x, baseY + offset);
        else ctx.lineTo(x, baseY + offset);
      }
      ctx.stroke();
    });

    // Nódulos de interseção
    colDividers.forEach((cx, c) => {
      rowDividers.forEach((cy, r) => {
        const nodePulse = Math.sin(t * 0.08 + c * 2 + r * 3) * 1.2 + 2.2;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, nodePulse, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Faixas decorativas de cabeçalho da arena
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(10, 24);
    ctx.lineTo(this.W - 10, 24);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawActiveTargetLine() {
    if (!this.activeTargetLine) return;
    const ctx = this.ctx;
    const { fromX, fromY, toX, toY, color, progress } = this.activeTargetLine;

    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 30;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -this.time * 0.8;

    // Desenha até a fração de progresso
    ctx.beginPath();
    const steps = 30;
    const maxSteps = Math.floor(steps * progress);
    for (let i = 0; i <= maxSteps; i++) {
      const u = i / steps;
      const px = (1 - u) * (1 - u) * fromX + 2 * (1 - u) * u * midX + u * u * toX;
      const py = (1 - u) * (1 - u) * fromY + 2 * (1 - u) * u * midY + u * u * toY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawAllies() {
    const ctx = this.ctx;
    const t = this.time;

    this.allies.forEach((bot, idx) => {
      const isDead = bot.currentHp <= 0;
      const isActing = idx === this.actingAllyIndex && !isDead;
      const x = bot.currentX || bot.homeX;
      const y = bot.currentY || bot.homeY;
      const color = bot.color || '#00ff88';

      ctx.save();
      ctx.translate(x, y);

      if (isDead) {
        ctx.globalAlpha = 0.35;
      }

      // Se for a vez do robô, anel orbital pulsante
      if (isActing) {
        const pulseR = 36 + Math.sin(t * 0.08) * 4;
        ctx.strokeStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Tag [ EM AÇÃO ]
        ctx.font = '900 10px "Share Tech Mono", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('[ SUA VEZ ]', 0, -42);
      }

      // Base circular do robô com gradiente
      const radGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 30);
      radGrad.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
      radGrad.addColorStop(1, 'rgba(0, 20, 10, 0.85)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      // Borda do robô
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

      // Avatar / Símbolo do robô
      ctx.font = '900 13px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const shortCode = (bot.avatar || bot.name.substring(0, 4)).toUpperCase();
      ctx.fillText(shortCode, 0, 0);

      // Nome do robô abaixo
      ctx.font = '700 11px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(bot.name, 0, 34);

      // Barra de HP Suave com Barra Fantasma de Dano
      const maxHp = bot.maxHp || 100;
      const curHpPct = Math.max(0, Math.min(1.0, (bot.displayHp !== undefined ? bot.displayHp : bot.currentHp) / maxHp));
      const ghostHpPct = Math.max(0, Math.min(1.0, (bot.ghostHp !== undefined ? bot.ghostHp : bot.currentHp) / maxHp));
      const barW = 64;
      const barH = 6;

      // Fundo do trilho
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(-barW / 2, 48, barW, barH);

      // Barra Fantasma (Dano recente em vermelho/laranja antes de ser absorvido)
      if (ghostHpPct > curHpPct) {
        ctx.fillStyle = '#ff3344';
        ctx.fillRect(-barW / 2, 48, barW * ghostHpPct, barH);
      }

      // Barra de HP Atual suave
      const hpColor = curHpPct > 0.5 ? '#00ff88' : curHpPct > 0.25 ? '#ffd700' : '#ff3344';
      ctx.fillStyle = hpColor;
      ctx.fillRect(-barW / 2, 48, barW * curHpPct, barH);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, 48, barW, barH);

      // Texto de HP numérico
      ctx.font = '900 13px "Share Tech Mono", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const showVal = Math.round(bot.displayHp !== undefined ? bot.displayHp : bot.currentHp);
      ctx.strokeText(`${showVal}/${maxHp} HP`, 0, 62);
      ctx.fillStyle = hpColor;
      ctx.fillText(`${showVal}/${maxHp} HP`, 0, 62);

      ctx.restore();
    });
  }

  _drawEnemies() {
    const ctx = this.ctx;
    const t = this.time;

    this.enemies.forEach((enemy) => {
      const isDead = enemy.currentHp <= 0;
      const x = enemy.currentX || enemy.homeX;
      const y = enemy.currentY || enemy.homeY;
      const isHovered = this.hoveredEnemy === enemy;
      const isSelectable = this.targetSelectionMode && !isDead;

      ctx.save();
      ctx.translate(x, y);

      if (isDead) {
        ctx.globalAlpha = 0.25;
      }

      // Se estiver no modo de mira e vivo: EVIDÊNCIA MÁXIMA!
      if (isSelectable) {
        // Brilho pulsante em evidência por cima do escuro
        const pulseR = 38 + Math.sin(t * 0.12) * 6;
        ctx.strokeStyle = isHovered ? '#00ff88' : '#ff3344';
        ctx.shadowColor = isHovered ? '#00ff88' : '#ff3344';
        ctx.shadowBlur = isHovered ? 25 : 16;
        ctx.lineWidth = isHovered ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Mira holográfica se estiver sob o cursor
        if (isHovered) {
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, pulseR + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = '900 11px "Share Tech Mono", monospace';
          ctx.fillStyle = '#00ff88';
          ctx.textAlign = 'center';
          ctx.fillText('[ CLIQUE PARA ATACAR ]', 0, -48);
        } else {
          ctx.font = '700 10px "Share Tech Mono", monospace';
          ctx.fillStyle = '#ffd700';
          ctx.textAlign = 'center';
          ctx.fillText('[ ALVO DISPONÍVEL ]', 0, -44);
        }
      }

      // Base circular do inimigo
      const enemyGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 32);
      enemyGrad.addColorStop(0, enemy.isBoss ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 51, 68, 0.35)');
      enemyGrad.addColorStop(1, 'rgba(25, 4, 6, 0.9)');
      ctx.fillStyle = enemyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      // Borda do inimigo
      const mainBorderColor = enemy.isBoss ? '#ffd700' : (isHovered ? '#00ff88' : '#ff3344');
      ctx.strokeStyle = mainBorderColor;
      ctx.shadowColor = mainBorderColor;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Símbolo do inimigo
      ctx.font = '900 13px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const enemyCode = (enemy.avatar || enemy.name.substring(0, 4)).toUpperCase();
      ctx.fillText(enemyCode, 0, 0);

      // Nome do inimigo
      ctx.font = '700 11px "Share Tech Mono", monospace';
      ctx.fillStyle = enemy.isBoss ? '#ffd700' : '#ff8899';
      ctx.textBaseline = 'top';
      ctx.fillText(enemy.name, 0, 36);

      // Barra de HP Suave com Barra Fantasma de Dano
      const enemyMaxHp = enemy.maxHp || 100;
      const curEnemyHpPct = Math.max(0, Math.min(1.0, (enemy.displayHp !== undefined ? enemy.displayHp : enemy.currentHp) / enemyMaxHp));
      const ghostEnemyHpPct = Math.max(0, Math.min(1.0, (enemy.ghostHp !== undefined ? enemy.ghostHp : enemy.currentHp) / enemyMaxHp));
      const eBarW = 66;
      const eBarH = 6;

      // Fundo do trilho
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(-eBarW / 2, 50, eBarW, eBarH);

      // Barra Fantasma (Dano recente)
      if (ghostEnemyHpPct > curEnemyHpPct) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-eBarW / 2, 50, eBarW * ghostEnemyHpPct, eBarH);
      }

      // Barra de HP Atual suave
      const enemyHpColor = curEnemyHpPct > 0.5 ? '#ff4444' : curEnemyHpPct > 0.25 ? '#ffd700' : '#ff2222';
      ctx.fillStyle = enemyHpColor;
      ctx.fillRect(-eBarW / 2, 50, eBarW * curEnemyHpPct, eBarH);

      ctx.strokeStyle = 'rgba(255, 51, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-eBarW / 2, 50, eBarW, eBarH);

      ctx.font = '900 13px "Share Tech Mono", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const showEnemyVal = Math.round(enemy.displayHp !== undefined ? enemy.displayHp : enemy.currentHp);
      ctx.strokeText(`${showEnemyVal}/${enemyMaxHp} HP`, 0, 64);
      ctx.fillStyle = enemyHpColor;
      ctx.fillText(`${showEnemyVal}/${enemyMaxHp} HP`, 0, 64);

      ctx.restore();
    });
  }

  _drawVFX() {
    const ctx = this.ctx;

    // 1. Shockwaves
    this.shockwaves.forEach(s => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3.5 * s.life;
      ctx.globalAlpha = s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 2. Projéteis
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(p.curX, p.curY, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.curX, p.curY, p.size * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Partículas
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Textos Flutuantes
    this.floatingTexts.forEach(f => {
      ctx.save();
      ctx.font = `900 ${f.size}px "Share Tech Mono", monospace`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = f.life;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }
}
