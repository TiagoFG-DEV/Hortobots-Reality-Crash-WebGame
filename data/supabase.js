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
  'postgresql://postgres.rxfdjwdfinhqdwllzmcc:1Q2W3E4R5T6Y7U8I9O0Pa!!@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

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
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_unique_upper_name ON accounts(UPPER(name));
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_unique_lower_email ON accounts(LOWER(email)) WHERE email IS NOT NULL AND email != '';
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_unique_lower_google_email ON accounts(LOWER(google_email)) WHERE google_email IS NOT NULL AND google_email != '';
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS story_save JSONB DEFAULT NULL;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20) DEFAULT '';
        UPDATE accounts SET custom_bio = 'Piloto Certificado RealityClash' WHERE custom_bio LIKE '%@%';
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
    birthDate: row.birth_date || '',
    googleLinked: !!row.google_linked,
    googleEmail: row.google_email || '',
    emailVerified: !!row.email_verified,
    twoFactorEnabled: !!row.two_factor_enabled,
    rankingPoints: Number(row.ranking_points) || 0,
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
    totalMatches: Number(row.total_matches) || 0,
    totalMedals: Number(row.total_medals) || 0,
    customBio: row.custom_bio || 'Piloto Cadastrado no Sistema Mnemosyne',
    avatarBadge: row.avatar_badge || 'quezas',
    storySave: row.story_save || null,
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

  // Fallback local (insensível a maiúsculas/minúsculas)
  const accounts = readLocalAccounts();
  const key = Object.keys(accounts).find(k => (
    (accounts[k].email || '').trim().toLowerCase() === cleanEmail ||
    (accounts[k].googleEmail || '').trim().toLowerCase() === cleanEmail
  ));
  return key ? accounts[key] : null;
}

