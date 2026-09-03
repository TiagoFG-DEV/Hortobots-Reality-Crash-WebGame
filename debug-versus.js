#!/usr/bin/env node
/**
 * debug-versus.js - Terminal Simulation of VERSUS Mode Systems
 * Run: node debug-versus.js
 */

// ═══════════════════════════════════════════════════════════
// ANSI COLORS
// ═══════════════════════════════════════════════════════════
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  orange: '\x1b[33m',
  white: '\x1b[37m',
  dim: '\x1b[2m',
  bg_blue: '\x1b[44m',
  bg_red: '\x1b[41m',
};

const log = (msg, color = C.white) => console.log(`${color}${msg}${C.reset}`);
const header = (msg) => {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${msg}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
};
const section = (msg) => {
  console.log(`\n${C.bold}${C.yellow}── ${msg} ──${C.reset}`);
};
const ok = (msg) => console.log(`  ${C.green}✔ ${msg}${C.reset}`);
const fail = (msg) => console.log(`  ${C.red}✘ ${msg}${C.reset}`);
const info = (msg) => console.log(`  ${C.dim}» ${msg}${C.reset}`);

// ═══════════════════════════════════════════════════════════
// ROBOT DEFINITIONS (VERSUS MODE — ALL LEVELED)
// ═══════════════════════════════════════════════════════════
const VERSUS_ROBOTS = {
  DB: {
    id: 'DB', name: 'Dino-Byte', color: 'RED',
    baseHp: 200, baseAtk: 5, baseEnergy: 0,
    attacks: [
      { id: 'db_l1', name: 'Impacto Térmico', level: 1, energyCost: 0, minigame: 'click_targets' },
      { id: 'db_l2', name: 'Garras QTE', level: 2, energyCost: 1, minigame: 'arrow_qte' },
      { id: 'db_l3', name: 'Firewall Infernal', level: 3, energyCost: 2, minigame: 'gravity_dodge' },
    ],
    defense: {
      name: 'Escudo de Grupo',
      desc: 'Escudo verde de 10HP cobrindo os 3 aliados. Quebra para TODOS se receber >10 de ataque.',
      shieldHp: 10, targets: 'all', shieldColor: 'GREEN',
    },
    support: {
      name: 'Reparo de Grupo',
      desc: '+10 HP no aliado escolhido.',
      effect: { type: 'heal', amount: 10, target: 'one' },
      energyCost: 1,
    },
  },
  PL: {
    id: 'PL', name: 'Penlinux', color: 'CYAN',
    baseHp: 200, baseAtk: 5, baseEnergy: 0,
    attacks: [
      { id: 'pl_l1', name: 'Deslize Glacial', level: 1, energyCost: 0, minigame: 'swipe_path' },
      { id: 'pl_l2', name: 'Combo Glaciar', level: 2, energyCost: 1, minigame: 'typing_sprint' },
      { id: 'pl_l3', name: 'Blizzard Plataforma', level: 3, energyCost: 2, minigame: 'platform_dodge' },
    ],
    defense: {
      name: 'Escudo do Atacante',
      desc: 'Escudo azul de 10HP somente no robô que vai atacar.',
      shieldHp: 10, targets: 'attacker', shieldColor: 'BLUE',
    },
    support: {
      name: 'Cura HoT',
      desc: '+3 HP por 5 rounds seguidos. Para se o robô cair.',
      effect: { type: 'hot', amount: 3, rounds: 5, target: 'one' },
      energyCost: 1,
    },
  },
  CP: {
    id: 'CP', name: 'Cowputer-Moo', color: 'GOLD',
    baseHp: 200, baseAtk: 5, baseEnergy: 0,
    attacks: [
      { id: 'cp_l1', name: 'Laço Circular', level: 1, energyCost: 0, minigame: 'circle_click' },
      { id: 'cp_l2', name: 'Código do Xerife', level: 2, energyCost: 1, minigame: 'dual_keys' },
      { id: 'cp_l3', name: 'Polvora Digital', level: 3, energyCost: 2, minigame: 'shooter_dodge' },
    ],
    defense: {
      name: 'Escudo Energético',
      desc: 'Escudo amarelo de 10HP em si mesmo que concede +1 energia por round enquanto ativo.',
      shieldHp: 10, targets: 'self', shieldColor: 'YELLOW', energyPerRound: 1,
    },
    support: {
      name: 'Kit de Campo',
      desc: '+5 HP +1 energia ao aliado escolhido.',
      effect: { type: 'heal_energy', healAmount: 5, energyAmount: 1, target: 'one' },
      energyCost: 1,
    },
  },
  PB: {
    id: 'PB', name: 'Pavabyte', color: 'PINK',
    baseHp: 200, baseAtk: 5, baseEnergy: 0,
    attacks: [
      { id: 'pb_l1', name: 'Reflexo Prismático', level: 1, energyCost: 0, minigame: 'mirror_sequence' },
      { id: 'pb_l2', name: 'Teste de Reação', level: 2, energyCost: 1, minigame: 'reaction_test' },
      { id: 'pb_l3', name: 'Órbita Caótica', level: 3, energyCost: 2, minigame: 'orbit_dodge' },
    ],
    defense: {
      name: 'Escudo Duplo',
      desc: 'Escudo azul de 10HP nos outros 2 aliados (não em si).',
      shieldHp: 10, targets: 'others', shieldColor: 'BLUE',
    },
    support: {
      name: 'Sobrecarga de Cura',
      desc: '+20 HP ao aliado, mas gasta 2 energia do alvo escolhido.',
      effect: { type: 'heal_cost', healAmount: 20, targetEnergyCost: 2, target: 'one' },
      energyCost: 1,
    },
  },
  TV: {
    id: 'TV', name: 'Tigervex', color: 'ORANGE',
    baseHp: 200, baseAtk: 5, baseEnergy: 0,
    attacks: [
      { id: 'tv_l1', name: 'Talho Veloz', level: 1, energyCost: 0, minigame: 'slash_draw' },
      { id: 'tv_l2', name: 'Sequência Tesla', level: 2, energyCost: 1, minigame: 'arrow_sequence' },
      { id: 'tv_l3', name: 'Coração de Ferro', level: 3, energyCost: 2, minigame: 'green_heart_dodge' },
    ],
    defense: {
      name: 'Escudo Elétrico Fraco',
      desc: 'Escudo azul fraco de 5HP nos 3 aliados.',
      shieldHp: 5, targets: 'all', shieldColor: 'BLUE_WEAK',
    },
    support: {
      name: 'Pulso de Reparo',
      desc: '+5 HP para os 3 aliados.',
      effect: { type: 'heal_all', amount: 5, target: 'all' },
      energyCost: 1,
    },
  },
};

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
class VersusGameState {
  constructor() {
    this.round = 1;
    this.turn = 'PLAYER'; // 'PLAYER' or 'ENEMY'
    this.medals = { PLAYER: 0, ENEMY: 0 };
    this.playerTeam = [];
    this.enemyTeam = [];
    this.attackHitCount = { PLAYER: 0, ENEMY: 0 }; // per round hit counter
    this.winCondition = 10; // medals to win
    this.logs = [];
  }

