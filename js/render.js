// === ОТРИСОВКА ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let _groundPattern = null;
let _groundPatternKey = '';

let _elephantSprite = null;
let _elephantSpriteKey = '';
let _fruitSprite = null;
let _fruitSpriteKey = '';

let _poopSprite = null;
let _poopSpriteKey = '';
let _mahoutSprite = null;
let _mahoutSpriteKey = '';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrapAngleRad(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function updateCameraFollow(dtMs) {
  return;
}

function project(x, y, z = 0) {
  return { sx: x, sy: y, scale: 1, depth: 0 };
}

function getFogAlpha(depth) {
  const cam = state.camera;
  const a = (depth - cam.fogNear) / Math.max(1, cam.fogFar - cam.fogNear);
  return clamp01(a);
}

function ensureGroundPattern() {
  const key = 'snow_v1';
  if (_groundPattern && _groundPatternKey === key) return;

  const p = document.createElement('canvas');
  p.width = 128;
  p.height = 128;
  const g = p.getContext('2d');

  g.fillStyle = 'rgba(255,255,255,0.04)';
  g.fillRect(0, 0, p.width, p.height);

  // Лёгкие морозные штрихи
  g.strokeStyle = 'rgba(255,255,255,0.10)';
  g.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const x0 = Math.random() * 128;
    const y0 = Math.random() * 128;
    const x1 = x0 + (Math.random() * 2 - 1) * 44;
    const y1 = y0 + (Math.random() * 2 - 1) * 44;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }

  // Зерно-снег
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const a = 0.05 + Math.random() * 0.12;
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.fillRect(x, y, 1, 1);
  }

  _groundPattern = ctx.createPattern(p, 'repeat');
  _groundPatternKey = key;
}

