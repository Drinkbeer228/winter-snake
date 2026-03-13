import Game from './core/Game.js';
import { CONFIG } from './utils/config.js';
import { initInput } from './core/Input.js';

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  canvas.width = CONFIG.CANVAS_SIZE;
  canvas.height = CONFIG.CANVAS_SIZE;

  const game = new Game(canvas);
  
  if (CONFIG.debug) {
    window.__game = game;
  }
  
  // Инициализация управления
  initInput((direction) => game.snake.setDirection(direction));
  
  // Инициализация еды
  game.spawnFood();
  
  game.start();
}

document.addEventListener('DOMContentLoaded', initGame);
