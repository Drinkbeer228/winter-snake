export const state = {
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
  snake: [{x: 10, y: 10}],
  food: null,
  isRunning: false,
  isPaused: false,
  gameSpeed: 400,
  hasTea: false,
  teaTimer: 0,
  poop: [],
  broom: null,
  broomActive: false,
  obstacles: [],
  hammer: null,
  hasHammer: false,
  obstacleInterval: 10,
  poopInterval: 10,
  muted: false,
  achievements: [],
  leaderboard: [],
  dailyChallenges: {
    date: localStorage.getItem('snakeDailyDate') || new Date().toDateString(),
    challenges: JSON.parse(localStorage.getItem('snakeDailyChallenges') || '[]'),
    completed: JSON.parse(localStorage.getItem('snakeDailyCompleted') || '[]')
  },
  stats: JSON.parse(localStorage.getItem('snakeStats') || '{}')
};
