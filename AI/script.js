/* =============================================
   EVOLUTION OF AI — script.js
   ============================================= */

'use strict';

// ── Cursor tracking ──────────────────────────
document.addEventListener('mousemove', e => {
  document.body.style.setProperty('--cx', e.clientX + 'px');
  document.body.style.setProperty('--cy', e.clientY + 'px');
});

// ── Scanlines overlay ───────────────────────
const sl = document.createElement('div');
sl.className = 'scanlines';
document.body.appendChild(sl);

// ── Loading Screen ───────────────────────────
(function initLoader() {
  const bar = document.getElementById('loaderBar');
  const pct = document.getElementById('loaderPct');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 4 + 1;
    if (p >= 100) { p = 100; clearInterval(iv); hideLoader(); }
    bar.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
  }, 60);
  function hideLoader() {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      startIntroAnimations();
    }, 400);
  }
})();

function startIntroAnimations() {
  // hero brain already starts on its own — just ensure hero content is visible
}

// ── Sound Toggle ─────────────────────────────
let soundEnabled = false;
let audioCtx = null;
document.getElementById('soundToggle').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  document.getElementById('soundToggle').classList.toggle('active', soundEnabled);
  if (soundEnabled && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    startAmbientDrone();
  } else if (!soundEnabled && audioCtx) {
    audioCtx.suspend();
  } else if (soundEnabled && audioCtx) {
    audioCtx.resume();
  }
});

function startAmbientDrone() {
  if (!audioCtx) return;
  [55, 110, 165].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.03 / (i + 1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
  });
}

function playClick() {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = 880;
  g.gain.setValueAtTime(0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}

// ── GSAP ScrollTrigger Setup ─────────────────
gsap.registerPlugin(ScrollTrigger);

// ── HERO — Three.js Brain + Particles ────────
(function initHero() {
  const canvas = document.getElementById('heroCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 200);
  camera.position.z = 4;

  // Ambient + point lights
  scene.add(new THREE.AmbientLight(0x0a0a2a, 2));
  const ptBlue = new THREE.PointLight(0x00d4ff, 8, 20);
  ptBlue.position.set(3, 2, 2);
  scene.add(ptBlue);
  const ptPurple = new THREE.PointLight(0xbf5fff, 6, 20);
  ptPurple.position.set(-3, -2, 1);
  scene.add(ptPurple);

  // Holographic brain: layered icosahedra
  const brainGroup = new THREE.Group();
  const matCore = new THREE.MeshPhongMaterial({
    color: 0x001428, wireframe: false,
    emissive: 0x001428, transparent: true, opacity: 0.85
  });
  const matWire = new THREE.MeshBasicMaterial({
    color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.35
  });
  const matWire2 = new THREE.MeshBasicMaterial({
    color: 0xbf5fff, wireframe: true, transparent: true, opacity: 0.2
  });

  const geo1 = new THREE.IcosahedronGeometry(1.1, 3);
  const geo2 = new THREE.IcosahedronGeometry(1.35, 2);
  const geo3 = new THREE.IcosahedronGeometry(1.6, 1);

  brainGroup.add(new THREE.Mesh(geo1, matCore));
  brainGroup.add(new THREE.Mesh(geo1, matWire));
  brainGroup.add(new THREE.Mesh(geo2, matWire2));
  const outerRing = new THREE.Mesh(geo3, new THREE.MeshBasicMaterial({
    color: 0x00ffe5, wireframe: true, transparent: true, opacity: 0.08
  }));
  brainGroup.add(outerRing);
  scene.add(brainGroup);

  // Floating orbs
  const orbGroup = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const r = 0.04 + Math.random() * 0.07;
    const g = new THREE.SphereGeometry(r, 8, 8);
    const m = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x00d4ff : 0xbf5fff,
      transparent: true, opacity: 0.7
    });
    const mesh = new THREE.Mesh(g, m);
    const angle = Math.random() * Math.PI * 2;
    const dist = 1.8 + Math.random() * 0.8;
    mesh.position.set(
      Math.cos(angle) * dist,
      (Math.random() - 0.5) * 2.5,
      Math.sin(angle) * dist
    );
    mesh.userData = { angle, speed: 0.003 + Math.random() * 0.005, dist, phase: Math.random() * Math.PI * 2 };
    orbGroup.add(mesh);
  }
  scene.add(orbGroup);

  // Particle field
  const partCount = 1800;
  const positions = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0x00d4ff, size: 0.04, transparent: true, opacity: 0.5, sizeAttenuation: true
  });
  scene.add(new THREE.Points(partGeo, partMat));

  // Mouse influence
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    brainGroup.rotation.y += 0.003;
    brainGroup.rotation.x += 0.001;
    brainGroup.rotation.x += (my * 0.3 - brainGroup.rotation.x) * 0.02;
    brainGroup.rotation.y += (mx * 0.3 - brainGroup.rotation.y) * 0.02;

    outerRing.rotation.x = t * 0.4;
    outerRing.rotation.z = t * 0.25;

    orbGroup.children.forEach(orb => {
      orb.userData.angle += orb.userData.speed;
      const a = orb.userData.angle;
      const d = orb.userData.dist;
      orb.position.x = Math.cos(a) * d;
      orb.position.z = Math.sin(a) * d;
      orb.position.y += Math.sin(t * 2 + orb.userData.phase) * 0.002;
    });

    ptBlue.position.x = Math.sin(t) * 3;
    ptBlue.position.y = Math.cos(t * 0.7) * 2;
    ptPurple.position.x = Math.cos(t * 1.3) * 3;
    ptPurple.position.y = Math.sin(t * 0.9) * 2;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();

