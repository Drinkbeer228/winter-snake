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
  }

  start() {
    state.isRunning = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!state.isRunning) return;
    
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

  gameOver() {
    state.isRunning = false;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('snakeHighScore', state.highScore);
    }
    alert(`Game Over! Score: ${state.score}`);
  }
}
