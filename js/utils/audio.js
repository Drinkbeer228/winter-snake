import { CONFIG } from './config.js';

// Инициализация Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
CONFIG.audioContext = audioCtx;

export function playSound(type) {
  if (!CONFIG.soundEnabled || !CONFIG.audioContext) return;
  
  const oscillator = CONFIG.audioContext.createOscillator();
  const gainNode = CONFIG.audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(CONFIG.audioContext.destination);
  
  switch(type) {
    case 'eat':
      oscillator.frequency.setValueAtTime(600, CONFIG.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, CONFIG.audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(CONFIG.volume * 0.1, CONFIG.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, CONFIG.audioContext.currentTime + 0.1);
      oscillator.start(CONFIG.audioContext.currentTime);
      oscillator.stop(CONFIG.audioContext.currentTime + 0.1);
      break;
  }
}
