export const CONFIG = {
  GRID: 32,
  // Адаптивные размеры - определяются в runtime
  CANVAS_WIDTH: null,  // будет установлено в Game.js
  CANVAS_HEIGHT: null, // будет установлено в Game.js
  BASE_SPEED: 150,
  BOOST_SPEED: 80,
  BOOST_MULTIPLIER: 0.5,
  
  COLORS: {
    snakeHead: '#7de3ff',
    snakeBody: '#3db6dc',
    food: '#87f59a',
    obstacle: '#757575',
    star: '#FFD700',
    hammer: '#FF9800'
  },
  
  EMOJIS: {
    snakeHead: '🐍',
    food: '🍎',
    obstacle: '🪨',
    star: '⭐',
    hammer: '🔨'
  },
  
  debug: true
};
