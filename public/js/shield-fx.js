// ═══════════════════════════════════════════════════════════════════
// shield-fx.js — Motor Visual Padronizado de Escudos Holográficos
// Utilizado tanto pelo Modo Versus (versus-board.js) quanto Modo História (story-board.js)
// ═══════════════════════════════════════════════════════════════════

export class ShieldVisualFX {
  /**
   * Determina se o robô possui um escudo ativo (suporta tanto dados do Versus quanto da História)
   */
  static hasActiveShield(robot) {
    if (!robot || robot.currentHp <= 0) return false;
    if (robot.shield && (robot.shield.hp > 0 || robot.shield.hp === undefined)) return true;
    if (robot.defenseStance === 'DODGE_SUCCESS') return true;
    return false;
  }

  /**
   * Extrai a cor, hp e rodadas do escudo de forma unificada
   */
  static getShieldMeta(robot) {
    let color = '#00e5ff'; // Ciano padrão
    let hp = null;
    let maxHp = null;
    let roundsLeft = null;
    let label = '[ ESCUDO ATIVO ]';

    if (robot.shield) {
      if (robot.shield.color) color = robot.shield.color;
      hp = robot.shield.hp !== undefined ? robot.shield.hp : null;
      maxHp = robot.shield.maxHp || (robot.id === 'DB' ? 5 : 10);
      roundsLeft = robot.shield.roundsLeft !== undefined ? robot.shield.roundsLeft : null;
      if (hp !== null && roundsLeft !== null) {
        label = `[ ESCUDO: ${hp}HP · ${roundsLeft}R ]`;
      } else if (hp !== null) {
        label = `[ ESCUDO: ${hp}HP ]`;
      } else if (roundsLeft !== null) {
        label = `[ ESCUDO · ${roundsLeft}R ]`;
      }
    } else if (robot.defenseStance === 'DODGE_SUCCESS') {
      color = '#00ff88'; // Verde esmeralda de sucesso tático na Moeda da Sorte
      label = '[ DEFESA TOTAL · 100% ]';
    }

    return { color, hp, maxHp, roundsLeft, label };
  }

  /**
   * 1. CAMADA TRASEIRA: Halo de difusão de energia desenhado ATRÁS do robô
   */
  static drawBack(ctx, robot, x, y, time) {
    if (!this.hasActiveShield(robot)) return;
    const { color } = this.getShieldMeta(robot);
    const centerY = y - 6;
    const pulse = Math.sin(time * 0.08 + (robot.pulsePhase || 0)) * 2;
    const backR = 56 + pulse;

    ctx.save();
    const halo = ctx.createRadialGradient(x, centerY, 15, x, centerY, backR);
    halo.addColorStop(0, `${color}40`);
    halo.addColorStop(0.5, `${color}18`);
    halo.addColorStop(1, 'transparent');

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, centerY, backR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 2. CAMADA FRONTAL: Cúpula Holográfica 3D translúcida desenhada NA FRENTE do sprite
   */
  static drawFront(ctx, robot, x, y, time) {
    if (!this.hasActiveShield(robot)) return;
    const { color, roundsLeft, label } = this.getShieldMeta(robot);
    const centerY = y - 6;
    const pulse = Math.sin(time * 0.09 + (robot.pulsePhase || 0)) * 1.8;
    const shieldR = 48 + pulse;

    ctx.save();

    // ── A. Superfície de Vidro de Força Holográfica (Efeito 3D esférico) ──
    const domeGrad = ctx.createRadialGradient(x - 14, centerY - 18, 4, x, centerY, shieldR);
    domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.40)'); // Destaque especular no topo
    domeGrad.addColorStop(0.2, `${color}28`);
    domeGrad.addColorStop(0.65, `${color}12`);
    domeGrad.addColorStop(0.88, `${color}32`);
    domeGrad.addColorStop(1, `${color}55`); // Borda mais densa com Fresnel glow

    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(x, centerY, shieldR, 0, Math.PI * 2);
    ctx.fill();

    // ── B. Anel Externo Neon de Contenção de Plasma ──
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 + Math.sin(time * 0.12) * 6;
    ctx.beginPath();
    ctx.arc(x, centerY, shieldR, 0, Math.PI * 2);
    ctx.stroke();

    // ── C. Anel Tecnológico Rotativo Segmentado ──
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([16, 9]);
    ctx.lineDashOffset = -time * 0.85;
    ctx.beginPath();
    ctx.arc(x, centerY, shieldR - 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ── D. Nós de Emissão de Campo de Força (4 Emitters Orbitais) ──
    const rot = time * 0.025;
    for (let i = 0; i < 4; i++) {
      const angle = rot + (i * Math.PI) / 2;
      const ex = x + Math.cos(angle) * shieldR;
      const ey = centerY + Math.sin(angle) * shieldR;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(angle);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // Desenha bracket emissor tecnológico
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── E. Linhas de Varredura Holográficas (Scanlines contidas no domo) ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, centerY, shieldR, 0, Math.PI * 2);
    ctx.clip();

    const scanY1 = centerY + (((time * 1.5) % 80) - 40);
    const scanY2 = centerY + ((((time * 1.5) + 40) % 80) - 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - shieldR, scanY1);
    ctx.lineTo(x + shieldR, scanY1);
    ctx.moveTo(x - shieldR, scanY2);
    ctx.lineTo(x + shieldR, scanY2);
    ctx.stroke();
    ctx.restore();

    // ── F. Badge Holográfico Superior (Shield HUD Tag) ──
    const tagY = centerY - shieldR - 12;
    const isCriticalRounds = roundsLeft === 1;
    const tagBgColor = 'rgba(2, 10, 6, 0.92)';
    const tagBorderColor = isCriticalRounds ? '#ff3344' : color;
    const tagTextColor = isCriticalRounds ? '#ff4455' : (roundsLeft ? color : '#00ff88');

    ctx.save();
    ctx.font = 'bold 9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(label).width;
    const padX = 8;
    const badgeW = textWidth + padX * 2;
    const badgeH = 16;
    const badgeX = x - badgeW / 2;
    const badgeY = tagY - badgeH / 2;

    // Fundo do badge
    ctx.fillStyle = tagBgColor;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();

    // Borda do badge
    ctx.strokeStyle = tagBorderColor;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = tagBorderColor;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Texto do badge
    ctx.fillStyle = tagTextColor;
    ctx.shadowColor = tagBorderColor;
    ctx.shadowBlur = 4;
    ctx.fillText(label, x, tagY);
    ctx.restore();

    ctx.restore();
  }

  /**
   * 3. ANIMAÇÃO DE QUEBRA DE ESCUDO: Onda de choque e fragmentos poligonais em dispersão
   */
  static drawBreakEffect(ctx, sb) {
    ctx.save();
    const alpha = Math.max(0, Math.min(1, sb.alpha));
    const color = sb.color || '#00e5ff';
    ctx.globalAlpha = alpha;

    // Onda externa
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI * 2);
    ctx.stroke();

    // Anel interno branco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(sb.x, sb.y, sb.r * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    // Fragmentos triangulares estilhaçando radialmente
    const shardsCount = 8;
    for (let s = 0; s < shardsCount; s++) {
      const angle = (s * Math.PI * 2) / shardsCount + (sb.r * 0.05);
      const dist = sb.r * 0.96;
      const sx = sb.x + Math.cos(angle) * dist;
      const sy = sb.y + Math.sin(angle) * dist;
      const sz = 5 * alpha;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = s % 2 === 0 ? color : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz, sz);
      ctx.lineTo(-sz, sz);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

