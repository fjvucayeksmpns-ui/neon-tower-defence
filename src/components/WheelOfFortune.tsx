import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Sparkles, 
  X, 
  RotateCw, 
  ShieldCheck, 
  Coins, 
  Palette, 
  Info,
  Gift,
  CheckCircle,
  Cpu,
  Flame,
  Zap,
  Radio,
  Snowflake
} from 'lucide-react';
import cyberAudio from '../audio';

export interface TowerSkin {
  id: string;
  name: string;
  color: string;
  shadowColor: string;
  description: string;
  glowClass: string;
  icon: any;
}

export const TOWER_SKINS: TowerSkin[] = [
  {
    id: 'default',
    name: 'Заводський Класик',
    color: '#00f0ff',
    shadowColor: 'rgba(0, 240, 255, 0.4)',
    description: 'Офіційні заводські неонові колірні схеми для кожної вежі.',
    glowClass: 'shadow-[0_0_15px_#00f0ff] border-cyan-500/40 text-cyan-400',
    icon: Cpu
  },
  {
    id: 'amethyst',
    name: 'Аметистовий Квант',
    color: '#a855f7',
    shadowColor: 'rgba(168, 85, 247, 0.4)',
    description: 'Вежі заряджаються фіолетовим ксеноновим світлом з аметистовим відтінком.',
    glowClass: 'shadow-[0_0_15px_#a855f7] border-purple-500/40 text-purple-400',
    icon: Zap
  },
  {
    id: 'solar',
    name: 'Сонячний Спалах',
    color: '#eab308',
    shadowColor: 'rgba(234, 179, 8, 0.4)',
    description: 'Золотаві сонячні генератори випромінюють інтенсивне лимонне сяйво.',
    glowClass: 'shadow-[0_0_15px_#eab308] border-yellow-500/40 text-yellow-400',
    icon: Flame
  },
  {
    id: 'ruby',
    name: 'Рубіновий Протокол',
    color: '#ef4444',
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Тактичний інтерфейс оборони з криваво-червоними індикаторами та імпульсами.',
    glowClass: 'shadow-[0_0_15px_#ef4444] border-red-500/40 text-red-500',
    icon: Radio
  },
  {
    id: 'neutron',
    name: 'Кібер-Нейтрон',
    color: '#ffffff',
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    description: 'Сучасний хром та стерильно-білий спектральний промінь майбутнього.',
    glowClass: 'shadow-[0_0_15px_#ffffff] border-slate-300 text-slate-100',
    icon: CheckCircle
  },
  {
    id: 'toxic',
    name: 'Токсичний Кислот',
    color: '#22c55e',
    shadowColor: 'rgba(34, 197, 94, 0.4)',
    description: 'Потужне радіоактивне наповнення зеленого кольору виділяє термальні ізотопи.',
    glowClass: 'shadow-[0_0_15px_#22c55e] border-green-500/40 text-green-400',
    icon: Snowflake
  },
  {
    id: 'ice',
    name: 'Крижаний Шторм',
    color: '#38bdf8',
    shadowColor: 'rgba(56, 189, 248, 0.4)',
    description: 'Свіжий світлодіодний арктичний крижаний барвник повністю заморожує простір.',
    glowClass: 'shadow-[0_0_15px_#38bdf8] border-sky-400/40 text-sky-400',
    icon: ShieldCheck
  },
  {
    id: 'singularity',
    name: 'Рожева Сінгулярність',
    color: '#ec4899',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
    description: 'Магнітна рожево-фіолетова речовина вивергає реверсивні пучки плазми.',
    glowClass: 'shadow-[0_0_15px_#ec4899] border-pink-500/40 text-pink-400',
    icon: Sparkles
  }
];

export interface WheelSector {
  type: 'skin' | 'currency';
  id: string;
  label: string;
  color: string;
  value?: number;
}

export const WHEEL_SECTORS: WheelSector[] = [
  { type: 'skin', id: 'amethyst', label: 'Аметист 🔮', color: '#9333ea' },
  { type: 'currency', id: 'token_80', label: '+80 🪙', color: '#1e293b', value: 80 },
  { type: 'skin', id: 'solar', label: 'Сонце ☀️', color: '#eab308' },
  { type: 'skin', id: 'ruby', label: 'Рубін 🩸', color: '#ef4444' },
  { type: 'currency', id: 'token_150', label: '+150 🪙', color: '#0f172a', value: 150 },
  { type: 'skin', id: 'toxic', label: 'Токсин ☣️', color: '#22c55e' },
  { type: 'skin', id: 'singularity', label: 'Рожева Сінгулярність 🌸', color: '#ec4899' },
  { type: 'skin', id: 'ice', label: 'Крига ❄️', color: '#38bdf8' }
];

