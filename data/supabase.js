// data/supabase.js — Integração Oficial Supabase PostgreSQL para Hortobots
// Gerencia persistência em nuvem permanente (gratuita e eterna) com fallback para JSON local
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:1Q2W3E4R5T6Y7U8I9O0Pa!!@db.rxfdjwdfinhqdwllzmcc.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});


let isSupabaseConnected = false;

// Helpers Locais de Fallback
function readLocalAccounts() {
  try {
    const raw = fs.readFileSync(LOCAL_ACCOUNTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeLocalAccounts(data) {
  try {
    fs.writeFileSync(LOCAL_ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[LOCAL_STORAGE] Erro ao gravar local:', err.message);
  }
}

// Inicialização de Tabelas e Índices
export async function initSupabase() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          name VARCHAR(32) PRIMARY KEY,
          password TEXT DEFAULT '',
          email TEXT DEFAULT '',
          google_linked BOOLEAN DEFAULT false,
          google_email TEXT DEFAULT '',
          ranking_points INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          total_matches INTEGER DEFAULT 0,
          total_medals INTEGER DEFAULT 0,
          custom_bio TEXT DEFAULT 'Piloto Cadastrado no Sistema Mnemosyne',
          avatar_badge VARCHAR(32) DEFAULT 'quezas',
          created_at BIGINT,
          last_seen BIGINT
        );
        CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
        CREATE INDEX IF NOT EXISTS idx_accounts_google_email ON accounts(google_email);
        CREATE INDEX IF NOT EXISTS idx_accounts_ranking ON accounts(ranking_points DESC);
      `);
      isSupabaseConnected = true;
      console.log('\n[SUPABASE] 🚀 Banco de dados PostgreSQL Conectado com Sucesso!');
      console.log('[SUPABASE] 🛡️  Persistência em Nuvem Permanente Ativa (Projeto rxfdjwdfinhqdwllzmcc)\n');
    } finally {
      client.release();
    }
  } catch (err) {
    isSupabaseConnected = false;
    console.warn('\n[SUPABASE] Aviso: Não foi possível conectar ao PostgreSQL. Operando com fallback local JSON:', err.message, '\n');
  }
}

function mapRowToAccount(row) {
  if (!row) return null;
  return {
    name: row.name,
    nickname: row.name,
    password: row.password || '',
    email: row.email || '',
    googleLinked: !!row.google_linked,
    googleEmail: row.google_email || '',
    rankingPoints: Number(row.ranking_points) || 0,
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
    totalMatches: Number(row.total_matches) || 0,
    totalMedals: Number(row.total_medals) || 0,
    customBio: row.custom_bio || 'Piloto Cadastrado no Sistema Mnemosyne',
    avatarBadge: row.avatar_badge || 'quezas',
    createdAt: Number(row.created_at) || Date.now(),
    lastSeen: Number(row.last_seen) || Date.now()
  };
}

// ── Funções de Consulta e Gravação ───────────────────────────────────

export async function getAccount(name) {
  const cleanNick = (name || '').trim().toUpperCase();
  if (!cleanNick) return null;

  if (isSupabaseConnected) {
    try {
      const res = await pool.query('SELECT * FROM accounts WHERE UPPER(name) = $1 LIMIT 1', [cleanNick]);
      if (res.rows.length > 0) return mapRowToAccount(res.rows[0]);
    } catch (err) {
      console.error('[SUPABASE] Erro getAccount:', err.message);
    }
  }

  // Fallback local
  const accounts = readLocalAccounts();
  const key = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  return key ? accounts[key] : null;
}

export async function getAccountByEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  if (isSupabaseConnected) {
    try {
      const res = await pool.query('SELECT * FROM accounts WHERE LOWER(email) = $1 OR LOWER(google_email) = $1 LIMIT 1', [cleanEmail]);
      if (res.rows.length > 0) return mapRowToAccount(res.rows[0]);
    } catch (err) {
      console.error('[SUPABASE] Erro getAccountByEmail:', err.message);
    }
  }

  // Fallback local
  const accounts = readLocalAccounts();
  const key = Object.keys(accounts).find(k => accounts[k].email === cleanEmail || accounts[k].googleEmail === cleanEmail);
  return key ? accounts[key] : null;
}

export async function createAccount(data) {
  const cleanNick = (data.name || data.nickname || '').trim().toUpperCase();
  const now = Date.now();
  const cleanEmail = (data.email || data.googleEmail || '').trim().toLowerCase();

  if (isSupabaseConnected) {
    try {
      const query = `
        INSERT INTO accounts (
          name, password, email, google_linked, google_email,
          ranking_points, wins, losses, total_matches, total_medals,
          custom_bio, avatar_badge, created_at, last_seen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const values = [
        cleanNick,
        data.password || '',
        cleanEmail,
        !!data.googleLinked,
        data.googleLinked ? cleanEmail : '',
        0, // Inicia em 0 RP
        0,
        0,
        0,
        0,
        data.customBio || 'Piloto Cadastrado no Sistema Mnemosyne',
        data.avatarBadge || 'quezas',
        now,
        now
      ];
      const res = await pool.query(query, values);
      const acc = mapRowToAccount(res.rows[0]);

      // Sincroniza cópia local
      const local = readLocalAccounts();
      local[cleanNick] = acc;
      writeLocalAccounts(local);

      return acc;
    } catch (err) {
      console.error('[SUPABASE] Erro createAccount:', err.message);
    }
  }

  // Fallback local
  const local = readLocalAccounts();
  const acc = {
    name: cleanNick,
    nickname: cleanNick,
    password: data.password || '',
    email: cleanEmail,
    googleLinked: !!data.googleLinked,
    googleEmail: data.googleLinked ? cleanEmail : '',
    rankingPoints: 0,
    wins: 0,
    losses: 0,
    totalMatches: 0,
    totalMedals: 0,
    customBio: data.customBio || 'Piloto Cadastrado no Sistema Mnemosyne',
    avatarBadge: data.avatarBadge || 'quezas',
    createdAt: now,
    lastSeen: now
  };
  local[cleanNick] = acc;
  writeLocalAccounts(local);
  return acc;
}

export async function updateAccount(name, updates) {
  const cleanNick = (name || '').trim().toUpperCase();
  const now = Date.now();

  if (isSupabaseConnected) {
    try {
      const current = await getAccount(cleanNick);
      if (!current) return null;

      const newPass = updates.password !== undefined ? updates.password : current.password;
      const newBio = updates.customBio !== undefined ? updates.customBio : current.customBio;
      const newBadge = updates.avatarBadge !== undefined ? updates.avatarBadge : current.avatarBadge;

      const query = `
        UPDATE accounts
        SET password = $1, custom_bio = $2, avatar_badge = $3, last_seen = $4
        WHERE UPPER(name) = $5
        RETURNING *;
      `;
      const res = await pool.query(query, [newPass, newBio, newBadge, now, cleanNick]);
      if (res.rows.length > 0) {
        const acc = mapRowToAccount(res.rows[0]);
        const local = readLocalAccounts();
        local[cleanNick] = acc;
        writeLocalAccounts(local);
        return acc;
      }
    } catch (err) {
      console.error('[SUPABASE] Erro updateAccount:', err.message);
    }
  }

  // Fallback local
  const local = readLocalAccounts();
  const existingKey = Object.keys(local).find(k => k.toUpperCase() === cleanNick);
  if (existingKey) {
    const acc = local[existingKey];
    if (updates.customBio !== undefined) acc.customBio = updates.customBio;
    if (updates.avatarBadge !== undefined) acc.avatarBadge = updates.avatarBadge;
    if (updates.password !== undefined) acc.password = updates.password;
    acc.lastSeen = now;
    writeLocalAccounts(local);
    return acc;
  }
  return null;
}

export async function saveMatchResult(winnerName, loserName, hpPercentRemaining = 50, turns = 3, medals = 10) {
  let pointsGained = 0;
  let pointsLost = 0;

  // Atualiza vencedor
  if (winnerName) {
    const w = await getAccount(winnerName);
    if (w) {
      pointsGained = Math.min(30, Math.max(15, Math.round(18 + (Math.min(100, Math.max(0, hpPercentRemaining)) / 100) * 12)));
      const newRp = Math.min(999, Math.max(0, (w.rankingPoints ?? 0) + pointsGained));
      const newWins = (w.wins || 0) + 1;
      const newMatches = (w.totalMatches || 0) + 1;
      const newMedals = (w.totalMedals || 0) + (medals || 10);

      if (isSupabaseConnected) {
        try {
          await pool.query(`
            UPDATE accounts
            SET wins = $1, total_matches = $2, total_medals = $3, ranking_points = $4, last_seen = $5
            WHERE UPPER(name) = UPPER($6)
          `, [newWins, newMatches, newMedals, newRp, Date.now(), w.name]);
        } catch (err) {
          console.error('[SUPABASE] Erro ao salvar vencedor:', err.message);
        }
      }

      // Fallback local
      const local = readLocalAccounts();
      if (local[w.name]) {
        local[w.name].wins = newWins;
        local[w.name].totalMatches = newMatches;
        local[w.name].totalMedals = newMedals;
        local[w.name].rankingPoints = newRp;
        local[w.name].lastSeen = Date.now();
        writeLocalAccounts(local);
      }
    }
  }

  // Atualiza perdedor
  if (loserName) {
    const l = await getAccount(loserName);
    if (l) {
      pointsLost = Math.min(20, Math.max(10, Math.round(16 - (turns > 4 ? 3 : 0))));
      const newRp = Math.min(999, Math.max(0, (l.rankingPoints ?? 0) - pointsLost));
      const newLosses = (l.losses || 0) + 1;
      const newMatches = (l.totalMatches || 0) + 1;

      if (isSupabaseConnected) {
        try {
          await pool.query(`
            UPDATE accounts
            SET losses = $1, total_matches = $2, ranking_points = $3, last_seen = $4
            WHERE UPPER(name) = UPPER($5)
          `, [newLosses, newMatches, newRp, Date.now(), l.name]);
        } catch (err) {
          console.error('[SUPABASE] Erro ao salvar perdedor:', err.message);
        }
      }

      // Fallback local
      const local = readLocalAccounts();
      if (local[l.name]) {
        local[l.name].losses = newLosses;
        local[l.name].totalMatches = newMatches;
        local[l.name].rankingPoints = newRp;
        local[l.name].lastSeen = Date.now();
        writeLocalAccounts(local);
      }
    }
  }

  return { pointsGained, pointsLost };
}

export async function applyDraftPenalty(name) {
  const acc = await getAccount(name);
  if (!acc) return;
  const newRp = Math.min(999, Math.max(0, (acc.rankingPoints ?? 0) - 10));

  if (isSupabaseConnected) {
    try {
      await pool.query('UPDATE accounts SET ranking_points = $1, last_seen = $2 WHERE UPPER(name) = UPPER($3)', [newRp, Date.now(), acc.name]);
    } catch (err) {
      console.error('[SUPABASE] Erro penalty:', err.message);
    }
  }

  const local = readLocalAccounts();
  if (local[acc.name]) {
    local[acc.name].rankingPoints = newRp;
    local[acc.name].lastSeen = Date.now();
    writeLocalAccounts(local);
  }
}

export async function getLeaderboard(limit = 15) {
  if (isSupabaseConnected) {
    try {
      const res = await pool.query('SELECT * FROM accounts ORDER BY ranking_points DESC, wins DESC LIMIT $1', [limit]);
      return res.rows.map(mapRowToAccount);
    } catch (err) {
      console.error('[SUPABASE] Erro leaderboard:', err.message);
    }
  }

  // Fallback local
  const local = readLocalAccounts();
  return Object.values(local)
    .sort((a, b) => ((b.rankingPoints ?? 0) - (a.rankingPoints ?? 0)) || (b.wins - a.wins))
    .slice(0, limit);
}
