// === ИНИЦИАЛИЗАЦИЯ ===

function initGame() {
  initAudio();
  initMusicPlaceholder();
  initSnake();
  
  // Кнопки
  document.getElementById('sound-toggle-btn').textContent = audio.enabled ? '🔊' : '🔇';
  document.getElementById('music-toggle-btn').textContent = '🎵';
  
  // Обработчики клавиатуры
  document.addEventListener('keydown', changeDirection);
  
  // 📱 iOS тач-управление
  initTouchControls();
  
  // Кнопки
  document.getElementById('restart-btn').addEventListener('click', resetGame);
  document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
  document.getElementById('music-toggle-btn').addEventListener('click', toggleMusic);
  document.getElementById('play-again-btn').addEventListener('click', resetGame);
  
  // Скрываем лоадер
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 1000);
  
  // Старт
  state.isRunning = true;
  updateScoreDisplay();
  createFood();
  state.gameInterval = setInterval(gameLoop, state.gameSpeed);
}

// 📱 Инициализация тач-управления для iOS
function initTouchControls() {
  const canvas = document.getElementById('gameCanvas');
  let touchStartX = 0;
  let touchStartY = 0;
  
  // 📱 Touch start
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    console.log('📱 Touch start:', touchStartX, touchStartY);
  }, { passive: false });
  
  // 📱 Touch move (критично для iOS!)
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  // 📱 Touch end
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    if (!touchStartX || !touchStartY) return;
    
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    console.log('📱 Touch end:', deltaX, deltaY);
    
    // Определяем направление свайпа
    const minSwipeDistance = 30; // минимальная дистанция свайпа
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Горизонтальный свайп
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && state.dx !== -CONFIG.GRID) {
          // Свайп вправо
          state.dx = CONFIG.GRID;
          state.dy = 0;
        } else if (deltaX < 0 && state.dx !== CONFIG.GRID) {
          // Свайп влево
          state.dx = -CONFIG.GRID;
          state.dy = 0;
        }
      }
    } else {
      // Вертикальный свайп
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && state.dy !== -CONFIG.GRID) {
          // Свайп вниз
          state.dx = 0;
          state.dy = CONFIG.GRID;
        } else if (deltaY < 0 && state.dy !== CONFIG.GRID) {
          // Свайп вверх
          state.dx = 0;
          state.dy = -CONFIG.GRID;
        }
      }
    }
    
    // Сброс координат
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: false });
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', initGame);
