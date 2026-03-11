// === АУДИО СИСТЕМА ===
const audio = {
  enabled: localStorage.getItem('snakeSoundEnabled') !== 'false',
  ctx: null,
  bgMusic: null
};

// === ИНИЦИАЛИЗАЦИЯ AUDIO CONTEXT ===
function initAudio() {
  try {
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API не поддерживается:', e);
  }
}

// === ЗВУКОВЫЕ ЭФФЕКТЫ ===
function playSound(type) {
  if (!audio.enabled || !audio.ctx) return;
  
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.connect(gain);
  gain.connect(audio.ctx.destination);
  
  const t = audio.ctx.currentTime;
  
  switch (type) {
    case 'eat':
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
      
    case 'gameover':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, t);
      osc.frequency.exponentialRampToValueAtTime(146.83, t + 0.6);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
      osc.start(t);
      osc.stop(t + 1.0);
      break;
      
    case 'pause':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
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
// Заменяем на реальный аудиофайл

function initMusicPlaceholder() {
  console.log('🎵 Музыка: инициализация реального файла');
  try {
    audio.bgMusic = new Audio('assets/music/261830__setuniman__never-mind-1l23.mp3');
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
  const isOn = btn.textContent === '🎵';
  btn.textContent = isOn ? '🔇' : '🎵';
  
  if (audio.bgMusic) {
    if (isOn) {
      console.log('🎵 Музыка включена');
      audio.bgMusic.play().catch(e => console.warn('🎵 Ошибка воспроизведения:', e));
    } else {
      console.log('🔇 Музыка выключена');
      audio.bgMusic.pause();
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