function ensureElephantSprite() {
  const skin = (state && state.currentSkin) ? state.currentSkin : 'default';
  const key = `elephant_v2_${skin}`;
  if (_elephantSprite && _elephantSpriteKey === key) return;

  const s = 96;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.clearRect(0, 0, s, s);
  g.translate(s / 2, s / 2);

  // Тень-градиент внутри спрайта (сам слон будет отрисован поверх)
  const bodyGrad = g.createRadialGradient(0, -6, 6, 0, -6, 44);
  bodyGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
  bodyGrad.addColorStop(1, 'rgba(0,0,0,0.10)');

  // Тело
  g.fillStyle = 'rgba(190, 220, 255, 0.92)';
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(0, 4, 30, 36, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // Блик
  g.fillStyle = bodyGrad;
  g.beginPath();
  g.ellipse(0, -2, 26, 30, 0, 0, Math.PI * 2);
  g.fill();

  // Уши
  g.fillStyle = 'rgba(200, 235, 255, 0.92)';
  g.strokeStyle = 'rgba(255,255,255,0.50)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(-30, -2, 16, 20, -0.2, 0, Math.PI * 2);
  g.ellipse(30, -2, 16, 20, 0.2, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // Хобот (направление "вперёд" вверх по экрану)
  g.fillStyle = 'rgba(175, 210, 245, 0.96)';
  g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.lineWidth = 1.5;
  if (typeof g.roundRect === 'function') {
    g.beginPath();
    g.roundRect(-7, -42, 14, 24, 8);
    g.fill();
    g.stroke();
  } else {
    g.beginPath();
    g.rect(-7, -42, 14, 24);
    g.fill();
    g.stroke();
  }

  // Кончик хобота
  g.fillStyle = 'rgba(235, 248, 255, 0.9)';
  g.beginPath();
  g.ellipse(0, -42, 8, 7, 0, 0, Math.PI * 2);
  g.fill();

  // Глазки
  g.fillStyle = 'rgba(10,22,36,0.8)';
  g.beginPath();
  g.ellipse(-10, -10, 2.2, 3.0, 0, 0, Math.PI * 2);
  g.ellipse(10, -10, 2.2, 3.0, 0, 0, Math.PI * 2);
  g.fill();

  if (skin === 'engineer') {
    g.fillStyle = 'rgba(255, 215, 90, 0.95)';
    g.strokeStyle = 'rgba(120, 80, 30, 0.55)';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(0, -28, 16, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();

    g.fillStyle = 'rgba(255, 200, 70, 0.98)';
    g.strokeStyle = 'rgba(120, 80, 30, 0.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect?.(-12, -23, 24, 9, 6);
    if (typeof g.roundRect !== 'function') {
      g.rect(-12, -23, 24, 9);
    }
    g.fill();
    g.stroke();

    g.fillStyle = 'rgba(255, 195, 60, 0.95)';
    g.beginPath();
    g.roundRect?.(-18, -18, 36, 5, 6);
    if (typeof g.roundRect !== 'function') {
      g.rect(-18, -18, 36, 5);
    }
    g.fill();
  }

  if (skin === 'circus') {
    g.fillStyle = 'rgba(215, 55, 65, 0.92)';
    g.strokeStyle = 'rgba(255, 215, 120, 0.78)';
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect?.(-24, 2, 48, 22, 10);
    if (typeof g.roundRect !== 'function') {
      g.rect(-24, 2, 48, 22);
    }
    g.fill();
    g.stroke();
  }

  _elephantSprite = c;
  _elephantSpriteKey = key;
}

function ensureFruitSprite() {
  const key = 'fruit_v1';
  if (_fruitSprite && _fruitSpriteKey === key) return;

  const s = 72;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.clearRect(0, 0, s, s);
  g.translate(s / 2, s / 2);

  // Яблоко
  const grad = g.createRadialGradient(-10, -12, 6, 0, 0, 30);
  grad.addColorStop(0, 'rgba(255, 210, 210, 1)');
  grad.addColorStop(0.35, 'rgba(255, 90, 90, 1)');
  grad.addColorStop(1, 'rgba(160, 20, 30, 1)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(0, 6, 22, 24, 0, 0, Math.PI * 2);
  g.fill();

  // Блик
  g.fillStyle = 'rgba(255,255,255,0.28)';
  g.beginPath();
  g.ellipse(-9, -2, 6, 10, 0.2, 0, Math.PI * 2);
  g.fill();

  // Листик
  g.fillStyle = 'rgba(80, 220, 160, 0.95)';
  g.beginPath();
  g.ellipse(10, -18, 10, 6, -0.6, 0, Math.PI * 2);
  g.fill();

  // Черенок
  g.strokeStyle = 'rgba(120, 80, 40, 0.9)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -18);
  g.lineTo(-2, -28);
  g.stroke();

  _fruitSprite = c;
  _fruitSpriteKey = key;
}

function ensurePoopSprite() {
  const key = 'poop_v1';
  if (_poopSprite && _poopSpriteKey === key) return;

  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.clearRect(0, 0, s, s);
  g.translate(s / 2, s / 2);

  const baseGrad = g.createRadialGradient(-10, -14, 6, 0, 0, 34);
  baseGrad.addColorStop(0, 'rgba(255, 230, 200, 0.55)');
  baseGrad.addColorStop(0.35, 'rgba(140, 85, 45, 1)');
  baseGrad.addColorStop(1, 'rgba(70, 40, 18, 1)');

  g.fillStyle = baseGrad;
  g.beginPath();
  g.ellipse(0, 8, 18, 16, 0, 0, Math.PI * 2);
  g.fill();

  g.beginPath();
  g.ellipse(0, -2, 14, 12, 0, 0, Math.PI * 2);
  g.fill();

  g.beginPath();
  g.ellipse(0, -12, 10, 9, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.beginPath();
  g.ellipse(-7, -10, 4, 5, 0.2, 0, Math.PI * 2);
  g.fill();

  _poopSprite = c;
  _poopSpriteKey = key;
}

function ensureMahoutSprite() {
  const key = 'mahout_v1';
  if (_mahoutSprite && _mahoutSpriteKey === key) return;

  const s = 80;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');

  g.clearRect(0, 0, s, s);
  g.translate(s / 2, s / 2);

  // Голова
  g.fillStyle = 'rgba(255, 224, 190, 0.95)';
  g.beginPath();
  g.ellipse(0, -18, 9, 10, 0, 0, Math.PI * 2);
  g.fill();

  // Тело
  const shirtGrad = g.createLinearGradient(0, -10, 0, 26);
  shirtGrad.addColorStop(0, 'rgba(90, 210, 255, 0.95)');
  shirtGrad.addColorStop(1, 'rgba(20, 120, 190, 0.95)');
  g.fillStyle = shirtGrad;
  g.beginPath();
  g.roundRect?.(-12, -10, 24, 30, 8);
  if (typeof g.roundRect !== 'function') {
    g.rect(-12, -10, 24, 30);
  }
  g.fill();

  // Ноги (бег)
  g.strokeStyle = 'rgba(10,22,36,0.85)';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-6, 18);
  g.lineTo(-12, 30);
  g.moveTo(6, 18);
  g.lineTo(12, 30);
  g.stroke();

  // Руки
  g.lineWidth = 3.5;
  g.beginPath();
  g.moveTo(-10, -4);
  g.lineTo(-22, 8);
  g.moveTo(10, -4);
  g.lineTo(22, 8);
  g.stroke();

  // Шапка
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.beginPath();
  g.ellipse(0, -28, 10, 6, 0, 0, Math.PI * 2);
  g.fill();

  _mahoutSprite = c;
  _mahoutSpriteKey = key;
}

function drawShadowAt(x, y, depth, baseRadiusPx) {
  const p = project(x, y, 0);
  const fogA = getFogAlpha(depth);
  const a = (1 - fogA) * 0.18;
  if (a <= 0.01) return;

  const r = baseRadiusPx * p.scale;
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.beginPath();
  ctx.ellipse(p.sx, p.sy, r * 1.2, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function buildCaravanPoints() {
  // Простая пространственная интерполяция вдоль полилинии змейки
  const pts = [];
  if (!state.snake || state.snake.length === 0) return pts;

  const h = state.snake[0];
  pts.push({ x: h.x + CONFIG.GRID / 2, y: h.y + CONFIG.GRID / 2, segIndex: 0 });

  const stepDist = CONFIG.GRID * 0.60;
  for (let i = 0; i < state.snake.length - 1; i++) {
    const a = state.snake[i];
    const b = state.snake[i + 1];
    const ax = a.x + CONFIG.GRID / 2;
    const ay = a.y + CONFIG.GRID / 2;
    const bx = b.x + CONFIG.GRID / 2;
    const by = b.y + CONFIG.GRID / 2;

    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const n = Math.max(1, Math.floor(dist / stepDist));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      if (i === 0 && k === 0) continue;
      pts.push({
        x: ax + dx * t,
        y: ay + dy * t,
        segIndex: i + t
      });
    }
  }
  return pts;
}

function drawWorldEntities3D() {
  return;
}

function drawGround3D() {
  return;
}

function ensureBackgroundSnow() {
  const nearOk = state.bgSnowNear && state.bgSnowNear.length > 0;
  const farOk = state.bgSnowFar && state.bgSnowFar.length > 0;
  if (nearOk && farOk) return;

  state.bgSnowNear = [];
  state.bgSnowFar = [];

  // Near layer: крупнее и быстрее
  const nearCount = 9;
  for (let i = 0; i < nearCount; i++) {
    state.bgSnowNear.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1.4 + Math.random() * 2.2,
      vy: 18 + Math.random() * 34,
      vx: (Math.random() * 2 - 1) * 6,
      a: 0.10 + Math.random() * 0.10
    });
  }

  // Far layer: мельче и медленнее, более прозрачный
  const farCount = 11;
  for (let i = 0; i < farCount; i++) {
    state.bgSnowFar.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.6 + Math.random() * 1.1,
      vy: 8 + Math.random() * 16,
      vx: (Math.random() * 2 - 1) * 3,
      a: 0.05 + Math.random() * 0.07
    });
  }
}

function updateBackgroundSnow(dtMs) {
  ensureBackgroundSnow();
  const dt = dtMs / 1000;

  const updateLayer = (arr) => {
    for (const s of arr) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.y > canvas.height + 6) {
        s.y = -6;
        s.x = Math.random() * canvas.width;
      }
      if (s.x < -6) s.x = canvas.width + 6;
      if (s.x > canvas.width + 6) s.x = -6;
    }
  };

  updateLayer(state.bgSnowFar);
  updateLayer(state.bgSnowNear);
}

