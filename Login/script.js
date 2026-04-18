/* ============================================================
   NEXUS AUTH — script.js
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   1. PARTICLE / CANVAS BACKGROUND
   ────────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H, particles = [], lines = [];

  const isDark = () => document.body.getAttribute('data-theme') !== 'light';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.6 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.5 + 0.15);
      this.life = Math.random();
      this.maxLife = 0.6 + Math.random() * 0.4;
      this.hue = Math.random() < 0.55 ? 195 : 275; // cyan or purple
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life += 0.003;
      if (this.y < -10 || this.life > this.maxLife) this.reset();
    }
    draw() {
      const progress = this.life / this.maxLife;
      const alpha    = isDark()
        ? Math.sin(progress * Math.PI) * 0.55
        : Math.sin(progress * Math.PI) * 0.2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${alpha})`;
      ctx.fill();
    }
  }

  // Connection lines between nearby particles
  function drawConnections() {
    const maxDist = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) {
          const a = isDark()
            ? (1 - d / maxDist) * 0.08
            : (1 - d / maxDist) * 0.04;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 200, 255, ${a})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function buildParticles(n = 90) {
    particles = Array.from({ length: n }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  buildParticles();
  loop();
  window.addEventListener('resize', () => { resize(); buildParticles(); });
})();


/* ──────────────────────────────────────────────
   2. 3D TILT ON MOUSE MOVE
   ────────────────────────────────────────────── */
(function initTilt() {
  const card = document.getElementById('authCard');
  let rafId   = null;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  const STRENGTH = 10;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateTilt() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);
    card.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
    if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
      rafId = requestAnimationFrame(animateTilt);
    } else {
      rafId = null;
    }
  }

  window.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    targetX    = ((e.clientX - cx) / (window.innerWidth / 2))  * STRENGTH;
    targetY    = -((e.clientY - cy) / (window.innerHeight / 2)) * STRENGTH;
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  });

  window.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  });

  // Touch support
  window.addEventListener('touchmove', (e) => {
    if (!e.touches[0]) return;
    const t    = e.touches[0];
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    targetX    = ((t.clientX - cx) / (window.innerWidth / 2))  * (STRENGTH * 0.5);
    targetY    = -((t.clientY - cy) / (window.innerHeight / 2)) * (STRENGTH * 0.5);
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    targetX = 0; targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  });
})();


/* ──────────────────────────────────────────────
   3. TAB SWITCHER
   ────────────────────────────────────────────── */
(function initTabs() {
  const tabs      = document.querySelectorAll('.tab-btn');
  const indicator = document.querySelector('.tab-indicator');
  const panels    = { login: document.getElementById('loginPanel'), register: document.getElementById('registerPanel') };
  let current     = 'login';

  function switchTab(tab) {
    if (tab === current) return;
    const leaving = panels[current];
    const entering = panels[tab];

    leaving.classList.add('exiting');
    leaving.classList.remove('active');

    setTimeout(() => {
      leaving.classList.remove('exiting');
      entering.classList.add('active');
    }, 400);

    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    indicator.classList.toggle('right', tab === 'register');
    current = tab;
  }

  tabs.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
})();


/* ──────────────────────────────────────────────
   4. PASSWORD SHOW/HIDE
   ────────────────────────────────────────────── */
document.querySelectorAll('.eye-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const open  = btn.querySelector('.eye-open');
    const closed = btn.querySelector('.eye-closed');
    if (input.type === 'password') {
      input.type  = 'text';
      open.style.display  = 'none';
      closed.style.display = '';
    } else {
      input.type  = 'password';
      open.style.display  = '';
      closed.style.display = 'none';
    }
  });
});


/* ──────────────────────────────────────────────
   5. PASSWORD STRENGTH METER
   ────────────────────────────────────────────── */
