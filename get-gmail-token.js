// get-gmail-token.js — Assistente Interativo de Autenticação Gmail API (OAuth2)
// LangoLabs // RealityClash // Quezas-DOS
import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Leitor simples de .env
function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      env[k] = v;
    }
  }
  return env;
}

// Atualiza chave no .env
function updateEnvKey(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, content, 'utf-8');
}

async function main() {
  console.log('\n=============================================================');
  console.log('  ⚡ REALITYCLASH // GMAIL OAUTH2 TOKEN GENERATOR ⚡');
  console.log('=============================================================\n');

  const env = loadEnv();
  const clientId = (process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    console.error('❌ GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não encontrados no .env!');
    console.error('Preencha essas variáveis no arquivo .env antes de executar este script.');
    process.exit(1);
  }

  const PORT = 3334;
  const redirectUri = `http://localhost:${PORT}/oauth2callback`;
  const scope = 'https://www.googleapis.com/auth/gmail.send';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('📌 Configurações Detectadas:');
  console.log(`   - Client ID: ${clientId.slice(0, 18)}...`);
  console.log(`   - Redirect URI: ${redirectUri}`);
  console.log(`   - Escopo: ${scope} (Envio de e-mails via Gmail REST API)`);
  console.log('\n-------------------------------------------------------------');
  console.log('⚠️ IMPORTANTE: Certifique-se de que a Redirect URI acima está');
  console.log('autorizada no seu Google Cloud Console (APIs & Services > Credentials).');
  console.log('URI autorizada recomendada: http://localhost:3334/oauth2callback');
  console.log('-------------------------------------------------------------\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let server;
  let codeResolved = false;

  async function exchangeCodeForTokens(code) {
    if (codeResolved) return;
    codeResolved = true;

    console.log('\n🔄 Solicitando tokens ao Google OAuth2...');

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const data = await response.json();
      if (!response.ok || !data.refresh_token) {
        console.error('❌ Erro na resposta do Google:', data);
        if (!data.refresh_token && data.access_token) {
          console.warn('⚠️ O Google retornou apenas access_token sem refresh_token.');
          console.warn('Isso ocorre quando o consentimento já foi dado anteriormente.');
          console.warn('Para forçar um novo refresh_token, certifique-se de usar prompt=consent ou revogar o acesso em https://myaccount.google.com/permissions');
        }
        process.exit(1);
      }

      console.log('✅ REFRESH TOKEN OBTIDO COM SUCESSO!');
      console.log(`🔑 Refresh Token: ${data.refresh_token}`);

      // Salva no .env
      updateEnvKey('GMAIL_REFRESH_TOKEN', data.refresh_token);
      console.log('💾 Token salvo automaticamente no seu arquivo .env!');

      // Teste imediato de renovação
      console.log('🧪 Testando renovação imediata de Access Token...');
      const testRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: data.refresh_token,
          grant_type: 'refresh_token',
        }).toString(),
      });
      const testData = await testRes.json();
      if (testRes.ok && testData.access_token) {
        console.log('🎉 SUCESSO TOTAL! A Gmail API está pronta e autenticada.');
      } else {
        console.warn('⚠️ Teste de renovação gerou alerta:', testData);
      }

      console.log('\n=============================================================');
      console.log('📋 PRÓXIMO PASSO (PARA O RENDER.COM):');
      console.log('No dashboard do Render (Environment Variables), adicione:');
      console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
      console.log(`GMAIL_SENDER=${env.GMAIL_SENDER || 'tiagop05gregorio@gmail.com'}`);
      console.log('=============================================================\n');

      setTimeout(() => {
        rl.close();
        if (server) server.close();
        process.exit(0);
      }, 1000);
    } catch (err) {
      console.error('❌ Erro durante a troca de tokens:', err);
      process.exit(1);
    }
  }

  // Cria servidor HTTP local para capturar o callback automaticamente
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname === '/oauth2callback' || reqUrl.pathname === '/' || !reqUrl.pathname) {
      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>❌ Erro na autorização Google: ${error}</h2><p>Você pode fechar esta aba.</p>`);
        console.error(`\n❌ Erro recebido no callback: ${error}`);
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>RealityClash - Autorização Gmail</title></head>
            <body style="background:#05140b;color:#00ff88;font-family:monospace;padding:40px;text-align:center;">
              <h1 style="color:#00e5ff;">[REALITYCLASH] AUTORIZAÇÃO CONCLUÍDA!</h1>
              <p style="font-size:16px;">O código de acesso foi capturado com sucesso pelo terminal.</p>
              <p style="color:#88c5a4;">Você já pode fechar esta janela e voltar ao terminal.</p>
            </body>
          </html>
        `);
        exchangeCodeForTokens(code);
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`🌐 Servidor de captura ouvindo em: http://localhost:${PORT}`);
    console.log('\n👉 URL de Autorização (abra no navegador se não abrir automaticamente):');
    console.log(authUrl.toString());
    console.log('\nTentando abrir no navegador padrão...');

    const startCmd = process.platform === 'win32' ? `start "" "${authUrl.toString()}"` :
                     process.platform === 'darwin' ? `open "${authUrl.toString()}"` :
                     `xdg-open "${authUrl.toString()}"`;

    exec(startCmd, (err) => {
      if (err) {
        console.log('ℹ️ Não foi possível abrir o navegador automaticamente. Copie e cole a URL acima.');
      }
    });

    console.log('\n(Alternativa Manual) Se o redirecionamento automático falhar, copie o "code=" da URL e cole aqui:');
    rl.question('Cole o código de autorização ou a URL completa: ', (answer) => {
      const trimmed = (answer || '').trim();
      if (!trimmed) return;
      let code = trimmed;
      if (trimmed.includes('code=')) {
        try {
          const u = new URL(trimmed.startsWith('http') ? trimmed : `http://localhost?${trimmed}`);
          code = u.searchParams.get('code') || code;
        } catch {
          const match = trimmed.match(/code=([^&]+)/);
          if (match) code = match[1];
        }
      }
      exchangeCodeForTokens(code);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Porta ${PORT} em uso. O servidor automático não pôde subir.`);
      console.log('\n👉 Abra a seguinte URL manualmente no navegador:');
      console.log(authUrl.toString());
      console.log('\nApós autorizar, você será redirecionado. Copie o parâmetro "code=" da URL e cole abaixo:');
      rl.question('Cole o código de autorização: ', (code) => {
        exchangeCodeForTokens(code.trim());
      });
    } else {
      console.error('Erro no servidor:', err);
    }
  });
}

main().catch(console.error);
