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
  SNAKE_HEAD: '#87ceeb',
  SNAKE_BODY: '#4fc3f7',
  FOOD: '#ff80ab',
  BONUS_FOOD: '#ffd700',
  BG_TOP: '#1e3a50',
  BG_BOTTOM: '#0a1624',
  FOOD_GLOW: '#ffffff'
};

// === УРОВНИ (5 ступеней прогрессии) ===
const LEVELS = [
  {
    level: 1,
    scoreThreshold: 0,
    name: 'Зимний лес',
    speed: 400, // Очень медленно для новичков
    visuals: { 
      bgTop: '#1a3a52', 
      bgBottom: '#0a1624', 
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
    name: 'Снежная буря',
    speed: 300, // +25% быстрее (было 150)
    visuals: { 
      bgTop: '#2c3e50', 
      bgBottom: '#0a0f16', 
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
    name: 'Ледяные блоки',
    speed: 240, // +20% быстрее (было 120)
    visuals: { 
      bgTop: '#34495e', 
      bgBottom: '#0d131a', 
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
    name: 'Туман',
    speed: 180, // +25% быстрее (было 90)
    visuals: { 
      bgTop: '#1b2631', 
      bgBottom: '#0a1016', 
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
    name: 'Северное сияние',
    speed: 120, // +33% быстрее (было 60)
    visuals: { 
      bgTop: '#0f1419', 
      bgBottom: '#05080a', 
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
