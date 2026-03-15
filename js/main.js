import { Game } from './core/Game.js';
import { Input } from './core/Input.js';
import { CONFIG } from './utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const startScreen = document.getElementById('startScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  
  console.log('🐍 Loading game...');
  
  try {
    const game = new Game(canvas);
    
    const input = new Input(
      (dir) => game.setDirection(dir),
      (dir) => game.setBoost(dir)
    );
    
    startBtn.addEventListener('click', () => {
      console.log('🚀 Starting game...');
      startScreen.classList.add('hidden');
      game.start();
    });
    
    restartBtn.addEventListener('click', () => {
      console.log('🔄 Restarting game...');
      gameOverScreen.classList.add('hidden');
      game.start();
    });
    
    if (CONFIG.debug) {
      window.game = game;
      console.log('🐍 Winter Snake loaded successfully!');
    }
  } catch (error) {
    console.error('❌ Game loading failed:', error);
    alert('Game loading failed. Check console for details.');
  }
});
