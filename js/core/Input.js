import { CONFIG } from '../utils/config.js';

export function initInput(onDirectionChange) {
  // Клавиатура
  document.addEventListener('keydown', (e) => {
    const keyMap = {
      'ArrowUp': {x: 0, y: -CONFIG.GRID},
      'ArrowDown': {x: 0, y: CONFIG.GRID},
      'ArrowLeft': {x: -CONFIG.GRID, y: 0},
      'ArrowRight': {x: CONFIG.GRID, y: 0}
    };
    
    if (keyMap[e.key]) {
      e.preventDefault();
      onDirectionChange(keyMap[e.key]);
    }
  });

  // Тач (мобильный)
  let touchStartX = 0;
  let touchStartY = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      onDirectionChange({x: dx > 0 ? CONFIG.GRID : -CONFIG.GRID, y: 0});
    } else {
      onDirectionChange({x: 0, y: dy > 0 ? CONFIG.GRID : -CONFIG.GRID});
    }
  });
}
