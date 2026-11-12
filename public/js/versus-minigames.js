// ═══════════════════════════════════════════════════════════════════
// versus-minigames.js — 9 Minigames Únicos + Defesa (Moeda 3D)
// Níveis: L1=mouse/clique | L2=teclado/QTE | L3=bullet-hell Undertale
// ═══════════════════════════════════════════════════════════════════

import { Terminal3DEngine } from './terminal-3d.js';
import { getAudio } from './terminal-audio.js';

export class VersusMinigames {
  constructor(overlayEl) {
    this.overlay = overlayEl;
    this.animId = null;
    this.engine3D = new Terminal3DEngine();
  }

  _stop() {
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  }

  _shake(intensity = 8) {
    const wrap = this.overlay.querySelector('.vmg-wrap') || this.overlay;
    if (!wrap) return;
    const startTime = performance.now();
    const duration = 240;
    const anim = (now) => {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        const factor = 1 - (elapsed / duration);
        const ox = (Math.random() - 0.5) * intensity * factor * 2;
        const oy = (Math.random() - 0.5) * intensity * factor * 2;
        wrap.style.transform = `translate(${ox}px, ${oy}px)`;
        requestAnimationFrame(anim);
      } else {
        wrap.style.transform = 'translate(0px, 0px)';
      }
    };
    requestAnimationFrame(anim);
  }

  async run(minigameId, robotColor = '#00e5ff', robotName = '') {
    this._stop();
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';

    let result = false;
    try {
      switch (minigameId) {
        // ── L1 minigames ─────────────────────────────────────────────
        case 'click_targets':    result = await this._clickTargets(robotColor, robotName); break;
        case 'swipe_path':       result = await this._swipePath(robotColor, robotName); break;
        case 'circle_click':     result = await this._circleClick(robotColor, robotName); break;
        case 'mirror_sequence':  result = await this._mirrorSequence(robotColor, robotName); break;
        case 'slash_draw':       result = await this._slashDraw(robotColor, robotName); break;
        // ── L2 minigames ─────────────────────────────────────────────
        case 'arrow_qte':        result = await this._arrowQTE(robotColor, robotName); break;
        case 'typing_sprint':    result = await this._typingSprint(robotColor, robotName); break;
        case 'dual_keys':        result = await this._dualKeys(robotColor, robotName); break;
        case 'reaction_test':    result = await this._reactionTest(robotColor, robotName); break;
        case 'arrow_sequence':   result = await this._arrowSequence(robotColor, robotName); break;
        // ── L3 minigames ─────────────────────────────────────────────
        case 'gravity_dodge':    result = await this._gravityDodge(robotColor, robotName); break;
        case 'platform_dodge':   result = await this._platformDodge(robotColor, robotName); break;
        case 'shooter_dodge':    result = await this._shooterDodge(robotColor, robotName); break;
        case 'orbit_dodge':      result = await this._orbitDodge(robotColor, robotName); break;
        case 'green_heart_dodge':result = await this._greenHeartDodge(robotColor, robotName); break;
        // ── L3 ESQUIVA — Minigames de esquiva com controle por mouse pressionado ─
        case 'db_dodge': result = await this._dbDodge(robotColor, robotName); break;
        case 'cp_dodge': result = await this._cpDodge(robotColor, robotName); break;
        case 'pl_dodge': result = await this._plDodge(robotColor, robotName); break;
        case 'pb_dodge': result = await this._pbDodge(robotColor, robotName); break;
        case 'tv_dodge': result = await this._tvDodge(robotColor, robotName); break;
        // ── L2 POINT-AND-CLICK / GESTOS ESPECÍFICOS POR ROBÔ ──────────
        case 'db_bite': result = await this._dbBite(robotColor, robotName); break;
        case 'cp_lasso': result = await this._cpLasso(robotColor, robotName); break;
        case 'pl_sequence': result = await this._plSequence(robotColor, robotName); break;
        case 'pb_prism': result = await this._pbPrism(robotColor, robotName); break;
        case 'tv_slash': result = await this._tvSlash(robotColor, robotName); break;
        default: result = Math.random() > 0.4;
      }
    } catch (err) {
      console.error(`Erro ao executar minigame ${minigameId}:`, err);
      result = true;
    } finally {
      this._stop();
      this.overlay.classList.add('hidden');
      this.overlay.innerHTML = '';
    }
    return result;
  }

  // ─── COIN FLIP (Defesa: Exatamente a mesma Moeda 3D do Modo História) ──
  async runCoinFlip(robotColor = '#00e5ff') {
    this._stop();
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = `
      <div class="vmg-wrap" style="max-width: 540px; text-align: center; background: rgba(4, 10, 22, 0.96); border: 2px solid ${robotColor}; border-radius: 18px / 12px; box-shadow: 0 0 50px ${robotColor}44, inset 0 0 35px rgba(0,0,0,0.85); padding: 32px 28px; font-family: 'Share Tech Mono', monospace;">
        <div class="vmg-header" style="color:${robotColor}; font-size: 1.45rem; letter-spacing: 3px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 0 16px ${robotColor};">
          // DEFESA TÁTICA — MOEDA DA SORTE 3D //
        </div>
        <div class="vmg-sub" style="font-size: 0.92rem; color: #ffd700; margin-bottom: 24px; letter-spacing: 1px;">
          ESCOLHA SEU PALPITE PARA O LANÇAMENTO DA MOEDA 3D:
        </div>
        <div class="vmg-coin-btns" style="display: flex; gap: 18px; justify-content: center;">
          <button class="term-btn gold" id="vmgCaraBtn" style="padding: 16px 28px; font-size: 1.15rem; font-weight: 900; letter-spacing: 2px; cursor: pointer;">
            [ CARA (JOKER DIGITAL) ]
          </button>
          <button class="term-btn gold" id="vmgCoroaBtn" style="padding: 16px 28px; font-size: 1.15rem; font-weight: 900; letter-spacing: 2px; cursor: pointer;">
            [ COROA (COROA IMPERIAL) ]
          </button>
        </div>
      </div>
    `;

    return new Promise(resolve => {
      const caraBtn = document.getElementById('vmgCaraBtn');
      const coroaBtn = document.getElementById('vmgCoroaBtn');

      const trigger3DCoin = (playerChoice) => {
        // Fecha o prompt do VERSUS e delega para o overlay oficial 3D Three.js do Modo História
        this.overlay.classList.add('hidden');
        this.overlay.innerHTML = '';

        const coinSides = ['CARA', 'COROA'];
        const outcome = coinSides[Math.floor(Math.random() * coinSides.length)];
        const engine3D = (window.gameInstance && window.gameInstance.engine3D) || this.engine3D;

        // Dispara A MESMA cinemática 3D em Three.js com os 20 lados, física e textura do Modo História
        engine3D.run3DCoinFlipCinematic(
          playerChoice,
          outcome,
          (res) => {
            const won = res ? res.won : (playerChoice === outcome);
            resolve(won);
          },
          '>> SUCESSO! ESCUDO HOLOGRÁFICO ATIVADO <<',
          '>> FALHA! GOLPE NÃO ABSORVIDO (SEM ESCUDO) <<'
        );
      };

      caraBtn?.addEventListener('click', () => trigger3DCoin('CARA'));
      coroaBtn?.addEventListener('click', () => trigger3DCoin('COROA'));
    });
  }

  // ════════════════════════════════════════════════════════════════

  // L3 ESQUIVA — Minigames de esquiva com controle por mouse pressionado
  // Regra universal: player segue o mouse APENAS com botão esquerdo pressionado
  // AbortController limpa todos os event listeners ao final de cada minigame
  // Retorno: resolve({ won: boolean, score: number })
  // ===================================================================
  // NIVEL 1: ESQUIVA HIPER-FRENETICA & DIFICULDADE QUADRUPLICADA
  // Velocidades 1.5x a velocidade limite do player, alta densidade (35+ objetos), cadencia rapida
  // ===================================================================

  // 1. DINOBYTE: CHUVA MASSIVA DE METEOROS IRREGULARES VELOZES
  _dbDodge(color, name, opts = {}) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = opts.duration || (opts.isFinisher ? 7000 : 13000);
      const isFinisher = Boolean(opts.isFinisher);

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'EXPURGO TERMICO - TEMPESTADE METEORICA',
        'ALERTA MAXIMO! CHUVA MASSIVA DE METEOROS! DESVIE SEM PARAR!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const estrelas = [];
      for (let i = 0; i < 45; i++) {
        estrelas.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < 0.5 ? 1 : 2 });
      }

      const player = { x: W / 2, y: H - 40, size: 12 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      const meteoritos = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let lastSpawn = 0;

      const ac = new AbortController();
      const sig = ac.signal;

      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      canvas.addEventListener('mousedown', (e) => { mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => { if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      const spawnMeteorito = () => {
        const r = 2.8 + Math.random() * 4.2;
        const isFast = Math.random() < 0.5;
        const vel = isFast ? (8.5 + Math.random() * 4.5) : (6.0 + Math.random() * 2.8);
        meteoritos.push({
          x: 8 + Math.random() * (W - 16),
          y: -15 - Math.random() * 30,
          r,
          vel,
          vx: (Math.random() - 0.5) * 2.5,
          color: isFast ? '#ff0033' : '#ff4400'
        });
      };

      const initialCount = isFinisher ? 14 : 26;
      for (let i = 0; i < initialCount; i++) spawnMeteorito();

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Spawn a cada 65ms para manter mais de 35 meteoros na tela
        const spawnCadence = isFinisher ? 110 : 60;
        if (elapsed - lastSpawn > spawnCadence) {
          lastSpawn = elapsed;
          const maxAllowed = isFinisher ? 24 : 48;
          if (meteoritos.length < maxAllowed) {
            spawnMeteorito();
            spawnMeteorito();
            if (Math.random() < 0.6) spawnMeteorito();
          }
        }

        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.28;
          player.y += (mouseTarget.y - player.y) * 0.28;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        ctx.fillStyle = '#010002';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffffff';
        estrelas.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });

        for (let i = meteoritos.length - 1; i >= 0; i--) {
          const m = meteoritos[i];
          m.y += m.vel;
          m.x += m.vx;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 40, 0, 0.45)';
          ctx.lineWidth = m.r * 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 3, m.y - m.vel * 2.2);
          ctx.stroke();

          ctx.fillStyle = m.color;
          ctx.shadowColor = m.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffff66';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (m.y > H + 25 || m.x < -20 || m.x > W + 20) {
            meteoritos.splice(i, 1);
            continue;
          }

          if (!invulneravel) {
            const dist = Math.hypot(player.x - m.x, player.y - m.y);
            if (dist < (player.size / 2 + m.r)) {
              hits++;
              invulneravel = true;
              invTimer = 350;
              this._shake(10);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.strokeRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        ctx.fillStyle = '#ff3344';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits} | METEOROS: ${meteoritos.length}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.12);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'ELIMINADO! TODOS OS PONTOS PERDIDOS!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // 2. COWPUTER: VORTICE TRIPLO HIPER-ACELERADO
  _cpDodge(color, name, opts = {}) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = opts.duration || (opts.isFinisher ? 7000 : 13000);
      const isFinisher = Boolean(opts.isFinisher);

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'LACO MAGNETICO - VORTICE DO XERIFE',
        'VORTICE TRIPLO HIPER-RAPIDO! FIQUE PERTO DO CENTRO E FUJA DAS BORDAS!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const player = { x: W / 2, y: H / 2, size: 12 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      let r1 = 0, r2 = Math.PI / 3, r3 = (Math.PI * 2) / 3;
      let v1 = isFinisher ? 0.07 : 0.10;
      let v2 = isFinisher ? -0.06 : -0.095;
      let v3 = isFinisher ? 0.08 : 0.12;
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let lastAccel = 0;
      let bordaPerigo = 0;

      const ac = new AbortController();
      const sig = ac.signal;

      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      canvas.addEventListener('mousedown', (e) => { mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => { if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      const distPontoElipse = (px, py, cx, cy, rx, ry, ang) => {
        const dx = px - cx, dy = py - cy;
        const cosA = Math.cos(-ang), sinA = Math.sin(-ang);
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;
        const nx = lx / rx, ny = ly / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        return Math.abs(Math.sqrt(lx * lx + ly * ly) - Math.sqrt((lx / (d || 1)) * rx * (lx / (d || 1)) * rx + (ly / (d || 1)) * ry * (ly / (d || 1)) * ry));
      };

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        const pStep = Math.floor(elapsed / 500);
        if (pStep > lastAccel) {
          lastAccel = pStep;
          v1 = Math.min(0.34, v1 + 0.015);
          v2 = Math.max(-0.31, v2 - 0.012);
          v3 = Math.min(0.36, v3 + 0.016);
        }

        bordaPerigo = (elapsed / 1000) * 5.8;

        r1 += v1;
        r2 += v2;
        r3 += v3;

        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.26;
          player.y += (mouseTarget.y - player.y) * 0.26;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        ctx.fillStyle = '#060400';
        ctx.fillRect(0, 0, W, H);

        const bp = Math.min(bordaPerigo, Math.min(W, H) / 2 - 25);
        if (bp > 0) {
          ctx.fillStyle = 'rgba(255, 30, 0, 0.35)';
          ctx.fillRect(0, 0, W, bp);
          ctx.fillRect(0, H - bp, W, bp);
          ctx.fillRect(0, 0, bp, H);
          ctx.fillRect(W - bp, 0, bp, H);
          ctx.strokeStyle = '#ff3300';
          ctx.lineWidth = 2;
          ctx.strokeRect(bp, bp, W - bp * 2, H - bp * 2);
        }

        const cx = W / 2, cy = H / 2;
        const rx1 = 150, ry1 = 78;
        const rx2 = 115, ry2 = 62;
        const rx3 = 80,  ry3 = 45;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(r1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx1, ry1, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(r2);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 8;
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx2, ry2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (!isFinisher) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(r3);
          ctx.strokeStyle = '#ff2244';
          ctx.lineWidth = 7;
          ctx.shadowColor = '#ff2244';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx3, ry3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (!invulneravel) {
          const d1 = distPontoElipse(player.x, player.y, cx, cy, rx1, ry1, r1);
          const d2 = distPontoElipse(player.x, player.y, cx, cy, rx2, ry2, r2);
          const d3 = !isFinisher ? distPontoElipse(player.x, player.y, cx, cy, rx3, ry3, r3) : 999;
          if (d1 < 9 || d2 < 8 || d3 < 7) {
            hits++;
            invulneravel = true;
            invTimer = 400;
            this._shake(9);
            try { getAudio().playAccessDenied(); } catch (e) {}
          }
          if (bp > 0) {
            const naZonaBorda = player.x < bp || player.x > W - bp || player.y < bp || player.y > H - bp;
            if (naZonaBorda) {
              hits++;
              invulneravel = true;
              invTimer = 400;
              this._shake(9);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits} | VORTICE: ${v1.toFixed(3)} rad/f`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.12);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `DESVIOU! SCORE: ${score.toFixed(2)}` : 'LACADO! PONTUACAO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // 3. PENLINUX: AVALANCHE ARTICA COM VENTO FURACAO
  _plDodge(color, name, opts = {}) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = opts.duration || (opts.isFinisher ? 7000 : 13000);
      const isFinisher = Boolean(opts.isFinisher);

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'TUNDRA ARTICA - BLIZZARD DE GELO',
        'AVALANCHE SUPREMA! DESVIE DAS DEZENAS DE ESTALACTITES SOB VENTO FURACAO!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const wrap = this.overlay.querySelector('.vmg-wrap');
      const ventoDivEl = document.createElement('div');
      ventoDivEl.style.cssText = 'color:#00e5ff;font-size:0.85rem;font-weight:bold;text-align:center;padding:2px 0;letter-spacing:2px;font-family:monospace;';
      ventoDivEl.textContent = 'VENTO ARTICO: ATIVO';
      const statusBar = wrap?.querySelector('.vmg-status-bar');
      if (statusBar && statusBar.parentNode) {
        statusBar.parentNode.insertBefore(ventoDivEl, statusBar.nextSibling);
      }

      const player = { x: W / 2, y: H - 40, size: 12, vx: 0, vy: 0 };
      const velMax = 6.2;
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      const dirVento = ['NORTE', 'SUL', 'LESTE', 'OESTE'];
      let ventoForca = { x: 0, y: 0 };
      let ultimoVento = 0;

      const estalactites = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();

      const estaDecorat = [];
      for (let i = 0; i < 20; i++) {
        estaDecorat.push({ x: 12 + i * 26, largura: 14 + Math.random() * 8, altura: 16 + Math.random() * 18 });
      }

      const ac = new AbortController();
      const sig = ac.signal;

      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      canvas.addEventListener('mousedown', (e) => { mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => { if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      const sortearVento = () => {
        const dir = dirVento[Math.floor(Math.random() * 4)];
        if (dir === 'NORTE') ventoForca = { x: 0, y: -0.90 };
        else if (dir === 'SUL') ventoForca = { x: 0, y: 0.90 };
        else if (dir === 'LESTE') ventoForca = { x: 0.90, y: 0 };
        else ventoForca = { x: -0.90, y: 0 };
        if (ventoDivEl) ventoDivEl.textContent = `VENTO ARTICO: ${dir} (FORCA MAXIMA)`;
      };

      const spawnEstalactite = () => {
        const largura = 7 + Math.random() * 8;
        const altura = 35 + Math.random() * 45;
        estalactites.push({
          x: largura + Math.random() * (W - largura * 2),
          y: -altura,
          largura,
          altura,
          vel: (isFinisher ? 5.0 : 7.2) + Math.random() * 3.5
        });
      };

      const initialCount = isFinisher ? 10 : 18;
      for (let i = 0; i < initialCount; i++) spawnEstalactite();

      let ultimoSpawn = 0;

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        const segVento = Math.floor(elapsed / 1000);
        if (segVento > ultimoVento) {
          ultimoVento = segVento;
          sortearVento();
        }

        const spawnDelay = isFinisher ? 300 : 160;
        if (elapsed - ultimoSpawn > spawnDelay) {
          ultimoSpawn = elapsed;
          spawnEstalactite();
          if (!isFinisher) spawnEstalactite();
        }

        if (mousePressed) {
          const dx = mouseTarget.x - player.x;
          const dy = mouseTarget.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          player.vx += (dx / dist) * 0.58;
          player.vy += (dy / dist) * 0.58;
        } else {
          player.vx *= 0.90;
          player.vy *= 0.90;
        }

        player.vx += ventoForca.x;
        player.vy += ventoForca.y;

        const spd = Math.hypot(player.vx, player.vy);
        if (spd > velMax) {
          player.vx = (player.vx / spd) * velMax;
          player.vy = (player.vy / spd) * velMax;
        }

        player.x += player.vx;
        player.y += player.vy;

        if (player.x < player.size / 2) { player.x = player.size / 2; player.vx *= -0.5; }
        if (player.x > W - player.size / 2) { player.x = W - player.size / 2; player.vx *= -0.5; }
        if (player.y < player.size / 2) { player.y = player.size / 2; player.vy *= -0.5; }
        if (player.y > H - player.size / 2) { player.y = H - player.size / 2; player.vy *= -0.5; }

        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        ctx.fillStyle = '#030814';
        ctx.fillRect(0, 0, W, H);

        estaDecorat.forEach(ed => {
          ctx.fillStyle = 'rgba(0, 200, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(ed.x - ed.largura / 2, 0);
          ctx.lineTo(ed.x + ed.largura / 2, 0);
          ctx.lineTo(ed.x, ed.altura);
          ctx.closePath();
          ctx.fill();
        });

        for (let i = estalactites.length - 1; i >= 0; i--) {
          const e = estalactites[i];
          e.y += e.vel;

          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 8;
          ctx.fillRect(e.x - e.largura / 2, e.y, e.largura, e.altura);
          ctx.beginPath();
          ctx.moveTo(e.x - e.largura / 2, e.y + e.altura);
          ctx.lineTo(e.x + e.largura / 2, e.y + e.altura);
          ctx.lineTo(e.x, e.y + e.altura + 14);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          if (e.y > H + 20) {
            estalactites.splice(i, 1);
            continue;
          }

          if (!invulneravel) {
            const ph = player.size / 2;
            const ex1 = e.x - e.largura / 2, ex2 = e.x + e.largura / 2;
            const ey1 = e.y, ey2 = e.y + e.altura + 14;
            const px1 = player.x - ph, px2 = player.x + ph;
            const py1 = player.y - ph, py2 = player.y + ph;
            if (px2 > ex1 && px1 < ex2 && py2 > ey1 && py1 < ey2) {
              hits++;
              invulneravel = true;
              invTimer = 350;
              this._shake(9);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits} | ESTALACTITES: ${estalactites.length}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.12);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'CONGELADO! PONTUACAO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // 4. PAVABYTE: TEMPESTADE PRISMATICA (TELEGRAPH 0.20s, ATE 8 FEIXES)
  _pbDodge(color, name, opts = {}) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = opts.duration || (opts.isFinisher ? 7000 : 13000);
      const isFinisher = Boolean(opts.isFinisher);

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'CAMARA DE CRISTAL - MATRIZ PRISMATICA',
        'FEIXES ULTRA-VELOZES! TELEGRAFOS DE 0.2s! MANOBRE INSTANTANEAMENTE!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const player = { x: W / 2, y: H / 2, size: 12 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      const feixes = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimoSpawn = 0;

      const ac = new AbortController();
      const sig = ac.signal;

      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      canvas.addEventListener('mousedown', (e) => { mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => { if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      const spawnFeixe = () => {
        const tipo = Math.floor(Math.random() * 4);
        let p1, p2;
        if (tipo === 0) {
          const y = 20 + Math.random() * (H - 40);
          p1 = { x: 0, y }; p2 = { x: W, y };
        } else if (tipo === 1) {
          const x = 20 + Math.random() * (W - 40);
          p1 = { x, y: 0 }; p2 = { x, y: H };
        } else if (tipo === 2) {
          const off = Math.random() * (W + H);
          p1 = { x: 0, y: off }; p2 = { x: W, y: off - W };
        } else {
          const off = Math.random() * (W + H) - H;
          p1 = { x: 0, y: off }; p2 = { x: W, y: off + W };
        }
        feixes.push({
          p1, p2,
          fase: 'telegraph',
          timer: isFinisher ? 0.30 : 0.20,
          totalTimer: isFinisher ? 0.30 : 0.20
        });
      };

      const distPontoLinha = (px, py, x1, y1, x2, y2) => {
        const A = y2 - y1, B = x1 - x2, C = x2 * y1 - x1 * y2;
        const denom = Math.sqrt(A * A + B * B);
        if (denom === 0) return Math.hypot(px - x1, py - y1);
        return Math.abs(A * px + B * py + C) / denom;
      };

      const pontosGrade = [];
      for (let gx = 0; gx < W; gx += 26) {
        for (let gy = 0; gy < H; gy += 26) {
          pontosGrade.push({ x: gx, y: gy });
        }
      }

      let ultimoFrame = performance.now();

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min((now - ultimoFrame) / 1000, 0.05);
        ultimoFrame = now;
        const elapsed = now - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        const maxFeixes = isFinisher ? 4 : 8;
        const spawnDelay = isFinisher ? 450 : 210;
        if (elapsed - ultimoSpawn > spawnDelay && feixes.length < maxFeixes) {
          ultimoSpawn = elapsed;
          spawnFeixe();
          if (!isFinisher && Math.random() < 0.6) spawnFeixe();
        }

        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.28;
          player.y += (mouseTarget.y - player.y) * 0.28;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        ctx.fillStyle = '#020004';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(224,64,251,0.12)';
        pontosGrade.forEach(p => { ctx.fillRect(p.x - 1, p.y - 1, 2, 2); });

        for (let i = feixes.length - 1; i >= 0; i--) {
          const f = feixes[i];
          f.timer -= dt;

          if (f.fase === 'telegraph') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,100,255,0.85)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(f.p1.x, f.p1.y);
            ctx.lineTo(f.p2.x, f.p2.y);
            ctx.stroke();
            ctx.restore();

            if (f.timer <= 0) {
              f.fase = 'laser';
              f.timer = 0.45;
            }
          } else if (f.fase === 'laser') {
            ctx.save();
            ctx.strokeStyle = '#e040fb';
            ctx.lineWidth = 9;
            ctx.shadowColor = '#e040fb';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(f.p1.x, f.p1.y);
            ctx.lineTo(f.p2.x, f.p2.y);
            ctx.stroke();
            ctx.restore();

            if (!invulneravel) {
              const dist = distPontoLinha(player.x, player.y, f.p1.x, f.p1.y, f.p2.x, f.p2.y);
              if (dist < player.size + 2) {
                hits++;
                invulneravel = true;
                invTimer = 350;
                this._shake(9);
                try { getAudio().playAccessDenied(); } catch (e) {}
              }
            }

            if (f.timer <= 0) {
              feixes.splice(i, 1);
            }
          }
        }

        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        ctx.fillStyle = '#e040fb';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits} | LASERS ATIVOS: ${feixes.length}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.12);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'VAPORIZADO! PONTUACAO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // 5. TIGERVEX: CORREDOR TESLA INSANO (BARREIRAS RAPIDAS A CADA 600ms, ABERTURA 50px)
  _tvDodge(color, name, opts = {}) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = opts.duration || (opts.isFinisher ? 7000 : 13000);
      const isFinisher = Boolean(opts.isFinisher);

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'ARENA DO TIGRE - CORREDOR TESLA',
        'VELOCIDADE MAXIMA! BARREIRAS HIPER-VELOZES! ENCONTRE AS FRESTAS!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const player = { x: 70, y: H / 2, size: 12 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      const barreiras = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimoSpawn = -1500;

      const ac = new AbortController();
      const sig = ac.signal;

      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      canvas.addEventListener('mousedown', (e) => { mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => { if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('touchstart', (e) => { e.preventDefault(); mousePressed = true; mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (mousePressed) mouseTarget = getPosCanvas(e); }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      const spawnBarreira = () => {
        const aberturaAltura = isFinisher ? 68 : 50;
        const aberturaY = 20 + Math.random() * (H - 40 - aberturaAltura);
        barreiras.push({
          x: W,
          largura: 36,
          aberturaY,
          aberturaAltura,
          vel: isFinisher ? 5.0 : 7.0
        });
      };

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        const spawnDelay = isFinisher ? 1000 : 580;
        const maxBars = isFinisher ? 4 : 7;
        if (elapsed - ultimoSpawn > spawnDelay && barreiras.length < maxBars) {
          ultimoSpawn = elapsed;
          spawnBarreira();
        }

        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.28;
          player.y += (mouseTarget.y - player.y) * 0.28;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, W, H);

        for (let i = barreiras.length - 1; i >= 0; i--) {
          const b = barreiras[i];
          b.x -= b.vel;

          if (b.x + b.largura < 0) {
            barreiras.splice(i, 1);
            continue;
          }

          ctx.fillStyle = '#ff8c00';
          ctx.shadowColor = '#ff8c00';
          ctx.shadowBlur = 10;
          ctx.fillRect(b.x, 0, b.largura, b.aberturaY);

          const infY = b.aberturaY + b.aberturaAltura;
          ctx.fillRect(b.x, infY, b.largura, H - infY);

          ctx.fillStyle = '#ffff00';
          ctx.fillRect(b.x - 2, b.aberturaY - 4, b.largura + 4, 4);
          ctx.fillRect(b.x - 2, infY, b.largura + 4, 4);
          ctx.shadowBlur = 0;

          if (!invulneravel) {
            const ph = player.size / 2;
            const px1 = player.x - ph, px2 = player.x + ph;
            const py1 = player.y - ph, py2 = player.y + ph;
            const bx1 = b.x, bx2 = b.x + b.largura;

            if (px2 > bx1 && px1 < bx2) {
              const naAbertura = py1 >= b.aberturaY && py2 <= (b.aberturaY + b.aberturaAltura);
              if (!naAbertura) {
                hits++;
                invulneravel = true;
                invTimer = 350;
                this._shake(9);
                try { getAudio().playAccessDenied(); } catch (e) {}
              }
            }
          }
        }

        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits} | BARREIRAS: ${barreiras.length}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.12);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `PASSOU! SCORE: ${score.toFixed(2)}` : 'BLOQUEADO! PONTUACAO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }


  // ═══════════════════════════════════════════════════════════════════════
  // L2 NOVO: POINT-AND-CLICK / GESTOS ESPECÍFICOS PADRONIZADOS POR ROBÔ
  // ═══════════════════════════════════════════════════════════════════════

  // L2-DB: Mordida Dracônica em Telas de Erro (estilo Fruit Ninja / mordida cortando em dois)
  _dbBite(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 12000;
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'EXPURGO TÉRMICO — MORDIDA DRACÔNICA',
        'CLIQUE NAS TELAS DE ERRO PARA O DINOBYTE MORDER E DESTRUÍ-LAS!',
        duration, true
      );
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');
      const scoreEl = this.overlay.querySelector('.vmg-score');

      const abortCtrl = new AbortController();
      const signal = abortCtrl.signal;

      const windows = [];
      const severed = [];
      const glitchParticles = [];
      let totalSpawned = 0;
      let bitten = 0;
      let lastSpawn = 0;
      const titles = ['ERR_OVERHEAT', 'NULL_POINTER', 'STACK_OVERFLOW', 'VOLT_BURST', 'KERNEL_PANIC', 'DIV_BY_ZERO'];

      const spawnWindow = (now) => {
        if (totalSpawned >= 15) return;
        totalSpawned++;
        const w = 130, h = 55;
        let x = 30 + Math.random() * (W - w - 60);
        let y = 30 + Math.random() * (H - h - 60);
        windows.push({
          id: totalSpawned,
          x, y, w, h,
          title: titles[Math.floor(Math.random() * titles.length)],
          spawnTime: now,
          life: 1400
        });
      };

      canvas.addEventListener('pointerdown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        for (let i = windows.length - 1; i >= 0; i--) {
          const win = windows[i];
          if (mx >= win.x && mx <= win.x + win.w && my >= win.y && my <= win.y + win.h) {
            windows.splice(i, 1);
            bitten++;
            this._shake(10);
            try { getAudio().playKeyClack(); } catch(err) {}

            // Cria duas metades cortadas caindo
            severed.push({
              side: 'left',
              x: win.x, y: win.y, w: win.w / 2, h: win.h,
              title: win.title.slice(0, Math.ceil(win.title.length / 2)),
              vx: -2.5 - Math.random() * 2,
              vy: -1.5,
              rot: 0,
              vRot: -0.06,
              alpha: 1.0
            });
            severed.push({
              side: 'right',
              x: win.x + win.w / 2, y: win.y, w: win.w / 2, h: win.h,
              title: win.title.slice(Math.ceil(win.title.length / 2)),
              vx: 2.5 + Math.random() * 2,
              vy: -1.5,
              rot: 0,
              vRot: 0.06,
              alpha: 1.0
            });

            // Partículas de mordida / glitch
            for (let p = 0; p < 8; p++) {
              glitchParticles.push({
                x: mx, y: my,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                txt: ['MORDIDO', '0xFF', 'KILL', 'CHOMP'][Math.floor(Math.random() * 4)],
                alpha: 1.0
              });
            }
            break;
          }
        }
      }, { signal });

      const startTime = performance.now();
      let done = false;

      const loop = (now) => {
        if (done) return;
        const elapsed = now - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;
        if (scoreEl) scoreEl.textContent = `MORDIDAS: ${bitten}/${totalSpawned}`;

        if (now - lastSpawn > 340 && totalSpawned < 24) {
          spawnWindow(now);
          lastSpawn = now;
        }

        // Remove expiradas
        for (let i = windows.length - 1; i >= 0; i--) {
          if (now - windows[i].spawnTime > windows[i].life) {
            windows.splice(i, 1);
          }
        }

        // Render
        ctx.fillStyle = '#050203';
        ctx.fillRect(0, 0, W, H);

        // Grade avermelhada sutil
        ctx.strokeStyle = 'rgba(255, 51, 68, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Janelas ativas
        windows.forEach(w => {
          ctx.save();
          ctx.fillStyle = 'rgba(20, 4, 8, 0.95)';
          ctx.strokeStyle = '#ff3344';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ff3344';
          ctx.shadowBlur = 8;
          ctx.strokeRect(w.x, w.y, w.w, w.h);
          ctx.fillRect(w.x, w.y, w.w, w.h);

          // Barra superior de erro
          ctx.fillStyle = '#ff3344';
          ctx.fillRect(w.x, w.y, w.w, 16);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`[!] ${w.title}`, w.x + 4, w.y + 11);

          // Mensagem de clique
          ctx.fillStyle = '#ff8888';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('>> MORDER <<', w.x + w.w / 2, w.y + 36);
          ctx.restore();
        });

        // Metades partidas (queda tipo Fruit Ninja)
        for (let i = severed.length - 1; i >= 0; i--) {
          const s = severed[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.25; // gravidade
          s.rot += s.vRot;
          s.alpha -= 0.02;

          if (s.alpha <= 0) {
            severed.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
          ctx.rotate(s.rot);
          ctx.fillStyle = 'rgba(255, 51, 68, 0.3)';
          ctx.strokeStyle = '#ff3344';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
          ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
          ctx.fillStyle = '#ffaaaa';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(s.title, -s.w / 2 + 4, 0);
          ctx.restore();
        }

        // Partículas
        for (let i = glitchParticles.length - 1; i >= 0; i--) {
          const p = glitchParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) {
            glitchParticles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = '#ff5533';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(p.txt, p.x, p.y);
          ctx.restore();
        }

        if (elapsed >= duration) {
          done = true;
          abortCtrl.abort();
          this._stop();
          const score = totalSpawned > 0 ? Math.min(1.0, bitten / Math.max(8, totalSpawned * 0.75)) : 0;
          const won = score >= 0.5;
          this._showResult(canvas, won, won ? `MORDIDAS EFETUADAS: ${bitten}!` : 'ERROS ESCAPARAM!');
          setTimeout(() => resolve({ won, score }), 950);
          return;
        }

        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    });
  }

  // L2-CP: Giro do Laço Magnético (movimento circular quase perfeito com mouse pressionado)
  _cpLasso(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 8000;
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'LAÇO MAGNÉTICO — GIRO PERFEITO',
        'PRESSIONE E GIRE O MOUSE EM CÍRCULO PERFEITO PARA ACUMULAR ENERGIA!',
        duration, true
      );
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const abortCtrl = new AbortController();
      const signal = abortCtrl.signal;

      let isDown = false;
      const trail = [];
      let perfectFrames = 0;
      let totalDownFrames = 0;
      let waveAngle = 0;

      const onDown = () => { isDown = true; };
      const onUp = () => { isDown = false; trail.length = 0; };
      const onMove = (e) => {
        if (!isDown) return;
        const rect = canvas.getBoundingClientRect();
        trail.push({
          x: (e.clientX - rect.left) * (W / rect.width),
          y: (e.clientY - rect.top) * (H / rect.height)
        });
        if (trail.length > 35) trail.shift();
      };

      canvas.addEventListener('pointerdown', onDown, { signal });
      window.addEventListener('pointerup', onUp, { signal });
      canvas.addEventListener('pointermove', onMove, { signal });

      const startTime = performance.now();
      let done = false;

      const loop = (now) => {
        if (done) return;
        const elapsed = now - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;

        waveAngle += 0.08;

        // Fundo deserto dourado
        ctx.fillStyle = '#080602';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.07)';
        ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Laço visual torcido central com ondulações animadas
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const r = 90 + Math.sin(a * 4 + waveAngle) * 12 + Math.cos(a * 2) * 8;
          const px = Math.cos(a) * (r * 1.2);
          const py = Math.sin(a) * (r * 0.85);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Análise do movimento circular do jogador
        let isPerfect = false;
        if (isDown && trail.length >= 20) {
          totalDownFrames++;
          // Centro médio do rastro
          const cx = trail.reduce((sum, p) => sum + p.x, 0) / trail.length;
          const cy = trail.reduce((sum, p) => sum + p.y, 0) / trail.length;

          // Distâncias ao centróide
          const radii = trail.map(p => Math.hypot(p.x - cx, p.y - cy));
          const meanR = radii.reduce((sum, r) => sum + r, 0) / radii.length;
          const variance = radii.reduce((sum, r) => sum + Math.pow(r - meanR, 2), 0) / radii.length;
          const stdDev = Math.sqrt(variance);

          // Perfeito se raio >= 40px e desvio padrão < 22% do raio
          if (meanR >= 40 && (stdDev / meanR) < 0.22) {
            isPerfect = true;
            perfectFrames++;
          }
        }

        // Desenha rastro do cursor
        if (trail.length > 1) {
          ctx.strokeStyle = isPerfect ? '#00ff88' : '#ffd700';
          ctx.lineWidth = isPerfect ? 6 : 3;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = isPerfect ? 15 : 6;
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Barra de sincronia do laço
        const syncRatio = totalDownFrames > 0 ? Math.min(1.0, perfectFrames / (duration / 25)) : 0;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(40, H - 35, W - 80, 16);
        ctx.strokeStyle = '#ffd700';
        ctx.strokeRect(40, H - 35, W - 80, 16);
        ctx.fillStyle = syncRatio >= 0.7 ? '#00ff88' : '#ffd700';
        ctx.fillRect(42, H - 33, (W - 84) * syncRatio, 12);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PERFEIÇÃO DO GIRO: ${Math.floor(syncRatio * 100)}%`, W / 2, H - 23);

        if (elapsed >= duration) {
          done = true;
          abortCtrl.abort();
          this._stop();
          const score = syncRatio;
          const won = score >= 0.45;
          this._showResult(canvas, won, won ? 'LAÇO PERFEITO ENERGIZADO!' : 'FALHA NO GIRO DO LAÇO!');
          setTimeout(() => resolve({ won, score }), 950);
          return;
        }

        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    });
  }

  // L2-PL: Sequência Numérica Polar 1 a 15 (todos os 15 números na tela sem sobrepor)
  _plSequence(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 9000;
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'DANÇA POLAR — SEQUÊNCIA DO HEE-HEE',
        'CLIQUE NOS NÚMEROS DE 1 A 15 EM ORDEM CORRETA!',
        duration, true
      );
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const abortCtrl = new AbortController();
      const signal = abortCtrl.signal;

      const nodes = [];
      const totalNodes = 15;
      let nextExpected = 1;
      let errorFlash = 0;

      // Gera 15 posições sem sobreposição
      for (let i = 1; i <= totalNodes; i++) {
        let placed = false;
        let attempts = 0;
        let x = 0, y = 0;
        while (!placed && attempts < 200) {
          attempts++;
          x = 40 + Math.random() * (W - 80);
          y = 40 + Math.random() * (H - 80);
          placed = nodes.every(n => Math.hypot(n.x - x, n.y - y) >= 48);
        }
        nodes.push({ num: i, x, y, r: 18, clicked: false, flash: 0 });
      }

      canvas.addEventListener('pointerdown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        for (const n of nodes) {
          if (!n.clicked && Math.hypot(n.x - mx, n.y - my) <= n.r + 6) {
            if (n.num === nextExpected) {
              n.clicked = true;
              nextExpected++;
              try { getAudio().playKeyClack(); } catch(err) {}
              this._shake(4);
            } else {
              n.flash = 1.0;
              errorFlash = 1.0;
              try { getAudio().playAccessDenied(); } catch(err) {}
              this._shake(8);
            }
            break;
          }
        }
      }, { signal });

      const startTime = performance.now();
      let done = false;

      const loop = (now) => {
        if (done) return;
        const elapsed = now - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;

        ctx.fillStyle = '#030810';
        ctx.fillRect(0, 0, W, H);

        // Grade ciano ártica
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Linha guia conectando os nós já clicados
        const clickedNodes = nodes.filter(n => n.clicked).sort((a, b) => a.num - b.num);
        if (clickedNodes.length > 1) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(clickedNodes[0].x, clickedNodes[0].y);
          for (let i = 1; i < clickedNodes.length; i++) ctx.lineTo(clickedNodes[i].x, clickedNodes[i].y);
          ctx.stroke();
        }

        // Renderiza cada nó
        nodes.forEach(n => {
          if (n.clicked) return; // Nó clicado desaparece
          const isNext = n.num === nextExpected;
          ctx.save();

          if (n.flash > 0) {
            n.flash -= 0.05;
            ctx.fillStyle = 'rgba(255, 51, 68, 0.8)';
            ctx.strokeStyle = '#ff3344';
          } else if (isNext) {
            const pulse = 1 + Math.sin(now * 0.01) * 0.15;
            ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
          } else {
            ctx.fillStyle = 'rgba(10, 30, 45, 0.85)';
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
            ctx.lineWidth = 1.5;
          }

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isNext ? '#ffd700' : '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.num, n.x, n.y);
          ctx.restore();
        });

        // Vitória antecipada ao atingir 15
        if (nextExpected > totalNodes || elapsed >= duration) {
          done = true;
          abortCtrl.abort();
          this._stop();
          const won = nextExpected > totalNodes;
          const score = won ? Math.max(0.6, 1.0 - (elapsed / duration) * 0.4) : (nextExpected - 1) / totalNodes;
          this._showResult(canvas, won, won ? `PASSOS COMPLETOS! (15/15)` : `SEQUÊNCIA INTERROMPIDA (${nextExpected - 1}/15)`);
          setTimeout(() => resolve({ won, score }), 950);
          return;
        }

        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    });
  }

  // L2-PB: Alinhamento de 6 Prismas (rotação de 90° anti-horário ao clicar)
  _pbPrism(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 9000;
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'ALINHAMENTO PRISMÁTICO — FEIXE ESPECTRAL',
        'CLIQUE NOS PRISMAS PARA ROTACIONAR (90° ANTI-HORÁRIO) E ALINHAR O FEIXE DE LUZ!',
        duration, true
      );
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const abortCtrl = new AbortController();
      const signal = abortCtrl.signal;

      // 6 prismas alinhados horizontalmente
      // Cada um precisa de um ângulo específico (0: baixo, 1: dir, 2: cima, 3: esq)
      const targetAngles = [1, 1, 1, 1, 1, 1]; // Caminho reto padrão
      const prisms = [];
      const numPrisms = 6;
      const spacing = (W - 100) / (numPrisms - 1);

      for (let i = 0; i < numPrisms; i++) {
        // Começa em ângulo aleatório diferente do correto
        const initialAngle = (targetAngles[i] + Math.floor(Math.random() * 3) + 1) % 4;
        prisms.push({
          x: 50 + i * spacing,
          y: H / 2,
          w: 36, h: 36,
          angleStep: initialAngle // 0=0°, 1=90°, 2=180°, 3=270°
        });
      }

      canvas.addEventListener('pointerdown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        for (const p of prisms) {
          if (Math.hypot(p.x - mx, p.y - my) <= 24) {
            p.angleStep = (p.angleStep + 3) % 4; // Rotação 90° anti-horário
            try { getAudio().playKeyClack(); } catch(err) {}
            this._shake(3);
            break;
          }
        }
      }, { signal });

      const startTime = performance.now();
      let alignedTime = 0;
      let lastCheck = performance.now();
      let done = false;

      const loop = (now) => {
        if (done) return;
        const elapsed = now - startTime;
        const dt = now - lastCheck;
        lastCheck = now;

        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;

        ctx.fillStyle = '#06020a';
        ctx.fillRect(0, 0, W, H);

        // Grade lilás
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Verifica se todos estão alinhados com o alvo
        const allAligned = prisms.every((p, i) => p.angleStep === targetAngles[i]);
        if (allAligned) {
          alignedTime += dt;
        } else {
          alignedTime = 0;
        }

        // Desenha feixe de luz que entra em (20, 40) e tenta percorrer os prismas
        ctx.strokeStyle = allAligned ? '#ffd700' : 'rgba(224, 64, 251, 0.7)';
        ctx.lineWidth = allAligned ? 5 : 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = allAligned ? 20 : 6;
        ctx.beginPath();
        ctx.moveTo(10, 30);
        ctx.lineTo(prisms[0].x, prisms[0].y);

        let curX = prisms[0].x;
        let curY = prisms[0].y;
        for (let i = 0; i < prisms.length; i++) {
          const p = prisms[i];
          if (p.angleStep === targetAngles[i]) {
            if (i < prisms.length - 1) {
              ctx.lineTo(prisms[i + 1].x, prisms[i + 1].y);
            } else {
              ctx.lineTo(W - 10, H - 30); // Chegada ao destino
            }
          } else {
            // Feixe refletido para direção errada
            const angleRad = p.angleStep * (Math.PI / 2);
            ctx.lineTo(p.x + Math.cos(angleRad) * 40, p.y + Math.sin(angleRad) * 40);
            break;
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Renderiza os 6 prismas
        prisms.forEach((p, i) => {
          const isCorrect = p.angleStep === targetAngles[i];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(-p.angleStep * (Math.PI / 2));

          ctx.fillStyle = isCorrect ? 'rgba(224, 64, 251, 0.4)' : 'rgba(30, 10, 40, 0.8)';
          ctx.strokeStyle = isCorrect ? '#e040fb' : '#888';
          ctx.lineWidth = 2;
          ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

          // Seta interna indicando direção do prisma
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(p.w / 2 - 4, 0);
          ctx.lineTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        });

        // Barra de convergência contínua (exige 1.2s contínuos alinhados)
        const progress = Math.min(1.0, alignedTime / 1200);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(50, H - 35, W - 100, 14);
        ctx.strokeStyle = '#e040fb';
        ctx.strokeRect(50, H - 35, W - 100, 14);
        ctx.fillStyle = progress >= 1.0 ? '#00ff88' : '#e040fb';
        ctx.fillRect(52, H - 33, (W - 104) * progress, 10);

        if (progress >= 1.0 || elapsed >= duration) {
          done = true;
          abortCtrl.abort();
          this._stop();
          const won = progress >= 1.0;
          const score = won ? 1.0 : 0.0;
          this._showResult(canvas, won, won ? 'FEIXE ESPECTRAL CONVERGIDO!' : 'TEMPO ESGOTADO!');
          setTimeout(() => resolve({ won, score }), 950);
          return;
        }

        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    });
  }

  // L2-TV: Rasgo de Dimensão (deslizar mouse/dedo de cima para baixo cobrindo colunas)
  _tvSlash(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 8000;
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'CORTE SUPREMO — RASGO DE DIMENSÃO',
        'DESLIZE O MOUSE/DEDO DE CIMA PARA BAIXO PARA RASGAR A DIMENSÃO!',
        duration, true
      );
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const abortCtrl = new AbortController();
      const signal = abortCtrl.signal;

      const numCols = 10;
      const colWidth = W / numCols;
      const shredded = new Array(numCols).fill(false);
      let isDown = false;
      let lastPos = null;

      canvas.addEventListener('pointerdown', (e) => {
        isDown = true;
        const rect = canvas.getBoundingClientRect();
        lastPos = {
          x: (e.clientX - rect.left) * (W / rect.width),
          y: (e.clientY - rect.top) * (H / rect.height)
        };
      }, { signal });

      window.addEventListener('pointerup', () => {
        isDown = false;
        lastPos = null;
      }, { signal });

      canvas.addEventListener('pointermove', (e) => {
        if (!isDown || !lastPos) return;
        const rect = canvas.getBoundingClientRect();
        const curX = (e.clientX - rect.left) * (W / rect.width);
        const curY = (e.clientY - rect.top) * (H / rect.height);
        const dy = curY - lastPos.y;
        const dx = curX - lastPos.x;

        // Deslize de cima para baixo predominante (dy > 18 e dy > 1.5 * |dx|)
        if (dy > 18 && dy > 1.5 * Math.abs(dx)) {
          const colIdx = Math.floor(curX / colWidth);
          if (colIdx >= 0 && colIdx < numCols && !shredded[colIdx]) {
            shredded[colIdx] = true;
            this._shake(6);
            try { getAudio().playSlashSound?.(); } catch(err) {}
          }
        }
        lastPos = { x: curX, y: curY };
      }, { signal });

      const startTime = performance.now();
      let done = false;

      const loop = (now) => {
        if (done) return;
        const elapsed = now - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = `${remaining.toFixed(1)}s`;

        // Render: fundo de vácuo negro estrelado por trás
        ctx.fillStyle = '#000002';
        ctx.fillRect(0, 0, W, H);

        // Estrelas que aparecem no vácuo
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 30; i++) {
          const sx = (i * 73) % W;
          const sy = (i * 47) % H;
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Cada coluna não rasgada é desenhada como tela CRT laranja sólida
        for (let c = 0; c < numCols; c++) {
          const cx = c * colWidth;
          if (!shredded[c]) {
            ctx.fillStyle = '#100600';
            ctx.fillRect(cx, 0, colWidth, H);
            ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx, 0, colWidth, H);

            // Linhas horizontais CRT laranja
            ctx.fillStyle = 'rgba(255, 140, 0, 0.12)';
            for (let y = 0; y < H; y += 8) {
              ctx.fillRect(cx, y, colWidth, 2);
            }
          } else {
            // Coluna rasgada: bordas de corte com faíscas elétricas
            ctx.strokeStyle = '#ff8c00';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff8c00';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
            ctx.moveTo(cx + colWidth, 0); ctx.lineTo(cx + colWidth, H);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Progresso de destruição
        const shreddedCount = shredded.filter(Boolean).length;
        const coverage = shreddedCount / numCols;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(50, H - 35, W - 100, 14);
        ctx.strokeStyle = '#ff8c00';
        ctx.strokeRect(50, H - 35, W - 100, 14);
        ctx.fillStyle = coverage >= 0.7 ? '#00ff88' : '#ff8c00';
        ctx.fillRect(52, H - 33, (W - 104) * coverage, 10);

        if (coverage >= 1.0 || elapsed >= duration) {
          done = true;
          abortCtrl.abort();
          this._stop();
          const won = coverage >= 0.7;
          const score = coverage;
          this._showResult(canvas, won, won ? 'QUARTA PAREDE RASGADA COM SUCESSO!' : 'RASGO INSUFICIENTE!');
          setTimeout(() => resolve({ won, score }), 950);
          return;
        }

        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    });
  }

  // ═══════════════════════════════════════════════════════════════════

  // ===================================================================
  // NIVEL 3: FINALIZADOR SUPREMO COMBINADO (SEQUENCIA L1 + L2)
  // Consome toda a energia do robo e combina o teste de esquiva tatica
  // com a mecanica interativa do robo com 60% menos obstaculos.
  // ===================================================================
  async _chainedFinisher(color, name, finisherId = '') {
    const norm = (String(name) + ' ' + String(finisherId)).toLowerCase();
    let rKey = 'DB';
    if (norm.includes('cow') || norm.includes('bovine') || norm.includes('cp')) rKey = 'CP';
    else if (norm.includes('pen') || norm.includes('avalanche') || norm.includes('hee') || norm.includes('pl')) rKey = 'PL';
    else if (norm.includes('pava') || norm.includes('prism') || norm.includes('laser') || norm.includes('rainbow') || norm.includes('pb')) rKey = 'PB';
    else if (norm.includes('tiger') || norm.includes('thunder') || norm.includes('tv')) rKey = 'TV';

    // Banner de Iniciacao do Finalizador
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '<div class="vmg-wrap" style="max-width: 560px; text-align: center; border-color: #ffd700; box-shadow: 0 0 60px rgba(255, 215, 0, 0.45); padding: 30px 20px; font-family: \'Share Tech Mono\', monospace; background: rgba(5, 10, 8, 0.96);"><div style="font-size: 0.85rem; color: #ff3344; font-weight: 900; letter-spacing: 2px;">// SOBRECARGA MAXIMA DE ENERGIA //</div><h2 style="color: #ffd700; margin: 10px 0; font-size: 1.6rem; letter-spacing: 2px; text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);">[ FINALIZADOR SUPREMO ]</h2><p style="color: var(--term-fg); font-size: 0.95rem; margin-bottom: 6px;">EXECUCAO EM CADEIA: ESQUIVA TATICA + GOLPE DE ALTA POTENCIA!</p><span style="font-size: 0.8rem; color: #00ff66;">(Densidade de obstaculos calibrada em -60%)</span></div>';
    await new Promise(r => setTimeout(r, 1400));

    // Fase 1: Esquiva do Robo
    let res1;
    const tag1 = name + ' [FASE 1/2]';
    switch (rKey) {
      case 'CP': res1 = await this._cpDodge(color, tag1, { isFinisher: true }); break;
      case 'PL': res1 = await this._plDodge(color, tag1, { isFinisher: true }); break;
      case 'PB': res1 = await this._pbDodge(color, tag1, { isFinisher: true }); break;
      case 'TV': res1 = await this._tvDodge(color, tag1, { isFinisher: true }); break;
      default:   res1 = await this._dbDodge(color, tag1, { isFinisher: true }); break;
    }
    const s1 = typeof res1 === 'number' ? res1 : (res1 && typeof res1.score === 'number' ? res1.score : (res1 && res1.won ? 1.0 : 0.0));

    // Fase 2: Point-and-Click do Robo
    let res2;
    const tag2 = name + ' [FASE 2/2]';
    switch (rKey) {
      case 'CP': res2 = await this._cpLasso(color, tag2, { isFinisher: true }); break;
      case 'PL': res2 = await this._plSequence(color, tag2, { isFinisher: true }); break;
      case 'PB': res2 = await this._pbPrism(color, tag2, { isFinisher: true }); break;
      case 'TV': res2 = await this._tvSlash(color, tag2, { isFinisher: true }); break;
      default:   res2 = await this._dbBite(color, tag2, { isFinisher: true }); break;
    }
    const s2 = typeof res2 === 'number' ? res2 : (res2 && typeof res2.score === 'number' ? res2.score : (res2 && res2.won ? 1.0 : 0.0));

    const combinedScore = Number(((s1 + s2) / 2).toFixed(2));
    const won = combinedScore >= 0.50;
    return { won, score: combinedScore };
  }
}
