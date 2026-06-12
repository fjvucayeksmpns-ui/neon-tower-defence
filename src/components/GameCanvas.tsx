import React, { useRef, useEffect, useState } from 'react';
import { 
  LevelConfig, 
  Tower, 
  Enemy, 
  Projectile, 
  BlastWave, 
  Particle, 
  FloatingText, 
  TowerType, 
  EnemyType,
  Coordinate
} from '../types';
import cyberAudio from '../audio';

interface GameCanvasProps {
  currentLevel: LevelConfig;
  gold: number;
  waveInProgress: boolean;
  gameSpeed: number;
  isPaused: boolean;
  
  selectedBuildType: TowerType | null;
  onSelectBuildType: (type: TowerType | null) => void;
  
  selectedTower: Tower | null;
  onSelectTower: (tower: Tower | null) => void;
  
  onDeductGold: (amount: number) => void;
  onAddGold: (amount: number) => void;
  onLoseLife: (amount: number) => void;
  
  // Wave state callbacks
  onWaveComplete: () => void;
  onLevelCleared: () => void;
  currentWave: number;
  maxWaves: number;

  towers: Tower[];
  setTowers: React.Dispatch<React.SetStateAction<Tower[]>>;

  highestDefensePowerEver: number;
  difficultyAdjustMultiplier: number;

  unlockedBuffs: string[];
  activeSkins?: Record<string, string>;
}

