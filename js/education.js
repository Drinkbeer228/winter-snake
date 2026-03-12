// === EDUCATION MODULE ===
// Tutorial logic is isolated here to keep HUD / game code clean.

(function () {
  const KEY_ENABLED = 'snakeTutorialEnabled';

  const state = {
    enabled: false,
    eatCount: 0,
    lastLineAtMs: 0,
    cooldownMs: 6500,
    started: false,
    poopShown: false
  };

  function nowMs() {
    return (window.state && typeof window.state.nowMs === 'number' && window.state.nowMs > 0)
      ? window.state.nowMs
      : Date.now();
  }

  function randCooldown() {
    return 5000 + Math.floor(Math.random() * 3000);
  }

  function canSpeak() {
    const t = nowMs();
    return (t - state.lastLineAtMs) >= state.cooldownMs;
  }

  function speak(text, durationMs = 6500) {
    if (!state.enabled) return;
    if (!text) return;
    if (!canSpeak()) return;

    state.cooldownMs = randCooldown();
    state.lastLineAtMs = nowMs();

    if (typeof window.enqueueSubtitle === 'function') {
      window.enqueueSubtitle(text, durationMs);
    }
  }

  function setEnabled(on) {
    state.enabled = !!on;
    try {
      localStorage.setItem(KEY_ENABLED, state.enabled ? '1' : '0');
    } catch (_) {}

    if (window.state) {
      window.state.isTutorialMode = state.enabled;
    }

    const py = document.getElementById('py-badge');
    if (py) {
      py.classList.toggle('hidden', !state.enabled);
    }
  }

  function syncEnabledFromStorage() {
    try {
      setEnabled(localStorage.getItem(KEY_ENABLED) === '1');
    } catch (_) {
      setEnabled(false);
    }
  }

  function onEvent(event) {
    if (!state.enabled) return;

    if (event === 'start') {
      if (state.started) return;
      state.started = true;
      state.eatCount = 0;
      speak('Смотри сюда, новичок. Змейка — это список. Голова — индекс [0], хвост — последний элемент. Двигаемся — добавляем новую голову, удаляем хвост. List в деле, погнали!', 7200);
      return;
    }

    if (event === 'eat') {
      state.eatCount += 1;
      if (state.eatCount % 5 === 0) {
        speak('Яблоко поймал? Красава! Это твой .append() — добавил элемент в конец списка. Змейка выросла на один элемент. Метод сработал, список удлинился.', 7000);
      }
      return;
    }

    if (event === 'poop') {
      if (state.poopShown) return;
      state.poopShown = true;
      speak('Опа, 💩 на поле! В коде тоже бывает мусор. Фильтруй данные, чисти список, иначе Exception прилетит быстрее, чем ты моргнёшь.', 7200);
      return;
    }

    if (event === 'death') {
      speak('Всё, приехали. Врезался в стену или в себя — это твой Exception. Цикл прервался, break сработал. Лови ошибку, читай трейсбек, ищи где накосячил.', 7600);
      return;
    }
  }

  window.EducationModule = {
    setEnabled,
    syncEnabledFromStorage,
    onEvent
  };

  // initial sync (safe)
  syncEnabledFromStorage();
})();