// ── ERA 0: Turing Machine — rotating cogs + scanlines ──
(function initEra0() {
  const canvas = document.getElementById('canvas0');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const W = canvas.parentElement.offsetWidth, H = canvas.parentElement.offsetHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  scene.add(new THREE.AmbientLight(0x112233, 3));
  const pl = new THREE.PointLight(0x00d4ff, 6, 20);
  pl.position.set(2, 2, 2);
  scene.add(pl);

  // Cogs: torus knots as gears
  const cogGroup = new THREE.Group();
  const cogConfigs = [
    { r: 1.2, tube: 0.12, p: 2, q: 3, x: 0, y: 0, z: 0, speed: 0.008 },
    { r: 0.6, tube: 0.08, p: 3, q: 2, x: 1.8, y: 0.5, z: 0.5, speed: -0.015 },
    { r: 0.4, tube: 0.06, p: 2, q: 5, x: -1.5, y: -0.8, z: 0.3, speed: 0.02 },
  ];
  cogConfigs.forEach(c => {
    const geo = new THREE.TorusKnotGeometry(c.r, c.tube, 96, 12, c.p, c.q);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a3a5c, emissive: 0x002244, shininess: 80,
      wireframe: false
    });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    const wire = new THREE.Mesh(geo, wireMat);
    mesh.position.set(c.x, c.y, c.z);
    wire.position.set(c.x, c.y, c.z);
    mesh.userData.speed = c.speed;
    wire.userData.speed = c.speed;
    cogGroup.add(mesh); cogGroup.add(wire);
  });
  scene.add(cogGroup);

  // Grid plane
  const gridHelper = new THREE.GridHelper(10, 20, 0x001122, 0x001122);
  gridHelper.position.y = -2;
  scene.add(gridHelper);

  function animate() {
    requestAnimationFrame(animate);
    cogGroup.children.forEach(m => { m.rotation.x += m.userData.speed || 0; m.rotation.z += (m.userData.speed || 0) * 0.7; });
    cogGroup.rotation.y += 0.002;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nW = canvas.parentElement.offsetWidth, nH = canvas.parentElement.offsetHeight;
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

// ── ERA 1: Terminal + Matrix rain on canvas ───
(function initEra1() {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const cols = Math.floor(canvas.width / 16);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);
  const chars = '01アイウエオカキクケコ∑∆Ωπ∫√∞≠≈'.split('');

  function draw() {
    ctx.fillStyle = 'rgba(3,6,16,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px "Share Tech Mono"';
    for (let i = 0; i < drops.length; i++) {
      const c = chars[Math.floor(Math.random() * chars.length)];
      const intensity = Math.random();
      ctx.fillStyle = intensity > 0.95
        ? `rgba(0,255,230,${0.9})`
        : `rgba(0,212,255,${0.15 + intensity * 0.3})`;
      ctx.fillText(c, i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 50);

  // Terminal typing effect
  const termCmd = document.getElementById('termCmd');
  const cmds = [
    'LOAD EXPERT_SYSTEM.KB',
    'RUN MYCIN.EXE',
    '> DIAGNOSIS: SEPTICEMIA (92%)',
    'CONSULT XCON_V4',
    '> CONFIG: VAX-11/780 COMPLETE',
    'QUERY knowledge_base --depth=3',
  ];
  let ci = 0, ci2 = 0;
  function typeNext() {
    if (!termCmd) return;
    if (ci2 < cmds[ci % cmds.length].length) {
      termCmd.textContent += cmds[ci % cmds.length][ci2];
      ci2++;
      setTimeout(typeNext, 40 + Math.random() * 40);
    } else {
      ci++; ci2 = 0;
      setTimeout(() => { if (termCmd) termCmd.textContent = ''; setTimeout(typeNext, 300); }, 1200);
    }
  }
  setTimeout(typeNext, 2000);
})();

// ── ERA 2: Neural Network Pulse ───────────────
(function initEra2() {
  const canvas = document.getElementById('canvas2');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const W = canvas.parentElement.offsetWidth, H = canvas.parentElement.offsetHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  scene.add(new THREE.AmbientLight(0x0a1020, 4));
  const pl1 = new THREE.PointLight(0x00d4ff, 8, 15);
  pl1.position.set(0, 3, 3);
  scene.add(pl1);
  const pl2 = new THREE.PointLight(0xbf5fff, 6, 15);
  pl2.position.set(0, -3, 2);
  scene.add(pl2);

  // 3D neural network nodes
  const layers = [3, 5, 5, 3];
  const nodesByLayer = [];
  const allNodes = [];
  const nodeGroup = new THREE.Group();
  const lineGroup = new THREE.Group();

  layers.forEach((count, li) => {
    const nodes = [];
    for (let ni = 0; ni < count; ni++) {
      const geo = new THREE.SphereGeometry(0.12, 16, 16);
      const mat = new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x002244, shininess: 100 });
      const mesh = new THREE.Mesh(geo, mat);
      const x = (li - (layers.length - 1) / 2) * 1.6;
      const y = (ni - (count - 1) / 2) * 0.9;
      mesh.position.set(x, y, 0);
      mesh.userData = { li, ni, baseY: y };
      nodeGroup.add(mesh);
      nodes.push(mesh);
      allNodes.push(mesh);
    }
    nodesByLayer.push(nodes);
  });

  // Lines between layers
  for (let li = 0; li < layers.length - 1; li++) {
    nodesByLayer[li].forEach(nA => {
      nodesByLayer[li + 1].forEach(nB => {
        const pts = [nA.position.clone(), nB.position.clone()];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.12 });
        const line = new THREE.Line(lineGeo, lineMat);
        lineGroup.add(line);
      });
    });
  }

  scene.add(lineGroup);
  scene.add(nodeGroup);

  // Pulse animation
  let pulseT = 0;
  function animate() {
    requestAnimationFrame(animate);
    pulseT += 0.015;
    allNodes.forEach(n => {
      const wave = Math.sin(pulseT * 2 - n.userData.li * 1.2 + n.userData.ni * 0.5);
      const intensity = (wave + 1) / 2;
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x001428),
        new THREE.Color(0x00ffe5),
        intensity
      );
      n.material.emissive = color;
      n.scale.setScalar(0.8 + intensity * 0.6);
      n.position.y = n.userData.baseY + Math.sin(pulseT + n.userData.ni) * 0.06;
    });
    nodeGroup.rotation.y = Math.sin(pulseT * 0.3) * 0.3;
    lineGroup.rotation.y = nodeGroup.rotation.y;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nW = canvas.parentElement.offsetWidth, nH = canvas.parentElement.offsetHeight;
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });

  // HTML neural viz
  const l0 = document.getElementById('nvL0');
  const l1 = document.getElementById('nvL1');
  const l2 = document.getElementById('nvL2');
  [l0, l1, l2].forEach((el, i) => {
    const count = [3, 5, 3][i];
    for (let j = 0; j < count; j++) {
      const node = document.createElement('div');
      node.className = 'nv-node';
      el.appendChild(node);
    }
  });
})();