export default function GameCanvas({
  currentLevel,
  gold,
  waveInProgress,
  gameSpeed,
  isPaused,
  selectedBuildType,
  onSelectBuildType,
  selectedTower,
  onSelectTower,
  onDeductGold,
  onAddGold,
  onLoseLife,
  onWaveComplete,
  onLevelCleared,
  currentWave,
  maxWaves,
  towers,
  setTowers,
  highestDefensePowerEver,
  difficultyAdjustMultiplier,
  unlockedBuffs,
  activeSkins
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Simulation States (Refs so the animation loop doesn't restart and experiences 60 FPS smoothness)
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const blastsRef = useRef<BlastWave[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatsRef = useRef<FloatingText[]>([]);
  const shockLinesRef = useRef<{ id: string; x1: number; y1: number; x2: number; y2: number; alpha: number }[]>([]);
  const gravityWellsRef = useRef<{ id: string; x: number; y: number; targetDistance: number; radius: number; duration: number }[]>([]);
  const ticksRef = useRef<number>(0);

  // Mouse interactivity local state
  const [hoverGrid, setHoverGrid] = useState<Coordinate | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState<boolean>(true);

  // Sync waveInProgress prop to ref to prevent frame-delayed race conditions
  const waveInProgressRef = useRef<boolean>(waveInProgress);
  const waveSpawnedRef = useRef<boolean>(false);
  const bossPulseTimerRef = useRef<number>(0);
  waveInProgressRef.current = waveInProgress;

  // Tower static stats reference map
  const getTowerStats = (type: TowerType, level: number = 1) => {
    const multiplier = 1 + (level - 1) * 0.5; // +50% power per level
    const rangeMultiplier = 1 + (level - 1) * 0.15; // +15% range per level
    
    let baseColor = '#00f0ff';
    let baseTitle = 'Лазерна Вежа';
    let baseCost = 100;
    let baseRange = 120;
    let baseDamage = 25;
    let baseCooldown = 15;

    if (type === 'laser') {
      baseColor = '#00f0ff';
      baseTitle = 'Лазерна Вежа';
      baseCost = 100;
      baseRange = 120;
      baseDamage = 25;
      baseCooldown = Math.max(4, 15 - level * 3);
    } else if (type === 'plasma') {
      baseColor = '#bd00ff';
      baseTitle = 'Плазмова Вежа';
      baseCost = 200;
      baseRange = 180;
      baseDamage = 90;
      baseCooldown = Math.max(25, 60 - level * 8);
    } else if (type === 'pulse') {
      baseColor = '#ff9f00';
      baseTitle = 'Імпульсна Вежа';
      baseCost = 175;
      baseRange = 130;
      baseDamage = 40;
      baseCooldown = Math.max(30, 50 - level * 5);
    } else if (type === 'cryo') {
      baseColor = '#00ff66';
      baseTitle = 'Кріо-Вежа';
      baseCost = 125;
      baseRange = 130;
      baseDamage = 0;
      baseCooldown = 0;
    } else if (type === 'tesla') {
      baseColor = '#ec4899';
      baseTitle = 'Тесла-Вежа';
      baseCost = 220;
      baseRange = 140;
      baseDamage = 32;
      baseCooldown = Math.max(10, 24 - level * 2);
    } else if (type === 'railgun') {
      baseColor = '#3b82f6';
      baseTitle = 'Рейкогенератор';
      baseCost = 275;
      baseRange = 280;
      baseDamage = 220;
      baseCooldown = Math.max(60, 110 - level * 10);
    }

    // Apply active cosmetic skin override
    let finalColor = baseColor;
    const currentSkin = (activeSkins && activeSkins[type]) || 'default';
    if (currentSkin && currentSkin !== 'default') {
      if (currentSkin === 'amethyst') finalColor = '#a855f7';
      else if (currentSkin === 'solar') finalColor = '#eab308';
      else if (currentSkin === 'ruby') finalColor = '#ef4444';
      else if (currentSkin === 'neutron') finalColor = '#ffffff';
      else if (currentSkin === 'toxic') finalColor = '#22c55e';
      else if (currentSkin === 'ice') finalColor = '#38bdf8';
      else if (currentSkin === 'singularity') finalColor = '#ec4899';
    }

    return {
      range: baseRange * rangeMultiplier,
      damage: Math.round(baseDamage * multiplier),
      cooldown: baseCooldown,
      color: finalColor,
      title: baseTitle,
      cost: baseCost
    };
  };

  // Grid Cell Config
  const cellWidth = 50;
  const cellHeight = 50;
  const cols = 16;
  const rows = 10;

  // Sync Level Path into blocked grids once level changes
  const computedGrid = useRef<number[][]>([]);

  useEffect(() => {
    // Generate full blocked array (cols x rows)
    const grid: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
    
    // Auto-block elements near the path segments
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cellX = c * cellWidth + cellWidth / 2;
        const cellY = r * cellHeight + cellHeight / 2;
        
        // Find if cell center is nearby the path segments
        let onPath = false;
        for (let i = 0; i < currentLevel.path.length - 1; i++) {
          const pt1 = currentLevel.path[i];
          const pt2 = currentLevel.path[i + 1];
          // Distance from point to line segment
          const dist = distToSegment({ x: cellX, y: cellY }, pt1, pt2);
          if (dist < 36) { // path width is 30px
            onPath = true;
            break;
          }
        }
        
        if (onPath) {
          grid[c][r] = 1; // Mark as street
        } else {
          // Pre-populate some obstacles from decorations
          const matchesDecoration = currentLevel.decorations.some(
            dec => Math.abs(dec.x - cellX) < 25 && Math.abs(dec.y - cellY) < 25
          );
          if (matchesDecoration) {
            grid[c][r] = 2; // Obstacle
          }
        }
      }
    }
    
    computedGrid.current = grid;
    
    // Clean states of enemies, blasts, particles
    enemiesRef.current = [];
    projectilesRef.current = [];
    blastsRef.current = [];
    particlesRef.current = [];
    floatsRef.current = [];
    setTowers([]);
    onSelectTower(null);
  }, [currentLevel]);


  // Helper math for segment distances
  function distToSegment(p: Coordinate, v: Coordinate, w: Coordinate) {
    const l2 = dist2(v, w);
    if (l2 === 0) return Math.sqrt(dist2(p, v));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
  }
  function dist2(v: Coordinate, w: Coordinate) {
    return (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  }

  // Handle Level clear progression trigger
  const [levelClearTimer, setLevelClearTimer] = useState<any>(null);

  // Helper formulas for dynamic wave power calculations within Canvas too
  const getTowerPowerDDS = (type: TowerType, level: number): number => {
    let basePower = 0;
    if (type === 'laser') basePower = 50;
    else if (type === 'plasma') basePower = 60;
    else if (type === 'pulse') basePower = 40;
    else if (type === 'cryo') basePower = 35;

    const levelMult = level === 1 ? 1.0 : level === 2 ? 1.35 : 1.75;
    return basePower * levelMult;
  };

  const getDefensePowerDDS = (towersList: Tower[]): number => {
    return towersList.reduce((sum, t) => sum + getTowerPowerDDS(t.type, t.level), 0);
  };

  const getBaseWavePower = (levelId: number, wave: number): number => {
    if (levelId === 1) {
      if (wave === 1) return 120;
      if (wave === 2) return 180;
      return 240;
    }
    if (levelId === 2) {
      if (wave === 1) return 250;
      if (wave === 2) return 350;
      return 450;
    }
    if (wave === 1) return 450;
    if (wave === 2) return 600;
    return 800;
  };

  // STARTING A WAVE: Populate enemies into compilation
  useEffect(() => {
    if (waveInProgress) {
      ticksRef.current = 0; // reset simulation ticks so warning banner resets and animation effects restart correctly!
      
      // Reset lastShotTime of all built towers so they don't lock down after ticks resets
      setTowers(prev => prev.map(t => ({ ...t, lastShotTime: 0 })));

      const isBossWave = currentLevel.id === 3 && currentWave === 3;
      
      // Calculate dynamic wave power
      const baseWavePower = getBaseWavePower(currentLevel.id, currentWave);
      const currentDefensePower = getDefensePowerDDS(towers);
      const effectiveDefensePower = Math.max(currentDefensePower, highestDefensePowerEver);
      const calculatedWavePower = (baseWavePower + (effectiveDefensePower * 0.35)) * difficultyAdjustMultiplier;

      const ENEMY_POWERS: Record<EnemyType, number> = {
        drone: 10,
        assault: 25,
        phantom: 30,
        heavy: 45,
        glitch: 35,
        boss: 300
      };

      const getSpawnPool = (levelId: number, wave: number): EnemyType[] => {
        const pool: EnemyType[] = ['drone'];
        if (levelId === 1) {
          if (wave >= 2) pool.push('assault');
          if (wave >= 3) pool.push('heavy');
        } else if (levelId === 2) {
          pool.push('assault');
          if (wave >= 2) pool.push('phantom', 'glitch');
          if (wave >= 3) pool.push('heavy');
        } else {
          // Level 3
          pool.push('assault', 'phantom', 'heavy', 'glitch');
        }
        return pool;
      };

      let remainingPower = calculatedWavePower;
      if (isBossWave) {
        remainingPower = Math.max(0, remainingPower - ENEMY_POWERS.boss);
      }

      const pool = getSpawnPool(currentLevel.id, currentWave);
      const enemyTypes: EnemyType[] = [];

      while (remainingPower >= 10) {
        const validTypes = pool.filter(type => ENEMY_POWERS[type] <= remainingPower);
        if (validTypes.length === 0) {
          const cheapest = pool.reduce((a, b) => ENEMY_POWERS[a] < ENEMY_POWERS[b] ? a : b);
          enemyTypes.push(cheapest);
          break;
        }

        const selectedType = validTypes[Math.floor(Math.random() * validTypes.length)];
        enemyTypes.push(selectedType);
        remainingPower -= ENEMY_POWERS[selectedType];
      }

      // Sort types from lowest power to highest power to build a progressive escalation feel!
      enemyTypes.sort((a, b) => ENEMY_POWERS[a] - ENEMY_POWERS[b]);

      const tempEnemies: Enemy[] = [];

      // Spawn wave power standard balanced entities
      enemyTypes.forEach((type, i) => {
        const stats = getEnemyStats(type, effectiveDefensePower);
        const offsetPixels = -i * (type === 'drone' ? 45 : type === 'heavy' ? 80 : 60);

        tempEnemies.push({
          id: `enemy_${i}_${Date.now()}`,
          type,
          title: stats.title,
          x: offsetPixels,
          y: 0,
          realX: currentLevel.path[0].x,
          realY: currentLevel.path[0].y,
          pathIndex: 0,
          distanceTraveled: offsetPixels,
          health: stats.hp,
          maxHealth: stats.hp,
          speed: stats.speed,
          originalSpeed: stats.speed,
          color: stats.color,
          size: stats.size,
          goldReward: stats.reward,
          evadeChance: stats.evadeChance,
          slowTimer: 0,
          slowRate: 1,
          angle: 0
        });
      });

      // Spawn Omega-Titan Boss last if boss wave!
      if (isBossWave) {
        const stats = getEnemyStats('boss', effectiveDefensePower);
        const bossIndex = enemyTypes.length;
        const offsetPixels = -bossIndex * 70 - 150; // Spawns towards the very end as leader

        tempEnemies.push({
          id: `boss_omega_titan_${Date.now()}`,
          type: 'boss',
          title: stats.title,
          x: offsetPixels,
          y: 0,
          realX: currentLevel.path[0].x,
          realY: currentLevel.path[0].y,
          pathIndex: 0,
          distanceTraveled: offsetPixels,
          health: stats.hp,
          maxHealth: stats.hp,
          speed: stats.speed,
          originalSpeed: stats.speed,
          color: stats.color,
          size: stats.size,
          goldReward: stats.reward,
          evadeChance: stats.evadeChance,
          slowTimer: 0,
          slowRate: 1,
          angle: 0,
          shield: 1000, // extra protective aura shield
          armor: stats.armor
        });
      }

      enemiesRef.current = tempEnemies;
      waveSpawnedRef.current = true;
    } else {
      waveSpawnedRef.current = false;
    }
  }, [waveInProgress]);

  // Static stats for enemies depending on scale
  const getEnemyStats = (type: EnemyType, effDefPower: number) => {
    switch (type) {
      case 'drone':
        return {
          title: 'Швидкий Дрон',
          hp: 120,
          speed: 2.5,
          size: 9,
          reward: 10,
          color: '#00f0ff',
          evadeChance: 0,
          armor: 0
        };
      case 'assault':
        return {
          title: 'Робот-штурмовик',
          hp: 350,
          speed: 1.3,
          size: 13,
          reward: 20,
          color: '#ff9f00',
          evadeChance: 0,
          armor: 0
        };
      case 'heavy':
        return {
          title: 'Важкий мех',
          hp: 500,
          speed: 0.9,
          size: 18,
          reward: 40,
          color: '#ff0055',
          evadeChance: 0,
          armor: 0
        };
      case 'phantom':
        return {
          title: 'Кібер-Фантом',
          hp: 350,
          speed: 2.2,
          size: 11,
          reward: 30,
          color: '#bd00ff',
          evadeChance: 0.05,
          armor: 0
        };
      case 'boss':
        const bossHealth = Math.round(5000 + effDefPower * 4);
        const bossArmor = 10 + effDefPower * 0.02;
        return {
          title: 'Омега-Титан [Ω]',
          hp: bossHealth,
          speed: 0.5,
          size: 32,
          reward: 800,
          color: '#ff003c',
          evadeChance: 0,
          armor: bossArmor
        };
      case 'glitch':
        return {
          title: 'Глітч-Дрон',
          hp: 480,
          speed: 1.8,
          size: 13,
          reward: 65,
          color: '#facc15',
          evadeChance: 0,
          armor: 0
        };
    }
  };

  // Helper function to query a target along the path
  const findAngle = (p1: Coordinate, p2: Coordinate) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  };

  // MAIN RUNTIME SIMULATION LOOP
  useEffect(() => {
    let animationId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Loop throttler on pause
      const speed = isPaused ? 0 : gameSpeed;
      ticksRef.current += speed;

      // Handle updating coordinates & firing rules times on gameSpeed multiplier loop
      for (let s = 0; s < speed; s++) {
        updateEntities();
      }

      // Draw everything
      drawEverything(ctx);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [currentLevel, isPaused, gameSpeed, selectedBuildType, selectedTower, hoverGrid, isValidPlacement, towers]);

  // Update dynamic entities
  const updateEntities = () => {
    // 1. UPDATE ENEMIES ALONG THEIR PATHWAY POINTS
    const path = currentLevel.path;
    const activeEnemies: Enemy[] = [];
    const cryoTowers = towers.filter(t => t.type === 'cryo' && !t.isDeactivated);

    enemiesRef.current.forEach((en) => {
      // Completely destroy and remove dead enemies immediately!
      if (en.health <= 0) return;

      // Handle Fire/Burn Tick Damage
      if (en.burnTimer && en.burnTimer > 0) {
        en.burnTimer--;
        if (en.burnTimer % 15 === 0) { // Every quarter second (at 60 FPS)
          const stacks = en.burnStacks || 1;
          const tickDamage = 3 * stacks; // 12 damage/sec per stack
          dealDamageToEnemy(en, tickDamage, false); // false = bypass recursive triggers
          
          if (en.health > 0) {
            // Emit fire spark particle floating upwards
            particlesRef.current.push({
              id: `burn_f_${Date.now()}_${Math.random()}`,
              x: en.realX + (Math.random() - 0.5) * en.size,
              y: en.realY - (Math.random() - 0.5) * en.size,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1 - Math.random() * 1.5,
              color: '#f97316',
              alpha: 1.0,
              size: Math.random() * 2 + 1,
              maxLife: 20,
              life: 0
            });
          }
        }
        if (en.burnTimer <= 0) {
          en.burnStacks = 0;
        }
      }

      if (en.health <= 0) return;

      // Move enemy forward in direction of target node
      if (en.distanceTraveled < 0) {
        // Still waiting in spawn queue line, just increment travels
        en.distanceTraveled += en.speed * en.slowRate;
        activeEnemies.push(en);
        return;
      }

      // Check if enemy is within the range of any Cryo tower
      const isInCryoRange = cryoTowers.some((tow) => {
        const dist = Math.sqrt((en.realX - tow.x)**2 + (en.realY - tow.y)**2);
        return dist <= tow.range;
      });

      if (isInCryoRange) {
        // Constantly and permanently slow down while in range
        en.slowRate = en.type === 'boss' ? 0.6 : 0.35; // increased slow rate by 15% (boss now 40% slow, others 65% slow)
        en.slowTimer = 5; // buffer slow frames so stepping out doesn't flicker
      } else if (en.slowTimer > 0) {
        en.slowTimer--;
        if (en.slowTimer <= 0) {
          en.slowRate = 1; // recover speed fully
        }
      } else {
        en.slowRate = 1;
      }

      // Calculate path progress
      en.distanceTraveled += en.speed * en.slowRate;
      
      // Interpolate onto exact paths
      let distAccumulator = 0;
      let placedOnNode = false;

      for (let i = 0; i < path.length - 1; i++) {
        const pt1 = path[i];
        const pt2 = path[i + 1];
        const segLen = Math.sqrt((pt2.x - pt1.x)**2 + (pt2.y - pt1.y)**2);

        if (en.distanceTraveled >= distAccumulator && en.distanceTraveled <= distAccumulator + segLen) {
          const t = (en.distanceTraveled - distAccumulator) / segLen;
          en.realX = pt1.x + t * (pt2.x - pt1.x);
          en.realY = pt1.y + t * (pt2.y - pt1.y);
          en.angle = findAngle(pt1, pt2);
          
          // Phantom sine weave movement wobble
          if (en.type === 'phantom') {
            const wobble = Math.sin(ticksRef.current * 0.12) * 16;
            en.realX += Math.cos(en.angle + Math.PI/2) * wobble;
            en.realY += Math.sin(en.angle + Math.PI/2) * wobble;
          }

          placedOnNode = true;
          break;
        }
        distAccumulator += segLen;
      }

      if (!placedOnNode && en.distanceTraveled > distAccumulator) {
        // Reached Core! Deal Base Damage!
        cyberAudio.playDamageBase();
        const baseDamage = 1;
        onLoseLife(baseDamage);
        
        // Float loss text
        spawnFloatText(`-${baseDamage}`, currentLevel.path[currentLevel.path.length-1].x - 20, currentLevel.path[currentLevel.path.length-1].y - 30, '#ef4444');
      } else {
        // Keep in play bounds
        activeEnemies.push(en);
      }
    });

    enemiesRef.current = activeEnemies;

    // Trigger wave completion or level victory when all spawns are terminated exactly once
    if (waveInProgressRef.current && waveSpawnedRef.current && enemiesRef.current.length === 0) {
      waveInProgressRef.current = false;
      waveSpawnedRef.current = false;
      onWaveComplete();
    }

    // 2. TOWERS ACQUIRING TARGETS & SHOOTING MECHANICS
    towers.forEach((tow) => {
      if (tow.isDeactivated) {
        tow.shootEffectActive = false;
        return;
      }
      if (tow.type === 'cryo') {
        // Passive area continuous freeze aura, no target-shooting projectile logic
        return;
      }

      // Find enemies in range. Pick closest to destination
      const inRangeEnemies = enemiesRef.current.filter((en) => {
        if (en.distanceTraveled < 0 || en.health <= 0) return false; // ignore waiting queue & dead ones
        const dist = Math.sqrt((en.realX - tow.x)**2 + (en.realY - tow.y)**2);
        return dist <= tow.range;
      });

      // Target criteria: enemy with the maximum progress distance traveled
      if (inRangeEnemies.length > 0) {
        inRangeEnemies.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
        const primaryTarget = inRangeEnemies[0];

        // Is tower off shoot cooldown?
        const stats = getTowerStats(tow.type, tow.level);
        if (ticksRef.current - tow.lastShotTime >= stats.cooldown) {
          tow.lastShotTime = ticksRef.current;
          
          if (tow.type === 'laser') {
            // Instant continuous channel trace
            cyberAudio.playLaser();
            dealDamageToEnemy(primaryTarget, stats.damage, true, true);
            tow.shootEffectActive = true;
            
            // Neon cyan laser bullet line effects
            spawnLaserSparks(tow, primaryTarget);
          } 
          else if (tow.type === 'plasma') {
            // Launch slower heavier orb projectile
            cyberAudio.playPlasma();
            let proj: Projectile = {
              id: `proj_${Date.now()}_${Math.random()}`,
              type: 'plasma',
              x: tow.x,
              y: tow.y,
              startX: tow.x,
              startY: tow.y,
              targetX: primaryTarget.realX,
              targetY: primaryTarget.realY,
              targetId: primaryTarget.id,
              speed: 6.5,
              damage: stats.damage,
              splashRadius: 65, // AoE splash
              progress: 0,
              color: stats.color
            };
            projectilesRef.current.push(proj);
          } 
          else if (tow.type === 'pulse') {
            // Area expanding EMP blast wave from core
            cyberAudio.playPulse();
            blastsRef.current.push({
              id: `blast_${Date.now()}_${Math.random()}`,
              x: tow.x,
              y: tow.y,
              radius: 5,
              maxRadius: stats.range,
              color: stats.color,
              damage: stats.damage,
              alpha: 1.0
            });
          }
          else if (tow.type === 'tesla') {
            cyberAudio.playLaser();
            dealDamageToEnemy(primaryTarget, stats.damage, true);
            
            // Spawn sparks at primary
            for (let i = 0; i < 3; i++) {
              particlesRef.current.push({
                id: `tesla_prim_${Date.now()}_${Math.random()}`,
                x: primaryTarget.realX,
                y: primaryTarget.realY,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: stats.color,
                alpha: 1.0,
                size: 2,
                maxLife: 15,
                life: 0
              });
            }

            // Find up to 2 extra targets near primary Target to chain onto
            const chains: string[] = [primaryTarget.id];
            const extraTargets = enemiesRef.current.filter(en => {
              if (en.id === primaryTarget.id || en.distanceTraveled < 0 || en.health <= 0) return false;
              const dist = Math.sqrt((en.realX - primaryTarget.realX)**2 + (en.realY - primaryTarget.realY)**2);
              return dist <= 85; 
            });

            extraTargets.sort((a, b) => {
              const dA = Math.sqrt((a.realX - primaryTarget.realX)**2 + (a.realY - primaryTarget.realY)**2);
              const dB = Math.sqrt((b.realX - primaryTarget.realX)**2 + (b.realY - primaryTarget.realY)**2);
              return dA - dB;
            });

            const maxChains = 2;
            for (let c = 0; c < Math.min(maxChains, extraTargets.length); c++) {
              const chained = extraTargets[c];
              chains.push(chained.id);
              dealDamageToEnemy(chained, Math.round(stats.damage * 0.7), true);
              
              // Spawn sparks at chained enemies
              for (let i = 0; i < 2; i++) {
                particlesRef.current.push({
                  id: `tesla_ch_${Date.now()}_${Math.random()}`,
                  x: chained.realX,
                  y: chained.realY,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: stats.color,
                  alpha: 1.0,
                  size: 1.8,
                  maxLife: 12,
                  life: 0
                });
              }
            }

            (tow as any).teslaChains = chains;
            tow.shootEffectActive = true;
          }
          else if (tow.type === 'railgun') {
            cyberAudio.playPlasma();
            let mult = 1.0;
            if (primaryTarget.health === primaryTarget.maxHealth) {
              mult = 1.5;
              spawnFloatText('ПОВНА СИЛА!', primaryTarget.realX - 25, primaryTarget.realY - 32, '#3b82f6');
            }
            dealDamageToEnemy(primaryTarget, Math.round(stats.damage * mult), true);

            // Spawn massive piercing shock sparks
            for (let i = 0; i < 6; i++) {
              particlesRef.current.push({
                id: `rail_prim_${Date.now()}_${Math.random()}`,
                x: primaryTarget.realX,
                y: primaryTarget.realY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: stats.color,
                alpha: 1.0,
                size: 3,
                maxLife: 20,
                life: 0
              });
            }

            // Math projection: line distance pierces nearby targets along line of fire
            enemiesRef.current.forEach((en) => {
              if (en.id === primaryTarget.id || en.distanceTraveled < 0 || en.health <= 0) return;
              
              // Standard point-to-line segment distance helper
              const x1 = tow.x;
              const y1 = tow.y;
              const x2 = primaryTarget.realX;
              const y2 = primaryTarget.realY;
              const dx = x2 - x1;
              const dy = y2 - y1;
              let distToLine = 999;
              if (dx !== 0 || dy !== 0) {
                const t = Math.max(0, Math.min(1, ((en.realX - x1) * dx + (en.realY - y1) * dy) / (dx*dx + dy*dy)));
                const nx = x1 + t * dx;
                const ny = y1 + t * dy;
                distToLine = Math.sqrt((en.realX - nx)**2 + (en.realY - ny)**2);
              }

              if (distToLine <= 24) {
                dealDamageToEnemy(en, Math.round(stats.damage * 0.4 * mult), true);
                particlesRef.current.push({
                  id: `rail_pierce_${Date.now()}_${Math.random()}`,
                  x: en.realX,
                  y: en.realY,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: stats.color,
                  alpha: 1.0,
                  size: 2,
                  maxLife: 15,
                  life: 0
                });
              }
            });

            (tow as any).railTarget = { x: primaryTarget.realX, y: primaryTarget.realY };
            tow.shootEffectActive = true;
          }
        }
      } else {
        tow.shootEffectActive = false;
      }
    });

    // 3. PROJECTILES UPDATING
    let activeProjectiles: Projectile[] = [];
    projectilesRef.current.forEach((p) => {
      // Find current position of track if alive
      const targetEnemy = enemiesRef.current.find(e => e.id === p.targetId);
      if (targetEnemy) {
        p.targetX = targetEnemy.realX;
        p.targetY = targetEnemy.realY;
      }

      // Interpolate progress towards target coordinate
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < p.speed) {
        // Projectile IMPACT colliding!
        triggerProjectileImpact(p);
      } else {
        // Advance
        const ratio = p.speed / dist;
        p.x += dx * ratio;
        p.y += dy * ratio;
        activeProjectiles.push(p);
      }
    });
    projectilesRef.current = activeProjectiles;

    // 4. BLAST EMP WAVES UPDATING
    let activeBlasts: BlastWave[] = [];
    blastsRef.current.forEach((b) => {
      b.radius += 4; // expansion velocity
      b.alpha = Math.max(0, 1.0 - (b.radius / b.maxRadius));

      // Damage enemies caught once inside boundary rings
      enemiesRef.current.forEach((en) => {
        if (en.distanceTraveled < 0) return;
        const dist = Math.sqrt((en.realX - b.x)**2 + (en.realY - b.y)**2);
        // If enemy is directly touching expanding circumference ring border
        if (Math.abs(dist - b.radius) < 7) {
          dealDamageToEnemy(en, b.damage / 3.5); // spread pulse damage smoothly 
        }
      });

      if (b.radius < b.maxRadius) {
        activeBlasts.push(b);
      }
    });
    blastsRef.current = activeBlasts;

    // 5. FX PARTICLES ENGINE
    let activeParticles: Particle[] = [];
    particlesRef.current.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      // Add friction
      pt.vx *= 0.95;
      pt.vy *= 0.95;
      pt.life++;
      pt.alpha = Math.max(0, 1 - (pt.life / pt.maxLife));
      
      if (pt.life < pt.maxLife) {
        activeParticles.push(pt);
      }
    });
    particlesRef.current = activeParticles;

    // 6. FLOATING TEXT TICKER
    let activeFloats: FloatingText[] = [];
    floatsRef.current.forEach((fl) => {
      fl.y -= 0.5; // slow fly up
      fl.life++;
      fl.alpha = Math.max(0, 1 - (fl.life / 40));
      if (fl.life < 40) {
        activeFloats.push(fl);
      }
    });
    floatsRef.current = activeFloats;

    // 7. GRAVITY WELL SYSTEM UPDATES
    let activeWells: any[] = [];
    gravityWellsRef.current.forEach((well) => {
      well.duration--;

      // Siphon all matching targets inside gravity area
      enemiesRef.current.forEach((en) => {
        if (en.distanceTraveled < 0 || en.health <= 0) return;
        const dist = Math.sqrt((en.realX - well.x)**2 + (en.realY - well.y)**2);
        if (dist <= well.radius) {
          const distanceDiff = well.targetDistance - en.distanceTraveled;
          if (Math.abs(distanceDiff) > 2) {
            // Siphon pull force scales with proximity to black hole
            const pullForce = 1.0 * (1.0 - dist / well.radius);
            en.distanceTraveled += Math.sign(distanceDiff) * pullForce * 1.5;
          }

          // Emit purple visual vortex swirl feed particles
          if (Math.random() < 0.15) {
            const rot = Math.random() * Math.PI * 2;
            const radiusOffset = Math.random() * 30 + 10;
            particlesRef.current.push({
              id: `grav_pt_${Date.now()}_${Math.random()}`,
              x: well.x + Math.cos(rot) * radiusOffset,
              y: well.y + Math.sin(rot) * radiusOffset,
              vx: -Math.cos(rot) * 1.5,
              vy: -Math.sin(rot) * 1.5,
              color: '#d8b4fe',
              alpha: 0.9,
              size: Math.random() * 2 + 1,
              maxLife: 20,
              life: 0
            });
          }
        }
      });

      if (well.duration > 0) {
        activeWells.push(well);
      }
    });
    gravityWellsRef.current = activeWells;

    // 8. SHOCK LIGHTNING DECAY
    let activeShockLines: any[] = [];
    shockLinesRef.current.forEach((line) => {
      line.alpha -= 0.12; // dissolves in ~8 frames
      if (line.alpha > 0) {
        activeShockLines.push(line);
      }
    });
    shockLinesRef.current = activeShockLines;

    // Tectonic Pulse Boss Ability:
    // Every 180 ticks (3 seconds), the boss deactivates exactly ONE closest active tower.
    // If the boss dies or is no longer present, all deactivated towers are restored.
    const activeBoss = enemiesRef.current.find(en => en.type === 'boss' && en.health > 0 && en.distanceTraveled >= 0);
    if (activeBoss) {
      bossPulseTimerRef.current++;
      if (bossPulseTimerRef.current >= 180) { // 3 seconds at 60 FPS
        bossPulseTimerRef.current = 0;
        triggerTectonicPulse(activeBoss);
      }
    } else {
      bossPulseTimerRef.current = 0;
      // If there are deactivated towers but no alive boss on screen, restore all systems!
      const hasDeactivated = towers.some(t => t.isDeactivated);
      if (hasDeactivated) {
        setTowers(prev => prev.map(t => t.isDeactivated ? { ...t, isDeactivated: false } : t));
        spawnFloatText('СИСТЕМИ ВІДНОВЛЕНО!', 400, 250, '#00ff66');
      }
    }
  };

  // Tectonic Pulse: deactivates closest active tower to the boss
  const triggerTectonicPulse = (boss: Enemy) => {
    // Find all built towers that are NOT deactivated
    const activeTowers = towers.filter(t => !t.isDeactivated);
    if (activeTowers.length === 0) return;

    // Find the tower closest to the boss
    let closestTower: Tower | null = null;
    let minDist = Infinity;
    activeTowers.forEach((t) => {
      const dist = Math.sqrt((t.x - boss.realX)**2 + (t.y - boss.realY)**2);
      if (dist < minDist) {
        minDist = dist;
        closestTower = t;
      }
    });

    if (closestTower) {
      const targetId = (closestTower as Tower).id;
      // Spawn a visual warning/blast wave or sparks at that tower
      spawnSplashDebris((closestTower as Tower).x, (closestTower as Tower).y, '#ff3333', 18);
      spawnFloatText('БЛОКУВАННЯ!', (closestTower as Tower).x - 30, (closestTower as Tower).y - 25, '#ff3333');
      
      // Update towers state to deactivate this specific tower, and restore any other currently deactivated tower
      setTowers(prev => prev.map(t => {
        if (t.id === targetId) {
          return { ...t, isDeactivated: true };
        } else if (t.isDeactivated) {
          return { ...t, isDeactivated: false };
        }
        return t;
      }));

      // Play pulse audio effect
      cyberAudio.playPulse();
    }
  };

  // ==========================================
  // TOWER WEAPON BUFFER/MODIFIER SUB-SYSTEMS
  // ==========================================
  const applyTowerBuffEffects = (enemy: Enemy, isLaser: boolean) => {
    if (!enemy || enemy.health <= 0) return;

    // 1. BURN EFFECT (Підпал)
    if (unlockedBuffs.includes('burn')) {
      const burnApplyChance = isLaser ? 0.20 : 0.85;
      if (Math.random() < burnApplyChance) {
        enemy.burnStacks = Math.min(3, (enemy.burnStacks || 0) + 1);
        enemy.burnTimer = 240; // 4 seconds (ticks 60 FPS)
      }
    }

    // 2. CHAIN LIGHTNING SHOCK (Електрошок)
    if (unlockedBuffs.includes('electro')) {
      const electroChance = isLaser ? 0.05 : 0.40;
      if (Math.random() < electroChance) {
        triggerElectroShock(enemy);
      }
    }

    // 3. OVERLOAD STACK (Перевантаження)
    if (unlockedBuffs.includes('overload')) {
      const overloadWeight = isLaser ? 0.25 : 1.0;
      if (Math.random() < overloadWeight) {
        enemy.overloadStacks = (enemy.overloadStacks || 0) + 1;
        if (enemy.overloadStacks >= 5) {
          enemy.overloadStacks = 0;
          triggerOverloadExplosion(enemy);
        }
      }
    }

    // 4. GRAVITY WELL VORTEX (Гравітаційне поле)
    if (unlockedBuffs.includes('gravity')) {
      const gravityChance = isLaser ? 0.015 : 0.12;
      if (Math.random() < gravityChance) {
        triggerGravityWell(enemy);
      }
    }

    // 5. QUANTUM TELEPORTER (Телепортатор)
    if (unlockedBuffs.includes('teleport')) {
      const teleportChance = isLaser ? 0.012 : 0.12;
      if (Math.random() < teleportChance) {
        triggerTeleport(enemy);
      }
    }
  };

  const triggerElectroShock = (sourceEnemy: Enemy) => {
    // Find up to 4 other nearby threats within 120 pixels
    const targets = enemiesRef.current
      .filter(en => en.id !== sourceEnemy.id && en.distanceTraveled >= 0 && en.health > 0)
      .map(en => {
        const dist = Math.sqrt((en.realX - sourceEnemy.realX)**2 + (en.realY - sourceEnemy.realY)**2);
        return { enemy: en, dist };
      })
      .filter(item => item.dist <= 120)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);

    if (targets.length === 0) return;

    let prevX = sourceEnemy.realX;
    let prevY = sourceEnemy.realY;

    targets.forEach(({ enemy: nextEnemy }) => {
      // Deal direct electro static damage (cannot chain lock recursively to avoid infinite damage storm loops)
      dealDamageToEnemy(nextEnemy, 18, false);

      // Save a dynamic render lightning segment line
      shockLinesRef.current.push({
        id: `shock_${Date.now()}_${Math.random()}`,
        x1: prevX,
        y1: prevY,
        x2: nextEnemy.realX,
        y2: nextEnemy.realY,
        alpha: 1.0
      });

      // Scatter electric neon fragments of energy
      spawnSplashDebris(nextEnemy.realX, nextEnemy.realY, '#60a5fa', 3);

      prevX = nextEnemy.realX;
      prevY = nextEnemy.realY;
    });

    cyberAudio.playLaser(); // trigger discharge frequency humming
  };

  const triggerOverloadExplosion = (enemy: Enemy) => {
    // Spawn floating notification indicator and heavy fiery debris splats
    spawnFloatText('💥 ПЕРЕВАНТАЖЕННЯ!', enemy.realX - 45, enemy.realY - 30, '#eab308');
    spawnSplashDebris(enemy.realX, enemy.realY, '#facc15', 12);

    // Blast damage neighbors in 75px splash area
    enemiesRef.current.forEach((en) => {
      if (en.distanceTraveled < 0 || en.health <= 0) return;
      const dist = Math.sqrt((en.realX - enemy.realX)**2 + (en.realY - enemy.realY)**2);
      if (dist <= 75) {
        const scaling = 1.0 - (dist / 75);
        dealDamageToEnemy(en, Math.round(55 * scaling), false);
      }
    });

    // Create a visuals blast wave ring expands outwards
    blastsRef.current.push({
      id: `overload_blast_${Date.now()}_${Math.random()}`,
      x: enemy.realX,
      y: enemy.realY,
      radius: 10,
      maxRadius: 75,
      color: '#eab308',
      damage: 0, // visuals expander only, damage computed already manually
      alpha: 1.0
    });
  };

  const triggerGravityWell = (enemy: Enemy) => {
    // Avoid double gravity singularity overlays perfectly on the same pixel coordinate
    const existsNearby = gravityWellsRef.current.some(w => 
      Math.sqrt((w.x - enemy.realX)**2 + (w.y - enemy.realY)**2) < 42
    );
    if (existsNearby) return;

    spawnFloatText('🌀 АНОМАЛІЯ', enemy.realX - 30, enemy.realY - 24, '#c084fc');
    
    gravityWellsRef.current.push({
      id: `grav_well_${Date.now()}_${Math.random()}`,
      x: enemy.realX,
      y: enemy.realY,
      targetDistance: enemy.distanceTraveled,
      radius: 110,
      duration: 150 // 2.5s duration
    });
  };

  const triggerTeleport = (enemy: Enemy) => {
    const backupDistance = enemy.type === 'boss' ? 45 : 150; // 3 cells back for defaults, less for boss health protection
    
    const preX = enemy.realX;
    const preY = enemy.realY;

    enemy.distanceTraveled = Math.max(0, enemy.distanceTraveled - backupDistance);

    spawnFloatText('🌀 ТЕЛЕПОРТ!', enemy.realX - 30, enemy.realY - 22, '#34d399');

    // Spawn green/emerald quantum particle bursts
    spawnSplashDebris(preX, preY, '#10b981', 8);
    spawnSplashDebris(enemy.realX, enemy.realY, '#34d399', 8);
  };

  // Inflict damage to enemy, handling dodge of Phantoms
  const dealDamageToEnemy = (enemy: Enemy, dmg: number, allowBuffs: boolean = true, isLaser: boolean = false) => {
    // 30% dodge checks on Phantoms
    if (enemy.type === 'phantom' && Math.random() < enemy.evadeChance) {
      spawnFloatText('УХИЛЕННЯ!', enemy.realX - 25, enemy.realY - 18, '#bd00ff');
      return;
    }

    // 20% Glitch-Shift quantum warp on Glitch-Drones!
    if (enemy.type === 'glitch' && Math.random() < 0.20) {
      spawnFloatText('ГЛІТЧ-ЗСУВ!', enemy.realX - 25, enemy.realY - 18, '#facc15');
      enemy.distanceTraveled += 20; // glitch teleports slightly forward on the track!
      return;
    }

    let actualDamage = dmg;

    // Apply Boss Shield Absorptions, Quantum Armors and flat armor scaling
    if (enemy.type === 'boss') {
      if (enemy.armor !== undefined) {
        actualDamage = Math.max(1, actualDamage - enemy.armor);
      }
      // 40% reduction
      actualDamage = actualDamage * 0.6;
      if (enemy.shield && enemy.shield > 0) {
        enemy.shield -= actualDamage;
        if (enemy.shield < 0) {
          enemy.shield = 0;
        }
        spawnFloatText(`-${Math.round(actualDamage)} [ЩИТ]`, enemy.realX - 15, enemy.realY - 18, '#ff3b30');
        return;
      }
    }

    enemy.health -= actualDamage;

    // Execute active passive modifications if standing
    if (allowBuffs && enemy.health > 0) {
      applyTowerBuffEffects(enemy, isLaser);
    }

    // Check if enemy exploded!
    if (enemy.health <= 0) {
      explodeEnemy(enemy);
    }
  };

  // Split and hit projectiles onto destination arrays
  const triggerProjectileImpact = (p: Projectile) => {
    if (p.type === 'plasma') {
      // Splash explosion radius!
      spawnSplashDebris(p.x, p.y, p.color || '#bd00ff', 16);
      
      enemiesRef.current.forEach((en) => {
        if (en.distanceTraveled < 0) return;
        const dist = Math.sqrt((en.realX - p.x)**2 + (en.realY - p.y)**2);
        if (p.splashRadius && dist <= p.splashRadius) {
          // splash damage scaled linearly with distance
          const distanceScale = 1 - (dist / p.splashRadius);
          dealDamageToEnemy(en, p.damage * distanceScale);
        }
      });
    } 
    else if (p.type === 'cryo') {
      // Direct frost damage and freezing slowing timers
      spawnSplashDebris(p.x, p.y, p.color || '#00ff66', 8);
      
      const targetEnemy = enemiesRef.current.find(e => e.id === p.targetId);
      if (targetEnemy) {
        dealDamageToEnemy(targetEnemy, p.damage);
        if (p.slowRate && p.slowDuration) {
          // bosses have cold resistances: cuts freeze length in half
          const finalDuration = targetEnemy.type === 'boss' ? p.slowDuration / 2 : p.slowDuration;
          targetEnemy.slowTimer = finalDuration;
          targetEnemy.slowRate = p.slowRate;
        }
      }
    }
  };

  // Splat floating damage particles on hit
  const spawnLaserSparks = (tow: Tower, target: Enemy) => {
    const stats = getTowerStats(tow.type, tow.level);
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        id: `sparks_${Date.now()}_${Math.random()}`,
        x: target.realX,
        y: target.realY,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: stats.color,
        alpha: 1.0,
        size: 2,
        maxLife: 15,
        life: 0
      });
    }
  };

  const spawnSplashDebris = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        id: `pt_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: Math.random() * 3 + 1,
        maxLife: 25,
        life: 0
      });
    }
  };

  // Kill and award gold rewards
  const explodeEnemy = (en: Enemy) => {
    // Generate reward and floats
    onAddGold(en.goldReward);
    spawnFloatText(`+${en.goldReward} CR`, en.realX, en.realY - 10, '#f59e0b');

    // Heavy glowing colored neon particle debris explosion
    const particleColors = [en.color, '#ffffff'];
    const count = en.type === 'boss' ? 80 : en.type === 'heavy' ? 25 : 12;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (en.type === 'boss' ? 12 : 6) + 2;
      particlesRef.current.push({
        id: `fire_${Date.now()}_${Math.random()}`,
        x: en.realX,
        y: en.realY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: 1.0,
        size: Math.random() * (en.type === 'boss' ? 6 : 4) + 1.5,
        maxLife: Math.random() * 35 + 20,
        life: 0
      });
    }
  };

  const spawnFloatText = (text: string, x: number, y: number, color: string) => {
    floatsRef.current.push({
      id: `fl_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 0
    });
  };

  // DOCK RENDER STYLES: Drawing beautiful cyberpunk circuit grid
  const drawEverything = (ctx: CanvasRenderingContext2D) => {
    const width = 800;
    const height = 500;
    ctx.clearRect(0, 0, width, height);

    // 1. CHASSIS DARK NET GRID THEME BACKGROUND
    ctx.fillStyle = '#05070c'; // deep black space
    ctx.fillRect(0, 0, width, height);

    // Grid Circuit traces lines (Cyber look)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#021e2d'; // faint tech grid lines
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
    }
    for (let j = 0; j <= rows; j++) {
      ctx.moveTo(0, j * cellHeight);
      ctx.lineTo(width, j * cellHeight);
    }
    ctx.stroke();

    // Secondary motherboard elements (circles and trace pathways)
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#05293d';
    ctx.fillStyle = '#05293d';
    currentLevel.decorations.forEach((dec) => {
      ctx.beginPath();
      if (dec.type === 'circle') {
        ctx.arc(dec.x, dec.y, dec.size, 0, Math.PI*2);
        ctx.stroke();
      } else {
        ctx.strokeRect(dec.x - dec.size/2, dec.y - dec.size/2, dec.size, dec.size);
      }
      
      // glowing ambient node decoration lights
      if (dec.glow) {
        ctx.fillStyle = currentLevel.color + '44'; // semi transparent level theme color
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 4, 0, Math.PI*2);
        ctx.fill();
      }
    });

    // 2. CONSTRUCT ROAD TRACK WITH NEON STROKES
    const path = currentLevel.path;
    
    // Outer bold track glow layer
    ctx.shadowBlur = 18;
    ctx.shadowColor = currentLevel.color;
    ctx.lineWidth = 32;
    ctx.strokeStyle = currentLevel.color + '18'; // highly diluted neon tint
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    path.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Central bright conductor line
    ctx.shadowBlur = 8;
    ctx.shadowColor = currentLevel.color;
    ctx.lineWidth = 16;
    ctx.strokeStyle = currentLevel.color + '44'; // solid semi-trans glow conduit
    ctx.stroke();

    // Pure white ultra-core wire in center
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Reset shadow blur
    ctx.shadowBlur = 0;

    // Draw Starting Portal & Mainframe Core portal
    const startPt = path[0];
    const endPt = path[path.length - 1];

    // Core mainframe portal gateway node pulsing
    const pulseRadius = 14 + Math.sin(ticksRef.current * 0.08) * 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fd2254';
    ctx.fillStyle = '#100a0d';
    ctx.strokeStyle = '#fd2254';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, pulseRadius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. RENDER TOWERS
    towers.forEach((tow) => {
      const stats = getTowerStats(tow.type, tow.level);
      
      // Is current tower selected? Draw range ring & selection circle
      const isSelected = selectedTower && selectedTower.id === tow.id;
      if (isSelected) {
        ctx.strokeStyle = stats.color + '44';
        ctx.fillStyle = stats.color + '0a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(tow.x, tow.y, tow.range, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#ffffff77';
        ctx.strokeRect(tow.x - 24, tow.y - 24, 48, 48);
      }

      // Draw Tower Base Base with themed colored circuits
      ctx.fillStyle = tow.isDeactivated ? '#221212' : '#0b0f19';
      ctx.strokeStyle = tow.isDeactivated ? '#ff2222' : (stats.color + '88');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tow.x, tow.y, 18, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Draw level notches
      ctx.fillStyle = tow.isDeactivated ? '#662222' : stats.color;
      for (let l = 0; l < tow.level; l++) {
        ctx.beginPath();
        ctx.arc(tow.x - 12 + l * 12, tow.y + 13, 2, 0, Math.PI*2);
        ctx.fill();
      }

      // Tower Turret gun nozzle pointing towards target
      let targetDx = 0;
      let targetDy = 0;
      
      const inRangeEnemies = enemiesRef.current.filter((en) => {
        if (en.distanceTraveled < 0) return false;
        const dist = Math.sqrt((en.realX - tow.x)**2 + (en.realY - tow.y)**2);
        return dist <= tow.range;
      });

      if (inRangeEnemies.length > 0) {
        inRangeEnemies.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
        const activeTarg = inRangeEnemies[0];
        targetDx = activeTarg.realX - tow.x;
        targetDy = activeTarg.realY - tow.y;
      }

      // Compute pointing angle
      const turretAngle = targetDx !== 0 || targetDy !== 0 ? Math.atan2(targetDy, targetDx) : ticksRef.current * 0.01 * (tow.type === 'plasma' ? 1.5 : 0.8);

      // Render Turret Head barrel lines with theme glow
      ctx.save();
      ctx.translate(tow.x, tow.y);
      ctx.rotate(turretAngle);

      // Draw structural elements
      ctx.fillStyle = '#161d30';
      ctx.strokeStyle = stats.color;
      ctx.lineWidth = 1.5;

      if (tow.type === 'laser') {
        // Laser double emitters
        ctx.fillRect(-8, -6, 12, 12);
        ctx.strokeRect(-8, -6, 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -4, 8, 2);
        ctx.fillRect(4, 2, 8, 2);
      } 
      else if (tow.type === 'plasma') {
        // Thick massive plasma gun barrel
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -3, 14, 6);
      } 
      else if (tow.type === 'cryo') {
        // Triple radial cooling vanes
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = stats.color;
        for (let i = 0; i < 3; i++) {
          const vAngle = (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(vAngle) * 12, Math.sin(vAngle) * 12);
          ctx.stroke();
        }
      } 
      else if (tow.type === 'pulse') {
        // EMP spherical dish core
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        // Pulsing core indicator ring
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4 + Math.sin(ticksRef.current * 0.15) * 2, 0, Math.PI*2);
        ctx.stroke();
      }
      else if (tow.type === 'tesla') {
        // Concentric coil arcs
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = stats.color;
        ctx.lineWidth = 1.8;
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.arc(0, 0, 4 + r * 3, -1.2, 1.2);
          ctx.stroke();
        }
      }
      else if (tow.type === 'railgun') {
        // Two parallel rails pointing forward
        ctx.lineWidth = 2;
        ctx.strokeStyle = stats.color;
        ctx.strokeRect(-5, -6, 10, 8); // heavy base
        
        // Draw left and right rails
        ctx.beginPath();
        ctx.moveTo(-3, -6);
        ctx.lineTo(-3, 15);
        ctx.moveTo(3, -6);
        ctx.lineTo(3, 15);
        ctx.stroke();

        // Small glowing charge rod in center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -3, 2, 12);
      }

      ctx.restore();

      if (tow.isDeactivated) {
        // Red diagonal slashed hazard line or cross over the tower
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tow.x - 12, tow.y - 12);
        ctx.lineTo(tow.x + 12, tow.y + 12);
        ctx.moveTo(tow.x + 12, tow.y - 12);
        ctx.lineTo(tow.x - 12, tow.y + 12);
        ctx.stroke();

        // Small neon warning status dot
        ctx.fillStyle = '#ff1111';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(tow.x, tow.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Visual "DISABLD" tag above it
        ctx.fillStyle = '#ff2020';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DISABLD', tow.x, tow.y - 18);
      }

      // Visual Instant Laser Shooting Beam render
      if (tow.type === 'laser' && tow.shootEffectActive && inRangeEnemies.length > 0) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = stats.color;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = stats.color;
        ctx.beginPath();
        ctx.moveTo(tow.x, tow.y);
        ctx.lineTo(inRangeEnemies[0].realX, inRangeEnemies[0].realY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Visual Chained Tesla Lightning render
      if (tow.type === 'tesla' && tow.shootEffectActive && (tow as any).teslaChains) {
        const chainIds: string[] = (tow as any).teslaChains;
        let prevX = tow.x;
        let prevY = tow.y;

        chainIds.forEach((targetId, idx) => {
          const activeEn = enemiesRef.current.find(e => e.id === targetId);
          if (activeEn && activeEn.health > 0) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = stats.color;
            ctx.strokeStyle = stats.color;
            ctx.lineWidth = idx === 0 ? 3.0 : 1.8;

            // Draw lightning jagged/crackly paths
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            const dx = activeEn.realX - prevX;
            const dy = activeEn.realY - prevY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const segments = Math.max(3, Math.floor(dist / 22));

            for (let s = 1; s <= segments; s++) {
              const ratio = s / segments;
              let px = prevX + dx * ratio;
              let py = prevY + dy * ratio;
              if (s < segments) {
                const perpX = -dy / dist;
                const perpY = dx / dist;
                // Crackle random displacement!
                const jitter = (Math.random() - 0.5) * 11;
                px += perpX * jitter;
                py += perpY * jitter;
              }
              ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Searing hot core wire line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = idx === 0 ? 1.2 : 0.6;
            ctx.stroke();
            ctx.restore();

            prevX = activeEn.realX;
            prevY = activeEn.realY;
          }
        });
      }

      // Visual Railgun line render
      if (tow.type === 'railgun' && tow.shootEffectActive && (tow as any).railTarget) {
        const rTarget = (tow as any).railTarget;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = stats.color;
        ctx.strokeStyle = stats.color;
        ctx.lineWidth = 5.5;

        ctx.beginPath();
        ctx.moveTo(tow.x, tow.y);
        ctx.lineTo(rTarget.x, rTarget.y);
        ctx.stroke();

        // Inner searing plasma core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Visual Instant Frost Connection/Aura Streams for Cryo towers
      if (tow.type === 'cryo' && inRangeEnemies.length > 0) {
        inRangeEnemies.forEach((en) => {
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = stats.color;
          ctx.strokeStyle = stats.color + '44'; // semi-transparent neon frost stream
          ctx.lineWidth = 1.8;
          
          // Draw a cool wavy/zigzag freeze beam
          ctx.beginPath();
          ctx.moveTo(tow.x, tow.y);
          
          const dx = en.realX - tow.x;
          const dy = en.realY - tow.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const segments = 6;
          for (let k = 1; k <= segments; k++) {
            const ratio = k / segments;
            let px = tow.x + dx * ratio;
            let py = tow.y + dy * ratio;
            if (k < segments) {
              const perpX = -dy / distance;
              const perpY = dx / distance;
              const wave = Math.sin(ticksRef.current * 0.15 + k * 1.5) * 4;
              px += perpX * wave;
              py += perpY * wave;
            }
            ctx.lineTo(px, py);
          }
          ctx.stroke();
          
          // Draw a small frozen concentric frost ring around the slowed target
          ctx.beginPath();
          ctx.arc(en.realX, en.realY, en.size + 3 + Math.sin(ticksRef.current * 0.1) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#00ff6666';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        });
      }
    });

    // 4. RENDER PROJECTILES (PLASMABALLS, CRYO FROSTS)
    projectilesRef.current.forEach((p) => {
      ctx.save();
      ctx.shadowBlur = 10;
      
      if (p.type === 'plasma') {
        const bulletColor = p.color || '#bd00ff';
        ctx.shadowColor = bulletColor;
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();
      } 
      else if (p.type === 'cryo') {
        const bulletColor = p.color || '#00ff66';
        ctx.shadowColor = bulletColor;
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 6, p.y);
        ctx.lineTo(p.x + 6, p.y);
        ctx.moveTo(p.x, p.y - 6);
        ctx.lineTo(p.x, p.y + 6);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 5. RENDER EXPANDING EMP WAVELENGTH DISCS
    blastsRef.current.forEach((b) => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3 * b.alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
      ctx.stroke();

      ctx.fillStyle = b.color + '15'; // mild wash
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // 6. RENDER ENEMIES
    enemiesRef.current.forEach((en) => {
      if (en.distanceTraveled < 0) return; // ignore waiting spawners

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = en.color;

      // Draw chilled freezing circle state
      if (en.slowTimer > 0) {
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(en.realX, en.realY, en.size + 4, 0, Math.PI*2);
        ctx.stroke();
      }

      // Draw custom enemy chassis models
      if (en.type === 'drone') {
        // High Speed triangle drone pointed in route angle
        ctx.translate(en.realX, en.realY);
        ctx.rotate(en.angle);
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.moveTo(-en.size, -en.size * 0.8);
        ctx.lineTo(en.size * 1.2, 0);
        ctx.lineTo(-en.size, en.size * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI*2);
        ctx.fill();
      } 
      else if (en.type === 'assault') {
        // Square armored warrior model with core eye
        ctx.translate(en.realX, en.realY);
        ctx.rotate(en.angle + Math.PI/4);
        ctx.fillStyle = '#111726';
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-en.size, -en.size, en.size*2, en.size*2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.rect(-en.size/2, -en.size/2, en.size, en.size);
        ctx.fill();
      } 
      else if (en.type === 'heavy') {
        // Hexagonal thick boss armor tank model
        ctx.translate(en.realX, en.realY);
        ctx.rotate(en.angle);
        ctx.fillStyle = '#171116';
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const rx = Math.cos(angle) * en.size;
          const ry = Math.sin(angle) * en.size;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // internal glow ring
        ctx.strokeStyle = '#ffffff55';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, en.size * 0.5, 0, Math.PI*2);
        ctx.stroke();
      } 
      else if (en.type === 'phantom') {
        // Glowing double-wing shape, waving movement
        ctx.translate(en.realX, en.realY);
        ctx.rotate(en.angle);
        ctx.fillStyle = en.color + '44'; // semi transparent cloak
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(-en.size, -en.size * 0.5);
        ctx.lineTo(en.size * 1.3, 0);
        ctx.lineTo(-en.size, en.size * 0.5);
        ctx.lineTo(-en.size * 0.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(en.size*0.3, 0, 3, 0, Math.PI*2);
        ctx.fill();
      } 
      else if (en.type === 'glitch') {
        // Chromatic aberration glitch effect! He vibrates rapidly.
        const jitterX = Math.sin(ticksRef.current * 0.9) * 3;
        const jitterY = Math.cos(ticksRef.current * 0.7) * 3;
        
        ctx.translate(en.realX + jitterX, en.realY + jitterY);
        ctx.rotate(en.angle + Math.sin(ticksRef.current * 0.35) * 0.08);
        
        ctx.lineWidth = 1.5;

        // Draw cyan glitch shadow
        ctx.strokeStyle = '#00f0ffaa';
        ctx.strokeRect(-en.size - 2, -en.size * 0.5 + 1, en.size * 1.8, en.size);

        // Draw magenta glitch shadow
        ctx.strokeStyle = '#ec4899aa';
        ctx.strokeRect(-en.size + 2, -en.size * 0.5 - 1, en.size * 1.8, en.size);

        // Draw main yellow/gold vehicle chassis
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#eab308';
        ctx.beginPath();
        ctx.rect(-en.size, -en.size * 0.5, en.size * 1.8, en.size);
        ctx.fill();
        ctx.stroke();

        // Shimmering micro electrical discharges
        if (Math.random() < 0.4) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-en.size, (Math.random() - 0.5) * 4);
          ctx.lineTo(en.size * 0.8, (Math.random() - 0.5) * 6);
          ctx.stroke();
        }

        // Glitch red central visor core
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(en.size * 0.2, 0, 3.5, 0, Math.PI*2);
        ctx.fill();
      }
      else if (en.type === 'boss') {
        // GIGANTIC OMEGA-TITAN CORE
        ctx.translate(en.realX, en.realY);
        ctx.rotate(ticksRef.current * -0.015); // spins CCW

        // Outer spinning weapon circle armor notches
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, en.size, 0, Math.PI*2);
        ctx.stroke();

        // 8 outer structural shield points
        ctx.fillStyle = '#0f0205';
        for (let i = 0; i < 8; i++) {
          const pointAngle = (i * Math.PI) / 4;
          const px = Math.cos(pointAngle) * en.size;
          const py = Math.sin(pointAngle) * en.size;
          
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI*2);
          ctx.fill();
          ctx.stroke();
        }

        // Inside glowing threat eye cores
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fill();

        // Core pulsing energy radiation
        ctx.shadowBlur = 0;
        ctx.strokeStyle = en.color + 'aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + Math.sin(ticksRef.current * 0.2) * 5, 0, Math.PI*2);
        ctx.stroke();
      }

      ctx.restore();

      // HEALTHBARS
      const barWidth = en.size * 2;
      const barHeight = 4;
      const barX = en.realX - barWidth / 2;
      const barY = en.realY - en.size - 9;

      // Gray container background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Remaining core HP color
      const hpPct = Math.max(0, en.health / en.maxHealth);
      ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.2 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

      // Render extra blue Shield Bar above Boss Core
      if (en.type === 'boss' && en.shield && en.shield > 0) {
        const shieldPct = en.shield / 2500;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(barX, barY - 5, barWidth * shieldPct, 3);
      }

      // RENDER WEAPON BUFFER BADGES ABOVE ENEMY
      // Let's draw fire halo if enemy is burning
      if (en.burnTimer && en.burnTimer > 0) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f97316';
        ctx.strokeStyle = '#f97316aa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Pulsing fiery halo around the enemy
        ctx.arc(en.realX, en.realY, en.size + 2 + Math.sin(ticksRef.current * 0.2) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Draw small flame symbol under healthbar
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('🔥', en.realX - en.size - 12, en.realY - en.size - 13);
      }

      // Draw overload charge dots orbiting the enemy chassis
      if (en.overloadStacks && en.overloadStacks > 0) {
        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#facc15';
        for (let s = 0; s < en.overloadStacks; s++) {
          const orbitAngle = (s * Math.PI * 2) / 4 + ticksRef.current * 0.04;
          const ox = en.realX + Math.cos(orbitAngle) * (en.size + 6);
          const oy = en.realY + Math.sin(orbitAngle) * (en.size + 6);
          ctx.beginPath();
          ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    });

    // 7. RENDER PARTICLES debris
    particlesRef.current.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    // 8. RENDER FLOATING SCORE LABELS
    floatsRef.current.forEach((fl) => {
      ctx.save();
      ctx.globalAlpha = fl.alpha;
      ctx.fillStyle = fl.color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(fl.text, fl.x, fl.y);
      ctx.restore();
    });

    // 8a. DRAW SHOCK LIGHTNING SPLINES
    shockLinesRef.current.forEach((line) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.strokeStyle = `rgba(96, 165, 250, ${line.alpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);

      // Draw a highly electric lightning jagged path
      const dx = line.x2 - line.x1;
      const dy = line.y2 - line.y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const jaggedPoints = Math.max(3, Math.floor(distance / 20));

      for (let k = 1; k < jaggedPoints; k++) {
        const ratio = k / jaggedPoints;
        let px = line.x1 + dx * ratio;
        let py = line.y1 + dy * ratio;

        // Jagged offset perpendicular wave
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const offset = (Math.random() - 0.5) * 14;
        px += perpX * offset;
        py += perpY * offset;

        ctx.lineTo(px, py);
      }
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();

      // Core white light trace
      ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    });

    // 8b. DRAW GRAVITY WELLS VORTEX BLACK HOLES
    gravityWellsRef.current.forEach((well) => {
      ctx.save();
      const pulseScale = 1.0 + Math.sin(ticksRef.current * 0.1) * 0.15;
      const coreRadius = 14 * pulseScale;

      // Draw outer gravity bounds
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a78bfa';
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Fill gravity region with soft purple haze
      const hazeGrd = ctx.createRadialGradient(well.x, well.y, 5, well.x, well.y, well.radius);
      hazeGrd.addColorStop(0, 'rgba(124, 58, 237, 0.15)');
      hazeGrd.addColorStop(0.5, 'rgba(109, 40, 217, 0.05)');
      hazeGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hazeGrd;
      ctx.beginPath();
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      ctx.fill();

      // Spinning purple accretion disk
      ctx.translate(well.x, well.y);
      ctx.rotate(ticksRef.current * 0.05);
      
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius + i * 6, i * 1.2, i * 1.2 + Math.PI);
        ctx.stroke();
      }

      // Gravitational Singularity Core Center
      ctx.fillStyle = '#090514';
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    // 9. RE-RENDER HOVER PLACEMENT PREVIEWS FOR TOWER ARSENAL BUILD
    if (selectedBuildType && hoverGrid) {
      const stats = getTowerStats(selectedBuildType);
      const px = hoverGrid.x * cellWidth + cellWidth / 2;
      const py = hoverGrid.y * cellHeight + cellHeight / 2;

      // Draw Range Ring of select type
      ctx.save();
      ctx.shadowBlur = isValidPlacement ? 10 : 0;
      ctx.shadowColor = stats.color;
      
      ctx.strokeStyle = isValidPlacement ? stats.color + '44' : '#ef444455';
      ctx.fillStyle = isValidPlacement ? stats.color + '0a' : '#ef444405';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.arc(px, py, stats.range, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Placement square notches indicators
      ctx.strokeStyle = isValidPlacement ? stats.color : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(hoverGrid.x * cellWidth + 2, hoverGrid.y * cellHeight + 2, cellWidth - 4, cellHeight - 4);
      ctx.restore();
    }
  };

  // MOUSE EVENT HANDLERS: Tracking Grid Cell coordinates target placement
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (800 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);

    // Map into grid space
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);

    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      setHoverGrid({ x: gridX, y: gridY });
      
      // Placement validations:
      // must NOT be road path (1) or obstacles (2)
      // must NOT have an existing tower in the cell
      const isRoad = computedGrid.current[gridX] && computedGrid.current[gridX][gridY] === 1;
      const isObstacle = computedGrid.current[gridX] && computedGrid.current[gridX][gridY] === 2;
      const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);

      setIsValidPlacement(!isRoad && !isObstacle && !hasTower);
    } else {
      setHoverGrid(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverGrid(null);
  };

  // MOUSE CLICK: Building or selecting towers
  const handleCanvasClick = () => {
    if (!hoverGrid) return;

    const gridX = hoverGrid.x;
    const gridY = hoverGrid.y;

    if (selectedBuildType) {
      // Placing Tower Action
      if (isValidPlacement) {
        const stats = getTowerStats(selectedBuildType);
        if (gold >= stats.cost) {
          // Add newly constructed tower
          const newTower: Tower = {
            id: `tower_${Date.now()}`,
            x: gridX * cellWidth + cellWidth / 2,
            y: gridY * cellHeight + cellHeight / 2,
            gridX,
            gridY,
            type: selectedBuildType,
            level: 1,
            range: stats.range,
            damage: stats.damage,
            cooldown: stats.cooldown,
            lastShotTime: 0,
            cost: stats.cost,
            title: stats.title,
            color: stats.color
          };

          cyberAudio.playUpgrade(); // build ring sound
          onDeductGold(stats.cost);
          setTowers([...towers, newTower]);
          onSelectBuildType(null); // release cursor build tool
          onSelectTower(newTower); // auto select
        } else {
          // Fail afford
          cyberAudio.playDamageBase();
          spawnFloatText('НЕДОСТАТНЬО КРЕДИТІВ!', gridX * cellWidth + 20, gridY * cellHeight - 10, '#ef4444');
        }
      } else {
        // Invalid slot buzz
        cyberAudio.playDamageBase();
      }
    } else {
      // Query existing tower selection
      const clickedTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);
      if (clickedTower) {
        cyberAudio.playLevelSelect();
        onSelectTower(clickedTower);
      } else {
        // click empty slot cancels selections
        if (selectedTower) {
          cyberAudio.playLevelSelect();
          onSelectTower(null);
        }
      }
    }
  };

  return (
    <div id="canvas_box" className="relative border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden flex justify-center items-center shadow-inner cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className="w-full max-w-full block aspect-[8/5]"
      />
      
      {/* Wave Threat Siren Alarm Warning text */}
      {waveInProgress && ticksRef.current < 180 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-black/85 border border-red-500/30 p-5 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.4)] backdrop-blur-md pointer-events-none animate-[ping-once_2s_ease-out_1]">
          <span className="text-red-500 font-mono font-bold tracking-[8px] animate-pulse text-lg uppercase h-6">ХВИЛЯ {currentWave} НАДХОДИТЬ</span>
          <span className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Обороняйте центральне ядро!</span>
        </div>
      )}
      
      {/* Paused cover screen overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center pointer-events-none">
          <div className="border border-yellow-500/30 bg-yellow-950/10 px-6 py-4 rounded-xl text-center shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">
            <span className="text-yellow-500 font-mono font-bold uppercase tracking-[4px] text-lg block">ГРУ ЗУПИНЕНО</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest">КЛІКНІТЬ 'ПАУЗА' ДЛЯ ПРОДОВЖЕННЯ</span>
          </div>
        </div>
      )}
    </div>
  );
}
