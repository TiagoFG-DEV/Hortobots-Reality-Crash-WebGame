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

// GET /api/accounts/:name — fetch or create
app.get('/api/accounts/:name', (req, res) => {
  const name = req.params.name.trim().toUpperCase().slice(0, 16);
  if (!name) return res.status(400).json({ error: 'Invalid name' });

  const accounts = readAccounts();
  if (!accounts[name]) {
    accounts[name] = {
      name,
      wins: 0,
      losses: 0,
      totalMedals: 0,
      totalMatches: 0,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };
    writeAccounts(accounts);
  } else {
    accounts[name].lastSeen = Date.now();
    writeAccounts(accounts);
  }
  res.json(accounts[name]);
});

// POST /api/accounts/:name/result — save match result
app.post('/api/accounts/:name/result', (req, res) => {
  const name = req.params.name.trim().toUpperCase().slice(0, 16);
  const { won, medals } = req.body;

  const accounts = readAccounts();
  if (!accounts[name]) return res.status(404).json({ error: 'Account not found' });

  if (won) accounts[name].wins++;
  else accounts[name].losses++;
  accounts[name].totalMatches++;
  accounts[name].totalMedals = (accounts[name].totalMedals || 0) + (medals || 0);
  accounts[name].lastSeen = Date.now();

  writeAccounts(accounts);
  res.json(accounts[name]);
});

// GET /api/leaderboard — top 10 by wins
app.get('/api/leaderboard', (req, res) => {
  const accounts = readAccounts();
  const sorted = Object.values(accounts)
    .sort((a, b) => (b.wins - a.wins) || (b.totalMedals - a.totalMedals))
    .slice(0, 10);
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
  while (matchQueue.length >= 2) {
    const a = matchQueue.shift();
    const b = matchQueue.shift();

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

    // Notify both players
    send(a.ws, {
      type: 'match_found',
      matchId,
      side: 'A',
      enemyName: b.name,
    });
    send(b.ws, {
      type: 'match_found',
      matchId,
      side: 'B',
      enemyName: a.name,
    });

    console.log(`[MATCH] ${a.name} vs ${b.name} — ${matchId}`);
  }
}

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
        client.name = (msg.name || 'ANON').toUpperCase().slice(0, 16);
        send(ws, { type: 'identified', name: client.name, clientId });
        break;
      }

      // ── JOIN QUEUE ────────────────────────────────────────────
      case 'join_queue': {
        // Ensure not already in queue or match
        const alreadyInQueue = matchQueue.some(c => c.id === clientId);
        if (alreadyInQueue || client.matchId) {
          send(ws, { type: 'error', msg: 'Already in queue or match' });
          break;
        }

        client.name = (msg.name || client.name || 'ANON').toUpperCase().slice(0, 16);
        client.team = msg.team || [];
        matchQueue.push(client);

        send(ws, { type: 'queued', position: matchQueue.length });
        console.log(`[QUEUE] ${client.name} joined. Queue size: ${matchQueue.length}`);
        tryMatchmake();
        break;
      }

      // ── LEAVE QUEUE ───────────────────────────────────────────
      case 'leave_queue': {
        const idx = matchQueue.findIndex(c => c.id === clientId);
        if (idx >= 0) matchQueue.splice(idx, 1);
        send(ws, { type: 'queue_left' });
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
    // Remove from queue
    const idx = matchQueue.findIndex(c => c.id === clientId);
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
