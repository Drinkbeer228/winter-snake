export const state = {
  snake: [],
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || 0),
  isRunning: false,
  currentLevel: 1,
  gameSpeed: 400,
  isEating: false,  // флаг для анимации
  eatTimer: 0      // таймер анимации
};
