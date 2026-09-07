# HORTOBOTS: REALITY CRASH // A TORRE VIRTUAL (v1.0 OFICIAL)

<p align="center">
  <a href="https://hortobots-reality-crash-webgame.onrender.com" target="_blank">
    <img src="https://img.shields.io/badge/JOGAR_ONLINE-ONRENDER.COM-00ff66?style=for-the-badge&logo=googlechrome&logoColor=black" alt="Jogar Online">
  </a>
  <img src="https://img.shields.io/badge/Versão-1.0_Oficial-ffd700?style=for-the-badge&logo=retroarch&logoColor=black" alt="Versão 1.0 Oficial">
  <img src="https://img.shields.io/badge/Banco_de_Dados-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase PostgreSQL">
  <img src="https://img.shields.io/badge/PvP-WebSockets_Realtime-00e5ff?style=for-the-badge&logo=websocket&logoColor=black" alt="WebSockets PvP">
  <img src="https://img.shields.io/badge/Gráficos_3D-Three.js_WebGL-00ff66?style=for-the-badge&logo=three.js&logoColor=black" alt="Three.js">
  <img src="https://img.shields.io/badge/Estilo-CRT_Cyberpunk_Retro-ff3344?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3 CRT">
</p>

<p align="center">
  🎮 <strong>Link Funcional para Jogar:</strong> <a href="https://hortobots-reality-crash-webgame.onrender.com" target="_blank"><strong>https://hortobots-reality-crash-webgame.onrender.com</strong></a>
</p>

---

> **HORTOBOTS: REALITY CRASH** é um RPG tático por turnos em ambiente de terminal CRT retro-futurista, ambientado no universo ficcional de **Hortolândia Digital (2024-2045+)**.
>
> O jogador assume o comando de **Quezadilhas** em uma missão de invasão cibernética à **Torre Virtual da Grande Inteligência** para purificar robôs aliados escravizados, decodificar arquivos confidenciais do Protocolo Mnemosyne e duelar na Arena Competitiva Global Versus Online.

---

## Sumário Executivo