interface WheelOfFortuneProps {
  cyberTokens: number;
  onUpdateTokens: (amount: number | ((prev: number) => number)) => void;
  unlockedSkins: string[];
  onUnlockSkin: (skinId: string) => void;
  activeSkins: Record<string, string>;
  onEquipSkin: (towerType: string, skinId: string) => void;
  onClose: () => void;
}

export default function WheelOfFortune({
  cyberTokens,
  onUpdateTokens,
  unlockedSkins,
  onUnlockSkin,
  activeSkins,
  onEquipSkin,
  onClose
}: WheelOfFortuneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedTowerType, setSelectedTowerType] = useState<string>('laser');

  const TOWER_TYPES = [
    { type: 'laser', label: 'Лазер ⚡' },
    { type: 'plasma', label: 'Плазма 🔥' },
    { type: 'pulse', label: 'Імпульс 📡' },
    { type: 'cryo', label: 'Кріо ❄️' },
    { type: 'tesla', label: 'Тесла 🌌' },
    { type: 'railgun', label: 'Рейкотрон 🎯' }
  ];

  // Spin physics states
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelSector | null>(null);
  const [duplicateRefunded, setDuplicateRefunded] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedSubSkin, setSelectedSubSkin] = useState<string>('default');

  // Animation ticks & rotation speed
  const rotationSpeedRef = useRef(0);
  const currentAngleRef = useRef(0);
  const lastSoundSectorRef = useRef<number>(-1);

  // Setup canvas drawings
  useEffect(() => {
    drawWheel();
  }, [currentAngle]);

  const spinCost = 80;

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate the wheel context
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(currentAngle);

    const numSlices = WHEEL_SECTORS.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    WHEEL_SECTORS.forEach((sector, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice background pie
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = sector.color + 'dd'; // 85% opacity
      ctx.fill();

      // Golden outline borders for segments
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#020205';
      ctx.stroke();

      // Core outer neon rings
      ctx.beginPath();
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.strokeStyle = sector.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sector Labelling text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Select appropriate cosmetic fonts
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      
      // Limit layout width
      const maxLabelLen = sector.type === 'skin' ? 12 : 8;
      let titleText = sector.label;
      if (titleText.length > maxLabelLen + 3) {
        titleText = titleText.substring(0, maxLabelLen) + '..';
      }

      ctx.fillText(titleText, radius - 24, 0);
      ctx.restore();
    });

    // Outer cyber casing / boundary ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0e172a';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#22d3ee';
    ctx.stroke();

    // Center Quantum Microcore Bolt
    const centerGrace = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    centerGrace.addColorStop(0, '#ffffff');
    centerGrace.addColorStop(0.3, '#22d3ee');
    centerGrace.addColorStop(1, '#020617');

    ctx.fillStyle = centerGrace;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffffaa';
    ctx.stroke();

    ctx.restore();

    // DRAW THE ARROW PIN (Fixed pointer outside) at the exact absolute top!
    ctx.save();
    ctx.translate(center, center - radius + 5);

    // Dynamic wiggle based on velocity
    const pointerWiggle = Math.abs(rotationSpeedRef.current) > 0.02 
      ? Math.sin(Date.now() * 0.1) * 3 
      : 0;
    ctx.rotate((pointerWiggle * Math.PI) / 180);

    // Pointer shadow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(10, 18);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  const spinTheWheel = () => {
    if (isSpinning) return;
    if (cyberTokens < spinCost) {
      cyberAudio.playDamageBase();
      return;
    }

    // Deduct entry fee
    onUpdateTokens(prev => prev - spinCost);
    cyberAudio.playUpgrade();

    setIsSpinning(true);
    setWonPrize(null);
    setDuplicateRefunded(false);

    // Set high random starting velocity
    const minSpins = 4;
    const maxSpins = 7;
    const randomAngleDistance = minSpins * Math.PI * 2 + Math.random() * Math.PI * 2;
    
    // Physics variables
    let velocity = 0.5 + Math.random() * 0.25; // Speed multiplier per frame
    const friction = 0.982; // smooth drag deceleration
    rotationSpeedRef.current = velocity;

    const animateSpin = () => {
      if (velocity < 0.0016) {
        // SPIN COMPLETE!
        setIsSpinning(false);
        rotationSpeedRef.current = 0;
        evaluateWinner();
        return;
      }

      currentAngleRef.current += velocity;
      // boundary loop
      currentAngleRef.current = currentAngleRef.current % (Math.PI * 2);
      setCurrentAngle(currentAngleRef.current);

      // Auditory click clicking while passing sectors
      const numSlices = WHEEL_SECTORS.length;
      const anglePerSlice = (Math.PI * 2) / numSlices;
      
      // Calculate active sector under pointer (pointing down from top, top is -Math.PI / 2)
      // Pointer is at -Math.PI/2 relative to standard 0 angle on the circle.
      // So pointer angle = 1.5 * Math.PI
      const pointerReferenceAngle = (1.5 * Math.PI - currentAngleRef.current + Math.PI * 10) % (Math.PI * 2);
      const activeSectorIndex = Math.floor(pointerReferenceAngle / anglePerSlice) % numSlices;

      if (activeSectorIndex !== lastSoundSectorRef.current) {
        lastSoundSectorRef.current = activeSectorIndex;
        // play gentle mechanical tactile tick frequency sweep
        cyberAudio.playLevelSelect();
      }

      velocity *= friction;
      rotationSpeedRef.current = velocity;
      requestAnimationFrame(animateSpin);
    };

    animateSpin();
  };

  const evaluateWinner = () => {
    const numSlices = WHEEL_SECTORS.length;
    const anglePerSlice = (Math.PI * 2) / numSlices;
    
    // Compute exact sector landing coordinates
    const pointerReferenceAngle = (1.5 * Math.PI - currentAngleRef.current + Math.PI * 10) % (Math.PI * 2);
    const winningIndex = Math.floor(pointerReferenceAngle / anglePerSlice) % numSlices;
    const winner = WHEEL_SECTORS[winningIndex];

    setTimeout(() => {
      // Award prize
      cyberAudio.playVictory();
      setWonPrize(winner);
      setShowPrizeModal(true);

      if (winner.type === 'currency') {
        const rewardValue = winner.value || 0;
        onUpdateTokens(prev => prev + rewardValue);
      } else if (winner.type === 'skin') {
        const skinId = winner.id;
        const alreadyHasIt = unlockedSkins.includes(skinId);

        if (alreadyHasIt) {
          // Refund duplicated skin
          const refundAmount = 60;
          onUpdateTokens(prev => prev + refundAmount);
          setDuplicateRefunded(true);
        } else {
          // Unlock new awesome skin
          onUnlockSkin(skinId);
          setDuplicateRefunded(false);
        }
      }
    }, 450);
  };

  const getSkinsCount = () => {
    return `${unlockedSkins.length} / ${TOWER_SKINS.length}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono">
      <div className="w-full max-w-5xl h-[90vh] md:h-auto max-h-[92vh] border border-cyan-500/30 bg-slate-950/95 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col gap-6 relative overflow-hidden custom-scroll overflow-y-auto">
        
        {/* Neon scan lines decorative border */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white border border-slate-800 hover:border-cyan-500/50 rounded-xl bg-slate-900/40 hover:bg-cyan-950/20 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Titles */}
        <div className="text-center sm:text-left flex flex-col sm:flex-row justify-between items-center border-b border-slate-900 pb-4 gap-4 mt-2">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-cyan-400">
              <Gift className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[3px]">// КІБЕР-УСИЛЕННЯ //</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider mt-1">КОЛЕСО ФОРТУНИ ТА СКІНИ</h1>
          </div>

          {/* Persistent Currency Balance Screen HUD */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 px-4 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.06)]">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div className="text-left">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold leading-none">НАКОПИЧЕНО КІБЕР-ТОКЕНІВ</span>
              <span className="text-lg font-black text-yellow-400 leading-none">{cyberTokens} 🪙</span>
            </div>
          </div>
        </div>

        {/* Inner layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* LEFT: Spin physical machine block (5 columns) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 border border-cyan-500/10 rounded-2xl bg-slate-900/20 relative">
            
            {/* Spinning apparatus background glow */}
            <div className="absolute w-64 h-64 rounded-full bg-cyan-500/5 blur-[50px] pointer-events-none" />

            {/* Canvas Wheel */}
            <div className="relative p-2 bg-slate-950 border border-slate-800 rounded-full shadow-[0_0_30px_rgba(0,240,255,0.05)]">
              <canvas
                ref={canvasRef}
                width={310}
                height={310}
                className="w-[280px] h-[280px] sm:w-[310px] sm:h-[310px]"
              />
            </div>

            {/* Spin action buttons triggers */}
            <div className="w-full mt-5">
              <button
                disabled={isSpinning || cyberTokens < spinCost}
                onClick={spinTheWheel}
                className={`w-full py-4 uppercase font-black tracking-wider text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 ${
                  isSpinning
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    : cyberTokens < spinCost
                      ? 'bg-red-950/20 border border-red-900/30 text-red-400 cursor-not-allowed hover:bg-red-950/30'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:brightness-110 hover:scale-[1.01] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinning 
                    ? 'СИНХРОНІЗАЦІЯ ШВИДКОСТІ...' 
                    : cyberTokens < spinCost 
                      ? 'НЕОБХІДНО 80 🪙 (ГРАЙТЕ РІВНІ)' 
                      : `КРУТИТИ КОЛЕСО (ЦІНА: ${spinCost} 🪙)`
                  }
                </span>
              </button>
              
              <div className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-3">
                🎁 КОЖЕН СПІН МОЖЕ ДАТИ ВИКЛЮЧНИЙ КІБЕР-СКІН АБО КУПУ ТОКЕНІВ!
              </div>
            </div>
          </div>

          {/* RIGHT: Skins Arsenal & Info board (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full bg-slate-900/20 p-5 border border-slate-800 rounded-2xl relative">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">АРСЕНАЛ МОДИФІКАЦІЙ ({getSkinsCount()})</h2>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                  // ОБЕРІТЬ ВЕЖУ ДЛЯ НАЛАШТУВАННЯ //
                </div>
              </div>

              {/* Tower Type Sub-Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-950/80 border border-slate-900 rounded-xl">
                {TOWER_TYPES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => {
                      cyberAudio.playLevelSelect();
                      setSelectedTowerType(t.type);
                    }}
                    className={`py-1.5 px-1 text-[9px] font-bold uppercase text-center rounded-lg transition-all duration-200 cursor-pointer border ${
                      selectedTowerType === t.type
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Skins grid representation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1 pb-2 custom-scroll">
                {TOWER_SKINS.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.id);
                  const isActive = (activeSkins[selectedTowerType] || 'default') === skin.id;
                  const IconComp = skin.icon;

                  return (
                    <button
                      key={skin.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        cyberAudio.playLevelSelect();
                        onEquipSkin(selectedTowerType, skin.id);
                      }}
                      className={`text-left p-4.5 border rounded-xl flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                        !isUnlocked 
                          ? 'border-slate-900 bg-slate-950/40 opacity-40 cursor-not-allowed'
                          : isActive
                            ? 'border-cyan-400 bg-slate-900 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/50'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-slate-600 text-slate-300 cursor-pointer'
                      }`}
                    >
                      {/* Scanlines element for active items */}
                      {isActive && (
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400" />
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1 px-1.5 border rounded-md text-[10px]" 
                            style={{ 
                              color: isUnlocked ? skin.color : '#475569', 
                              borderColor: isUnlocked ? skin.color + '44' : '#334155' 
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase text-white truncate max-w-[110px]">{skin.name}</h3>
                            <span className="text-[8px] text-slate-500 font-mono tracking-wider block leading-none">
                              {skin.id === 'default' ? '// СТАНДАРТ' : '// ЕКСКЛЮЗИВ'}
                            </span>
                          </div>
                        </div>

                        {/* Status Check / Locked icon badges */}
                        {isActive ? (
                          <span className="text-[9px] text-[#00f0ff] font-extrabold uppercase animate-pulse shrink-0 tracking-wider">
                            [ АКТИВНИЙ ]
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[8px] font-bold text-slate-500 group-hover:text-cyan-400 transition-colors uppercase shrink-0">
                            ВСТАНОВИТИ
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-red-500 uppercase shrink-0">
                            ЗАБЛОКОВАНО
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal font-sans pt-1 border-t border-slate-900">
                        {skin.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explainer Box */}
            <div className="mt-4 p-4 border border-cyan-500/10 bg-[#020205] rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-mono text-xs uppercase mb-0.5 tracking-wide">// ІНФО-МАНУАЛ СТИЛЮ //</strong>
                Скіни з Колеса Фортуни повністю та безповоротно модифікують візуальний колірний спектр і світлодіоди Ваших автоматичних турелей.
                Кожен пройдений рівень дає <strong className="text-cyan-400 font-mono">+100 🪙 токенів</strong>. Повторне проходження також сумує нагороду! Не забувайте екіпірувати розблокований скін.
              </div>
            </div>
          </div>

        </div>

        {/* --- PRIZE UNLOCKED MODAL CELEBRATORY SCREEN --- */}
        {showPrizeModal && wonPrize && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_60%)]" />

            <div className="w-full max-w-md border border-cyan-500/40 bg-slate-950 p-8 rounded-2xl text-center shadow-[0_0_60px_rgba(34,211,238,0.2)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

              <div className="p-5 inline-block border border-cyan-500/20 rounded-2xl bg-cyan-950/10 mb-5 shadow-[0_0_20px_rgba(6,182,212,0.1)] text-cyan-400 relative">
                <Trophy className="w-12 h-12 animate-bounce" />
                <Sparkles className="w-5 h-5 text-yellow-400 absolute top-2 right-2 animate-pulse" />
              </div>

              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-[4px] block mb-1">
                // ВІТАЄМО, ОПЕРАТОРЕ! //
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                СИНХРОНІЗОВАНИЙ ВИГРАШ
              </h2>
              <div className="h-[1px] w-24 bg-cyan-500/30 mx-auto mb-6" />

              {/* Central won component indicator card */}
              <div className="p-6 border border-slate-800 bg-[#020205] rounded-xl mb-6 relative">
                <div className="absolute top-2 left-2 text-[8px] text-slate-500 tracking-wider">
                  ЦЕНТРАЛЬНИЙ НОУД: SUCCESS
                </div>

                <div className="flex flex-col items-center gap-1">
                  {wonPrize.type === 'currency' ? (
                    <>
                      <div className="text-5xl mb-2">🪙</div>
                      <span className="text-3xl font-black text-yellow-400 uppercase tracking-wide">
                        {wonPrize.label}
                      </span>
                      <p className="text-slate-400 text-xs font-sans mt-2">
                        Кібер-Токени миттєво зараховані на Ваш оборонний смарт-гаманець.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2" style={{ color: wonPrize.color }}>💎</div>
                      <span className="text-lg font-black text-white uppercase tracking-wider block">
                        СКІН: "{wonPrize.label}"
                      </span>
                      
                      {duplicateRefunded ? (
                        <div className="mt-3">
                          <span className="text-[9px] bg-red-950/40 text-red-400 px-3 py-1 border border-red-900/30 rounded-full inline-block font-bold">
                            ДУБЛІКАТ СКІНА!
                          </span>
                          <p className="text-yellow-400 text-xs font-bold font-sans mt-2 leading-relaxed">
                            Отримано компенсацію: <strong className="text-white">+60 🪙 Кібер-Токенів</strong>!
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs font-sans mt-2">
                          Цей винятковий неоновий відтінок активований в списку доступних скінів.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action operations buttons */}
              <div className="space-y-2">
                {wonPrize.type === 'skin' && !duplicateRefunded && (
                  <button
                    onClick={() => {
                      cyberAudio.playUpgrade();
                      onEquipSkin(selectedTowerType, wonPrize.id);
                      setShowPrizeModal(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:brightness-110 cursor-pointer text-center"
                  >
                    ОДРАЗУ ВСТАНОВИТИ ДЛЯ {TOWER_TYPES.find(t => t.type === selectedTowerType)?.label || 'ВЕЖІ'}
                  </button>
                )}

                <button
                  onClick={() => setShowPrizeModal(false)}
                  className="w-full py-2.5 border border-slate-800 hover:border-slate-500 text-slate-400 text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 bg-slate-950/40 cursor-pointer"
                >
                  ЗАБРАТИ ТА ПРОДОВЖИТИ
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
