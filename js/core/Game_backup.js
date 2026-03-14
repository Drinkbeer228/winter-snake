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
    
    // Ustanavlivaem real'nye razmery kanvasa
    this.canvas.width = CONFIG.CANVAS_SIZE;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    
    
    this.mainMenu = document.getElementById('mainMenu');
    this.startBtn = document.getElementById('startBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.difficultySelect = document.getElementById('difficultySelect');
    this.volumeValue = document.getElementById('volumeValue');
    this.menuHighScore = document.getElementById('menuHighScore');
    
    // Elementy ekrana smerti
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalHighScoreEl = document.getElementById('finalHighScore');
    this.restartBtn = document.getElementById('restartBtn');
    
    // Element overley pauzy
    this.pauseOverlay = document.getElementById('pauseOverlay');
    
    // Element indikatora skorosti
    this.speedDisplay = document.getElementById('speedDisplay');
    
    
    this.muteBtn = document.getElementById('muteBtn');
    
    
    this.leaderboardBtn = document.getElementById('leaderboardBtn');
    this.leaderboardModal = document.getElementById('leaderboardModal');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.clearLeaderboardBtn = document.getElementById('clearLeaderboardBtn');
    this.closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    
    
    this.skinsBtn = document.getElementById('skinsBtn');
    this.skinsModal = document.getElementById('skinsModal');
    this.skinsList = document.getElementById('skinsList');
    this.closeSkinsBtn = document.getElementById('closeSkinsBtn');
    
    
    this.dailyBtn = document.getElementById('dailyBtn');
    this.dailyModal = document.getElementById('dailyModal');
    this.dailyList = document.getElementById('dailyList');
    this.dailyTimer = document.getElementById('dailyTimer');
    this.dailyTotalReward = document.getElementById('dailyTotalReward');
    this.closeDailyBtn = document.getElementById('closeDailyBtn');
    
    
    this.statsBtn = document.getElementById('statsBtn');
    this.statsModal = document.getElementById('statsModal');
    this.statsContent = document.getElementById('statsContent');
    this.resetStatsBtn = document.getElementById('resetStatsBtn');
    this.closeStatsBtn = document.getElementById('closeStatsBtn');
    
    
    this.loadSettings();
    this.updateMenuHighScore();
    this.resizeCanvas();
    
    
    this.setupMenuHandlers();
    this.setupLeaderboardHandlers();
    this.setupSkinsHandlers();
    this.setupDailyHandlers();
    this.setupStatsHandlers();
    this.updateLeaderboardDisplay();
    this.renderSkinsList();
    
    
    this.checkDailyReset();
    this.renderDailyChallenges();
    this.startDailyTimer();
    
    
    this.initStats();
    this.renderStats();
    
    
    this.snake = new Snake();
    this.renderer = new Renderer(this.ctx);
    this.lastUpdate = 0;
    this.frameCount = 0; 
    this.poopTimer = 0;  
    this.broomTimer = 0; 
    this.hammerTimer = 0; 
    
    
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
      if (this.frameCount % 30 === 0) { // kazhdye 30 kadrov
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
        
        
        spawnParticles(
          state.food.x + CONFIG.GRID/2, 
          state.food.y + CONFIG.GRID/2, 
          COLORS.FOOD, 
          8
        );
        
        this.spawnFood();
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
    this.renderer.drawObstacles(state.obstacles);
    this.renderer.drawBroom(state.broom);
    this.renderer.drawHammer(state.hammer);
    this.renderer.drawSnake(this.snake.segments, this.snake.direction);
    this.renderer.drawFood(state.food);
    
    
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
    } while (this.snake.segments.some(seg => 
      seg.x === newFood.x && seg.y === newFood.y));
    
    state.food = newFood;
  }

  moveFood() {
    const directions = [
      {x: CONFIG.GRID, y: 0},
      {x: -CONFIG.GRID, y: 0},
      {x: 0, y: CONFIG.GRID},
      {x: 0, y: -CONFIG.GRID}
    ];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    const newX = state.food.x + dir.x;
    const newY = state.food.y + dir.y;
    
    
    if (newX >= 0 && newX < this.canvas.width && 
        newY >= 0 && newY < this.canvas.height) {
      state.food.x = newX;
      state.food.y = newY;
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
    
    
    if (state.obstacles.length > 0) {
      state.obstacles.pop();
    }
    
    
    setTimeout(() => { state.hasHammer = false; }, 5000); 
  }

  activateTea() {
    state.hasTea = true;
    state.teaTimer = 300;  
    state.gameSpeed = 50;  
    
    
    const el = document.createElement('div');
    el.textContent = '☕ ЧАЕЧКА! УСКОРЕНИЕ!';
    el.style.cssText = `
      position: fixed; top: 30%; left: 50%;
      transform: translateX(-50%);
      font-size: 28px; color: #FF6B6B;
      text-shadow: 0 0 10px rgba(255,107,107,0.8);
      z-index: 300; pointer-events: none;
      animation: fadeOut 3s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
    
    this.updateSpeedDisplay();
  }

  checkAchievements() {
    state.achievements.forEach(ach => {
      if (ach.unlocked) return;
      
      if (state.score >= ach.threshold) {
        ach.unlocked = true;
        this.showAchievement(ach);
        this.saveAchievements();
      }
    });
  }

  showAchievement(ach) {
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `🏅 ${ach.name}<br><small>${ach.desc}</small>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  saveAchievements() {
    localStorage.setItem('snakeAchievements', JSON.stringify(state.achievements));
  }

  loadAchievements() {
    const saved = localStorage.getItem('snakeAchievements');
    if (saved) {
      state.achievements = JSON.parse(saved);
    }
  }

  toggleMute() {
    CONFIG.soundEnabled = !CONFIG.soundEnabled;
    this.updateMuteButton();
    this.saveMuteState();
  }

  updateMuteButton() {
    this.muteBtn.textContent = CONFIG.soundEnabled ? '🔊' : '🔇';
  }

  saveMuteState() {
    localStorage.setItem('snakeMute', CONFIG.soundEnabled);
  }

  loadMuteState() {
    const saved = localStorage.getItem('snakeMute');
    if (saved !== null) {
      CONFIG.soundEnabled = saved === 'true';
    }
    this.updateMuteButton();
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

  loadSettings() {
    const saved = localStorage.getItem('snakeSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      CONFIG.volume = settings.volume || 0.5;
      this.volumeSlider.value = CONFIG.volume * 100;
      this.volumeValue.textContent = Math.round(CONFIG.volume * 100);
      this.difficultySelect.value = settings.difficulty || 'normal';
      this.setDifficulty(settings.difficulty);
    }
  }

  saveSettings() {
    localStorage.setItem('snakeSettings', JSON.stringify({
      volume: CONFIG.volume,
      difficulty: this.difficultySelect.value
    }));
  }

  setDifficulty(diff) {
    if (diff === 'easy') {
      CONFIG.INITIAL_SPEED = 500;
      CONFIG.SPEED_MULTIPLIER = 0.95;
    } else if (diff === 'normal') {
      CONFIG.INITIAL_SPEED = 400;
      CONFIG.SPEED_MULTIPLIER = 0.9;
    } else if (diff === 'hard') {
      CONFIG.INITIAL_SPEED = 300;
      CONFIG.SPEED_MULTIPLIER = 0.85;
    }
    state.gameSpeed = CONFIG.INITIAL_SPEED;
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
    state.isRunning = true;
    this.gameLoop();
  }

  updateMenuHighScore() {
    if (this.menuHighScore) {
      this.menuHighScore.textContent = state.highScore;
    }
  }

  setupLeaderboardHandlers() {
    this.leaderboardBtn.addEventListener('click', () => {
      this.showLeaderboard();
    });
    
    this.closeLeaderboardBtn.addEventListener('click', () => {
      this.leaderboardModal.classList.add('hidden');
    });
    
    this.clearLeaderboardBtn.addEventListener('click', () => {
      this.clearLeaderboard();
    });
  }

  showLeaderboard() {
    this.updateLeaderboardDisplay();
    this.leaderboardModal.classList.remove('hidden');
  }

  updateLeaderboardDisplay() {
    if (!this.leaderboardList) return;
    
    const leaderboard = state.leaderboard || [];
    
    if (leaderboard.length === 0) {
      this.leaderboardList.innerHTML = '<p style="text-align:center;color:#888;">Пока нет записей</p>';
      return;
    }
    
    this.leaderboardList.innerHTML = leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => `
        <div class="leaderboard-entry">
          <span>#${index + 1}</span>
          <span>${entry.score} очков</span>
          <span>${new Date(entry.date).toLocaleDateString()}</span>
        </div>
      `)
      .join('');
  }

  addToLeaderboard(score) {
    if (!state.leaderboard) state.leaderboard = [];
    
    state.leaderboard.push({
      score: score,
      date: new Date().toISOString()
    });
    
    
    state.leaderboard.sort((a, b) => b.score - a.score);
    state.leaderboard = state.leaderboard.slice(0, 10);
    
    
    localStorage.setItem('snakeLeaderboard', JSON.stringify(state.leaderboard));
  }

  clearLeaderboard() {
    if (confirm('Точно сбросить таблицу лидеров?')) {
      state.leaderboard = [];
      localStorage.removeItem('snakeLeaderboard');
      this.updateLeaderboardDisplay();
    }
  }

  setupSkinsHandlers() {
    this.skinsBtn.addEventListener('click', () => {
      this.showSkins();
    });
    
    this.closeSkinsBtn.addEventListener('click', () => {
      this.skinsModal.classList.add('hidden');
    });
  }

  showSkins() {
    this.renderSkinsList();
    this.skinsModal.classList.remove('hidden');
  }

  renderSkinsList() {
    if (!this.skinsList) return;
    
    const unlockedSkins = state.unlockedSkins || ['classic'];
    
    this.skinsList.innerHTML = CONFIG.SKINS.map(skin => {
      const isUnlocked = unlockedSkins.includes(skin.id);
      const isSelected = state.selectedSkin === skin.id;
      
      return `
        <div class="skin-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}" 
             data-skin-id="${skin.id}">
          <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.colors.head}, ${skin.colors.body})">
            ${isUnlocked ? '🐍' : '🔒'}
          </div>
          <div class="skin-name">${skin.name}</div>
          <div class="skin-desc">${skin.description}</div>
          ${!isUnlocked ? `<div class="skin-requirement">${this.getUnlockRequirement(skin)}</div>` : ''}
        </div>
      `;
    }).join('');
    
    
    this.skinsList.querySelectorAll('.skin-card').forEach(card => {
      card.addEventListener('click', () => {
        const skinId = card.dataset.skinId;
        this.selectSkin(skinId);
      });
    });
  }

  getUnlockRequirement(skin) {
    if (skin.unlockAt === 'secret') return 'Секретное условие';
    return `Открыть при ${skin.unlockAt} очков`;
  }

  selectSkin(skinId) {
    const unlockedSkins = state.unlockedSkins || ['classic'];
    
    if (!unlockedSkins.includes(skinId)) {
      
      return;
    }
    
    state.selectedSkin = skinId;
    localStorage.setItem('snakeSelectedSkin', skinId);
    this.renderSkinsList();
  }

  checkSkinUnlocks(score) {
    const unlockedSkins = state.unlockedSkins || ['classic'];
    let changed = false;
    
    CONFIG.SKINS.forEach(skin => {
      if (typeof skin.unlockAt === 'number' && 
          score >= skin.unlockAt && 
          !unlockedSkins.includes(skin.id)) {
        unlockedSkins.push(skin.id);
        changed = true;
        this.showNotification(`🎨 Открыт скин: ${skin.name}!`);
      }
      
      
      if (skin.id === 'postal' && state.hasTea && !unlockedSkins.includes(skin.id)) {
        unlockedSkins.push(skin.id);
        changed = true;
        this.showNotification(`🎨 Открыт секретный скин: ${skin.name}!`);
      }
    });
    
    if (changed) {
      state.unlockedSkins = unlockedSkins;
      localStorage.setItem('snakeUnlockedSkins', JSON.stringify(unlockedSkins));
    }
  }

  showNotification(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position: fixed; top: 20%; left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000; padding: 15px 30px;
      border-radius: 8px; font-weight: bold;
      z-index: 700; animation: fadeOut 3s forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  setupDailyHandlers() {
    this.dailyBtn.addEventListener('click', () => {
      this.showDaily();
    });
    
    this.closeDailyBtn.addEventListener('click', () => {
      this.dailyModal.classList.add('hidden');
    });
  }

  showDaily() {
    this.checkDailyReset();
    this.renderDailyChallenges();
    this.dailyModal.classList.remove('hidden');
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('snakeDailyDate');
    
    if (savedDate !== today) {
      
      this.generateDailyChallenges();
      localStorage.setItem('snakeDailyDate', today);
      state.dailyChallenges.date = today;
      state.dailyChallenges.completed = [];
      localStorage.setItem('snakeDailyCompleted', '[]');
    }
  }

  generateDailyChallenges() {
    
    const shuffled = [...CONFIG.DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    const challenges = selected.map(c => ({
      ...c,
      progress: 0
    }));
    
    state.dailyChallenges.challenges = challenges;
    localStorage.setItem('snakeDailyChallenges', JSON.stringify(challenges));
  }

  renderDailyChallenges() {
    if (!this.dailyList) return;
    
    const challenges = state.dailyChallenges.challenges || [];
    const completed = state.dailyChallenges.completed || [];
    
    if (challenges.length === 0) {
      this.generateDailyChallenges();
      return;
    }
    
    let totalReward = 0;
    
    this.dailyList.innerHTML = challenges.map(challenge => {
      const isCompleted = completed.includes(challenge.id);
      const progress = isCompleted ? challenge.target : (challenge.progress || 0);
      const percent = (progress / challenge.target) * 100;
      
      if (isCompleted) totalReward += challenge.reward;
      
      return `
        <div class="daily-card ${isCompleted ? 'completed' : 'incomplete'}">
          <div class="daily-header">
            <span class="daily-name">${challenge.name}</span>
            <span class="daily-status">${isCompleted ? '✅' : '🔄'}</span>
          </div>
          <div class="daily-description">${challenge.description}</div>
          <div class="daily-progress">
            <div class="daily-progress-bar" style="width: ${Math.min(percent, 100)}%"></div>
          </div>
          <div style="text-align:right;font-size:12px;margin-top:5px;color:#888;">
            ${progress}/${challenge.target} • Награда: ${challenge.reward} очков
          </div>
        </div>
      `;
    }).join('');
    
    this.dailyTotalReward.textContent = totalReward;
  }

  updateDailyProgress(type, value) {
    const challenges = state.dailyChallenges.challenges || [];
    const completed = state.dailyChallenges.completed || [];
    
    challenges.forEach(challenge => {
      if (completed.includes(challenge.id)) return;
      if (challenge.type !== type) return;
      
      challenge.progress = Math.max(challenge.progress || 0, value);
      
      if (challenge.progress >= challenge.target) {
        completed.push(challenge.id);
        state.dailyReward += challenge.reward;
        this.showNotification(`📅 Челлендж выполнен: ${challenge.name}! +${challenge.reward} очков`);
      }
    });
    
    state.dailyChallenges.challenges = challenges;
    state.dailyChallenges.completed = completed;
    localStorage.setItem('snakeDailyChallenges', JSON.stringify(challenges));
    localStorage.setItem('snakeDailyCompleted', JSON.stringify(completed));
    localStorage.setItem('snakeDailyReward', state.dailyReward.toString());
    
    this.renderDailyChallenges();
  }

  startDailyTimer() {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (this.dailyTimer) {
        this.dailyTimer.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
      }
      
      setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
  }

  setupStatsHandlers() {
    this.statsBtn.addEventListener('click', () => {
      this.showStats();
    });
    
    this.closeStatsBtn.addEventListener('click', () => {
      this.statsModal.classList.add('hidden');
    });
    
    this.resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });
  }

  initStats() {
    if (!state.stats || Object.keys(state.stats).length === 0) {
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
      this.saveStats();
    }
  }

  saveStats() {
    localStorage.setItem('snakeStats', JSON.stringify(state.stats));
  }

  showStats() {
    this.renderStats();
    this.statsModal.classList.remove('hidden');
  }

  renderStats() {
    if (!this.statsContent) return;
    
    const stats = state.stats || {};
    
    
    const hours = Math.floor(stats.totalTimePlayed / 3600);
    const minutes = Math.floor((stats.totalTimePlayed % 3600) / 60);
    const seconds = stats.totalTimePlayed % 60;
    const timeFormatted = `${hours}ч ${minutes}м ${seconds}с`;
    
    
    const avgSnakeLength = stats.gamesPlayed > 0 
      ? Math.round((stats.totalScore + stats.gamesPlayed * 2) / stats.gamesPlayed)
      : 0;
    
    
    const totalAchievements = state.achievements?.length || 3;
    const achievementPercent = stats.achievementsUnlocked > 0
      ? Math.round((stats.achievementsUnlocked / totalAchievements) * 100)
      : 0;
    
    
    const totalSkins = CONFIG.SKINS?.length || 6;
    const skinPercent = stats.skinsUnlocked > 0
      ? Math.round((stats.skinsUnlocked / totalSkins) * 100)
      : 0;
    
    this.statsContent.innerHTML = `
      <div class="stat-card highlight">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">${stats.bestScore || 0}</div>
        <div class="stat-label">Лучший счёт</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-value">${stats.gamesPlayed || 0}</div>
        <div class="stat-label">Игр сыграно</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">${stats.totalScore || 0}</div>
        <div class="stat-label">Всего очков</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">${timeFormatted}</div>
        <div class="stat-label">Время в игре</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🍎</div>
        <div class="stat-value">${stats.totalFoodEaten || 0}</div>
        <div class="stat-label">Съедено еды</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🐍</div>
        <div class="stat-value">${avgSnakeLength}</div>
        <div class="stat-label">Средняя длина</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🧹</div>
        <div class="stat-value">${stats.totalBroomsCollected || 0}</div>
        <div class="stat-label">Собрано метл</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💩</div>
        <div class="stat-value">${stats.totalPoopLeft || 0}</div>
        <div class="stat-label">Оставлено куч</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🔨</div>
        <div class="stat-value">${stats.totalHammerCollected || 0}</div>
        <div class="stat-label">Собрано молотов</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🪨</div>
        <div class="stat-value">${stats.totalObstaclesHit || 0}</div>
        <div class="stat-label">Ударов о камни</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏅</div>
        <div class="stat-value">${achievementPercent}%</div>
        <div class="stat-label">Достижения</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎨</div>
        <div class="stat-value">${skinPercent}%</div>
        <div class="stat-label">Скины открыты</div>
      </div>
    `;
  }

  updateStats(action, value = 1) {
    if (!state.stats) this.initStats();
    
    switch(action) {
      case 'game_start':
        state.stats.gamesPlayed = (state.stats.gamesPlayed || 0) + 1;
        state.stats.lastPlayed = new Date().toISOString();
        break;
      case 'score':
        state.stats.totalScore = (state.stats.totalScore || 0) + value;
        if (value > (state.stats.bestScore || 0)) {
          state.stats.bestScore = value;
        }
        break;
      case 'time':
        state.stats.totalTimePlayed = (state.stats.totalTimePlayed || 0) + value;
        break;
      case 'food':
        state.stats.totalFoodEaten = (state.stats.totalFoodEaten || 0) + value;
        break;
      case 'broom':
        state.stats.totalBroomsCollected = (state.stats.totalBroomsCollected || 0) + value;
        break;
      case 'poop':
        state.stats.totalPoopLeft = (state.stats.totalPoopLeft || 0) + value;
        break;
      case 'obstacle':
        state.stats.totalObstaclesHit = (state.stats.totalObstaclesHit || 0) + value;
        break;
      case 'hammer':
        state.stats.totalHammerCollected = (state.stats.totalHammerCollected || 0) + value;
        break;
      case 'achievement':
        state.stats.achievementsUnlocked = (state.stats.achievementsUnlocked || 0) + value;
        break;
      case 'skin':
        state.stats.skinsUnlocked = (state.stats.skinsUnlocked || 0) + value;
        break;
    }
    
    this.saveStats();
  }

  resetStats() {
    if (confirm('Точно сбросить всю статистику? Это действие необратимо!')) {
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
      this.saveStats();
      this.renderStats();
      this.showNotification('📊 Статистика сброшена');
    }
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
}
