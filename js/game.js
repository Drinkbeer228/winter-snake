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
    triggerTutorialEvent('level_up');
    showLevelTransition(newLevel);
  }

  updateScoreDisplay();
}

function recomputeGameSpeed() {
  const base = Math.max(CONFIG.MIN_SPEED, state.baseGameSpeed || state.gameSpeed || CONFIG.INITIAL_SPEED);
  let ms = base;

  // Debuff: slow (-40% speed => steps/sec * 0.6 => ms / 0.6)
  if (state.slowTimeMs > 0 && state.slowDurationMs > 0) {
    ms = ms / 0.6;
  }

  // Buff: shovel ускорение (steps/sec * 1.25 => ms / 1.25)
  if (state.shovelBuffTimeMs > 0 && state.shovelBuffDurationMs > 0) {
    ms = ms / 1.25;
  }

  state.gameSpeed = Math.max(CONFIG.MIN_SPEED, Math.round(ms));
}

function scheduleManureFromTail(delayMs = 2000) {
  if (!state.pendingManureSpawns) state.pendingManureSpawns = [];
  const now = state.nowMs || Date.now();
  state.pendingManureSpawns.push({ dueMs: now + delayMs });
}

function scheduleNextShovel() {
  const minMs = 20000;
  const maxMs = 30000;
  state.nextShovelAtMs = state.shovelTimerMs + (minMs + Math.random() * (maxMs - minMs));
}

function ensureShovelScheduleStarted() {
  if (typeof state.nextShovelAtMs !== 'number' || state.nextShovelAtMs <= 0) {
    scheduleNextShovel();
  }
}

function spawnShovel() {
  // 1x1 на сетке
  const cols = Math.floor(canvas.width / CONFIG.GRID);
  const rows = Math.floor(canvas.height / CONFIG.GRID);

  for (let tries = 0; tries < 250; tries++) {
    const x = Math.floor(Math.random() * cols) * CONFIG.GRID;
    const y = Math.floor(Math.random() * rows) * CONFIG.GRID;

    const occupiedSnake = state.snake && state.snake.some(s => s.x === x && s.y === y);
    const occupiedFood = state.food && state.food.x === x && state.food.y === y;
    const occupiedObs = state.obstacles && state.obstacles.some(o => o.x === x && o.y === y);
    const occupiedPoop = state.poops && state.poops.some(p => p.x === x && p.y === y);

    if (occupiedSnake || occupiedFood || occupiedObs || occupiedPoop) continue;
    state.shovel = { x, y };
    return;
  }
}

