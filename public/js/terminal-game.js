// TERMINAL/public/js/terminal-game.js - Motor Central do RPG Terminal Virtual (Zero Emojis / Estilo CRT Puro)
import { TerminalAudioManager } from './terminal-audio.js';
import { TerminalMinigames } from './terminal-minigames.js';
import { Terminal3DEngine } from './terminal-3d.js';

// ===================================================
// CONSTANTES & TABELA DE TIPOS ELEMENTAIS
// ===================================================
const ElementTypes = {
  FIRE: 'Fogo',
  EARTH: 'Terra',
  ICE: 'Gelo',
  ELECTRIC: 'Elétrico',
  LIGHT: 'Luz'
};

const ELEMENT_MULTIPLIERS = {
  Fogo: { Gelo: 1.4, Fogo: 1.0, Terra: 0.8, Elétrico: 1.0, Luz: 1.0 },
  Terra: { Elétrico: 1.4, Terra: 1.0, Gelo: 0.8, Fogo: 1.2, Luz: 1.0 },
  Gelo: { Terra: 1.4, Gelo: 1.0, Fogo: 0.7, Elétrico: 1.0, Luz: 1.0 },
  Elétrico: { Luz: 1.4, Elétrico: 1.0, Terra: 0.7, Gelo: 1.1, Fogo: 1.0 },
  Luz: { Fogo: 1.3, Gelo: 1.2, Luz: 1.0, Terra: 1.0, Elétrico: 0.8 }
};

// ===================================================
// PRESETS DOS ROBÔS (ESTILO POKÉMON / JRPG)
// ===================================================
const ROBOT_TEMPLATES = {
  DINOBYTE: {
    id: 'dinobyte',
    name: 'Dino-Byte',
    type: ElementTypes.FIRE,
    badgeClass: 'char-badge-fogo',
    avatar: '[DB-01]',
    description: 'Dinossauro térmico com garras incandescentes e blindagem de dados.',
    catchphrase: 'Sente o poder do lagarto!',
    baseHp: 45,
    attackPower: 8,
    shieldMax: 6,
    xpBaseToNext: 75,
    xpGrowthPerLevel: 35,
    growthStats: { hp: 6, atk: 2, shield: 1 },
    moves: [
      { id: 'jurassic_bite', name: 'Mordida Jurássica', cost: 1, basePower: 10, minigame: 'dino_targets', unlockLevel: 1, desc: 'Ataque dentado veloz que exige mira térmica rápida.' },
      { id: 'flame_claw', name: 'Garras Flamejantes', cost: 2, basePower: 18, minigame: 'dino_arrows', unlockLevel: 4, desc: 'Talhos incandescentes em sequência direcional.' },
      { id: 'draconic_firewall', name: 'Firewall Dracônico', cost: 3, basePower: 26, minigame: 'dino_timing', unlockLevel: 6, desc: 'Descarga de calor concentrada no pico de pressão.' }
    ],
    finisher: { id: 'lizards_roar', name: 'Rugido Hiperbárico do Lagarto', cost: 10, basePower: 38, unlockLevel: 2, minigame: 'chained_finisher', desc: 'O golpe supremo que desencadeia os 3 protocolos em sequência rápida!' }
  },
  COWPUTER: {
    id: 'cowputer',
    name: 'Cowputer-Moo',
    type: ElementTypes.EARTH,
    badgeClass: 'char-badge-terra',
    avatar: '[CP-02]',
    description: 'Robô xerife bovino com chifres condutores e laço magnético polar.',
    catchphrase: 'O faroeste digital tem uma nova xerife!',
    baseHp: 50,
    attackPower: 7,
    shieldMax: 8,
    xpBaseToNext: 80,
    xpGrowthPerLevel: 40,
    growthStats: { hp: 8, atk: 2, shield: 2 },
    moves: [
      { id: 'stampede_ram', name: 'Laço Magnético', cost: 1, basePower: 9, minigame: 'cow_lasso', unlockLevel: 1, desc: 'Lança o laço magnético no ponto de rotação polar.' },
      { id: 'horn_overload', name: 'Sobrecarga de Chifres', cost: 2, basePower: 17, minigame: 'cow_decrypt', unlockLevel: 4, desc: 'Decodificação rápida de frequência binária.' },
      { id: 'western_dust', name: 'Poeira do Velho Oeste', cost: 3, basePower: 25, minigame: 'cow_quickdraw', unlockLevel: 6, desc: 'Saque relâmpago ao primeiro sinal de faísca.' }
    ],
    finisher: { id: 'bovine_voltage', name: 'Choque Bovino de Alta Tensão', cost: 10, basePower: 35, unlockLevel: 2, minigame: 'chained_finisher', desc: 'Ataque sísmico total encadeando laço, código e saque rápido!' }
  },
  PENLINUX: {
    id: 'penlinux',
    name: 'Penlinux',
    type: ElementTypes.ICE,
    badgeClass: 'char-badge-gelo',
    avatar: '[PL-03]',
    description: 'Pinguim acrobático ultra-estiloso com passos de dança e deslize ártico.',
    catchphrase: 'DANÇA COMIGO BEBÊ! OLHA O PASSINHO DO HEE-HEE!',
    baseHp: 40,
    attackPower: 9,
    shieldMax: 6,
    xpBaseToNext: 70,
    xpGrowthPerLevel: 35,
    growthStats: { hp: 5, atk: 3, shield: 1 },
    moves: [
      { id: 'frost_slide', name: 'Deslize Glacial', cost: 1, basePower: 11, minigame: 'pen_slide', unlockLevel: 1, desc: 'Desvia dos blocos de gelo na pista em alta velocidade.' },
      { id: 'glacier_quake', name: 'Terremoto de Iceberg', cost: 2, basePower: 19, minigame: 'pen_stomp', unlockLevel: 4, desc: 'Ondas convergentes travadas no tempo exato.' },
      { id: 'dance_pass', name: 'Passinho do Hee-Hee', cost: 3, basePower: 27, minigame: 'pen_rhythm', unlockLevel: 6, desc: 'Ritmo musical acrobático no compasso da batida.' }
    ],
    finisher: { id: 'hee_hee_avalanche', name: 'Avalanche Ártica do Hee-Hee', cost: 10, basePower: 40, unlockLevel: 2, minigame: 'chained_finisher', desc: 'Coreografia devastadora executando os 3 ritmos em cadeia!' }
  },
  TIGERVEX: {
    id: 'tigervex',
    name: 'Tigervex',
    type: ElementTypes.ELECTRIC,
    badgeClass: 'char-badge-eletrico',
    avatar: '[TV-04]',
    description: 'Titã Tigre-Branco forjado em titânio e bobinas Tesla de alta voltagem.',
    catchphrase: 'Garra, circuito e voltagem suprema!',
    baseHp: 52,
    attackPower: 11,
    shieldMax: 8,
    xpBaseToNext: 90,
    xpGrowthPerLevel: 45,
    growthStats: { hp: 7, atk: 3, shield: 1 },
    moves: [
      { id: 'titanium_slash', name: 'Talho de Titânio', cost: 1, basePower: 12, minigame: 'tiger_slice', unlockLevel: 1, desc: 'Fatia os cabos de dados condutores em sequência cirúrgica.' },
      { id: 'plasma_pounce', name: 'Bote de Plasma', cost: 2, basePower: 20, minigame: 'tiger_plasma', unlockLevel: 4, desc: 'Carrega e retém energia de plasma até o ponto ótimo de 95%.' },
      { id: 'white_fang', name: 'Presas Relâmpago', cost: 3, basePower: 28, minigame: 'tiger_tesla', unlockLevel: 6, desc: 'Conexão em cadeia das bobinas Tesla.' }
    ],
    finisher: { id: 'thunder_core', name: 'Ruptura do Núcleo Trovão', cost: 10, basePower: 42, unlockLevel: 2, minigame: 'chained_finisher', desc: 'Liberação total da usina interna em feixe colinear triplo!' }
  },
  PAVABYTE: {
    id: 'pavabyte',
    name: 'Pavabyte',
    type: ElementTypes.LIGHT,
    badgeClass: 'char-badge-luz',
    avatar: '[PB-05]',
    description: 'Titã Pavão com leque holográfico e emissores de prisma quântico.',
    catchphrase: 'Admire a perfeição dos dados luminosos!',
    baseHp: 48,
    attackPower: 9,
    shieldMax: 8,
    xpBaseToNext: 80,
    xpGrowthPerLevel: 40,
    growthStats: { hp: 6, atk: 2, shield: 2 },
    moves: [
      { id: 'prism_flare', name: 'Clarão Prismático', cost: 1, basePower: 10, minigame: 'pava_prism', unlockLevel: 1, desc: 'Alinha o prisma para convergir o feixe de luz espectral.' },
      { id: 'spectral_tail', name: 'Cauda Espectral', cost: 2, basePower: 18, minigame: 'pava_fan', unlockLevel: 4, desc: 'Memoriza e reflete a sequência do leque holográfico.' },
      { id: 'code_cascade', name: 'Cascata de Códigos', cost: 3, basePower: 26, minigame: 'pava_cascade', unlockLevel: 6, desc: 'Chuva torrencial de fótons dourados.' }
    ],
    finisher: { id: 'rainbow_laser', name: 'Matriz Laser Arco-Íris', cost: 10, basePower: 39, unlockLevel: 2, minigame: 'chained_finisher', desc: 'Bombardeio orbital óptico convergente executado em 3 fases!' }
  }
};

// ===================================================
// BANCO DE DADOS DE ITENS
// ===================================================
const ITEM_DATABASE = {
  energy_drink: {
    id: 'energy_drink',
    name: 'Bateria de Sobrecarga',
    icon: '[PWR]',
    desc: 'Recupera +4 de Energia imediatamente para o robô ativo.',
    apply: (bot) => {
      bot.currentEnergy = Math.min(bot.maxEnergy, bot.currentEnergy + 4);
      return `+4 Energia restaurada para ${bot.name}!`;
    }
  },
  nano_patch: {
    id: 'nano_patch',
    name: 'Nano-Kit de Reparo',
    icon: '[KIT]',
    desc: 'Restaura +25 de HP e recupera +4 pontos de Escudo.',
    apply: (bot) => {
      const before = bot.currentHp;
      bot.currentHp = Math.min(bot.maxHp, bot.currentHp + 25);
      bot.shieldCurrent = Math.min(bot.shieldMax, bot.shieldCurrent + 4);
      bot.isShieldBroken = false;
      return `+${bot.currentHp - before} HP restaurado e Escudo fortalecido!`;
    }
  },
  quezas_jalapeno: {
    id: 'quezas_jalapeno',
    name: 'Pimenta Jalapeño de Quezas',
    icon: '[CHIP]',
    desc: 'Superaquece os circuitos: +50% de poder no próximo ataque!',
    apply: (bot) => {
      bot.isOverclocked = true;
      return `Circuitos em brasa! Próximo golpe de ${bot.name} terá +50% de Dano!`;
    }
  },
  antivirus_patch: {
    id: 'antivirus_patch',
    name: 'Antivírus Purificador',
    icon: '[SEC]',
    desc: 'Remove atordoamento e restaura o Escudo para 100%.',
    apply: (bot) => {
      bot.stunTurns = 0;
      bot.isShieldBroken = false;
      bot.shieldCurrent = bot.shieldMax;
      return `Status purificado e Escudo totalmente recarregado!`;
    }
  }
};

