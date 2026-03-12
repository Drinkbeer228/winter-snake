// === ЛОГИКА ИГРЫ ===

// Проверка повышения уровня
function checkLevelUp() {
  const newLevel = LEVELS.find(l => 
    state.score >= l.scoreThreshold && l.level > state.currentLevel
  );
  
  if (newLevel) {
    state.currentLevel = newLevel.level;
    state.currentLevelConfig = newLevel;
    applyLevel(newLevel);
    showLevelTransition(newLevel);
  }
}

// Применение настроек уровня
function applyLevel(levelConfig) {
  // Обновляем скорость
  state.gameSpeed = Math.max(
    CONFIG.MIN_SPEED,
    Math.round(levelConfig.speed * (state.speedFactor || 1))
  );
  // setInterval больше не используется, скорость применяется в rAF цикле
  
  // Применяем механики
  if (levelConfig.mechanics.obstacles) {
    spawnObstacles(levelConfig.mechanics.obstacleCount);
  } else {
    state.obstacles = [];
  }
  
  if (levelConfig.mechanics.movingFood) {
    startFoodMovement();
  } else {
    stopFoodMovement();
  }
  
  if (levelConfig.mechanics.fog) {
    state.fogRadius = levelConfig.visuals.fogRadius;
  } else {
    state.fogRadius = null;
  }
  
  // Обновляем шанс бонусной еды
  if (levelConfig.mechanics.bonusFoodChance) {
    CONFIG.BONUS_FOOD_CHANCE = levelConfig.mechanics.bonusFoodChance;
  }
}

// Создание препятствий
function spawnObstacles(count) {
  state.obstacles = [];
  
  for (let i = 0; i < count; i++) {
    let valid = false;
    let x, y;
    
    while (!valid) {
      x = Math.floor(Math.random() * (canvas.width / CONFIG.GRID)) * CONFIG.GRID;
      y = Math.floor(Math.random() * (canvas.height / CONFIG.GRID)) * CONFIG.GRID;
      
      // Проверяем, что препятствие не на змейке и не на еде
      valid = !state.snake.some(part => part.x === x && part.y === y) &&
              !(x === state.food.x && y === state.food.y);
    }
    
    state.obstacles.push({ x, y });
  }
}

// Движение еды
function startFoodMovement() {
  stopFoodMovement(); // Очищаем предыдущий таймер
  
  state.foodMovementTimer = setInterval(() => {
    if (!state.isPaused && state.isRunning) {
      moveFood();
    }
  }, 2000); // Двигаем каждые 2 секунды
}

function stopFoodMovement() {
  if (state.foodMovementTimer) {
    clearInterval(state.foodMovementTimer);
    state.foodMovementTimer = null;
  }
}

function moveFood() {
  const directions = [
    { dx: 0, dy: -CONFIG.GRID }, // Вверх
    { dx: 0, dy: CONFIG.GRID },  // Вниз
    { dx: -CONFIG.GRID, dy: 0 }, // Влево
    { dx: CONFIG.GRID, dy: 0 }   // Вправо
  ];
  
  // Выбираем случайное направление
  const dir = directions[Math.floor(Math.random() * directions.length)];
  const newX = state.food.x + dir.dx;
  const newY = state.food.y + dir.dy;
  
  // Проверяем, что новая позиция в пределах поля и не занята
  if (newX >= 0 && newX < canvas.width && 
      newY >= 0 && newY < canvas.height &&
      !state.snake.some(part => part.x === newX && part.y === newY) &&
      !state.obstacles.some(obs => obs.x === newX && obs.y === newY)) {
    
    state.food.x = newX;
    state.food.y = newY;
  }
}

function isMainMenuActive() {
  const el = document.getElementById('main-menu');
  return !!(el && !el.classList.contains('hidden'));
}

function pauseGame() {
  state.isPaused = true;
  state.isRunning = false;
  stopGameLoop();
}

function resumeGame() {
  state.isPaused = false;
  state.isRunning = true;
  startGameLoop();
}

// Экран перехода уровня
function showLevelTransition(level) {
  // Удаляем предыдущее уведомление
  const existing = document.getElementById('level-notification');
  if (existing) {
    existing.remove();
  }
  
  // Создаём компактное уведомление
  const notification = document.createElement('div');
  notification.id = 'level-notification';
  notification.className = 'level-notification';
  notification.innerHTML = `❄️ Уровень ${level.level}!`;
  
  document.body.appendChild(notification);
  
  // Автоматически удаляем через 2 секунды
  setTimeout(() => {
    notification.remove();
  }, 2000);
  
  // Звук перехода
  playSound('newrecord');
}

