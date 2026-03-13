import { CONFIG } from '../utils/config.js';

export default class Snake {
  constructor() {
    this.segments = [
      {x: 160, y: 160},
      {x: 140, y: 160}
    ];
    this.direction = {x: CONFIG.GRID, y: 0};
    this.growing = false;
  }

  setDirection(newDirection) {
    // Запрещаем разворот на 180°
    if (newDirection.x === -this.direction.x && newDirection.y === 0) return;
    if (newDirection.y === -this.direction.y && newDirection.x === 0) return;
    
    this.direction = newDirection;
  }

  move() {
    const head = {...this.segments[0]};
    head.x += this.direction.x;
    head.y += this.direction.y;
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

  checkWallCollision(canvasWidth, canvasHeight) {
    const head = this.segments[0];
    return head.x < 0 || head.x >= canvasWidth || 
           head.y < 0 || head.y >= canvasHeight;
  }
}
