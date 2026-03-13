import { CONFIG } from './config.js';

export function playSound(name) {
  if (!CONFIG.soundEnabled) return;
  console.log(`🔊 Sound: ${name}`);
}