function createFood() {
  if (state.bonusFoodTimeout) {
    clearTimeout(state.bonusFoodTimeout);
    state.bonusFoodTimeout = null;
  }
  
  let valid = false;
  let x, y;
  
  while (!valid) {
    x = Math.floor(Math.random() * (canvas.width / CONFIG.GRID)) * CONFIG.GRID;
    y = Math.floor(Math.random() * (canvas.height / CONFIG.GRID)) * CONFIG.GRID;
    valid = !state.snake.some(part => part.x === x && part.y === y) &&
            !state.obstacles.some(obs => obs.x === x && obs.y === y);
  }
  
  state.food = { x, y };
  state.foodType = Math.random() < CONFIG.BONUS_FOOD_CHANCE ? 'bonus' : 'normal';
  
  if (state.foodType === 'bonus') {
    state.bonusFoodTimeout = setTimeout(createFood, CONFIG.BONUS_FOOD_TIMEOUT);
  }
}

function bankComboApples(amount) {
  const a = Math.max(0, Math.floor(amount || 0));
  if (a <= 0) return;
  if (typeof state.totalApples !== 'number') state.totalApples = 0;
  state.totalApples += a;
  localStorage.setItem('snakeTotalApples', `${state.totalApples}`);
  if (typeof showBankDeposit === 'function') {
    showBankDeposit(a);
  }
}

function burnComboToBank() {
  const a = Math.max(0, Math.floor(state.comboApples || 0));
  if (a > 0) {
    bankComboApples(a);
  }
  state.comboApples = 0;
}

function bankPartialOnGameOver() {
  if (!state.combo || state.combo <= 0) return;
  const a = Math.max(0, Math.floor(state.comboApples || 0));
  if (a <= 0) return;
  const keep = Math.max(0, Math.floor(a * 0.2));
  if (keep > 0) {
    bankComboApples(keep);
  }
  state.comboApples = 0;
}

function spawnPoopAtTail() {
  if (!state.snake || state.snake.length === 0) return;
  const tail = state.snake[state.snake.length - 1];
  if (!tail) return;

  // Не спавним дубликаты
  if (state.poops && state.poops.some(p => p.x === tail.x && p.y === tail.y)) return;

  state.poops.push({
    x: tail.x,
    y: tail.y,
    createdMs: state.nowMs || Date.now()
  });
}

function scheduleNextPoop() {
  const minMs = 15000;
  const maxMs = 20000;
  state.nextPoopAtMs = state.poopTimerMs + (minMs + Math.random() * (maxMs - minMs));
}

function ensurePoopScheduleStarted() {
  if (typeof state.nextPoopAtMs !== 'number' || state.nextPoopAtMs <= 0) {
    scheduleNextPoop();
  }
}

function spawnMahout() {
  // Спавним с края поля (за пределами видимости)
  const margin = CONFIG.GRID * 2;
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -margin;
    y = Math.random() * canvas.height;
  } else if (side === 1) {
    x = canvas.width + margin;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = -margin;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height + margin;
  }

  state.mahouts.push({
    x,
    y,
    state: 'toPoop',
    speed: state.upgradeMahoutSpeed ? 160 : 110,
    target: null
  });

  if (typeof showToast === 'function') {
    const variants = ['Олег вышел на уборку!', 'Дима чистит вольер!'];
    const msg = variants[Math.floor(Math.random() * variants.length)];
    showToast('🧹 Махаут', msg, 2400);
  }
}

