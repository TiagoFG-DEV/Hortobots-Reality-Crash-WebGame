// ═══════════════════════════════════════════════════════════════════
// server.js — Servidor + WebSocket Multiplayer + API de Contas JSON
// ═══════════════════════════════════════════════════════════════════
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;
const WS_PORT = process.env.WS_PORT || 3334;

// ── JSON body parser ────────────────────────────────────────────────
app.use(express.json());

// ── Static files ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Servir /audio tanto de public/audio quanto de public/css/sounds
const publicAudio = path.join(__dirname, 'public', 'audio');
const soundsBase = path.join(__dirname, 'public', 'css', 'sounds');

app.use('/audio', express.static(publicAudio));
app.use('/audio', express.static(path.join(soundsBase, 'BACKGROUND MUSIC')));
app.use('/audio', express.static(path.join(soundsBase, 'THEMES')));
app.use('/audio', express.static(path.join(soundsBase, 'SOUND EFFECTS')));
app.use('/sounds', express.static(soundsBase));

const refsPath = fs.existsSync(path.join(__dirname, 'refs'))
  ? path.join(__dirname, 'refs')
  : path.join(__dirname, '..', 'refs');

if (fs.existsSync(path.join(refsPath, 'audio'))) {
  app.use('/audio', express.static(path.join(refsPath, 'audio')));
}
app.use('/refs',    express.static(refsPath));
app.use('/images',  express.static(path.join(refsPath, 'images')));
app.use('/sprites', express.static(path.join(refsPath, 'projects_and_3d', 'IVYL 4500', 'IVYL 4500', 'Ivyl3000', 'Sprites')));

// ════════════════════════════════════════════════════════════════════
// ACCOUNTS — JSON persistence
// ════════════════════════════════════════════════════════════════════
const ACCOUNTS_FILE = path.join(__dirname, 'data', 'accounts.json');

