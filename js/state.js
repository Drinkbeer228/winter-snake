// === СОСТОЯНИЕ ИГРЫ ===
const state = {
  snake: [],
  food: { x: 0, y: 0 },
  foodType: 'normal',
  totalApples: parseInt(localStorage.getItem('snakeTotalApples')) || 0,
  sessionApples: 0,
  comboApples: 0,
  ownedSkins: (() => {
    try {
      const raw = localStorage.getItem('snakeOwnedSkins');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
    return { default: true };
  })(),
  currentSkin: localStorage.getItem('snakeCurrentSkin') || 'default',
  upgradeMahoutSpeed: localStorage.getItem('snakeUpgradeMahoutSpeed') === '1',
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
  dx: CONFIG.GRID,
  dy: 0,
  gameSpeed: CONFIG.INITIAL_SPEED,
  baseGameSpeed: CONFIG.INITIAL_SPEED,
  speedFactor: 1,
  isPaused: false,
  isRunning: false,
  currentLevel: 1,
  currentLevelConfig: LEVELS[0],
  combo: 0,
  comboTimer: null,
  bonusFoodTimeout: null,
  particles: [],
  floatTexts: [],
  digestGlowMs: 0,
  shakeTimeMs: 0,
  shakeDurationMs: 0,
  shakeMagnitudePx: 0,
  headPopTimeMs: 0,
  headPopDurationMs: 0,
  highScoreFxTimeMs: 0,
  brokeRecordThisRun: false,
  bgSnowNear: [],
  bgSnowFar: [],
  nowMs: 0,
  lastFrameTimeMs: 0,
  accumulatorMs: 0,
  rafId: null,
  gameInterval: null,
  obstacles: [], // Препятствия для уровней 3-5
  foodMovementTimer: null, // Движение еды для уровней 2+
  manure: [],
  poops: [],
  pendingManureSpawns: [],
  slowTimeMs: 0,
  slowDurationMs: 0,
  shovel: null,
  shovelBuffTimeMs: 0,
  shovelBuffDurationMs: 0,
  shovelTimerMs: 0,
  nextShovelAtMs: 0,
  mahouts: [],
  fogRadius: null, // Радиус видимости для тумана
  camera: {
    x: 0,
    y: 0,
    yaw: 0,
    fov: 240,
    back: 130,
    lerp: 0.14,
    worldHalfWidth: 260,
    horizonY: 92,
    bottomY: 392,
    fogNear: 140,
    fogFar: 520
  }
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
  state.sessionApples = 0;
  state.comboApples = 0;
  state.gameSpeed = CONFIG.INITIAL_SPEED;
  state.baseGameSpeed = CONFIG.INITIAL_SPEED;
  state.speedFactor = 1;
  state.isPaused = false;
  state.currentLevel = 1;
  state.currentLevelConfig = LEVELS[0];
  state.combo = 0;
  state.particles = [];
  state.floatTexts = [];
  state.digestGlowMs = 0;
  state.shakeTimeMs = 0;
  state.shakeDurationMs = 0;
  state.shakeMagnitudePx = 0;
  state.headPopTimeMs = 0;
  state.headPopDurationMs = 0;
  state.highScoreFxTimeMs = 0;
  state.brokeRecordThisRun = false;
  state.nowMs = 0;
  state.lastFrameTimeMs = 0;
  state.accumulatorMs = 0;
  state.obstacles = [];
  state.manure = [];
  state.poops = state.manure;
  state.pendingManureSpawns = [];
  state.slowTimeMs = 0;
  state.slowDurationMs = 0;
  state.shovel = null;
  state.shovelBuffTimeMs = 0;
  state.shovelBuffDurationMs = 0;
  state.shovelTimerMs = 0;
  state.nextShovelAtMs = 0;
  state.mahouts = [];
  state.fogRadius = null;
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  
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
