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
  state.gameSpeed = levelConfig.speed;
  if (state.gameInterval) {
    clearInterval(state.gameInterval);
    state.gameInterval = setInterval(gameLoop, state.gameSpeed);
  }
  
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
    updateScoreDisplay();
    
    // Проверка повышения уровня
    checkLevelUp();
    
    // Комбо
    state.combo++;
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(() => {
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
    // Если игра на паузе и меню паузы видно - продолжаем
    if (state.isPaused && !document.getElementById('pause-menu').classList.contains('hidden')) {
      if (typeof hidePauseMenu === 'function') {
        hidePauseMenu();
      }
      return;
    }
    
    // Если игра не на паузе - открываем меню паузы
    if (!state.isPaused) {
      if (typeof togglePauseMenu === 'function') {
        togglePauseMenu();
      } else {
        state.isPaused = !state.isPaused;
        playSound('pause');
      }
    }
    return;
  }
  
  const goingUp = state.dy === -CONFIG.GRID;
  const goingDown = state.dy === CONFIG.GRID;
  const goingRight = state.dx === CONFIG.GRID;
  const goingLeft = state.dx === -CONFIG.GRID;
  
  // ✅ ИСПРАВЛЕНО: без пробелов и с правильным &&
  if (key === 'ArrowLeft' && !goingRight) {
    state.dx = -CONFIG.GRID;
    state.dy = 0;
  }
  if (key === 'ArrowUp' && !goingDown) {
    state.dx = 0;
    state.dy = -CONFIG.GRID;
  }
  if (key === 'ArrowRight' && !goingLeft) {
    state.dx = CONFIG.GRID;
    state.dy = 0;
  }
  if (key === 'ArrowDown' && !goingUp) {
    state.dx = 0;
    state.dy = CONFIG.GRID;
  }
}

function gameLoop() {
  if (state.isPaused || !state.isRunning) return;
  
  if (didGameEnd()) {
    playSound('gameover');
    showGameOverModal();
    state.isRunning = false;
    return;
  }
  
  clearCanvas();
  drawObstacles();
  drawFood();
  advanceSnake();
  drawSnake();
  drawFog(); // Туман поверх всего
  updateComboDisplay();
}

function showGameOverModal() {
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('snakeHighScore', state.highScore);
  }
  
  document.getElementById('final-score').textContent = state.score;
  document.getElementById('final-highscore').textContent = state.highScore;
  document.getElementById('game-over-modal').classList.remove('hidden');
  
  // Останавливаем игру
  state.isRunning = false;
  if (state.gameInterval) {
    clearInterval(state.gameInterval);
  }
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
  
  if (state.gameInterval) {
    clearInterval(state.gameInterval);
  }
  
  state.isRunning = true;
  state.gameInterval = setInterval(gameLoop, state.gameSpeed);
}