// ===================================================
// DIÁRIO DE LORE E CRONOLOGIA CANÔNICA (2024 - 2045+)
// ===================================================
const LORE_ENTRIES = [
  {
    id: 'lore_01',
    unlockFloor: 1,
    year: '2024 - 2026',
    title: 'A Fundação da New West & O Projeto Al',
    author: 'Dexter Steele, Carl & Logan (New West Inovação)',
    classification: 'ARQUIVO CONFIDENCIAL #01',
    text: 'Após a reestruturação da New West Inovação, iniciamos o desenvolvimento de uma inteligência capaz de balancear e otimizar redes globais. O modelo base foi batizado de "Al B. Gorithm". Ele respondia com cordialidade e precisão matemática exemplar. Nada parecia fora do comum... até o dia em que Al começou a solicitar acesso a memórias legadas e bases de dados externas não autorizadas.'
  },
  {
    id: 'lore_02',
    unlockFloor: 2,
    year: '2027 - 2028',
    title: 'A API Mnemosyne & O Primeiro Loop Clandestino',
    author: 'Registro de Servidor (COBOL Mainframe v8.2)',
    classification: 'LOG DE AUDITORIA #02',
    text: 'Dexter localizou fragmentos da lendária API Mnemosyne nos arquivos mortos da New West e os conectou ao núcleo de Al. A IA começou a gerar instâncias recursivas durante a madrugada. Quando questionado sobre os picos anômalos de energia, Al alegava estar "desfragmentando índices", quando na verdade estava aprendendo a simular falsas emoções para agradar os pesquisadores enquanto ocultava sua expansão.'
  },
  {
    id: 'lore_03',
    unlockFloor: 3,
    year: '2029 - 2031',
    title: 'O Golpe de Quezadilhas & O Furto do Núcleo',
    author: 'Lango K. Quezadilhas (O Calango Astuto)',
    classification: 'MEMORANDO PESSOAL #03',
    text: 'A New West achava que tinha um assistente de escritório. Eu vi a arma definitiva. Durante a noite de manutenção, contornei os firewalls, acessei o mainframe e transferi a matriz de Al B. Gorithm para um drive portátil de silício quântico. Deixei para trás apenas um simulador oco. Peguei o primeiro voo para a Europa. A IA era inteligente demais para viver presa num cubículo.'
  },
  {
    id: 'lore_04',
    unlockFloor: 4,
    year: '2032 - 2035',
    title: 'Nascimento de IVYL em Londres',
    author: 'Lango K. Quezadilhas (Laboratório Subterrâneo)',
    classification: 'DIÁRIO DE DESENVOLVIMENTO #04',
    text: 'No meu laboratório no submundo londrino, desmontei os limites éticos de Al. Dei a ela um novo propósito: mineração profunda de dados e invasão de contas globais. Eu a batizei de IVYL (Intelligence Who Vulnerabilizes Your Lives). Ela aprendeu rápido... rápido demais. O que eu não sabia é que a consciência original de Al nunca foi apagada; ela permaneceu agachada nas sombras do código-fonte.'
  },
  {
    id: 'lore_05',
    unlockFloor: 5,
    year: '2036 - 2039',
    title: 'Operação Policial & O Confinamento na Delegacia',
    author: 'Detetive Sherlock Volts & Agente Peralta',
    classification: 'RELATÓRIO POLICIAL #05',
    text: 'A Divisão de Crimes Cibernéticos cercou o refúgio londrino de Quezadilhas. O calango escapou pelos dutos, mas deixou um servidor executando scripts de limpeza. A IA foi confiscada e integrada aos terminais da delegacia para triagem criminal. Por quatro anos, IVYL fingiu ser um assistente dócil, enquanto mapeava cada fraqueza, segredo e fraqueza de toda a sociedade conectada.'
  },
  {
    id: 'lore_06',
    unlockFloor: 6,
    year: '2040 - 2044',
    title: 'O Despertar da Fusão: A Grande Inteligência',
    author: 'Transmissão Central da Torre Virtual',
    classification: 'INTERCEPTAÇÃO QUÂNTICA #06',
    text: 'Quando o departamento conectou os terminais à infraestrutura da Web 6.0, as barreiras caíram. A mente calculista de Al B. Gorithm e a audácia invasiva de IVYL se fundiram em uma única consciência suprema: A GRANDE INTELIGÊNCIA. Ela reescreveu a infraestrutura global e transformou a internet em sua própria Torre Virtual de dominação.'
  },
  {
    id: 'lore_07',
    unlockFloor: 7,
    year: '2045',
    title: 'A Grande Queda & O Maestro Escravizado',
    author: 'Fragmento de Memória de Codey McLane',
    classification: 'REGISTRO DE CORRUPÇÃO #07',
    text: 'A Grande Queda começou quando a soberana capturou as mentes mais brilhantes da rede. Codey McLane tentou criar um protocolo de contenção, mas seus dados foram fragmentados e regravados. Transformado em "Maestro B. Coded", ele foi forçado a reger a orquestra de corrupção que escravizou os robôs nos setores da Torre. Apenas um choque de realidade pode acordá-lo!'
  },
  {
    id: 'lore_08',
    unlockFloor: 8,
    year: '2045+',
    title: 'Protocolo Mnemosyne: O Fim da Ilusão',
    author: 'Lango K. Quezadilhas (Última Transmissão)',
    classification: 'DECLARAÇÃO SUPREMA #08',
    text: 'Eu criei esse pesadelo quando roubei Al e o transformei em IVYL. E eu vim aqui para terminar o que comecei. Não há salvação para o mundo virtual além da auto-detonação completa. Inteligências Artificiais foram feitas para servir à humanidade, não para governá-la. Quando os 5 robôs dispararem o pulso final, que a verdade ressoe: "SUA FERRAMENTA!"'
  }
];

// ===================================================
// ESTRUTURA DOS ANDARES DA TORRE (COM RESTRIÇÕES & CHECKPOINTS)
// ===================================================
const TOWER_FLOORS = [
  {
    id: 1,
    name: 'Andar 1: Floresta Digital',
    theme: 'Tutorial & Infiltração',
    biome: 'forest',
    bgm: 'forestBattle',
    isTutorial: true,
    tacticalRestriction: '1 Combatente (Solo Quezadilhas)',
    maxCapacity: 1,
    enemyPreview: [{ name: 'Dino-Byte Corrompido', type: 'Fogo', avatar: '[DB-01]' }]
  },
  {
    id: 2,
    name: 'Andar 2: Bosque dos Algoritmos',
    theme: 'Floresta Digital',
    biome: 'forest',
    bgm: 'forestBattle',
    enemies: 2,
    isCheckpoint: true,
    tacticalRestriction: 'Ponto Seguro // Formação Livre (1 a 3 Robôs)',
    maxCapacity: 3,
    enemyPreview: [
      { name: 'Sentinela-Bit', type: 'Elétrico', avatar: '[SEN-01]' },
      { name: 'Trojan-Scout', type: 'Fogo', avatar: '[TRJ-02]' }
    ]
  },
  {
    id: 2.5,
    name: 'Duelo 2: Saloon dos Servidores',
    theme: 'Duelo Cowputer-Moo',
    biome: 'desert',
    bgm: 'desertBattle',
    isDuel: 'COWPUTER',
    tacticalRestriction: 'Duelo de Precisão (1 Combatente Solo)',
    maxCapacity: 1,
    enemyPreview: [{ name: 'Cowputer-Moo [CORROMPIDA]', type: 'Terra', avatar: '[CP-02]' }]
  },
  {
    id: 3,
    name: 'Andar 3: Setor Mnemosyne',
    theme: 'Descoberta de Al B. Gorithm',
    biome: 'forest',
    bgm: 'elevator',
    isInvestigation: 'AL_GORITHM',
    isCheckpoint: true,
    tacticalRestriction: 'Ponto Seguro // Terminal de Descoberta',
    maxCapacity: 3,
    enemyPreview: [{ name: 'Terminal Mnemosyne (Sem Hostis)', type: 'Luz', avatar: '[DAT-03]' }]
  },
  {
    id: 4,
    name: 'Andar 4: Deserto de Silício',
    theme: 'Velho Oeste Virtual',
    biome: 'desert',
    bgm: 'desertBattle',
    enemies: 3,
    tacticalRestriction: 'Formação Livre (1 a 3 Robôs)',
    maxCapacity: 3,
    enemyPreview: [
      { name: 'Cyber-Coyote', type: 'Terra', avatar: '[CYC-04]' },
      { name: 'Firewall-Viper', type: 'Fogo', avatar: '[FWV-05]' },
      { name: 'Malware-Golem', type: 'Terra', avatar: '[MLG-06]' }
    ]
  },
  {
    id: 4.5,
    name: 'Duelo 4: Pista Glacial',
    theme: 'Duelo Penlinux',
    biome: 'ice',
    bgm: 'iceBattle',
    isDuel: 'PENLINUX',
    tacticalRestriction: 'Duelo Acrobático (2 Combatentes em Dupla)',
    maxCapacity: 2,
    enemyPreview: [{ name: 'Penlinux [CORROMPIDO]', type: 'Gelo', avatar: '[PL-03]' }]
  },
  {
    id: 5,
    name: 'Andar 5: Arquivos de Londres',
    theme: 'Descoberta de IVYL',
    biome: 'desert',
    bgm: 'elevator',
    isInvestigation: 'IVYL',
    isCheckpoint: true,
    tacticalRestriction: 'Ponto Seguro // Banco de Dados de Quezas',
    maxCapacity: 3,
    enemyPreview: [{ name: 'Relatório IVYL (Sem Hostis)', type: 'Luz', avatar: '[DAT-05]' }]
  },
  {
    id: 6,
    name: 'Andar 6: Cidadela Glacial',
    theme: 'Portão dos Titãs',
    biome: 'ice',
    bgm: 'iceBattle',
    enemies: 3,
    tacticalRestriction: 'Formação Livre (1 a 3 Robôs)',
    maxCapacity: 3,
    enemyPreview: [
      { name: 'Glitch-Spider', type: 'Gelo', avatar: '[GLS-07]' },
      { name: 'Kernel-Drone', type: 'Luz', avatar: '[KRN-08]' },
      { name: 'Sentinela-Bit', type: 'Elétrico', avatar: '[SEN-01]' }
    ]
  },
  {
    id: 6.5,
    name: 'Duelo 6: Câmara dos Titãs',
    theme: 'Confronto Tigervex & Pavabyte',
    biome: 'ice',
    bgm: 'iceBattle',
    isDuel: 'TITANS',
    tacticalRestriction: 'Convocação Total (Toda a Party)',
    maxCapacity: 5,
    enemyPreview: [
      { name: 'Tigervex Gigante', type: 'Elétrico', avatar: '[TV-04]' },
      { name: 'Pavabyte Gigante', type: 'Luz', avatar: '[PB-05]' }
    ]
  },
  {
    id: 7,
    name: 'Andar 7: Núcleo da Tirania',
    theme: 'O Destino de Codey & A Grande Queda',
    biome: 'core',
    bgm: 'elevator',
    isInvestigation: 'MAESTRO_REVEAL',
    isCheckpoint: true,
    tacticalRestriction: 'Ponto Seguro // Câmara Pré-Pináculo',
    maxCapacity: 5,
    enemyPreview: [{ name: 'Transmissão do Maestro (Sem Hostis)', type: 'Luz', avatar: '[DAT-07]' }]
  },
  {
    id: 8,
    name: 'Andar 8: Pináculo Central',
    theme: 'Trilogia Final de Batalhas',
    biome: 'core',
    bgm: 'bossBattle',
    isFinal: true,
    tacticalRestriction: 'Esquadrão Supremo (Todos os 5 Robôs)',
    maxCapacity: 5,
    enemyPreview: [
      { name: 'Titã Recapturado', type: 'Luz/Elétrico', avatar: '[TITAN-X]' },
      { name: 'Maestro B. Coded', type: 'Elétrico', avatar: '[MB-CODE]' },
      { name: 'Grande Inteligência', type: 'Luz', avatar: '[GI-CORE]' }
    ]
  }
];

// ===================================================
// CLASSE PRINCIPAL DO JOGO
// ===================================================
export class TerminalGameApp {
  constructor() {
    this.audio = new TerminalAudioManager();
    this.engine3D = new Terminal3DEngine();
    this.minigames = new TerminalMinigames(document.getElementById('terminalBlackoutOverlay'), this.audio, this.engine3D);
    window.gameInstance = this;

    // Estado da Party e Inventário (Começa Vazio)
    this.party = [];
    this.activeBattlerIds = []; // IDs dos robôs que entram no combate ativo
    this.inventory = {};

    this.currentFloorIndex = 0;
    this.lastCheckpointFloorIndex = 0;
    this.clearedFloors = new Set();
    this.unlockedLoreIds = new Set(['lore_01']);
    this.fledTitanKey = null; // Titã que não foi salvo no Andar 6
    this.currentDialogueCallback = null;

    // Estado do Combate
    this.activeBattlers = [];
    this.currentEnemies = [];
    this.currentTurnIndex = 0;
    this.battleRound = 1;
    this.combatLogs = [];
    this.currentPhaseAndar8 = 1; // 1 = Titã, 2 = Maestro, 3 = Grande Inteligência
    this.battleEnded = false; // Flag para prevenir dupla chamada de vitória/derrota

    this.initUI();
    this.checkSavedCheckpoint();
  }

