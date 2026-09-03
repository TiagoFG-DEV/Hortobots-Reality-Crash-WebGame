// TERMINAL/public/js/terminal-3d.js - Cinemáticas e Elementos 3D Procedurais (SEM Modelos de Personagens)
export class Terminal3DEngine {
  constructor() {
    this.coreScene = null;
    this.coreCamera = null;
    this.coreRenderer = null;
    this.coreAnimId = null;
    this.coreMeshGroup = null;

    this.ascentScene = null;
    this.ascentCamera = null;
    this.ascentRenderer = null;
    this.ascentAnimId = null;
    this.ascentMeshes = [];

    // Fundo 3D da Tela de Título (Torre Realista Girando em Segundo Plano)
    this.titleScene = null;
    this.titleCamera = null;
    this.titleRenderer = null;
    this.titleAnimId = null;
    this.titleTowerGroup = null;
  }

  // =========================================================================
  // 1. CINEMÁTICA 3D DE SUBIDA DA TORRE (ESCADA EM ESPIRAL / ASCENSÃO HELICOIDAL)
  // =========================================================================
  async runSpiralAscentCinematic(targetFloorNum, targetFloorName, themeName, onComplete) {
    const overlay = document.getElementById('towerAscent3DOverlay');
    const container = document.getElementById('towerAscent3DCanvasContainer');
    const titleEl = document.getElementById('ascentFloorTitle');

    if (!overlay || !container) {
      if (onComplete) onComplete();
      return;
    }

    if (titleEl) titleEl.innerText = `${targetFloorNum} ANDAR`;
    overlay.classList.remove('hidden');

    // Se Three.js estiver disponível, renderiza a cena 3D completa de Escada em Espiral
    if (typeof THREE !== 'undefined') {
      this.startThreeAscentScene(container, targetFloorNum);
    } else {
      this.startCanvasFallbackAscent(container, targetFloorNum);
    }

    const duration = 4600; // 4.6 segundos lentos e majestosos mostrando a ascensão de 1 andar
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          this.stopAscentScene(container);
          overlay.classList.add('hidden');
          if (onComplete) onComplete();
        }, 300);
      }
    }, 50);
  }

  startThreeAscentScene(container, targetFloorNum) {
    container.innerHTML = '';
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020703, 0.015);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Coluna Central de Energia (Cilindro Tronco com Wireframe)
    const pillarGeo = new THREE.CylinderGeometry(2.5, 2.5, 120, 16, 24, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 40;
    scene.add(pillar);

    // 2. Núcleo de Laser Central
    const laserGeo = new THREE.CylinderGeometry(0.4, 0.4, 150, 8);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.75
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.position.y = 50;
    scene.add(laser);

    // 3. Degraus Procedurais da Escada em Espiral (Dupla Hélice)
    const stepsCount = 120;
    const radius = 6.5;
    const heightPerStep = 0.55;
    const anglePerStep = 0.18;

    const stepGeo = new THREE.BoxGeometry(2.2, 0.18, 0.9);
    const stepMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: false,
      transparent: true,
      opacity: 0.65
    });
    const stepEdgeMat = new THREE.LineBasicMaterial({ color: 0xffd700 });

    const stairsGroup = new THREE.Group();

    for (let i = 0; i < stepsCount; i++) {
      const angle = i * anglePerStep;
      const y = i * heightPerStep;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(x, y, z);
      step.rotation.y = -angle + Math.PI / 2;

      // Borda luminosa dourada em cada degrau
      const edges = new THREE.EdgesGeometry(stepGeo);
      const line = new THREE.LineSegments(edges, stepEdgeMat);
      step.add(line);

      stairsGroup.add(step);
    }
    scene.add(stairsGroup);

    // 4. Portais e Anéis de Setores da Torre (8 Anéis Flutuantes)
    for (let f = 1; f <= 8; f++) {
      const ringGeo = new THREE.TorusGeometry(8.5, 0.12, 8, 32);
      const isTarget = f === targetFloorNum;
      const ringMat = new THREE.MeshBasicMaterial({
        color: isTarget ? 0xffd700 : 0x00ff66,
        wireframe: true,
        transparent: true,
        opacity: isTarget ? 0.9 : 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = f * 8.5;
      scene.add(ring);
    }

    // 5. Campo de Partículas Quânticas de Subida
    const partCount = 450;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(partCount * 3);
    for (let p = 0; p < partCount * 3; p += 3) {
      positions[p] = (Math.random() - 0.5) * 35;
      positions[p + 1] = Math.random() * 90;
      positions[p + 2] = (Math.random() - 0.5) * 35;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x00ff66,
      size: 0.25,
      transparent: true,
      opacity: 0.65
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Loop de Animação: Câmera Subindo com Calma ao Longo de 1 Andar
    let t = 0;
    const animate = () => {
      this.ascentAnimId = requestAnimationFrame(animate);
      t += 0.0065; // Velocidade lenta e clara de subida de 1 andar

      // Movimento helicoidal suave da câmera subindo a escada
      const camY = t * 3.5;
      const camAngle = t * 0.45;
      const camDist = 9.5 + Math.sin(t * 1.2) * 1.2;

      camera.position.x = Math.cos(camAngle) * camDist;
      camera.position.z = Math.sin(camAngle) * camDist;
      camera.position.y = camY + 2.0;

      // Câmera olha suavemente para a frente e para o centro
      camera.lookAt(0, camY + 4.5, 0);

      // Rotação suave da coluna e dos anéis
      pillar.rotation.y += 0.005;
      particles.rotation.y -= 0.003;

      renderer.render(scene, camera);
    };

    animate();

    this.ascentScene = scene;
    this.ascentCamera = camera;
    this.ascentRenderer = renderer;
  }

  startCanvasFallbackAscent(container, targetFloorNum) {
    container.innerHTML = '<canvas id="ascent2DFallback" style="width: 100%; height: 100%; display: block;"></canvas>';
    const canvas = document.getElementById('ascent2DFallback');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 500;

    let t = 0;
    const draw = () => {
      this.ascentAnimId = requestAnimationFrame(draw);
      t += 0.04;
      ctx.fillStyle = '#020703';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Desenha escada espiral 2.5D projetada
      for (let i = 0; i < 40; i++) {
        const angle = i * 0.3 + t * 2;
        const radius = 60 + i * 4;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * (radius * 0.4) - (i * 4 - t * 40) % 300;

        ctx.strokeStyle = i % 2 === 0 ? '#00ff66' : '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    draw();
  }

  stopAscentScene(container) {
    if (this.ascentAnimId) {
      cancelAnimationFrame(this.ascentAnimId);
      this.ascentAnimId = null;
    }
    if (this.ascentRenderer) {
      this.ascentRenderer.dispose();
      this.ascentRenderer = null;
    }
    if (container) container.innerHTML = '';
  }

  // =========================================================================
  // 2. MODELAGEM PROCEDURAL REALISTA DA TORRE (COMPARTILHADA ENTRE TÍTULO E HUB)
  // =========================================================================
  createRealisticTowerGroup(options = {}) {
    const {
      isBackground = false,
      currentFloorNum = 1,
      clearedFloorsSet = new Set(),
      themeColor = 0x00ff88,
      accentColor = 0xffd700,
      dangerColor = 0xff3344
    } = options;

    const group = new THREE.Group();
    const alphaFactor = isBackground ? 0.38 : 1.0;

    // ─────────────────────────────────────────────────────────────────
    // 1. BASE REFORÇADA MULTI-NÍVEL (Fundação Arquitetônica Escalonada)
    // ─────────────────────────────────────────────────────────────────
    // Nível Inferior mais largo com chanfro
    const base1Geo = new THREE.CylinderGeometry(2.8, 3.4, 0.7, 16);
    const base1Mat = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4 * alphaFactor
    });
    const base1Mesh = new THREE.Mesh(base1Geo, base1Mat);
    base1Mesh.position.y = -4.5;
    group.add(base1Mesh);

    // Nível Intermediário
    const base2Geo = new THREE.CylinderGeometry(2.2, 2.7, 0.6, 16);
    const base2Mat = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.25 * alphaFactor
    });
    const base2Mesh = new THREE.Mesh(base2Geo, base2Mat);
    base2Mesh.position.y = -3.9;
    group.add(base2Mesh);

    // Contrafortes angulares na base (8 pilares de sustentação externa)
    for (let b = 0; b < 8; b++) {
      const bAngle = (b / 8) * Math.PI * 2;
      const bRad = 2.55;
      const buttressGeo = new THREE.BoxGeometry(0.28, 1.1, 0.7);
      const buttressMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5 * alphaFactor
      });
      const buttress = new THREE.Mesh(buttressGeo, buttressMat);
      buttress.position.set(Math.cos(bAngle) * bRad, -4.2, Math.sin(bAngle) * bRad);
      buttress.rotation.y = -bAngle;
      group.add(buttress);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. CORPO CILÍNDRICO (FUSTE) COM NÚCLEO DE ENERGIA
    // ─────────────────────────────────────────────────────────────────
    const shaftHeight = 7.6;
    const shaftGeo = new THREE.CylinderGeometry(1.5, 1.7, shaftHeight, 16, 16, true);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.35 * alphaFactor
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.y = 0.2;
    group.add(shaftMesh);

    // Núcleo Central de Laser Luminoso (Eixo Vertical)
    const laserGeo = new THREE.CylinderGeometry(0.15, 0.15, shaftHeight + 2.5, 8);
    const laserMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.75 * alphaFactor
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.y = 0.5;
    group.add(laserMesh);

    // ─────────────────────────────────────────────────────────────────
    // 3. 8 ANDARES NÍTIDOS: PLATAFORMAS, CORNIJAS & BALAUSTRADAS
    // ─────────────────────────────────────────────────────────────────
    let currentFloorCubeMat = null;
    const floorHeight = shaftHeight / 8;
    const startY = -3.5;

    for (let f = 1; f <= 8; f++) {
      const y = startY + (f - 0.5) * floorHeight;
      const isCleared = f < currentFloorNum || (f === 8 && clearedFloorsSet.has(8));
      const isCurrent = f === currentFloorNum && !clearedFloorsSet.has(8);

      // Plataforma circular saliente do andar
      const platGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.16, 16);
      const platMat = new THREE.MeshBasicMaterial({
        color: isCurrent ? accentColor : (isCleared ? themeColor : 0x004422),
        wireframe: true,
        transparent: true,
        opacity: (isCurrent ? 0.85 : 0.45) * alphaFactor
      });
      const platMesh = new THREE.Mesh(platGeo, platMat);
      platMesh.position.y = y - floorHeight * 0.4;
      group.add(platMesh);

      // Guarda-corpo circular exterior
      const guardGeo = new THREE.TorusGeometry(1.96, 0.03, 6, 24);
      const guardMat = new THREE.MeshBasicMaterial({
        color: isCurrent ? accentColor : themeColor,
        transparent: true,
        opacity: 0.6 * alphaFactor
      });
      const guardMesh = new THREE.Mesh(guardGeo, guardMat);
      guardMesh.rotation.x = Math.PI / 2;
      guardMesh.position.y = y - floorHeight * 0.3;
      group.add(guardMesh);

      // 4 Colunas verticais conectando os andares
      for (let c = 0; c < 4; c++) {
        const cAngle = (c / 4) * Math.PI * 2 + (f * 0.2);
        const colGeo = new THREE.CylinderGeometry(0.04, 0.04, floorHeight, 6);
        const colMat = new THREE.MeshBasicMaterial({
          color: themeColor,
          transparent: true,
          opacity: 0.3 * alphaFactor
        });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set(Math.cos(cAngle) * 1.65, y, Math.sin(cAngle) * 1.65);
        group.add(colMesh);
      }

      // Cubo indicador de telemetria do andar
      const cubeGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
      let cubeMat;
      if (isCurrent) {
        cubeMat = new THREE.MeshBasicMaterial({
          color: accentColor,
          transparent: true,
          opacity: 0.95
        });
        currentFloorCubeMat = cubeMat;
      } else if (isCleared) {
        cubeMat = new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.85 * alphaFactor
        });
      } else {
        cubeMat = new THREE.MeshBasicMaterial({
          color: dangerColor,
          wireframe: true,
          transparent: true,
          opacity: 0.35 * alphaFactor
        });
      }
      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      const cubeAngle = (f - 1) * (Math.PI * 0.55);
      cubeMesh.position.set(Math.cos(cubeAngle) * 2.05, y, Math.sin(cubeAngle) * 2.05);
      group.add(cubeMesh);
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. ESCADARIA EM ESPIRAL REALISTA (HÉLICE CONTÍNUA COM DEGRAUS)
    // ─────────────────────────────────────────────────────────────────
    const spiralSteps = 84;
    const spiralRadius = 2.15;
    const spiralCurvePoints = [];

    for (let s = 0; s <= spiralSteps; s++) {
      const sProgress = s / spiralSteps;
      const sAngle = sProgress * Math.PI * 5.0; // 2.5 voltas ao redor do fuste
      const sY = startY + sProgress * shaftHeight;

      // Degrau individual projetado
      const stepGeo = new THREE.BoxGeometry(0.55, 0.05, 0.20);
      const stepMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: (0.45 + (s % 2) * 0.25) * alphaFactor
      });
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(Math.cos(sAngle) * spiralRadius, sY, Math.sin(sAngle) * spiralRadius);
      stepMesh.rotation.y = -sAngle + Math.PI / 2;
      group.add(stepMesh);

      // Ponto para o corrimão helicoidal externo
      const handrailRadius = spiralRadius + 0.24;
      spiralCurvePoints.push(new THREE.Vector3(
        Math.cos(sAngle) * handrailRadius,
        sY + 0.22,
        Math.sin(sAngle) * handrailRadius
      ));
    }

    // Corrimão tubular contínuo da escada espiral
    const handrailCurve = new THREE.CatmullRomCurve3(spiralCurvePoints);
    const handrailGeo = new THREE.TubeGeometry(handrailCurve, 72, 0.04, 6, false);
    const handrailMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.65 * alphaFactor
    });
    const handrailMesh = new THREE.Mesh(handrailGeo, handrailMat);
    group.add(handrailMesh);

    // ─────────────────────────────────────────────────────────────────
    // 5. TETO CÔNICO, PINÁCULO & FAROL NO TOPO
    // ─────────────────────────────────────────────────────────────────
    const topY = startY + shaftHeight;

    // Cornija / Parapeito ameado superior
    const corniceGeo = new THREE.CylinderGeometry(2.0, 1.8, 0.35, 16);
    const corniceMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5 * alphaFactor
    });
    const corniceMesh = new THREE.Mesh(corniceGeo, corniceMat);
    corniceMesh.position.y = topY + 0.18;
    group.add(corniceMesh);

    // Cúpula cônica imponente da torre
    const coneGeo = new THREE.ConeGeometry(1.9, 2.6, 16, 4, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45 * alphaFactor
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.y = topY + 1.6;
    group.add(coneMesh);

    // Anel decorativo na metade da cúpula cônica
    const coneRingGeo = new THREE.TorusGeometry(1.0, 0.04, 6, 20);
    const coneRingMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.7 * alphaFactor
    });
    const coneRing = new THREE.Mesh(coneRingGeo, coneRingMat);
    coneRing.rotation.x = Math.PI / 2;
    coneRing.position.y = topY + 1.8;
    group.add(coneRing);

    // Pináculo afiado (agulha transmissora no ápice)
    const spireGeo = new THREE.CylinderGeometry(0.04, 0.22, 2.2, 8);
    const spireMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.85 * alphaFactor
    });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.y = topY + 3.8;
    group.add(spireMesh);

    // Farol luminoso pulsante na ponta do pináculo
    const beaconGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = topY + 4.9;
    group.add(beaconMesh);

    // ─────────────────────────────────────────────────────────────────
    // 6. CAMPO DE PARTÍCULAS / POEIRA CIBERNÉTICA
    // ─────────────────────────────────────────────────────────────────
    const partCount = isBackground ? 120 : 60;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let p = 0; p < partCount * 3; p += 3) {
      partPos[p] = (Math.random() - 0.5) * 8.5;
      partPos[p + 1] = -4.5 + Math.random() * 14.0;
      partPos[p + 2] = (Math.random() - 0.5) * 8.5;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: themeColor,
      size: 0.15,
      transparent: true,
      opacity: 0.45 * alphaFactor
    });
    const particles = new THREE.Points(partGeo, partMat);
    group.add(particles);

    return { group, currentFloorCubeMat, beaconMat, particles };
  }

  // =========================================================================
  // 3. HOLOGRAMA 3D DA TORRE REALISTA NO HUB (ELEVADOR)
  // =========================================================================
  initHub3DCoreHologram(containerId = 'hub3DCoreCanvasContainer', clearedFloorsSet = new Set(), currentFloorVal = 1) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.disposeCoreHologram();
    container.innerHTML = '';

    const width = container.clientWidth > 100 ? container.clientWidth : 360;
    const height = container.clientHeight > 100 ? container.clientHeight : 240;

    if (typeof THREE === 'undefined') {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--term-accent); font-family: monospace; font-size: 0.9rem; text-align: center;">
          [ TELEMETRIA DA TORRE 3D ]<br>ESTRUTURA CILÍNDRICA ATIVA
        </div>
      `;
      return;
    }

    let currentFloorNum = 1;
    if (typeof currentFloorVal === 'number') {
      currentFloorNum = Math.min(8, Math.max(1, Math.floor(currentFloorVal)));
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 14.0);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const { group, currentFloorCubeMat, beaconMat, particles } = this.createRealisticTowerGroup({
      isBackground: false,
      currentFloorNum,
      clearedFloorsSet
    });

    scene.add(group);

    const animate = () => {
      this.coreAnimId = requestAnimationFrame(animate);
      group.rotation.y += 0.012;

      if (currentFloorCubeMat) {
        const pulse = 0.35 + 0.65 * Math.abs(Math.sin(Date.now() * 0.006));
        currentFloorCubeMat.opacity = pulse;
      }
      if (beaconMat) {
        beaconMat.opacity = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.008));
      }
      if (particles) {
        particles.rotation.y -= 0.003;
      }

      renderer.render(scene, camera);
    };

    animate();

    this.coreScene = scene;
    this.coreCamera = camera;
    this.coreRenderer = renderer;
    this.coreMeshGroup = group;
  }

  disposeCoreHologram() {
    if (this.coreAnimId) {
      cancelAnimationFrame(this.coreAnimId);
      this.coreAnimId = null;
    }
    if (this.coreRenderer) {
      this.coreRenderer.dispose();
      this.coreRenderer = null;
    }
    this.coreScene = null;
  }

  // =========================================================================
  // 4. FUNDO 3D DA TELA DE TÍTULO (TORRE REALISTA GIRANDO EM SEGUNDO PLANO)
  // =========================================================================
  createRealisticTowerGroup(options = {}) {
    const group = new THREE.Group();
    const holoGreen = 0x00ff88;
    const holoCyan = 0x00e5ff;
    const holoGold = 0xffd700;

    // Materiais Holográficos Cibernéticos
    const wireGreenMat = new THREE.MeshBasicMaterial({
      color: holoGreen,
      wireframe: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending
    });

    const holoTransMat = new THREE.MeshBasicMaterial({
      color: 0x003318,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const wireCyanMat = new THREE.MeshBasicMaterial({
      color: holoCyan,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const beaconMat = new THREE.MeshBasicMaterial({
      color: holoGold,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const createEdges = (mesh, color = 0x00ffaa, opacity = 0.85) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending
      }));
      mesh.add(line);
      return line;
    };

    // 1. BASE REFORÇADA ESCALONADA (Y = -5.2 a -4.2)
    const baseGeo1 = new THREE.CylinderGeometry(3.6, 4.2, 0.5, 12);
    const baseMesh1 = new THREE.Mesh(baseGeo1, holoTransMat);
    baseMesh1.position.y = -5.0;
    createEdges(baseMesh1, holoGreen, 0.9);
    group.add(baseMesh1);

    const baseGeo2 = new THREE.CylinderGeometry(3.1, 3.6, 0.5, 12);
    const baseMesh2 = new THREE.Mesh(baseGeo2, wireGreenMat);
    baseMesh2.position.y = -4.5;
    createEdges(baseMesh2, holoGreen, 0.85);
    group.add(baseMesh2);

    // Anel Emissor Holográfico no Solo
    const emitterRingGeo = new THREE.TorusGeometry(4.4, 0.06, 8, 36);
    const emitterRing = new THREE.Mesh(emitterRingGeo, wireCyanMat);
    emitterRing.rotation.x = Math.PI / 2;
    emitterRing.position.y = -5.2;
    group.add(emitterRing);

    // 8 Contrafortes Radiais na Base
    for (let b = 0; b < 8; b++) {
      const angle = (b / 8) * Math.PI * 2;
      const buttressGeo = new THREE.BoxGeometry(0.25, 0.9, 1.2);
      const buttress = new THREE.Mesh(buttressGeo, wireGreenMat);
      buttress.position.set(Math.cos(angle) * 3.3, -4.75, Math.sin(angle) * 3.3);
      buttress.rotation.y = -angle;
      createEdges(buttress, holoCyan, 0.8);
      group.add(buttress);
    }

    // 2. COLUNA ESTRUTURAL CENTRAL (FUSTE) (Y = -4.2 a +4.0)
    const coreGeo = new THREE.CylinderGeometry(0.9, 1.1, 8.4, 16);
    const coreMesh = new THREE.Mesh(coreGeo, holoTransMat);
    coreMesh.position.y = -0.1;
    createEdges(coreMesh, holoGreen, 0.7);
    group.add(coreMesh);

    // Feixe de Dados Laser Central Luminous Core
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, 8.6, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -0.1;
    group.add(beamMesh);

    // 4 Pilares Verticais Principais (Trusses nos 4 quadrantes)
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
      const pylonGeo = new THREE.CylinderGeometry(0.1, 0.1, 8.4, 6);
      const pylon = new THREE.Mesh(pylonGeo, wireCyanMat);
      pylon.position.set(Math.cos(a) * 2.35, -0.1, Math.sin(a) * 2.35);
      group.add(pylon);
    }

    // 3. OS 8 ANDARES NÍTIDOS DA TORRE MNEMOSYNE (Y = -3.8 a +3.8)
    const telemetryRings = [];
    const numFloors = 8;
    const startY = -3.6;
    const floorSpacing = 0.94;

    for (let f = 0; f < numFloors; f++) {
      const fy = startY + f * floorSpacing;

      // Plataforma anular do andar
      const platGeo = new THREE.CylinderGeometry(2.35, 2.45, 0.16, 16);
      const platMesh = new THREE.Mesh(platGeo, holoTransMat);
      platMesh.position.y = fy;
      createEdges(platMesh, holoGreen, 0.85);
      group.add(platMesh);

      // Balaustrada / Anel externo do andar
      const balustradeGeo = new THREE.TorusGeometry(2.5, 0.04, 6, 24);
      const balustrade = new THREE.Mesh(balustradeGeo, wireCyanMat);
      balustrade.rotation.x = Math.PI / 2;
      balustrade.position.y = fy + 0.15;
      group.add(balustrade);

      // 8 Vigas de suporte radial por andar
      for (let s = 0; s < 8; s++) {
        const sa = (s / 8) * Math.PI * 2;
        const strutGeo = new THREE.BoxGeometry(0.06, 0.14, 1.4);
        const strut = new THREE.Mesh(strutGeo, wireGreenMat);
        strut.position.set(Math.cos(sa) * 1.6, fy, Math.sin(sa) * 1.6);
        strut.rotation.y = -sa;
        group.add(strut);
      }

      // Anel Holográfico de Telemetria (Gira em velocidade própria)
      const tRingGeo = new THREE.RingGeometry(2.6, 2.72, 16);
      const tRingMat = new THREE.MeshBasicMaterial({
        color: f === 0 ? holoGold : holoGreen,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const tRing = new THREE.Mesh(tRingGeo, tRingMat);
      tRing.rotation.x = Math.PI / 2;
      tRing.position.y = fy + 0.08;
      group.add(tRing);
      telemetryRings.push(tRing);

      // Cubo de status / telemetria do andar
      const cubeGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const cubeMat = new THREE.MeshBasicMaterial({
        color: (f + 1) === 1 ? holoGold : holoCyan,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set(2.4, fy + 0.22, 0);
      group.add(cube);
    }

    // 4. ESCADARIA / HÉLICE DUPLA ESPIRAL (Ascendendo do piso ao topo)
    const numSteps = 56;
    for (let i = 0; i < numSteps; i++) {
      const t = i / numSteps;
      const angle = t * Math.PI * 6; // 3 voltas completas
      const sy = -3.8 + t * 7.6;
      const r = 1.65;

      const stepGeo = new THREE.BoxGeometry(0.35, 0.06, 0.18);
      const stepMesh = new THREE.Mesh(stepGeo, wireGreenMat);
      stepMesh.position.set(Math.cos(angle) * r, sy, Math.sin(angle) * r);
      stepMesh.rotation.y = -angle;
      group.add(stepMesh);
    }

    // 5. CÚPULA SUPERIOR & PINÁCULO DE TRANSMISSÃO (Y = +4.0 a +5.6)
    const roofBaseGeo = new THREE.CylinderGeometry(2.6, 2.35, 0.25, 16);
    const roofBase = new THREE.Mesh(roofBaseGeo, holoTransMat);
    roofBase.position.y = 4.0;
    createEdges(roofBase, holoGreen, 0.9);
    group.add(roofBase);

    const coneGeo = new THREE.ConeGeometry(2.4, 1.1, 16, 2, true);
    const coneMesh = new THREE.Mesh(coneGeo, wireGreenMat);
    coneMesh.position.y = 4.65;
    createEdges(coneMesh, holoGreen, 0.85);
    group.add(coneMesh);

    const spireGeo = new THREE.CylinderGeometry(0.04, 0.28, 1.4, 8);
    const spireMesh = new THREE.Mesh(spireGeo, wireCyanMat);
    spireMesh.position.y = 5.6;
    createEdges(spireMesh, holoCyan, 0.95);
    group.add(spireMesh);

    const beaconGeo = new THREE.SphereGeometry(0.38, 12, 12);
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = 6.35;
    group.add(beaconMesh);

    const beaconRingGeo = new THREE.TorusGeometry(0.65, 0.04, 6, 16);
    const beaconRing = new THREE.Mesh(beaconRingGeo, wireCyanMat);
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = 6.35;
    group.add(beaconRing);

    // 6. DISCO DE VARREDURA HOLOGRÁFICA (Scanning Ring)
    const scanRingGeo = new THREE.TorusGeometry(2.8, 0.08, 6, 32);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    scanRing.position.y = 0;
    group.add(scanRing);

    // 7. PARTÍCULAS / POEIRA CIBERNÉTICA DO PROJETOR HOLOGRÁFICO
    const particleCount = 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      const pAngle = Math.random() * Math.PI * 2;
      const pRad = 0.5 + Math.random() * 3.8;
      pPos[p] = Math.cos(pAngle) * pRad;
      pPos[p + 1] = -5.0 + Math.random() * 11.5;
      pPos[p + 2] = Math.sin(pAngle) * pRad;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    return {
      group,
      wireGreenMat,
      wireCyanMat,
      beaconMat,
      beaconRing,
      scanRing,
      particles,
      telemetryRings
    };
  }

  initTitle3DBackground(containerId = 'title3DCanvasContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.disposeTitle3DBackground();
    container.innerHTML = '';

    if (typeof THREE === 'undefined') return;

    const width = container.clientWidth || (window.innerWidth * 0.46);
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020703, 0.015);

    // Câmera posicionada para que a torre preencha do topo até a base da tela, perfeitamente centrada na direita
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 14.0);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const towerData = this.createRealisticTowerGroup({
      isBackground: true,
      currentFloorNum: 1,
      clearedFloorsSet: new Set()
    });

    const { group, wireGreenMat, wireCyanMat, beaconMat, beaconRing, scanRing, particles, telemetryRings } = towerData;
    scene.add(group);

    // Iluminação Holográfica Ambiental
    const ambientLight = new THREE.AmbientLight(0x00ff88, 1.2);
    scene.add(ambientLight);

    const holoPoint = new THREE.PointLight(0x00ff88, 3.5, 30);
    holoPoint.position.set(3, 2, 8);
    scene.add(holoPoint);

    const cyanPoint = new THREE.PointLight(0x00e5ff, 2.5, 30);
    cyanPoint.position.set(-3, -1, 7);
    scene.add(cyanPoint);

    // Animação Contínua: Rotação, Oscilação do Raio Scanner, e Cintilação/Flicker Holográfico Realista!
    let glitchCooldown = 0;
    const animate = () => {
      this.titleAnimId = requestAnimationFrame(animate);

      const now = performance.now();

      // Rotação suave contínua
      group.rotation.y += 0.0075;

      // Anéis de telemetria giram em direções alternadas
      telemetryRings.forEach((r, i) => {
        r.rotation.z += (i % 2 === 0 ? 0.012 : -0.009);
      });

      // Feixe de varredura holográfica subindo e descendo pela torre
      if (scanRing) {
        scanRing.position.y = Math.sin(now * 0.0016) * 4.4;
      }

      // Farol pulsando no topo
      if (beaconMat) {
        beaconMat.opacity = 0.5 + 0.5 * Math.sin(now * 0.005);
      }
      if (beaconRing) {
        beaconRing.rotation.z += 0.02;
      }

      // Poeira cibernética
      if (particles) {
        particles.rotation.y -= 0.0025;
      }

      // Cintilação / Flicker de Holograma:
      // Variação na opacidade e brilho simulando tubo CRT analógico
      const flicker = 0.85 + (Math.random() - 0.5) * 0.25;
      if (wireGreenMat) {
        wireGreenMat.opacity = Math.max(0.35, Math.min(1.0, 0.78 * flicker));
      }

      // Micro glitch dropout esporádico (piscada analógica de holograma de TV)
      glitchCooldown++;
      if (glitchCooldown > 120 && Math.random() < 0.08) {
        glitchCooldown = 0;
        group.position.x = (Math.random() - 0.5) * 0.09;
        if (wireGreenMat) wireGreenMat.opacity = 0.25;
        setTimeout(() => {
          group.position.x = 0;
        }, 60);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamento de janela
    const onResize = () => {
      if (!this.titleRenderer || !this.titleCamera || !container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      this.titleCamera.aspect = w / h;
      this.titleCamera.updateProjectionMatrix();
      this.titleRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    this.titleScene = scene;
    this.titleCamera = camera;
    this.titleRenderer = renderer;
    this.titleTowerGroup = group;
  }

  disposeTitle3DBackground() {
    if (this.titleAnimId) {
      cancelAnimationFrame(this.titleAnimId);
      this.titleAnimId = null;
    }
    if (this.titleRenderer) {
      this.titleRenderer.dispose();
      this.titleRenderer = null;
    }
    this.titleScene = null;
    this.titleCamera = null;
    this.titleTowerGroup = null;
  }

  // =========================================================================
  // 3. CINEMÁTICA 3D PROCEDURAL DA MOEDA DA SORTE (POLÍGONO 20 LADOS COM FÍSICA)
  // =========================================================================
  run3DCoinFlipCinematic(playerGuess, outcome, onComplete, customSuccessText = null, customFailText = null) {
    const overlay = document.getElementById('coin3DFullOverlay');
    const container = document.getElementById('coin3DCanvasContainer');
    const guessBadge = document.getElementById('coin3DPlayerGuessBadge');
    const statusText = document.getElementById('coin3DStatusText');
    const resultBox = document.getElementById('coin3DResultBox');

    if (!overlay || !container) {
      if (onComplete) onComplete({ won: playerGuess === outcome, outcome });
      return;
    }

    if (guessBadge) {
      guessBadge.innerText = `SEU PALPITE: ${playerGuess === 'CARA' ? 'CARA (JOKER DIGITAL)' : 'COROA (COROA IMPERIAL)'}`;
    }
    if (statusText) statusText.innerText = 'LANÇANDO MOEDA 3D NO ESPAÇO DE DADOS...';
    if (resultBox) {
      resultBox.style.borderColor = 'var(--term-border)';
      resultBox.style.boxShadow = '0 0 35px rgba(0, 255, 102, 0.35)';
    }

    overlay.classList.remove('hidden');

    if (typeof THREE === 'undefined') {
      setTimeout(() => {
        const won = playerGuess === outcome;
        if (statusText) {
          statusText.innerHTML = `DEU <strong>${outcome}</strong>!<br><span style="color:${won ? '#00ff66' : '#ff3344'}; font-size: 1.4rem;">${won ? (customSuccessText || '>> ESQUIVA COMPLETA (0 DANO) <<') : (customFailText || '>> GOLPE RECEBIDO <<')}</span>`;
        }
        setTimeout(() => {
          overlay.classList.add('hidden');
          if (onComplete) onComplete({ won, outcome });
        }, 1500);
      }, 1000);
      return;
    }

    container.innerHTML = '';
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Iluminação 3D Metálica
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5cc, 2.8);
    mainLight.position.set(6, 16, 10);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x00ff66, 2.5, 30);
    rimLight.position.set(-8, -2, 6);
    scene.add(rimLight);

    const cyanLight = new THREE.PointLight(0x00e5ff, 2.2, 30);
    cyanLight.position.set(8, 2, -6);
    scene.add(cyanLight);

    // 1. Texturas Procedurais de Alta Definição Gravadas (1024x1024) - APENAS SÍMBOLOS (SEM TEXTO)
    const createFaceCanvas = (type) => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1024;
      const ctx = cvs.getContext('2d');

      // Fundo Ouro Metálico Cibernético com Gradiente Radial e Anéis
      const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 500);
      grad.addColorStop(0, '#fffbe6');
      grad.addColorStop(0.25, '#f5cb23');
      grad.addColorStop(0.65, '#d4af37');
      grad.addColorStop(1, '#664d08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Círculos Concêntricos de Alto Relevo Metálico
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(512, 512, 475, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#4a370a';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(512, 512, 452, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(512, 512, 410, 0, Math.PI * 2);
      ctx.stroke();

      // 20 Marcadores Circulares Perimetrais (Polígono de 20 Lados)
      for (let i = 0; i < 20; i++) {
        const ang = (i / 20) * Math.PI * 2;
        const sx = 512 + Math.cos(ang) * 432;
        const sy = 512 + Math.sin(ang) * 432;
        ctx.fillStyle = '#fff6b3';
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      if (type === 'CARA') {
        // ==========================================
        // FACE CARA: APENAS O SORRISO / JOKER HACKER
        // ==========================================
        ctx.fillStyle = '#021808';
        ctx.beginPath();
        ctx.arc(512, 512, 340, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 16;
        ctx.stroke();

        // Olhos Neon Ciano/Verde Angulares
        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.ellipse(390, 420, 45, 65, -0.2, 0, Math.PI * 2);
        ctx.ellipse(634, 420, 45, 65, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.ellipse(390, 420, 22, 35, -0.2, 0, Math.PI * 2);
        ctx.ellipse(634, 420, 22, 35, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Grande Sorriso Expressivo e Marcante
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(512, 480, 180, 0.15 * Math.PI, 0.85 * Math.PI, false);
        ctx.stroke();

        // Presas / Dentes Cibernéticos Dourados
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(430, 600);
        ctx.lineTo(455, 660);
        ctx.lineTo(480, 600);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(544, 600);
        ctx.lineTo(569, 660);
        ctx.lineTo(594, 600);
        ctx.closePath();
        ctx.fill();
      } else {
        // ==========================================
        // FACE COROA: APENAS A COROA IMPERIAL
        // ==========================================
        ctx.fillStyle = '#14041a';
        ctx.beginPath();
        ctx.arc(512, 512, 340, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 16;
        ctx.stroke();

        // Diadema / Base da Coroa
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.roundRect(280, 640, 464, 60, 12);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Joias da Base
        const gemColors = ['#00e5ff', '#ff3344', '#00ff66', '#ff3344', '#00e5ff'];
        for (let g = 0; g < 5; g++) {
          ctx.fillStyle = gemColors[g];
          ctx.beginPath();
          ctx.arc(326 + g * 90, 670, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5 Pontas Majestosas da Coroa
        ctx.fillStyle = '#f5cb23';
        ctx.beginPath();
        ctx.moveTo(280, 640);
        ctx.lineTo(260, 400); // Ponta 1 (esquerda)
        ctx.lineTo(380, 520);
        ctx.lineTo(420, 320); // Ponta 2
        ctx.lineTo(512, 480);
        ctx.lineTo(512, 260); // Ponta 3 (centro mais alto)
        ctx.lineTo(512, 480);
        ctx.lineTo(604, 320); // Ponta 4
        ctx.lineTo(644, 520);
        ctx.lineTo(764, 400); // Ponta 5 (direita)
        ctx.lineTo(744, 640);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fffbe6';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Joias Reluzentes nas Pontas da Coroa
        const crownTips = [
          { x: 260, y: 400, r: 18, color: '#00e5ff' },
          { x: 420, y: 320, r: 22, color: '#ff3344' },
          { x: 512, y: 260, r: 28, color: '#00e5ff' },
          { x: 604, y: 320, r: 22, color: '#ff3344' },
          { x: 764, y: 400, r: 18, color: '#00e5ff' }
        ];

        crownTips.forEach(tip => {
          ctx.fillStyle = tip.color;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, tip.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.stroke();
        });
      }

      return new THREE.CanvasTexture(cvs);
    };

    const caraTexture = createFaceCanvas('CARA');
    const coroaTexture = createFaceCanvas('COROA');

    // 2. Materiais Metálicos
    // Material do Bordo (index 0)
    const goldEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.96,
      roughness: 0.22,
      flatShading: true
    });

    // Top Face (+Y) = CARA (index 1)
    const faceCaraMat = new THREE.MeshStandardMaterial({
      map: caraTexture,
      metalness: 0.88,
      roughness: 0.28
    });

    // Bottom Face (-Y) = COROA (index 2)
    const faceCoroaMat = new THREE.MeshStandardMaterial({
      map: coroaTexture,
      metalness: 0.88,
      roughness: 0.28
    });

    // 3. Geometria Completa da Moeda 3D (Polígono de 20 Lados)
    const coinGroup = new THREE.Group();

    // Cilindro Prismático de 20 Lados com Altura 0.65 e Raio 3.6
    const coinCylinderGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.65, 20, 1, false);
    const coinMesh = new THREE.Mesh(coinCylinderGeo, [goldEdgeMat, faceCaraMat, faceCoroaMat]);
    coinGroup.add(coinMesh);

    // Bordas Anelares em Alto-Relevo (Torus frontal e traseiro)
    const rimGeo = new THREE.TorusGeometry(3.38, 0.16, 12, 20);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.98,
      roughness: 0.18
    });

    const frontRim = new THREE.Mesh(rimGeo, rimMat);
    frontRim.rotation.x = Math.PI / 2;
    frontRim.position.y = 0.32;
    coinGroup.add(frontRim);

    const backRim = new THREE.Mesh(rimGeo, rimMat);
    backRim.rotation.x = Math.PI / 2;
    backRim.position.y = -0.32;
    coinGroup.add(backRim);

    // 20 Ranhuras Estriadas Perimetrais
    for (let i = 0; i < 20; i++) {
      const ridgeGeo = new THREE.BoxGeometry(0.12, 0.66, 0.16);
      const ridgeMesh = new THREE.Mesh(ridgeGeo, rimMat);
      const ang = (i / 20) * Math.PI * 2;
      ridgeMesh.position.set(Math.cos(ang) * 3.58, 0, Math.sin(ang) * 3.58);
      ridgeMesh.rotation.y = -ang;
      coinGroup.add(ridgeMesh);
    }

    scene.add(coinGroup);

    // Posição de repouso no ar bem acima da sombra (sem sobreposição)
    const groundFloorY = 0.4;

    // Sombra projetada no chão real (muito abaixo da moeda)
    const shadowGeo = new THREE.RingGeometry(0, 3.8, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.8;
    scene.add(shadowMesh);

    // 4. Animação de Física: Velocidade Acelerada + Quiques de Suspense + Rotação Exata
    const totalDuration = 3200; // 3.2s
    const startTime = Date.now();
    let animId = null;

    // ORIENTAÇÃO GARANTIDA POR OUTCOME:
    // Se CARA: face superior (+Y com Sorriso) fica voltada para cima e inclinada para a câmera (0.42 rad)
    // Se COROA: face inferior (-Y com Coroa) fica voltada para cima e inclinada para a câmera (Math.PI + 0.42 rad)
    const targetRotX = outcome === 'CARA' ? 0.42 : Math.PI + 0.42;
    const targetRotY = 0;
    const targetRotZ = 0;
    const extraSpins = 28 * Math.PI; // Giro veloz e emocionante

    let lastBounceIdx = -1;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / totalDuration);

      if (t < 0.52) {
        // FASE 1: LANÇAMENTO RÁPIDO & GIRO ACELERADO NO AR (0% a 52%)
        const airT = t / 0.52;
        const currentY = groundFloorY + Math.sin(airT * Math.PI) * 11.0;
        coinGroup.position.y = currentY;

        // Giro veloz tridimensional
        coinGroup.rotation.x = airT * extraSpins + airT * targetRotX;
        coinGroup.rotation.y = airT * (extraSpins * 0.8) + airT * targetRotY;
        coinGroup.rotation.z = airT * (extraSpins * 0.4) + airT * targetRotZ;

        // Sombra escala com a altitude
        const shadowDist = currentY - (-1.8);
        const shadowScale = Math.max(0.25, 1.2 - shadowDist / 14);
        shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
        shadowMat.opacity = Math.max(0.12, 0.6 * shadowScale);
      } else {
        // FASE 2: 4 QUIQUES COM SUSPENSE CRESCENTE & AMORTECIMENTO (52% a 100%)
        const landT = (t - 0.52) / 0.48; // 0.0 a 1.0

        let bounceY = 0;
        let currentBounceIdx = 0;

        if (landT < 0.35) {
          // Quique 1: Repercussão alta
          currentBounceIdx = 1;
          const p = landT / 0.35;
          bounceY = Math.sin(p * Math.PI) * 3.4;
        } else if (landT < 0.65) {
          // Quique 2: Repercussão média
          currentBounceIdx = 2;
          const p = (landT - 0.35) / 0.30;
          bounceY = Math.sin(p * Math.PI) * 1.8;
        } else if (landT < 0.85) {
          // Quique 3: Repercussão baixa
          currentBounceIdx = 3;
          const p = (landT - 0.65) / 0.20;
          bounceY = Math.sin(p * Math.PI) * 0.75;
        } else {
          // Quique 4: Assentamento final
          currentBounceIdx = 4;
          const p = (landT - 0.85) / 0.15;
          bounceY = Math.sin(p * Math.PI) * 0.20;
        }

        if (currentBounceIdx !== lastBounceIdx) {
          lastBounceIdx = currentBounceIdx;
          if (window.gameInstance && window.gameInstance.audio) {
            window.gameInstance.audio.playKeyClack();
          }
        }

        coinGroup.position.y = groundFloorY + bounceY;

        // Wobble elástico e amortecimento em direção à face sorteada
        const wobble = Math.sin(landT * Math.PI * 6) * Math.exp(-landT * 4.5) * 0.4;
        coinGroup.rotation.x = targetRotX + wobble;
        coinGroup.rotation.y = targetRotY + wobble * 0.25;
        coinGroup.rotation.z = targetRotZ + wobble * 0.15;

        shadowMesh.scale.set(1.0, 1.0, 1.0);
        shadowMat.opacity = 0.55;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Revelação do Resultado
    setTimeout(() => {
      const won = playerGuess === outcome;
      if (resultBox) {
        resultBox.style.borderColor = won ? 'var(--term-accent)' : 'var(--term-alert)';
        resultBox.style.boxShadow = won ? '0 0 50px rgba(0, 255, 102, 0.6)' : '0 0 50px rgba(255, 51, 68, 0.6)';
      }
      if (statusText) {
        statusText.innerHTML = `
          DEU <strong style="color: #ffd700; font-size: 1.15rem;">${outcome === 'CARA' ? 'CARA (SORRISO)' : 'COROA (COROA)'}</strong>!<br>
          <span style="color: ${won ? '#00ff66' : '#ff3344'}; font-size: 0.95rem; font-weight: 700; letter-spacing: 1px; display: inline-block; margin-top: 4px;">
            ${won ? (customSuccessText || '>> SUCESSO! ESQUIVA COMPLETA (0 DANO) <<') : (customFailText || '>> FALHA! GOLPE NÃO ESQUIVADO <<')}
          </span>
        `;
      }
      if (window.gameInstance && window.gameInstance.audio) {
        if (won) window.gameInstance.audio.playPowerUp();
        else window.gameInstance.audio.playBuzzer();
      }
    }, 2400);

    setTimeout(() => {
      if (animId) cancelAnimationFrame(animId);
      renderer.dispose();
      container.innerHTML = '';
      overlay.classList.add('hidden');
      if (onComplete) onComplete({ won: playerGuess === outcome, outcome });
    }, 4000);
  }
}
