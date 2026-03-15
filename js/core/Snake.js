import { CONFIG } from '../utils/config.js';

export class Snake {
  constructor() {
    this.reset();
  }
  
  reset() {
    const startX = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID / 2) * CONFIG.GRID;
    const startY = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID / 2) * CONFIG.GRID;
    
    this.segments = [
      { x: startX, y: startY },
      { x: startX - CONFIG.GRID, y: startY },
      { x: startX - CONFIG.GRID * 2, y: startY }
    ];
    this.direction = { x: CONFIG.GRID, y: 0 };
    this.nextDirection = { x: CONFIG.GRID, y: 0 };
    this.growing = false;
  }
  
  setDirection(dir) {
    // Запрет разворота на 180°
    if (dir.x === -this.direction.x && dir.y === 0) return;
    if (dir.y === -this.direction.y && dir.x === 0) return;
    this.nextDirection = dir;
  }
  
  move() {
    this.direction = this.nextDirection;
    const head = {
      x: this.segments[0].x + this.direction.x,
      y: this.segments[0].y + this.direction.y
    };
    this.segments.unshift(head);
    
    if (!this.growing) {
      this.segments.pop();
    } else {
      this.growing = false;
    }
  }
  
  grow() {
    this.growing = true;
  }
  
  checkSelfCollision() {
    const head = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
        return true;
      }
    }
    return false;
  }
  
  checkWallCollision(width, height) {
    const head = this.segments[0];
    return head.x < 0 || head.x >= width || head.y < 0 || head.y >= height;
  }
  
  getHead() {
    return this.segments[0];
  }
}
