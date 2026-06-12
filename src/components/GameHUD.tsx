import { 
  Heart, 
  Coins, 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  ArrowLeft, 
  Zap, 
  Flame, 
  Radio, 
  Snowflake, 
  ArrowUp, 
  Trash2,
  Info,
  Sparkles,
  Crosshair
} from 'lucide-react';
import { TowerType, Tower } from '../types';
import cyberAudio from '../audio';

interface GameHUDProps {
  gold: number;
  lives: number;
  currentWave: number;
  maxWaves: number;
  levelName: string;
  gameSpeed: number; // 1 or 2
  isPaused: boolean;
  waveInProgress: boolean;

  // DDS system stats
  currentDefensePower: number;
  highestDefensePowerEver: number;
  difficultyAdjustMultiplier: number;
  wavePower: number;
  unlockedBuffs: string[];
  
  // Selection
  selectedBuildType: TowerType | null;
  onSelectBuildType: (type: TowerType | null) => void;
  
  // Selected Tower
  selectedTower: Tower | null;
  onUpgradeTower: (towerId: string) => void;
  onSellTower: (towerId: string) => void;
  onDeselectTower: () => void;

  // Global game commands
  onStartWave: () => void;
  onTogglePause: () => void;
  onToggleSpeed: () => void;
  onExitToMenu: () => void;
}

