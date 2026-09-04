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
const screens = ['versusLoginScreen', 'versusRegisterScreen', 'versusModeSelectScreen', 'versusCompetitiveScreen', 'versusArenaScreen'];

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
      if (id === 'versusArenaScreen' || id === 'versusCompetitiveScreen') {
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

// ── Atualização Visual do Header do Piloto ────────────────────────────
function updateProfileHeader(acc) {
  if (!acc) return;
  const nick = acc.nickname || acc.name || 'PILOTO';
  const rp = acc.rankingPoints !== undefined ? Math.max(0, acc.rankingPoints) : 100;
  const wins = acc.wins || 0;
  const matches = acc.totalMatches || 0;
  const badge = acc.avatarBadge || '[QZ-01]';
  const bio = acc.customBio || 'Piloto de Combate da Torre Central';
  const winrate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

  const nickEl = $('versusProfileNickDisplay');
  const badgeEl = $('versusProfileAvatarBadge');
  const bioEl = $('versusProfileBioDisplay');
  const rpEl = $('versusProfileRPDisplay');
  const winsEl = $('versusProfileWinsDisplay');
  const matchesEl = $('versusProfileMatchesDisplay');
  const rateEl = $('versusProfileWinrateDisplay');

  if (nickEl) nickEl.textContent = nick;
  if (badgeEl) badgeEl.textContent = badge;
  if (bioEl) bioEl.textContent = bio;
  if (rpEl) rpEl.textContent = `${rp} RP`;
  if (winsEl) winsEl.textContent = wins;
  if (matchesEl) matchesEl.textContent = matches;
  if (rateEl) rateEl.textContent = `${winrate}%`;

  try {
    localStorage.setItem('hortobots_pilot_account', JSON.stringify(acc));
  } catch (e) {}
}

window.enterVersusMode = () => {
  $('titleScreen')?.classList.add('hidden');
  getAudio().playBGM('versusLobby', 600);

  // Verifica se o piloto já possui sessão salva
  if (!account) {
    const cached = localStorage.getItem('hortobots_pilot_account');
    if (cached) {
      try { account = JSON.parse(cached); } catch (e) {}
    }
  }

  if (account && (account.nickname || account.name)) {
    updateProfileHeader(account);
    showScreen('versusModeSelectScreen');
  } else {
    showScreen('versusLoginScreen');
  }
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
let currentRoomCode = null;
let isRoomHost = false;
let isSelfReadyInRoom = false;

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
    account = { nickname: 'PILOTO', name: 'PILOTO', wins: 0, losses: 0, totalMatches: 0, rankingPoints: 100 };
  }
  engine.playerName = account.nickname || account.name || 'PILOTO';
  enterUnifiedArena('bot');
});

$('versusModeBotCard')?.addEventListener('click', (e) => {
  if (e.target && e.target.tagName !== 'BUTTON') {
    $('versusBotBtn')?.click();
  }
});

// Acesso ao Modo Competitivo em Tela Inteira
$('versusRankedBtn')?.addEventListener('click', () => {
  if (!account || (!account.nickname && !account.name)) {
    showScreen('versusLoginScreen');
    return;
  }
  const pilotNick = account.nickname || account.name;
  network.connect(pilotNick);
  showScreen('versusCompetitiveScreen');
  resetCompetitiveRoomUI();
});

$('versusModeRankCard')?.addEventListener('click', (e) => {
  if (e.target && e.target.tagName !== 'BUTTON') {
    $('versusRankedBtn')?.click();
  }
});

// ── Auth: Status Message Helper ──────────────────────────────────────
function showAuthStatus(msg, isError = true) {
  const boxes = [$('versusAuthStatusMsg'), $('versusRegStatusMsg')];
  boxes.forEach(box => {
    if (!box) return;
    box.className = `versus-status-msg ${isError ? 'error' : 'success'}`;
    box.textContent = msg;
    box.classList.remove('hidden');
  });
}

function clearAuthStatus() {
  $('versusAuthStatusMsg')?.classList.add('hidden');
  $('versusRegStatusMsg')?.classList.add('hidden');
}

// ── Auth: Login Tradicional ──────────────────────────────────────────
$('versusAuthLoginBtn')?.addEventListener('click', async () => {
  clearAuthStatus();
  const nick = ($('versusLoginNick')?.value || '').trim();
  const pass = ($('versusLoginPass')?.value || '').trim();

  if (!nick || !pass) {
    showAuthStatus('[AVISO] Informe seu Nickname e Senha para efetuar o login.');
    return;
  }

  const btn = $('versusAuthLoginBtn');
  if (btn) btn.textContent = '[ AUTENTICANDO... ]';

  try {
    const res = await AccountAPI.login(nick, pass);
    account = res.account || res;
    if (account) account.nickname = account.nickname || account.name;
    showAuthStatus(`[SUCESSO] Piloto ${account.nickname} autenticado com sucesso!`, false);
    updateProfileHeader(account);
    setTimeout(() => {
      showScreen('versusModeSelectScreen');
    }, 600);
  } catch (err) {
    showAuthStatus(`[FALHA] ${err.message || 'Erro ao autenticar piloto'}`);
  } finally {
    if (btn) btn.textContent = '[ ENTRAR NA CONTA ]';
  }
});

// ── Auth: Checkbox Vínculo Google ────────────────────────────────────
$('versusRegGoogleLinkCheck')?.addEventListener('change', (e) => {
  const grp = $('versusRegGoogleEmailGroup');
  if (grp) {
    grp.classList.toggle('hidden', !e.target.checked);
  }
});

// ── Auth: Cadastro de Nova Conta ─────────────────────────────────────
$('versusAuthRegBtn')?.addEventListener('click', async () => {
  clearAuthStatus();
  const nick = ($('versusRegNick')?.value || '').trim();
  const pass = ($('versusRegPass')?.value || '').trim();
  const linkGoogle = $('versusRegGoogleLinkCheck')?.checked || false;
  const googleEmail = linkGoogle ? ($('versusRegGoogleEmail')?.value || '').trim() : null;

  if (!nick || !pass) {
    showAuthStatus('[AVISO] Escolha um Nickname e Senha para criar seu perfil.');
    return;
  }

  const btn = $('versusAuthRegBtn');
  if (btn) btn.textContent = '[ CRIANDO CONTA... ]';

  try {
    const res = await AccountAPI.register(nick, pass, googleEmail, linkGoogle);
    account = res.account || res;
    if (account) account.nickname = account.nickname || account.name;
    showAuthStatus(`[SUCESSO] Piloto ${account.nickname} registrado! Ranking inicial: 100 RP`, false);
    updateProfileHeader(account);
    setTimeout(() => {
      showScreen('versusModeSelectScreen');
    }, 700);
  } catch (err) {
    showAuthStatus(`[FALHA] ${err.message || 'Erro ao registrar nova conta'}`);
  } finally {
    if (btn) btn.textContent = '[ CRIAR CONTA ]';
  }
});

// ── Auth: Fluxo de Login com Google ──────────────────────────────────
$('versusAuthGoogleBtn')?.addEventListener('click', () => {
  $('versusGoogleModal')?.classList.remove('hidden');
});

$('versusCancelGoogleBtn')?.addEventListener('click', () => {
  $('versusGoogleModal')?.classList.add('hidden');
});

// Seleção de conta rápida na lista Google
document.querySelectorAll('.google-account-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.google-account-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    const customInp = $('versusGoogleCustomEmail');
    if (customInp) customInp.value = opt.getAttribute('data-email') || '';
  });
});

$('versusConfirmGoogleBtn')?.addEventListener('click', async () => {
  const customInp = ($('versusGoogleCustomEmail')?.value || '').trim();
  const selectedOpt = document.querySelector('.google-account-option.active');
  const chosenEmail = customInp || (selectedOpt ? selectedOpt.getAttribute('data-email') : 'piloto.principal@gmail.com');

  $('versusGoogleModal')?.classList.add('hidden');
  clearAuthStatus();

  const loginNickHint = ($('versusLoginNick')?.value || '').trim() || null;

  try {
    const res = await AccountAPI.googleAuth(chosenEmail, loginNickHint);
    account = res.account || res;
    if (account) account.nickname = account.nickname || account.name;
    showAuthStatus(`[GOOGLE] Acesso concedido para: ${account.nickname} (${account.googleEmail || chosenEmail})`, false);
    updateProfileHeader(account);
    setTimeout(() => {
      showScreen('versusModeSelectScreen');
    }, 600);
  } catch (err) {
    showAuthStatus(`[GOOGLE] ${err.message || 'Falha ao autenticar com Google'}`);
  }
});

