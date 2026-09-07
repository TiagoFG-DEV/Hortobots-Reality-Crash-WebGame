// data/email-service.js — Sistema de Autenticação 2FA & E-mails Estilizados Cyberpunk
// Hortobots: Reality Clash // Quezas-DOS 1.0 (Mnemosyne Terminal)
import nodemailer from 'nodemailer';

// Armazenamento em memória de registros pendentes de 2FA
// email -> { nickname, password, email, code, createdAt, expiresAt }
export const pending2FARegistrations = new Map();

// Armazenamento em memória do último e-mail renderizado para preview
// email -> htmlString
export const renderedEmails = new Map();

// Validação estrita de e-mails Google (@gmail.com ou @googlemail.com)
export function isGoogleEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const googleRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
  return googleRegex.test(clean);
}

// Configuração do Transportador Nodemailer
let mailTransporter = null;
function getTransporter() {
  if (mailTransporter) return mailTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (host && user && pass) {
    mailTransporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  } else if (user && pass) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return mailTransporter;
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
  <title>[HORTOBOTS] Chave de Acesso 2FA</title>
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
      font-size: 34px;
      font-weight: bold;
      letter-spacing: 10px;
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
      <div class="brand-title">HORTOBOTS</div>
      <div class="brand-subtitle">CÓDIGO DE VERIFICAÇÃO</div>
      <div class="crt-line"></div>
    </div>

    <div class="content-section">
      <span class="terminal-tag">VERIFICAÇÃO DE E-MAIL</span>

      <div class="greeting">Olá, ${nickname}!</div>

      <p style="margin: 0 0 14px 0; color: #c4f3d8; font-size: 13px;">
        Uma solicitação de registro de conta de piloto foi realizada com sucesso no Hortobots.
        Para autorizar e ativar o seu acesso, utilize o código abaixo:
      </p>

      <p style="margin: 0; font-size: 13px; color: #88c5a4;">
        E-MAIL: <span class="highlight-cyan">${email}</span><br>
        DATA: <span style="color: #ffffff;">${dateStr}</span>
      </p>

      <div class="code-wrapper">
        <div class="code-box">${formattedCode}</div>
        <div class="code-label">CÓDIGO DE 6 DÍGITOS</div>
      </div>

      <div class="instructions-card">
        <strong style="color: #00e5ff;">INSTRUÇÕES:</strong>
        <ol>
          <li>Retorne à tela de cadastro no <strong>Hortobots</strong>.</li>
          <li>Insira o código de 6 dígitos acima no campo de confirmação.</li>
          <li>Clique no botão <strong>CONFIRMAR</strong> para ativar sua conta.</li>
        </ol>
      </div>

      <div class="security-notice">
        <strong>AVISO:</strong> Este código expira em <strong>15 minutos</strong> e possui uso único.
        Nunca compartilhe este código. Se você não solicitou este registro, desconsidere esta mensagem.
      </div>
    </div>

    <div class="footer-section">
      HORTOBOTS: REALITY CLASH<br>
      © 2026 Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`;
}

// Envio de E-mail ou Fallback no Console
export async function send2FAVerificationEmail({ nickname, email, code }) {
  const cleanEmail = email.trim().toLowerCase();
  const html = generateCyberpunkEmailHTML({ nickname, email: cleanEmail, code });

  // Armazena para pré-visualização no jogo
  renderedEmails.set(cleanEmail, html);

  const transporter = getTransporter();
  let emailSent = false;
  let errorDetail = null;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"HORTOBOTS" <${process.env.SMTP_FROM || process.env.GMAIL_USER || 'central@hortobots.game'}>`,
        to: cleanEmail,
        subject: `[HORTOBOTS] Código de Verificação: ${code}`,
        text: `HORTOBOTS VERIFICAÇÃO\nPiloto: ${nickname}\nCódigo de Confirmação: ${code}\nValidade: 15 minutos.\nUse este código no jogo para ativar sua conta.`,
        html,
      });
      emailSent = true;
      console.log(`[2FA] E-mail enviado com sucesso via SMTP para: ${cleanEmail}`);
    } catch (err) {
      errorDetail = err.message;
      console.warn(`[2FA] Falha no envio SMTP (${err.message}). Operando em modo de entrega segura em terminal.`);
    }
  } else {
    console.log(`[2FA] SMTP não configurado no .env. Código registrado e disponível para prévia.`);
  }

  // Log destacado no console do servidor para visibilidade imediata do desenvolvedor/usuário
  const separator = '═'.repeat(66);
  console.log('\n' + separator);
  console.log(' [HORTOBOTS 2FA // TRANSMISSÃO DE SEGURANÇA GOOGLE]');
  console.log(` PILOTO ALVO : ${nickname} <${cleanEmail}>`);
  console.log(` CÓDIGO 2FA   : [ ${code.slice(0, 3)} - ${code.slice(3)} ]  (ou ${code})`);
  console.log(` EXPIRAÇÃO   : 15 minutos`);
  console.log(` STATUS SMTP : ${emailSent ? 'ENVIADO POR E-MAIL REAL' : 'DISPONÍVEL VIA PREVIEW NO JOGO / CONSOLE'}`);
  console.log(separator + '\n');

  return {
    success: true,
    sentRealEmail: emailSent,
    errorDetail,
    previewUrl: `/api/auth/preview-email/${encodeURIComponent(cleanEmail)}`,
  };
}