export default function GameHUD({
  gold,
  lives,
  currentWave,
  maxWaves,
  levelName,
  gameSpeed,
  isPaused,
  waveInProgress,

  currentDefensePower,
  highestDefensePowerEver,
  difficultyAdjustMultiplier,
  wavePower,
  unlockedBuffs,
  
  selectedBuildType,
  onSelectBuildType,
  
  selectedTower,
  onUpgradeTower,
  onSellTower,
  onDeselectTower,

  onStartWave,
  onTogglePause,
  onToggleSpeed,
  onExitToMenu
}: GameHUDProps) {

  const towersInfo = [
    {
      type: 'laser' as TowerType,
      name: 'Лазерна',
      cost: 100,
      color: 'border-cyan-500 text-cyan-400 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
      icon: Zap,
      desc: 'Концентрований лазер. Швидка одиночна ціль.'
    },
    {
      type: 'plasma' as TowerType,
      name: 'Плазмова',
      cost: 200,
      color: 'border-purple-500 text-purple-400 bg-purple-950/20 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
      icon: Flame,
      desc: 'Тяжкі заряди плазми. Велика дальність та урон.'
    },
    {
      type: 'pulse' as TowerType,
      name: 'Імпульсна',
      cost: 175,
      color: 'border-amber-500 text-amber-400 bg-amber-950/20 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      icon: Radio,
      desc: 'Електромагнітне ЕМП-коло по площі.'
    },
    {
      type: 'cryo' as TowerType,
      name: 'Кріо',
      cost: 125,
      color: 'border-emerald-500 text-emerald-400 bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      icon: Snowflake,
      desc: 'Пасивна аура. Без шкоди, сповільнює на 65%.'
    },
    {
      type: 'tesla' as TowerType,
      name: 'Тесла-Вежа',
      cost: 220,
      color: 'border-pink-500 text-pink-400 bg-pink-950/20 shadow-[0_0_8px_rgba(236,72,153,0.3)]',
      icon: Sparkles,
      desc: 'Ланцюгова блискавка. Б’є основну ціль та 2 додаткові поряд.'
    },
    {
      type: 'railgun' as TowerType,
      name: 'Рейкогенератор',
      cost: 275,
      color: 'border-blue-500 text-blue-400 bg-blue-950/20 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
      icon: Crosshair,
      desc: 'Рейкотрон-Снайпер. Потужний постріл через усю мапу.'
    }
  ];

  // Calculate Upgrade Stats and Cost
  const getUpgradeCost = (tow: Tower) => {
    return Math.floor(tow.cost * 0.8 * tow.level);
  };

  const getSellValue = (tow: Tower) => {
    // Basic sell formula: 70% of total cost invested
    let initialCost = tow.cost;
    let upgradeInvestment = 0;
    for (let l = 1; l < tow.level; l++) {
      upgradeInvestment += Math.floor(tow.cost * 0.8 * l);
    }
    return Math.floor((initialCost + upgradeInvestment) * 0.7);
  };

  const handleSelectBuild = (type: TowerType, cost: number) => {
    if (selectedTower) onDeselectTower();
    
    if (selectedBuildType === type) {
      onSelectBuildType(null);
    } else {
      cyberAudio.playLevelSelect();
      onSelectBuildType(type);
    }
  };

  const triggerStartWave = () => {
    cyberAudio.playWaveStart();
    onStartWave();
  };

  return (
    <div className="flex flex-col gap-4 bg-black/65 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] font-sans">
      
      {/* HUD HEADER: Scoreboard / Counter Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4 font-mono text-xs">
        
        {/* Level Name */}
        <div className="flex items-center space-x-2.5">
          <button
            id="exit_level_btn"
            onClick={() => { cyberAudio.playLevelSelect(); onExitToMenu(); }}
            className="p-1.5 border border-cyan-500/30 hover:border-red-500 hover:text-red-400 text-cyan-400 rounded-lg transition-all duration-300 bg-black/60"
            title="Вийти до меню"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-cyan-400/60 text-[9px] block font-semibold uppercase tracking-widest">// СЕКТОР //</span>
            <span className="text-white font-extrabold ml-1 uppercase text-sm tracking-wide">{levelName}</span>
          </div>
        </div>

        {/* Lives Counter with damage warning effect if < 5 */}
        <div className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl border ${
          lives <= 3 
            ? 'border-red-500 bg-red-950/20 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400'
        }`}>
          <Heart className={`w-4 h-4 text-red-500 ${lives <= 3 ? 'animate-[bounce_0.8s_infinite]' : ''}`} fill="currentColor" />
          <div className="text-left leading-none">
            <span className="text-[9px] text-red-400 block uppercase font-mono tracking-wider font-bold">Ядро Системи</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-white font-mono">{lives} / 20</span>
              <div className="w-20 h-2.5 bg-red-950/50 rounded-full border border-red-500/30 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_#ff0000] transition-all duration-300" 
                  style={{ width: `${(lives / 15) * 100 > 100 ? 100 : (lives / 20) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gold Counter */}
        <div className="flex items-center space-x-2.5 px-3.5 py-1.5 border border-yellow-500/30 bg-yellow-400/5 rounded-xl text-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
          <Coins className="w-4 h-4 animate-pulse" />
          <div className="text-left leading-none animate-pulse">
            <span className="text-[9px] text-yellow-500/60 block uppercase font-mono tracking-wider font-bold">Кредити</span>
            <span className="text-sm font-extrabold">{gold} CR</span>
          </div>
        </div>

        {/* Wave indicator */}
        <div className="flex items-center space-x-2.5 px-3.5 py-1.5 border border-pink-500/30 bg-pink-500/5 rounded-xl text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.1)]">
          <div className="text-left leading-none font-mono">
            <span className="text-[9px] text-pink-500/60 block uppercase tracking-wider font-bold">Атака Ворогів</span>
            <span className="text-sm font-extrabold font-mono">Хвиля {currentWave} / {maxWaves}</span>
          </div>
        </div>

        {/* Dynamic Difficulty Scaling panel */}
        <div className="flex items-center space-x-2.5 px-3.5 py-1.5 border border-purple-500/30 bg-purple-500/5 rounded-xl text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.1)]">
          <div className="text-left leading-none font-mono">
            <span className="text-[9px] text-purple-500/60 block uppercase tracking-wider font-bold">// DDS МОНІТОР //</span>
            <div className="flex items-center gap-2 mt-1 font-mono text-xs">
              <div>
                <span className="text-purple-400/70 text-[10px]">СИЛА ОБОРОНИ:</span> <span className="text-white font-extrabold">{Math.round(currentDefensePower)} AP</span>
                {highestDefensePowerEver > currentDefensePower && (
                   <span className="text-[9px] text-red-400 font-bold ml-1" title="Досягнутий максимум">// MAX {Math.round(highestDefensePowerEver)} CR</span>
                )}
              </div>
              <div className="w-[1.5px] h-3 ml-1 mr-1 bg-purple-500/20"></div>
              <div>
                <span className="text-purple-400/70 text-[10px]">ХВИЛЯ:</span> <span className="text-white font-extrabold">{Math.round(wavePower)} WP</span>
              </div>
              <div className="w-[1.5px] h-3 ml-1 mr-1 bg-purple-500/20"></div>
              <div>
                <span className="text-purple-400/70 text-[10px]">АДАПТИВНІСТЬ:</span> <span className={`font-black ${difficultyAdjustMultiplier > 1.05 ? 'text-red-400' : difficultyAdjustMultiplier < 0.95 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {difficultyAdjustMultiplier >= 1.0 ? '+' : ''}{Math.round((difficultyAdjustMultiplier - 1.0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked weapon modifiers stream */}
        {unlockedBuffs && unlockedBuffs.length > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1.5 border border-cyan-500/30 bg-cyan-500/5 rounded-xl shadow-[0_0_8px_rgba(6,182,212,0.1)]">
            <div className="text-left leading-none font-mono">
              <span className="text-[9px] text-cyan-500/60 block uppercase tracking-wider font-bold">// МОДИФІКАТОРИ //</span>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                {unlockedBuffs.map(bId => {
                  let label = '';
                  let badgeColor = '';
                  if (bId === 'burn') {
                    label = '🔥 ПІДПАЛ';
                    badgeColor = 'border-orange-500/55 text-orange-400';
                  } else if (bId === 'electro') {
                    label = '⚡ ШОК';
                    badgeColor = 'border-blue-500/55 text-blue-400';
                  } else if (bId === 'overload') {
                    label = '💥 ЗАРЯД';
                    badgeColor = 'border-yellow-500/55 text-yellow-400';
                  } else if (bId === 'gravity') {
                    label = '🌀 АНОМАЛІЯ';
                    badgeColor = 'border-purple-500/55 text-purple-400';
                  } else if (bId === 'teleport') {
                    label = '🌀 ТЕЛЕПОРТ';
                    badgeColor = 'border-emerald-500/55 text-emerald-400';
                  }
                  return (
                    <span key={bId} className={`px-1.5 py-0.5 border rounded font-black tracking-wide uppercase ${badgeColor}`}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <div className="flex items-center gap-2">
          {/* Wave Start Button */}
          {!waveInProgress ? (
            <button
              id="start_wave_btn"
              onClick={triggerStartWave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-black font-black text-[11px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center space-x-1.5 font-sans animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>СТАРТ ХВИЛІ</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-[10px] uppercase rounded-lg shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-[pulse_1s_infinite]">
              Атака триває
            </span>
          )}

          {/* Pause Button */}
          <button
            id="pause_game_btn"
            onClick={() => { cyberAudio.playLevelSelect(); onTogglePause(); }}
            className={`p-2 border rounded-xl transition-all duration-300 flex items-center justify-center ${
              isPaused 
                ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' 
                : 'border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 bg-black/40'
            }`}
            title={isPaused ? "Продовжити" : "Пауза"}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Speed turbo toggler */}
          <button
            id="speed_game_btn"
            onClick={() => { cyberAudio.playLevelSelect(); onToggleSpeed(); }}
            className={`p-2 border rounded-xl transition-all duration-300 flex items-center justify-center space-x-1 ${
              gameSpeed === 2 
                ? 'border-pink-500 text-pink-400 bg-pink-950/25 shadow-[0_0_10px_rgba(236,72,153,0.3)] font-black' 
                : 'border-cyan-500/30 text-cyan-400 hover:text-white bg-black/40'
            }`}
            title="Прискорити х2"
          >
            <FastForward className="w-4 h-4" />
            <span className="text-[10px] font-mono">x{gameSpeed}</span>
          </button>

        </div>

      </div>

      {/* LOWER PANEL: Builders Shop vs Active Tower Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        
        {/* LEFT & MID: Tower Shop Console (Towers Selector Module) */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2 font-mono text-[10px] text-cyan-400/80 tracking-widest font-bold">
              <span>// Defense Matrix // Select tower unit to deploy</span>
              {selectedBuildType && (
                <span className="text-pink-400 animate-pulse uppercase">// DEPLOY DIRECTIVE: CLICK THE GRID //</span>
              )}
            </div>
            
            {/* Tower Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {towersInfo.map((item) => {
                const IconComp = item.icon;
                const canAfford = gold >= item.cost;
                const isSelected = selectedBuildType === item.type;
                
                return (
                  <button
                    key={item.type}
                    onClick={() => handleSelectBuild(item.type, item.cost)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-300 ${
                      isSelected 
                        ? 'border-2 border-pink-500 bg-pink-500/10 shadow-[inset_0_0_10px_rgba(255,0,255,0.25),0_0_15px_rgba(255,0,255,0.4)] scale-[1.02] text-pink-400' 
                        : canAfford
                          ? 'border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:border-[#00f2ff] hover:bg-cyan-500/10 cursor-pointer'
                          : 'border border-white/5 bg-black/40 text-white/20 opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`p-1.5 rounded-lg border ${isSelected ? 'border-pink-500/40 bg-pink-950/30 text-pink-300' : 'border-cyan-500/35 bg-cyan-950/20 text-cyan-400'}`}>
                        <IconComp className="w-4 h-4" />
                      </span>
                      <span className={`font-mono text-[11px] font-bold ${canAfford ? 'text-yellow-400' : 'text-white/20'}`}>
                        ${item.cost}
                      </span>
                    </div>

                    <div className="leading-tight mt-2">
                      <div className={`font-bold text-xs ${isSelected ? 'text-pink-300' : 'text-white'}`}>{item.name.toUpperCase()}</div>
                      <span className={`text-[9px] block font-light leading-none mt-0.5 line-clamp-1 ${isSelected ? 'text-pink-200/70' : 'text-white/50'}`}>{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Selected Tower Control / Secondary contextual details */}
        <div className="border-2 border-cyan-500/20 bg-black/80 rounded-2xl p-4 flex flex-col justify-center min-h-[96px] shadow-[0_0_20px_rgba(0,242,255,0.05)]">
          {selectedTower ? (
            <div className="flex flex-col h-full justify-between">
              
              {/* Header select */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-extrabold text-white text-xs leading-none uppercase tracking-wider">
                    {selectedTower.title} <span className="text-yellow-400 font-mono text-[10px] font-bold">Lvl {selectedTower.level}</span>
                  </h4>
                  <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest block mt-1">// Оборонний юніт //</span>
                </div>
                <button
                  id="deselect_tower_btn"
                  onClick={() => { cyberAudio.playLevelSelect(); onDeselectTower(); }}
                  className="text-[9px] text-pink-400 hover:bg-pink-500/15 uppercase font-mono px-2 py-0.5 border border-pink-500/30 rounded bg-black/60 transition-colors duration-200 cursor-pointer animate-pulse"
                >
                  Скасувати
                </button>
              </div>

              {/* Tower statistics */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/60 border-t border-cyan-500/10 py-2">
                <div>шкода: <span className="text-cyan-400 font-extrabold">{selectedTower.damage}</span></div>
                <div>радіус: <span className="text-cyan-400 font-extrabold">{selectedTower.range}px</span></div>
              </div>

              {/* Upgrade and Sell Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Upgrade Option */}
                {selectedTower.level < 3 ? (
                  <button
                    id="upgrade_tower_btn"
                    onClick={() => onUpgradeTower(selectedTower.id)}
                    disabled={gold < getUpgradeCost(selectedTower)}
                    className={`py-1.5 px-2 font-mono text-[9px] uppercase tracking-wider rounded-lg border flex items-center justify-center space-x-1 transition-all duration-300 ${
                      gold >= getUpgradeCost(selectedTower)
                        ? 'border-yellow-500/40 text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400/15 shadow-[0_0_10px_rgba(234,179,8,0.2)] cursor-pointer hover:scale-[1.02]'
                        : 'border-white/5 text-white/25 bg-white/5 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3 text-yellow-400" />
                    <span>Покр. ({getUpgradeCost(selectedTower)} CR)</span>
                  </button>
                ) : (
                  <div className="py-1.5 px-2 font-mono text-[9px] uppercase text-emerald-400 text-center border border-emerald-500/30 bg-emerald-950/20 rounded-lg font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    МАКС. РІВЕНЬ
                  </div>
                )}

                {/* Sell Option */}
                <button
                  id="sell_tower_btn"
                  onClick={() => onSellTower(selectedTower.id)}
                  className="py-1.5 px-2 font-mono text-[9px] uppercase tracking-wider border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/15 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 cursor-pointer hover:scale-[1.02]"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  <span>Продати (+{getSellValue(selectedTower)})</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center text-white/40 py-4 flex flex-col items-center justify-center relative">
              <Info className="w-5 h-5 text-cyan-400/60 mb-1.5 animate-pulse" />
              <p className="text-[10px] font-mono font-light leading-relaxed max-w-[210px]">
                Оберіть ВЕЖУ в арсеналі для будівництва, або КЛІКНІТЬ по збудованій для покращення чи продажу.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