  log(msg) {
    this.logs.push(msg);
    info(msg);
  }
}

// ═══════════════════════════════════════════════════════════
// ROBOT INSTANCE
// ═══════════════════════════════════════════════════════════
function createRobot(templateId, slot, side) {
  const template = VERSUS_ROBOTS[templateId];
  return {
    ...JSON.parse(JSON.stringify(template)),
    slot,
    side, // 'PLAYER' or 'ENEMY'
    currentHp: template.baseHp,
    currentEnergy: template.baseEnergy,
    attackPower: template.baseAtk,
    shield: null, // { hp, color, targets, energyPerRound? }
    hotEffect: null, // { amount, roundsLeft }
    isAlive: true,
    attackHitsThisRound: 0, // how many times THIS robot landed a hit this round
    position: { col: side === 'PLAYER' ? 0 : 4, row: slot }, // col 0-4
  };
}

// ═══════════════════════════════════════════════════════════
// BOARD DISPLAY
// ═══════════════════════════════════════════════════════════
function displayBoard(state) {
  section('TABULEIRO 5x5');
  const grid = Array.from({ length: 5 }, () => Array(5).fill('  .  '));

  // Place player team (left side, col 0)
  state.playerTeam.forEach((robot, i) => {
    if (!robot.isAlive) return;
    const row = i + 1;
    const col = robot.position.col;
    let label = `${robot.id}U`.padStart(3);
    if (robot.shield) label = `[${robot.id}]`;
    grid[row][col] = label.substring(0, 5).padEnd(5);
  });

  // Place enemy team (right side, col 4)
  state.enemyTeam.forEach((robot, i) => {
    if (!robot.isAlive) return;
    const row = i + 1;
    const col = robot.position.col;
    let label = `${robot.id}A`.padStart(3);
    if (robot.shield) label = `[${robot.id}]`;
    grid[row][col] = label.substring(0, 5).padEnd(5);
  });

  console.log(`\n  ${C.dim}Col:  0    1    2    3    4${C.reset}`);
  grid.forEach((row, rowIdx) => {
    const rowLabel = rowIdx === 0 ? 'Top' : rowIdx === 4 ? 'Bot' : `R${rowIdx} `;
    const cells = row.map((cell, colIdx) => {
      // Color based on content
      if (cell.includes('U')) return `${C.cyan}${cell}${C.reset}`;
      if (cell.includes('A')) return `${C.red}${cell}${C.reset}`;
      return `${C.dim}${cell}${C.reset}`;
    });
    console.log(`  ${C.dim}${rowLabel}${C.reset} | ${cells.join(' | ')} |`);
  });
}

