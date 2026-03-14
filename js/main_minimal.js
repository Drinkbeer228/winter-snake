import { Game } from './core/Game_minimal.js';
import { CONFIG } from './utils/config_simple.js';

function initGame() {
  console.log('initGame called');
  
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  console.log('Creating game instance...');
  const game = new Game(canvas);
  
  if (CONFIG.debug) {
    window.__game = game;
  }
  
  console.log('Game created:', !!game);
}

console.log('Setting up DOMContentLoaded listener...');
document.addEventListener('DOMContentLoaded', initGame);
