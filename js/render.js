// === ОТРИСОВКА ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

  clearCanvas();
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
  const speedCps = Math.round(1000 / Math.max(1, state.gameSpeed));

  if (scoreValueEl) scoreValueEl.textContent = `Счёт: ${state.score}`;
  if (bestValueEl) bestValueEl.textContent = `Best: ${state.highScore}`;
  if (speedValueEl) speedValueEl.textContent = `Speed: ${speedCps}`;
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
  } else {
    comboEl.style.opacity = '0';
  }
}