export async function createAccount(data) {
  const cleanNick = (data.name || data.nickname || '').trim().toUpperCase();
  if (!cleanNick) {
    throw new Error('O NickName de piloto é obrigatório.');
  }
  const cleanEmail = (data.email || data.googleEmail || '').trim().toLowerCase();

  // 1. Verificação estrita de duplicidade de Nickname
  const existingNick = await getAccount(cleanNick);
  if (existingNick) {
    throw new Error(`O NickName "${cleanNick}" já está em uso por outro piloto. Escolha um nome exclusivo.`);
  }

  // 2. Verificação estrita de duplicidade de E-mail
  if (cleanEmail) {
    const existingEmail = await getAccountByEmail(cleanEmail);
    if (existingEmail) {
      throw new Error(`O e-mail "${cleanEmail}" já está vinculado à conta do piloto "${existingEmail.name}". Nenhum usuário tem permissão para ter mais de uma conta por e-mail.`);
    }
  }

  const now = Date.now();
  const birthDate = (data.birthDate || '').trim();
  const emailVerified = data.emailVerified !== undefined ? !!data.emailVerified : false;
  const twoFactorEnabled = data.twoFactorEnabled !== undefined ? !!data.twoFactorEnabled : false;

  if (isSupabaseConnected) {
    try {
      const query = `
        INSERT INTO accounts (
          name, password, email, google_linked, google_email,
          ranking_points, wins, losses, total_matches, total_medals,
          custom_bio, avatar_badge, created_at, last_seen,
          email_verified, two_factor_enabled, birth_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *;
      `;
      const values = [
        cleanNick,
        data.password || '',
        cleanEmail,
        !!data.googleLinked,
        data.googleLinked ? (data.googleEmail || cleanEmail) : '',
        0, // Inicia em 0 RP
        0,
        0,
        0,
        0,
        data.customBio || 'Piloto Cadastrado no Sistema Mnemosyne',
        data.avatarBadge || 'quezas',
        now,
        now,
        emailVerified,
        twoFactorEnabled,
        birthDate
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
      if (err.code === '23505') {
        throw new Error('Violação de exclusividade: Já existe uma conta cadastrada com este NickName ou E-mail.');
      }
      throw err;
    }
  }

  // Fallback local
  const local = readLocalAccounts();
  const acc = {
    name: cleanNick,
    nickname: cleanNick,
    password: data.password || '',
    email: cleanEmail,
    birthDate,
    googleLinked: !!data.googleLinked,
    googleEmail: data.googleLinked ? (data.googleEmail || cleanEmail) : '',
    emailVerified,
    twoFactorEnabled,
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

  const current = await getAccount(cleanNick);
  if (!current) return null;

  let targetNick = cleanNick;
  if (updates.newNickname) {
    const candidate = updates.newNickname.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 16);
    if (candidate && candidate !== cleanNick) {
      const existing = await getAccount(candidate);
      if (existing) {
        throw new Error(`O NickName "${candidate}" já está em uso por outro piloto.`);
      }
      targetNick = candidate;
    }
  }

  let newEmail = current.email;
  if (updates.email !== undefined) {
    const candidateEmail = updates.email.trim().toLowerCase();
    if (candidateEmail && candidateEmail !== (current.email || '').toLowerCase()) {
      const existingEmailAcc = await getAccountByEmail(candidateEmail);
      if (existingEmailAcc && existingEmailAcc.name.toUpperCase() !== cleanNick) {
        throw new Error(`O e-mail "${candidateEmail}" já está cadastrado para outro piloto (${existingEmailAcc.name}). Nenhum usuário tem permissão para ter mais de uma conta por e-mail.`);
      }
      newEmail = candidateEmail;
    }
  }

  let newGoogleEmail = current.googleEmail;
  if (updates.googleEmail !== undefined) {
    const candidateGoogle = updates.googleEmail.trim().toLowerCase();
    if (candidateGoogle && candidateGoogle !== (current.googleEmail || '').toLowerCase()) {
      const existingGoogleAcc = await getAccountByEmail(candidateGoogle);
      if (existingGoogleAcc && existingGoogleAcc.name.toUpperCase() !== cleanNick) {
        throw new Error(`O e-mail Google "${candidateGoogle}" já está vinculado a outro piloto (${existingGoogleAcc.name}). Nenhum usuário tem permissão para ter mais de uma conta por e-mail.`);
      }
      newGoogleEmail = candidateGoogle;
    }
  }

  const newPass = updates.password !== undefined ? updates.password : current.password;
  const newBirth = updates.birthDate !== undefined ? updates.birthDate.trim() : current.birthDate;
  const newBio = updates.customBio !== undefined ? updates.customBio : current.customBio;
  const newBadge = updates.avatarBadge !== undefined ? updates.avatarBadge : current.avatarBadge;
  const newGoogleLinked = updates.googleLinked !== undefined ? !!updates.googleLinked : current.googleLinked;
  const newEmailVerified = updates.emailVerified !== undefined ? !!updates.emailVerified : current.emailVerified;

  if (isSupabaseConnected) {
    try {
      const query = `
        UPDATE accounts
        SET name = $1, password = $2, email = $3, birth_date = $4,
            custom_bio = $5, avatar_badge = $6, google_linked = $7,
            google_email = $8, email_verified = $9, last_seen = $10
        WHERE UPPER(name) = $11
        RETURNING *;
      `;
      const values = [
        targetNick,
        newPass,
        newEmail,
        newBirth,
        newBio,
        newBadge,
        newGoogleLinked,
        newGoogleEmail,
        newEmailVerified,
        now,
        cleanNick
      ];
      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const acc = mapRowToAccount(res.rows[0]);
        const local = readLocalAccounts();
        if (targetNick !== cleanNick) {
          delete local[cleanNick];
        }
        local[targetNick] = acc;
        writeLocalAccounts(local);
        return acc;
      }
    } catch (err) {
      console.error('[SUPABASE] Erro updateAccount:', err.message);
      throw err;
    }
  }

  // Fallback local
  const local = readLocalAccounts();
  const existingKey = Object.keys(local).find(k => k.toUpperCase() === cleanNick);
  if (existingKey) {
    const acc = local[existingKey];
    acc.name = targetNick;
    acc.nickname = targetNick;
    acc.password = newPass;
    acc.email = newEmail;
    acc.birthDate = newBirth;
    acc.customBio = newBio;
    acc.avatarBadge = newBadge;
    acc.googleLinked = newGoogleLinked;
    acc.googleEmail = newGoogleEmail;
    acc.emailVerified = newEmailVerified;
    acc.lastSeen = now;

    if (targetNick !== cleanNick) {
      delete local[existingKey];
      local[targetNick] = acc;
    }
    writeLocalAccounts(local);
    return acc;
  }
  return null;
}

export async function deleteAccount(name) {
  const cleanNick = (name || '').trim().toUpperCase();
  if (!cleanNick) return false;

  if (isSupabaseConnected) {
    try {
      await pool.query('DELETE FROM accounts WHERE UPPER(name) = $1', [cleanNick]);
      console.log(`[SUPABASE] 🗑️ Conta ${cleanNick} excluída do PostgreSQL com sucesso.`);
    } catch (err) {
      console.error('[SUPABASE] Erro deleteAccount:', err.message);
    }
  }

  const local = readLocalAccounts();
  const key = Object.keys(local).find(k => k.toUpperCase() === cleanNick);
  if (key) {
    delete local[key];
    writeLocalAccounts(local);
    console.log(`[LOCAL_STORAGE] 🗑️ Conta ${cleanNick} removida de accounts.json.`);
  }
  return true;
}

export async function clearAllAccounts() {
  if (isSupabaseConnected) {
    try {
      await pool.query('TRUNCATE TABLE accounts CASCADE;');
      console.log('[SUPABASE] 🗑️ Todas as contas apagadas do PostgreSQL.');
    } catch (err) {
      console.error('[SUPABASE] Erro clearAllAccounts:', err.message);
    }
  }
  writeLocalAccounts({});
  console.log('[LOCAL_STORAGE] 🗑️ accounts.json limpo com sucesso.');
  return true;
}

