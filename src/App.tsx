import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Play, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  RotateCcw, 
  Home, 
  Cpu, 
  Zap, 
  Flame, 
  Radio, 
  Snowflake,
  Music,
  LogOut,
  Coins,
  Gift,
  Palette
} from 'lucide-react';
import { LevelConfig, Tower, GameStats, TowerType } from './types';
import LevelSelector from './components/LevelSelector';
import GameHUD from './components/GameHUD';
import GameCanvas from './components/GameCanvas';
import Almanac from './components/Almanac';
import WheelOfFortune from './components/WheelOfFortune';
import cyberAudio from './audio';

// Map Configurations
const LEVELS_DATA: LevelConfig[] = [
  {
    id: 1,
    name: 'Неонове місто',
    description: 'Окутаний туманом сітчастий хайвей центрального мегаполіса. Легкий початковий сектор зі стандартними коридорами.',
    color: '#00f0ff', // Cyan
    glowColor: 'shadow-[0_0_20px_#00f0ff] hover:shadow-[0_0_30px_#00f0ff]',
    path: [
      { x: 0, y: 150 },
      { x: 250, y: 150 },
      { x: 250, y: 350 },
      { x: 550, y: 350 },
      { x: 550, y: 100 },
      { x: 800, y: 100 }
    ],
    unlocked: true,
    gridCells: [],
    decorations: [
      { x: 100, y: 70, size: 15, glow: true, type: 'circle' },
      { x: 400, y: 200, size: 20, glow: false, type: 'rect' },
      { x: 700, y: 250, size: 10, glow: true, type: 'circle' },
      { x: 150, y: 450, size: 12, glow: false, type: 'circle' },
      { x: 650, y: 420, size: 18, glow: true, type: 'rect' }
    ]
  },
  {
    id: 2,
    name: 'Кібер-завод',
    description: 'Індустріальна ядерна зона переробки металу. Вузькі заплутані коридори з підвищеним навантаженням важких роботів.',
    color: '#ff9f00', // Amber
    glowColor: 'shadow-[0_0_20px_#ff9f00] hover:shadow-[0_0_30px_#ff9f00]',
    path: [
      { x: 100, y: 0 },
      { x: 100, y: 150 },
      { x: 450, y: 150 },
      { x: 300, y: 350 },
      { x: 100, y: 350 },
      { x: 450, y: 450 },
      { x: 800, y: 450 }
    ],
    unlocked: true,
    gridCells: [],
    decorations: [
      { x: 250, y: 50, size: 14, glow: true, type: 'circle' },
      { x: 600, y: 100, size: 22, glow: true, type: 'rect' },
      { x: 650, y: 300, size: 12, glow: false, type: 'circle' },
      { x: 200, y: 270, size: 18, glow: true, type: 'rect' },
      { x: 550, y: 380, size: 8, glow: false, type: 'circle' }
    ]
  },
  {
    id: 3,
    name: 'Ядро мережі',
    description: 'Майнфрейм центральної бази даних. Рожево-фіолетові цифрові канали з експериментальними ботами та супер-босом Омега-Титан!',
    color: '#ff00ff', // Magenta/Pink
    glowColor: 'shadow-[0_0_20px_#ff00ff] hover:shadow-[0_0_30px_#ff00ff]',
    path: [
      { x: 0, y: 450 },
      { x: 150, y: 450 },
      { x: 150, y: 150 },
      { x: 350, y: 150 },
      { x: 350, y: 350 },
      { x: 550, y: 350 },
      { x: 550, y: 50 },
      { x: 800, y: 50 }
    ],
    unlocked: true,
    gridCells: [],
    decorations: [
      { x: 250, y: 250, size: 25, glow: true, type: 'circle' },
      { x: 450, y: 80, size: 15, glow: true, type: 'rect' },
      { x: 100, y: 300, size: 10, glow: false, type: 'circle' },
      { x: 700, y: 200, size: 18, glow: true, type: 'circle' },
      { x: 750, y: 400, size: 14, glow: false, type: 'rect' }
    ]
  }
];

type ScreenState = 'menu' | 'levels' | 'game' | 'gameover' | 'victory';

