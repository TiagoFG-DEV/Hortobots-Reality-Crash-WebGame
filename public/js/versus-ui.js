// ═══════════════════════════════════════════════════════════════════
// versus-ui.js — Controller Principal da Estação de Batalha VERSUS (v4)
// Recursos:
// 1. Seleção explícita de alvos (ataque se alinha de frente com o oponente)
// 2. Suporte com escolha explícita do aliado a curar/reviver
// 3. Escudo com quebra automática após 3 rounds [3R]
// 4. Opção de POUPAR ENERGIA / DESCANSAR (não é obrigatório agir todos)
// 5. ZERO EMOJIS em todas as telas, tags e mensagens
// ═══════════════════════════════════════════════════════════════════
import { VersusEngine, VERSUS_ROBOTS, ROBOT_KEYS } from './versus-engine.js';
import { VersusBoard } from './versus-board.js';
import { VersusMinigames } from './versus-minigames.js';
import { VersusNetwork, AccountAPI } from './versus-network.js';
import { TerminalAudioManager, getAudio } from './terminal-audio.js';
import { versus3DEngine } from './versus-3d.js';

// ── Singletons ───────────────────────────────────────────────────────
const engine    = new VersusEngine();
const network   = new VersusNetwork();
let board       = null;
let minigames   = null;
let account     = null;

// ── DOM Helpers ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const screens = ['versusLoginScreen', 'versusModeSelectScreen', 'versusArenaScreen'];

