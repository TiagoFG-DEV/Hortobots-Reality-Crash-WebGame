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
  // L1 MINIGAMES — Mouse / Click
  // ════════════════════════════════════════════════════════════════

  // L1-DB: Prompts de terminal que precisam ser fechados antes de sumirem (EXPURGO TÉRMICO)
  _clickTargets(color, name) {
    return new Promise(resolve => {
      const duration = 6500;
      const needed = 8;
      let clicked = 0;
      let timeLeft = duration / 1000;

      this.overlay.innerHTML = this._buildMgLayout(
        color,
        name,
        'EXPURGO TÉRMICO',
        'CLIQUE RAPIDAMENTE NOS 8 ALERTAS DO KERNEL ANTES DO OVERFLOW',
        duration
      );
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');
      const scoreEl = this.overlay.querySelector('.vmg-score');

      const targets = [];
      const promptTitles = [
        'WARN: CPU_PEAK',
        'OVERFLOW 0x7F',
        'KERNEL_PANIC',
        'VOLT_SPIKE',
        'SIGKILL #409',
        'MEM_LEAK 0xEE'
      ];

      const spawnTarget = () => {
        const pw = 164;
        const ph = 66;
        targets.push({
          x: 20 + Math.random() * (W - pw - 40),
          y: 20 + Math.random() * (H - ph - 40),
          w: pw,
          h: ph,
          title: promptTitles[Math.floor(Math.random() * promptTitles.length)],
          life: 1.0,
          decay: 0.007 + Math.random() * 0.004,
          clicked: false,
        });
      };

      for (let i = 0; i < 2; i++) spawnTarget();
      const spawnInterval = setInterval(() => {
        if (targets.filter(t => !t.clicked).length < 3) spawnTarget();
      }, 1000);

      const debris = [];

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        targets.forEach(t => {
          if (!t.clicked && mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
            t.clicked = true;
            clicked++;
            if (scoreEl) scoreEl.textContent = `${clicked}/${needed}`;

            // SHAKE DA CÂMERA INTENSO!
            this._shake(12);
            getAudio().playKeyClack();

            // Estilhaços de código e glitch
            for (let d = 0; d < 16; d++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = Math.random() * 5 + 2;
              debris.push({
                x: t.x + t.w / 2,
                y: t.y + t.h / 2,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                text: ['0x00', 'KILL', '01', 'HALT', 'SIGTERM', '0xFF'][Math.floor(Math.random() * 6)],
                color: color || '#ff3344',
                life: 1.0,
                decay: 0.04
              });
            }
          }
        });
      });

      const start = performance.now();
      let done = false;

      const loop = () => {
        if (done) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Fundo CRT Terminal escuro
        ctx.fillStyle = '#03070d';
        ctx.fillRect(0, 0, W, H);

        // Grade de fósforo suave
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Scanline horizontal em movimento
        const scanY = (elapsed * 0.15) % H;
        ctx.fillStyle = 'rgba(255, 80, 80, 0.06)';
        ctx.fillRect(0, scanY, W, 4);

        // Prompts de Alerta do Terminal
        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          if (!t.clicked) t.life -= t.decay;
          if (t.life <= 0 || (t.clicked && t.life <= 0)) {
            targets.splice(i, 1);
            continue;
          }

          if (t.clicked) continue;

          ctx.save();
          const pulse = Math.sin(elapsed * 0.015 + t.x) * 0.3 + 0.7;
          ctx.shadowColor = color || '#ff3344';
          ctx.shadowBlur = 14 * pulse;

          // Janela do Prompt
          ctx.fillStyle = 'rgba(12, 4, 6, 0.95)';
          ctx.strokeStyle = color || '#ff3344';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(t.x, t.y, t.w, t.h, 6);
          ctx.fill();
          ctx.stroke();

          // Barra Superior do Prompt
          ctx.fillStyle = color || '#ff3344';
          ctx.beginPath();
          ctx.roundRect(t.x, t.y, t.w, 20, [6, 6, 0, 0]);
          ctx.fill();

          // Título do Erro
          ctx.fillStyle = '#000';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`[!] ${t.title}`, t.x + 6, t.y + 14);

          // Botão Fechar [X]
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('[X]', t.x + t.w - 6, t.y + 14);

          // Mensagem
          ctx.fillStyle = '#ff8888';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('>> CLIQUE PARA FECHAR <<', t.x + t.w / 2, t.y + 38);

          // Barra de Contagem Regressiva
          const barW = (t.w - 16) * Math.max(0, t.life);
          ctx.fillStyle = t.life > 0.4 ? '#00ff88' : '#ff3344';
          ctx.fillRect(t.x + 8, t.y + t.h - 10, barW, 4);

          ctx.restore();
        }

        // Partículas de Glitch Debris
        for (let i = debris.length - 1; i >= 0; i--) {
          const p = debris[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          if (p.life <= 0) {
            debris.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.font = 'bold 11px monospace';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        }

        if (clicked >= needed || timeLeft <= 0) {
          done = true;
          clearInterval(spawnInterval);
          this._stop();
          const success = clicked >= needed;
          if (success) this._shake(16);
          this._showResult(canvas, success, success ? 'PROCESSO ESTABILIZADO // KERNEL RESFRIADO!' : 'TEMPO ESGOTADO // KERNEL OVERFLOW!');
          setTimeout(() => resolve(success), 900);
        }
      };
      loop();
    });
  }

  // L1-PL: Drag cursor along ice path (CONDUTOR CRIOGÊNICO)
  _swipePath(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(
        color,
        name,
        'CONDUTOR CRIOGÊNICO',
        'CONDUZA O SINAL DE GELO PELO CONDUTOR ÓPTICO SEM ESCAPAR DO TRAÇO!',
        8000
      );
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const pts = [];
      const numPts = 8;
      for (let i = 0; i < numPts; i++) {
        pts.push({
          x: 60 + i * ((W - 120) / (numPts - 1)),
          y: H / 2 + Math.sin(i * 0.9) * 80,
        });
      }

      let cursor = { x: pts[0].x, y: pts[0].y };
      let progress = 0;
      let dragging = false;
      let missed = false;
      let done = false;
      const sparks = [];
      const start = performance.now();
      const duration = 8000;

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      const onMove = (e) => {
        if (!dragging) return;
        const pos = getPos(e);
        cursor = pos;

        // Adiciona faíscas de gelo e plasma ao longo do arrasto
        for (let s = 0; s < 3; s++) {
          sparks.push({
            x: cursor.x,
            y: cursor.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: Math.random() > 0.5 ? '#00e5ff' : '#ffffff'
          });
        }

        // Checa distância do condutor
        for (let i = 0; i < pts.length - 1; i++) {
          const pct = i / (pts.length - 1);
          if (pct >= progress) {
            const d = this._distToSeg(cursor, pts[i], pts[i + 1]);
            if (d < 28) {
              progress = Math.max(progress, (i + 1) / (pts.length - 1));
            } else if (d > 45) {
              missed = true;
              this._shake(10);
              getAudio().playAccessDenied();
            }
          }
        }
      };

      canvas.addEventListener('mousedown', (e) => { dragging = true; cursor = getPos(e); getAudio().playKeyClack(); });
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseup', () => { dragging = false; });

      const loop = () => {
        if (done) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        ctx.fillStyle = '#02070f';
        ctx.fillRect(0, 0, W, H);

        // Grade cibernética sutil
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Traço do circuito óptico (fundo)
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.lineWidth = 22;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Porção percorrida congelada com neon intenso
        const splitIdx = Math.floor(progress * (pts.length - 1));
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 18;
        ctx.beginPath();
        for (let i = 0; i <= splitIdx && i < pts.length; i++) {
          i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Faíscas de gelo/plasma
        for (let s = sparks.length - 1; s >= 0; s--) {
          const sp = sparks[s];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= 0.05;
          if (sp.life <= 0) { sparks.splice(s, 1); continue; }
          ctx.save();
          ctx.globalAlpha = sp.life;
          ctx.fillStyle = sp.color;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Ponto condutor do cursor
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Barra de progresso inferior
        ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.fillRect(20, H - 18, (W - 40) * progress, 8);

        const success = progress >= 0.95 && !missed;
        if (success || missed || timeLeft <= 0) {
          done = true;
          this._stop();
          if (success) this._shake(16);
          this._showResult(canvas, !missed && progress >= 0.95, !missed && progress >= 0.95 ? 'SINAL TRANSMITIDO // CONDUTOR ATIVO!' : 'DESVIO DETECTADO // PERDA DE SINAL!');
          setTimeout(() => resolve(!missed && progress >= 0.95), 900);
        }
      };
      loop();
    });
  }

  // L1-CP: Sincronizador de Nós de Osciloscópio (LAÇO CIRCULAR)
  _circleClick(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(
        color,
        name,
        'SINCRONIZADOR DE NÓS',
        'CLIQUE NOS 8 NÓS DO CIRCUITO EM ORDEM NUMÉRICA (1 A 8)',
        6000
      );
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');
      const scoreEl = this.overlay.querySelector('.vmg-score');

      const numPts = 8;
      const pts = [];
      const cx = W / 2, cy = H / 2;
      const radius = 108;
      for (let i = 0; i < numPts; i++) {
        const a = (i / numPts) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, done: false, index: i });
      }

      let nextIdx = 0;
      let errors = 0;
      let done = false;
      const ripples = [];
      const start = performance.now();
      const duration = 6000;

      canvas.addEventListener('click', (e) => {
        if (done) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        const clicked = pts.find(p => !p.done && Math.hypot(mx - p.x, my - p.y) < 30);
        if (clicked) {
          if (clicked.index === nextIdx) {
            clicked.done = true;
            nextIdx++;
            if (scoreEl) scoreEl.textContent = `${nextIdx}/${numPts}`;

            // SHAKE DA CÂMERA & ÁUDIO
            this._shake(8);
            getAudio().playKeyClack();

            // Ripple de onda do osciloscópio
            ripples.push({ x: clicked.x, y: clicked.y, r: 10, maxR: 50, color: '#00ff88', life: 1.0 });
          } else {
            errors++;
            this._shake(12);
            getAudio().playAccessDenied();
            ripples.push({ x: clicked.x, y: clicked.y, r: 10, maxR: 45, color: '#ff3344', life: 1.0 });
          }
        }
      });

      const loop = () => {
        if (done) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const t = elapsed / 1000;
        const timeLeft = Math.max(0, (duration / 1000) - t);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        ctx.fillStyle = '#03070d';
        ctx.fillRect(0, 0, W, H);

        // Grid circular do osciloscópio
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
        ctx.lineWidth = 1;
        for (let r = 35; r <= radius + 35; r += 35) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius - 40); ctx.lineTo(cx, cy + radius + 40);
        ctx.moveTo(cx - radius - 40, cy); ctx.lineTo(cx + radius + 40, cy);
        ctx.stroke();

        // Feixe giratório de varredura radar
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 2.2);
        const grad = ctx.createLinearGradient(0, 0, radius + 30, 0);
        grad.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
        grad.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius + 30, -0.25, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Linhas de conexão entre nós ativados
        if (nextIdx > 0) {
          ctx.strokeStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < nextIdx; i++) {
            i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Ripples
        for (let r = ripples.length - 1; r >= 0; r--) {
          const rip = ripples[r];
          rip.r += 2.5;
          rip.life -= 0.04;
          if (rip.life <= 0) { ripples.splice(r, 1); continue; }
          ctx.save();
          ctx.globalAlpha = rip.life;
          ctx.strokeStyle = rip.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Renderiza nós
        pts.forEach((p, i) => {
          const isNext = i === nextIdx;
          const isDone = p.done;
          ctx.save();
          ctx.shadowColor = isDone ? '#00ff88' : isNext ? '#ffd700' : 'rgba(255,255,255,0.3)';
          ctx.shadowBlur = isNext ? 22 : isDone ? 14 : 6;
          ctx.fillStyle = isDone ? 'rgba(0, 255, 136, 0.9)' : isNext ? 'rgba(255, 215, 0, 0.9)' : 'rgba(20, 30, 40, 0.8)';
          ctx.strokeStyle = isDone ? '#00ff88' : isNext ? '#ffd700' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isNext ? 18 : 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isDone || isNext ? '#000' : '#fff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`0${i + 1}`, p.x, p.y);
          ctx.restore();
        });

        // Contagem de erros
        if (errors > 0) {
          ctx.fillStyle = '#ff3344';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`[!] FALHAS: ${errors}/3`, 20, 30);
        }

        const success = nextIdx >= numPts && errors < 3;
        if (success || errors >= 3 || timeLeft <= 0) {
          done = true;
          this._stop();
          const won = nextIdx >= numPts && errors < 3;
          if (won) this._shake(16);
          this._showResult(canvas, won, won ? 'FREQUÊNCIA SINCRONIZADA!' : errors >= 3 ? 'INTERFERÊNCIA CRÍTICA!' : 'TEMPO ESGOTADO!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // L1-PB: Click mirrors in order to redirect light
  _mirrorSequence(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(color, name, 'REFLEXO PRISMÁTICO', 'Clique os espelhos na ordem correta!', 6000);
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const numMirrors = 5;
      const seq = Array.from({ length: numMirrors }, (_, i) => i);
      // Shuffle sequence
      const order = [...seq].sort(() => Math.random() - 0.5);
      const mirrors = seq.map((_, i) => ({
        x: 60 + i * ((W - 120) / (numMirrors - 1)),
        y: H / 2 + (Math.random() - 0.5) * 100,
        order: order[i],
        done: false,
      }));
      mirrors.sort((a, b) => a.x - b.x);

      let nextOrder = 0;
      let done = false;
      let errors = 0;
      const start = performance.now();
      const duration = 6000;

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);

        mirrors.forEach(m => {
          if (!m.done && Math.hypot(mx - m.x, my - m.y) < 30) {
            if (m.order === nextOrder) {
              m.done = true;
              nextOrder++;
            } else {
              errors++;
            }
          }
        });
      });

      const loop = () => {
        if (done) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        ctx.fillStyle = '#050a15';
        ctx.fillRect(0, 0, W, H);

        // Light beam
        const doneMirrors = mirrors.filter(m => m.done).sort((a, b) => a.order - b.order);
        if (doneMirrors.length > 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, H / 2);
          doneMirrors.forEach(m => ctx.lineTo(m.x, m.y));
          if (doneMirrors.length === numMirrors) ctx.lineTo(W, H / 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        mirrors.forEach(m => {
          const isNext = m.order === nextOrder;
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(Math.PI / 4); // 45 degrees
          const col = m.done ? '#00ff88' : isNext ? color : 'rgba(180,180,180,0.5)';
          ctx.shadowColor = col;
          ctx.shadowBlur = isNext ? 20 : 5;
          ctx.fillStyle = col;
          ctx.fillRect(-15, -4, 30, 8);
          ctx.restore();

          // Order number
          ctx.fillStyle = m.done ? '#00ff88' : '#fff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(m.order + 1, m.x, m.y + 28);
        });

        const won = nextOrder >= numMirrors && errors < 2;
        if (won || errors >= 2 || timeLeft <= 0) {
          done = true;
          this._stop();
          const success = nextOrder >= numMirrors && errors < 2;
          this._showResult(canvas, success, success ? 'LUZ ALINHADA!' : 'Sequência errada!');
          setTimeout(() => resolve(success), 900);
        }
      };
      loop();
    });
  }

  // L1-TV: Slash — click and drag over lines (LÂMINA DE DADOS // CORTE DE BARRAMENTO)
  _slashDraw(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(
        color,
        name,
        'LÂMINA DE DADOS',
        'CORTE OS CABOS DO BARRAMENTO CORROMPIDO DESLIZANDO O CURSOR DE PLASMA!',
        6500
      );
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');
      const scoreEl = this.overlay.querySelector('.vmg-score');

      const lines = [];
      for (let i = 0; i < 5; i++) {
        const y = 65 + i * ((H - 130) / 4);
        lines.push({ x1: 50, y1: y, x2: W - 50, y2: y + (Math.random() - 0.5) * 50, cut: false });
      }

      let dragging = false;
      let trail = [];
      const sparks = [];

      canvas.addEventListener('mousedown', (e) => {
        dragging = true;
        trail = [];
        getAudio().playKeyClack();
      });

      canvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);
        trail.push({ x: mx, y: my });

        // Adiciona partículas do rastro de plasma
        for (let p = 0; p < 2; p++) {
          sparks.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 1.0,
            color: '#ffd700'
          });
        }

        if (trail.length > 2) {
          const a = trail[trail.length - 2], b = trail[trail.length - 1];
          lines.forEach(l => {
            if (!l.cut && this._segmentsIntersect(a, b, { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 })) {
              l.cut = true;
              this._shake(10);
              getAudio().playKeyClack();

              const cx = (a.x + b.x) / 2;
              const cy = (a.y + b.y) / 2;
              for (let s = 0; s < 18; s++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = Math.random() * 6 + 2;
                sparks.push({
                  x: cx,
                  y: cy,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  life: 1.0,
                  color: Math.random() > 0.4 ? '#00ff88' : '#ff3344'
                });
              }
            }
          });
        }
      });

      canvas.addEventListener('mouseup', () => { dragging = false; trail = []; });

      let done = false;
      const start = performance.now();
      const duration = 6500;

      const loop = () => {
        if (done) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        ctx.fillStyle = '#02060c';
        ctx.fillRect(0, 0, W, H);

        const cutCount = lines.filter(l => l.cut).length;
        if (scoreEl) scoreEl.textContent = `${cutCount}/${lines.length}`;

        // Desenha os cabos de barramento
        lines.forEach((l, idx) => {
          ctx.save();
          ctx.strokeStyle = l.cut ? 'rgba(255, 51, 68, 0.4)' : color;
          ctx.shadowColor = l.cut ? 'transparent' : color;
          ctx.shadowBlur = l.cut ? 0 : 16;
          ctx.lineWidth = l.cut ? 2 : 5;
          ctx.setLineDash(l.cut ? [6, 6] : []);
          ctx.beginPath();
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Terminais do cabo
          ctx.fillStyle = l.cut ? '#ff3344' : '#ffd700';
          ctx.beginPath();
          ctx.arc(l.x1, l.y1, 6, 0, Math.PI * 2);
          ctx.arc(l.x2, l.y2, 6, 0, Math.PI * 2);
          ctx.fill();

          if (l.cut) {
            const mx = (l.x1 + l.x2) / 2, my = (l.y1 + l.y2) / 2;
            ctx.fillStyle = '#ff3344';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[SEVERADO]', mx, my - 8);
          }
          ctx.restore();
        });

        // Faíscas
        for (let s = sparks.length - 1; s >= 0; s--) {
          const sp = sparks[s];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.life -= 0.05;
          if (sp.life <= 0) { sparks.splice(s, 1); continue; }
          ctx.save();
          ctx.globalAlpha = sp.life;
          ctx.fillStyle = sp.color;
          ctx.shadowColor = sp.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Rastro de lâmina de plasma neon
        if (trail.length > 1) {
          ctx.save();
          ctx.strokeStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 4;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          trail.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.stroke();
          ctx.restore();
        }

        const won = cutCount >= lines.length;
        if (won || timeLeft <= 0) {
          done = true;
          this._stop();
          if (won) this._shake(16);
          this._showResult(canvas, won, won ? 'CABOS SEVERADOS COM SUCESSO!' : 'FALHA! CABOS CORROMPIDOS RESTANTES!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // ════════════════════════════════════════════════════════════════
  // L2 MINIGAMES — Keyboard / QTE
  // ════════════════════════════════════════════════════════════════

  // L2-DB: Arrow QTE sequence (INJEÇÃO DE BARRAMENTO)
  _arrowQTE(color, name) {
    return new Promise(resolve => {
      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const wasdMap = { KeyW: 'ArrowUp', KeyS: 'ArrowDown', KeyA: 'ArrowLeft', KeyD: 'ArrowRight' };
      const arrowSymbols = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
      const seq = Array.from({ length: 8 }, () => arrows[Math.floor(Math.random() * 4)]);
      let step = 0;
      let errors = 0;
      let done = false;

      this.overlay.innerHTML = `
        <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
          <div class="vmg-header" style="color:${color}">
            <span>[ ${name.toUpperCase()} // INJEÇÃO DE BARRAMENTO ]</span>
            <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">QTE-INJECTOR</span>
          </div>
          <div class="vmg-command-badge" style="background: rgba(255, 215, 0, 0.12); border: 1px solid #ffd700; color: #ffd700; padding: 6px 12px; font-weight: 900; font-size: 0.92rem; text-shadow: 0 0 10px #ffd700; text-align: center; margin: 4px 0 8px 0; border-radius: 4px; letter-spacing: 1px;">
            // COMANDO: DIGITE A SEQUÊNCIA DE 8 COMANDOS [WASD] OU SETAS //
          </div>
          <div class="vmg-qte-display" id="vmgQteDisplay"></div>
          <div class="vmg-qte-progress" id="vmgQteProgress"></div>
          <div id="vmgQteResult" class="vmg-result-inline"></div>
        </div>
      `;

      const displayEl = document.getElementById('vmgQteDisplay');
      const progressEl = document.getElementById('vmgQteProgress');
      const resultEl = document.getElementById('vmgQteResult');

      const render = () => {
        displayEl.innerHTML = seq.map((a, i) => {
          const cls = i < step ? 'qte-done' : i === step ? 'qte-active' : 'qte-pending';
          return `<span class="qte-arrow ${cls}" style="${i === step ? `border-color:${color};color:${color};text-shadow:0 0 20px ${color}` : ''}">${arrowSymbols[a]}</span>`;
        }).join('');
        progressEl.style.background = `linear-gradient(90deg, ${color} ${(step / seq.length) * 100}%, rgba(255,255,255,0.1) 0%)`;
      };
      render();

      const handler = (e) => {
        if (done) return;
        const mappedCode = wasdMap[e.code] || e.code;
        if (!arrows.includes(mappedCode)) return;
        e.preventDefault();

        if (mappedCode === seq[step]) {
          step++;
          this._shake(6);
          getAudio().playKeyClack();

          if (step >= seq.length) {
            done = true;
            document.removeEventListener('keydown', handler);
            this._shake(14);
            getAudio().playPowerUp();
            resultEl.innerHTML = `<span style="color:#00ff88;font-size:1.4rem;font-weight:900">[SUCESSO] BARRAMENTO INJETADO!</span>`;
            setTimeout(() => resolve(true), 800);
          }
        } else {
          errors++;
          this._shake(12);
          getAudio().playAccessDenied();
          const el = displayEl.querySelectorAll('.qte-arrow')[step];
          if (el) { el.style.color = '#ff3344'; setTimeout(() => render(), 200); }
          if (errors >= 2) {
            done = true;
            document.removeEventListener('keydown', handler);
            resultEl.innerHTML = `<span style="color:#ff3344;font-size:1.4rem;font-weight:900">[FALHA] FALHA NA INJEÇÃO!</span>`;
            setTimeout(() => resolve(false), 800);
          }
        }
        render();
      };
      document.addEventListener('keydown', handler);

      setTimeout(() => {
        if (!done) {
          done = true;
          document.removeEventListener('keydown', handler);
          resolve(step >= seq.length);
        }
      }, 9000);
    });
  }

  // L2-PL: Typing sprint (COMBO GLACIAR - TERMINAL SHELL)
  _typingSprint(color, name) {
    return new Promise(resolve => {
      const words = ['KERNEL_OVERFLOW', 'KILL_PROCESS_9', 'CHMOD_777_ROOT', 'SSH_DECRYPT_KEY', 'DISABLE_FIREWALL', 'PURGE_CACHE_ALL'];
      const target = words[Math.floor(Math.random() * words.length)];
      const timeLimit = 4500;
      let done = false;

      this.overlay.innerHTML = `
        <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
          <div class="vmg-header" style="color:${color}">
            <span>[ ${name.toUpperCase()} // PROMPT DE COMANDO ]</span>
            <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">SHELL-SPRINT</span>
          </div>
          <div class="vmg-command-badge" style="background: rgba(255, 215, 0, 0.12); border: 1px solid #ffd700; color: #ffd700; padding: 6px 12px; font-weight: 900; font-size: 0.92rem; text-shadow: 0 0 10px #ffd700; text-align: center; margin: 4px 0 8px 0; border-radius: 4px; letter-spacing: 1px;">
            // COMANDO: DIGITE O CÓDIGO DO TERMINAL EXATAMENTE COMO EXIBIDO //
          </div>
          <div style="font-family:monospace;font-size:0.85rem;color:rgba(255,255,255,0.6);margin-bottom:6px;">
            root@penlinux:~$ <span style="color:${color};font-weight:bold;">EXECUTE_PAYLOAD</span>
          </div>
          <div class="vmg-typing-target" id="vmgTypingTarget" style="letter-spacing:5px;">${target}</div>
          <input class="vmg-typing-input" id="vmgTypingInput" autocomplete="off" spellcheck="false" maxlength="${target.length}" placeholder="DIGITE AQUI..." style="border-color:${color};" />
          <div class="vmg-timer-bar" id="vmgTimerBar" style="background:${color};box-shadow:0 0 15px ${color};"></div>
          <div id="vmgTypingResult" class="vmg-result-inline"></div>
        </div>
      `;

      const input = document.getElementById('vmgTypingInput');
      const bar = document.getElementById('vmgTimerBar');
      const targetEl = document.getElementById('vmgTypingTarget');
      const resultEl = document.getElementById('vmgTypingResult');
      input.focus();

      const start = performance.now();

      input.addEventListener('input', () => {
        if (done) return;
        const val = input.value.toUpperCase();
        this._shake(2);
        getAudio().playKeyClack();

        targetEl.innerHTML = target.split('').map((ch, i) => {
          const typed = val[i];
          if (!typed) return `<span>${ch}</span>`;
          return `<span style="color:${typed === ch ? '#00ff88' : '#ff3344'};text-shadow:0 0 10px ${typed === ch ? '#00ff88' : '#ff3344'};">${ch}</span>`;
        }).join('');

        if (val === target) {
          done = true;
          this._shake(14);
          getAudio().playPowerUp();
          resultEl.innerHTML = `<span style="color:#00ff88;font-size:1.4rem;font-weight:900">[SUCESSO] COMANDO EXECUTADO COM SUCESSO!</span>`;
          setTimeout(() => resolve(true), 600);
        }
      });

      const interval = setInterval(() => {
        const elapsed = performance.now() - start;
        const pct = Math.max(0, 1 - elapsed / timeLimit);
        if (bar) bar.style.width = `${pct * 100}%`;
        if (elapsed >= timeLimit && !done) {
          done = true;
          clearInterval(interval);
          const val = (input.value || '').toUpperCase();
          const success = val === target;
          if (success) {
            this._shake(14);
            getAudio().playPowerUp();
          } else {
            this._shake(12);
            getAudio().playAccessDenied();
          }
          resultEl.innerHTML = `<span style="color:${success ? '#00ff88' : '#ff3344'};font-size:1.2rem">${success ? '[SUCESSO] COMANDO EXECUTADO!' : '[FALHA] TEMPO ESGOTADO!'}</span>`;
          setTimeout(() => resolve(success), 600);
        }
      }, 50);
    });
  }

  // L2-CP: Dual simultaneous keys (CÓDIGO DO XERIFE - CHAVE DUPLA)
  _dualKeys(color, name) {
    return new Promise(resolve => {
      const combos = [
        ['ShiftLeft', 'KeyA', 'SHIFT + A'],
        ['ControlLeft', 'KeyD', 'CTRL + D'],
        ['ShiftLeft', 'KeyS', 'SHIFT + S'],
        ['AltLeft', 'KeyW', 'ALT + W'],
        ['ControlLeft', 'KeyZ', 'CTRL + Z'],
      ];
      const seq = Array.from({ length: 5 }, () => combos[Math.floor(Math.random() * combos.length)]);
      let step = 0;
      let done = false;
      const held = new Set();

      this.overlay.innerHTML = `
        <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
          <div class="vmg-header" style="color:${color}">
            <span>[ ${name.toUpperCase()} // CHAVE DE AUTORIZAÇÃO DUPLA ]</span>
            <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">DUAL-LOCK</span>
          </div>
          <div class="vmg-command-badge" style="background: rgba(255, 215, 0, 0.12); border: 1px solid #ffd700; color: #ffd700; padding: 6px 12px; font-weight: 900; font-size: 0.92rem; text-shadow: 0 0 10px #ffd700; text-align: center; margin: 4px 0 8px 0; border-radius: 4px; letter-spacing: 1px;">
            // COMANDO: PRESSIONE AS 5 COMBINAÇÕES DUPLAS SIMULTANEAMENTE //
          </div>
          <div class="vmg-dual-display" id="vmgDualDisplay"></div>
          <div id="vmgDualProgress" class="vmg-qte-progress"></div>
          <div id="vmgDualResult" class="vmg-result-inline"></div>
        </div>
      `;

      const displayEl = document.getElementById('vmgDualDisplay');
      const progressEl = document.getElementById('vmgDualProgress');
      const resultEl = document.getElementById('vmgDualResult');

      const render = () => {
        const c = seq[step];
        displayEl.innerHTML = `
          <div class="dual-key-pair">
            <span class="key-badge" style="border-color:${color};box-shadow:0 0 25px ${color}44;">${c[2].split('+')[0].trim()}</span>
            <span class="key-plus" style="color:${color};">⚡</span>
            <span class="key-badge" style="border-color:${color};box-shadow:0 0 25px ${color}44;">${c[2].split('+')[1].trim()}</span>
          </div>
          <div style="color:#ffd700;margin-top:12px;font-weight:bold;letter-spacing:1px;">FASE: ${step + 1} / ${seq.length}</div>
        `;
        progressEl.style.background = `linear-gradient(90deg, ${color} ${(step / seq.length) * 100}%, rgba(255,255,255,0.1) 0%)`;
      };
      render();

      const check = () => {
        const [k1, k2] = seq[step];
        if (held.has(k1) && held.has(k2)) {
          step++;
          this._shake(10);
          getAudio().playKeyClack();

          if (step >= seq.length) {
            done = true;
            document.removeEventListener('keydown', onDown);
            document.removeEventListener('keyup', onUp);
            this._shake(16);
            getAudio().playPowerUp();
            resultEl.innerHTML = `<span style="color:#00ff88;font-size:1.4rem;font-weight:900">[SUCESSO] AUTORIZAÇÃO CONCEDIDA!</span>`;
            setTimeout(() => resolve(true), 800);
          } else {
            render();
          }
        }
      };

      const onDown = (e) => { if (!done) { held.add(e.code); check(); } };
      const onUp = (e) => held.delete(e.code);
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);

      setTimeout(() => {
        if (!done) {
          done = true;
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
          resolve(step >= seq.length);
        }
      }, 12000);
    });
  }

  // L2-PB: Reaction test (TESTE DE REFLEXO DO KERNEL)
  _reactionTest(color, name) {
    return new Promise(resolve => {
      let done = false;
      let litUp = false;
      let lightTime = null;
      const rounds = 2;
      let roundsDone = 0;
      let totalTime = 0;
      const threshold = 450; // ms

      this.overlay.innerHTML = `
        <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
          <div class="vmg-header" style="color:${color}">
            <span>[ ${name.toUpperCase()} // LATÊNCIA DE INTERRUPÇÃO IRQ ]</span>
            <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">KERNEL-LATENCY</span>
          </div>
          <div class="vmg-sub">CLIQUE OU PRESSIONE ESPAÇO ASSIM QUE O SINAL ACENDER EM VERDE! (${rounds}x)</div>
          <div class="vmg-reaction-pad" id="vmgReactionPad" style="height:140px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.15);border-radius:10px;background:#050811;cursor:pointer;transition:all 0.1s ease;">
            <div class="vmg-reaction-text" id="vmgReactionText" style="font-size:1.4rem;font-weight:900;letter-spacing:2px;color:rgba(255,255,255,0.4);">
              [ AGUARDE SINAL... NÃO CLIQUE ]
            </div>
          </div>
          <div id="vmgReactionResult" class="vmg-result-inline"></div>
        </div>
      `;

      const pad = document.getElementById('vmgReactionPad');
      const text = document.getElementById('vmgReactionText');
      const resultEl = document.getElementById('vmgReactionResult');

      const triggerLight = () => {
        const delay = 1200 + Math.random() * 2200;
        setTimeout(() => {
          if (done) return;
          litUp = true;
          lightTime = performance.now();
          pad.style.background = '#00ff88';
          pad.style.boxShadow = '0 0 50px #00ff88';
          pad.style.borderColor = '#ffffff';
          text.textContent = '>> CLIQUE AGORA! <<';
          text.style.color = '#000';

          setTimeout(() => {
            if (litUp && !done) {
              litUp = false;
              this._shake(10);
              getAudio().playAccessDenied();
              pad.style.background = '#1a0505';
              pad.style.boxShadow = 'none';
              pad.style.borderColor = '#ff3344';
              text.textContent = 'MUITO LENTO!';
              text.style.color = '#ff3344';
              totalTime += threshold + 200;
              roundsDone++;
              if (roundsDone >= rounds) finish();
              else setTimeout(triggerLight, 1200);
            }
          }, 700);
        }, delay);
      };

      const finish = () => {
        done = true;
        document.removeEventListener('keydown', onKey);
        pad.removeEventListener('click', onTrigger);
        const avgTime = totalTime / rounds;
        const won = avgTime < threshold;
        if (won) {
          this._shake(16);
          getAudio().playPowerUp();
        } else {
          this._shake(12);
          getAudio().playAccessDenied();
        }
        resultEl.innerHTML = `
          <span style="color:${won ? '#00ff88' : '#ff3344'};font-size:1.2rem;font-weight:900">
            ${won ? `[SUCESSO] LATÊNCIA ÓTIMA: ${Math.round(avgTime)}ms!` : `[FALHA] LATÊNCIA ALTA: ${Math.round(avgTime)}ms!`}
          </span>
        `;
        setTimeout(() => resolve(won), 900);
      };

      const onTrigger = () => {
        if (done) return;
        if (!litUp) {
          this._shake(6);
          getAudio().playAccessDenied();
          text.textContent = 'CEDO DEMAIS!';
          text.style.color = '#ff8800';
          return;
        }
        const reaction = performance.now() - lightTime;
        totalTime += reaction;
        litUp = false;
        this._shake(10);
        getAudio().playKeyClack();

        pad.style.background = '#0a1420';
        pad.style.boxShadow = 'none';
        pad.style.borderColor = 'rgba(255,255,255,0.2)';
        text.textContent = `LATÊNCIA: ${Math.round(reaction)}ms!`;
        text.style.color = reaction < threshold ? '#00ff88' : '#ffd700';
        roundsDone++;
        if (roundsDone >= rounds) finish();
        else setTimeout(triggerLight, 1200);
      };

      const onKey = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          onTrigger();
        }
      };

      document.addEventListener('keydown', onKey);
      pad.addEventListener('click', onTrigger);
      setTimeout(triggerLight, 800);
    });
  }

  // L2-TV: 5 arrows in 2.5 seconds (SEQUÊNCIA TESLA)
  _arrowSequence(color, name) {
    return new Promise(resolve => {
      const arrowsMap = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
      const wasdMap = { KeyW: 'ArrowUp', KeyS: 'ArrowDown', KeyA: 'ArrowLeft', KeyD: 'ArrowRight' };
      const keys = Object.keys(arrowsMap);
      const seq = Array.from({ length: 7 }, () => keys[Math.floor(Math.random() * 4)]);
      let step = 0;
      let done = false;

      this.overlay.innerHTML = `
        <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
          <div class="vmg-header" style="color:${color}">
            <span>[ ${name.toUpperCase()} // DESCARGA TESLA ]</span>
            <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">RAPID-DISCHARGE</span>
          </div>
          <div class="vmg-command-badge" style="background: rgba(255, 215, 0, 0.12); border: 1px solid #ffd700; color: #ffd700; padding: 6px 12px; font-weight: 900; font-size: 0.92rem; text-shadow: 0 0 10px #ffd700; text-align: center; margin: 4px 0 8px 0; border-radius: 4px; letter-spacing: 1px;">
            // COMANDO: DIGITE A SEQUÊNCIA DE 7 SETAS OU [WASD] ANTES DA BARRA ZERAR //
          </div>
          <div class="vmg-qte-display" id="vmgQteDisplay2"></div>
          <div class="vmg-timer-bar" id="vmgTimerBar2" style="background:${color};box-shadow:0 0 15px ${color};"></div>
          <div id="vmgSeqResult" class="vmg-result-inline"></div>
        </div>
      `;

      const displayEl = document.getElementById('vmgQteDisplay2');
      const bar = document.getElementById('vmgTimerBar2');
      const resultEl = document.getElementById('vmgSeqResult');

      const render = () => {
        displayEl.innerHTML = seq.map((k, i) => {
          const cls = i < step ? 'qte-done' : i === step ? 'qte-active' : 'qte-pending';
          return `<span class="qte-arrow ${cls}" style="${i === step ? `border-color:${color};color:${color};text-shadow:0 0 20px ${color}` : ''}">${arrowsMap[k]}</span>`;
        }).join('');
      };
      render();

      const start = performance.now();
      const timeLimit = 3500;
      const interval = setInterval(() => {
        const elapsed = performance.now() - start;
        const pct = Math.max(0, 1 - elapsed / timeLimit);
        if (bar) bar.style.width = `${pct * 100}%`;
        if (bar) bar.style.background = pct > 0.5 ? color : pct > 0.25 ? '#ffd700' : '#ff3344';
        if (elapsed >= timeLimit && !done) {
          done = true;
          clearInterval(interval);
          document.removeEventListener('keydown', handler);
          this._shake(12);
          getAudio().playAccessDenied();
          resultEl.innerHTML = `<span style="color:#ff3344;font-size:1.2rem">[FALHA] TEMPO ESGOTADO!</span>`;
          setTimeout(() => resolve(false), 600);
        }
      }, 50);

      const handler = (e) => {
        const mapped = wasdMap[e.code] || e.code;
        if (done || !keys.includes(mapped)) return;
        e.preventDefault();

        if (mapped === seq[step]) {
          step++;
          this._shake(6);
          getAudio().playKeyClack();

          if (step >= seq.length) {
            done = true;
            clearInterval(interval);
            document.removeEventListener('keydown', handler);
            this._shake(16);
            getAudio().playPowerUp();
            resultEl.innerHTML = `<span style="color:#00ff88;font-size:1.4rem;font-weight:900">[SUCESSO] DESCARGA CONCLUÍDA!</span>`;
            setTimeout(() => resolve(true), 600);
          }
        } else {
          this._shake(10);
          getAudio().playAccessDenied();
        }
        render();
      };
      document.addEventListener('keydown', handler);
    });
  }

  // ════════════════════════════════════════════════════════════════
  // L3 MINIGAMES — Bullet-Hell Undertale Style
  // ════════════════════════════════════════════════════════════════

  // L3-DB: Gravity dodge — fall with gravity, SPACE to jump
  _gravityDodge(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(
        color,
        name,
        'FIREWALL INFERNAL',
        'SALTE COM ESPAÇO OU CLIQUE DO MOUSE PARA DESVIAR DOS PACOTES CORROMPIDOS!',
        9000,
        true
      );
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const player = { x: 90, y: H / 2, vy: 0, r: 11, hp: 100, inv: 0 };
      const gravity = 0.38;
      const jumpForce = -7.8;
      const projectiles = [];
      const particles = [];
      let running = true;
      const start = performance.now();
      const duration = 9000;

      const jump = () => {
        if (!running) return;
        player.vy = jumpForce;
        this._shake(3);
        getAudio().playKeyClack();

        // Partículas de propulsão
        for (let p = 0; p < 6; p++) {
          particles.push({
            x: player.x - 4,
            y: player.y + 8,
            vx: -2 - Math.random() * 3,
            vy: 2 + Math.random() * 3,
            life: 1.0,
            color: '#ffd700'
          });
        }
      };

      const onKey = (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          jump();
        }
      };
      const onClick = () => jump();

      document.addEventListener('keydown', onKey);
      canvas.addEventListener('mousedown', onClick);

      let lastSpawn = 0;
      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Physics
        player.vy += gravity;
        player.y += player.vy;
        player.y = Math.max(player.r + 8, Math.min(H - player.r - 8, player.y));
        if (player.y <= player.r + 8 || player.y >= H - player.r - 8) player.vy = 0;
        if (player.inv > 0) player.inv--;

        // Spawn projéteis firewall
        if (elapsed - lastSpawn > 520) {
          lastSpawn = elapsed;
          const speed = 4 + elapsed / 4500;
          projectiles.push({
            x: W + 20,
            y: 35 + Math.random() * (H - 70),
            vx: -speed,
            w: 24,
            h: 12,
            color: '#ff3344'
          });
        }

        // Atualiza projéteis
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          if (p.x < -30) { projectiles.splice(i, 1); continue; }
          if (player.inv === 0 && Math.hypot(player.x - p.x, player.y - p.y) < player.r + 10) {
            player.hp -= 25;
            player.inv = 35;
            projectiles.splice(i, 1);
            this._shake(14);
            getAudio().playAccessDenied();
            for (let k = 0; k < 14; k++) {
              const a = Math.random() * Math.PI * 2;
              particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(a) * 4,
                vy: Math.sin(a) * 4,
                life: 1.0,
                color: '#ff3344'
              });
            }
          }
        }

        // Partículas
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].x += particles[i].vx;
          particles[i].y += particles[i].vy;
          particles[i].life -= 0.05;
          if (particles[i].life <= 0) particles.splice(i, 1);
        }

        // Render Fundo
        ctx.fillStyle = '#03070d';
        ctx.fillRect(0, 0, W, H);

        // Grade cibernética
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.06)';
        for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Linhas de choque de teto e chão
        ctx.fillStyle = '#ff3344';
        ctx.shadowColor = '#ff3344';
        ctx.shadowBlur = 12;
        ctx.fillRect(0, 0, W, 8);
        ctx.fillRect(0, H - 8, W, 8);
        ctx.shadowBlur = 0;

        // Projéteis (pacotes de vírus com rastro)
        projectiles.forEach(p => {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 4);
          ctx.fill();

          // Rastro do projétil
          ctx.fillStyle = 'rgba(255, 51, 68, 0.3)';
          ctx.fillRect(p.x + p.w / 2, p.y - 2, 20, 4);
          ctx.restore();
        });

        // Partículas
        particles.forEach(p => {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Player (Núcleo de dados com anel)
        ctx.save();
        ctx.globalAlpha = player.inv > 0 ? (Math.floor(player.inv / 4) % 2 === 0 ? 0.3 : 1) : 1;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Barra de Integridade do Núcleo
        const hpPct = Math.max(0, player.hp / 100);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(15, H - 24, 140, 10);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : hpPct > 0.25 ? '#ffd700' : '#ff3344';
        ctx.fillRect(15, H - 24, 140 * hpPct, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(15, H - 24, 140, 10);

        if (player.hp <= 0 || timeLeft <= 0) {
          running = false;
          document.removeEventListener('keydown', onKey);
          canvas.removeEventListener('mousedown', onClick);
          this._stop();
          const won = player.hp > 0;
          if (won) this._shake(16);
          this._showResult(canvas, won, won ? `FIREWALL ULTRAPASSADO! (${player.hp}HP RESTANTE)` : 'INTEGRIDADE DO NÚCLEO ZERADA!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // L3-PL: Platform dodge
  _platformDodge(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(color, name, 'BLIZZARD PLATAFORMA', 'Pule nas plataformas e colete gemas! WASD/Setas + ESPAÇO', 10000, true);
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const platforms = [
        { x: 0, y: H - 20, w: W, h: 20 },
        { x: 60, y: H - 100, w: 100, h: 12 },
        { x: 220, y: H - 160, w: 100, h: 12 },
        { x: 380, y: H - 120, w: 100, h: 12 },
        { x: 100, y: H - 220, w: 120, h: 12 },
        { x: 300, y: H - 250, w: 100, h: 12 },
      ];

      const gems = platforms.slice(1).map(p => ({
        x: p.x + p.w / 2, y: p.y - 20, r: 8, collected: false,
      }));

      const player = { x: 50, y: H - 60, vx: 0, vy: 0, w: 16, h: 16, onGround: false, hp: 100, inv: 0 };
      const keys = {};
      let collected = 0;
      const needed = gems.length;
      const projectiles = [];
      let lastSpawn = 0;
      let running = true;
      const start = performance.now();
      const duration = 10000;

      const onDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); };
      const onUp = (e) => { keys[e.code] = false; };
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Player movement
        const speed = 3.5;
        if (keys['KeyA'] || keys['ArrowLeft']) player.vx = -speed;
        else if (keys['KeyD'] || keys['ArrowRight']) player.vx = speed;
        else player.vx *= 0.8;

        player.vy += 0.4; // gravity
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) player.vy = -9;

        player.x += player.vx;
        player.y += player.vy;
        player.onGround = false;

        // Platform collision
        platforms.forEach(p => {
          if (player.x + player.w > p.x && player.x < p.x + p.w &&
              player.y + player.h > p.y && player.y + player.h < p.y + p.h + 12 && player.vy > 0) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
          }
        });

        player.x = Math.max(0, Math.min(W - player.w, player.x));
        if (player.y > H) { player.y = H - 60; player.vy = 0; player.hp -= 15; player.inv = 30; }

        if (player.inv > 0) player.inv--;

        // Gems
        gems.forEach(g => {
          if (!g.collected && Math.hypot(player.x + 8 - g.x, player.y + 8 - g.y) < g.r + 10) {
            g.collected = true;
            collected++;
          }
        });

        // Spawn projectiles
        if (elapsed - lastSpawn > 800) {
          lastSpawn = elapsed;
          projectiles.push({ x: W, y: 30 + Math.random() * (H - 80), vx: -(2 + elapsed / 4000), r: 7 });
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          if (p.x < -20) { projectiles.splice(i, 1); continue; }
          if (player.inv === 0 && p.x > player.x && p.x < player.x + player.w &&
              p.y > player.y && p.y < player.y + player.h) {
            player.hp -= 20;
            player.inv = 35;
            projectiles.splice(i, 1);
          }
        }

        // Render
        ctx.fillStyle = '#050a15';
        ctx.fillRect(0, 0, W, H);

        // Platforms
        platforms.forEach(p => {
          ctx.fillStyle = `rgba(0,229,255,0.3)`;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
        });

        // Gems
        gems.forEach(g => {
          if (g.collected) return;
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Projectiles
        projectiles.forEach(p => {
          ctx.fillStyle = '#ff3344';
          ctx.shadowColor = '#ff3344';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player
        ctx.save();
        ctx.globalAlpha = player.inv > 0 ? (Math.floor(player.inv / 4) % 2 === 0 ? 0.3 : 1) : 1;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.restore();

        // HUD
        ctx.fillStyle = '#00ff88';
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Gemas: ${collected}/${needed}`, 10, 20);

        const hpPct = player.hp / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, H - 18, 100, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : '#ffd700';
        ctx.fillRect(10, H - 18, 100 * hpPct, 8);

        if (player.hp <= 0 || collected >= needed || timeLeft <= 0) {
          running = false;
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
          this._stop();
          const won = collected >= needed || (player.hp > 0 && collected >= Math.ceil(needed * 0.7));
          this._showResult(canvas, won, won ? `GEMAS COLETADAS (${collected}/${needed})!` : 'Falhou!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // L3-CP: Shooter — move and deflect projectiles
  _shooterDodge(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(color, name, 'PÓLVORA DIGITAL', 'Mova com WASD/Setas e clique/ESPAÇO para deflectir!', 10000, true);
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const player = { x: 80, y: H / 2, r: 12, hp: 100, inv: 0, shootCooldown: 0 };
      const bullets = [];
      const playerBullets = [];
      const keys = {};
      let score = 0;
      let running = true;
      const start = performance.now();
      const duration = 10000;

      const onDown = (e) => {
        keys[e.code] = true;
        if (e.code === 'Space' && player.shootCooldown <= 0) {
          playerBullets.push({ x: player.x + player.r, y: player.y, vx: 8, r: 5 });
          player.shootCooldown = 15;
        }
      };
      const onUp = (e) => { keys[e.code] = false; };
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);
      canvas.addEventListener('click', () => {
        if (player.shootCooldown <= 0) {
          playerBullets.push({ x: player.x + player.r, y: player.y, vx: 8, r: 5 });
          player.shootCooldown = 15;
        }
      });

      let lastSpawn = 0;
      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        const speed = 4;
        if (keys['KeyW'] || keys['ArrowUp']) player.y -= speed;
        if (keys['KeyS'] || keys['ArrowDown']) player.y += speed;
        if (keys['KeyA'] || keys['ArrowLeft']) player.x -= speed;
        if (keys['KeyD'] || keys['ArrowRight']) player.x += speed;
        player.x = Math.max(player.r, Math.min(W / 2, player.x));
        player.y = Math.max(player.r, Math.min(H - player.r, player.y));

        if (player.inv > 0) player.inv--;
        if (player.shootCooldown > 0) player.shootCooldown--;

        if (elapsed - lastSpawn > 700) {
          lastSpawn = elapsed;
          const spd = 2.5 + elapsed / 5000;
          bullets.push({ x: W, y: 30 + Math.random() * (H - 60), vx: -spd, vy: (Math.random() - 0.5) * 2, r: 9, alive: true });
        }

        // Player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
          playerBullets[i].x += playerBullets[i].vx;
          if (playerBullets[i].x > W) { playerBullets.splice(i, 1); continue; }
          // Hit enemy bullets
          for (let j = bullets.length - 1; j >= 0; j--) {
            if (bullets[j].alive && Math.hypot(playerBullets[i].x - bullets[j].x, playerBullets[i].y - bullets[j].y) < playerBullets[i].r + bullets[j].r) {
              bullets[j].alive = false;
              playerBullets.splice(i, 1);
              score++;
              this._shake(6);
              getAudio().playKeyClack();
              break;
            }
          }
        }

        // Enemy bullets vs player
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < -20 || !b.alive) { bullets.splice(i, 1); continue; }
          if (player.inv === 0 && Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) {
            player.hp -= 20;
            player.inv = 40;
            this._shake(14);
            getAudio().playAccessDenied();
            bullets.splice(i, 1);
          }
        }

        // Render
        ctx.fillStyle = '#050a15';
        ctx.fillRect(0, 0, W, H);

        // Divider
        ctx.strokeStyle = 'rgba(255,215,0,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Enemy bullets
        bullets.forEach(b => {
          ctx.fillStyle = '#ff3344';
          ctx.shadowColor = '#ff3344';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player bullets
        playerBullets.forEach(b => {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player
        ctx.save();
        ctx.globalAlpha = player.inv > 0 ? 0.4 : 1;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // HUD
        ctx.fillStyle = '#ffd700';
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Deflectidos: ${score}`, 10, 20);

        const hpPct = player.hp / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, H - 18, 100, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : '#ff3344';
        ctx.fillRect(10, H - 18, 100 * hpPct, 8);

        if (player.hp <= 0 || timeLeft <= 0) {
          running = false;
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
          this._stop();
          const won = player.hp > 0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! (${score} deflectidos)` : 'Eliminado!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // L3-PB: Orbit dodge — player orbits center, control speed with LEFT/RIGHT
  _orbitDodge(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(color, name, 'ÓRBITA CAÓTICA', 'Orbite o centro! Setas para acelerar/frear. Desvie dos meteoros!', 10000, true);
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const cx = W / 2, cy = H / 2;
      const orbitR = 100;
      const player = { angle: 0, angSpeed: 0.025, r: 10, hp: 100, inv: 0 };
      const projectiles = [];
      const keys = {};
      let running = true;
      const start = performance.now();
      const duration = 10000;

      const onDown = (e) => { keys[e.code] = true; };
      const onUp = (e) => { keys[e.code] = false; };
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);

      let lastSpawn = 0;
      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        if (keys['ArrowRight'] || keys['KeyD']) player.angSpeed = Math.min(0.08, player.angSpeed + 0.003);
        else if (keys['ArrowLeft'] || keys['KeyA']) player.angSpeed = Math.max(0.005, player.angSpeed - 0.003);
        else player.angSpeed = player.angSpeed * 0.99 + 0.025 * 0.01; // return to default

        player.angle += player.angSpeed;

        const px = cx + Math.cos(player.angle) * orbitR;
        const py = cy + Math.sin(player.angle) * orbitR;

        if (player.inv > 0) player.inv--;

        // Spawn inward projectiles
        if (elapsed - lastSpawn > 900) {
          lastSpawn = elapsed;
          const a = Math.random() * Math.PI * 2;
          const dist = 220;
          const speed = 1.5 + elapsed / 8000;
          const dx = cx - (cx + Math.cos(a) * dist);
          const dy = cy - (cy + Math.sin(a) * dist);
          const len = Math.hypot(dx, dy);
          projectiles.push({
            x: cx + Math.cos(a) * dist,
            y: cy + Math.sin(a) * dist,
            vx: (dx / len) * speed,
            vy: (dy / len) * speed,
            r: 8,
          });
        }

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          p.y += p.vy;
          const dist = Math.hypot(p.x - cx, p.y - cy);
          if (dist < 20) { projectiles.splice(i, 1); continue; }
          if (player.inv === 0 && Math.hypot(px - p.x, py - p.y) < player.r + p.r) {
            player.hp -= 20;
            player.inv = 40;
            projectiles.splice(i, 1);
          }
        }

        // Render
        ctx.fillStyle = '#050a15';
        ctx.fillRect(0, 0, W, H);

        // Orbit ring
        ctx.strokeStyle = `rgba(100,100,255,0.2)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Projectiles
        projectiles.forEach(p => {
          ctx.fillStyle = '#ff3344';
          ctx.shadowColor = '#ff3344';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player
        ctx.save();
        ctx.globalAlpha = player.inv > 0 ? 0.3 : 1;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(px, py, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Speed indicator
        const speedPct = (player.angSpeed - 0.005) / (0.08 - 0.005);
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 100, 8);
        ctx.fillStyle = speedPct > 0.7 ? '#ff3344' : speedPct > 0.4 ? '#ffd700' : '#00ff88';
        ctx.fillRect(10, 10, 100 * speedPct, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('velocidade', 10, 28);

        // HP
        const hpPct = player.hp / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, H - 18, 100, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : '#ff3344';
        ctx.fillRect(10, H - 18, 100 * hpPct, 8);

        if (player.hp <= 0 || timeLeft <= 0) {
          running = false;
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
          this._stop();
          const won = player.hp > 0;
          this._showResult(canvas, won, won ? 'ÓRBITA MANTIDA!' : 'Impacto fatal!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // L3-TV: Green heart dodge — defend with directional shields (Undertale inspired)
  _greenHeartDodge(color, name) {
    return new Promise(resolve => {
      this.overlay.innerHTML = this._buildMgLayout(color, name, 'CORAÇÃO DE FERRO', 'Use as setas para bloquear ataques! PARADO = defesa total!', 10000, true);
      const canvas = this.overlay.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const timerEl = this.overlay.querySelector('.vmg-timer');

      const cx = W / 2, cy = H / 2;
      const player = { x: cx, y: cy, r: 12, hp: 100, inv: 0, shieldDir: null };
      const projectiles = [];
      const keys = {};
      let running = true;
      const start = performance.now();
      const duration = 10000;
      let shieldActive = false;

      const onDown = (e) => {
        keys[e.code] = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') player.shieldDir = 'up';
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') player.shieldDir = 'down';
        else if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.shieldDir = 'left';
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') player.shieldDir = 'right';
      };
      const onUp = (e) => {
        keys[e.code] = false;
        const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'];
        if (!dirs.some(d => keys[d])) player.shieldDir = null;
      };
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);

      let lastSpawn = 0;
      const dirs4 = ['up', 'down', 'left', 'right'];
      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        if (player.inv > 0) player.inv--;

        if (elapsed - lastSpawn > 750) {
          lastSpawn = elapsed;
          const dir = dirs4[Math.floor(Math.random() * 4)];
          let sx, sy, vx = 0, vy = 0;
          const speed = 3.5 + elapsed / 5000;
          if (dir === 'up') { sx = cx; sy = 0; vy = speed; }
          else if (dir === 'down') { sx = cx; sy = H; vy = -speed; }
          else if (dir === 'left') { sx = 0; sy = cy; vx = speed; }
          else { sx = W; sy = cy; vx = -speed; }
          projectiles.push({ x: sx, y: sy, vx, vy, r: 9, dir, alive: true });
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) { projectiles.splice(i, 1); continue; }

          if (player.inv === 0 && Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
            // Check shield
            const blocked = player.shieldDir === p.dir ||
              (p.dir === 'up' && player.shieldDir === 'down') ||
              (p.dir === 'down' && player.shieldDir === 'up') ||
              (p.dir === 'left' && player.shieldDir === 'right') ||
              (p.dir === 'right' && player.shieldDir === 'left');

            if (blocked) {
              this._shake(6);
              getAudio().playKeyClack();
            } else {
              player.hp -= 18;
              player.inv = 35;
              this._shake(14);
              getAudio().playAccessDenied();
            }
            projectiles.splice(i, 1);
          }
        }

        // Render
        ctx.fillStyle = '#050a15';
        ctx.fillRect(0, 0, W, H);

        // Arena box
        const boxSize = 180;
        ctx.strokeStyle = 'rgba(100,255,100,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize);

        // Projectiles
        projectiles.forEach(p => {
          ctx.fillStyle = '#ff3344';
          ctx.shadowColor = '#ff3344';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Player (heart shape approximation)
        ctx.save();
        ctx.globalAlpha = player.inv > 0 ? 0.3 : 1;
        ctx.fillStyle = '#00ff88'; // Green heart
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Shield arc
        if (player.shieldDir) {
          let startA, endA;
          if (player.shieldDir === 'up') { startA = -Math.PI * 0.8; endA = -Math.PI * 0.2; }
          else if (player.shieldDir === 'down') { startA = Math.PI * 0.2; endA = Math.PI * 0.8; }
          else if (player.shieldDir === 'left') { startA = Math.PI * 0.7; endA = Math.PI * 1.3; }
          else { startA = -Math.PI * 0.3; endA = Math.PI * 0.3; }

          ctx.strokeStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.r + 12, startA, endA);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Direction indicators
        const dirs5 = [
          { dir: 'up', x: cx, y: cy - 80, sym: '↑' },
          { dir: 'down', x: cx, y: cy + 80, sym: '↓' },
          { dir: 'left', x: cx - 80, y: cy, sym: '←' },
          { dir: 'right', x: cx + 80, y: cy, sym: '→' },
        ];
        dirs5.forEach(d => {
          const active = player.shieldDir === d.dir;
          ctx.fillStyle = active ? '#00ff88' : 'rgba(255,255,255,0.15)';
          ctx.font = `bold ${active ? 24 : 18}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(d.sym, d.x, d.y);
        });

        // HP
        const hpPct = player.hp / 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, H - 18, 100, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : '#ff3344';
        ctx.fillRect(10, H - 18, 100 * hpPct, 8);

        if (player.hp <= 0 || timeLeft <= 0) {
          running = false;
          document.removeEventListener('keydown', onDown);
          document.removeEventListener('keyup', onUp);
          this._stop();
          const won = player.hp > 0;
          this._showResult(canvas, won, won ? 'DEFESA PERFEITA!' : 'Coração destruído!');
          setTimeout(() => resolve(won), 900);
        }
      };
      loop();
    });
  }

  // ════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════
  _buildMgLayout(color, name, title, instruction, duration, isCanvas = false) {
    const h = isCanvas ? 320 : 280;
    return `
      <div class="vmg-wrap" style="border-color: ${color}; box-shadow: 0 0 50px ${color}33, inset 0 0 30px rgba(0,0,0,0.95);">
        <div class="vmg-header" style="color:${color}">
          <span>[ ${name.toUpperCase()} // ${title.toUpperCase()} ]</span>
          <span style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;">TERMINAL PROTOCOL v4.2</span>
        </div>
        <div class="vmg-command-badge" style="background: rgba(255, 215, 0, 0.12); border: 1px solid #ffd700; color: #ffd700; padding: 6px 12px; font-weight: 900; font-size: 0.92rem; text-shadow: 0 0 10px #ffd700; text-align: center; margin: 4px 0 8px 0; border-radius: 4px; letter-spacing: 1px;">
          // COMANDO: ${instruction.toUpperCase()} //
        </div>
        <div class="vmg-status-bar" style="border-color: ${color}44;">
          <div class="vmg-timer-box">
            <span class="vmg-timer-label">TEMPO RESTANTE:</span>
            <span class="vmg-timer" style="color:${color}">—</span>
          </div>
          <div class="vmg-score-box">
            <span class="vmg-score-label">COTA DE ACERTOS:</span>
            <span class="vmg-score" style="color:#ffd700">0/8</span>
          </div>
        </div>
        <div class="vmg-canvas-container" style="border-color: ${color}55;">
          <canvas width="560" height="${h}" style="width:100%;height:auto;display:block;background:#02060b;"></canvas>
        </div>
      </div>
    `;
  }

  _showResult(canvas, success, msg) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = success ? 'rgba(0,255,136,0.22)' : 'rgba(255,51,68,0.22)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = success ? '#00ff88' : '#ff3344';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 24;
    ctx.fillText(success ? '[SUCESSO] ' + msg : '[FALHA] ' + msg, W / 2, H / 2);
    ctx.shadowBlur = 0;
    if (success) {
      try { getAudio().playPowerUp(); } catch (e) {}
    } else {
      try { getAudio().playAccessDenied(); } catch (e) {}
    }
  }

  _distToSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  _segmentsIntersect(a, b, c, d) {
    const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(det) < 1e-9) return false;
    const l = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const m = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    return l >= 0 && l <= 1 && m >= 0 && m <= 1;
  }

  _lightenHex(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const l = (c) => Math.min(255, Math.floor(c + (255 - c) * amount));
    return `rgb(${l(r)},${l(g)},${l(b)})`;
  }

  _darkenHex(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const d = (c) => Math.max(0, Math.floor(c * (1 - amount)));
    return `rgb(${d(r)},${d(g)},${d(b)})`;
  }
}
