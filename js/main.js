// === ИНИЦИАЛИЗАЦИЯ ===

function initGame() {
  initAudio();
  initMusicPlaceholder();
  initSnake();
  
  // Кнопки
  document.getElementById('sound-toggle-btn').textContent = audio.enabled ? '🔊' : '🔇';
  document.getElementById('music-toggle-btn').textContent = '🎵';
  
  // Обработчики
  document.addEventListener('keydown', changeDirection);
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

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', initGame);