function showScreen(id) {
  screens.forEach(s => {
    const el = $(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
  if (id) {
    ['titleScreen', 'storyScreen', 'elevatorScreen', 'battleScreen', 'endingScreen'].forEach(s => {
      $(s)?.classList.add('hidden');
    });
    const biomeBadge = $('termBiomeBadge');
    if (biomeBadge) biomeBadge.innerText = '[ MODO: VERSUS ]';
    const partyBadge = $('termPartyBadge');
    if (partyBadge) partyBadge.innerText = '[ EQUIPE: 3 ROBÔS ]';

    // O botão Home só aparece fora de duelos (ou seja, escondido na arena de duelo)
    const homeBtn = $('termHomeBtn');
    if (homeBtn) {
      if (id === 'versusArenaScreen') {
        homeBtn.classList.add('hidden');
      } else {
        homeBtn.classList.remove('hidden');
      }
    }
  }
}

function showTitle() {
  screens.forEach(s => $(s)?.classList.add('hidden'));
  ['storyScreen', 'elevatorScreen', 'battleScreen', 'endingScreen'].forEach(s => {
    $(s)?.classList.add('hidden');
  });
  const biomeBadge = $('termBiomeBadge');
  if (biomeBadge) biomeBadge.innerText = '[ SETOR: FLORESTA DIGITAL ]';
  const partyBadge = $('termPartyBadge');
  if (partyBadge) partyBadge.innerText = '[ PARTY: 1/5 ]';
  $('titleScreen')?.classList.remove('hidden');
  getAudio().playBGM('title', 600);

  // Esconde o botão de início na tela de título
  $('termHomeBtn')?.classList.add('hidden');

  // Inicializa o fundo 3D da Torre Realista girando
  if (window.gameInstance && window.gameInstance.engine3D) {
    window.gameInstance.engine3D.initTitle3DBackground('title3DCanvasContainer');
  }
}

window.enterVersusMode = () => {
  $('titleScreen')?.classList.add('hidden');
  showScreen('versusModeSelectScreen');
  const welcomeBar = $('versusWelcomeBar');
  if (welcomeBar) {
    welcomeBar.textContent = account?.name ? `BEM-VINDO, PILOTO ${account.name}!` : 'SELECIONE SEU PROTOCOLO DE COMBATE';
  }
  getAudio().playBGM('versusLobby', 600);
};

// Inicialização: garante 100% que todas as telas de VERSUS e História estejam ocultas e APENAS a tela de título esteja aberta!
screens.forEach(s => $(s)?.classList.add('hidden'));
$('titleScreen')?.classList.remove('hidden');

// ── State helpers ────────────────────────────────────────────────────
let selectedRobotIds = [];
let currentMode = 'bot'; // 'bot' | 'ranked'
let activeRoleMode = null; // 'attack' | 'defense' | 'support' | 'rest' | null
let selectedAttacker = null;
let isClashRunning = false;

// ════════════════════════════════════════════════════════════════════
// SECTION 1 — Title → Protocolo de Combate (Treino / Competitivo)
// ════════════════════════════════════════════════════════════════════
$('termVersusBtn')?.addEventListener('click', () => {
  if (window.gameInstance && typeof window.gameInstance.triggerTapeTransition === 'function') {
    window.gameInstance.triggerTapeTransition($('termVersusBtn'), window.enterVersusMode);
  } else {
    window.enterVersusMode();
  }
});

$('versusModeBackBtn')?.addEventListener('click', showTitle);

$('versusBotBtn')?.addEventListener('click', () => {
  currentMode = 'bot';
  engine.mode = 'bot';
  if (!account) {
    account = { name: 'PILOTO', wins: 0, losses: 0, totalMatches: 0 };
  }
  engine.playerName = account.name;
  enterUnifiedArena('bot');
});

$('versusModeBotCard')?.addEventListener('click', (e) => {
  if (e.target && e.target.tagName !== 'BUTTON') {
    $('versusBotBtn')?.click();
  }
});

$('versusRankedBtn')?.addEventListener('click', () => {
  currentMode = 'ranked';
  engine.mode = 'ranked';
  if (account && account.name) {
    network.connect(account.name);
    enterUnifiedArena('ranked');
  } else {
    showScreen('versusLoginScreen');
    renderLoginScreen();
  }
});

$('versusModeRankCard')?.addEventListener('click', (e) => {
  if (e.target && e.target.tagName !== 'BUTTON') {
    $('versusRankedBtn')?.click();
  }
});

// ── Login / Identificação para Partidas Ranqueadas ──
function renderLoginScreen() {
  const input = $('versusPlayerName');
  if (input) input.value = '';
  $('versusAccountInfo')?.classList.add('hidden');
}

$('versusLoginBackBtn')?.addEventListener('click', () => {
  showScreen('versusModeSelectScreen');
});

$('versusCreateBtn')?.addEventListener('click', async () => {
  const rawName = ($('versusPlayerName')?.value || '').trim();
  if (!rawName) {
    highlight($('versusPlayerName'), 'error');
    return;
  }
  const name = rawName.toUpperCase().slice(0, 16);
  showLoginLoading(true);

  try {
    account = await AccountAPI.fetch(name);
    engine.playerName = account.name;
    network.connect(account.name);

    $('versusAccountInfo')?.classList.remove('hidden');
    const infoEl = $('versusAccountInfo');
    if (infoEl) {
      infoEl.innerHTML = `
        <div>[OK] Conta confirmada: <strong>${account.name}</strong></div>
        <div style="font-size:0.72rem;color:rgba(0,229,255,0.7);margin-top:4px">
          V: ${account.wins} · D: ${account.losses} · Partidas: ${account.totalMatches}
        </div>
      `;
    }
    setTimeout(() => {
      enterUnifiedArena('ranked');
    }, 600);
  } catch (err) {
    showLoginLoading(false);
    const infoEl = $('versusAccountInfo');
    if (infoEl) {
      infoEl.classList.remove('hidden');
      infoEl.textContent = '[ERRO] Erro ao conectar ao servidor. Verifique se o jogo está rodando.';
      infoEl.style.color = '#ff3344';
    }
  } finally {
    showLoginLoading(false);
  }
});

function showLoginLoading(loading) {
  const btn = $('versusCreateBtn');
  if (btn) btn.textContent = loading ? '[ CONECTANDO... ]' : '[ CRIAR / ENTRAR ]';
}

// ════════════════════════════════════════════════════════════════════
// SECTION 3 — Entrada na Estação Unificada & Draft em Tempo Real
// ════════════════════════════════════════════════════════════════════
async function enterUnifiedArena(mode) {
  showScreen('versusArenaScreen');
  getAudio().playBGM('versusDraft', 600);

  // Carrega configuração de energia de habilidades (1 a 5 níveis)
  await engine.loadEnergyConfig();

  // Arena 100% 2D pura (sem elementos 3D no fundo do combate)
  $('versusLeftDeck')?.classList.remove('minimized');

  engine.reset();
  engine.mode = mode;
  engine.playerName = account?.name || 'PLAYER';
  engine.fogOfWar = true;

  if (!board) {
    const canvas = $('versusBoardCanvas');
    board = new VersusBoard(canvas);
    minigames = new VersusMinigames($('versusMinigameOverlay'));

    // Clique no canvas interage com o robô ou alvo
    board.onCellClick = (col, row) => {
      if (isClashRunning) return;
      if (col === 0) {
        // Clicou em robô aliado
        const ally = engine.playerTeam.find(r => r.row === row && r.isAlive);
        if (ally && activeRoleMode) {
          assignRoleToRobot(ally, activeRoleMode);
        }
      } else if (col === 4 && !engine.fogOfWar) {
        // Clicou em robô inimigo para focar como alvo de ataque!
        const enemy = engine.enemyTeam.find(r => r.row === row && r.isAlive);
        if (enemy && selectedAttacker) {
          selectAttackTarget(selectedAttacker, enemy);
        }
      }
    };
  }

  if (mode === 'bot') {
    engine.selectEnemyTeam(engine.botPickTeam());
  }

  board.start(engine);

  $('versusDraftSection')?.classList.remove('hidden');
  $('versusCommandSection')?.classList.add('hidden');

  selectedRobotIds = [];
  buildCompactDraftList();
  updateDraftUI();
  updateArenaHUD();
  updateGuide('RECRUTAMENTO: Escolha 3 robôs para suas linhas', 'Clique em um robô da lista para posicioná-lo no tabuleiro.');
  addLog('Estação de combate energizada. Custos de energia carregados.', 'info');
}

function buildCompactDraftList() {
  const container = $('versusRobotGrid');
  if (!container) return;
  container.innerHTML = '';

  const elements = {
    DB: 'Fogo',
    PL: 'Gelo',
    CP: 'Raio',
    TV: 'Fera',
    PB: 'Luz'
  };

  const keys = (ROBOT_KEYS && ROBOT_KEYS.length) ? ROBOT_KEYS : Object.keys(VERSUS_ROBOTS);

  // Inicializa o preview 3D com o primeiro robô
  versus3DEngine.initDraft3DPreview('versusDraft3DPreview', VERSUS_ROBOTS['DB']);
  const nameEl = $('versusDraft3DName');
  if (nameEl) nameEl.textContent = `[ DINO-BYTE // FOGO ]`;

  keys.forEach(id => {
    const r = VERSUS_ROBOTS[id];
    if (!r) return;
    const elem = elements[id] || r.colorName || 'Tecno';
    const card = document.createElement('div');
    card.className = 'compact-draft-card';
    card.id = `draft-card-${id}`;
    card.innerHTML = `
      <div class="compact-draft-left">
        <div class="compact-draft-glyph" style="background:${r.color}; box-shadow:0 0 10px ${r.color}55">${id}</div>
        <div class="compact-draft-info">
          <strong>${r.name}</strong>
          <span>200 HP · ${r.baseAtk || 1} ATK · ${elem}</span>
        </div>
      </div>
      <div class="compact-draft-pick-badge" id="draft-badge-${id}"></div>
    `;

    card.addEventListener('mouseenter', () => {
      versus3DEngine.initDraft3DPreview('versusDraft3DPreview', r);
      if (nameEl) nameEl.textContent = `[ ${r.name.toUpperCase()} // ${elem.toUpperCase()} ]`;
    });

    card.addEventListener('click', () => {
      versus3DEngine.initDraft3DPreview('versusDraft3DPreview', r);
      if (nameEl) nameEl.textContent = `[ ${r.name.toUpperCase()} // ${elem.toUpperCase()} ]`;
      toggleDraftRobot(id);
    });
    container.appendChild(card);
  });
}

function toggleDraftRobot(id) {
  const idx = selectedRobotIds.indexOf(id);
  if (idx >= 0) {
    selectedRobotIds.splice(idx, 1);
  } else {
    if (selectedRobotIds.length < 3) {
      selectedRobotIds.push(id);
    } else {
      selectedRobotIds.pop();
      selectedRobotIds.push(id);
    }
  }

  engine.selectPlayerTeam(selectedRobotIds);
  getAudio().playKeyClack();
  updateDraftUI();
}

function updateDraftUI() {
  const counter = $('versusPickCounter');
  if (counter) counter.textContent = `(${selectedRobotIds.length}/3)`;

  ROBOT_KEYS.forEach(id => {
    const card = $(`draft-card-${id}`);
    const badge = $(`draft-badge-${id}`);
    const idx = selectedRobotIds.indexOf(id);
    if (!card) return;

    if (idx >= 0) {
      card.classList.add('selected');
      if (badge) badge.textContent = `LINHA ${idx + 1}`;
    } else {
      card.classList.remove('selected');
      if (badge) badge.textContent = '';
    }
  });

  const confirmBtn = $('versusConfirmTeamBtn');
  if (confirmBtn) {
    confirmBtn.disabled = selectedRobotIds.length !== 3;
  }

  if (selectedRobotIds.length === 0) {
    updateGuide('RECRUTAMENTO: Selecione o 1º robô', 'O primeiro robô assumirá a Linha 1 no tabuleiro.');
  } else if (selectedRobotIds.length === 1) {
    updateGuide('RECRUTAMENTO: Selecione o 2º robô', 'O segundo robô assumirá a Linha 2 no tabuleiro.');
  } else if (selectedRobotIds.length === 2) {
    updateGuide('RECRUTAMENTO: Selecione o 3º robô', 'O terceiro robô assumirá a Linha 3 no tabuleiro.');
  } else {
    updateGuide('ESCALAÇÃO COMPLETA! Pronto para o Combate', 'Clique em [CONFIRMAR ESCALAÇÃO] para iniciar o Round 1.');
  }
}

// ════════════════════════════════════════════════════════════════════
// SECTION 4 — Início do Combate & Sorteio de Iniciativa
// ════════════════════════════════════════════════════════════════════
$('versusConfirmTeamBtn')?.addEventListener('click', async () => {
  if (selectedRobotIds.length !== 3) return;

  const playerName = (account?.name || 'PILOTO').toUpperCase();
  const enemyName = currentMode === 'bot' ? 'SIMULADOR IA DA TORRE' : 'OPONENTE RANKED';

  const battleBgmKey = getAudio().getRandomBattleTrackKey();

  // 1. Cinemática Grandiosa 3D Pré-Duelo do Modo História
  if (window.gameInstance && typeof window.gameInstance.runGrandDuelCinematic === 'function') {
    await window.gameInstance.runGrandDuelCinematic(
      'ARENA VIRTUAL // NÍVEL TORRE',
      currentMode === 'bot' ? 'SIMULADOR DE COMBATE IA' : 'DUELO COMPETITIVO RANKED',
      `PILOTO [ ${playerName} ]`,
      `[ ${enemyName} ]`,
      battleBgmKey
    );
  }

  // 2. Inicia o combate na arena 2D
  engine.startCombat();

  $('versusDraftSection')?.classList.add('hidden');
  $('versusCommandSection')?.classList.remove('hidden');

  const initText = engine.initiative === 'PLAYER' ? 'VOCÊ COMEÇA' : 'ADVERSÁRIO COMEÇA';
  const initBadge = $('versusInitiativeBadge');
  if (initBadge) {
    initBadge.textContent = `[ INICIATIVA: ${initText} ]`;
    initBadge.style.borderColor = engine.initiative === 'PLAYER' ? '#00ff88' : '#ff4455';
    initBadge.style.color = engine.initiative === 'PLAYER' ? '#00ff88' : '#ff4455';
  }

  getAudio().playBGM(battleBgmKey, 800);

  addLog(`Round 1 iniciado! Iniciativa sorteada: ${initText}.`, 'kill');
  showPhaseBanner('ROUND 1', `INICIATIVA: ${initText} // DEFINA SUAS TÁTICAS`, 'normal', 1600);

  resetRoleAssignmentUI();
  updateArenaHUD();
  updateStatusPanel();
  updateGuide('ROUND 1 // FASE DE COMANDO', 'Defina funções para seus combatentes ou poupe energia.');
  renderCommandCards();
});

// ════════════════════════════════════════════════════════════════════
// SECTION 5 — Deck de Comando Tático Direto (Card Selecionado & Alvos)
// ════════════════════════════════════════════════════════════════════
// FLUXO TÁTICO: SELEÇÃO DE ALVOS 100% DIRETA NO TABULEIRO (SEM MENUS!)
// ════════════════════════════════════════════════════════════════════
let selectedDeckRobotId = null;

function openTargetSelection(robot, type) {
  const overlay = $('versusTargetOverlay');
  const titleEl = $('versusTargetTitle');
  const subEl = $('versusTargetSub');

  if (type === 'attack') {
    if (titleEl) titleEl.textContent = 'ESCOLHA O ALVO NO TABULEIRO';
    if (subEl) {
      subEl.textContent = '[ CLIQUE DIRETAMENTE NO ROBÔ ADVERSÁRIO EM EVIDÊNCIA ]';
      subEl.classList.remove('ally-mode');
    }
  } else if (type === 'support') {
    if (titleEl) titleEl.textContent = 'ESCOLHA O ALIADO NO TABULEIRO';
    if (subEl) {
      subEl.textContent = '[ CLIQUE DIRETAMENTE NO ROBÔ ALIADO EM EVIDÊNCIA ]';
      subEl.classList.add('ally-mode');
    }
  }

  // 1. Menu lateral desliza para fora imediatamente
  $('versusLeftDeck')?.classList.add('slide-out');

  // 2. Exibe HUD orientador flutuante no topo da tela (sem cards bloqueando)
  if (overlay) overlay.classList.remove('hidden');

  // 3. Ativa o modo de mira diretamente no tabuleiro (canvas)
  if (board) {
    board.startTargetSelection(robot, type, (chosenEntity) => {
      if (type === 'attack') {
        robot._chosenTarget = chosenEntity;
        getAudio().playKeyClack();
        addLog(`[ALVO TRAVADO] ${robot.name} mira em ${chosenEntity.name} (Linha ${chosenEntity.row}).`, 'attack');
      } else {
        robot._chosenAllyTarget = chosenEntity;
        getAudio().playKeyClack();
        addLog(`[SUPORTE TRAVADO] ${robot.name} direcionará suporte para ${chosenEntity.name}.`, 'support');
      }

      // Fecha o overlay orientador e traz o menu lateral de volta!
      closeTargetSelection();
      renderCommandCards();
    });
  }
}

function closeTargetSelection() {
  const overlay = $('versusTargetOverlay');
  if (overlay) overlay.classList.add('hidden');

  // Menu lateral desliza de volta para dentro!
  $('versusLeftDeck')?.classList.remove('slide-out');

  if (board && board.targetSelectionMode) {
    board.cancelTargetSelection();
  }
}

// Tecla ESC para cancelar seleção e trazer menu de volta
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && board && board.targetSelectionMode) {
    closeTargetSelection();
    renderCommandCards();
  }
});

