// === ОТРИСОВКА ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let _groundPattern = null;
let _groundPatternKey = '';

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
  if (!state.camera || !state.snake || state.snake.length === 0) return;

  const head = state.snake[0];
  const dirX = Math.sign(state.dx) || 0;
  const dirY = Math.sign(state.dy) || 1;

  const yawTarget = Math.atan2(dirX, dirY);
  state.camera.yaw = wrapAngleRad(state.camera.yaw + wrapAngleRad(yawTarget - state.camera.yaw) * 0.12);

  const bx = head.x - dirX * state.camera.back;
  const by = head.y - dirY * state.camera.back;

  const t = 1 - Math.pow(1 - state.camera.lerp, Math.max(1, dtMs) / 16);
  state.camera.x = lerp(state.camera.x, bx, t);
  state.camera.y = lerp(state.camera.y, by, t);

  state.camera.bottomY = canvas.height - 8;
  state.camera.horizonY = Math.max(42, canvas.height * 0.22);
}

function project(x, y, z = 0) {
  const cam = state.camera;
  const dx = x - cam.x;
  const dy = y - cam.y;
  const c = Math.cos(-cam.yaw);
  const s = Math.sin(-cam.yaw);

  const lateral = dx * c - dy * s;
  const depth = Math.max(0.0001, dx * s + dy * c);

  const persp = cam.fov / (cam.fov + depth);
  const sx = canvas.width / 2 + lateral * persp;
  const groundSy = cam.horizonY + (cam.bottomY - cam.horizonY) * persp;
  const sy = groundSy - z * persp;

  return { sx, sy, scale: persp, depth };
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

function drawGround3D() {
  ensureGroundPattern();
  const cam = state.camera;

  // Небо/фон
  ctx.fillStyle = '#0a1624';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Плоскость земли: рисуем полосами по глубине (трапеции-строки)
  const maxDepth = cam.fogFar;
  const rows = 42;
  const step = maxDepth / rows;

  for (let i = rows; i >= 1; i--) {
    const d0 = (i - 1) * step;
    const d1 = i * step;
    const p0 = cam.fov / (cam.fov + Math.max(0.0001, d0));
    const p1 = cam.fov / (cam.fov + Math.max(0.0001, d1));

    const y0 = cam.horizonY + (cam.bottomY - cam.horizonY) * p0;
    const y1 = cam.horizonY + (cam.bottomY - cam.horizonY) * p1;

    const hw0 = cam.worldHalfWidth * p0;
    const hw1 = cam.worldHalfWidth * p1;

    const x0l = canvas.width / 2 - hw0;
    const x0r = canvas.width / 2 + hw0;
    const x1l = canvas.width / 2 - hw1;
    const x1r = canvas.width / 2 + hw1;

    const fogA = getFogAlpha(d1);
    ctx.globalAlpha = 1 - fogA * 0.70;
    ctx.fillStyle = _groundPattern;

    ctx.beginPath();
    ctx.moveTo(x0l, y0);
    ctx.lineTo(x0r, y0);
    ctx.lineTo(x1r, y1);
    ctx.lineTo(x1l, y1);
    ctx.closePath();
    ctx.fill();

    // Лёгкая подсветка линий перспективы
    ctx.globalAlpha = (1 - fogA) * 0.08;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1l, y1);
    ctx.lineTo(x1r, y1);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Туман к горизонту (мягкая маска)
  const fogGrad = ctx.createLinearGradient(0, cam.horizonY - 10, 0, cam.bottomY);
  fogGrad.addColorStop(0, 'rgba(10,22,36,0.85)');
  fogGrad.addColorStop(0.32, 'rgba(10,22,36,0.18)');
  fogGrad.addColorStop(1, 'rgba(10,22,36,0)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot || 0);
  ctx.globalAlpha = p.a;
  ctx.fillStyle = p.color;

  const r = p.r;

  // Ромбик
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.fill();

  // Лёгкий "крестик" поверх
  ctx.globalAlpha = p.a * 0.55;
  ctx.fillRect(-r * 0.15, -r * 1.2, r * 0.3, r * 2.4);
  ctx.fillRect(-r * 1.2, -r * 0.15, r * 2.4, r * 0.3);

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
  const shakeActive = state.shakeTimeMs > 0 && state.shakeDurationMs > 0;
  let ox = 0;
  let oy = 0;
  if (shakeActive) {
    const m = state.shakeMagnitudePx;
    ox = (Math.random() * 2 - 1) * m;
    oy = (Math.random() * 2 - 1) * m;
  }

  ctx.save();
  ctx.translate(ox, oy);

  updateCameraFollow(state.lastFrameTimeMs ? (state.nowMs - state.lastFrameTimeMs) : 16);
  drawGround3D();
  drawBackgroundSnow();
  drawObstacles();
  drawFood();
  drawSnake();
  drawParticles();
  drawFloatTexts();
  drawFog();

  ctx.restore();
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
  const color = state.foodType === 'bonus' ? COLORS.BONUS_FOOD : COLORS.FOOD;

  const t = state.nowMs || Date.now();
  const pulse = 1 + 0.14 * Math.sin(t * 0.012);
  const cx = state.food.x + (CONFIG.GRID - 2) / 2;
  const cy = state.food.y + (CONFIG.GRID - 2) / 2;
  const w = (CONFIG.GRID - 2) * pulse;
  const h = (CONFIG.GRID - 2) * pulse;

  // Сияние
  ctx.fillStyle = COLORS.FOOD_GLOW;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8);
  ctx.globalAlpha = 1.0;
  
  // Еда
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
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
  if (!state.fogRadius) return;
  
  // Создаём туман - затемнение краёв
  const gradient = ctx.createRadialGradient(
    state.snake[0].x + CONFIG.GRID/2, 
    state.snake[0].y + CONFIG.GRID/2, 
    0,
    state.snake[0].x + CONFIG.GRID/2, 
    state.snake[0].y + CONFIG.GRID/2, 
    state.fogRadius
  );
  
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
