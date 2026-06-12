export type TowerType = 'laser' | 'plasma' | 'pulse' | 'cryo' | 'tesla' | 'railgun';
export type EnemyType = 'drone' | 'assault' | 'heavy' | 'phantom' | 'boss' | 'glitch';

export interface Coordinate {
  x: number;
  y: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  color: string;
  glowColor: string;
  path: Coordinate[];
  unlocked: boolean;
  gridCells: number[][]; // 0 = empty, 1 = path, 2 = obstacle/decoration
  decorations: { x: number; y: number; size: number; glow: boolean; type: string }[];
}

export interface Tower {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  type: TowerType;
  level: number;
  range: number;
  damage: number;
  cooldown: number; // in ticks or ms
  lastShotTime: number;
  cost: number;
  title: string;
  color: string;
  shootEffectActive?: boolean;
  isDeactivated?: boolean;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  title: string;
  x: number;
  y: number;
  realX: number; // screen coordinate
  realY: number; // screen coordinate
  pathIndex: number;
  distanceTraveled: number;
  health: number;
  maxHealth: number;
  speed: number;
  originalSpeed: number;
  color: string;
  size: number;
  goldReward: number;
  evadeChance: number; // Phantom evasion chance
  slowTimer: number; // ticks left for freeze slow
  slowRate: number; // speed multiplier (e.g. 0.5)
  angle: number;
  shield?: number; // Boss shield
  armor?: number; // Boss flat armor mitigation
  burnStacks?: number;
  burnTimer?: number;
  overloadStacks?: number;
}

export interface Projectile {
  id: string;
  type: 'laser' | 'plasma' | 'cryo';
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetId: string;
  speed: number;
  damage: number;
  progress: number; // 0 to 1
  splashRadius?: number;
  slowDuration?: number;
  slowRate?: number;
  color?: string;
}

export interface BlastWave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  damage: number;
  alpha: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  maxLife: number;
  life: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

export interface GameStats {
  gold: number;
  lives: number;
  wave: number;
  maxWaves: number;
  isGameOver: boolean;
  isGameWon: boolean;
  hasBeatenAll: boolean;
  score: number;
}
