export const state = {
  snake: [],
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || 0),
  isRunning: false,
  isPaused: false,
  currentLevel: 1,
  gameSpeed: 400,
  isEating: false,  // флаг для анимации
  eatTimer: 0,     // таймер анимации
  poop: [],        // массив {x, y} куч
  poopInterval: 10, // как часто оставляет (каждые 10 тиков)
  broom: null,     // {x, y} или null
  broomActive: false,
  obstacles: [],   // массив {x, y, type: 'stone'|'log'|...}
  obstacleInterval: 10, // камень каждые 10 очков
  hammer: null,    // {x, y} или null
  hasHammer: false, // игрок подобрал молот
  hasTea: false,  // Postal 2 чай активирован
  teaTimer: 0,    // таймер действия чая
  achievements: [
    { id: 'first_10', name: 'Первая десятка', desc: 'Набери 10 очков', threshold: 10, unlocked: false },
    { id: 'first_50', name: 'Опытный', desc: 'Набери 50 очков', threshold: 50, unlocked: false },
    { id: 'master', name: 'Мастер свайпов', desc: 'Набери 100 очков', threshold: 100, unlocked: false }
  ],
  leaderboard: JSON.parse(localStorage.getItem('snakeLeaderboard') || '[]'),
  selectedSkin: localStorage.getItem('snakeSelectedSkin') || 'classic',
  unlockedSkins: JSON.parse(localStorage.getItem('snakeUnlockedSkins') || '["classic"]'),
  dailyChallenges: {
    date: localStorage.getItem('snakeDailyDate') || new Date().toDateString(),
    challenges: JSON.parse(localStorage.getItem('snakeDailyChallenges') || '[]'),
    completed: JSON.parse(localStorage.getItem('snakeDailyCompleted') || '[]')
  },
  dailyReward: parseInt(localStorage.getItem('snakeDailyReward') || '0')
};
