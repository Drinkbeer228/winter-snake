// === ИНИЦИАЛИЗАЦИЯ ===

// === ГЛАВНОЕ МЕНЮ ===
const mainMenu = document.getElementById('main-menu');
const menuHighscore = document.getElementById('menu-highscore');

// Показать меню
function showMainMenu() {
  if (mainMenu) {
    mainMenu.classList.remove('hidden');
    // Обновить рекорд в меню
    const savedHighScore = localStorage.getItem('snakeHighScore') || 0;
    if (menuHighscore) {
      menuHighscore.textContent = savedHighScore;
    }
  }
}

// Скрыть меню
function hideMainMenu() {
  if (mainMenu) {
    mainMenu.classList.add('hidden');
  }
}

// Обработчики кнопок меню
function initMenuHandlers() {
  const playBtn = document.getElementById('menu-play-btn');
  const skinsBtn = document.getElementById('menu-skins-btn');
  const achievementsBtn = document.getElementById('menu-achievements-btn');
  const settingsBtn = document.getElementById('menu-settings-btn');
  const howtoBtn = document.getElementById('menu-howto-btn');
  
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      hideMainMenu();
      // Запуск игры (не менять существующую логику)
      if (typeof resetGame === 'function') {
        resetGame();
      }
    });
  }
  
  if (skinsBtn) {
    skinsBtn.addEventListener('click', () => {
      // Открыть модалку скинов (если есть)
      if (typeof showSkinsModal === 'function') {
        showSkinsModal();
      } else {
        alert('🎨 Скины: скоро будет!');
      }
    });
  }
  
  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => {
      // Открыть модалку достижений (если есть)
      if (typeof showAchievementsModal === 'function') {
        showAchievementsModal();
      } else {
        alert('🏆 Достижения: скоро будет!');
      }
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      alert('⚙️ Настройки:\n🔊 Звук: вкл/выкл кнопкой\n📱 Свайпы: работают\n🎵 Музыка: вкл/выкл кнопкой');
    });
  }
  
  if (howtoBtn) {
    howtoBtn.addEventListener('click', () => {
      alert('❓ Как играть:\n\n⌨️ Стрелки: движение\n📱 Свайпы: на телефоне\n⏸ Пробел: пауза\n🍎 Еда: +10 очков\n⭐ Золотая: +50 очков\n🏆 Рекорд: сохраняется');
    });
  }
}

function initGame() {
  initAudio();
  initMusicPlaceholder();
  initSnake();
  
  // Показываем главное меню
  showMainMenu();
  initMenuHandlers();
  
  // Кнопки
  document.getElementById('sound-toggle-btn').textContent = audio.enabled ? '🔊' : '🔇';
  document.getElementById('music-toggle-btn').textContent = '🔇'; // Музыка изначально выключена
  
  // Обработчики клавиатуры
  document.addEventListener('keydown', changeDirection);
  
  // ESC для меню паузы
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isRunning) {
      // Если игра на паузе - продолжаем
      if (state.isPaused && !document.getElementById('pause-menu').classList.contains('hidden')) {
        hidePauseMenu();
      } else if (!state.isPaused) {
        // Если игра не на паузе - открываем меню паузы
        togglePauseMenu();
      }
    }
  });
  
  // Функции меню паузы
  function togglePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    
    if (state.isPaused) {
      // Возобновляем игру
      pauseMenu.classList.add('hidden');
      state.isPaused = false;
      playSound('pause');
    } else {
      // Ставим на паузу
      pauseMenu.classList.remove('hidden');
      state.isPaused = true;
      playSound('pause');
    }
  }
  
  function showPauseMenu() {
    document.getElementById('pause-menu').classList.remove('hidden');
    state.isPaused = true;
    playSound('pause');
  }
  
  function hidePauseMenu() {
    document.getElementById('pause-menu').classList.add('hidden');
    state.isPaused = false;
    playSound('pause');
  }
  
  // 📱 iOS тач-управление
  initTouchControls();
  
  // Кнопки
  document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
  document.getElementById('music-toggle-btn').addEventListener('click', toggleMusic);
  document.getElementById('home-btn').addEventListener('click', () => {
    if (state.isRunning) {
      // Если игра идёт - открываем меню паузы
      showPauseMenu();
    } else {
      // Если игра не идёт - открываем главное меню
      showMainMenu();
    }
  });
  document.getElementById('play-again-btn').addEventListener('click', () => {
    hideMainMenu();
    resetGame();
  });
  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    hideGameOverModal();
    showMainMenu();
  });
  
  // Кнопки меню паузы
  document.getElementById('resume-btn').addEventListener('click', () => {
    hidePauseMenu();
  });
  
  document.getElementById('restart-pause-btn').addEventListener('click', () => {
    hidePauseMenu();
    resetGame();
  });
  
  document.getElementById('menu-pause-btn').addEventListener('click', () => {
    hidePauseMenu();
    showMainMenu();
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    alert('📤 Поделиться: скоро будет!');
  });
  
  // Скрываем лоадер
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 1000);
  
  // НЕ запускаем игру автоматически - ждём нажатия "Играть"
}

