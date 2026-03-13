import { CONFIG } from './config.js';

export function playSound(name) {
  if (!CONFIG.soundEnabled) {
    // Визуальная заглушка для отладки
    if (CONFIG.debug) {
      console.log(`🔊 [SFX] ${name}`);
      showDebugFeedback(name);
    }
    return;
  }
  
  // Тут потом будет реальный звук
  // const audio = new Audio(`/assets/sounds/${name}.mp3`);
  // audio.play().catch(() => {});
}

// Простая визуальная обратная связь
function showDebugFeedback(text) {
  const el = document.createElement('div');
  el.textContent = `🔊 ${text}`;
  el.style.cssText = `
    position: fixed; top: 10px; right: 10px;
    background: rgba(0,0,0,0.7); color: #fff;
    padding: 5px 10px; border-radius: 4px;
    font-size: 12px; pointer-events: none;
    animation: fadeOut 1s forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
