import { CONFIG } from '../utils/config.js';
import { audio } from '../utils/audio.js';
import { Snake } from './Snake.js';
import Renderer from './Renderer.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.snake = new Snake();
    this.renderer = new Renderer(this.ctx);
    this.score = 0;
    this.isRunning = false;
    this.isBoosting = false;
    this.food = null;
    this.obstacles = [];
    this.lastUpdate = 0;
    this.currentSpeed = CONFIG.BASE_SPEED;
    
    // Адаптивные размеры
    this.setupAdaptiveCanvas();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setupAdaptiveCanvas() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Вертикальный режим для телефона
      CONFIG.CANVAS_WIDTH = 432;   // 13.5 клеток
      CONFIG.CANVAS_HEIGHT = 768;  // 24 клетки
    } else {
      // Горизонтальный режим для ПК
      CONFIG.CANVAS_WIDTH = 640;   // 20 клеток
      CONFIG.CANVAS_HEIGHT = 480;  // 15 клеток
    }
  }
  
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const isMobile = window.innerWidth <= 768;
    
    // Устанавливаем размеры canvas
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    
    if (isMobile) {
      // Телефон - заполняем весь экран
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
    } else {
      // ПК - масштабируем под контейнер
      const scaleX = container.clientWidth / CONFIG.CANVAS_WIDTH;
      const scaleY = container.clientHeight / CONFIG.CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      
      this.canvas.style.width = `${CONFIG.CANVAS_WIDTH * scale}px`;
      this.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;
    }
  }
  
  start() {
    this.isRunning = true;
    this.score = 0;
    this.currentSpeed = CONFIG.BASE_SPEED;
    this.isBoosting = false;
    this.obstacles = [];
    this.snake.reset();
    this.spawnFood();
    this.updateUI();
    this.lastUpdate = performance.now();
    this.gameLoop();
  }
  
  gameLoop(timestamp = 0) {
    if (!this.isRunning) return;
    
    const deltaTime = timestamp - this.lastUpdate;
    const speed = this.isBoosting ? CONFIG.BOOST_SPEED : this.currentSpeed;
    
    if (deltaTime >= speed) {
      this.update();
      this.lastUpdate = timestamp;
    }
    
    this.render();
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }
  
  update() {
    this.snake.move();
    
    // Проверка еды
    const head = this.snake.getHead();
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.snake.grow();
      this.score += 10;
      audio.playEat();
      this.spawnFood();
      this.checkObstacleSpawn();
      this.updateUI();
    }
    
    // Проверка столкновений
    if (this.snake.checkSelfCollision() || 
        this.snake.checkWallCollision(this.canvas.width, this.canvas.height) ||
        this.checkObstacleCollision()) {
      this.gameOver();
    }
  }
  
  render() {
    // Используем Renderer
    this.renderer.clear();
    this.renderer.drawGrid();
    this.renderer.drawSnake(this.snake.segments, this.snake.direction);
    this.renderer.drawFood(this.food);
    this.renderer.drawObstacles(this.obstacles);
  }
  
  spawnFood() {
    const maxX = Math.floor(this.canvas.width / CONFIG.GRID) - 1;
    const maxY = Math.floor(this.canvas.height / CONFIG.GRID) - 1;
    
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * maxX) * CONFIG.GRID,
        y: Math.floor(Math.random() * maxY) * CONFIG.GRID
      };
    } while (this.isPositionOccupied(newFood));
    
    this.food = newFood;
  }
  
  checkObstacleSpawn() {
    if (this.score > 0 && this.score % 50 === 0) {
      const maxX = Math.floor(this.canvas.width / CONFIG.GRID) - 1;
      const maxY = Math.floor(this.canvas.height / CONFIG.GRID) - 1;
      
      let newObstacle;
      let attempts = 0;
      do {
        newObstacle = {
          x: Math.floor(Math.random() * maxX) * CONFIG.GRID,
          y: Math.floor(Math.random() * maxY) * CONFIG.GRID
        };
        attempts++;
      } while (this.isPositionOccupied(newObstacle) && attempts < 10);
      
      if (attempts < 10) {
        this.obstacles.push(newObstacle);
      }
    }
  }
  
  checkObstacleCollision() {
    const head = this.snake.getHead();
    return this.obstacles.some(obs => obs.x === head.x && obs.y === head.y);
  }
  
  isPositionOccupied(pos) {
    if (this.snake.segments.some(seg => seg.x === pos.x && seg.y === pos.y)) {
      return true;
    }
    if (this.food && this.food.x === pos.x && this.food.y === pos.y) {
      return true;
    }
    if (this.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
      return true;
    }
    return false;
  }
  
  setDirection(dir) {
    this.snake.setDirection(dir);
  }
  
  setBoost(dir) {
    // Ускорение только если направление совпадает с текущим
    if (dir.x === this.snake.direction.x && dir.y === this.snake.direction.y) {
      this.isBoosting = true;
      audio.playBoost();
      setTimeout(() => { this.isBoosting = false; }, 500);
    }
  }
  
  updateUI() {
    document.getElementById('scoreDisplay').textContent = `💊 ${this.score}`;
    const speedMult = (CONFIG.BASE_SPEED / this.currentSpeed).toFixed(1);
    document.getElementById('speedDisplay').textContent = `⚡ ${speedMult}x`;
  }
  
  gameOver() {
    this.isRunning = false;
    audio.playCrash();
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }
}
