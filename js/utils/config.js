export const CONFIG = {
  GRID: 20,
  CANVAS_SIZE: 400,
  INITIAL_SPEED: 400,
  MIN_SPEED: 50,
  SPEED_MULTIPLIER: 0.9,
  soundEnabled: true,
  volume: 0.5,
  debug: true,
  
  SKINS: [
    { id: 'classic', name: 'Классика', color: '#4CAF50', unlockAt: 0 },
    { id: 'fire', name: 'Огонь', color: '#FF5722', unlockAt: 25 },
    { id: 'ice', name: 'Лёд', color: '#00BCD4', unlockAt: 50 },
    { id: 'gold', name: 'Золото', color: '#FFD700', unlockAt: 100 },
    { id: 'shadow', name: 'Тень', color: '#9C27B0', unlockAt: 150 },
    { id: 'postal', name: 'ЧАЕЧКА', color: '#8B4513', unlockAt: 200 }
  ],
  
  ACHIEVEMENTS: [
    { id: 'first_food', name: 'Первая еда', threshold: 1, description: 'Съешь первую еду' },
    { id: 'score_10', name: '10 очков', threshold: 10, description: 'Набери 10 очков' },
    { id: 'score_25', name: '25 очков', threshold: 25, description: 'Набери 25 очков' },
    { id: 'score_50', name: '50 очков', threshold: 50, description: 'Набери 50 очков' }
  ],
  
  DAILY_CHALLENGES: [
    { id: 'food_10', name: 'Съешь 10 еды', type: 'food', target: 10, reward: 10 },
    { id: 'brooms_3', name: 'Собери 3 метлы', type: 'broom', target: 3, reward: 15 },
    { id: 'poop_5', name: 'Оставь 5 куч', type: 'poop', target: 5, reward: 20 },
    { id: 'score_30', name: 'Набери 30 очков', type: 'score', target: 30, reward: 25 },
    { id: 'obstacles_2', name: 'Разбей 2 камня', type: 'obstacle', target: 2, reward: 30 },
    { id: 'hammers_2', name: 'Собери 2 молота', type: 'hammer', target: 2, reward: 35 }
  ]
};