(function initStrength() {
  const input = document.getElementById('regPassword');
  const bar   = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');
  if (!input) return;

  const levels = [
    { color: '#ff4f6d', label: 'Weak',   w: '25%'  },
    { color: '#ffb547', label: 'Fair',   w: '50%'  },
    { color: '#00d4ff', label: 'Good',   w: '75%'  },
    { color: '#06ffa5', label: 'Strong', w: '100%' },
  ];

  function score(pw) {
    let s = 0;
    if (pw.length >= 8)  s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw))    s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.max(0, s - 1);
  }

  input.addEventListener('input', () => {
    const pw = input.value;
    if (!pw) { bar.style.width = '0'; label.textContent = ''; return; }
    const lvl = levels[score(pw)];
    bar.style.width      = lvl.w;
    bar.style.background = lvl.color;
    label.textContent    = lvl.label;
    label.style.color    = lvl.color;
  });
})();


/* ──────────────────────────────────────────────
   6. TOAST NOTIFICATIONS
   ────────────────────────────────────────────── */
function showToast(msg, type = 'info', duration = 3200) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✦',
    error:   '✕',
    info:    '◈'
  };

  toast.innerHTML = `<span>${icons[type] || '·'}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}


/* ──────────────────────────────────────────────
   7. FORM VALIDATION HELPERS
   ────────────────────────────────────────────── */
function setValid(input)   { input.classList.remove('invalid'); input.classList.add('valid'); }
function setInvalid(input) { input.classList.remove('valid'); input.classList.add('invalid'); }
function clearState(input) { input.classList.remove('valid', 'invalid'); }

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function shakeForm(formEl) {
  formEl.classList.remove('shake');
  void formEl.offsetWidth;
  formEl.classList.add('shake');
  setTimeout(() => formEl.classList.remove('shake'), 500);
}

function setLoading(btn, loading) {
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  const arrow  = btn.querySelector('.btn-arrow');
  btn.disabled = loading;
  text.style.display   = loading ? 'none' : '';
  loader.style.display = loading ? '' : 'none';
  arrow.style.display  = loading ? 'none' : '';
}


/* ──────────────────────────────────────────────
   8. LOGIN FORM SUBMISSION
   ────────────────────────────────────────────── */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const emailIn = document.getElementById('loginEmail');
  const passIn  = document.getElementById('loginPassword');
  const btn     = document.getElementById('loginSubmit');

  let valid = true;

  if (!validateEmail(emailIn.value.trim())) {
    setInvalid(emailIn);
    valid = false;
  } else {
    setValid(emailIn);
  }

  if (passIn.value.length < 6) {
    setInvalid(passIn);
    valid = false;
  } else {
    setValid(passIn);
  }

  if (!valid) {
    shakeForm(this);
    showToast('Please check your credentials', 'error');
    return;
  }

  setLoading(btn, true);
  // Simulate async auth
  await new Promise(r => setTimeout(r, 1800));
  setLoading(btn, false);

  // Simulate success
  showToast('Welcome back! Redirecting…', 'success');
  clearState(emailIn);
  clearState(passIn);
  this.reset();
});


/* ──────────────────────────────────────────────
   9. REGISTER FORM SUBMISSION
   ────────────────────────────────────────────── */
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const nameIn    = document.getElementById('regName');
  const emailIn   = document.getElementById('regEmail');
  const passIn    = document.getElementById('regPassword');
  const confirmIn = document.getElementById('regConfirm');
  const termsIn   = document.getElementById('termsCheck');
  const btn       = document.getElementById('registerSubmit');

  let valid = true;

  if (nameIn.value.trim().length < 2) { setInvalid(nameIn); valid = false; }
  else setValid(nameIn);

  if (!validateEmail(emailIn.value.trim())) { setInvalid(emailIn); valid = false; }
  else setValid(emailIn);

  if (passIn.value.length < 8) { setInvalid(passIn); valid = false; }
  else setValid(passIn);

  if (confirmIn.value !== passIn.value || !confirmIn.value) { setInvalid(confirmIn); valid = false; }
  else setValid(confirmIn);

  if (!termsIn.checked) {
    showToast('Please accept the Terms of Service', 'error');
    valid = false;
  }

  if (!valid) {
    shakeForm(this);
    if (termsIn.checked) showToast('Please fix the highlighted fields', 'error');
    return;
  }

  setLoading(btn, true);
  await new Promise(r => setTimeout(r, 2000));
  setLoading(btn, false);

  showToast('Account created! Welcome to NEXUS ✦', 'success', 4000);
  [nameIn, emailIn, passIn, confirmIn].forEach(clearState);
  this.reset();
  // Reset strength bar
  document.getElementById('strengthBar').style.width = '0';
  document.getElementById('strengthLabel').textContent = '';
});


/* ──────────────────────────────────────────────
   10. SOCIAL BUTTON PLACEHOLDERS
   ────────────────────────────────────────────── */
document.getElementById('googleBtn')?.addEventListener('click', () => {
  showToast('Google OAuth — coming soon', 'info');
});
document.getElementById('githubBtn')?.addEventListener('click', () => {
  showToast('GitHub OAuth — coming soon', 'info');
});


/* ──────────────────────────────────────────────
   11. THEME TOGGLE
   ────────────────────────────────────────────── */
(function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const body = document.body;

  // Persist theme
  const saved = localStorage.getItem('nexus-theme') || 'dark';
  body.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem('nexus-theme', next);
  });
})();


/* ──────────────────────────────────────────────
   12. LIVE INPUT VALIDATION
   ────────────────────────────────────────────── */
(function initLiveValidation() {
  // Login Email
  const lEmail = document.getElementById('loginEmail');
  lEmail?.addEventListener('blur', () => {
    if (lEmail.value) {
      validateEmail(lEmail.value.trim()) ? setValid(lEmail) : setInvalid(lEmail);
    } else clearState(lEmail);
  });
  lEmail?.addEventListener('input', () => {
    if (lEmail.classList.contains('invalid') && validateEmail(lEmail.value.trim())) setValid(lEmail);
  });

  // Reg Name
  const rName = document.getElementById('regName');
  rName?.addEventListener('blur', () => {
    if (rName.value) { rName.value.trim().length >= 2 ? setValid(rName) : setInvalid(rName); }
    else clearState(rName);
  });

  // Reg Email
  const rEmail = document.getElementById('regEmail');
  rEmail?.addEventListener('blur', () => {
    if (rEmail.value) { validateEmail(rEmail.value.trim()) ? setValid(rEmail) : setInvalid(rEmail); }
    else clearState(rEmail);
  });
  rEmail?.addEventListener('input', () => {
    if (rEmail.classList.contains('invalid') && validateEmail(rEmail.value.trim())) setValid(rEmail);
  });

  // Reg Confirm
  const rPass    = document.getElementById('regPassword');
  const rConfirm = document.getElementById('regConfirm');
  rConfirm?.addEventListener('input', () => {
    if (!rConfirm.value) { clearState(rConfirm); return; }
    rConfirm.value === rPass?.value ? setValid(rConfirm) : setInvalid(rConfirm);
  });
})();


/* ──────────────────────────────────────────────
   13. CARD FLOATING GLOW FOLLOW CURSOR
   ────────────────────────────────────────────── */
(function initGlowFollow() {
  const card = document.getElementById('authCard');
  const inner = card.querySelector('.card-inner');

  inner.addEventListener('mousemove', (e) => {
    const rect = inner.getBoundingClientRect();
    const x    = ((e.clientX - rect.left) / rect.width)  * 100;
    const y    = ((e.clientY - rect.top)  / rect.height) * 100;
    inner.style.setProperty('--mx', `${x}%`);
    inner.style.setProperty('--my', `${y}%`);
    inner.style.background = `
      radial-gradient(
        200px circle at ${x}% ${y}%,
        rgba(0,212,255,0.06) 0%,
        transparent 70%
      ),
      var(--surface)
    `;
  });

  inner.addEventListener('mouseleave', () => {
    inner.style.background = 'var(--surface)';
  });
})();


/* ──────────────────────────────────────────────
   14. PAGE LOAD ENTRANCE
   ────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    showToast('Secure session initialised ◈', 'info', 2800);
  }, 900);
});