import { Lock, Play, ArrowLeft, Trophy, Layers, Award } from 'lucide-react';
import { LevelConfig } from '../types';
import cyberAudio from '../audio';

interface LevelSelectorProps {
  levels: LevelConfig[];
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  unlockedLevels: number[]; // e.g. [1, 2, 3]
}

export default function LevelSelector({ levels, onSelectLevel, onBack, unlockedLevels }: LevelSelectorProps) {
  
  const handleSelect = (levelId: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      cyberAudio.playDamageBase(); // buzzer error sounding locks
      return;
    }
    cyberAudio.playLevelSelect();
    onSelectLevel(levelId);
  };

  const handleBack = () => {
    cyberAudio.playLevelSelect();
    onBack();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col p-6 min-h-[85vh] justify-between font-sans">
      
      {/* Top bar with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          id="back_to_menu_btn"
          onClick={handleBack}
          className="flex items-center space-x-2 px-4 py-2 border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-300 bg-black/60 shadow-[0_0_15px_rgba(0,242,255,0.1)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Головне Меню</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] text-cyan-400 font-mono">// SECTOR SELECTION PANEL //</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-white font-sans">
          ВИБІР <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">КІБЕР-СЕКТОРУ</span>
        </h1>
        <p className="text-white/60 text-sm mt-2 max-w-md mx-auto font-light">
          Оберіть сектор для розміщення лазерних та плазмових систем захисту. Зупиніть кібер-армаду до того, як вони досягнуть ядра.
        </p>
      </div>

      {/* Grid of 3 levels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center mb-10">
        {levels.map((level) => {
          const isUnlocked = unlockedLevels.includes(level.id);
          
          return (
            <div
              key={level.id}
              onClick={() => handleSelect(level.id, isUnlocked)}
              className={`group relative rounded-2xl border-2 bg-black/50 backdrop-blur-md p-6 flex flex-col justify-between h-[360px] transition-all duration-500 cursor-pointer ${
                isUnlocked 
                  ? `border-cyan-500/30 hover:border-[#00f2ff] hover:scale-[1.03] shadow-[0_0_20px_rgba(0,242,255,0.15)] ${level.glowColor}` 
                  : 'border-white/10 opacity-60 grayscale'
              }`}
              style={{ color: isUnlocked ? level.color : '#475569' }}
            >
              {/* Overlay shadow for glowing depth */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-radial-gradient from-current/5 to-transparent pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              )}

              {/* Top Card Section: Level ID, Status */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl font-black font-mono tracking-tight opacity-40">0{level.id}</span>
                {isUnlocked ? (
                  <span className="text-[10px] font-mono border border-current px-2 py-0.5 rounded uppercase tracking-wider bg-current/10 font-bold">
                    Доступно
                  </span>
                ) : (
                  <span className="text-[10px] font-mono border border-white/10 text-white/40 px-2 py-0.5 rounded uppercase tracking-wider bg-white/5">
                    Заблоковано
                  </span>
                )}
              </div>

              {/* Level Preview Decorate Canvas Representation */}
              <div className="h-28 border border-cyan-500/20 bg-black/80 rounded-xl relative overflow-hidden flex items-center justify-center mb-4">
                {/* Circuit Grid Background Design */}
                <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#00f2ff_1px,transparent_1px),linear-gradient(to_bottom,#00f2ff_1px,transparent_1px)] bg-[size:10px_10px]" />
                
                {/* Render Simulated Track Path based on actual path configuration */}
                <svg className="absolute inset-x-0 inset-y-0 w-full h-full p-2 opacity-50" viewBox="0 0 800 600" preserveAspectRatio="none">
                  <path
                    d={level.path.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none"
                    stroke={isUnlocked ? level.color : '#475569'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isUnlocked ? 'animate-pulse' : ''}
                  />
                </svg>

                {isUnlocked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent duration-300">
                    <div className="p-3 rounded-full bg-black border border-current shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5" fill="currentColor" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/85">
                    <div className="flex flex-col items-center">
                      <Lock className="w-6 h-6 text-white/30" />
                      <span className="text-[9px] font-mono text-white/40 uppercase mt-1">Need sector 0{level.id - 1} clear</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Level Details */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors duration-200 uppercase tracking-wide">
                  {level.name}
                </h3>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {level.description}
                </p>
              </div>

              {/* Waves counter & difficulty indicators */}
              <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono text-white/40">
                <span className="flex items-center text-cyan-400/80">
                  <Layers className="w-3 h-3 mr-1" />
                  ХВИЛІ: 2 / 2
                </span>
                <span className="flex items-center uppercase">
                  <Award className="w-3 h-3 mr-1 text-pink-500" />
                  {level.id === 1 ? 'СТАРТОВИЙ' : level.id === 2 ? 'БОЙОВИЙ' : 'МАЙНФРЕЙМ БОС'}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Level Selector Info Box */}
      <div className="bg-black/80 p-4 rounded-xl border-2 border-cyan-500/30 text-center font-mono text-xs text-white/60 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
        <span className="flex items-center text-cyan-400 font-bold">
          <Trophy className="w-4 h-4 mr-2" /> Пройдіть сектор, щоб розблокувати більш небезпечні глибини кібер-мережі.
        </span>
        <span className="text-pink-400 font-bold">ЗУПИНІТЬ ОМЕГА-ТИТАНА НА СЕКТОРІ 3!</span>
      </div>

    </div>
  );
}
