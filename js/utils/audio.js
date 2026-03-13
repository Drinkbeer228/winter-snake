import { CONFIG } from './config.js';

// Инициализация Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(name) {
  if (!CONFIG.soundEnabled) return;
  
  if (name === 'eat') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
}
