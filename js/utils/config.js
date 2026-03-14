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

export const DAILY_CHALLENGES = [
  {
    id: 'score_10',
    name: 'Первая десятка',
    description: 'Набери 10 очков за игру',
    type: 'score',
    target: 10,
    reward: 5  // бонусные очки
  },
  {
    id: 'score_25',
    name: 'Опытный',
    description: 'Набери 25 очков за игру',
    type: 'score',
    target: 25,
    reward: 10
  },
  {
    id: 'score_50',
    name: 'Мастер',
    description: 'Набери 50 очков за игру',
    type: 'score',
    target: 50,
    reward: 20
  },
  {
    id: 'eat_20',
    name: 'Обжора',
    description: 'Съешь 20 яблок за игру',
    type: 'food_eaten',
    target: 20,
    reward: 10
  },
  {
    id: 'survive_2min',
    name: 'Долгожитель',
    description: 'Продержись 2 минуты',
    type: 'time_survived',
    target: 120,  // секунды
    reward: 15
  },
  {
    id: 'clean_poop',
    name: 'Чистюля',
    description: 'Собери 3 метлы за игру',
    type: 'broom_collected',
    target: 3,
    reward: 10
  },
  {
    id: 'no_death',
    name: 'Бессмертный',
    description: 'Достигни 30 очков без смерти',
    type: 'score_no_death',
    target: 30,
    reward: 25
  }
];

export const LEVELS = []; // Один бесконечный уровень
