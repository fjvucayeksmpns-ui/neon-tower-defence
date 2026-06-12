import { useState } from 'react';
import { 
  Zap, 
  Flame, 
  Radio, 
  Snowflake, 
  Cpu, 
  ShieldAlert, 
  Activity, 
  Ghost, 
  Skull, 
  X, 
  Coins, 
  Crosshair, 
  Gauge, 
  ShieldHalf,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import cyberAudio from '../audio';

interface AlmanacProps {
  onClose: () => void;
}

export default function Almanac({ onClose }: AlmanacProps) {
  const [activeTab, setActiveTab] = useState<'towers' | 'enemies' | 'boss'>('towers');

  const playClick = () => {
    cyberAudio.playLevelSelect();
  };

  const towersData = [
    {
      type: 'laser',
      title: 'Лазерна Вежа',
      color: 'shadow-[0_0_15px_#00f0ff] border-[#00f0ff] text-[#00f0ff]',
      bgColor: 'bg-[#00f0ff]/10',
      icon: Zap,
      cost: 100,
      damage: 25,
      range: 120,
      rate: 'Швидка (0.5с)',
      description: 'Стандартна оборонна вежа, яка використовує концентрований лазерний промінь.',
      fullInfo: 'Лазерний генератор збуджує фотонні потоки, миттєво плавлячи легку броню дронів. Найкраще підходить для стримування масових атак на перших ділянках траси або заповнення вільних зон завдяки низькій вартості.'
    },
    {
      type: 'plasma',
      title: 'Плазмова Вежа',
      color: 'shadow-[0_0_15px_#bd00ff] border-[#bd00ff] text-[#bd00ff]',
      bgColor: 'bg-[#bd00ff]/10',
      icon: Flame,
      cost: 200,
      damage: 80,
      range: 180,
      rate: 'Повільна (1.5с)',
      description: 'Випускає потужні плазмові заряди для знищення сильних цілей.',
      fullInfo: 'Плазмовий стиснювач генерує супер-розігріті термоядерні кулі. Завдає колосальної шкоди одиночним броньованим мехам. Через низьку швидкість атаки потребує підтримки з боку сповільнюючих веж.'
    },
    {
      type: 'pulse',
      title: 'Імпульсна Вежа',
      color: 'shadow-[0_0_15px_#ff9f00] border-[#ff9f00] text-[#ff9f00]',
      bgColor: 'bg-[#ff9f00]/10',
      icon: Radio,
      cost: 175,
      damage: 40,
      range: 130,
      rate: 'Середня (1.0с)',
      description: 'Створює електромагнітні хвилі, що вражають групи противників.',
      fullInfo: 'Випромінює сферичні енергетичні імпульси на частоті деструктивного резонансу. Вражає абсолютно всі ворожі юніти в зоні ураження одночасно, роблячи її ідеальною для вузьких поворотів дороги.'
    },
    {
      type: 'cryo',
      title: 'Кріо Вежа',
      color: 'shadow-[0_0_15px_#00ff66] border-[#00ff66] text-[#00ff66]',
      bgColor: 'bg-[#00ff66]/10',
      icon: Snowflake,
      cost: 125,
      damage: 0,
      range: 130,
      rate: 'Пасивна Аура',
      description: 'Не завдає шкоди, але постійно сповільнює всіх ворогів у радіусі дії на 65%.',
      fullInfo: 'Створює локальне поле суб-нульових температур. Не завдає шкоди, але миттєво і безперервно сповільнює ходові сервоприводи всіх ворогів у своєму радіусі дії на 65% (босів на 40%). Вкрай ефективна в тандемі з уражаючими вогневими вузлами.'
    },
    {
      type: 'tesla',
      title: 'Тесла-Вежа',
      color: 'shadow-[0_0_15px_#ec4899] border-[#ec4899] text-[#ec4899]',
      bgColor: 'bg-[#ec4899]/10',
      icon: Sparkles,
      cost: 220,
      damage: 32,
      range: 140,
      rate: 'Швидка (0.4с)',
      description: 'Генерує ланцюгову блискавку, яка перескакує на сусідні цілі.',
      fullInfo: 'Високочастотний ЕМП-випромінювач. Блискавка уражає основну ціль на повну потужність, а потім миттєво передається на дві додаткові цілі поблизу, завдаючи їм 70% шкоди. Дуже ефективна проти щільних груп противників.'
    },
    {
      type: 'railgun',
      title: 'Рейкогенератор',
      color: 'shadow-[0_0_15px_#3b82f6] border-[#3b82f6] text-[#3b82f6]',
      bgColor: 'bg-[#3b82f6]/10',
      icon: Crosshair,
      cost: 275,
      damage: 220,
      range: 280,
      rate: 'Дуже повільна (2к)',
      description: 'Рейкотрон надвеликої дальності з ефектом наскрізного пробиття.',
      fullInfo: 'Тяжка магнітна гармата. Стріляє снарядом ультра-високої кінетичної енергії, що пробиває головну ціль та наносить 40% шкоди будь-яким іншим ворогам вздовж усієї лінії пострілу. Завдає на 50% більше шкоди (ПОВНА СИЛА!), якщо перша ціль має 100% здоров’я.'
    }
  ];

  const enemiesData = [
    {
      type: 'drone',
      title: 'Дрон',
      color: 'shadow-[0_0_15px_#00f0ff] border-[#00f0ff] text-[#00f0ff]',
      bgColor: 'bg-[#00f0ff]/10',
      icon: Cpu,
      hp: 120,
      speed: 'Швидка (2.5x)',
      reward: '10 кредитів',
      description: 'Швидкий розвідувальний безпілотник.',
      features: 'Малий розмір, легко знищується лазерами, але має велику перевагу в швидкості на прямих ділянках.'
    },
    {
      type: 'assault',
      title: 'Робот-штурмовик',
      color: 'shadow-[0_0_15px_#ff9f00] border-[#ff9f00] text-[#ff9f00]',
      bgColor: 'bg-[#ff9f00]/10',
      icon: ShieldAlert,
      hp: 350,
      speed: 'Середня (1.8x)',
      reward: '20 кредитів',
      description: 'Основна бойова одиниця кібер-армії.',
      features: 'Збалансований штурмовий робот класу піхоти. Раціонально вкритий загартованою сталлю, вимагає інтенсивного вогню.'
    },
    {
      type: 'heavy',
      title: 'Важкий мех',
      color: 'shadow-[0_0_15px_#ff0055] border-[#ff0055] text-[#ff0055]',
      bgColor: 'bg-[#ff0055]/10',
      icon: Activity,
      hp: 500,
      speed: 'Повільна (0.9x)',
      reward: '40 кредитів',
      description: 'Броньована машина для прориву оборони.',
      features: 'Гігантський мех, що витримує десятки ударів. Найкращий спосіб нейтралізації — сповільнення та прицільний обстріл плазмовими вежами.'
    },
    {
      type: 'phantom',
      title: 'Кібер-Фантом',
      color: 'shadow-[0_0_15px_#bd00ff] border-[#bd00ff] text-[#bd00ff]',
      bgColor: 'bg-[#bd00ff]/10',
      icon: Ghost,
      hp: 350,
      speed: 'Дуже швидка (2.2x)',
      reward: '30 кредитів',
      description: 'Маскувальний літаючий фантом.',
      features: 'Володіє спеціальною технологією маскування, яка дає йому 5% шанс повністю ухилитися від снарядів веж і лазерних атак.'
    },
    {
      type: 'glitch',
      title: 'Глітч-Дрон',
      color: 'shadow-[0_0_15px_#facc15] border-[#facc15] text-[#facc15]',
      bgColor: 'bg-[#facc15]/10',
      icon: Sparkles,
      hp: 480,
      speed: 'Швидка (1.8x)',
      reward: '65 кредитів',
      description: 'Квантово-нестабільний автономний дрон.',
      features: 'Працює на нестабільному ядрі! Має 20% шанс викликати квантовий "ГЛІТЧ-ЗСУВ" при отриманні шкоди — при цьому він дефазується та телепортується на 20 одиниць уперед по трасі, повністю ігноруючи поточний удар!'
    }
  ];

  const bossData = {
    title: 'Омега-Титан [Ω]',
    hp: 1000,
    speed: 'Низька (0.5x)',
    color: 'shadow-[0_0_25px_#ff003c] border-[#ff003c] text-[#ff003c]',
    features: 'Головний штучний інтелект заколоту. Володіє неймовірною міцністю та реактивними щитами.',
    details: 'Омега-Титан з’являється на фінальній хвилі 3-го сектора. Його здоров’я становить 1000 HP, і він здатен повністю поглинати частину атак за рахунок регенеративного щита. Знищення цієї загрози повністю зупинить наступ кібер-армії.',
    abilities: [
      {
        name: 'Нано-Регенерація',
        desc: 'Автоматично відновлює частину здоров’я кожні кілька секунд у разі стабільності.'
      },
      {
        name: 'Тектонічний Імпульс',
        desc: 'Створює електромагнітні перешкоди, деактивуючи лише одну найближчу оборонну вежу.'
      }
    ]
  };

  return (
    <div id="almanac_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#020205] border-2 border-cyan-500/30 rounded-2xl flex flex-col shadow-[0_0_85px_rgba(0,242,255,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-black/80">
          <div className="flex items-center space-x-3">
            <span className="p-2 border border-cyan-400/40 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.4)] bg-cyan-950/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-sans">
                Кібер-Альманах <span className="text-cyan-400">v2.0</span>
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-wider">ENCRYPTED ARCHIVE // CENTRAL DEFENSE SYSTEM</p>
            </div>
          </div>
          <button 
            id="close_almanac_btn"
            onClick={() => { playClick(); onClose(); }}
            className="p-2 text-cyan-400 hover:text-white hover:bg-cyan-500/10 rounded-lg transition-all duration-200 border border-cyan-500/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Control */}
        <div className="flex bg-black/40 border-b border-cyan-500/20 p-2 space-x-2 font-mono text-xs">
          <button
            id="tab_towers"
            onClick={() => { playClick(); setActiveTab('towers'); }}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 border uppercase tracking-wider font-bold cursor-pointer ${
              activeTab === 'towers'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Вежі Оборони</span>
          </button>

          <button
            id="tab_enemies"
            onClick={() => { playClick(); setActiveTab('enemies'); }}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 border uppercase tracking-wider font-bold cursor-pointer ${
              activeTab === 'enemies'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Сили Вторгнення</span>
          </button>

          <button
            id="tab_boss"
            onClick={() => { playClick(); setActiveTab('boss'); }}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 border uppercase tracking-wider font-black cursor-pointer ${
              activeTab === 'boss'
                ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Skull className="w-4 h-4" />
            <span>Супер-Бос [Ω]</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/45">
          {activeTab === 'towers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {towersData.map((tow) => {
                const IconComp = tow.icon;
                return (
                  <div 
                    key={tow.type} 
                    className={`p-5 rounded-xl border bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col min-h-[250px] transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.5)] ${tow.color}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.02] rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl border border-current bg-black/60 shadow-[inset_0_0_10px_rgba(0,242,255,0.1)] ${tow.bgColor}`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-lg font-sans uppercase tracking-wide">{tow.title}</h3>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mt-0.5">// Weapon Module //</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 font-mono text-yellow-400 text-sm bg-yellow-400/5 border border-yellow-500/30 px-2.5 py-1 rounded-lg">
                        <Coins className="w-3.5 h-3.5 mr-0.5" />
                        <span>{tow.cost} CR</span>
                      </div>
                    </div>

                    <p className="text-sm font-sans text-white/70 mb-4 flex-1 font-light italic leading-relaxed">
                      "{tow.description}"
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-cyan-500/10 font-mono text-xs text-white/50 mb-4">
                      <div className="text-center">
                        <div className="text-[10px] text-white/30 tracking-wider">ШКОДА</div>
                        <div className="font-extrabold text-white text-sm mt-0.5">{tow.damage}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-white/30 tracking-wider">ДАЛЬНІСТЬ</div>
                        <div className="font-extrabold text-white text-sm mt-0.5">{tow.range}m</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-white/30 tracking-wider">ШВИДКІСТЬ</div>
                        <div className="font-extrabold text-cyan-400 text-xs mt-0.5">{tow.rate}</div>
                      </div>
                    </div>

                    <div className="text-xs text-white/60 bg-black/80 p-3 rounded-lg border border-cyan-500/10 leading-relaxed font-sans font-light">
                      {tow.fullInfo}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'enemies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enemiesData.map((en) => {
                const IconComp = en.icon;
                return (
                  <div 
                    key={en.type} 
                    className={`p-5 rounded-xl border bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col min-h-[250px] transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.5)] ${en.color}`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.02] rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl border border-current bg-black/60 shadow-[inset_0_0_10px_rgba(0,0,240,0.15)] ${en.bgColor}`}>
                          <IconComp className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-lg font-sans uppercase tracking-wide">{en.title}</h3>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mt-0.5">// Threat Unit //</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 font-mono text-emerald-400 text-sm bg-emerald-500/5 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
                        <Coins className="w-3.5 h-3.5 mr-0.5" />
                        <span>+{en.reward}</span>
                      </div>
                    </div>

                    <p className="text-sm text-white/70 mb-4 flex-1 font-light italic leading-relaxed font-sans">
                      "{en.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-cyan-500/10 font-mono text-xs text-white/50 mb-4">
                      <div>
                        <div className="text-[10px] text-white/30 flex items-center tracking-wider"><Crosshair className="w-3.5 h-3.5 mr-1 text-red-500" /> ЖИТТЯ</div>
                        <div className="font-extrabold text-rose-400 text-sm mt-0.5">{en.hp} HP</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/30 flex items-center tracking-wider"><Gauge className="w-3.5 h-3.5 mr-1 text-cyan-400" /> ШВИДКІСТЬ</div>
                        <div className="font-extrabold text-cyan-300 text-sm mt-0.5">{en.speed}</div>
                      </div>
                    </div>

                    <div className="text-xs text-white/60 bg-black/80 p-3 rounded-lg border border-cyan-500/10 leading-relaxed font-sans font-light">
                      <strong className="text-cyan-400 font-bold">Тактичні деталі: </strong>
                      {en.features}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'boss' && (
            <div className={`p-6 rounded-2xl border-2 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row gap-6 transition-all duration-300 shadow-[0_4px_20px_rgba(244,63,94,0.15)] ${bossData.color}`}>
              {/* Glow background decorative element */}
              <div className="absolute inset-0 bg-radial-gradient from-red-650/10 via-transparent to-transparent pointer-events-none"></div>

              {/* Boss Left Panel */}
              <div className="flex flex-col items-center md:w-1/3 text-center p-4 bg-black/80 border border-cyan-500/10 rounded-xl relative justify-center">
                <div className={`p-6 rounded-2xl border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-rose-950/20 mb-4`}>
                  <Skull className="w-16 h-16 text-rose-500 animate-[bounce_2s_infinite]" />
                </div>
                <h3 className="font-black text-rose-500 tracking-widest text-2xl font-sans uppercase">{bossData.title}</h3>
                <span className="text-xs uppercase font-mono tracking-widest text-white/40 mt-1 block font-semibold">// Rogue AI Overlord //</span>

                <div className="mt-6 w-full space-y-3 font-mono text-xs">
                  <div className="flex justify-between p-2 border-b border-white/5">
                    <span className="text-white/40 uppercase flex items-center"><Crosshair className="w-3.5 h-3.5 mr-1 text-rose-500" /> СТРУКТУРА:</span>
                    <span className="font-extrabold text-rose-400 text-sm">{bossData.hp} HP</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-white/5">
                    <span className="text-white/40 uppercase flex items-center"><Gauge className="w-3.5 h-3.5 mr-1 text-cyan-400" /> ШВИДКІСТЬ:</span>
                    <span className="font-extrabold text-cyan-300 text-sm">{bossData.speed}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-white/40 uppercase flex items-center"><ShieldHalf className="w-3.5 h-3.5 mr-1 text-pink-500" /> КОРПУС:</span>
                    <span className="font-extrabold text-white text-sm">Важка нано-броня</span>
                  </div>
                </div>
              </div>

              {/* Boss Right Panel */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-mono text-xs text-rose-400 tracking-widest uppercase mb-2 font-bold">// ТАКТИЧНА ДИРЕКТИВА</h4>
                  <p className="text-white/70 font-sans leading-relaxed text-sm italic mb-6 animate">
                    "{bossData.features}"
                  </p>

                  <h4 className="font-mono text-xs text-rose-400 tracking-widest uppercase mb-3 font-bold">// ОСОБЛИВІ СИСТЕМНІ ХАРАКТЕРИСТИКИ</h4>
                  <p className="text-white/60 font-sans text-sm leading-relaxed mb-6 bg-black/80 p-4 border border-cyan-500/10 rounded-lg">
                    {bossData.details}
                  </p>

                  <h3 className="font-sans text-white text-sm font-bold mb-3 flex items-center">
                    <ShieldHalf className="w-4 h-4 mr-2 text-rose-500" /> Активні тактичні здібності:
                  </h3>
                  <div className="space-y-3">
                    {bossData.abilities.map((ab, i) => (
                      <div key={i} className="flex p-3 bg-red-950/15 border border-red-900/40 rounded-lg text-xs leading-relaxed transition-all duration-300 hover:border-red-500">
                        <ChevronRight className="w-4 h-4 text-rose-500 flex-shrink-0 mr-1 mt-0.5" />
                        <div>
                          <strong className="text-white block mb-0.5 uppercase tracking-wide">{ab.name}</strong>
                          <span className="text-white/60 font-light">{ab.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyan-500/20 bg-black/80 text-center flex flex-col sm:flex-row items-center justify-between">
          <span className="text-[10px] font-mono text-cyan-400/50 block font-light tracking-wide">// CENTRAL SYSTEM MAINFRAME ENCRYPTED ARCHIVES SECURED v2.0-L //</span>
          <button 
            id="almanac_understand_btn"
            onClick={() => { playClick(); onClose(); }}
            className="mt-3 sm:mt-0 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:brightness-110 text-black font-mono font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.35)] transition-all duration-300 cursor-pointer"
          >
            Зрозуміло
          </button>
        </div>

      </div>
    </div>
  );
}