function renderCommandCards() {
  const stack = $('versusRobotsCommandStack');
  if (!stack) return;
  stack.innerHTML = '';

  // Seleciona o primeiro robô vivo por padrão se nenhum estiver selecionado
  if (!selectedDeckRobotId && engine.playerTeam.length > 0) {
    const firstAlive = engine.playerTeam.find(r => r.isAlive);
    selectedDeckRobotId = (firstAlive || engine.playerTeam[0]).id;
  }
  window.selectedDeckRobotId = selectedDeckRobotId;

  engine.playerTeam.forEach((bot) => {
    const isCardSelected = (bot.id === selectedDeckRobotId);
    const card = document.createElement('div');
    card.className = `robot-command-card ${isCardSelected ? 'card-selected' : ''} ${!bot.isAlive ? 'fallen' : ''}`;
    card.id = `robot-cmd-${bot.id}`;

    const action = bot.action || 'rest';
    const hpPct = Math.max(0, Math.min(100, Math.floor((bot.currentHp / bot.maxHp) * 100)));

    // Exclusividade de papéis: papéis já escolhidos por OUTROS robôs
    const otherBots = engine.playerTeam.filter(r => r.id !== bot.id);
    const isAtkTaken = otherBots.some(r => r.action === 'attack');
    const isDefTaken = otherBots.some(r => r.action === 'defense');
    const isSupTaken = otherBots.some(r => r.action === 'support');

    // Badge de status do robô quando recolhido
    let badgeText = '[ DISPONÍVEL ]';
    let badgeStyle = 'background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1);';
    if (bot.action === 'attack') {
      badgeText = '[ PAPEL: ATAQUE ]';
      badgeStyle = 'background: rgba(255,51,68,0.18); color: #ff4455; border: 1px solid #ff3344;';
    } else if (bot.action === 'defense') {
      badgeText = '[ PAPEL: DEFESA ]';
      badgeStyle = 'background: rgba(0,229,255,0.18); color: #00e5ff; border: 1px solid #00e5ff;';
    } else if (bot.action === 'support') {
      badgeText = '[ PAPEL: SUPORTE ]';
      badgeStyle = 'background: rgba(0,255,136,0.18); color: #00ff88; border: 1px solid #00ff88;';
    } else if (bot.action === 'rest') {
      badgeText = '[ PAPEL: POUPAR ]';
      badgeStyle = 'background: rgba(255,215,0,0.18); color: #ffd700; border: 1px solid #ffd700;';
    }

    // Geração dinâmica dos botões de ação:
    // Se uma ação estiver escolhida, ela maximiza tomando 100% da largura, sumindo com as outras duas
    let buttonsHTML = '';
    if (!bot.isAlive) {
      buttonsHTML = `<div class="robot-cmd-fallen-msg">[ COMBATENTE CAÍDO — USE SUPORTE PARA REVIVER ]</div>`;
    } else if (!bot.action || bot.action === 'rest') {
      // Nenhum papel escolhido: exibe os 4 botões (com bloqueio cinza para papéis já ocupados)
      buttonsHTML = `
        <div class="robot-cmd-action-buttons">
          <button class="cmd-action-btn atk ${isAtkTaken ? 'locked-role' : ''}" data-robot="${bot.id}" data-action="attack" ${isAtkTaken ? 'disabled' : ''}>
            [ ATK ] ATAQUE
          </button>
          <button class="cmd-action-btn def ${isDefTaken ? 'locked-role' : ''}" data-robot="${bot.id}" data-action="defense" ${isDefTaken ? 'disabled' : ''}>
            [ DEF ] DEFESA
          </button>
          <button class="cmd-action-btn sup ${isSupTaken ? 'locked-role' : ''}" data-robot="${bot.id}" data-action="support" ${isSupTaken ? 'disabled' : ''}>
            [ SUP ] SUPORTE
          </button>
          <button class="cmd-action-btn rst ${bot.action === 'rest' ? 'selected' : ''}" data-robot="${bot.id}" data-action="rest">
            [ REST ] POUPAR
          </button>
        </div>
      `;
    } else if (bot.action === 'attack') {
      buttonsHTML = `
        <div class="robot-cmd-action-buttons">
          <button class="cmd-action-btn selected-maximized atk" data-robot="${bot.id}" data-action="attack" title="Clique para cancelar esta ação">
            <span>[ ATK ] ATAQUE</span>
            <span class="action-status-tag">[ PAPEL ATIVO: ATAQUE ] ✕ CANCELAR</span>
          </button>
          <button class="cmd-action-btn rst" data-robot="${bot.id}" data-action="rest" style="flex:1 1 100%;margin-top:4px;">
            [ REST ] POUPAR ENERGIA
          </button>
        </div>
      `;
    } else if (bot.action === 'defense') {
      buttonsHTML = `
        <div class="robot-cmd-action-buttons">
          <button class="cmd-action-btn selected-maximized def" data-robot="${bot.id}" data-action="defense" title="Clique para cancelar esta ação">
            <span>[ DEF ] DEFESA</span>
            <span class="action-status-tag">[ PAPEL ATIVO: DEFESA ] ✕ CANCELAR</span>
          </button>
          <button class="cmd-action-btn rst" data-robot="${bot.id}" data-action="rest" style="flex:1 1 100%;margin-top:4px;">
            [ REST ] POUPAR ENERGIA
          </button>
        </div>
      `;
    } else if (bot.action === 'support') {
      buttonsHTML = `
        <div class="robot-cmd-action-buttons">
          <button class="cmd-action-btn selected-maximized sup" data-robot="${bot.id}" data-action="support" title="Clique para cancelar esta ação">
            <span>[ SUP ] SUPORTE</span>
            <span class="action-status-tag">[ PAPEL ATIVO: SUPORTE ] ✕ CANCELAR</span>
          </button>
          <button class="cmd-action-btn rst" data-robot="${bot.id}" data-action="rest" style="flex:1 1 100%;margin-top:4px;">
            [ REST ] POUPAR ENERGIA
          </button>
        </div>
      `;
    }

    // Subpainéis de configuração (Golpe/Informações)
    let subpanelHTML = '';
    if (!bot.isAlive) {
      subpanelHTML = '';
    } else if (action === 'attack') {
      const skillsHTML = (bot.attacks || []).map((atk, ai) => {
        const isChosen = (bot._chosenAttack?.name === atk.name) || (!bot._chosenAttack && ai === 0);
        const canAfford = bot.currentEnergy >= (atk.energyCost || 0);
        return `
          <button class="cmd-chip-btn ${isChosen ? 'active' : ''} ${!canAfford ? 'disabled' : ''}" data-robot="${bot.id}" data-type="skill" data-index="${ai}">
            <strong>${atk.name}</strong>
            <span class="chip-cost">${atk.energyCost > 0 ? `${atk.energyCost} EN` : 'GRÁTIS'}</span>
          </button>
        `;
      }).join('');

      subpanelHTML = `
        <div class="robot-cmd-subpanel">
          <div class="cmd-sub-row"><span class="cmd-sub-label">GOLPE:</span> <div class="cmd-chips-wrap">${skillsHTML}</div></div>
        </div>
      `;
    } else if (action === 'defense') {
      const shieldInfo = bot.shield ? `Escudo Ativo (${bot.shield.roundsLeft || 3} Rodadas restantes)` : `Erguer Barreira Holográfica (Dura 3 Rodadas)`;
      subpanelHTML = `
        <div class="robot-cmd-subpanel defense-panel">
          <span class="cmd-panel-badge">[DEFESA]</span> ${shieldInfo}
        </div>
      `;
    } else if (action === 'support') {
      const cost = (bot.support && bot.support.energyCost) ? bot.support.energyCost : 1;
      subpanelHTML = `
        <div class="robot-cmd-subpanel">
          <span class="cmd-panel-badge" style="color:#00ff88;border-color:#00ff88">[SUPORTE]</span> Custo: ${cost} Energia. Cura +30 HP ou Revive com 50% HP.
        </div>
      `;
    }

    card.innerHTML = `
      <div class="robot-cmd-header">
        <div class="robot-cmd-identity">
          <span class="robot-cmd-glyph" style="background:${bot.color}22;color:${bot.color};border:1px solid ${bot.color}">${bot.id}</span>
          <div class="robot-cmd-title">
            <strong>${bot.name}</strong>
            <span class="robot-cmd-line">LINHA ${bot.row} · ${bot.type || 'FOGO'}</span>
          </div>
        </div>
        <div class="robot-cmd-stats">
          <div class="cmd-hp-row">
            <span class="cmd-hp-text">${bot.currentHp}/${bot.maxHp} HP</span>
            <div class="cmd-hp-bar"><div class="cmd-hp-fill" style="width:${hpPct}%;background:${hpPct > 35 ? '#00ff88' : '#ff4455'}"></div></div>
          </div>
          <div class="cmd-energy-badge">ENERGIA: <strong>${bot.currentEnergy}</strong>/10</div>
          <div class="cmd-atk-badge" style="font-size:0.75rem;font-weight:700;color:${bot.attackPower >= 50 ? '#ff1133' : '#ffd700'};margin-top:2px;">ATK: <strong>${bot.attackPower}</strong>/50 ${bot.attackPower >= 50 ? '[SOBRECARGA]' : ''}</div>
        </div>
      </div>
      <span class="cmd-collapsed-badge" style="${badgeStyle}">${badgeText}</span>

      ${buttonsHTML}
      ${subpanelHTML}
    `;

    // Ao clicar no card, ele se torna o card selecionado (recolhendo os outros)
    card.onclick = (e) => {
      if (e.target.closest('.cmd-action-btn') || e.target.closest('.cmd-chip-btn')) return;
      if (selectedDeckRobotId !== bot.id) {
        selectedDeckRobotId = bot.id;
        getAudio().playKeyClack();
        renderCommandCards();
      }
    };

    stack.appendChild(card);
  });

  attachCommandCardListeners();
}