function readAccounts() {
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAccounts(data) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ════════════════════════════════════════════════════════════════════
// ACCOUNTS & AUTH — JSON persistence (data/accounts.json)
// ════════════════════════════════════════════════════════════════════
function sanitizeNick(raw) {
  return (raw || '').trim().replace(/[^a-zA-Z0-9_]/g, '').toUpperCase().slice(0, 16);
}

// POST /api/auth/register — Cadastro de Conta
app.post('/api/auth/register', (req, res) => {
  const { nickname, password, googleEmail, googleLinked } = req.body;
  const cleanNick = sanitizeNick(nickname);
  if (!cleanNick || cleanNick.length < 2) {
    return res.status(400).json({ error: 'Nome de usuário inválido (mínimo 2 caracteres alfanuméricos).' });
  }

  const accounts = readAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  if (existingKey) {
    return res.status(409).json({ error: 'Esse NickName já está em uso por outro piloto.' });
  }

  const newAccount = {
    name: cleanNick,
    password: password ? String(password) : '',
    googleLinked: !!googleLinked,
    googleEmail: googleEmail ? String(googleEmail).trim().toLowerCase() : '',
    rankingPoints: 100, // Pontuação inicial padrão
    wins: 0,
    losses: 0,
    totalMatches: 0,
    totalMedals: 0,
    customBio: 'Piloto Cadastrado no Sistema Mnemosyne',
    avatarBadge: 'quezas',
    createdAt: Date.now(),
    lastSeen: Date.now()
  };

  accounts[cleanNick] = newAccount;
  writeAccounts(accounts);
  res.status(201).json(newAccount);
});

// POST /api/auth/login — Login com Nickname e Senha
app.post('/api/auth/login', (req, res) => {
  const { nickname, password } = req.body;
  const cleanNick = sanitizeNick(nickname);
  if (!cleanNick) {
    return res.status(400).json({ error: 'Informe o NickName de piloto.' });
  }

  const accounts = readAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  if (!existingKey) {
    return res.status(404).json({ error: 'Piloto não encontrado. Crie sua conta abaixo.' });
  }

  const acc = accounts[existingKey];
  // Se a conta tem senha cadastrada, valida
  if (acc.password && acc.password.length > 0 && String(acc.password) !== String(password || '')) {
    return res.status(401).json({ error: 'Senha incorreta para este piloto.' });
  }

  acc.lastSeen = Date.now();
  if (acc.rankingPoints === undefined) acc.rankingPoints = 100;
  writeAccounts(accounts);
  res.json(acc);
});

// POST /api/auth/google — Login / Vínculo com Conta Google
app.post('/api/auth/google', (req, res) => {
  const { googleEmail, googleName, desiredNick } = req.body;
  const cleanEmail = (googleEmail || '').trim().toLowerCase();
  if (!cleanEmail) {
    return res.status(400).json({ error: 'E-mail Google não informado.' });
  }

  const accounts = readAccounts();
  // 1. Procura se alguma conta já está vinculada a esse email Google
  const linkedKey = Object.keys(accounts).find(k => accounts[k].googleEmail === cleanEmail);
  if (linkedKey) {
    const acc = accounts[linkedKey];
    acc.lastSeen = Date.now();
    if (acc.rankingPoints === undefined) acc.rankingPoints = 100;
    writeAccounts(accounts);
    return res.json({ account: acc, isNew: false, message: `Login com Google realizado para ${acc.name}!` });
  }

  // 2. Se não estiver vinculado, cria uma nova conta vinculando automaticamente ao Google
  let candidateNick = sanitizeNick(desiredNick || googleName || cleanEmail.split('@')[0]);
  if (!candidateNick || candidateNick.length < 2) candidateNick = `PILOT_${Date.now().toString().slice(-4)}`;

  let finalNick = candidateNick;
  let counter = 1;
  while (Object.keys(accounts).some(k => k.toUpperCase() === finalNick)) {
    finalNick = `${candidateNick.slice(0, 12)}_${counter++}`;
  }

  const newAcc = {
    name: finalNick,
    password: '',
    googleLinked: true,
    googleEmail: cleanEmail,
    rankingPoints: 100,
    wins: 0,
    losses: 0,
    totalMatches: 0,
    totalMedals: 0,
    customBio: `Piloto vinculado via Google (${cleanEmail})`,
    avatarBadge: 'quezas',
    createdAt: Date.now(),
    lastSeen: Date.now()
  };

  accounts[finalNick] = newAcc;
  writeAccounts(accounts);
  res.status(201).json({ account: newAcc, isNew: true, message: `Conta criada e vinculada ao Google: ${finalNick}!` });
});

// PUT /api/auth/profile — Editar Perfil
app.put('/api/auth/profile', (req, res) => {
  const { nickname, customBio, avatarBadge, newPassword } = req.body;
  const cleanNick = sanitizeNick(nickname);
  const accounts = readAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  if (!existingKey) {
    return res.status(404).json({ error: 'Conta não encontrada.' });
  }

  const acc = accounts[existingKey];
  if (customBio !== undefined) acc.customBio = String(customBio).slice(0, 80);
  if (avatarBadge) acc.avatarBadge = String(avatarBadge).slice(0, 20);
  if (newPassword) acc.password = String(newPassword);
  acc.lastSeen = Date.now();

  writeAccounts(accounts);
  res.json(acc);
});

// POST /api/accounts/match-result — Salvar resultado e atualizar Ranking
app.post('/api/accounts/match-result', (req, res) => {
  const { winnerName, loserName, hpPercentRemaining = 50, turns = 3, medals = 10 } = req.body;
  const accounts = readAccounts();

  const wKey = winnerName ? Object.keys(accounts).find(k => k.toUpperCase() === sanitizeNick(winnerName)) : null;
  const lKey = loserName ? Object.keys(accounts).find(k => k.toUpperCase() === sanitizeNick(loserName)) : null;

  let pointsGained = 0;
  let pointsLost = 0;

  // Atualização do Vencedor (ganha até +30 pontos de ranking)
  if (wKey && accounts[wKey]) {
    const w = accounts[wKey];
    w.wins = (w.wins || 0) + 1;
    w.totalMatches = (w.totalMatches || 0) + 1;
    w.totalMedals = (w.totalMedals || 0) + (medals || 10);
    // Pontuação condizente com performance: base 18 + até 12 proporcional ao HP restante = até 30
    pointsGained = Math.min(30, Math.max(15, Math.round(18 + (Math.min(100, Math.max(0, hpPercentRemaining)) / 100) * 12)));
    w.rankingPoints = Math.max(0, (w.rankingPoints ?? 100) + pointsGained);
    w.lastSeen = Date.now();
  }

  // Atualização do Perdedor (perde até -20 pontos de ranking, mínimo ZERO)
  if (lKey && accounts[lKey]) {
    const l = accounts[lKey];
    l.losses = (l.losses || 0) + 1;
    l.totalMatches = (l.totalMatches || 0) + 1;
    // Perda entre 10 e 20 pontos
    pointsLost = Math.min(20, Math.max(10, Math.round(16 - (turns > 4 ? 3 : 0))));
    l.rankingPoints = Math.max(0, (l.rankingPoints ?? 100) - pointsLost); // MÍNIMO 0
    l.lastSeen = Date.now();
  }

  writeAccounts(accounts);
  res.json({
    winner: wKey ? accounts[wKey] : null,
    loser: lKey ? accounts[lKey] : null,
    pointsGained,
    pointsLost
  });
});

// GET /api/accounts/:name — busca dados da conta (compatibilidade)
app.get('/api/accounts/:name', (req, res) => {
  const name = sanitizeNick(req.params.name);
  if (!name) return res.status(400).json({ error: 'Invalid name' });

  const accounts = readAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === name);
  if (existingKey) {
    const acc = accounts[existingKey];
    if (acc.rankingPoints === undefined) acc.rankingPoints = 100;
    return res.json(acc);
  }

  res.status(404).json({ error: 'Conta não encontrada' });
});