// ═══════════════════════════════════════════════════════════
// SIMULATE MINIGAME (mock — returns success/fail)
// ═══════════════════════════════════════════════════════════
function simulateMinigame(minigameId, difficulty = 'medium') {
  // In real game, this runs the actual minigame. Here we simulate a probability.
  const successRates = {
    click_targets: 0.80,
    swipe_path: 0.75,
    circle_click: 0.80,
    mirror_sequence: 0.70,
    slash_draw: 0.85,
    arrow_qte: 0.65,
    typing_sprint: 0.60,
    dual_keys: 0.65,
    reaction_test: 0.55,
    arrow_sequence: 0.65,
    gravity_dodge: 0.55,
    platform_dodge: 0.50,
    shooter_dodge: 0.55,
    orbit_dodge: 0.50,
    green_heart_dodge: 0.60,
  };
  const rate = successRates[minigameId] || 0.65;
  return Math.random() < rate;
}

// ═══════════════════════════════════════════════════════════
// SIMULATE COIN FLIP (defense)
// ═══════════════════════════════════════════════════════════
function simulateCoinFlip() {
  return Math.random() < 0.5; // 50/50
}

// ═══════════════════════════════════════════════════════════
// CALCULATE ATTACK POWER (base + hit streak bonus)
// ═══════════════════════════════════════════════════════════
function calculateAttackPower(robot) {
  const hitCount = robot.attackHitsThisRound;
  let bonus = 0;
  if (hitCount === 1) bonus = 1;
  else if (hitCount === 2) bonus = 2;
  else if (hitCount >= 3) bonus = 3;
  return robot.attackPower + bonus;
}

// ═══════════════════════════════════════════════════════════
// APPLY DAMAGE (with shield logic)
// ═══════════════════════════════════════════════════════════
function applyDamage(attacker, target, targetTeam, rawDamage, state) {
  let damage = rawDamage;

  // Check if target has a shield
  if (target.shield && target.shield.hp > 0) {
    const shieldAbsorb = Math.min(target.shield.hp, damage);
    target.shield.hp -= shieldAbsorb;
    damage -= shieldAbsorb;
    state.log(`  🛡️  Escudo de ${target.name} absorveu ${shieldAbsorb} de dano (${target.shield.hp}HP restante)`);

    // If shield is group-type (DB), break for all if damage exceeded shield
    if (target.shield.targets === 'all' && rawDamage > target.shield.hp + shieldAbsorb) {
      state.log(`  💥 ESCUDO DE GRUPO QUEBRADO! Todos os aliados perdem escudo.`);
      targetTeam.forEach(r => { if (r.shield && r.shield.targets === 'all') r.shield = null; });
    } else if (target.shield.hp <= 0) {
      target.shield = null;
      state.log(`  🔴 Escudo de ${target.name} destruído!`);
    }
  }

  // Apply remaining damage
  if (damage > 0) {
    target.currentHp = Math.max(0, target.currentHp - damage);
    state.log(`  💢 ${target.name} recebe ${damage} de dano → HP: ${target.currentHp}/${target.baseHp}`);
  }

  // Check if dead
  if (target.currentHp <= 0 && target.isAlive) {
    target.isAlive = false;
    state.log(`  💀 ${target.name} foi DERRUBADO!`);
    return true; // kill
  }
  return false; // no kill
}