// ── ERA 3: GPT Particle Vortex ────────────────
(function initEra3() {
  const canvas = document.getElementById('canvas3');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const W = canvas.parentElement.offsetWidth, H = canvas.parentElement.offsetHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  scene.add(new THREE.AmbientLight(0x0a0020, 3));
  const pl = new THREE.PointLight(0xbf5fff, 10, 20);
  pl.position.set(0, 0, 3);
  scene.add(pl);

  // Vortex particles
  const N = 3000;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const phases = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 2.5;
    const h = (Math.random() - 0.5) * 4;
    pos[i * 3]     = Math.cos(theta) * r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(theta) * r;
    vel[i * 3]     = theta;
    vel[i * 3 + 1] = r;
    vel[i * 3 + 2] = 0.005 + Math.random() * 0.01;
    phases[i] = Math.random() * Math.PI * 2;
    const c = new THREE.Color().setHSL(0.75 + Math.random() * 0.25, 1, 0.5 + Math.random() * 0.4);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.8 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;
    for (let i = 0; i < N; i++) {
      vel[i * 3] += vel[i * 3 + 2];
      const theta = vel[i * 3];
      const r = vel[i * 3 + 1];
      pos[i * 3]     = Math.cos(theta) * r;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      pos[i * 3 + 1] += Math.sin(t + phases[i]) * 0.003;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.003;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nW = canvas.parentElement.offsetWidth, nH = canvas.parentElement.offsetHeight;
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

// ── ERA 4: Future City Hologram ───────────────
(function initEra4() {
  const canvas = document.getElementById('canvas4');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const W = canvas.parentElement.offsetWidth, H = canvas.parentElement.offsetHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 100);
  camera.position.set(0, 2, 7);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x0a0020, 2));
  const pl1 = new THREE.PointLight(0xbf5fff, 10, 30);
  pl1.position.set(0, 5, 0);
  scene.add(pl1);
  const pl2 = new THREE.PointLight(0x00d4ff, 8, 20);
  pl2.position.set(3, 1, 2);
  scene.add(pl2);

  // City buildings
  const cityGroup = new THREE.Group();
  const buildingDefs = [
    { x: -3, z: -1, w: 0.5, h: 3, d: 0.5 }, { x: -2, z: 0, w: 0.4, h: 4.5, d: 0.4 },
    { x: -1, z: -0.5, w: 0.6, h: 2.5, d: 0.6 }, { x: 0, z: -1.5, w: 0.8, h: 5, d: 0.8 },
    { x: 1, z: -0.3, w: 0.4, h: 3.5, d: 0.4 }, { x: 2, z: 0, w: 0.5, h: 4, d: 0.5 },
    { x: 3, z: -1, w: 0.45, h: 2.8, d: 0.45 }, { x: -1.5, z: 1, w: 0.35, h: 1.8, d: 0.35 },
    { x: 1.5, z: 0.8, w: 0.38, h: 2.2, d: 0.38 },
  ];
  buildingDefs.forEach(b => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x060c20, emissive: 0x010510, transparent: true, opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.h / 2 - 1.5, b.z);
    cityGroup.add(mesh);

    // Wireframe outline
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xbf5fff, wireframe: true, transparent: true, opacity: 0.15 });
    const wire = new THREE.Mesh(geo, wireMat);
    wire.position.copy(mesh.position);
    cityGroup.add(wire);

    // Window lights
    const wCount = Math.floor(b.h * 3);
    for (let w = 0; w < wCount; w++) {
      if (Math.random() > 0.4) {
        const wgeo = new THREE.PlaneGeometry(0.05, 0.05);
        const wmat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0x00d4ff : 0xbf5fff,
          transparent: true, opacity: 0.5 + Math.random() * 0.5
        });
        const wm = new THREE.Mesh(wgeo, wmat);
        wm.position.set(
          b.x + (Math.random() - 0.5) * b.w * 0.8,
          b.h / 2 - 1.5 - b.h / 2 + (Math.random()) * b.h,
          b.z + b.d / 2 + 0.01
        );
        cityGroup.add(wm);
      }
    }
  });

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(16, 12);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x030510, emissive: 0x010210 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  scene.add(ground);

  // Grid on ground
  const grid = new THREE.GridHelper(16, 32, 0x1a0030, 0x0a0020);
  grid.position.y = -1.49;
  scene.add(grid);

  scene.add(cityGroup);

  // Flying holograms (rings)
  const holoGroup = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const geo = new THREE.TorusGeometry(0.1 + Math.random() * 0.15, 0.02, 8, 24);
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00d4ff : 0xbf5fff, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 8, Math.random() * 4 - 1, (Math.random() - 0.5) * 4);
    mesh.userData = { vy: 0.005 + Math.random() * 0.01, phase: Math.random() * Math.PI * 2, startY: mesh.position.y };
    holoGroup.add(mesh);
  }
  scene.add(holoGroup);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    cityGroup.rotation.y = Math.sin(t * 0.2) * 0.1;
    holoGroup.children.forEach(h => {
      h.position.y = h.userData.startY + Math.sin(t + h.userData.phase) * 0.5;
      h.rotation.x += 0.01;
      h.rotation.z += 0.007;
    });
    pl1.position.x = Math.sin(t * 0.5) * 4;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const nW = canvas.parentElement.offsetWidth, nH = canvas.parentElement.offsetHeight;
    camera.aspect = nW / nH; camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