// Cache de deduplicação de partidas PvP para evitar contagem dupla entre dois clientes (janela de 2 min)
const processedMatchDedupe = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of processedMatchDedupe.entries()) {
    if (now - item.timestamp > 120000) processedMatchDedupe.delete(id);
  }
}, 60000).unref();

export async function recordDuelResult({
  winnerName,
  loserName,
  hpPercentRemaining = 50,
  turns = 3,
  medals = 10,
  isRanked = true,
  matchId = null
}) {
  if (matchId && processedMatchDedupe.has(matchId)) {
    console.log(`[SUPABASE] ♻️ Match ${matchId} já processado anteriormente. Retornando resultado em cache.`);
    return processedMatchDedupe.get(matchId).result;
  }

  let pointsGained = 0;
  let pointsLost = 0;
  let updatedWinner = null;
  let updatedLoser = null;

  // 1. Atualização do Vencedor (se conta registrada)
  if (winnerName) {
    const w = await getAccount(winnerName);
    if (w) {
      if (isRanked) {
        pointsGained = Math.min(30, Math.max(15, Math.round(18 + (Math.min(100, Math.max(0, hpPercentRemaining)) / 100) * 12)));
      } else {
        pointsGained = 0; // Modo Treino: sem alteração de RP
      }
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
          console.log(`[SUPABASE] 🏆 Vencedor salvo: ${w.name} | Vitórias: ${newWins} | Partidas: ${newMatches} | RP: ${newRp}`);
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

      updatedWinner = {
        ...w,
        wins: newWins,
        totalMatches: newMatches,
        totalMedals: newMedals,
        rankingPoints: newRp,
        lastSeen: Date.now()
      };
    }
  }

  // 2. Atualização do Perdedor (se conta registrada)
  if (loserName) {
    const l = await getAccount(loserName);
    if (l) {
      if (isRanked) {
        pointsLost = Math.min(20, Math.max(10, Math.round(16 - (turns > 4 ? 3 : 0))));
      } else {
        pointsLost = 0; // Modo Treino: sem alteração de RP
      }
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
          console.log(`[SUPABASE] 🛡️ Perdedor salvo: ${l.name} | Derrotas: ${newLosses} | Partidas: ${newMatches} | RP: ${newRp}`);
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

      updatedLoser = {
        ...l,
        losses: newLosses,
        totalMatches: newMatches,
        rankingPoints: newRp,
        lastSeen: Date.now()
      };
    }
  }

  const result = {
    pointsGained,
    pointsLost,
    winner: updatedWinner,
    loser: updatedLoser
  };

  if (matchId) {
    processedMatchDedupe.set(matchId, { result, timestamp: Date.now() });
  }

  return result;
}

export async function saveMatchResult(winnerName, loserName, hpPercentRemaining = 50, turns = 3, medals = 10) {
  return recordDuelResult({
    winnerName,
    loserName,
    hpPercentRemaining,
    turns,
    medals,
    isRanked: true
  });
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

// ── Persistência de Save do Modo História Vinculado à Conta ───────────

export async function saveStoryToAccount(accountName, saveData) {
  const cleanNick = (accountName || '').trim().toUpperCase();
  if (!cleanNick) return false;

  if (isSupabaseConnected) {
    try {
      await pool.query(
        'UPDATE accounts SET story_save = $1, last_seen = $2 WHERE UPPER(name) = $3',
        [saveData ? JSON.stringify(saveData) : null, Date.now(), cleanNick]
      );
    } catch (err) {
      console.error('[SUPABASE] Erro saveStoryToAccount:', err.message);
    }
  }

  // Fallback local
  const accounts = readLocalAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  if (existingKey) {
    accounts[existingKey].storySave = saveData;
    accounts[existingKey].lastSeen = Date.now();
    writeLocalAccounts(accounts);
  }
  return true;
}

export async function getStoryFromAccount(accountName) {
  const cleanNick = (accountName || '').trim().toUpperCase();
  if (!cleanNick) return null;

  if (isSupabaseConnected) {
    try {
      const res = await pool.query('SELECT story_save FROM accounts WHERE UPPER(name) = $1 LIMIT 1', [cleanNick]);
      if (res.rows.length > 0 && res.rows[0].story_save) {
        return typeof res.rows[0].story_save === 'string'
          ? JSON.parse(res.rows[0].story_save)
          : res.rows[0].story_save;
      }
    } catch (err) {
      console.error('[SUPABASE] Erro getStoryFromAccount:', err.message);
    }
  }

  // Fallback local
  const accounts = readLocalAccounts();
  const existingKey = Object.keys(accounts).find(k => k.toUpperCase() === cleanNick);
  if (existingKey && accounts[existingKey].storySave) {
    return accounts[existingKey].storySave;
  }
  return null;
}
