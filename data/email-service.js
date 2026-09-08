// data/email-service.js — Sistema de Validação de Contas & E-mails Estilizados Cyberpunk
// LangoLabs // RealityClash // Quezas-DOS 1.0
// Armazenamento em memória de registros pendentes de validação
export const pending2FARegistrations = new Map();

// Proteção contra Overload e Concorrência Simultânea
const inFlightEmails = new Set();
const emailLastSentAt = new Map();

// Limpeza automática periódica de memória a cada 3 minutos
if (typeof setInterval === 'function') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [em, entry] of pending2FARegistrations.entries()) {
      if (now > entry.expiresAt) pending2FARegistrations.delete(em);
    }
    for (const [em, time] of emailLastSentAt.entries()) {
      if (now - time > 60000) emailLastSentAt.delete(em);
    }
  }, 3 * 60 * 1000);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

// Validação estrita de e-mails Google (@gmail.com ou @googlemail.com)
export function isGoogleEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const googleRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
  return googleRegex.test(clean);
}

// Gerador de Template HTML Estilizado Cyberpunk CRT
export function generateCyberpunkEmailHTML({ nickname, email, code }) {
  const formattedCode = String(code).trim();
  const dateStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[RealityClash] Código de Validação de Conta</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020704;
      font-family: 'Consolas', 'Courier New', Courier, Monaco, monospace;
      color: #00ff88;
    }
    table {
      border-collapse: collapse;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #05140b;
      border: 1px solid #00ff88;
      box-shadow: 0 0 25px rgba(0, 255, 136, 0.25);
    }
    .header-banner {
      background: linear-gradient(180deg, #071f11 0%, #030c07 100%);
      border-bottom: 2px solid #00ff88;
      padding: 24px 20px;
      text-align: center;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #00ff88;
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.7);
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #00e5ff;
      text-transform: uppercase;
      margin: 0;
    }
    .crt-line {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #00ff88 50%, transparent 100%);
      margin: 12px auto;
      opacity: 0.7;
    }
    .content-section {
      padding: 24px 24px;
      line-height: 1.6;
    }
    .terminal-tag {
      display: inline-block;
      background: #002914;
      border: 1px solid #00ff88;
      color: #00ff88;
      font-size: 11px;
      padding: 3px 8px;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .greeting {
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .highlight-cyan {
      color: #00e5ff;
      font-weight: bold;
    }
    .code-wrapper {
      margin: 28px 0;
      text-align: center;
    }
    .code-box {
      display: inline-block;
      background-color: #001a0d;
      border: 2px dashed #00ff88;
      border-radius: 4px;
      padding: 16px 32px;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 14px;
      color: #00ff88;
      text-shadow: 0 0 16px rgba(0, 255, 136, 0.8), 0 0 30px rgba(0, 255, 136, 0.4);
      box-shadow: inset 0 0 15px rgba(0, 255, 136, 0.15);
    }
    .code-label {
      font-size: 11px;
      color: #88c5a4;
      letter-spacing: 2px;
      margin-top: 8px;
      text-transform: uppercase;
    }
    .instructions-card {
      background-color: #07190e;
      border-left: 3px solid #00e5ff;
      padding: 14px 16px;
      margin: 20px 0;
      font-size: 12px;
      color: #a3e6c3;
    }
    .instructions-card ol {
      margin: 6px 0 0 18px;
      padding: 0;
    }
    .instructions-card li {
      margin-bottom: 4px;
    }
    .security-notice {
      font-size: 11px;
      color: #ffaa00;
      border: 1px solid rgba(255, 170, 0, 0.4);
      background: rgba(255, 170, 0, 0.05);
      padding: 10px 14px;
      border-radius: 2px;
      margin-top: 20px;
    }
    .footer-section {
      background-color: #030b06;
      border-top: 1px solid rgba(0, 255, 136, 0.3);
      padding: 16px 20px;
      text-align: center;
      font-size: 10px;
      color: #55876c;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-banner">
      <div class="brand-title">LANGOLABS</div>
      <div class="brand-subtitle">REALITYCLASH // VALIDAÇÃO DE CONTA</div>
      <div class="crt-line"></div>
    </div>

    <div class="content-section">
      <span class="terminal-tag">CÓDIGO DE ATIVAÇÃO</span>

      <div class="greeting">Olá, ${nickname}!</div>

      <p style="margin: 0 0 14px 0; color: #c4f3d8; font-size: 13px;">
        Uma solicitação de registro de piloto foi iniciada no <strong>RealityClash</strong>.
        Para validar o seu e-mail e ativar a sua conta, utilize o código de 4 dígitos abaixo:
      </p>

      <p style="margin: 0; font-size: 13px; color: #88c5a4;">
        E-MAIL: <span class="highlight-cyan">${email}</span><br>
        DATA: <span style="color: #ffffff;">${dateStr}</span>
      </p>

      <div class="code-wrapper">
        <div class="code-box">${formattedCode}</div>
        <div class="code-label">CÓDIGO DE 4 DÍGITOS</div>
      </div>

      <div class="instructions-card">
        <strong style="color: #00e5ff;">INSTRUÇÕES:</strong>
        <ol>
          <li>Retorne à tela de validação no <strong>RealityClash</strong>.</li>
          <li>Insira o código de 4 dígitos acima no campo de confirmação.</li>
          <li>Clique no botão <strong>CONFIRMAR CÓDIGO</strong> para ativar sua conta.</li>
        </ol>
      </div>

      <div class="security-notice">
        <strong>AVISO:</strong> Este código expira em <strong>15 minutos</strong> e possui uso único.
        Nunca compartilhe este código. Se você não solicitou este registro, desconsidere esta mensagem.
      </div>
    </div>

    <div class="footer-section">
      LANGOLABS // REALITYCLASH<br>
      © 2026 Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`;
}

// ── Gerenciamento Inteligente de Access Token Gmail OAuth2 (com cache em memória) ──
let cachedGmailAccessToken = null;
let cachedGmailAccessTokenExpiresAt = 0;

/**
 * Obtém um Access Token válido utilizando o Refresh Token do Google OAuth2
 */
async function getGmailAccessToken() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Credenciais da Gmail API incompletas no arquivo .env (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GMAIL_REFRESH_TOKEN).');
  }

  // Verifica se o token em cache ainda é válido (com margem de 60 segundos)
  const now = Date.now();
  if (cachedGmailAccessToken && now < (cachedGmailAccessTokenExpiresAt - 60000)) {
    return cachedGmailAccessToken;
  }

  // Renova o token de acesso via oauth2.googleapis.com
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const detail = data.error_description || data.error || JSON.stringify(data);
    throw new Error(`Falha ao obter Access Token OAuth2 do Google: ${detail}`);
  }

  cachedGmailAccessToken = data.access_token;
  const expiresInMs = (data.expires_in || 3600) * 1000;
  cachedGmailAccessTokenExpiresAt = now + expiresInMs;

  return cachedGmailAccessToken;
}

/**
 * Converte a mensagem em formato RFC 2822 oficial e codifica em base64url para a Gmail REST API
 */
function buildRFC2822Email({ from, to, subject, html }) {
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const base64Body = Buffer.from(html, 'utf-8').toString('base64');
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body,
  ];
  const rfc2822String = lines.join('\r\n');
  return Buffer.from(rfc2822String, 'utf-8').toString('base64url');
}

// Envio de E-mail Real via Gmail REST API (HTTPS / Porta 443 liberada no Render)
export async function send2FAVerificationEmail({ nickname, email, code }) {
  const cleanEmail = email.trim().toLowerCase();
  const html = generateCyberpunkEmailHTML({ nickname, email: cleanEmail, code });
  const senderEmail = (process.env.GMAIL_SENDER || 'tiagop05gregorio@gmail.com').trim().toLowerCase();
  const fromHeader = `LangoLabs <${senderEmail}>`;
  const subject = `[RealityClash] Código de Validação: ${code}`;

  try {
    const accessToken = await getGmailAccessToken();
    const raw = buildRFC2822Email({
      from: fromHeader,
      to: cleanEmail,
      subject,
      html,
    });

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(10000), // Timeout rígido de 10s
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.error?.message || JSON.stringify(data);
      throw new Error(`Gmail API [${response.status}]: ${errMsg}`);
    }

    console.log(`[VALIDAÇÃO] ✅ E-mail enviado com sucesso via Gmail REST API para: ${cleanEmail}`);
    return {
      success: true,
      sentRealEmail: true,
      terminalFallback: false,
      message: `Código de verificação enviado para o seu e-mail (${cleanEmail}). Verifique sua caixa de entrada.`
    };
  } catch (err) {
    console.warn(`[VALIDAÇÃO] ⚠️ Falha ou cota diária excedida ao enviar e-mail via Gmail (${cleanEmail}):`, err.message);
    console.warn(`[VALIDAÇÃO] 🔑 CÓDIGO DE SEGURANÇA PARA [${nickname}] (${cleanEmail}): >>> ${code} <<<`);

    // Opção A: Fallback resiliente com aviso de cota diária excedida
    return {
      success: true,
      sentRealEmail: false,
      terminalFallback: true,
      message: 'Cota diária de envio excedida. O código de segurança foi enviado no terminal do servidor.'
    };
  }
}

// Inicia o processo de registro com validação por e-mail
export async function start2FARegistration({ nickname, password, email, birthDate = '', existingAccountsCheck }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanNick = (nickname || '').trim().replace(/[^a-zA-Z0-9_]/g, '').toUpperCase().slice(0, 16);

  if (!cleanNick || cleanNick.length < 2) {
    throw new Error('O NickName deve conter no mínimo 2 caracteres alfanuméricos.');
  }

  if (!password || String(password).length < 8) {
    throw new Error('A senha de acesso deve conter no mínimo 8 dígitos.');
  }

  if (!cleanEmail) {
    throw new Error('O e-mail é obrigatório para envio do código de validação.');
  }

  if (!isGoogleEmail(cleanEmail)) {
    throw new Error('Obrigatório utilizar um e-mail Google válido (@gmail.com ou @googlemail.com).');
  }

  // 1. Proteção de Concorrência: In-Flight Mutex por E-mail
  if (inFlightEmails.has(cleanEmail)) {
    throw new Error('Já existe uma validação em andamento para este e-mail. Aguarde alguns instantes.');
  }

  // 2. Proteção contra Overload: Cooldown de 25 segundos
  const lastSent = emailLastSentAt.get(cleanEmail) || 0;
  const elapsed = Date.now() - lastSent;
  if (elapsed < 25000) {
    const waitSec = Math.ceil((25000 - elapsed) / 1000);
    throw new Error(`Aguarde ${waitSec} segundos antes de solicitar um novo código para este e-mail.`);
  }

  // 3. Checa se conta já existe
  if (existingAccountsCheck) {
    const checkResult = await existingAccountsCheck(cleanNick, cleanEmail);
    if (checkResult.nickTaken) {
      throw new Error('Esse NickName já está em uso por outro piloto. Escolha outro NickName.');
    }
    if (checkResult.emailTaken) {
      throw new Error('Esse e-mail já está vinculado a outra conta cadastrada.');
    }
  }

  // 4. Limite de tamanho de memória (máximo 500 registros pendentes simultâneos)
  if (pending2FARegistrations.size > 500) {
    const oldestKey = pending2FARegistrations.keys().next().value;
    if (oldestKey) pending2FARegistrations.delete(oldestKey);
  }

  // 5. Gera código de 4 dígitos
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutos

  inFlightEmails.add(cleanEmail);
  let sendResult = null;
  try {
    pending2FARegistrations.set(cleanEmail, {
      nickname: cleanNick,
      password: String(password),
      email: cleanEmail,
      birthDate: (birthDate || '').trim(),
      code,
      createdAt: now,
      expiresAt,
    });

    sendResult = await send2FAVerificationEmail({
      nickname: cleanNick,
      email: cleanEmail,
      code,
    });

    emailLastSentAt.set(cleanEmail, Date.now());
  } finally {
    inFlightEmails.delete(cleanEmail);
  }

  return {
    ok: true,
    email: cleanEmail,
    nickname: cleanNick,
    expiresAt,
    terminalFallback: !!sendResult?.terminalFallback,
    message: sendResult?.message || `Código de 4 dígitos enviado para ${cleanEmail}! Abra seu e-mail para conferir.`,
  };
}

// Valida o código de 4 dígitos e ativa a conta
export async function verify2FARegistration({ email, code, createAccountFn }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const inputCode = String(code || '').replace(/\D/g, '').trim();

  if (!cleanEmail || !inputCode) {
    throw new Error('E-mail e código de validação são obrigatórios.');
  }

  if (inputCode.length !== 4) {
    throw new Error('O código de validação deve conter exatamente 4 dígitos.');
  }

  const pending = pending2FARegistrations.get(cleanEmail);
  if (!pending) {
    throw new Error('Nenhuma solicitação de validação ativa encontrada para este e-mail. Inicie o cadastro novamente.');
  }

  if (Date.now() > pending.expiresAt) {
    pending2FARegistrations.delete(cleanEmail);
    throw new Error('O código de validação expirou. Solicite um novo código.');
  }

  if (pending.code !== inputCode) {
    throw new Error('Código de validação incorreto. Verifique no seu e-mail e digite os 4 dígitos novamente.');
  }

  // Cria a conta com email verificado
  const accountData = {
    name: pending.nickname,
    nickname: pending.nickname,
    password: pending.password,
    email: pending.email,
    birthDate: pending.birthDate || '',
    googleLinked: true,
    googleEmail: pending.email,
    emailVerified: true,
    twoFactorEnabled: false,
    rankingPoints: 0,
    wins: 0,
    losses: 0,
    totalMatches: 0,
    totalMedals: 0,
    customBio: 'Piloto Certificado RealityClash',
    avatarBadge: 'quezas',
  };

  let newAccount = null;
  if (createAccountFn) {
    newAccount = await createAccountFn(accountData);
  }

  // Remove dos pendentes após validação
  pending2FARegistrations.delete(cleanEmail);
  emailLastSentAt.delete(cleanEmail);

  return {
    ok: true,
    account: newAccount || accountData,
    message: `Conta do piloto ${pending.nickname} ativada com sucesso!`,
  };
}

// Reenvia código de 4 dígitos
export async function resend2FACode({ email }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const pending = pending2FARegistrations.get(cleanEmail);
  if (!pending) {
    throw new Error('Nenhum cadastro pendente para este e-mail.');
  }

  if (inFlightEmails.has(cleanEmail)) {
    throw new Error('Já existe um reenvio em processamento. Aguarde alguns instantes.');
  }

  const lastSent = emailLastSentAt.get(cleanEmail) || 0;
  const elapsed = Date.now() - lastSent;
  if (elapsed < 25000) {
    const waitSec = Math.ceil((25000 - elapsed) / 1000);
    throw new Error(`Aguarde ${waitSec} segundos antes de solicitar um novo código.`);
  }

  const newCode = Math.floor(1000 + Math.random() * 9000).toString();
  pending.code = newCode;
  pending.expiresAt = Date.now() + 15 * 60 * 1000;

  inFlightEmails.add(cleanEmail);
  let sendResult = null;
  try {
    sendResult = await send2FAVerificationEmail({
      nickname: pending.nickname,
      email: cleanEmail,
      code: newCode,
    });
    emailLastSentAt.set(cleanEmail, Date.now());
  } finally {
    inFlightEmails.delete(cleanEmail);
  }

  return {
    ok: true,
    email: cleanEmail,
    expiresAt: pending.expiresAt,
    terminalFallback: !!sendResult?.terminalFallback,
    message: sendResult?.message || 'Novo código de 4 dígitos enviado para o seu e-mail!',
  };
}
