import React, { useState, useEffect, useRef } from 'react';
import {
  BotDifficulty,
  GameMode,
  CarCustomization,
  MainMenuTab,
  PlayerProfile,
  OpponentProfile,
} from '../types/game';
import { screenAdapter, ScreenMetrics } from '../utils/screenAdapter';
import { drawCarVectorPreview, drawWheelsPreview } from './GarageScreen';
import { ProfileScreen, renderAvatarIcon } from './ProfileScreen';
import { CompetitionScreen } from './CompetitionScreen';
import { ShopScreen } from './ShopScreen';
import { getRankTier, getPlayerLevel } from '../utils/profileStorage';
import {
  Home,
  Play,
  Users,
  Dumbbell,
  Sparkles,
  Volume2,
  VolumeX,
  MessageCircle,
  Maximize,
  Minimize,
  Zap,
  Flame,
  Settings,
  Trophy,
  Award,
  Layers,
  ArrowRight,
  Shield,
  Target,
  Clock,
  Car,
  User,
  Swords,
  ShoppingBag,
  Coins,
  Gift,
} from 'lucide-react';

export type PlayCategory = 'all' | 'competitive' | 'multiplayer' | 'training';

interface GameMenuProps {
  activeTab: MainMenuTab;
  onSelectTab: (tab: MainMenuTab) => void;
  onStartMatch: (mode: GameMode, difficulty: BotDifficulty) => void;
  onStartCompetitiveMatch?: (mode: GameMode, opponent: OpponentProfile) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  difficulty: BotDifficulty;
  onChangeDifficulty: (diff: BotDifficulty) => void;
  carCustomization?: CarCustomization;
  playerProfile: PlayerProfile;
  onUpdatePlayerProfile: (profile: PlayerProfile) => void;
}

/**
 * Composant de showroom miniature pour afficher notre voiture sur la page d'accueil
 */
