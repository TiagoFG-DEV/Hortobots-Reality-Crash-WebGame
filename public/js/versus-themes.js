// public/js/versus-themes.js — Definição dos 4 Temas Visuais & Músicas de Arena do Modo Versus
// Totalmente customizados em código vetorial de terminal sem dependências externas.
// Respeito rigoroso às regras: sem roxo/violeta, elementos de terminal preservados nas mesmas posições.

export const VERSUS_ARENA_THEMES = [
  {
    id: 'default',
    name: 'PADRÃO // CYBER OS',
    subtitle: 'CIRCUITO DIGITAL CENTRAL',
    bgmKey: 'lizardsPulse',
    bgmUrl: "/audio/Lizard's Pulse.mp3",
    tag: '[ ARENA VIRTUAL // PADRÃO CYBER-GRID ]',
    colors: {
      bgCenter: 'rgba(10, 16, 36, 0.25)',
      bgMid: 'rgba(6, 10, 24, 0.45)',
      bgOuter: 'rgba(2, 4, 12, 0.65)',
      gridLines: 'rgba(0, 229, 255, 0.22)',
      centerDivider: 'rgba(255, 51, 100, 0.35)',
      centerDividerShadow: '#ff3366',
      brackets: 'rgba(0, 255, 136, 0.4)',
      scanlines: 'rgba(0, 229, 255, 0.03)',
      statusTagColor: 'rgba(0, 255, 136, 0.5)',
      // Intro overlay
      introThemeClass: 'theme-default',
      introGridColor: 'rgba(0, 255, 102, 0.08)',
      introAccentColor: '#00ff88',
      introBorderColor: '#00e5ff',
      // 3D Engine
      threeGridColor: 0x00ff88,
      threePointA: 0x00e5ff,
      threePointB: 0xff3366
    },
    parallaxType: 'orbital_grid'
  },
  {
    id: 'metallic',
    name: 'TITÂNIO // CHROME INDUSTRIAL',
    subtitle: 'BLINDAGEM PESADA DE AÇO ESCOVADO',
    bgmKey: 'lizardsOmega',
    bgmUrl: "/audio/Lizard's Omega Powered.mp3",
    tag: '[ ARENA VIRTUAL // LIGA DE TITÂNIO & PRATA ]',
    colors: {
      bgCenter: 'rgba(32, 40, 50, 0.32)',
      bgMid: 'rgba(20, 26, 34, 0.55)',
      bgOuter: 'rgba(8, 12, 18, 0.75)',
      gridLines: 'rgba(224, 235, 245, 0.26)',
      centerDivider: 'rgba(255, 255, 255, 0.65)',
      centerDividerShadow: '#c0d0e0',
      brackets: 'rgba(240, 248, 255, 0.7)',
      scanlines: 'rgba(255, 255, 255, 0.035)',
      statusTagColor: 'rgba(224, 235, 245, 0.65)',
      // Intro overlay
      introThemeClass: 'theme-metallic',
      introGridColor: 'rgba(220, 235, 250, 0.12)',
      introAccentColor: '#ffffff',
      introBorderColor: '#c8d6e5',
      // 3D Engine
      threeGridColor: 0xd8e4f0,
      threePointA: 0xffffff,
      threePointB: 0x8fa3b8
    },
    parallaxType: 'metallic_hexagons'
  },
  {
    id: 'kawaii',
    name: 'KAWAII // RETRO TERMINAL',
    subtitle: 'CHERRY DATACORE & SCANLINES',
    bgmKey: 'energeticBattle',
    bgmUrl: '/audio/Energetic Battle Tendence.mp3',
    tag: '[ ARENA VIRTUAL // RETRO KAWAII TERMINAL ]',
    colors: {
      bgCenter: 'rgba(40, 18, 28, 0.32)',
      bgMid: 'rgba(26, 10, 18, 0.52)',
      bgOuter: 'rgba(14, 4, 10, 0.72)',
      gridLines: 'rgba(255, 141, 161, 0.28)',
      centerDivider: 'rgba(255, 105, 140, 0.6)',
      centerDividerShadow: '#ff8da1',
      brackets: 'rgba(255, 180, 200, 0.65)',
      scanlines: 'rgba(255, 180, 200, 0.04)',
      statusTagColor: 'rgba(255, 141, 161, 0.7)',
      // Intro overlay (Estritamente Rosa & Branco - Purple Ban mantido)
      introThemeClass: 'theme-kawaii',
      introGridColor: 'rgba(255, 120, 150, 0.14)',
      introAccentColor: '#ff8da1',
      introBorderColor: '#ffffff',
      // 3D Engine
      threeGridColor: 0xff8da1,
      threePointA: 0xff6699,
      threePointB: 0xffffff
    },
    parallaxType: 'kawaii_stars_hearts'
  },
  {
    id: 'matrix',
    name: 'MAINFRAME // VERDE FÓSFORO CRT',
    subtitle: 'NÚCLEO MONOCROMÁTICO VT-100',
    bgmKey: 'bitLizard',
    bgmUrl: "/audio/Bit Lizard's Event.mp3",
    tag: '[ ARENA VIRTUAL // ROOT CRT MAINFRAME ]',
    colors: {
      bgCenter: 'rgba(4, 24, 8, 0.38)',
      bgMid: 'rgba(2, 16, 6, 0.58)',
      bgOuter: 'rgba(1, 8, 3, 0.78)',
      gridLines: 'rgba(0, 255, 102, 0.3)',
      centerDivider: 'rgba(51, 255, 119, 0.7)',
      centerDividerShadow: '#00ff66',
      brackets: 'rgba(0, 255, 102, 0.75)',
      scanlines: 'rgba(0, 255, 102, 0.06)',
      statusTagColor: 'rgba(0, 255, 102, 0.75)',
      // Intro overlay
      introThemeClass: 'theme-matrix',
      introGridColor: 'rgba(0, 255, 102, 0.16)',
      introAccentColor: '#00ff66',
      introBorderColor: '#00ff66',
      // 3D Engine
      threeGridColor: 0x00ff66,
      threePointA: 0x33ff77,
      threePointB: 0x00aa44
    },
    parallaxType: 'matrix_rain'
  }
];