export default function App() {
  // Screens state
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1, 2, 3]); // Default has all sectors unlocked
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const [isAlmanacOpen, setIsAlmanacOpen] = useState<boolean>(false);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(false);
  const [showStory, setShowStory] = useState<boolean>(false);

  // Persistent global currency and skin states
  const [cyberTokens, setCyberTokens] = useState<number>(() => {
    const saved = localStorage.getItem('cyber_tokens_count');
    return saved ? parseInt(saved, 10) : 80; // Starts with 80 CT so they can immediately spin on first play!
  });

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlocked_skins_list');
    return saved ? JSON.parse(saved) : ['default'];
  });

  const [activeSkins, setActiveSkins] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('active_tower_skins_map');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    // Fallback/migration from old single skin format
    const legacySkin = localStorage.getItem('active_tower_skin') || 'default';
    return {
      laser: legacySkin,
      plasma: legacySkin,
      pulse: legacySkin,
      cryo: legacySkin,
      tesla: legacySkin,
      railgun: legacySkin
    };
  });

  const [isWheelOpen, setIsWheelOpen] = useState<boolean>(false);

  const updateCyberTokens = (val: number | ((prev: number) => number)) => {
    setCyberTokens(prev => {
      const nextVal = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('cyber_tokens_count', nextVal.toString());
      return nextVal;
    });
  };

  const handleUnlockSkin = (skinId: string) => {
    setUnlockedSkins(prev => {
      if (prev.includes(skinId)) return prev;
      const nextList = [...prev, skinId];
      localStorage.setItem('unlocked_skins_list', JSON.stringify(nextList));
      return nextList;
    });
  };

  const handleEquipSkin = (towerType: string, skinId: string) => {
    setActiveSkins(prev => {
      const nextMap = { ...prev, [towerType]: skinId };
      localStorage.setItem('active_tower_skins_map', JSON.stringify(nextMap));
      return nextMap;
    });
  };

  // Active Game stats
  const [towers, setTowers] = useState<Tower[]>([]);
  const [gold, setGold] = useState<number>(400); // Level 1 starts with 400cr
  const [lives, setLives] = useState<number>(20);
  const [currentWave, setCurrentWave] = useState<number>(1);
  const [maxWaves] = useState<number>(3);
  const [waveInProgress, setWaveInProgress] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<number>(1); // 1x or 2x
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Tower Weapon Modifiers/Buffs state
  const [unlockedBuffs, setUnlockedBuffs] = useState<string[]>([]);
  const [isBuffDraftOpen, setIsBuffDraftOpen] = useState<boolean>(false);
  const [buffDraftOptions, setBuffDraftOptions] = useState<any[]>([]);

  // Dynamic Difficulty Scaling (DDS) System States
  const [highestDefensePowerEver, setHighestDefensePowerEver] = useState<number>(0);
  const [difficultyAdjustMultiplier, setDifficultyAdjustMultiplier] = useState<number>(1.0);
  const [livesAtWaveStart, setLivesAtWaveStart] = useState<number>(20);

  // DDS Helper Calculations
  const calculateTowerPower = (type: TowerType, level: number): number => {
    let basePower = 0;
    if (type === 'laser') {
      basePower = 50; // 25 damage / 0.5s cooldown = 50 DPS
    } else if (type === 'plasma') {
      basePower = 60; // 90 damage / 1.5s cooldown = 60 DPS
    } else if (type === 'pulse') {
      basePower = 40; // 40 damage / 1.0s cooldown = 40 DPS
    } else if (type === 'cryo') {
      basePower = 35; // Fixed 35 Power
    }
  
    const levelCoef = level === 1 ? 1.0 : level === 2 ? 1.35 : 1.75;
    return basePower * levelCoef;
  };

  const calculateDefensePower = (towersList: Tower[]): number => {
    return towersList.reduce((sum, t) => sum + calculateTowerPower(t.type, t.level), 0);
  };

  const getBaseWavePower = (levelId: number, wave: number): number => {
    if (levelId === 1) {
      if (wave === 1) return 120;
      if (wave === 2) return 180;
      return 240; // Wave 3
    }
    if (levelId === 2) {
      if (wave === 1) return 250;
      if (wave === 2) return 350;
      return 450; // Wave 3
    }
    // Level 3
    if (wave === 1) return 450;
    if (wave === 2) return 600;
    return 800; // Wave 3
  };

  // Keep highestDefensePowerEver updated on build changes
  useEffect(() => {
    const currentPower = calculateDefensePower(towers);
    if (currentPower > highestDefensePowerEver) {
      setHighestDefensePowerEver(currentPower);
    }
  }, [towers, highestDefensePowerEver]);

  // Compute live DDS telemetry stats
  const ddsBaseWavePower = getBaseWavePower(activeLevelId, currentWave);
  const ddsCurrentDefensePower = calculateDefensePower(towers);
  const ddsEffectiveDefensePower = Math.max(ddsCurrentDefensePower, highestDefensePowerEver);
  const ddsWavePower = (ddsBaseWavePower + (ddsEffectiveDefensePower * 0.35)) * difficultyAdjustMultiplier;

  // Selector controls and Active placements
  const [selectedBuildType, setSelectedBuildType] = useState<TowerType | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    setUnlockedLevels([1, 2, 3]);
  }, []);

  // Update unlocked sectors list
  const unlockNextLevel = (completedId: number) => {
    const nextId = completedId + 1;
    if (nextId <= 3 && !unlockedLevels.includes(nextId)) {
      const updated = [...unlockedLevels, nextId];
      setUnlockedLevels(updated);
      localStorage.setItem('unlocked_cyber_sectors', JSON.stringify(updated));
    }
  };

  const handleToggleSound = () => {
    const state = cyberAudio.toggleSound();
    setIsAudioOn(state);
  };

  const handleStartGameTransition = () => {
    cyberAudio.playLevelSelect();
    setScreen('levels');
  };

  const handleSelectLevel = (levelId: number) => {
    const level = LEVELS_DATA.find(l => l.id === levelId);
    if (!level) return;

    setActiveLevelId(levelId);
    // Initialize corresponding balances per level
    const startCredits = levelId === 1 ? 400 : levelId === 2 ? 450 : 500;
    setGold(startCredits);
    setLives(20);
    setCurrentWave(1);
    setWaveInProgress(false);
    setGameSpeed(1);
    setIsPaused(false);
    setTowers([]);
    setSelectedBuildType(null);
    setSelectedTower(null);
    setHighestDefensePowerEver(0);
    setDifficultyAdjustMultiplier(1.0);
    setLivesAtWaveStart(20);
    setUnlockedBuffs([]);
    setIsBuffDraftOpen(false);
    setScreen('game');
  };

  const handleUpgradeTower = (towerId: string) => {
    const targetTower = towers.find(t => t.id === towerId);
    if (!targetTower) return;

    const rankCost = Math.floor(targetTower.cost * 0.8 * targetTower.level);
    if (gold >= rankCost && targetTower.level < 3) {
      setGold(prev => prev - rankCost);
      cyberAudio.playUpgrade();
      
      const newLvl = targetTower.level + 1;
      const powerMultiplier = 1 + (newLvl - 1) * 0.5;
      const rangeMultiplier = 1 + (newLvl - 1) * 0.15;
      
      // Update tower in array
      const updated = towers.map((t) => {
        if (t.id === towerId) {
          return {
            ...t,
            level: newLvl,
            damage: t.type === 'cryo' ? 0 : Math.round(t.damage * 1.5),
            range: Math.round(t.range * 1.15)
          };
        }
        return t;
      });
      setTowers(updated);

      // Refresh HUD selected model
      const refreshed = updated.find(t => t.id === towerId);
      if (refreshed) {
        setSelectedTower(refreshed);
      }
    } else {
      cyberAudio.playDamageBase();
    }
  };

  const handleSellTower = (towerId: string) => {
    const targetTower = towers.find(t => t.id === towerId);
    if (!targetTower) return;

    // Refund calculations
    let initialCost = targetTower.cost;
    let upgradeInvestment = 0;
    for (let l = 1; l < targetTower.level; l++) {
      upgradeInvestment += Math.floor(targetTower.cost * 0.8 * l);
    }
    const refund = Math.floor((initialCost + upgradeInvestment) * 0.7);

    setGold(prev => prev + refund);
    cyberAudio.playSell();
    setTowers(towers.filter(t => t.id !== towerId));
    setSelectedTower(null);
  };

  // Wave state handlers
  const openBuffDraft = (currentUnlocked: string[]) => {
    const ALL_BUFFS = [
      {
        id: 'burn',
        title: 'Кібер-Терміт [🔥]',
        description: 'Кожне попадання підпалює ворога. Він отримує періодичну термальну шкоду протягом 3–5 сек (накладається до 3 зарядів). Максимально ефективно проти важких танків та босів.',
        icon: 'Flame',
        color: 'border-orange-500/40 text-orange-400 bg-orange-950/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
      },
      {
        id: 'electro',
        title: 'Грозовий Ланцюг [⚡]',
        description: 'Влучання з певною ймовірністю випускають ланцюгові блискавки, що перескакують на 3–5 сусідніх цілей поруч, миттєво пошкоджуючи їх.',
        icon: 'Zap',
        color: 'border-blue-500/40 text-blue-400 bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
      },
      {
        id: 'overload',
        title: 'Термо-Перевантаження [💥]',
        description: 'Попадання веж накладають заряд перевантаження. Накопичення 5 зарядів на одному ворогу провокує локальний детонаційний вибух у радіусі.',
        icon: 'Sparkles',
        color: 'border-yellow-500/40 text-yellow-500 bg-yellow-950/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
      },
      {
        id: 'gravity',
        title: 'Гравітаційне Поле [🌀]',
        description: 'При влучаннях виникає сингулярна чорна діра на 2.5 сек, яка під дією сильної гравітації стягує усіх суміжних супротивників назад у центр.',
        icon: 'Cpu',
        color: 'border-purple-500/40 text-purple-400 bg-purple-950/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
      },
      {
        id: 'teleport',
        title: 'Просторовий Телепортер [🌀]',
        description: 'Атаки отримують фазовий імпульс дематеріалізації, миттєво відкидаючи уражених ворогів назад по траєкторії руху на 3 клітинки (150px).',
        icon: 'Radio',
        color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
      }
    ];

    const available = ALL_BUFFS.filter(b => !currentUnlocked.includes(b.id));
    if (available.length < 3) {
      setBuffDraftOptions(available.sort(() => Math.random() - 0.5));
    } else {
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      setBuffDraftOptions(shuffled.slice(0, 3));
    }
    
    setIsBuffDraftOpen(true);
  };

  const handleSelectBuff = (buffId: string) => {
    setUnlockedBuffs(prev => [...prev, buffId]);
    setIsBuffDraftOpen(false);

    // Continue the wave progression logic now
    if (currentWave < maxWaves) {
      setCurrentWave(prev => prev + 1);
      // Give mid-defense credits bonus
      setGold(prev => prev + 150);
    }
  };

  const handleWaveEnded = () => {
    setWaveInProgress(false);

    // Assess performance and update difficulty scaling multiplier
    // Max decrease: -10%, Max increase: +20% (our options are +10%, 0%, -5%, -10% which perfectly fit!)
    const livesLost = Math.max(0, livesAtWaveStart - lives);
    const percentLost = livesAtWaveStart > 0 ? livesLost / livesAtWaveStart : 0;
    
    let adjustment = 0;
    if (livesLost === 0) {
      adjustment = 0.10; // +10%
    } else if (percentLost <= 0.20) {
      adjustment = 0.0;
    } else if (percentLost <= 0.50) {
      adjustment = -0.05; // -5%
    } else {
      adjustment = -0.10; // -10%
    }

    // Protect limits
    const finalAdjustment = Math.max(-0.10, Math.min(0.20, adjustment));
    setDifficultyAdjustMultiplier(prev => {
      const nextVal = prev + finalAdjustment;
      // Ensure positive bound
      return Math.max(0.1, nextVal);
    });

    // End of the wave actions - Trigger choice first if there's more waves!
    if (currentWave < maxWaves) {
      openBuffDraft(unlockedBuffs);
    } else {
      // Level won and cleared!
      cyberAudio.playVictory();
      unlockNextLevel(activeLevelId);
      updateCyberTokens(prev => prev + 100); // Earn 100 CT on level victory!
      setScreen('victory');
    }
  };

  const handleLoseLife = (damage: number) => {
    setLives(prev => {
      const finalLife = prev - damage;
      if (finalLife <= 0) {
        // Core destroyed!
        setTimeout(() => {
          cyberAudio.playGameOver();
          setScreen('gameover');
        }, 300);
        return 0;
      }
      return finalLife;
    });
  };

  const activeLevelConfig = LEVELS_DATA.find(l => l.id === activeLevelId) || LEVELS_DATA[0];

  return (
    <div className="min-h-screen bg-[#020205] text-white flex flex-col justify-between overflow-x-hidden relative select-none">
      
      {/* Background Cyber-Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Persistent global header menu/audio toggle */}
      <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center border-b border-cyan-500/30 bg-black/85 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div 
          onClick={() => { cyberAudio.playLevelSelect(); setScreen('menu'); }}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <span className="p-2 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold group-hover:border-cyan-400 group-hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-950/10 transition-all duration-300">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <span className="font-extrabold text-white tracking-widest text-sm uppercase">Cyber Defense</span>
            <span className="text-[9px] text-[#00f0ff] font-mono block tracking-[4px] leading-none uppercase">Core-Barrier</span>
          </div>
        </div>

        {/* Global Wallet Indicator -> opens Wheel of Fortune on click */}
        <div 
          onClick={() => { cyberAudio.playLevelSelect(); setIsWheelOpen(true); }}
          className="mx-2 flex items-center space-x-2 px-3.5 py-1.5 border border-yellow-500/30 hover:border-yellow-400 rounded-xl text-yellow-400 font-mono text-xs cursor-pointer bg-yellow-950/5 hover:bg-yellow-900/10 transition-all duration-300 shadow-[0_0_12px_rgba(234,179,8,0.1)] shrink-0"
          title="🎰 Крутити колесо фортуни"
        >
          <Coins className="w-4 h-4 animate-[spin_5s_linear_infinite]" />
          <span className="font-extrabold">{cyberTokens} 🪙</span>
        </div>

        {/* Floating Sound controller */}
        <div className="flex items-center space-x-2">
          <button
            id="global_audio_toggle"
            onClick={handleToggleSound}
            className={`p-2.5 border rounded-xl flex items-center space-x-2 transition-all duration-300 ${
              isAudioOn 
                ? 'border-cyan-500/40 text-cyan-400 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-500' 
                : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            {isAudioOn ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-[10px] font-mono tracking-wide uppercase hidden sm:inline">Звук УВК</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="text-[10px] font-mono tracking-wide uppercase hidden sm:inline">Звук ВИМК</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* CORE ROUTING ENGINE */}
      <main className="flex-1 flex flex-col justify-center items-center relative z-10 p-4">
        
        {/* SCREEN 1: MAIN MENU LANDING */}
        {screen === 'menu' && (
          <div className="w-full max-w-lg p-8 rounded-3xl border-2 border-cyan-500/30 bg-black/65 backdrop-blur-xl text-center shadow-[0_0_60px_rgba(0,242,255,0.12)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            
            {/* Spinning Neon Core logo */}
            <div className="w-24 h-24 mx-auto rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-950/25 shadow-[0_0_30px_rgba(0,242,255,0.35)] mb-6 animate-[spin_12s_linear_infinite]">
              <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase leading-tight mb-2 text-white">
              КІБЕР-НЕОН <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-indigo-400 drop-shadow-[0_0_20px_rgba(0,242,255,0.4)] font-black">
                ТАУЕР ДЕФЕНС
              </span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase mb-8">// SECURE SECURITY MAINFRAME ENCRYPTED //</p>

            {/* Menu Buttons Group */}
            <div className="space-y-4">
              {/* Play Button */}
              <button
                id="menu_play_btn"
                onClick={handleStartGameTransition}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-400 text-black font-black font-mono text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer hover:brightness-110 hover:scale-[1.01]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ГРАТИ</span>
              </button>

              {/* Wheel of Fortune Button */}
              <button
                id="menu_wheel_btn"
                onClick={() => { cyberAudio.playLevelSelect(); setIsWheelOpen(true); }}
                className="w-full py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-black font-mono text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(236,72,153,0.45)] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer hover:brightness-110 hover:scale-[1.01]"
              >
                <Gift className="w-4 h-4 animate-bounce shrink-0" />
                <span>🎰 КОЛЕСО ФОРТУНИ & СКІНИ</span>
              </button>

              {/* Almanac Button */}
              <button
                id="menu_almanac_btn"
                onClick={() => { cyberAudio.playLevelSelect(); setIsAlmanacOpen(true); }}
                className="w-full py-3.5 border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 font-mono text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Альманах</span>
              </button>

              {/* Toggle sound Button */}
              <button
                id="menu_audio_btn"
                onClick={() => { handleToggleSound(); }}
                className={`w-full py-3.5 border rounded-xl flex items-center justify-center space-x-2 font-mono text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isAudioOn
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                    : 'border-pink-500/30 text-pink-400 bg-pink-500/5 hover:bg-pink-500/15'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Звуковий Супровід: {isAudioOn ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}</span>
              </button>

              {/* Sandbox Mission Log story trigger */}
              <button
                id="menu_story_btn"
                onClick={() => { cyberAudio.playLevelSelect(); setShowStory(!showStory); }}
                className="w-full py-3 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-500/60 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
              >
                ІНСТРУКТАЖ МІСІЇ (ЛОГ)
              </button>
            </div>

            {/* Expander Story Area */}
            {showStory && (
              <div className="mt-6 p-4 border border-cyan-500/30 bg-[#020205] rounded-xl text-left text-xs text-white/70 leading-relaxed font-sans max-h-40 overflow-y-auto custom-scroll">
                <strong className="text-cyan-400 block mb-1">СИНХРОНІЗАЦІЯ СПОВІЩЕНЬ // 2026-A:</strong>
                Машина Омега-Титан підкорила центральний сервер за адресою КІБЕР-ЗАВОДУ. Орди автономних ботів і літаючих фантомів прямують по цифровим каналам, щоб знищити Ядро Мережі.
                Твоє завдання — налаштувати автоматичні вежі лазерного і ЕМП типу, щоб закрити вузли та врятувати людство.
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-cyan-500/10 text-[9px] font-mono text-white/40 tracking-wider">// SECTOR LOG: SECURE SYSTEM STABLE //</div>
          </div>
        )}

        {/* SCREEN 2: LEVEL SELECTION */}
        {screen === 'levels' && (
          <LevelSelector
            levels={LEVELS_DATA}
            onSelectLevel={handleSelectLevel}
            onBack={() => setScreen('menu')}
            unlockedLevels={unlockedLevels}
          />
        )}

        {/* SCREEN 3: ACTIVE GAME BOARD */}
        {screen === 'game' && (
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            
            {/* Top Back and quick stats navigation */}
            <div className="flex justify-between items-center px-2 py-0.5 text-xs text-slate-400 font-mono">
              <span className="flex items-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                АКТИВНИЙ РЕЖИМ ОБОРОНИ
              </span>
              <span className="hidden md:inline uppercase">// FPS: 60 // RESOLUTION: 800x500 AUTO //</span>
            </div>

            {/* Core Canvas Arena Grid */}
            <GameCanvas
              currentLevel={activeLevelConfig}
              gold={gold}
              waveInProgress={waveInProgress}
              gameSpeed={gameSpeed}
              isPaused={isPaused}
              
              selectedBuildType={selectedBuildType}
              onSelectBuildType={setSelectedBuildType}
              
              selectedTower={selectedTower}
              onSelectTower={setSelectedTower}
              
              onDeductGold={(amount) => setGold(prev => prev - amount)}
              onAddGold={(amount) => setGold(prev => prev + amount)}
              onLoseLife={handleLoseLife}
              
              onWaveComplete={handleWaveEnded}
              onLevelCleared={() => setScreen('victory')}
              currentWave={currentWave}
              maxWaves={maxWaves}

              towers={towers}
              setTowers={setTowers}

              highestDefensePowerEver={highestDefensePowerEver}
              difficultyAdjustMultiplier={difficultyAdjustMultiplier}

              unlockedBuffs={unlockedBuffs}
              activeSkins={activeSkins}
            />

            {/* Control shop and settings statistics summary HUD */}
            <GameHUD
              gold={gold}
              lives={lives}
              currentWave={currentWave}
              maxWaves={maxWaves}
              levelName={activeLevelConfig.name}
              gameSpeed={gameSpeed}
              isPaused={isPaused}
              waveInProgress={waveInProgress}
              
              currentDefensePower={ddsCurrentDefensePower}
              highestDefensePowerEver={highestDefensePowerEver}
              difficultyAdjustMultiplier={difficultyAdjustMultiplier}
              wavePower={ddsWavePower}
              unlockedBuffs={unlockedBuffs}
              
              selectedBuildType={selectedBuildType}
              onSelectBuildType={setSelectedBuildType}
              
              selectedTower={selectedTower}
              onUpgradeTower={handleUpgradeTower}
              onSellTower={handleSellTower}
              onDeselectTower={() => setSelectedTower(null)}

              onStartWave={() => {
                setLivesAtWaveStart(lives);
                setWaveInProgress(true);
              }}
              onTogglePause={() => setIsPaused(!isPaused)}
              onToggleSpeed={() => setGameSpeed(prev => prev === 1 ? 2 : 1)}
              onExitToMenu={() => setScreen('levels')}
            />

            {/* TOWER WEAPON BUFFER DRAFT MODAL OVERLAY */}
            {isBuffDraftOpen && (
              <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono">
                <div className="w-full max-w-4xl border border-cyan-500/30 bg-slate-950/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col gap-6 relative overflow-hidden">
                  
                  {/* Neon scanning lights decoration */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400/50" />
                  
                  <div className="text-center">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[4px] block mb-1">
                      // СИНХРОНІЗАЦІЯ ХХ-І ХВИЛІ ЗАВЕРШЕНА //
                    </span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                      ДОСТУПНА МОДИФІКАЦІЯ ВЕЖ
                    </h2>
                    <div className="h-[1px] w-24 bg-cyan-500/30 mx-auto mb-4" />
                    <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                      Протокол оборони Сектора згенеровано. Виберіть <strong className="text-cyan-400">один</strong> із трьох квантових мікрочіпів для перманентного апгрейду атакуючих щитів до кінця місії.
                    </p>
                  </div>

                  {/* Grid of 3 randomly pulled buffs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {buffDraftOptions.map((opt) => {
                      // Render icon based on opt.icon string
                      let IconComp = Cpu;
                      if (opt.icon === 'Flame') IconComp = Flame;
                      else if (opt.icon === 'Zap') IconComp = Zap;
                      else if (opt.icon === 'Sparkles') IconComp = Sparkles;
                      else if (opt.icon === 'Cpu') IconComp = Cpu;
                      else if (opt.icon === 'Radio') IconComp = Radio;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            cyberAudio.playUpgrade();
                            handleSelectBuff(opt.id);
                          }}
                          className={`text-left p-5 border rounded-xl flex flex-col justify-between h-full hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group cursor-pointer hover:bg-slate-900/50 hover:border-cyan-400 ${opt.color}`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className="p-2 border border-current rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <IconComp className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors duration-300 font-bold">
                                [ upgrade v1 ]
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold uppercase text-white tracking-wide mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                              {opt.title}
                            </h3>
                            <p className="text-xs text-slate-400 leading-normal mb-4 font-sans">
                              {opt.description}
                            </p>
                          </div>

                          <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                            <span>ІНСТАЛЮВАТИ СПЕЦ-ЕФЕКТ</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">
                    // УВАГА: ПОКРАЩЕННЯ ДІЮТЬ АВТОМАТИЧНО НА ВСІ ВАШІ ВЕЖІ //
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SCREEN 4: GAME OVER SCREEN */}
        {screen === 'gameover' && (
          <div className="w-full max-w-md p-8 border border-red-500/30 bg-black/95 text-center shadow-[0_0_80px_rgba(239,68,68,0.25)] rounded-2xl relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-red-500 animate-pulse" />
            <span className="text-red-500 font-mono font-bold text-5xl tracking-[8px] animate-pulse uppercase leading-none block mb-2">ПОРАЗКА</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[3px] block mb-6">// SECURITY INTEGRITY CRITICALLY COMPROMISED //</span>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Орди ботів перевантажили енергетичний конвеєр бази. Ядро сектора <strong className="text-red-400 capitalize">"{activeLevelConfig.name}"</strong> згоріло бінарним кодом.
            </p>

            <div className="space-y-3 font-mono">
              <button
                id="restart_level_btn"
                onClick={() => handleSelectLevel(activeLevelId)}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs uppercase tracking-widest rounded-xl hover:from-red-500 hover:to-rose-400 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center space-x-2 font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 animate-spin-slow" />
                <span>СПРОБУВАТИ ЗНОВУ</span>
              </button>

              <button
                id="back_to_menu_from_over_btn"
                onClick={() => { cyberAudio.playLevelSelect(); setScreen('levels'); }}
                className="w-full py-3 border border-slate-800 hover:border-slate-500 text-slate-400 text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 bg-slate-950/50 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>ДО ВИБОРУ СЕКТОРІВ</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: VICTORY SCREEN */}
        {screen === 'victory' && (
          <div className="w-full max-w-md p-8 border border-emerald-500/30 bg-black/95 text-center shadow-[0_0_80px_rgba(16,185,129,0.25)] rounded-2xl relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-500 animate-pulse" />
            
            <div className="p-4 inline-block border border-emerald-500/30 rounded-2xl bg-emerald-950/10 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-bounce">
              <Trophy className="w-12 h-12 text-emerald-400" />
            </div>

            <span className="text-emerald-400 font-mono font-black text-4xl tracking-[6px] uppercase leading-none block mb-2">ПОРАЗКУ ВІДБИТО!</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[3px] block mb-6">// SECTOR CLEARANCE SIGNATURE VERIFIED //</span>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Вузол захисту <strong className="text-emerald-400">"{activeLevelConfig.name}"</strong> чудово утримав оборонний бар’єр. Кібер-загрозу на цій ділянці повністю нейтралізовано.
            </p>

            {/* Visual currency reward badge */}
            <div className="flex items-center justify-center space-x-3 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 mb-6 max-w-xs mx-auto shadow-[0_0_15px_rgba(16,185,129,0.06)] animate-pulse">
              <Coins className="w-5 h-5 text-yellow-500 shrink-0" />
              <span className="text-[10.5px] uppercase font-extrabold text-slate-300">ОТРИМАНО НАГОРОДУ:</span>
              <span className="text-sm font-black text-yellow-400 font-mono">+100 🪙 CT</span>
            </div>

            <div className="space-y-3 font-mono">
              {activeLevelId < 3 ? (
                <button
                  id="next_level_btn"
                  onClick={() => handleSelectLevel(activeLevelId + 1)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 text-slate-950 text-xs font-bold uppercase tracking-widest rounded-xl hover:from-emerald-500 hover:to-green-400 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>ПРОДОВЖИТИ НА СЕКТОР 0{activeLevelId + 1}</span>
                </button>
              ) : (
                <div className="py-2.5 px-4 text-xs font-semibold uppercase text-cyan-400 border border-cyan-500/30 bg-cyan-950/20 rounded-xl mb-4">
                  🎉 ВІТАЄМО! ВИ ОЧИСТИЛИ КІБЕР-НЕТ! ОМЕГА-ТИТАН ЗНИЩЕНИЙ!
                </div>
              )}

              <button
                id="victory_to_menu_btn"
                onClick={() => { cyberAudio.playLevelSelect(); setScreen('levels'); }}
                className="w-full py-3 border border-slate-800 hover:border-slate-500 text-slate-400 text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 bg-slate-950/50 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>СПИСОК РІВНІВ</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* OVERLAY: IN-DEPTH CYBER GLOSSARY ALMANAC MODAL */}
      {isAlmanacOpen && (
        <Almanac onClose={() => setIsAlmanacOpen(false)} />
      )}

      {/* OVERLAY: WHEEL OF FORTUNE & TOWER SKINS */}
      {isWheelOpen && (
        <WheelOfFortune
          cyberTokens={cyberTokens}
          onUpdateTokens={updateCyberTokens}
          unlockedSkins={unlockedSkins}
          onUnlockSkin={handleUnlockSkin}
          activeSkins={activeSkins}
          onEquipSkin={handleEquipSkin}
          onClose={() => setIsWheelOpen(false)}
        />
      )}

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-slate-900 bg-slate-950/80 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center px-6 gap-2">
        <span>© 2026 // NEON CYBERPUNK TD // STABLE EMULATOR</span>
        <span className="text-slate-600">СТВОРЕНО НА ЧИСТОМУ CANVAS ТА REACT+TS // SECURE CORE</span>
      </footer>

    </div>
  );
}