function updateMahouts(dtMs) {
  if (!state.mahouts) state.mahouts = [];
  if (!state.poops) state.poops = [];

  // Спавн: если куч > 3 и нет активного махаута
  if (state.poops.length > 3 && state.mahouts.length === 0) {
    spawnMahout();
  }

  const dt = dtMs / 1000;
  const margin = CONFIG.GRID * 3;

  for (let i = state.mahouts.length - 1; i >= 0; i--) {
    const m = state.mahouts[i];

    if (m.state === 'toPoop') {
      if (!m.target || !state.poops.some(p => p.x === m.target.x && p.y === m.target.y)) {
        // находим ближайшую кучу
        let best = null;
        let bestD2 = Infinity;
        for (const p of state.poops) {
          const tx = p.x + CONFIG.GRID / 2;
          const ty = p.y + CONFIG.GRID / 2;
          const dx = tx - m.x;
          const dy = ty - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) {
            bestD2 = d2;
            best = { x: p.x, y: p.y };
          }
        }
        m.target = best;
        if (!m.target) {
          // нет куч — уходим
          m.state = 'exit';
          m.exitX = m.x < canvas.width / 2 ? -margin : canvas.width + margin;
          m.exitY = m.y < canvas.height / 2 ? -margin : canvas.height + margin;
        }
      }

      if (m.target) {
        const tx = m.target.x + CONFIG.GRID / 2;
        const ty = m.target.y + CONFIG.GRID / 2;
        const dx = tx - m.x;
        const dy = ty - m.y;
        const dist = Math.hypot(dx, dy);
        const step = m.speed * dt;
        if (dist <= Math.max(6, step)) {
          // убираем кучу
          for (let k = state.poops.length - 1; k >= 0; k--) {
            if (state.poops[k].x === m.target.x && state.poops[k].y === m.target.y) {
              state.poops.splice(k, 1);
              break;
            }
          }
          m.state = 'exit';
          m.exitX = m.x < canvas.width / 2 ? -margin : canvas.width + margin;
          m.exitY = m.y < canvas.height / 2 ? -margin : canvas.height + margin;
          m.target = null;
        } else {
          m.x += (dx / dist) * step;
          m.y += (dy / dist) * step;
        }
      }
    } else if (m.state === 'exit') {
      const tx = typeof m.exitX === 'number' ? m.exitX : (canvas.width + margin);
      const ty = typeof m.exitY === 'number' ? m.exitY : (canvas.height + margin);
      const dx = tx - m.x;
      const dy = ty - m.y;
      const dist = Math.hypot(dx, dy);
      const step = m.speed * dt;
      if (dist <= Math.max(6, step)) {
        state.mahouts.splice(i, 1);
      } else {
        m.x += (dx / dist) * step;
        m.y += (dy / dist) * step;
      }
    }

    // Деспавн если далеко за полем (страховка)
    if (m.x < -margin * 2 || m.x > canvas.width + margin * 2 || m.y < -margin * 2 || m.y > canvas.height + margin * 2) {
      state.mahouts.splice(i, 1);
    }
  }
}

function advanceSnake() {
  const head = {
    x: state.snake[0].x + state.dx,
    y: state.snake[0].y + state.dy
  };
  
  state.snake.unshift(head);
  
  if (head.x === state.food.x && head.y === state.food.y) {
    // Очки
    const basePoints = state.foodType === 'bonus' ? 50 : 10;
    state.score += basePoints;

    // High score: обновляем мгновенно
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
      state.highScoreFxTimeMs = 1000;
      state.brokeRecordThisRun = true;
      playSound('newrecord');
      if (typeof showToast === 'function') {
        showToast('🏆 Новый рекорд!', `Best: ${state.highScore}`, 2600);
      }
    }

    // Speed curve: ускоряемся на 1.5% за яблоко, но с cap
    state.speedFactor *= 0.985;
    state.gameSpeed = Math.max(
      CONFIG.MIN_SPEED,
      Math.round(state.currentLevelConfig.speed * state.speedFactor)
    );

    updateScoreDisplay();

    // Визуальные эффекты
    spawnEatEffects(head.x, head.y, basePoints);

    // Яблоки-валюта
    if (typeof state.sessionApples !== 'number') state.sessionApples = 0;
    if (typeof state.comboApples !== 'number') state.comboApples = 0;
    state.sessionApples += 1;
    state.comboApples += 1;

    // Навозный цикл: каждые 5 фруктов — минирование хвостом
    if (typeof state.fruitsSincePoop !== 'number') state.fruitsSincePoop = 0;
    state.fruitsSincePoop++;
    if (state.fruitsSincePoop >= 5) {
      spawnPoopAtTail();
      state.fruitsSincePoop = 0;
      ensurePoopScheduleStarted();
      scheduleNextPoop();
    }
    
    // Проверка повышения уровня
    checkLevelUp();
    
    // Комбо
    state.combo++;
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(() => {
      burnComboToBank();
      state.combo = 0;
      updateComboDisplay();
    }, CONFIG.COMBO_TIMEOUT);
    updateComboDisplay();
    
    // Звук
    playSound(state.foodType === 'bonus' ? 'eat' : 'eat');
    
    createFood();
  } else {
    state.snake.pop();
  }
}