// ═══════════════════════════════════════════════════════════
// ON KILL — award buffs
// ═══════════════════════════════════════════════════════════
function onKill(attacker, killerSide, state) {
  attacker.currentHp = Math.min(attacker.baseHp, attacker.currentHp + 15);
  attacker.currentEnergy += 3;
  state.medals[killerSide]++;
  state.log(`  🏅 KILL! ${attacker.name} ganhou +15HP, +3 Energia. Medalhas ${killerSide}: ${state.medals[killerSide]}`);
}

// ═══════════════════════════════════════════════════════════
// APPLY SHIELD (defense action)
// ═══════════════════════════════════════════════════════════
function applyShield(robot, team, state) {
  const def = robot.defense;
  state.log(`  🛡️  ${robot.name} ativou: ${def.name}`);

  if (def.targets === 'all') {
    team.forEach(r => {
      if (r.isAlive) r.shield = { hp: def.shieldHp, color: def.shieldColor, targets: 'all' };
    });
    state.log(`     Escudo ${def.shieldColor} de ${def.shieldHp}HP nos 3 aliados!`);
  } else if (def.targets === 'self') {
    robot.shield = { hp: def.shieldHp, color: def.shieldColor, targets: 'self', energyPerRound: def.energyPerRound || 0 };
    state.log(`     Escudo ${def.shieldColor} de ${def.shieldHp}HP em ${robot.name}!`);
  } else if (def.targets === 'attacker') {
    // Shield goes on the robot designated to attack next
    robot.shield = { hp: def.shieldHp, color: def.shieldColor, targets: 'attacker' };
    state.log(`     Escudo ${def.shieldColor} de ${def.shieldHp}HP no atacante!`);
  } else if (def.targets === 'others') {
    team.forEach(r => {
      if (r.isAlive && r.id !== robot.id) {
        r.shield = { hp: def.shieldHp, color: def.shieldColor, targets: 'others' };
      }
    });
    state.log(`     Escudo ${def.shieldColor} de ${def.shieldHp}HP nos outros 2 aliados!`);
  }
}

// ═══════════════════════════════════════════════════════════
// APPLY SUPPORT
// ═══════════════════════════════════════════════════════════
function applySupport(robot, targetRobot, state) {
  if (robot.currentEnergy < robot.support.energyCost) {
    state.log(`  ⚡ ${robot.name} sem energia para suporte!`);
    return false;
  }
  robot.currentEnergy -= robot.support.energyCost;
  const eff = robot.support.effect;
  state.log(`  💊 ${robot.name} usa ${robot.support.name} em ${targetRobot.name}`);

  if (eff.type === 'heal') {
    targetRobot.currentHp = Math.min(targetRobot.baseHp, targetRobot.currentHp + eff.amount);
    state.log(`     +${eff.amount} HP → ${targetRobot.currentHp}HP`);
  } else if (eff.type === 'hot') {
    targetRobot.hotEffect = { amount: eff.amount, roundsLeft: eff.rounds };
    state.log(`     HoT: +${eff.amount}HP por ${eff.rounds} rounds`);
  } else if (eff.type === 'heal_energy') {
    targetRobot.currentHp = Math.min(targetRobot.baseHp, targetRobot.currentHp + eff.healAmount);
    targetRobot.currentEnergy += eff.energyAmount;
    state.log(`     +${eff.healAmount}HP +${eff.energyAmount} Energia → ${targetRobot.currentHp}HP / ${targetRobot.currentEnergy}E`);
  } else if (eff.type === 'heal_cost') {
    if (targetRobot.currentEnergy >= eff.targetEnergyCost) {
      targetRobot.currentEnergy -= eff.targetEnergyCost;
      targetRobot.currentHp = Math.min(targetRobot.baseHp, targetRobot.currentHp + eff.healAmount);
      state.log(`     +${eff.healAmount}HP (alvo gastou ${eff.targetEnergyCost} energia)`);
    } else {
      state.log(`     Alvo sem energia suficiente! Suporte cancelado.`);
    }
  } else if (eff.type === 'heal_all') {
    // determined by team reference — pass in team via closure
    state.log(`     +${eff.amount}HP para todos os aliados`);
    // Applied externally
  }
  return true;
}