export function getRandomVersusTheme() {
  const idx = Math.floor(Math.random() * VERSUS_ARENA_THEMES.length);
  return VERSUS_ARENA_THEMES[idx];
}

// ════════════════════════════════════════════════════════════════════
// RENDERIZADOR DE FORMAS PARALLAX PROCEDURAIS NO CANVAS 2D DO TABULEIRO
// ════════════════════════════════════════════════════════════════════
export class VersusParallaxRenderer {
  constructor() {
    this.matrixColumns = [];
    this.hexagons = [];
    this.kawaiiItems = [];
    this._initialized = false;
  }

  _initOnce(W, H) {
    if (this._initialized) return;
    this._initialized = true;

    // 1. Matrix Columns (Tema 4: Verde Terminal)
    const colCount = Math.floor(W / 24) || 36;
    for (let i = 0; i < colCount; i++) {
      this.matrixColumns.push({
        x: i * 24 + 10,
        y: Math.random() * -H,
        speed: 1.2 + Math.random() * 2.2,
        chars: '01ABCDEF7X*<>',
        opacity: 0.15 + Math.random() * 0.35,
        length: 8 + Math.floor(Math.random() * 12)
      });
    }

    // 2. Hexagons (Tema 2: Cinza Metálico / Titânio)
    for (let i = 0; i < 18; i++) {
      this.hexagons.push({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: 20 + Math.random() * 32,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.25,
        opacity: 0.12 + Math.random() * 0.18
      });
    }

    // 3. Kawaii Stars & Hearts (Tema 3: Rosinha & Branco)
    for (let i = 0; i < 24; i++) {
      this.kawaiiItems.push({
        x: Math.random() * W,
        y: Math.random() * H,
        type: i % 2 === 0 ? 'star' : 'heart',
        size: 8 + Math.random() * 14,
        vy: -0.2 - Math.random() * 0.35,
        vx: Math.sin(i) * 0.2,
        phase: Math.random() * Math.PI * 2,
        color: i % 3 === 0 ? '#ffffff' : '#ff8da1',
        opacity: 0.18 + Math.random() * 0.28
      });
    }
  }