// 📱 Инициализация тач-управления для iOS
function initTouchControls() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  
  // 📱 Touch start на всём документе, а не только на canvas
  document.addEventListener('touchstart', (e) => {
    // Игнорируем если тач на кнопках или других элементах управления
    if (e.target.closest('.controls-top') || 
        e.target.closest('.pause-menu') || 
        e.target.closest('.modal') ||
        e.target.closest('.main-menu')) {
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    console.log('📱 Touch start:', touchStartX, touchStartY);
  }, { passive: false });
  
  // 📱 Touch move (критично для iOS!)
  document.addEventListener('touchmove', (e) => {
    // Игнорируем если это свайп по кнопкам
    if (e.target.closest('.controls-top') || 
        e.target.closest('.pause-menu') || 
        e.target.closest('.modal') ||
        e.target.closest('.main-menu')) {
      return;
    }
    
    e.preventDefault();
  }, { passive: false });
  
  // 📱 Touch end
  document.addEventListener('touchend', (e) => {
    // Игнорируем если это клик по кнопкам
    if (e.target.closest('.controls-top') || 
        e.target.closest('.pause-menu') || 
        e.target.closest('.modal') ||
        e.target.closest('.main-menu')) {
      return;
    }
    
    e.preventDefault();
    
    if (!touchStartX || !touchStartY) return;
    
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;
    
    console.log('📱 Touch end:', deltaX, deltaY, 'time:', deltaTime);
    
    // Улучшенная чувствительность - меньший порог и учёт скорости
    const minSwipeDistance = 20; // уменьшили с 30 до 20
    const maxSwipeTime = 300; // максимальное время свайпа в мс
    
    // Проверяем скорость свайпа
    if (deltaTime > maxSwipeTime) {
      console.log('📱 Swipe too slow');
      touchStartX = 0;
      touchStartY = 0;
      return;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Горизонтальный свайп
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && state.dx !== -CONFIG.GRID) {
          // Свайп вправо
          state.dx = CONFIG.GRID;
          state.dy = 0;
          console.log('📱 Swipe right');
        } else if (deltaX < 0 && state.dx !== CONFIG.GRID) {
          // Свайп влево
          state.dx = -CONFIG.GRID;
          state.dy = 0;
          console.log('📱 Swipe left');
        }
      }
    } else {
      // Вертикальный свайп
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && state.dy !== -CONFIG.GRID) {
          // Свайп вниз
          state.dx = 0;
          state.dy = CONFIG.GRID;
          console.log('📱 Swipe down');
        } else if (deltaY < 0 && state.dy !== CONFIG.GRID) {
          // Свайп вверх
          state.dx = 0;
          state.dy = -CONFIG.GRID;
          console.log('📱 Swipe up');
        }
      }
    }
    
    // Сброс координат
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: false });
  
  // 🎮 Кнопки для мобильных удалены - используем только свайпы
  // Улучшенная отзывчивость свайпов
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', initGame);
