import React, { useState, useEffect, useRef } from 'react';
import {
  CarCustomization,
  CarModel,
  WheelType,
  BoostType,
  GameMode,
  BotDifficulty,
  MainMenuTab,
  PlayerProfile,
} from '../types/game';
import { sound } from '../audio/soundEngine';
import { drawCarDecal } from '../renderer/gameRenderer';
import { screenAdapter, ScreenMetrics } from '../utils/screenAdapter';
import {
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  Flame,
  Disc,
  Palette,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Check,
  Maximize,
  Minimize,
  HelpCircle,
  Dumbbell,
  Settings,
  Home,
  User,
  Trophy,
  Lock,
} from 'lucide-react';

interface GarageScreenProps {
  customization: CarCustomization;
  onUpdate: (updated: CarCustomization) => void;
  onBackToMenu: () => void;
  onStartMatch: (mode: GameMode, diff: BotDifficulty) => void;
  onSelectTab?: (tab: MainMenuTab) => void;
  onOpenGuide?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  playerProfile?: PlayerProfile;
}

// Cars database with real Rocket League Sideswipe stats & style
interface CarInfo {
  id: CarModel;
  name: string;
  subtitle: string;
  description: string;
  hitbox: string;
  stats: {
    speed: number;
    aerial: number;
    power: number;
    handling: number;
  };
}

const CAR_MODELS: CarInfo[] = [
  {
    id: 'octane',
    name: 'OCTANE',
    subtitle: 'L\'icône universelle',
    description: 'Le buggy le plus célèbre de l\'arène. Parfaitement équilibré pour les aerials, les dribbles et les 50/50 aériens.',
    hitbox: 'Hitbox Octane standard',
    stats: { speed: 90, aerial: 95, power: 88, handling: 92 },
  },
  {
    id: 'fennec',
    name: 'FENNEC',
    subtitle: 'La bête de rallye',
    description: 'Châssis compact et angulaire ultra prisé des compétiteurs. Ses faces planes offrent un contrôle de balle chirurgical.',
    hitbox: 'Hitbox Octane rallye',
    stats: { speed: 92, aerial: 90, power: 94, handling: 90 },
  },
  {
    id: 'dominus',
    name: 'DOMINUS',
    subtitle: 'Muscle car légendaire',
    description: 'Longue, basse et agressive. Le capot plat maximise la surface de contact pour des tirs puissants et des flips dévastateurs.',
    hitbox: 'Hitbox Dominus allongée',
    stats: { speed: 94, aerial: 86, power: 98, handling: 85 },
  },
  {
    id: 'merc',
    name: 'MERC',
    subtitle: 'Le titan blindé',
    description: 'Un van imposant avec une présence physique colossale. Idéal pour remporter les 50/50 et verrouiller la cage de but.',
    hitbox: 'Hitbox Merc haute & lourde',
    stats: { speed: 85, aerial: 82, power: 96, handling: 88 },
  },
  {
    id: 'porsche',
    name: 'PORSCHE 911 TURBO',
    subtitle: 'Supercar aérodynamique',
    description: 'L\'icône de Rocket League Sideswipe. Ligne fluide intemporelle, aileron queue de baleine et maniabilité chirurgicale.',
    hitbox: 'Hitbox Porsche racing',
    stats: { speed: 96, aerial: 92, power: 90, handling: 96 },
  },
  {
    id: 'corvette',
    name: 'CORVETTE C8.R',
    subtitle: 'Supercar américaine GT',
    description: 'La supercar légendaire à moteur central de Rocket League. Aérodynamisme tranchant, prises d\'air en boomerang, aileron GT surélevé et tirs foudroyants.',
    hitbox: 'Hitbox Dominus / Supercar',
    stats: { speed: 97, aerial: 93, power: 96, handling: 93 },
  },
];

const BODY_COLORS = [
  { name: 'Bleu Cobalt', value: '#2563eb' },
  { name: 'Cyan Électrique', value: '#06b6d4' },
  { name: 'Rouge Crimson', value: '#dc2626' },
  { name: 'Vert Néon', value: '#16a34a' },
  { name: 'Violet Cyber', value: '#9333ea' },
  { name: 'Or Solaire', value: '#eab308' },
  { name: 'Orange Sunset', value: '#ea580c' },
  { name: 'Rose Synthwave', value: '#db2777' },
  { name: 'Noir Carbone', value: '#1e293b' },
  { name: 'Blanc Titane', value: '#f8fafc' },
  { name: 'Argent Métallique', value: '#64748b' },
  { name: 'Vert Lime', value: '#84cc16' },
];

const ACCENT_COLORS = [
  { name: 'Blanc Titane', value: '#ffffff' },
  { name: 'Cyan Électrique', value: '#38bdf8' },
  { name: 'Jaune Racing', value: '#facc15' },
  { name: 'Rouge Écarlate', value: '#f87171' },
  { name: 'Vert Émeraude', value: '#4ade80' },
  { name: 'Orange Feu', value: '#fb923c' },
  { name: 'Violet Néon', value: '#c084fc' },
  { name: 'Noir Mat', value: '#0f172a' },
];

const WHEEL_OPTIONS: Array<{ id: WheelType; name: string; desc: string }> = [
  { id: 'cristiano', name: 'Cristiano', desc: 'Jantes 5 branches compétition' },
  { id: 'apex', name: 'Apex', desc: 'Lames à plasma cinétique haute brillance' },
  { id: 'zomba', name: 'Zomba', desc: 'Spirale hypnotique multicolore' },
  { id: 'astro', name: 'Astro-CSX', desc: 'Jantes alliage racing à double rayon' },
  { id: 'dieci', name: 'Dieci', desc: 'Rayons fins style supercar classique' },
  { id: 'infinium', name: 'Infinium', desc: 'Anneaux photoniques infinis' },
];

