// === АУДИО СИСТЕМА ===
const audio = {
  enabled: localStorage.getItem('snakeSoundEnabled') !== 'false',
  ctx: null
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
// Позже заменишь на реальный аудиофайл

function initMusicPlaceholder() {
  console.log('🎵 Музыка-заглушка: стиль SpongeBob + шум моря');
  // Здесь будет: audio.bgMusic = new Audio('assets/music/spongebob-ocean.mp3');
}

function toggleMusic() {
  const btn = document.getElementById('music-toggle-btn');
  const isOn = btn.textContent === '🎵';
  btn.textContent = isOn ? '🔇' : '🎵';
  
  if (isOn) {
    console.log('🎵 Музыка включена (заглушка)');
    // Позже: audio.bgMusic.play();
  } else {
    console.log('🔇 Музыка выключена');
    // Позже: audio.bgMusic.pause();
  }
}

function setMusicVolume(value) {
  console.log(`🔊 Громкость музыки: ${value}%`);
  // Позже: audio.bgMusic.volume = value / 100;
}

// Экспорт для использования в main.js
window.audioControls = {
  init: initMusicPlaceholder,
  toggle: toggleMusic,
  setVolume: setMusicVolume
};