// ── Auth: Navegação entre Login e Registro ───────────────────────────
$('versusGoToRegisterBtn')?.addEventListener('click', () => {
  clearAuthStatus();
  showScreen('versusRegisterScreen');
  getAudio().playKeyClack();
});

$('versusGoToLoginBtn')?.addEventListener('click', () => {
  clearAuthStatus();
  showScreen('versusLoginScreen');
  getAudio().playKeyClack();
});

// ── Auth: Voltar ao Menu Principal ───────────────────────────────────
$('versusLoginBackBtn')?.addEventListener('click', showTitle);
$('versusRegisterBackBtn')?.addEventListener('click', showTitle);

// ── Perfil: Logout / Trocar Conta ────────────────────────────────────
$('versusProfileLogoutBtn')?.addEventListener('click', () => {
  account = null;
  localStorage.removeItem('hortobots_pilot_account');
  clearAuthStatus();
  if ($('versusLoginNick')) $('versusLoginNick').value = '';
  if ($('versusLoginPass')) $('versusLoginPass').value = '';
  if ($('versusRegNick')) $('versusRegNick').value = '';
  if ($('versusRegPass')) $('versusRegPass').value = '';
  network.disconnect();
  showScreen('versusLoginScreen');
});

// ── Perfil: Modal de Edição ──────────────────────────────────────────
let selectedProfileBadge = '[QZ-01]';

$('versusProfileEditBtn')?.addEventListener('click', () => {
  if (!account) return;
  const modal = $('versusProfileModal');
  if (!modal) return;

  selectedProfileBadge = account.avatarBadge || '[QZ-01]';
  const bioInp = $('versusEditBioInput');
  const passInp = $('versusEditNewPassInput');
  if (bioInp) bioInp.value = account.customBio || '';
  if (passInp) passInp.value = '';

  document.querySelectorAll('.avatar-pick-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-badge') === selectedProfileBadge);
  });

  modal.classList.remove('hidden');
});

document.querySelectorAll('.avatar-pick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.avatar-pick-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedProfileBadge = btn.getAttribute('data-badge') || '[QZ-01]';
  });
});

$('versusCancelProfileBtn')?.addEventListener('click', () => {
  $('versusProfileModal')?.classList.add('hidden');
});

$('versusSaveProfileBtn')?.addEventListener('click', async () => {
  if (!account) return;
  const bio = ($('versusEditBioInput')?.value || '').trim();
  const newPass = ($('versusEditNewPassInput')?.value || '').trim();

  try {
    const res = await AccountAPI.updateProfile(account.nickname || account.name, {
      bio: bio || account.customBio,
      avatarBadge: selectedProfileBadge,
      newPassword: newPass || undefined
    });
    account = res.account || res;
    if (account) account.nickname = account.nickname || account.name;
    updateProfileHeader(account);
    $('versusProfileModal')?.classList.add('hidden');
  } catch (err) {
    alert(`Erro ao salvar perfil: ${err.message}`);
  }
});

// ════════════════════════════════════════════════════════════════════
// SECTION 2 — Sistema de Salas Competitivas e Matchmaking ("BUSCAR DUELO!")
// ════════════════════════════════════════════════════════════════════
let queueTimerInterval = null;
let queueSeconds = 0;
let isSearchingQueue = false;

function stopQueueTimer() {
  if (queueTimerInterval) {
    clearInterval(queueTimerInterval);
    queueTimerInterval = null;
  }
  queueSeconds = 0;
  isSearchingQueue = false;
  const timerEl = $('versusQueueTimer');
  if (timerEl) timerEl.textContent = '00:00';
}