- [1. Novidades da Versão 1.0 Oficial](#1-novidades-da-versão-10-oficial)
- [2. Arquitetura e Stack Técnica](#2-arquitetura-e-stack-técnica)
- [3. Modo Versus Online (PvP Competitivo)](#3-modo-versus-online-pvp-competitivo)
- [4. Banco de Dados e Autenticação (Supabase)](#4-banco-de-dados-e-autenticação-supabase)
- [5. Sistema de Combate Tático e Moeda 3D](#5-sistema-de-combate-tático-e-moeda-3d)
- [6. Roster Oficial de Robôs](#6-roster-oficial-de-robôs)
- [7. Estrutura da Torre Central (8 Andares)](#7-estrutura-da-torre-central-8-andares)
- [8. Como Executar Localmente](#8-como-executar-localmente)
- [9. Créditos e Licença](#9-créditos-e-licença)

---

## 1. Novidades da Versão 1.0 Oficial

- **Tela de Pré-Título [ ESPAÇO ]**: Tela imersiva escura com animação em pixel-art de tecla mecânica sendo clicada, garantindo conformidade com as políticas de autoplay de navegadores modernos e liberando o áudio com transição de fade lento duplo (~1.9s).
- **Moeda 3D com Textura Oficial**: O lado "CARA" da moeda tridimensional no Three.js agora utiliza a textura oficial do cowboy lagarto (`cara-icon.png`), mantendo 100% da física de arremesso, 4 quiques suspensivos e iluminação metálica.
- **Favicon Oficial**: Logotipo do projeto configurado no cabeçalho do documento para navegadores desktop e mobile.
- **Arena Versus Online PvP Full-Duplex**:
  - Timer de 60 segundos para draft dos 3 Campeões.
  - Sincronização de prontidão com botão `PREPARADO!`.
  - Timer oculto de 5 segundos de tolerância com penalidade de -10 RP para abandono.
  - Trilha sonora dinâmica: `G.I Entrance adapted` na vitória seguida de `Lizardilhas POP Theme`, e `Relax, Lizardilhas` em caso de derrota.
- **Sistema de Ranking Competitivo 0 - 999 RP**: Contas iniciam em 0 RP e nunca caem abaixo de zero.
- **Integração Cloud Supabase (PostgreSQL)**: Persistência em nuvem com tolerância a falhas e sincronização com JSON local.
- **Sistema Rítmico de Pulso de Câmera (BPM)**: Pulso suave e estável sincronizado estritamente durante as batalhas.
- **Sombra de Profundidade no Rodapé**: Gradiente que cobre o fundo 3D da torre no último quarto da tela sem obstruir as legendas do sistema.
- **Overlay de Cold-Start**: Feedback visual com animação CRT para despertar instâncias gratuitas em nuvem (Render).

---

## 2. Arquitetura e Stack Técnica

```
HORTOBOTS REALITY CRASH (v1.0)
 ├── Frontend (Client-side)
 │    ├── Three.js (WebGL 3D) -> Torre de transmissão & Moeda 3D física
 │    ├── CSS3 CRT Engine -> Bulbo de tubo, scanlines, vinheta, aberração esférica
 │    ├── Web Audio API -> Mixagem estéreo, transições suaves de BGM e SFX
 │    ├── BeatPulseManager -> Pulso rítmico estável de câmera sincronizado por BPM
 │    └── Vanilla ES Modules -> terminal-game.js, versus-ui.js, terminal-3d.js
 └── Backend (Server-side)
      ├── Node.js / Express -> Servidor HTTP estático e endpoints REST (/api/server-info)
      ├── WebSocket Server (ws) -> Matchmaking, sincronização de salas e combate PvP
      └── Supabase PostgreSQL (pg) -> Tabela 'accounts' com RLS, failover local JSON
```

---

## 3. Modo Versus Online (PvP Competitivo)

A Arena Versus coloca dois jogadores reais frente a frente em combates sincronizados por turnos:

1. **Seleção de Campeões (Draft)**:
   - Cada duelista escolhe 3 robôs de sua preferência.
   - Contagem regressiva visual de **60 segundos**.
   - O botão `[ PREPARADO! ]` só é liberado após a seleção completa dos 3 combatentes.
2. **Integridade de Fila e Penalidade**:
   - Se o tempo expirar sem confirmação, um timer oculto de 5 segundos é acionado.
   - Caso persista a inatividade, a partida é cancelada e o jogador omisso sofre **penalidade de -10 RP**.
3. **Escala de Ranking (RP)**:
   - Mínimo absoluto: `0 RP`.
   - Pontuação inicial de novas contas: `0 RP`.
   - Limite máximo: `999 RP`.

---

## 4. Banco de Dados e Autenticação (Supabase)

O servidor conecta-se ao banco de dados relacional **Supabase PostgreSQL** (`rxfdjwdfinhqdwllzmcc`):

- **Tabela `accounts`**:
  - `id` (UUID primário gerado automaticamente)
  - `nickname` (único, alfanumérico, min. 2 caracteres)
  - `email` (único, validação estrita com RFC 5322 regex)
  - `password_hash` (mínimo de 8 caracteres)
  - `medals` / `ranking` (inteiro restrito entre 0 e 999)
  - `created_at` e `updated_at` (timestamptz)
- **Modo Failover Resiliente**: Caso a rede caia ou o banco esteja inacessível, o servidor alterna automaticamente para a base local `data/accounts.json` sem interromper a sessão dos jogadores.

---

## 5. Sistema de Combate Tático e Moeda 3D

O combate opera em formato tático sequencial:

| Comando | Descrição da Ação |
| :--- | :--- |
| **`[ ATAQUE ]`** | Seleciona o golpe tático ou finalizador, escolhe o alvo e dispara o minigame de precisão. |
| **`[ DEFESA ]`** | **Moeda da Sorte 3D (Cara ou Coroa)**: Passa o turno economizando energia.<br>• **Acertou**: `100% de Esquiva (0 Dano)` no próximo golpe inimigo.<br>• **Errou**: O escudo é quebrado e o robô sofre **dano bruto**. |
| **`[ ITEM ]`** | Abre a Mochila de Dados para aplicar chips de reparo e recarga em aliados. |

> **Cinemática 3D da Moeda**: Desenvolvida em Three.js, a moeda possui 20 lados perimetrais, anéis dourados em alto-relevo, textura `cara-icon.png` na face CARA, brasão imperial na face COROA e física de 4 quiques com desaceleração realista.

---

## 6. Roster Oficial de Robôs

| Robô | Tipo | Código | Especialidade | Finalizador Supremo |
| :--- | :--- | :--- | :--- | :--- |
| **Dino-Byte** | Fogo | `[DB-01]` | Dano térmico de alta pressão | *Rugido Hiperbárico do Lagarto* |
| **Cowputer-Moo** | Terra | `[CP-02]` | Escudo reforçado e laço magnético | *Choque Bovino de Alta Tensão* |
| **Penlinux** | Gelo | `[PL-03]` | Agilidade ártica e combos musicais | *Avalanche Ártica do Hee-Hee* |
| **Tigervex** | Elétrico | `[TV-04]` | Cortes rápidos de plasma e bobinas Tesla | *Ruptura do Núcleo Trovão* |
| **Pavabyte** | Luz | `[PB-05]` | Feixes prismáticos e manipulação óptica | *Matriz Laser Arco-Íris* |

---

## 7. Estrutura da Torre Central (8 Andares)

```
                       [ ANDAR 8: PINÁCULO CENTRAL ]
                                    ^
                       [ ANDAR 7: NÚCLEO DA TIRANIA ]
                                    ^
                       [ ANDAR 6: CIDADELA GLACIAL ]
                       (Duelo 6.5: Câmara dos Titãs)
                                    ^
                       [ ANDAR 5: ARQUIVOS DE LONDRES ]
                                    ^
                       [ ANDAR 4: DESERTO DE SILÍCIO ]
                       (Duelo 4.5: Pista Glacial)
                                    ^
                       [ ANDAR 3: SETOR MNEMOSYNE ]
                                    ^
                       [ ANDAR 2: BOSQUE DOS ALGORITMOS ]
                       (Duelo 2.5: Saloon dos Servidores)
                                    ^
                       [ ANDAR 1: FLORESTA DIGITAL ]
```

---

## 8. Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)

### Passo a Passo
```bash
# 1. Clone o repositório
git clone https://github.com/TiagoFG-DEV/Hortobots-Reality-Crash-WebGame.git

# 2. Acesse a pasta do projeto
cd Hortobots-Reality-Crash-WebGame

# 3. Instale as dependências
npm install

# 4. Inicie o servidor (com suporte a PVP e Supabase)
npm run pvp
```

> **No Windows**: Dê um duplo clique no executável `jogar.bat` para iniciar automaticamente.

Abra seu navegador em: **`http://localhost:3333/`**

---

## 9. Créditos e Licença

- **Desenvolvimento e Direção**: TiagoFG-DEV
- **Contato**: [tiagop05gregorio@gmail.com](mailto:tiagop05gregorio@gmail.com)
- **Repositório**: [Hortobots-Reality-Crash-WebGame](https://github.com/TiagoFG-DEV/Hortobots-Reality-Crash-WebGame)
- **Versão**: 1.0.0 Oficial (Lançamento de Produção)
- **Hospedagem em Nuvem**: [Render](https://hortobots-reality-crash-webgame.onrender.com)
- **Banco de Dados**: [Supabase](https://supabase.com)

*Todos os direitos reservados ao universo Hortobots: Reality Crash.*
