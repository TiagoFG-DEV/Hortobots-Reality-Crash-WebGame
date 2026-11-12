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
  // ════════════════════════════════════════════════════════════════

  // L3-DB: Expurgo Térmico — Esquiva Dracônica (meteoritos caindo)
  _dbDodge(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 10000;

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'EXPURGO TERMICO — ESQUIVA DRACONICA',
        'DESVIE DOS METEORITOS! PRESSIONE E MOVA PARA MANOBRAR O NUCLEO!',
        duration, true
      );

      // Ajusta canvas para 520x320
      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      // Gera 40 estrelas estáticas no início
      const estrelas = [];
      for (let i = 0; i < 40; i++) {
        estrelas.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() < 0.5 ? 1 : 2
        });
      }

      // Estado do player
      const player = { x: W / 2, y: H - 50, size: 16 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      // Estado dos meteoritos
      const meteoritos = [];
      let velocidadeBase = 2;
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();

      // AbortController para limpar listeners
      const ac = new AbortController();
      const sig = ac.signal;

      // Helpers de posição do canvas
      const getPosCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = W / rect.width, sy = H / rect.height;
        const cl = e.touches ? e.touches[0] : e;
        return { x: (cl.clientX - rect.left) * sx, y: (cl.clientY - rect.top) * sy };
      };

      // Eventos de mouse — controle por pressão
      canvas.addEventListener('mousedown', (e) => {
        mousePressed = true;
        mouseTarget = getPosCanvas(e);
      }, { signal: sig });
      canvas.addEventListener('mousemove', (e) => {
        if (mousePressed) mouseTarget = getPosCanvas(e);
      }, { signal: sig });
      canvas.addEventListener('mouseup', () => { mousePressed = false; }, { signal: sig });
      canvas.addEventListener('mouseleave', () => { mousePressed = false; }, { signal: sig });

      // Touch — equivalente a mousedown+mousemove
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        mousePressed = true;
        mouseTarget = getPosCanvas(e);
      }, { signal: sig, passive: false });
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (mousePressed) mouseTarget = getPosCanvas(e);
      }, { signal: sig, passive: false });
      canvas.addEventListener('touchend', () => { mousePressed = false; }, { signal: sig });

      // Spawna um meteorito
      const spawnMeteorito = () => {
        const rx = 12 + Math.random() * 8;   // 12-20
        const ry = 8 + Math.random() * 6;    // 8-14
        meteoritos.push({
          x: rx + Math.random() * (W - rx * 2),
          y: -20,
          rx, ry,
          vel: velocidadeBase,
          rastro: []  // partículas de rastro laranja
        });
      };

      // Spawna 3 meteoritos iniciais
      for (let i = 0; i < 3; i++) spawnMeteorito();

      let ultimaAceleracao = 0;

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Acelera velocidade a cada 2s
        const segPassados = Math.floor(elapsed / 2000);
        if (segPassados > ultimaAceleracao) {
          ultimaAceleracao = segPassados;
          velocidadeBase = 2 + segPassados * 0.1;
        }

        // Movimento do player (lerp suave) — apenas se pressionado
        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.18;
          player.y += (mouseTarget.y - player.y) * 0.18;
        }
        // Limita player ao canvas
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        // Atualiza invulnerabilidade
        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        // Fundo preto com estrelas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        estrelas.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Atualiza e desenha meteoritos
        for (let i = meteoritos.length - 1; i >= 0; i--) {
          const m = meteoritos[i];
          // Adiciona partículas de rastro antes de mover
          m.rastro.push({ x: m.x, y: m.y, life: 1.0 });
          if (m.rastro.length > 4) m.rastro.shift();

          m.y += m.vel;

          // Rastro laranja
          m.rastro.forEach((p, pi) => {
            p.life -= 0.25;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life) * 0.7;
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y - pi * 3, m.rx * 0.7, m.ry * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          // Desenha meteorito
          ctx.save();
          ctx.fillStyle = '#ff4400';
          ctx.shadowColor = '#ff4400';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Saiu pela base — spawna novo
          if (m.y > H + 30) {
            meteoritos.splice(i, 1);
            if (meteoritos.length < 6) spawnMeteorito();
            continue;
          }

          // Manter máx 6
          while (meteoritos.length > 6) meteoritos.shift();

          // Hit detection
          if (!invulneravel) {
            const dist = Math.hypot(player.x - m.x, player.y - m.y);
            if (dist < 20) {
              hits++;
              invulneravel = true;
              invTimer = 800;
              this._shake(8);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        // Garante pelo menos 1 meteorito sempre
        if (meteoritos.length === 0) spawnMeteorito();

        // Desenha player (pisca durante invulnerabilidade)
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

        // HUD de hits
        ctx.fillStyle = '#ff4400';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits}`, 10, 20);

        // Fim do jogo
        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.15);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'ELIMINADO! TODOS OS PONTOS PERDIDOS!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // L3-CP: Laco Magnetico — Arena do Xerife (laco giratório)
  _cpDodge(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 10000;

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'LACO MAGNETICO — ARENA DO XERIFE',
        'DESVIE DO LACO GIRATORIO! PERMANECA PROXIMO AO CENTRO PARA SOBREVIVER!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      // Player começa no centro
      const player = { x: W / 2, y: H / 2, size: 14 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      // Estado do laco
      let rotacao = 0;
      let velRotacao = 0.03;
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimaAceleracao = 0;

      // Zona de perigo nas bordas: cresce 2px/s
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

      // Distância aproximada de um ponto (px,py) a uma elipse centrada (cx,cy) com semeixos rx,ry girada por ang
      const distPontoElipse = (px, py, cx, cy, rx, ry, ang) => {
        // Transforma ponto para sistema local da elipse (sem rotação)
        const dx = px - cx;
        const dy = py - cy;
        const cosA = Math.cos(-ang), sinA = Math.sin(-ang);
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;
        // Distância ao ponto mais próximo na elipse
        const nx = lx / rx;
        const ny = ly / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        // Distância da borda da elipse
        return Math.abs(Math.sqrt(lx * lx + ly * ly) - Math.sqrt((lx / (d || 1)) * rx * (lx / (d || 1)) * rx + (ly / (d || 1)) * ry * (ly / (d || 1)) * ry));
      };

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Acelera rotação a cada 1s, máx 0.18 rad/frame
        const segPassados = Math.floor(elapsed / 1000);
        if (segPassados > ultimaAceleracao) {
          ultimaAceleracao = segPassados;
          velRotacao = Math.min(0.18, 0.03 + segPassados * 0.004);
        }

        // Zona de perigo cresce 2px/s
        bordaPerigo = (elapsed / 1000) * 2;

        rotacao += velRotacao;

        // Movimento do player — somente com mouse pressionado
        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.18;
          player.y += (mouseTarget.y - player.y) * 0.18;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        // Atualiza invulnerabilidade
        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        // Fundo preto
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        // Zona de perigo nas bordas (vermelho semitransparente)
        const bp = Math.min(bordaPerigo, Math.min(W, H) / 2 - 20);
        if (bp > 0) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
          // Borda superior
          ctx.fillRect(0, 0, W, bp);
          // Borda inferior
          ctx.fillRect(0, H - bp, W, bp);
          // Borda esquerda
          ctx.fillRect(0, 0, bp, H);
          // Borda direita
          ctx.fillRect(W - bp, 0, bp, H);
        }

        // Desenha laco (elipse girando)
        const cx = W / 2, cy = H / 2;
        const rx = 130, ry = 70;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotacao);
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Verifica hit com o laco
        if (!invulneravel) {
          // Distância do centro do player ao laco
          const distLaco = distPontoElipse(player.x, player.y, cx, cy, rx, ry, rotacao);
          if (distLaco < 8) {
            hits++;
            invulneravel = true;
            invTimer = 800;
            this._shake(8);
            try { getAudio().playAccessDenied(); } catch (e) {}
          }
          // Verifica hit com zona de borda perigosa
          if (bp > 0) {
            const naZonaBorda = player.x < bp || player.x > W - bp || player.y < bp || player.y > H - bp;
            if (naZonaBorda) {
              hits++;
              invulneravel = true;
              invTimer = 800;
              this._shake(8);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        // Desenha player (pisca durante invulnerabilidade)
        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits}  VEL.LACO: ${velRotacao.toFixed(3)}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.15);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `DESVIOU! SCORE: ${score.toFixed(2)}` : 'LAÇADO! PONTUAÇÃO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // L3-PL: Tundra Artica — Esquiva Polar (fisica de gelo, estalactites)
  _plDodge(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 10000;

      // Layout customizado com indicador de vento externo
      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'TUNDRA ARTICA — ESQUIVA POLAR',
        'DESVIE DAS ESTALACTITES! CUIDADO COM O VENTO GELADO E O CONTROLE ESCORREGADIO!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      // Adiciona indicador de vento ao HTML
      const wrap = this.overlay.querySelector('.vmg-wrap');
      const ventoDivEl = document.createElement('div');
      ventoDivEl.id = 'vento-indicador';
      ventoDivEl.style.cssText = 'color:#00e5ff;font-family:monospace;font-weight:900;font-size:0.9rem;text-align:center;padding:4px;letter-spacing:2px;text-shadow:0 0 8px #00e5ff;';
      ventoDivEl.textContent = 'VENTO: NORTE';
      wrap.appendChild(ventoDivEl);

      // Player com física de gelo
      const player = { x: W / 2, y: H - 50, size: 14, vx: 0, vy: 0 };
      const velMax = 4;
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      // Vento
      const dirVento = ['NORTE', 'SUL', 'LESTE', 'OESTE'];
      let ventoAtual = 'NORTE';
      let ventoForca = { x: 0, y: -0.3 };

      // Estalactites estáticas decorativas no topo (5-7 triângulos)
      const estaDecorat = [];
      const numDec = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numDec; i++) {
        estaDecorat.push({
          x: 30 + (i / (numDec - 1)) * (W - 60),
          largura: 20 + Math.random() * 20,
          altura: 20 + Math.random() * 30
        });
      }

      // Estalactites que caem
      const estalactites = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimoVento = 0;

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
        ventoAtual = dir;
        if (dir === 'NORTE') ventoForca = { x: 0, y: -0.3 };
        else if (dir === 'SUL') ventoForca = { x: 0, y: 0.3 };
        else if (dir === 'LESTE') ventoForca = { x: 0.3, y: 0 };
        else ventoForca = { x: -0.3, y: 0 };
        if (ventoDivEl) ventoDivEl.textContent = `VENTO: ${dir}`;
      };

      const spawnEstalactite = () => {
        const largura = 10 + Math.random() * 8;   // 10-18px
        const altura = 40 + Math.random() * 40;   // 40-80px
        estalactites.push({
          x: largura + Math.random() * (W - largura * 2),
          y: -altura,
          largura,
          altura,
          vel: 2 + Math.random() * 1.5  // 2-3.5px/frame
        });
      };

      // Spawna estalactites iniciais
      for (let i = 0; i < 3; i++) spawnEstalactite();

      let ultimoSpawn = 0;

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Troca vento a cada 2s
        const segVento = Math.floor(elapsed / 2000);
        if (segVento > ultimoVento) {
          ultimoVento = segVento;
          sortearVento();
        }

        // Spawn de nova estalactite a cada ~1.2s
        if (elapsed - ultimoSpawn > 1200) {
          ultimoSpawn = elapsed;
          spawnEstalactite();
        }

        // Fisica de gelo
        if (mousePressed) {
          // Aceleração em direção ao mouse
          const dx = mouseTarget.x - player.x;
          const dy = mouseTarget.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          player.vx += (dx / dist) * 0.4;
          player.vy += (dy / dist) * 0.4;
        } else {
          // Desliza: multiplica velocidade por 0.88
          player.vx *= 0.88;
          player.vy *= 0.88;
        }

        // Aplica força do vento
        player.vx += ventoForca.x;
        player.vy += ventoForca.y;

        // Limita velocidade máxima
        const spd = Math.hypot(player.vx, player.vy);
        if (spd > velMax) {
          player.vx = (player.vx / spd) * velMax;
          player.vy = (player.vy / spd) * velMax;
        }

        player.x += player.vx;
        player.y += player.vy;

        // Mantém player no canvas (rebate nas bordas)
        if (player.x < player.size / 2) { player.x = player.size / 2; player.vx *= -0.5; }
        if (player.x > W - player.size / 2) { player.x = W - player.size / 2; player.vx *= -0.5; }
        if (player.y < player.size / 2) { player.y = player.size / 2; player.vy *= -0.5; }
        if (player.y > H - player.size / 2) { player.y = H - player.size / 2; player.vy *= -0.5; }

        // Atualiza invulnerabilidade
        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        // Fundo azul escuro
        ctx.fillStyle = '#050d1a';
        ctx.fillRect(0, 0, W, H);

        // Estalactites decorativas estáticas no topo
        ctx.fillStyle = 'rgba(0, 200, 255, 0.18)';
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
        ctx.lineWidth = 1;
        estaDecorat.forEach(ed => {
          ctx.beginPath();
          ctx.moveTo(ed.x - ed.largura / 2, 0);
          ctx.lineTo(ed.x + ed.largura / 2, 0);
          ctx.lineTo(ed.x, ed.altura);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        // Atualiza e desenha estalactites que caem
        for (let i = estalactites.length - 1; i >= 0; i--) {
          const e = estalactites[i];
          e.y += e.vel;

          // Desenha: retângulo + ponta triangular abaixo
          ctx.fillStyle = '#00aacc';
          ctx.shadowColor = '#00aacc';
          ctx.shadowBlur = 6;
          // Corpo retangular
          ctx.fillRect(e.x - e.largura / 2, e.y, e.largura, e.altura);
          // Ponta triangular abaixo
          ctx.beginPath();
          ctx.moveTo(e.x - e.largura / 2, e.y + e.altura);
          ctx.lineTo(e.x + e.largura / 2, e.y + e.altura);
          ctx.lineTo(e.x, e.y + e.altura + 16);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          // Saiu pela base
          if (e.y > H + 20) {
            estalactites.splice(i, 1);
            continue;
          }

          // Hit detection
          if (!invulneravel) {
            const ph = player.size / 2;
            const ex1 = e.x - e.largura / 2, ex2 = e.x + e.largura / 2;
            const ey1 = e.y, ey2 = e.y + e.altura + 16;
            const px1 = player.x - ph, px2 = player.x + ph;
            const py1 = player.y - ph, py2 = player.y + ph;
            if (px2 > ex1 && px1 < ex2 && py2 > ey1 && py1 < ey2) {
              hits++;
              invulneravel = true;
              invTimer = 800;
              this._shake(8);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        // Desenha player (pisca durante invulnerabilidade)
        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#00aacc';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.15);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'CONGELADO! PONTUAÇÃO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // L3-PB: Camara de Cristal — Esquiva Prismatica (feixes de laser)
  _pbDodge(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 10000;

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'CAMARA DE CRISTAL — ESQUIVA PRISMATICA',
        'DESVIE DOS FEIXES DE LUZ! UMA LINHA PONTILHADA AVISA ANTES DO LASER!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      // Player
      const player = { x: W / 2, y: H / 2, size: 14 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      // Feixes
      const feixes = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimoSpawn = -1200;

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

      // Gera um feixe aleatório
      const spawnFeixe = () => {
        // Tipos: 0=horizontal, 1=vertical, 2=diagonal45, 3=diagonal-45
        const tipo = Math.floor(Math.random() * 4);
        let p1, p2;
        if (tipo === 0) {
          // Horizontal
          const y = 30 + Math.random() * (H - 60);
          p1 = { x: 0, y }; p2 = { x: W, y };
        } else if (tipo === 1) {
          // Vertical
          const x = 30 + Math.random() * (W - 60);
          p1 = { x, y: 0 }; p2 = { x, y: H };
        } else if (tipo === 2) {
          // Diagonal 45°
          const off = Math.random() * (W + H);
          p1 = { x: 0, y: off }; p2 = { x: W, y: off - W };
        } else {
          // Diagonal -45°
          const off = Math.random() * (W + H) - H;
          p1 = { x: 0, y: off }; p2 = { x: W, y: off + W };
        }
        feixes.push({
          p1, p2,
          fase: 'telegraph',  // 'telegraph' (0.5s) ou 'laser' (0.8s)
          timer: 0.5,
          totalTimer: 0.5
        });
      };

      // Distância de ponto à reta definida por dois pontos
      const distPontoLinha = (px, py, x1, y1, x2, y2) => {
        const A = y2 - y1, B = x1 - x2, C = x2 * y1 - x1 * y2;
        const denom = Math.sqrt(A * A + B * B);
        if (denom === 0) return Math.hypot(px - x1, py - y1);
        return Math.abs(A * px + B * py + C) / denom;
      };

      // Grade lilás estática de fundo
      const pontosGrade = [];
      for (let gx = 0; gx < W; gx += 30) {
        for (let gy = 0; gy < H; gy += 30) {
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

        // Spawn de feixe a cada 1.2s, máx 3
        if (elapsed - ultimoSpawn > 1200 && feixes.length < 3) {
          ultimoSpawn = elapsed;
          spawnFeixe();
        }

        // Movimento do player
        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.18;
          player.y += (mouseTarget.y - player.y) * 0.18;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        // Atualiza invulnerabilidade
        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        // Fundo preto com grade lilás
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(224,64,251,0.08)';
        pontosGrade.forEach(p => {
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        });

        // Atualiza e desenha feixes
        for (let i = feixes.length - 1; i >= 0; i--) {
          const f = feixes[i];
          f.timer -= dt;

          if (f.fase === 'telegraph') {
            // Linha pontilhada (telegrama)
            ctx.save();
            ctx.strokeStyle = 'rgba(200,100,255,0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(f.p1.x, f.p1.y);
            ctx.lineTo(f.p2.x, f.p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            if (f.timer <= 0) {
              f.fase = 'laser';
              f.timer = 0.8;
              f.totalTimer = 0.8;
            }
          } else if (f.fase === 'laser') {
            // Laser ativo
            ctx.save();
            ctx.strokeStyle = '#e040fb';
            ctx.lineWidth = 8;
            ctx.shadowColor = '#e040fb';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(f.p1.x, f.p1.y);
            ctx.lineTo(f.p2.x, f.p2.y);
            ctx.stroke();
            ctx.restore();

            // Hit detection com laser ativo
            if (!invulneravel) {
              const dist = distPontoLinha(player.x, player.y, f.p1.x, f.p1.y, f.p2.x, f.p2.y);
              if (dist < player.size) {
                hits++;
                invulneravel = true;
                invTimer = 800;
                this._shake(8);
                try { getAudio().playAccessDenied(); } catch (e) {}
              }
            }

            if (f.timer <= 0) {
              feixes.splice(i, 1);
            }
          }
        }

        // Desenha player (pisca durante invulnerabilidade)
        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#e040fb';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.15);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `SOBREVIVEU! SCORE: ${score.toFixed(2)}` : 'VAPORIZADO! PONTUAÇÃO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
        }
      };
      loop();
    });
  }

  // L3-TV: Arena do Tigre — Barreira Eletrica (estilo Flappy Bird)
  _tvDodge(color, name) {
    return new Promise(resolve => {
      const W = 520, H = 320;
      const duration = 10000;

      this.overlay.innerHTML = this._buildMgLayout(
        color, name,
        'ARENA DO TIGRE — BARREIRA ELETRICA',
        'DESVIE DAS BARREIRAS! ENCONTRE E PASSE PELA ABERTURA!',
        duration, true
      );

      const canvas = this.overlay.querySelector('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const timerEl = this.overlay.querySelector('.vmg-timer');

      // Player começa à esquerda
      const player = { x: 80, y: H / 2, size: 14 };
      let mousePressed = false;
      let mouseTarget = { x: player.x, y: player.y };

      // Barreiras
      const barreiras = [];
      let hits = 0;
      let invulneravel = false;
      let invTimer = 0;
      let piscarContador = 0;
      let running = true;
      const start = performance.now();
      let ultimoSpawn = -2500;

      // Partículas de faísca decorativas
      const faiscas = [];

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
        const aberturaAltura = 80;
        const aberturaY = 30 + Math.random() * (H - 60 - aberturaAltura);
        barreiras.push({
          x: W,
          largura: 40,
          aberturaY,
          aberturaAltura,
          vel: 2.5
        });
      };

      const loop = () => {
        if (!running) return;
        this.animId = requestAnimationFrame(loop);
        const elapsed = performance.now() - start;
        const timeLeft = Math.max(0, (duration - elapsed) / 1000);
        if (timerEl) timerEl.textContent = timeLeft.toFixed(1) + 's';

        // Spawn de barreiras a cada 2.5s, máx 3
        if (elapsed - ultimoSpawn > 2500 && barreiras.length < 3) {
          ultimoSpawn = elapsed;
          spawnBarreira();
        }

        // Movimento do player — somente com mouse pressionado
        if (mousePressed) {
          player.x += (mouseTarget.x - player.x) * 0.18;
          player.y += (mouseTarget.y - player.y) * 0.18;
        }
        player.x = Math.max(player.size / 2, Math.min(W - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(H - player.size / 2, player.y));

        // Atualiza invulnerabilidade
        if (invulneravel) {
          invTimer -= 16;
          piscarContador++;
          if (invTimer <= 0) { invulneravel = false; piscarContador = 0; }
        }

        // Fundo preto com grade de circuito laranja fraca
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,140,0,0.08)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
        for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

        // Atualiza e desenha barreiras
        for (let i = barreiras.length - 1; i >= 0; i--) {
          const b = barreiras[i];
          b.x -= b.vel;

          // Gera faíscas nas bordas da abertura
          if (Math.random() < 0.4) {
            faiscas.push({
              x: b.x + b.largura / 2 + (Math.random() - 0.5) * b.largura,
              y: b.aberturaY + (Math.random() < 0.5 ? 0 : b.aberturaAltura),
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 1.0,
              decay: 0.08
            });
          }

          // Remove barreira que saiu pela esquerda
          if (b.x + b.largura < 0) {
            barreiras.splice(i, 1);
            continue;
          }

          // Desenha bloco superior (topo até abertura)
          ctx.fillStyle = '#333333';
          ctx.strokeStyle = '#ff8c00';
          ctx.lineWidth = 2;
          // Bloco topo
          ctx.fillRect(b.x, 0, b.largura, b.aberturaY);
          ctx.strokeRect(b.x, 0, b.largura, b.aberturaY);
          // Bloco base
          ctx.fillRect(b.x, b.aberturaY + b.aberturaAltura, b.largura, H - (b.aberturaY + b.aberturaAltura));
          ctx.strokeRect(b.x, b.aberturaY + b.aberturaAltura, b.largura, H - (b.aberturaY + b.aberturaAltura));

          // Hit detection
          if (!invulneravel) {
            const ph = player.size / 2;
            const px1 = player.x - ph, px2 = player.x + ph;
            const py1 = player.y - ph, py2 = player.y + ph;
            const bx1 = b.x, bx2 = b.x + b.largura;
            // Verifica colisão com bloco superior
            const hitTopo = px2 > bx1 && px1 < bx2 && py1 < b.aberturaY && py2 > 0;
            // Verifica colisão com bloco base
            const hitBase = px2 > bx1 && px1 < bx2 && py2 > b.aberturaY + b.aberturaAltura && py1 < H;
            if (hitTopo || hitBase) {
              hits++;
              invulneravel = true;
              invTimer = 800;
              this._shake(8);
              try { getAudio().playAccessDenied(); } catch (e) {}
            }
          }
        }

        // Atualiza e desenha faíscas
        for (let i = faiscas.length - 1; i >= 0; i--) {
          const f = faiscas[i];
          f.x += f.vx;
          f.y += f.vy;
          f.life -= f.decay;
          if (f.life <= 0) { faiscas.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = f.life;
          ctx.fillStyle = '#ff8c00';
          ctx.shadowColor = '#ff8c00';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Desenha player (pisca durante invulnerabilidade)
        const mostrarPlayer = !invulneravel || (Math.floor(piscarContador / 4) % 2 === 0);
        if (mostrarPlayer) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
          ctx.restore();
        }

        // HUD
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`IMPACTOS: ${hits}`, 10, 20);

        if (timeLeft <= 0) {
          running = false;
          ac.abort();
          this._stop();
          const score = Math.max(0.0, 1.0 - hits * 0.15);
          const won = score > 0.0;
          this._showResult(canvas, won, won ? `PASSOU! SCORE: ${score.toFixed(2)}` : 'BLOQUEADO! PONTUAÇÃO ZERO!');
          setTimeout(() => resolve({ won, score }), 950);
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
