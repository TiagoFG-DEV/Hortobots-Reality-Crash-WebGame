// ═══════════════════════════════════════════════════════════════════
// versus-engine.js — Motor Central do Modo VERSUS
// ═══════════════════════════════════════════════════════════════════

// ── Robot Definitions (all leveled for VERSUS) ─────────────────────
export const VERSUS_ROBOTS = {
  DB: {
    id: 'DB', name: 'Dino-Byte', color: '#ff3344', colorName: 'RED',
    baseHp: 200, baseAtk: 1, baseEnergy: 0,
    attacks: [
      { id: 'db_l1', name: 'Impacto Térmico',    level: 1, energyCost: 1, minigame: 'click_targets',  desc: 'Clique os meteoros antes que somam!' },
      { id: 'db_l2', name: 'Garras QTE',          level: 2, energyCost: 2, minigame: 'arrow_qte',     desc: 'Pressione as setas em sequência rápida!' },
      { id: 'db_l3', name: 'Firewall Infernal',   level: 3, energyCost: 4, minigame: 'gravity_dodge', desc: 'Esquive com gravidade — pule com ESPAÇO!' },
    ],
    defense: {
      name: 'Escudo de Grupo Verde',
      desc: 'Escudo verde de 10HP cobrindo os 3 aliados. Quebra para TODOS se receber >10 em qualquer robô.',
      shieldHp: 10, targets: 'all', shieldColor: '#00ff88', energyCost: 1,
    },
    support: {
      name: 'Reparo de Grupo',
      desc: '+10 HP no aliado escolhido.',
      effect: { type: 'heal', amount: 10, target: 'one' },
      energyCost: 2,
    },
  },
  PL: {
    id: 'PL', name: 'Penlinux', color: '#00e5ff', colorName: 'CYAN',
    baseHp: 200, baseAtk: 1, baseEnergy: 0,
    attacks: [
      { id: 'pl_l1', name: 'Deslize Glacial',    level: 1, energyCost: 1, minigame: 'swipe_path',     desc: 'Arraste o cursor pelo caminho de gelo!' },
      { id: 'pl_l2', name: 'Combo Glaciar',       level: 2, energyCost: 2, minigame: 'typing_sprint',  desc: 'Digite a palavra antes do tempo acabar!' },
      { id: 'pl_l3', name: 'Blizzard Plataforma', level: 3, energyCost: 4, minigame: 'platform_dodge', desc: 'Pule entre plataformas coletando gemas!' },
    ],
    defense: {
      name: 'Escudo do Atacante',
      desc: 'Escudo azul de 10HP somente no robô que vai atacar.',
      shieldHp: 10, targets: 'attacker', shieldColor: '#00e5ff', energyCost: 1,
    },
    support: {
      name: 'Cura Progressiva',
      desc: '+3 HP por 5 rounds seguidos. Para se o robô cair.',
      effect: { type: 'hot', amount: 3, rounds: 5, target: 'one' },
      energyCost: 2,
    },
  },
  CP: {
    id: 'CP', name: 'Cowputer-Moo', color: '#ffd700', colorName: 'GOLD',
    baseHp: 200, baseAtk: 1, baseEnergy: 0,
    attacks: [
      { id: 'cp_l1', name: 'Laço Circular',    level: 1, energyCost: 1, minigame: 'circle_click',  desc: 'Clique os pontos no sentido do laço!' },
      { id: 'cp_l2', name: 'Código do Xerife', level: 2, energyCost: 2, minigame: 'dual_keys',     desc: 'Pressione duas teclas simultaneamente!' },
      { id: 'cp_l3', name: 'Pólvora Digital',  level: 3, energyCost: 5, minigame: 'shooter_dodge', desc: 'Desvie e destrua projéteis inimigos!' },
    ],
    defense: {
      name: 'Escudo Energético Amarelo',
      desc: 'Escudo amarelo de 10HP em si mesmo. Gera +1 energia por round enquanto ativo.',
      shieldHp: 10, targets: 'self', shieldColor: '#ffd700', energyPerRound: 1, energyCost: 1,
    },
    support: {
      name: 'Kit de Campo',
      desc: '+5 HP e +1 energia ao aliado escolhido.',
      effect: { type: 'heal_energy', healAmount: 5, energyAmount: 1, target: 'one' },
      energyCost: 2,
    },
  },
  PB: {
    id: 'PB', name: 'Pavabyte', color: '#ff69b4', colorName: 'PINK',
    baseHp: 200, baseAtk: 1, baseEnergy: 0,
    attacks: [
      { id: 'pb_l1', name: 'Reflexo Prismático', level: 1, energyCost: 1, minigame: 'mirror_sequence', desc: 'Clique os espelhos na ordem certa!' },
      { id: 'pb_l2', name: 'Teste de Reação',    level: 2, energyCost: 3, minigame: 'reaction_test',   desc: 'Pressione ESPAÇO assim que a tela acender!' },
      { id: 'pb_l3', name: 'Órbita Caótica',     level: 3, energyCost: 4, minigame: 'orbit_dodge',     desc: 'Controle a velocidade orbital para desviar!' },
    ],
    defense: {
      name: 'Escudo Duplo Azul',
      desc: 'Escudo azul de 10HP nos outros 2 aliados (não em si).',
      shieldHp: 10, targets: 'others', shieldColor: '#00e5ff', energyCost: 1,
    },
    support: {
      name: 'Sobrecarga de Cura',
      desc: '+20 HP ao aliado, mas gasta 2 energia do alvo.',
      effect: { type: 'heal_cost', healAmount: 20, targetEnergyCost: 2, target: 'one' },
      energyCost: 3,
    },
  },
  TV: {
    id: 'TV', name: 'Tigervex', color: '#ff8c00', colorName: 'ORANGE',
    baseHp: 200, baseAtk: 1, baseEnergy: 0,
    attacks: [
      { id: 'tv_l1', name: 'Talho Veloz',      level: 1, energyCost: 1, minigame: 'slash_draw',      desc: 'Arraste rapidamente sobre as linhas!' },
      { id: 'tv_l2', name: 'Sequência Tesla',  level: 2, energyCost: 2, minigame: 'arrow_sequence',  desc: '5 setas em 2 segundos — rápido!' },
      { id: 'tv_l3', name: 'Coração de Ferro', level: 3, energyCost: 5, minigame: 'green_heart_dodge', desc: 'Defenda-se usando as setas direcionais!' },
    ],
    defense: {
      name: 'Escudo Elétrico Fraco',
      desc: 'Escudo azul fraco de 5HP nos 3 aliados.',
      shieldHp: 5, targets: 'all', shieldColor: '#88aaff', energyCost: 1,
    },
    support: {
      name: 'Pulso de Reparo',
      desc: '+5 HP para todos os 3 aliados.',
      effect: { type: 'heal_all', amount: 5, target: 'all' },
      energyCost: 2,
    },
  },
};