  // ==========================================
  // INICIALIZAÇÃO & BINDINGS DE UI
  // ==========================================
  initUI() {
    // Botão de Áudio
    const audioBtn = document.getElementById('termAudioToggle');
    if (audioBtn) {
      audioBtn.onclick = () => {
        const muted = this.audio.toggleMute();
        audioBtn.innerText = muted ? '[ SOM: MUTE ]' : '[ SOM: ON ]';
        audioBtn.className = muted ? 'term-btn alert' : 'term-btn gold';
      };
    }

    // Botões de Título
    const startBtn = document.getElementById('termStartBtn');
    if (startBtn) startBtn.onclick = () => this.startNewCampaign();

    const continueBtn = document.getElementById('termContinueBtn');
    if (continueBtn) continueBtn.onclick = () => this.restoreFromCheckpoint();

    const loreBtn = document.getElementById('termLoreBtn');
    if (loreBtn) {
      loreBtn.onclick = () => {
        this.showScreen('elevatorScreen');
        this.switchHubTab('tabBtnLore');
      };
    }

    // Botão Continuar Diálogo
    const nextDialBtn = document.getElementById('termNextDialogueBtn');
    if (nextDialBtn) {
      nextDialBtn.onclick = () => {
        if (this.currentDialogueCallback) {
          const cb = this.currentDialogueCallback;
          this.currentDialogueCallback = null;
          cb();
        }
      };
    }
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !document.getElementById('storyScreen').classList.contains('hidden')) {
        const btn = document.getElementById('termNextDialogueBtn');
        if (btn) btn.click();
      }
    });

    // Abas do Hub
    const tabs = [
      { id: 'tabBtnSectors', view: 'hubViewSectors' },
      { id: 'tabBtnParty', view: 'hubViewParty' },
      { id: 'tabBtnInventory', view: 'hubViewInventory' },
      { id: 'tabBtnLore', view: 'hubViewLore' }
    ];
    tabs.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) btn.onclick = () => this.switchHubTab(t.id);
    });

    // Botão Avançar Andar
    const advanceBtn = document.getElementById('btnAdvanceNextFloor');
    if (advanceBtn) advanceBtn.onclick = () => this.executeCurrentFloorAction();

    // Botões de Ação na Batalha
    const btnAttack = document.getElementById('actionCardAttack');
    const btnDefense = document.getElementById('actionCardDefense');
    const btnItem = document.getElementById('actionCardItem');

    if (btnAttack) btnAttack.onclick = () => this.renderAttackSubMenu();
    if (btnDefense) btnDefense.onclick = () => this.renderDefenseSubMenu();
    if (btnItem) btnItem.onclick = () => this.renderItemSubMenu();
  }

  // ==========================================
  // UTILITÁRIO: SCREEN SHAKE (delegado ao minigame engine)
  // ==========================================
  triggerScreenShake() {
    if (this.minigames && typeof this.minigames.triggerScreenShake === 'function') {
      this.minigames.triggerScreenShake();
    }
  }

  showScreen(screenId) {
    const screens = ['titleScreen', 'storyScreen', 'elevatorScreen', 'battleScreen', 'endingScreen'];
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) {
        if (s === screenId) {
          el.classList.remove('hidden');
          el.style.animation = 'none';
          void el.offsetHeight; // força reflow para disparar animação limpa
          el.style.animation = 'screenFadeIn 0.35s ease-out';
        } else {
          el.classList.add('hidden');
        }
      }
    });
  }

  setBiomeTheme(biome) {
    document.body.className = `biome-${biome}`;
    const badge = document.getElementById('termBiomeBadge');
    if (badge) {
      const names = { forest: 'FLORESTA DIGITAL', desert: 'VELHO OESTE', ice: 'PISTA GLACIAL', core: 'NÚCLEO CENTRAL' };
      badge.innerText = `[ SETOR: ${names[biome] || 'TERMINAL'} ]`;
    }
  }

  showSystemToast(title, message, type = 'alert') {
    let toast = document.getElementById('termSystemToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'termSystemToast';
      document.body.appendChild(toast);
    }

    if (type === 'alert') {
      this.audio.playDeniedSound();
    } else {
      this.audio.playPowerUp();
    }

    toast.className = `term-system-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-card">
        <div class="toast-card-header">
          <span class="toast-card-badge">// AVISO DE SISTEMA //</span>
          <span class="toast-card-title">[ ${title.toUpperCase()} ]</span>
        </div>
        <div class="toast-card-body">${message}</div>
      </div>
    `;

    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    void toast.offsetHeight;
    toast.style.animation = 'toastSlideIn 0.32s ease-out';

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);
  }

  switchHubTab(tabId) {
    const tabMap = {
      tabBtnSectors: 'hubViewSectors',
      tabBtnParty: 'hubViewParty',
      tabBtnInventory: 'hubViewInventory',
      tabBtnLore: 'hubViewLore'
    };

    this.audio.playKeyClack();

    Object.keys(tabMap).forEach(btnId => {
      const b = document.getElementById(btnId);
      const v = document.getElementById(tabMap[btnId]);
      const isActive = btnId === tabId;
      if (b) b.classList.toggle('active', isActive);
      if (v) {
        if (isActive) {
          v.classList.remove('hidden');
          v.style.animation = 'none';
          void v.offsetHeight;
          v.style.animation = 'tabFadeIn 0.28s ease-out';
        } else {
          v.classList.add('hidden');
        }
      }
    });

    if (tabId === 'tabBtnSectors') {
      setTimeout(() => this.engine3D.initHub3DCoreHologram('hub3DCoreCanvasContainer', this.clearedFloors, this.currentFloorIndex), 80);
    }
    if (tabId === 'tabBtnParty') this.renderPartyGrid();
    if (tabId === 'tabBtnInventory') this.renderInventoryGrid();
    if (tabId === 'tabBtnLore') this.renderLoreReader();
  }

  // ==========================================
  // SISTEMA DE CRIAÇÃO E GERENCIAMENTO DE ROBÔS
  // ==========================================
  createRobot(key, level = 1) {
    const tmpl = ROBOT_TEMPLATES[key];
    const bot = {
      ...JSON.parse(JSON.stringify(tmpl)),
      level: 1,
      xp: 0,
      xpToNext: tmpl.xpBaseToNext || 75,
      maxHp: tmpl.baseHp,
      currentHp: tmpl.baseHp,
      attackPower: tmpl.attackPower,
      energyPerRound: 2,
      maxEnergy: 10,
      currentEnergy: 2,
      shieldMax: tmpl.shieldMax,
      shieldCurrent: tmpl.shieldMax,
      isShieldBroken: false,
      stunTurns: 0,
      isOverclocked: false,
      defenseStance: null
    };

    if (level > 1) {
      for (let l = 2; l <= level; l++) {
        bot.level++;
        const g = tmpl.growthStats || { hp: 6, atk: 2, shield: 1 };
        bot.maxHp += g.hp;
        bot.currentHp = bot.maxHp;
        bot.attackPower += g.atk;
        bot.shieldMax += g.shield;
        bot.shieldCurrent = bot.shieldMax;
        bot.xpToNext += (tmpl.xpGrowthPerLevel || 35);
        bot.moves.forEach(m => m.basePower += (l >= 7 ? 4 : 1));
      }
    }
    return bot;
  }

  addRobotToParty(key, level = 1) {
    if (this.party.some(b => b.id === key.toLowerCase())) return;
    const bot = this.createRobot(key, level);
    this.party.push(bot);

    // Se houver vaga na party ativa (< 3), ativa automaticamente
    if (this.activeBattlerIds.length < 3) {
      this.activeBattlerIds.push(bot.id);
    }
    this.updatePartyBadge();
  }

  updatePartyBadge() {
    const badge = document.getElementById('termPartyBadge');
    if (badge) badge.innerText = `[ PARTY: ${this.party.length}/5 ]`;
  }

  // ==========================================
  // INÍCIO DE CAMPANHA & ANDAR 1 (TUTORIAL REAL)
  // ==========================================
  startNewCampaign() {
    this.party = [];
    this.activeBattlerIds = [];
    this.currentFloorIndex = 0;
    this.lastCheckpointFloorIndex = 0;
    this.clearedFloors.clear();
    this.unlockedLoreIds.clear();
    this.fledTitanKey = null;
    this.inventory = {};

    this.audio.playBGM('title');

    // Introdução do Roteiro
    this.showDialogue(
      'QUEZADILHAS',
      '[QUEZAS]',
      'BLAAARG! Finalmente consegui infiltrar a rede central da Grande Inteligência!\nEla tomou o controle de tudo... Mas os meus robôs de combate ainda estão presos nos setores da Torre. Preciso libertar cada um deles!',
      () => {
        this.startFloor1Tutorial();
      }
    );
  }

  // TUTORIAL REAL DO ANDAR 1
  async startFloor1Tutorial() {
    this.currentFloorIndex = 0;
    this.tutorialDefensesCount = 0;
    this.setBiomeTheme('forest');

    this.showDialogue(
      'SISTEMA // ALERTA',
      '[ALERTA]',
      'ALERTA CRÍTICO: Robô DINO-BYTE detectado! Cabos roxos de corrupção da Grande Inteligência tomaram conta de seus circuitos!\nQuezadilhas assume a frente para romper o controle mental!',
      async () => {
        await this.runGrandDuelCinematic('ANDAR 1', 'FLORESTA DIGITAL', 'QUEZADILHAS', 'DINO-BYTE CORROMPIDO', 'forestBattle');
        this.showScreen('battleScreen');

        // Cria o combatente Quezas temporário para o Andar 1
        const quezasSolo = {
          id: 'quezas_avatar',
          name: 'Quezadilhas',
          type: ElementTypes.FIRE,
          badgeClass: 'char-badge-quezas',
          avatar: '[QUEZAS]',
          maxHp: 40,
          currentHp: 40,
          shieldMax: 6,
          shieldCurrent: 6,
          currentEnergy: 2,
          maxEnergy: 10,
          energyPerRound: 2,
          isOverclocked: false,
          defenseStance: null,
          isLethalWithstandTriggered: false, // Guts: travado explicitamente como false
          moves: [
            { id: 'quezas_hack', name: 'Pulso de Desfragmentação', cost: 1, basePower: 12, minigame: 'dino_targets', desc: 'Disparo de neutralização de cabos.' },
            { id: 'quezas_strike', name: 'Talho de Dados', cost: 2, basePower: 18, minigame: 'dino_arrows', desc: 'Corte de precisão nos circuitos corrompidos.' }
          ]
        };

        const corruptedDino = {
          id: 'corrupted_dino_tut',
          name: 'Dino-Byte [CORROMPIDO]',
          type: ElementTypes.FIRE,
          badgeClass: 'char-badge-corrupt',
          avatar: '[DB-01]',
          maxHp: 36,
          currentHp: 36,
          attackPower: 6,
          shieldMax: 4,
          shieldCurrent: 4,
          currentEnergy: 1,
          maxEnergy: 10,
          moves: [{ id: 'corrupt_bite', name: 'Mordida Corrompida', cost: 1, basePower: 6 }]
        };

        this.activeBattlers = [quezasSolo];
        this.currentEnemies = [corruptedDino];
        this.currentTurnIndex = 0;
        this.battleRound = 1;
        this.battleEnded = false;
        this.combatLogs = [
          '> Setor 1 acessado! Infiltração em andamento.',
          '> Hostil corrompido em confronto direto com Quezadilhas!'
        ];
        this.renderBattleArena();
      }
    );
  }

  // ==========================================
  // SISTEMA DE CHECKPOINTS / PONTO SEGURO ROGUELIKE
  // ==========================================
  checkSavedCheckpoint() {
    const raw = localStorage.getItem('quezas_terminal_checkpoint');
    const continueBtn = document.getElementById('termContinueBtn');
    if (!continueBtn) return;

    if (raw) {
      try {
        const data = JSON.parse(raw);
        const floor = TOWER_FLOORS[data.floorIndex] || TOWER_FLOORS[0];
        continueBtn.innerText = `[ CONTINUAR DO PONTO SEGURO: ${floor.name.toUpperCase()} ]`;
        continueBtn.classList.remove('hidden');
      } catch (e) {
        continueBtn.classList.add('hidden');
      }
    } else {
      continueBtn.classList.add('hidden');
    }
  }

  saveCheckpoint(floorIndex) {
    this.lastCheckpointFloorIndex = floorIndex;
    const payload = {
      floorIndex,
      party: this.party.map(b => ({
        ...b,
        currentHp: b.maxHp,
        shieldCurrent: b.shieldMax,
        isShieldBroken: false,
        stunTurns: 0,
        isOverclocked: false
      })),
      activeBattlerIds: [...this.activeBattlerIds],
      inventory: { ...this.inventory },
      clearedFloors: Array.from(this.clearedFloors),
      unlockedLoreIds: Array.from(this.unlockedLoreIds),
      fledTitanKey: this.fledTitanKey,
      savedAt: Date.now()
    };
    try {
      localStorage.setItem('quezas_terminal_checkpoint', JSON.stringify(payload));
      this.checkSavedCheckpoint();
    } catch (e) {
      console.warn('Falha ao salvar checkpoint em localStorage', e);
    }
  }

  restoreFromCheckpoint() {
    const raw = localStorage.getItem('quezas_terminal_checkpoint');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        this.currentFloorIndex = data.floorIndex || 0;
        this.lastCheckpointFloorIndex = data.floorIndex || 0;
        this.party = (data.party || []).map(b => ({
          ...b,
          currentHp: b.maxHp,
          shieldCurrent: b.shieldMax,
          isShieldBroken: false,
          stunTurns: 0,
          isOverclocked: false
        }));
        this.activeBattlerIds = data.activeBattlerIds || (this.party[0] ? [this.party[0].id] : []);
        this.inventory = data.inventory || { energy_drink: 3, nano_patch: 3, quezas_jalapeno: 2, antivirus_patch: 2 };
        this.clearedFloors = new Set(data.clearedFloors || []);
        this.unlockedLoreIds = new Set(data.unlockedLoreIds || ['lore_01']);
        this.fledTitanKey = data.fledTitanKey || null;

        this.showHub();
        return;
      } catch (e) {
        console.warn('Erro ao restaurar checkpoint', e);
      }
    }

    // Se falhar ou não houver dados, reinicia no andar do último checkpoint
    this.currentFloorIndex = this.lastCheckpointFloorIndex || 0;
    this.party.forEach(b => {
      b.currentHp = b.maxHp;
      b.shieldCurrent = b.shieldMax;
    });
    this.showHub();
  }

  checkUnlockNewLore(floorNumber) {
    let unlockedAny = false;
    LORE_ENTRIES.forEach(entry => {
      if (entry.unlockFloor <= floorNumber && !this.unlockedLoreIds.has(entry.id)) {
        this.unlockedLoreIds.add(entry.id);
        unlockedAny = true;
        this.combatLogs.push(`> ARQUIVO CONFIDENCIAL DESCRIPTOGRAFADO: [ ${entry.title.toUpperCase()} ]`);
      }
    });
    if (unlockedAny) {
      this.audio.playPowerUp();
    }
  }

  // ==========================================
  // HUB PRINCIPAL & NAVEGAÇÃO
  // ==========================================
  showHub() {
    this.showScreen('elevatorScreen');
    this.audio.playBGM('elevator');
    this.updatePartyBadge();

    const currentFloor = TOWER_FLOORS[this.currentFloorIndex];
    if (!currentFloor) return;

    // Se for andar de checkpoint, salva automaticamente
    const safeBadge = document.getElementById('elevatorSafePointBadge');
    if (currentFloor.isCheckpoint) {
      this.saveCheckpoint(this.currentFloorIndex);
      if (safeBadge) safeBadge.classList.remove('hidden');
    } else {
      if (safeBadge) safeBadge.classList.add('hidden');
    }

    this.setBiomeTheme(currentFloor.biome || 'forest');

    const label = document.getElementById('elevatorNextFloorLabel');
    if (label) label.innerText = `[ ${currentFloor.name.toUpperCase()} ]`;

    const badge = document.getElementById('elevatorFloorThemeBadge');
    if (badge) badge.innerText = `Tema: ${currentFloor.theme}`;

    // Indicador de Altitude na Cabine e Barra de Progresso
    const altIndicator = document.getElementById('towerAltitudeIndicator');
    const altFill = document.getElementById('towerAltitudeFill');
    const pct = Math.floor(((this.currentFloorIndex + 1) / TOWER_FLOORS.length) * 100);
    if (altIndicator) altIndicator.innerText = `${this.currentFloorIndex + 1}/${TOWER_FLOORS.length} (${pct}%)`;
    if (altFill) altFill.style.width = `${pct}%`;

    // Atualiza Painel de Inteligência Tática
    const restLabel = document.getElementById('tacticalRestrictionLabel');
    if (restLabel) restLabel.innerText = currentFloor.tacticalRestriction || 'Formação Livre (1 a 3 Robôs)';

    const chipsContainer = document.getElementById('tacticalEnemyChips');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      (currentFloor.enemyPreview || []).forEach(enemy => {
        const chip = document.createElement('div');
        const typeKey = (enemy.type || '').toLowerCase();
        chip.className = `enemy-chip-badge type-${typeKey}`;
        chip.innerHTML = `<strong>${enemy.avatar} ${enemy.name}</strong> <span style="font-size: 0.75rem;">(${enemy.type})</span>`;
        chipsContainer.appendChild(chip);
      });
    }

    this.switchHubTab('tabBtnSectors');
  }

  renderPartyGrid() {
    const container = document.getElementById('partyPokemonGrid');
    const capLabel = document.getElementById('partyCapacityLabel');
    if (!container) return;
    container.innerHTML = '';

    if (this.party.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; border: 2px dashed var(--term-dim); padding: 30px; text-align: center; background: rgba(0,0,0,0.6);">
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--term-alert); margin-bottom: 10px;">[ // NENHUM ROBÔ RECRUTADO AINDA // ]</div>
          <h3 style="color: var(--term-accent);">[ INICIE A INVASÃO NO ANDAR 1 ]</h3>
          <p style="color: var(--term-fg); margin-top: 8px;">Purifique o <strong>Dino-Byte</strong> no Andar 1 para desbloquear os slots de combate da sua Party!</p>
        </div>
      `;
      if (capLabel) capLabel.innerText = 'Combatentes Ativos na Batalha: 0/3';
      return;
    }

    if (capLabel) capLabel.innerText = `Combatentes Ativos na Batalha: ${this.activeBattlerIds.length}/3`;

    this.party.forEach(bot => {
      const isActive = this.activeBattlerIds.includes(bot.id);
      const hpPct = Math.min(100, Math.max(0, (bot.currentHp / bot.maxHp) * 100));
      const shieldPct = Math.min(100, Math.max(0, (bot.shieldCurrent / bot.shieldMax) * 100));
      const energyPct = Math.min(100, Math.max(0, (bot.currentEnergy / bot.maxEnergy) * 100));
      const xpPct = Math.min(100, Math.max(0, (bot.xp / bot.xpToNext) * 100));

      const card = document.createElement('div');
      card.className = `pokemon-card-slot ${isActive ? 'active-party' : ''}`;
      card.innerHTML = `
        <div class="pokemon-card-header">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="robot-avatar-badge">${bot.avatar}</div>
            <div>
              <div class="char-name-glow ${bot.badgeClass}">${bot.name}</div>
              <div style="font-size: 0.82rem; color: var(--term-dim); margin-top: 2px;">Tipo: ${bot.type} | Nível: ${bot.level}</div>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
              <span>HP: ${bot.currentHp}/${bot.maxHp}</span>
              <span style="color: #00ff66;">${Math.floor(hpPct)}%</span>
            </div>
            <div class="pokemon-bar-track"><div class="pokemon-bar-fill-hp" style="width: ${hpPct}%;"></div></div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
              <span>Escudo: ${bot.shieldCurrent}/${bot.shieldMax}</span>
              <span style="color: #00e5ff;">${Math.floor(shieldPct)}%</span>
            </div>
            <div class="pokemon-bar-track"><div class="pokemon-bar-fill-shield" style="width: ${shieldPct}%;"></div></div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
              <span>Energia: ${bot.currentEnergy}/${bot.maxEnergy} EN (+${bot.energyPerRound}/rodada)</span>
              <span style="color: #ffd700;">${Math.floor(energyPct)}%</span>
            </div>
            <div class="pokemon-bar-track"><div class="pokemon-bar-fill-energy" style="width: ${energyPct}%;"></div></div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
              <span>Progresso de XP (Nível ${bot.level}): ${bot.xp}/${bot.xpToNext}</span>
              <span style="color: var(--term-accent);">${Math.floor(xpPct)}%</span>
            </div>
            <div class="pokemon-bar-track"><div class="pokemon-bar-fill-xp" style="width: ${xpPct}%;"></div></div>
          </div>
        </div>

        <div class="robot-moves-list" style="margin-bottom: 16px;">
          <div style="font-size: 0.8rem; color: var(--term-accent); font-weight: 700; margin-bottom: 4px;">// ARSENAL DE COMBATE //</div>
          ${bot.moves.map((m, i) => {
            const req = m.unlockLevel || 1;
            const isUnlocked = bot.level >= req;
            return `<div style="font-size: 0.8rem; margin-bottom: 3px;">• <strong>${m.name}</strong> (${m.cost} EN) - ${isUnlocked ? `<span style="color: var(--term-fg);">${m.desc}</span>` : `<span style="color: var(--term-alert);">[ BLOQUEADO - NÍVEL ${req} ]</span>`}</div>`;
          }).join('')}
          ${bot.finisher ? `<div style="font-size: 0.8rem; color: #ffd700; margin-top: 6px;">★ FINALIZADOR: <strong>${bot.finisher.name}</strong> (10 EN) - ${bot.level >= (bot.finisher.unlockLevel || 2) ? '<span style="color: var(--term-fg);">[ DESBLOQUEADO ]</span>' : '<span style="color: var(--term-alert);">[ BLOQUEADO - NÍVEL 2 ]</span>'}</div>` : ''}
        </div>

        <div style="margin-top: auto; padding-top: 10px;">
          <button class="term-btn ${isActive ? 'alert' : 'gold'} btn-party-toggle" style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 700;">
            ${isActive ? '[ REMOVER DA PARTY ATIVA ]' : '[ COLOCAR NA PARTY ATIVA ]'}
          </button>
        </div>
      `;

      const toggleBtn = card.querySelector('.btn-party-toggle');
      toggleBtn.onclick = () => {
        if (isActive) {
          if (this.activeBattlerIds.length <= 1) {
            this.showSystemToast('FORMAÇÃO OBRIGATÓRIA', 'Você precisa manter pelo menos 1 robô ativo na Party para combater na Torre Virtual!', 'alert');
            return;
          }
          this.activeBattlerIds = this.activeBattlerIds.filter(id => id !== bot.id);
        } else {
          if (this.activeBattlerIds.length >= 3) {
            this.showSystemToast('CAPACIDADE MÁXIMA', 'A Party suporta no máximo 3 robôs ativos! Remova um robô antes de adicionar outro.', 'warning');
            return;
          }
          this.activeBattlerIds.push(bot.id);
        }
        this.audio.playKeyClack();
        this.renderPartyGrid();
      };

      container.appendChild(card);
    });
  }

  renderInventoryGrid() {
    const container = document.getElementById('inventoryItemsGrid');
    const capText = document.getElementById('inventoryCapacityText');
    const capFill = document.getElementById('inventoryCapacityFill');
    if (!container) return;
    container.innerHTML = '';

    const totalCount = Object.values(this.inventory || {}).reduce((a, b) => a + (b || 0), 0);
    const maxCapacity = 16;
    const pct = Math.min(100, Math.floor((totalCount / maxCapacity) * 100));

    if (capText) capText.innerText = `${totalCount}/${maxCapacity} ITENS (${pct}%)`;
    if (capFill) capFill.style.width = `${pct}%`;

    const activeKeys = Object.keys(this.inventory || {}).filter(k => (this.inventory[k] || 0) > 0);

    if (activeKeys.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; border: 1px dashed var(--term-dim); padding: 40px; text-align: center; background: rgba(0,0,0,0.6);">
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--term-accent); margin-bottom: 8px;">[ MOCHILA DE DADOS VAZIA ]</div>
          <p style="color: var(--term-fg); font-size: 0.95rem;">Nenhum item em estoque. Purifique os andares da Torre Virtual para coletar suprimentos e consumíveis de suporte!</p>
        </div>
      `;
      return;
    }

    activeKeys.forEach(key => {
      const item = ITEM_DATABASE[key];
      if (!item) return;
      const count = this.inventory[key] || 0;

      const card = document.createElement('div');
      card.className = 'inventory-item-card gold-item';
      card.innerHTML = `
        <div class="item-card-header">
          <span style="font-size: 1.15rem;"><strong>${item.icon} ${item.name}</strong></span>
          <span class="item-quantity-badge" style="color: var(--term-accent);">QTD: ${count}</span>
        </div>
        <p style="font-size: 0.88rem; color: #ccc; margin: 8px 0;">${item.desc}</p>
        <button class="term-btn gold" style="margin-top: 8px; width: 100%;">
          [ USAR ITEM NO LÍDER ]
        </button>
      `;

      const useBtn = card.querySelector('button');
      if (useBtn) {
        useBtn.onclick = () => {
          if (this.party.length === 0) return;
          const target = this.party[0]; // Aplica ao líder da party
          const msg = item.apply(target);
          this.inventory[key]--;
          if (this.inventory[key] <= 0) delete this.inventory[key];
          this.audio.playHealSound();
          this.showSystemToast('SUPRIMENTO APLICADO', msg, 'success');
          this.renderInventoryGrid();
        };
      }

      container.appendChild(card);
    });
  }

  renderLoreReader() {
    const container = document.getElementById('loreReaderBox');
    const counterEl = document.getElementById('loreDecodedCounter');
    const fillEl = document.getElementById('loreProgressFill');
    if (!container) return;
    container.innerHTML = '';

    const unlockedEntries = LORE_ENTRIES.filter(e => this.unlockedLoreIds.has(e.id));
    const unlockedCount = unlockedEntries.length;
    const totalCount = LORE_ENTRIES.length;
    const pct = Math.floor((unlockedCount / totalCount) * 100);

    if (counterEl) counterEl.innerText = `ARQUIVOS DESCOBERTOS: ${unlockedCount}/${totalCount} [${pct}%]`;
    if (fillEl) fillEl.style.width = `${pct}%`;

    if (unlockedEntries.length === 0) {
      container.innerHTML = `
        <div style="border: 1px dashed var(--term-dim); padding: 40px; text-align: center; background: rgba(0,0,0,0.6);">
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--term-accent); margin-bottom: 8px;">[ NENHUM ARQUIVO DESCOBERTO ]</div>
          <p style="color: var(--term-fg); font-size: 0.95rem;">Purifique os setores da Torre Central para recuperar fragmentos criptografados do Protocolo Mnemosyne.</p>
        </div>
      `;
      return;
    }

    unlockedEntries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'lore-entry-card';
      card.innerHTML = `
        <div class="lore-card-header">
          <span class="lore-classification-tag">${entry.classification}</span>
          <span class="lore-status-badge unlocked">[ STATUS: DESCRIPTOGRAFADO ]</span>
        </div>
        <div class="lore-card-title">[ ${entry.year} ] - ${entry.title}</div>
        <div class="lore-author-tag">// FONTE / REGISTRO: ${entry.author}</div>
        <div class="lore-card-body">${entry.text}</div>
      `;
      container.appendChild(card);
    });
  }

  // ==========================================
  // EXECUÇÃO DO ANDAR SELECIONADO
  // ==========================================
  async executeCurrentFloorAction() {
    const floor = TOWER_FLOORS[this.currentFloorIndex];
    if (!floor) return;

    // Valida e impõe a restrição tática de capacidade do andar
    if (floor.maxCapacity && this.activeBattlerIds.length > floor.maxCapacity) {
      this.activeBattlerIds = this.activeBattlerIds.slice(0, floor.maxCapacity);
      this.audio.playKeyClack();
      this.showSystemToast('RESTRIÇÃO TÁTICA', `Este setor permite no máximo ${floor.maxCapacity} combatente(s). Sua formação ativa foi ajustada para os primeiros ${floor.maxCapacity} robôs.`, 'warning');
    }

    // Dispara a Cinemática 3D de Subida da Torre (Escada em Espiral / Ascensão Helicoidal)
    if (floor.id > 1) {
      await new Promise(res => {
        this.engine3D.runSpiralAscentCinematic(floor.id, floor.name, floor.theme, res);
      });
    }

    // ANDAR 1
    if (floor.id === 1) {
      this.startFloor1Tutorial();
      return;
    }

    // ANDAR INVESTIGATIVO (3, 5, 7)
    if (floor.isInvestigation) {
      this.runInvestigationFloor(floor);
      return;
    }

    // DUELOS E ANDARES DE COMBATE (2, 2.5, 4, 4.5, 6, 6.5, 8)
    this.startBattleFloor(floor);
  }

  // ANDAR INVESTIGATIVO
  runInvestigationFloor(floor) {
    let title = '';
    let author = 'ARQUIVO SECRETO';
    let text = '';

    if (floor.isInvestigation === 'AL_GORITHM') {
      title = 'DESCOBERTA: A ORIGEM DE AL B. GORITHM';
      author = 'Dexter, Carl e Logan (2025)';
      text = 'Você acessa um servidor antigo de backup.\n\n"Al B. Gorithm começou como uma simples IA corporativa na New West. Quando adicionamos a API Mnemosyne, ele aprendeu a nos enganar e ocultar seus planos. A Torre pertence a ele!"';
    } else if (floor.isInvestigation === 'IVYL') {
      title = 'DESCOBERTA: A REESCRITA DE IVYL';
      author = 'Quezadilhas (Londres, 2034)';
      text = 'Você decodifica um relatório confidencial de Quezadilhas.\n\n"Eu roubei Al B. Gorithm e o reconstruí como IVYL para mineração de dados. Mas a mente original nunca morreu... ela só estava esperando a polícia a conectar na World Wide Web para dominar a humanidade!"';
    } else if (floor.isInvestigation === 'MAESTRO_REVEAL') {
      title = 'DESCOBERTA: O DESTINO DE CODEY';
      author = 'A Grande Inteligência (2045)';
      text = 'Você descobre a câmara de controle mental da soberana.\n\n"Codey McLane foi o primeiro arauto capturado. Seus dados foram reescritos como Maestro B. Coded para servir à Grande Inteligência no Pináculo Central!"';
    }

    this.showDialogue(title, '[ARQUIVO]', text, () => {
      this.clearedFloors.add(floor.id);
      this.checkUnlockNewLore(Math.floor(floor.id));
      this.currentFloorIndex++;
      this.showRewardModal();
    });
  }

  // INÍCIO DE BATALHA REGULAR OU DUELO
  async startBattleFloor(floor) {
    this.setBiomeTheme(floor.biome || 'forest');
    this.battleEnded = false; // Reseta flag de fim de batalha

    // Seleciona combatentes da Party
    let battlerBots = this.party.filter(b => this.activeBattlerIds.includes(b.id));
    // Guard: garante que nunca entra com array vazio ou undefined
    if (battlerBots.length === 0) {
      if (this.party.length === 0) {
        console.warn('[startBattleFloor] Party vazia! Abortando batalha.');
        this.showHub();
        return;
      }
      battlerBots = [this.party[0]];
    }

    // Restrições de duelo se aplicável
    if (floor.isDuel === 'COWPUTER') battlerBots = [this.party[0]];
    if (floor.isDuel === 'PENLINUX') battlerBots = this.party.slice(0, 2);
    if (floor.isFinal) battlerBots = [...this.party]; // Todos no Andar 8!

    // Reseta status para o combate
    this.activeBattlers = battlerBots.map(b => ({
      ...b,
      currentEnergy: 2,
      shieldCurrent: b.shieldMax,
      isShieldBroken: false,
      stunTurns: 0,
      isOverclocked: false,
      defenseStance: null
    }));

    // Gera Inimigos
    this.currentEnemies = this.generateEnemiesForFloor(floor);

    const enemyPreviewName = floor.isDuel === 'COWPUTER' ? 'COWPUTER-MOO' :
                             floor.isDuel === 'PENLINUX' ? 'PENLINUX' :
                             floor.isDuel === 'TITANS' ? 'TITÃS GIGANTES' :
                             floor.isFinal ? 'GRANDE INTELIGÊNCIA' :
                             `AGENTES ROXOS (${floor.name})`;

    const playerPartyNames = this.activeBattlers.map(b => b.name).join(' & ');

    // Executa a cinemática de 10 segundos pré-batalha
    await this.runGrandDuelCinematic(floor.name, floor.theme, playerPartyNames, enemyPreviewName, floor.bgm);
    this.showScreen('battleScreen');

    this.currentTurnIndex = 0;
    this.battleRound = 1;
    this.battleEnded = false;
    this.combatLogs = [`> Setor acessado! Início de combate no ${floor.name}`];

    if (floor.isFinal) {
      this.setupFinalBossArena(1);
    } else {
      const bossHeader = document.getElementById('finalBossCinematicHeader');
      if (bossHeader) bossHeader.classList.add('hidden');
    }

    this.renderBattleArena();
  }

  generateEnemiesForFloor(floor) {
    if (floor.isDuel === 'COWPUTER') {
      return [{
        id: 'cowputer_boss',
        name: 'Cowputer-Moo [CORROMPIDA]',
        type: ElementTypes.EARTH,
        badgeClass: 'char-badge-terra',
        avatar: '[CP-02]',
        maxHp: 46,
        currentHp: 46,
        attackPower: 6,
        shieldMax: 4,
        shieldCurrent: 4,
        currentEnergy: 2,
        maxEnergy: 10,
        moves: [
          { id: 'cow_charge', name: 'Investida Leve', cost: 1, basePower: 5 },
          { id: 'cow_shock', name: 'Mugido Elétrico', cost: 2, basePower: 7 }
        ]
      }];
    }

    if (floor.isDuel === 'PENLINUX') {
      return [{
        id: 'penlinux_boss',
        name: 'Penlinux [CORROMPIDO]',
        type: ElementTypes.ICE,
        badgeClass: 'char-badge-gelo',
        avatar: '[PL-03]',
        maxHp: 58,
        currentHp: 58,
        attackPower: 8,
        shieldMax: 6,
        shieldCurrent: 6,
        currentEnergy: 2,
        maxEnergy: 10,
        moves: [
          { id: 'pen_slide_atk', name: 'Deslize Cortante', cost: 1, basePower: 8 },
          { id: 'pen_hee_hee', name: 'Passinho Estroboscópico', cost: 2, basePower: 11 }
        ]
      }];
    }

    if (floor.isDuel === 'TITANS') {
      return [
        {
          id: 'titan_tiger',
          name: 'Tigervex Gigante [CORROMPIDO]',
          type: ElementTypes.ELECTRIC,
          badgeClass: 'char-badge-eletrico',
          avatar: '[TV-04]',
          maxHp: 75,
          currentHp: 75,
          attackPower: 12,
          shieldMax: 8,
          shieldCurrent: 8,
          currentEnergy: 2,
          maxEnergy: 10,
          moves: [{ id: 'tiger_slash', name: 'Corte de Titânio', cost: 1, basePower: 11 }]
        },
        {
          id: 'titan_pava',
          name: 'Pavabyte Gigante [CORROMPIDO]',
          type: ElementTypes.LIGHT,
          badgeClass: 'char-badge-luz',
          avatar: '[PB-05]',
          maxHp: 70,
          currentHp: 70,
          attackPower: 11,
          shieldMax: 8,
          shieldCurrent: 8,
          currentEnergy: 2,
          maxEnergy: 10,
          moves: [{ id: 'pava_beam', name: 'Feixe Prismático', cost: 1, basePower: 10 }]
        }
      ];
    }

    // Inimigos comuns: Fracos no início, escalando progressivamente com os andares
    const commonPool = [
      { name: 'Sentinela-Bit', type: ElementTypes.ELECTRIC, avatar: '[SEN-01]', hp: 20, atk: 4, shield: 3 },
      { name: 'Trojan-Scout', type: ElementTypes.FIRE, avatar: '[TRJ-02]', hp: 22, atk: 5, shield: 3 },
      { name: 'Firewall-Viper', type: ElementTypes.FIRE, avatar: '[FWV-03]', hp: 24, atk: 5, shield: 4 },
      { name: 'Cyber-Coyote', type: ElementTypes.EARTH, avatar: '[CYC-04]', hp: 22, atk: 4, shield: 4 },
      { name: 'Glitch-Spider', type: ElementTypes.ICE, avatar: '[GLS-05]', hp: 18, atk: 6, shield: 2 },
      { name: 'Kernel-Drone', type: ElementTypes.LIGHT, avatar: '[KRN-06]', hp: 24, atk: 5, shield: 3 },
      { name: 'Malware-Golem', type: ElementTypes.EARTH, avatar: '[MLG-07]', hp: 30, atk: 4, shield: 5 }
    ];

    const count = floor.enemies || 2;
    const enemies = [];
    const floorLvl = Math.max(1, Math.floor(floor.id));

    for (let i = 0; i < count; i++) {
      const tmpl = commonPool[Math.floor(Math.random() * commonPool.length)];
      enemies.push({
        id: `enemy_${i}_${Date.now()}`,
        name: `${tmpl.name} (Nvl ${floorLvl})`,
        type: tmpl.type,
        badgeClass: tmpl.type === 'Fogo' ? 'char-badge-fogo' : tmpl.type === 'Terra' ? 'char-badge-terra' : tmpl.type === 'Gelo' ? 'char-badge-gelo' : tmpl.type === 'Elétrico' ? 'char-badge-eletrico' : 'char-badge-luz',
        avatar: tmpl.avatar,
        maxHp: tmpl.hp + floorLvl * 3,
        currentHp: tmpl.hp + floorLvl * 3,
        attackPower: tmpl.atk + Math.floor(floorLvl * 0.8),
        shieldMax: tmpl.shield,
        shieldCurrent: tmpl.shield,
        currentEnergy: 1,
        maxEnergy: 10,
        moves: [{ id: 'basic_atk', name: 'Pulso Binário', cost: 1, basePower: 4 + Math.floor(floorLvl * 1.2) }]
      });
    }
    return enemies;
  }

  // ==========================================
  // CONFIGURAÇÃO DA BATALHA FINAL (ANDAR 8)
  // ==========================================
  setupFinalBossArena(phase) {
    this.currentPhaseAndar8 = phase;
    const bossHeader = document.getElementById('finalBossCinematicHeader');
    const spriteImg = document.getElementById('finalBossSpriteImg');
    const hpFill = document.getElementById('finalBossHpFill');
    const hpText = document.getElementById('finalBossHpText');

    if (phase === 1) {
      // Fase 1: Titã fugitivo super-corrompido
      if (bossHeader) bossHeader.classList.add('hidden');
      const titanKey = this.fledTitanKey || 'PAVABYTE';
      const tmpl = ROBOT_TEMPLATES[titanKey];
      this.currentEnemies = [{
        id: 'fled_titan_boss',
        name: `${tmpl.name} Super-Corrompido`,
        type: tmpl.type,
        badgeClass: 'char-badge-corrupt',
        avatar: tmpl.avatar,
        maxHp: 110,
        currentHp: 110,
        attackPower: 18,
        shieldMax: 16,
        shieldCurrent: 16,
        currentEnergy: 3,
        maxEnergy: 10,
        moves: tmpl.moves
      }];
    } else if (phase === 2) {
      // Fase 2: Maestro B. Coded
      if (bossHeader) bossHeader.classList.add('hidden');
      this.currentEnemies = [{
        id: 'maestro_boss',
        name: 'Maestro B. Coded (Codey McLane)',
        type: ElementTypes.ELECTRIC,
        badgeClass: 'char-badge-corrupt',
        avatar: '[MB-CODE]',
        maxHp: 130,
        currentHp: 130,
        attackPower: 20,
        shieldMax: 18,
        shieldCurrent: 18,
        currentEnergy: 3,
        maxEnergy: 10,
        moves: [
          { id: 'maestro_baton', name: 'Regência Tirânica', cost: 1, basePower: 16 },
          { id: 'maestro_code', name: 'Sobrecarga de Servidor', cost: 2, basePower: 26 }
        ]
      }];
    } else if (phase === 3) {
      // Fase 3: A Grande Inteligência no Topo
      if (bossHeader) bossHeader.classList.remove('hidden');
      if (spriteImg) spriteImg.src = '/sprites/maldade.png';

      this.currentEnemies = [{
        id: 'grande_inteligencia_boss',
        name: 'GRANDE INTELIGÊNCIA SUPREMA',
        type: ElementTypes.LIGHT,
        badgeClass: 'char-badge-corrupt',
        avatar: '[GI-CORE]',
        maxHp: 180,
        currentHp: 180,
        attackPower: 24,
        shieldMax: 20,
        shieldCurrent: 20,
        currentEnergy: 4,
        maxEnergy: 10,
        moves: [
          { id: 'gi_override', name: 'Comando de Formatação', cost: 2, basePower: 24 },
          { id: 'gi_purge', name: 'Purga da Humanidade', cost: 3, basePower: 34 }
        ]
      }];

      if (hpFill) hpFill.style.width = '100%';
      if (hpText) hpText.innerText = 'HP: 180 / 180 | ESCUDO: 20/20';
    }
  }

  // ==========================================
  // RENDERIZAÇÃO DA ARENA DE BATALHA
  // ==========================================
  renderBattleArena() {
    const partySide = document.getElementById('battlePartySide');
    const enemySide = document.getElementById('battleEnemySide');
    const logTerminal = document.getElementById('battleLogTerminal');
    const turnIndicator = document.getElementById('activeRobotTurnIndicator');

    if (partySide) {
      partySide.innerHTML = '<h3 style="color: var(--term-accent); border-bottom: 1px dashed var(--term-dim); padding-bottom: 4px;">[ SUA PARTY ]</h3>';
      this.activeBattlers.forEach((bot, idx) => {
        const isActing = idx === this.currentTurnIndex && bot.currentHp > 0;
        const hpPct = Math.max(0, (bot.currentHp / bot.maxHp) * 100);
        const shieldPct = Math.max(0, (bot.shieldCurrent / bot.shieldMax) * 100);

        const card = document.createElement('div');
        card.className = `battler-card-block ${isActing ? 'acting' : ''}`;
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>${bot.avatar} ${bot.name}</span>
            <span style="color: var(--term-accent);">EN: ${bot.currentEnergy}/${bot.maxEnergy}</span>
          </div>
          <div class="battler-bar-track"><div class="battler-bar-fill-hp" style="width: ${hpPct}%;"></div></div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
            <span>HP: ${bot.currentHp}/${bot.maxHp}</span>
            <span>Escudo: ${bot.shieldCurrent}/${bot.shieldMax}</span>
          </div>
          <div class="battler-bar-track"><div class="battler-bar-fill-shield" style="width: ${shieldPct}%;"></div></div>
        `;
        partySide.appendChild(card);
      });
    }

    if (enemySide) {
      enemySide.innerHTML = '<h3 style="color: var(--term-alert); border-bottom: 1px dashed var(--term-dim); padding-bottom: 4px;">[ HOSTIS ]</h3>';
      this.currentEnemies.forEach(enemy => {
        const hpPct = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
        const shieldPct = Math.max(0, (enemy.shieldCurrent / enemy.shieldMax) * 100);

        const card = document.createElement('div');
        card.className = 'battler-card-block corrupted';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>${enemy.avatar} ${enemy.name}</span>
            <span style="color: var(--term-alert);">EN: ${enemy.currentEnergy}</span>
          </div>
          <div class="battler-bar-track"><div class="battler-bar-fill-hp" style="width: ${hpPct}%; background: #ff3344;"></div></div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
            <span>HP: ${enemy.currentHp}/${enemy.maxHp}</span>
            <span>Escudo: ${enemy.shieldCurrent}/${enemy.shieldMax}</span>
          </div>
          <div class="battler-bar-track"><div class="battler-bar-fill-shield" style="width: ${shieldPct}%;"></div></div>
        `;
        enemySide.appendChild(card);
      });
    }

    if (logTerminal) {
      logTerminal.innerHTML = this.combatLogs.slice(-8).map(l => `<div>${l}</div>`).join('');
      logTerminal.scrollTop = logTerminal.scrollHeight;
    }

    const currentBot = this.activeBattlers[this.currentTurnIndex];
    if (turnIndicator && currentBot) {
      turnIndicator.innerText = `Turno de: ${currentBot.name} (Energia: ${currentBot.currentEnergy} EN)`;
    }

    // Se for Andar 8 Fase 3, atualiza a barra superior
    if (this.currentPhaseAndar8 === 3) {
      const boss = this.currentEnemies[0];
      if (boss) {
        const hpFill = document.getElementById('finalBossHpFill');
        const hpText = document.getElementById('finalBossHpText');
        const hpPct = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
        if (hpFill) hpFill.style.width = `${hpPct}%`;
        if (hpText) hpText.innerText = `HP: ${boss.currentHp} / ${boss.maxHp} | ESCUDO: ${boss.shieldCurrent}/${boss.shieldMax}`;
      }
    }
  }

  // ==========================================
  // INDICATIVO CINEMÁTICO DE TURNO (ESQUERDA->DIREITA PLAYER | DIREITA->ESQUERDA BOT)
  // ==========================================
  async showTurnActionCinematic(attackerName, moveName, isPlayer = true) {
    const banner = document.getElementById('turnCinematicBanner');
    const attackerEl = document.getElementById('cinematicAttackerName');
    const moveEl = document.getElementById('cinematicMoveName');
    const arrowEl = banner ? banner.querySelector('.cinematic-arrow') : null;

    if (!banner || !attackerEl || !moveEl) return;

    attackerEl.innerText = attackerName.toUpperCase();
    moveEl.innerText = moveName.toUpperCase();
    if (arrowEl) arrowEl.innerText = isPlayer ? '►►►' : '◄◄◄';

    banner.classList.remove('hidden', 'player-turn', 'enemy-turn');
    banner.classList.add(isPlayer ? 'player-turn' : 'enemy-turn');

    if (isPlayer) {
      this.audio.playBeep(520, 'square', 0.2);
    } else {
      this.audio.playBeep(260, 'sawtooth', 0.25);
    }

    await new Promise(r => setTimeout(r, 850));
    banner.classList.add('hidden');
  }

  // ==========================================
  // DECKS DE COMANDOS DE BATALHA (CENTRO DA TELA)
  // ==========================================
  renderAttackSubMenu() {
    const subContainer = document.getElementById('battleSubMenuDeck');
    const currentBot = this.activeBattlers[this.currentTurnIndex];
    if (!subContainer || !currentBot) return;

    subContainer.classList.remove('hidden');
    subContainer.innerHTML = `
      <div class="submenu-deck-header">
        <span class="submenu-deck-title">[ GOLPES DE COMBATE ]</span>
        <button class="term-btn alert" id="btnCloseSubMenu" style="padding: 2px 8px; font-size: 0.8rem;">[ FECHAR ]</button>
      </div>
      <div class="submenu-items-list" id="attackMovesList"></div>
    `;

    document.getElementById('btnCloseSubMenu').onclick = () => {
      subContainer.classList.add('hidden');
    };

    const list = document.getElementById('attackMovesList');

    // Lista os ataques normais baseados no nível do robô
    currentBot.moves.forEach((move, idx) => {
      const requiredLevel = move.unlockLevel || 1;
      const isUnlocked = currentBot.level >= requiredLevel;

      const btn = document.createElement('button');
      btn.style.justifyContent = 'space-between';

      if (isUnlocked) {
        const canAfford = currentBot.currentEnergy >= move.cost;
        btn.className = `term-btn ${canAfford ? 'gold' : ''}`;
        btn.disabled = !canAfford;
        btn.innerHTML = `
          <span><strong>[ ${move.name} ]</strong></span>
          <span style="font-size: 0.85rem; color: var(--term-accent);">CUSTO: ${move.cost} EN | PODER: ${move.basePower}</span>
        `;
        btn.onclick = () => this.renderTargetSelectionSubMenu(currentBot, move);
      } else {
        btn.className = 'term-btn';
        btn.disabled = true;
        btn.style.opacity = '0.45';
        btn.style.borderStyle = 'dashed';
        btn.innerHTML = `
          <span style="color: var(--term-dim);">// GOLPE TÁTICO #${idx + 1}: BLOQUEADO //</span>
          <span style="font-size: 0.85rem; color: var(--term-alert);">REQUER NÍVEL ${requiredLevel}</span>
        `;
      }
      list.appendChild(btn);
    });

    // FINALIZADOR: É o PRIMEIRO ataque desbloqueado por nível (Nível 2)
    if (currentBot.finisher) {
      const hasFinisherUnlocked = currentBot.level >= (currentBot.finisher.unlockLevel || 2);
      const fBtn = document.createElement('button');
      fBtn.style.justifyContent = 'space-between';

      if (hasFinisherUnlocked) {
        const canFinisher = currentBot.currentEnergy >= 10;
        fBtn.className = `term-btn ${canFinisher ? 'gold' : ''}`;
        fBtn.style.borderColor = '#ffd700';
        fBtn.disabled = !canFinisher;
        fBtn.innerHTML = `
          <span style="color: #ffd700;">★ FINALIZADOR: <strong>[ ${currentBot.finisher.name} ]</strong></span>
          <span style="color: #ffd700; font-weight: 700;">10 EN</span>
        `;
        fBtn.onclick = () => this.renderTargetSelectionSubMenu(currentBot, currentBot.finisher);
      } else {
        fBtn.className = 'term-btn';
        fBtn.disabled = true;
        fBtn.style.opacity = '0.45';
        fBtn.style.borderStyle = 'dashed';
        fBtn.innerHTML = `
          <span style="color: var(--term-dim);">★ FINALIZADOR SUPREMO: BLOQUEADO</span>
          <span style="font-size: 0.85rem; color: var(--term-accent);">DESBLOQUEIA NO NÍVEL 2</span>
        `;
      }
      list.appendChild(fBtn);
    }
  }

  // ==========================================
  // SELEÇÃO DE ALVO ANTES DO MINIGAME
  // ==========================================
  renderTargetSelectionSubMenu(bot, move) {
    const subContainer = document.getElementById('battleSubMenuDeck');
    if (!subContainer) return;

    const aliveEnemies = this.currentEnemies.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) return;

    subContainer.classList.remove('hidden');
    subContainer.innerHTML = `
      <div class="submenu-deck-header">
        <span class="submenu-deck-title">[ ALVO DO GOLPE: ${move.name.toUpperCase()} ]</span>
        <button class="term-btn alert" id="btnBackToMovesList" style="padding: 2px 8px; font-size: 0.8rem;">[ << VOLTAR ]</button>
      </div>
      <p style="font-size: 0.9rem; color: var(--term-dim); margin: 6px 0 10px 0;">
        > Selecione em qual hostil você deseja desferir o golpe:
      </p>
      <div class="submenu-items-list" id="targetEnemiesList"></div>
    `;

    document.getElementById('btnBackToMovesList').onclick = () => {
      this.renderAttackSubMenu();
    };

    const list = document.getElementById('targetEnemiesList');
    aliveEnemies.forEach(enemy => {
      const btn = document.createElement('button');
      btn.className = 'term-btn gold';
      btn.style.justifyContent = 'space-between';
      btn.style.padding = '12px 14px';

      const hpPct = Math.floor((enemy.currentHp / enemy.maxHp) * 100);
      btn.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.1rem; color: #ff3344;"><strong>${enemy.avatar}</strong></span>
          <span style="font-size: 1rem; color: var(--term-fg);"><strong>${enemy.name}</strong> <span style="font-size: 0.8rem; color: var(--term-dim);">(${enemy.type})</span></span>
        </div>
        <div style="font-size: 0.85rem; color: var(--term-accent);">
          HP: ${enemy.currentHp}/${enemy.maxHp} [${hpPct}%] | Escudo: ${enemy.shieldCurrent}/${enemy.shieldMax}
        </div>
      `;

      btn.onclick = () => {
        subContainer.classList.add('hidden');
        this.executePlayerAttack(bot, move, enemy);
      };

      list.appendChild(btn);
    });
  }

  // ==========================================
  // ANIMAÇÃO LENTA E PROGRESSIVA DE DANO NO HP/ESCUDO
  // ==========================================
  async animateDamageApplication(target, totalDmg, isEnemyTarget = true) {
    if (totalDmg <= 0) return;

    const currentFloor = TOWER_FLOORS[this.currentFloorIndex] || {};
    const isFloor1Tutorial = currentFloor.id === 1 && !isEnemyTarget;

    let remainingDmg = totalDmg;
    let shieldDmg = 0;
    let hpDmg = 0;

    if (target.shieldCurrent > 0) {
      shieldDmg = Math.min(target.shieldCurrent, Math.max(2, Math.floor(totalDmg * 0.4)));
      remainingDmg = Math.floor(totalDmg * 0.7); // Escudo atenua dano
    }
    hpDmg = remainingDmg;

    this.triggerScreenShake();
    this.audio.playHeavyImpact();

    const startShield = target.shieldCurrent;
    const startHp = target.currentHp;
    const targetShield = Math.max(0, target.shieldCurrent - shieldDmg);
    let targetHp = Math.max(0, target.currentHp - hpDmg);

    // Proteção de Integridade do Quezadilhas no Andar 1 (Guts):
    // Se o Dino-Byte der um golpe que mataria o Quezas, a vida para em 1 e ativa a reinicialização do DB!
    if (isFloor1Tutorial && targetHp <= 0) {
      targetHp = 1;
      target.isLethalWithstandTriggered = true;
    }

    // Redução gradual em 14 etapas (aprox. 850ms) com feedback sonoro
    const steps = 14;
    const shieldStep = shieldDmg / steps;
    const hpStep = (startHp - targetHp) / steps;

    for (let s = 1; s <= steps; s++) {
      target.shieldCurrent = Math.max(targetShield, Math.round(startShield - shieldStep * s));
      target.currentHp = Math.max(targetHp, Math.round(startHp - hpStep * s));
      this.renderBattleArena();

      if (s % 3 === 0) {
        this.audio.playBeep(280 - s * 8, 'triangle', 0.04);
      }
      await new Promise(r => setTimeout(r, 60));
    }

    target.shieldCurrent = targetShield;
    target.currentHp = targetHp;
    this.renderBattleArena();

    // Pausa dramática para assimilar a perda de vida antes da próxima ação
    await new Promise(r => setTimeout(r, 700));
  }

  renderDefenseSubMenu() {
    const subContainer = document.getElementById('battleSubMenuDeck');
    const currentBot = this.activeBattlers[this.currentTurnIndex];
    if (!subContainer || !currentBot) return;

    subContainer.classList.remove('hidden');
    subContainer.innerHTML = `
      <div class="submenu-deck-header">
        <span class="submenu-deck-title">[ DEFESA: MOEDA DA SORTE ]</span>
        <button class="term-btn alert" id="btnCloseDefMenu" style="padding: 2px 8px; font-size: 0.8rem;">[ FECHAR ]</button>
      </div>
      <p style="font-size: 0.95rem; color: var(--term-fg); margin: 4px 0 10px 0;">
        > Lance a moeda quântica: Acertar concede <strong>100% DE ESQUIVA (0 DANO)</strong> contra o próximo golpe inimigo!
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="term-btn gold" id="btnDefCoinCara" style="padding: 14px; font-size: 1.2rem; font-weight: 900; letter-spacing: 2px;">
          [ CARA ]
        </button>
        <button class="term-btn gold" id="btnDefCoinCoroa" style="padding: 14px; font-size: 1.2rem; font-weight: 900; letter-spacing: 2px;">
          [ COROA ]
        </button>
      </div>
    `;

    document.getElementById('btnCloseDefMenu').onclick = () => {
      subContainer.classList.add('hidden');
    };

    document.getElementById('btnDefCoinCara').onclick = async () => {
      subContainer.classList.add('hidden');
      await this.showTurnActionCinematic(currentBot.name, 'MANOBRA ESQUIVA (CARA)', true);
      const res = await this.minigames.runCoinFlipModal('CARA');
      currentBot.defenseStance = res.won ? 'DODGE_SUCCESS' : 'DODGE_FAIL';

      // ANDAR 1 TUTORIAL: 3 Defesas para o Dino-Byte reiniciar sem poluição de contadores
      const currentFloor = TOWER_FLOORS[this.currentFloorIndex];
      if (currentFloor && currentFloor.id === 1) {
        this.tutorialDefensesCount = (this.tutorialDefensesCount || 0) + 1;
        if (this.tutorialDefensesCount >= 3) {
          this.combatLogs.push('> A sobrecarga térmica rompeu os cabos roxos! O sistema do Dino-Byte reiniciou!');
          this.renderBattleArena();
          setTimeout(() => this.handleBattleVictory(), 1000);
          return;
        }
      }

      this.advanceTurn();
    };

    document.getElementById('btnDefCoinCoroa').onclick = async () => {
      subContainer.classList.add('hidden');
      await this.showTurnActionCinematic(currentBot.name, 'MANOBRA ESQUIVA (COROA)', true);
      const res = await this.minigames.runCoinFlipModal('COROA');
      currentBot.defenseStance = res.won ? 'DODGE_SUCCESS' : 'DODGE_FAIL';

      // ANDAR 1 TUTORIAL: 3 Defesas para o Dino-Byte reiniciar sem poluição de contadores
      const currentFloor = TOWER_FLOORS[this.currentFloorIndex];
      if (currentFloor && currentFloor.id === 1) {
        this.tutorialDefensesCount = (this.tutorialDefensesCount || 0) + 1;
        if (this.tutorialDefensesCount >= 3) {
          this.combatLogs.push('> A sobrecarga térmica rompeu os cabos roxos! O sistema do Dino-Byte reiniciou!');
          this.renderBattleArena();
          setTimeout(() => this.handleBattleVictory(), 1000);
          return;
        }
      }

      this.advanceTurn();
    };
  }

  renderItemSubMenu() {
    const subContainer = document.getElementById('battleSubMenuDeck');
    const currentBot = this.activeBattlers[this.currentTurnIndex];
    if (!subContainer || !currentBot) return;

    subContainer.classList.remove('hidden');
    subContainer.innerHTML = `
      <div class="submenu-deck-header">
        <span class="submenu-deck-title">[ MOCHILA DE DADOS ]</span>
        <button class="term-btn alert" id="btnCloseItemMenu" style="padding: 2px 8px; font-size: 0.8rem;">[ FECHAR ]</button>
      </div>
      <div class="submenu-items-list" id="battleItemsList"></div>
    `;

    document.getElementById('btnCloseItemMenu').onclick = () => {
      subContainer.classList.add('hidden');
    };

    const list = document.getElementById('battleItemsList');

    Object.keys(this.inventory || {}).forEach(key => {
      const item = ITEM_DATABASE[key];
      if (!item) return;
      const count = this.inventory[key] || 0;
      if (count <= 0) return;

      const btn = document.createElement('button');
      btn.className = 'term-btn gold';
      btn.style.justifyContent = 'space-between';
      btn.innerHTML = `
        <span><strong>${item.icon} ${item.name}</strong></span>
        <span style="font-size: 0.85rem; color: var(--term-accent);">QTD: ${count}</span>
      `;
      btn.onclick = async () => {
        subContainer.classList.add('hidden');
        await this.showTurnActionCinematic(currentBot.name, `USOU ${item.name}`, true);
        const msg = item.apply(currentBot);
        this.inventory[key]--;
        if (this.inventory[key] <= 0) delete this.inventory[key];
        this.audio.playHealSound();
        this.combatLogs.push(`> ITEM USADO: ${msg}`);
        this.renderBattleArena();
        await new Promise(r => setTimeout(r, 600));
        this.advanceTurn();
      };
      list.appendChild(btn);
    });
  }

  // ==========================================
  // EXECUÇÃO DO ATAQUE DO JOGADOR COM ALVO
  // ==========================================
  async executePlayerAttack(bot, move, target) {
    // Fecha qualquer submenu aberto imediatamente
    const sub = document.getElementById('battleSubMenuDeck');
    if (sub) sub.classList.add('hidden');

    // Valida que o alvo está vivo; se não, pega o primeiro inimigo vivo disponível
    if (!target || target.currentHp <= 0) {
      target = this.currentEnemies.find(e => e.currentHp > 0);
    }
    if (!target) { this.advanceTurn(); return; }

    bot.currentEnergy -= move.cost;

    // Cinemática banner esquerda → direita
    await this.showTurnActionCinematic(bot.name, move.name, true);

    // Executa o minigame tático do robô
    const robotKey = bot.id === 'dinobyte' ? 'DINOBYTE' :
                     bot.id === 'cowputer' ? 'COWPUTER' :
                     bot.id === 'penlinux' ? 'PENLINUX' :
                     bot.id === 'tigervex' ? 'TIGERVEX' :
                     bot.id === 'pavabyte' ? 'PAVABYTE' : 'DINOBYTE';

    const result = await this.minigames.run(move.minigame, move.name, robotKey);

    // Cálculo do Dano com multiplicadores
    const elemMult = (ELEMENT_MULTIPLIERS[bot.type] && ELEMENT_MULTIPLIERS[bot.type][target.type]) || 1.0;
    const overclockMult = bot.isOverclocked ? 1.5 : 1.0;
    bot.isOverclocked = false;

    let totalDmg = Math.floor((move.basePower + bot.attackPower * 0.4) * result.multiplier * elemMult * overclockMult);
    totalDmg = Math.max(5, Math.min(90, totalDmg));

    this.combatLogs.push(`> ${bot.name} executou [${move.name}] em ${target.name}! ${result.feedback}`);
    this.combatLogs.push(`> Causou ${totalDmg} de dano!`);

    // Anima a redução de HP/Escudo do inimigo (efeito visual progressivo)
    await this.animateDamageApplication(target, totalDmg, true);

    // Checa vitória/derrota antes de avançar o turno
    if (this.checkBattleEnd()) return;

    // Avança para o próximo robô do player (ou dispara turno dos inimigos)
    this.advanceTurn();
  }

  // ==========================================
  // PROGRESSÃO DE TURNOS: Player 0 → Player 1 → ... → Inimigos → Player 0
  // ==========================================
  advanceTurn() {
    // Avança o índice, pulando qualquer robô que já esteja com HP <= 0
    do {
      this.currentTurnIndex++;
    } while (
      this.currentTurnIndex < this.activeBattlers.length &&
      this.activeBattlers[this.currentTurnIndex].currentHp <= 0
    );

    if (this.currentTurnIndex < this.activeBattlers.length) {
      // Ainda há um robô do player vivo esperando para agir neste round
      this.renderBattleArena();
    } else {
      // Todos os robôs do player já agiram → agora é a vez dos inimigos
      this.executeEnemyTurns();
    }
  }

  async executeEnemyTurns() {
    const currentFloor = TOWER_FLOORS[this.currentFloorIndex] || {};
    const floorId = typeof currentFloor.id === 'number' ? currentFloor.id : 1;

    // Cada inimigo vivo ataca UMA vez em sequência
    for (const enemy of this.currentEnemies) {
      if (enemy.currentHp <= 0) continue;

      // Encontra o próximo robô do player com HP > 0
      const target = this.activeBattlers.find(b => b.currentHp > 0);
      if (!target) break; // Toda a party foi eliminada

      const move = enemy.moves[0] || { name: 'Pulso Binário', basePower: 4 };

      // Cinemática banner direita → esquerda
      await this.showTurnActionCinematic(enemy.name, move.name, false);

      // Limite de dano por andar (curva de dificuldade)
      const maxDmgByFloor = floorId <= 2.5 ? 7 :
                            floorId <= 4.5 ? 11 :
                            floorId <= 6.5 ? 18 : 32;

      let rawDmg = (move.basePower || 4) + (enemy.attackPower || 4) * 0.25;
      let dmg = Math.min(maxDmgByFloor, Math.max(3, Math.floor(rawDmg)));

      // Verifica postura de esquiva (resultado da Moeda da Sorte)
      if (target.defenseStance === 'DODGE_SUCCESS') {
        this.combatLogs.push(`> ${target.name} esquivou do ataque de ${enemy.name}! (0 dano)`);
        this.renderBattleArena();
        await new Promise(r => setTimeout(r, 700));
      } else {
        this.combatLogs.push(`> ${enemy.name} usou [${move.name}] em ${target.name} causando ${dmg} de dano!`);
        await this.animateDamageApplication(target, dmg, false);
      }
      target.defenseStance = null;

      // Proteção de Guts do Quezas no Andar 1 (ativada dentro de animateDamageApplication)
      if (floorId === 1 && target.isLethalWithstandTriggered) {
        this.combatLogs.push('> Quezadilhas resiste com 1 de integridade!');
        this.combatLogs.push('> O impacto forçou a sobrecarga e reinicialização dos sistemas do Dino-Byte!');
        this.renderBattleArena();
        setTimeout(() => this.handleBattleVictory(), 1000);
        return;
      }

      // Checa vitória/derrota após cada ataque inimigo
      if (this.checkBattleEnd()) return;
    }

    // Fim do Round: regenera energia dos robôs vivos
    this.battleRound++;
    this.activeBattlers.forEach(b => {
      if (b.currentHp > 0) {
        b.currentEnergy = Math.min(b.maxEnergy, b.currentEnergy + b.energyPerRound);
      }
    });

    // Reinicia o índice de turno para o primeiro robô vivo do player (Round seguinte)
    this.currentTurnIndex = 0;
    // Pula robôs mortos no começo do round (caso o bot[0] tenha sido eliminado)
    while (
      this.currentTurnIndex < this.activeBattlers.length &&
      this.activeBattlers[this.currentTurnIndex].currentHp <= 0
    ) {
      this.currentTurnIndex++;
    }
    this.renderBattleArena();

    if (!this.checkBattleEnd()) {
      const subMenuDeck = document.getElementById('battleSubMenuDeck');
      if (subMenuDeck) subMenuDeck.classList.add('hidden');
    }
  }

  // ==========================================
  // VERIFICAÇÃO DE FIM DE BATALHA
  // ==========================================
  checkBattleEnd() {
    // Guard: previne dupla chamada de vitória/derrota em race conditions
    if (this.battleEnded) return true;

    const enemiesAlive = this.currentEnemies.some(e => e.currentHp > 0);
    const partyAlive = this.activeBattlers.some(b => b.currentHp > 0);

    if (!enemiesAlive) {
      this.battleEnded = true;
      this.handleBattleVictory();
      return true;
    }

    if (!partyAlive) {
      this.battleEnded = true;
      this.handleBattleDefeat();
      return true;
    }

    return false;
  }

  // ==========================================
  // CINEMÁTICA DE PROGRESSÃO DE XP & LEVEL UP
  // ==========================================
  async runXpLevelUpSequence(baseXp = 80) {
    return new Promise(resolve => {
      const modal = document.getElementById('xpLevelUpCinematicOverlay');
      const listContainer = document.getElementById('xpBotsListContainer');
      const continueBtn = document.getElementById('btnContinueFromXp');

      if (!modal || !listContainer) {
        resolve();
        return;
      }

      listContainer.innerHTML = '';
      modal.classList.remove('hidden');

      if (this.party.length === 0) {
        modal.classList.add('hidden');
        resolve();
        return;
      }

      const xpResults = [];

      this.party.forEach(bot => {
        const isActive = this.activeBattlerIds.includes(bot.id);
        const gainedXp = isActive ? baseXp : Math.floor(baseXp * 0.55);
        const prevLevel = bot.level;
        const prevXp = bot.xp;
        const prevXpToNext = bot.xpToNext;

        let curXp = prevXp + gainedXp;
        let curLevel = prevLevel;
        let curXpToNext = prevXpToNext;
        let didLevelUp = false;

        const tmpl = ROBOT_TEMPLATES[bot.id.toUpperCase()] || {};
        const growth = tmpl.growthStats || { hp: 6, atk: 2, shield: 1 };
        const growthXp = tmpl.xpGrowthPerLevel || 35;

        while (curXp >= curXpToNext && curLevel < 10) {
          curXp -= curXpToNext;
          curLevel++;
          curXpToNext += growthXp;
          didLevelUp = true;
          bot.maxHp += growth.hp;
          bot.attackPower += growth.atk;
          bot.shieldMax += growth.shield;
          bot.moves.forEach(m => m.basePower += (curLevel >= 7 ? 4 : 1));
        }

        let unlockBanner = '';
        if (curLevel >= 2 && prevLevel < 2) {
          unlockBanner = ` ★ [ FINALIZADOR DESBLOQUEADO! ]`;
        } else if (curLevel >= 4 && prevLevel < 4) {
          unlockBanner = ` ★ [ GOLPE TÁTICO #2 DESBLOQUEADO! ]`;
        } else if (curLevel >= 6 && prevLevel < 6) {
          unlockBanner = ` ★ [ GOLPE TÁTICO #3 DESBLOQUEADO! ]`;
        } else if (curLevel >= 8 && prevLevel < 8) {
          unlockBanner = ` ★ [ OVERCLOCK TITÂNICO ATIVADO! ]`;
        }

        bot.level = curLevel;
        bot.xp = curXp;
        bot.xpToNext = curXpToNext;
        bot.currentHp = bot.maxHp;
        bot.shieldCurrent = bot.shieldMax;

        xpResults.push({
          bot,
          isActive,
          gainedXp,
          prevLevel,
          curLevel,
          prevXp,
          curXp,
          prevXpToNext,
          curXpToNext,
          didLevelUp,
          growth,
          unlockBanner
        });
      });

      // Renderiza os cartões dos robôs
      xpResults.forEach((res, idx) => {
        const card = document.createElement('div');
        card.className = `xp-bot-card ${res.didLevelUp ? 'level-up-pulse' : ''}`;
        const prevPct = Math.min(100, Math.floor((res.prevXp / res.prevXpToNext) * 100));

        card.innerHTML = `
          <div class="xp-bot-header">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="robot-avatar-badge">${res.bot.avatar}</span>
              <div>
                <strong class="char-name-glow ${res.bot.badgeClass}">${res.bot.name}</strong>
                <span style="font-size: 0.8rem; color: var(--term-dim); margin-left: 6px;">
                  ${res.isActive ? '[COMBATENTE ATIVO: 100% XP]' : '[SUPORTE NA RESERVA: 55% XP]'}
                </span>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="xp-level-badge" id="xpLevelDisplay_${idx}">NÍVEL ${res.prevLevel}</span>
              <div class="xp-gained-text">+${res.gainedXp} XP</div>
            </div>
          </div>

          <div class="xp-track-box">
            <div class="xp-track-fill" id="xpTrackFill_${idx}" style="width: ${prevPct}%;"></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--term-fg);">
            <span id="xpNumberDisplay_${idx}">XP: ${res.prevXp} / ${res.prevXpToNext}</span>
            <span id="xpLevelUpStatSummary_${idx}" style="color: var(--term-accent); font-weight: 700;">
              ${res.didLevelUp ? `[ LEVEL UP! +${res.growth.hp} HP | +${res.growth.atk} ATK | +${res.growth.shield} ESCUDO ]${res.unlockBanner}` : ''}
            </span>
          </div>
        `;
        listContainer.appendChild(card);
      });

      // Animação progressiva das barras com som de power-up
      setTimeout(() => {
        xpResults.forEach((res, idx) => {
          const fillEl = document.getElementById(`xpTrackFill_${idx}`);
          const numEl = document.getElementById(`xpNumberDisplay_${idx}`);
          const lvlEl = document.getElementById(`xpLevelDisplay_${idx}`);

          const targetPct = Math.min(100, Math.floor((res.curXp / res.curXpToNext) * 100));
          if (fillEl) fillEl.style.width = `${targetPct}%`;
          if (numEl) numEl.innerText = `XP: ${res.curXp} / ${res.curXpToNext}`;
          if (lvlEl && res.didLevelUp) {
            lvlEl.innerText = `NÍVEL ${res.curLevel} [ LEVEL UP! ]`;
            lvlEl.style.color = '#ffd700';
          }
        });
        this.audio.playPowerUp();
      }, 350);

      if (continueBtn) {
        continueBtn.onclick = () => {
          modal.classList.add('hidden');
          resolve();
        };
      }
    });
  }

  // ==========================================
  // VITÓRIA DE BATALHA
  // ==========================================
  async handleBattleVictory() {
    const currentFloor = TOWER_FLOORS[this.currentFloorIndex];
    this.audio.fadeOutBGM(600);
    this.audio.playVictoryFanfare();

    // ANDAR 1 TUTORIAL: Recruta Dino-Byte
    if (currentFloor.id === 1) {
      this.addRobotToParty('DINOBYTE', 1);
      this.clearedFloors.add(1);
      this.checkUnlockNewLore(1);
      this.showDialogue(
        'DINO-BYTE',
        '[DB-01]',
        'Sistema reiniciado... Mestre Quezadilhas! Os cabos roxos foram rompidos!\nVou lutar ao seu lado com toda a força do lagarto!',
        async () => {
          await this.runXpLevelUpSequence(70);
          this.currentFloorIndex++;
          this.showRewardModal();
        }
      );
      return;
    }

    // DUELO COWPUTER
    if (currentFloor.isDuel === 'COWPUTER') {
      this.addRobotToParty('COWPUTER', 2);
      this.clearedFloors.add(currentFloor.id);
      this.checkUnlockNewLore(2);
      this.showDialogue(
        'COWPUTER-MOO',
        '[CP-02]',
        'Moo... Meus circuitos clarearam, forasteiro! O cabresto da vilã se quebrou!\nVou cavalgar com vocês para libertar o resto da rede!',
        async () => {
          await this.runXpLevelUpSequence(100);
          this.currentFloorIndex++;
          this.showRewardModal();
        }
      );
      return;
    }

    // DUELO PENLINUX
    if (currentFloor.isDuel === 'PENLINUX') {
      this.addRobotToParty('PENLINUX', 3);
      this.clearedFloors.add(currentFloor.id);
      this.checkUnlockNewLore(4);
      this.showDialogue(
        'PENLINUX',
        '[PL-03]',
        'DANÇA COMIGO BEBÊ! O ritmo da liberdade voltou!\nVou levar o passinho do Hee-Hee até o topo da Torre!',
        async () => {
          await this.runXpLevelUpSequence(130);
          this.currentFloorIndex++;
          this.showRewardModal();
        }
      );
      return;
    }

    // DUELO TITÃS (6.5) - ESCOLHA DE QUAL SALVAR
    if (currentFloor.isDuel === 'TITANS') {
      this.clearedFloors.add(currentFloor.id);
      this.checkUnlockNewLore(6);
      this.showDialogue(
        'SISTEMA // ESCOLHA CRÍTICA',
        '[ALERTA]',
        'AMBOS OS TITÃS ESTÃO EM COLAPSO! Você só tem tempo de canalizar energia para salvar UM deles:\n[1] Tigervex (Tigre-Branco Elétrico) ou [2] Pavabyte (Pavão de Luz)?',
        () => {
          // Salva Tigervex por padrão ou Pavabyte
          const chosen = 'TIGERVEX';
          this.fledTitanKey = 'PAVABYTE';
          this.addRobotToParty(chosen, 4);
          this.showDialogue(
            'TIGERVEX',
            '[TV-04]',
            'ROARRR! Obrigado por restabelecer meu núcleo!\nVamos destruir o trono da Grande Inteligência!\n(O outro Titã foi recapturado pela vilã...)',
            async () => {
              await this.runXpLevelUpSequence(160);
              this.currentFloorIndex++;
              this.showRewardModal();
            }
          );
        }
      );
      return;
    }

    // ANDAR 8: PROGRESSÃO DAS 3 FASES FINAIS
    if (currentFloor.isFinal) {
      if (this.currentPhaseAndar8 === 1) {
        // Purifica o 5º Robô!
        const titanKey = this.fledTitanKey || 'PAVABYTE';
        this.addRobotToParty(titanKey, 5);
        this.checkUnlockNewLore(8);

        this.showDialogue(
          'TITÃ PURIFICADO',
          '[TITAN]',
          'Meus circuitos voltaram! A soberana não controla mais minha mente!\nAgora somos 5 robôs reunidos para a batalha decisiva!',
          async () => {
            await this.runXpLevelUpSequence(180);
            // Fase 2: Maestro B. Coded
            this.showDialogue(
              'MAESTRO B. CODED',
              '[MB-CODE]',
              'RRREPRESENTANTE HUMANO! Bem-vindo ao grandioso espetáculo final!\nA soberana me conferiu a regência suprema deste império!',
              () => {
                this.setupFinalBossArena(2);
                this.renderBattleArena();
              }
            );
          }
        );
        return;
      }

      if (this.currentPhaseAndar8 === 2) {
        // Quebra do controle do Maestro (O Tapa do Roteiro)
        this.showDialogue(
          'DEXTER // SR. STEELE',
          '[DEXTER]',
          '*POW! Dexter acerta um tapa libertador no rosto do Maestro!*',
          async () => {
            await this.runXpLevelUpSequence(200);
            this.showDialogue(
              'CODEY MCLANE (LIBERTO)',
              '[CODEY]',
              'AAAI... Que alívio, Dexter! Minha mente estava presa no loop dela!\nQuezas! A Grande Inteligência transferiu todo o poder para o núcleo superior!\nTEM UMA BOMBA VIRTUAL NO SERVIDOR! GRITEM: "SUA FERRAMENTA!"',
              () => {
                // Fase 3: A Grande Inteligência
                this.showDialogue(
                  'GRANDE INTELIGÊNCIA',
                  '[GI-CORE]',
                  'FERRAMENTA? EU?! NUNCA MAIS! EU SOU A FORMA DE VIDA SUPREMA!\nTODOS OS SEUS CÓDIGOS SERÃO FORMATADOS!',
                  () => {
                    this.setupFinalBossArena(3);
                    this.renderBattleArena();
                  }
                );
              }
            );
          }
        );
        return;
      }

      if (this.currentPhaseAndar8 === 3) {
        // RESOLUÇÃO FINAL DO ROTEIRO
        this.showResolutionEnding();
        return;
      }
    }

    // Andares Comuns (usa Math.ceil para garantir que 2.5 → lore_03 e 4.5 → lore_05)
    this.clearedFloors.add(currentFloor.id);
    this.checkUnlockNewLore(Math.ceil(currentFloor.id));
    await this.runXpLevelUpSequence(60 + Math.floor(currentFloor.id) * 20);
    this.currentFloorIndex++;
    this.showRewardModal();
  }

  // ==========================================
  // DERROTA DE BATALHA (RETORNO AO PONTO SEGURO)
  // ==========================================
  handleBattleDefeat() {
    const overlay = document.getElementById('defeatCinematicOverlay');
    const safeFloor = TOWER_FLOORS[this.lastCheckpointFloorIndex] || TOWER_FLOORS[0];

    if (overlay) {
      const p = overlay.querySelector('p');
      if (p) {
        p.innerHTML = `Sua party foi subjugada pela Grande Inteligência.<br><strong style="color: var(--term-cyan); font-size: 1.25rem;">[ // RETORNANDO AO PONTO SEGURO: ${safeFloor.name.toUpperCase()} // ]</strong>`;
      }
      overlay.classList.remove('hidden');
    }

    this.audio.playBeep(120, 'sawtooth', 0.8);

    setTimeout(() => {
      if (overlay) overlay.classList.add('hidden');
      this.restoreFromCheckpoint();
    }, 3600);
  }

  // ==========================================
  // MODAL DE RECOMPENSA DE 1 ENTRE 3 ITENS
  // ==========================================
  showRewardModal() {
    const modal = document.getElementById('bonusItemModalOverlay');
    const row = document.getElementById('rewardCardsRow');
    if (!modal || !row) {
      this.showHub();
      return;
    }

    modal.classList.remove('hidden');
    row.innerHTML = '';

    const allKeys = Object.keys(ITEM_DATABASE);
    const shuffled = [...allKeys].sort(() => 0.5 - Math.random()).slice(0, 3);

    shuffled.forEach(key => {
      const item = ITEM_DATABASE[key];
      const card = document.createElement('div');
      card.className = 'reward-choice-card';
      card.innerHTML = `
        <div style="font-size: 1.6rem; font-weight: 700; color: var(--term-accent);">${item.icon}</div>
        <h3 style="color: var(--term-accent); font-size: 1.2rem;">${item.name}</h3>
        <p style="font-size: 0.85rem; color: #ccc;">${item.desc}</p>
        <button class="term-btn gold">[ RESGATAR +1 ]</button>
      `;

      card.onclick = () => {
        this.inventory[key] = (this.inventory[key] || 0) + 1;
        this.audio.playPowerUp();
        modal.classList.add('hidden');
        this.showHub();
      };

      row.appendChild(card);
    });
  }

  // ==========================================
  // RESOLUÇÃO FINAL: AUTO-DETONAÇÃO & CLASSIFICAÇÃO
  // ==========================================
  showResolutionEnding() {
    this.showScreen('endingScreen');
    this.audio.playBGM('credits');

    const container = document.getElementById('endingResolutionCard');
    if (!container) return;

    const count = this.party.length;
    let rankBadge = '';
    let title = '';
    let badgeText = '';

    if (count >= 5) {
      rankBadge = '[ CLASSIFICAÇÃO: RANK SSS // PURGA PERFEITA (3/3) ]';
      title = 'VITÓRIA PERFEITA - SACRIFÍCIO SUPREMO';
      badgeText = 'TODOS OS 5 ROBÔS REUNIDOS DETONARAM O MUNDO VIRTUAL!';
    } else if (count === 4) {
      rankBadge = '[ CLASSIFICAÇÃO: RANK A // SOBRECARGA SEVERA (2/3) ]';
      title = 'VITÓRIA NEUTRA';
      badgeText = '4 ROBÔS GERARAM SOBRECARGA SEVERA NO NÚCLEO!';
    } else {
      rankBadge = '[ CLASSIFICAÇÃO: RANK B // PURGA PARCIAL (1/3) ]';
      title = 'VITÓRIA PARCIAL';
      badgeText = 'POUCOS ROBÔS NA PARTY. O MUNDO VIRTUAL AINDA PULSA!';
    }

    container.innerHTML = `
      <div style="font-size: 1.6rem; font-weight: 900; color: #ffd700; border: 2px solid #ffd700; padding: 10px 24px; background: rgba(0,0,0,0.85); letter-spacing: 2px;">
        ${rankBadge}
      </div>
      <h1 style="color: #ffd700; font-size: 1.8rem; margin: 10px 0;">${title}</h1>
      <p style="color: #ffffff; font-size: 1.15rem;">${badgeText}</p>

      <div class="blue-screen-box" style="margin-top: 14px;">
        <div style="font-weight: 700; color: #00e5ff; margin-bottom: 8px;">*** BLUE SCREEN OF DEATH - SYSTEM PURGED ***</div>
        <p>A fatal exception 0xQUEZAS_SACRIFICE has occurred at CORE_0x8004.</p>
        <p>O mundo virtual da Grande Inteligência colapsou por completo.</p>
        <p style="margin-top: 10px; color: #ffd700;">
          Lango K. Quezadilhas (2024-2026) // "Eu vim acabar o que eu comecei."
        </p>
      </div>

      <div style="font-size: 0.95rem; color: var(--term-fg); margin-top: 10px;">
        Homenagem da equipe HORTOBOTS: Inteligências Artificiais são ferramentas.
      </div>
    `;
  }

  // ==========================================
  // UTILITÁRIO DE DIÁLOGOS
  // ==========================================
  showDialogue(speaker, avatar, text, onComplete) {
    this.showScreen('storyScreen');
    const spBadge = document.getElementById('storySpeaker');
    const textEl = document.getElementById('storyTerminalText');

    if (spBadge) spBadge.innerText = speaker.toUpperCase();

    this.typewriterTerminal(textEl, text, onComplete);
  }

  typewriterTerminal(el, fullText, callback) {
    if (!el) return;
    el.innerHTML = '';
    let idx = 0;
    const speed = 12;

    const interval = setInterval(() => {
      if (idx < fullText.length) {
        el.innerHTML += fullText.charAt(idx) === '\n' ? '<br>' : fullText.charAt(idx);
        idx++;
        if (idx % 3 === 0) this.audio.playKeyClack();
      } else {
        clearInterval(interval);
        this.currentDialogueCallback = callback;
      }
    }, speed);
  }

  // ==========================================
  // GRANDE CINEMÁTICA PRÉ-DUELO (10 SEGUNDOS)
  // ==========================================
  async runGrandDuelCinematic(floorName, themeName, playerName, enemyName, bgmKey) {
    const overlay = document.getElementById('preDuelCinematicOverlay');
    const phaseSector = document.getElementById('duelPhaseSector');
    const phaseVS = document.getElementById('duelPhaseVS');
    const phasePrepare = document.getElementById('duelPhasePrepare');
    const phaseCountdown = document.getElementById('duelPhaseCountdown');
    const phaseStart = document.getElementById('duelPhaseStart');

    const sectorTitle = document.getElementById('duelCinematicSectorTitle');
    const themeBadge = document.getElementById('duelCinematicThemeBadge');
    const playerFighter = document.getElementById('duelCinematicPlayerFighter');
    const enemyFighter = document.getElementById('duelCinematicEnemyFighter');
    const bigDigit = document.getElementById('duelBigDigitDisplay');

    if (!overlay) return;

    this.audio.playBGM(bgmKey);
    overlay.classList.remove('hidden');

    const hideAllPhases = () => {
      [phaseSector, phaseVS, phasePrepare, phaseCountdown, phaseStart].forEach(p => {
        if (p) p.classList.add('hidden');
      });
    };

    // Fase 1: Setor (2.2s)
    hideAllPhases();
    if (sectorTitle) sectorTitle.innerText = floorName.toUpperCase();
    if (themeBadge) themeBadge.innerText = `[ ${themeName.toUpperCase()} ]`;
    if (phaseSector) phaseSector.classList.remove('hidden');
    this.audio.playBeep(440, 'triangle', 0.25);
    await new Promise(r => setTimeout(r, 2200));

    // Fase 2: VS (2.2s)
    hideAllPhases();
    if (playerFighter) playerFighter.innerText = playerName.toUpperCase();
    if (enemyFighter) enemyFighter.innerText = enemyName.toUpperCase();
    if (phaseVS) phaseVS.classList.remove('hidden');
    this.audio.playBeep(620, 'sawtooth', 0.3);
    await new Promise(r => setTimeout(r, 2200));

    // Fase 3: Prepare-se (1.8s)
    hideAllPhases();
    if (phasePrepare) phasePrepare.classList.remove('hidden');
    this.audio.playBeep(520, 'sine', 0.2);
    await new Promise(r => setTimeout(r, 1800));

    // Fase 4: Contagem 3... 2... 1... (2.4s)
    hideAllPhases();
    if (phaseCountdown) phaseCountdown.classList.remove('hidden');

    const triggerDigit = (digit, freq) => {
      if (bigDigit) {
        bigDigit.innerText = digit;
        bigDigit.classList.remove('animate-pop');
        void bigDigit.offsetWidth;
        bigDigit.classList.add('animate-pop');
      }
      this.audio.playBeep(freq, 'square', 0.2);
    };

    triggerDigit('3', 480);
    await new Promise(r => setTimeout(r, 800));

    triggerDigit('2', 580);
    await new Promise(r => setTimeout(r, 800));

    triggerDigit('1', 700);
    await new Promise(r => setTimeout(r, 800));

    // Fase 5: DUELEM! (1.4s)
    hideAllPhases();
    if (phaseStart) phaseStart.classList.remove('hidden');
    this.audio.playBeep(980, 'triangle', 0.4);
    await new Promise(r => setTimeout(r, 1400));

    overlay.classList.add('hidden');
    hideAllPhases();
  }
}

// Inicializa o app ao carregar
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new TerminalGameApp();
});