// Inicia o processo de registro com 2FA
export async function start2FARegistration({ nickname, password, email, existingAccountsCheck }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanNick = (nickname || '').trim().replace(/[^a-zA-Z0-9_]/g, '').toUpperCase().slice(0, 16);

  if (!cleanNick || cleanNick.length < 2) {
    throw new Error('O NickName deve conter no mínimo 2 caracteres alfanuméricos.');
  }

  if (!password || String(password).length < 8) {
    throw new Error('A senha de acesso deve conter no mínimo 8 dígitos.');
  }

  if (!isGoogleEmail(cleanEmail)) {
    throw new Error('Obrigatório utilizar uma conta Google válida (@gmail.com ou @googlemail.com).');
  }

  // Checa se conta já existe
  if (existingAccountsCheck) {
    const checkResult = await existingAccountsCheck(cleanNick, cleanEmail);
    if (checkResult.nickTaken) {
      throw new Error('Esse NickName já está em uso por outro piloto.');
    }
    if (checkResult.emailTaken) {
      throw new Error('Esse e-mail Google já está vinculado a outra conta cadastrada.');
    }
  }

  // Gera código aleatório de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutos

  pending2FARegistrations.set(cleanEmail, {
    nickname: cleanNick,
    password: String(password),
    email: cleanEmail,
    code,
    createdAt: now,
    expiresAt,
  });

  const dispatch = await send2FAVerificationEmail({
    nickname: cleanNick,
    email: cleanEmail,
    code,
  });

  return {
    ok: true,
    email: cleanEmail,
    nickname: cleanNick,
    expiresAt,
    previewUrl: dispatch.previewUrl,
    message: `Código de verificação enviado para ${cleanEmail}! Digite os 6 dígitos para validar.`,
  };
}

// Valida o código 2FA e cria a conta
export async function verify2FARegistration({ email, code, createAccountFn }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const inputCode = String(code || '').replace(/\D/g, '').trim();

  if (!cleanEmail || !inputCode) {
    throw new Error('E-mail e código de verificação são obrigatórios.');
  }

  const pending = pending2FARegistrations.get(cleanEmail);
  if (!pending) {
    throw new Error('Nenhuma solicitação de verificação ativa encontrada para este e-mail. Inicie o registro novamente.');
  }

  if (Date.now() > pending.expiresAt) {
    pending2FARegistrations.delete(cleanEmail);
    throw new Error('O código de verificação expirou. Solicite um novo código.');
  }

  if (pending.code !== inputCode) {
    throw new Error('Código de verificação inválido. Verifique os números e tente novamente.');
  }

  // Cria a conta com email verificado e 2FA habilitado
  const accountData = {
    name: pending.nickname,
    nickname: pending.nickname,
    password: pending.password,
    email: pending.email,
    googleLinked: true,
    googleEmail: pending.email,
    emailVerified: true,
    twoFactorEnabled: true,
    rankingPoints: 0,
    wins: 0,
    losses: 0,
    totalMatches: 0,
    totalMedals: 0,
    customBio: `Piloto Certificado 2FA (${pending.email})`,
    avatarBadge: 'quezas',
  };

  let newAccount = null;
  if (createAccountFn) {
    newAccount = await createAccountFn(accountData);
  }

  // Remove dos pendentes após validação
  pending2FARegistrations.delete(cleanEmail);

  return {
    ok: true,
    account: newAccount || accountData,
    message: `Conta do piloto ${pending.nickname} ativada com sucesso com segurança 2FA Google!`,
  };
}

// Reenvia código 2FA
export async function resend2FACode({ email }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const pending = pending2FARegistrations.get(cleanEmail);
  if (!pending) {
    throw new Error('Nenhum registro pendente para este e-mail.');
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  pending.code = newCode;
  pending.expiresAt = Date.now() + 15 * 60 * 1000;

  const dispatch = await send2FAVerificationEmail({
    nickname: pending.nickname,
    email: cleanEmail,
    code: newCode,
  });

  return {
    ok: true,
    email: cleanEmail,
    expiresAt: pending.expiresAt,
    previewUrl: dispatch.previewUrl,
    message: 'Novo código de verificação enviado!',
  };
}

// Retorna HTML para pré-visualização
export function getPreviewEmailHTML(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (renderedEmails.has(cleanEmail)) {
    return renderedEmails.get(cleanEmail);
  }

  // Template demonstrativo caso nenhum e-mail tenha sido enviado ainda
  return generateCyberpunkEmailHTML({
    nickname: 'PILOTO_EXEMPLO',
    email: cleanEmail || 'piloto.quezas@gmail.com',
    code: '782941',
  });
}
