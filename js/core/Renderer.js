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

  // Змейка со спрайтом для всех сегментов
  drawSnake(segments, direction) {
    if (!segments?.length) return;

    segments.forEach((segment, index) => {
      const isHead = index === 0;
      const size = CONFIG.GRID;

      // Если спрайт загрузился - рисуем его для всех сегментов
      if (this.sprites.snakeHead && this.sprites.snakeHead.complete && this.sprites.snakeHead.naturalWidth !== 0) {
        this.ctx.save();
        
        // Поворот только для головы
        if (isHead) {
          this.ctx.translate(segment.x + size / 2, segment.y + size / 2);
          
          if (direction.x === 1) this.ctx.rotate(0);
          else if (direction.x === -1) this.ctx.rotate(Math.PI);
          else if (direction.y === -1) this.ctx.rotate(-Math.PI / 2);
          else if (direction.y === 1) this.ctx.rotate(Math.PI / 2);
          
          this.ctx.drawImage(this.sprites.snakeHead, -size / 2, -size / 2, size, size);
        } else {
          // Тело - тот же спрайт без поворота
          this.ctx.drawImage(this.sprites.snakeHead, segment.x, segment.y, size, size);
        }
        
        this.ctx.restore();
      } else {
        // Фоллбэк - цветные сегменты
        this.ctx.fillStyle = isHead ? '#7de3ff' : '#3db6dc';
        this.ctx.fillRect(segment.x + 1, segment.y + 1, size - 2, size - 2);
        
        // Глаза для головы
        if (isHead) {
          this.ctx.fillStyle = '#fff';
          if (direction.x === 1) { // вправо
            this.ctx.fillRect(segment.x + 8, segment.y + 5, 3, 3);
            this.ctx.fillRect(segment.x + 8, segment.y + 12, 3, 3);
          } else if (direction.x === -1) { // влево
            this.ctx.fillRect(segment.x + 5, segment.y + 5, 3, 3);
            this.ctx.fillRect(segment.x + 5, segment.y + 12, 3, 3);
          } else if (direction.y === -1) { // вверх
            this.ctx.fillRect(segment.x + 5, segment.y + 5, 3, 3);
            this.ctx.fillRect(segment.x + 12, segment.y + 5, 3, 3);
          } else { // вниз
            this.ctx.fillRect(segment.x + 5, segment.y + 8, 3, 3);
            this.ctx.fillRect(segment.x + 12, segment.y + 8, 3, 3);
          }
        }
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
