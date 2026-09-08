// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// server.js â€” Servidor + WebSocket Multiplayer + API de Contas JSON
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { initSupabase, getAccount, getAccountByEmail, createAccount, updateAccount, deleteAccount, clearAllAccounts, saveMatchResult, getLeaderboard, applyDraftPenalty as supabasePenalty, saveStoryToAccount, getStoryFromAccount } from './data/supabase.js';
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

// ── AUTH 2FA: Início do Registro com Envio de E-mail Real (Gmail) ────────
app.post('/api/auth/register-2fa-start', async (req, res) => {
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

// ── AUTH 2FA: Confirmação do Código e Ativação da Conta ─────────────────
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

// ── AUTH 2FA: Reenviar Código ao Gmail ─────────────────────────────────
app.post('/api/auth/register-2fa-resend', async (req, res) => {
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
    error: 'O cadastro direto sem e-mail foi desativado. É obrigatório registrar com e-mail real do Gmail com verificação de 2 fatores.'
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
app.post('/api/accounts/match-result', (req, res) => {
  const { winnerName, loserName, hpPercentRemaining = 50, turns = 3, medals = 10 } = req.body;
  const accounts = readAccounts();

  const wKey = winnerName ? Object.keys(accounts).find(k => k.toUpperCase() === sanitizeNick(winnerName)) : null;
  const lKey = loserName ? Object.keys(accounts).find(k => k.toUpperCase() === sanitizeNick(loserName)) : null;

  let pointsGained = 0;
  let pointsLost = 0;

  // AtualizaÃ§Ã£o do Vencedor (ganha atÃ© +30 pontos de ranking)
  if (wKey && accounts[wKey]) {
    const w = accounts[wKey];
    w.wins = (w.wins || 0) + 1;
    w.totalMatches = (w.totalMatches || 0) + 1;
    w.totalMedals = (w.totalMedals || 0) + (medals || 10);
    // PontuaÃ§Ã£o condizente com performance: base 18 + atÃ© 12 proporcional ao HP restante = atÃ© 30
    pointsGained = Math.min(30, Math.max(15, Math.round(18 + (Math.min(100, Math.max(0, hpPercentRemaining)) / 100) * 12)));
    w.rankingPoints = Math.min(999, Math.max(0, (w.rankingPoints ?? 0) + pointsGained));
    w.lastSeen = Date.now();
  }

  // AtualizaÃ§Ã£o do Perdedor (perde atÃ© -20 pontos de ranking, mÃ­nimo ZERO)
  if (lKey && accounts[lKey]) {
    const l = accounts[lKey];
    l.losses = (l.losses || 0) + 1;
    l.totalMatches = (l.totalMatches || 0) + 1;
    // Perda entre 10 e 20 pontos
    pointsLost = Math.min(20, Math.max(10, Math.round(16 - (turns > 4 ? 3 : 0))));
    l.rankingPoints = Math.min(999, Math.max(0, (l.rankingPoints ?? 0) - pointsLost)); // MÃNIMO 0
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

// â”€â”€ PvP Match Timers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Aplica penalidade de -10 RP para jogador que nÃ£o deu PREPARADO no draft
async function applyDraftPenalty(clientObj) {
  if (!clientObj || !clientObj.name) return;
  try {
    await supabasePenalty(clientObj.name);
    console.log(`[PENALTY] -10 RP aplicado no Supabase para ${clientObj.name} por AFK no draft.`);
  } catch (err) {
    console.error('[PENALTY] Erro:', err.message);
  }
}

// Inicia o timer de draft (60s) após match_found
function startDraftTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.draftTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'draft') return;

    // Grace period: 5s ocultos, depois encerra

    m.draftGrace = setTimeout(() => {
      const mm = activeMatches.get(matchId);
      if (!mm || mm.phase !== 'draft') return;

      const notReadyA = !mm.draftReady.A;
      const notReadyB = !mm.draftReady.B;

      // Penalidade para quem nÃ£o confirmou
      if (notReadyA) applyDraftPenalty(mm.playerA);
      if (notReadyB) applyDraftPenalty(mm.playerB);

      // Notifica ambos e remove o match
      [mm.playerA, mm.playerB].forEach((p, idx) => {
        const penalized = idx === 0 ? notReadyA : notReadyB;
        if (p && p.ws) {
          send(p.ws, {
            type: 'draft_timeout',
            penalized,
            rpLost: penalized ? 10 : 0,
            msg: penalized
              ? 'VocÃª nÃ£o confirmou sua escalacÃ£o a tempo. -10 RP de penalidade.'
              : 'Seu oponente nÃ£o confirmou a escalacÃ£o. Partida cancelada.'
          });
          p.matchId = null;
          p.side = null;
        }
      });

      clearAllMatchTimers(matchId);
      activeMatches.delete(matchId);
      console.log(`[DRAFT_TIMEOUT] Match ${matchId} cancelado por timeout de draft.`);
    }, 5000);
  }, 60000);

  console.log(`[DRAFT_TIMER] Match ${matchId}: timer de draft de 60s iniciado.`);
}

// Timer por round (30s) â€” servidor envia auto-submit para quem nÃ£o agiu
function startRoundTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  clearTimeout(match.roundTimer);
  match.roundTimer = setTimeout(() => {
    const m = activeMatches.get(matchId);
    if (!m || m.phase !== 'combat') return;

    // Auto-submit 'rest' para quem nÃ£o submeteu ainda
    ['A', 'B'].forEach(side => {
      if (!m.turnReady[side]) {
        const player = side === 'A' ? m.playerA : m.playerB;
        const opponent = side === 'A' ? m.playerB : m.playerA;
        m.turnActions[side] = [{ action: 'rest', auto: true }];
        m.turnReady[side] = true;
        if (player && player.ws) {
          send(player.ws, { type: 'round_auto_submit', side, round: m.round });
        }
        if (opponent && opponent.ws) {
          send(opponent.ws, { type: 'opponent_turn', actions: m.turnActions[side], round: m.round, auto: true });
        }
        console.log(`[ROUND_TIMER] Auto-submit 'rest' para ${side} no match ${matchId}.`);
      }
    });

    // Se ambos submeteram, avanÃ§a o round
    if (m.turnReady.A && m.turnReady.B) {
      m.round++;
      m.turnReady = { A: false, B: false };
      m.turnActions = { A: null, B: null };
      broadcast(matchId, { type: 'round_complete', round: m.round });
    }
  }, 30000);
}

// Match timer global (7 minutos)
function startMatchTimer(matchId) {
  const match = activeMatches.get(matchId);
  if (!match) return;

  match.matchStartTime = Date.now();
  const MATCH_DURATION = 7 * 60 * 1000; // 7 minutos em ms

  // Tick a cada 5s para atualizar HUD dos clientes
  match.matchTimerTick = setInterval(() => {
    const m = activeMatches.get(matchId);
    if (!m) return;
    const elapsed = Date.now() - m.matchStartTime;
    const remaining = Math.max(0, MATCH_DURATION - elapsed);
    broadcast(matchId, { type: 'match_timer_update', remaining, total: MATCH_DURATION });

    if (remaining <= 0) {
      clearInterval(m.matchTimerTick);
      m.matchTimerTick = null;
      // Encerra partida por tempo
      broadcast(matchId, {
        type: 'match_timeout',
        medals: m.medals,
        msg: 'Tempo esgotado! VitÃ³ria por medalhas.'
      });
      clearAllMatchTimers(matchId);
      activeMatches.delete(matchId);
      console.log(`[MATCH_TIMEOUT] Match ${matchId} encerrado por tempo. Medalhas: A=${m.medals.A} B=${m.medals.B}`);
    }
  }, 5000);

  console.log(`[MATCH_TIMER] Match ${matchId}: timer global de 7min iniciado.`);
}

// Limpa todos os timers de um match
function clearAllMatchTimers(matchId) {
  const m = activeMatches.get(matchId);
  if (!m) return;
  if (m.draftTimer)    { clearTimeout(m.draftTimer);    m.draftTimer = null; }
  if (m.draftGrace)   { clearTimeout(m.draftGrace);    m.draftGrace = null; }
  if (m.roundTimer)   { clearTimeout(m.roundTimer);    m.roundTimer = null; }
  if (m.matchTimerTick){ clearInterval(m.matchTimerTick); m.matchTimerTick = null; }
  if (m.coinFlipTimer){ clearTimeout(m.coinFlipTimer); m.coinFlipTimer = null; }
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

      console.log(`[MATCH] Pareamento ranqueado: ${a.name} (${p1.rankingPoints} RP) vs ${b.name} (${p2.rankingPoints} RP) [Diff: ${minDiff}] â€” ${matchId}`);
      i--; // Reajusta Ã­ndice apÃ³s a remoÃ§Ã£o
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
          console.log(`[MATCH] Batalha iniciada da sala ${room.code}: ${room.host.name} vs ${room.guest.name}`);
        }
        break;
      }

      // â”€â”€ SAIR DA SALA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'leave_room': {
        if (client.roomCode) {
          const room = activeRooms.get(client.roomCode);
          if (room) {
            const other = client.isHost ? room.guest : room.host;
            if (other && other.ws) {
              send(other.ws, {
                type: 'opponent_left_room',
                msg: client.isHost ? 'O anfitriÃ£o encerrou a sala.' : 'O oponente saiu da sala.'
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

      // â”€â”€ DRAFT READY (team confirmed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // If both ready â†’ start combat
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

      // â”€â”€ SUBMIT TURN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // If both submitted â†’ advance round
        if (match.turnReady.A && match.turnReady.B) {
          match.round++;
          match.turnReady = { A: false, B: false };
          match.turnActions = { A: null, B: null };
          broadcast(matchId, { type: 'round_complete', round: match.round });
        }
        break;
      }

      // â”€â”€ MEDAL UPDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case 'medal_update': {
        const { matchId, side, medals } = msg;
        const match = activeMatches.get(matchId);
        if (!match) break;
        match.medals[side] = medals;
        broadcast(matchId, { type: 'medals', medals: match.medals }, ws);
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
