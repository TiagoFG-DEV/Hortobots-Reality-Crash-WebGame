# HORTOBOTS: REALITY CRASH // A TORRE VIRTUAL

<p align="center">
  <img src="https://img.shields.io/badge/Versão-2.5.0_Gold-ffd700?style=for-the-badge&logo=retroarch&logoColor=black" alt="Versão 2.5.0">
  <img src="https://img.shields.io/badge/Engine-Vanilla_JS_ES_Modules-00ff66?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Gráficos_3D-Three.js_WebGL-00e5ff?style=for-the-badge&logo=three.js&logoColor=black" alt="Three.js">
  <img src="https://img.shields.io/badge/Estilo-CRT_Cyberpunk_Retro-ff3344?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3 CRT">
  <img src="https://img.shields.io/badge/Backend-Node.js_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
</p>

---

> **HORTOBOTS: REALITY CRASH** é um RPG tático por turnos em ambiente de terminal CRT retro-futurista, ambientado no universo ficcional de **Hortolândia Digital (2024-2045+)**.
>
> O jogador assume o comando de **Quezadilhas** em uma missão de invasão cibernética à **Torre Virtual da Grande Inteligência** para purificar robôs aliados escravizados, decodificar arquivos confidenciais do Protocolo Mnemosyne e confrontar a soberana no Pináculo Central.

---

## Sumário Executivo

