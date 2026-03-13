import { CONFIG, COLORS } from '../utils/config.js';
import { state } from '../utils/state.js';

export default class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  clear() {
    this.ctx.fillStyle = COLORS.BG_TOP;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

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

  drawSnake(segments, direction) {
    if (!segments || segments.length === 0) return;
    
    segments.forEach((segment, index) => {
      const isHead = index === 0;
      
      // Пульсация при росте
      let size = CONFIG.GRID - 2;
      if (state.isEating && isHead) {
        size += 4; // чуть больше
        state.eatTimer--;
        if (state.eatTimer <= 0) state.isEating = false;
      }
      
      this.ctx.fillStyle = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY;
      this.ctx.fillRect(segment.x, segment.y, size, size);
      
      if (isHead) {
        // Глаза
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(segment.x + 4, segment.y + 4, 3, 3);
        this.ctx.fillRect(segment.x + 13, segment.y + 4, 3, 3);
        
        // "Зубы" / рот - белая точка в сторону движения
        this.ctx.fillStyle = 'white';
        const centerX = segment.x + CONFIG.GRID/2;
        const centerY = segment.y + CONFIG.GRID/2;
        
        this.ctx.beginPath();
        this.ctx.arc(
          centerX + (direction.x > 0 ? 4 : direction.x < 0 ? -4 : 0),
            centerY + (direction.y > 0 ? 4 : direction.y < 0 ? -4 : 0),
            2, 0, Math.PI * 2
          );
        this.ctx.fill();
      }
    });
  }

  drawFood(food) {
    if (!food) return;
    this.ctx.fillStyle = COLORS.FOOD;
    this.ctx.fillRect(food.x, food.y, CONFIG.GRID - 2, CONFIG.GRID - 2);
  }
}