function attachCommandCardListeners() {
  const stack = $('versusRobotsCommandStack');
  if (!stack) return;

  // Botões de Função Principal (ATK, DEF, SUP, REST)
  stack.querySelectorAll('.cmd-action-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning) return;
      const robotId = btn.dataset.robot;
      const action = btn.dataset.action;
      const robot = engine.playerTeam.find(r => r.id === robotId);
      if (!robot || !robot.isAlive) return;

      // Se clicar no botão que já está ativo, DESMARCA a ação (limpa)
      if (robot.action === action) {
        robot.action = 'rest';
        robot._chosenTarget = null;
        robot._chosenAllyTarget = null;
        getAudio().playKeyClack();
        addLog(`[AÇÃO CANCELADA] ${robot.name} desmarcou sua ação.`, 'info');
        renderCommandCards();
        return;
      }

      // Se clicar em POUPAR, limpa qualquer papel e guarda energia
      if (action === 'rest') {
        robot.action = 'rest';
        robot._chosenTarget = null;
        robot._chosenAllyTarget = null;
        getAudio().playKeyClack();
        renderCommandCards();
        return;
      }

      // Desmarca a mesma função de outros robôs (cada função é 100% exclusiva)
      engine.playerTeam.forEach(r => {
        if (r.id !== robot.id && r.action === action) {
          r.action = 'rest';
          r._chosenTarget = null;
          r._chosenAllyTarget = null;
        }
      });

      robot.action = action;
      getAudio().playPowerUp();

      if (action === 'attack') {
        if (!robot._chosenAttack) robot._chosenAttack = robot.attacks[0];
        // Abre tela escura com freeze e destaque nos alvos adversários
        openTargetSelection(robot, 'attack');
      } else if (action === 'support') {
        // Abre tela escura com freeze e destaque nos aliados
        openTargetSelection(robot, 'support');
      }

      renderCommandCards();
    };
  });

  // Botões de Skill
  stack.querySelectorAll('.cmd-chip-btn[data-type="skill"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning || btn.classList.contains('disabled')) return;
      const robotId = btn.dataset.robot;
      const atkIdx = parseInt(btn.dataset.index, 10);
      const robot = engine.playerTeam.find(r => r.id === robotId);
      if (!robot || !robot.attacks[atkIdx]) return;

      robot._chosenAttack = robot.attacks[atkIdx];
      getAudio().playKeyClack();
      renderCommandCards();
    };
  });
}

