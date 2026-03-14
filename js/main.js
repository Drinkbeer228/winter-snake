import Game from './core/Game.js';
import { CONFIG } from '../utils/config.js';
import { initInput } from './Input.js';

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  const game = new Game(canvas);
  
  if (CONFIG.debug) {
    window.__game = game;
  }
  
  initInput((direction) => {
    if (game.snake && game.snake.setDirection) {
      game.snake.setDirection(direction);
    }
  });
}

document.addEventListener('DOMContentLoaded', initGame);