function drawBackgroundSnow() {
  ensureBackgroundSnow();

  const drawLayer = (arr) => {
    for (const s of arr) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  ctx.save();
  drawLayer(state.bgSnowFar);
  drawLayer(state.bgSnowNear);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSnowflakeParticle(p) {
  ctx.save();
  ctx.globalAlpha = p.a;
  ctx.fillStyle = p.color;

  const r = p.r;
  const x = p.x;
  const y = p.y;

  // Ромбик
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();

  // Лёгкий "крестик" поверх
  ctx.globalAlpha = p.a * 0.55;
  ctx.fillRect(x - r * 0.15, y - r * 1.2, r * 0.3, r * 2.4);
  ctx.fillRect(x - r * 1.2, y - r * 0.15, r * 2.4, r * 0.3);

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawParticles() {
  if (!state.particles || state.particles.length === 0) return;

  ctx.save();
  for (const p of state.particles) {
    drawSnowflakeParticle(p);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFloatTexts() {
  if (!state.floatTexts || state.floatTexts.length === 0) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px system-ui, -apple-system, Segoe UI, Roboto, Arial';

  for (const t of state.floatTexts) {
    ctx.globalAlpha = t.a;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function renderFrame() {
  clearCanvas();
  drawBackgroundSnow();
  drawObstacles();
  drawManure();
  drawShovel();
  drawFood();
  drawSnake();
  drawParticles();
  drawFloatTexts();
  drawStatusEffectsUI();
  drawFog();
}

function drawManure() {
  if (!state.poops || state.poops.length === 0) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';

  for (const p of state.poops) {
    const cx = p.x + CONFIG.GRID / 2;
    const cy = p.y + CONFIG.GRID / 2 + 1;

    // лёгкая тень, чтобы было видно на тёмном фоне
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillText('💩', cx, cy);
  }

  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawShovel() {
  if (!state.shovel) return;

  const cx = state.shovel.x + CONFIG.GRID / 2;
  const cy = state.shovel.y + CONFIG.GRID / 2 + 1;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillText('🪏', cx, cy);
  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawStatusEffectsUI() {
  if (!state.snake || state.snake.length === 0) return;

  const head = state.snake[0];
  const hx = head.x + CONFIG.GRID / 2;
  const hy = head.y + CONFIG.GRID / 2;

  // Debuff: slow (синяя аура + progress bar)
  if (state.slowDurationMs > 0 && state.slowTimeMs > 0) {
    const t = Math.max(0, Math.min(1, state.slowTimeMs / state.slowDurationMs));

    // aura
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.10 * Math.sin((state.nowMs || Date.now()) * 0.02);
    ctx.strokeStyle = 'rgba(90, 170, 255, 1)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(90, 170, 255, 0.9)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(hx, hy, CONFIG.GRID * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // icon + bar
    const barW = 44;
    const barH = 6;
    const bx = hx - barW / 2;
    const by = hy - CONFIG.GRID * 0.95;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillText('🐾↓', bx - 18, by + barH / 2);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = 'rgba(10,22,36,0.55)';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(90, 170, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(0, barW * t), barH, 4);
    ctx.fill();
    ctx.restore();
  }

  // Buff: shovel active indicator in corner
  if (state.shovelBuffDurationMs > 0 && state.shovelBuffTimeMs > 0) {
    const t = Math.max(0, Math.min(1, state.shovelBuffTimeMs / state.shovelBuffDurationMs));
    const x = 12;
    const y = canvas.height - 18;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText('🪏', x, y);

    // mini bar under icon
    const barW = 42;
    const barH = 5;
    const bx = x + 22;
    const by = y + 7;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'rgba(10,22,36,0.55)';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 255, 170, 0.95)';
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(0, barW * t), barH, 4);
    ctx.fill();

    ctx.restore();
  }
}

function clearCanvas() {
  const level = state.currentLevelConfig;
  
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, level.visuals.bgTop);
  gradient.addColorStop(1, level.visuals.bgBottom);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  const baseSize = CONFIG.GRID - 2;
  const radius = 6;

  // Мягкая зелёная пульсация ("переваривание")
  if (state.digestGlowMs > 0 && state.snake && state.snake.length > 0) {
    const head = state.snake[0];
    const t = state.nowMs || Date.now();
    const p = Math.max(0, Math.min(1, state.digestGlowMs / 900));
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.02);
    const a = 0.14 * p * pulse;
    const cx = head.x + CONFIG.GRID / 2;
    const cy = head.y + CONFIG.GRID / 2;
    const r = CONFIG.GRID * (1.1 + 0.25 * (1 - p));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(80, 255, 160, 1)';
    ctx.shadowColor = 'rgba(80, 255, 160, 0.8)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // лёгкая тень под всей змейкой (без фильтров)
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  const shadowOffsetX = 2;
  const shadowOffsetY = 3;
  for (let i = 0; i < state.snake.length; i++) {
    const part = state.snake[i];
    const isHead = i === 0;

    let headScale = 1;
    if (isHead && state.headPopDurationMs > 0 && state.headPopTimeMs > 0) {
      const p = 1 - (state.headPopTimeMs / state.headPopDurationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      headScale = 1.3 - 0.3 * eased;
    }

    // Tail taper: последний сегмент примерно в 2 раза меньше головы
    const tailT = state.snake.length <= 1 ? 0 : (i / (state.snake.length - 1));
    const tailScale = 1 - 0.45 * tailT;

    const size = isHead ? baseSize * 1.12 * headScale : baseSize * tailScale;
    const cx = part.x + baseSize / 2;
    const cy = part.y + baseSize / 2;
    const x = cx - size / 2 + shadowOffsetX;
    const y = cy - size / 2 + shadowOffsetY;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();
  }
  ctx.restore();

  state.snake.forEach((part, index) => {
    const isHead = index === 0;
    const color = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;

    // Head scale-pop: 1.3 -> 1.0 за 200мс
    let scale = 1;
    if (isHead && state.headPopDurationMs > 0 && state.headPopTimeMs > 0) {
      const p = 1 - (state.headPopTimeMs / state.headPopDurationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      scale = 1.3 - 0.3 * eased;
    }
    if (isHead && state.headPopTimeMs === 0) {
      scale = 1;
    }

    // Tail taper: последний сегмент примерно в 2 раза меньше головы
    const tailT = state.snake.length <= 1 ? 0 : (index / (state.snake.length - 1));
    const tailScale = isHead ? 1 : (1 - 0.45 * tailT);

    const size = isHead ? baseSize * 1.12 * scale : baseSize * tailScale;
    const cx = part.x + baseSize / 2;
    const cy = part.y + baseSize / 2;
    const x = cx - size / 2;
    const y = cy - size / 2;

    // Тень/сияние
    if (state.currentLevelConfig.visuals.auroraEffect && isHead) {
      const hue = (state.nowMs * 0.05) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();

    // Блик/объём на голове
    if (isHead) {
      const hl = ctx.createLinearGradient(x, y, x, y + size);
      hl.addColorStop(0, 'rgba(255,255,255,0.32)');
      hl.addColorStop(0.55, 'rgba(255,255,255,0.04)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.roundRect(x + size * 0.12, y + size * 0.08, size * 0.76, size * 0.40, radius);
      ctx.fill();
    }

    // Глаза (только голова)
    if (isHead) {
      const dirX = Math.sign(state.dx);
      const dirY = Math.sign(state.dy);

      // Перпендикуляр для разведения глаз
      const px = -dirY;
      const py = dirX;

      const look = size * 0.17;
      const sep = size * 0.16;
      const eyeR = Math.max(1.4, size * 0.10);
      const ex = cx + dirX * look;
      const ey = cy + dirY * look;

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Белки
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(ex + px * sep, ey + py * sep, eyeR, 0, Math.PI * 2);
      ctx.arc(ex - px * sep, ey - py * sep, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Зрачки (расширяются вместе с pop)
      let pupilScale = 1;
      if (state.headPopDurationMs > 0 && state.headPopTimeMs > 0) {
        const p2 = 1 - (state.headPopTimeMs / state.headPopDurationMs);
        const eased2 = 1 - Math.pow(1 - p2, 3);
        pupilScale = 1.0 + 0.55 * (1 - eased2);
      }
      const pupilR = eyeR * 0.38 * pupilScale;
      const pupilLook = eyeR * 0.35;

      ctx.fillStyle = 'rgba(10, 22, 36, 0.95)';
      ctx.beginPath();
      ctx.arc(ex + px * sep + dirX * pupilLook, ey + py * sep + dirY * pupilLook, pupilR, 0, Math.PI * 2);
      ctx.arc(ex - px * sep + dirX * pupilLook, ey - py * sep + dirY * pupilLook, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Сброс эффектов
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  });
}

function drawFood() {
  const color = state.foodType === 'bonus' ? COLORS.BONUS_FOOD : '#ff2a3a';

  const t = state.nowMs || Date.now();
  const pulse = 1 + 0.14 * Math.sin(t * 0.012);
  const cx = state.food.x + (CONFIG.GRID - 2) / 2;
  const cy = state.food.y + (CONFIG.GRID - 2) / 2;
  const w = (CONFIG.GRID - 2) * 1.05 * pulse;
  const h = (CONFIG.GRID - 2) * 1.05 * pulse;

  // Сияние
  ctx.fillStyle = COLORS.FOOD_GLOW;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8);
  ctx.globalAlpha = 1.0;
  
  // Еда (ягодка)
  ctx.shadowColor = 'rgba(0,0,0,0.20)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, w * 0.48, h * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Блик
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.16, cy - h * 0.18, w * 0.14, h * 0.20, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles() {
  ctx.fillStyle = '#87ceeb'; // Ледяной цвет
  ctx.shadowColor = 'rgba(135, 206, 235, 0.5)';
  ctx.shadowBlur = 10;
  
  state.obstacles.forEach(obstacle => {
    // Рисуем ледяной блок с закруглёнными углами
    ctx.beginPath();
    ctx.roundRect(obstacle.x, obstacle.y, CONFIG.GRID - 2, CONFIG.GRID - 2, 4);
    ctx.fill();
    
    // Блик для объёма
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(obstacle.x + 2, obstacle.y + 2, 6, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#87ceeb';
  });
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawFog() {
  return;
}

function updateScoreDisplay() {
  const scoreEl = document.getElementById('score-board');
  const scoreValueEl = document.getElementById('score-value');
  const bestValueEl = document.getElementById('best-value');
  const speedValueEl = document.getElementById('speed-value');
  const scoreNumEl = document.getElementById('score-num');
  const bestNumEl = document.getElementById('best-num');
  const speedNumEl = document.getElementById('speed-num');
  const speedCps = Math.round(1000 / Math.max(1, state.gameSpeed));

  if (scoreNumEl) scoreNumEl.textContent = `${state.score}`;
  if (bestNumEl) bestNumEl.textContent = `${state.highScore}`;
  if (speedNumEl) speedNumEl.textContent = `${speedCps}`;

  if (scoreValueEl && !scoreNumEl) scoreValueEl.textContent = `🍎 ${state.score}`;
  if (bestValueEl && !bestNumEl) bestValueEl.textContent = `🏆 ${state.highScore}`;
  if (speedValueEl && !speedNumEl) speedValueEl.textContent = `⚡ ${speedCps}`;
  if (scoreEl && !scoreValueEl) {
    scoreEl.textContent = `Счёт: ${state.score} | Best: ${state.highScore} | Speed: ${speedCps}`;
  }

  // Визуальный эффект нового рекорда
  if (state.highScoreFxTimeMs > 0) {
    if (scoreEl) {
      scoreEl.style.color = '#ffd700';
      scoreEl.style.textShadow = '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.4)';
    }
  } else {
    if (scoreEl) {
      scoreEl.style.color = '';
      scoreEl.style.textShadow = '';
    }
  }
}

function updateComboDisplay() {
  const comboEl = document.getElementById('combo-indicator');
  if (!comboEl) return;
  
  if (state.combo > 0) {
    const icon = state.combo >= 10 ? '🔥' : state.combo >= 5 ? '⚡' : '✨';
    comboEl.textContent = `${icon} Комбо x${state.combo}`;
    comboEl.style.opacity = '1';
    const scale = Math.min(1.22, 0.92 + state.combo * 0.03);
    comboEl.style.transform = `translateX(-50%) scale(${scale})`;
  } else {
    comboEl.style.opacity = '0';
    comboEl.style.transform = 'translateX(-50%) scale(0.9)';
  }
}
