// ═══════════════════════════════════════════════════════════════════
// versus-network.js — WebSocket Client + API REST de Contas
// ═══════════════════════════════════════════════════════════════════

const WS_URL = `ws://${location.hostname}:3334`;
const API_BASE = '/api';

// ── REST: Account API ────────────────────────────────────────────────
export const AccountAPI = {
  async fetch(name) {
    const res = await fetch(`${API_BASE}/accounts/${encodeURIComponent(name.toUpperCase())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Conta não encontrada');
    }
    return res.json();
  },

  async login(nickname, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha ao autenticar piloto');
    return data;
  },

  async register(nickname, password, googleEmail = null, googleLinked = false) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password, googleEmail, googleLinked }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha ao cadastrar piloto');
    return data;
  },

  async googleAuth(googleEmail, nickname = null) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleEmail, nickname }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha na autenticação Google');
    return data;
  },

  async updateProfile(nickname, profileData) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, ...profileData }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar perfil');
    return data;
  },

  async saveMatchResult(resultData) {
    const res = await fetch(`${API_BASE}/accounts/match-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Falha ao registrar resultado de combate');
    return data;
  },

  async saveResult(name, won, medals) {
    const res = await fetch(`${API_BASE}/accounts/${encodeURIComponent(name.toUpperCase())}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ won, medals }),
    });
    if (!res.ok) throw new Error('Falha ao salvar resultado');
    return data;
  },

  async leaderboard() {
    const res = await fetch(`${API_BASE}/leaderboard`);
    return res.json();
  },
};

// ═══════════════════════════════════════════════════════════════════
// VersusNetwork — WebSocket client para matchmaking + sync de turno
// ═══════════════════════════════════════════════════════════════════
export class VersusNetwork extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.status = 'disconnected'; // disconnected | connecting | idle | queued | draft | combat
    this.name = null;
    this.clientId = null;
    this.matchId = null;
    this.side = null;       // 'A' | 'B'
    this.enemyName = null;

    this._pingInterval = null;
    this._reconnectTimer = null;
    this._manualClose = false;
  }

  // ── Connect ─────────────────────────────────────────────────────
  connect(name) {
    this.name = name.toUpperCase().slice(0, 16);
    this._manualClose = false;
    this.status = 'connecting';
    this._emit('status', { status: 'connecting' });

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (e) {
      this._emit('error', { msg: 'Não foi possível conectar ao servidor WebSocket' });
      return;
    }

    this.ws.onopen = () => {
      this.status = 'idle';
      this._emit('status', { status: 'idle' });
      this._send({ type: 'identify', name: this.name });
      this._startPing();
    };

    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._handle(msg);
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (!this._manualClose) {
        this.status = 'disconnected';
        this._emit('status', { status: 'disconnected' });
        // Auto reconnect after 3s
        this._reconnectTimer = setTimeout(() => this.connect(this.name), 3000);
      }
    };

    this.ws.onerror = () => {
      this._emit('error', { msg: 'Erro de conexão WebSocket' });
    };
  }

  disconnect() {
    this._manualClose = true;
    this._stopPing();
    clearTimeout(this._reconnectTimer);
    if (this.ws) this.ws.close();
    this.status = 'disconnected';
    this.matchId = null;
    this.side = null;
  }

  // ── Queue ────────────────────────────────────────────────────────
  joinQueue(rankingPoints = 100) {
    if (this.status !== 'idle') return;
    this._send({ type: 'join_queue', name: this.name, rankingPoints: Number(rankingPoints) || 100 });
    this.status = 'queued';
    this._emit('status', { status: 'queued' });
  }

  leaveQueue() {
    this._send({ type: 'leave_queue' });
    this.status = 'idle';
    this._emit('status', { status: 'idle' });
    this._emit('queue_left', {});
  }

  // ── Salas Fechadas por Código ────────────────────────────────────
  createRoom() {
    this._send({ type: 'create_room' });
  }

  joinRoom(roomCode, autoReady = true) {
    this._send({ type: 'join_room', roomCode, autoReady });
  }

  setRoomReady() {
    this._send({ type: 'room_ready' });
  }

  leaveRoom() {
    this._send({ type: 'leave_room' });
  }

  // ── Draft ────────────────────────────────────────────────────────
  confirmDraft(team) {
    this._send({ type: 'draft_ready', matchId: this.matchId, team });
    this.status = 'draft_ready';
    this._emit('status', { status: 'draft_ready' });
  }

  // ── Turn ─────────────────────────────────────────────────────────
  submitTurn(actions) {
    this._send({ type: 'submit_turn', matchId: this.matchId, actions });
  }

  // ── Medal / End ──────────────────────────────────────────────────
  reportMedalUpdate(side, medals) {
    this._send({ type: 'medal_update', matchId: this.matchId, side, medals });
  }

  reportMatchEnd(winner) {
    this._send({ type: 'match_end', matchId: this.matchId, winner });
  }

  // ── Message Handler ──────────────────────────────────────────────
  _handle(msg) {
    switch (msg.type) {
      case 'identified':
        this.clientId = msg.clientId;
        break;

      case 'queued':
        this._emit('queued', { position: msg.position, rankingPoints: msg.rankingPoints });
        break;

      case 'queue_left':
        this.status = 'idle';
        this._emit('queue_left', {});
        break;

      case 'room_created':
        this._emit('room_created', { roomCode: msg.roomCode, isHost: true });
        break;

      case 'room_joined':
        this._emit('room_joined', {
          roomCode: msg.roomCode,
          isHost: msg.isHost,
          opponentName: msg.opponentName,
          opponentPoints: msg.opponentPoints,
          hostReady: msg.hostReady,
          guestReady: msg.guestReady,
          status: msg.status,
          msg: msg.msg
        });
        break;

      case 'opponent_room_ready':
        this._emit('opponent_room_ready', { role: msg.role });
        break;

      case 'self_room_ready':
        this._emit('self_room_ready', { role: msg.role });
        break;

      case 'opponent_left_room':
        this._emit('opponent_left_room', { msg: msg.msg });
        break;

      case 'room_left':
        this._emit('room_left', {});
        break;

      case 'room_error':
        this._emit('room_error', { msg: msg.msg });
        break;

      case 'match_found':
        this.matchId = msg.matchId;
        this.side = msg.side;
        this.enemyName = msg.enemyName;
        this.status = 'draft';
        this._emit('match_found', { matchId: msg.matchId, side: msg.side, enemyName: msg.enemyName });
        break;

      case 'opponent_draft_ready':
        this._emit('opponent_draft_ready', { enemyTeam: msg.enemyTeam });
        break;

      case 'waiting_opponent_draft':
        this._emit('waiting_opponent_draft', {});
        break;

      case 'combat_start':
        this.status = 'combat';
        this._emit('combat_start', {
          yourTeam: msg.yourTeam,
          enemyTeam: msg.enemyTeam,
          firstTurn: msg.firstTurn,
        });
        break;

      case 'opponent_turn':
        this._emit('opponent_turn', { actions: msg.actions, round: msg.round });
        break;

      case 'turn_received':
        this._emit('turn_received', { round: msg.round });
        break;

      case 'round_complete':
        this._emit('round_complete', { round: msg.round });
        break;

      case 'medals':
        this._emit('medals', { medals: msg.medals });
        break;

      case 'match_over':
        this.status = 'idle';
        this.matchId = null;
        this.side = null;
        this._emit('match_over', { winner: msg.winner });
        break;

      case 'opponent_disconnected':
        this._emit('opponent_disconnected', {});
        this.status = 'idle';
        this.matchId = null;
        break;

      case 'pong':
        break; // heartbeat OK

      case 'error':
        this._emit('error', { msg: msg.msg });
        break;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  _emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  _startPing() {
    this._pingInterval = setInterval(() => {
      this._send({ type: 'ping' });
    }, 25000);
  }

  _stopPing() {
    clearInterval(this._pingInterval);
  }

  get isConnected() { return this.ws?.readyState === WebSocket.OPEN; }
}