const HomeShowroomCanvas: React.FC<{ customization?: CarCustomization }> = ({ customization }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const wheelRotationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastT = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastT) / 1000);
      lastT = time;

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
      const centerY = height * 0.58;

      const cust: CarCustomization = customization || {
        carModel: 'octane',
        bodyColor: '#2563eb',
        accentColor: '#38bdf8',
        wheelType: 'cristiano',
        wheelColor: '#38bdf8',
        boostType: 'cyan-hyper',
        explosionType: 'shockwave',
      };

      // Hover / bobbing motion
      const bob = Math.sin(time * 0.003) * 4;
      wheelRotationRef.current += dt * 3;

      // Platform glow
      const podiumWidth = Math.min(width * 0.75, 260);
      const podiumHeight = 28;
      const podiumY = centerY + 30;

      const glowGrad = ctx.createRadialGradient(centerX, podiumY, 5, centerX, podiumY, podiumWidth * 0.7);
      glowGrad.addColorStop(0, `${cust.wheelColor || '#38bdf8'}66`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, podiumY, podiumWidth * 0.7, podiumHeight * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Platform Ring
      ctx.strokeStyle = cust.wheelColor || '#38bdf8';
      ctx.shadowColor = cust.wheelColor || '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(centerX, podiumY, podiumWidth * 0.5, podiumHeight * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Car
      ctx.save();
      const carScale = Math.min(2.2, Math.max(1.65, width / 180));
      ctx.translate(centerX, centerY - 12 + bob);
      ctx.scale(carScale, carScale);

      // Underglow
      ctx.save();
      ctx.fillStyle = `${cust.wheelColor || '#38bdf8'}55`;
      ctx.shadowColor = cust.wheelColor || '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 14, 42, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawCarVectorPreview(ctx, cust);
      drawWheelsPreview(
        ctx,
        cust.carModel,
        cust.wheelType,
        cust.wheelColor,
        wheelRotationRef.current
      );

      ctx.restore();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [customization]);

  return (
    <div className="relative w-full h-[170px] sm:h-[210px] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export const GameMenu: React.FC<GameMenuProps> = ({
  activeTab,
  onSelectTab,
  onStartMatch,
  onStartCompetitiveMatch,
  isMuted,
  onToggleMute,
  difficulty,
  onChangeDifficulty,
  carCustomization,
  playerProfile,
  onUpdatePlayerProfile,
}) => {
  const [screenMetrics, setScreenMetrics] = useState<ScreenMetrics>(() => screenAdapter.getMetrics());
  const [playCategory, setPlayCategory] = useState<PlayCategory>('all');
  
  const rank = getRankTier(playerProfile.mmr);
  const levelInfo = getPlayerLevel(playerProfile.xp);
  const winRate =
    playerProfile.matchesPlayed > 0
      ? Math.round((playerProfile.matchesWon / playerProfile.matchesPlayed) * 100)
      : 0;
  const goalsPerMatch =
    playerProfile.matchesPlayed > 0
      ? (playerProfile.goalsScored / playerProfile.matchesPlayed).toFixed(1)
      : '0.0';

  useEffect(() => {
    return screenAdapter.subscribe(setScreenMetrics);
  }, []);

  const isFullscreen = screenMetrics.isFullscreen;

  const toggleFullscreen = async () => {
    await screenAdapter.toggleFullscreen();
  };

  const handleShareWhatsApp = () => {
    const appUrl = window.location.href;
    const text = `Viens défier mon bolide sur Rocket League Sideswipe 2D directement sur navigateur et mobile : ${appUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      id="main-menu"
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between p-2 sm:p-4 select-none overflow-y-auto overflow-x-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR WITH ALL MAIN TABS                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 sm:px-5 sm:py-2.5 backdrop-blur-xl shadow-2xl mb-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <span className="font-display font-black italic text-cyan-400 text-xs sm:text-sm">RL</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs sm:text-sm font-black italic tracking-wider text-white">
                SIDESWIPE
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="font-display text-[9px] font-bold tracking-widest text-emerald-400 uppercase hidden sm:block">
              SAISON 1 VÉLOCITÉ
            </span>
          </div>
        </div>

        {/* Center: Main Tabs [ACCUEIL, JOUER, GARAGE, MÉCANIQUES, PARAMÈTRES] */}
        <nav
          id="main-navigation-tabs"
          className="flex items-center gap-1 rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner"
        >
          {/* Tab 0: ACCUEIL */}
          <button
            id="nav-tab-home"
            onClick={() => onSelectTab('home')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className={`h-3.5 w-3.5 ${activeTab === 'home' ? 'fill-current' : ''}`} />
            <span>ACCUEIL</span>
          </button>

          {/* Tab 1: JOUER */}
          <button
            id="nav-tab-play"
            onClick={() => onSelectTab('play')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'play'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Play className={`h-3.5 w-3.5 ${activeTab === 'play' ? 'fill-current' : ''}`} />
            <span>JOUER</span>
          </button>

          {/* Tab 1.2: COMPÉTITIONS */}
          <button
            id="nav-tab-competition"
            onClick={() => onSelectTab('competition')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'competition'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className={`h-3.5 w-3.5 ${activeTab === 'competition' ? 'fill-current text-slate-950' : 'text-amber-400'}`} />
            <span>COMPÉTITIONS</span>
          </button>

          {/* Tab 1.5: PROFIL */}
          <button
            id="nav-tab-profile"
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className={`h-3.5 w-3.5 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
            <span>PROFIL</span>
          </button>

          {/* Tab 2: GARAGE */}
          <button
            id="nav-tab-garage"
            onClick={() => onSelectTab('garage')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'garage'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>GARAGE</span>
          </button>

          {/* Tab 2.5: BOUTIQUE */}
          <button
            id="nav-tab-shop"
            onClick={() => onSelectTab('shop')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse'
                : 'text-rose-400 hover:text-rose-300 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>BOUTIQUE</span>
          </button>

          {/* Tab 3: MÉCANIQUES */}
          <button
            id="nav-tab-mechanics"
            onClick={() => onSelectTab('mechanics')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'mechanics'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">MÉCANIQUES</span>
            <span className="sm:hidden">GUIDE</span>
          </button>

          {/* Tab 4: PARAMÈTRES */}
          <button
            id="nav-tab-settings"
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden md:inline">OPTIONS</span>
          </button>
        </nav>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Coins Display */}
          <div
            id="header-coins-badge"
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-slate-950/80 px-2.5 sm:px-3 py-1.5 border border-amber-500/30 text-amber-400 font-display text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            title="Vos pièces accumulées"
          >
            <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 animate-bounce" />
            <span className="tabular-nums">{playerProfile.coins ?? 0}</span>
            <span className="hidden xs:inline text-[9px] text-amber-500/80 font-bold uppercase tracking-wider">PIÈCES</span>
          </div>

          <button
            id="btn-whatsapp-share"
            onClick={handleShareWhatsApp}
            className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-emerald-600/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            title="Partager sur WhatsApp"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
          </button>

          <button
            id="btn-fullscreen-toggle"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4 text-cyan-400" /> : <Maximize className="h-4 w-4" />}
          </button>

          <button
            id="btn-audio-toggle"
            onClick={onToggleMute}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>

          <button
            id="btn-quick-play-header"
            onClick={() => onStartMatch('vs-bot', difficulty)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 font-display text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95 hover:brightness-110 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>JOUER</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN HUB CONTENT                                                       */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 0: PAGE D'ACCUEIL (NOTRE PROFIL + NOTRE VOITURE + PARTIE RAPIDE 1v1)  */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'home' && (
        <main className="flex flex-1 flex-col items-center w-full max-w-6xl pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
            {/* Colonne Gauche (7 cols) : NOTRE PROFIL & BOUTON PARTIE RAPIDE (1v1) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Carte 1 : NOTRE PROFIL DU PILOTE */}
              <div
                onClick={() => onSelectTab('profile')}
                className="group cursor-pointer rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/20 p-4 sm:p-5 shadow-xl backdrop-blur-md text-left transition-all hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
              >
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <span className="font-display text-xs font-black tracking-wider text-slate-300 uppercase">
                      PROFIL DU JOUEUR
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-black text-cyan-300 font-display">
                      SAISON 1 VÉLOCITÉ
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-0.5">
                      Gérer <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 sm:gap-4">
                  {/* Avatar Pilote avec insigne de rang */}
                  <div
                    className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl p-0.5 shadow-lg transition-transform group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${playerProfile.avatarColor}, #1e293b)`,
                      boxShadow: `0 0 16px ${playerProfile.avatarColor}55`,
                    }}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                      <div style={{ color: playerProfile.avatarColor }}>
                        {renderAvatarIcon(playerProfile.avatarIcon, 'h-7 w-7 sm:h-8 sm:w-8')}
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 rounded-md bg-blue-600 px-1.5 py-0.2 text-[9px] font-black text-white shadow-sm border border-slate-900 font-display">
                      NIV. {levelInfo.level}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base sm:text-xl font-black italic tracking-wide text-white truncate">
                        {playerProfile.username}
                      </h2>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-400 uppercase">
                        EN LIGNE
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs font-rajdhani">
                      <span className={`font-bold ${rank.color}`}>
                        {rank.name.toUpperCase()} {rank.division}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300">{playerProfile.mmr} MMR</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 italic">« {playerProfile.title} »</span>
                    </div>

                    {/* Barre de progression XP */}
                    <div className="mt-2 w-full">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1 font-rajdhani">
                        <span>
                          XP : {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel}
                        </span>
                        <span className="text-cyan-400">Niveau {levelInfo.level + 1}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${levelInfo.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro-Stats Pilote Réelles (Commencent à 0 et grandissent) */}
                <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-center">
                  <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Victoires</div>
                    <div className="font-display text-sm sm:text-base font-black text-emerald-400">
                      {winRate}% ({playerProfile.matchesWon})
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Matchs Joués</div>
                    <div className="font-display text-sm sm:text-base font-black text-white">
                      {playerProfile.matchesPlayed}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Buts / Match</div>
                    <div className="font-display text-sm sm:text-base font-black text-cyan-400">
                      {goalsPerMatch}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte 2 : LE BOUTON MAJEUR « PARTIE RAPIDE (1v1) » */}
              <div className="rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-slate-900/90 via-emerald-950/30 to-slate-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="font-display text-xs font-black tracking-wider text-emerald-300 uppercase">
                      LANCEMENT RAPIDE INSTANTANÉ
                    </span>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 font-mono">
                    2:00 MIN CHRONO
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-display text-lg sm:text-2xl font-black italic tracking-wide text-white">
                    DUEL 1v1 COMPÉTITIF
                  </h3>
                  <p className="font-rajdhani text-xs sm:text-sm text-slate-300 mt-0.5">
                    Affrontez directement l'intelligence artificielle Sideswipe. Choisissez la difficulté de votre adversaire et sautez dans l'arène :
                  </p>
                </div>

                {/* Sélecteur de Difficulté intégré avant lancement */}
                <div className="mb-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-display text-[11px] font-bold text-slate-400 uppercase">
                      Niveau du Bot IA :
                    </span>
                    <span className="font-display font-black text-cyan-400 text-xs uppercase">
                      {difficulty === 'novice' && '🟢 Novice (Défense au sol)'}
                      {difficulty === 'pro' && '🔵 Pro (Sauvetages & Aériens)'}
                      {difficulty === 'all-star' && '🔴 All-Star (Flip Resets & Power Shots)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
                    {(['novice', 'pro', 'all-star'] as BotDifficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => onChangeDifficulty(d)}
                        className={`rounded-lg py-1.5 text-center font-display text-xs font-bold uppercase transition-all ${
                          difficulty === d
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {d === 'all-star' ? '★ All-Star' : d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GROS BOUTON PARTIE RAPIDE (C'EST LE 1v1) */}
                <button
                  id="cta-partie-rapide-home"
                  onClick={() => onStartMatch('vs-bot', difficulty)}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 py-3.5 sm:py-4 px-6 font-display text-base sm:text-lg font-black italic tracking-wider text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all hover:brightness-110 hover:shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                >
                  <Play className="h-6 w-6 fill-current transition-transform group-hover:scale-110" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-base sm:text-xl font-black">PARTIE RAPIDE (1v1)</span>
                    <span className="text-[10px] sm:text-xs font-sans font-bold tracking-normal text-slate-950/80">
                      Lancer le duel 1v1 contre Bot ({difficulty.toUpperCase()})
                    </span>
                  </div>
                </button>

                {/* BOUTON MATCH 2v2 vs BOTS */}
                <button
                  id="cta-match-2v2-home"
                  onClick={() => onStartMatch('vs-bot-2v2', difficulty)}
                  className="group mt-2.5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3.5 sm:py-4 px-6 font-display text-base sm:text-lg font-black italic tracking-wider text-white shadow-[0_0_25px_rgba(59,130,246,0.4)] active:scale-95 transition-all hover:brightness-110 hover:shadow-[0_0_35px_rgba(59,130,246,0.6)]"
                >
                  <Users className="h-6 w-6 text-cyan-300 transition-transform group-hover:scale-110" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-base sm:text-xl font-black">MATCH 2v2 vs BOTS</span>
                    <span className="text-[10px] sm:text-xs font-sans font-bold tracking-normal text-slate-200">
                      Vous + 1 Bot allié vs 2 Bots adverses ({difficulty.toUpperCase()})
                    </span>
                  </div>
                </button>

                {/* BANNIÈRE COMPÉTITION & CLASSEMENT */}
                <button
                  id="cta-competition-home"
                  onClick={() => onSelectTab('competition')}
                  className="group mt-2.5 flex w-full items-center justify-between rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 p-3 sm:p-3.5 shadow-lg transition-all hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-98 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-display shadow-md">
                      <Trophy className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase">
                          ARÈNE COMPÉTITIONS EN LIGNE
                        </span>
                        <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black text-amber-300 font-display">
                          SAISON 1
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-rajdhani">
                        Affrontez des joueurs ou bots, gagnez du MMR et hissez-vous au sommet du classement mondial !
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Raccourcis complémentaires vers les autres modes */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  onClick={() => onStartMatch('local-2p', difficulty)}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 hover:border-orange-500/50 hover:bg-slate-850 transition-all text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-xs font-black text-white uppercase">2 JOUEURS LOCAL</div>
                    <div className="text-[10px] text-slate-400 font-rajdhani">Duel sur 1 écran partagé</div>
                  </div>
                </button>

                <button
                  onClick={() => onStartMatch('training', difficulty)}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 hover:border-cyan-500/50 hover:bg-slate-850 transition-all text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-xs font-black text-white uppercase">FREEPLAY LIBRE</div>
                    <div className="text-[10px] text-slate-400 font-rajdhani">Boost 100% sans chrono</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Colonne Droite (5 cols) : NOTRE VOITURE ET SHOWROOM */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="flex flex-col h-full justify-between rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-950/20 p-4 sm:p-5 shadow-xl backdrop-blur-md text-left">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-cyan-400" />
                      <span className="font-display text-xs font-black tracking-wider text-slate-300 uppercase">
                        NOTRE VOITURE ÉQUIPÉE
                      </span>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 font-display">
                      SHOWROOM 3D
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">MODÈLE ACTIF</div>
                      <h3 className="font-display text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        {carCustomization?.carModel || 'OCTANE'}
                      </h3>
                    </div>
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 font-rajdhani">
                      Hitbox {carCustomization?.carModel === 'fennec' ? 'Octane' : carCustomization?.carModel === 'dominus' || carCustomization?.carModel === 'corvette' ? 'Dominus' : carCustomization?.carModel === 'porsche' ? 'Breakout' : carCustomization?.carModel === 'merc' ? 'Merc' : 'Standard'}
                    </span>
                  </div>

                  {/* Dynamic Showroom Canvas */}
                  <HomeShowroomCanvas customization={carCustomization} />

                  {/* Caractéristiques de notre voiture */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-slate-950/70 p-2.5 border border-slate-800 mb-3 text-center">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Peinture</div>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/40"
                          style={{ backgroundColor: carCustomization?.bodyColor || '#2563eb' }}
                        />
                        <span className="text-[10px] font-bold text-white uppercase truncate">
                          {carCustomization?.bodyColor ? 'Personnalisée' : 'Bleu'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Jantes</div>
                      <div className="text-[10px] font-bold text-cyan-300 uppercase truncate mt-0.5">
                        {carCustomization?.wheelType || 'Cristiano'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Boost</div>
                      <div className="text-[10px] font-bold text-amber-300 uppercase truncate mt-0.5">
                        {carCustomization?.boostType || 'Hyper Cyan'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Explosion</div>
                      <div className="text-[10px] font-bold text-purple-300 uppercase truncate mt-0.5">
                        {carCustomization?.explosionType || 'Shockwave'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton d'accès direct au Garage */}
                <button
                  id="btn-goto-garage-from-home"
                  onClick={() => onSelectTab('garage')}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 py-3 font-display text-sm font-black italic tracking-wider text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 hover:brightness-110 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>MODIFIER LA VOITURE DANS LE GARAGE</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1: JOUER - ORGANISÉ PAR CATÉGORIES NETTES (SANS LE HAUT SUPPRIMÉ)    */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'play' && (
        <main className="flex flex-1 flex-col items-center w-full max-w-6xl pb-4">
          {/* ========================================================================= */}
          {/* BARRE DE SÉLECTION PAR CATÉGORIES (FILTER PILLS)                          */}
          {/* ========================================================================= */}
          <div className="flex w-full items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => setPlayCategory('all')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  playCategory === 'all'
                    ? 'bg-slate-100 text-slate-950 shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>TOUTES LES CATÉGORIES</span>
              </button>

              <button
                onClick={() => setPlayCategory('competitive')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  playCategory === 'competitive'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-blue-400" />
                <span>1. COMPÉTITION & SOLO</span>
              </button>

              <button
                onClick={() => setPlayCategory('multiplayer')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  playCategory === 'multiplayer'
                    ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>2. MULTIJOUEUR LOCAL</span>
              </button>

              <button
                onClick={() => setPlayCategory('training')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  playCategory === 'training'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. ENTRAÎNEMENT & ATELIERS</span>
              </button>
            </div>

            <span className="hidden lg:block text-xs font-semibold text-slate-400 font-rajdhani">
              Structure propre • 3 Catégories
            </span>
          </div>

          {/* ========================================================================= */}
          {/* CATÉGORIE 1 : COMPÉTITION & MODES SOLO (IA BOT)                           */}
          {/* ========================================================================= */}
          {(playCategory === 'all' || playCategory === 'competitive') && (
            <section className="w-full mb-6 text-left">
              {/* En-tête de catégorie */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/50 text-blue-400">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                      CATÉGORIE 1 • COMPÉTITION & DUEL SOLO
                    </h2>
                    <p className="text-[11px] text-slate-400 font-rajdhani">
                      Matches avec classement MMR et intelligence artificielle dynamique.
                    </p>
                  </div>
                </div>

                <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300 font-display">
                  1 MODE ACTIF
                </span>
              </div>

              {/* Carte 1v1 Compétitif */}
              <div className="rounded-3xl border border-blue-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/30 p-4 sm:p-5 shadow-xl backdrop-blur-md">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-blue-600/30 border border-blue-500 px-2.5 py-0.5 font-display text-[10px] font-black text-blue-300">
                        1v1 CLASSEMENT SOLO
                      </span>
                      <span className="text-xs text-slate-400">• Durée réglementaire 2:00</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide">
                      DUEL 1v1 CONTRE BOT IA
                    </h3>
                    <p className="font-rajdhani text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      Affrontez l'IA Sideswipe programmée pour reproduire les réflexes réels : sauvetages sur la ligne, anticipations de rebonds au plafond et frappes aériennes.
                    </p>

                    {/* Sélecteur de Difficulté Intégré */}
                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-display text-[11px] font-bold text-slate-400 uppercase">
                          Niveau de l'IA sélectionné :
                        </span>
                        <span className="font-display font-black text-cyan-400 text-xs uppercase">
                          {difficulty === 'novice' && '🟢 Novice (Défense au sol)'}
                          {difficulty === 'pro' && '🔵 Pro (Aerials & Sauvetages)'}
                          {difficulty === 'all-star' && '🔴 All-Star (Flip Resets & Power Shots)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                        {(['novice', 'pro', 'all-star'] as BotDifficulty[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => onChangeDifficulty(d)}
                            className={`rounded-lg py-1.5 text-center font-display text-[11px] font-bold uppercase transition-all ${
                              difficulty === d
                                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.7)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            {d === 'all-star' ? '★ All-Star' : d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panneau de Lancement */}
                  <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-rajdhani">
                      <span className="text-slate-400">Arène :</span>
                      <span className="text-white font-bold">Stade Urbain Néon</span>
                    </div>
                    <div className="flex items-center justify-between mb-3 text-xs font-rajdhani">
                      <span className="text-slate-400">Règles :</span>
                      <span className="text-emerald-400 font-bold">Overtime But en Or si Égalité</span>
                    </div>

                    <button
                      id="btn-launch-mode-competitive"
                      onClick={() => onStartMatch('vs-bot', difficulty)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 py-3 font-display text-sm font-black italic tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 hover:brightness-110 transition-all"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>LANCER LE MATCH 1v1 ({difficulty.toUpperCase()})</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* CATÉGORIE 2 : MULTIJOUEUR & SOIRÉE (LOCAL 2 JOUEURS)                      */}
          {/* ========================================================================= */}
          {(playCategory === 'all' || playCategory === 'multiplayer') && (
            <section className="w-full mb-6 text-left">
              {/* En-tête de catégorie */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600/20 border border-orange-500/50 text-orange-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                      CATÉGORIE 2 • MULTIJOUEUR & DUEL LOCAL
                    </h2>
                    <p className="text-[11px] text-slate-400 font-rajdhani">
                      Affrontez un ami sur le même appareil, le même clavier ou deux manettes.
                    </p>
                  </div>
                </div>

                <span className="rounded-md bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-300 font-display">
                  1 ÉCRAN PARTAGÉ
                </span>
              </div>

              {/* Carte 2 Joueurs Local */}
              <div className="rounded-3xl border border-orange-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-orange-950/30 p-4 sm:p-5 shadow-xl backdrop-blur-md">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-orange-600/30 border border-orange-500 px-2.5 py-0.5 font-display text-[10px] font-black text-orange-300">
                        DUEL 2 JOUEURS LOCAL
                      </span>
                      <span className="text-xs text-slate-400">• Aucun compte requis</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide">
                      DUEL 1v1 SUR LE MÊME ÉCRAN
                    </h3>
                    <p className="font-rajdhani text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      Chaque joueur contrôle son bolide sur la même vue de jeu fluide à 60 FPS. Idéal pour les défis entre amis, à la pause ou en soirée.
                    </p>

                    {/* Répartition des touches */}
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/80 p-2.5 border border-slate-800 text-xs">
                      <div>
                        <div className="font-display font-black text-blue-400 text-[11px]">ÉQUIPE BLEUE (J1)</div>
                        <div className="text-slate-300 font-mono text-[11px] mt-0.5">ZQSD / Flèches</div>
                        <div className="text-slate-400 font-mono text-[10px]">Saut: Espace • Boost: Shift</div>
                      </div>
                      <div>
                        <div className="font-display font-black text-orange-400 text-[11px]">ÉQUIPE ORANGE (J2)</div>
                        <div className="text-slate-300 font-mono text-[11px] mt-0.5">Touches I J K L</div>
                        <div className="text-slate-400 font-mono text-[10px]">Saut: Touche O • Boost: P</div>
                      </div>
                    </div>
                  </div>

                  {/* Panneau de Lancement */}
                  <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs font-rajdhani">
                      <span className="text-slate-400">Mode d'entrée :</span>
                      <span className="text-white font-bold">Clavier partagé ou 2 Manettes</span>
                    </div>
                    <div className="flex items-center justify-between mb-3 text-xs font-rajdhani">
                      <span className="text-slate-400">Caméra :</span>
                      <span className="text-orange-400 font-bold">Plein Écran Panoramique</span>
                    </div>

                    <button
                      id="btn-launch-mode-local-2p"
                      onClick={() => onStartMatch('local-2p', difficulty)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 py-3 font-display text-sm font-black italic tracking-wider text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 hover:brightness-110 transition-all"
                    >
                      <Users className="h-4 w-4" />
                      <span>LANCER LE DUEL 2 JOUEURS LOCAL</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* CATÉGORIE 3 : ENTRAÎNEMENT & ATELIERS TECHNIQUES                          */}
          {/* ========================================================================= */}
          {(playCategory === 'all' || playCategory === 'training') && (
            <section className="w-full mb-4 text-left">
              {/* En-tête de catégorie */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-400">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                      CATÉGORIE 3 • ENTRAÎNEMENT & ATELIERS TECHNIQUES
                    </h2>
                    <p className="text-[11px] text-slate-400 font-rajdhani">
                      Freeplay sans limite de temps avec boost infini à 100% et ateliers des mécaniques Sideswipe.
                    </p>
                  </div>
                </div>

                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 font-display">
                  BOOST 100% ILLIMITÉ
                </span>
              </div>

              {/* Carte Principale Entraînement Freeplay */}
              <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/30 p-4 sm:p-5 shadow-xl backdrop-blur-md mb-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-emerald-600/30 border border-emerald-500 px-2.5 py-0.5 font-display text-[10px] font-black text-emerald-300">
                        FREEPLAY LIBRE
                      </span>
                      <span className="text-xs text-slate-400">• Boost perpétuel</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-black italic text-white tracking-wide">
                      ARÈNE D'ENTRAÎNEMENT LIBRE
                    </h3>
                    <p className="font-rajdhani text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                      Entrez seul sur le terrain sans pression du chronomètre ni adversaire. Répétez vos tirs rouges, vos purple pops, vos air dribbles et vos flip resets sur la balle.
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800">
                    <button
                      id="btn-launch-mode-training"
                      onClick={() => onStartMatch('training', difficulty)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3 font-display text-sm font-black italic tracking-wider text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 hover:brightness-110 transition-all"
                    >
                      <Dumbbell className="h-4 w-4" />
                      <span>ENTRER EN ENTRAÎNEMENT LIBRE</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sous-Atelier des 4 Coups Spéciaux Signature */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs font-bold uppercase text-slate-300 tracking-wider">
                    Atelier des 4 Frappes & Gestes Techniques Sideswipe
                  </span>
                  <button
                    onClick={() => onSelectTab('mechanics')}
                    className="text-cyan-400 hover:underline text-[11px] font-display font-bold flex items-center gap-1"
                  >
                    <span>Voir le guide complet</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Tir Rouge */}
                  <div
                    onClick={() => onStartMatch('training', 'pro')}
                    className="cursor-pointer group rounded-xl border border-red-500/30 bg-red-950/20 p-3 hover:border-red-400 hover:bg-red-950/40 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-red-400" />
                        <span className="font-display text-xs font-black text-red-300">TIR ROUGE</span>
                      </div>
                      <span className="text-[9px] font-bold text-red-400 font-mono">POWER</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-rajdhani">
                      Nez de la voiture + Flip avant. Vitesse maximale explosive.
                    </p>
                  </div>

                  {/* Purple Pop */}
                  <div
                    onClick={() => onStartMatch('training', 'pro')}
                    className="cursor-pointer group rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 hover:border-purple-400 hover:bg-purple-950/40 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span className="font-display text-xs font-black text-purple-300">PURPLE POP</span>
                      </div>
                      <span className="text-[9px] font-bold text-purple-400 font-mono">LOB</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-rajdhani">
                      4 roues contre le ballon + Saut sans joystick.
                    </p>
                  </div>

                  {/* Gold Shot */}
                  <div
                    onClick={() => onStartMatch('training', 'pro')}
                    className="cursor-pointer group rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 hover:border-amber-400 hover:bg-amber-950/40 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-400" />
                        <span className="font-display text-xs font-black text-amber-300">GOLD SHOT</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 font-mono">INVERSÉ</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-rajdhani">
                      Dos tourné au ballon + Flip arrière. Effet de surprise.
                    </p>
                  </div>

                  {/* Flip Reset */}
                  <div
                    onClick={() => onStartMatch('training', 'pro')}
                    className="cursor-pointer group rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        <span className="font-display text-xs font-black text-cyan-300">FLIP RESET</span>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-400 font-mono">AÉRIEN</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-rajdhani">
                      4 roues sur la balle en vol = recharge instantanée du saut.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 3: MÉCANIQUES - ORGANISÉ PAR CATÉGORIES TECHNIQUES                    */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'mechanics' && (
        <main className="flex flex-1 flex-col items-center w-full max-w-5xl py-2">
          <div className="flex items-center justify-between w-full mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h2 className="font-display text-lg sm:text-2xl font-black italic tracking-wide text-white">
                GUIDE DES MÉCANIQUES OFFICIELLES SIDESWIPE
              </h2>
            </div>

            <button
              onClick={() => onStartMatch('training', 'pro')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-display text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              <span>TESTER EN FREEPLAY</span>
            </button>
          </div>

          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
            {/* 1. Red Power Shot */}
            <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-950/30 to-slate-900/90 p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <Flame className="h-5 w-5 text-red-400" />
                <h3 className="font-display text-base sm:text-lg font-black italic text-red-300">
                  Tir Puissant Rouge (Red Power Shot)
                </h3>
              </div>
              <p className="font-rajdhani text-xs sm:text-sm text-slate-300 leading-relaxed">
                Frappez le ballon directement avec le pare-choc avant (le nez de votre voiture) tout en déclenchant un flip vers l'avant. La balle est propulsée à vitesse maximale accompagnée d'une traînée écarlate fulgurante.
              </p>
              <div className="mt-3 rounded-xl bg-slate-950/80 p-2.5 border border-red-900/50 text-[11px] text-red-200 font-mono">
                Pare-choc avant + Flip vers l'avant = Puissance explosive
              </div>
            </div>

            {/* 2. Purple Pop Shot */}
            <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-slate-900/90 p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <Zap className="h-5 w-5 text-purple-400" />
                <h3 className="font-display text-base sm:text-lg font-black italic text-purple-300">
                  Purple Pop Shot (Lob Déflagrant)
                </h3>
              </div>
              <p className="font-rajdhani text-xs sm:text-sm text-slate-300 leading-relaxed">
                Positionnez le dessous de la voiture (les 4 roues) contre le ballon et relâchez le joystick au moment d'appuyer sur le saut. Cela projette la balle en cloche dans une déflagration violette imprévisible pour le gardien.
              </p>
              <div className="mt-3 rounded-xl bg-slate-950/80 p-2.5 border border-purple-900/50 text-[11px] text-purple-200 font-mono">
                Dessous du véhicule + Relâchement joystick = Onde violette
              </div>
            </div>

            {/* 3. Gold Shot */}
            <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-900/90 p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="font-display text-base sm:text-lg font-black italic text-amber-300">
                  Tir Doré (Gold Shot Inversé)
                </h3>
              </div>
              <p className="font-rajdhani text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tournez le dos au ballon et effectuez un flip arrière. Le pot d'échappement percute violemment la balle et la renvoie dans la direction opposée avec une vitesse surpuissante et des étincelles dorées.
              </p>
              <div className="mt-3 rounded-xl bg-slate-950/80 p-2.5 border border-amber-900/50 text-[11px] text-amber-200 font-mono">
                Arrière de la voiture + Flip arrière = Tir doré supersonique
              </div>
            </div>

            {/* 4. Ball Flip Reset */}
            <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-slate-900/90 p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="font-display text-base sm:text-lg font-black italic text-cyan-300">
                  Ball Flip Reset & Plafond
                </h3>
              </div>
              <p className="font-rajdhani text-xs sm:text-sm text-slate-300 leading-relaxed">
                Touchez simultanément la balle ou le plafond avec les 4 roues de la voiture. Votre jauge de flip se réinitialise instantanément en plein vol sans avoir besoin de retomber sur le sol !
              </p>
              <div className="mt-3 rounded-xl bg-slate-950/80 p-2.5 border border-cyan-900/50 text-[11px] text-cyan-200 font-mono">
                Contact 4 roues en l'air = Flip infini rechargé
              </div>
            </div>
          </div>

          {/* Section Catégorisée des Touches */}
          <div className="mt-4 w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 text-left">
            <h4 className="font-display text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              RÉCAPITULATIF DES TOUCHES PAR CONFIGURATION
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800">
                <div className="font-display text-xs font-bold text-blue-400 mb-1">CLAVIER JOUEUR 1</div>
                <ul className="text-xs text-slate-300 font-rajdhani space-y-1">
                  <li><span className="text-cyan-300 font-mono">ZQSD / Flèches</span> : Diriger & pivoter</li>
                  <li><span className="text-cyan-300 font-mono">Espace</span> : Sauter & Flip</li>
                  <li><span className="text-cyan-300 font-mono">Shift / J</span> : Boost Fusée</li>
                  <li><span className="text-cyan-300 font-mono">K</span> : Demi-tour rapide</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800">
                <div className="font-display text-xs font-bold text-orange-400 mb-1">CLAVIER JOUEUR 2 (LOCAL)</div>
                <ul className="text-xs text-slate-300 font-rajdhani space-y-1">
                  <li><span className="text-orange-300 font-mono">I J K L</span> : Diriger & pivoter</li>
                  <li><span className="text-orange-300 font-mono">O</span> : Sauter & Flip</li>
                  <li><span className="text-orange-300 font-mono">P</span> : Boost Fusée</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800">
                <div className="font-display text-xs font-bold text-emerald-400 mb-1">MOBILE & TACTILE</div>
                <ul className="text-xs text-slate-300 font-rajdhani space-y-1">
                  <li><span className="text-emerald-300 font-mono">Joystick gauche</span> : Conduite & vol</li>
                  <li><span className="text-emerald-300 font-mono">Bouton Saut</span> : Sauter & double flip</li>
                  <li><span className="text-emerald-300 font-mono">Bouton Boost</span> : Accélération supersonique</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB COMPÉTITIONS : MODES CLASSÉS, MATCHMAKING EN LIGNE, BOTS & CLASSEMENT */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'competition' && (
        <CompetitionScreen
          playerProfile={playerProfile}
          onSelectTab={onSelectTab}
          onStartCompetitiveMatch={(mode, opponent) => {
            if (onStartCompetitiveMatch) {
              onStartCompetitiveMatch(mode, opponent);
            } else {
              onStartMatch(mode, opponent.botDifficulty);
            }
          }}
        />
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB PROFIL: STATS DU JOUEUR & PERSONNALISATION PSEUDO / TITRE / ICÔNE    */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'profile' && (
        <ProfileScreen
          profile={playerProfile}
          onUpdateProfile={onUpdatePlayerProfile}
          onSelectTab={onSelectTab}
          onStartMatch={(mode, diff) => onStartMatch(mode, diff)}
        />
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB BOUTIQUE: BUTINS ALÉATOIRES & ACHAT D'OBJETS CUSTOMS                  */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'shop' && (
        <ShopScreen
          playerProfile={playerProfile}
          onUpdatePlayerProfile={onUpdatePlayerProfile}
          onSelectTab={onSelectTab}
        />
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 4: PARAMÈTRES - ORGANISÉ PAR CATÉGORIES D'OPTIONS                     */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <main className="flex flex-1 flex-col items-center w-full max-w-4xl py-2 text-left">
          <div className="flex items-center gap-2.5 w-full mb-4 px-1">
            <Settings className="h-5 w-5 text-purple-400" />
            <h2 className="font-display text-xl sm:text-2xl font-black italic tracking-wide text-white">
              OPTIONS & PARAMÈTRES DU JEU
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4">
            {/* Catégorie Audio */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-cyan-400" />
                  <span className="font-display text-sm font-bold text-white uppercase">Audio & Bruitages</span>
                </div>
                <button
                  onClick={onToggleMute}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-display text-xs font-bold transition-all ${
                    !isMuted
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span>{isMuted ? 'SON COUPÉ' : 'SON ACTIVÉ'}</span>
                </button>
              </div>
              <p className="font-rajdhani text-xs text-slate-400">
                Moteur audio synthétisé Web Audio API en temps réel : rugissement de moteur, boost fusée, impacts de balle et explosions d'arène.
              </p>
            </div>

            {/* Catégorie Affichage */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-purple-400" />
                  <span className="font-display text-sm font-bold text-white uppercase">Affichage & Écran</span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 rounded-xl bg-purple-500/20 px-3 py-1.5 font-display text-xs font-bold text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  <span>{isFullscreen ? 'FENÊTRÉ' : 'PLEIN ÉCRAN'}</span>
                </button>
              </div>
              <p className="font-rajdhani text-xs text-slate-400">
                Le jeu s'adapte automatiquement à l'orientation paysage des téléphones et tablettes pour une visibilité panoramique des deux cages.
              </p>
            </div>

            {/* Catégorie Partage */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                  <span className="font-display text-sm font-bold text-white uppercase">Inviter des Amis</span>
                </div>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 font-display text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>WHATSAPP</span>
                </button>
              </div>
              <p className="font-rajdhani text-xs text-slate-400">
                Partagez le lien direct du jeu avec vos amis pour les défier en 1v1 ou sur le même écran en duel local.
              </p>
            </div>

            {/* Catégorie Version & Système */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-400" />
                  <span className="font-display text-sm font-bold text-white uppercase">Informations Version</span>
                </div>
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-300">
                  v1.4.0 SIDESWIPE
                </span>
              </div>
              <div className="text-xs text-slate-400 font-rajdhani space-y-1">
                <div>Moteur Physique : 2D Aérien à 60 FPS</div>
                <div>Arène : Neon Stadium avec cages surélevées</div>
                <div>Statut : Prêt pour la compétition</div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBTLE BOTTOM STATUS BAR                                               */}
      {/* ========================================================================= */}
      <footer className="mt-2 flex w-full max-w-6xl items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 font-rajdhani px-2">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>RL Sideswipe 2D • Serveurs Actifs 60 FPS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Physique Aérienne Officielle</span>
          <span>Saison 1 Vélocité</span>
        </div>
      </footer>
    </div>
  );
};
