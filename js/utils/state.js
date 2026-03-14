export const state = {
  // Игра
  snake: [],
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || 0),
  isRunning: false,
  isPaused: false,
  gameSpeed: 400,
  
  // Настройки
  muted: false,
  difficulty: 'normal',
  
  // Механики
  poop: [],
  broom: null,
  obstacles: [],
  hammer: null,
  hasHammer: false,
  hasTea: false,
  teaTimer: 0,
  isEating: false,
  eatTimer: 0,
  
  // Прогрессия
  leaderboard: [],
  achievements: [],
  dailyChallenges: { date: '', challenges: [], completed: [] },
  stats: {},
  
  // Интервалы
  obstacleInterval: 10,
  poopInterval: 10
};
