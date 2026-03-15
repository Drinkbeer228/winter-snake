import { CONFIG } from '../utils/config.js';

export class Input {
  constructor(onDirection, onBoost) {
    this.onDirection = onDirection;
    this.onBoost = onBoost;
    this.setupKeyboard();
    this.setupTouch();
    this.setupMobileButtons();
  }
  
  setupKeyboard() {
    const keyMap = {
      'ArrowUp': { x: 0, y: -CONFIG.GRID },
      'ArrowDown': { x: 0, y: CONFIG.GRID },
      'ArrowLeft': { x: -CONFIG.GRID, y: 0 },
      'ArrowRight': { x: CONFIG.GRID, y: 0 }
    };
    
    document.addEventListener('keydown', (e) => {
      if (keyMap[e.key]) {
        e.preventDefault();
        this.onDirection(keyMap[e.key]);
        this.onBoost(keyMap[e.key]); // Ускорение при нажатии
      }
    });
  }
  
  setupTouch() {
    let startX, startY;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const dx = endX - startX;
      const dy = endY - startY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        const dir = { x: dx > 0 ? CONFIG.GRID : -CONFIG.GRID, y: 0 };
        this.onDirection(dir);
        this.onBoost(dir);
      } else {
        const dir = { x: 0, y: dy > 0 ? CONFIG.GRID : -CONFIG.GRID };
        this.onDirection(dir);
        this.onBoost(dir);
      }
    }, { passive: false });
  }
  
  setupMobileButtons() {
    const buttons = document.querySelectorAll('.control-btn');
    const dirMap = {
      'up': { x: 0, y: -CONFIG.GRID },
      'down': { x: 0, y: CONFIG.GRID },
      'left': { x: -CONFIG.GRID, y: 0 },
      'right': { x: CONFIG.GRID, y: 0 }
    };
    
    buttons.forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dir = dirMap[btn.dataset.dir];
        this.onDirection(dir);
        this.onBoost(dir);
      });
      
      btn.addEventListener('mousedown', (e) => {
        const dir = dirMap[btn.dataset.dir];
        this.onDirection(dir);
        this.onBoost(dir);
      });
    });
  }
}
