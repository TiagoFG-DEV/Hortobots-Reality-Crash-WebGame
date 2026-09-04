// public/js/robot-attack-symbols.js — Símbolos Vetoriais Temáticos Progressivos de Ataque
// Cada robô possui uma linha visual de símbolos que evolui em complexidade geométrica do Tier 1 ao Tier 3.

export function getAttackTacticalConcept(tier) {
  switch (tier) {
    case 1:
      return {
        role: 'DESGASTE & QUEBRA DE ESCUDO FRÁGIL',
        desc: 'Golpe veloz de baixo custo (1 EN). Focado em abaixar o HP de inimigos sem escudo ou quebrar barreiras fracas.',
        shortDesc: 'Abaixa HP ou quebra escudo'
      };
    case 2:
      return {
        role: 'PERFURADOR DE BLINDAGEM + DANO',
        desc: 'Golpe tático equilibrado (3 EN). Projetado especificamente para quebrar o escudo e aplicar dano direto ao mesmo tempo!',
        shortDesc: 'Quebra escudo e causa dano'
      };
    case 3:
    default:
      return {
        role: 'ANIQUILAÇÃO SUPREMA // DETONA COM OU SEM ESCUDO',
        desc: 'Golpe devastador de carga máxima (5/6 EN). Detona e pulveriza o combatente mesmo protegido por escudo reforçado!',
        shortDesc: 'Detona o alvo mesmo com escudo'
      };
  }
}