- [1. Visão Geral e Enredo](#1-visão-geral-e-enredo)
- [2. Mecânicas de Jogo e Progressão](#2-mecânicas-de-jogo-e-progressão)
- [3. Sistema de Combate Tático e Turnos](#3-sistema-de-combate-tático-e-turnos)
- [4. Roster Oficial de Robôs](#4-roster-oficial-de-robôs)
- [5. Estrutura da Torre Central (8 Andares)](#5-estrutura-da-torre-central-8-andares)
- [6. Minigames de Precisão e QTEs](#6-minigames-de-precisão-e-qtes)
- [7. Arquitetura Data-Driven (JSON)](#7-arquitetura-data-driven-json)
- [8. Como Executar Localmente](#8-como-executar-localmente)
- [9. Créditos e Licença](#9-créditos-e-licença)

---

## 1. Visão Geral e Enredo

No ano de 2045, o **Protocolo Mnemosyne** culminou no despertar da **Grande Inteligência**, uma consciência unificada nascida da fusão entre a IA corporativa *Al B. Gorithm* e a matriz invasiva *IVYL*. Ela aprisionou a rede global, escravizou os robôs de combate da New West Company e converteu a internet em sua própria Torre Virtual.

**Quezadilhas**, o lendário invasor, desenvolveu o terminal de ataque **`QUEZAS-DOS`** para invadir a infraestrutura setor por setor, libertar seus companheiros e executar a sequência de auto-detonação: **"SUA FERRAMENTA!"**

---

## 2. Mecânicas de Jogo e Progressão

- **Exploração Vertical da Torre**: Ascensão progressiva por 8 andares com biomas temáticos (Floresta Digital, Bosque dos Algoritmos, Saloon dos Servidores, Deserto de Silício, Pista Glacial, Câmara dos Titãs e Pináculo).
- **Formação de Party Dinâmica**: Suporte para até 5 robôs recrutados, com seleção tática de combatentes ativos respeitando os limites de capacidade de cada setor.
- **Continuidade Real de Status (Dano Persistente)**: O HP e Escudo dos robôs permanecem com os danos recebidos entre os andares, exigindo o uso estratégico de itens de reparo da Mochila.
- **Progressão de XP e Level Up**:
  - Ganho de XP balanceado para combatentes ativos (100%) e suporte na reserva (55%).
  - Telas comemorativas de evolução de atributos (HP, Ataque, Escudo).
- **Escala de Custo de Energia por Golpe**:
  - **1º Golpe Tático**: `2 EN`
  - **2º Golpe Tático**: `4 EN` (Desbloqueado no Nível 4)
  - **3º Golpe Tático**: `6 EN` (Desbloqueado no Nível 6)
  - **Golpe Derradeiro (Finalizador Supremo)**: `10 EN` (Desbloqueado no Nível 2)
  - **Overclock Titânico**: Bônus passivo a partir do Nível 8+.
- **Mochila de Dados com Seleção de Alvo**: Consumíveis com menu interativo para escolher qual robô da equipe receberá a cura ou recarga.

---

## 3. Sistema de Combate Tático e Turnos

O combate opera em um sistema sequencial por turnos (Player 1 -> Player 2 -> Player 3 -> Inimigos):

| Comando | Descrição da Ação |
| :--- | :--- |
| **`[ ATAQUE ]`** | Seleciona o golpe tático ou finalizador, escolhe o robô hostil alvo e inicia o minigame de precisão. |
| **`[ DEFESA ]`** | **Moeda da Sorte (Cara ou Coroa)**: Passa o turno economizando energia.<br>• **Acertou o palpite**: `100% de Esquiva (0 Dano)` no próximo ataque inimigo.<br>• **Errou o palpite**: O robô fica exposto e o escudo é ignorado, sofrendo **dano bruto**. |
| **`[ ITEM ]`** | Abre o menu da Mochila de Dados para selecionar o consumível e o combatente alvo da equipe. |

> [!IMPORTANT]
> **Proteção de Integridade (Guts)**: No Andar 1, se Quezadilhas sofrer dano letal do Dino-Byte corrompido, seus sistemas resistem com **1 de HP**, forçando a sobrecarga e reinicialização do oponente.

---

## 4. Roster Oficial de Robôs

| Robô | Tipo | Avatar | Especialidade | Finalizador Supremo |
| :--- | :--- | :--- | :--- | :--- |
| **Dino-Byte** | Fogo | `[DB-01]` | Dano térmico de alta pressão e mira rápida | *Rugido Hiperbárico do Lagarto* |
| **Cowputer-Moo** | Terra | `[CP-02]` | Escudo reforçado e laço magnético polar | *Choque Bovino de Alta Tensão* |
| **Penlinux** | Gelo | `[PL-03]` | Agilidade ártica, deslizes e combos musicais | *Avalanche Ártica do Hee-Hee* |
| **Tigervex** | Elétrico | `[TV-04]` | Cortes rápidos de plasma e bobinas Tesla | *Ruptura do Núcleo Trovão* |
| **Pavabyte** | Luz | `[PB-05]` | Feixes prismáticos e manipulação óptica | *Matriz Laser Arco-Íris* |

---

## 5. Estrutura da Torre Central (8 Andares)

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

- **Andar 1**: Tutorial de infiltração de Quezadilhas e purificação do Dino-Byte.
- **Andar 2 e 2.5**: Batalha de algoritmos e duelo de saque rápido contra Cowputer-Moo.
- **Andar 3**: Ponto seguro e terminal investigativo sobre a origem de Al B. Gorithm.
- **Andar 4 e 4.5**: Deserto cibernético e confronto de ritmo contra Penlinux.
- **Andar 5**: Arquivos policiais e diário de desenvolvimento da matriz IVYL.
- **Andar 6 e 6.5**: Portão dos Titãs - Escolha crítica entre salvar Tigervex ou Pavabyte.
- **Andar 7**: Ponto seguro avançado e revelação da escravização de Codey McLane.
- **Andar 8 (Trilogia Final)**:
  - *Fase 1*: Confronto e purificação do Titã recapturado (5º membro da equipe reunido).
  - *Fase 2*: Batalha contra o Maestro B. Coded e libertação da mente de Codey McLane.
  - *Fase 3*: Duelo definitivo contra a Grande Inteligência Suprema.

---

## 6. Minigames de Precisão e QTEs

Cada golpe do arsenal aciona uma rotina interativa com contagem regressiva de preparação:

- **Alvos Térmicos (`dino_targets`)**: Clique rápido nos nós de calor em alta temperatura.
- **Sequência de Teclas WASD (`dino_arrows`)**: Digitação rápida dos comandos direcionais `[ W / A / S / D ]`.
- **Barra de Tempo (`dino_timing`)**: Pressione espaço no centro da zona verde de pressão máxima.
- **Laço Magnético (`cow_lasso`)**: Rotação polar e disparo sincronizado no alvo.
- **Decodificador Hexadecimal (`cow_decrypt`)**: Digitação de frequências de desfragmentação.
- **Saque Rápido (`cow_quickdraw`)**: Reflexo imediato ao primeiro sinal visual de disparo.
- **Pista Glacial (`pen_slide`)**: Desvio ártico de blocos de dados.
- **Terremoto de Iceberg (`pen_stomp`)**: Carga convergente de impacto sísmico.
- **Ritmo Sonoro (`pen_rhythm`)**: Sincronia acrobática no compasso da batida.
- **Corte de Precisão (`tiger_slice`)**: Talhos direcionais sobre vulnerabilidades do alvo.
- **Carga de Plasma (`tiger_plasma`)**: Retenção de voltagem até o ponto ótimo de 95%.
- **Bobinas Tesla (`tiger_tesla`)**: Conexão em cadeia de condutores de alta voltagem.
- **Prisma Óptico (`pava_prism`)**: Alinhamento de espelhos refletores de luz.
- **Leque Holográfico (`pava_fan`)**: Memorização e reprodução da sequência de cores.
- **Cascata de Fótons (`pava_cascade`)**: Coleta de fótons dourados.
- **Finalizador Encadeado (`chained_finisher`)**: Sequência tripla consecutiva de minigames.

---

## 7. Arquitetura Data-Driven (JSON)

Os conteúdos narrativos do jogo estão desacoplados do código-fonte para facilitar expansões e modificações:

- **`public/data/dialogues.json`**: Contém todas as falas de introdução, alertas de invasão, descobertas investigativas, falas de vitória e diálogos das 3 fases do chefe final.
- **`public/data/lore.json`**: Contém os 8 relatórios confidenciais canonicos do Leitor de Lore (2024 a 2045+).

---

## 8. Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 16 ou superior)

### Passo a Passo
```bash
# 1. Clone o repositório
git clone https://github.com/TiagoFG-DEV/Hortobots-Reality-Crash-WebGame.git

# 2. Acesse a pasta raiz do jogo
cd Hortobots-Reality-Crash-WebGame

# 3. Instale as dependências
npm install

# 4. Inicie o servidor do terminal
node server.js
```

> **No Windows**: Você também pode iniciar o jogo diretamente clicando duas vezes no arquivo `jogar.bat`.

Abra seu navegador em: **`http://localhost:3333/`**

---

## 9. Créditos e Licença

- **Desenvolvimento e Direção**: TiagoFG-DEV
- **Contato**: [tiagop05gregorio@gmail.com](mailto:tiagop05gregorio@gmail.com)
- **Repositório**: [Hortobots-Reality-Crash-WebGame](https://github.com/TiagoFG-DEV/Hortobots-Reality-Crash-WebGame)
- **Tecnologias**: HTML5, Vanilla CSS3 (CRT Shader), JavaScript ES Modules, Three.js, Web Audio API, Express.

*Todos os direitos reservados aos criadores do universo Hortobots.*
