// === ИНИЦИАЛИЗАЦИЯ ===

// === ГЛАВНОЕ МЕНЮ ===
const mainMenu = document.getElementById('main-menu');
const menuHighscore = document.getElementById('menu-highscore');

function showToast(title, text, durationMs = 2200) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast';

  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;

  const textEl = document.createElement('div');
  textEl.className = 'toast-text';
  textEl.textContent = text;

  el.appendChild(titleEl);
  el.appendChild(textEl);
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 220);
  }, durationMs);
}

function showBankDeposit(amount) {
  const a = Math.max(0, Math.floor(amount || 0));
  if (a <= 0) return;
  const host = document.querySelector('.game-info');
  if (!host) return;

  let el = document.getElementById('bank-deposit');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bank-deposit';
    el.className = 'bank-deposit';
    host.appendChild(el);
  }

  el.textContent = `+${a} 🍎 в копилку`;
  el.classList.remove('show');
  requestAnimationFrame(() => {
    el.classList.add('show');
  });

  setTimeout(() => {
    el.classList.remove('show');
  }, 900);
}

function updateWorkshopUi() {
  const balEl = document.getElementById('workshop-balance-num');
  if (balEl) balEl.textContent = `${state.totalApples || 0}`;

  const engineerBtn = document.getElementById('buy-engineer-btn');
  const circusBtn = document.getElementById('buy-circus-btn');
  const mahoutBtn = document.getElementById('buy-mahoutspeed-btn');

  const ownsEngineer = !!(state.ownedSkins && state.ownedSkins.engineer);
  const ownsCircus = !!(state.ownedSkins && state.ownedSkins.circus);
  const engineerEquipped = state.currentSkin === 'engineer';
  const circusEquipped = state.currentSkin === 'circus';

  if (engineerBtn) {
    if (!ownsEngineer) engineerBtn.textContent = 'Купить (50 🍎)';
    else if (engineerEquipped) engineerBtn.textContent = 'Экипировано';
    else engineerBtn.textContent = 'Экипировать';
  }

  if (circusBtn) {
    if (!ownsCircus) circusBtn.textContent = 'Купить (150 🍎)';
    else if (circusEquipped) circusBtn.textContent = 'Экипировано';
    else circusBtn.textContent = 'Экипировать';
  }

  if (mahoutBtn) {
    mahoutBtn.textContent = state.upgradeMahoutSpeed ? 'Куплено' : 'Купить (100 🍎)';
  }
}

function showWorkshopModal() {
  const modal = document.getElementById('workshop-modal');
  if (!modal) return;
  updateWorkshopUi();
  modal.classList.remove('hidden');
}

function hideWorkshopModal() {
  const modal = document.getElementById('workshop-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function initWorkshopHandlers() {
  const openBtn = document.getElementById('menu-workshop-btn');
  const closeBtn = document.getElementById('workshop-close-btn');
  const modal = document.getElementById('workshop-modal');

  const engineerBtn = document.getElementById('buy-engineer-btn');
  const circusBtn = document.getElementById('buy-circus-btn');
  const mahoutBtn = document.getElementById('buy-mahoutspeed-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      showWorkshopModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideWorkshopModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideWorkshopModal();
      }
    });
  }

  function trySpend(cost) {
    const c = Math.max(0, Math.floor(cost || 0));
    if ((state.totalApples || 0) < c) {
      showToast('🍎 Недостаточно яблок', `Нужно: ${c}, есть: ${state.totalApples || 0}`);
      return false;
    }
    state.totalApples -= c;
    localStorage.setItem('snakeTotalApples', `${state.totalApples}`);
    return true;
  }

  function persistSkins() {
    try {
      localStorage.setItem('snakeOwnedSkins', JSON.stringify(state.ownedSkins || { default: true }));
    } catch (e) {}
    localStorage.setItem('snakeCurrentSkin', state.currentSkin || 'default');
  }

  if (engineerBtn) {
    engineerBtn.addEventListener('click', () => {
      if (!state.ownedSkins) state.ownedSkins = { default: true };
      if (!state.ownedSkins.engineer) {
        if (!trySpend(50)) return;
        state.ownedSkins.engineer = true;
        showToast('🧰 Покупка', 'Каска Инженера куплена!');
      }
      state.currentSkin = 'engineer';
      persistSkins();
      updateWorkshopUi();
    });
  }

  if (circusBtn) {
    circusBtn.addEventListener('click', () => {
      if (!state.ownedSkins) state.ownedSkins = { default: true };
      if (!state.ownedSkins.circus) {
        if (!trySpend(150)) return;
        state.ownedSkins.circus = true;
        showToast('🧰 Покупка', 'Цирковая попона куплена!');
      }
      state.currentSkin = 'circus';
      persistSkins();
      updateWorkshopUi();
    });
  }

  if (mahoutBtn) {
    mahoutBtn.addEventListener('click', () => {
      if (state.upgradeMahoutSpeed) {
        updateWorkshopUi();
        return;
      }
      if (!trySpend(100)) return;
      state.upgradeMahoutSpeed = true;
      localStorage.setItem('snakeUpgradeMahoutSpeed', '1');
      showToast('🧹 Апгрейд', 'Махауты теперь бегают быстрее!');
      updateWorkshopUi();
    });
  }
}

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

  updateMainMenuButtons();
}