function spawnEatEffects(x, y, points) {
  createSnowBurst(x + CONFIG.GRID / 2, y + CONFIG.GRID / 2);
  createFloatText(x + CONFIG.GRID / 2, y + CONFIG.GRID / 2, `+${points}`);
  triggerScreenShake(140, 3);
  triggerHeadPop(200);
}

function createSnowBurst(x, y) {
  const count = 10 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 140;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 1.4 + Math.random() * 2.4,
      a: 1,
      lifeMs: 520 + Math.random() * 380,
      maxLifeMs: 0,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() * 2 - 1) * (4 + Math.random() * 6),
      color: 'rgba(255,255,255,1)'
    });
    state.particles[state.particles.length - 1].maxLifeMs = state.particles[state.particles.length - 1].lifeMs;
  }
}

function createFloatText(x, y, text) {
  state.floatTexts.push({
    x,
    y,
    vy: -55,
    a: 1,
    lifeMs: 900,
    maxLifeMs: 900,
    text,
    color: 'rgba(255,255,255,1)'
  });
}

function triggerScreenShake(durationMs, magnitudePx) {
  state.shakeDurationMs = durationMs;
  state.shakeTimeMs = durationMs;
  state.shakeMagnitudePx = magnitudePx;
}

function triggerHeadPop(durationMs) {
  state.headPopDurationMs = durationMs;
  state.headPopTimeMs = durationMs;
}

