// === ОТРИСОВКА ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function clearCanvas() {
  const level = state.currentLevelConfig;
  
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, level.visuals.bgTop);
  gradient.addColorStop(1, level.visuals.bgBottom);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  state.snake.forEach((part, index) => {
    const isHead = index === 0;
    ctx.fillStyle = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
    
    // Эффект северного сияния на уровне 5
    if (state.currentLevelConfig.visuals.auroraEffect && isHead) {
      const hue = (Date.now() * 0.05) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
    }
    
    ctx.fillRect(part.x, part.y, CONFIG.GRID - 2, CONFIG.GRID - 2);
    
    // Сброс эффектов
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  });
}

function drawFood() {
  const color = state.foodType === 'bonus' ? COLORS.BONUS_FOOD : COLORS.FOOD;
  
  // Сияние
  ctx.fillStyle = COLORS.FOOD_GLOW;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(state.food.x - 4, state.food.y - 4, CONFIG.GRID + 8, CONFIG.GRID + 8);
  ctx.globalAlpha = 1.0;
  
  // Еда
  ctx.fillStyle = color;
  ctx.fillRect(state.food.x, state.food.y, CONFIG.GRID - 2, CONFIG.GRID - 2);
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
  scoreEl.textContent = `Счёт: ${state.score} | Уровень: ${state.currentLevel}`;
  
  if (state.score > state.highScore) {
    scoreEl.textContent += ' 🏆';
  }
}

function updateComboDisplay() {
  const comboEl = document.getElementById('combo-indicator');
  
  if (state.combo > 0) {
    const icon = state.combo >= 10 ? '🔥' : state.combo >= 5 ? '⚡' : '✨';
    comboEl.textContent = `${icon} Комбо x${state.combo}`;
    comboEl.style.display = 'inline-block';
  } else {
    comboEl.style.display = 'none';
  }
}
