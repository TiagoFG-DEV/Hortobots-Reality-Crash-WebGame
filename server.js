// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// server.js â€” Servidor + WebSocket Multiplayer + API de Contas JSON
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { initSupabase, getAccount, getAccountByEmail, createAccount, updateAccount, deleteAccount, clearAllAccounts, saveMatchResult, recordDuelResult, getLeaderboard, applyDraftPenalty as supabasePenalty, saveStoryToAccount, getStoryFromAccount } from './data/supabase.js';
import { isGoogleEmail, start2FARegistration, verify2FARegistration, resend2FACode } from './data/email-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregamento automático de variáveis (.env ou .env.pvp, incluindo Secret Files do Render)
if (typeof process.loadEnvFile === 'function') {
  const envDefault = path.join(__dirname, '.env');
  const envPvp = path.join(__dirname, '.env.pvp');
  if (fs.existsSync(envDefault)) {
    try { process.loadEnvFile(envDefault); } catch (e) { console.warn('[ENV] Falha ao carregar .env:', e.message); }
  } else if (fs.existsSync(envPvp)) {
    try { process.loadEnvFile(envPvp); } catch (e) { console.warn('[ENV] Falha ao carregar .env.pvp:', e.message); }
  }
}

const app = express();
const PORT = process.env.PORT || 3333;
const PVP_MODE = process.env.PVP_MODE !== 'false';

// â”€â”€ JSON body parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(express.json());

// â”€â”€ Static files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACCOUNTS â€” JSON persistence
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ACCOUNTS & AUTH â€” JSON persistence (data/accounts.json)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

function sanitizeNick(raw) {
  return (raw || '').trim().replace(/[^a-zA-Z0-9_]/g, '').toUpperCase().slice(0, 16);
}

// ── AUTH: Configurações Públicas do Google Client ID ───────────────────
app.get('/api/auth/google-config', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// Proteção contra Overload e Ataques de Spam (Rate Limiter Inteligente por IP)
const registrationRateLimitMap = new Map();
function checkRegistrationRateLimit(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const record = registrationRateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + 60000;
  } else {
    record.count++;
  }
  registrationRateLimitMap.set(ip, record);

  // Máximo 6 solicitações por minuto por IP (protege o servidor e a cota do Gmail)
  if (record.count > 6) {
    return res.status(429).json({
      error: 'Muitas solicitações simultâneas deste IP. Para proteger o servidor contra sobrecarga, aguarde 1 minuto.'
    });
  }

  if (registrationRateLimitMap.size > 1000) {
    for (const [k, v] of registrationRateLimitMap.entries()) {
      if (now > v.resetAt) registrationRateLimitMap.delete(k);
    }
  }

  next();
}

