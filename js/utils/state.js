export const state = {
  snake: [],
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || 0),
  isRunning: false,
  currentLevel: 1,
  gameSpeed: 400,
  isEating: false,  // флаг для анимации
  eatTimer: 0,     // таймер анимации
  poop: [],        // массив {x, y} куч
  poopInterval: 10, // как часто оставляет (каждые 10 тиков)
  broom: null,     // {x, y} или null
  broomActive: false,
  obstacles: [],   // массив {x, y, type: 'stone'|'log'|...}
  obstacleInterval: 10 // камень каждые 10 очков
};
