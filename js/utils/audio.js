import { CONFIG } from './config.js';

// Аудио система с реальными файлами
export const audio = {
  // Загружаем аудио файлы
  sounds: {
    eat: new Audio('./assets/sounds/eat.ogg'),
    crash: null, // пока нет файла
    boost: null  // пока нет файла
  },

  // Инициализация
  init() {
    // Настраиваем звук еды
    this.sounds.eat.volume = 0.3;
    this.sounds.eat.preload = 'auto';
    
    console.log('🔊 Audio system initialized');
  },

  playEat() {
    try {
      this.sounds.eat.currentTime = 0;
      this.sounds.eat.play().catch(e => {
        console.log('🔊 Eat sound play failed:', e);
        // Фоллбэк на Web Audio API
        this.playFallbackEat();
      });
    } catch (e) {
      console.log('🔊 Eat sound error:', e);
      this.playFallbackEat();
    }
  },

  playCrash() {
    // Фоллбэк - пока нет файла
    this.playFallbackCrash();
  },

  playBoost() {
    // Фоллбэк - пока нет файла
    this.playFallbackBoost();
  },

  // Фоллбэки через Web Audio API
  playFallbackEat() {
    if (!CONFIG.debug) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  },

  playFallbackCrash() {
    if (!CONFIG.debug) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  },

  playFallbackBoost() {
    if (!CONFIG.debug) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 400;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }
};

// Инициализация при загрузке
audio.init();
