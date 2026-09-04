// ═══════════════════════════════════════════════════════════════════
// versus-3d.js — Motor 3D Three.js Procedural para o Modo VERSUS
// Elementos: Grid Cyber Matrix Ondulante, Pedestais Holográficos 3D,
// Núcleo Monolítico Central, Projéteis Laser 3D e Cúpulas de Energia
// ═══════════════════════════════════════════════════════════════════

export class Versus3DEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.animId = null;

    // Elementos da cena
    this.gridMesh = null;
    this.gridGeometry = null;
    this.coreMonolith = null;
    this.coreInner = null;
    this.particleSystem = null;
    this.pedestals = []; // { mesh, ring, side, row, color }
    this.activeVFX = []; // Projéteis, domos, explosões 3D
    this.time = 0;

    // Preview 3D do Draft
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewMeshGroup = null;
    this.previewAnimId = null;
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. INICIALIZAÇÃO DA ARENA 3D DE COMBATE (THREE.JS WEBGL)
  // ═════════════════════════════════════════════════════════════════
  initArena(containerId = 'versus3DCanvasContainer') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.disposeArena();
    this.container.innerHTML = '';

    if (typeof THREE === 'undefined') {
      console.warn('[Versus3D] Three.js não está carregado.');
      return;
    }

    const width = this.container.clientWidth || 880;
    const height = this.container.clientHeight || 460;
    this.currentWidth = width;
    this.currentHeight = height;

    // Cena & Câmera com Perspectiva Cibernética Tilted
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020a07, 0.016);

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    this.camera.position.set(0, 13, 26);
    this.camera.lookAt(0, 1.5, 0);

    // Renderer WebGL de Alta Performance com Transparência
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    // Iluminação Holográfica Cibernética
    const ambLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambLight);

    this.dirLight = new THREE.DirectionalLight(0x00ff88, 1.8);
    this.dirLight.position.set(0, 20, 10);
    this.scene.add(this.dirLight);

    this.cyanPoint = new THREE.PointLight(0x00e5ff, 2.5, 60);
    this.cyanPoint.position.set(-15, 6, 0);
    this.scene.add(this.cyanPoint);

    this.redPoint = new THREE.PointLight(0xff3366, 2.5, 60);
    this.redPoint.position.set(15, 6, 0);
    this.scene.add(this.redPoint);

    // Construção dos Objetos 3D
    this._buildUndulatingGrid();
    this._buildCentralCoreMonolith();
    this._buildPedestals();
    this._buildAtmosphericDust();

    // Loop de Animação
    this._startLoop();

    // Redimensionamento Dinâmico
    window.addEventListener('resize', this._onResizeBound = () => this._onResize());
  }

  applyTheme(theme) {
    if (!theme || !this.scene) return;
    const c = theme.colors;
    if (this.gridMesh && this.gridMesh.material && c.threeGridColor !== undefined) {
      this.gridMesh.material.color.setHex(c.threeGridColor);
    }
    if (this.cyanPoint && c.threePointA !== undefined) {
      this.cyanPoint.color.setHex(c.threePointA);
    }
    if (this.redPoint && c.threePointB !== undefined) {
      this.redPoint.color.setHex(c.threePointB);
    }
    if (this.dirLight && c.threeGridColor !== undefined) {
      this.dirLight.color.setHex(c.threeGridColor);
    }
  }

  // ── Grid 3D Ondulante (Oceano de Dados Cyber Matrix) ─────────────
  _buildUndulatingGrid() {
    const w = 84;
    const h = 54;
    const segW = 42;
    const segH = 28;
    this.gridGeometry = new THREE.PlaneGeometry(w, h, segW, segH);
    this.gridGeometry.rotateX(-Math.PI / 2.25);

    // Salva posições originais dos vértices para cálculo de onda senoidal
    const pos = this.gridGeometry.attributes.position;
    this.gridOriginalY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      this.gridOriginalY[i] = pos.getY(i);
    }

    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });

    this.gridMesh = new THREE.Mesh(this.gridGeometry, gridMat);
    this.gridMesh.position.set(0, -1.8, -4);
    this.scene.add(this.gridMesh);
  }

  // ── Núcleo Monolítico Central 3D (Entre os dois campos) ──────────
  _buildCentralCoreMonolith() {
    const group = new THREE.Group();
    group.position.set(0, 3.2, -4);

    // Octaedro Holográfico Externo (Wireframe Dourado/Ciano)
    const octaGeo = new THREE.OctahedronGeometry(2.4, 0);
    const octaMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    this.coreMonolith = new THREE.Mesh(octaGeo, octaMat);
    group.add(this.coreMonolith);

    // Prisma Interno de Alta Energia
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: false,
      transparent: true,
      opacity: 0.75
    });
    this.coreInner = new THREE.Mesh(innerGeo, innerMat);
    group.add(this.coreInner);

    // Anel Orbital Horizontal em torno do Monólito
    const ringGeo = new THREE.TorusGeometry(3.6, 0.08, 8, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55
    });
    this.coreRing = new THREE.Mesh(ringGeo, ringMat);
    this.coreRing.rotation.x = Math.PI / 2;
    group.add(this.coreRing);

    // Laser Vertical Central
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 28, 8);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    group.add(laser);

    this.scene.add(group);
    this.coreGroup = group;
  }

  // ── Conversor Matemático: Projeta Coordenada 2D da Tela para o Espaço 3D ──
  get3DPosFrom2D(screenX, screenY, floorY = -0.6) {
    if (!this.camera || typeof THREE === 'undefined') {
      return new THREE.Vector3(0, floorY, 0);
    }
    const width = this.currentWidth || this.container?.clientWidth || 880;
    const height = this.currentHeight || this.container?.clientHeight || 460;
    const ndcX = (screenX / width) * 2 - 1;
    const ndcY = -(screenY / height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
    const hit = new THREE.Vector3();
    const res = raycaster.ray.intersectPlane(plane, hit);
    return res ? hit : new THREE.Vector3(0, floorY, 0);
  }

  // ── 6 Pedestais Holográficos 3D Alinhados com os Robôs 2D ──────────
  _buildPedestals() {
    this.pedestals = [];
    const width = this.currentWidth || this.container?.clientWidth || 880;
    const height = this.currentHeight || this.container?.clientHeight || 460;

    // 3 Pedestais do Jogador (Lado Esquerdo: Linhas 1, 2, 3 - 12% da largura)
    for (let r = 1; r <= 3; r++) {
      const x = width * 0.12;
      const y = height * (r * 0.25);
      const ped = this._createPedestal(x, y, 0x00ff88, 'PLAYER', r);
      this.pedestals.push(ped);
    }

    // 3 Pedestais do Oponente (Lado Direito: Linhas 1, 2, 3 - 88% da largura)
    for (let r = 1; r <= 3; r++) {
      const x = width * 0.88;
      const y = height * (r * 0.25);
      const ped = this._createPedestal(x, y, 0xff3344, 'ENEMY', r);
      this.pedestals.push(ped);
    }
  }

  _createPedestal(screenX, screenY, defaultColor, side, row) {
    const group = new THREE.Group();
    const initialPos = this.get3DPosFrom2D(screenX, screenY, -0.6);
    group.position.set(initialPos.x, -0.6, initialPos.z);

    // 1. Base Prismática Hexagonal (Metal Escuro Cyber, sutil e sob o chão)
    const baseGeo = new THREE.CylinderGeometry(0.9, 1.15, 0.25, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: defaultColor,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.55
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    group.add(baseMesh);

    // 1.1. Contorno Wireframe Hexagonal Neon
    const wireGeo = new THREE.CylinderGeometry(0.92, 1.17, 0.27, 6);
    const wireMat = new THREE.MeshBasicMaterial({
      color: defaultColor,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    group.add(wireMesh);

    // 2. Topo de Vidro Cibernético Transparente
    const topGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.08, 6);
    const topMat = new THREE.MeshBasicMaterial({
      color: defaultColor,
      transparent: true,
      opacity: 0.35
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0.15;
    group.add(topMesh);

    // 3. Coluna de Luz Holográfica Vertical (Elevador de Fótons discreto)
    const beamGeo = new THREE.CylinderGeometry(0.65, 0.9, 3.2, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: defaultColor,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 1.6;
    group.add(beamMesh);

    // 4. Anel Giroscópico Holográfico Horizontal
    const ringGeo = new THREE.TorusGeometry(1.25, 0.04, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: defaultColor,
      transparent: true,
      opacity: 0.65
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    // 5. Anel Orbital Inclinado
    const ring2Geo = new THREE.TorusGeometry(1.4, 0.03, 6, 24);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = Math.PI / 2.3;
    ring2Mesh.rotation.y = 0.4;
    group.add(ring2Mesh);

    // 6. Propulsor Iônico de Levitação (Cone voltado para baixo)
    const thrusterGeo = new THREE.ConeGeometry(0.45, 0.6, 6, 1, true);
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: defaultColor,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterMesh.position.y = -0.4;
    thrusterMesh.rotation.x = Math.PI;
    group.add(thrusterMesh);

    this.scene.add(group);

    return {
      group,
      baseMesh,
      baseMat,
      wireMesh,
      wireMat,
      topMesh,
      topMat,
      beamMesh,
      beamMat,
      ringMesh,
      ringMat,
      ring2Mesh,
      ring2Mat,
      thrusterMesh,
      thrusterMat,
      side,
      row,
      color: defaultColor,
      homeScreenX: screenX,
      homeScreenY: screenY,
      current3DX: initialPos.x,
      current3DZ: initialPos.z
    };
  }

  // ── Sincronização Dinâmica em Tempo Real entre Robôs 2D e Pedestais 3D ──
  syncRobotPedestals(engine, getCenterFn) {
    if (!this.scene || !this.camera || !this.pedestals || !engine) return;

    const allRobots = [
      ...(engine.playerTeam || []),
      ...(engine.enemyTeam || [])
    ];

    allRobots.forEach(bot => {
      if (!bot) return;
      const targetRow = bot.homeRow !== undefined ? bot.homeRow : bot.row;
      const ped = this.pedestals.find(p => p.side === bot.side && p.row === targetRow);
      if (!ped) return;

      const base = getCenterFn ? getCenterFn(bot.col, bot.row) : { x: ped.homeScreenX, y: ped.homeScreenY };
      const drawX = (bot.customDrawX !== null && bot.customDrawX !== undefined) ? bot.customDrawX : base.x;
      const drawY = (bot.customDrawY !== null && bot.customDrawY !== undefined) ? bot.customDrawY : base.y;

      // Posição 3D correspondente EXATA da coordenada 2D de tela (sem offset arbitrário!)
      const target3D = this.get3DPosFrom2D(drawX, drawY, -0.6);

      // Trava e alinha posição 3D diretamente no mesmo ponto do robô 2D
      ped.group.position.x = target3D.x;
      ped.group.position.z = target3D.z;

      // Movimento sincronizado simultâneo
      if (bot.animating) {
        // Inclinação dinâmica na direção do avanço
        const dir = (bot.side === 'PLAYER') ? 1 : -1;
        ped.group.rotation.z = -dir * 0.1;
        ped.ringMesh.rotation.z += 0.09;
        ped.thrusterMat.opacity = 0.9;
      } else {
        ped.group.rotation.z *= 0.85;
        ped.thrusterMat.opacity = 0.55;
      }

      // Flutuação coordenada com a respiração do robô
      const breath = Math.sin(this.time * 2.2 + (bot.row || 1) * 1.2) * 0.08;
      ped.group.position.y = -0.6 + breath;

      // Atualização de cor e iluminação de acordo com estado do robô
      const isAlive = bot.isAlive;
      const isSelected = (bot.side === 'PLAYER' && window.selectedDeckRobotId === bot.id);
      const colorHex = bot.color ? parseInt(bot.color.replace('#', '0x'), 16) : (bot.side === 'PLAYER' ? 0x00ff88 : 0xff3344);

      if (!isAlive) {
        // Robô caído: feixe apaga e anéis desaceleram
        ped.beamMesh.visible = false;
        ped.topMat.color.setHex(0x223344);
        ped.ringMat.color.setHex(0x223344);
        ped.wireMat.color.setHex(0x223344);
        ped.thrusterMat.opacity = 0.1;
      } else {
        ped.beamMesh.visible = true;
        ped.topMat.color.setHex(colorHex);
        ped.ringMat.color.setHex(colorHex);
        ped.wireMat.color.setHex(colorHex);
        ped.beamMat.color.setHex(colorHex);
        ped.thrusterMat.color.setHex(colorHex);

        // Durante o modo de seleção de alvos, destaca apenas os pedestais dos candidatos sob os robôs 2D
        if (window.targetSelectionMode) {
          const isTargetCand = (window.targetSelectionMode.type === 'attack' && bot.side === 'ENEMY' && bot.isAlive)
                            || (window.targetSelectionMode.type === 'support' && bot.side === 'PLAYER');
          if (isTargetCand) {
            ped.group.visible = true;
            const candHex = (window.targetSelectionMode.type === 'attack') ? 0xff3344 : 0x00ff88;
            ped.beamMat.color.setHex(candHex);
            ped.ringMat.color.setHex(candHex);
            ped.wireMat.color.setHex(candHex);
            ped.beamMat.opacity = 0.55;
            ped.thrusterMat.opacity = 0.85;
          } else {
            ped.group.visible = false;
          }
        } else {
          ped.group.visible = true;
          if (isSelected) {
            // Robô selecionado: luz intensa e giro rápido
            ped.beamMat.opacity = 0.52;
            ped.ringMesh.rotation.z += 0.055;
            ped.ring2Mesh.rotation.x += 0.035;
          } else if (bot.action === 'attack') {
            ped.beamMat.opacity = 0.42;
            ped.beamMat.color.setHex(0xff3344);
            ped.ringMat.color.setHex(0xff3344);
          } else if (bot.action === 'defense') {
            ped.beamMat.opacity = 0.42;
            ped.beamMat.color.setHex(0x00e5ff);
            ped.ringMat.color.setHex(0x00e5ff);
          } else if (bot.action === 'support') {
            ped.beamMat.opacity = 0.42;
            ped.beamMat.color.setHex(0x00ff88);
            ped.ringMat.color.setHex(0x00ff88);
          } else {
            ped.beamMat.opacity = 0.22;
          }
        }
      }
    });
  }

  // ── Partículas Espaciais de Poeira Cibernética ─────────────────────
  _buildAtmosphericDust() {
    const count = 360;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 60;
      pos[i + 1] = Math.random() * 25 - 2;
      pos[i + 2] = (Math.random() - 0.5) * 45;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.22,
      transparent: true,
      opacity: 0.55
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. DISPAROS & ANIMAÇÕES 3D DE COMBATE (CINEMÁTICAS DINÂMICAS)
  // ═════════════════════════════════════════════════════════════════

  // Disparo de Laser 3D de alta voltagem entre duas raias
  trigger3DAttackLaser(fromSide, fromRow, toRow, hexColor = 0xff3344) {
    if (!this.scene) return;
    const fromPed = this.pedestals.find(p => p.side === fromSide && p.row === fromRow);
    const targetSide = fromSide === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    const toPed = this.pedestals.find(p => p.side === targetSide && p.row === toRow);
    if (!fromPed || !toPed) return;

    const startPos = new THREE.Vector3(fromPed.group.position.x, 1.2, fromPed.group.position.z);
    const endPos   = new THREE.Vector3(toPed.group.position.x, 1.2, toPed.group.position.z);
    const distance = startPos.distanceTo(endPos);

    // Laser Beam Prismático
    const beamGeo = new THREE.CylinderGeometry(0.28, 0.28, distance, 8);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.95
    });

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    beamMesh.position.copy(midPoint);
    beamMesh.lookAt(endPos);

    this.scene.add(beamMesh);

    // Esfera de Impacto
    const impactGeo = new THREE.SphereGeometry(1.2, 12, 12);
    const impactMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const impactMesh = new THREE.Mesh(impactGeo, impactMat);
    impactMesh.position.copy(endPos);
    this.scene.add(impactMesh);

    const vfx = {
      update: (dt) => {
        vfx.life -= dt * 2.5;
        beamMat.opacity = vfx.life;
        impactMesh.scale.addScalar(0.18);
        impactMat.opacity = vfx.life;
        if (vfx.life <= 0) {
          this.scene.remove(beamMesh);
          this.scene.remove(impactMesh);
          beamGeo.dispose();
          beamMat.dispose();
          impactGeo.dispose();
          impactMat.dispose();
          return false;
        }
        return true;
      },
      life: 1.0
    };

    this.activeVFX.push(vfx);
  }

  // Cúpula Holográfica de Energia 3D (Escudo Ativo)
  trigger3DDefenseDome(side, row, hexColor = 0x00e5ff) {
    if (!this.scene) return;
    const ped = this.pedestals.find(p => p.side === side && p.row === row);
    if (!ped) return;

    const domeGeo = new THREE.IcosahedronGeometry(2.8, 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.set(ped.group.position.x, 1.4, ped.group.position.z);
    this.scene.add(domeMesh);

    const vfx = {
      update: (dt) => {
        domeMesh.rotation.y += 0.04;
        domeMesh.rotation.x += 0.02;
        vfx.life -= dt * 0.8;
        domeMat.opacity = Math.max(0, vfx.life);
        if (vfx.life <= 0) {
          this.scene.remove(domeMesh);
          domeGeo.dispose();
          domeMat.dispose();
          return false;
        }
        return true;
      },
      life: 1.6
    };

    this.activeVFX.push(vfx);
  }

  // Vórtice de Nanites em Dupla Hélice 3D (Suporte / Cura / Reviver)
  trigger3DSupportHelix(side, row, hexColor = 0x00ff88) {
    if (!this.scene) return;
    const ped = this.pedestals.find(p => p.side === side && p.row === row);
    if (!ped) return;

    const helixCount = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(helixCount * 3);

    for (let i = 0; i < helixCount; i++) {
      const t = (i / helixCount) * Math.PI * 4;
      pos[i * 3] = Math.cos(t) * 1.6;
      pos[i * 3 + 1] = (i / helixCount) * 7;
      pos[i * 3 + 2] = Math.sin(t) * 1.6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: hexColor,
      size: 0.35,
      transparent: true,
      opacity: 0.95
    });

    const helix = new THREE.Points(geo, mat);
    helix.position.set(ped.group.position.x, 0, ped.group.position.z);
    this.scene.add(helix);

    const vfx = {
      update: (dt) => {
        helix.rotation.y += 0.08;
        helix.position.y += 0.08;
        vfx.life -= dt * 0.9;
        mat.opacity = Math.max(0, vfx.life);
        if (vfx.life <= 0) {
          this.scene.remove(helix);
          geo.dispose();
          mat.dispose();
          return false;
        }
        return true;
      },
      life: 1.4
    };

    this.activeVFX.push(vfx);
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. PREVIEW 3D DO ROBÔ NO RECRUTAMENTO / DRAFT
  // ═════════════════════════════════════════════════════════════════
  initDraft3DPreview(containerId = 'versusDraft3DPreview', robotData = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.disposeDraftPreview();
    container.innerHTML = '';

    if (typeof THREE === 'undefined') return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();

    const colorHex = robotData?.color ? parseInt(robotData.color.replace('#', '0x'), 16) : 0x00ff88;

    // Núcleo Dodecaédrico do Robô
    const coreGeo = new THREE.DodecahedronGeometry(1.8, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Anel Giroscópico Exterior 1
    const ring1Geo = new THREE.TorusGeometry(2.6, 0.06, 6, 24);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    // Anel Giroscópico Exterior 2
    const ring2Geo = new THREE.TorusGeometry(3.0, 0.05, 6, 24);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.45 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.5;
    group.add(ring2);

    scene.add(group);

    const anim = () => {
      this.previewAnimId = requestAnimationFrame(anim);
      group.rotation.y += 0.025;
      group.rotation.x += 0.012;
      ring1.rotation.y -= 0.035;
      ring2.rotation.z += 0.02;
      renderer.render(scene, camera);
    };
    anim();

    this.previewScene = scene;
    this.previewCamera = camera;
    this.previewRenderer = renderer;
    this.previewMeshGroup = group;
  }

  disposeDraftPreview() {
    if (this.previewAnimId) {
      cancelAnimationFrame(this.previewAnimId);
      this.previewAnimId = null;
    }
    if (this.previewRenderer) {
      this.previewRenderer.dispose();
      this.previewRenderer = null;
    }
    this.previewScene = null;
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. LOOP PRINCIPAL DE RENDERIZAÇÃO 3D
  // ═════════════════════════════════════════════════════════════════
  _startLoop() {
    const clock = new THREE.Clock();

    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      this.time += dt;

      // Ondulação dinâmica do Grid Cyber Matrix
      if (this.gridGeometry && this.gridOriginalY) {
        const pos = this.gridGeometry.attributes.position;
        const count = pos.count;
        for (let i = 0; i < count; i++) {
          const vx = pos.getX(i);
          const vy = this.gridOriginalY[i];
          const wave = Math.sin(vx * 0.22 + this.time * 2.2) * Math.cos(vy * 0.22 + this.time * 1.8) * 1.4
                     + Math.sin(vx * 0.1 - this.time * 1.2) * 0.6;
          pos.setZ(i, wave);
        }
        pos.needsUpdate = true;
      }

      // Rotação & Flutuação do Núcleo Monolítico Central
      if (this.coreMonolith && this.coreInner && this.coreRing && this.coreGroup) {
        this.coreMonolith.rotation.y += 0.022;
        this.coreMonolith.rotation.x += 0.012;
        this.coreInner.rotation.y -= 0.035;
        this.coreInner.rotation.z += 0.015;
        this.coreRing.rotation.z += 0.025;
        this.coreRing.rotation.x = Math.PI / 2 + Math.sin(this.time * 1.8) * 0.2;
        this.coreGroup.position.y = 3.2 + Math.sin(this.time * 1.6) * 0.55;
      }

      // Rotação Giroscópica Contínua dos Anéis dos Pedestais
      this.pedestals.forEach(p => {
        if (p.ringMesh) p.ringMesh.rotation.z += 0.025;
        if (p.ring2Mesh) p.ring2Mesh.rotation.x -= 0.018;
      });

      // Flutuação & Giro da Poeira Cósmica
      if (this.particleSystem) {
        this.particleSystem.rotation.y = this.time * 0.04;
        this.particleSystem.position.y = Math.sin(this.time * 0.8) * 0.8;
      }

      // Atualização dos Efeitos 3D Ativos
      for (let i = this.activeVFX.length - 1; i >= 0; i--) {
        const alive = this.activeVFX[i].update(dt);
        if (!alive) this.activeVFX.splice(i, 1);
      }

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 880;
    const height = this.container.clientHeight || 460;
    this.currentWidth = width;
    this.currentHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // Atualiza posições de repouso dos pedestais com base nas novas dimensões
    if (this.pedestals) {
      this.pedestals.forEach(ped => {
        const screenX = ped.side === 'PLAYER' ? (width * 0.12) : (width * 0.88);
        const screenY = height * (ped.row * 0.25);
        ped.homeScreenX = screenX;
        ped.homeScreenY = screenY;
        const p3d = this.get3DPosFrom2D(screenX, screenY, -0.6);
        ped.group.position.set(p3d.x, -0.6, p3d.z);
      });
    }
  }

  disposeArena() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this._onResizeBound) {
      window.removeEventListener('resize', this._onResizeBound);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }
}

// Instância Global
export const versus3DEngine = new Versus3DEngine();
window.versus3DEngine = versus3DEngine;