function resetRoleAssignmentUI() {
  engine.playerTeam.forEach(bot => {
    bot.action = 'rest';
    bot._chosenAttack = null;
    bot._chosenTarget = null;
    bot._chosenAllyTarget = null;
  });
  renderCommandCards();
}

// ════════════════════════════════════════════════════════════════════
// SECTION 6 — Resolução do Embate Simultâneo (Sem Overlays Bloqueantes)
// ════════════════════════════════════════════════════════════════════
$('versusConfirmTurnBtn')?.addEventListener('click', async () => {
  if (isClashRunning) return;
  isClashRunning = true;
  $('versusConfirmTurnBtn').disabled = true;

  try {
    await executeSimultaneousClash();
  } catch (err) {
    console.error('Erro na execução do clash:', err);
    addLog(`[SISTEMA] Erro na resolução: ${err.message}`, 'miss');
  } finally {
    isClashRunning = false;
    $('versusConfirmTurnBtn').disabled = false;
  }
});

async function executeSimultaneousClash() {
  // 0. Minimiza o deck de comandos durante a ação para foco total no tabuleiro e no 3D
  $('versusLeftDeck')?.classList.add('minimized');
  await delay(450);

  // Inicializa posições de origem (homeCol / homeRow) em todos os robôs
  engine.playerTeam.forEach(bot => {
    if (!bot.action) bot.action = 'rest';
    if (bot.homeCol === undefined) bot.homeCol = 0;
    if (bot.homeRow === undefined) bot.homeRow = bot.row;
    bot.col = bot.homeCol;
    bot.row = bot.homeRow;
  });
  engine.enemyTeam.forEach(bot => {
    if (bot.homeCol === undefined) bot.homeCol = 4;
    if (bot.homeRow === undefined) bot.homeRow = bot.row;
    bot.col = bot.homeCol;
    bot.row = bot.homeRow;
  });

  // IA do Oponente no Modo Treino
  if (currentMode === 'bot') {
    if (typeof engine.botSelectTurnActions === 'function') {
      engine.botSelectTurnActions();
    } else if (typeof engine.generateBotActions === 'function') {
      const bActions = engine.generateBotActions();
      if (bActions) {
        if (bActions.attacker) {
          bActions.attacker.action = 'attack';
          bActions.attacker._chosenAttack = bActions.chosenAttack;
          const aliveP = engine.playerTeam.filter(r => r.isAlive);
          if (aliveP.length > 0) bActions.attacker._chosenTarget = aliveP[0];
        }
        if (bActions.defender) bActions.defender.action = 'defense';
        if (bActions.supporter) bActions.supporter.action = 'support';
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 1ª ETAPA — DEFESA: dá um passo à frente, faz minigame e volta se a moeda permitir
  // ──────────────────────────────────────────────────────────────────
  updateGuide('EMBATE // 1ª ETAPA: DEFESA', 'Passo à frente: protocolo de escudo holográfico.');

  const defRobots = [
    ...(engine.initiative === 'PLAYER'
      ? [engine.playerTeam.find(r => r.action === 'defense' && r.isAlive), engine.enemyTeam.find(r => r.action === 'defense' && r.isAlive)]
      : [engine.enemyTeam.find(r => r.action === 'defense' && r.isAlive), engine.playerTeam.find(r => r.action === 'defense' && r.isAlive)]
    )
  ].filter(Boolean);

  for (const defBot of defRobots) {
    const isPlayer = defBot.side === 'PLAYER';
    const stepCol = isPlayer ? 1 : 3;

    addLog(`[DEFESA] ${defBot.name} dá um passo à frente para acionar o escudo!`, 'defense');
    await board.animateRobotMove(defBot, stepCol, defBot.homeRow, 350);
    await delay(250);

    let defSuccess = false;
    if (isPlayer) {
      defSuccess = await minigames.runCoinFlip(defBot.color);
    } else {
      defSuccess = Math.random() < 0.5;
    }

    engine.resolveDefense(defBot, defSuccess);

    if (defSuccess) {
      const hexColor = parseInt((defBot.color || '#00ff88').replace('#', '0x'), 16);
      versus3DEngine.trigger3DDefenseDome(defBot.side, defBot.homeRow, hexColor);
      await board.animateDefenseSequence(defBot);
      addLog(`[DEFESA] ${defBot.name} ergueu Escudo Holográfico [3 ROUNDS]!`, 'defense');
      if (isPlayer) getAudio().playCoinSound();
    } else {
      addLog(`[DEFESA] ${defBot.name} errou a moeda (sem escudo).`, 'miss');
      if (isPlayer) getAudio().playAccessDenied();
    }

    await delay(300);
    // Volta para a posição inicial
    await board.animateRobotMove(defBot, defBot.homeCol, defBot.homeRow, 350);
    updateStatusPanel();
    await delay(600); // tempo mínimo obrigatório entre ações
  }

  // ──────────────────────────────────────────────────────────────────
  // 2ª ETAPA — ATAQUE: dá um passo à frente, se posiciona de frente com o alvo, faz o minigame, ataca e volta
  // ──────────────────────────────────────────────────────────────────
  updateGuide('EMBATE // 2ª ETAPA: ATAQUES', 'Avanço frontal, alinhamento com o alvo e disparo.');

  const playerAtk = engine.playerTeam.find(r => r.action === 'attack' && r.isAlive);
  const enemyAtk  = engine.enemyTeam.find(r => r.action === 'attack' && r.isAlive);

  const attackOrder = engine.initiative === 'PLAYER'
    ? [{ side: 'PLAYER', bot: playerAtk }, { side: 'ENEMY', bot: enemyAtk }]
    : [{ side: 'ENEMY', bot: enemyAtk }, { side: 'PLAYER', bot: playerAtk }];

  for (const step of attackOrder) {
    const attacker = step.bot;
    if (!attacker || !attacker.isAlive) continue;

    const isPlayer = attacker.side === 'PLAYER';
    const myEnemySide = isPlayer ? engine.enemyTeam : engine.playerTeam;
    const stepCol = isPlayer ? 1 : 3;

    // Determina o alvo do atacante
    let target = attacker._chosenTarget && attacker._chosenTarget.isAlive
      ? attacker._chosenTarget
      : myEnemySide.find(r => r.row === attacker.homeRow && r.isAlive) || myEnemySide.find(r => r.isAlive);

    addLog(`[ATAQUE] ${attacker.name} avança para a linha de frente e mira em ${target ? target.name : 'vazio'}!`, 'attack');
    await board.animateRobotMove(attacker, stepCol, attacker.homeRow, 350);
    await delay(250);

    if (!target || !target.isAlive) {
      // Sem alvo
      const colorHex = attacker.color ? parseInt(attacker.color.replace('#', '0x'), 16) : 0xff3344;
      versus3DEngine.trigger3DAttackLaser(attacker.side, attacker.homeRow, attacker.homeRow, colorHex);
      await board.animateMissSequence(attacker, attacker.homeRow);
      addLog(`[ATAQUE] ${attacker.name} disparou na Linha ${attacker.homeRow}, mas NÃO HÁ ALVO! (0 de dano).`, 'miss');
      getAudio().playLaserSound();
    } else {
      // Minigame proposto (desempenho proporcional de 0 a 100%)
      let minigameResult = 1.0;
      if (isPlayer) {
        const atk = attacker._chosenAttack || attacker.attacks[0];
        minigameResult = await minigames.run(atk.minigame, attacker.color, attacker.name);
      } else {
        // Bot adversário: precisão proporcional de 70% a 100% ou erro (0.0)
        minigameResult = Math.random() < 0.75 ? (0.70 + Math.random() * 0.30) : 0.0;
      }

      // Depois ataca com animação 2D pura (traçado, avanço, projétil e impacto)
      const events = engine.resolveAttack(attacker, attacker._chosenAttack, minigameResult);
      await board.animateAttackSequence(attacker, target);
      getAudio().playHeavyImpact();

      for (const ev of events) {
        if (ev.type === 'damage') {
          addLog(`[ATAQUE] ${attacker.name} atingiu ${target.name}! -${ev.damage} HP (Restante: ${ev.hp})`, 'attack');
        } else if (ev.type === 'shield_hit') {
          addLog(`[ESCUDO] Escudo de ${target.name} absorveu ${ev.absorbed} de dano! (${ev.remaining} restantes)`, 'defense');
        } else if (ev.type === 'shield_break') {
          await board.animateShieldBreak(target);
          getAudio().playHeavyImpact();
          addLog(`[ESCUDO] Escudo de ${target.name} QUEBROU!`, 'miss');
        } else if (ev.type === 'robot_down') {
          addLog(`[DESTRUIÇÃO] ${target.name} TOMBOU em combate!`, 'kill');
          getAudio().playPowerUp();
        } else if (ev.type === 'kill_reward') {
          addLog(`[MEDALHA] ${attacker.name} conquistou +1 MEDALHA (+15 HP, +3 Energia)!`, 'kill');
        }
      }

      // Delay deliberado pós-ataque para exibição clara do resultado (dano, escudo e status)
      await delay(1200);
    }

    await delay(300);

    // Volta para a posição inicial no pedestal sem nunca sobrepor outros robôs
    await board.animateRobotMove(attacker, attacker.homeCol, attacker.homeRow, 350);
    attacker.row = attacker.homeRow;
    attacker.col = attacker.homeCol;

    updateStatusPanel();
    updateArenaHUD();
    await delay(600); // tempo mínimo obrigatório entre ações

    if (checkMatchEnded()) return;
  }

  // ──────────────────────────────────────────────────────────────────
  // 3ª ETAPA — SUPORTE: vai para frente e usa habilidade que custa energia. Se não houver energia, não faz nada só passa a vez
  // ──────────────────────────────────────────────────────────────────
  updateGuide('EMBATE // 3ª ETAPA: SUPORTE', 'Protocolos médicos e nanites de suporte.');

  const playerSup = engine.playerTeam.find(r => r.action === 'support' && r.isAlive);
  const enemySup  = engine.enemyTeam.find(r => r.action === 'support' && r.isAlive);

  const supportRobots = [
    ...(engine.initiative === 'PLAYER'
      ? [{ bot: playerSup, team: engine.playerTeam }, { bot: enemySup, team: engine.enemyTeam }]
      : [{ bot: enemySup, team: engine.enemyTeam }, { bot: playerSup, team: engine.playerTeam }]
    )
  ].filter(s => s.bot && s.bot.isAlive);

  for (const s of supportRobots) {
    const supporter = s.bot;
    const isPlayer = supporter.side === 'PLAYER';
    const energyCost = (supporter.support && supporter.support.energyCost !== undefined) ? supporter.support.energyCost : 1;

    // Se não houver energia, ele não faz nada só passa a vez!
    if (supporter.currentEnergy < energyCost) {
      addLog(`[SUPORTE] ${supporter.name} não possui energia suficiente (${supporter.currentEnergy}/${energyCost} EN)! Passa a vez sem agir.`, 'miss');
      const center = board._cellCenter(supporter.homeCol, supporter.homeRow);
      board.emitFloatingText('SEM ENERGIA', center.x, center.y - 30, '#ff4455', 14);
      if (isPlayer) getAudio().playAccessDenied();
      await delay(600); // tempo mínimo obrigatório
      continue;
    }

    // Vai para a frente
    const supStepCol = isPlayer ? 1 : 3;
    addLog(`[SUPORTE] ${supporter.name} avança e canaliza suporte (${energyCost} EN)!`, 'support');
    await board.animateRobotMove(supporter, supStepCol, supporter.homeRow, 350);
    await delay(250);

    // Usa a habilidade que custa energia
    versus3DEngine.trigger3DSupportHelix(supporter.side, supporter.homeRow);

    const target = (isPlayer && supporter._chosenAllyTarget)
      ? supporter._chosenAllyTarget
      : (s.team.find(r => !r.isAlive || r.currentHp <= 0) || s.team.find(r => r.isAlive && r.currentHp < r.maxHp) || supporter);

    const events = engine.resolveSupport(supporter, target);
    for (const ev of events) {
      if (ev.type === 'revive') {
        await board.animateRevive(target);
        addLog(`[RESSURREIÇÃO] ${target.name} foi REVIVIDO com 100 HP pelo Suporte!`, 'kill');
        getAudio().playPowerUp();
      } else if (ev.type === 'support_heal') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] ${target.name} curou +${ev.amount} HP (HP: ${ev.hp})`, 'support');
        getAudio().playHealSound();
      } else if (ev.type === 'support_hot') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] ${target.name} recebeu Regeneração contínua!`, 'support');
      } else if (ev.type === 'support_heal_all') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] Pulso de reparo ativado (+${ev.amount} HP para todos)!`, 'support');
        getAudio().playHealSound();
      } else if (ev.type === 'support_heal_energy') {
        await board.animateSupportSequence(supporter, target, ev.heal, ev.energy);
        addLog(`[SUPORTE] ${target.name} restaurou +${ev.heal} HP e +${ev.energy} Energia!`, 'support');
      }
    }

    await delay(350);
    // Volta para a posição inicial
    await board.animateRobotMove(supporter, supporter.homeCol, supporter.homeRow, 350);
    supporter.col = supporter.homeCol;
    supporter.row = supporter.homeRow;

    updateStatusPanel();
    await delay(600); // tempo mínimo obrigatório entre ações
  }

  // ──────────────────────────────────────────────────────────────────
  // FIM DA RODADA: Rest, decremento de escudos, checagem e restauração do menu
  // ──────────────────────────────────────────────────────────────────
  if (checkMatchEnded()) return;

  // Transição cinematográfica e delay entre rounds
  addLog(`--- FIM DO ROUND ${engine.round} // ATUALIZANDO TELEMETRIA ---`, 'info');
  await delay(1400);

  // Notifica robôs que descansaram (+1 EN)
  engine.playerTeam.forEach(bot => {
    if (bot.action === 'rest' && bot.isAlive) {
      addLog(`[POUPAR ENERGIA] ${bot.name} descansou (+1 Energia).`, 'info');
    }
  });

  engine.endPlayerTurn();
  const buffedRobots = engine.endEnemyTurn();

  // Loga os robôs que receberam sobrecarga de ataque (+5) por não terem sido alvejados
  if (buffedRobots && buffedRobots.length > 0) {
    buffedRobots.forEach(b => {
      const sideName = b.bot.side === 'PLAYER' ? 'ALIADO' : 'INIMIGO';
      addLog(`[SOBRECARGA // ${sideName}] ${b.bot.name} não foi atacado neste round: Ataque aumentou +${b.diff} (${b.oldAtk} -> ${b.newAtk}/50)!`, 'info');
    });
  }

  // Verifica sobrecarga máxima de 50 para ativar o Alerta de Emergência
  if (engine.isAttackOverloaded) {
    addLog(`[ALERTA DE EMERGÊNCIA] Sistemas de ataque em SOBRECARGA MÁXIMA (50)!`, 'miss');
    getAudio().playHeavyImpact();
  }

  updateArenaHUD();
  updateStatusPanel();
  resetRoleAssignmentUI();

  // O menu volta no próximo round em todos os rounds!
  $('versusLeftDeck')?.classList.remove('minimized');
  renderCommandCards();

  updateGuide(`ROUND ${engine.round} // FASE DE COMANDO`, 'Defina ataques, defesas, suportes ou poupe energia.');
  showPhaseBanner(`ROUND ${engine.round}`, 'FASE DE COMANDO // DEFINA SUAS AÇÕES', 'normal', 1400);
  addLog(`--- INÍCIO DO ROUND ${engine.round} ---`, 'info');
}

function checkMatchEnded() {
  const playerMedals = engine.medals.PLAYER;
  const enemyMedals  = engine.medals.ENEMY;
  const playerAlive  = engine.getAliveTeam('PLAYER').length > 0;
  const enemyAlive   = engine.getAliveTeam('ENEMY').length > 0;

  if (playerMedals >= engine.winCondition || !enemyAlive) {
    endMatch('PLAYER');
    return true;
  }
  if (enemyMedals >= engine.winCondition || !playerAlive) {
    endMatch('ENEMY');
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════
// SECTION 7 — HUD, Status & Banners
// ════════════════════════════════════════════════════════════════════
function updateArenaHUD() {
  const roundEl = $('versusRoundNum');
  if (roundEl) roundEl.textContent = engine.round;

  const pCount = $('versusPlayerMedalCount');
  const eCount = $('versusEnemyMedalCount');
  if (pCount) pCount.textContent = engine.medals.PLAYER;
  if (eCount) eCount.textContent = engine.medals.ENEMY;

  renderMedalDots($('versusPlayerMedals'), engine.medals.PLAYER);
  renderMedalDots($('versusEnemyMedals'), engine.medals.ENEMY);

  const initBadge = $('versusInitiativeBadge');
  if (initBadge && engine.initiative) {
    const initText = engine.initiative === 'PLAYER' ? 'VOCÊ COMEÇA' : 'ADVERSÁRIO COMEÇA';
    initBadge.textContent = `[ INICIATIVA: ${initText} ]`;
  }

  // Alerta de Emergência: Ativado quando qualquer robô atinge 50 de ataque
  const emergencyAlert = $('versusEmergencyAlert');
  if (emergencyAlert) {
    if (engine.isAttackOverloaded) {
      emergencyAlert.classList.remove('hidden');
    } else {
      emergencyAlert.classList.add('hidden');
    }
  }
}

function renderMedalDots(container, count) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement('div');
    dot.className = `versus-medal-pip ${i < count ? 'active' : ''}`;
    container.appendChild(dot);
  }
}

function updateStatusPanel() {
  const pPanel = $('versusPlayerStatus');
  if (!pPanel) return;
  pPanel.innerHTML = '';

  engine.playerTeam.forEach(bot => {
    const pct = Math.max(0, Math.min(100, Math.floor((bot.currentHp / bot.maxHp) * 100)));
    const shieldInfo = bot.shield ? ` [ESCUDO: ${bot.shield.roundsLeft || 3}R]` : '';
    const atkColor = bot.attackPower >= 50 ? '#ff1133' : '#ffd700';
    const atkInfo = bot.isAlive ? ` <span style="color:${atkColor};font-weight:700;">[ATK:${bot.attackPower}]</span>` : '';
    const row = document.createElement('div');
    row.className = 'compact-bot-status';
    row.innerHTML = `
      <strong style="color:${bot.color};min-width:32px;">${bot.id}</strong>
      <div class="compact-bot-hp-bar">
        <div class="compact-bot-hp-fill" style="width:${pct}%;background:${pct > 30 ? '#00ff88' : '#ff4455'}"></div>
      </div>
      <span style="font-size:0.7rem;color:var(--term-dim);min-width:105px;">
        ${bot.isAlive ? `${bot.currentHp}HP${shieldInfo}${atkInfo}` : 'DOWN'}
      </span>
    `;
    pPanel.appendChild(row);
  });
}

function updateGuide(title, sub) {
  const msg = $('versusGuideMessage');
  const subEl = $('versusGuideSub');
  if (msg) msg.textContent = title;
  if (subEl) subEl.textContent = sub;
}

function showPhaseBanner(title, subtitle, type = 'normal', duration = 1400) {
  const overlay = $('versusPhaseBannerOverlay');
  const titleEl = $('versusPhaseTitle');
  const subEl   = $('versusPhaseSub');
  if (!overlay || !titleEl) return;

  titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
  }, duration);
}

