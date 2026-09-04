// ═══════════════════════════════════════════════════════════════════
// versus-engine.js — Motor Central do Modo VERSUS
// ═══════════════════════════════════════════════════════════════════

// ── Robot Definitions (all leveled for VERSUS) ─────────────────────
export const VERSUS_ROBOTS = {
  DB: {
    id: 'DB', name: 'Dino-Byte', color: '#ff3344', colorName: 'RED',
    baseHp: 10, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'db_l1', name: 'Impacto Térmico',    level: 1, energyCost: 1, minigame: 'click_targets',  desc: 'Custo: 1 EN · 25% ATK (Mín 1)' },
      { id: 'db_l2', name: 'Garras QTE',          level: 2, energyCost: 3, minigame: 'arrow_qte',     desc: 'Custo: 3 EN · 50% ATK' },
      { id: 'db_l3', name: 'Firewall Infernal',   level: 3, energyCost: 5, minigame: 'gravity_dodge', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Muralha Tripla de Fogo',
      desc: 'O ÚNICO com escudo para os 3 robôs (5 HP cada, dura 2 rounds). Custo: 0 EN.',
      shieldHp: 5, rounds: 2, targets: 'all', shieldColor: '#ff3344', energyCost: 0,
      effectType: 'group_shield',
    },
    support: {
      name: 'Reparo de Grupo',
      desc: 'Cura até 4 HP ou revive com 10 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  PL: {
    id: 'PL', name: 'Penlinux', color: '#00e5ff', colorName: 'CYAN',
    baseHp: 10, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'pl_l1', name: 'Deslize Glacial',    level: 1, energyCost: 1, minigame: 'swipe_path',     desc: 'Custo: 1 EN · 25% ATK (Mín 1)' },
      { id: 'pl_l2', name: 'Combo Glaciar',       level: 2, energyCost: 3, minigame: 'typing_sprint',  desc: 'Custo: 3 EN · 50% ATK' },
      { id: 'pl_l3', name: 'Blizzard Plataforma', level: 3, energyCost: 5, minigame: 'platform_dodge', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Condensador Glacial',
      desc: 'Escudo individual de 10 HP no aliado escolhido + concede +2 Energia imediata. Dura 2 rounds. Custo: 0 EN.',
      shieldHp: 10, rounds: 2, targets: 'single', shieldColor: '#00e5ff', energyCost: 0,
      energyBonus: 2, effectType: 'energy_boost',
    },
    support: {
      name: 'Cura Progressiva',
      desc: 'Cura até 4 HP ou revive com 10 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  CP: {
    id: 'CP', name: 'Cowputer-Moo', color: '#ffd700', colorName: 'GOLD',
    baseHp: 10, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'cp_l1', name: 'Laço Circular',    level: 1, energyCost: 1, minigame: 'circle_click',  desc: 'Custo: 1 EN · 25% ATK (Mín 1)' },
      { id: 'cp_l2', name: 'Código do Xerife', level: 2, energyCost: 3, minigame: 'dual_keys',     desc: 'Custo: 3 EN · 50% ATK' },
      { id: 'cp_l3', name: 'Pólvora Digital',  level: 3, energyCost: 5, minigame: 'shooter_dodge', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Blindagem de Balística Dourada',
      desc: 'Escudo individual de 10 HP no aliado escolhido + sobrecarga de +2 ATK. Dura 2 rounds. Custo: 0 EN.',
      shieldHp: 10, rounds: 2, targets: 'single', shieldColor: '#ffd700', energyCost: 0,
      atkBonus: 2, effectType: 'attack_boost',
    },
    support: {
      name: 'Kit de Campo',
      desc: 'Cura até 4 HP ou revive com 10 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  PB: {
    id: 'PB', name: 'Pavabyte', color: '#ff69b4', colorName: 'PINK',
    baseHp: 10, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'pb_l1', name: 'Reflexo Prismático', level: 1, energyCost: 1, minigame: 'mirror_sequence', desc: 'Custo: 1 EN · 25% ATK (Mín 1)' },
      { id: 'pb_l2', name: 'Teste de Reação',    level: 2, energyCost: 3, minigame: 'reaction_test',   desc: 'Custo: 3 EN · 50% ATK' },
      { id: 'pb_l3', name: 'Órbita Caótica',     level: 3, energyCost: 5, minigame: 'orbit_dodge',     desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Matriz Bio-Prismática',
      desc: 'Escudo individual de 10 HP no aliado escolhido + regenera +2 HP por round durado. Dura 2 rounds. Custo: 0 EN.',
      shieldHp: 10, rounds: 2, targets: 'single', shieldColor: '#ff69b4', energyCost: 0,
      hpPerRound: 2, effectType: 'regen_hp',
    },
    support: {
      name: 'Sobrecarga de Cura',
      desc: 'Cura até 4 HP ou revive com 10 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  TV: {
    id: 'TV', name: 'Tigervex', color: '#ff8c00', colorName: 'ORANGE',
    baseHp: 10, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'tv_l1', name: 'Talho Veloz',      level: 1, energyCost: 1, minigame: 'slash_draw',      desc: 'Custo: 1 EN · 25% ATK (Mín 1)' },
      { id: 'tv_l2', name: 'Sequência Tesla',  level: 2, energyCost: 3, minigame: 'arrow_sequence',  desc: 'Custo: 3 EN · 50% ATK' },
      { id: 'tv_l3', name: 'Coração de Ferro', level: 3, energyCost: 5, minigame: 'green_heart_dodge', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Barreira Tesla de Espinhos',
      desc: 'Escudo individual de 10 HP no aliado escolhido + contra-ataque elétrico (reflete 3 de dano ao atacante). Dura 2 rounds. Custo: 0 EN.',
      shieldHp: 10, rounds: 2, targets: 'single', shieldColor: '#ff8c00', energyCost: 0,
      reflectDamage: 3, effectType: 'reflect',
    },
    support: {
      name: 'Pulso de Reparo',
      desc: 'Cura até 4 HP ou revive com 10 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
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
    if (this.mode === 'bot') {
      this.botSelectTurnActions();
    }
  }

  // Resets ONLY which robot does which role — NOT stats
  _resetRoleAssignments() {
    const clearRoles = (team) => team.forEach(r => {
      r.action = null;
      r._chosenAttack = null;
      r._chosenTarget = null;
      r._chosenAllyTarget = null;
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

    // REGRA DO USUÁRIO:
    // O primeiro ataque custa 1 energia, dá 25% de ataque (mínimo 1).
    // O segundo custa 3 energias, dá 50% de ataque.
    // O terceiro custa 5 energias, dá 110% de ataque (máximo 20).
    const atkLevel = attackMove?.level || 1;
    const curAtk = attackerRobot.attackPower || 15;
    let baseDmg = 1;

    if (atkLevel === 1) {
      baseDmg = Math.max(1, Math.round(curAtk * 0.25));
    } else if (atkLevel === 2) {
      baseDmg = Math.max(1, Math.round(curAtk * 0.50));
    } else {
      baseDmg = Math.min(20, Math.max(1, Math.round(curAtk * 1.10)));
    }

    const rawDamage = Math.max(1, Math.round(baseDmg * ratio));

    const killed = this._applyDamage(targetRobot, myEnemySide, rawDamage, events, attackerRobot);
    if (killed) {
      this._onKill(attackerRobot, events);
    }
    return events;
  }

  _applyDamage(target, targetTeam, rawDamage, events, attacker = null) {
    let damage = rawDamage;

    // REGRA DO USUÁRIO:
    // Se o ataque for mais forte que o escudo, o escudo desconta o próprio HP do ataque
    // e o robô alvo recebe o resultado da subtração (Dano - HP do escudo).
    if (target.shield && target.shield.hp > 0) {
      const shieldHp = target.shield.hp;

      // Efeito do escudo do TV: Contra-ataque de espinhos elétricos (reflete dano ao atacante)
      if (target.shield.reflectDamage && attacker && attacker.isAlive) {
        const refDmg = target.shield.reflectDamage;
        attacker.currentHp = Math.max(0, attacker.currentHp - refDmg);
        events.push({
          type: 'shield_reflect',
          target: target.id,
          targetName: target.name,
          attacker: attacker.id,
          attackerName: attacker.name,
          damage: refDmg,
          attackerHp: attacker.currentHp
        });
        if (attacker.currentHp <= 0 && attacker.isAlive) {
          attacker.isAlive = false;
          events.push({ type: 'robot_down', target: attacker.id, targetName: attacker.name });
        }
      }

      if (damage >= shieldHp) {
        damage -= shieldHp;
        target.shield.hp = 0;
        target.shield = null;
        events.push({ type: 'shield_break', target: target.id, absorbed: shieldHp, remainingDamage: damage });
      } else {
        target.shield.hp -= damage;
        events.push({ type: 'shield_hit', target: target.id, absorbed: damage, remaining: target.shield.hp });
        damage = 0;
      }
    }

    if (damage > 0) {
      target.currentHp = Math.max(0, target.currentHp - damage);
      events.push({ type: 'damage', target: target.id, damage, hp: target.currentHp });
    }

    if (target.currentHp <= 0 && target.isAlive) {
      target.isAlive = false;
      events.push({ type: 'robot_down', target: target.id, targetName: target.name });
      return true;
    }
    return false;
  }

  _onKill(attacker, events) {
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + 2);
    attacker.currentEnergy = Math.min(10, attacker.currentEnergy + 1);
    const side = attacker.side;
    this.medals[side]++;
    events.push({
      type: 'kill_reward',
      attacker: attacker.id,
      hpGain: 2, energyGain: 1,
      medals: this.medals[side],
      side,
    });
  }

  // ─── Defense Resolution ────────────────────────────────────────────
  resolveDefense(defenderRobot, coinSuccess, chosenTarget = null) {
    const events = [];
    if (!coinSuccess) {
      events.push({ type: 'defense_fail', defender: defenderRobot.id, defenderName: defenderRobot.name });
      return events;
    }

    const myTeam = defenderRobot.side === 'PLAYER' ? this.playerTeam : this.enemyTeam;
    const def = defenderRobot.defense;

    const makeShield = (targetBot) => ({
      hp: Math.min(10, def.shieldHp || 10),
      maxHp: Math.min(10, def.shieldHp || 10),
      color: def.shieldColor,
      targets: def.targets,
      roundsLeft: 2,
      hpPerRound: def.hpPerRound || 0,
      reflectDamage: def.reflectDamage || 0,
      energyPerRound: def.energyPerRound || 0,
      sourceRobotId: defenderRobot.id,
    });

    if (def.targets === 'all') {
      // REGRA DO USUÁRIO: O ÚNICO que pode dar escudo pros 3 é o DB, o único, e o escudo dele é de apenas 5 HP.
      myTeam.forEach(r => {
        if (r.isAlive) {
          r.shield = makeShield(r);
        }
      });
      events.push({
        type: 'defense_all',
        defender: defenderRobot.id,
        defenderName: defenderRobot.name,
        shieldHp: 5,
        shieldColor: def.shieldColor,
        roundsLeft: 2
      });
    } else {
      // REGRA DO USUÁRIO: O resto tem que escolher um para dar escudo (até 10 HP) com efeito único!
      const target = (chosenTarget && chosenTarget.isAlive)
        ? chosenTarget
        : (defenderRobot._chosenDefenseTarget && defenderRobot._chosenDefenseTarget.isAlive)
          ? defenderRobot._chosenDefenseTarget
          : defenderRobot;

      target.shield = makeShield(target);

      // Efeitos específicos únicos de cada robô:
      if (def.energyBonus) {
        target.currentEnergy = Math.min(10, target.currentEnergy + def.energyBonus);
        events.push({ type: 'shield_energy_buff', target: target.id, targetName: target.name, amount: def.energyBonus });
      }
      if (def.atkBonus) {
        target.attackPower = Math.min(20, target.attackPower + def.atkBonus);
        events.push({ type: 'shield_atk_buff', target: target.id, targetName: target.name, amount: def.atkBonus });
      }
      if (def.hpPerRound) {
        events.push({ type: 'shield_regen_buff', target: target.id, targetName: target.name, amount: def.hpPerRound });
      }
      if (def.reflectDamage) {
        events.push({ type: 'shield_reflect_buff', target: target.id, targetName: target.name, amount: def.reflectDamage });
      }

      events.push({
        type: 'defense_single',
        defender: defenderRobot.id,
        defenderName: defenderRobot.name,
        target: target.id,
        targetName: target.name,
        shieldHp: target.shield.hp,
        shieldColor: def.shieldColor,
        roundsLeft: 2,
        effectDesc: def.desc
      });
    }

    return events;
  }

  // ─── Support Resolution ─────────────────────────────────────────────
  resolveSupport(supporterRobot, targetRobot, canRevive = false) {
    const events = [];
    const myTeam = supporterRobot.side === 'PLAYER' ? this.playerTeam : this.enemyTeam;

    const cost = supporterRobot.support?.energyCost !== undefined ? supporterRobot.support.energyCost : 2;
    if (supporterRobot.currentEnergy < cost) {
      events.push({ type: 'support_no_energy', supporter: supporterRobot.id });
      return events;
    }
    supporterRobot.currentEnergy -= cost;

    // REGRA DO USUÁRIO: revive com 10 HP mesmo, esquece reviver com 50%!
    if (targetRobot && (!targetRobot.isAlive || targetRobot.currentHp <= 0)) {
      targetRobot.currentHp = 10;
      targetRobot.maxHp = 10;
      targetRobot.isAlive = true;
      targetRobot.shield = null;
      events.push({ type: 'revive', target: targetRobot.id, targetName: targetRobot.name, hp: 10 });
      return events;
    }

    // REGRA DO USUÁRIO: O suporte cura no máximo até 4 de HP
    const healAmount = Math.min(4, supporterRobot.support?.effect?.amount || 4);
    if (targetRobot) {
      targetRobot.currentHp = Math.min(targetRobot.maxHp, targetRobot.currentHp + healAmount);
      events.push({ type: 'support_heal', target: targetRobot.id, amount: healAmount, hp: targetRobot.currentHp });
    }
    return events;
  }

  // ─── Round/Turn Processing ────────────────────────────────────────
  endPlayerTurn() {
    this.turnSide = 'ENEMY';
    this.enemyTeam.forEach(r => { r.action = null; r._chosenAttack = null; });
  }

  endEnemyTurn() {
    this.turnSide = 'PLAYER';
    this.round++;

    // Process per-round effects BEFORE clearing roles
    this._processHotEffects(this.playerTeam);
    this._processHotEffects(this.enemyTeam);

    // Contagem de 2 rodadas do escudo: quebra automática se expirar
    this._processShieldDurations();

    // Regeneração de energia a cada round (+1 base para vivos, +1 bônus se poupou)
    this._processEnergyPerRound();

    // REGRA DO USUÁRIO: o ataque cresce 1 por round até no max chegar em 20 onde sobrecarrega o robô
    const buffedRobots = this._processAttackBuffs();

    // Limpa contadores de golpes
    [...this.playerTeam, ...this.enemyTeam].forEach(r => {
      r.attackHitsThisRound = 0;
    });
    this.targetedRobotsThisRound.clear();

    // Checa se algum robô atingiu 20 para ativar a sobrecarga
    this._checkAttackOverload();

    // Reset ONLY role assignments — stats persist
    this._resetRoleAssignments();

    // No modo treino, a IA planeja e bloqueia suas ações antes do início das decisões
    if (this.mode === 'bot') {
      this.botSelectTurnActions();
    }

    return buffedRobots;
  }

  _processAttackBuffs() {
    const buffed = [];
    const allRobots = [...this.playerTeam, ...this.enemyTeam];

    allRobots.forEach(bot => {
      if (bot.isAlive) {
        if (bot.attackPower < 20) {
          const oldAtk = bot.attackPower;
          bot.attackPower = Math.min(20, bot.attackPower + 1);
          buffed.push({
            bot,
            oldAtk,
            newAtk: bot.attackPower,
            diff: bot.attackPower - oldAtk,
            isOverloaded: bot.attackPower >= 20
          });
        }
      }
    });

    return buffed;
  }

  _checkAttackOverload() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    this.isAttackOverloaded = allRobots.some(r => r.isAlive && r.attackPower >= 20);
    return this.isAttackOverloaded;
  }

  _processShieldDurations() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    allRobots.forEach(r => {
      if (r.shield && r.isAlive) {
        // Efeito do escudo do PB: regenera 2 de HP por round durado
        if (r.shield.hpPerRound && r.shield.hpPerRound > 0) {
          r.currentHp = Math.min(r.maxHp, r.currentHp + r.shield.hpPerRound);
        }

        r.shield.roundsLeft = (r.shield.roundsLeft !== undefined ? r.shield.roundsLeft : 2) - 1;
        if (r.shield.roundsLeft <= 0) {
          r.shield = null;
        }
      }
    });
  }

  _processEnergyPerRound() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    allRobots.forEach(r => {
      if (r.isAlive) {
        // Base +1 de energia por round para todos os vivos
        r.currentEnergy = Math.min(10, r.currentEnergy + 1);
        // Se poupou energia (ação rest ou sem ação), ganha +1 bônus
        if (r.action === 'rest' || !r.action) {
          r.currentEnergy = Math.min(10, r.currentEnergy + 1);
        }
      }
    });
  }

  _processRestBonuses() {
    this._processEnergyPerRound();
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
    const playerAlive = this.playerTeam.some(r => r.isAlive && r.currentHp > 0);
    const enemyAlive = this.enemyTeam.some(r => r.isAlive && r.currentHp > 0);

    // REGRA DO USUÁRIO: Se todos os robôs morrerem de uma vez, as medalhas desempatam!
    if (!playerAlive && !enemyAlive) {
      if (this.medals.PLAYER > this.medals.ENEMY) return 'PLAYER';
      if (this.medals.ENEMY > this.medals.PLAYER) return 'ENEMY';
      return this.initiative === 'PLAYER' ? 'PLAYER' : 'ENEMY';
    }

    // REGRA DO USUÁRIO: Vitória na hora pra quem matou os 3 robôs adversários!
    if (!enemyAlive) return 'PLAYER';
    if (!playerAlive) return 'ENEMY';

    // Desempate ou vitória por limite de medalhas
    if (this.medals.PLAYER >= this.winCondition && this.medals.PLAYER > this.medals.ENEMY) return 'PLAYER';
    if (this.medals.ENEMY >= this.winCondition && this.medals.ENEMY > this.medals.PLAYER) return 'ENEMY';
    return null;
  }

  // ─── Bot AI ──────────────────────────────────────────────────────
  generateBotActions() {
    const aliveBot = this.enemyTeam.filter(r => r.isAlive);
    if (aliveBot.length === 0) return null;

    // Robôs com pelo menos 1 de energia podem atacar (no Round 1 com 0 de energia, ninguém ataca)
    const attackersWithEnergy = aliveBot.filter(r => r.currentEnergy >= 1);
    let attacker = null;
    let chosenAttack = null;

    if (attackersWithEnergy.length > 0) {
      attacker = attackersWithEnergy.reduce((best, r) => r.currentEnergy >= best.currentEnergy ? r : best, attackersWithEnergy[0]);
      const validAttacks = attacker.attacks.filter(a => a.energyCost <= attacker.currentEnergy);
      chosenAttack = validAttacks[validAttacks.length - 1] || null;
      if (!chosenAttack) attacker = null;
    }

    // Escudo custa 0 de energia: robô vivo sem escudo pode erguer barreira
    const defenderCandidates = aliveBot.filter(r => r !== attacker);
    const defender = defenderCandidates.find(r => !r.shield) || defenderCandidates[0] || (attacker ? null : aliveBot[0]);

    // Alvo do escudo do bot: se não for DB (que dá escudo pros 3), escolhe 1 aliado para proteger
    let defenderTarget = null;
    if (defender && defender.defense?.targets !== 'all') {
      const candidates = [...aliveBot].sort((a, b) => a.currentHp - b.currentHp);
      defenderTarget = candidates[0] || defender;
    }

    // Suporte custa 2 de energia
    const supporterCandidates = aliveBot.filter(r => r !== attacker && r !== defender && r.currentEnergy >= 2);
    const supporter = supporterCandidates[0] || null;

    // Alvo de suporte: aliado caído (revive com 10 HP) ou mais danificado
    const deadAlly = this.enemyTeam.find(r => !r.isAlive);
    const supportTarget = deadAlly || this.enemyTeam.filter(r => r.isAlive).sort((a, b) => a.currentHp - b.currentHp)[0];

    return {
      attacker, defender, supporter, chosenAttack, supportTarget, defenderTarget,
    };
  }

  botSelectTurnActions() {
    const aliveBot = this.enemyTeam.filter(r => r.isAlive);
    if (aliveBot.length === 0) return;

    // Reseta ações dos bots para descanso (rest) como padrão
    this.enemyTeam.forEach(r => {
      r.action = 'rest';
      r._chosenAttack = null;
      r._chosenTarget = null;
      r._chosenAllyTarget = null;
      r._chosenDefenseTarget = null;
    });

    const actions = this.generateBotActions();
    if (!actions) return;

    if (actions.attacker && actions.chosenAttack) {
      actions.attacker.action = 'attack';
      actions.attacker._chosenAttack = actions.chosenAttack;

      // Define estrategicamente o alvo do atacante inimigo ANTES do início do combate
      const alivePlayer = this.playerTeam.filter(r => r.isAlive);
      if (alivePlayer.length > 0) {
        const sameLane = alivePlayer.find(r => r.row === actions.attacker.row);
        const lowestHp = [...alivePlayer].sort((a, b) => a.currentHp - b.currentHp)[0];
        actions.attacker._chosenTarget = sameLane || lowestHp || alivePlayer[0];
      }
    }

    if (actions.defender && actions.defender !== actions.attacker) {
      actions.defender.action = 'defense';
      actions.defender._chosenDefenseTarget = actions.defenderTarget || actions.defender;
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
