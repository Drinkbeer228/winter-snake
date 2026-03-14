export const CONFIG = {
  GRID: 20,
  CANVAS_SIZE: 400,
  INITIAL_SPEED: 400,
  MIN_SPEED: 50,
  SPEED_MULTIPLIER: 0.9,  // Каждые 5 очков скорость * 0.9
  soundEnabled: true,
  volume: 0.5,
  debug: true
};

export const COLORS = {
  SNAKE_HEAD: '#2ecc71',
  SNAKE_BODY: '#27ae60', 
  FOOD: '#ff3b3b',
  BG_TOP: '#0f1c16',
  BG_BOTTOM: '#050907',
  
  // Новые цвета для будущих механик
  POOP: '#8B4513',      // коричневый
  BROOM: '#FFD700',     // золотой
  OBSTACLE: '#808080',  // серый (камень)
  HAMMER: '#C0C0C0'     // серебряный
};

export const LEVELS = []; // Один бесконечный уровень
