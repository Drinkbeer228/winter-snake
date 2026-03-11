// === СОСТОЯНИЕ ИГРЫ ===
const state = {
  snake: [],
  food: { x: 0, y: 0 },
  foodType: 'normal',
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
  dx: CONFIG.GRID,
  dy: 0,
  gameSpeed: CONFIG.INITIAL_SPEED,
  isPaused: false,
  isRunning: false,
  currentLevel: 1,
  currentLevelConfig: LEVELS[0],
  combo: 0,
  comboTimer: null,
  bonusFoodTimeout: null,
  particles: [],
  gameInterval: null,
  obstacles: [], // Препятствия для уровней 3-5
  foodMovementTimer: null, // Движение еды для уровней 2+
  fogRadius: null // Радиус видимости для тумана
};

// === ИНИЦИАЛИЗАЦИЯ ЗМЕИ ===
function initSnake() {
  state.snake = [
    { x: 160, y: 160 },
    { x: 140, y: 160 }
  ];
  state.dx = CONFIG.GRID;
  state.dy = 0;
}

// === СБРОС СОСТОЯНИЯ ===
function resetState() {
  state.score = 0;
  state.gameSpeed = CONFIG.INITIAL_SPEED;
  state.isPaused = false;
  state.currentLevel = 1;
  state.currentLevelConfig = LEVELS[0];
  state.combo = 0;
  state.particles = [];
  state.obstacles = [];
  state.fogRadius = null;
  
  // Сбрасываем шанс бонусной еды
  CONFIG.BONUS_FOOD_CHANCE = 0.1;
  
  if (state.bonusFoodTimeout) {
    clearTimeout(state.bonusFoodTimeout);
    state.bonusFoodTimeout = null;
  }
  
  if (state.comboTimer) {
    clearTimeout(state.comboTimer);
    state.comboTimer = null;
  }
  
  if (state.foodMovementTimer) {
    clearInterval(state.foodMovementTimer);
    state.foodMovementTimer = null;
  }
  
  initSnake();
}