const WHEEL_COLORS = [
  { name: 'Cyan Néon', value: '#38bdf8' },
  { name: 'Or Pur', value: '#fbbf24' },
  { name: 'Blanc Titane', value: '#ffffff' },
  { name: 'Crimson', value: '#ef4444' },
  { name: 'Violet Ion', value: '#a855f7' },
  { name: 'Vert Toxique', value: '#22c55e' },
  { name: 'Orange Magma', value: '#f97316' },
  { name: 'Rose Cyber', value: '#ec4899' },
];

const BOOST_TYPES: Array<{
  id: BoostType;
  name: string;
  desc: string;
  colors: string[];
}> = [
  {
    id: 'cyan-hyper',
    name: 'Hyperdrive Cyan',
    desc: 'Propulsion à plasma froid et haute vélocité',
    colors: ['#38bdf8', '#0284c7', '#ffffff'],
  },
  {
    id: 'orange-flame',
    name: 'Flamme Standard',
    desc: 'La combustion thermique classique de Rocket League',
    colors: ['#f97316', '#ef4444', '#facc15'],
  },
  {
    id: 'neon-plasma',
    name: 'Plasma Néon',
    desc: 'Faisceau ionique violet et magenta haute température',
    colors: ['#c084fc', '#ec4899', '#ffffff'],
  },
  {
    id: 'rainbow',
    name: 'Warp Multicolore',
    desc: 'Spectre lumineux chromatique prismatique',
    colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
  },
  {
    id: 'electric-bolt',
    name: 'Foudre Électrique',
    desc: 'Arcs de foudre à haut voltage et étincelles crépitantes',
    colors: ['#67e8f9', '#a5f3fc', '#ffffff', '#3b82f6'],
  },
  {
    id: 'crimson-thermal',
    name: 'Thermique Crimson',
    desc: 'Postcombustion rouge incandescente avec onde de choc',
    colors: ['#ef4444', '#991b1b', '#f87171'],
  },
  {
    id: 'golden-spark',
    name: 'Poussière d\'Or',
    desc: 'Éclats scintillants et traînée dorée prestige',
    colors: ['#fbbf24', '#f59e0b', '#fef08a'],
  },
  {
    id: 'ion-green',
    name: 'Émeraude Toxique',
    desc: 'Nuage d\'énergie radioactive vert fluo',
    colors: ['#22c55e', '#15803d', '#86efac'],
  },
];

