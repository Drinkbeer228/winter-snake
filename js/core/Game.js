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
    
    // Устанавливаем реальные размеры канваса
    this.canvas.width = CONFIG.CANVAS_SIZE;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    
    // Меню
    this.mainMenu = document.getElementById('mainMenu');
    this.startBtn = document.getElementById('startBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.difficultySelect = document.getElementById('difficultySelect');
    this.volumeValue = document.getElementById('volumeValue');
    this.menuHighScore = document.getElementById('menuHighScore');
    
    // Элементы экрана смерти
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalHighScoreEl = document.getElementById('finalHighScore');
    this.restartBtn = document.getElementById('restartBtn');
    
    // Элемент оверлея паузы
    this.pauseOverlay = document.getElementById('pauseOverlay');
    
    // Элемент индикатора скорости
    this.speedDisplay = document.getElementById('speedDisplay');
    
    // Кнопка Mute
    this.muteBtn = document.getElementById('muteBtn');
    
    // Кнопки таблицы лидеров
    this.leaderboardBtn = document.getElementById('leaderboardBtn');
    this.leaderboardModal = document.getElementById('leaderboardModal');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.clearLeaderboardBtn = document.getElementById('clearLeaderboardBtn');
    this.closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    
    // Кнопки скинов
    this.skinsBtn = document.getElementById('skinsBtn');
    this.skinsModal = document.getElementById('skinsModal');
    this.skinsList = document.getElementById('skinsList');
    this.closeSkinsBtn = document.getElementById('closeSkinsBtn');
    
    // Кнопки ежедневных челленджей
    this.dailyBtn = document.getElementById('dailyBtn');
    this.dailyModal = document.getElementById('dailyModal');
    this.dailyList = document.getElementById('dailyList');
    this.dailyTimer = document.getElementById('dailyTimer');
    this.dailyTotalReward = document.getElementById('dailyTotalReward');
    this.closeDailyBtn = document.getElementById('closeDailyBtn');
    
    // Загрузка настроек и инициализация
    this.loadSettings();
    this.updateMenuHighScore();
    this.resizeCanvas();
    
    // Обработчики меню
    this.setupMenuHandlers();
    this.setupLeaderboardHandlers();
    this.setupSkinsHandlers();
    this.setupDailyHandlers();
    this.updateLeaderboardDisplay();
    this.renderSkinsList();
    
    // Инициализация ежедневных челленджей
    this.checkDailyReset();
    this.renderDailyChallenges();
    this.startDailyTimer();
    
    // Инициализация змейки и рендерера
    this.snake = new Snake();
    this.renderer = new Renderer(this.ctx);
    this.lastUpdate = 0;
    this.frameCount = 0; // для движения еды
    this.poopTimer = 0;  // для оставления куч
    this.broomTimer = 0; // для спавна метлы
    this.hammerTimer = 0; // для спавна молота
    
    // Обработчик кнопки рестарта
    this.restartBtn.addEventListener('click', () => {
      this.reset();
    });
    
    // Обработчик кнопки Mute
    this.muteBtn.addEventListener('click', () => {
      this.toggleMute();
    });
    
    // Обработчики клавиш для паузы и рестарта
    document.addEventListener('keydown', (e) => {
      // Пауза
      if ((e.code === 'Space' || e.code === 'Escape') && state.isRunning) {
        e.preventDefault();
        this.togglePause();
      }
      
      // Рестарт
      if (e.code === 'KeyR' && !state.isRunning && !this.gameOverScreen.classList.contains('hidden')) {
        this.reset();
      }
    });
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Игра не запущена сразу
    state.isRunning = false;
  }

  start() {
    state.isRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!state.isRunning) return;
    
    // Проверка паузы
    if (state.isPaused) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }
    
    // Таймер чая
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
    
    // Оставляем кучи после 3 очков
    if (this.poopTimer >= state.poopInterval && state.score >= 3) {
      this.addPoop();
      this.poopTimer = 0;
    }
    
    // Спавн метлы (каждые 200 кадров, если есть кучи)
    if (this.broomTimer >= 200 && state.poop.length > 0 && !state.broom) {
      this.spawnBroom();
      this.broomTimer = 0;
    }
    
    // Спавн молота (каждые 300 кадров, если есть препятствия)
    if (this.hammerTimer >= 300 && state.obstacles.length > 0 && !state.hammer) {
      this.spawnHammer();
      this.hammerTimer = 0;
    }
    
    // Проверка коллизий с метлой
    if (state.broom) {
      const head = this.snake.segments[0];
      if (head.x === state.broom.x && head.y === state.broom.y) {
        this.collectBroom();
      }
    }
    
    // Проверка коллизий с молотом
    if (state.hammer) {
      const head = this.snake.segments[0];
      if (head.x === state.hammer.x && head.y === state.hammer.y) {
        this.collectHammer();
      }
    }
    
    // Спавн препятствий (каждые 10 очков)
    if (state.score > 0 && state.score % state.obstacleInterval === 0) {
      const lastObstacleScore = state.obstacles.length * state.obstacleInterval;
      if (state.score === lastObstacleScore + state.obstacleInterval) {
        this.spawnObstacle();
      }
    }
    
    // Проверка коллизий с препятствиями
    if (this.checkObstacleCollision()) {
      this.gameOver();
    }
    
    // Движение еды после 5 очков
    if (state.score >= 5 && state.food) {
      if (this.frameCount % 30 === 0) { // каждые 30 кадров
        this.moveFood();
      }
    }
    
    // Проверка еды
    if (state.food) {
      const head = this.snake.segments[0];
      if (head.x === state.food.x && head.y === state.food.y) {
        this.snake.grow();
        state.score++;
        this.updateScoreDisplay();
        this.checkSpeedIncrease();
        this.checkAchievements();
        
        // Проверка на 50 очков (Postal 2 чай)
        if (state.score === 50 && !state.hasTea) {
          this.activateTea();
        }
        
        // Активация анимации роста
        state.isEating = true;
        state.eatTimer = 5; // 5 кадров анимации
        
        // Звук поедания
        playSound('eat');
        
        // Всплеск частиц при поедании
        spawnParticles(
          state.food.x + CONFIG.GRID/2, 
          state.food.y + CONFIG.GRID/2, 
          COLORS.FOOD, 
          8
        );
        
        this.spawnFood();
      }
    }
    
    // Проверка коллизий
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
    
    // Обновление и отрисовка частиц
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
    
    // Проверка границ
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
    state.poop = [];  // очищаем все кучи
    state.score += 1; // бонусное очко
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
    
    // Проверка: не на змейке, не на еде, не на другой преграде, не на метле
    if (!this.isPositionOccupied(newObstacle)) {
      state.obstacles.push(newObstacle);
    }
  }

  isPositionOccupied(pos) {
    // Проверка на змейке
    if (this.snake.segments.some(seg => seg.x === pos.x && seg.y === pos.y)) {
      return true;
    }
    
    // Проверка на еде
    if (state.food && state.food.x === pos.x && state.food.y === pos.y) {
      return true;
    }
    
    // Проверка на других препятствиях
    if (state.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
      return true;
    }
    
    // Проверка на метле
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
    
    // Удаляем последний камень (или все)
    if (state.obstacles.length > 0) {
      state.obstacles.pop();
    }
    
    // Молот используется сразу
    setTimeout(() => { state.hasHammer = false; }, 5000); // 5 сек действия
  }

  activateTea() {
    state.hasTea = true;
    state.teaTimer = 300;  // 5 секунд при 60 FPS
    state.gameSpeed = 50;  // Максимальная скорость
    
    // Уведомление
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
    
    // Показываем игровые элементы
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
    
    // Сортируем и оставляем топ-10
    state.leaderboard.sort((a, b) => b.score - a.score);
    state.leaderboard = state.leaderboard.slice(0, 10);
    
    // Сохраняем
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
    
    // Обработчики кликов
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
      // Скин заблокирован
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
      
      // Секретный скин "ЧАЕЧКА" открывается при активации чая
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
      // Новый день — сбрасываем челленджи
      this.generateDailyChallenges();
      localStorage.setItem('snakeDailyDate', today);
      state.dailyChallenges.date = today;
      state.dailyChallenges.completed = [];
      localStorage.setItem('snakeDailyCompleted', '[]');
    }
  }

  generateDailyChallenges() {
    // Выбираем 3 случайных задания
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

  resizeCanvas() {
    const maxSize = Math.min(
      window.innerWidth * 0.95,
      window.innerHeight * 0.85
    );
    
    // Округляем до кратного CONFIG.GRID
    const size = Math.floor(maxSize / CONFIG.GRID) * CONFIG.GRID;
    
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    // Внутреннее разрешение остаётся фиксированным
    // CSS масштабирует отображение
  }

  checkSpeedIncrease() {
    if (state.score > 0 && state.score % 5 === 0) {
      const oldSpeed = state.gameSpeed;
      state.gameSpeed = Math.max(
        CONFIG.MIN_SPEED,
        state.gameSpeed * CONFIG.SPEED_MULTIPLIER
      );
      
      // Показываем уведомление только если скорость реально изменилась
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
    // Нельзя паузить на экране смерти
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
    
    // Счётчики для ежедневных челленджей
    this.foodEaten = 0;
    this.broomsCollected = 0;
    this.gameStartTime = Date.now();
    
    // Скрываем экран смерти если есть
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
    
    // Округляем до кратного CONFIG.GRID
    const size = Math.floor(maxSize / CONFIG.GRID) * CONFIG.GRID;
    
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    // Внутреннее разрешение остаётся фиксированным
    // CSS масштабирует отображение
  }

checkSpeedIncrease() {
  if (state.score > 0 && state.score % 5 === 0) {
    const oldSpeed = state.gameSpeed;
    state.gameSpeed = Math.max(
      CONFIG.MIN_SPEED,
      state.gameSpeed * CONFIG.SPEED_MULTIPLIER
    );
    
    // Показываем уведомление только если скорость реально изменилась
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
  // Нельзя паузить на экране смерти
  if (!this.gameOverScreen.classList.contains('hidden')) {
    return;
  }
  
  state.isPaused = !state.isPaused;
  
  if (state.isPaused) {
    this.showPauseOverlay();
  } else {
    this.hidePauseOverlay();
  }

  gameOver() {
    state.isRunning = false;
    
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
    }
    
    // Добавляем в таблицу лидеров
    this.addToLeaderboard(state.score);
    
    // Проверяем разблокировку скинов
    this.checkSkinUnlocks(state.score);
    
    // Обновляем рекорд в меню
    this.updateMenuHighScore();
    
    // Показываем экран смерти
    this.finalScoreEl.textContent = state.score;
    this.finalHighScoreEl.textContent = state.highScore;
    this.gameOverScreen.classList.remove('hidden');
    
    // Через 3 секунды возвращаем в меню
    setTimeout(() => {
      this.gameOverScreen.classList.add('hidden');
      this.returnToMenu();
    }, 3000);
  }

  returnToMenu() {
    // Скрываем игровые элементы
    document.getElementById('scoreDisplay').classList.add('hidden');
    document.getElementById('highScoreDisplay').classList.add('hidden');
    document.getElementById('speedDisplay').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    
    // Показываем меню
    this.mainMenu.classList.remove('hidden');
    this.updateMenuHighScore();
  }
}
