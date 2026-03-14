import { CONFIG } from '../utils/config_simple.js';
import { state } from '../utils/state_simple.js';
import Snake from './Snake_minimal.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set canvas size
    this.canvas.width = CONFIG.CANVAS_SIZE;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    
    // Initialize snake and renderer
    this.snake = new Snake();
    this.lastUpdate = 0;
    
    // Menu elements
    this.mainMenu = document.getElementById('mainMenu');
    this.startBtn = document.getElementById('startBtn');
    
    console.log('Game constructor called');
    console.log('Elements found:', {
      canvas: !!this.canvas,
      mainMenu: !!this.mainMenu,
      startBtn: !!this.startBtn,
      snake: !!this.snake
    });
    
    // Setup handlers
    this.setupMenuHandlers();
  }

  start() {
    state.isRunning = true;
    console.log('Game started');
  }

  setupMenuHandlers() {
    console.log('Setting up menu handlers...');
    
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        console.log('Start button clicked!');
        this.startGameFromMenu();
      });
      console.log('Event listener added');
    }
  }

  startGameFromMenu() {
    console.log('startGameFromMenu called');
    this.mainMenu.classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    this.start();
  }
}

export { Game };
