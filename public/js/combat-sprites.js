// Camada opcional de sprites para entidades exibidas nos tabuleiros.
// Sem uma entrada válida no manifesto, os renderizadores mantêm o desenho procedural atual.

export const COMBAT_SPRITE_STATES = Object.freeze({
  IDLE: 'idle',
  AWAITING_ACTION: 'awaiting_action',
  ATTACK: 'attack',
  HURT: 'hurt',
  HEAL: 'heal',
  DEFEND: 'defend',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
});

const FALLBACK_STATE = COMBAT_SPRITE_STATES.IDLE;
const ACTOR_ALIASES = Object.freeze({
  db: 'dinobyte', dinobyte: 'dinobyte', dino_byte: 'dinobyte',
  cp: 'cowputer', cowputer: 'cowputer', cowputer_moo: 'cowputer',
  pl: 'penlinux', penlinux: 'penlinux',
  tv: 'tigervex', tigervex: 'tigervex',
  pb: 'pavabyte', pavabyte: 'pavabyte',
  qz: 'quezadilhas', quezas: 'quezadilhas', quezas_avatar: 'quezadilhas', quezadilhas: 'quezadilhas'
});

function normalizeActorId(actor) {
  const id = String(actor?.spriteId || actor?.templateId || actor?.id || actor?.code || actor?.name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return ACTOR_ALIASES[id] || id;
}

class CombatSpriteRegistry {
  constructor() {
    this.manifest = Object.create(null);
    this.cache = new Map();
    this.animationClocks = new WeakMap();
  }

  register(actorId, states) {
    const id = normalizeActorId({ id: actorId });
    if (!id || !states) return;
    this.manifest[id] = { ...(this.manifest[id] || {}), ...states };
  }

  registerManifest(manifest = {}) {
    Object.entries(manifest).forEach(([actorId, states]) => this.register(actorId, states));
  }

  getDefinition(actor, state = FALLBACK_STATE) {
    const states = this.manifest[normalizeActorId(actor)];
    if (!states) return null;
    return states[state] || states[FALLBACK_STATE] || null;
  }

  getPosterUrl(actor, state = FALLBACK_STATE) {
    const def = this.getDefinition(actor, state);
    return typeof def === 'string' ? def : (def?.src || null);
  }

  _getImage(src) {
    if (!src) return null;
    if (!this.cache.has(src)) {
      const image = new Image();
      const entry = { image, ready: false, failed: false, listeners: new Set() };
      image.decoding = 'async';
      image.onload = () => {
        entry.ready = true;
        entry.listeners.forEach(listener => listener());
        entry.listeners.clear();
      };
      image.onerror = () => {
        entry.failed = true;
        entry.listeners.clear();
      };
      image.src = src;
      this.cache.set(src, entry);
    }
    return this.cache.get(src);
  }

  // Usa somente o primeiro quadro no cartão de identidade; mantém o avatar atual
  // enquanto a imagem carrega ou se o arquivo não existir.
  mountPoster(container, actor, state = FALLBACK_STATE) {
    const def = this.getDefinition(actor, state);
    if (!container || !def) return false;
    const config = typeof def === 'string' ? { src: def } : def;
    const entry = this._getImage(config.src);
    if (!entry) return false;

    const render = () => {
      if (!container.isConnected || !entry.ready || entry.failed) return;
      const frameWidth = Number(config.frameWidth) || entry.image.naturalWidth;
      const frameHeight = Number(config.frameHeight) || entry.image.naturalHeight;
      if (frameWidth <= 0 || frameHeight <= 0) return;
      const canvas = document.createElement('canvas');
      canvas.className = 'party-id-sprite';
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = config.pixelated === false;
      ctx.drawImage(entry.image, 0, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
      container.replaceChildren(canvas);
    };

    if (entry.ready) render();
    else if (!entry.failed) entry.listeners.add(render);
    return true;
  }

  draw(ctx, actor, state, bounds, options = {}) {
    const def = this.getDefinition(actor, state);
    if (!def) return false;
    const config = typeof def === 'string' ? { src: def } : def;
    const entry = this._getImage(config.src);
    if (!entry?.ready || entry.failed) return false;

    const frameWidth = Number(config.frameWidth) || entry.image.naturalWidth;
    const frameHeight = Number(config.frameHeight) || entry.image.naturalHeight;
    const frames = Math.max(1, Number(config.frames) || 1);
    const fps = Math.max(1, Number(config.fps) || 8);
    const now = Number(options.time) || performance.now();
    let elapsed = now;
    if (actor && typeof actor === 'object') {
      const previous = this.animationClocks.get(actor);
      if (!previous || previous.state !== state) {
        this.animationClocks.set(actor, { state, startedAt: now });
        elapsed = 0;
      } else {
        elapsed = Math.max(0, now - previous.startedAt);
      }
    }
    const frame = config.loop === false
      ? Math.min(frames - 1, Math.floor(elapsed / (1000 / fps)))
      : Math.floor(elapsed / (1000 / fps)) % frames;
    const columns = Math.max(1, Number(config.columns) || Math.floor(entry.image.naturalWidth / frameWidth) || 1);
    const sx = (frame % columns) * frameWidth;
    const sy = Math.floor(frame / columns) * frameHeight;
    const scale = Number(config.scale) || 1;
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    const x = bounds.x + (bounds.width - width) / 2;
    const y = bounds.y + bounds.height - height;

    ctx.save();
    ctx.imageSmoothingEnabled = config.pixelated === false;
    if (options.flipX || config.flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(entry.image, sx, sy, frameWidth, frameHeight, 0, 0, width, height);
    } else {
      ctx.drawImage(entry.image, sx, sy, frameWidth, frameHeight, x, y, width, height);
    }
    ctx.restore();
    return true;
  }
}

export const combatSprites = new CombatSpriteRegistry();

// Ponto de extensão para futuros pacotes de arte carregados antes dos tabuleiros.
if (typeof window !== 'undefined') {
  window.combatSprites = combatSprites;
  if (window.HORTOBOTS_COMBAT_SPRITES) {
    combatSprites.registerManifest(window.HORTOBOTS_COMBAT_SPRITES);
  }
  fetch('/data/combat-sprites.json')
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (data?.actors) combatSprites.registerManifest(data.actors);
    })
    .catch(() => {});
}
