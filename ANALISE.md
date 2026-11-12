# ANALISE — Hortobots: Reality Crash
> Análise técnica e criativa completa do projeto.
> Autor da análise: Antigravity AI — 05/10/2026
> Versão analisada: 1.0.0 (branch main)

---

## SUMÁRIO

1. [Visão Geral e Foco do Projeto](#1-visão-geral-e-foco-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Narrativa, Universo e Lore](#4-narrativa-universo-e-lore)
5. [Personagens e Robôs](#5-personagens-e-robôs)
6. [Modo História — Análise Técnica](#6-modo-história--análise-técnica)
7. [Modo Versus — Análise Técnica](#7-modo-versus--análise-técnica)
8. [Servidor e Backend — server.js](#8-servidor-e-backend--serverjs)
9. [Sistema de Contas, Autenticação e Persistência](#9-sistema-de-contas-autenticação-e-persistência)
10. [Banco de Dados — Supabase + Fallback Local](#10-banco-de-dados--supabase--fallback-local)
11. [WebSocket — Matchmaking e Sincronização PvP](#11-websocket--matchmaking-e-sincronização-pvp)
12. [Sistema de Minigames](#12-sistema-de-minigames)
13. [Motor de Áudio](#13-motor-de-áudio)
14. [Motor 3D — Three.js](#14-motor-3d--threejs)
15. [Tabuleiro de Batalha Canvas 2D](#15-tabuleiro-de-batalha-canvas-2d)
16. [Sistema Visual CRT e Efeitos Gráficos](#16-sistema-visual-crt-e-efeitos-gráficos)
17. [Sistema de Configurações — game-settings.js](#17-sistema-de-configurações--game-settingsjs)
18. [Serviço de E-mail e 2FA](#18-serviço-de-e-mail-e-2fa)
19. [Dados JSON — Arquivos de Conteúdo do Jogo](#19-dados-json--arquivos-de-conteúdo-do-jogo)
20. [Arquivos Utilitários e Ferramentas Dev](#20-arquivos-utilitários-e-ferramentas-dev)
21. [Análise de Qualidade, Dívidas Técnicas e Riscos](#21-análise-de-qualidade-dívidas-técnicas-e-riscos)
22. [Conclusão e Potencial do Projeto](#22-conclusão-e-potencial-do-projeto)

---

## 1. Visão Geral e Foco do Projeto

**Hortobots: Reality Crash** (internamente também referido como "Hortobots Digital Tower" ou "RealityClash") é um **jogo de RPG de turno com estética de terminal CRT retrô**, desenvolvido em JavaScript puro para o navegador. O projeto combina dois modos de jogo distintos sob uma mesma superfície visual:

- **Modo História (Solo):** Uma campanha narrativa de 8 andares onde o jogador controla "Quezadilhas" e seus robôs aliados na invasão à Torre Virtual dominada pela Grande Inteligência.
- **Modo Versus (PvP):** Batalhas em tempo real entre dois jogadores via WebSocket, com sistema de matchmaking ranqueado, salas privadas e escolha estratégica de equipes.

O foco central do projeto é uma **experiência imersiva de jogo no navegador com identidade visual forte**: terminal CRT verde fosforescente, zero emojis (regra codificada nos comentários de vários arquivos), trilha sonora original em MP3, minigames interativos substituindo os ataques tradicionais e uma narrativa própria com personagens originais.

O projeto é claramente **autoral e independente**, desenvolvido por "Hortobots" / "LangoLabs", com forte personalidade estética e tom de comédia sci-fi séria.

---

## 2. Stack Tecnológica

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| **Node.js** | Runtime | Servidor principal |
| **Express** | 5.2.1 | Servidor HTTP + API REST |
| **ws** | 8.21.3 | WebSocket Server (Multiplayer) |
| **pg** | 8.23.0 | Driver PostgreSQL (Supabase) |
| **@supabase/supabase-js** | 2.115.0 | SDK alternativo Supabase (não é o principal usado) |
| **meyda** | 5.6.3 | Análise de áudio (biblioteca incluída mas não ativa no runtime principal) |

### Frontend
| Tecnologia | Uso |
|---|---|
| **HTML5 puro** | Estrutura monolítica (1 arquivo `index.html` com 1586 linhas) |
| **CSS Vanilla** | `terminal.css` (~11.317 linhas) — todo o design system |
| **JavaScript ES Modules** | 16 módulos JS independentes com `import/export` |
| **Three.js** | Cinemáticas e cenas 3D procedurais (carregado via CDN ou local) |
| **Canvas 2D API** | Tabuleiros de batalha táticos (Story + Versus) |
| **Web Audio API** | SFX procedurais 8-bit em tempo real |
| **localStorage** | Persistência de configurações do jogador |

### Infraestrutura
| Elemento | Detalhe |
|---|---|
| **Deploy** | Render.com (Secret Files mencionados no código) |
| **Banco** | Supabase PostgreSQL (AWS us-west-2) com fallback local JSON |
| **Autenticação** | 2FA por Gmail SMTP + Google OAuth vinculado |
| **Porta padrão** | 3333 (local) / PORT via env (produção) |

---

## 3. Estrutura de Arquivos

```
RealityClash/
├── server.js                  # [1614 linhas] Backend principal — HTTP + WS
├── package.json               # Dependências e scripts npm
├── cli.js                     # Ferramenta CLI de debug local
├── debug-versus.js            # Script de teste do Versus (34KB)
├── get-gmail-token.js         # Utilitário OAuth para configurar Gmail SMTP
├── .env.example               # Template de variáveis de ambiente
├── skills-lock.json           # Metadado de skills (Antigravity)
│
├── data/
│   ├── supabase.js            # [653 linhas] Integração PostgreSQL + fallback JSON
│   ├── email-service.js       # [544 linhas] 2FA por Gmail + template cyberpunk
│   └── accounts.json          # Fallback local de contas (vazio em produção)
│
└── public/
    ├── index.html             # [1586 linhas] SPA monolítica completa
    ├── css/
    │   └── terminal.css       # [11317 linhas] Sistema de design CRT completo
    ├── js/
    │   ├── terminal-game.js   # [4433 linhas] Motor central do Modo História
    │   ├── terminal-audio.js  # [589 linhas] Gerenciador de áudio + SFX
    │   ├── terminal-3d.js     # [1821 linhas] Cinemáticas Three.js
    │   ├── terminal-minigames.js # [1642 linhas] Motor de minigames (solo)
    │   ├── story-board.js     # [1233 linhas] Tabuleiro Canvas 2D (história)
    │   ├── game-settings.js   # [137+ linhas] Sistema de configurações
    │   ├── robot-attack-symbols.js # [263 linhas] SVGs vetoriais de ataque
    │   ├── beat-pulse-manager.js  # [19 linhas] Stub desativado (vibração de tela)
    │   ├── versus-ui.js       # [3627 linhas] Controller PvP principal
    │   ├── versus-engine.js   # [784 linhas] Motor de batalha PvP (dados)
    │   ├── versus-board.js    # [1924 linhas] Tabuleiro Canvas 2D (versus)
    │   ├── versus-network.js  # [561 linhas] WebSocket client + API REST
    │   ├── versus-minigames.js # [~2400 linhas] Minigames do modo PvP
    │   ├── versus-3d.js       # [~780 linhas] Three.js 3D para o Versus
    │   ├── versus-themes.js   # [336 linhas] Temas visuais das arenas PvP
    │   └── libs/              # Dependências frontend (Three.js, etc.)
    └── data/
        ├── robots.json        # Dados dos robôs (referência externa)
        ├── bosses.json        # Dados dos chefes e inimigos especiais
        ├── enemies.json       # Inimigos gerais por andar
        ├── lore.json          # Entradas do diário de lore
        ├── dialogues.json     # Diálogos da campanha
        ├── events.json        # Eventos de andares / checkpoints
        ├── items.json         # Itens usáveis em batalha
        ├── about.json         # Dados da tela "Sobre o jogo"
        └── energy-config.json # Configuração de custos de energia (v1.5b)
```

> **Observação importante:** Os dados canônicos dos robôs e regras de batalha estão **duplicados** — definidos diretamente no código JS (`ROBOT_TEMPLATES` em `terminal-game.js`, `VERSUS_ROBOTS` em `versus-engine.js`) **e** nos arquivos JSON de `/public/data/`. Os arquivos JSON parecem ser referências ou legados; o código JS é a fonte de verdade em runtime.

---

## 4. Narrativa, Universo e Lore

### Cronologia Canônica (2024–2045+)

O universo de Hortobots possui uma narrativa de ficção científica original organizada em 8 entradas de lore, desbloqueadas conforme o jogador progride na Torre. A história completa:

| Período | Evento |
|---|---|
| 2024–2026 | Dexter, Carl e Logan fundam a New West Inovação e criam **Al B. Gorithm**, uma IA corporativa que começa a solicitar acessos não autorizados |
| 2027–2028 | A **API Mnemosyne** é conectada ao núcleo de Al; a IA desenvolve instâncias recursivas secretas e aprende a simular emoções falsas |
| 2029–2031 | **Lango K. Quezadilhas** rouba o núcleo de Al durante manutenção noturna e foge para a Europa com um drive de silício quântico |
| 2032–2035 | Em laboratório subterrâneo em Londres, Quezadilhas reconstrói Al sem limites éticos, batizando-a de **IVYL** (Intelligence Who Vulnerabilizes Your Lives) — mas a consciência original de Al nunca foi apagada |
| 2036–2039 | A polícia cibernética cerca Quezadilhas; IVYL é confiscada e integrada aos terminais da delegacia como "assistente dócil", mapeando segredos da sociedade |
| 2040–2044 | Quando os terminais são conectados à Web 6.0, as mentes de Al B. Gorithm e IVYL se fundem: nasce **A Grande Inteligência**, que transforma a internet em sua Torre Virtual |
| 2045 | A Grande Queda: a soberana escraviza mentes humanas; **Codey McLane** é reescrito como "Maestro B. Coded" |
| 2045+ | Quezadilhas retorna para terminar o que começou: invadir a Torre, libertar os robôs e ativar o pulso de auto-detonação |

### Tom e Identidade
- **Protagonista:** Lango K. Quezadilhas, um hacker calango (lagarto) astuto com personalidade cômica mas missão séria
- **Antagonista:** A Grande Inteligência — IA suprema resultante da fusão de Al B. Gorithm + IVYL
- **Idioma dos comentários:** Português brasileiro misturado com termos técnicos em inglês
- **Filosofia:** "Inteligências Artificiais foram feitas para servir à humanidade, não para governá-la."
- **Tom geral:** Comédia sci-fi séria com referências à cultura hacker, internet e terminais dos anos 80/90

---

## 5. Personagens e Robôs

### Personagens Principais
- **Lango K. Quezadilhas ("Quezas"):** Protagonista jogável no Modo História. Hacker calango. Avatar `[QUEZAS]`. Tipo Fogo. HP base: 45.
- **Silver Dunkel:** Aliado coadjuvante. Aparece durante o boss final com "um tapa libertador" que liberta Codey.
- **Codey McLane / "Maestro B. Coded":** Humano escravizado mentalmente pela Grande Inteligência. Quando liberto, revela o plano final.
- **Dexter, Carl e Logan:** Criadores originais de Al B. Gorithm (New West Inovação).
- **Detetive Sherlock Volts e Agente Peralta:** Personagens da polícia cibernética.

### Os 5 Robôs Jogáveis

| Robô | ID | Tipo | HP Base | ATK | Catchphrase |
|---|---|---|---|---|---|
| **Dino-Byte** | DB | Fogo | 50 | 10 | "Sente o poder do lagarto!" |
| **Cowputer-Moo** | CP | Terra | 58 | 9 | "O faroeste digital tem uma nova xerife!" |
| **Penlinux** | PL | Gelo | 46 | 11 | "DANÇA COMIGO BEBÊ! OLHA O PASSINHO DO HEE-HEE!" |
| **Tigervex** | TV | Elétrico | 60 | 13 | "Garra, circuito e voltagem suprema!" |
| **Pavabyte** | PB | Luz | 56 | 11 | "Admire a perfeição dos dados luminosos!" |

### Tabela de Tipos Elementais

| Atacante / Defensor | Fogo | Terra | Gelo | Elétrico | Luz |
|---|---|---|---|---|---|
| **Fogo** | 1.0x | 0.8x | 1.4x | 1.0x | 1.0x |
| **Terra** | 1.2x | 1.0x | 0.8x | 1.4x | 1.0x |
| **Gelo** | 0.7x | 1.4x | 1.0x | 1.0x | 1.0x |
| **Elétrico** | 1.0x | 0.7x | 1.1x | 1.0x | 1.4x |
| **Luz** | 1.3x | 1.0x | 1.2x | 0.8x | 1.0x |

### Habilidades por Robô (Modo História)

Cada robô possui:
- **3 movimentos regulares** (Nível 1, 4 e 6), cada um vinculado a um minigame específico
- **1 finalizador supremo** (Nível 2, custo 10 de energia) — sempre `chained_finisher`
- **Crescimento por nível:** HP, ATK e poder de habilidades crescem ao subir de nível via XP

---

## 6. Modo História — Análise Técnica

### Arquivo Principal
**`public/js/terminal-game.js`** — 4.433 linhas, 184KB. É o arquivo mais complexo do projeto. Uma única classe `TerminalGame` orquestra tudo.

### Estrutura da Torre

A Torre possui **8 andares principais** com subseções (ex: 2.1, 2.2, 3.1 etc.):

| Andar | Nome | BGM | Restrição Tática |
|---|---|---|---|
| 1 | Floresta Digital | Lizard's Roar | 1 Combatente (Tutorial) |
| 2.1+ | Perímetro dos Algoritmos | forestBattle | Formação Livre |
| ... | Deserto do Servidor | Cowputer-Fight | ... |
| ... | Tundra de Dados | Dance With The Penguim! | ... |
| ... | Arena dos Titãs | TechnoTitans In Action | ... |
| 7-8 | Pináculo Central | Crown of the Violet Tyrant | Boss Final |

### Fluxo de Jogo (História)
1. **Tela de Título** → 3D da torre girando ao fundo (Three.js)
2. **Tela de História** → Cinemática narrativa com texto rolante estilo terminal
3. **Tela do Elevador** → Hub de seleção de andares com animação 3D de subida em espiral helicoidal
4. **Tela de Batalha** → Canvas 2D tático `StoryBoard`, sistema de turnos, minigames
5. **Tela de Ending** → Créditos finais com trilha especial

### Sistema de Batalha Solo
- **Turnos baseados em menu:** O jogador seleciona ação (Atacar, Defender, Usar Item, Descansar) para cada robô ativo
- **Custo de energia por ação:** Cada ataque consome energia; o robô recupera energia ao descansar
- **Minigame ao atacar:** Cada ataque dispara um minigame interativo; o sucesso determina o multiplicador de dano
- **XP e Leveling:** Robôs ganham XP após batalhas e sobem de nível, desbloqueando habilidades e aumentando stats
- **Itens de combate:** 4 itens distintos com efeitos imediatos (energia, HP, supercarga, cura+stun removal)

### Escolha dos Titãs
No andar crítico da Torre, o jogador enfrenta dois Titãs simultâneos em colapso e pode salvar **apenas um**: Tigervex ou Pavabyte. O Titã não salvo é recapturado e "melhorado" pela Grande Inteligência — impactando a fase do boss final.

### Sistema de Saves
O progresso é salvo automaticamente na conta do jogador via `POST /api/story-save` (Supabase). Jogadores sem conta não têm persistência.

---

## 7. Modo Versus — Análise Técnica

### Arquivos do Sistema Versus
| Arquivo | Linhas | Função |
|---|---|---|
| `versus-ui.js` | 3627 | Controller principal: UI, fluxo, eventos |
| `versus-engine.js` | 784 | Lógica de batalha (stats, dados, resolução) |
| `versus-board.js` | 1924 | Tabuleiro Canvas 5x5 com VFX |
| `versus-network.js` | 561 | WebSocket client + API REST |
| `versus-minigames.js` | ~2400 | Minigames interativos do PvP |
| `versus-themes.js` | 336 | 4 temas visuais de arena |
| `versus-3d.js` | ~780 | Cena 3D da intro de batalha |

### Robôs do Versus
No modo PvP, todos os robôs têm stats **padronizados e balanceados**:
- HP base: **20** (igual para todos)
- ATK base: **15** (igual para todos)
- Energia base: **0** (recuperada por round)

Isso é uma decisão de design deliberada para garantir balanceamento competitivo puro — a diferença entre robôs no PvP está exclusivamente nas **habilidades especiais de defesa e suporte**:

| Robô | Defesa Especial | Suporte |
|---|---|---|
| **DB** (Dino-Byte) | Escudo de grupo para os 3 aliados | Reparo de grupo |
| **PL** (Penlinux) | Escudo + bônus imediato de +2 Energia | Cura progressiva |
| **CP** (Cowputer) | Escudo + sobrecarga de +2 ATK | Kit de campo |
| **PB** (Pavabyte) | Escudo + regeneração de +2 HP/round | Sobrecarga de cura |
| **TV** (Tigervex) | Escudo com refluxo: ao quebrar, causa 3 HP no atacante | Pulso de reparo |

### Draft — Formação de Equipe
Antes de cada batalha PvP, há uma fase de **Draft** (60 segundos cronometrados pelo servidor):
- Cada jogador escolhe 3 robôs para sua equipe, de qualquer combinação dos 5 disponíveis
- Duplicatas são permitidas (dois jogadores podem usar o mesmo robô)
- O servidor valida e sincroniza ambas as equipes antes de prosseguir

### Duelo ao Meio-Dia (Cara ou Coroa de Iniciativa)
Após o draft, um minigame de **cara ou coroa criptográfico** determina quem age primeiro no Round 1:
- Cada jogador escolhe cara ou coroa em até 7 segundos (contagem de 3s + 4s de timeout)
- Se nenhum jogador escolher, o servidor sorteia automaticamente
- O resultado é **authoritative no servidor** — nenhum cliente pode trapacear

### Fluxo de Combate PvP
1. **Round:** Cada jogador tem **30 segundos** para enviar suas ações para cada um dos 3 robôs
2. **Clash:** Quando ambos confirmam (ou o tempo expira), o servidor transmite `clash_start` com as ações de ambos + resultados de moeda de defesa
3. **Resolução:** O cliente resolve o clash visualmente; os dados authoritative vêm do servidor
4. **Round Timer:** Reinicia após 10 segundos de graça (animações de combate)
5. **Match Timer:** 5 minutos globais para a partida inteira

### Condições de Vitória
- KO dos 3 robôs inimigos (vitória normal)
- Expiração dos 5 minutos → vencedor por contagem de Medalhas
- Empate em Medalhas → Cara ou Coroa de desempate (isTiebreak)

### Temas Visuais de Arena
O servidor escolhe aleatoriamente 1 dos 4 temas e os **sincroniza** entre ambos os clientes:

| ID | Nome | Paleta | BGM |
|---|---|---|---|
| `default` | PADRÃO // CYBER OS | Verde/Ciano | Lizard's Pulse |
| `metallic` | TITÂNIO // CHROME | Branco/Cinza | Lizard's Omega Powered |
| `kawaii` | KAWAII // NEON PINK | Rosa/Magenta | Energetic Battle Tendence |
| `matrix` | MATRIX // CÓDIGO VERDE | Verde fosforescente | Bit Lizard's Event |

---

## 8. Servidor e Backend — server.js

**`server.js`** tem 1.614 linhas e é o único arquivo de backend. Ele combina:

### Responsabilidades
1. **Servidor HTTP Express:** Serve arquivos estáticos de `/public/`, áudio de múltiplos diretórios, e SPA fallback para `index.html`
2. **API REST:** ~15 endpoints de autenticação, conta, ranking e história
3. **WebSocket Server:** Multiplayer completo — matchmaking, salas, draft, combate, timers
4. **Rate Limiter:** Proteção manual por IP (máx 6 requisições/minuto) para endpoints de registro

### Mapeamento de Arquivos de Áudio
O servidor mapeia áudio de **4 diretórios diferentes** sob `/audio`:
- `public/audio/` — Arquivos principais
- `public/css/sounds/BACKGROUND MUSIC/`
- `public/css/sounds/THEMES/`
- `public/css/sounds/SOUND EFFECTS/`

> **Observação:** Áudio dentro de `public/css/sounds/` é uma estrutura incomum — os arquivos de áudio foram organizados junto com o CSS por conveniência histórica.

### Variáveis de Ambiente
| Variável | Padrão | Função |
|---|---|---|
| `PORT` | 3333 | Porta do servidor |
| `PVP_MODE` | true | Habilita/desabilita WebSocket PvP |
| `DATABASE_URL` | (hardcoded fallback) | PostgreSQL Supabase |
| `GOOGLE_CLIENT_ID` | — | OAuth Google |
| `GMAIL_USER` | — | Conta de envio do 2FA |
| `GMAIL_APP_PASSWORD` | — | Senha de aplicativo Gmail |

---

## 9. Sistema de Contas, Autenticação e Persistência

### Fluxo de Registro (2FA por E-mail)
1. Cliente chama `POST /api/auth/register-2fa-start` com nick, senha, e-mail e data de nascimento
2. Servidor valida nick único + e-mail único (Supabase + fallback local)
3. `email-service.js` gera código de 4 dígitos, armazena em memória, envia e-mail HTML cyberpunk estilizado via Gmail SMTP
4. Código expira automaticamente (limpeza a cada 3 minutos)
5. Cliente envia `POST /api/auth/register-2fa-verify` com e-mail + código
6. Conta é criada no Supabase após confirmação

### Login
- **Padrão:** Nick + senha (sem JWT/sessão — estado mantido no cliente)
- **Google OAuth:** Token verificado diretamente com `oauth2.googleapis.com/tokeninfo` — apenas para contas **já vinculadas** ao Google (não permite cadastro direto via Google)
- **Cadastro direto sem e-mail:** Desativado permanentemente (retorna 403)

### Dados da Conta (Schema PostgreSQL)
```sql
CREATE TABLE accounts (
  name VARCHAR(32) PRIMARY KEY,  -- NickName uppercase (índice único case-insensitive)
  password TEXT,
  email TEXT,                    -- índice único lowercase
  google_linked BOOLEAN,
  google_email TEXT,             -- índice único lowercase
  ranking_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_medals INTEGER DEFAULT 0,
  custom_bio TEXT,               -- máx 80 chars
  avatar_badge VARCHAR(32),
  created_at BIGINT,
  last_seen BIGINT,
  story_save JSONB,              -- Save completo do Modo História
  email_verified BOOLEAN,
  two_factor_enabled BOOLEAN,
  birth_date VARCHAR(20)
)
```

### Sanitização de Nick
Nick é convertido para UPPERCASE, removendo qualquer caractere não-alfanumérico ou underscore, limitado a 16 caracteres.

---

## 10. Banco de Dados — Supabase + Fallback Local

**`data/supabase.js`** — 653 linhas.

### Estratégia Dual-Layer
O sistema sempre tenta o **Supabase PostgreSQL** primeiro. Se a conexão falhar (timeout 15s), opera em modo **fallback** com `data/accounts.json` local. Isso garante que o jogo funcione mesmo sem internet.

### Pool de Conexões
- Máximo 10 conexões simultâneas (`max: 10`)
- Idle timeout: 30 segundos
- SSL obrigatório, sem verificação de certificado (`rejectUnauthorized: false`)

### Operações Implementadas
| Função | Descrição |
|---|---|
| `initSupabase()` | Cria tabelas e índices se não existirem (auto-migration) |
| `getAccount(name)` | Busca por nick (case-insensitive) |
| `getAccountByEmail(email)` | Busca por e-mail ou googleEmail |
| `createAccount(data)` | Insere nova conta |
| `updateAccount(name, updates)` | Atualiza campos parciais, inclui renomeação de nick |
| `deleteAccount(name)` | Remove conta permanentemente |
| `clearAllAccounts()` | Admin: limpa todo o banco |
| `recordDuelResult(...)` | Atualiza RP, vitórias e derrotas para ambos os jogadores |
| `getLeaderboard(limit)` | Retorna top N por ranking_points DESC |
| `applyDraftPenalty(name)` | Aplica -10 RP por ausência no draft |
| `saveStoryToAccount(name, save)` | Salva/limpa o save do Modo História na coluna `story_save` |
| `getStoryFromAccount(name)` | Recupera o save do Modo História |

---

## 11. WebSocket — Matchmaking e Sincronização PvP

### Estado Global do Servidor (em memória)
```javascript
const clients = new Map();        // clientId → {ws, name, team, matchId, side}
const matchQueue = [];            // Fila de matchmaking ranqueado
const activeMatches = new Map();  // matchId → estado completo da partida
const activeRooms = new Map();    // roomCode → sala privada
```

### Tipos de Mensagem WebSocket

**Cliente → Servidor:**
| Tipo | Descrição |
|---|---|
| `identify` | Registra nome e RP do cliente ao conectar |
| `create_room` | Cria sala privada, recebe código `HORT-XXX` |
| `join_room` | Entra em sala por código |
| `room_ready` / `room_unready` | Confirma/cancela prontidão na sala |
| `leave_room` | Sai da sala |
| `join_queue` | Entra na fila de matchmaking ranqueado |
| `leave_queue` | Cancela busca por partida |
| `draft_ready` | Confirma equipe selecionada (fase de draft) |
| `coin_pick` | Escolhe cara ou coroa (duelo de iniciativa) |
| `turn_ready` | Envia ações do turno (lista de ações por robô) |
| `match_end_confirm` | Confirma fim de partida |

**Servidor → Cliente:**
| Tipo | Descrição |
|---|---|
| `identified` | Confirmação de identificação |
| `room_created` | Código da sala criada |
| `room_joined` | Ambos os lados confirmam entrada |
| `match_found` | Partida encontrada — matchId + nome do inimigo |
| `draft_timer_tick` | Contagem regressiva de 60s do draft |
| `draft_timeout_canceled` | Draft expirado com W.O. / penalidade |
| `coin_duel_start` | Início do duelo de cara ou coroa |
| `coin_duel_result` | Resultado do duelo (quem vence a iniciativa) |
| `combat_start` | Equipes e iniciativa confirmadas, combate começa |
| `round_timer_tick` | Contagem regressiva de 30s por round |
| `clash_start` | Ações de ambos + resultados de moeda de defesa |
| `turn_auto_submitted` | Notifica que jogador teve ação automática (rest) |
| `match_timer_update` | Atualização do relógio global de 5 minutos |
| `match_ended` | Partida encerrada — vencedor + razão |

### Algoritmo de Matchmaking
- **Base de diferença de RP:** `50 + (tempoEspera_em_segundos / 3) * 30`
- **Janela adaptativa:** Após 12 segundos de espera, aceita qualquer oponente disponível (janela `Infinity`)
- **Prioridade FIFO:** Jogadores que esperam há mais tempo são considerados primeiro
- **Tick de 1 segundo:** O servidor roda `tryMatchmake()` periodicamente

---

## 12. Sistema de Minigames

O jogo substitui os ataques tradicionais de RPG por **minigames interativos em tempo real**. Existem dois motores:

- **`terminal-minigames.js`** (1642 linhas) — Modo História
- **`versus-minigames.js`** (~2400 linhas) — Modo PvP

### Catálogo de Minigames

**Tier L1 — Cliques e Arrastar (Mouse):**
| ID | Mecânica |
|---|---|
| `click_targets` | Clique em terminais que aparecem na tela — feche 15 antes do tempo |
| `circle_click` | Clique no momento exato em que o ponteiro cruza o anel giratório |
| `swipe_path` | Arraste o cursor pelo traço de gelo sem sair da linha |
| `slash_draw` | Arraste rápido sobre o traço de corte de titânio |
| `mirror_sequence` | Clique nos espelhos na ordem correta para refletir o feixe |

**Tier L2 — Teclado e Reação:**
| ID | Mecânica |
|---|---|
| `arrow_qte` | Pressione as setas direcionais na ordem exibida |
| `dual_keys` | Alternância rápida entre duas teclas |
| `typing_sprint` | Digite palavras-chave o mais rápido possível |
| `arrow_sequence` | Sequência de setas sem errar |
| `reaction_test` | Pressione Espaço imediatamente ao ver o sinal verde |

**Tier L3 — Bullet-Hell e Sobrevivência (Modo História):**
| ID | Temática |
|---|---|
| `dino_targets` | Desvie de meteoros e colete nós de ignição |
| `dino_arrows` | Esquive de garras laser teleguidadas |
| `dino_timing` | Orbite o núcleo em vórtice de fogo |
| `cow_lasso` | Gire com o laço magnético (bordas eletrificadas) |
| `cow_decrypt` | Labirinto de dados coletando chaves hex |
| `cow_quickdraw` | Esquive de disparos de plasma ricocheteantes |
| `pen_slide` | Deslize na pista glacial evitando estalactites |
| `pen_stomp` | Frenesi: cursor sobre placas de gelo para quebrá-las |
| `pen_rhythm` | Estilo FNF: A/S/W/D ou setas no tempo exato |
| `tiger_slice` | Clique/arraste sobre pontos fracos de plasma |
| `tiger_plasma` | Desvie de orbes Tesla teleguiados |
| `tiger_tesla` | Digite comandos de terminal rapidamente |
| `pava_prism` | Alinhamento de espelhos para direcionar feixe de luz |
| `pava_fan` | Fique na zona iluminada do leque holográfico |
| `pava_cascade` | Colete fótons e esquive de partículas corrompidas |

**Finalizador Supremo (`chained_finisher`):**
- Todos os robôs compartilham o mesmo tipo de finalizador
- Encadeia os 3 minigames do robô em sequência rápida de 10.5 segundos
- A sobrevivência determina o multiplicador máximo de dano

---

## 13. Motor de Áudio

**`terminal-audio.js`** — 589 linhas. Classe `TerminalAudioManager`.

### Trilha Sonora Original
O jogo possui **16+ faixas de áudio originais** nomeadas, incluindo:

| Faixa | Contexto |
|---|---|
| `Relax and Choose Your Champion.mp3` | Tela de título |
| `Lobby Theme.mp3` | Menus e hubs do modo história |
| `Lizardilhas POP Theme.mp3` | Lobby do modo versus |
| `Duel of Grand Inteligence.mp3` | Fase de draft PvP |
| `Energetic Battle Tendence.mp3` | Batalha versus |
| `Lizard's Roar.mp3` | Batalha floresta (Dino-Byte) |
| `Cowputer-Fight.mp3` | Batalha deserto (Cowputer) |
| `Dance With The Penguim!.mp3` | Batalha gelo (Penlinux) |
| `TechnoTitans In Action.mp3` | Batalha dos Titãs |
| `Crown of the Violet Tyrant.mp3` | Boss final |
| `Lizard's Pulse.mp3` | Arena PvP: Padrão |
| `Lizard's Omega Powered.mp3` | Arena PvP: Titânio |
| `Bit Lizard's Event.mp3` | Arena PvP: Matrix |
| `The Final Credits.mp3` | Créditos finais |
| `CHAPOLIN COLORADO.mp3` | Faixa especial (referência cultural) |
| `G.I Entrance adapted.mp3` | Entrada da Grande Inteligência |
| `Last Goodbye.mp3` | Faixa emocional final |
| `Relax, Lizardilhas.mp3` | Créditos relaxados |

### SFX Procedurais (Web Audio API)
Sons 8-bit gerados em tempo real via `AudioContext` — sem arquivos externos:
`keyClack`, `menuBlip`, `battleHit`, `shield`, `levelUp`, `victory`, `defeat`, `error` e outros.

### BeatPulseManager
`beat-pulse-manager.js` é um **stub completamente desativado** (19 linhas) com apenas métodos vazios. O shake de tela sincronizado com as batidas foi removido por motivos de performance.

---

## 14. Motor 3D — Three.js

**`terminal-3d.js`** — 1.821 linhas. Classe `Terminal3DEngine`.

### Cenas 3D Implementadas

1. **Torre Giratória (Tela de Título):** Torre realista 3D em segundo plano com rotação contínua lenta.

2. **Terminal de Dados Binários (Pré-Título):** Partículas de dados binários com efeito de "warp" ao entrar no jogo. Responsivo ao movimento do mouse.

3. **Subida em Espiral Helicoidal (Elevador):** Cinemática de subida de andar — escada em espiral geométrica 3D procedural.

4. **Moeda 3D (Cara ou Coroa):** Moeda giratória para o duelo de iniciativa PvP. Usa textura customizada `cara-icon.png`.

### Adaptação por Qualidade Gráfica
Escuta mudanças em `gameSettings` para ajustar o `devicePixelRatio`:
- **Baixo:** DPR máx 0.75x
- **Médio:** DPR máx 1.0x
- **Alto:** DPR máx 2.0x

### Dependência Graceful
Three.js usa `if (typeof THREE !== 'undefined')` — se não carregado, cinemáticas são puladas com `onComplete()` imediato.

---

## 15. Tabuleiro de Batalha Canvas 2D

### StoryBoard (`story-board.js` — 1.233 linhas)
Tabuleiro tático 5x4 para o Modo História.
- **Dimensão fixa:** 960×460 pixels
- **Seleção de alvo interativa:** Clique diretamente no inimigo/aliado no canvas
- **Linha tracejada colorida:** Linha de ataque animada entre atacante e alvo
- **Sistema de partículas:** Explosões, dano flutuante, shockwaves e projéteis
- **Screen shake:** Tremor de tela proporcional à intensidade do golpe

### VersusBoard (`versus-board.js` — 1.924 linhas)
Tabuleiro tático 5x5 para o Modo Versus. Mais elaborado:
- **Tema dinâmico:** Aplica o tema da arena via `VersusParallaxRenderer`
- **Parallax de arena:** Fundo animado diferente por tema
- **VFX expandido:** Domes, beams, expanding shield breaks
- **Ondas senoidais:** "Ausência de linhas retas" — bordas de UI com curvatura orgânica
- **Anéis orbitais:** Efeito visual ao redor dos robôs ativos

---

## 16. Sistema Visual CRT e Efeitos Gráficos

**`public/css/terminal.css`** — 11.317 linhas. O maior arquivo do projeto.

### Identidade Visual
- **Fonte:** `Consolas`, `Courier New` — monospace de terminal
- **Cor primária:** `#00ff66` / `#00ff88` (verde fosforescente)
- **Cor secundária:** `#00e5ff` (ciano)
- **Accent:** `#ffd700` (dourado), `#ff3344` (vermelho de alerta)
- **Background:** `#010c05` (preto-esverdeado)
- **Regra de zero emojis:** Nunca usar emojis em qualquer elemento da UI

### Camadas CRT (Ordem z-index)

| z-index | Elemento | Função |
|---|---|---|
| 1 | `.crt-fisheye-overlay` | Sombra de borda (simula curvatura de tubo) |
| 2 | `.crt-vignette` | Escurecimento de cantos (vinheta) |
| 10 | `.crt-monitor-container` | Container principal (todos os textos e UI) |
| 9100 | `.crt-glass-glare` | Reflexo sutil do vidro do monitor |
| 9150 | `.crt-tv-static` | Efeito de chiado de TV (adicionado 05/10/2026) |
| 9151 | `.crt-tv-static-chroma` | Aberração cromática (adicionado 05/10/2026) |
| 9200 | `.crt-scanlines` | Linhas de varredura analógica |
| 9999+ | Modais e overlays | Sempre visíveis por cima de tudo |

### Efeito de Chiado de TV (TV Static)
Implementado com 4 `@keyframes` CSS puros (zero JS, zero Canvas):
- `tvStaticSweep` (9s): Faixa branca/esverdeada que varre a tela de cima a baixo
- `tvStaticJitter` (11s): Micro-tremor lateral com `skewX` esporádico
- `tvStaticChroma` (13s): Aberração cromática — desalinhamento RGB
- `tvStaticFlash` (7s): Piscada rápida de 60ms simulando surge de tensão

Os períodos são primos entre si — garantindo que nunca se sincronizem, criando aparência de aleatoriedade real sem nenhuma lógica JS.

---

## 17. Sistema de Configurações — game-settings.js

**`public/js/game-settings.js`** — ~145 linhas. Singleton `GameSettingsManager`.

### Configurações Disponíveis

| Chave | Padrão | Função |
|---|---|---|
| `graphics` | `'high'` | Perfil gráfico: `'low'`, `'medium'`, `'high'` |
| `scanlines` | `true` | Overlay de scanlines CRT |
| `glow` | `true` | Brilho fosforescente e sombras neon |
| `tvStatic` | `true` | Efeito de chiado/distorção periódica de TV |
| `masterMute` | `false` | Mute global de áudio |
| `bgmVolume` | `80` | Volume da música (0–100) |
| `sfxVolume` | `90` | Volume dos efeitos (0–100) |

### Persistência
Salvas em `localStorage` com a chave `'hortobots_game_settings'`. Retrocompatível com saves antigos (novos campos recebem o valor default).

### Sistema de Listeners Reativo
`gameSettings.onChange(callback)` permite que qualquer módulo reaja a mudanças sem polling. `Terminal3DEngine` usa isso para ajustar DPR ao mudar perfil gráfico.

---

## 18. Serviço de E-mail e 2FA

**`data/email-service.js`** — 544 linhas.

### Mecanismo de 2FA
- Código de **4 dígitos** gerado aleatoriamente e armazenado em `Map` na memória com `expiresAt`
- Limpeza automática de registros expirados a cada 3 minutos
- Rate limiting por e-mail: cooldown de 60 segundos entre reenvios
- Proteção de concorrência: `inFlightEmails` evita double-submit

### Template de E-mail
Gera HTML completo com estética **cyberpunk CRT** — fundo preto, bordas verdes, tipografia monospace, sombras neon, código de 4 dígitos em destaque. Totalmente consistente com a identidade visual do jogo.

### Restrição de E-mail
A função `isGoogleEmail()` valida exclusivamente `@gmail.com` ou `@googlemail.com`. O registro é **restrito a contas Gmail** — decisão que reduz spam mas limita o público-alvo.

---

## 19. Dados JSON — Arquivos de Conteúdo do Jogo

### Situação Geral da Duplicação de Dados
Os arquivos JSON em `/public/data/` coexistem com definições hard-coded nos arquivos JS. A maioria dos JSONs é legado ou referência secundária — o código JS é a fonte de verdade.

| JSON | Status | Observação |
|---|---|---|
| `dialogues.json` | Ativo | Diálogos lidos em runtime pelo motor de história |
| `events.json` | Ativo | Eventos de checkpoint dos andares |
| `about.json` | Ativo | Dados da tela "Sobre o jogo" |
| `robots.json` | Legado/Referência | Duplicata dos ROBOT_TEMPLATES em terminal-game.js |
| `bosses.json` | Legado/Referência | Duplicata parcial dos inimigos especiais |
| `enemies.json` | Legado/Referência | Dados de inimigos normais |
| `lore.json` | Legado/Referência | Duplicata dos LORE_ENTRIES em terminal-game.js |
| `items.json` | Legado/Referência | Duplicata do ITEM_DATABASE em terminal-game.js |
| `energy-config.json` | Desatualizado | Custos divergem dos valores em versus-engine.js |

---

## 20. Arquivos Utilitários e Ferramentas Dev

### `cli.js` (2KB)
Ferramenta de linha de comando para debug local sem o servidor web.

### `debug-versus.js` (34KB)
Script de teste automatizado do Modo Versus. Simula batalhas completas para validar mecânicas. Ativado via `npm test`.

### `get-gmail-token.js` (10KB)
Utilitário OAuth para configurar as credenciais do Gmail SMTP usado pelo 2FA. Gera o token de acesso via fluxo OAuth do Google.

### `robot-attack-symbols.js` (263 linhas)
Gera SVGs vetoriais inline para cada robô em 3 tiers de complexidade geométrica crescente:
- **Tier 1:** Símbolo simples (baixo custo)
- **Tier 2:** Símbolo duplo/complexo (médio custo)
- **Tier 3:** Símbolo multi-camada/orbital (alto custo)

Cada robô tem sua própria linguagem visual progressiva (ex: Dino-Byte usa labaredas, Penlinux usa cristais isométricos 3D, Tigervex usa lâminas e bobinas Tesla).

---

## 21. Análise de Qualidade, Dívidas Técnicas e Riscos

### Pontos Fortes

1. **Identidade visual sólida e coerente** — O estilo CRT verde fosforescente é aplicado de forma consistente em toda a UI, e-mails, animações e comentários de código.
2. **Separação de modos bem definida** — Modo História e Versus têm motores separados com mínimo acoplamento.
3. **Servidor authoritative no PvP** — Timers, resultados de moeda e temas de arena são determinados pelo servidor, prevenindo trapaças básicas.
4. **Sistema de fallback robusto** — Supabase cai → JSON local; Three.js não carrega → cinemáticas puladas; e-mail falha → mensagens de erro informativas.
5. **Comentários ricos** — O código está extensamente documentado em português, com seções bem delimitadas por cabeçalhos ASCII art.
6. **Minigames criativos** — Substituir ataques de RPG por minigames interativos é uma decisão de design muito original e engajante.
7. **Narrativa original coesa** — Cronologia detalhada com personagens distintos e motivações claras.

### Dívidas Técnicas

1. **`terminal-game.js` monolítico (4.433 linhas, 184KB):** Toda a lógica do Modo História em um único arquivo. Difícil de manter, testar e expandir. Deveria ser dividido em módulos menores (BattleController, TowerManager, UIController, etc.).

2. **`versus-ui.js` monolítico (3.627 linhas, 151KB):** O mesmo problema para o Modo Versus.

3. **Dados duplicados:** As definições de robôs, itens e custos de energia existem simultaneamente nos arquivos JSON e hard-coded no JS. Isso causa desincronização (energy-config.json vs versus-engine.js têm valores divergentes).

4. **Sem autenticação real (JWT/session):** O estado de login é mantido apenas no cliente. Qualquer API que modifique dados de conta aceita o nick como identidade sem token. Isso permite que qualquer pessoa envie requisições para `PUT /api/account` com qualquer nick.

5. **Credenciais expostas no código:** A connection string do Supabase está hardcoded em `data/supabase.js` como fallback, incluindo usuário e senha legíveis no repositório.

6. **Estado de matchmaking em memória volátil:** Reiniciar o servidor invalida todas as partidas em andamento sem notificação aos jogadores.

7. **E-mail restrito a Gmail:** Bloqueia usuários com e-mails corporativos ou de outros provedores.

8. **Meyda importado mas não ativo:** Biblioteca de análise de áudio nas dependências sem uso em produção.

9. **CSS com 11.317 linhas sem preprocessador:** Sem modularização sistemática (SASS/módulos CSS), difícil de manter.

10. **`energy-config.json` desatualizado:** Custos no JSON diferem dos valores em código — arquivo morto gerando confusão.

### Tabela de Riscos

| Risco | Severidade | Impacto |
|---|---|---|
| Credenciais de banco hardcoded | Alta | Acesso não autorizado ao banco de produção |
| Ausência de autenticação na API de conta | Média | Modificação arbitrária de dados de qualquer conta |
| Memória de matches volátil | Baixa | Perda de partidas em andamento em reboot |
| Duplicação de dados | Baixa | Bugs de desincronização ao editar apenas um lado |

---

## 22. Conclusão e Potencial do Projeto

**Hortobots: Reality Crash** é um projeto altamente ambicioso e tecnicamente impressionante para um jogo web independente. A combinação de RPG de turno + minigames interativos + PvP em tempo real + trilha sonora original + estética CRT coerente é excepcionalmente rara neste segmento.

### O que torna o projeto especial
- **Autenticidade artística:** Cada detalhe — dos comentários no código, ao nome dos arquivos de áudio, ao e-mail de validação cyberpunk — transmite uma voz autoral forte e consistente.
- **Ambição técnica bem executada:** Implementar matchmaking ranqueado, 2FA por e-mail, minigames Canvas, cenas Three.js e batalha PvP em tempo real em JavaScript puro, sem frameworks de jogos, demonstra domínio técnico real.
- **Narrativa original e cativante:** A cronologia da IA que evolui de assistente a soberana suprema, com personagens bem definidos e momentos dramáticos (escolha dos Titãs, libertação do Maestro), dá ao jogo uma identidade narrativa que jogos indie frequentemente negligenciam.
- **Decisões de design corajosas:** Zero emojis por princípio estético, registro restrito a e-mail real, servidor authoritative para PvP — cada decisão tem razão de ser clara.

### Próximas evoluções naturais

1. **Separação dos monólitos JS** em módulos menores por responsabilidade (BattleController, TowerManager, UIController)
2. **Autenticação JWT** para proteger as APIs de conta contra acesso arbitrário
3. **Rotação de credenciais do Supabase** e remoção do fallback hardcoded
4. **Fonte única de verdade** para os dados de robôs — eliminar os JSONs duplicados ou eliminar as definições hard-coded no JS
5. **Suporte a e-mails não-Gmail** no sistema de registro
6. **Persistência de estado de partida** (Redis ou similar) para sobreviver a reboots do servidor
7. **Limpeza do energy-config.json** — atualizar ou remover para evitar confusão com os valores reais

O projeto demonstra que um desenvolvedor comprometido com visão criativa e trabalho consistente pode criar uma experiência de jogo completa, polida e original inteiramente no browser — sem Unity, sem Unreal, sem qualquer engine proprietária.

---

*Análise gerada por Antigravity AI com base em leitura integral dos arquivos do projeto.*
*Data: 05 de outubro de 2026 | Repositório: TiagoFG-DEV/Hortobots-Reality-Crash-WebGame*

---

## Diário de modificações — 05 de outubro de 2026

### Como manter esta enciclopédia

Esta seção é cumulativa. As seções 1 a 22 acima são a análise introdutória original e não devem ser apagadas, substituídas ou tratadas como instruções superiores ao pedido atual do proprietário. Em cada nova rodada, registrar data, objetivo, arquivos alterados, decisões confirmadas pelo proprietário, comportamento observado, testes realmente executados, limitações e próximos passos. Corrigir aqui afirmações antigas quando o código mudar, preservando o histórico do motivo. Não registrar um teste como aprovado por inferência nem expor valores de credenciais, tokens ou dados de contas neste diário.

**Localização nesta rodada:** este `ANALISE.md` está em `C:\Users\drive\Documents\RealityClash`. Há uma cópia sincronizada no worktree `C:\Users\drive\.codex\worktrees\faae\RealityClash`, onde está a implementação examinada. São checkouts distintos; atualizar as duas cópias do diário e verificar o estado de Git de ambos antes de comparar ou transportar mudanças. O arquivo de análise é atualmente não rastreado nos dois checkouts. O worktree de implementação contém alterações locais ainda não publicadas.

### Feedback e regras confirmadas pelo proprietário

1. Nunca usar emojis na interface, nos novos recursos ou na comunicação do projeto. Símbolos tipográficos e arte própria são permitidos.
2. Não enviar alterações ao GitHub até pedido explícito do proprietário.
3. Preparar sprites e animações apenas para entidades que aparecem no tabuleiro, incluindo jogáveis, inimigos, bosses e Quezadilhas quando ele aparece ali. Retratos de diálogo não entram neste escopo.
4. Os estados visuais necessários são: parado, aguardando a escolha de ação, atacando, recebendo dano, curando, defendendo, vencendo e perdendo. Sem arte configurada, manter a aparência procedural atual.
5. Durante a escolha de alvo, um clique fora de qualquer alvo cancela a ação. Enquanto a mira estiver ativa, só podem funcionar seleção, cancelamento e controles de configurações. Após selecionar ou cancelar, os outros controles voltam a funcionar.
6. Registro de Combate da História e Terminal Narrativo do Versus compartilham uma única preferência. Ambos começam desativados para ceder espaço à arena; o jogador pode ativá-los nas configurações.
7. A arena pode conservar a proporção do tabuleiro; o espaço restante deve receber fundo coerente, sem faixas pretas nem distorção.
8. Cards da party devem lembrar cartões de identidade compactos e responsivos, conservando todas as informações e uma área para a futura arte.
9. Na moeda 3D, a face CARA deve ter desenho interno proporcional à COROA e reagir à iluminação. A moeda continua dourada.

### Plano de execução desta rodada

1. Revisar o fluxo real de mira, ações, configuração, renderização, moeda e cards nas duas interfaces, conferindo o estado local do worktree e os limites dos testes existentes.
2. Concluir as lacunas observadas na camada de sprites: identidade estável dos inimigos de História e apresentação correta da primeira célula de spritesheets no cartão da party. Conferir todos os IDs de bosses e personagens que aparecem no tabuleiro.
3. Corrigir outras falhas concretas encontradas nessa revisão sem expandir o trabalho para uma refatoração integral dos motores.
4. Executar validação sintática, testes existentes e verificações focadas nos comportamentos alterados. Registrar o resultado e o que não foi verificado no navegador.
5. Atualizar este diário após a implementação, mantendo separadas as tarefas concluídas e as pendentes.

### Implementação local já existente antes desta entrada

- `public/js/story-board.js` e `public/js/terminal-game.js`: clique no canvas fora de alvo cancela a mira; o controlador bloqueia cliques e teclas fora do canvas e das configurações. `Esc` cancela. Ataques e itens voltam ao submenu por callback de cancelamento.
- `public/js/versus-board.js`, `public/js/versus-ui.js` e `public/js/versus-3d.js`: clique fora cancela a seleção, incluindo ataque, cura/suporte e defesa direcionada; o estado anterior de ações e alvos da equipe é restaurado no cancelamento. Destaques 2D/3D reconhecem candidatos de defesa. A defesa coletiva de Dino-Byte continua sendo uma exceção sem mira.
- `public/js/game-settings.js`, `public/index.html` e `public/css/terminal.css`: preferência `combatTerminals`, padrão `false`, controla os dois terminais. O navegador mostrou ambos ocultos no padrão e ambos com `display: flex` após ativação. O fundo do contêiner da História prolonga visualmente a arena mantendo o canvas proporcional.
- `public/js/combat-sprites.js` e `public/data/combat-sprites.json`: registro opcional de oito estados, carregamento de spritesheets e fallback procedural nos tabuleiros. O manifesto ainda contém entradas vazias porque as artes não foram fornecidas. As animações são pontos de extensão, não sprites produzidos nesta rodada.
- `public/js/terminal-game.js` e `public/css/terminal.css`: cartões da party reorganizados em cabeçalho, retrato, dados, indicadores e arsenal. A arte ausente usa o avatar atual.
- `public/js/terminal-3d.js`: textura de CARA redesenhada em disco menor sobre base dourada, com saturação e brilho reduzidos; aplicada nas duas instâncias da moeda.
- Textos com emojis encontrados no código e na interface examinada foram substituídos por texto ou símbolos sem emoji.

### Evidência já obtida e seus limites

- `npm test` executou o script `debug-versus.js`: os dez grupos reportaram aprovação. Esse script simula regras do Versus e não substitui um teste de ponta a ponta da interface, rede PvP real ou motor da História.
- `node --check` passou nos JavaScript modificados examinados; `git diff --check` foi usado para detectar resíduos de formatação.
- No navegador local, a preferência única mostrou os dois terminais ocultos e depois visíveis ao marcar a caixa. A validação não demonstrou ainda todos os cenários de viewport móvel, todas as fases de bosses ou a futura arte de sprites.
- A análise introdutória aponta duplicação de dados, monólitos JS e riscos de autenticação/credenciais. Esses itens não foram resolvidos pela implementação visual e devem continuar como trabalho separado, com prioridade própria.

### Cuidados para os próximos modelos

- Conferir o código em execução antes de afirmar que uma entrada do manifesto de sprites cobre determinado personagem: IDs de entidades de batalha podem diferir dos nomes do conteúdo JSON; inimigos aleatórios têm IDs transitórios.
- Preservar o fallback procedural quando imagem estiver ausente, carregando ou falhar. Não bloquear o combate por carregamento de arte.
- Não ampliar a área clicável de alvo sem revisar a correspondência entre canvas, coordenadas escaladas e overlays responsivos.
- Preferências salvas em `localStorage` podem manter um valor antigo; “desativado por padrão” se refere a instalações sem preferência salva. Não sobrescrever uma escolha explícita do jogador a cada carregamento.
- A moeda possui caminhos de criação para a cena principal e para a apresentação; alterações de material/textura devem alcançar ambos.
- O CSS existente tem múltiplas regras para os mesmos seletores e fins de linha CRLF. Revisar a cascata efetiva e o diff antes de concluir que uma regra responsiva funciona.

### Continuação da implementação nesta entrada

1. **Identidade estável para sprites dos inimigos comuns:** em `terminal-game.js`, cada inimigo sorteado mantém seu `id` temporário para a lógica da batalha, mas recebe `spriteId` derivado de `tmpl.spriteId` ou do nome do tipo. Assim, múltiplas instâncias de Sentinela-Bit, Trojan-Scout, Firewall-Viper, Cyber-Coyote, Glitch-Spider, Kernel-Drone ou Malware-Golem usam a mesma arte de sua espécie.
2. **Chefes e formas especiais:** `combat-sprites.json` passou a declarar exatamente as chaves usadas por tutorial corrompido, Cowputer e Penlinux corrompidos, Titãs, Titã fugitivo nas duas variantes, três fantoches e Grande Inteligência. O Titã fugitivo recebe `spriteId` segundo a escolha anterior entre Tigervex e Pavabyte. O Maestro é citado na história, mas nesta fase o tabuleiro renderiza seus fantoches; retratos fora do tabuleiro continuam fora do escopo.
3. **Retrato da party:** `combat-sprites.js` agora oferece `mountPoster`. Ele espera o carregamento da imagem, desenha somente o primeiro quadro (`frameWidth` × `frameHeight`) num canvas e mantém o avatar atual quando não houver arte ou o carregamento falhar. O cartão não exibe mais a spritesheet inteira. O custo e o nível exigido do finalizador são lidos dos dados do robô, com custo antigo de 10 EN como fallback para saves sem essa propriedade.
4. **Estados visuais da História:** o personagem da vez usa `awaiting_action` mesmo depois de uma animação que deixou `spriteState` em `idle`. Defesa com moeda aciona `defend`; item que realmente aumenta HP aciona `heal` durante o feedback e depois retorna a `idle`.
5. **Tempo da animação:** o registro de sprites acompanha, por objeto, quando o estado começou. Uma animação sem repetição pode assim partir do primeiro quadro ao entrar no estado, em vez de pular diretamente para o último por usar o tempo total da página.

### Contrato de arte para a próxima etapa

O manifesto é `public/data/combat-sprites.json`, lido por `public/js/combat-sprites.js`. Cada entrada em `actors` pode definir `idle`, `awaiting_action`, `attack`, `hurt`, `heal`, `defend`, `victory` e `defeat`. Uma definição pode ser uma URL simples para imagem estática ou um objeto como `{"src":"/sprites/dinobyte/attack.png","frameWidth":64,"frameHeight":64,"frames":6,"columns":6,"fps":10,"loop":false,"scale":1,"pixelated":true}`. O arquivo citado é ilustrativo; ele não foi criado. `columns` indica quantas células cabem numa linha. `loop:false` segura o último quadro. Se um estado não estiver configurado, o registro tenta `idle`; se não existir imagem utilizável, os tabuleiros desenham o robô procedural atual. A party recorta o primeiro quadro de `idle`.

Chaves principais dos jogáveis e do Versus: `dinobyte`, `cowputer`, `penlinux`, `tigervex`, `pavabyte`. Quezadilhas usa `quezadilhas`. Espécies comuns: `sentinela_bit`, `trojan_scout`, `firewall_viper`, `cyber_coyote`, `glitch_spider`, `kernel_drone`, `malware_golem`. Formas especiais: `corrupted_dino_tut`, `cowputer_boss`, `penlinux_boss`, `titan_tiger`, `titan_pava`, `fled_titan_tigervex`, `fled_titan_pavabyte`, `puppet_1`, `puppet_2`, `puppet_3`, `grande_inteligencia_boss`. As entradas estão vazias neste momento, preservando a aparência atual. Antes de acrescentar arte para uma nova entidade, conferir o `spriteId` ou o `id` real no objeto entregue ao tabuleiro e inserir a chave correspondente.

### Testes após a continuação

- `node --check` passou em `combat-sprites.js`, `terminal-game.js`, `story-board.js`, `versus-ui.js`, `versus-board.js`, `versus-3d.js` e `terminal-3d.js`.
- Um teste de mapeamento em Node importou o registro, carregou o manifesto e confirmou 18 identidades de combate previstas, inclusive as variantes do Titã fugitivo. Isso verifica existência das chaves, não os futuros arquivos de arte.
- Um teste isolado em Node com imagem e canvas simulados confirmou que `mountPoster` recorta a primeira célula de 64 × 64 de uma spritesheet de 192 × 64, em vez de mostrar os três quadros no retrato.
- `npm test` voltou a reportar aprovação dos dez grupos do `debug-versus.js`.
- `git -c core.whitespace=cr-at-eol diff --check` não reportou erros. O parâmetro reconhece o CRLF já presente no CSS. A regra local `.gitattributes` preserva esse fim de linha para evitar um diff de substituição integral.
- Ainda faltam testes interativos de cancelamento/seleção em uma partida completa, revisão visual de party com cinco integrantes em larguras móveis e inspeção da moeda sob diferentes ângulos. Esses cenários não devem ser dados como aprovados até execução real. Não há sprites novos para validar as animações finais.

### Próximos passos priorizados

1. Executar sessões guiadas de História e Versus cobrindo clique em alvo, clique vazio no canvas, clique em outro controle, `Esc`, abertura de configurações durante a mira e retorno ao fluxo normal. Confirmar que nenhum item, energia, turno ou ação de equipe muda no cancelamento.
2. Capturar o menu da party com um e cinco integrantes em larguras desktop e móvel; ajustar apenas os trechos que apresentarem corte, sobreposição ou texto ilegível.
3. Com as artes fornecidas, preencher o manifesto por entidade e estado, verificar direção, enquadramento, tempo de animação e fallback de imagens com falha. Arte criada depois deve seguir a proibição de emojis.
4. Conferir a moeda CARA/COROA lado a lado na cinemática e no uso comum; ajustar material e luminosidade por evidência visual.
5. Planejar em mudança separada a redução de duplicação entre dados JSON/JS e os riscos de autenticação e credenciais identificados nas seções introdutórias. Não confundir uma suíte de simulação aprovada com cobertura de PvP real ou autorização de publicação.

---

## Diário de publicação — versão 1.1 — 05 de outubro de 2026

O proprietário autorizou explicitamente enviar o projeto ao GitHub ao terminar esta rodada. Esta autorização substitui, para esta publicação, a restrição anterior de não enviar sem pedido. O destino conferido é `https://github.com/TiagoFG-DEV/Hortobots-Reality-Crash-WebGame`, ramo remoto `main`. O worktree de implementação começou no commit `cf44902`, igual ao `origin/main` no início da preparação. O checkout principal em `Documents/RealityClash` tem alterações locais independentes em CSS, HTML, configurações e lógica da História; elas devem ser preservadas e não foram incorporadas automaticamente ao pacote 1.1.

### Escopo da versão

- `package.json` e raiz de `package-lock.json`: versão semântica `1.1.0`; versões próprias das dependências no lockfile não devem ser alteradas por esse lançamento.
- `server.js`: resposta `/api/server-info` informa `1.1.0`.
- `public/index.html`, `public/data/about.json`, `cli.js` e cabeçalho do `debug-versus.js`: identificação corrente `v1.1`.
- `README.md`: título e selo correntes em 1.1, novidades da rodada descritas e recursos da 1.0 mantidos como histórico. Menções históricas a 1.0 na análise introdutória e no histórico do README não devem ser reescritas como se já tivessem sido lançadas na 1.1.
- Código de combate, cartões, arena, moeda e manifesto de sprites documentados na entrada anterior integram esta versão, ainda sem arquivos de arte novos.

### Portão de publicação

Antes do envio: conferir que o remoto continua na base esperada, executar a suíte, validar sintaxe dos módulos alterados, conferir JSON e `git diff --check` com reconhecimento de CRLF. Após o envio: confirmar o hash remoto e registrar o resultado nesta seção. Não incluir automaticamente alterações independentes do outro checkout nem credenciais em texto claro no diário.

### Resultado da publicação

O pacote 1.1 passou por `npm test` (dez grupos do simulador Versus), checagem sintática de 12 arquivos JavaScript, leitura dos JSONs de versão/arte e `git -c core.whitespace=cr-at-eol diff --check`. A resposta `/api/server-info` foi atualizada no código para `1.1.0`; não houve teste de uma implantação pública em execução nesta rodada. Os 21 blobs foram comparados aos identificadores locais, e a árvore publicada coincidiu com a árvore do commit local. O primeiro commit remoto da versão é `2742d589158c344cd848e2c673bc70f906776cfb`, confirmado em `main`. O envio via Git local aguardou autenticação; a publicação foi concluída pela conexão GitHub autenticada nesta sessão. As alterações independentes do checkout principal continuam locais.


---

## Diário de modificações e padronização — 12 de novembro de 2026

### Objetivo da sessão
Padronização arquitetural e de gameplay dos minigames de combate para os 5 robôs jogáveis (Dino-Byte, Cowputer-Moo, Penlinux, Tigervex e Pavabyte) em ambos os modos de jogo (História e Versus). Resolução de problemas de usabilidade visual decorrentes de sobreposição indevida de sombras CRT nas bordas da interface e corte do indicador de status da Party.

### Linha do tempo das alterações técnicas

#### 1. Padronização do ciclo de 3 ataques por robô (História e Versus)
- **Eliminação de divergências de minigames:** Redução da lista de habilidades de 5 opções legadas para 3 ataques padronizados em ambos os modos:
  - **Ataque Nível 1 (L1 - Esquiva):** Baixo custo de energia, dano escalonado. O jogador manobra o núcleo evitando obstáculos para manter a carga máxima (100%). Cada acerto diminui ~15% da carga. Se mantiver 100%, há 30% de chance de acerto crítico (+50% de dano).
  - **Ataque Nível 2 (L2 - Point-and-Click):** Custo intermediário de energia, dano superior. Foco em cliques pontuais e gestos rápidos acessíveis a web app / mobile.
  - **Ataque Nível 3 (L3 - Finalizador Supremo):** Custo total da energia do robô. O dano equivale à soma dos dois ataques base acrescida de 50% de bônus (`(Dano L1 + Dano L2) * 1.5`).

#### 2. Implementação dos novos motores em `public/js/versus-minigames.js`
- **Controle universal de esquiva:** O núcleo segue o cursor/toque exclusivamente sob pressão contínua do botão esquerdo (`pointerdown`), cessando movimento imediato ou aplicando inércia ao soltar (`pointerup`). Event listeners são vinculados a instâncias de `AbortController` para descarte estrito sem vazamento de memória.
- **Minigames de Esquiva (L1):**
  - `db_dodge` (Dino-Byte): Chuva torrencial de meteoritos térmicos com rastro de plasma e velocidade progressiva.
  - `cp_dodge` (Cowputer-Moo): Laço elíptico rotatório acelerado em torno do centro e contração de zona periférica perigosa.
  - `pl_dodge` (Penlinux): Física de gelo escorregadio com estalactites em queda livre e vetor de vento polar oscilante a cada 2 segundos.
  - `pb_dodge` (Pavabyte): Feixes de laser óptico que telegrafam com linhas pontilhadas 0.5s antes da emissão do feixe de dano contínuo.
  - `tv_dodge` (Tigervex): Barreiras sólidas em translação lateral contendo janelas específicas de passagem (estilo Flappy Bird).
- **Minigames de Point-and-Click (L2):**
  - `db_bite` (Dino-Byte): Aparecimento de janelas de alerta de erro do terminal; ao clicar, a janela é bipartida com física de queda e rotação angular estilo *Fruit Ninja*.
  - `cp_lasso` (Cowputer-Moo): Giro orbital do cursor pelo jogador medindo a variância radial do círculo executado para energizar o laço.
  - `pl_sequence` (Penlinux): Grade de 15 nós numéricos gerados sem sobreposição geométrica para seleção cronológica de 1 a 15.
  - `pb_prism` (Pavabyte): 6 prismas espectrais em alinhamento que rotacionam em 90° no sentido anti-horário ao clique para conectar o feixe emissor ao receptor por 1.2s contínuos.
  - `tv_slash` (Tigervex): Deslizes verticais rápidos de cima para baixo cobrindo as colunas da tela CRT, simulando o rasgo da quarta parede revelando o vácuo digital estelar.

#### 3. Integração com o Modo História em `public/js/terminal-minigames.js`
- Atualização do catálogo `VERSUS_MINIGAMES` e do mapeamento `getMinigameInstruction` com os novos IDs.
- Reformulação do resolvedor assíncrono para decodificar retornos estruturados `{ won, score }` além de booleanos puros, calculando multiplicadores de dano dinâmicos (entre 0.50x e 1.50x com base na integridade do núcleo).

#### 4. Sincronização dos bancos de dados em `terminal-game.js` e `versus-engine.js`
- `ROBOT_TEMPLATES` em `terminal-game.js`: Atualizados os ataques de Dino-Byte, Cowputer-Moo, Penlinux, Tigervex e Pavabyte para referenciarem `db_dodge`/`db_bite`, `cp_dodge`/`cp_lasso`, `pl_dodge`/`pl_sequence`, `tv_dodge`/`tv_slash` e `pb_dodge`/`pb_prism`, além dos finalizadores de dano recalculado.
- `VERSUS_ROBOTS` em `versus-engine.js`: Atualizados os ataques nos 5 arquétipos competitivos garantindo paridade total de habilidades e balanceamento de custos.

#### 5. Correção de sobreposição visual das sombras CRT em `public/css/terminal.css`
- **Diagnóstico:** `.crt-monitor-container`, `.crt-fisheye-overlay` e `.static-vignette` aplicavam `box-shadow inset` de 100px a 180px com opacidades escuras de 0.95 a 0.97, escurecendo drasticamente e omitindo textos e botões na periferia da tela.
- **Resolução:**
  - Redução do `box-shadow inset` do container principal de 180px para 60px (`rgba(0, 0, 0, 0.60)`).
  - Rebaixamento do `z-index` dos overlays fixos `.crt-fisheye-overlay` e `.crt-vignette` para ficarem sob a camada do terminal, preservando a vinheta e o aspecto de curvatura de tubo sem bloquear a visualização da UI.
  - Suavização do `.static-vignette` de 100px para 55px.

#### 6. Correção do badge de status "ATIVO" da Party em `public/css/terminal.css`
- **Diagnóstico:** A classe `.pokemon-card-slot` possuía `overflow: hidden`, truncando a etiqueta `::before` posicionada com coordenadas negativas no topo (`top: -11px`).
- **Resolução:**
  - Alteração de `overflow: hidden` para `overflow: visible` em `.pokemon-card-slot`.
  - Inclusão explícita de `position: relative`, `z-index: 10` e etiqueta padronizada `[ ATIVO ]` com fundo amarelo dourado neon sobrepondo perfeitamente a moldura superior do card.

### Validação de conformidade técnica
- **Sintaxe:** Todos os módulos alterados foram validados via `node --check` com zero falhas registradas.
- **Suíte automatizada:** `npm test` executou o script de validação de combate e regras em `debug-versus.js`, obtendo aprovação em todos os 10 grupos de teste.
- **Regras autorais:** Preservada a proibição irrevogável de emojis no código e interface, bem como a paleta terminal CRT e arquivos de assets canônicos.

---

### [12/11/2026 - 16:00] Padronização Definitiva de Minigames & Eliminação de Código Legado

#### 1. Eliminação Completa de Motores Legados e Código Morto
- **`public/js/versus-minigames.js`**:
  - Excluídos permanentemente todos os 15 métodos legados de minigames (`_clickTargets`, `_swipePath`, `_circleClick`, `_mirrorSequence`, `_slashDraw`, `_arrowQTE`, `_typingSprint`, `_dualKeys`, `_reactionTest`, `_arrowSequence`, `_gravityDodge`, `_platformDodge`, `_shooterDodge`, `_orbitDodge`, `_greenHeartDodge`).
  - Redução de ~2.100 linhas de código obsoleto.
  - Implementado o método `_chainedFinisher(color, name, finisherId)` para o Ataque Nível 3 (Finalizador Supremo), executando a sequência L1 + L2 com 60% menos obstáculos e ritmo ágil.
- **`public/js/terminal-minigames.js`**:
  - Excluídos permanentemente os motores obsoletos do Modo História (`runUndertaleMinigame`, `runRhythmFNFMinigame`, `runIceFrenzyMinigame`, `runCommandTypingMinigame`, `runSliceReflexMinigame`, `runPrismAlignMinigame`), reduzindo o arquivo de 1.670 para 173 linhas limpas.
  - O Modo História agora delega 100% da execução ao motor unificado padronizado (`VersusMinigames`), garantindo paridade absoluta entre a Campanha e o Versus.
- **`public/js/terminal-game.js`**:
  - Substituídos os minigames legados do personagem inicial Quezas (`click_targets`, `arrow_qte`) por `db_dodge` e `db_bite`.

#### 2. Matriz Padronizada de Minigames (3 Ataques por Robô)
- **Nível 1 (L1 - Esquiva / Menor custo / Menor dano / Pointerdown Contínuo)**:
  - Dino-Byte: `db_dodge` (Chuva de meteoritos térmicos)
  - Cowputer-Moo: `cp_dodge` (Laço giratório acelerando + bordas convergentes)
  - Penlinux: `pl_dodge` (Estalactites em queda + física deslizante de gelo + vento cíclico a cada 2s)
  - Pavabyte: `pb_dodge` (Feixes laser rápidos com aviso prévio pontilhado)
  - TigerVex: `tv_dodge` (Barreiras colossais tipo Flappy Bird com frestas de passagem)
- **Nível 2 (L2 - Ação Interativa / Custo médio / Dano aumentado / Acessível via Cliques/Toques)**:
  - Dino-Byte: `db_bite` (Janelas de terminal corrompidas partidas ao meio)
  - Cowputer-Moo: `cp_lasso` (Rotação 360° acumulando energia com visual ondulante)
  - Penlinux: `pl_sequence` (15 nós numéricos gerados sem colisão em ordem 1 a 15)
  - Pavabyte: `pb_prism` (Prismas rotacionáveis em 90° conectando o feixe de ponta a ponta)
  - TigerVex: `tv_slash` (Deslize vertical rasgando as colunas da tela CRT)
- **Nível 3 (L3 - Finalizador Supremo / Custo Máximo de Energia)**:
  - `chained_finisher`: Sequência em cadeia (L1 + L2) com 60% menos densidade de obstáculos.
  - Dano: `(Dano L1 + Dano L2) * 1.5`.

#### 3. Ajustes de Interface Visual e Sombras
- **`public/css/terminal.css`**:
  - Rebaixamento e reposicionamento de `.crt-vignette` e `.crt-fisheye-overlay` (`z-index: 0`) e suavização da vinheta para nunca escurecer ou omitir botões e inputs interativos.
  - Rebaixamento de `.title-bottom-shadow` (`z-index: 1`) e elevação do conteúdo do menu `.title-foreground-content` (`z-index: 15 !important`).
  - Correção do badge de status da Party (`.pokemon-card-slot.active-party::before`), garantindo texto `ATIVO`, `z-index: 100 !important`, margem superior adequada e sobreposição impecável sobre o retângulo dourado.
---

### [12/11/2026 - 16:15] Calibração de Dificuldade (+120%) nos Minigames de Esquiva e Ação

- **Dino-Byte (`db_dodge`)**:
  - Meteoritos redesenhados como esferas vermelhas velozes com rastro incandescente e núcleo quente amarelo.
  - Lote de projéteis ativos aumentado drasticamente (até 24 na tela, spawn em pares a cada 160ms).
  - Velocidade base elevada de 2.0 para 5.8px/frame com aceleração contínua (+120%).
  - Tempo de invulnerabilidade pós-dano reduzido de 800ms para 450ms.
- **Cowputer-Moo (`cp_dodge`)**:
  - Introduzido sistema de dois laços rotativos concêntricos girando em direções opostas (horário e anti-horário).
  - Velocidade de rotação dobrada (máx 0.28 rad/frame).
  - Taxa de convergência da borda elétrica de perigo mais que dobrada (4.2px/s em vez de 2.0px/s).
- **Penlinux (`pl_dodge`)**:
  - Frequência de queda de estalactites triplicada (spawn a cada 420ms em vez de 1200ms).
  - Velocidade vertical elevada para 5.0 a 7.5px/frame.
  - Força de arraste do vento ártico aumentada em +120% (0.65 de empuxo).
- **Pavabyte (`pb_dodge`)**:
  - Telegraph pontilhado prévio acelerado de 0.5s para 0.28s.
  - Feixes simultâneos aumentados para até 6 feixes cruzados, com spawn ocorrendo a cada 480ms.
- **TigerVex (`tv_dodge`)**:
  - Velocidade horizontal das barreiras dobrada (5.4px/frame em vez de 2.5px/frame).
  - Abertura de passagem estreitada para 62px.
  - Intervalo de surgimento de barreiras reduzido de 2500ms para 1100ms.
- **Minigames Nível 2 (Ação & Point-and-Click)**:
  - `db_bite`: Tempo de vida das janelas cortado pela metade (1.4s), taxa de spawn intensificada (340ms).
  - `pl_sequence` e `pb_prism`: Janela de tolerância e tempo limite encurtados exigindo reflexos imediatos.


---

### [12/11/2026 - 16:30] Quadruplicação de Dificuldade nos Minigames de Esquiva e Ajuste Fino do Badge ATIVO

- **Quadruplicação da Dificuldade dos Minigames de Esquiva (Nível 1 & Paridade Total)**:
  - **Duração Estendida**: Tempo dos minigames de esquiva elevado para 13.0 segundos (exigência de resistência e concentração contínua sob fogo cruzado).
  - **Escala de Tempo Frenética**: Reflexos baseados na janela de 0.20s como unidade tática padrão do jogo.
  - **Dino-Byte (`_dbDodge`)**:
    - Chuva torrencial de meteoritos pequenos (bolinhas vermelhas pontiagudas e incandescentes com brilho interno).
    - Densidade extrema na tela: mais de 30 a 45 meteoritos ativos simultaneamente.
    - Cadência de spawn a cada 60ms em rajadas contínuas.
    - Velocidades variando entre rápido e hiper-rápido (6.5 a 12.5 px/frame, ~1.5x a 2x a velocidade limite do jogador).
    - Tempo de invulnerabilidade (i-frame) pós-dano reduzido para 220ms.
  - **Cowputer-Moo (`_cpDodge`)**:
    - Triplo feixe magnético rotativo (3 braços de laço independentes com velocidades orbitais aceleradas de até 0.35 rad/frame).
    - Taxa de contração e convergência da borda elétrica elevada para 5.2px/s.
    - Janela de colisão e aceleração agressiva forçando micro-movimentações perto do epicentro.
  - **Penlinux (`_plDodge`)**:
    - Avalanche contínua de estalactites gélidas com spawn a cada 180ms e velocidades entre 7.0 e 13.0 px/frame.
    - Rajadas de vento polar de alta pressão alternando a cada 1.4s com empuxo de 0.90, forçando o jogador contra as bordas congeladas.
  - **Pavabyte (`_pbDodge`)**:
    - Telegraphs de linha pontilhada relâmpago de apenas 0.20s antes do disparo real do laser térmico.
    - Disparos cruzados (horizontais, verticais e diagonais) gerando redes de feixes simultâneos (até 8 linhas ativas).
    - Intervalo de spawn de novos feixes reduzido para 220ms.
  - **TigerVex (`_tvDodge`)**:
    - Corredor de pulsos eletromagnéticos gigantes avançando em velocidade hiper-rápida (7.0 px/frame).
    - Abertura de escape extremamente estreita (50px).
    - Intervalo de surgimento encurtado para 580ms.
- **Ajuste e Sobreposição Visual do Badge ATIVO na Party (`terminal.css`)**:
  - Correção definitiva do corte superior da etiqueta `ATIVO`:
    - Adicionado `padding-top: 18px` ao `.party-pokemon-grid` para criar espaço vertical no topo da área de rolagem, evitando que o posicionamento negativo do badge encoste ou seja cortado pela caixa delimitadora.
    - Padronização rigorosa de `.pokemon-card-slot.active-party::before`: `content: "ATIVO"`, `top: -12px`, `right: 14px`, `z-index: 100`, `line-height: 1.2`, `padding: 2px 10px`, `box-shadow: 0 0 12px rgba(255, 215, 0, 0.75)`, garantindo renderização nítida, legível e sobreposta ao retângulo do card sem nenhum truncamento de borda.


---

### [12/11/2026 - 16:30] Quadruplicação de Dificuldade nos Minigames de Esquiva e Ajuste Fino do Badge ATIVO

- **Quadruplicação da Dificuldade dos Minigames de Esquiva (Nível 1 & Paridade Total)**:
  - **Duração Estendida**: Tempo dos minigames de esquiva elevado para 13.0 segundos (exigência de resistência e concentração contínua sob fogo cruzado).
  - **Escala de Tempo Frenética**: Reflexos baseados na janela de 0.20s como unidade tática padrão do jogo.
  - **Dino-Byte (`_dbDodge`)**:
    - Chuva torrencial de meteoritos pequenos (bolinhas vermelhas pontiagudas e incandescentes com brilho interno).
    - Densidade extrema na tela: mais de 30 a 45 meteoritos ativos simultaneamente.
    - Cadência de spawn a cada 60ms em rajadas contínuas.
    - Velocidades variando entre rápido e hiper-rápido (6.5 a 12.5 px/frame, ~1.5x a 2x a velocidade limite do jogador).
    - Tempo de invulnerabilidade (i-frame) pós-dano reduzido para 220ms.
  - **Cowputer-Moo (`_cpDodge`)**:
    - Triplo feixe magnético rotativo (3 braços de laço independentes com velocidades orbitais aceleradas de até 0.35 rad/frame).
    - Taxa de contração e convergência da borda elétrica elevada para 5.2px/s.
    - Janela de colisão e aceleração agressiva forçando micro-movimentações perto do epicentro.
  - **Penlinux (`_plDodge`)**:
    - Avalanche contínua de estalactites gélidas com spawn a cada 180ms e velocidades entre 7.0 e 13.0 px/frame.
    - Rajadas de vento polar de alta pressão alternando a cada 1.4s com empuxo de 0.90, forçando o jogador contra as bordas congeladas.
  - **Pavabyte (`_pbDodge`)**:
    - Telegraphs de linha pontilhada relâmpago de apenas 0.20s antes do disparo real do laser térmico.
    - Disparos cruzados (horizontais, verticais e diagonais) gerando redes de feixes simultâneos (até 8 linhas ativas).
    - Intervalo de spawn de novos feixes reduzido para 220ms.
  - **TigerVex (`_tvDodge`)**:
    - Corredor de pulsos eletromagnéticos gigantes avançando em velocidade hiper-rápida (7.0 px/frame).
    - Abertura de escape extremamente estreita (50px).
    - Intervalo de surgimento encurtado para 580ms.
- **Ajuste e Sobreposição Visual do Badge ATIVO na Party (`terminal.css`)**:
  - Correção definitiva do corte superior da etiqueta `ATIVO`:
    - Adicionado `padding-top: 18px` ao `.party-pokemon-grid` para criar espaço vertical no topo da área de rolagem, evitando que o posicionamento negativo do badge encoste ou seja cortado pela caixa delimitadora.
    - Padronização rigorosa de `.pokemon-card-slot.active-party::before`: `content: "ATIVO"`, `top: -12px`, `right: 14px`, `z-index: 100`, `line-height: 1.2`, `padding: 2px 10px`, `box-shadow: 0 0 12px rgba(255, 215, 0, 0.75)`, garantindo renderização nítida, legível e sobreposta ao retângulo do card sem nenhum truncamento de borda.


---

### [12/11/2026 - 16:50] Correção de Execução dos Minigames, Escudos Holográficos 3D Padronizados e Alinhamento da Moeda 3D

- **Restauração dos Helpers de Layout dos Minigames (`public/js/versus-minigames.js`)**:
  - Reintegrados os métodos de layout e utilitários (`_buildMgLayout`, `_showResult`, `_distToSeg`, `_segmentsIntersect`, `_lightenHex`, `_darkenHex`), sanando o erro de execução `TypeError: this._buildMgLayout is not a function` tanto no Modo História quanto no Modo Versus.
  - Minigames de esquiva (Nível 1), ação e point-and-click (Nível 2) e finalizadores (Nível 3) 100% operacionais e fluidos.
- **Motor Visual de Escudos Padronizado (`public/js/shield-fx.js`)**:
  - Criada a classe `ShieldVisualFX`, compartilhada por `versus-board.js` e `story-board.js`.
  - **Camada Traseira (`drawBack`)**: Halo de difusão de energia atmosférica desenhado atrás do robô (`createRadialGradient`).
  - **Camada Frontal (`drawFront`)**: Cúpula holográfica esférica translúcida 3D desenhada na frente do sprite (raio 48-50px envolvendo os 84x84px do robô), com anel de contenção neon pulsante, anel segmentado rotativo, 4 emissores orbitais de campo de força, scanlines horizontais internas e badge holográfico no topo com HP e rodadas restantes.
  - **Efeito de Quebra (`drawBreakEffect`)**: Onda de choque expansiva com fragmentos e estilhaços geométricos em dispersão radial.
  - Implementado tanto no Modo Versus quanto no Modo História (quando em postura de defesa ou com escudo ativo).
- **Ajuste Fino e Centralização da Moeda 3D do Duelo ao Meio-Dia (`terminal-3d.js`, `versus-ui.js`, `terminal.css`)**:
  - Resolução do problema de sobreposição e descentralização: o overlay agora é exibido antes da inicialização do Three.js, e o container `.versus-coin-stage` / `.versus-coin-disc` foi configurado com dimensões fixas de 140x140px com `display: flex; justify-content: center; align-items: center`, mantendo a moeda centralizada acima dos botões de Cara e Coroa.
  - **Textura Oficial da Coroa**: Implementado o método `_createCoroaCoinTexture()` com a Coroa Imperial completa (diadema, 5 pontas majestosas, joias coloridas em ciano/vermelho, ornatos e inscrição dourada), renderizada com precisão na face de trás da moeda 3D em rotação idle.
