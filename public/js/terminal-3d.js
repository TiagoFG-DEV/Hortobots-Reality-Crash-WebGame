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

    if (titleEl) titleEl.innerText = `[ ANDAR ${targetFloorNum}: ${targetFloorName.toUpperCase()} ]`;
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
  // 2. HOLOGRAMA 3D DO NÚCLEO MONOLÍTICO NO HUB (ELEVADOR)
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

    // Normaliza para o número real do andar (1 a 8)
    // Encontros/duelos intermediários (ex: 2.5, 4.5, 6.5) pertencem ao andar base e não avançam o indicador da torre
    let currentFloorNum = 1;
    if (typeof currentFloorVal === 'number') {
      currentFloorNum = Math.min(8, Math.max(1, Math.floor(currentFloorVal)));
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();

    // 1. Cilindro Poligonal Alto da Torre (12 Lados, Altura 7.8, Wireframe Cibernético)
    const towerGeo = new THREE.CylinderGeometry(1.4, 1.6, 7.8, 12, 10, true);
    const towerMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    group.add(towerMesh);

    // 2. Coluna Central de Laser / Núcleo
    const coreLaserGeo = new THREE.CylinderGeometry(0.18, 0.18, 8.4, 8);
    const coreLaserMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.75
    });
    const coreLaser = new THREE.Mesh(coreLaserGeo, coreLaserMat);
    group.add(coreLaser);

    // 3. Espiral Única Envolvendo a Torre (Hélice Contínua Subindo)
    const spiralPoints = [];
    const totalSteps = 90;
    for (let i = 0; i <= totalSteps; i++) {
      const progress = i / totalSteps;
      const y = -3.6 + progress * 7.2;
      const angle = progress * Math.PI * 4; // 2 voltas ao redor do cilindro
      const r = 2.0;
      spiralPoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const spiralGeo = new THREE.TubeGeometry(spiralCurve, 70, 0.06, 8, false);
    const spiralMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.8
    });
    const spiralMesh = new THREE.Mesh(spiralGeo, spiralMat);
    group.add(spiralMesh);

    // 4. 8 Quadrados / Cubos Representando os 8 Andares da Torre
    let currentFloorCubeMat = null;

    for (let f = 1; f <= 8; f++) {
      const progress = (f - 0.5) / 8;
      const y = -3.6 + progress * 7.2;
      const angle = progress * Math.PI * 4;
      const r = 2.0;

      // Andares anteriores são verdes (concluídos)
      const isCleared = f < currentFloorNum || (f === 8 && clearedFloorsSet.has(8));
      // Andar atual é amarelo pulsante
      const isCurrent = f === currentFloorNum && !clearedFloorsSet.has(8);

      const cubeGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      let cubeMat;

      if (isCurrent) {
        cubeMat = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.95
        });
        currentFloorCubeMat = cubeMat;
      } else if (isCleared) {
        cubeMat = new THREE.MeshBasicMaterial({
          color: 0x00ff66,
          transparent: true,
          opacity: 0.9
        });
      } else {
        cubeMat = new THREE.MeshBasicMaterial({
          color: 0xff3344,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
      }

      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      cubeMesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      group.add(cubeMesh);
    }


    scene.add(group);

    // 5. Animação de Rotação em EIXO ÚNICO HORIZONTAL (Y)
    const animate = () => {
      this.coreAnimId = requestAnimationFrame(animate);

      // Rotação horizontal contínua em sentido único
      group.rotation.y += 0.012;

      // Pulso / Piscar do quadrado do andar atual
      if (currentFloorCubeMat) {
        const pulse = 0.35 + 0.65 * Math.abs(Math.sin(Date.now() * 0.006));
        currentFloorCubeMat.opacity = pulse;
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
  // 3. CINEMÁTICA 3D PROCEDURAL DA MOEDA DA SORTE (POLÍGONO 20 LADOS COM FÍSICA)
  // =========================================================================
  run3DCoinFlipCinematic(playerGuess, outcome, onComplete) {
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
          statusText.innerHTML = `DEU <strong>${outcome}</strong>!<br><span style="color:${won ? '#00ff66' : '#ff3344'}; font-size: 1.4rem;">${won ? '>> ESQUIVA COMPLETA (0 DANO) <<' : '>> GOLPE RECEBIDO <<'}</span>`;
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
            ${won ? '>> SUCESSO! ESQUIVA COMPLETA (0 DANO) <<' : '>> FALHA! GOLPE NÃO ESQUIVADO <<'}
          </span>
        `;
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