// ── Future Section Canvas ─────────────────────
(function initFutureCanvas() {
  const canvas = document.getElementById('futureCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 200);
  camera.position.z = 5;

  const N = 2000;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xbf5fff, size: 0.05, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(geo, mat));

  // Large torus
  const torusGeo = new THREE.TorusGeometry(2.5, 0.02, 4, 200);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0xbf5fff, transparent: true, opacity: 0.25 });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  scene.add(torus);
  const torus2 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.015, 4, 200),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.15 }));
  torus2.rotation.x = 0.5;
  scene.add(torus2);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;
    torus.rotation.x += 0.003;
    torus.rotation.y += 0.005;
    torus2.rotation.x += 0.002;
    torus2.rotation.z += 0.004;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();

// ── Scroll: Era Visibility + Side Timeline ────
const eraBlocks = document.querySelectorAll('.era-block');
const stlFill = document.getElementById('stlFill');
const stlDots = document.querySelectorAll('.stl-dot');

function onScroll() {
  const scrollY = window.scrollY;
  const docH = document.body.scrollHeight - innerHeight;
  const timelineEl = document.getElementById('timeline');
  const futureEl = document.getElementById('future');

  // Side timeline fill
  if (timelineEl && futureEl) {
    const start = timelineEl.offsetTop;
    const end = futureEl.offsetTop;
    const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
    stlFill.style.height = (progress * 100) + '%';

    // Active dot
    const eraIdx = Math.floor(progress * 5);
    stlDots.forEach((d, i) => d.classList.toggle('active', i <= eraIdx));
  }

  // Reveal era blocks
  eraBlocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    if (rect.top < innerHeight * 0.75) {
      block.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Gen AI cards interaction ──────────────────
document.querySelectorAll('.gen-card').forEach(card => {
  card.addEventListener('mouseenter', () => playClick());
});

// ── Hero CTA click ────────────────────────────
document.querySelector('.hero-cta')?.addEventListener('click', () => playClick());

// ── Smooth scroll for nav links ───────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      playClick();
    }
  });
});