// ── AUTH: Início do Registro com Envio de E-mail de Validação ─────────────
app.post('/api/auth/register-2fa-start', checkRegistrationRateLimit, async (req, res) => {
  try {
    const { nickname, password, email, birthDate } = req.body;
    const result = await start2FARegistration({
      nickname,
      password,
      email,
      birthDate,
      existingAccountsCheck: async (cleanNick, cleanEmail) => {
        const accDb = await getAccount(cleanNick);
        const emailDb = await getAccountByEmail(cleanEmail);
        const accountsLocal = readAccounts();
        const localNickKey = Object.keys(accountsLocal).find(k => k.toUpperCase() === cleanNick);
        const localEmailKey = Object.keys(accountsLocal).find(k => (
          (accountsLocal[k].email || '').toLowerCase() === cleanEmail ||
          (accountsLocal[k].googleEmail || '').toLowerCase() === cleanEmail
        ));
        return {
          nickTaken: !!accDb || !!localNickKey,
          emailTaken: !!emailDb || !!localEmailKey,
        };
      },
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── AUTH: Confirmação do Código de 4 Dígitos e Ativação da Conta ─────────
app.post('/api/auth/register-2fa-verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await verify2FARegistration({
      email,
      code,
      createAccountFn: async (accountData) => {
        return await createAccount(accountData);
      },
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── AUTH: Reenviar Código ao E-mail ─────────────────────────────────────
app.post('/api/auth/register-2fa-resend', checkRegistrationRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resend2FACode({ email });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── AUTH: Cadastro Direto Desativado (E-mail Real é Obrigatório) ────────
app.post('/api/auth/register-direct', (req, res) => {
  return res.status(403).json({
    error: 'O cadastro direto sem e-mail foi desativado. É obrigatório registrar com e-mail real para validação.'
  });
});

// ── AUTH: Login Padrão (Usuário e Senha) ────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const cleanNick = sanitizeNick(nickname);
    if (!cleanNick) {
      return res.status(400).json({ error: 'Informe o NickName de piloto.' });
    }

    let acc = await getAccount(cleanNick);
    if (!acc) {
      return res.status(404).json({ error: 'Piloto não encontrado. Crie sua conta para começar.' });
    }

    if (acc.password && acc.password.length > 0 && String(acc.password) !== String(password || '')) {
      return res.status(401).json({ error: 'Senha incorreta para este piloto.' });
    }

    acc = await updateAccount(cleanNick, { lastSeen: Date.now() });
    res.json(acc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AUTH: Login Oficial com Google (RESTRITO: Apenas Contas já VINCULADAS)
app.post('/api/auth/google-verify', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credencial Google ausente. Faça o login na janela oficial do Google.' });
    }

    // Validação oficial do token com os servidores do Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Falha na validação do token oficial do Google.' });
    }

    const tokenInfo = await googleRes.json();
    const googleEmail = (tokenInfo.email || '').trim().toLowerCase();
    if (!googleEmail) {
      return res.status(400).json({ error: 'E-mail não identificado na conta Google.' });
    }

    // Busca pela conta vinculada a esse e-mail Google
    const acc = await getAccountByEmail(googleEmail);
    if (!acc || !acc.googleLinked) {
      return res.status(403).json({
        error: `A conta Google (${googleEmail}) NÃO está vinculada a nenhum piloto. Apenas contas vinculadas podem usar esta função. Inicie sessão com usuário e senha para vincular sua conta Google na Central de Conta.`
      });
    }

    res.json({
      account: acc,
      message: `Login com Google realizado com sucesso para o piloto ${acc.nickname || acc.name}!`
    });
  } catch (err) {
    console.error('[AUTH_GOOGLE] Erro na verificação Google:', err.message);
    res.status(500).json({ error: 'Erro ao verificar conta Google: ' + err.message });
  }
});

// ── AUTH: Vincular Conta Google à Sessão Ativa ──────────────────────────
app.post('/api/auth/google-link', async (req, res) => {
  try {
    const { nickname, credential } = req.body;
    const cleanNick = sanitizeNick(nickname);
    if (!cleanNick) return res.status(400).json({ error: 'Piloto não informado.' });
    if (!credential) return res.status(400).json({ error: 'Credencial Google ausente.' });

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Token Google inválido.' });
    }

    const tokenInfo = await googleRes.json();
    const googleEmail = (tokenInfo.email || '').trim().toLowerCase();
    if (!googleEmail) return res.status(400).json({ error: 'E-mail não identificado no Google.' });

    // Verifica se outra conta já usa esse e-mail Google
    const existing = await getAccountByEmail(googleEmail);
    if (existing && existing.name.toUpperCase() !== cleanNick) {
      return res.status(409).json({ error: `O e-mail Google (${googleEmail}) já está vinculado ao piloto ${existing.name}.` });
    }

    const updated = await updateAccount(cleanNick, {
      googleLinked: true,
      googleEmail: googleEmail,
      email: googleEmail,
      emailVerified: true
    });

    res.json({
      account: updated,
      message: `Conta Google (${googleEmail}) vinculada com sucesso ao piloto ${cleanNick}!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CONTA: Editar Dados da Conta (Nick, Senha, E-mail, Nascimento, etc.) ─
app.put('/api/account', async (req, res) => {
  try {
    const targetNick = req.body.currentNick || req.body.nickname || req.body.name;
    const cleanNick = sanitizeNick(targetNick);
    if (!cleanNick) return res.status(400).json({ error: 'Identificação da conta ausente.' });

    const acc = await getAccount(cleanNick);
    if (!acc) return res.status(404).json({ error: 'Conta de piloto não encontrada.' });

    // Validação de senha atual para alteração de dados sensíveis
    if (acc.password && acc.password.length > 0) {
      const sentPass = req.body.currentPassword !== undefined ? req.body.currentPassword : req.body.password;
      if (String(acc.password) !== String(sentPass || '')) {
        return res.status(401).json({ error: 'Senha atual incorreta. A confirmação de segurança é necessária para alterar os dados.' });
      }
    }

    const updates = {};
    const effectiveNewNick = req.body.newNick || req.body.newNickname;
    if (effectiveNewNick && sanitizeNick(effectiveNewNick) !== cleanNick) {
      const candidateNick = sanitizeNick(effectiveNewNick);
      const existingNick = await getAccount(candidateNick);
      if (existingNick) {
        return res.status(409).json({ error: `O NickName "${candidateNick}" já está em uso por outro piloto.` });
      }
      updates.newNickname = candidateNick;
    }
    const effectivePass = req.body.newPassword !== undefined ? req.body.newPassword : (req.body.password !== undefined && req.body.newNickname ? undefined : req.body.password);
    if (effectivePass !== undefined && String(effectivePass).trim().length > 0) {
      if (String(effectivePass).length < 8) {
        return res.status(400).json({ error: 'A nova senha deve possuir no mínimo 8 dígitos.' });
      }
      updates.password = String(effectivePass);
    }
    if (req.body.email !== undefined) {
      const candidateEmail = String(req.body.email).trim().toLowerCase();
      if (candidateEmail && candidateEmail !== (acc.email || '').toLowerCase()) {
        const existingEmail = await getAccountByEmail(candidateEmail);
        if (existingEmail && existingEmail.name.toUpperCase() !== cleanNick) {
          return res.status(409).json({ error: `O e-mail "${candidateEmail}" já está cadastrado para outro piloto (${existingEmail.name}). Nenhum usuário tem permissão para ter mais de uma conta por e-mail.` });
        }
      }
      updates.email = candidateEmail;
    }
    if (req.body.birthDate !== undefined) updates.birthDate = String(req.body.birthDate).trim();
    if (req.body.customBio !== undefined) updates.customBio = String(req.body.customBio).slice(0, 80);
    if (req.body.bio !== undefined) updates.customBio = String(req.body.bio).slice(0, 80);
    if (req.body.avatarBadge !== undefined) updates.avatarBadge = String(req.body.avatarBadge).slice(0, 20);

    const updatedAcc = await updateAccount(cleanNick, updates);
    res.json({
      account: updatedAcc,
      message: 'Dados da conta atualizados com sucesso!'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── CONTA: Deletar Conta Definitivamente (Apagar Registros) ─────────────
app.delete('/api/account', async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const cleanNick = sanitizeNick(nickname);
    if (!cleanNick) return res.status(400).json({ error: 'Identificação da conta ausente.' });

    const acc = await getAccount(cleanNick);
    if (!acc) return res.status(404).json({ error: 'Conta não encontrada.' });

    if (acc.password && acc.password.length > 0) {
      if (String(acc.password) !== String(password || '')) {
        return res.status(401).json({ error: 'Senha incorreta para confirmar a exclusão definitiva da conta.' });
      }
    }

    await deleteAccount(cleanNick);
    res.json({
      success: true,
      message: `Conta do piloto ${cleanNick} e todos os seus registros foram excluídos permanentemente.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN: Limpeza de Todas as Contas do Banco ──────────────────────────
app.post('/api/admin/clear-all-accounts', async (req, res) => {
  try {
    await clearAllAccounts();
    res.json({ success: true, message: 'Todas as contas foram limpas com sucesso do banco de dados.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/match-result â€” Salvar resultado e atualizar Ranking
app.post('/api/accounts/match-result', async (req, res) => {
  try {
    const winnerName = req.body.winnerName || req.body.winnerNick || req.body.winner;
    const loserName = req.body.loserName || req.body.loserNick || req.body.loser;
    const hpPercentRemaining = req.body.hpPercentRemaining !== undefined ? Number(req.body.hpPercentRemaining) : 50;
    const turns = req.body.turns || req.body.totalRounds || 3;
    const medals = req.body.medals !== undefined ? Number(req.body.medals) : 10;
    const isRanked = req.body.isRanked !== false;
    const matchId = req.body.matchId || null;

    console.log(`[MATCH_RESULT] Registrando duelo: Vencedor=${winnerName}, Perdedor=${loserName}, Ranked=${isRanked}, MatchId=${matchId}`);

    const result = await recordDuelResult({
      winnerName,
      loserName,
      hpPercentRemaining,
      turns,
      medals,
      isRanked,
      matchId
    });

    res.json(result);
  } catch (err) {
    console.error('[MATCH_RESULT] Erro ao salvar resultado:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/:name/result — Salvar resultado de duelo individual (ex: Modo Treino vs IA)
app.post('/api/accounts/:name/result', async (req, res) => {
  try {
    const name = sanitizeNick(req.params.name);
    if (!name) return res.status(400).json({ error: 'Nome inválido' });

    const won = Boolean(req.body.won);
    const medals = req.body.medals !== undefined ? Number(req.body.medals) : 5;

    console.log(`[TRAINING_RESULT] Piloto=${name}, Venceu=${won}, Medalhas=${medals}`);

    const result = await recordDuelResult({
      winnerName: won ? name : null,
      loserName: won ? null : name,
      isRanked: false, // Treino não altera RP
      medals,
      hpPercentRemaining: won ? 60 : 0,
      turns: 3
    });

    const updatedAcc = won ? result.winner : result.loser;
    res.json({
      success: true,
      account: updatedAcc,
      won,
      medals
    });
  } catch (err) {
    console.error('[TRAINING_RESULT] Erro ao salvar treino:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/:name — busca dados da conta (compatibilidade)
app.get('/api/accounts/:name', async (req, res) => {
  const name = sanitizeNick(req.params.name);
  if (!name) return res.status(400).json({ error: 'Invalid name' });

  const acc = await getAccount(name);
  if (acc) {
    if (acc.rankingPoints === undefined) acc.rankingPoints = 0;
    return res.json(acc);
  }

  res.status(404).json({ error: 'Conta não encontrada' });
});

// GET /api/leaderboard — ranking ordenado por Ranking Points (RP) e vitórias
app.get('/api/leaderboard', async (req, res) => {
  try {
    const list = await getLeaderboard(15);
    res.json(list);
  } catch {
    const accounts = readAccounts();
    const sorted = Object.values(accounts)
      .sort((a, b) => ((b.rankingPoints ?? 0) - (a.rankingPoints ?? 0)) || (b.wins - a.wins))
      .slice(0, 15);
    res.json(sorted);
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MODO HISTÃ“RIA â€” PersistÃªncia em Arquivo .JSON (story_save.json)
// ══════════════════════════════════════════════════════════════════════
// MODO HISTÓRIA — Persistência na Conta do Jogador (Supabase + Local)
// ══════════════════════════════════════════════════════════════════════

// GET /api/story-save — Retorna o save vinculado à conta informada
app.get('/api/story-save', async (req, res) => {
  try {
    const accountName = req.query.account || req.query.name;
    if (!accountName) {
      // Convidado / sem conta: nenhum save retornado (em conformidade com regra sem persistência)
      return res.json({ saved: false, reason: 'unauthenticated' });
    }
    const save = await getStoryFromAccount(accountName);
    if (save) {
      return res.json({ saved: true, ...save });
    }
    return res.json({ saved: false });
  } catch (e) {
    res.json({ saved: false, error: e.message });
  }
});

// POST /api/story-save — Salva progresso na conta logada
app.post('/api/story-save', async (req, res) => {
  try {
    const { accountName, save } = req.body;
    if (!accountName) {
      return res.status(400).json({ error: 'Nenhuma conta informada para salvar progresso' });
    }
    const saveData = (save && typeof save === 'object') ? save : { ...req.body };
    delete saveData.accountName;
    saveData.savedAt = Date.now();
    saveData.saved = true;

    await saveStoryToAccount(accountName, saveData);
    res.json({ ok: true, savedAt: saveData.savedAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/story-save — Deleta/reseta o save da conta logada
app.delete('/api/story-save', async (req, res) => {
  try {
    const accountName = req.query.account || req.body?.accountName;
    if (accountName) {
      await saveStoryToAccount(accountName, null);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER — Multiplayer Matchmaking
// ══════════════════════════════════════════════════════════════════════
const wss = new WebSocketServer({ noServer: true });

// -- Server Info --
app.get('/api/server-info', (req, res) => {
  res.json({
    pvpMode: PVP_MODE,
    port: PORT,
    wsPort: PORT,
    version: '1.0.0'
  });
});

// -- SPA Fallback --
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// WEBSOCKET SERVER â€” Multiplayer Matchmaking
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/** @type {Map<string, {ws, name, team, matchId, side}>} */
const clients = new Map();

/** Fila de jogadores esperando um match */
const matchQueue = [];

/** Partidas ativas: matchId â†’ {playerA, playerB, state} */
const activeMatches = new Map();

/** Salas privadas fechadas: roomCode â†’ { code, host, guest, ready: { host: false, guest: false } } */
const activeRooms = new Map();

let matchCounter = 0;

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// ── PvP Match Lifecycle, Timers & Duelos ──────────────────────────

// Inicia o timer de recrutamento / draft (60 segundos)
function startDraftTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.draftStartTime = Date.now();
  if (match.draftTimer) clearTimeout(match.draftTimer);
  if (match.draftTick) clearInterval(match.draftTick);

  // Broadcast imediato dos 60 segundos
  broadcast(matchId, { type: 'draft_timer_tick', remaining: 60 });

  // Tick a cada 1 segundo
  match.draftTick = setInterval(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'draft') {
      clearInterval(m?.draftTick);
      return;
    }
    const elapsed = Math.floor((Date.now() - m.draftStartTime) / 1000);
    const remaining = Math.max(0, 60 - elapsed);
    broadcast(matchId, { type: 'draft_timer_tick', remaining });
  }, 1000);

  // Timeout aos 60 segundos: auto-pick defensivo para quem não confirmou
  match.draftTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'draft') return;

    clearInterval(m.draftTick);
    m.draftTick = null;

    const defaultRobots = ['dinobyte', 'penlinux', 'cowputer'];

    ['A', 'B'].forEach(side => {
      if (!m.draftReady[side]) {
        const player = side === 'A' ? m.playerA : m.playerB;
        const opponent = side === 'A' ? m.playerB : m.playerA;
        if (!player.team || player.team.length !== 3) {
          player.team = [...defaultRobots];
        }
        m.draftReady[side] = true;
        m[`player${side}`].team = player.team;

        if (player.ws) {
          send(player.ws, { type: 'draft_auto_confirmed', team: player.team });
          send(player.ws, { type: 'draft_status', ready: true });
        }
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_draft_status', ready: true });
        }
        console.log(`[DRAFT_TIMEOUT] Auto-pick defensivo aplicado para ${side} no match ${matchId}.`);
      }
    });

    // Se ambos estão prontos, avança para o Duelo de Cara ou Coroa!
    if (m.draftReady.A && m.draftReady.B) {
      startCoinDuel(matchId);
    }
  }, 60000);

  console.log(`[DRAFT_TIMER] Match ${matchId}: timer de recrutamento de 60s iniciado.`);
}

// Inicia o minigame Duelo ao Meio-Dia (Cara ou Coroa de reflexo)
function startCoinDuel(matchId, isTiebreak = false) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  clearAllMatchTimers(matchId);
  match.phase = 'coin_duel';
  match.coinDuel = {
    picks: {},
    resolved: false,
    isTiebreak,
    startedAt: Date.now()
  };

  // Broadcast do início do duelo com contagem de 3 segundos
  broadcast(matchId, { type: 'coin_duel_start', countdown: 3, isTiebreak });
  console.log(`[COIN_DUEL] Match ${matchId}: duelo ao meio-dia iniciado (tiebreak: ${isTiebreak}).`);

  // Fallback se ninguém clicar em 7 segundos (3s de contagem + 4s de timeout)
  match.coinDuelTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'coin_duel' || !m.coinDuel || m.coinDuel.resolved) return;

    console.log(`[COIN_DUEL_TIMEOUT] Nenhum piloto escolheu a tempo no match ${matchId}. Sorteando automaticamente...`);
    const sideA = Math.random() < 0.5 ? 'heads' : 'tails';
    m.coinDuel.picks.A = sideA;
    m.coinDuel.picks.B = sideA === 'heads' ? 'tails' : 'heads';
    resolveCoinDuel(matchId);
  }, 7000);
}

// Resolve o Cara ou Coroa criptográfico e define vencedor da iniciativa/desempate
function resolveCoinDuel(matchId) {
  const match = activeMatches.get(matchId);
  if (!match || !match.coinDuel || match.coinDuel.resolved) return;

  match.coinDuel.resolved = true;
  if (match.coinDuelTimer) {
    clearTimeout(match.coinDuelTimer);
    match.coinDuelTimer = null;
  }

  const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
  const winningSide = (match.coinDuel.picks.A === flipResult) ? 'A' : 'B';

  broadcast(matchId, {
    type: 'coin_duel_result',
    result: flipResult,
    winner: winningSide,
    picks: match.coinDuel.picks,
    isTiebreak: match.coinDuel.isTiebreak
  });

  console.log(`[COIN_DUEL] Resultado: ${flipResult.toUpperCase()} | Vencedor: Lado ${winningSide}`);

  if (match.coinDuel.isTiebreak) {
    // Desempate supremo de fim de jogo
    setTimeout(() => {
      broadcast(matchId, {
        type: 'match_ended',
        winner: winningSide,
        medals: match.medals,
        reason: 'coin_tiebreak'
      });
      clearAllMatchTimers(matchId);
      activeMatches.delete(matchId);
    }, 4000);
  } else {
    // Iniciativa do Round 1 -> Iniciar combate após animação da moeda (4s)
    setTimeout(() => {
      const m = activeMatches.get(matchId);
      if (!m) return;
      startCombatPhase(matchId, winningSide);
    }, 4000);
  }
}

// Temas de Arena Versus disponíveis (Server-Authoritative)
const VERSUS_THEME_IDS = ['default', 'metallic', 'kawaii', 'matrix'];
function pickRandomArenaTheme() {
  return VERSUS_THEME_IDS[Math.floor(Math.random() * VERSUS_THEME_IDS.length)];
}

// Inicia a Fase Oficial de Combate em Rounds
function startCombatPhase(matchId, firstTurn) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.phase = 'combat';
  match.firstTurn = firstTurn;
  match.round = 1;
  match.turnReady = { A: false, B: false };
  match.turnActions = { A: null, B: null };

  // O SERVIDOR decide O MESMO tema para ambos os players!
  if (!match.themeId) {
    match.themeId = pickRandomArenaTheme();
  }

  send(match.playerA.ws, {
    type: 'combat_start',
    yourTeam: match.playerA.team,
    enemyTeam: match.playerB.team,
    firstTurn,
    round: 1,
    themeId: match.themeId
  });
  send(match.playerB.ws, {
    type: 'combat_start',
    yourTeam: match.playerB.team,
    enemyTeam: match.playerA.team,
    firstTurn,
    round: 1,
    themeId: match.themeId
  });

  console.log(`[COMBAT] Match ${matchId} iniciado com iniciativa para ${firstTurn}! Tema da Arena (Sincronizado): ${match.themeId}`);

  // Dispara o relógio global de 5 minutos e o primeiro timer de round de 30s
  startMatchTimer(matchId);
  startRoundTimer(matchId);
}

// Timer de 30 segundos por round (sincronizado)
function startRoundTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match || match.phase !== 'combat') return;

  if (match.roundTimer) clearTimeout(match.roundTimer);
  if (match.roundTick) clearInterval(match.roundTick);

  match.roundStartTime = Date.now();
  broadcast(matchId, { type: 'round_timer_tick', remaining: 30, round: match.round });

  match.roundTick = setInterval(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'combat') {
      clearInterval(m?.roundTick);
      return;
    }
    const elapsed = Math.floor((Date.now() - m.roundStartTime) / 1000);
    const remaining = Math.max(0, 30 - elapsed);
    broadcast(matchId, { type: 'round_timer_tick', remaining, round: m.round });
  }, 1000);

  match.roundTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'combat') return;

    clearInterval(m.roundTick);
    m.roundTick = null;

    // Auto-rest para qualquer piloto que não enviou suas decisões nos 30s
    ['A', 'B'].forEach(side => {
      if (!m.turnReady[side]) {
        m.turnActions[side] = [{ action: 'rest', auto: true }];
        m.turnReady[side] = true;
        const player = side === 'A' ? m.playerA : m.playerB;
        if (player && player.ws) {
          send(player.ws, { type: 'turn_auto_submitted', side, round: m.round });
        }
      }
    });

    executeRoundClash(matchId);
  }, 30000);
}

// Executa o clash simultâneo quando ambos os jogadores estão prontos ou no timeout
function executeRoundClash(matchId) {
  const match = activeMatches.get(matchId);
  if (!match || match.phase !== 'combat') return;

  if (match.roundTimer) clearTimeout(match.roundTimer);
  if (match.roundTick) clearInterval(match.roundTick);

  console.log(`[ROUND_CLASH] Executando Round ${match.round} no match ${matchId}.`);

  broadcast(matchId, {
    type: 'clash_start',
    actionsA: match.turnActions.A,
    actionsB: match.turnActions.B,
    round: match.round
  });

  // Reseta estado para a próxima rodada
  match.turnReady = { A: false, B: false };
  match.turnActions = { A: null, B: null };
  match.round++;

  // Aguarda 6 segundos para a animação do embate antes de reiniciar o timer de 30s
  match.roundGraceTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (m && m.phase === 'combat') {
      startRoundTimer(matchId);
    }
  }, 6000);
}

// Relógio Global da Partida (5 Minutos = 300 Segundos)
function startMatchTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.matchStartTime = Date.now();
  const MATCH_DURATION = 5 * 60 * 1000; // 5 minutos em ms

  if (match.matchTimerTick) clearInterval(match.matchTimerTick);

  match.matchTimerTick = setInterval(() => {
    const m = activeMatches.get(matchId);
    if (!m) return;
    const elapsed = Date.now() - m.matchStartTime;
    const remaining = Math.max(0, MATCH_DURATION - elapsed);
    broadcast(matchId, { type: 'match_timer_update', remaining, total: MATCH_DURATION });

    if (remaining <= 0) {
      clearInterval(m.matchTimerTick);
      m.matchTimerTick = null;

      console.log(`[MATCH_TIMEOUT] 5 minutos esgotados no match ${matchId}. Medalhas: A=${m.medals.A} B=${m.medals.B}`);

      if (m.medals.A > m.medals.B) {
        broadcast(matchId, { type: 'match_ended', winner: 'A', medals: m.medals, reason: 'time_medals' });
        if (m.playerA && m.playerB) {
          recordDuelResult({
            winnerName: m.playerA.name,
            loserName: m.playerB.name,
            medals: m.medals.A,
            matchId
          }).catch(e => console.error('[MATCH_TIMEOUT] Erro ao registrar:', e));
        }
        clearAllMatchTimers(matchId);
        activeMatches.delete(matchId);
      } else if (m.medals.B > m.medals.A) {
        broadcast(matchId, { type: 'match_ended', winner: 'B', medals: m.medals, reason: 'time_medals' });
        if (m.playerA && m.playerB) {
          recordDuelResult({
            winnerName: m.playerB.name,
            loserName: m.playerA.name,
            medals: m.medals.B,
            matchId
          }).catch(e => console.error('[MATCH_TIMEOUT] Erro ao registrar:', e));
        }
        clearAllMatchTimers(matchId);
        activeMatches.delete(matchId);
      } else {
        // Empate -> Desempate supremo no Cara ou Coroa!
        console.log(`[MATCH_TIE] Empate no match ${matchId}! Disparando Cara ou Coroa de desempate...`);
        startCoinDuel(matchId, true /* isTiebreak */);
      }
    }
  }, 1000);

  console.log(`[MATCH_TIMER] Match ${matchId}: relógio global de 5 minutos iniciado.`);
}

// Limpa todos os timers ativos de uma partida
function clearAllMatchTimers(matchId) {
  const m = activeMatches.get(matchId);
  if (!m) return;
  if (m.draftTimer)      { clearTimeout(m.draftTimer);      m.draftTimer = null; }
  if (m.draftTick)       { clearInterval(m.draftTick);       m.draftTick = null; }
  if (m.coinDuelTimer)   { clearTimeout(m.coinDuelTimer);   m.coinDuelTimer = null; }
  if (m.roundTimer)      { clearTimeout(m.roundTimer);      m.roundTimer = null; }
  if (m.roundTick)       { clearInterval(m.roundTick);       m.roundTick = null; }
  if (m.roundGraceTimer) { clearTimeout(m.roundGraceTimer); m.roundGraceTimer = null; }
  if (m.matchTimerTick)  { clearInterval(m.matchTimerTick);  m.matchTimerTick = null; }
}

// â”€â”€ Matchmaking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function tryMatchmake() {
  if (matchQueue.length < 2) return;

  const now = Date.now();

  // Filtra clientes desconectados
  for (let i = matchQueue.length - 1; i >= 0; i--) {
    if (!matchQueue[i].client || !matchQueue[i].client.ws || matchQueue[i].client.ws.readyState !== 1) {
      matchQueue.splice(i, 1);
    }
  }

  // Ordena por tempo de espera (quem aguarda hÃ¡ mais tempo Ã© priorizado)
  matchQueue.sort((a, b) => a.queuedAt - b.queuedAt);

  for (let i = 0; i < matchQueue.length; i++) {
    const p1 = matchQueue[i];
    const waitedSec1 = (now - p1.queuedAt) / 1000;
    // Janela adaptativa: 50 base + 30 a cada 3s. A partir de 12s, aceita qualquer oponente disponÃ­vel.
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

      startDraftTimer(matchId);

      console.log(`[MATCH] Pareamento ranqueado: ${a.name} (${p1.rankingPoints} RP) vs ${b.name} (${p2.rankingPoints} RP) [Diff: ${minDiff}] — ${matchId}`);
      i--; // Reajusta índice após a remoção
    }
  }
}

// Tick periÃ³dico de 1 segundo para expandir a janela de MMR para jogadores em espera
setInterval(() => {
  if (matchQueue.length >= 2) {
    tryMatchmake();
  }
}, 1000);

// â”€â”€ Connection Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
wss.on('connection', (ws) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const client = { ws, id: clientId, name: null, matchId: null, side: null, team: null };
  clients.set(clientId, client);

  console.log(`[WS] Connected: ${clientId}`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      // â”€â”€ IDENTIFY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'identify': {
        client.name = sanitizeNick(msg.name || 'ANON');
        client.rankingPoints = Math.min(999, Math.max(0, Number(msg.rankingPoints) || 0));
        client.avatarBadge = msg.avatarBadge || 'quezas';
        send(ws, { type: 'identified', name: client.name, clientId, rankingPoints: client.rankingPoints });
        break;
      }

      // â”€â”€ CRIAR SALA FECHADA (POR CÃ“DIGO) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ ENTRAR EM SALA POR CÃ“DIGO (CLIQUE EM DUELAR) â”€â”€â”€â”€â”€â”€â”€â”€
      case 'join_room': {
        const targetCode = (msg.roomCode || '').trim().toUpperCase();
        const room = activeRooms.get(targetCode);
        if (!room) {
          send(ws, { type: 'room_error', msg: 'Codigo nÃ£o encontrado' });
          break;
        }
        if (room.guest && room.guest.id !== clientId) {
          send(ws, { type: 'room_error', msg: 'Esta sala jÃ¡ estÃ¡ lotada (2/2 jogadores).' });
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

        // Se o anfitriÃ£o jÃ¡ estiver PRONTO e o convidado clicou em DUELAR:
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
            enemyPoints: room.guest.rankingPoints ?? 0,
            roomCode: room.code
          });
          send(room.guest.ws, {
            type: 'match_found',
            matchId,
            side: 'B',
            enemyName: room.host.name,
            enemyPoints: room.host.rankingPoints ?? 0,
            roomCode: room.code
          });

          activeRooms.delete(room.code);
          console.log(`[MATCH] Duelo iniciado imediatamente da sala ${room.code}: ${room.host.name} vs ${room.guest.name}`);
          break;
        }

        // Se o anfitriÃ£o NÃƒO estÃ¡ pronto: exibe ESPERANDO POR DUELISTA
        send(room.host.ws, {
          type: 'room_joined',
          roomCode: targetCode,
          isHost: true,
          opponentName: client.name || 'OPONENTE',
          opponentPoints: client.rankingPoints ?? 0,
          guestReady: !!room.ready.guest
        });

        send(client.ws, {
          type: 'room_joined',
          roomCode: targetCode,
          isHost: false,
          opponentName: room.host.name || 'ANFITRIÃƒO',
          opponentPoints: room.host.rankingPoints ?? 0,
          hostReady: !!room.ready.host,
          status: 'waiting_host',
          msg: 'ESPERANDO POR DUELISTA'
        });
        break;
      }

      // â”€â”€ CONFIRMAR PRONTIDÃƒO NA SALA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'room_ready': {
        const room = activeRooms.get(client.roomCode);
        if (!room) {
          send(ws, { type: 'room_error', msg: 'Sala nÃ£o localizada.' });
          break;
        }
        const role = client.isHost ? 'host' : 'guest';
        room.ready[role] = true;

        const opponent = client.isHost ? room.guest : room.host;
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_room_ready', role });
        }
        send(client.ws, { type: 'self_room_ready', role });

        // Quando ambos confirmam PRONTO (ou host confirma com guest jÃ¡ aguardando), inicia a partida
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
            enemyPoints: room.guest.rankingPoints ?? 0,
            roomCode: room.code
          });
          send(room.guest.ws, {
            type: 'match_found',
            matchId,
            side: 'B',
            enemyName: room.host.name,
            enemyPoints: room.host.rankingPoints ?? 0,
            roomCode: room.code
          });

          activeRooms.delete(room.code);
          startDraftTimer(matchId);
          console.log(`[MATCH] Batalha iniciada da sala ${room.code}: ${room.host.name} vs ${room.guest.name}`);
        }
        break;
      }

      // ── CANCELAR PRONTIDÃO NA SALA ────────────────────────────
      case 'room_unready': {
        const room = activeRooms.get(client.roomCode);
        if (!room) break;
        const role = client.isHost ? 'host' : 'guest';
        room.ready[role] = false;

        const opponent = client.isHost ? room.guest : room.host;
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_room_unready', role });
        }
        send(client.ws, { type: 'self_room_unready', role });
        console.log(`[ROOM] ${client.name} (${role}) cancelou PRONTO na sala ${room.code}`);
        break;
      }

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
            if (client.isHost) {
              activeRooms.delete(client.roomCode);
            } else {
              room.guest = null;
              room.ready.guest = false;
            }
          }
          client.roomCode = null;
          client.isHost = false;
        }
        send(ws, { type: 'room_left' });
        break;
      }

      // â”€â”€ JOIN QUEUE (BUSCAR DUELO!) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'join_queue': {
        const alreadyInQueue = matchQueue.some(item => item.client.id === clientId);
        if (alreadyInQueue || client.matchId) {
          send(ws, { type: 'error', msg: 'VocÃª jÃ¡ estÃ¡ na fila ou em partida.' });
          break;
        }

        client.name = (msg.name || client.name || 'ANON').toUpperCase().slice(0, 16);
        client.team = msg.team || [];
        client.rankingPoints = Math.min(999, Math.max(0, Number(msg.rankingPoints) ?? client.rankingPoints ?? 0));

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

      // â”€â”€ LEAVE QUEUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'leave_queue': {
        const idx = matchQueue.findIndex(item => item.client.id === clientId);
        if (idx >= 0) matchQueue.splice(idx, 1);
        send(ws, { type: 'queue_left' });
        console.log(`[QUEUE] ${client.name} cancelou a busca. Restantes: ${matchQueue.length}`);
        break;
      }

      // ── DRAFT READY (Confirmação de Campeões) ────────────────
      case 'draft_ready': {
        const { matchId, team } = msg;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'draft') break;

        const side = client.side;
        client.team = team;
        match.draftReady[side] = true;
        match[`player${side}`].team = team;

        // Avisa a si mesmo e ao oponente sobre a prontidão
        send(ws, { type: 'draft_status', ready: true });
        const opponent = side === 'A' ? match.playerB : match.playerA;
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_draft_status', ready: true, enemyTeam: team });
        }

        console.log(`[DRAFT] Piloto ${client.name} (${side}) marcou PREPARADO no match ${matchId}.`);

        // Transição SÓ avança se AMBOS estiverem preparados no servidor!
        if (match.draftReady.A && match.draftReady.B) {
          if (match.draftTimer) clearTimeout(match.draftTimer);
          if (match.draftTick) clearInterval(match.draftTick);
          match.draftTimer = null;
          match.draftTick = null;
          console.log(`[DRAFT] Ambos os pilotos confirmaram no match ${matchId}! Avançando para Duelo ao Meio-Dia.`);
          startCoinDuel(matchId);
        }
        break;
      }

      // ── DRAFT UNREADY (Cancelar Preparado no Draft) ─────────────
      case 'draft_unready': {
        const { matchId } = msg;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'draft') break;

        const side = client.side;
        match.draftReady[side] = false;

        send(ws, { type: 'draft_status', ready: false });
        const opponent = side === 'A' ? match.playerB : match.playerA;
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_draft_status', ready: false });
        }

        console.log(`[DRAFT] Piloto ${client.name} (${side}) cancelou preparação no match ${matchId}.`);
        break;
      }

      // ── DUELO AO MEIO-DIA: CARA OU COROA (ESCOLHA RÁPIDA) ───────
      case 'coin_duel_pick': {
        const { matchId, sideChoice } = msg;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'coin_duel' || !match.coinDuel || match.coinDuel.resolved) break;

        const playerSide = client.side;
        const opponentSide = playerSide === 'A' ? 'B' : 'A';
        const chosen = (sideChoice === 'heads' || sideChoice === 'tails') ? sideChoice : 'heads';
        const other = chosen === 'heads' ? 'tails' : 'heads';

        // O primeiro a enviar garante a sua escolha e define o outro
        match.coinDuel.picks[playerSide] = chosen;
        match.coinDuel.picks[opponentSide] = other;

        console.log(`[COIN_DUEL_PICK] Piloto ${client.name} (${playerSide}) clicou primeiro: ${chosen.toUpperCase()}! (Oponente: ${other.toUpperCase()})`);
        resolveCoinDuel(matchId);
        break;
      }

      // ── SUBMIT TURN (CONFIRMAR JOGADA) ──────────────────────────
      case 'submit_turn': {
        const { matchId, actions } = msg;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'combat') break;

        const side = client.side;
        match.turnActions[side] = actions;
        match.turnReady[side] = true;

        // Confirma localmente e notifica o adversário que o piloto está PRONTO
        send(ws, { type: 'turn_status', ready: true, round: match.round });
        const opponent = side === 'A' ? match.playerB : match.playerA;
        if (opponent && opponent.ws) {
          send(opponent.ws, {
            type: 'opponent_turn_status',
            ready: true,
            round: match.round
          });
        }

        console.log(`[TURN] Piloto ${client.name} (${side}) confirmou jogada no Round ${match.round}.`);

        // O round SÓ EXECUTA quando AMBOS os jogadores tiverem clicado em "CONFIRMAR JOGADA"!
        if (match.turnReady.A && match.turnReady.B) {
          executeRoundClash(matchId);
        }
        break;
      }

      // ── MEDAL UPDATE & VITÓRIA POR 10 MEDALHAS ──────────────────
      case 'medal_update': {
        const { matchId, side, medals } = msg;
        const match = activeMatches.get(matchId);
        if (!match) break;

        match.medals[side] = medals;
        broadcast(matchId, { type: 'medals', medals: match.medals }, ws);

        // Condição de Vitória Imediata: 10 Medalhas alcançadas
        if (match.medals.A >= 10 || match.medals.B >= 10) {
          const winner = match.medals.A >= 10 ? 'A' : 'B';
          console.log(`[VICTORY_MEDALS] Piloto do lado ${winner} atingiu 10 medalhas no match ${matchId}!`);
          broadcast(matchId, {
            type: 'match_ended',
            winner,
            medals: match.medals,
            reason: 'medal_limit'
          });

          const pWin = winner === 'A' ? match.playerA : match.playerB;
          const pLose = winner === 'A' ? match.playerB : match.playerA;
          if (pWin && pLose) {
            recordDuelResult({
              winnerName: pWin.name,
              loserName: pLose.name,
              medals: 10,
              hpPercentRemaining: 70,
              turns: match.round || 3,
              matchId
            }).catch(e => console.error('[VICTORY_MEDALS] Erro ao persistir:', e));
          }

          clearAllMatchTimers(matchId);
          activeMatches.delete(matchId);
        }
        break;
      }

      // â”€â”€ MATCH END â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      // â”€â”€ PING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            msg: client.isHost ? 'O anfitriÃ£o encerrou a sala.' : 'O oponente desconectou.'
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

// ── Iniciar Servidores (Unificado para Nuvem + Suporte a Porta Dedicada) ──────
const mainHttpServer = createServer(app);

// Anexa upgrades do servidor HTTP principal ao WSS
mainHttpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

initSupabase().catch(console.error);
mainHttpServer.listen(PORT, () => {
  const line = '═'.repeat(55);
  console.log('\n' + line);
  if (PVP_MODE) {
    console.log(' [HORTOBOTS] ⚔  MODO PVP ONLINE ATIVO');
    console.log(' [HORTOBOTS] Cada aba = um jogador único');
  } else {
    console.log(' [HORTOBOTS] Modo Padrão (História + PvP)');
  }
  console.log(' [HORTOBOTS] HTTP  → http://localhost:' + PORT);
  console.log(' [HORTOBOTS] WS    → ws://localhost:' + PORT + ' (compartilhado)');
  console.log(line + '\n');
});

mainHttpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n[AVISO] A porta HTTP ' + PORT + ' já está sendo usada por outra instância.');
  } else {
    console.error('[HTTP] Erro:', err.message);
  }
});