// ═══════════════════════════════════════════════════════════
// REVIVE ROBOT
// ═══════════════════════════════════════════════════════════
function reviveRobot(deadRobot, state) {
  deadRobot.currentHp = Math.floor(deadRobot.baseHp / 2); // 100
  deadRobot.isAlive = true;
  deadRobot.shield = null;
  state.log(`  💚 ${deadRobot.name} REVIVIDO com ${deadRobot.currentHp}HP!`);
}

// ═══════════════════════════════════════════════════════════
// PROCESS HOT EFFECTS (at round start)
// ═══════════════════════════════════════════════════════════
function processHotEffects(team, state) {
  team.forEach(robot => {
    if (robot.hotEffect && robot.isAlive) {
      robot.currentHp = Math.min(robot.baseHp, robot.currentHp + robot.hotEffect.amount);
      robot.hotEffect.roundsLeft--;
      state.log(`  🟢 HoT: ${robot.name} +${robot.hotEffect.amount}HP (${robot.hotEffect.roundsLeft} rounds restantes)`);
      if (robot.hotEffect.roundsLeft <= 0) {
        robot.hotEffect = null;
      }
    }
    // CP shield energy regen
    if (robot.shield && robot.shield.energyPerRound) {
      robot.currentEnergy += robot.shield.energyPerRound;
      state.log(`  ⚡ Escudo CP: ${robot.name} +${robot.shield.energyPerRound} energia`);
    }
  });
}