// Скрыть меню
function hideMainMenu() {
  if (mainMenu) {
    mainMenu.classList.add('hidden');
  }
}

function canResumeRun() {
  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverVisible = gameOverModal && !gameOverModal.classList.contains('hidden');
  return !gameOverVisible && state.score > 0 && state.snake && state.snake.length > 0;
}

function updateMainMenuButtons() {
  const playBtn = document.getElementById('menu-play-btn');
  const newGameBtn = document.getElementById('menu-newgame-btn');

  const resumable = canResumeRun();
  if (playBtn) {
    playBtn.textContent = resumable ? '▶️ Продолжить' : '🎮 Играть';
  }
  if (newGameBtn) {
    newGameBtn.classList.toggle('hidden', !resumable);
  }
}

function pauseToMenu() {
  if (typeof pauseGame === 'function') {
    pauseGame();
  } else {
    state.isPaused = true;
    state.isRunning = false;
    if (typeof stopGameLoop === 'function') stopGameLoop();
  }

  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) {
    pauseMenu.classList.add('hidden');
  }

  showMainMenu();
}

function resetToMenu() {
  if (typeof pauseGame === 'function') {
    pauseGame();
  } else {
    state.isPaused = true;
    state.isRunning = false;
    if (typeof stopGameLoop === 'function') stopGameLoop();
  }

  if (typeof hideGameOverModal === 'function') {
    hideGameOverModal();
  }

  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) {
    pauseMenu.classList.add('hidden');
  }

  if (typeof resetState === 'function') {
    resetState();
  }
  if (typeof updateScoreDisplay === 'function') updateScoreDisplay();
  if (typeof updateComboDisplay === 'function') updateComboDisplay();

  showMainMenu();
}

// Обработчики кнопок меню
function initMenuHandlers() {
  const playBtn = document.getElementById('menu-play-btn');
  const newGameBtn = document.getElementById('menu-newgame-btn');
  const tutorialToggle = document.getElementById('tutorial-toggle');
  const skinsBtn = document.getElementById('menu-skins-btn');
  const achievementsBtn = document.getElementById('menu-achievements-btn');
  const settingsBtn = document.getElementById('menu-settings-btn');
  const howtoBtn = document.getElementById('menu-howto-btn');
  
  if (tutorialToggle) {
    const key = 'snakeTutorialEnabled';
    tutorialToggle.checked = localStorage.getItem(key) === '1';
    tutorialToggle.addEventListener('change', () => {
      localStorage.setItem(key, tutorialToggle.checked ? '1' : '0');
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      const resumable = canResumeRun();
      hideMainMenu();

      if (resumable && typeof resumeGame === 'function') {
        resumeGame();
        return;
      }

      if (typeof resetGame === 'function') {
        resetGame();
      }
    });
  }

  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      hideMainMenu();
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
        showToast('🎨 Скины', 'Скоро будет!');
      }
    });
  }
  
  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => {
      // Открыть модалку достижений (если есть)
      if (typeof showAchievementsModal === 'function') {
        showAchievementsModal();
      } else {
        showToast('🏆 Достижения', 'Скоро будет!');
      }
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showToast('⚙️ Настройки', '🔊 Звук: кнопка\n🎵 Музыка: кнопка\n📱 Управление: свайпы/стрелки');
    });
  }
  
  if (howtoBtn) {
    howtoBtn.addEventListener('click', () => {
      showToast('❓ Как играть', '⌨️ Стрелки или 📱 свайпы\n⏸ Пробел: пауза\n🍎 +10 очков, ⭐ +50\n🏆 Рекорд сохраняется', 4200);
    });
  }
}

function initGame() {
  initAudio();
  initMusicPlaceholder();
  initSnake();
  createItem();

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  window.addEventListener('resize', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();
  });
  window.addEventListener('orientationchange', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();
  });
  
  // Показываем главное меню
  showMainMenu();
  initMenuHandlers();
  initWorkshopHandlers();

  // Инструкция при первом запуске
  if (localStorage.getItem('snakeHighScore') === null) {
    showToast(
      '❄️ Добро пожаловать!',
      'Стрелки или Свайпы для движения.\nЕшь снежинки, расти и ставь рекорды!',
      5200
    );
  }
  
  // Кнопки
  document.getElementById('sound-toggle-btn').textContent = audio.enabled ? '🔊' : '🔇';
  document.getElementById('music-toggle-btn').textContent = audio.musicEnabled ? '🎵' : '🔇';
  
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isRunning && !state.isPaused) {
      showPauseMenu();
      showToast('⏸️ Пауза', 'Игра поставлена на паузу (вкладка скрыта)');
    }
  });
  
  // 📱 iOS тач-управление
  initTouchControls();
  
  // Кнопки
  document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
  document.getElementById('music-toggle-btn').addEventListener('click', toggleMusic);
  document.getElementById('home-btn').addEventListener('click', () => {
    if (state.isRunning) {
      pauseToMenu();
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
    resetToMenu();
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
    pauseToMenu();
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    showToast('📤 Поделиться', 'Скоро будет!');
  });
  
  // Splash screen скрываем только после полной загрузки
  window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hidden');
  }, { once: true });
  
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
