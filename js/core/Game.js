import { CONFIG } from '../utils/config.js';
import { state } from '../utils/state.js';
import Snake from './Snake.js';

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set canvas size
    this.canvas.width = CONFIG.CANVAS_SIZE;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    
    // Menu elements
    this.mainMenu = document.getElementById('mainMenu');
    this.startBtn = document.getElementById('startBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.difficultySelect = document.getElementById('difficultySelect');
    this.volumeValue = document.getElementById('volumeValue');
    this.menuHighScore = document.getElementById('menuHighScore');
    
    // Game over screen
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalHighScoreEl = document.getElementById('finalHighScore');
    this.restartBtn = document.getElementById('restartBtn');
    
    // Pause overlay
    this.pauseOverlay = document.getElementById('pauseOverlay');
    
    // Speed display
    this.speedDisplay = document.getElementById('speedDisplay');
    
    // Mute button
    this.muteBtn = document.getElementById('muteBtn');
    
    // Leaderboard
    this.leaderboardBtn = document.getElementById('leaderboardBtn');
    this.leaderboardModal = document.getElementById('leaderboardModal');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.clearLeaderboardBtn = document.getElementById('clearLeaderboardBtn');
    this.closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    
    // Skins
    this.skinsBtn = document.getElementById('skinsBtn');
    this.skinsModal = document.getElementById('skinsModal');
    this.skinsList = document.getElementById('skinsList');
    this.closeSkinsBtn = document.getElementById('closeSkinsBtn');
    
    // Daily challenges
    this.dailyBtn = document.getElementById('dailyBtn');
    this.dailyModal = document.getElementById('dailyModal');
    this.dailyList = document.getElementById('dailyList');
    this.dailyTimer = document.getElementById('dailyTimer');
    this.dailyTotalReward = document.getElementById('dailyTotalReward');
    this.closeDailyBtn = document.getElementById('closeDailyBtn');
    
    // Statistics
    this.statsBtn = document.getElementById('statsBtn');
    this.statsModal = document.getElementById('statsModal');
    this.statsContent = document.getElementById('statsContent');
    this.resetStatsBtn = document.getElementById('resetStatsBtn');
    this.closeStatsBtn = document.getElementById('closeStatsBtn');
    
    // Load settings and init
    this.loadSettings();
    this.updateMenuHighScore();
    this.resizeCanvas();
    
    // Initialize snake and renderer
    this.snake = new Snake();
    this.lastUpdate = 0;
    this.frameCount = 0;
    this.poopTimer = 0;
    this.broomTimer = 0;
    this.hammerTimer = 0;
    
    // Setup handlers
    this.setupMenuHandlers();
    this.setupLeaderboardHandlers();
    this.setupSkinsHandlers();
    this.setupDailyHandlers();
    this.setupStatsHandlers();
    
    state.isRunning = false;
  }

  setupMenuHandlers() {
    this.startBtn.addEventListener('click', () => {
      this.startGameFromMenu();
    });
    
    this.volumeSlider.addEventListener('input', (e) => {
      CONFIG.volume = e.target.value / 100;
      this.volumeValue.textContent = e.target.value;
      this.saveSettings();
    });
    
    this.difficultySelect.addEventListener('change', (e) => {
      this.setDifficulty(e.target.value);
      this.saveSettings();
    });
  }

  startGameFromMenu() {
    this.mainMenu.classList.add('hidden');
    
    document.getElementById('scoreDisplay').classList.remove('hidden');
    document.getElementById('highScoreDisplay').classList.remove('hidden');
    document.getElementById('speedDisplay').classList.remove('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    
    this.reset();
    this.updateScoreDisplay();
    this.updateSpeedDisplay();
  }

  setDifficulty(level) {
    switch(level) {
      case 'easy':
        state.obstacleInterval = 20;
        state.poopInterval = 15;
        break;
      case 'normal':
        state.obstacleInterval = 10;
        state.poopInterval = 10;
        break;
      case 'hard':
        state.obstacleInterval = 5;
        state.poopInterval = 7;
        break;
    }
    state.gameSpeed = CONFIG.INITIAL_SPEED;
  }

  loadSettings() {
    const saved = localStorage.getItem('snakeSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      CONFIG.volume = settings.volume || 0.5;
      this.volumeSlider.value = (settings.volume || 0.5) * 100;
      this.volumeValue.textContent = Math.round((settings.volume || 0.5) * 100);
      this.difficultySelect.value = settings.difficulty || 'normal';
      this.setDifficulty(settings.difficulty || 'normal');
    }
  }

  saveSettings() {
    const settings = {
      volume: CONFIG.volume,
      difficulty: this.difficultySelect.value
    };
    localStorage.setItem('snakeSettings', JSON.stringify(settings));
  }

  loadMuteState() {
    const muted = localStorage.getItem('snakeMuted') === 'true';
    state.muted = muted;
    this.updateMuteButton();
  }

  toggleMute() {
    state.muted = !state.muted;
    localStorage.setItem('snakeMuted', state.muted);
    this.updateMuteButton();
  }

  updateMuteButton() {
    this.muteBtn.textContent = state.muted ? '🔇' : '🔊';
  }

  loadAchievements() {
    const saved = localStorage.getItem('snakeAchievements');
    if (saved) {
      state.achievements = JSON.parse(saved);
    }
  }

  updateScoreDisplay() {
    document.getElementById('scoreDisplay').textContent = `Счёт: ${state.score}`;
    document.getElementById('highScoreDisplay').textContent = `Рекорд: ${state.highScore}`;
  }

  updateSpeedDisplay() {
    const speedMultiplier = (CONFIG.INITIAL_SPEED / state.gameSpeed).toFixed(1);
    this.speedDisplay.textContent = `Скорость: ${speedMultiplier}x`;
  }

  reset() {
    state.score = 0;
    state.snake = [{x: 10, y: 10}];
    state.food = null;
    state.isRunning = false;
    state.isPaused = false;
    state.gameSpeed = CONFIG.INITIAL_SPEED;
    state.hasTea = false;
    state.teaTimer = 0;
    state.poop = [];
    state.broom = null;
    state.broomActive = false;
    state.obstacles = [];
    state.hammer = null;
    state.hasHammer = false;
    
    this.foodEaten = 0;
    this.broomsCollected = 0;
    this.gameStartTime = Date.now();
    this.lastStatsUpdate = Date.now();
    
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
      gameOverScreen.classList.add('hidden');
    }
    
    this.snake.reset();
    this.spawnFood();
    this.updateScoreDisplay();
    this.updateSpeedDisplay();
  }

  resizeCanvas() {
    const maxSize = Math.min(
      window.innerWidth * 0.95,
      window.innerHeight * 0.85
    );
    
    const size = Math.floor(maxSize / CONFIG.GRID) * CONFIG.GRID;
    
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
  }

  start() {
    state.isRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!state.isRunning) return;
    
    if (state.isPaused) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }
    
    const now = Date.now();
    if (now - this.lastUpdate >= state.gameSpeed) {
      this.update();
      this.render();
      this.lastUpdate = now;
    }
    
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.snake.move();
    this.frameCount++;
    
    if (state.food) {
      const head = this.snake.segments[0];
      if (head.x === state.food.x && head.y === state.food.y) {
        this.snake.grow();
        state.score++;
        this.updateScoreDisplay();
        this.checkSpeedIncrease();
        this.checkAchievements();
        
        state.isEating = true;
        state.eatTimer = 5;
        
        this.spawnFood();
      }
    }
    
    if (this.snake.checkSelfCollision() || 
        this.snake.checkWallCollision(this.canvas.width, this.canvas.height)) {
      this.gameOver();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= CONFIG.CANVAS_SIZE; i += CONFIG.GRID) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, CONFIG.CANVAS_SIZE);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(CONFIG.CANVAS_SIZE, i);
      this.ctx.stroke();
    }
    
    // Draw food
    if (state.food) {
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(state.food.x, state.food.y, CONFIG.GRID - 2, CONFIG.GRID - 2);
    }
    
    // Draw snake
    this.ctx.fillStyle = '#2196F3';
    this.snake.segments.forEach((segment, index) => {
      this.ctx.fillRect(segment.x, segment.y, CONFIG.GRID - 2, CONFIG.GRID - 2);
    });
  }

  spawnFood() {
    const gridSize = CONFIG.GRID;
    const maxX = Math.floor(this.canvas.width / gridSize) - 1;
    const maxY = Math.floor(this.canvas.height / gridSize) - 1;
    
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * maxX) * gridSize,
        y: Math.floor(Math.random() * maxY) * gridSize
      };
    } while (this.isPositionOccupied(newFood));
    
    state.food = newFood;
  }

  isPositionOccupied(pos) {
    if (this.snake.segments.some(seg => seg.x === pos.x && seg.y === pos.y)) {
      return true;
    }
    
    if (state.food && state.food.x === pos.x && state.food.y === pos.y) {
      return true;
    }
    
    return false;
  }

  checkSpeedIncrease() {
    if (state.score > 0 && state.score % 5 === 0) {
      const oldSpeed = state.gameSpeed;
      state.gameSpeed = Math.max(
        CONFIG.MIN_SPEED,
        state.gameSpeed * CONFIG.SPEED_MULTIPLIER
      );
      
      if (oldSpeed !== state.gameSpeed) {
        this.showSpeedNotification();
        this.updateSpeedDisplay();
      }
    }
  }

  showSpeedNotification() {
    const el = document.createElement('div');
    el.textContent = 'СКОРОСТЬ!';
    el.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 32px; color: #FF6B6B;
      text-shadow: 0 0 10px rgba(255,107,107,0.8);
      z-index: 300; pointer-events: none;
      animation: fadeOut 1.5s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  checkAchievements() {
    if (state.achievements) {
      state.achievements.forEach(ach => {
        if (ach.unlocked) return;
        
        if (state.score >= ach.threshold) {
          ach.unlocked = true;
          ach.unlockedAt = new Date().toISOString();
          this.showNotification(`🏆 Достижение: ${ach.name}`);
        }
      });
    }
  }

  showNotification(message) {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: rgba(0,0,0,0.8); color: white;
      padding: 10px 15px; border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  gameOver() {
    state.isRunning = false;
    
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
    }
    
    this.finalScoreEl.textContent = state.score;
    this.finalHighScoreEl.textContent = state.highScore;
    this.gameOverScreen.classList.remove('hidden');
    
    setTimeout(() => {
      this.gameOverScreen.classList.add('hidden');
      this.returnToMenu();
    }, 3000);
  }

  returnToMenu() {
    document.getElementById('scoreDisplay').classList.add('hidden');
    document.getElementById('highScoreDisplay').classList.add('hidden');
    document.getElementById('speedDisplay').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    
    this.mainMenu.classList.remove('hidden');
    this.updateMenuHighScore();
  }

  updateMenuHighScore() {
    this.menuHighScore.textContent = state.highScore;
  }

  setupLeaderboardHandlers() {
    this.leaderboardBtn.addEventListener('click', () => {
      this.showLeaderboard();
    });
    
    this.closeLeaderboardBtn.addEventListener('click', () => {
      this.hideLeaderboard();
    });
    
    this.clearLeaderboardBtn.addEventListener('click', () => {
      if (confirm('Очистить таблицу лидеров?')) {
        state.leaderboard = [];
        localStorage.setItem('snakeLeaderboard', JSON.stringify(state.leaderboard));
        this.updateLeaderboardDisplay();
      }
    });
  }

  showLeaderboard() {
    this.leaderboardModal.classList.remove('hidden');
    this.updateLeaderboardDisplay();
  }

  hideLeaderboard() {
    this.leaderboardModal.classList.add('hidden');
  }

  updateLeaderboardDisplay() {
    this.leaderboardList.innerHTML = '';
    
    if (state.leaderboard && state.leaderboard.length > 0) {
      state.leaderboard.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        div.innerHTML = `
          <span class="rank">#${index + 1}</span>
          <span class="score">${entry.score}</span>
          <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
        `;
        this.leaderboardList.appendChild(div);
      });
    } else {
      this.leaderboardList.innerHTML = '<p>Пока нет рекордов</p>';
    }
  }

  setupSkinsHandlers() {
    this.skinsBtn.addEventListener('click', () => {
      this.showSkins();
    });
    
    this.closeSkinsBtn.addEventListener('click', () => {
      this.hideSkins();
    });
  }

  showSkins() {
    this.skinsModal.classList.remove('hidden');
    this.renderSkinsList();
  }

  hideSkins() {
    this.skinsModal.classList.add('hidden');
  }

  renderSkinsList() {
    this.skinsList.innerHTML = '';
    
    CONFIG.SKINS.forEach(skin => {
      const div = document.createElement('div');
      div.className = 'skin-card';
      div.innerHTML = `
        <div class="skin-preview" style="background-color: ${skin.color}"></div>
        <div class="skin-info">
          <h3>${skin.name}</h3>
          <p>Разблокируется: ${skin.unlockAt} очков</p>
        </div>
      `;
      
      div.addEventListener('click', () => {
        this.selectSkin(skin.id);
      });
      
      this.skinsList.appendChild(div);
    });
  }

  selectSkin(skinId) {
    state.selectedSkin = skinId;
    localStorage.setItem('selectedSkin', skinId);
    this.showNotification(`Скин изменён на: ${skinId}`);
  }

  setupDailyHandlers() {
    this.dailyBtn.addEventListener('click', () => {
      this.showDaily();
    });
    
    this.closeDailyBtn.addEventListener('click', () => {
      this.hideDaily();
    });
  }

  showDaily() {
    this.dailyModal.classList.remove('hidden');
    this.renderDailyChallenges();
  }

  hideDaily() {
    this.dailyModal.classList.add('hidden');
  }

  renderDailyChallenges() {
    this.dailyList.innerHTML = '';
    
    if (state.dailyChallenges && state.dailyChallenges.challenges) {
      state.dailyChallenges.challenges.forEach(challenge => {
        const div = document.createElement('div');
        div.className = 'daily-challenge';
        div.innerHTML = `
          <h4>${challenge.name}</h4>
          <p>Прогресс: ${challenge.progress || 0}/${challenge.target}</p>
        `;
        this.dailyList.appendChild(div);
      });
    }
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (state.dailyChallenges.date !== today) {
      this.generateDailyChallenges();
      state.dailyChallenges.date = today;
    }
  }

  generateDailyChallenges() {
    const shuffled = [...CONFIG.DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    state.dailyChallenges.challenges = selected.map(challenge => ({
      ...challenge,
      progress: 0
    }));
  }

  startDailyTimer() {
    // Timer logic would go here
  }

  setupStatsHandlers() {
    this.statsBtn.addEventListener('click', () => {
      this.showStats();
    });
    
    this.closeStatsBtn.addEventListener('click', () => {
      this.hideStats();
    });
    
    this.resetStatsBtn.addEventListener('click', () => {
      if (confirm('Сбросить всю статистику?')) {
        state.stats = {
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0,
          totalTimePlayed: 0,
          totalFoodEaten: 0,
          totalBroomsCollected: 0,
          totalPoopLeft: 0,
          totalObstaclesHit: 0,
          totalHammerCollected: 0,
          achievementsUnlocked: 0,
          skinsUnlocked: 1,
          lastPlayed: null
        };
        localStorage.setItem('snakeStats', JSON.stringify(state.stats));
        this.renderStats();
        this.showNotification('📊 Статистика сброшена');
      }
    });
  }

  showStats() {
    this.statsModal.classList.remove('hidden');
    this.renderStats();
  }

  hideStats() {
    this.statsModal.classList.add('hidden');
  }

  renderStats() {
    this.statsContent.innerHTML = '';
    
    const stats = state.stats || {};
    
    const html = `
      <div class="stat-card">
        <h3>🎮 Игр сыграно</h3>
        <p>${stats.gamesPlayed || 0}</p>
      </div>
      <div class="stat-card">
        <h3>🏆 Лучший счёт</h3>
        <p>${stats.bestScore || 0}</p>
      </div>
      <div class="stat-card">
        <h3>⏱️ Время игры</h3>
        <p>${Math.floor((stats.totalTimePlayed || 0) / 60)} минут</p>
      </div>
    `;
    
    this.statsContent.innerHTML = html;
  }
}
