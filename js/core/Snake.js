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
    // Проверка на движение назад
    if (Math.abs(newDirection.x) > Math.abs(newDirection.y)) {
      if (newDirection.y !== 0 && this.direction.y !== 0) return;
      this.direction.y = 0;
      this.direction.x = newDirection.x;
    } else {
      if (newDirection.x !== 0 && this.direction.x !== 0) return;
      this.direction.x = 0;
      this.direction.y = newDirection.y;
    }
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
