import React, { useState, useEffect, useRef } from 'react';
import {
  PlayerProfile,
  OpponentProfile,
  GameMode,
  RankedMatchHistoryItem,
  MainMenuTab,
} from '../types/game';
import {
  getRankTier,
  getEstimatedRankPosition,
  RankTierInfo,
} from '../utils/profileStorage';
import {
  generateCompetitiveOpponent,
  MatchmakingQueueManager,
} from '../services/matchmakingService';
import { renderAvatarIcon } from './ProfileScreen';
import { sound } from '../audio/soundEngine';
import {
  Trophy,
  Swords,
  Shield,
  Zap,
  Flame,
  Clock,
  ArrowRight,
  RotateCcw,
  Wifi,
  Bot,
  User,
  Users,
  CheckCircle2,
  X,
  Target,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';

interface CompetitionScreenProps {
  playerProfile: PlayerProfile;
  onSelectTab: (tab: MainMenuTab) => void;
  onStartCompetitiveMatch: (mode: GameMode, opponent: OpponentProfile) => void;
}

type CompetitionSubTab = 'modes' | 'leaderboard' | 'history';

// Mock Top 10 Champions for the Leaderboard
const LEADERBOARD_LEGENDS = [
  { rank: 1, name: 'Zen_Sideswipe', title: 'Champion Supersonique', mmr: 2540, tier: 'Grand Champion ★', winRate: '83%', avatar: 'crown', avatarColor: '#f59e0b' },
  { rank: 2, name: 'Mawkzy_Air', title: 'Artificier Flip Reset', mmr: 2495, tier: 'Grand Champion ★', winRate: '80%', avatar: 'zap', avatarColor: '#ef4444' },
  { rank: 3, name: 'Alpha54_Pro', title: 'Légende du Boost', mmr: 2440, tier: 'Grand Champion ★', winRate: '78%', avatar: 'flame', avatarColor: '#8b5cf6' },
  { rank: 4, name: 'Vatira_God', title: 'Sniper Gold Shot', mmr: 2390, tier: 'Grand Champion ★', winRate: '77%', avatar: 'target', avatarColor: '#06b6d4' },
  { rank: 5, name: 'MonkeyMoon', title: 'Gardien Infranchissable', mmr: 2350, tier: 'Grand Champion ★', winRate: '75%', avatar: 'shield', avatarColor: '#10b981' },
  { rank: 6, name: 'Itachi_Drift', title: 'As de l’Aérien', mmr: 2315, tier: 'Grand Champion ★', winRate: '74%', avatar: 'rocket', avatarColor: '#3b82f6' },
  { rank: 7, name: 'Seikoo_Touch', title: 'Tireur d’Élite', mmr: 2280, tier: 'Grand Champion ★', winRate: '73%', avatar: 'star', avatarColor: '#ec4899' },
  { rank: 8, name: 'Joyo_Freestyle', title: 'Artificier Flip Reset', mmr: 2245, tier: 'Grand Champion ★', winRate: '72%', avatar: 'sparkles', avatarColor: '#f97316' },
  { rank: 9, name: 'Atow_Striker', title: 'Maître du Kickoff', mmr: 2210, tier: 'Grand Champion ★', winRate: '71%', avatar: 'swords', avatarColor: '#e11d48' },
  { rank: 10, name: 'Oski_Pivots', title: 'Champion Supersonique', mmr: 2185, tier: 'Grand Champion ★', winRate: '70%', avatar: 'trophy', avatarColor: '#eab308' },
];

export const CompetitionScreen: React.FC<CompetitionScreenProps> = ({
  playerProfile,
  onSelectTab,
  onStartCompetitiveMatch,
}) => {
  const [subTab, setSubTab] = useState<CompetitionSubTab>('modes');

  // Matchmaking search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>('ranked-1v1');
  const [matchFound, setMatchFound] = useState<OpponentProfile | null>(null);
  const [launchCountdown, setLaunchCountdown] = useState(3);

  const matchmakingQueueRef = useRef<MatchmakingQueueManager | null>(null);
  const searchIntervalRef = useRef<number | null>(null);
  const launchIntervalRef = useRef<number | null>(null);

  const rankInfo: RankTierInfo = getRankTier(playerProfile.mmr);
  const estimatedRankPosition = getEstimatedRankPosition(playerProfile.mmr);
  const winRate =
    playerProfile.matchesPlayed > 0
      ? Math.round((playerProfile.matchesWon / playerProfile.matchesPlayed) * 100)
      : 0;

  // Initialize matchmaking manager
  useEffect(() => {
    matchmakingQueueRef.current = new MatchmakingQueueManager();
    return () => {
      if (matchmakingQueueRef.current) {
        matchmakingQueueRef.current.destroy();
      }
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (launchIntervalRef.current) clearInterval(launchIntervalRef.current);
    };
  }, []);

  // Handle Matchmaking timer and automatic fallback
  useEffect(() => {
    if (isSearching && !matchFound) {
      setSearchTimer(0);
      let elapsed = 0;
      searchIntervalRef.current = window.setInterval(() => {
        elapsed += 1;
        setSearchTimer(elapsed);
        // Fallback to high-tier bot if no peer matches within 3s
        if (elapsed >= 3) {
          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = null;
          }
          triggerOpponentFound(generateCompetitiveOpponent(playerProfile.mmr));
        }
      }, 1000);
    } else {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    }

    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    };
  }, [isSearching, matchFound, playerProfile.mmr]);

  // Handle launch countdown when matched
  useEffect(() => {
    if (matchFound) {
      setLaunchCountdown(3);
      sound.playCountdown(false);

      let count = 3;
      launchIntervalRef.current = window.setInterval(() => {
        count -= 1;
        if (count <= 0) {
          if (launchIntervalRef.current) {
            clearInterval(launchIntervalRef.current);
            launchIntervalRef.current = null;
          }
          setLaunchCountdown(0);
          sound.playCountdown(true);
          onStartCompetitiveMatch(selectedMode, matchFound);
        } else {
          setLaunchCountdown(count);
          sound.playCountdown(false);
        }
      }, 1000);
    }

    return () => {
      if (launchIntervalRef.current) {
        clearInterval(launchIntervalRef.current);
        launchIntervalRef.current = null;
      }
    };
  }, [matchFound, onStartCompetitiveMatch, selectedMode]);

  const triggerOpponentFound = (opponent: OpponentProfile) => {
    setMatchFound(opponent);
    sound.playGoalExplosion();
  };

  const handleStartSearch = (mode: GameMode) => {
    setSelectedMode(mode);
    setIsSearching(true);
    setMatchFound(null);
    setSearchTimer(0);
    sound.playButton();

    if (matchmakingQueueRef.current) {
      matchmakingQueueRef.current.searchMatch(playerProfile, mode, (peerOpponent) => {
        triggerOpponentFound(peerOpponent);
      });
    }
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setMatchFound(null);
    if (matchmakingQueueRef.current) {
      matchmakingQueueRef.current.cancelSearch();
    }
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (launchIntervalRef.current) clearInterval(launchIntervalRef.current);
    sound.playButton();
  };

  const handleForceInstantBot = () => {
    const opponent = generateCompetitiveOpponent(playerProfile.mmr);
    triggerOpponentFound(opponent);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col p-3 sm:p-6 pb-20 select-none text-slate-100">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER : CARTE DE RANG COMPÉTITIF & PROGRESSION DU CLASSEMENT   */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Rang & Division Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border-2 shadow-[0_0_25px_rgba(0,0,0,0.5)] ${rankInfo.badgeBg} ${rankInfo.badgeBorder}`}
            >
              <Trophy className={`h-9 w-9 sm:h-11 sm:w-11 ${rankInfo.color}`} />
              <div className="absolute -bottom-2 rounded-md bg-slate-950 px-2 py-0.5 border border-slate-700 text-[10px] font-black uppercase font-display tracking-widest text-slate-300">
                DIV {rankInfo.division}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-amber-300 uppercase font-display">
                  SAISON 1 CLASSÉE
                </span>
                {playerProfile.winStreak && playerProfile.winStreak >= 2 ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 font-display animate-pulse">
                    <Flame className="h-3 w-3 fill-current" />
                    SÉRIE X{playerProfile.winStreak} (+5 MMR)
                  </span>
                ) : null}
              </div>

              <div className="flex items-baseline gap-3">
                <h1 className={`font-display text-2xl sm:text-3xl font-black italic tracking-wide uppercase ${rankInfo.color}`}>
                  {rankInfo.name} {rankInfo.division}
                </h1>
                <span className="font-display text-lg sm:text-xl font-bold text-white tracking-wider">
                  {playerProfile.mmr} <span className="text-xs text-slate-400 font-semibold">MMR</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-0.5 font-rajdhani">
                Pilote : <span className="font-bold text-slate-200">{playerProfile.username}</span> • Titre : « {playerProfile.title} »
              </p>
            </div>
          </div>

          {/* Progression vers prochain palier & Position Mondiale */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Jauge MMR */}
            <div className="min-w-[180px] sm:min-w-[220px]">
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1.5 text-slate-300">
                <span>Vers {rankInfo.nextTierName}</span>
                <span className="text-cyan-400">{rankInfo.progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-cyan-400 to-blue-500 transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>{rankInfo.minMmr} MMR</span>
                <span>{rankInfo.maxMmr} MMR</span>
              </div>
            </div>

            {/* Rang Mondial estimé */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 text-center sm:text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 font-display">Classement Mondial</div>
              <div className="font-display text-lg sm:text-2xl font-black text-amber-400 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Award className="h-5 w-5" />
                <span>#{estimatedRankPosition.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold font-rajdhani flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3" />
                Grimpe à chaque victoire !
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. BARRE D'ONGLETS INTERNES (MODES / CLASSEMENT / HISTORIQUE)          */}
      {/* --------------------------------------------------------------------- */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="comp-subtab-modes"
            onClick={() => setSubTab('modes')}
            className={`flex items-center gap-2 rounded-xl px-3 sm:px-5 py-2 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              subTab === 'modes'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>MODES CLASSÉS</span>
          </button>

          <button
            id="comp-subtab-leaderboard"
            onClick={() => setSubTab('leaderboard')}
            className={`flex items-center gap-2 rounded-xl px-3 sm:px-5 py-2 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              subTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>CLASSEMENT TOP 100</span>
          </button>

          <button
            id="comp-subtab-history"
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-2 rounded-xl px-3 sm:px-5 py-2 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
              subTab === 'history'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>HISTORIQUE ({playerProfile.rankedHistory?.length || 0})</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          <span>SERVEUR : EUROPE OUEST • 22MS</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. VUE 1 : SÉLECTION DES MODES COMPÉTITIFS & LANCEMENT MATCHMAKING     */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'modes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode 1: 1v1 Duel Classé */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-0.5 text-[10px] font-black tracking-widest text-cyan-300 uppercase font-display">
                  OFFICIEL COMPÉTITION
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  3 420 en ligne
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg">
                  <Swords className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black italic tracking-wide text-white">
                    DUEL CLASSÉ 1v1
                  </h2>
                  <span className="text-xs text-cyan-400 font-rajdhani font-bold">Arène Standard Sideswipe</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-rajdhani leading-relaxed mt-2">
                Le mode compétitif roi de Rocket League. Affrontez un adversaire en ligne dans votre tranche de MMR. Si aucun joueur n'est disponible, affrontez un bot IA compétitif adapté à votre rang.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-center font-rajdhani">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Format</div>
                  <div className="font-bold text-xs text-slate-200">Solo 1v1</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Chrono</div>
                  <div className="font-bold text-xs text-slate-200">2:00 + OT</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Gain Victoire</div>
                  <div className="font-bold text-xs text-emerald-400">+25 à +35 MMR</div>
                </div>
              </div>
            </div>

            <button
              id="btn-play-ranked-1v1"
              onClick={() => handleStartSearch('ranked-1v1')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-display text-sm font-black italic tracking-wide text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Swords className="h-4 w-4" />
              <span>RECHERCHER UN MATCH CLASSÉ</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mode 2: Hoops / Paniers de Basket */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-black tracking-widest text-amber-300 uppercase font-display">
                  DUNK & AÉRIEN
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-amber-400" />
                  1 890 en ligne
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 shadow-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black italic tracking-wide text-white">
                    HOOPS DUNK CLASSÉ
                  </h2>
                  <span className="text-xs text-amber-400 font-rajdhani font-bold">Paniers surélevés & Smashs</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-rajdhani leading-relaxed mt-2">
                Paniers de basket surélevés nécessitant un jeu aérien précis, des flip resets et des tirs lobés puissants. Marquez des paniers et surprenez votre adversaire.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-center font-rajdhani">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Format</div>
                  <div className="font-bold text-xs text-slate-200">Dunk 1v1</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Arène</div>
                  <div className="font-bold text-xs text-slate-200">Hoops Arena</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Gain Victoire</div>
                  <div className="font-bold text-xs text-emerald-400">+25 à +35 MMR</div>
                </div>
              </div>
            </div>

            <button
              id="btn-play-ranked-hoops"
              onClick={() => handleStartSearch('ranked-hoops')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-display text-sm font-black italic tracking-wide text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Target className="h-4 w-4" />
              <span>RECHERCHER UN MATCH HOOPS</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mode 3: Mutateur Overdrive Turbo */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:border-purple-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-0.5 text-[10px] font-black tracking-widest text-purple-300 uppercase font-display">
                  VITESSE ÉLECTRIQUE
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-purple-400" />
                  2 150 en ligne
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 text-white shadow-lg">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black italic tracking-wide text-white">
                    TURBO OVERDRIVE
                  </h2>
                  <span className="text-xs text-purple-400 font-rajdhani font-bold">Vitesse Balle 140% & Boost Rapide</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-rajdhani leading-relaxed mt-2">
                Balle fulgurante à haute vélocité avec régénération de boost accélérée. Des tirs supersoniques à plus de 150 km/h pour les joueurs aux réflexes aiguisés.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-center font-rajdhani">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Mutateur</div>
                  <div className="font-bold text-xs text-purple-300">Overdrive 1.4x</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Boost</div>
                  <div className="font-bold text-xs text-slate-200">Régén. Rapide</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Gain Victoire</div>
                  <div className="font-bold text-xs text-emerald-400">+25 à +35 MMR</div>
                </div>
              </div>
            </div>

            <button
              id="btn-play-ranked-overdrive"
              onClick={() => handleStartSearch('ranked-overdrive')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-display text-sm font-black italic tracking-wide text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              <span>RECHERCHER UN MATCH OVERDRIVE</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. VUE 2 : CLASSEMENT MONDIAL TOP 100 & POSITION ACTUELLE             */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Podium Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top 2 */}
            <div className="order-2 md:order-1 rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center shadow-lg">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-300 text-slate-900 font-display font-black text-xl shadow-[0_0_20px_rgba(203,213,225,0.4)]">
                #2
              </div>
              <h3 className="font-display text-lg font-black text-white">{LEADERBOARD_LEGENDS[1].name}</h3>
              <p className="text-xs text-slate-400 font-rajdhani">{LEADERBOARD_LEGENDS[1].title}</p>
              <div className="mt-2 inline-block rounded-full bg-slate-800 px-3 py-1 font-display text-xs font-bold text-slate-200">
                {LEADERBOARD_LEGENDS[1].mmr} MMR • {LEADERBOARD_LEGENDS[1].winRate} Victoires
              </div>
            </div>

            {/* Top 1 */}
            <div className="order-1 md:order-2 rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-6 text-center shadow-[0_0_35px_rgba(245,158,11,0.3)] md:-translate-y-2">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-display font-black text-2xl shadow-[0_0_25px_rgba(245,158,11,0.7)]">
                👑 #1
              </div>
              <h3 className="font-display text-xl font-black text-amber-300">{LEADERBOARD_LEGENDS[0].name}</h3>
              <p className="text-xs text-amber-200/80 font-rajdhani">{LEADERBOARD_LEGENDS[0].title}</p>
              <div className="mt-3 inline-block rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-1 font-display text-sm font-black text-amber-300">
                {LEADERBOARD_LEGENDS[0].mmr} MMR • {LEADERBOARD_LEGENDS[0].winRate} Victoires
              </div>
            </div>

            {/* Top 3 */}
            <div className="order-3 md:order-3 rounded-3xl border border-amber-900/60 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center shadow-lg">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-amber-100 font-display font-black text-xl shadow-[0_0_20px_rgba(180,83,9,0.4)]">
                #3
              </div>
              <h3 className="font-display text-lg font-black text-white">{LEADERBOARD_LEGENDS[2].name}</h3>
              <p className="text-xs text-slate-400 font-rajdhani">{LEADERBOARD_LEGENDS[2].title}</p>
              <div className="mt-2 inline-block rounded-full bg-slate-800 px-3 py-1 font-display text-xs font-bold text-slate-200">
                {LEADERBOARD_LEGENDS[2].mmr} MMR • {LEADERBOARD_LEGENDS[2].winRate} Victoires
              </div>
            </div>
          </div>

          {/* Bannière "VOTRE POSITION EN DIRECT" */}
          <div className="rounded-2xl border-2 border-cyan-500/60 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-display font-black text-base shadow-md">
                #{estimatedRankPosition.toLocaleString()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base text-white">{playerProfile.username}</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black text-cyan-300 font-display">VOUS</span>
                </div>
                <p className="text-xs text-slate-400 font-rajdhani">
                  Rang : <span className={rankInfo.color}>{rankInfo.name} {rankInfo.division}</span> • {playerProfile.matchesWon} Victoires ({winRate}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-display">
              <span className="text-xl font-black text-cyan-400">{playerProfile.mmr} MMR</span>
              <button
                onClick={() => setSubTab('modes')}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-400 transition-colors shadow-md"
              >
                JOUER POUR MONTER
              </button>
            </div>
          </div>

          {/* Tableau Top 4 à 10 */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400 uppercase font-display">
              <span>Top Joueurs Mondiaux</span>
              <span>Saison 1 Vélocité</span>
            </div>
            <div className="divide-y divide-slate-800/60 font-rajdhani">
              {LEADERBOARD_LEGENDS.slice(3).map((item) => (
                <div key={item.rank} className="flex items-center justify-between p-3.5 px-5 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <span className="w-8 font-display font-black text-sm text-slate-400">#{item.rank}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
                      <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-sm text-amber-400">{item.mmr} MMR</div>
                    <div className="text-[11px] text-slate-400">{item.tier} • {item.winRate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. VUE 3 : HISTORIQUE DES MATCHS CLASSÉS                               */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'history' && (
        <div>
          {(!playerProfile.rankedHistory || playerProfile.rankedHistory.length === 0) ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center shadow-xl">
              <Trophy className="mx-auto h-16 w-16 text-slate-600 mb-3" />
              <h3 className="font-display text-lg font-black text-white">AUCUN MATCH CLASSÉ ENREGISTRÉ</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto font-rajdhani">
                Participez à votre premier match compétitif pour débloquer votre historique, gagner vos premiers points de MMR et démarrer votre ascension dans le classement !
              </p>
              <button
                onClick={() => setSubTab('modes')}
                className="mt-5 rounded-2xl bg-cyan-500 px-6 py-2.5 font-display text-xs font-black text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg"
              >
                LANCER MON PREMIER MATCH
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {playerProfile.rankedHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row items-center justify-between rounded-2xl border p-4 shadow-md transition-all ${
                    item.won
                      ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900'
                      : 'border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display font-black text-sm ${
                        item.won ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.won ? 'VICTOIRE' : 'DÉFAITE'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-white text-base">
                          {playerProfile.username} vs {item.opponentName}
                        </span>
                        {item.isBot && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                            BOT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-rajdhani">
                        Mode : {item.modeName} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3 sm:mt-0 font-display">
                    {/* Score */}
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Score</div>
                      <div className="text-base font-black text-white">
                        {item.playerScore} - {item.opponentScore}
                      </div>
                    </div>

                    {/* Delta MMR */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500">MMR</div>
                      <div
                        className={`text-base font-black ${
                          item.won ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.mmrChange > 0 ? `+${item.mmrChange}` : item.mmrChange} MMR
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. MODAL MATCHMAKING EN DIRECT : RECHERCHE OU VERSUS CARD             */}
      {/* --------------------------------------------------------------------- */}
      {isSearching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            {/* Si recherche en cours */}
            {!matchFound ? (
              <div className="flex flex-col items-center text-center">
                {/* Radar scanner */}
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-cyan-500/40" />
                  <div className="absolute inset-6 rounded-full border border-cyan-500/60" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 to-transparent animate-spin" />
                  <Wifi className="h-10 w-10 text-cyan-400" />
                </div>

                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-[11px] font-black text-cyan-300 font-display uppercase tracking-widest mb-2">
                  MATCHMAKING COMPÉTITIF EN DIRECT
                </span>

                <h2 className="font-display text-2xl font-black italic tracking-wide text-white">
                  RECHERCHE D'UN ADVERSAIRE EN LIGNE...
                </h2>

                <p className="text-xs text-slate-400 font-rajdhani mt-1 max-w-md">
                  Recherche d'un pilote en ligne dans votre région avec un classement proche (MMR : {playerProfile.mmr} ± 30).
                </p>

                <div className="mt-5 flex items-center gap-6 rounded-2xl bg-slate-950/80 px-6 py-3 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span>00:0{searchTimer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Wifi className="h-4 w-4" />
                    <span>Ping : 24 ms</span>
                  </div>
                  <div className="text-slate-400">Région : Europe</div>
                </div>

                <div className="mt-4 text-[11px] text-slate-500 font-rajdhani">
                  Si aucun joueur n'est connecté, un bot IA compétitif de niveau équivalent sera assigné automatiquement.
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    onClick={handleForceInstantBot}
                    className="w-full sm:flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 font-display text-xs font-bold text-slate-200 transition-colors border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Bot className="h-4 w-4 text-cyan-400" />
                    <span>AFFRONTER UN BOT IMMÉDIATEMENT</span>
                  </button>

                  <button
                    onClick={handleCancelSearch}
                    className="w-full sm:w-auto rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 px-6 py-3 font-display text-xs font-bold border border-rose-500/40 transition-colors"
                  >
                    ANNULER
                  </button>
                </div>
              </div>
            ) : (
              /* Écran VERSUS / MATCH TROUVÉ ! */
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-black text-emerald-400 font-display uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ADVERSAIRE TROUVÉ !
                  </span>
                </div>

                <h2 className="font-display text-3xl font-black italic tracking-wide text-white mb-6">
                  LE DUEL VA COMMENCER
                </h2>

                {/* Face-à-face VERSUS */}
                <div className="grid grid-cols-5 items-center gap-2 sm:gap-4 w-full mb-6">
                  {/* Carte Joueur (Bleu) */}
                  <div className="col-span-2 flex flex-col items-center rounded-2xl border border-blue-500/50 bg-blue-950/40 p-3 sm:p-4">
                    <div
                      className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl mb-2 shadow-lg"
                      style={{ background: playerProfile.avatarColor }}
                    >
                      <div className="text-slate-950">
                        {renderAvatarIcon(playerProfile.avatarIcon, 'h-7 w-7')}
                      </div>
                    </div>
                    <div className="font-display text-sm sm:text-base font-black text-white truncate max-w-full">
                      {playerProfile.username}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-rajdhani font-bold truncate">
                      « {playerProfile.title} »
                    </div>
                    <div className="mt-1 rounded bg-blue-600 px-2 py-0.5 font-display text-[10px] font-black text-white">
                      {playerProfile.mmr} MMR
                    </div>
                  </div>

                  {/* VS Central */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-red-500 font-display text-base sm:text-lg font-black italic text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse">
                      VS
                    </div>
                  </div>

                  {/* Carte Adversaire (Orange) */}
                  <div className="col-span-2 flex flex-col items-center rounded-2xl border border-orange-500/50 bg-orange-950/40 p-3 sm:p-4">
                    <div
                      className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl mb-2 shadow-lg"
                      style={{ background: matchFound.avatarColor }}
                    >
                      <div className="text-slate-950">
                        {renderAvatarIcon(matchFound.avatarIcon, 'h-7 w-7')}
                      </div>
                    </div>
                    <div className="font-display text-sm sm:text-base font-black text-white truncate max-w-full">
                      {matchFound.name}
                    </div>
                    <div className="text-[10px] text-orange-400 font-rajdhani font-bold truncate">
                      « {matchFound.title} »
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="rounded bg-orange-600 px-2 py-0.5 font-display text-[10px] font-black text-white">
                        {matchFound.mmr} MMR
                      </span>
                      <span className="rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-slate-400 font-mono">
                        {matchFound.isBot ? 'BOT IA' : `${matchFound.ping}ms`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compte à rebours avant lancement */}
                <div className="flex flex-col items-center">
                  <div className="font-display text-4xl font-black text-cyan-400 mb-1">
                    {launchCountdown}
                  </div>
                  <p className="text-xs text-slate-400 font-rajdhani">
                    Connexion au serveur de l'arène en cours...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