export const ROBOT_KEYS = Object.keys(VERSUS_ROBOTS);

// ── Create Robot Instance ────────────────────────────────────────────
export function createVersusRobot(templateId, slot, side) {
  const tpl = VERSUS_ROBOTS[templateId];
  return {
    ...JSON.parse(JSON.stringify(tpl)),
    slot,
    side,
    currentHp: tpl.baseHp,
    currentEnergy: tpl.baseEnergy,
    attackPower: tpl.baseAtk,
    maxHp: tpl.baseHp,
    shield: null,
    hotEffect: null,
    isAlive: true,
    isSelected: false,
    action: null, // 'attack' | 'defense' | 'support'
    attackHitsThisRound: 0,
    col: side === 'PLAYER' ? 0 : 4,
    row: slot + 1, // rows 1-3
    animState: 'idle', // 'idle' | 'stepping' | 'attacking' | 'returning'
    animProgress: 0,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

// ── Game State ──────────────────────────────────────────────────────
export class VersusEngine {
  constructor() {
    this.energyConfig = null;
    this.reset();
  }

  async loadEnergyConfig() {
    try {
      const res = await fetch('/data/energy-config.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.robots) {
        for (const [botKey, botCfg] of Object.entries(data.robots)) {
          const tpl = VERSUS_ROBOTS[botKey];
          if (!tpl) continue;
          if (botCfg.attacks) {
            for (const [atkId, atkCfg] of Object.entries(botCfg.attacks)) {
              const atk = tpl.attacks.find(a => a.id === atkId);
              if (atk && typeof atkCfg.energyCost === 'number') {
                atk.energyCost = Math.max(1, Math.min(5, atkCfg.energyCost));
              }
            }
          }
          if (botCfg.defense && typeof botCfg.defense.energyCost === 'number') {
            tpl.defense.energyCost = Math.max(1, Math.min(5, botCfg.defense.energyCost));
          }
          if (botCfg.support && typeof botCfg.support.energyCost === 'number') {
            tpl.support.energyCost = Math.max(1, Math.min(5, botCfg.support.energyCost));
          }
        }
        this.energyConfig = data;
      }
    } catch (err) {
      console.warn('[VersusEngine] Falha ao carregar energy-config.json:', err);
    }
  }

  reset() {
    this.round = 1;
    this.phase = 'selection'; // 'selection' | 'combat' | 'result'
    this.turnSide = 'PLAYER';
    this.initiative = 'PLAYER';
    this.fogOfWar = true; // Adversário oculto até o Round 1
    this.medals = { PLAYER: 0, ENEMY: 0 };
    this.playerTeam = [];
    this.enemyTeam = [];
    this.winCondition = 10;
    this.selectedActions = { attack: null, defense: null, support: null };
    this.supportTarget = null;
    this.pendingAnimations = [];
    this.eventLog = [];
    this.mode = 'bot'; // 'bot' | 'versus'
    this.playerName = 'PLAYER';
    this.targetedRobotsThisRound = new Set();
    this.isAttackOverloaded = false;
  }

  // ─── Robot Selection ──────────────────────────────────────────────
  selectPlayerTeam(robotIds) {
    this.playerTeam = robotIds.map((id, i) => createVersusRobot(id, i, 'PLAYER'));
  }

  selectEnemyTeam(robotIds) {
    this.enemyTeam = robotIds.map((id, i) => createVersusRobot(id, i, 'ENEMY'));
  }

  botPickTeam() {
    const shuffled = [...ROBOT_KEYS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // ─── Turn Logic ────────────────────────────────────────────────────
  startCombat() {
    this.phase = 'combat';
    this.turnSide = 'PLAYER';
    this.round = 1;
    this.fogOfWar = false; // Revela o oponente no início do Round 1
    this.initiative = Math.random() < 0.5 ? 'PLAYER' : 'ENEMY';
    this._processHotEffects(this.playerTeam);
    this._processHotEffects(this.enemyTeam);
    this._resetRoleAssignments();
  }

  // Resets ONLY which robot does which role — NOT stats
  _resetRoleAssignments() {
    const clearRoles = (team) => team.forEach(r => {
      r.action = null;
      r._chosenAttack = null;
    });
    clearRoles(this.playerTeam);
    clearRoles(this.enemyTeam);
    this.selectedActions = { attack: null, defense: null, support: null };
    this.supportTarget = null;
  }

  getAliveTeam(side) {
    return (side === 'PLAYER' ? this.playerTeam : this.enemyTeam).filter(r => r.isAlive);
  }

  getAttackOptions(robot) {
    return robot.attacks.filter(a => a.energyCost <= robot.currentEnergy || a.energyCost === 0);
  }

  // ─── Attack Resolution com Regra Posicional por Linha ──────────────
  resolveAttack(attackerRobot, targetRobotOrMove, attackMoveArg, minigameSuccessArg) {
    const events = [];
    const myEnemySide = attackerRobot.side === 'PLAYER' ? this.enemyTeam : this.playerTeam;

    // Determina attackMove e minigameSuccess com flexibilidade
    let attackMove = null;
    let minigamePerformance = 1.0;

    if (targetRobotOrMove && targetRobotOrMove.energyCost !== undefined) {
      attackMove = targetRobotOrMove;
      minigamePerformance = attackMoveArg !== undefined ? attackMoveArg : 1.0;
    } else if (typeof targetRobotOrMove === 'boolean' || typeof targetRobotOrMove === 'number') {
      attackMove = attackerRobot._chosenAttack || attackerRobot.attacks[0];
      minigamePerformance = targetRobotOrMove;
    } else {
      attackMove = attackMoveArg || attackerRobot._chosenAttack || attackerRobot.attacks[0];
      minigamePerformance = minigameSuccessArg !== undefined ? minigameSuccessArg : 1.0;
    }

    // Alvo do atacante (prioriza alvo escolhido na interface, senão frente da linha)
    let targetRobot = attackerRobot._chosenTarget && attackerRobot._chosenTarget.isAlive
      ? attackerRobot._chosenTarget
      : myEnemySide.find(r => r.row === attackerRobot.row && r.isAlive) || myEnemySide.find(r => r.isAlive);

    if (!targetRobot) {
      // NÃO há robô vivo na mira: 0 de dano
      events.push({
        type: 'miss_empty_lane',
        attacker: attackerRobot.id,
        attackerName: attackerRobot.name,
        lane: attackerRobot.row,
        damage: 0
      });
      return events;
    }

    // REGRA DO USUÁRIO: O robô alvejado é marcado e NÃO receberá o buff de +5 neste round
    this.targetedRobotsThisRound.add(targetRobot.id);

    // Converte minigamePerformance em uma razão estrita de 0.0 a 1.0 (0% a 100%)
    let ratio = 1.0;
    if (typeof minigamePerformance === 'number') {
      ratio = Math.min(1.0, Math.max(0.0, minigamePerformance));
    } else if (typeof minigamePerformance === 'boolean') {
      ratio = minigamePerformance ? 1.0 : 0.0;
    } else if (minigamePerformance && typeof minigamePerformance.ratio === 'number') {
      ratio = Math.min(1.0, Math.max(0.0, minigamePerformance.ratio));
    }

    if (ratio <= 0) {
      events.push({
        type: 'miss',
        attacker: attackerRobot.id,
        attackerName: attackerRobot.name,
        target: targetRobot.id,
        targetName: targetRobot.name,
        lane: attackerRobot.row,
        damage: 0
      });
      return events;
    }

    attackerRobot.attackHitsThisRound++;
    if (attackMove && attackMove.energyCost) {
      attackerRobot.currentEnergy = Math.max(0, attackerRobot.currentEnergy - attackMove.energyCost);
    }

    // REGRA DO USUÁRIO: Nenhum ataque pode exceder 100% do attackPower do robô (0 a 100% estrito)
    const rawDamage = Math.max(1, Math.round(attackerRobot.attackPower * ratio));

    const killed = this._applyDamage(targetRobot, myEnemySide, rawDamage, events);
    if (killed) {
      this._onKill(attackerRobot, events);
    }
    return events;
  }

  _applyDamage(target, targetTeam, rawDamage, events) {
    let damage = rawDamage;
    let shieldBroke = false;

    if (target.shield && target.shield.hp > 0) {
      const isGroupShield = target.shield.targets === 'all';
      const absorbed = Math.min(target.shield.hp, damage);
      target.shield.hp -= absorbed;
      damage -= absorbed;

      events.push({ type: 'shield_hit', target: target.id, absorbed, remaining: target.shield.hp });

      if (isGroupShield && rawDamage > target.shield.hp + absorbed) {
        // Break for all
        targetTeam.forEach(r => {
          if (r.shield && r.shield.targets === 'all') r.shield = null;
        });
        shieldBroke = true;
        events.push({ type: 'shield_break_all' });
      } else if (target.shield && target.shield.hp <= 0) {
        target.shield = null;
        shieldBroke = true;
        events.push({ type: 'shield_break', target: target.id });
      }
    }

    if (damage > 0) {
      target.currentHp = Math.max(0, target.currentHp - damage);
      events.push({ type: 'damage', target: target.id, damage, hp: target.currentHp });
    }

    if (target.currentHp <= 0 && target.isAlive) {
      target.isAlive = false;
      events.push({ type: 'robot_down', target: target.id });
      return true;
    }
    return false;
  }

  _onKill(attacker, events) {
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + 15);
    attacker.currentEnergy += 3;
    const side = attacker.side;
    this.medals[side]++;
    events.push({
      type: 'kill_reward',
      attacker: attacker.id,
      hpGain: 15, energyGain: 3,
      medals: this.medals[side],
      side,
    });
  }

  // ─── Defense Resolution ────────────────────────────────────────────
  resolveDefense(defenderRobot, coinSuccess) {
    const events = [];
    if (!coinSuccess) {
      events.push({ type: 'defense_fail', defender: defenderRobot.id });
      return events;
    }

    const myTeam = defenderRobot.side === 'PLAYER' ? this.playerTeam : this.enemyTeam;
    const def = defenderRobot.defense;

    const makeShield = (targets) => ({
      hp: def.shieldHp,
      color: def.shieldColor,
      targets,
      roundsLeft: 3, // O escudo quebra automaticamente após 3 rounds!
      energyPerRound: def.energyPerRound || 0
    });

    if (def.targets === 'all') {
      myTeam.forEach(r => {
        if (r.isAlive) r.shield = makeShield('all');
      });
    } else if (def.targets === 'self') {
      defenderRobot.shield = makeShield('self');
    } else if (def.targets === 'attacker') {
      const attackerInTeam = myTeam.find(r => r.action === 'attack' && r.isAlive) || myTeam.find(r => r.isAlive);
      if (attackerInTeam) attackerInTeam.shield = makeShield('attacker');
    } else if (def.targets === 'others') {
      myTeam.forEach(r => {
        if (r.isAlive && r.id !== defenderRobot.id) {
          r.shield = makeShield('others');
        }
      });
    }

    events.push({ type: 'defense_success', defender: defenderRobot.id, shieldType: def.targets, shieldColor: def.shieldColor, roundsLeft: 3 });
    return events;
  }

  // ─── Support Resolution ─────────────────────────────────────────────
  resolveSupport(supporterRobot, targetRobot, canRevive = false) {
    const events = [];
    const myTeam = supporterRobot.side === 'PLAYER' ? this.playerTeam : this.enemyTeam;

    if (supporterRobot.currentEnergy < supporterRobot.support.energyCost) {
      events.push({ type: 'support_no_energy', supporter: supporterRobot.id });
      return events;
    }
    supporterRobot.currentEnergy -= supporterRobot.support.energyCost;

    // REGRA DE RESSURREIÇÃO: Se o robô alvo tombar (mesmo antes de receber o suporte), é sempre revivido para 100 HP!
    if (targetRobot && (!targetRobot.isAlive || targetRobot.currentHp <= 0)) {
      targetRobot.currentHp = 100;
      targetRobot.isAlive = true;
      targetRobot.shield = null;
      events.push({ type: 'revive', target: targetRobot.id, targetName: targetRobot.name, hp: 100 });
      return events;
    }

    const eff = supporterRobot.support.effect;
    if (eff.type === 'heal' && targetRobot) {
      targetRobot.currentHp = Math.min(targetRobot.maxHp, targetRobot.currentHp + eff.amount);
      events.push({ type: 'support_heal', target: targetRobot.id, amount: eff.amount, hp: targetRobot.currentHp });
    } else if (eff.type === 'hot' && targetRobot) {
      targetRobot.hotEffect = { amount: eff.amount, roundsLeft: eff.rounds };
      events.push({ type: 'support_hot', target: targetRobot.id, amount: eff.amount, rounds: eff.rounds });
    } else if (eff.type === 'heal_energy' && targetRobot) {
      targetRobot.currentHp = Math.min(targetRobot.maxHp, targetRobot.currentHp + eff.healAmount);
      targetRobot.currentEnergy += eff.energyAmount;
      events.push({ type: 'support_heal_energy', target: targetRobot.id, heal: eff.healAmount, energy: eff.energyAmount });
    } else if (eff.type === 'heal_cost' && targetRobot) {
      if (targetRobot.currentEnergy >= eff.targetEnergyCost) {
        targetRobot.currentEnergy -= eff.targetEnergyCost;
        targetRobot.currentHp = Math.min(targetRobot.maxHp, targetRobot.currentHp + eff.healAmount);
        events.push({ type: 'support_heavy_heal', target: targetRobot.id, heal: eff.healAmount });
      } else {
        events.push({ type: 'support_fail_no_target_energy', target: targetRobot.id });
      }
    } else if (eff.type === 'heal_all') {
      myTeam.filter(r => r.isAlive).forEach(r => {
        r.currentHp = Math.min(r.maxHp, r.currentHp + eff.amount);
      });
      events.push({ type: 'support_heal_all', amount: eff.amount });
    }
    return events;
  }

  // ─── Round/Turn Processing ────────────────────────────────────────
  //
  // Structure:
  //   - One FULL round = PLAYER acts → ENEMY acts
  //   - endPlayerTurn(): PLAYER done, switch to ENEMY
  //   - endEnemyTurn():  ENEMY done, advance round number, process HoT, reset roles
  //
  endPlayerTurn() {
    this.turnSide = 'ENEMY';
    // Reset roles for enemy's own selection (bot)
    this.enemyTeam.forEach(r => { r.action = null; r._chosenAttack = null; });
  }

  endEnemyTurn() {
    this.turnSide = 'PLAYER';
    this.round++;

    // Process per-round effects BEFORE clearing roles
    this._processHotEffects(this.playerTeam);
    this._processHotEffects(this.enemyTeam);

    // Contagem de 3 rodadas do escudo: quebra automática se expirar
    this._processShieldDurations();

    // Bônus de descanso: robôs que pouparam energia ganham +1 Energia!
    this._processRestBonuses();

    // BÔNUS DE SOBRECARGA: Aumenta em +5 o ataque de todos os robôs vivos que NÃO foram atacados neste round (máx 50)
    const buffedRobots = this._processAttackBuffs();

    // Limpa contadores e conjunto de alvos do round
    [...this.playerTeam, ...this.enemyTeam].forEach(r => {
      r.attackHitsThisRound = 0;
    });
    this.targetedRobotsThisRound.clear();

    // Checa se algum robô atingiu 50 para ativar o Alerta de Emergência
    this._checkAttackOverload();

    // Reset ONLY role assignments — stats persist
    this._resetRoleAssignments();

    return buffedRobots;
  }

  _processAttackBuffs() {
    const buffed = [];
    const allRobots = [...this.playerTeam, ...this.enemyTeam];

    allRobots.forEach(bot => {
      if (bot.isAlive && !this.targetedRobotsThisRound.has(bot.id)) {
        if (bot.attackPower < 50) {
          const oldAtk = bot.attackPower;
          bot.attackPower = Math.min(50, bot.attackPower + 5);
          buffed.push({
            bot,
            oldAtk,
            newAtk: bot.attackPower,
            diff: bot.attackPower - oldAtk,
            isOverloaded: bot.attackPower >= 50
          });
        }
      }
    });

    return buffed;
  }

  _checkAttackOverload() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    this.isAttackOverloaded = allRobots.some(r => r.isAlive && r.attackPower >= 50);
    return this.isAttackOverloaded;
  }

  _processShieldDurations() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    allRobots.forEach(r => {
      if (r.shield) {
        r.shield.roundsLeft = (r.shield.roundsLeft !== undefined ? r.shield.roundsLeft : 3) - 1;
        if (r.shield.roundsLeft <= 0) {
          r.shield = null;
        }
      }
    });
  }

  _processRestBonuses() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    allRobots.forEach(r => {
      if ((r.action === 'rest' || !r.action) && r.isAlive) {
        r.currentEnergy = Math.min(10, r.currentEnergy + 1);
      }
    });
  }

  // Legacy wrapper kept for compatibility
  endTurn() {
    if (this.turnSide === 'PLAYER') {
      this.endPlayerTurn();
    } else {
      this.endEnemyTurn();
    }
  }

  _processHotEffects(team) {
    team.forEach(r => {
      if (r.hotEffect && r.isAlive) {
        r.currentHp = Math.min(r.maxHp, r.currentHp + r.hotEffect.amount);
        r.hotEffect.roundsLeft--;
        if (r.hotEffect.roundsLeft <= 0) r.hotEffect = null;
      }
      if (r.shield && r.shield.energyPerRound) {
        r.currentEnergy += r.shield.energyPerRound;
      }
    });
  }

  // ─── Win Check ────────────────────────────────────────────────────
  checkWinner() {
    if (this.medals.PLAYER >= this.winCondition) return 'PLAYER';
    if (this.medals.ENEMY >= this.winCondition) return 'ENEMY';
    if (this.enemyTeam.every(r => !r.isAlive)) return 'PLAYER';
    if (this.playerTeam.every(r => !r.isAlive)) return 'ENEMY';
    return null;
  }

  // ─── Bot AI ──────────────────────────────────────────────────────
  generateBotActions() {
    const aliveBot = this.enemyTeam.filter(r => r.isAlive);
    if (aliveBot.length === 0) return null;

    // Attack with robot that has best energy
    const attacker = aliveBot.reduce((best, r) => r.currentEnergy >= best.currentEnergy ? r : best, aliveBot[0]);
    // Defense with one that has no shield
    const defender = aliveBot.find(r => !r.shield && r !== attacker) || aliveBot.find(r => r !== attacker) || aliveBot[0];
    // Support with remaining
    const supporter = aliveBot.find(r => r !== attacker && r !== defender) || aliveBot[0];

    // Pick attack based on energy
    const validAttacks = attacker.attacks.filter(a => a.energyCost <= attacker.currentEnergy || a.energyCost === 0);
    const chosenAttack = validAttacks[validAttacks.length - 1] || attacker.attacks[0]; // Use highest available

    // Support target — prefer most damaged ally
    const supportTarget = this.enemyTeam.filter(r => r.isAlive).sort((a, b) => a.currentHp - b.currentHp)[0];

    return {
      attacker, defender, supporter, chosenAttack, supportTarget,
      defenderTarget: this.playerTeam.filter(r => r.isAlive)[0] || null,
    };
  }

  botSelectTurnActions() {
    const aliveBot = this.enemyTeam.filter(r => r.isAlive);
    if (aliveBot.length === 0) return;

    // Reseta ações dos bots para descanso como padrão
    this.enemyTeam.forEach(r => {
      r.action = 'rest';
      r._chosenAttack = null;
    });

    const actions = this.generateBotActions();
    if (!actions) return;

    if (actions.attacker) {
      actions.attacker.action = 'attack';
      actions.attacker._chosenAttack = actions.chosenAttack;

      // Define estrategicamente o alvo do atacante inimigo sem alterar sua linha original
      const alivePlayer = this.playerTeam.filter(r => r.isAlive);
      if (alivePlayer.length > 0) {
        const target = alivePlayer[Math.floor(Math.random() * alivePlayer.length)];
        actions.attacker._chosenTarget = target;
      }
    }

    if (actions.defender && actions.defender !== actions.attacker) {
      actions.defender.action = 'defense';
    }

    if (actions.supporter && actions.supporter !== actions.attacker && actions.supporter !== actions.defender) {
      actions.supporter.action = 'support';
      actions.supporter._chosenAllyTarget = actions.supportTarget;
    }
  }

  // ─── Account Management — now via REST API ─────────────────────────
  // All account persistence is handled server-side at /api/accounts/*
  // These stubs are kept to avoid breaking any old callers.
  static loadAccount()  { return null; } // use AccountAPI.fetch(name)
  static saveAccount()  {}
  static createAccount(name) { return { name, wins: 0, losses: 0, totalMedals: 0, totalMatches: 0, createdAt: Date.now() }; }
  static recordResult() {} // use AccountAPI.saveResult(name, won, medals)
}