// Применение настроек уровня
function applyLevel(levelConfig) {
  // Обновляем скорость
  state.baseGameSpeed = Math.max(
    CONFIG.MIN_SPEED,
    Math.round(levelConfig.speed * (state.speedFactor || 1))
  );
  recomputeGameSpeed();
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

function enqueueSubtitle(text, durationMs = 6200) {
  if (!text) return;
  if (!state.tutorialQueue) state.tutorialQueue = [];
  state.tutorialQueue.push({ text, durationMs });
}

function showNextSubtitle() {
  if (state.subtitleTimeMs > 0) return;
  if (!state.tutorialQueue || state.tutorialQueue.length === 0) return;

  const next = state.tutorialQueue.shift();
  if (!next) return;
  state.subtitleText = next.text;
  state.subtitleDurationMs = next.durationMs;
  state.subtitleTimeMs = next.durationMs;
}

function triggerTutorialEvent(event) {
  if (!state.isTutorialMode) return;
  if (!state.tutorialSeen) state.tutorialSeen = {};

  const once = (key, fn) => {
    if (state.tutorialSeen[key]) return;
    state.tutorialSeen[key] = true;
    fn();
  };

  if (event === 'game_start') {
    once('game_start', () => {
      enqueueSubtitle('Смотри сюда, новичок. Змейка — это список. Голова — индекс [0], хвост — последний элемент. List в деле, погнали!', 6800);
    });
  }

  if (event === 'apple_eaten') {
    enqueueSubtitle('Яблоко поймал? Красава! Это твой .append() — добавил элемент в конец списка. Змейка выросла, метод сработал!', 6200);
    console.log('Event triggered: Append to list');
  }

  if (event === 'poop_spawned') {
    once('poop_spawned', () => {
      enqueueSubtitle('Опа, мусор в коде! Фильтруй данные, чисти список, иначе Exception прилетит быстрее, чем ты моргнёшь.', 6500);
    });
  }

  if (event === 'shovel_picked') {
    enqueueSubtitle('Олег на связи! Лопата — это твой рефакторинг. Выгребаем мёртвый код, оптимизируем циклы. Чисто и дышится легко.', 6500);
  }

  if (event === 'combo_started') {
    once('combo_started', () => {
      enqueueSubtitle('О, комбо пошло! Это как if в цикле — каждое яблоко проверяет условие. Успел — множитель растёт. Профит жирный.', 6500);
    });
  }

  if (event === 'level_up') {
    enqueueSubtitle('Левел-ап! Как импорт нового модуля — открылась фича, код стал сложнее. Читай доки, тестируй, не бойся ломать.', 6500);
  }

  if (event === 'game_over') {
    enqueueSubtitle('Врезался — это Exception. Цикл прервался, break сработал. Лови ошибку, ищи, где накосячил.', 6500);
  }
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
at
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
            !state.obstacles.some(obs => obs.x === x && obs.y === y) &&
            !(state.poops && state.poops.some(p => p.x === x && p.y === y)) &&
            !(state.shovel && state.shovel.x === x && state.shovel.y === y);
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

  // Подбор лопаты
  if (state.shovel && head.x === state.shovel.x && head.y === state.shovel.y) {
    state.shovel = null;
    if (!state.poops) state.poops = [];

    state.broomSweep = {
      timeMs: 520,
      durationMs: 520,
      fromX: -60,
      toX: canvas.width + 60,
      fromY: canvas.height * 0.62,
      toY: canvas.height * 0.38
    };

    triggerTutorialEvent('shovel_picked');

    playSound('sweep');

    state.shovelBuffDurationMs = 4500;
    state.shovelBuffTimeMs = state.shovelBuffDurationMs;
    state.score += 25;
    updateScoreDisplay();
    recomputeGameSpeed();
  }

  // Дебафф от навоза (не конец игры)
  if (state.poops && state.poops.length > 0) {
    for (const p of state.poops) {
      if (head.x === p.x && head.y === p.y) {
        state.slowDurationMs = 3000;
        state.slowTimeMs = state.slowDurationMs;
        recomputeGameSpeed();
        break;
      }
    }
  }
  
  if (head.x === state.food.x && head.y === state.food.y) {
    triggerTutorialEvent('apple_eaten');

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
      enqueueSubtitle(`🏆 Новый рекорд! Best: ${state.highScore}`, 5200);
    }

    // Speed curve: ускоряемся на 1.5% за яблоко
    state.speedFactor *= 0.985;
    state.baseGameSpeed = Math.max(
      CONFIG.MIN_SPEED,
      Math.round(state.currentLevelConfig.speed * state.speedFactor)
    );
    recomputeGameSpeed();

    updateScoreDisplay();

    // Визуальные эффекты
    spawnEatEffects(head.x, head.y, basePoints);

    // Swallow Pulse: волна утолщения по сегментам от головы к хвосту
    const swallowPerSegMs = 90;
    const swallowDurationMs = 260;
    for (let i = 0; i < state.snake.length; i++) {
      const seg = state.snake[i];
      if (!seg) continue;
      seg.swallowDelayMs = i * swallowPerSegMs;
      seg.swallowTimeMs = swallowDurationMs;
      seg.swallowDurationMs = swallowDurationMs;
      seg.swallowAmp = 0.28;
    }

    // Мягкая зелёная пульсация после еды
    state.digestGlowMs = 900;

    // Навоз: через 2 секунды после еды появится кучка в координатах хвоста
    scheduleManureFromTail(2000);

    // Яблоки-валюта
    if (typeof state.sessionApples !== 'number') state.sessionApples = 0;
    if (typeof state.comboApples !== 'number') state.comboApples = 0;
    state.sessionApples += 1;
    state.comboApples += 1;

    // Проверка повышения уровня
    checkLevelUp();
    
    // Комбо
    state.combo++;
    if (state.combo === 1) {
      triggerTutorialEvent('combo_started');
    }
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
      color: 'rgba(255, 240, 170, 1)'
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
  // Tutorial subtitles queue
  if (state.subtitleTimeMs > 0) {
    state.subtitleTimeMs = Math.max(0, state.subtitleTimeMs - dtMs);
    if (state.subtitleTimeMs === 0) {
      state.subtitleText = '';
      showNextSubtitle();
    }
  } else {
    showNextSubtitle();
  }

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

  if (state.digestGlowMs > 0) {
    state.digestGlowMs = Math.max(0, state.digestGlowMs - dtMs);
  }

  // Debuff slow
  if (state.slowTimeMs > 0) {
    const before = state.slowTimeMs;
    state.slowTimeMs = Math.max(0, state.slowTimeMs - dtMs);
    if (before > 0 && state.slowTimeMs === 0) {
      recomputeGameSpeed();
    }
  }

  // Buff shovel
  if (state.shovelBuffTimeMs > 0) {
    const before = state.shovelBuffTimeMs;
    state.shovelBuffTimeMs = Math.max(0, state.shovelBuffTimeMs - dtMs);
    if (before > 0 && state.shovelBuffTimeMs === 0) {
      recomputeGameSpeed();
    }
  }

  // Навоз: отложенный спавн после еды
  if (!state.poops) state.poops = [];
  if (state.pendingManureSpawns && state.pendingManureSpawns.length > 0) {
    const now = state.nowMs || Date.now();
    for (let i = state.pendingManureSpawns.length - 1; i >= 0; i--) {
      if (now >= state.pendingManureSpawns[i].dueMs) {
        spawnPoopAtTail();
        triggerTutorialEvent('poop_spawned');
        state.pendingManureSpawns.splice(i, 1);
      }
    }
  }

  // Лопата: спавн раз в 20-30 секунд
  if (typeof state.shovelTimerMs !== 'number') state.shovelTimerMs = 0;
  state.shovelTimerMs += dtMs;
  ensureShovelScheduleStarted();
  if (!state.shovel && state.shovelTimerMs >= state.nextShovelAtMs) {
    spawnShovel();
    ensureShovelScheduleStarted();
    scheduleNextShovel();
  }

  // Олег: смахивание навоза метлой
  if (state.broomSweep && state.broomSweep.durationMs > 0) {
    state.broomSweep.timeMs = Math.max(0, state.broomSweep.timeMs - dtMs);

    const s = state.broomSweep;
    const t = Math.max(0, Math.min(1, s.timeMs / Math.max(1, s.durationMs)));
    const p = 1 - t;
    const sweepX = s.fromX + (s.toX - s.fromX) * p;

    if (state.poops && state.poops.length > 0) {
      for (let i = state.poops.length - 1; i >= 0; i--) {
        const px = state.poops[i].x + CONFIG.GRID / 2;
        if (px < sweepX) {
          state.poops.splice(i, 1);
        }
      }
    }

    if (state.broomSweep.timeMs === 0) {
      state.broomSweep = null;
      if (state.poops) state.poops.length = 0;
    }
  }

  // Махауты-чистильщики
  updateMahouts(dtMs);

  // Swallow Pulse: обновление таймеров сегментов (лёгкое, без массивов эффектов)
  if (state.snake && state.snake.length > 0) {
    for (const seg of state.snake) {
      if (!seg) continue;
      if (typeof seg.swallowDelayMs === 'number' && seg.swallowDelayMs > 0) {
        seg.swallowDelayMs = Math.max(0, seg.swallowDelayMs - dtMs);
      } else if (typeof seg.swallowTimeMs === 'number' && seg.swallowTimeMs > 0) {
        seg.swallowTimeMs = Math.max(0, seg.swallowTimeMs - dtMs);
      }
    }
  }

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
    triggerTutorialEvent('game_over');
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

  // Цитаты Покоя
  const quoteEl = document.getElementById('calm-quote');
  if (quoteEl) {
    const quotes = [
      'Порядок по кантику — покой в душе',
      'Свобода — это когда ты сам выбираешь, где оставить след',
      'Даже самый длинный Python начинается с одной строчки кода'
    ];
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  }

  // Яндекс Игры: дублируем рекорд в лидерборд
  if (typeof window.saveHiScore === 'function') {
    window.saveHiScore(state.highScore);
  }

  document.getElementById('final-score').textContent = state.score;
  document.getElementById('final-highscore').textContent = state.highScore;

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

  triggerTutorialEvent('game_start');

  state.isRunning = true;
  startGameLoop();
}
