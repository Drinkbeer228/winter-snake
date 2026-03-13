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
    this.snake = new Snake();
    this.renderer = new Renderer(this.ctx);
    this.lastUpdate = 0;
    this.frameCount = 0; // для движения еды
    this.poopTimer = 0;  // для оставления куч
    this.broomTimer = 0; // для спавна метлы
    this.hammerTimer = 0; // для спавна молота
    
    // Элементы экрана смерти
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalHighScoreEl = document.getElementById('finalHighScore');
    this.restartBtn = document.getElementById('restartBtn');
    
    // Элемент оверлея паузы
    this.pauseOverlay = document.getElementById('pauseOverlay');
    
    // Обработчик кнопки рестарта
    this.restartBtn.addEventListener('click', () => {
      this.reset();
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
    
    // Инициализация отображения счёта
    this.updateScoreDisplay();
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

  reset() {
    // Скрываем экран смерти
    this.gameOverScreen.classList.add('hidden');
    
    // Скрываем оверлей паузы
    this.hidePauseOverlay();
    
    // Сбрасываем состояние игры
    state.score = 0;
    state.isRunning = true;
    state.isPaused = false;
    state.isEating = false;
    state.eatTimer = 0;
    state.poop = [];
    state.poopInterval = 10;
    state.broom = null;
    state.broomActive = false;
    state.obstacles = [];
    state.obstacleInterval = 10;
    state.hammer = null;
    state.hasHammer = false;
    state.gameSpeed = CONFIG.INITIAL_SPEED;
    
    // Сбрасываем змейку
    this.snake.reset();
    
    // Обновляем счёт
    this.updateScoreDisplay();
    
    // Спавним еду
    this.spawnFood();
    
    // Перезапускаем игровой цикл
    this.gameLoop();
  }

  gameOver() {
    state.isRunning = false;
    
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
    }
    
    // Показываем экран смерти
    this.finalScoreEl.textContent = state.score;
    this.finalHighScoreEl.textContent = state.highScore;
    this.gameOverScreen.classList.remove('hidden');
  }
}