export function getRobotAttackSymbolSVG(rawId, tier = 1, robotColor = '#00ff66', isReady = true, size = 30) {
  const id = (rawId || 'DB').toUpperCase();
  const strokeColor = isReady ? robotColor : '#556655';
  const fillColor = isReady ? robotColor : '#445544';
  const fillOpacity = isReady ? '0.22' : '0.12';
  const accentColor = isReady ? '#ffffff' : '#778877';
  const glowStyle = isReady ? `filter: drop-shadow(0 0 4px ${robotColor});` : 'opacity: 0.38; filter: grayscale(1);';
  const scaleTransform = isReady ? '' : 'transform="scale(0.88) translate(2.2, 2.2)"';

  let paths = '';

  // 1. DINO-BYTE (Fogo / Labaredas em evolução)
  if (id === 'DB' || id === 'DINOBYTE') {
    if (tier === 1) {
      // Labareda simples com faíscas
      paths = `
        <path d="M16 4C13.5 9 9 13.5 9 19a7 7 0 0 0 14 0c0-5.5-4.5-10-7-15z"
              fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 13c-1.5 2.2-2.5 4-2.5 5.5a2.5 2.5 0 0 0 5 0c0-1.5-1-3.3-2.5-5.5z"
              fill="${strokeColor}"/>
        <circle cx="8" cy="11" r="1" fill="${strokeColor}"/>
        <circle cx="23" cy="9" r="1.2" fill="${strokeColor}"/>
      `;
    } else if (tier === 2) {
      // Bola de fogo dupla em espiral com língua bifurcada
      paths = `
        <path d="M16 2c-3.5 5.5-10 10.5-10 17.5a10 10 0 0 0 20 0c0-4.5-2.5-8.5-4.5-10.5 0 3.5-2.5 5.5-4.5 5.5-2 0-3-1.8-3-3.8 0-2.8 2.5-5.2 2-8.7z"
              fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 10c-2 2.8-5 5.5-5 8.5a5 5 0 0 0 10 0c0-2.8-2-5.5-5-8.5z"
              fill="${isReady ? '#ffd700' : strokeColor}" fill-opacity="0.45" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="16" cy="20" r="2" fill="${accentColor}"/>
      `;
    } else {
      // Vórtice solar flamejante triplo com corona de labaredas expansivas
      paths = `
        <circle cx="16" cy="16" r="6" fill="${isReady ? '#ffd700' : fillColor}" fill-opacity="0.5" stroke="${strokeColor}" stroke-width="2"/>
        <path d="M16 2c1.5 3 0 6-2 7.5M16 30c-1.5-3 0-6 2-7.5M2 16c3-1.5 6 0 7.5 2M30 16c-3 1.5-6 0-7.5-2"
              stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 6c3 1 4.5 4 4 6.5M26 26c-3-1-4.5-4-4-6.5M6 26c1-3 4-4.5 6.5-4M26 6c-1 3-4 4.5-6.5 4"
              stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="2.5" fill="${accentColor}"/>
      `;
    }
  }

  // 2. PENLINUX (Gelo / Cristais 3D / Dado D20)
  else if (id === 'PL' || id === 'PENLINUX') {
    if (tier === 1) {
      // Cubo de gelo isométrico 3D
      paths = `
        <!-- Topo -->
        <polygon points="16,5 25,10.5 16,16 7,10.5"
                 fill="${fillColor}" fill-opacity="0.45" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Face Esquerda -->
        <polygon points="7,10.5 16,16 16,27 7,21.5"
                 fill="${fillColor}" fill-opacity="0.2" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Face Direita -->
        <polygon points="16,16 25,10.5 25,21.5 16,27"
                 fill="${fillColor}" fill-opacity="0.32" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
      `;
    } else if (tier === 2) {
      // Octaedro / Cristal de gelo 3D facetado
      paths = `
        <!-- Topo Bipirâmide -->
        <polygon points="16,3 26,14 16,18 6,14"
                 fill="${fillColor}" fill-opacity="0.4" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Base Bipirâmide -->
        <polygon points="6,14 16,18 16,29"
                 fill="${fillColor}" fill-opacity="0.25" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <polygon points="26,14 16,18 16,29"
                 fill="${fillColor}" fill-opacity="0.35" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <line x1="16" y1="3" x2="16" y2="18" stroke="${accentColor}" stroke-width="1.2" stroke-linecap="round"/>
      `;
    } else {
      // Dado D20 de RPG Icosaédrico Cristalino
      paths = `
        <!-- Triângulo Central do D20 -->
        <polygon points="16,8 24,22 8,22"
                 fill="${fillColor}" fill-opacity="0.48" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <!-- Arestas Externas do D20 -->
        <polygon points="16,2 25,9 24,22 16,29 8,22 7,9"
                 fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Conexões Internas dos Vértices -->
        <line x1="16" y1="2" x2="16" y2="8" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="7" y1="9" x2="16" y2="8" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="25" y1="9" x2="16" y2="8" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="7" y1="9" x2="8" y2="22" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="25" y1="9" x2="24" y2="22" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="8" y1="22" x2="16" y2="29" stroke="${strokeColor}" stroke-width="1.5"/>
        <line x1="24" y1="22" x2="16" y2="29" stroke="${strokeColor}" stroke-width="1.5"/>
        <!-- Numeral Central de 20 Estilizado -->
        <text x="16" y="19" font-family="monospace" font-weight="900" font-size="8" fill="${accentColor}" text-anchor="middle">20</text>
      `;
    }
  }

  // 3. COWPUTER-MOO (Terra / Balística / Magnético)
  else if (id === 'CP' || id === 'COWPUTER') {
    if (tier === 1) {
      // Laço magnético circular com retículo
      paths = `
        <circle cx="16" cy="16" r="9" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2"/>
        <line x1="16" y1="2" x2="16" y2="8" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="24" x2="16" y2="30" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="2" y1="16" x2="8" y2="16" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="16" x2="30" y2="16" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="2.5" fill="${strokeColor}"/>
      `;
    } else if (tier === 2) {
      // Giroscópio magnético duplo com bobinas
      paths = `
        <ellipse cx="16" cy="16" rx="12" ry="5.5" transform="rotate(-30 16 16)"
                 fill="none" stroke="${strokeColor}" stroke-width="2"/>
        <ellipse cx="16" cy="16" rx="12" ry="5.5" transform="rotate(30 16 16)"
                 fill="none" stroke="${strokeColor}" stroke-width="2"/>
        <circle cx="16" cy="16" r="4" fill="${fillColor}" fill-opacity="0.6" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="1.8" fill="${accentColor}"/>
      `;
    } else {
      // Estrela de xerife pentagonal armada com retículo triplo orbital
      paths = `
        <circle cx="16" cy="16" r="13.5" fill="none" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="2 2"/>
        <polygon points="16,4 19,12 28,12 21,17 23,26 16,21 9,26 11,17 4,12 13,12"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="16" cy="16" r="4.5" fill="${isReady ? '#ffd700' : fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="1.5" fill="#000"/>
      `;
    }
  }

  // 4. TIGERVEX (Elétrico / Bobinas Tesla / Raios)
  else if (id === 'TV' || id === 'TIGERVEX') {
    if (tier === 1) {
      // Raio angular de alta tensão
      paths = `
        <polygon points="18,2 8,16 16,16 14,30 25,14 17,14"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="15" cy="15" r="1.5" fill="${accentColor}"/>
      `;
    } else if (tier === 2) {
      // Raio duplo em garras elétricas de titânio
      paths = `
        <!-- Garra Esquerda -->
        <polygon points="13,3 6,15 12,15 10,27 18,13 12,13"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Garra Direita -->
        <polygon points="22,5 15,17 21,17 19,29 27,15 21,15"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <line x1="12" y1="14" x2="21" y2="16" stroke="${accentColor}" stroke-width="1.2"/>
      `;
    } else {
      // Bobina Tesla tripla com arcos voltaicos em 360 graus
      paths = `
        <!-- Bobina Central -->
        <circle cx="16" cy="16" r="5" fill="${fillColor}" fill-opacity="0.5" stroke="${strokeColor}" stroke-width="2"/>
        <!-- 3 Terminais de Arco Voltaico -->
        <path d="M16 11 L16 3 M16 3 L13 6 M16 3 L19 6" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 19 L4 25 M4 25 L8 25 M4 25 L4 21" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 19 L28 25 M28 25 L24 25 M28 25 L28 21" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <!-- Centelhas Radiantes -->
        <path d="M7 11 L10 13 M25 11 L22 13 M16 24 L16 28" stroke="${accentColor}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="2" fill="${accentColor}"/>
      `;
    }
  }

  // 5. PAVABYTE (Luz / Prisma / Fótons)
  else if (id === 'PB' || id === 'PAVABYTE') {
    if (tier === 1) {
      // Triângulo prismático refratando luz
      paths = `
        <polygon points="16,5 27,25 5,25"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <line x1="2" y1="18" x2="11" y2="16" stroke="${accentColor}" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="16" y1="15" x2="29" y2="12" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="18" r="2" fill="${accentColor}"/>
      `;
    } else if (tier === 2) {
      // Prisma hexagonal com leque óptico
      paths = `
        <polygon points="16,4 25,9 25,23 16,28 7,23 7,9"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
        <!-- 4 feixes ópticos convergentes -->
        <line x1="16" y1="16" x2="16" y2="4" stroke="${strokeColor}" stroke-width="1.6"/>
        <line x1="16" y1="16" x2="25" y2="23" stroke="${strokeColor}" stroke-width="1.6"/>
        <line x1="16" y1="16" x2="7" y2="23" stroke="${strokeColor}" stroke-width="1.6"/>
        <circle cx="16" cy="16" r="3.5" fill="${accentColor}"/>
      `;
    } else {
      // Matriz hiper-prismática fractal com 8 feixes convergentes
      paths = `
        <!-- Quadrado 1 -->
        <rect x="7" y="7" width="18" height="18" fill="${fillColor}" fill-opacity="0.3" stroke="${strokeColor}" stroke-width="1.8"/>
        <!-- Quadrado 2 Rotacionado a 45 Graus -->
        <rect x="7" y="7" width="18" height="18" transform="rotate(45 16 16)" fill="none" stroke="${strokeColor}" stroke-width="1.8"/>
        <!-- Ponto focal e feixes solares -->
        <circle cx="16" cy="16" r="4" fill="${isReady ? '#ffd700' : fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="1.5" fill="${accentColor}"/>
      `;
    }
  }

  // 6. QUEZADILHAS (Calango Hacker / Código)
  else {
    if (tier === 1) {
      paths = `
        <rect x="6" y="6" width="20" height="20" rx="3" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2"/>
        <text x="16" y="19" font-family="monospace" font-weight="900" font-size="9" fill="${strokeColor}" text-anchor="middle">[01]</text>
      `;
    } else if (tier === 2) {
      paths = `
        <rect x="5" y="5" width="22" height="22" rx="4" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2"/>
        <path d="M10 12 L16 18 L22 12 M10 17 L16 23 L22 17" stroke="${strokeColor}" stroke-width="2" fill="none" stroke-linecap="round"/>
      `;
    } else {
      paths = `
        <polygon points="16,3 27,9 27,23 16,29 5,23 5,9"
                 fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="2"/>
        <polygon points="16,8 22,12 22,20 16,24 10,20 10,12"
                 fill="${isReady ? '#ffd700' : fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="2" fill="${accentColor}"/>
      `;
    }
  }

  return `
    <svg class="robot-attack-symbol-svg tier-${tier} ${isReady ? 'ready' : 'not-ready'}"
         width="${size}" height="${size}" viewBox="0 0 32 32"
         style="${glowStyle};display:inline-block;vertical-align:middle;transition:all 0.2s ease;">
      <g ${scaleTransform}>
        ${paths}
      </g>
    </svg>
  `;
}