export const GarageScreen: React.FC<GarageScreenProps> = ({
  customization,
  onUpdate,
  onBackToMenu,
  onStartMatch,
  onSelectTab,
  onOpenGuide,
  isMuted = false,
  onToggleMute,
  playerProfile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'chassis' | 'paint' | 'wheels' | 'boost' | 'explosion'>('chassis');
  const [facing, setFacing] = useState<1 | -1>(1);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isSpinningWheels, setIsSpinningWheels] = useState(true);
  const [flipProgress, setFlipProgress] = useState(0);

  const [screenMetrics, setScreenMetrics] = useState<ScreenMetrics>(() => screenAdapter.getMetrics());

  useEffect(() => {
    return screenAdapter.subscribe(setScreenMetrics);
  }, []);

  const toggleFullscreen = async () => {
    await screenAdapter.toggleFullscreen();
  };

  const animFrameRef = useRef<number>(0);
  const wheelRotationRef = useRef(0);
  const boostParticlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }>
  >([]);

  const selectedCar = CAR_MODELS.find((c) => c.id === customization.carModel) || CAR_MODELS[0];

  // Flip 360 animation
  const triggerFlip = () => {
    sound.playFlip();
    const start = performance.now();
    const duration = 600;

    const animate = (time: number) => {
      const elapsed = time - start;
      const p = Math.min(1, elapsed / duration);
      setFlipProgress(p);
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        setFlipProgress(0);
        sound.playFlipReset();
      }
    };
    requestAnimationFrame(animate);
  };

  const startBoost = () => {
    setIsBoosting(true);
    sound.startBoost();
  };

  const stopBoost = () => {
    setIsBoosting(false);
    sound.stopBoost();
  };

  // Canvas Turntable Loop (Showroom haute fidélité)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastT = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastT) / 1000);
      lastT = time;

      // Update canvas logical size
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.54;

      // 1. High-Impact Dynamic Sizing
      const platformRadiusX = Math.min(width * 0.44, 380);
      const platformRadiusY = Math.min(height * 0.14, 46);
      const platformY = centerY + 58;

      // Volumetric spotlight beams from ceiling
      ctx.save();
      const spotLeft = ctx.createLinearGradient(0, 0, centerX, platformY);
      spotLeft.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
      spotLeft.addColorStop(1, 'transparent');
      ctx.fillStyle = spotLeft;
      ctx.beginPath();
      ctx.moveTo(width * 0.08, 0);
      ctx.lineTo(centerX - 100, platformY);
      ctx.lineTo(centerX + 100, platformY);
      ctx.lineTo(width * 0.28, 0);
      ctx.closePath();
      ctx.fill();

      const spotRight = ctx.createLinearGradient(width, 0, centerX, platformY);
      spotRight.addColorStop(0, 'rgba(147, 51, 234, 0.09)');
      spotRight.addColorStop(1, 'transparent');
      ctx.fillStyle = spotRight;
      ctx.beginPath();
      ctx.moveTo(width * 0.92, 0);
      ctx.lineTo(centerX + 100, platformY);
      ctx.lineTo(centerX - 100, platformY);
      ctx.lineTo(width * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Platform Glow Shadow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        platformY,
        15,
        centerX,
        platformY,
        platformRadiusX * 1.25
      );
      glowGrad.addColorStop(0, `${customization.wheelColor}55`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, platformY, platformRadiusX * 1.25, platformRadiusY * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Platform Outer Bezel
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(centerX, platformY, platformRadiusX, platformRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Neon Podium Ring
      ctx.strokeStyle = customization.wheelColor || '#38bdf8';
      ctx.shadowColor = customization.wheelColor || '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, platformY, platformRadiusX * 0.88, platformRadiusY * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Turntable radial spokes
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      const t = time * 0.0006;
      for (let i = 0; i < 10; i++) {
        const a = t + (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(centerX, platformY);
        ctx.lineTo(centerX + Math.cos(a) * platformRadiusX * 0.88, platformY + Math.sin(a) * platformRadiusY * 0.88);
        ctx.stroke();
      }

      // 2. Wheel Rotation
      if (isBoosting || isSpinningWheels) {
        wheelRotationRef.current += dt * 18;
      }

      // Dynamic Car Scale (Grand format spectacle)
      const baseScale = Math.min(3.2, Math.max(2.2, width / 310));

      // 3. Emit Boost Particles on stage
      const currentBoostCfg = BOOST_TYPES.find((b) => b.id === customization.boostType) || BOOST_TYPES[0];
      if (isBoosting) {
        const exhaustX = centerX - facing * (46 * baseScale);
        const exhaustY = platformY - (16 * baseScale);
        for (let i = 0; i < 5; i++) {
          const spread = (Math.random() - 0.5) * 0.5;
          const speed = (280 + Math.random() * 240) * (baseScale / 2);
          const angle = facing === 1 ? Math.PI + spread : spread;
          boostParticlesRef.current.push({
            x: exhaustX,
            y: exhaustY + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * 0.5,
            size: (7 + Math.random() * 9) * (baseScale / 2),
            color: currentBoostCfg.colors[Math.floor(Math.random() * currentBoostCfg.colors.length)],
            alpha: 1.0,
          });
        }
      }

      // 4. Update and Draw Boost Particles
      for (let i = boostParticlesRef.current.length - 1; i >= 0; i--) {
        const p = boostParticlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 3.5;
        p.size = Math.max(1, p.size - dt * 14);

        if (p.alpha <= 0) {
          boostParticlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Car on Podium (Large Grand Scale)
      ctx.save();
      const flipAngle = flipProgress * Math.PI * 2 * facing;
      const flipElevation = Math.sin(flipProgress * Math.PI) * (28 * baseScale);
      const carY = platformY - (14 * baseScale) - flipElevation;

      ctx.translate(centerX, carY);
      ctx.scale(facing * baseScale, baseScale);
      ctx.rotate(flipAngle);

      // Car Neon Underglow
      ctx.save();
      ctx.shadowColor = customization.wheelColor || '#38bdf8';
      ctx.shadowBlur = 28;
      ctx.fillStyle = `${customization.wheelColor}77`;
      ctx.beginPath();
      ctx.ellipse(0, 15, 48, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Car Vector Silhouette
      drawCarVectorPreview(ctx, customization);

      // Draw Wheels
      drawWheelsPreview(
        ctx,
        customization.carModel,
        customization.wheelType,
        customization.wheelColor,
        wheelRotationRef.current
      );

      ctx.restore();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [customization, facing, isBoosting, isSpinningWheels, flipProgress]);

  return (
    <div id="garage-screen" className="relative flex min-h-[100dvh] w-full flex-col bg-slate-950 select-none overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* 1. Header Navigation Bar (Exactement comme dans les menus de jeu) */}
      <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-3 sm:px-6 py-2.5 backdrop-blur-xl">
        {/* Brand & Left Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3.5 py-1.5 font-display text-xs font-bold text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-700 hover:text-white active:scale-95"
            title="Retour au menu principal"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">RETOUR</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="font-display text-sm sm:text-base font-black italic tracking-wider text-white">
              SIDESWIPE
            </h1>
            <span className="hidden sm:inline-block rounded-md bg-cyan-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-cyan-300">
              GARAGE
            </span>
          </div>
        </div>

        {/* Center: Main Game Tabs (ACCUEIL, JOUER, GARAGE, MÉCANIQUES, PARAMÈTRES) */}
        <nav className="flex items-center gap-1 rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectTab ? onSelectTab('home') : onBackToMenu()}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-400 hover:text-white transition-all hover:bg-slate-800/50"
          >
            <Home className="h-3.5 w-3.5" />
            <span>ACCUEIL</span>
          </button>

          <button
            onClick={() => onSelectTab ? onSelectTab('play') : onBackToMenu()}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-400 hover:text-white transition-all hover:bg-slate-800/50"
          >
            <Play className="h-3.5 w-3.5" />
            <span>JOUER</span>
          </button>

          <button
            onClick={() => onSelectTab ? onSelectTab('competition') : onBackToMenu()}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-amber-400/90 hover:text-amber-300 transition-all hover:bg-slate-800/50"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>COMPÉTITIONS</span>
          </button>

          <button
            onClick={() => onSelectTab ? onSelectTab('profile') : onBackToMenu()}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-400 hover:text-white transition-all hover:bg-slate-800/50"
          >
            <User className="h-3.5 w-3.5" />
            <span>PROFIL</span>
          </button>

          <button
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={() => onSelectTab ? onSelectTab('mechanics') : onOpenGuide?.()}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-400 hover:text-white transition-all hover:bg-slate-800/50"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <span className="hidden sm:inline">MÉCANIQUES</span>
            <span className="sm:hidden">GUIDE</span>
          </button>

          <button
            onClick={() => onSelectTab ? onSelectTab('settings') : onBackToMenu()}
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-400 hover:text-white transition-all hover:bg-slate-800/50"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden md:inline">OPTIONS</span>
          </button>
        </nav>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            title={screenMetrics.isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {screenMetrics.isFullscreen ? <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" /> : <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />}
            </button>
          )}

          <button
            onClick={() => onStartMatch('vs-bot', 'pro')}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 sm:px-4 py-1.5 sm:py-2 font-display text-xs sm:text-sm font-black italic tracking-wide text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>JOUER</span>
          </button>
        </div>
      </header>

      {/* 2. Main Studio Content Area (Affiché en grand format) */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* ================= HERO SHOWROOM STAGE (EN GRAND FORMAT) ================= */}
        <section className="relative flex w-full flex-col items-center justify-between border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 p-3 sm:p-6 min-h-[360px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[540px] overflow-hidden">
          {/* Giant Watermark Model Typography behind the car */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="font-display font-black italic tracking-tighter text-slate-800/20 text-7xl sm:text-9xl md:text-[11rem] lg:text-[14rem] uppercase whitespace-nowrap blur-[1px]">
              {selectedCar.name}
            </span>
          </div>

          {/* Top Stage Bar: Left Car HUD + Right Action Controls */}
          <div className="relative z-10 flex w-full items-start justify-between gap-4">
            {/* Left HUD: Car Name & Stats */}
            <div className="flex flex-col text-left">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-400">
                  {selectedCar.subtitle}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-wide text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                {selectedCar.name}
              </h2>
              <div className="text-xs text-slate-400 font-rajdhani mt-0.5 max-w-sm hidden sm:block">
                {selectedCar.description}
              </div>

              {/* 4 Performance Micro-Gauges */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 border border-slate-800/80 p-2 sm:p-2.5 rounded-2xl backdrop-blur-md w-fit">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Vitesse</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-14 sm:w-16 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${selectedCar.stats.speed}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white">{selectedCar.stats.speed}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Aérien</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-14 sm:w-16 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${selectedCar.stats.aerial}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white">{selectedCar.stats.aerial}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Frappe</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-14 sm:w-16 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${selectedCar.stats.power}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white">{selectedCar.stats.power}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Contrôle</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-14 sm:w-16 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${selectedCar.stats.handling}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white">{selectedCar.stats.handling}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Showcase Controls: Pivot, Flip, Wheels */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                onClick={() => setFacing(facing === 1 ? -1 : 1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 font-display text-xs font-bold text-slate-300 backdrop-blur transition-all hover:bg-slate-800 hover:text-white"
                title="Retourner le véhicule de 180°"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PIVOTER 180°</span>
              </button>

              <button
                onClick={triggerFlip}
                className="flex items-center gap-1.5 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 font-display text-xs font-bold text-yellow-400 backdrop-blur hover:bg-yellow-500/20 active:scale-95 transition-all"
                title="Déclencher un flip aérien 360°"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>FLIP 360°</span>
              </button>

              <button
                onClick={() => setIsSpinningWheels(!isSpinningWheels)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-display text-xs font-bold backdrop-blur transition-all ${
                  isSpinningWheels
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800'
                }`}
                title="Faire tourner les roues"
              >
                <Disc className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ROUES : {isSpinningWheels ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Turntable Canvas in Grand Format */}
          <div className="relative z-10 flex h-[240px] sm:h-[300px] md:h-[360px] lg:h-[400px] w-full items-center justify-center my-auto">
            <canvas ref={canvasRef} className="h-full w-full max-w-5xl" />
          </div>

          {/* Bottom Center Stage: Interactive Boost Trigger */}
          <div className="relative z-10 flex w-full items-center justify-center pt-2">
            <button
              onMouseDown={startBoost}
              onMouseUp={stopBoost}
              onMouseLeave={stopBoost}
              onTouchStart={startBoost}
              onTouchEnd={stopBoost}
              className={`flex items-center justify-center gap-2.5 rounded-2xl border px-6 sm:px-8 py-3 sm:py-3.5 font-display text-xs sm:text-sm font-black tracking-wider transition-all select-none ${
                isBoosting
                  ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-red-600 text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.8)] scale-105 ring-2 ring-orange-400'
                  : 'border-orange-500/50 bg-orange-950/40 text-orange-400 hover:border-orange-400 hover:bg-orange-900/40 hover:scale-105 active:scale-95'
              }`}
            >
              <Flame className="h-5 w-5 animate-pulse" />
              <span>MAINTENIR POUR BOOSTER (SON & PARTICULES)</span>
            </button>
          </div>
        </section>

        {/* ================= 3. CUSTOMIZATION CONSOLE DOCK (TABS & MATRICES) ================= */}
        <section className="w-full bg-slate-950/80 px-3 sm:px-6 py-5">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('chassis')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'chassis'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>CARROSSERIE</span>
            </button>

            <button
              onClick={() => setActiveTab('paint')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'paint'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>PEINTURES & STICKERS</span>
            </button>

            <button
              onClick={() => setActiveTab('wheels')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'wheels'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Disc className="h-4 w-4" />
              <span>ROUES & JANTES</span>
            </button>

            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'boost'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>PROPULSEUR BOOST</span>
            </button>

            <button
              onClick={() => setActiveTab('explosion')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-display text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'explosion'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>EXPLOSIONS DE BUT</span>
            </button>
          </div>

          {/* TAB 1: CHASSIS SELECTION */}
          {activeTab === 'chassis' && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="text-xs font-semibold text-slate-400 font-rajdhani">
                Sélectionnez le bolide de votre choix. Chaque véhicule dispose de son profil aérodynamique Sideswipe et de son hitbox dédié.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CAR_MODELS.map((car) => {
                  const isSelected = customization.carModel === car.id;
                  const isUnlocked = Boolean(playerProfile?.unlockedCars ? playerProfile.unlockedCars.includes(car.id) : car.id === 'octane');
                  return (
                    <button
                      key={car.id}
                      onClick={() => {
                        if (isUnlocked) {
                          onUpdate({ ...customization, carModel: car.id });
                          sound.playBallHit(0.3);
                        } else if (onSelectTab) {
                          onSelectTab('shop');
                        }
                      }}
                      className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                        !isUnlocked
                          ? 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-amber-500/50 cursor-pointer group'
                          : isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-base font-black ${
                          !isUnlocked
                            ? 'bg-slate-900 text-slate-600'
                            : isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {car.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-black italic tracking-wide text-white truncate">
                            {car.name}
                          </span>
                          {!isUnlocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                              <Lock className="h-3 w-3" /> BOUTIQUE
                            </span>
                          ) : isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                              <Check className="h-3.5 w-3.5" /> ÉQUIPÉE
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs font-semibold text-cyan-300 font-rajdhani mt-0.5">
                          {car.subtitle}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 font-rajdhani line-clamp-2">
                          {car.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PAINT SELECTION */}
          {activeTab === 'paint' && (
            <div className="mt-5 flex flex-col gap-6">
              {/* Primary Carrosserie Color */}
              <div>
                <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Couleur Principale (Carrosserie Métallisée)
                </label>
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                  {BODY_COLORS.map((color) => {
                    const isSelected = customization.bodyColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => onUpdate({ ...customization, bodyColor: color.value })}
                        className={`group relative flex h-14 flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-white scale-105 shadow-[0_0_16px_rgba(255,255,255,0.7)] ring-2 ring-cyan-400'
                            : 'border-transparent hover:border-slate-500'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {isSelected && <Check className="h-6 w-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />}
                        <span className="absolute -bottom-5 text-[9px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decal & Spoiler Accent Color */}
              <div className="pt-3">
                <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Couleur des Stickers, Aileron & Finitions
                </label>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 font-rajdhani">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = customization.accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => onUpdate({ ...customization, accentColor: color.value })}
                        className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-white bg-slate-800 text-white shadow-md'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-slate-600 shadow" style={{ backgroundColor: color.value }} />
                        <span className="truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decal / Sticker Selection */}
              <div className="pt-3 border-t border-slate-800/60">
                <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Sélection du Sticker (Motif Décoratif)
                </label>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'none', name: 'Aucun Sticker', desc: 'Carrosserie d’origine lisse' },
                    { id: 'stripes', name: 'Rayures de Course', desc: 'Double bande sport classique' },
                    { id: 'flames', name: 'Flammes d\'Enfer', desc: 'Motifs de feu sur le capot' },
                    { id: 'lightning', name: 'Éclair Cyber', desc: 'Tracés de foudre électriques' },
                    { id: 'tribal', name: 'Tatouage Tribal', desc: 'Formes abstraites courbées' },
                    { id: 'stars', name: 'Étoiles Champion', desc: 'Galaxie scintillante haut de gamme' },
                  ].map((decal) => {
                    const isSelected = (customization.selectedDecal || 'none') === decal.id;
                    const isUnlocked = Boolean(playerProfile?.unlockedDecals ? playerProfile.unlockedDecals.includes(decal.id) : decal.id === 'none');
                    return (
                      <button
                        key={decal.id}
                        onClick={() => {
                          if (isUnlocked) {
                            onUpdate({ ...customization, selectedDecal: decal.id });
                            sound.playBallHit(0.25);
                          } else if (onSelectTab) {
                            onSelectTab('shop');
                          }
                        }}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                          !isUnlocked
                            ? 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-amber-500/50 cursor-pointer group'
                            : isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isSelected ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 bg-slate-800 text-slate-400'}`}>
                          {isSelected ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Palette className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold text-white truncate">{decal.name}</span>
                            {!isUnlocked ? (
                              <Lock className="h-3.5 w-3.5 text-rose-400" />
                            ) : isSelected ? (
                              <Check className="h-4 w-4 text-cyan-400" />
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-400 font-rajdhani mt-0.5 truncate">{decal.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHEELS & RIMS SELECTION */}
          {activeTab === 'wheels' && (
            <div className="mt-5 flex flex-col gap-6">
              {/* Wheel Models */}
              <div>
                <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Modèle de Jantes Compétition
                </label>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {WHEEL_OPTIONS.map((wheel) => {
                    const isSelected = customization.wheelType === wheel.id;
                    const isUnlocked = Boolean(playerProfile?.unlockedWheels ? playerProfile.unlockedWheels.includes(wheel.id) : wheel.id === 'cristiano');
                    return (
                      <button
                        key={wheel.id}
                        onClick={() => {
                          if (isUnlocked) {
                            onUpdate({ ...customization, wheelType: wheel.id });
                            sound.playBallHit(0.2);
                          } else if (onSelectTab) {
                            onSelectTab('shop');
                          }
                        }}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                          !isUnlocked
                            ? 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-amber-500/50 cursor-pointer group'
                            : isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isSelected ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 bg-slate-800 text-slate-400'}`}>
                          <Disc className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold text-white truncate">{wheel.name}</span>
                            {!isUnlocked ? (
                              <Lock className="h-3.5 w-3.5 text-rose-400" />
                            ) : isSelected ? (
                              <Check className="h-4 w-4 text-cyan-400" />
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-400 font-rajdhani mt-0.5 truncate">{wheel.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wheel & Rim Glowing Color */}
              <div>
                <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Couleur des Jantes & Lueur Néon
                </label>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {WHEEL_COLORS.map((color) => {
                    const isSelected = customization.wheelColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => onUpdate({ ...customization, wheelColor: color.value })}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-white bg-slate-800 text-white shadow-md'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="h-4 w-4 rounded-full border border-slate-600 shadow" style={{ backgroundColor: color.value }} />
                        <span className="truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOST SELECTION */}
          {activeTab === 'boost' && (
            <div className="mt-5 flex flex-col gap-3">
              <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                Propulseur & Traînée de Boost
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {BOOST_TYPES.map((boost) => {
                  const isSelected = customization.boostType === boost.id;
                  const isUnlocked = Boolean(playerProfile?.unlockedBoosts ? playerProfile.unlockedBoosts.includes(boost.id) : boost.id === 'orange-flame');
                  return (
                    <button
                      key={boost.id}
                      onClick={() => {
                        if (isUnlocked) {
                          onUpdate({ ...customization, boostType: boost.id });
                          sound.startBoost();
                          setTimeout(() => sound.stopBoost(), 350);
                        } else if (onSelectTab) {
                          onSelectTab('shop');
                        }
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                        !isUnlocked
                          ? 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-amber-500/50 cursor-pointer group'
                          : isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {!isUnlocked ? (
                            <Lock className="h-4 w-4 text-rose-400 shrink-0" />
                          ) : (
                            <Flame className={`h-5 w-5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                          )}
                          <div className="font-display text-sm font-bold text-white truncate">{boost.name}</div>
                        </div>

                        {/* Color swatch dots */}
                        <div className="flex items-center gap-1 shrink-0">
                          {boost.colors.slice(0, 3).map((col, idx) => (
                            <span
                              key={idx}
                              className="h-2.5 w-2.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-400 font-rajdhani">
                        {!isUnlocked ? '🔒 Disponible dans la Boutique de butins' : boost.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: GOAL EXPLOSION SELECTION */}
          {activeTab === 'explosion' && (
            <div className="mt-5 flex flex-col gap-3">
              <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
                Célébration d'Explosion de But
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'shockwave', name: 'Onde de Choc Standard', desc: 'Explosion d\'énergie bleue classique', emoji: '💥' },
                  { id: 'solar', name: 'Explosion Solaire', desc: 'Déflagration dorée et brillante', emoji: '☀️' },
                  { id: 'electro', name: 'Explosion Électro Choc', desc: 'Éclairs violets et décharge plasma', emoji: '⚡' },
                  { id: 'supernova', name: 'Explosion Supernova Cosmique', desc: 'Trou noir et galaxie fuchsia d\'exception', emoji: '🔮' },
                ].map((exp) => {
                  const isSelected = customization.explosionType === exp.id;
                  const isUnlocked = Boolean(playerProfile?.unlockedExplosions ? playerProfile.unlockedExplosions.includes(exp.id) : exp.id === 'shockwave');
                  return (
                    <button
                      key={exp.id}
                      onClick={() => {
                        if (isUnlocked) {
                          onUpdate({ ...customization, explosionType: exp.id as any });
                          sound.playBallHit(0.4);
                        } else if (onSelectTab) {
                          onSelectTab('shop');
                        }
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                        !isUnlocked
                          ? 'border-slate-800/40 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-amber-500/50 cursor-pointer group'
                          : isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {!isUnlocked ? (
                            <Lock className="h-4 w-4 text-rose-400 shrink-0" />
                          ) : (
                            <span className="text-xl">{exp.emoji}</span>
                          )}
                          <div className="font-display text-sm font-bold text-white truncate">{exp.name}</div>
                        </div>
                        {isUnlocked && isSelected && (
                          <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-400 font-rajdhani">
                        {!isUnlocked ? '🔒 Disponible dans la Boutique de butins' : exp.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ================= 5. BOTTOM LAUNCH BAR (DIRECT PLAY) ================= */}
        <footer className="sticky bottom-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/90 bg-slate-950/95 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-rajdhani">
            <span className="font-display font-black text-cyan-400 uppercase">{selectedCar.name}</span>
            <span>• Jantes {customization.wheelType || 'Cristiano'}</span>
            <span>• Boost {customization.boostType || 'Hyperdrive'}</span>
            <span className="text-emerald-400 font-semibold">• Sauvegardé</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => onStartMatch('training', 'pro')}
              className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 px-4 py-2.5 font-display text-xs font-black text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
            >
              <Dumbbell className="h-4 w-4" />
              <span>FREEPLAY</span>
            </button>

            <button
              onClick={() => onStartMatch('vs-bot', 'pro')}
              className="flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-2.5 font-display text-sm font-black italic tracking-wider text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>JOUER LE MATCH (1v1 IA)</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

// --- PREVIEW DRAWING HELPERS ---
export function drawCarVectorPreview(ctx: CanvasRenderingContext2D, customization: CarCustomization) {
  const halfW = 45;
  const halfH = 20;
  const baseColor = customization.bodyColor || '#2563eb';
  const accentColor = customization.accentColor || '#38bdf8';
  const model = customization.carModel || 'octane';

  ctx.save();
  ctx.shadowColor = baseColor;
  ctx.shadowBlur = 10;

  switch (model) {
    case 'fennec': {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.9, halfH * 0.7);
      ctx.lineTo(halfW * 0.88, halfH * 0.7);
      ctx.lineTo(halfW * 0.98, halfH * 0.4);
      ctx.lineTo(halfW * 0.98, halfH * 0.05);
      ctx.lineTo(halfW * 0.4, -halfH * 0.15);
      ctx.lineTo(halfW * 0.08, -halfH * 0.9);
      ctx.lineTo(-halfW * 0.65, -halfH * 0.9);
      ctx.lineTo(-halfW * 0.95, -halfH * 0.1);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front Rally Grille
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(halfW * 0.92, halfH * 0.12, 5, 14);

      // Headlight
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 9;
      ctx.fillRect(halfW * 0.88, halfH * 0.02, 7, 5);

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -halfH * 0.1);
      ctx.lineTo(halfW * 0.1, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.2, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      // Rear Spoiler
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.98, 16, 5);
      break;
    }

    case 'dominus': {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.92, halfH * 0.7);
      ctx.lineTo(halfW * 0.92, halfH * 0.7);
      ctx.lineTo(halfW, halfH * 0.35);
      ctx.lineTo(halfW * 0.98, halfH * 0.05);
      ctx.lineTo(halfW * 0.15, -halfH * 0.05);
      ctx.lineTo(-halfW * 0.1, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.52, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.85, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.98, halfH * 0.1);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Twin Racing Stripes
      ctx.fillStyle = accentColor;
      ctx.fillRect(halfW * 0.1, -halfH * 0.08, halfW * 0.85, 3.5);
      ctx.fillRect(-halfW * 0.48, -halfH * 0.72, halfW * 0.35, 3);

      // Low windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.12, -halfH * 0.03);
      ctx.lineTo(-halfW * 0.06, -halfH * 0.6);
      ctx.lineTo(-halfW * 0.46, -halfH * 0.6);
      ctx.lineTo(-halfW * 0.35, -halfH * 0.03);
      ctx.closePath();
      ctx.fill();

      // High-Downforce GT Wing
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.95, 20, 4.5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfW * 0.9, -halfH * 0.95, 3, halfH * 0.9);
      break;
    }

    case 'merc': {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.92, halfH * 0.7);
      ctx.lineTo(halfW * 0.9, halfH * 0.7);
      ctx.lineTo(halfW * 0.98, halfH * 0.5);
      ctx.lineTo(halfW * 0.98, -halfH * 0.1);
      ctx.lineTo(halfW * 0.45, -halfH * 0.25);
      ctx.lineTo(halfW * 0.25, -halfH * 0.95);
      ctx.lineTo(-halfW * 0.85, -halfH * 0.95);
      ctx.lineTo(-halfW * 0.96, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.96, halfH * 0.4);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front Chrome Grille
      ctx.fillStyle = '#334155';
      ctx.fillRect(halfW * 0.93, -halfH * 0.05, 5, 20);

      // High Headlights
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.fillRect(halfW * 0.9, -halfH * 0.2, 7, 7);

      // Tall Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.4, -halfH * 0.22);
      ctx.lineTo(halfW * 0.23, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.1, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.05, -halfH * 0.22);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'porsche': {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.9, halfH * 0.7);
      ctx.lineTo(halfW * 0.85, halfH * 0.7);
      ctx.lineTo(halfW * 0.98, halfH * 0.45);
      ctx.lineTo(halfW * 0.98, halfH * 0.2);
      ctx.lineTo(halfW * 0.75, 0);
      ctx.lineTo(halfW * 0.4, -halfH * 0.15);
      ctx.lineTo(halfW * 0.05, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.35, -halfH * 0.82);
      ctx.lineTo(-halfW * 0.75, -halfH * 0.25);
      ctx.lineTo(-halfW * 0.98, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.95, halfH * 0.4);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rounded Porsche Teardrop Cockpit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -halfH * 0.1);
      ctx.lineTo(halfW * 0.06, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.32, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.55, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      // Iconic Circular Porsche Headlight
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(halfW * 0.8, halfH * 0.06, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Whale-tail spoiler
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.45, 18, 5);
      break;
    }

    case 'corvette': {
      // Aggressive, wedge-shaped C8.R supercar body
      ctx.beginPath();
      // Lower ground-effects rocker
      ctx.moveTo(-halfW * 0.94, halfH * 0.7);
      ctx.lineTo(halfW * 0.9, halfH * 0.7);
      // Low razor carbon front splitter / canard
      ctx.lineTo(halfW * 1.04, halfH * 0.42);
      ctx.lineTo(halfW * 1.02, halfH * 0.15);
      // Sharp pointed supercar nose
      ctx.lineTo(halfW * 0.78, -halfH * 0.05);
      // Aerodynamic low hood slope
      ctx.lineTo(halfW * 0.38, -halfH * 0.2);
      // Raked cab-forward jet canopy
      ctx.lineTo(halfW * 0.08, -halfH * 0.78);
      // Low roofline
      ctx.lineTo(-halfW * 0.32, -halfH * 0.78);
      // Long fastback engine bay cover
      ctx.lineTo(-halfW * 0.75, -halfH * 0.2);
      // Muscular rear haunch and spoiler base
      ctx.lineTo(-halfW * 0.98, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.96, halfH * 0.35);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sharp C8 Boomerang Side Air Intake (Feeding the mid-engine)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.15, halfH * 0.05);
      ctx.lineTo(-halfW * 0.4, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.45, halfH * 0.45);
      ctx.lineTo(-halfW * 0.32, halfH * 0.45);
      ctx.lineTo(-halfW * 0.25, halfH * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dark Stealth Jet Cockpit Windshield
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.34, -halfH * 0.15);
      ctx.lineTo(halfW * 0.09, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.28, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.15);
      ctx.closePath();
      ctx.fill();

      // Specular windshield shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.22, -halfH * 0.25);
      ctx.lineTo(halfW * 0.07, -halfH * 0.65);
      ctx.stroke();

      // Slanted C8 LED Laser Headlight
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.88, halfH * 0.1);
      ctx.lineTo(halfW * 0.74, -halfH * 0.02);
      ctx.lineTo(halfW * 0.84, -halfH * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Elevated GT Racing Wing / Carbon Pedestals
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.88, -halfH * 1.05, 3.5, halfH * 0.9);
      ctx.fillRect(-halfW * 0.72, -halfH * 1.05, 3.5, halfH * 0.9);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 1.15, 22, 5);
      ctx.fillRect(-halfW * 1.0, -halfH * 1.25, 4, 10);

      // Aggressive Quad Exhausts
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-halfW * 0.99, halfH * 0.25, 5, 4);
      ctx.fillRect(-halfW * 0.99, halfH * 0.38, 5, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW * 0.99, halfH * 0.26, 2.5, 2);
      ctx.fillRect(-halfW * 0.99, halfH * 0.39, 2.5, 2);
      break;
    }

    case 'octane':
    default: {
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.85, halfH * 0.7);
      ctx.lineTo(halfW * 0.8, halfH * 0.7);
      ctx.lineTo(halfW, halfH * 0.2);
      ctx.lineTo(halfW * 0.35, -halfH * 0.25);
      ctx.lineTo(-halfW * 0.1, -halfH * 0.95);
      ctx.lineTo(-halfW * 0.55, -halfH * 0.9);
      ctx.lineTo(-halfW * 0.9, -halfH * 0.2);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.3, -halfH * 0.2);
      ctx.lineTo(-halfW * 0.05, -halfH * 0.82);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.2);
      ctx.closePath();
      ctx.fill();

      // Spoiler
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.95, -halfH * 1.15, 14, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfW * 0.88, -halfH * 1.15, 3, halfH * 0.8);
      break;
    }
  }

  // Decals / Stickers drawing layer (tailor-made per car model!)
  const decal = customization.selectedDecal || 'none';
  if (decal !== 'none') {
    drawCarDecal(ctx, model, decal, halfW, halfH, accentColor);
  }

  ctx.restore();
}

export function drawWheelsPreview(
  ctx: CanvasRenderingContext2D,
  model: CarModel = 'octane',
  wheelType: WheelType = 'cristiano',
  wheelColor: string = '#38bdf8',
  rotation: number
) {
  const halfW = 45;
  const halfH = 20;

  let wheelRadius = 14;
  let rearWheelX = -halfW * 0.55;
  let frontWheelX = halfW * 0.55;
  let wheelY = halfH * 0.72;

  if (model === 'dominus') {
    rearWheelX = -halfW * 0.62;
    frontWheelX = halfW * 0.62;
    wheelRadius = 13.5;
  } else if (model === 'merc') {
    rearWheelX = -halfW * 0.56;
    frontWheelX = halfW * 0.56;
    wheelRadius = 15;
    wheelY = halfH * 0.75;
  } else if (model === 'porsche') {
    rearWheelX = -halfW * 0.58;
    frontWheelX = halfW * 0.56;
    wheelRadius = 13.5;
  } else if (model === 'corvette') {
    rearWheelX = -halfW * 0.62;
    frontWheelX = halfW * 0.60;
    wheelRadius = 13.5;
    wheelY = halfH * 0.72;
  }

  drawSingleWheelOnCanvas(ctx, rearWheelX, wheelY, wheelRadius, rotation, wheelType, wheelColor);
  drawSingleWheelOnCanvas(ctx, frontWheelX, wheelY, wheelRadius, rotation, wheelType, wheelColor);
}

function drawSingleWheelOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  wheelType: WheelType,
  wheelColor: string
) {
  ctx.save();
  ctx.translate(x, y);

  // Tire rubber
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Rims
  ctx.save();
  ctx.rotate(rotation);
  const innerRadius = radius * 0.75;

  switch (wheelType) {
    case 'apex': {
      ctx.shadowColor = wheelColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = wheelColor;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.3) * (innerRadius * 0.6),
          Math.sin(a + 0.3) * (innerRadius * 0.6),
          Math.cos(a) * innerRadius,
          Math.sin(a) * innerRadius
        );
        ctx.stroke();
      }
      break;
    }

    case 'zomba': {
      ctx.shadowColor = wheelColor;
      ctx.shadowBlur = 10;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.strokeStyle = i % 2 === 0 ? wheelColor : '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * (0.35 + i * 0.18), a, a + Math.PI * 0.8);
        ctx.stroke();
      }
      break;
    }

    case 'astro': {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.2) * innerRadius, Math.sin(a - 0.2) * innerRadius);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a + 0.2) * innerRadius, Math.sin(a + 0.2) * innerRadius);
        ctx.stroke();
      }
      ctx.strokeStyle = wheelColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'dieci': {
      ctx.strokeStyle = wheelColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
        ctx.stroke();
      }
      break;
    }

    case 'infinium': {
      ctx.shadowColor = wheelColor;
      ctx.shadowBlur = 10;
      for (let r = 2; r <= innerRadius; r += 3) {
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'cristiano':
    default: {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
        ctx.stroke();
      }
      ctx.strokeStyle = wheelColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();

  // Center Hubcap
  ctx.fillStyle = wheelColor;
  ctx.shadowColor = wheelColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