function startQueueTimer() {
  stopQueueTimer();
  isSearchingQueue = true;
  queueSeconds = 0;
  const timerEl = $('versusQueueTimer');
  if (timerEl) timerEl.textContent = '00:00';
  queueTimerInterval = setInterval(() => {
    queueSeconds++;
    const m = String(Math.floor(queueSeconds / 60)).padStart(2, '0');
    const s = String(queueSeconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function resetCompetitiveRoomUI() {
  currentRoomCode = null;
  isRoomHost = false;
  isSelfReadyInRoom = false;

  $('versusHostInitialBox')?.classList.remove('hidden');
  $('versusHostActiveBox')?.classList.add('hidden');
  $('versusGuestInitialBox')?.classList.remove('hidden');
  $('versusGuestActiveBox')?.classList.add('hidden');

  const readyHostBtn = $('versusHostReadyBtn');
  if (readyHostBtn) {
    readyHostBtn.disabled = false;
    readyHostBtn.classList.remove('active');
    readyHostBtn.textContent = '[ PRONTO PARA O COMBATE ]';
  }

  const readyGuestBtn = $('versusGuestReadyBtn');
  if (readyGuestBtn) {
    readyGuestBtn.disabled = true;
    readyGuestBtn.classList.remove('active');
    readyGuestBtn.textContent = '[ PRONTO PARA O COMBATE ]';
  }

  // Reseta painel da fila de matchmaking
  stopQueueTimer();
  $('versusQueueInitialBox')?.classList.remove('hidden');
  $('versusQueueActiveBox')?.classList.add('hidden');
  const rpEl = $('versusQueuePlayerRP');
  if (rpEl) rpEl.textContent = `${account?.rankingPoints ?? 100} RP`;

  const statusBox = $('versusCompetitiveStatusBox');
  if (statusBox) statusBox.classList.add('hidden');
}

function showCompetitiveStatus(msg, isAlert = false) {
  const box = $('versusCompetitiveStatusBox');
  if (!box) return;
  box.textContent = msg;
  box.style.borderColor = isAlert ? '#ffd700' : '#00e5ff';
  box.style.color = isAlert ? '#ffd700' : '#00e5ff';
  box.classList.remove('hidden');
}

// Anfitrião: Gerar Sala
$('versusCreateRoomActionBtn')?.addEventListener('click', () => {
  network.createRoom();
});

// Desafiante: Conectar à Sala por Código e Clicar em DUELAR
$('versusJoinRoomActionBtn')?.addEventListener('click', () => {
  const code = ($('versusJoinCodeInput')?.value || '').trim().toUpperCase();
  if (!code) {
    showCompetitiveStatus('Codigo não encontrado', true);
    return;
  }
  network.joinRoom(code, true);
});

// Fila de Matchmaking: Iniciar Busca de Duelo
$('versusStartQueueBtn')?.addEventListener('click', () => {
  if (!account || (!account.nickname && !account.name)) return;
  const rp = Number(account.rankingPoints) || 100;
  network.joinQueue(rp);
  $('versusQueueInitialBox')?.classList.add('hidden');
  $('versusQueueActiveBox')?.classList.remove('hidden');
  startQueueTimer();
  const statusMsg = $('versusQueueStatusMsg');
  if (statusMsg) statusMsg.textContent = 'Varrendo circuito por duelistas de ranking similar...';
  showCompetitiveStatus('Procurando duelista no ranking... Aguarde o pareamento.');
});

// Fila de Matchmaking: Cancelar Busca
$('versusCancelQueueBtn')?.addEventListener('click', () => {
  network.leaveQueue();
  stopQueueTimer();
  $('versusQueueActiveBox')?.classList.add('hidden');
  $('versusQueueInitialBox')?.classList.remove('hidden');
  showCompetitiveStatus('Busca de duelo cancelada.');
});

// Copiar código da sala
$('versusCopyCodeBtn')?.addEventListener('click', () => {
  if (!currentRoomCode) return;
  navigator.clipboard.writeText(currentRoomCode).then(() => {
    const btn = $('versusCopyCodeBtn');
    if (btn) {
      btn.textContent = '[ COPIADO! ]';
      setTimeout(() => { btn.textContent = '[ COPIAR ]'; }, 2000);
    }
  }).catch(() => {});
});

// Anfitrião: Confirmar Pronto (Pode confirmar a qualquer momento!)
$('versusHostReadyBtn')?.addEventListener('click', () => {
  if (isSelfReadyInRoom) return;
  network.setRoomReady();
});

// Desafiante: Confirmar Pronto
$('versusGuestReadyBtn')?.addEventListener('click', () => {
  if (isSelfReadyInRoom) return;
  network.setRoomReady();
});

// Sair da Sala / Voltar ao Menu Versus
$('versusLeaveRoomBtn')?.addEventListener('click', () => {
  if (isSearchingQueue) {
    network.leaveQueue();
  }
  network.leaveRoom();
  resetCompetitiveRoomUI();
  showScreen('versusModeSelectScreen');
});

// ── Handlers de WebSocket para Salas Fechadas & Matchmaking ───────────
network.addEventListener('room_created', (e) => {
  currentRoomCode = e.detail.roomCode;
  isRoomHost = true;
  isSelfReadyInRoom = false;

  $('versusHostInitialBox')?.classList.add('hidden');
  $('versusHostActiveBox')?.classList.remove('hidden');

  const badge = $('versusHostCodeBadge');
  if (badge) badge.textContent = currentRoomCode;

  const oppStatus = $('versusHostOpponentStatus');
  if (oppStatus) oppStatus.textContent = 'Aguardando desafiante conectar... Você já pode confirmar PRONTO!';

  const readyBtn = $('versusHostReadyBtn');
  if (readyBtn) {
    readyBtn.disabled = false;
    readyBtn.classList.remove('active');
    readyBtn.textContent = '[ PRONTO PARA O COMBATE ]';
  }

  showCompetitiveStatus(`Sala ${currentRoomCode} gerada! Se clicar em PRONTO, a batalha iniciará assim que o oponente DUELAR.`);
});

network.addEventListener('room_joined', (e) => {
  currentRoomCode = e.detail.roomCode;
  isRoomHost = e.detail.isHost;

  if (isRoomHost) {
    const oppStatus = $('versusHostOpponentStatus');
    if (oppStatus) {
      const readyTag = e.detail.guestReady ? ' <strong style="color: #00ff88;">[ PRONTO! ]</strong>' : '';
      oppStatus.innerHTML = `Desafiante conectado: <strong>${e.detail.opponentName}</strong> (${e.detail.opponentPoints} RP)${readyTag}`;
    }
    const readyBtn = $('versusHostReadyBtn');
    if (readyBtn && !isSelfReadyInRoom) {
      readyBtn.disabled = false;
      readyBtn.textContent = '[ PRONTO PARA O COMBATE ]';
    }
    showCompetitiveStatus(`Desafiante ${e.detail.opponentName} inseriu o código!`);
  } else {
    // Visão do Desafiante
    $('versusGuestInitialBox')?.classList.add('hidden');
    $('versusGuestActiveBox')?.classList.remove('hidden');

    const badge = $('versusGuestCodeBadge');
    if (badge) badge.textContent = currentRoomCode;

    const hostStatus = $('versusGuestHostStatus');
    if (hostStatus) {
      if (e.detail.status === 'waiting_host' || !e.detail.hostReady) {
        hostStatus.textContent = 'ESPERANDO POR DUELISTA';
        hostStatus.className = 'room-peer-status highlight-status';
      } else {
        hostStatus.innerHTML = `Conectado à sala de: <strong>${e.detail.opponentName}</strong> (${e.detail.opponentPoints} RP)`;
        hostStatus.className = 'room-peer-status';
      }
    }

    const readyBtn = $('versusGuestReadyBtn');
    if (readyBtn) {
      readyBtn.disabled = true;
      readyBtn.classList.add('active');
      readyBtn.textContent = '[ VOCÊ ESTÁ PRONTO! ]';
    }

    showCompetitiveStatus('ESPERANDO POR DUELISTA', true);
  }
});

network.addEventListener('self_room_ready', () => {
  isSelfReadyInRoom = true;
  if (isRoomHost) {
    const hostBtn = $('versusHostReadyBtn');
    if (hostBtn) {
      hostBtn.classList.add('active');
      hostBtn.textContent = '[ PRONTO! AGUARDANDO ADVERSÁRIO... ]';
    }
    showCompetitiveStatus('Você está PRONTO! A batalha começará assim que o oponente clicar em DUELAR.', false);
  } else {
    const guestBtn = $('versusGuestReadyBtn');
    if (guestBtn) {
      guestBtn.classList.add('active');
      guestBtn.textContent = '[ VOCÊ ESTÁ PRONTO! ]';
    }
  }
});

network.addEventListener('opponent_room_ready', () => {
  showCompetitiveStatus('Oponente confirmou PRONTO! Inicializando confronto...', false);
  if (isRoomHost) {
    const oppStatus = $('versusHostOpponentStatus');
    if (oppStatus) oppStatus.innerHTML += ' <strong style="color: #ffd700;">[ PRONTO! ]</strong>';
  } else {
    const hostStatus = $('versusGuestHostStatus');
    if (hostStatus) hostStatus.innerHTML += ' <strong style="color: #ffd700;">[ PRONTO! ]</strong>';
  }
});

network.addEventListener('opponent_left_room', (e) => {
  showCompetitiveStatus(e.detail.msg || 'O oponente saiu da sala.', true);
  resetCompetitiveRoomUI();
});

network.addEventListener('room_error', (e) => {
  showCompetitiveStatus(e.detail.msg || 'Codigo não encontrado', true);
});

network.addEventListener('queued', (e) => {
  const statusMsg = $('versusQueueStatusMsg');
  if (statusMsg) {
    statusMsg.textContent = `Procurando adversários... Fila: #${e.detail.position || 1} (Tolerância expandindo)`;
  }
});

network.addEventListener('queue_left', () => {
  stopQueueTimer();
  $('versusQueueActiveBox')?.classList.add('hidden');
  $('versusQueueInitialBox')?.classList.remove('hidden');
});

network.addEventListener('match_found', (e) => {
  stopQueueTimer();
  currentMode = 'ranked';
  engine.mode = 'ranked';
  engine.playerName = (account?.nickname || account?.name || 'PILOTO').toUpperCase();
  engine.enemyName = (e.detail.enemyName || 'OPONENTE').toUpperCase();

  showCompetitiveStatus(`Duelo pareado contra ${engine.enemyName}! Carregando arena...`, false);

  setTimeout(() => {
    enterUnifiedArena('ranked');
  }, 800);
});

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
          <span>${r.baseHp || 10} HP · ${r.baseAtk || 15} ATK · ${elem}</span>
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

  const playerName = (account?.nickname || account?.name || 'PILOTO').toUpperCase();
  const enemyName = currentMode === 'bot' ? 'SIMULADOR IA DA TORRE' : (engine.enemyName || 'OPONENTE RANKED').toUpperCase();

  // Músicas de Duelo Versus: Sorteia aleatoriamente entre as 3 faixas oficiais do circuito
  const battleBgmKey = getAudio().getRandomVersusDuelKey();

  // 1. Cinemática Grandiosa 3D Pré-Duelo do Modo História
  if (window.gameInstance && typeof window.gameInstance.runGrandDuelCinematic === 'function') {
    await window.gameInstance.runGrandDuelCinematic(
      'ARENA VIRTUAL // CIRCUITO RANKED',
      currentMode === 'bot' ? 'SIMULADOR DE COMBATE IA' : 'DUELO COMPETITIVO PVP',
      `PILOTO [ ${playerName} ]`,
      `[ ${enemyName} ]`,
      battleBgmKey
    );
  }

  // 2. Inicia o combate na arena 2D
  engine.mode = currentMode;
  engine.startCombat();
  if (currentMode === 'bot' && typeof engine.botSelectTurnActions === 'function') {
    engine.botSelectTurnActions();
  }

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
  resetNarratorToStatus();
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
  } else if (type === 'defense') {
    if (titleEl) titleEl.textContent = 'ESCOLHA O ALIADO PARA O ESCUDO';
    if (subEl) {
      subEl.textContent = `[ CLIQUE NO ALIADO QUE RECEBERÁ O ESCUDO DE ${robot.name} ]`;
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
      } else if (type === 'support') {
        robot._chosenAllyTarget = chosenEntity;
        getAudio().playKeyClack();
        addLog(`[SUPORTE TRAVADO] ${robot.name} direcionará suporte para ${chosenEntity.name}.`, 'support');
      } else if (type === 'defense') {
        robot._chosenDefenseTarget = chosenEntity;
        getAudio().playKeyClack();
        addLog(`[ESCUDO DIRECIONADO] ${robot.name} concederá escudo para ${chosenEntity.name}.`, 'defense');
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

// SVGs de Símbolos Táticos Cibernéticos (Sem Emojis, Vetores Limpos)
const ATK_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5M19 5h-5M19 5v5"/><path d="M19 19L5 5M5 5h5M5 5v5"/></svg>`;
const DEF_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" fill="currentColor" fill-opacity="0.18"/><path d="M12 6v12M8 10l4-2 4 2"/></svg>`;
const SUP_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9" stroke-width="1.6" stroke-dasharray="3 2"/></svg>`;
const REST_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fill-opacity="0.25"/></svg>`;
const TARGET_ICON_SVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/></svg>`;
const INFO_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

function setNarratorInfo(title, desc, iconSvg = null, color = '#00ff88', modeTag = null) {
  const panel = $('terminalNarratorPanel');
  const iconFrame = $('narratorIconFrame');
  const titleEl = $('narratorPrimaryTitle');
  const descEl = $('narratorDetailDesc');
  const tagEl = $('versusNarratorTag');

  if (titleEl) {
    titleEl.textContent = title.startsWith('>') ? title : `> ${title}`;
    titleEl.style.color = color;
  }
  if (descEl) {
    descEl.textContent = desc;
  }
  if (iconFrame && iconSvg) {
    iconFrame.innerHTML = iconSvg;
    iconFrame.style.borderColor = color;
    iconFrame.style.color = color;
    iconFrame.style.boxShadow = `0 0 10px ${color}55`;
  }
  if (tagEl && modeTag) {
    tagEl.textContent = modeTag;
  }

  if (panel) {
    panel.classList.remove('pulse-highlight');
    void panel.offsetWidth;
    panel.classList.add('pulse-highlight');
  }
}

function resetNarratorToStatus() {
  const selBot = engine?.playerTeam?.find(r => r.id === selectedDeckRobotId);
  if (selBot && selBot.action && selBot.action !== 'rest') {
    if (selBot.action === 'attack') {
      const atk = selBot._chosenAttack || (selBot.attacks && selBot.attacks[0]);
      const target = selBot._chosenTarget || engine.enemyTeam.find(r => r.isAlive);
      setNarratorInfo(
        `${selBot.name} // ATAQUE PREPARADO: ${atk ? atk.name : 'OFENSIVA'}`,
        `Alvo: ${target ? target.name : 'Nenhum'}. Consome ${atk ? atk.energyCost || 1 : 1} EN. Passe o cursor nos símbolos para inspecionar.`,
        ATK_ICON_SVG,
        '#ff4455',
        '[ FASE DE COMANDO ]'
      );
      return;
    } else if (selBot.action === 'defense') {
      if (selBot.id === 'DB') {
        setNarratorInfo(
          `${selBot.name} // MURALHA COLETIVA (5 HP)`,
          'Dino-Byte concederá barreira de 5 HP sobre os 3 robôs aliados por 2 rounds (Requer sucesso na moeda).',
          DEF_ICON_SVG,
          '#00e5ff',
          '[ FASE DE COMANDO ]'
        );
      } else {
        const target = selBot._chosenDefenseTarget || selBot;
        setNarratorInfo(
          `${selBot.name} // ESCUDO INDIVIDUAL (10 HP)`,
          `Destinado a: ${target.name}. Efeito: ${selBot.defense?.desc || 'Barreira protetora.'}`,
          DEF_ICON_SVG,
          '#00e5ff',
          '[ FASE DE COMANDO ]'
        );
      }
      return;
    } else if (selBot.action === 'support') {
      const target = selBot._chosenAllyTarget || selBot;
      setNarratorInfo(
        `${selBot.name} // SUPORTE NANOMÉDICO`,
        `Destinado a: ${target.name}. Cura até 4 HP ou revive aliado caído com 10 HP cheio.`,
        SUP_ICON_SVG,
        '#00ff88',
        '[ FASE DE COMANDO ]'
      );
      return;
    }
  }

  setNarratorInfo(
    'SISTEMA TÁTICO ONLINE',
    'Passe o cursor sobre os símbolos dos robôs para telemetria completa. O combate é narrado em tempo real aqui.',
    INFO_ICON_SVG,
    '#00ff88',
    '[ FASE DE COMANDO ]'
  );
}

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

    // Badge visual minimalista de status do robô quando recolhido
    let badgeText = '[ DISPONÍVEL ]';
    let badgeStyle = 'background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1);';
    if (bot.action === 'attack') {
      badgeText = '[ ATK ]';
      badgeStyle = 'background: rgba(255,51,68,0.18); color: #ff4455; border: 1px solid #ff3344;';
    } else if (bot.action === 'defense') {
      badgeText = '[ DEF ]';
      badgeStyle = 'background: rgba(0,229,255,0.18); color: #00e5ff; border: 1px solid #00e5ff;';
    } else if (bot.action === 'support') {
      badgeText = '[ SUP ]';
      badgeStyle = 'background: rgba(0,255,136,0.18); color: #00ff88; border: 1px solid #00ff88;';
    } else if (bot.action === 'rest') {
      badgeText = '[ REST ]';
      badgeStyle = 'background: rgba(255,215,0,0.18); color: #ffd700; border: 1px solid #ffd700;';
    }

    // Botões de Ação 100% em Símbolos Vetoriais (Sem emojis, ícones grandes com custos)
    let buttonsHTML = '';
    if (!bot.isAlive) {
      buttonsHTML = `<div class="robot-cmd-fallen-msg">[ COMBATENTE CAÍDO — USE SUPORTE PARA REVIVER ]</div>`;
    } else {
      const canAtk = bot.currentEnergy >= 1;
      const supCost = bot.support?.energyCost || 2;
      const canSup = bot.currentEnergy >= supCost;

      const isAtkActive = bot.action === 'attack';
      const isDefActive = bot.action === 'defense';
      const isSupActive = bot.action === 'support';
      const isRestActive = bot.action === 'rest' || !bot.action;

      buttonsHTML = `
        <div class="robot-cmd-action-buttons">
          <button class="cmd-action-icon-btn atk ${isAtkActive ? 'selected' : ''} ${isAtkTaken || !canAtk ? 'locked-role' : ''}"
                  data-robot="${bot.id}" data-action="attack"
                  ${isAtkTaken || !canAtk ? 'disabled' : ''}
                  aria-label="Ataque">
            ${ATK_ICON_SVG}
            <span class="cmd-action-cost-pill">1 EN</span>
          </button>
          <button class="cmd-action-icon-btn def ${isDefActive ? 'selected' : ''} ${isDefTaken ? 'locked-role' : ''}"
                  data-robot="${bot.id}" data-action="defense"
                  ${isDefTaken ? 'disabled' : ''}
                  aria-label="Defesa">
            ${DEF_ICON_SVG}
            <span class="cmd-action-cost-pill">0 EN</span>
          </button>
          <button class="cmd-action-icon-btn sup ${isSupActive ? 'selected' : ''} ${isSupTaken || !canSup ? 'locked-role' : ''}"
                  data-robot="${bot.id}" data-action="support"
                  ${isSupTaken || !canSup ? 'disabled' : ''}
                  aria-label="Suporte">
            ${SUP_ICON_SVG}
            <span class="cmd-action-cost-pill">${supCost} EN</span>
          </button>
          <button class="cmd-action-icon-btn rst ${isRestActive ? 'selected' : ''}"
                  data-robot="${bot.id}" data-action="rest"
                  aria-label="Poupar Energia">
            ${REST_ICON_SVG}
            <span class="cmd-action-cost-pill">+1 EN</span>
          </button>
        </div>
      `;
    }

    // Subpainéis de Configuração Limpos e Visuais (Sem textos longos no card)
    let subpanelHTML = '';
    if (bot.isAlive) {
      if (action === 'attack') {
        const skillsHTML = (bot.attacks || []).map((atk, ai) => {
          const isChosen = (bot._chosenAttack?.name === atk.name) || (!bot._chosenAttack && ai === 0);
          const canAfford = bot.currentEnergy >= (atk.energyCost || 0);
          const roman = ai === 0 ? 'I' : ai === 1 ? 'II' : 'III';
          return `
            <div class="cmd-tier-chip ${isChosen ? 'active' : ''} ${!canAfford ? 'disabled' : ''}"
                 data-robot="${bot.id}" data-type="skill" data-index="${ai}"
                 data-name="${atk.name}" data-cost="${atk.energyCost || 0} EN" data-desc="${atk.desc || ''}">
              <span class="cmd-tier-num">[ ${roman} ]</span>
              <span class="cmd-tier-cost">${atk.energyCost > 0 ? `${atk.energyCost} EN` : '0 EN'}</span>
            </div>
          `;
        }).join('');

        const targetBot = bot._chosenTarget || engine.enemyTeam.find(r => r.isAlive) || engine.enemyTeam[0];
        subpanelHTML = `
          <div class="robot-cmd-subpanel">
            <div class="cmd-sub-row" style="justify-content:space-between;">
              <div class="cmd-tier-chips">${skillsHTML}</div>
              <button class="cmd-target-badge-btn" data-robot="${bot.id}" data-type="change-atk-target" title="Alterar alvo do ataque no tabuleiro">
                ${TARGET_ICON_SVG} <span>${targetBot ? targetBot.name : 'ALVO'}</span>
              </button>
            </div>
          </div>
        `;
      } else if (action === 'defense') {
        if (bot.id === 'DB') {
          subpanelHTML = `
            <div class="robot-cmd-subpanel defense-panel" style="flex-direction:row;align-items:center;justify-content:space-between;">
              <span class="cmd-panel-badge" style="color:#00e5ff;display:flex;align-items:center;gap:4px;">
                ${DEF_ICON_SVG} MURALHA 5 HP [TODOS]
              </span>
              <span style="font-size:0.65rem;color:rgba(255,255,255,0.7);">(2 ROUNDS)</span>
            </div>
          `;
        } else {
          const targetBot = bot._chosenDefenseTarget || bot;
          subpanelHTML = `
            <div class="robot-cmd-subpanel defense-panel" style="flex-direction:row;align-items:center;justify-content:space-between;">
              <span class="cmd-panel-badge" style="color:#00e5ff;display:flex;align-items:center;gap:4px;">
                ${DEF_ICON_SVG} ESCUDO 10 HP
              </span>
              <button class="cmd-target-badge-btn" data-robot="${bot.id}" data-type="change-def-target" title="Escolher aliado para receber o escudo">
                ${TARGET_ICON_SVG} <span>${targetBot ? targetBot.name : 'ALIADO'}</span>
              </button>
            </div>
          `;
        }
      } else if (action === 'support') {
        const allyTarget = bot._chosenAllyTarget || bot;
        subpanelHTML = `
          <div class="robot-cmd-subpanel" style="flex-direction:row;align-items:center;justify-content:space-between;border-color:rgba(0,255,136,0.3);color:#00ff88;">
            <span class="cmd-panel-badge" style="display:flex;align-items:center;gap:4px;">
              ${SUP_ICON_SVG} NANITES (${bot.support?.energyCost || 2} EN)
            </span>
            <button class="cmd-target-badge-btn" data-robot="${bot.id}" data-type="change-sup-target" style="border-color:rgba(0,255,136,0.35);color:#00ff88;" title="Escolher aliado para curar ou reviver">
              ${TARGET_ICON_SVG} <span>${allyTarget ? allyTarget.name : 'ALIADO'}</span>
            </button>
          </div>
        `;
      }
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
          <div class="cmd-atk-badge" style="font-size:0.75rem;font-weight:700;color:${bot.attackPower >= 20 ? '#ff1133' : '#ffd700'};margin-top:2px;">ATK: <strong>${bot.attackPower}</strong>/20 ${bot.attackPower >= 20 ? '[SOBRECARGA]' : ''}</div>
        </div>
      </div>
      <span class="cmd-collapsed-badge" style="${badgeStyle}">${badgeText}</span>

      ${buttonsHTML}
      ${subpanelHTML}
    `;

    // Ao clicar no card, ele se torna o card selecionado (recolhendo os outros)
    card.onclick = (e) => {
      if (e.target.closest('.cmd-action-icon-btn') || e.target.closest('.cmd-tier-chip') || e.target.closest('.cmd-target-badge-btn')) return;
      if (selectedDeckRobotId !== bot.id) {
        selectedDeckRobotId = bot.id;
        getAudio().playKeyClack();
        renderCommandCards();
        resetNarratorToStatus();
      }
    };

    stack.appendChild(card);
  });

  attachCommandCardListeners();
}

function attachCommandCardListeners() {
  const stack = $('versusRobotsCommandStack');
  if (!stack) return;

  // Botões de Função Principal em Símbolos (ATK, DEF, SUP, REST)
  stack.querySelectorAll('.cmd-action-icon-btn').forEach(btn => {
    const robotId = btn.dataset.robot;
    const action = btn.dataset.action;
    const robot = engine.playerTeam.find(r => r.id === robotId);

    // Efeito Hover para narrar detalhadamente na sessão ao lado do terminal
    btn.onmouseenter = () => {
      if (!robot) return;
      if (action === 'attack') {
        const canAtk = robot.currentEnergy >= 1;
        setNarratorInfo(
          `ATAQUE DE COMBATE (1 EN)`,
          `Dispara golpe de energia direto. ${!canAtk ? '[SEM ENERGIA SUFICIENTE] ' : ''}Requer sucesso na moeda e causa dano ampliado pelo ATK (${robot.attackPower} atual).`,
          ATK_ICON_SVG,
          '#ff4455',
          '[ TÁTICA // OFENSIVA ]'
        );
      } else if (action === 'defense') {
        if (robot.id === 'DB') {
          setNarratorInfo(
            `DEFESA: MURALHA DINO (5 HP COLETIVO)`,
            `Dino-Byte é o ÚNICO que protege os 3 robôs ao mesmo tempo. Concede 5 HP de escudo para todos por 2 rounds (Requer sucesso na moeda).`,
            DEF_ICON_SVG,
            '#00e5ff',
            '[ TÁTICA // DEFESA ]'
          );
        } else {
          setNarratorInfo(
            `DEFESA INDIVIDUAL (10 HP)`,
            `Concede 10 HP de escudo ao aliado selecionado. Efeito único: ${robot.defense?.desc || 'Barreira protetora.'}`,
            DEF_ICON_SVG,
            '#00e5ff',
            '[ TÁTICA // DEFESA ]'
          );
        }
      } else if (action === 'support') {
        const cost = robot.support?.energyCost || 2;
        const canSup = robot.currentEnergy >= cost;
        setNarratorInfo(
          `SUPORTE & NANITES (${cost} EN)`,
          `Distribui nanorrobôs médicos. ${!canSup ? '[SEM ENERGIA SUFICIENTE] ' : ''}Cura 4 HP de combatente ativo ou REVIVE combatente caído com 10 HP cheio.`,
          SUP_ICON_SVG,
          '#00ff88',
          '[ TÁTICA // SUPORTE ]'
        );
      } else if (action === 'rest') {
        setNarratorInfo(
          `POUPAR ENERGIA (+1 EN)`,
          `Combatente descansa durante este round para recarregar baterias (+1 ponto de Energia para turnos posteriores).`,
          REST_ICON_SVG,
          '#ffd700',
          '[ TÁTICA // RECARGA ]'
        );
      }
    };

    btn.onmouseleave = () => {
      resetNarratorToStatus();
    };

    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning) return;
      if (!robot || !robot.isAlive) return;

      // Se clicar no botão que já está ativo, DESMARCA a ação (limpa para poupar)
      if (robot.action === action) {
        robot.action = 'rest';
        robot._chosenTarget = null;
        robot._chosenAllyTarget = null;
        robot._chosenDefenseTarget = null;
        getAudio().playKeyClack();
        addLog(`[AÇÃO CANCELADA] ${robot.name} desmarcou sua ação.`, 'info');
        renderCommandCards();
        resetNarratorToStatus();
        return;
      }

      // Se clicar em POUPAR, limpa qualquer papel e guarda energia
      if (action === 'rest') {
        robot.action = 'rest';
        robot._chosenTarget = null;
        robot._chosenAllyTarget = null;
        robot._chosenDefenseTarget = null;
        getAudio().playKeyClack();
        renderCommandCards();
        resetNarratorToStatus();
        return;
      }

      // Desmarca a mesma função de outros robôs (cada função é 100% exclusiva)
      engine.playerTeam.forEach(r => {
        if (r.id !== robot.id && r.action === action) {
          r.action = 'rest';
          r._chosenTarget = null;
          r._chosenAllyTarget = null;
          r._chosenDefenseTarget = null;
        }
      });

      robot.action = action;
      getAudio().playPowerUp();

      if (action === 'attack') {
        const minCost = Math.min(...(robot.attacks || []).map(a => a.energyCost || 1));
        if (robot.currentEnergy < minCost) {
          getAudio().playAccessDenied();
          addLog(`[ENERGIA] ${robot.name} não possui energia suficiente para atacar (${robot.currentEnergy}/${minCost} EN)!`, 'miss');
          robot.action = 'rest';
          renderCommandCards();
          resetNarratorToStatus();
          return;
        }
        if (!robot._chosenAttack) robot._chosenAttack = robot.attacks[0];
        openTargetSelection(robot, 'attack');
      } else if (action === 'support') {
        const supCost = robot.support?.energyCost || 2;
        if (robot.currentEnergy < supCost) {
          getAudio().playAccessDenied();
          addLog(`[ENERGIA] ${robot.name} não possui energia suficiente para suporte (${robot.currentEnergy}/${supCost} EN)!`, 'miss');
          robot.action = 'rest';
          renderCommandCards();
          resetNarratorToStatus();
          return;
        }
        openTargetSelection(robot, 'support');
      } else if (action === 'defense') {
        if (robot.id !== 'DB') {
          openTargetSelection(robot, 'defense');
        } else {
          addLog(`[ESCUDO COLETIVO] Dino-Byte concederá Muralha de 5 HP sobre toda a equipe.`, 'defense');
        }
      }

      renderCommandCards();
      resetNarratorToStatus();
    };
  });

  // Botões de Trocar Alvo de Escudo
  stack.querySelectorAll('.cmd-target-badge-btn[data-type="change-def-target"]').forEach(btn => {
    const robotId = btn.dataset.robot;
    const robot = engine.playerTeam.find(r => r.id === robotId);
    btn.onmouseenter = () => {
      setNarratorInfo(
        `SELEÇÃO DE ALVO DO ESCUDO`,
        `Clique para abrir a seleção direta no tabuleiro e escolher o robô aliado que receberá a blindagem.`,
        DEF_ICON_SVG,
        '#00e5ff',
        '[ MIRA // ALIADO ]'
      );
    };
    btn.onmouseleave = () => resetNarratorToStatus();
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning) return;
      if (robot) openTargetSelection(robot, 'defense');
    };
  });

  // Botões de Trocar Alvo de Suporte
  stack.querySelectorAll('.cmd-target-badge-btn[data-type="change-sup-target"]').forEach(btn => {
    const robotId = btn.dataset.robot;
    const robot = engine.playerTeam.find(r => r.id === robotId);
    btn.onmouseenter = () => {
      setNarratorInfo(
        `SELEÇÃO DE ALVO DO SUPORTE`,
        `Clique para abrir a seleção direta no tabuleiro e escolher o aliado a curar (ou ressuscitar se estiver caído).`,
        SUP_ICON_SVG,
        '#00ff88',
        '[ MIRA // ALIADO ]'
      );
    };
    btn.onmouseleave = () => resetNarratorToStatus();
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning) return;
      if (robot) openTargetSelection(robot, 'support');
    };
  });

  // Botões de Trocar Alvo de Ataque
  stack.querySelectorAll('.cmd-target-badge-btn[data-type="change-atk-target"]').forEach(btn => {
    const robotId = btn.dataset.robot;
    const robot = engine.playerTeam.find(r => r.id === robotId);
    btn.onmouseenter = () => {
      setNarratorInfo(
        `SELEÇÃO DE ALVO DO ATAQUE`,
        `Clique para travar a mira diretamente em um robô adversário no tabuleiro tático.`,
        ATK_ICON_SVG,
        '#ff4455',
        '[ MIRA // INIMIGO ]'
      );
    };
    btn.onmouseleave = () => resetNarratorToStatus();
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning) return;
      if (robot) openTargetSelection(robot, 'attack');
    };
  });

  // Botões de Skill (Tier Chips)
  stack.querySelectorAll('.cmd-tier-chip[data-type="skill"]').forEach(btn => {
    const robotId = btn.dataset.robot;
    const atkIdx = parseInt(btn.dataset.index, 10);
    const robot = engine.playerTeam.find(r => r.id === robotId);
    const atk = robot?.attacks?.[atkIdx];

    btn.onmouseenter = () => {
      if (!atk) return;
      const percentLabel = atk.level === 1 ? '25%' : atk.level === 2 ? '50%' : '110%';
      setNarratorInfo(
        `GOLPE NÍVEL ${btn.dataset.index === '0' ? 'I' : btn.dataset.index === '1' ? 'II' : 'III'}: ${atk.name} (${atk.energyCost || 0} EN)`,
        `${atk.desc || 'Ataque balístico.'} Potência de impacto: ${percentLabel} do dano.`,
        ATK_ICON_SVG,
        '#ff4455',
        `[ GOLPE NÍVEL ${btn.dataset.index === '0' ? 'I' : btn.dataset.index === '1' ? 'II' : 'III'} ]`
      );
    };

    btn.onmouseleave = () => resetNarratorToStatus();

    btn.onclick = (e) => {
      e.stopPropagation();
      if (isClashRunning || btn.classList.contains('disabled')) return;
      if (!robot || !robot.attacks[atkIdx]) return;

      robot._chosenAttack = robot.attacks[atkIdx];
      getAudio().playKeyClack();
      renderCommandCards();
      resetNarratorToStatus();
    };
  });
}

function resetRoleAssignmentUI() {
  engine.playerTeam.forEach(bot => {
    bot.action = 'rest';
    bot._chosenAttack = null;
    bot._chosenTarget = null;
    bot._chosenAllyTarget = null;
    bot._chosenDefenseTarget = null;
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

  // IA do Oponente no Modo Treino: As ações e alvos já foram decididos antecipadamente no início do round!
  // Fallback de segurança apenas se as ações ainda não foram atribuídas
  if (currentMode === 'bot') {
    const hasPlanned = engine.enemyTeam.some(r => r.action && r.action !== 'rest');
    if (!hasPlanned && typeof engine.botSelectTurnActions === 'function') {
      engine.botSelectTurnActions();
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 1ª ETAPA — DEFESA: dá um passo à frente, faz minigame e volta se a moeda permitir
  // ──────────────────────────────────────────────────────────────────
  updateGuide('EMBATE // 1ª ETAPA: DEFESA', 'Passo à frente: protocolo de escudo holográfico.');
  setNarratorInfo('1ª ETAPA: DEFESA', 'Acionamento de barreiras e escudos de contenção holográficos.', DEF_ICON_SVG, '#00e5ff', '[ COMBATE // DEFESA ]');

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
    setNarratorInfo(`DEFESA // ${defBot.name}`, `${defBot.name} avança para acionar protocolo de escudo holográfico.`, DEF_ICON_SVG, '#00e5ff', '[ DEFESA ]');
    await board.animateRobotMove(defBot, stepCol, defBot.homeRow, 350);
    await delay(250);

    let defSuccess = false;
    if (isPlayer) {
      defSuccess = await minigames.runCoinFlip(defBot.color);
    } else {
      defSuccess = Math.random() < 0.5;
    }

    const defTarget = (defBot.id === 'DB') ? null : (defBot._chosenDefenseTarget || defBot);
    const events = engine.resolveDefense(defBot, defSuccess, defTarget);

    if (defSuccess) {
      const hexColor = parseInt((defBot.color || '#00ff88').replace('#', '0x'), 16);
      versus3DEngine.trigger3DDefenseDome(defBot.side, defBot.homeRow, hexColor);
      await board.animateDefenseSequence(defBot, defBot.defense?.name, defBot.defense?.shieldColor);
      if (isPlayer) getAudio().playCoinSound();

      for (const ev of events) {
        if (ev.type === 'defense_all') {
          addLog(`[ESCUDO COLETIVO] ${defBot.name} ergueu Muralha de 5 HP sobre toda a equipe (Dura 2 rounds)!`, 'defense');
          setNarratorInfo(`MURALHA COLETIVA: ${defBot.name}`, `Barreira de 5 HP erguida sobre os 3 robôs aliados por 2 rounds!`, DEF_ICON_SVG, '#00e5ff', '[ ESCUDO COLETIVO ]');
        } else if (ev.type === 'defense_single') {
          addLog(`[ESCUDO INDIVIDUAL] ${defBot.name} concedeu Escudo de ${ev.shieldHp} HP para ${ev.targetName}!`, 'defense');
          setNarratorInfo(`ESCUDO: ${ev.targetName}`, `${defBot.name} concedeu ${ev.shieldHp} HP de escudo para ${ev.targetName}!`, DEF_ICON_SVG, '#00e5ff', '[ ESCUDO INDIVIDUAL ]');
        } else if (ev.type === 'shield_energy_buff') {
          addLog(`[EFEITO ESCUDO] ${ev.targetName} recebeu +${ev.amount} Energia instantânea do Condensador Glacial!`, 'support');
          setNarratorInfo(`ENERGIA GLACIAL: ${ev.targetName}`, `+${ev.amount} Energia instantânea concedida pelo escudo!`, SUP_ICON_SVG, '#00ff88', '[ EFEITO ]');
        } else if (ev.type === 'shield_atk_buff') {
          addLog(`[EFEITO ESCUDO] ${ev.targetName} recebeu +${ev.amount} ATK de sobrecarga da Blindagem Dourada!`, 'attack');
          setNarratorInfo(`SOBRECARGA DOURADA: ${ev.targetName}`, `+${ev.amount} ATK amplificado pela Blindagem Dourada!`, ATK_ICON_SVG, '#ffd700', '[ EFEITO ]');
        } else if (ev.type === 'shield_regen_buff') {
          addLog(`[EFEITO ESCUDO] ${ev.targetName} ativou Nanites Regenerativos (+${ev.amount} HP por round durado)!`, 'support');
          setNarratorInfo(`NANITES REGENERATIVOS: ${ev.targetName}`, `+${ev.amount} HP regenerado a cada round de escudo!`, SUP_ICON_SVG, '#00ff88', '[ EFEITO ]');
        } else if (ev.type === 'shield_reflect_buff') {
          addLog(`[EFEITO ESCUDO] ${ev.targetName} ativou Espinhos Elétricos (reflete ${ev.amount} dano ao atacante)!`, 'miss');
          setNarratorInfo(`ESPINHOS ELÉTRICOS: ${ev.targetName}`, `Reflete ${ev.amount} de dano contra qualquer atacante!`, REST_ICON_SVG, '#ffd700', '[ EFEITO ]');
        }
      }
    } else {
      addLog(`[DEFESA] ${defBot.name} errou a moeda (sem escudo).`, 'miss');
      setNarratorInfo(`DEFESA FALHOU: ${defBot.name}`, `A moeda caiu incorreta. O escudo holográfico falhou em armar.`, DEF_ICON_SVG, '#ff4455', '[ DEFESA // FALHA ]');
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
  setNarratorInfo('2ª ETAPA: ATAQUES', 'Avanço frontal, alinhamento de mira e disparos balísticos.', ATK_ICON_SVG, '#ff4455', '[ COMBATE // ATAQUE ]');

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
    setNarratorInfo(`ATAQUE // ${attacker.name}`, `Avançando para desferir ataque em ${target ? target.name : 'alvo'}!`, ATK_ICON_SVG, '#ff4455', '[ COMBATE // ATAQUE ]');
    await board.animateRobotMove(attacker, stepCol, attacker.homeRow, 350);
    await delay(250);

    // Verifica se possui energia suficiente para o ataque escolhido
    const atkMove = attacker._chosenAttack || attacker.attacks[0];
    const energyCost = atkMove?.energyCost || 1;
    if (attacker.currentEnergy < energyCost) {
      addLog(`[ATAQUE] ${attacker.name} não possui energia suficiente (${attacker.currentEnergy}/${energyCost} EN)! Passa a vez sem atacar.`, 'miss');
      setNarratorInfo(`SEM ENERGIA: ${attacker.name}`, `Energia insuficiente para o disparo (${attacker.currentEnergy}/${energyCost} EN).`, ATK_ICON_SVG, '#ff4455', '[ SEM ENERGIA ]');
      const center = board._cellCenter(attacker.homeCol, attacker.homeRow);
      board.emitFloatingText('SEM ENERGIA', center.x, center.y - 30, '#ff4455', 14);
      if (isPlayer) getAudio().playAccessDenied();
      await delay(600);
      await board.animateRobotMove(attacker, attacker.homeCol, attacker.homeRow, 350);
      attacker.row = attacker.homeRow;
      attacker.col = attacker.homeCol;
      updateStatusPanel();
      updateArenaHUD();
      await delay(300);
      continue;
    }

    if (!target || !target.isAlive) {
      // Sem alvo
      const colorHex = attacker.color ? parseInt(attacker.color.replace('#', '0x'), 16) : 0xff3344;
      versus3DEngine.trigger3DAttackLaser(attacker.side, attacker.homeRow, attacker.homeRow, colorHex);
      await board.animateMissSequence(attacker, attacker.homeRow);
      addLog(`[ATAQUE] ${attacker.name} disparou na Linha ${attacker.homeRow}, mas NÃO HÁ ALVO! (0 de dano).`, 'miss');
      setNarratorInfo(`SEM ALVO VÁLIDO`, `${attacker.name} disparou contra setor vazio (0 de dano).`, ATK_ICON_SVG, '#ffd700', '[ ERRO DE MIRA ]');
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

      // REGRA DO USUÁRIO: Esperar o ataque ter contato para DAÍ mover a barra ou mostrar o que aconteceu!
      await board.animateAttackSequence(attacker, target, attacker._chosenAttack, async () => {
        // EXATO MOMENTO DO IMPACTO NO ALVO:
        const events = engine.resolveAttack(attacker, attacker._chosenAttack, minigameResult);
        getAudio().playHeavyImpact();

        const tCenter = board._cellCenter(target.col, target.row);
        const aCenter = board._cellCenter(attacker.col, attacker.row);

        for (const ev of events) {
          if (ev.type === 'shield_hit') {
            board.emitFloatingText(`ESCUDO: -${ev.absorbed}`, tCenter.x, tCenter.y - 30, '#00e5ff', 15);
            addLog(`[ESCUDO] Escudo de ${target.name} absorveu ${ev.absorbed} de dano! (${ev.remaining} restantes)`, 'defense');
            setNarratorInfo(`ESCUDO ABSORVEU (-${ev.absorbed})`, `Escudo de ${target.name} absorveu o impacto! (${ev.remaining} HP restantes)`, DEF_ICON_SVG, '#00e5ff', '[ ESCUDO ]');
          } else if (ev.type === 'shield_break') {
            await board.animateShieldBreak(target);
            addLog(`[ESCUDO QUEBRADO] Escudo de ${target.name} QUEBROU!`, 'miss');
            setNarratorInfo(`ESCUDO QUEBRADO!`, `A barreira defensiva de ${target.name} estilhaçou!`, DEF_ICON_SVG, '#ff4455', '[ QUEBRA DE ESCUDO ]');
          } else if (ev.type === 'damage') {
            board.emitFloatingText(`-${ev.damage} HP`, tCenter.x, tCenter.y - 45, '#ff3344', 20);
            addLog(`[ATAQUE] ${attacker.name} atingiu ${target.name}! -${ev.damage} HP (Restante: ${ev.hp})`, 'attack');
            setNarratorInfo(`IMPACTO DIRETO (-${ev.damage} HP)`, `${attacker.name} atingiu ${target.name}! (HP restante: ${ev.hp})`, ATK_ICON_SVG, '#ff4455', '[ IMPACTO ]');
          } else if (ev.type === 'shield_reflect') {
            board.emitFloatingText(`REFLEXÃO: -${ev.damage} HP`, aCenter.x, aCenter.y - 30, '#ff8c00', 16);
            board.emitParticles(aCenter.x, aCenter.y, '#ff8c00', 25, { speed: 5 });
            addLog(`[CONTRA-ATAQUE ELÉTRICO] Escudo de ${target.name} refletiu ${ev.damage} de dano em ${attacker.name}!`, 'miss');
            setNarratorInfo(`CONTRA-ATAQUE ELÉTRICO`, `Escudo refletiu ${ev.damage} de dano de volta em ${attacker.name}!`, REST_ICON_SVG, '#ffd700', '[ REFLEXÃO ]');
          } else if (ev.type === 'robot_down') {
            addLog(`[DESTRUIÇÃO] ${ev.targetName || target.name} TOMBOU em combate!`, 'kill');
            getAudio().playPowerUp();
            setNarratorInfo(`COMBATENTE TOMBOU!`, `${ev.targetName || target.name} foi destruído em combate!`, INFO_ICON_SVG, '#ffd700', '[ ABATE ]');
          } else if (ev.type === 'kill_reward') {
            addLog(`[MEDALHA] ${attacker.name} conquistou +1 MEDALHA (+2 HP, +1 Energia)!`, 'kill');
            setNarratorInfo(`MEDALHA DE HONRA`, `${attacker.name} recebeu medalha militar (+2 HP, +1 EN)!`, INFO_ICON_SVG, '#ffd700', '[ RECOMPENSA ]');
          }
        }

        // A barra de HP e os painéis de status se movem agora no exato contato:
        updateStatusPanel();
        updateArenaHUD();
      });

      // Delay deliberado pós-ataque para exibição clara do resultado
      await delay(900);
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
  setNarratorInfo('3ª ETAPA: SUPORTE', 'Protocolos médicos e nanites de reparo celular.', SUP_ICON_SVG, '#00ff88', '[ COMBATE // SUPORTE ]');

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
      setNarratorInfo(`SEM ENERGIA: ${supporter.name}`, `Energia insuficiente para suporte (${supporter.currentEnergy}/${energyCost} EN).`, SUP_ICON_SVG, '#ff4455', '[ SEM ENERGIA ]');
      const center = board._cellCenter(supporter.homeCol, supporter.homeRow);
      board.emitFloatingText('SEM ENERGIA', center.x, center.y - 30, '#ff4455', 14);
      if (isPlayer) getAudio().playAccessDenied();
      await delay(600); // tempo mínimo obrigatório
      continue;
    }

    // Vai para a frente
    const supStepCol = isPlayer ? 1 : 3;
    addLog(`[SUPORTE] ${supporter.name} avança e canaliza suporte (${energyCost} EN)!`, 'support');
    setNarratorInfo(`SUPORTE // ${supporter.name}`, `Avançando para canalizar nanites de suporte (${energyCost} EN)!`, SUP_ICON_SVG, '#00ff88', '[ SUPORTE ]');
    await board.animateRobotMove(supporter, supStepCol, supporter.homeRow, 350);
    await delay(250);

    // Usa a habilidade que custa energia
    versus3DEngine.trigger3DSupportHelix(supporter.side, supporter.homeRow);

    // O alvo de suporte foi decidido antecipadamente na fase de comando (não altera no meio do combate)
    const target = supporter._chosenAllyTarget
      || (isPlayer ? supporter : (s.team.find(r => r.isAlive && r.currentHp < r.maxHp) || supporter));

    const events = engine.resolveSupport(supporter, target);
    for (const ev of events) {
      if (ev.type === 'revive') {
        await board.animateRevive(target);
        addLog(`[RESSURREIÇÃO] ${target.name} foi REVIVIDO com 10 HP pelo Suporte!`, 'kill');
        setNarratorInfo(`RESSURREIÇÃO: ${target.name}`, `${target.name} reativado em combate com 10 HP pleno!`, SUP_ICON_SVG, '#00ff88', '[ RESSURREIÇÃO ]');
        getAudio().playPowerUp();
      } else if (ev.type === 'support_heal') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] ${target.name} curou +${ev.amount} HP (HP: ${ev.hp})`, 'support');
        setNarratorInfo(`REPARO: ${target.name}`, `+${ev.amount} HP restaurado pelo suporte de ${supporter.name}!`, SUP_ICON_SVG, '#00ff88', '[ CURA ]');
        getAudio().playHealSound();
      } else if (ev.type === 'support_hot') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] ${target.name} recebeu Regeneração contínua!`, 'support');
        setNarratorInfo(`REGENERAÇÃO NANITE`, `Regeneração contínua aplicada em ${target.name}!`, SUP_ICON_SVG, '#00ff88', '[ REGENERAÇÃO ]');
      } else if (ev.type === 'support_heal_all') {
        await board.animateSupportSequence(supporter, target, ev.amount, 0);
        addLog(`[SUPORTE] Pulso de reparo ativado (+${ev.amount} HP para todos)!`, 'support');
        setNarratorInfo(`PULSO DE CURA GLOBAL`, `+${ev.amount} HP distribuído para todos os robôs da equipe!`, SUP_ICON_SVG, '#00ff88', '[ CURA GLOBAL ]');
        getAudio().playHealSound();
      } else if (ev.type === 'support_heal_energy') {
        await board.animateSupportSequence(supporter, target, ev.heal, ev.energy);
        addLog(`[SUPORTE] ${target.name} restaurou +${ev.heal} HP e +${ev.energy} Energia!`, 'support');
        setNarratorInfo(`RECARGA & REPARO`, `${target.name} restaurou +${ev.heal} HP e +${ev.energy} Energia!`, SUP_ICON_SVG, '#00ff88', '[ SUPORTE ]');
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

  // Loga os robôs que receberam sobrecarga de ataque (+1 por round até 20)
  if (buffedRobots && buffedRobots.length > 0) {
    buffedRobots.forEach(b => {
      const sideName = b.bot.side === 'PLAYER' ? 'ALIADO' : 'INIMIGO';
      addLog(`[SOBRECARGA // ${sideName}] ${b.bot.name}: Ataque aumentou +${b.diff} (${b.oldAtk} -> ${b.newAtk}/20)!`, 'info');
    });
  }

  // Verifica sobrecarga máxima de 20 para ativar o Alerta de Emergência
  if (engine.isAttackOverloaded) {
    addLog(`[ALERTA DE EMERGÊNCIA] Sistemas de ataque em SOBRECARGA MÁXIMA (20)!`, 'miss');
    getAudio().playHeavyImpact();
  }

  updateArenaHUD();
  updateStatusPanel();
  resetRoleAssignmentUI();

  // No modo bot, planeja e trava as decisões do bot para o próximo round antes do jogador agir
  if (currentMode === 'bot' && typeof engine.botSelectTurnActions === 'function') {
    engine.botSelectTurnActions();
  }

  // O menu volta no próximo round em todos os rounds!
  $('versusLeftDeck')?.classList.remove('minimized');
  renderCommandCards();
  resetNarratorToStatus();

  updateGuide(`ROUND ${engine.round} // FASE DE COMANDO`, 'Defina ataques, defesas, suportes ou poupe energia.');
  showPhaseBanner(`ROUND ${engine.round}`, 'FASE DE COMANDO // DEFINA SUAS AÇÕES', 'normal', 1400);
  addLog(`--- INÍCIO DO ROUND ${engine.round} ---`, 'info');
}

function checkMatchEnded() {
  const playerAlive = engine.playerTeam.some(r => r.isAlive && r.currentHp > 0);
  const enemyAlive  = engine.enemyTeam.some(r => r.isAlive && r.currentHp > 0);

  // REGRA DO USUÁRIO: Se todos os robôs morrerem de uma vez, as medalhas desempatam!
  if (!playerAlive && !enemyAlive) {
    const winner = engine.medals.PLAYER >= engine.medals.ENEMY ? 'PLAYER' : 'ENEMY';
    endMatch(winner);
    return true;
  }

  // REGRA DO USUÁRIO: Vitória na hora pra quem matou os 3 robôs adversários!
  if (!enemyAlive) {
    endMatch('PLAYER');
    return true;
  }
  if (!playerAlive) {
    endMatch('ENEMY');
    return true;
  }

  // Desempate ou vitória por limite de medalhas
  if (engine.medals.PLAYER >= engine.winCondition && engine.medals.PLAYER > engine.medals.ENEMY) {
    endMatch('PLAYER');
    return true;
  }
  if (engine.medals.ENEMY >= engine.winCondition && engine.medals.ENEMY > engine.medals.PLAYER) {
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

  // Alerta de Emergência: Ativado quando qualquer robô atinge 10 de ataque
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
  if (pPanel) {
    pPanel.innerHTML = '';
    engine.playerTeam.forEach(bot => {
      const pct = Math.max(0, Math.min(100, Math.floor((bot.currentHp / bot.maxHp) * 100)));
      const shieldInfo = bot.shield ? ` [ESCUDO: ${bot.shield.roundsLeft || 2}R]` : '';
      const atkColor = bot.attackPower >= 20 ? '#ff1133' : '#ffd700';
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

  const ePanel = $('versusEnemyStatus');
  if (ePanel) {
    ePanel.innerHTML = '';
    engine.enemyTeam.forEach(bot => {
      const pct = Math.max(0, Math.min(100, Math.floor((bot.currentHp / bot.maxHp) * 100)));
      const shieldInfo = bot.shield ? ` [ESCUDO: ${bot.shield.roundsLeft || 2}R]` : '';
      const atkColor = bot.attackPower >= 20 ? '#ff1133' : '#ffd700';
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
      ePanel.appendChild(row);
    });
  }
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
  let mmrInfo = null;

  try {
    const currentNick = account?.nickname || account?.name;
    if (currentNick) {
      if (currentMode === 'ranked') {
        const alivePlayerBots = (engine.playerTeam || []).filter(r => r.isAlive).length;
        const res = await AccountAPI.saveMatchResult({
          winnerNick: playerWon ? currentNick : (engine.enemyName || 'OPONENTE'),
          loserNick: playerWon ? (engine.enemyName || 'OPONENTE') : currentNick,
          winnerSurvivors: playerWon ? alivePlayerBots : 0,
          winnerMaxHp: 30,
          loserSurvivors: playerWon ? 0 : alivePlayerBots,
          loserMaxHp: 30,
          totalRounds: engine.round
        });

        if (playerWon && res.winner) {
          account = { ...account, ...res.winner };
          mmrInfo = { delta: `+${res.pointsGained || 20}`, rp: account.rankingPoints };
        } else if (!playerWon && res.loser) {
          account = { ...account, ...res.loser };
          mmrInfo = { delta: `-${res.pointsLost || 15}`, rp: account.rankingPoints };
        }
        updateProfileHeader(account);
      } else {
        // Modo Treino (sem perda de RP)
        await AccountAPI.saveResult(currentNick, playerWon, engine.medals.PLAYER);
      }
    }
  } catch (e) {
    console.warn('[Versus] Erro ao registrar resultado da partida:', e);
  }

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
      <div>Modo: ${currentMode === 'bot' ? 'TREINAMENTO // IA' : 'COMPETITIVO // SALAS ONLINE'}</div>
      ${mmrInfo ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.2);">
          Pontuação de Ranking: <strong style="color: ${playerWon ? '#00ff88' : '#ff3344'};">${mmrInfo.delta} RP</strong> 
          (Saldo Atual: <strong style="color: #ffd700;">${mmrInfo.rp} RP</strong>)
        </div>
      ` : ''}
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
  showScreen('versusModeSelectScreen');
  updateProfileHeader(account);
  getAudio().playBGM('versusLobby', 600);
});

// Botão de Pulso de Câmera na Batida da Música (Arena Versus)
$('versusBeatPulseToggle')?.addEventListener('click', () => {
  const audio = getAudio();
  if (audio && audio.beatPulseManager) {
    audio.beatPulseManager.cycleIntensity();
  }
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
