import { CONFIG } from '../utils/config.js';

export default class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.sprites = {};
    this.loadSprites();
  }

  // Загружаем спрайты
  loadSprites() {
    // Голова змейки
    this.sprites.snakeHead = new Image();
    this.sprites.snakeHead.src = './assets/images/1.png';
  }

  // Очистка экрана
  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  // Сетка
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;

    for (let x = 0; x < this.ctx.canvas.width; x += CONFIG.GRID) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.ctx.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.ctx.canvas.height; y += CONFIG.GRID) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.ctx.canvas.width, y);
      this.ctx.stroke();
    }
  }

  // Змейка с emoji головой и цветным телом
  drawSnake(segments, direction) {
    if (!segments?.length) return;

    segments.forEach((segment, index) => {
      const isHead = index === 0;
      const size = CONFIG.GRID;

      if (isHead) {
        // Голова - emoji 🐍
        this.ctx.font = `${CONFIG.GRID}px Arial`;
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
          '🐍',
          segment.x + CONFIG.GRID / 2,
          segment.y + CONFIG.GRID / 2
        );
      } else {
        // Тело - цветные квадраты
        this.ctx.fillStyle = '#3db6dc';
        this.ctx.fillRect(segment.x + 1, segment.y + 1, size - 2, size - 2);
      }
    });
  }

  // Еда (emoji)
  drawFood(food) {
    if (!food) return;

    this.ctx.font = `${CONFIG.GRID - 4}px Arial`;
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      CONFIG.EMOJIS.food,
      food.x + CONFIG.GRID / 2,
      food.y + CONFIG.GRID / 2
    );
  }

  // Препятствия (emoji)
  drawObstacles(obstacles) {
    if (!obstacles?.length) return;

    this.ctx.font = `${CONFIG.GRID - 4}px Arial`;
    obstacles.forEach(obs => {
      this.ctx.fillText(
        CONFIG.EMOJIS.obstacle,
        obs.x + CONFIG.GRID / 2,
        obs.y + CONFIG.GRID / 2
      );
    });
  }
}