// ════════════════════════════════════════════════════════════════════
// SECTION 8 — Fim de Jogo & Overlays
// ════════════════════════════════════════════════════════════════════
async function endMatch(winner) {
  const playerWon = winner === 'PLAYER';
  try {
    if (account?.name) {
      await AccountAPI.saveResult(account.name, playerWon, engine.medals.PLAYER);
    }
  } catch (e) {}

  const overlay = $('versusResultOverlay');
  const title   = $('versusResultTitle');
  const sub     = $('versusResultSub');
  const stats   = $('versusResultStats');

  const audio = getAudio();

  if (playerWon) {
    versus3DEngine.trigger3DSupportHelix('PLAYER', 2, 0xffd700);
    audio.fadeOutBGM(400).then(() => audio.playBGM('versusVictory', 700));
    audio.playVictoryFanfare();
    showPhaseBanner('VITÓRIA TÁTICA!', 'EQUIPE VITORIOSA // ACESSO AO RANKING CONCEDIDO', 'normal', 2500);

    if (overlay) overlay.classList.remove('hidden');
  } else {
    // Cinemática 3D de Derrota da Torre (Sobrecarga Crítica // Sistema em Colapso)
    audio.fadeOutBGM(400).then(() => audio.playBGM('lastGoodbye', 700));
    const defeatOverlay = $('defeatCinematicOverlay');
    if (defeatOverlay) {
      defeatOverlay.classList.remove('hidden');
      const prog = $('defeatTimerProgress');
      if (prog) {
        prog.style.width = '0%';
        setTimeout(() => { prog.style.width = '100%'; }, 60);
      }
      setTimeout(() => {
        defeatOverlay.classList.add('hidden');
        if (overlay) overlay.classList.remove('hidden');
      }, 3600);
    } else {
      if (overlay) overlay.classList.remove('hidden');
    }
  }

  if (title) {
    title.textContent = playerWon ? 'VITÓRIA TÁTICA!' : 'DERROTA';
    title.className = `versus-result-title ${playerWon ? 'victory' : 'defeat'}`;
  }
  if (sub) {
    sub.textContent = playerWon
      ? `${engine.medals.PLAYER} medalhas conquistadas em ${engine.round} rounds!`
      : `O adversário conquistou ${engine.medals.ENEMY} medalhas.`;
  }
  if (stats) {
    stats.innerHTML = `
      <div>Suas Medalhas: <strong>${engine.medals.PLAYER}</strong>/10</div>
      <div>Medalhas Inimigas: <strong>${engine.medals.ENEMY}</strong>/10</div>
      <div>Rounds Jogados: ${engine.round}</div>
      <div>Modo: ${currentMode === 'bot' ? 'TREINO' : 'COMPETITIVO RANKED'}</div>
    `;
  }
}

$('versusPlayAgainBtn')?.addEventListener('click', () => {
  $('versusResultOverlay')?.classList.add('hidden');
  enterUnifiedArena(currentMode);
});

$('versusResultMenuBtn')?.addEventListener('click', () => {
  $('versusResultOverlay')?.classList.add('hidden');
  network.disconnect();
  showTitle();
});

// ════════════════════════════════════════════════════════════════════
// SECTION 9 — Terminal de Narrativa & Utilitários
// ════════════════════════════════════════════════════════════════════
function addLog(msg, type = '') {
  const el = $('versusLog');
  if (!el) return;
  const entry = document.createElement('div');
  entry.className = `versus-log-entry${type ? ' ' + type : ''}`;
  entry.textContent = `> ${msg}`;
  el.prepend(entry);
  while (el.children.length > 20) el.removeChild(el.lastChild);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function highlight(el, type) {
  if (!el) return;
  el.style.borderColor = type === 'error' ? '#ff3344' : '#00ff88';
  setTimeout(() => { el.style.borderColor = ''; }, 1200);
}
