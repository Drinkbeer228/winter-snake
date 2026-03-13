export const state = {
  snake: [],
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || 0),
  isRunning: false,
  currentLevel: 1,
  gameSpeed: 400
};