// ── Parallax on hero content ─────────────────
window.addEventListener('scroll', () => {
  const heroContent = document.getElementById('heroContent');
  if (heroContent) {
    const y = window.scrollY;
    heroContent.style.transform = `translateY(${y * 0.35}px)`;
    heroContent.style.opacity = 1 - y / (innerHeight * 0.7);
  }
}, { passive: true });

// ── Navbar background on scroll ───────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.background = window.scrollY > 60 ? 'rgba(3,6,16,0.95)' : 'rgba(3,6,16,0.6)';
}, { passive: true });

// ── Gen AI cards stagger reveal ───────────────
const genCards = document.querySelectorAll('.gen-card');
const genObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      genCards.forEach((c, i) => {
        setTimeout(() => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; }, i * 80);
      });
      genObserver.disconnect();
    }
  });
}, { threshold: 0.2 });
genCards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(20px)'; c.style.transition = 'opacity 0.5s, transform 0.5s'; });
if (document.getElementById('genGrid')) genObserver.observe(document.getElementById('genGrid'));

// ── Era stat counters animate on reveal ───────
function animateCounters(block) {
  block.querySelectorAll('.stat-num').forEach(el => {
    const raw = el.textContent;
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || raw.includes('∞') || raw.includes('ms') || raw.includes('KB')) return;
    let start = 0;
    const suffix = raw.replace(/[0-9.]/g, '');
    const dur = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.floor(eased * num).toLocaleString() + suffix;
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

const blockObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters(entry.target);
      blockObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.era-block').forEach(b => blockObserver.observe(b));

console.log('%c[AI MUSEUM] Neural pathways initialized.', 'color: #00d4ff; font-family: monospace; font-size: 14px;');