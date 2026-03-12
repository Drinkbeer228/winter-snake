// === КОНФИГУРАЦИЯ ИГРЫ ===
const CONFIG = {
  GRID: 20,
  CANVAS_SIZE: 400,
  INITIAL_SPEED: 400, // Ещё уменьшили с 200 до 400 (в 2 раза медленнее)
  MIN_SPEED: 50,
  SPEED_DECREMENT: 10,
  SPEED_INTERVAL: 50,
  BONUS_FOOD_CHANCE: 0.1,
  BONUS_FOOD_TIMEOUT: 5000,
  COMBO_TIMEOUT: 3000,
  LEVEL_SCORE_INTERVAL: 100,
  MAX_LEVEL: 5
};

// === ЦВЕТА ===
const COLORS = {
  SNAKE_HEAD: '#2ecc71',
  SNAKE_BODY: '#27ae60',
  FOOD: '#ff3b3b',
  BONUS_FOOD: '#ffd700',
  BG_TOP: '#0f1c16',
  BG_BOTTOM: '#050907',
  FOOD_GLOW: '#ffffff'
};

// === УРОВНИ (5 ступеней прогрессии) ===
const LEVELS = [
  {
    level: 1,
    scoreThreshold: 0,
    name: 'Летний луг',
    speed: 400, // Очень медленно для новичков
    visuals: { 
      bgTop: '#0f1c16', 
      bgBottom: '#050907', 
      snowSpeed: 1,
      fogOpacity: 0
    },
    mechanics: { 
      obstacles: false, 
      fog: false, 
      movingFood: false,
      description: 'Классическая игра'
    }
  },
  {
    level: 2,
    scoreThreshold: 100,
    name: 'Тёплый ветер',
    speed: 300, // +25% быстрее (было 150)
    visuals: { 
      bgTop: '#0f1c16', 
      bgBottom: '#050907', 
      snowSpeed: 2,
      fogOpacity: 0
    },
    mechanics: { 
      obstacles: false, 
      fog: false, 
      movingFood: true,
      description: 'Еда двигается, скорость выше'
    }
  },
  {
    level: 3,
    scoreThreshold: 200,
    name: 'Тропинки',
    speed: 240, // +20% быстрее (было 120)
    visuals: { 
      bgTop: '#0f1c16', 
      bgBottom: '#050907', 
      snowSpeed: 1.5,
      fogOpacity: 0
    },
    mechanics: { 
      obstacles: true, 
      fog: false, 
      movingFood: true,
      obstacleCount: 4,
      description: 'Ледяные препятствия'
    }
  },
  {
    level: 4,
    scoreThreshold: 300,
    name: 'Туман над лугом',
    speed: 180, // +25% быстрее (было 90)
    visuals: { 
      bgTop: '#0f1c16', 
      bgBottom: '#050907', 
      snowSpeed: 1,
      fogOpacity: 0.7,
      fogRadius: 5 * CONFIG.GRID
    },
    mechanics: { 
      obstacles: true, 
      fog: true, 
      movingFood: true,
      obstacleCount: 6,
      description: 'Ограниченная видимость'
    }
  },
  {
    level: 5,
    scoreThreshold: 400,
    name: 'Светлячки',
    speed: 120, // +33% быстрее (было 60)
    visuals: { 
      bgTop: '#0f1c16', 
      bgBottom: '#050907', 
      snowSpeed: 0.5,
      fogOpacity: 0.3,
      fogRadius: 8 * CONFIG.GRID,
      auroraEffect: true
    },
    mechanics: { 
      obstacles: true, 
      fog: true, 
      movingFood: true,
      obstacleCount: 8,
      bonusFoodChance: 0.2, // Больше бонусов
      description: 'Легендарный режим'
    }
  }
];
