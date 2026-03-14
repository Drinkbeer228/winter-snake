export const CONFIG = {
  GRID: 20,
  CANVAS_SIZE: 400,
  INITIAL_SPEED: 400,
  MIN_SPEED: 50,
  SPEED_MULTIPLIER: 0.9,  // Каждые 5 очков скорость * 0.9
  soundEnabled: true,
  volume: 0.5,
  debug: true
};

export const COLORS = {
  SNAKE_HEAD: '#2ecc71',
  SNAKE_BODY: '#27ae60', 
  FOOD: '#ff3b3b',
  BG_TOP: '#0f1c16',
  BG_BOTTOM: '#050907',
  
  // Новые цвета
  POOP: '#8B4513',
  BROOM: '#FFD700',
  OBSTACLE: '#808080',
  HAMMER: '#CD853F'
};

export const SKINS = [
  {
    id: 'classic',
    name: 'Классическая',
    colors: { head: '#2ecc71', body: '#27ae60' },
    unlockAt: 0,  // Доступен сразу
    description: 'Стандартная змейка'
  },
  {
    id: 'gold',
    name: 'Золотая',
    colors: { head: '#FFD700', body: '#FFA500' },
    unlockAt: 25,  // 25 очков
    description: 'Для опытных игроков'
  },
  {
    id: 'red',
    name: 'Красная',
    colors: { head: '#e74c3c', body: '#c0392b' },
    unlockAt: 50,  // 50 очков
    description: 'Опасная и быстрая'
  },
  {
    id: 'blue',
    name: 'Синяя',
    colors: { head: '#3498db', body: '#2980b9' },
    unlockAt: 75,  // 75 очков
    description: 'Холодная как лёд'
  },
  {
    id: 'rainbow',
    name: 'Радужная',
    colors: { head: '#ff00ff', body: '#00ffff' },
    unlockAt: 100,  // 100 очков
    description: 'Легендарная змейка'
  },
  {
    id: 'postal',
    name: 'ЧАЕЧКА',
    colors: { head: '#FF6B6B', body: '#FF8E8E' },
    unlockAt: 'secret',  // Секретный скин
    description: '??? ( Postal 2 отсылка )'
  }
];

export const LEVELS = []; // Один бесконечный уровень
