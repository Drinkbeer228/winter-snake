import { CONFIG } from '../utils/config.js';
import { state } from '../utils/state.js';
import Snake from './Snake.js';
import Renderer from './Renderer.js';
import { initInput } from './Input.js';
import { spawnParticles, updateAndDrawParticles } from '../utils/Particles.js';
import { playSound } from '../utils/audio.js';
import { COLORS } from '../utils/config.js';

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
    
    // Setup handlers
    this.setupMenuHandlers();
    this.setupLeaderboardHandlers();
    this.setupSkinsHandlers();
    this.setupDailyHandlers();
    this.setupStatsHandlers();
    
    // Update displays
    this.updateLeaderboardDisplay();
    this.renderSkinsList();
    
    // Daily challenges init
    this.checkDailyReset();
    this.renderDailyChallenges();
    this.startDailyTimer();
    
    // Statistics init
    this.initStats();
    this.renderStats();
    
    // Initialize snake and renderer
    this.snake = new Snake();
    this.renderer = new Renderer(this.ctx);
    this.lastUpdate = 0;
    this.frameCount = 0;
    this.poopTimer = 0;
    this.broomTimer = 0;
    this.hammerTimer = 0;
    
    // Event handlers
    this.restartBtn.addEventListener('click', () => {
      this.reset();
    });
    
    this.muteBtn.addEventListener('click', () => {
      this.toggleMute();
    });
    
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Escape') && state.isRunning) {
        e.preventDefault();
        this.togglePause();
      }
      
      if (e.code === 'KeyR' && !state.isRunning && !this.gameOverScreen.classList.contains('hidden')) {
        this.reset();
      }
    });
    
    window.addEventListener('resize', () => this.resizeCanvas());
    
    state.isRunning = false;
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
    
    if (state.hasTea) {
      state.teaTimer--;
      if (state.teaTimer <= 0) {
        state.hasTea = false;
        state.gameSpeed = CONFIG.INITIAL_SPEED;
        this.updateSpeedDisplay();
      }
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
    this.poopTimer++;
    this.broomTimer++;
    this.hammerTimer++;
    
    if (this.poopTimer >= state.poopInterval && state.score >= 3) {
      this.addPoop();
      this.poopTimer = 0;
    }
    
    if (this.broomTimer >= 200 && state.poop.length > 0 && !state.broom) {
      this.spawnBroom();
      this.broomTimer = 0;
    }
    
    if (this.hammerTimer >= 300 && state.obstacles.length > 0 && !state.hammer) {
      this.spawnHammer();
      this.hammerTimer = 0;
    }
    
    if (state.broom) {
      const head = this.snake.segments[0];
      if (head.x === state.broom.x && head.y === state.broom.y) {
        this.collectBroom();
      }
    }
    
    if (state.hammer) {
      const head = this.snake.segments[0];
      if (head.x === state.hammer.x && head.y === state.hammer.y) {
        this.collectHammer();
      }
    }
    
    if (state.score > 0 && state.score % state.obstacleInterval === 0) {
      const lastObstacleScore = state.obstacles.length * state.obstacleInterval;
      if (state.score === lastObstacleScore + state.obstacleInterval) {
        this.spawnObstacle();
      }
    }
    
    if (this.checkObstacleCollision()) {
      this.gameOver();
    }
    
    if (state.score >= 5 && state.food) {
      if (this.frameCount % 30 === 0) {
        this.moveFood();
      }
    }
    
    if (state.food) {
      const head = this.snake.segments[0];
      if (head.x === state.food.x && head.y === state.food.y) {
        this.snake.grow();
        state.score++;
        this.updateScoreDisplay();
        this.checkSpeedIncrease();
        this.checkAchievements();
        
        if (state.score === 50 && !state.hasTea) {
          this.activateTea();
        }
        
        state.isEating = true;
        state.eatTimer = 5;
        
        playSound('eat');
        spawnParticles(this.ctx, state.food.x, state.food.y, COLORS.food);
        
        this.spawnFood();
        this.updateStats('food', 1);
      }
    }
    
    if (this.snake.checkSelfCollision() || 
        this.snake.checkWallCollision(this.canvas.width, this.canvas.height)) {
      this.gameOver();
    }
  }

  render() {
    this.renderer.clear();
    this.renderer.drawGrid();
    this.renderer.drawPoop(state.poop);
    
    if (state.broom) {
      this.renderer.drawBroom(state.broom);
    }
    
    if (state.hammer) {
      this.renderer.drawHammer(state.hammer);
    }
    
    this.renderer.drawObstacles(state.obstacles);
    this.renderer.drawFood(state.food);
    this.renderer.drawSnake(this.snake.segments, state.selectedSkin);
    
    if (state.hasTea) {
      this.renderer.drawTeaTimer(state.teaTimer);
    }
    
    updateAndDrawParticles(this.ctx);
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

  moveFood() {
    const directions = [
      {x: CONFIG.GRID, y: 0},
      {x: -CONFIG.GRID, y: 0},
      {x: 0, y: CONFIG.GRID},
      {x: 0, y: -CONFIG.GRID}
    ];
    
    const validDirections = directions.filter(dir => {
      const newX = state.food.x + dir.x;
      const newY = state.food.y + dir.y;
      
      if (newX >= 0 && newX < this.canvas.width && 
          newY >= 0 && newY < this.canvas.height) {
        state.food.x = newX;
        state.food.y = newY;
        return true;
      }
      return false;
    });
    
    if (validDirections.length > 0) {
      const randomDir = validDirections[Math.floor(Math.random() * validDirections.length)];
      state.food.x += randomDir.x;
      state.food.y += randomDir.y;
    }
  }

  addPoop() {
    const tail = this.snake.segments[this.snake.segments.length - 1];
    state.poop.push({x: tail.x, y: tail.y});
  }

  spawnBroom() {
    if (state.broom) return;
    
    const gridSize = CONFIG.GRID;
    const maxX = Math.floor(this.canvas.width / gridSize) - 1;
    const maxY = Math.floor(this.canvas.height / gridSize) - 1;
    
    state.broom = {
      x: Math.floor(Math.random() * maxX) * gridSize,
      y: Math.floor(Math.random() * maxY) * gridSize
    };
  }

  collectBroom() {
    state.broom = null;
    state.poop = [];
    state.score += 1;
    this.updateStats('broom', 1);
  }

  spawnObstacle() {
    const gridSize = CONFIG.GRID;
    const maxX = Math.floor(this.canvas.width / gridSize) - 1;
    const maxY = Math.floor(this.canvas.height / gridSize) - 1;
    
    const newObstacle = {
      x: Math.floor(Math.random() * maxX) * gridSize,
      y: Math.floor(Math.random() * maxY) * gridSize,
      type: 'stone'
    };
    
    if (!this.isPositionOccupied(newObstacle)) {
      state.obstacles.push(newObstacle);
    }
  }

  isPositionOccupied(pos) {
    if (this.snake.segments.some(seg => seg.x === pos.x && seg.y === pos.y)) {
      return true;
    }
    
    if (state.food && state.food.x === pos.x && state.food.y === pos.y) {
      return true;
    }
    
    if (state.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
      return true;
    }
    
    if (state.broom && state.broom.x === pos.x && state.broom.y === pos.y) {
      return true;
    }
    
    return false;
  }

  checkObstacleCollision() {
    const head = this.snake.segments[0];
    return state.obstacles.some(obs => obs.x === head.x && obs.y === head.y);
  }

  spawnHammer() {
    if (state.hammer) return;
    
    const gridSize = CONFIG.GRID;
    const maxX = Math.floor(this.canvas.width / gridSize) - 1;
    const maxY = Math.floor(this.canvas.height / gridSize) - 1;
    
    state.hammer = {
      x: Math.floor(Math.random() * maxX) * gridSize,
      y: Math.floor(Math.random() * maxY) * gridSize
    };
  }

  collectHammer() {
    state.hammer = null;
    state.hasHammer = true;
    this.updateStats('hammer', 1);
    
    setTimeout(() => { state.hasHammer = false; }, 5000);
  }

  activateTea() {
    state.hasTea = true;
    state.teaTimer = 300;
    state.gameSpeed = CONFIG.INITIAL_SPEED * 0.7;
    this.updateSpeedDisplay();
  }

  checkAchievements() {
    state.achievements.forEach(ach => {
      if (ach.unlocked) return;
      
      if (state.score >= ach.threshold) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
        this.showNotification(`🏆 Достижение: ${ach.name}`);
        this.updateStats('achievement', 1);
      }
    });
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
    this.loadAchievements();
    this.loadMuteState();
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
    
    this.updateStats('game_start');
    
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

  togglePause() {
    if (!this.gameOverScreen.classList.contains('hidden')) {
      return;
    }
    
    state.isPaused = !state.isPaused;
    
    if (state.isPaused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
    }
  }

  showPauseOverlay() {
    this.pauseOverlay.classList.remove('hidden');
  }

  hidePauseOverlay() {
    this.pauseOverlay.classList.add('hidden');
  }

  gameOver() {
    state.isRunning = false;
    
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
    }
    
    this.addToLeaderboard(state.score);
    this.checkSkinUnlocks(state.score);
    this.updateStats('score', state.score);
    this.updateMenuHighScore();
    
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

  addToLeaderboard(score) {
    const entry = {
      score: score,
      date: new Date().toISOString(),
      id: Date.now()
    };
    
    state.leaderboard.push(entry);
    state.leaderboard.sort((a, b) => b.score - a.score);
    state.leaderboard = state.leaderboard.slice(0, 10);
    
    localStorage.setItem('snakeLeaderboard', JSON.stringify(state.leaderboard));
  }

  checkSkinUnlocks(score) {
    const unlockedSkins = state.unlockedSkins || ['classic'];
    
    CONFIG.SKINS.forEach(skin => {
      if (score >= skin.unlockAt && !unlockedSkins.includes(skin.id)) {
        unlockedSkins.push(skin.id);
        state.unlockedSkins = unlockedSkins;
        localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
        this.showNotification(`🎨 Открыт скин: ${skin.name}!`);
      }
    });
  }

  updateStats(type, value) {
    const stats = state.stats || {};
    
    switch(type) {
      case 'game_start':
        stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
        stats.lastPlayed = new Date().toISOString();
        break;
      case 'score':
        stats.totalScore = (stats.totalScore || 0) + value;
        if (value > (stats.bestScore || 0)) {
          stats.bestScore = value;
        }
        break;
      case 'time':
        stats.totalTimePlayed = (stats.totalTimePlayed || 0) + value;
        break;
      case 'food':
        stats.totalFoodEaten = (stats.totalFoodEaten || 0) + value;
        break;
      case 'broom':
        stats.totalBroomsCollected = (stats.totalBroomsCollected || 0) + value;
        break;
      case 'poop':
        stats.totalPoopLeft = (stats.totalPoopLeft || 0) + value;
        break;
      case 'obstacle':
        stats.totalObstaclesHit = (stats.totalObstaclesHit || 0) + value;
        break;
      case 'hammer':
        stats.totalHammerCollected = (stats.totalHammerCollected || 0) + value;
        break;
      case 'achievement':
        stats.achievementsUnlocked = (stats.achievementsUnlocked || 0) + value;
        break;
      case 'skin':
        stats.skinsUnlocked = (stats.skinsUnlocked || 0) + value;
        break;
    }
    
    state.stats = stats;
    localStorage.setItem('snakeStats', JSON.stringify(stats));
  }
}
