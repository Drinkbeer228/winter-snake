// === АУДИО СИСТЕМА ===
const audio = {
  enabled: localStorage.getItem('snakeSoundEnabled') !== 'false',
  musicEnabled: localStorage.getItem('snakeMusicEnabled') === 'true',
  ctx: null,
  bgMusic: null,
  unlocked: false
};

// === ИНИЦИАЛИЗАЦИЯ AUDIO CONTEXT ===
function initAudio() {
  try {
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    initAudioUnlock();
  } catch (e) {
    console.warn('Web Audio API не поддерживается:', e);
  }
}

function initAudioUnlock() {
  if (!audio.ctx || audio.unlocked) return;

  const unlock = async () => {
    if (!audio.ctx || audio.unlocked) return;
    try {
      if (audio.ctx.state === 'suspended') {
        await audio.ctx.resume();
      }
      audio.unlocked = true;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);

      // Если музыка включена — пытаемся стартовать после разблокировки
      if (audio.musicEnabled && audio.bgMusic) {
        audio.bgMusic.play().catch(() => {});
      }
    } catch (_) {
      // игнор
    }
  };

  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });
  document.addEventListener('keydown', unlock, { passive: true });
}

function ensureAudioReady() {
  if (!audio.enabled || !audio.ctx) return false;
  if (audio.ctx.state === 'suspended') {
    audio.ctx.resume().catch(() => {});
  }
  return true;
}

// === ЗВУКОВЫЕ ЭФФЕКТЫ ===
function playSound(type) {
  if (!ensureAudioReady()) return;
  
  const t = audio.ctx.currentTime;

  const out = audio.ctx.createGain();
  out.gain.value = 0.9;
  out.connect(audio.ctx.destination);

  const makeOsc = (type, freq) => {
    const osc = audio.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    return osc;
  };

  const makeGain = (value) => {
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(value, t);
    return g;
  };

  const noiseBuffer = () => {
    const len = Math.floor(audio.ctx.sampleRate * 0.08);
    const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.9;
    }
    return buffer;
  };
  
  switch (type) {
    case 'eat':
      // Мягкий колокольчик + "снежный" хруст
      {
        const osc1 = makeOsc('sine', 880);
        const osc2 = makeOsc('triangle', 1320);
        osc2.frequency.exponentialRampToValueAtTime(660, t + 0.12);

        const g = makeGain(0.0001);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

        osc1.connect(g);
        osc2.connect(g);
        g.connect(out);

        const src = audio.ctx.createBufferSource();
        src.buffer = noiseBuffer();
        const ng = makeGain(0.0001);
        ng.gain.exponentialRampToValueAtTime(0.10, t + 0.005);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        const lp = audio.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1400, t);

        src.connect(lp);
        lp.connect(ng);
        ng.connect(out);

        osc1.start(t);
        osc2.start(t);
        src.start(t);
        osc1.stop(t + 0.2);
        osc2.stop(t + 0.2);
        src.stop(t + 0.09);
      }
      break;
      
    case 'gameover':
      // Глухой, низкий, не пугающий
      {
        const osc = makeOsc('sine', 110);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);
        const g = makeGain(0.0001);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.9);
      }
      break;

    case 'newrecord':
      // Торжественный двойной колокольчик
      {
        const o1 = makeOsc('sine', 784);
        const o2 = makeOsc('sine', 988);
        const g = makeGain(0.0001);
        g.gain.exponentialRampToValueAtTime(0.24, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o1.connect(g);
        o2.connect(g);
        g.connect(out);
        o1.start(t);
        o2.start(t);
        o1.stop(t + 0.35);
        o2.stop(t + 0.35);

        const o3 = makeOsc('triangle', 1175);
        const g2 = makeGain(0.0001);
        g2.gain.exponentialRampToValueAtTime(0.16, t + 0.18);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o3.connect(g2);
        g2.connect(out);
        o3.start(t + 0.16);
        o3.stop(t + 0.55);
      }
      break;
      
    case 'pause':
      {
        const osc = makeOsc('sine', 520);
        osc.frequency.exponentialRampToValueAtTime(390, t + 0.12);
        const g = makeGain(0.0001);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(g);
        g.connect(out);
        osc.start(t);
        osc.stop(t + 0.2);
      }
      break;

    case 'turn':
      // Едва заметный шелест
      {
        const src = audio.ctx.createBufferSource();
        src.buffer = noiseBuffer();
        const hp = audio.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(700, t);
        const g = makeGain(0.0001);
        g.gain.exponentialRampToValueAtTime(0.03, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        src.connect(hp);
        hp.connect(g);
        g.connect(out);
        src.start(t);
        src.stop(t + 0.07);
      }
      break;
  }
}

function toggleSound() {
  audio.enabled = !audio.enabled;
  localStorage.setItem('snakeSoundEnabled', audio.enabled);
  
  const btn = document.getElementById('sound-toggle-btn');
  btn.textContent = audio.enabled ? '🔊' : '🔇';
  
  if (audio.enabled) playSound('eat');
}

// === ЗАГЛУШКА ДЛЯ МУЗЫКИ (SpongeBob стиль + океан) ===
// Музыка: "Never mind 1L23" by Setuniman
// Лицензия: Attribution NonCommercial 4.0 (CC BY-NC 4.0)
// Источник: https://freesound.org/people/Setuniman/sounds/261830/
// Атрибуция: Music by Setuniman (https://freesound.org/people/Setuniman/) - Licensed under CC BY-NC 4.0

function initMusicPlaceholder() {
  console.log('🎵 Музыка: инициализация реального файла');
  try {
    // Если добавишь отдельный эмбиент — положи сюда:
    // assets/sounds/winter_ambient.mp3 (или .ogg)
    // Пока используем текущий трек из assets/music.
    audio.bgMusic = new Audio('assets/sounds/winter_ambient.mp3');
    audio.bgMusic.onerror = () => {
      audio.bgMusic = new Audio('assets/music/261830__setuniman__never-mind-1l23.mp3');
      audio.bgMusic.loop = true;
      audio.bgMusic.volume = 0.3;
      audio.bgMusic.preload = 'auto';
      if (audio.musicEnabled && audio.unlocked) {
        audio.bgMusic.play().catch(() => {});
      }
    };
    audio.bgMusic.loop = true;
    audio.bgMusic.volume = 0.3; // Начальная громкость
    audio.bgMusic.preload = 'auto';
    console.log('🎵 Музыка загружена успешно');
  } catch (e) {
    console.warn('🎵 Ошибка загрузки музыки:', e);
  }
}

function toggleMusic() {
  const btn = document.getElementById('music-toggle-btn');
  const isOn = btn.textContent === '🎵'; // Проверяем текущее состояние
  btn.textContent = isOn ? '🔇' : '🎵';

  audio.musicEnabled = !isOn;
  localStorage.setItem('snakeMusicEnabled', audio.musicEnabled);
  
  if (audio.bgMusic) {
    if (isOn) {
      console.log('🔇 Музыка выключена');
      audio.bgMusic.pause();
    } else {
      console.log('🎵 Музыка включена');
      audio.bgMusic.play().catch(e => console.warn('🎵 Ошибка воспроизведения:', e));
    }
  }
}

function setMusicVolume(value) {
  console.log(`🔊 Громкость музыки: ${value}%`);
  if (audio.bgMusic) {
    audio.bgMusic.volume = value / 100;
  }
}

// Экспорт для использования в main.js
window.audioControls = {
  init: initMusicPlaceholder,
  toggle: toggleMusic,
  setVolume: setMusicVolume
};
