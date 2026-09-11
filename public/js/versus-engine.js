// ═══════════════════════════════════════════════════════════════════
// versus-engine.js — Motor Central do Modo VERSUS
// ═══════════════════════════════════════════════════════════════════

// ── Robot Definitions (all leveled for VERSUS) ─────────────────────
export const VERSUS_ROBOTS = {
  DB: {
    id: 'DB', name: 'Dino-Byte', color: '#ff3344', colorName: 'RED',
    baseHp: 20, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'db_l1', name: 'Impacto Térmico', level: 1, energyCost: 3, minigame: 'click_targets', desc: 'Custo: 3 EN · 25% ATK (Mín 1)' },
      { id: 'db_l2', name: 'Garras QTE', level: 2, energyCost: 4, minigame: 'arrow_qte', desc: 'Custo: 4 EN · 50% ATK' },
      { id: 'db_l3', name: 'Expurgo Térmico Supremo', level: 3, energyCost: 5, minigame: 'click_targets', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Muralha Tripla de Fogo',
      desc: 'Escudo ABSOLUTO nos 3 aliados — anula o próximo ataque (2 rounds). Se atingido: escudo quebra e robô fica TONTO. Custo: 0 EN.',
      rounds: 2, targets: 'all', shieldColor: '#ff3344', energyCost: 0,
      effectType: 'group_shield',
    },
    support: {
      name: 'Reparo de Grupo',
      desc: 'Cura até 4 HP ou revive com 20 HP. Custo: 1 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 1,
    },
  },
  PL: {
    id: 'PL', name: 'Penlinux', color: '#00e5ff', colorName: 'CYAN',
    baseHp: 20, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'pl_l1', name: 'Deslize Glacial', level: 1, energyCost: 3, minigame: 'swipe_path', desc: 'Custo: 3 EN · 25% ATK (Mín 1)' },
      { id: 'pl_l2', name: 'Combo Glaciar', level: 2, energyCost: 4, minigame: 'typing_sprint', desc: 'Custo: 4 EN · 50% ATK' },
      { id: 'pl_l3', name: 'Condutor Criogênico Supremo', level: 3, energyCost: 5, minigame: 'swipe_path', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Condensador Glacial',
      desc: 'Escudo ABSOLUTO no aliado escolhido + concede +2 Energia imediata (2 rounds). Se atingido: escudo quebra e robô fica TONTO. Custo: 0 EN.',
      rounds: 2, targets: 'single', shieldColor: '#00e5ff', energyCost: 0,
      energyBonus: 2, effectType: 'energy_boost',
    },
    support: {
      name: 'Cura Progressiva',
      desc: 'Cura até 4 HP ou revive com 20 HP. Custo: 1 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 1,
    },
  },
  CP: {
    id: 'CP', name: 'Cowputer-Moo', color: '#ffd700', colorName: 'GOLD',
    baseHp: 20, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'cp_l1', name: 'Laço Circular', level: 1, energyCost: 3, minigame: 'circle_click', desc: 'Custo: 3 EN · 25% ATK (Mín 1)' },
      { id: 'cp_l2', name: 'Código do Xerife', level: 2, energyCost: 4, minigame: 'dual_keys', desc: 'Custo: 4 EN · 50% ATK' },
      { id: 'cp_l3', name: 'Sincronizador Supremo', level: 3, energyCost: 5, minigame: 'circle_click', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Blindagem de Balística Dourada',
      desc: 'Escudo ABSOLUTO no aliado escolhido + sobrecarga de +2 ATK (2 rounds). Se atingido: escudo quebra e robô fica TONTO. Custo: 0 EN.',
      rounds: 2, targets: 'single', shieldColor: '#ffd700', energyCost: 0,
      atkBonus: 2, effectType: 'attack_boost',
    },
    support: {
      name: 'Kit de Campo',
      desc: 'Cura até 4 HP ou revive com 20 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  PB: {
    id: 'PB', name: 'Pavabyte', color: '#ff69b4', colorName: 'PINK',
    baseHp: 20, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'pb_l1', name: 'Reflexo Prismático', level: 1, energyCost: 3, minigame: 'mirror_sequence', desc: 'Custo: 3 EN · 25% ATK (Mín 1)' },
      { id: 'pb_l2', name: 'Teste de Reação', level: 2, energyCost: 4, minigame: 'reaction_test', desc: 'Custo: 4 EN · 50% ATK' },
      { id: 'pb_l3', name: 'Alinhamento Prismático Supremo', level: 3, energyCost: 5, minigame: 'mirror_sequence', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Matriz Bio-Prismática',
      desc: 'Escudo ABSOLUTO no aliado escolhido + regenera +2 HP por round (2 rounds). Se atingido: escudo quebra e robô fica TONTO. Custo: 0 EN.',
      rounds: 2, targets: 'single', shieldColor: '#ff69b4', energyCost: 0,
      hpPerRound: 2, effectType: 'regen_hp',
    },
    support: {
      name: 'Sobrecarga de Cura',
      desc: 'Cura até 4 HP ou revive com 20 HP. Custo: 2 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 2,
    },
  },
  TV: {
    id: 'TV', name: 'Tigervex', color: '#ff8c00', colorName: 'ORANGE',
    baseHp: 20, baseAtk: 15, baseEnergy: 0,
    attacks: [
      { id: 'tv_l1', name: 'Talho Veloz', level: 1, energyCost: 3, minigame: 'slash_draw', desc: 'Custo: 3 EN · 25% ATK (Mín 1)' },
      { id: 'tv_l2', name: 'Sequência Tesla', level: 2, energyCost: 4, minigame: 'arrow_sequence', desc: 'Custo: 4 EN · 50% ATK' },
      { id: 'tv_l3', name: 'Lâmina Suprema de Titânio', level: 3, energyCost: 5, minigame: 'slash_draw', desc: 'Custo: 5 EN · 110% ATK (Máx 20)' },
    ],
    defense: {
      name: 'Barreira Tesla de Espinhos',
      desc: 'Escudo ABSOLUTO no aliado escolhido (2 rounds). Ao quebrar: descarga elétrica causa 3 HP no atacante e robô fica TONTO. Custo: 0 EN.',
      rounds: 2, targets: 'single', shieldColor: '#ff8c00', energyCost: 0,
      reflectBreakDamage: 3, effectType: 'reflect_break',
    },
    support: {
      name: 'Pulso de Reparo',
      desc: 'Cura até 4 HP ou revive com 20 HP. Custo: 1 EN.',
      effect: { type: 'heal', amount: 4, target: 'one' },
      energyCost: 1,
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
    isStunned: false,        // TONTO: robô atordoado nao pode usar defesa nem receber escudo
    stunRoundsLeft: 0,       // Rounds restantes de atordoamento
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

    // REGRA FUNDAMENTAL: Todo ataque custa energia e DEVE descontar esse custo imediatamente do armazenamento de energia do campeão!
    const energyCost = (attackMove && typeof attackMove.energyCost === 'number') ? attackMove.energyCost : 1;
    attackerRobot.currentEnergy = Math.max(0, (attackerRobot.currentEnergy || 0) - energyCost);

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
    // NOVO SISTEMA DE ESCUDO ABSOLUTO:
    // O escudo anula QUALQUER dano completamente.
    // Ao ser atingido: escudo quebra imediatamente e robô fica TONTO por 2 rounds.
    if (target.shield && target.shield.active) {
      // Efeito especial do TV (Barreira Tesla): descarga elétrica no atacante ao quebrar
      if (target.shield.reflectBreakDamage && attacker && attacker.isAlive) {
        const refDmg = target.shield.reflectBreakDamage;
        attacker.currentHp = Math.max(0, attacker.currentHp - refDmg);
        events.push({
          type: 'shield_reflect_break',
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

      // Quebra o escudo e aplica atordoamento (TONTO)
      target.shield = null;
      target.isStunned = true;
      target.stunRoundsLeft = 2;
      events.push({
        type: 'shield_break_stun',
        target: target.id,
        targetName: target.name,
        stunRounds: 2
      });
      return false; // Dano 100% anulado — robô nao pode morrer por ataque com escudo
    }

    // Sem escudo: dano direto ao HP
    if (rawDamage > 0) {
      target.currentHp = Math.max(0, target.currentHp - rawDamage);
      events.push({ type: 'damage', target: target.id, damage: rawDamage, hp: target.currentHp });
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
    attacker.currentEnergy = Math.min(5, attacker.currentEnergy + 1); // cap maximo e 5
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

    // Escudo absoluto: sem HP, so um flag active. Ao ser atacado: quebra e stun.
    const makeShield = (targetBot) => ({
      active: true,                              // Escudo absoluto — anula 100% de qualquer ataque
      color: def.shieldColor,
      targets: def.targets,
      roundsLeft: 2,
      hpPerRound: def.hpPerRound || 0,           // PB: regenera HP por round enquanto ativo
      reflectBreakDamage: def.reflectBreakDamage || 0, // TV: dano ao atacante quando o escudo quebra
      sourceRobotId: defenderRobot.id,
    });

    if (def.targets === 'all') {
      // DB: escudo absoluto para os 3 robos aliados (exceto TONTOS)
      myTeam.forEach(r => {
        if (r.isAlive && !r.isStunned) { // Robo TONTO nao pode receber escudo
          r.shield = makeShield(r);
        }
      });
      events.push({
        type: 'defense_all',
        defender: defenderRobot.id,
        defenderName: defenderRobot.name,
        shieldColor: def.shieldColor,
        roundsLeft: 2
      });
    } else {
      // Escolhe o alvo do escudo — TONTOS nao podem receber escudo
      let target = null;
      const candidates = [
        chosenTarget,
        defenderRobot._chosenDefenseTarget,
        defenderRobot,
        ...myTeam
      ];
      for (const c of candidates) {
        if (c && c.isAlive && !c.isStunned) { target = c; break; }
      }

      if (!target || target.isStunned) {
        // Nenhum aliado valido para receber o escudo
        events.push({ type: 'shield_blocked_stun', defender: defenderRobot.id, defenderName: defenderRobot.name });
        return events;
      }

      target.shield = makeShield(target);

      // Efeitos especificos de cada robo ao ativar o escudo:
      if (def.energyBonus) {
        target.currentEnergy = Math.min(5, target.currentEnergy + def.energyBonus);
        events.push({ type: 'shield_energy_buff', target: target.id, targetName: target.name, amount: def.energyBonus });
      }
      if (def.atkBonus) {
        target.attackPower = Math.min(20, target.attackPower + def.atkBonus);
        events.push({ type: 'shield_atk_buff', target: target.id, targetName: target.name, amount: def.atkBonus });
      }
      if (def.hpPerRound) {
        events.push({ type: 'shield_regen_buff', target: target.id, targetName: target.name, amount: def.hpPerRound });
      }
      if (def.reflectBreakDamage) {
        events.push({ type: 'shield_reflect_buff', target: target.id, targetName: target.name, amount: def.reflectBreakDamage });
      }

      events.push({
        type: 'defense_single',
        defender: defenderRobot.id,
        defenderName: defenderRobot.name,
        target: target.id,
        targetName: target.name,
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

    // Revive com 20 HP (novo HP maximo) e limpa o atordoamento
    if (targetRobot && (!targetRobot.isAlive || targetRobot.currentHp <= 0)) {
      targetRobot.currentHp = 20;
      targetRobot.maxHp = 20;
      targetRobot.isAlive = true;
      targetRobot.shield = null;
      targetRobot.isStunned = false;   // Revive limpa o atordoamento
      targetRobot.stunRoundsLeft = 0;
      events.push({ type: 'revive', target: targetRobot.id, targetName: targetRobot.name, hp: 20 });
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
      // Processa duracao do escudo (expirar naturalmente apos 2 rounds)
      if (r.shield && r.shield.active && r.isAlive) {
        // Efeito especial do PB: regenera HP enquanto o escudo esta ativo
        if (r.shield.hpPerRound && r.shield.hpPerRound > 0) {
          r.currentHp = Math.min(r.maxHp, r.currentHp + r.shield.hpPerRound);
        }

        r.shield.roundsLeft = (r.shield.roundsLeft !== undefined ? r.shield.roundsLeft : 2) - 1;
        if (r.shield.roundsLeft <= 0) {
          r.shield = null; // Escudo expirou naturalmente
        }
      }

      // Processa contagem regressiva do atordoamento (TONTO)
      if (r.isStunned) {
        r.stunRoundsLeft = Math.max(0, (r.stunRoundsLeft || 0) - 1);
        if (r.stunRoundsLeft <= 0) {
          r.isStunned = false;
          r.stunRoundsLeft = 0;
        }
      }
    });
  }

  _processEnergyPerRound() {
    const allRobots = [...this.playerTeam, ...this.enemyTeam];
    allRobots.forEach(r => {
      if (r.isAlive) {
        // Base +1 de energia por round (maximo 5)
        r.currentEnergy = Math.min(5, r.currentEnergy + 1);
        // Se poupou energia (acao rest ou sem acao), ganha +1 bonus
        if (r.action === 'rest' || !r.action) {
          r.currentEnergy = Math.min(5, r.currentEnergy + 1);
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

    // Ataque minimo custa 3 EN agora. Robo TONTO pode atacar.
    const attackersWithEnergy = aliveBot.filter(r => r.currentEnergy >= 3);
    let attacker = null;
    let chosenAttack = null;

    if (attackersWithEnergy.length > 0) {
      attacker = attackersWithEnergy.reduce((best, r) => r.currentEnergy >= best.currentEnergy ? r : best, attackersWithEnergy[0]);
      const validAttacks = attacker.attacks.filter(a => a.energyCost <= attacker.currentEnergy);
      chosenAttack = validAttacks[validAttacks.length - 1] || null;
      if (!chosenAttack) attacker = null;
    }

    // Escudo: robo TONTO NAO pode usar defesa. Robo com escudo ja ativo tambem nao precisa.
    const defenderCandidates = aliveBot.filter(r => r !== attacker && !r.isStunned);
    const defender = defenderCandidates.find(r => !r.shield) || defenderCandidates[0] || null;

    // Alvo do escudo: escolhe aliado nao-tonto com menos HP
    let defenderTarget = null;
    if (defender && defender.defense?.targets !== 'all') {
      const candidates = [...aliveBot].filter(r => !r.isStunned).sort((a, b) => a.currentHp - b.currentHp);
      defenderTarget = candidates[0] || defender;
    }

    // Suporte: custo varia por robo (1 ou 2 EN)
    const supCost = r => r.support?.energyCost || 1;
    const supporterCandidates = aliveBot.filter(r => r !== attacker && r !== defender && r.currentEnergy >= supCost(r));
    const supporter = supporterCandidates[0] || null;

    // Alvo de suporte: aliado caido (revive com 20 HP) ou mais danificado
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

    // Robo TONTO nao pode usar defesa
    if (actions.defender && actions.defender !== actions.attacker && !actions.defender.isStunned) {
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
  static loadAccount() { return null; } // use AccountAPI.fetch(name)
  static saveAccount() { }
  static createAccount(name) { return { name, wins: 0, losses: 0, totalMedals: 0, totalMatches: 0, createdAt: Date.now() }; }
  static recordResult() { } // use AccountAPI.saveResult(name, won, medals)
}
