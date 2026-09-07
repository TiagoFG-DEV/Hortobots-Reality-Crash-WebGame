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

    this.W = 960;
    this.H = 460;
    if (this.canvas) {
      this.canvas.width = 960;
      this.canvas.height = 460;
    }

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

    // Seleção de Alvo Interativa Direta no Tabuleiro
    this.targetSelectionMode = null; // { type: 'attack'|'ally', attacker, item, onSelect }
    this.hoveredEnemy = null;
    this.hoveredAlly = null;
    this.activeTargetLine = null; // { fromX, fromY, toX, toY, color, progress }

    // Mapeamento de Cores Oficiais dos Robôs
    this.robotColors = {
      'dinobyte': '#00ff88',
      'cowputer': '#ffd700',
      'penlinux': '#00e5ff',
      'tigervex': '#ff4455',
      'pavabyte': '#ffaa00',
      'quezas': '#ffd700',
      'default': '#00ff88'
    };

    this.resize();
    this._bindEvents();
    this.startLoop();

    window.addEventListener('resize', () => this.resize());
  }

  _normalizeBotId(id, name = '') {
    const raw = (id || name || '').toLowerCase();
    if (raw.includes('dino') || raw === 'db') return 'DB';
    if (raw.includes('pen') || raw === 'pl') return 'PL';
    if (raw.includes('cow') || raw.includes('moo') || raw === 'cp') return 'CP';
    if (raw.includes('pava') || raw === 'pb') return 'PB';
    if (raw.includes('tiger') || raw === 'tv') return 'TV';
    if (raw.includes('quez') || raw.includes('tyrant') || raw === 'qz') return 'QZ';
    return (id || name || 'BOT').substring(0, 2).toUpperCase();
  }

  resize() {
    this.W = 960;
    this.H = 460;
    if (this.canvas && (this.canvas.width !== 960 || this.canvas.height !== 460)) {
      this.canvas.width = 960;
      this.canvas.height = 460;
    }
  }

  _getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width > 0 ? (this.W / rect.width) : 1;
    const sy = rect.height > 0 ? (this.H / rect.height) : 1;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy
    };
  }

  setBattlers(allies = [], enemies = [], actingIndex = 0) {
    this.allies = allies;
    this.enemies = enemies;
    this.actingAllyIndex = actingIndex;

    const allyCount = this.allies.length;
    this.allies.forEach((bot, i) => {
      bot.col = 0;
      bot.side = 'PLAYER';
      bot.homeX = this.W * 0.14;
      bot.homeY = this.H * ((i + 1) / (allyCount + 1));
      if (bot.currentX === undefined) bot.currentX = bot.homeX;
      if (bot.currentY === undefined) bot.currentY = bot.homeY;
      if (bot.displayHp === undefined) bot.displayHp = bot.currentHp;
      if (bot.ghostHp === undefined) bot.ghostHp = bot.currentHp;
      bot.code = this._normalizeBotId(bot.id, bot.name);
      const palette = {
        'DB': '#00ff88',
        'PL': '#00e5ff',
        'CP': '#ffd700',
        'PB': '#ffaa00',
        'TV': '#ff4455',
        'QZ': '#ffd700'
      };
      bot.color = palette[bot.code] || this.robotColors[bot.id] || '#00ff88';
      if (bot.pulsePhase === undefined) bot.pulsePhase = Math.random() * Math.PI * 2;
    });

    const enemyCount = this.enemies.length;
    this.enemies.forEach((enemy, i) => {
      enemy.col = 4;
      enemy.side = 'ENEMY';
      enemy.homeX = this.W * 0.86;
      enemy.homeY = this.H * ((i + 1) / (enemyCount + 1));
      if (enemy.currentX === undefined) enemy.currentX = enemy.homeX;
      if (enemy.currentY === undefined) enemy.currentY = enemy.homeY;
      if (enemy.displayHp === undefined) enemy.displayHp = enemy.currentHp;
      if (enemy.ghostHp === undefined) enemy.ghostHp = enemy.currentHp;
      enemy.code = this._normalizeBotId(enemy.id, enemy.name);
      enemy.color = enemy.isBoss ? '#ffd700' : '#ff3344';
      if (enemy.pulsePhase === undefined) enemy.pulsePhase = Math.random() * Math.PI * 2;
    });
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.targetSelectionMode) {
        this.canvas.style.cursor = 'default';
        this.hoveredEnemy = null;
        this.hoveredAlly = null;
        return;
      }

      const { x: mx, y: my } = this._getMousePos(e);

      if (this.targetSelectionMode.type === 'ally') {
        const isRevive = !!(this.targetSelectionMode.item && this.targetSelectionMode.item.revive);
        const candidates = this.allies.filter(a => a && (isRevive ? a.currentHp <= 0 : a.currentHp > 0));
        let found = null;
        for (const cand of candidates) {
          const cx = cand.currentX !== undefined ? cand.currentX : cand.homeX;
          const cy = cand.currentY !== undefined ? cand.currentY : cand.homeY;
          const dist = Math.hypot(mx - cx, my - cy);
          if (dist <= 65) {
            found = cand;
            break;
          }
        }
        this.hoveredAlly = found;
        this.hoveredEnemy = null;
        this.canvas.style.cursor = found ? 'pointer' : 'crosshair';
      } else {
        const candidates = this.enemies.filter(e => e && e.currentHp > 0);
        let found = null;
        for (const cand of candidates) {
          const cx = cand.currentX !== undefined ? cand.currentX : cand.homeX;
          const cy = cand.currentY !== undefined ? cand.currentY : cand.homeY;
          const dist = Math.hypot(mx - cx, my - cy);
          if (dist <= 65) {
            found = cand;
            break;
          }
        }
        this.hoveredEnemy = found;
        this.hoveredAlly = null;
        this.canvas.style.cursor = found ? 'pointer' : 'crosshair';
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.targetSelectionMode) return;
      const { x: mx, y: my } = this._getMousePos(e);

      if (this.targetSelectionMode.type === 'ally') {
        const isRevive = !!(this.targetSelectionMode.item && this.targetSelectionMode.item.revive);
        const candidates = this.allies.filter(a => a && (isRevive ? a.currentHp <= 0 : a.currentHp > 0));
        for (const cand of candidates) {
          const cx = cand.currentX !== undefined ? cand.currentX : cand.homeX;
          const cy = cand.currentY !== undefined ? cand.currentY : cand.homeY;
          const dist = Math.hypot(mx - cx, my - cy);
          if (dist <= 65) {
            const onSelect = this.targetSelectionMode.onSelect;
            this.targetSelectionMode = null;
            this.hoveredAlly = null;
            this.canvas.style.cursor = 'default';
            const overlay = document.getElementById('storyTargetOverlay');
            if (overlay) overlay.classList.add('hidden');
            if (typeof onSelect === 'function') {
              onSelect(cand);
            }
            break;
          }
        }
      } else {
        const candidates = this.enemies.filter(en => en && en.currentHp > 0);
        for (const cand of candidates) {
          const cx = cand.currentX !== undefined ? cand.currentX : cand.homeX;
          const cy = cand.currentY !== undefined ? cand.currentY : cand.homeY;
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
      }
    });

    const cancelBtn = document.getElementById('storyTargetCancelBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => this.cancelTargetSelection();
    }
  }

  // ─── Ativação da Mira de Ataque Interativa ───
  startTargetSelection(attacker, onSelect) {
    this.targetSelectionMode = { type: 'attack', attacker, onSelect };
    this.hoveredEnemy = null;
    this.hoveredAlly = null;

    const overlay = document.getElementById('storyTargetOverlay');
    if (overlay) overlay.classList.remove('hidden');

    const titleEl = document.getElementById('storyTargetTitle');
    if (titleEl) {
      titleEl.textContent = `[ MIRA DE ATAQUE: ${attacker.name.toUpperCase()} ]`;
    }
    const hintEl = overlay ? overlay.querySelector('.story-target-hint') : null;
    if (hintEl) {
      hintEl.textContent = '[ CLIQUE DIRETAMENTE NO INIMIGO EM EVIDÊNCIA NO TABULEIRO ]';
    }
  }

  // ─── Ativação da Seleção de Aliado para Uso de Itens ───
  startAllyTargetSelection(activeBot, item, onSelect) {
    this.targetSelectionMode = { type: 'ally', attacker: activeBot, item, onSelect };
    this.hoveredEnemy = null;
    this.hoveredAlly = null;

    const overlay = document.getElementById('storyTargetOverlay');
    if (overlay) overlay.classList.remove('hidden');

    const titleEl = document.getElementById('storyTargetTitle');
    if (titleEl) {
      titleEl.textContent = `[ USAR ITEM: ${(item.name || 'ITEM').toUpperCase()} ]`;
    }
    const hintEl = overlay ? overlay.querySelector('.story-target-hint') : null;
    if (hintEl) {
      hintEl.textContent = '[ CLIQUE DIRETAMENTE NO ROBÔ ALIADO EM EVIDÊNCIA NO TABULEIRO ]';
    }
  }

  cancelTargetSelection() {
    const wasActive = !!this.targetSelectionMode;
    this.targetSelectionMode = null;
    this.hoveredEnemy = null;
    this.hoveredAlly = null;
    this.canvas.style.cursor = 'default';
    const overlay = document.getElementById('storyTargetOverlay');
    if (overlay) overlay.classList.add('hidden');
    if (wasActive && typeof this.onCancelSelection === 'function') {
      this.onCancelSelection();
    }
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

    // Remoção total do screen shake para desempenho a 60fps sem oscilações
    ctx.clearRect(0, 0, this.W, this.H);

    // 1. Fundo CRT & Grade Tática viva
    this._drawTacticalGrid();

    // 2. Escurecimento seletivo se estiver no modo de mira
    if (this.targetSelectionMode) {
      ctx.fillStyle = 'rgba(1, 6, 3, 0.78)';
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
    this.allies.forEach((bot, idx) => {
      const isDead = bot.currentHp <= 0;
      const isActing = idx === this.actingAllyIndex && !isDead;
      const x = bot.currentX !== undefined ? bot.currentX : bot.homeX;
      const y = bot.currentY !== undefined ? bot.currentY : bot.homeY;
      const isSelectable = this.targetSelectionMode && this.targetSelectionMode.type === 'ally' &&
        (this.targetSelectionMode.item?.revive ? isDead : !isDead);
      const isHovered = this.hoveredAlly === bot;

      this._drawSingleRobot(bot, x, y, true, isActing, isSelectable, isHovered);
    });
  }

  _drawEnemies() {
    this.enemies.forEach((enemy) => {
      const isDead = enemy.currentHp <= 0;
      const x = enemy.currentX !== undefined ? enemy.currentX : enemy.homeX;
      const y = enemy.currentY !== undefined ? enemy.currentY : enemy.homeY;
      const isSelectable = this.targetSelectionMode && this.targetSelectionMode.type === 'attack' && !isDead;
      const isHovered = this.hoveredEnemy === enemy;

      this._drawSingleRobot(enemy, x, y, false, false, isSelectable, isHovered);
    });
  }

  _drawSingleRobot(robot, x, y, isAllied, isActing, isSelectable, isHovered) {
    const ctx = this.ctx;
    const t = this.time;

    if (robot.currentHp <= 0) {
      // Robô abatido com halo de corrupção
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = robot.color || '#ff3344';
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
    const breath = Math.sin(t * 0.07 + (robot.pulsePhase || 0)) * 2;
    const r = baseRadius + breath;

    // 2. Rotating 3D Orbital Rings (Exatamente igual ao Modo Versus)
    this._drawOrbitalRings(x, y, r, robot.color, robot.pulsePhase || 0);

    // 3. Aura de Ação / Turno Atual do Aliado
    if (isActing) {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = t * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, r + 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('[ SUA VEZ ]', x, y - r - 14);
      ctx.restore();
    }

    // 4. Modo de Evidência / Seleção de Alvo Direta no Tabuleiro
    if (isSelectable) {
      const candColor = isAllied ? '#00ff88' : '#ff3344';

      ctx.save();
      ctx.strokeStyle = candColor;
      ctx.shadowColor = candColor;
      ctx.shadowBlur = isHovered ? 45 : (26 + Math.sin(t * 0.15) * 8);
      ctx.lineWidth = isHovered ? 3.8 : 2.4;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = t * (isHovered ? 2.2 : 1.2);

      // Anel pulsante
      ctx.beginPath();
      ctx.arc(x, y, r + (isHovered ? 18 : 14), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Holographic corner brackets ╭ ╮ ╰ ╯
      const bArm = isHovered ? 14 : 10;
      const bDist = r + (isHovered ? 22 : 17);
      ctx.lineWidth = isHovered ? 2.6 : 1.8;

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

      // Hover Text
      ctx.font = isHovered ? '900 11px monospace' : '900 9px monospace';
      ctx.fillStyle = isHovered ? '#ffffff' : candColor;
      ctx.textAlign = 'center';
      const actionTxt = isHovered
        ? (isAllied ? '[ CLIQUE P/ USAR ITEM ]' : '[ CLIQUE PARA ATACAR ]')
        : (isAllied ? '[ ALVO DISPONÍVEL ]' : '[ MIRAR ]');
      ctx.fillText(actionTxt, x, y - r - 14);

      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Robot Body Gradient & Metallic Core
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

    // 6. Graphic Avatar Glyph (Retro Cyber Vector Style idêntico ao Versus)
    const code = robot.code || this._normalizeBotId(robot.id, robot.name);
    this._drawAvatarGlyph(code, x, y, r, robot.color);

    // 7. Mini HUD (HP Bar, Ghost Damage, Energy Pips e Nome)
    this._drawRobotMiniHUD(robot, x, y, r, isAllied);
  }

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
      case 'QZ': {
        // Quezas / Tyrant: Horned Crown Glyph
        ctx.beginPath();
        ctx.moveTo(x - 9, y + 5);
        ctx.lineTo(x - 7, y - 6);
        ctx.lineTo(x - 3, y - 1);
        ctx.lineTo(x, y - 8);
        ctx.lineTo(x + 3, y - 1);
        ctx.lineTo(x + 7, y - 6);
        ctx.lineTo(x + 9, y + 5);
        ctx.closePath();
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

  _drawRobotMiniHUD(robot, x, y, r, isAllied) {
    const ctx = this.ctx;
    const barW = 54;
    const barH = 6;
    const barX = x - barW / 2;
    const barY = y + r + 8;
    const maxHp = robot.maxHp || 100;
    const curHp = Math.max(0, robot.displayHp !== undefined ? robot.displayHp : robot.currentHp);
    const ghostHp = Math.max(0, robot.ghostHp !== undefined ? robot.ghostHp : robot.currentHp);
    const curPct = Math.max(0, Math.min(1.0, curHp / maxHp));
    const ghostPct = Math.max(0, Math.min(1.0, ghostHp / maxHp));

    // HP background track with rounded pill
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    // Ghost damage bar
    if (ghostPct > curPct) {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * ghostPct, barH, 3);
      ctx.fill();
    }

    // HP Fill
    const hpColor = isAllied
      ? (curPct > 0.5 ? '#00ff88' : curPct > 0.25 ? '#ffd700' : '#ff3344')
      : (curPct > 0.5 ? '#ff4444' : curPct > 0.25 ? '#ffd700' : '#ff2222');

    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * curPct, barH, 3);
    ctx.fill();

    // Border
    ctx.strokeStyle = isAllied ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 51, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.stroke();

    // Numeric HP Text
    ctx.font = '900 11px "Share Tech Mono", monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.textAlign = 'center';
    const showVal = Math.round(curHp);
    ctx.strokeText(`${showVal}/${maxHp} HP`, x, barY - 2);
    ctx.fillStyle = hpColor;
    ctx.fillText(`${showVal}/${maxHp} HP`, x, barY - 2);

    // Energy pips (se robô aliado tiver energia)
    if (isAllied && robot.currentEnergy !== undefined) {
      const maxPips = 5;
      for (let i = 0; i < maxPips; i++) {
        const px = barX + i * (barW / maxPips) + 3;
        const py = barY + barH + 5;
        const isLit = i < (robot.currentEnergy || 0);
        ctx.fillStyle = isLit ? '#ffd700' : 'rgba(255, 215, 0, 0.2)';
        if (isLit) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 5;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Nome do Robô
    ctx.font = '700 10px "Share Tech Mono", monospace';
    ctx.fillStyle = isAllied ? '#ffffff' : (robot.isBoss ? '#ffd700' : '#ff8899');
    ctx.textAlign = 'center';
    ctx.fillText(robot.name || 'ROBOT', x, barY + barH + (isAllied ? 16 : 10));

    ctx.restore();
  }

  _lighten(hex, amount) {
    if (!hex || hex[0] !== '#') return hex || '#00ff88';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const l = (c) => Math.min(255, Math.floor(c + (255 - c) * amount));
    return `rgb(${l(r)}, ${l(g)}, ${l(b)})`;
  }

  _darken(hex, amount) {
    if (!hex || hex[0] !== '#') return hex || '#003311';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const d = (c) => Math.max(0, Math.floor(c * (1 - amount)));
    return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
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