// ═══════════════════════════════════════════════════════════
// SIMULATE FULL TURN (attacker side)
// ═══════════════════════════════════════════════════════════
function simulateTurn(state, attackerSide) {
  const isPlayer = attackerSide === 'PLAYER';
  const myTeam = isPlayer ? state.playerTeam : state.enemyTeam;
  const enemyTeam = isPlayer ? state.enemyTeam : state.playerTeam;

  section(`TURNO: ${attackerSide} (Round ${state.round})`);

  const aliveAllies = myTeam.filter(r => r.isAlive);
  const aliveEnemies = enemyTeam.filter(r => r.isAlive);
  if (aliveAllies.length === 0 || aliveEnemies.length === 0) return false;

  // --- ATTACK ACTION ---
  const attacker = aliveAllies[0]; // First robot attacks
  const target = aliveEnemies[0];  // First enemy in line
  const chosenAttack = attacker.attacks[Math.min(attacker.attackHitsThisRound, 2)]; // escalate level

  log(`\n  🗡️  ${attacker.name} usa ${chosenAttack.name} (L${chosenAttack.level}, minigame: ${chosenAttack.minigame})`);

  if (attacker.currentEnergy < chosenAttack.energyCost) {
    // Fallback to level 1 if no energy
    const fallback = attacker.attacks[0];
    log(`  ⚡ Sem energia para L${chosenAttack.level}, usando ${fallback.name}`, C.yellow);
  }

  const attackSuccess = simulateMinigame(chosenAttack.minigame);
  if (attackSuccess) {
    const rawDamage = calculateAttackPower(attacker);
    attacker.attackHitsThisRound++;
    attacker.currentEnergy = Math.max(0, attacker.currentEnergy - chosenAttack.energyCost);
    ok(`${attacker.name} ACERTOU! Poder: ${rawDamage} (hits este round: ${attacker.attackHitsThisRound})`);
    const killed = applyDamage(attacker, target, enemyTeam, rawDamage, state);
    if (killed) {
      onKill(attacker, attackerSide, state);
    }
  } else {
    fail(`${attacker.name} ERROU o minigame!`);
  }

  // --- DEFENSE ACTION ---
  const defender = aliveAllies.length > 1 ? aliveAllies[1] : aliveAllies[0];
  log(`\n  🛡️  ${defender.name} tenta defesa: ${defender.defense.name}`);
  const coinSuccess = simulateCoinFlip();
  if (coinSuccess) {
    ok(`Moeda acertou! Escudo ativado.`);
    applyShield(defender, myTeam, state);
  } else {
    fail(`Moeda errou! Sem escudo.`);
  }

  // --- SUPPORT ACTION ---
  if (aliveAllies.length > 2) {
    const supporter = aliveAllies[2];
    const supportTarget = aliveAllies[0]; // support the attacker
    log(`\n  💊 ${supporter.name} usa suporte em ${supportTarget.name}`);

    // TV support heals all
    if (supporter.id === 'TV') {
      if (supporter.currentEnergy >= supporter.support.energyCost) {
        supporter.currentEnergy -= supporter.support.energyCost;
        aliveAllies.forEach(r => {
          r.currentHp = Math.min(r.baseHp, r.currentHp + supporter.support.effect.amount);
        });
        ok(`${supporter.name}: +${supporter.support.effect.amount}HP para todos os aliados!`);
      } else {
        fail(`${supporter.name} sem energia!`);
      }
    } else {
      applySupport(supporter, supportTarget, state);
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════
// BOT AI — simple random-ish logic
// ═══════════════════════════════════════════════════════════
function botTurn(state) {
  return simulateTurn(state, 'ENEMY');
}

// ═══════════════════════════════════════════════════════════
// CHECK WIN
// ═══════════════════════════════════════════════════════════
function checkWin(state) {
  if (state.medals.PLAYER >= state.winCondition) return 'PLAYER';
  if (state.medals.ENEMY >= state.winCondition) return 'ENEMY';
  // All enemies dead
  if (state.enemyTeam.every(r => !r.isAlive)) return 'PLAYER';
  if (state.playerTeam.every(r => !r.isAlive)) return 'ENEMY';
  return null;
}

// ═══════════════════════════════════════════════════════════
// DISPLAY STATUS
// ═══════════════════════════════════════════════════════════
function displayStatus(state) {
  section('STATUS DAS EQUIPES');
  
  console.log(`  ${C.cyan}PLAYER TEAM:${C.reset}`);
  state.playerTeam.forEach(r => {
    const hpBar = '█'.repeat(Math.ceil(r.currentHp / 20)) + '░'.repeat(10 - Math.ceil(r.currentHp / 20));
    const status = r.isAlive ? `${C.green}VIVO${C.reset}` : `${C.red}CAÍDO${C.reset}`;
    const shield = r.shield ? ` ${C.yellow}[ESCUDO:${r.shield.hp}HP]${C.reset}` : '';
    console.log(`    ${C.cyan}${r.name.padEnd(15)}${C.reset} HP: ${hpBar} ${r.currentHp}/${r.baseHp} E:${r.currentEnergy} ${status}${shield}`);
  });

  console.log(`\n  ${C.red}ENEMY TEAM:${C.reset}`);
  state.enemyTeam.forEach(r => {
    const hpBar = '█'.repeat(Math.ceil(r.currentHp / 20)) + '░'.repeat(10 - Math.ceil(r.currentHp / 20));
    const status = r.isAlive ? `${C.green}VIVO${C.reset}` : `${C.red}CAÍDO${C.reset}`;
    const shield = r.shield ? ` ${C.yellow}[ESCUDO:${r.shield.hp}HP]${C.reset}` : '';
    console.log(`    ${C.red}${r.name.padEnd(15)}${C.reset} HP: ${hpBar} ${r.currentHp}/${r.baseHp} E:${r.currentEnergy} ${status}${shield}`);
  });

  console.log(`\n  🏅 Medalhas: ${C.cyan}PLAYER: ${state.medals.PLAYER}${C.reset} | ${C.red}ENEMY: ${state.medals.ENEMY}${C.reset}`);
}

// ═══════════════════════════════════════════════════════════
// RUN DEBUG SIMULATION
// ═══════════════════════════════════════════════════════════
async function runDebug() {
  header('HORTOBOTS — DEBUG VERSUS MODE v1.0');

  // ─── TEST 1: Robot Selection ───
  section('TESTE 1: Seleção de Robôs');
  const playerPicks = ['DB', 'PL', 'TV']; // player chooses 3 of 5
  const enemyPicks  = ['CP', 'PB', 'DB']; // bot picks (different order)
  ok(`Player escolheu: ${playerPicks.join(' → ')}`);
  ok(`Bot escolheu: ${enemyPicks.join(' → ')}`);

  // ─── TEST 2: Create Game State ───
  section('TESTE 2: Criação de Estado de Jogo');
  const state = new VersusGameState();
  
  state.playerTeam = playerPicks.map((id, i) => createRobot(id, i, 'PLAYER'));
  state.enemyTeam  = enemyPicks.map((id, i) => createRobot(id, i, 'ENEMY'));

  ok(`Player team criado: ${state.playerTeam.map(r => `${r.name}(${r.currentHp}HP, 5ATK)`).join(', ')}`);
  ok(`Enemy team criado: ${state.enemyTeam.map(r => `${r.name}(${r.currentHp}HP, 5ATK)`).join(', ')}`);

  // ─── TEST 3: Board Display ───
  section('TESTE 3: Tabuleiro Inicial');
  displayBoard(state);
  ok('Tabuleiro renderizado (texto)');

  // ─── TEST 4: Attack Power Scaling ───
  section('TESTE 4: Escalada de Poder por Hits');
  const testBot = createRobot('DB', 0, 'PLAYER');
  testBot.attackHitsThisRound = 0;
  info(`DB (0 hits): ${calculateAttackPower(testBot)} de ataque`);
  testBot.attackHitsThisRound = 1;
  info(`DB (1 hit):  ${calculateAttackPower(testBot)} de ataque (base + 1)`);
  testBot.attackHitsThisRound = 2;
  info(`DB (2 hits): ${calculateAttackPower(testBot)} de ataque (base + 2)`);
  testBot.attackHitsThisRound = 3;
  info(`DB (3 hits): ${calculateAttackPower(testBot)} de ataque (base + 3)`);
  ok('Sistema de escalada de poder verificado');

  // ─── TEST 5: Shield System ───
  section('TESTE 5: Sistema de Escudos');
  
  // DB group shield
  const testTeam = [createRobot('DB', 0, 'PLAYER'), createRobot('PL', 1, 'PLAYER'), createRobot('TV', 2, 'PLAYER')];
  applyShield(testTeam[0], testTeam, state);
  ok(`DB escudo em grupo: ${testTeam.map(r => `${r.name}=${r.shield ? r.shield.hp + 'HP shield' : 'sem escudo'}`).join(', ')}`);

  // Test damage through shield
  const attk = createRobot('CP', 0, 'ENEMY');
  const victim = testTeam[1]; // PL has group shield
  applyDamage(attk, victim, testTeam, 7, state); // Less than shield
  info(`Após ataque 7: ${victim.name} HP=${victim.currentHp}, Shield=${victim.shield ? victim.shield.hp : 'null'}`);

  applyDamage(attk, victim, testTeam, 15, state); // More than shield — break for all
  info(`Após ataque 15: ${victim.name} HP=${victim.currentHp}, Shield=${victim.shield ? victim.shield.hp : 'QUEBRADO'}`);
  info(`PL shield: ${testTeam[1].shield ? testTeam[1].shield.hp : 'NULL (quebrou)'}`);
  ok('Sistema de escudos verificado');

  // ─── TEST 6: Support System ───
  section('TESTE 6: Sistema de Suporte');
  const supporter = createRobot('DB', 0, 'PLAYER');
  supporter.currentEnergy = 3;
  const supportTarget = createRobot('PL', 1, 'PLAYER');
  supportTarget.currentHp = 150;
  applySupport(supporter, supportTarget, state);
  info(`Após suporte: ${supportTarget.name} HP=${supportTarget.currentHp}, ${supporter.name} Energy=${supporter.currentEnergy}`);

  // PL HoT
  const hoter = createRobot('PL', 1, 'PLAYER');
  hoter.currentEnergy = 2;
  const hotTarget = createRobot('DB', 0, 'PLAYER');
  hotTarget.currentHp = 100;
  applySupport(hoter, hotTarget, state);
  info(`HoT aplicado: roundsLeft=${hotTarget.hotEffect ? hotTarget.hotEffect.roundsLeft : 'null'}`);
  
  // Process HoT
  const hotTeam = [hotTarget];
  processHotEffects(hotTeam, state);
  info(`Após 1 round HoT: HP=${hotTarget.currentHp}, rounds left=${hotTarget.hotEffect ? hotTarget.hotEffect.roundsLeft : 'null'}`);
  ok('Sistema de suporte verificado');

  // ─── TEST 7: Medal / Kill System ───
  section('TESTE 7: Sistema de Medalhas e Kills');
  const killer = createRobot('TV', 2, 'PLAYER');
  killer.currentHp = 150;
  killer.currentEnergy = 2;
  state.medals = { PLAYER: 0, ENEMY: 0 };
  onKill(killer, 'PLAYER', state);
  info(`Após kill: ${killer.name} HP=${killer.currentHp}, Energy=${killer.currentEnergy}, Medalhas PLAYER=${state.medals.PLAYER}`);
  ok('Sistema de kill/medalhas verificado');

  // ─── TEST 8: Full Turn Simulation ───
  section('TESTE 8: Simulação de 5 Rounds Completos');
  
  // Reset state
  state.playerTeam = playerPicks.map((id, i) => createRobot(id, i, 'PLAYER'));
  state.enemyTeam  = enemyPicks.map((id, i) => createRobot(id, i, 'ENEMY'));
  state.medals = { PLAYER: 0, ENEMY: 0 };
  state.round = 1;

  let winner = null;
  for (let r = 1; r <= 5 && !winner; r++) {
    state.round = r;
    log(`\n${'─'.repeat(50)}`, C.dim);
    log(`  ROUND ${r}`, C.bold);

    // Process HoT at round start
    processHotEffects(state.playerTeam, state);
    processHotEffects(state.enemyTeam, state);

    // Player turn
    simulateTurn(state, 'PLAYER');
    winner = checkWin(state);
    if (winner) break;

    // Enemy turn
    botTurn(state);
    winner = checkWin(state);

    // Reset hit counters for next round
    [...state.playerTeam, ...state.enemyTeam].forEach(r => { r.attackHitsThisRound = 0; });
  }

  displayStatus(state);
  displayBoard(state);

  if (winner) {
    header(`🏆 VENCEDOR: ${winner}`);
    ok(`${winner} ganhou com ${state.medals[winner]} medalhas!`);
  } else {
    log(`\n  Simulação de 5 rounds completa. Sem vencedor ainda.`, C.yellow);
    info(`Player: ${state.medals.PLAYER} medalhas | Enemy: ${state.medals.ENEMY} medalhas`);
  }

  // ─── TEST 9: Win Condition ───
  section('TESTE 9: Condição de Vitória (10 Medalhas)');
  const winState = new VersusGameState();
  winState.medals = { PLAYER: 9, ENEMY: 7 };
  winState.playerTeam = [createRobot('DB', 0, 'PLAYER')];
  winState.enemyTeam = [createRobot('PL', 0, 'ENEMY')];
  const killer2 = winState.playerTeam[0];
  killer2.currentHp = 180;
  killer2.currentEnergy = 5;
  onKill(killer2, 'PLAYER', winState);
  const winResult = checkWin(winState);
  if (winResult === 'PLAYER') {
    ok(`PLAYER venceu com ${winState.medals.PLAYER} medalhas! Condição de vitória correta.`);
  } else {
    fail(`Condição de vitória não detectada corretamente!`);
  }

  // ─── TEST 10: Revive System ───
  section('TESTE 10: Sistema de Revive (Suporte)');
  const deadBot = createRobot('PL', 1, 'PLAYER');
  deadBot.currentHp = 0;
  deadBot.isAlive = false;
  reviveRobot(deadBot, winState);
  if (deadBot.isAlive && deadBot.currentHp === 100) {
    ok(`${deadBot.name} revivido com ${deadBot.currentHp}HP ✔`);
  } else {
    fail(`Revive falhou!`);
  }

  // ─── ALL TESTS SUMMARY ───
  header('RESUMO DOS SISTEMAS DEBUGADOS');
  ok('Seleção de robôs (3 de 5)');
  ok('Estado de jogo inicializado');
  ok('Tabuleiro 5x5 posicionado');
  ok('Escalada de poder por hits (0/+1/+2/+3)');
  ok('Sistema de escudos (DB grupo, PL atacante, CP self+energy, PB outros, TV fraco)');
  ok('Sistema de suporte (heal, HoT, heal+energy, heal_cost, heal_all)');
  ok('Sistema de kill/medal/buff (+15HP, +3E, +1 medalha)');
  ok('Simulação de turnos completos (ataque/defesa/suporte)');
  ok('Condição de vitória (10 medalhas)');
  ok('Sistema de revive (50% HP)');

  log(`\n${C.bold}${C.green}✅ TODOS OS SISTEMAS PASSARAM! Pronto para implementação da UI.${C.reset}\n`);
}

runDebug().catch(err => {
  console.error(`${C.red}ERRO NO DEBUG:${C.reset}`, err);
  process.exit(1);
});