function updateEffects(dtMs) {
  if (state.shakeTimeMs > 0) {
    state.shakeTimeMs = Math.max(0, state.shakeTimeMs - dtMs);
  }

  if (state.headPopTimeMs > 0) {
    state.headPopTimeMs = Math.max(0, state.headPopTimeMs - dtMs);
  }

  if (state.highScoreFxTimeMs > 0) {
    state.highScoreFxTimeMs = Math.max(0, state.highScoreFxTimeMs - dtMs);
  }

  if (state.isPaused) {
    return;
  }

  // Навоз по таймеру
  if (!state.poops) state.poops = [];
  if (typeof state.poopTimerMs !== 'number') state.poopTimerMs = 0;
  state.poopTimerMs += dtMs;
  ensurePoopScheduleStarted();
  if (state.poopTimerMs >= state.nextPoopAtMs) {
    spawnPoopAtTail();
    ensurePoopScheduleStarted();
    scheduleNextPoop();
  }

  // Махауты-чистильщики
  updateMahouts(dtMs);

  if (state.particles && state.particles.length > 0) {
    const dt = dtMs / 1000;
    const gravity = 140;
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (typeof p.rot === 'number') {
        p.rot += (p.rotSpeed || 0) * dt;
      }
      p.lifeMs -= dtMs;
      p.a = Math.max(0, p.lifeMs / p.maxLifeMs);
      if (p.lifeMs <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  if (state.floatTexts && state.floatTexts.length > 0) {
    const dt = dtMs / 1000;
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const t = state.floatTexts[i];
      t.y += t.vy * dt;
      t.lifeMs -= dtMs;
      t.a = Math.max(0, t.lifeMs / t.maxLifeMs);
      if (t.lifeMs <= 0) {
        state.floatTexts.splice(i, 1);
      }
    }
  }
}

function didGameEnd() {
  // Столкновение с собой
  for (let i = 4; i < state.snake.length; i++) {
    if (state.snake[i].x === state.snake[0].x && state.snake[i].y === state.snake[0].y) {
      return true;
    }
  }
  
  // Столкновение с препятствиями
  for (const obstacle of state.obstacles) {
    if (state.snake[0].x === obstacle.x && state.snake[0].y === obstacle.y) {
      return true;
    }
  }

  // Столкновение с навозом
  if (state.poops && state.poops.length > 0) {
    for (const p of state.poops) {
      if (state.snake[0].x === p.x && state.snake[0].y === p.y) {
        return true;
      }
    }
  }

  // Столкновение с махаутом (опасно)
  if (state.mahouts && state.mahouts.length > 0) {
    const hx = state.snake[0].x + CONFIG.GRID / 2;
    const hy = state.snake[0].y + CONFIG.GRID / 2;
    const r = CONFIG.GRID * 0.42;
    for (const m of state.mahouts) {
      if (Math.hypot(m.x - hx, m.y - hy) <= r) {
        return true;
      }
    }
  }
  
  // Границы
  const head = state.snake[0];
  return (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height
  );
}

function changeDirection(event) {
  event.preventDefault();
  
  const key = event.key;
  
  // Пауза
  if (key === ' ') {
    const pauseMenu = document.getElementById('pause-menu');
    const pauseVisible = pauseMenu && !pauseMenu.classList.contains('hidden');

    if (state.isPaused) {
      state.isPaused = false;
      if (pauseVisible) {
        pauseMenu.classList.add('hidden');
      }
      playSound('pause');
      return;
    }

    state.isPaused = true;
    if (pauseMenu) {
      pauseMenu.classList.remove('hidden');
    }
    playSound('pause');
    return;
  }
  
  const goingUp = state.dy === -CONFIG.GRID;
  const goingDown = state.dy === CONFIG.GRID;
  const goingRight = state.dx === CONFIG.GRID;
  const goingLeft = state.dx === -CONFIG.GRID;
  
  // ✅ ИСПРАВЛЕНО: без пробелов и с правильным &&
  if (key === 'ArrowLeft' && !goingRight) {
    state.dx = -CONFIG.GRID;
    playSound('turn');
    state.dy = 0;
  }
  if (key === 'ArrowUp' && !goingDown) {
    state.dx = 0;;
    playSound('turn')
    state.dy = -CONFIG.GRID;
  }
  if (key === 'ArrowRight' && !goingLeft) {
    state.dx = CONFIG.GRID;
    playSound('turn');
    state.dy = 0;
  }
  if (key === 'ArrowDown' && !goingUp) {
    state.dx = 0;;
    playSound('turn')
    state.dy = CONFIG.GRID;
  }
}

function stepGameLogic() {
  if (state.isPaused || !state.isRunning) return;

  advanceSnake();

  if (didGameEnd()) {
    bankPartialOnGameOver();
    playSound('gameover');
    showGameOverModal();
    state.isRunning = false;
    stopGameLoop();
    return;
  }
}

function startGameLoop() {
  if (state.rafId) return;
  state.lastFrameTimeMs = 0;
  state.accumulatorMs = 0;

  const tick = (ts) => {
    state.rafId = requestAnimationFrame(tick);

    if (!state.lastFrameTimeMs) {
      state.lastFrameTimeMs = ts;
      state.nowMs = ts;
      renderFrame();
      updateComboDisplay();
      return;
    }

    let dtMs = ts - state.lastFrameTimeMs;
    state.lastFrameTimeMs = ts;
    state.nowMs = ts;

    // Защита от вкладка-афк
    if (dtMs > 60) dtMs = 60;

    // Эффекты обновляем каждый кадр
    updateEffects(dtMs);
    if (!state.isPaused) {
      if (typeof updateBackgroundSnow === 'function') {
        updateBackgroundSnow(dtMs);
      }
    }

    // Логика - фиксированным шагом (по скорости уровня)
    if (!state.isPaused && state.isRunning) {
      state.accumulatorMs += dtMs;
      while (state.accumulatorMs >= state.gameSpeed) {
        stepGameLogic();
        state.accumulatorMs -= state.gameSpeed;
      }
    }

    renderFrame();
    updateComboDisplay();
  };

  state.rafId = requestAnimationFrame(tick);
}

function stopGameLoop() {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

function showGameOverModal() {
  // highScore обновляется мгновенно при наборе очков
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('snakeHighScore', state.highScore);
    state.brokeRecordThisRun = true;
  }

  document.getElementById('final-score').textContent = state.score;
  document.getElementById('final-highscore').textContent = state.highScore;

  const newRecordEl = document.getElementById('new-record-text');
  if (newRecordEl) {
    if (state.brokeRecordThisRun) {
      newRecordEl.classList.remove('hidden');
    } else {
      newRecordEl.classList.add('hidden');
    }
  }

  document.getElementById('game-over-modal').classList.remove('hidden');
  
  // Останавливаем игру
  state.isRunning = false;
  stopGameLoop();
}

function hideGameOverModal() {
  document.getElementById('game-over-modal').classList.add('hidden');
}

function resetGame() {
  hideGameOverModal();
  resetState();
  updateScoreDisplay();
  updateComboDisplay();
  createFood();

  state.isRunning = true;
  startGameLoop();
}
