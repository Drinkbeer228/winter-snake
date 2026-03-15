import { Game } from './core/Game.js';
import { Input } from './core/Input.js';
import { CONFIG } from './utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  
  const game = new Game(canvas);
  
  const input = new Input(
    (dir) => game.setDirection(dir),
    (dir) => game.setBoost(dir)
  );
  
  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    game.start();
  });
  
  restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    game.start();
  });
  
  if (CONFIG.debug) {
    window.game = game;
    console.log('🐍 Winter Snake loaded!');
  }
});