  draw(ctx, theme, W, H, time) {
    this._initOnce(W, H);
    if (!theme) return;

    ctx.save();

    if (theme.parallaxType === 'metallic_hexagons') {
      this._drawMetallicHexagons(ctx, W, H, time);
    } else if (theme.parallaxType === 'kawaii_stars_hearts') {
      this._drawKawaiiShapes(ctx, W, H, time);
    } else if (theme.parallaxType === 'matrix_rain') {
      this._drawMatrixRain(ctx, W, H, time);
    } else {
      this._drawDefaultParallax(ctx, W, H, time);
    }

    ctx.restore();
  }

  // Tema 1: Padrão (Ondas e nós orbitais digitais)
  _drawDefaultParallax(ctx, W, H, time) {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const baseY = (H * 0.25) * (i + 1);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = baseY + Math.sin(x * 0.015 + time * 0.04 + i) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Tema 2: Cinza Metálico / Titânio (Hexágonos, eixos reflexivos de aço e cruzetas cromadas)
  _drawMetallicHexagons(ctx, W, H, time) {
    ctx.lineWidth = 1.5;

    this.hexagons.forEach(hex => {
      hex.y += hex.vy;
      hex.x += hex.vx;
      hex.rot += hex.rotSpeed;
      if (hex.y < -hex.radius * 2) {
        hex.y = H + hex.radius;
        hex.x = Math.random() * W;
      }

      ctx.save();
      ctx.translate(hex.x, hex.y);
      ctx.rotate(hex.rot);
      ctx.strokeStyle = `rgba(224, 235, 245, ${hex.opacity})`;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.cos(a) * hex.radius;
        const hy = Math.sin(a) * hex.radius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Cruzeta brilhante central no hexágono (reflexo de aço)
      ctx.strokeStyle = `rgba(255, 255, 255, ${hex.opacity * 1.5})`;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Tema 3: Rosinha & Branco Kawaii (Estrelinhas ✦ e corações ASCII <3)
  _drawKawaiiShapes(ctx, W, H, time) {
    this.kawaiiItems.forEach(item => {
      item.y += item.vy;
      item.x += Math.sin(time * 0.03 + item.phase) * 0.3;
      if (item.y < -30) {
        item.y = H + 20;
        item.x = Math.random() * W;
      }

      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = item.color;

      if (item.type === 'star') {
        // Estrela de 4 pontas de terminal ✦
        const s = item.size;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - s);
        ctx.quadraticCurveTo(item.x, item.y, item.x + s, item.y);
        ctx.quadraticCurveTo(item.x, item.y, item.x, item.y + s);
        ctx.quadraticCurveTo(item.x, item.y, item.x - s, item.y);
        ctx.quadraticCurveTo(item.x, item.y, item.x - s, item.y);
        ctx.fill();
      } else {
        // Coração vetorial em formato geométrico fofo <3
        const r = item.size * 0.45;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y + r);
        ctx.arc(item.x - r / 2, item.y - r / 2, r / 2, 0, Math.PI, true);
        ctx.arc(item.x + r / 2, item.y - r / 2, r / 2, 0, Math.PI, true);
        ctx.lineTo(item.x, item.y + r);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // Tema 4: Verde Terminal Mesmo (Chuva Matrix de código fósforo CRT)
  _drawMatrixRain(ctx, W, H, time) {
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';

    this.matrixColumns.forEach(col => {
      col.y += col.speed;
      if (col.y > H + 100) {
        col.y = -col.length * 16;
        col.speed = 1.2 + Math.random() * 2.2;
      }

      for (let j = 0; j < col.length; j++) {
        const charY = col.y + j * 15;
        if (charY >= -10 && charY <= H + 10) {
          const isLead = j === col.length - 1;
          const char = col.chars[(Math.floor(time * 0.1) + j) % col.chars.length];

          ctx.fillStyle = isLead
            ? '#ffffff'
            : `rgba(0, 255, 102, ${col.opacity * (j / col.length)})`;

          ctx.fillText(char, col.x, charY);
        }
      }
    });
  }
}