// GET /api/leaderboard — ranking ordenado por Ranking Points (RP) e vitórias
app.get('/api/leaderboard', (req, res) => {
  const accounts = readAccounts();
  const sorted = Object.values(accounts)
    .sort((a, b) => ((b.rankingPoints ?? 100) - (a.rankingPoints ?? 100)) || (b.wins - a.wins))
    .slice(0, 15);
  res.json(sorted);
});

// ════════════════════════════════════════════════════════════════════
// MODO HISTÓRIA — Persistência em Arquivo .JSON (story_save.json)
// ════════════════════════════════════════════════════════════════════
const STORY_SAVE_FILE = path.join(__dirname, 'data', 'story_save.json');

// GET /api/story-save — Retorna a partida salva em JSON
app.get('/api/story-save', (req, res) => {
  try {
    if (fs.existsSync(STORY_SAVE_FILE)) {
      const raw = fs.readFileSync(STORY_SAVE_FILE, 'utf8');
      return res.json(JSON.parse(raw));
    }
    res.json({ saved: false });
  } catch (e) {
    res.json({ saved: false, error: e.message });
  }
});

// POST /api/story-save — Salva o estado da partida em arquivo .json
app.post('/api/story-save', (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Payload de salvamento inválido' });
    }
    data.savedAt = Date.now();
    data.saved = true;
    fs.writeFileSync(STORY_SAVE_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ ok: true, savedAt: data.savedAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SPA Fallback ─────────────────────────────────────────────────────
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER — Multiplayer Matchmaking
// ════════════════════════════════════════════════════════════════════
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

// ── State ─────────────────────────────────────────────────────────
/** @type {Map<string, {ws, name, team, matchId, side}>} */
const clients = new Map();

/** Fila de jogadores esperando um match */
const matchQueue = [];

/** Partidas ativas: matchId → {playerA, playerB, state} */
const activeMatches = new Map();

/** Salas privadas fechadas: roomCode → { code, host, guest, ready: { host: false, guest: false } } */
const activeRooms = new Map();

let matchCounter = 0;

// ── Helpers ──────────────────────────────────────────────────────
function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(matchId, obj, excludeWs = null) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  [match.playerA, match.playerB].forEach(p => {
    if (p && p.ws !== excludeWs) send(p.ws, obj);
  });
}

function generateMatchId() {
  return `match_${++matchCounter}_${Date.now()}`;
}

// ── Matchmaking ──────────────────────────────────────────────────
function tryMatchmake() {
  if (matchQueue.length < 2) return;

  const now = Date.now();

  // Filtra clientes desconectados
  for (let i = matchQueue.length - 1; i >= 0; i--) {
    if (!matchQueue[i].client || !matchQueue[i].client.ws || matchQueue[i].client.ws.readyState !== 1) {
      matchQueue.splice(i, 1);
    }
  }

  // Ordena por tempo de espera (quem aguarda há mais tempo é priorizado)
  matchQueue.sort((a, b) => a.queuedAt - b.queuedAt);

  for (let i = 0; i < matchQueue.length; i++) {
    const p1 = matchQueue[i];
    const waitedSec1 = (now - p1.queuedAt) / 1000;
    // Janela adaptativa: 50 base + 30 a cada 3s. A partir de 12s, aceita qualquer oponente disponível.
    const window1 = waitedSec1 >= 12 ? Infinity : 50 + Math.floor(waitedSec1 / 3) * 30;

    let bestCandidateIdx = -1;
    let minDiff = Infinity;

    for (let j = i + 1; j < matchQueue.length; j++) {
      const p2 = matchQueue[j];
      const waitedSec2 = (now - p2.queuedAt) / 1000;
      const window2 = waitedSec2 >= 12 ? Infinity : 50 + Math.floor(waitedSec2 / 3) * 30;
      const maxAllowedDiff = Math.max(window1, window2);

      const diff = Math.abs(p1.rankingPoints - p2.rankingPoints);

      if (diff <= maxAllowedDiff && diff < minDiff) {
        minDiff = diff;
        bestCandidateIdx = j;
      }
    }

    if (bestCandidateIdx !== -1) {
      const p2 = matchQueue[bestCandidateIdx];

      // Remove ambos da fila
      matchQueue.splice(bestCandidateIdx, 1);
      matchQueue.splice(i, 1);

      const a = p1.client;
      const b = p2.client;

      const matchId = generateMatchId();
      const state = {
        matchId,
        playerA: a,
        playerB: b,
        round: 1,
        medals: { A: 0, B: 0 },
        phase: 'draft',
        draftReady: { A: false, B: false },
        turnActions: { A: null, B: null },
        turnReady: { A: false, B: false },
      };

      a.matchId = matchId;
      a.side = 'A';
      b.matchId = matchId;
      b.side = 'B';

      activeMatches.set(matchId, state);

      send(a.ws, {
        type: 'match_found',
        matchId,
        side: 'A',
        enemyName: b.name,
        enemyPoints: b.rankingPoints
      });
      send(b.ws, {
        type: 'match_found',
        matchId,
        side: 'B',
        enemyName: a.name,
        enemyPoints: a.rankingPoints
      });

      console.log(`[MATCH] Pareamento ranqueado: ${a.name} (${p1.rankingPoints} RP) vs ${b.name} (${p2.rankingPoints} RP) [Diff: ${minDiff}] — ${matchId}`);
      i--; // Reajusta índice após a remoção
    }
  }
}

// Tick periódico de 1 segundo para expandir a janela de MMR para jogadores em espera
setInterval(() => {
  if (matchQueue.length >= 2) {
    tryMatchmake();
  }
}, 1000);

// ── Connection Handler ────────────────────────────────────────────
wss.on('connection', (ws) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const client = { ws, id: clientId, name: null, matchId: null, side: null, team: null };
  clients.set(clientId, client);

  console.log(`[WS] Connected: ${clientId}`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      // ── IDENTIFY ──────────────────────────────────────────────
      case 'identify': {
        client.name = sanitizeNick(msg.name || 'ANON');
        client.rankingPoints = Number(msg.rankingPoints) || 100;
        client.avatarBadge = msg.avatarBadge || 'quezas';
        send(ws, { type: 'identified', name: client.name, clientId, rankingPoints: client.rankingPoints });
        break;
      }

      // ── CRIAR SALA FECHADA (POR CÓDIGO) ──────────────────────
      case 'create_room': {
        const roomCode = `HORT-${Math.floor(100 + Math.random() * 900)}`;
        const room = {
          code: roomCode,
          host: client,
          guest: null,
          ready: { host: false, guest: false }
        };
        activeRooms.set(roomCode, room);
        client.roomCode = roomCode;
        client.isHost = true;
        send(ws, { type: 'room_created', roomCode, isHost: true });
        console.log(`[ROOM] Sala criada: ${roomCode} por ${client.name}`);
        break;
      }

      // ── ENTRAR EM SALA POR CÓDIGO (CLIQUE EM DUELAR) ────────
      case 'join_room': {
        const targetCode = (msg.roomCode || '').trim().toUpperCase();
        const room = activeRooms.get(targetCode);
        if (!room) {
          send(ws, { type: 'room_error', msg: 'Codigo não encontrado' });
          break;
        }
        if (room.guest && room.guest.id !== clientId) {
          send(ws, { type: 'room_error', msg: 'Esta sala já está lotada (2/2 jogadores).' });
          break;
        }

        room.guest = client;
        client.roomCode = targetCode;
        client.isHost = false;

        // Se clicou em DUELAR com autoReady
        if (msg.autoReady) {
          room.ready.guest = true;
        }

        console.log(`[ROOM] ${client.name} entrou na sala ${targetCode} de ${room.host.name} (AutoReady: ${!!msg.autoReady})`);

        // Se o anfitrião já estiver PRONTO e o convidado clicou em DUELAR:
        if (room.ready.host && room.ready.guest) {
          const matchId = generateMatchId();
          const state = {
            matchId,
            playerA: room.host,
            playerB: room.guest,
            round: 1,
            medals: { A: 0, B: 0 },
            phase: 'draft',
            draftReady: { A: false, B: false },
            turnActions: { A: null, B: null },
            turnReady: { A: false, B: false },
          };

          room.host.matchId = matchId;
          room.host.side = 'A';
          room.guest.matchId = matchId;
          room.guest.side = 'B';

          activeMatches.set(matchId, state);

          send(room.host.ws, {
            type: 'match_found',
            matchId,
            side: 'A',
            enemyName: room.guest.name,
            enemyPoints: room.guest.rankingPoints || 100,
            roomCode: room.code
          });
          send(room.guest.ws, {
            type: 'match_found',
            matchId,
            side: 'B',
            enemyName: room.host.name,
            enemyPoints: room.host.rankingPoints || 100,
            roomCode: room.code
          });

          activeRooms.delete(room.code);
          console.log(`[MATCH] Duelo iniciado imediatamente da sala ${room.code}: ${room.host.name} vs ${room.guest.name}`);
          break;
        }

        // Se o anfitrião NÃO está pronto: exibe ESPERANDO POR DUELISTA
        send(room.host.ws, {
          type: 'room_joined',
          roomCode: targetCode,
          isHost: true,
          opponentName: client.name || 'OPONENTE',
          opponentPoints: client.rankingPoints || 100,
          guestReady: !!room.ready.guest
        });

        send(client.ws, {
          type: 'room_joined',
          roomCode: targetCode,
          isHost: false,
          opponentName: room.host.name || 'ANFITRIÃO',
          opponentPoints: room.host.rankingPoints || 100,
          hostReady: !!room.ready.host,
          status: 'waiting_host',
          msg: 'ESPERANDO POR DUELISTA'
        });
        break;
      }

      // ── CONFIRMAR PRONTIDÃO NA SALA ─────────────────────────
      case 'room_ready': {
        const room = activeRooms.get(client.roomCode);
        if (!room) {
          send(ws, { type: 'room_error', msg: 'Sala não localizada.' });
          break;
        }
        const role = client.isHost ? 'host' : 'guest';
        room.ready[role] = true;

        const opponent = client.isHost ? room.guest : room.host;
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_room_ready', role });
        }
        send(client.ws, { type: 'self_room_ready', role });

        // Quando ambos confirmam PRONTO (ou host confirma com guest já aguardando), inicia a partida
        if (room.host && room.guest && room.ready.host && room.ready.guest) {
          const matchId = generateMatchId();
          const state = {
            matchId,
            playerA: room.host,
            playerB: room.guest,
            round: 1,
            medals: { A: 0, B: 0 },
            phase: 'draft',
            draftReady: { A: false, B: false },
            turnActions: { A: null, B: null },
            turnReady: { A: false, B: false },
          };

          room.host.matchId = matchId;
          room.host.side = 'A';
          room.guest.matchId = matchId;
          room.guest.side = 'B';

          activeMatches.set(matchId, state);

          send(room.host.ws, {
            type: 'match_found',
            matchId,
            side: 'A',
            enemyName: room.guest.name,
            enemyPoints: room.guest.rankingPoints || 100,
            roomCode: room.code
          });
          send(room.guest.ws, {
            type: 'match_found',
            matchId,
            side: 'B',
            enemyName: room.host.name,
            enemyPoints: room.host.rankingPoints || 100,
            roomCode: room.code
          });

          activeRooms.delete(room.code);
          console.log(`[MATCH] Batalha iniciada da sala ${room.code}: ${room.host.name} vs ${room.guest.name}`);
        }
        break;
      }

      // ── SAIR DA SALA ─────────────────────────────────────────
      case 'leave_room': {
        if (client.roomCode) {
          const room = activeRooms.get(client.roomCode);
          if (room) {
            const other = client.isHost ? room.guest : room.host;
            if (other && other.ws) {
              send(other.ws, {
                type: 'opponent_left_room',
                msg: client.isHost ? 'O anfitrião encerrou a sala.' : 'O oponente saiu da sala.'
              });
            }
            activeRooms.delete(client.roomCode);
          }
          client.roomCode = null;
          client.isHost = false;
        }
        send(ws, { type: 'room_left' });
        break;
      }

      // ── JOIN QUEUE (BUSCAR DUELO!) ───────────────────────────
      case 'join_queue': {
        const alreadyInQueue = matchQueue.some(item => item.client.id === clientId);
        if (alreadyInQueue || client.matchId) {
          send(ws, { type: 'error', msg: 'Você já está na fila ou em partida.' });
          break;
        }

        client.name = (msg.name || client.name || 'ANON').toUpperCase().slice(0, 16);
        client.team = msg.team || [];
        client.rankingPoints = Number(msg.rankingPoints) || client.rankingPoints || 100;

        const queueItem = {
          client,
          queuedAt: Date.now(),
          rankingPoints: client.rankingPoints
        };

        matchQueue.push(queueItem);

        send(ws, {
          type: 'queued',
          position: matchQueue.length,
          rankingPoints: client.rankingPoints
        });
        console.log(`[QUEUE] ${client.name} (${client.rankingPoints} RP) entrou na fila. Tamanho: ${matchQueue.length}`);
        tryMatchmake();
        break;
      }

      // ── LEAVE QUEUE ───────────────────────────────────────────
      case 'leave_queue': {
        const idx = matchQueue.findIndex(item => item.client.id === clientId);
        if (idx >= 0) matchQueue.splice(idx, 1);
        send(ws, { type: 'queue_left' });
        console.log(`[QUEUE] ${client.name} cancelou a busca. Restantes: ${matchQueue.length}`);
        break;
      }

      // ── DRAFT READY (team confirmed) ──────────────────────────
      case 'draft_ready': {
        const { matchId, team } = msg;
        const match = activeMatches.get(matchId);
        if (!match) break;

        client.team = team;
        const side = client.side;
        match.draftReady[side] = true;
        match[`player${side}`].team = team;

        // Notify opponent that this player is ready
        const opponent = side === 'A' ? match.playerB : match.playerA;
        send(opponent.ws, { type: 'opponent_draft_ready', enemyTeam: team });

        // If both ready → start combat
        if (match.draftReady.A && match.draftReady.B) {
          match.phase = 'combat';
          send(match.playerA.ws, {
            type: 'combat_start',
            yourTeam: match.playerA.team,
            enemyTeam: match.playerB.team,
            firstTurn: 'A',
          });
          send(match.playerB.ws, {
            type: 'combat_start',
            yourTeam: match.playerB.team,
            enemyTeam: match.playerA.team,
            firstTurn: 'A',
          });
          console.log(`[COMBAT] Match ${matchId} started!`);
        } else {
          // Notify self to wait
          send(ws, { type: 'waiting_opponent_draft' });
        }
        break;
      }

      // ── SUBMIT TURN ───────────────────────────────────────────
      case 'submit_turn': {
        const { matchId, actions } = msg;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'combat') break;

        const side = client.side;
        match.turnActions[side] = actions;
        match.turnReady[side] = true;

        // Forward actions to opponent immediately
        const opponent = side === 'A' ? match.playerB : match.playerA;
        if (opponent) {
          send(opponent.ws, {
            type: 'opponent_turn',
            actions,
            round: match.round,
          });
        }

        send(ws, { type: 'turn_received', round: match.round });

        // If both submitted → advance round
        if (match.turnReady.A && match.turnReady.B) {
          match.round++;
          match.turnReady = { A: false, B: false };
          match.turnActions = { A: null, B: null };
          broadcast(matchId, { type: 'round_complete', round: match.round });
        }
        break;
      }

      // ── MEDAL UPDATE ──────────────────────────────────────────
      case 'medal_update': {
        const { matchId, side, medals } = msg;
        const match = activeMatches.get(matchId);
        if (!match) break;
        match.medals[side] = medals;
        broadcast(matchId, { type: 'medals', medals: match.medals }, ws);
        break;
      }

      // ── MATCH END ─────────────────────────────────────────────
      case 'match_end': {
        const { matchId, winner } = msg;
        const match = activeMatches.get(matchId);
        if (!match) break;

        broadcast(matchId, { type: 'match_over', winner });
        activeMatches.delete(matchId);
        client.matchId = null;
        client.side = null;

        // Update opponent's client too
        const opp = winner === 'A' ? match.playerB : match.playerA;
        if (opp) { opp.matchId = null; opp.side = null; }

        console.log(`[END] Match ${matchId} won by ${winner}`);
        break;
      }

      // ── PING ──────────────────────────────────────────────────
      case 'ping': {
        send(ws, { type: 'pong', ts: Date.now() });
        break;
      }
    }
  });

  ws.on('close', () => {
    // Se estava em sala fechada, avisa o outro e remove a sala
    if (client.roomCode) {
      const room = activeRooms.get(client.roomCode);
      if (room) {
        const other = client.isHost ? room.guest : room.host;
        if (other && other.ws) {
          send(other.ws, {
            type: 'opponent_left_room',
            msg: client.isHost ? 'O anfitrião encerrou a sala.' : 'O oponente desconectou.'
          });
        }
        activeRooms.delete(client.roomCode);
      }
    }

    // Remove da fila de matchmaking
    const idx = matchQueue.findIndex(item => item.client.id === clientId);
    if (idx >= 0) matchQueue.splice(idx, 1);

    // Notify match opponent
    if (client.matchId) {
      const match = activeMatches.get(client.matchId);
      if (match) {
        broadcast(client.matchId, { type: 'opponent_disconnected' }, ws);
        activeMatches.delete(client.matchId);
      }
    }

    clients.delete(clientId);
    console.log(`[WS] Disconnected: ${clientId} (${client.name || 'unidentified'})`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error ${clientId}:`, err.message);
  });
});

// ── Start servers ─────────────────────────────────────────────────
const expressServer = app.listen(PORT, () => {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(` [HORTOBOTS] HTTP  → http://localhost:${PORT}`);
  console.log(`${'═'.repeat(55)}\n`);
});

expressServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[AVISO] A porta HTTP ${PORT} já está sendo usada por outra instância.`);
  } else {
    console.error('[HTTP] Erro:', err.message);
  }
});

httpServer.listen(WS_PORT, () => {
  console.log(`${'═'.repeat(55)}`);
  console.log(` [HORTOBOTS] WS    → ws://localhost:${WS_PORT}`);
  console.log(` [HORTOBOTS] Contas → data/accounts.json`);
  console.log(`${'═'.repeat(55)}\n`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[AVISO] A porta WebSocket ${WS_PORT} já está em uso por outro processo.`);
  } else {
    console.error('[WS] Erro:', err.message);
  }
});
