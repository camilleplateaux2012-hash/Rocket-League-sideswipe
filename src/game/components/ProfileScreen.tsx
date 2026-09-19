import React, { useState } from 'react';
import { PlayerProfile, PlayerAvatarIcon, MainMenuTab, GameMode, BotDifficulty } from '../types/game';
import {
  AVAILABLE_TITLES,
  AVAILABLE_AVATARS,
  AVAILABLE_AVATAR_COLORS,
  AVAILABLE_BANNER_COLORS,
  getRankTier,
  getPlayerLevel,
  DEFAULT_PLAYER_PROFILE,
  savePlayerProfile,
} from '../utils/profileStorage';
import { sound } from '../audio/soundEngine';
import {
  Trophy,
  Shield,
  Zap,
  Flame,
  Star,
  Crown,
  Target,
  Sparkles,
  Rocket,
  Swords,
  Edit3,
  Check,
  RotateCcw,
  Award,
  Activity,
  User,
  Medal,
  TrendingUp,
  Dumbbell,
  Lock,
  KeyRound,
  Gift,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Coins,
} from 'lucide-react';

interface ProfileScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onSelectTab: (tab: MainMenuTab) => void;
  onStartMatch?: (mode: GameMode, difficulty: BotDifficulty) => void;
}

export const renderAvatarIcon = (icon: PlayerAvatarIcon, className: string = 'h-6 w-6') => {
  switch (icon) {
    case 'shield':
      return <Shield className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'swords':
      return <Swords className={className} />;
    case 'trophy':
    default:
      return <Trophy className={className} />;
  }
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onSelectTab,
}) => {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'customization' | 'code'>('stats');
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetFullAccount = () => {
    sound.playButton();
    const freshProfile: PlayerProfile = { ...DEFAULT_PLAYER_PROFILE };
    savePlayerProfile(freshProfile);
    onUpdateProfile(freshProfile);
    setShowResetConfirm(false);
    setCodeFeedback({
      success: true,
      text: '🔄 Compte réinitialisé à zéro avec succès ! Remis aux paramètres de départ (200 pièces d\'or, Octane de base).',
    });
  };

  const rank = getRankTier(profile.mmr);
  const levelInfo = getPlayerLevel(profile.xp);

  const winRate =
    profile.matchesPlayed > 0
      ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100)
      : 0;

  const goalsPerMatch =
    profile.matchesPlayed > 0
      ? (profile.goalsScored / profile.matchesPlayed).toFixed(1)
      : '0.0';

  const handleSaveUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = usernameInput.trim();
    if (trimmed.length > 0) {
      onUpdateProfile({ ...profile, username: trimmed.slice(0, 20) });
    } else {
      setUsernameInput(profile.username);
    }
    setIsEditingUsername(false);
  };

  const handleValidateSecretCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = secretCodeInput.trim();

    if (cleanCode === '071212') {
      sound.playGoalExplosion();
      const ALL_CARS = ['octane', 'fennec', 'dominus', 'merc', 'porsche', 'corvette'];
      const ALL_WHEELS = ['cristiano', 'apex', 'zomba', 'astro', 'dieci', 'infinium'];
      const ALL_BOOSTS = [
        'orange-flame',
        'cyan-hyper',
        'neon-plasma',
        'rainbow',
        'electric-bolt',
        'crimson-thermal',
        'golden-spark',
        'ion-green',
      ];
      const ALL_EXPLOSIONS = ['shockwave', 'solar', 'electro', 'supernova'];
      const ALL_DECALS = ['none', 'stripes', 'flames', 'tribal', 'lightning', 'stars'];
      const ALL_AVATARS: PlayerAvatarIcon[] = [
        'trophy',
        'shield',
        'zap',
        'flame',
        'star',
        'crown',
        'target',
        'sparkles',
        'rocket',
        'swords',
      ];

      onUpdateProfile({
        ...profile,
        coins: Math.max(profile.coins || 0, 99999),
        unlockedCars: ALL_CARS,
        unlockedWheels: ALL_WHEELS,
        unlockedBoosts: ALL_BOOSTS,
        unlockedExplosions: ALL_EXPLOSIONS,
        unlockedDecals: ALL_DECALS,
        unlockedTitles: AVAILABLE_TITLES,
        unlockedAvatarIcons: ALL_AVATARS,
      });

      setCodeFeedback({
        success: true,
        text: '🎉 CODE SECRET ACTIVÉ AVEC SUCCÈS ! Tout le garage est désormais 100% débloqué + 99 999 pièces ajoutées !',
      });
      setSecretCodeInput('');
    } else if (cleanCode.length > 0) {
      sound.playButton();
      setCodeFeedback({
        success: false,
        text: '❌ Code secret invalide ! Veuillez vérifier la saisie.',
      });
    }
  };

  const handleResetStats = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes vos statistiques à zéro ?')) {
      onUpdateProfile({
        ...DEFAULT_PLAYER_PROFILE,
        username: profile.username,
        title: profile.title,
        avatarIcon: profile.avatarIcon,
        avatarColor: profile.avatarColor,
        bannerColor: profile.bannerColor,
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center w-full max-w-5xl pb-6 select-none">
      {/* 1. CARTE BANNIÈRE PRINCIPALE DU PILOTE */}
      <div
        className="relative w-full rounded-3xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl overflow-hidden mb-5 text-left backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, ${profile.bannerColor}44 0%, rgba(15, 23, 42, 0.95) 45%, rgba(2, 6, 23, 0.98) 100%)`,
        }}
      >
        {/* Lueur d'ambiance */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: profile.avatarColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Avatar + Pseudo + Titre */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar interactif */}
            <div className="relative">
              <div
                className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl p-1 shadow-2xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${profile.avatarColor}, #1e293b)`,
                  boxShadow: `0 0 25px ${profile.avatarColor}66`,
                }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-slate-950">
                  <div style={{ color: profile.avatarColor }}>
                    {renderAvatarIcon(profile.avatarIcon, 'h-10 w-10 sm:h-12 sm:w-12')}
                  </div>
                </div>
              </div>

              {/* Badge Niveau */}
              <div className="absolute -bottom-2 -right-1 rounded-lg bg-blue-600 px-2 py-0.5 font-display text-[11px] font-black text-white shadow border border-slate-900">
                NIV. {levelInfo.level}
              </div>
            </div>

            {/* Pseudo & Titre */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isEditingUsername ? (
                  <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      maxLength={20}
                      autoFocus
                      className="rounded-xl border border-cyan-400 bg-slate-900 px-3 py-1 font-display text-base sm:text-xl font-black italic text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      title="Valider le pseudo"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-black italic tracking-wide text-white truncate">
                      {profile.username}
                    </h1>
                    <button
                      onClick={() => {
                        setUsernameInput(profile.username);
                        setIsEditingUsername(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-all"
                      title="Modifier le pseudo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Titre équipé */}
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-md bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 font-rajdhani text-xs font-bold text-amber-300 tracking-wide">
                  « {profile.title} »
                </span>
                <span className="text-slate-500 text-xs hidden sm:inline">•</span>
                <span className="text-emerald-400 text-xs font-bold hidden sm:inline">
                  Pilote Sideswipe
                </span>
              </div>

              {/* Barre de Progression XP */}
              <div className="mt-3 w-full max-w-sm">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 font-rajdhani">
                  <span>
                    XP : {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel}
                  </span>
                  <span className="text-cyan-400">Niveau {levelInfo.level + 1}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Badge Rang Compétitif (Calculé selon le MMR réel) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-3 rounded-2xl p-3 sm:p-4 border ${rank.badgeBorder} ${rank.badgeBg} backdrop-blur-md`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
                <Medal className={`h-7 w-7 ${rank.color}`} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  RANG COMPÉTITIF
                </div>
                <div className={`font-display text-lg sm:text-xl font-black italic tracking-wide ${rank.color}`}>
                  {rank.name.toUpperCase()} {rank.division}
                </div>
                <div className="text-xs font-mono text-slate-300">{profile.mmr} MMR</div>
              </div>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 p-3 text-rose-300 font-display text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Réinitialiser le compte à zéro"
            >
              <RotateCcw className="h-4 w-4 text-rose-400" />
              <span className="uppercase">RÉINITIALISER COMPTE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SÉLECTEUR SOUS-ONGLETS (STATISTIQUES / PERSONNALISATION / CODE SECRET) */}
      <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
            activeSubTab === 'stats'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>STATISTIQUES DE CARRIÈRE</span>
        </button>

        <button
          onClick={() => setActiveSubTab('customization')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
            activeSubTab === 'customization'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>PERSONNALISER LE PROFIL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-xs sm:text-sm font-black italic tracking-wide transition-all ${
            activeSubTab === 'code'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
              : 'bg-slate-900 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>MENU CODE SECRET</span>
        </button>
      </div>

      {/* 3. CONTENU : SOUS-ONGLET STATISTIQUES */}
      {activeSubTab === 'stats' && (
        <div className="w-full flex flex-col gap-4 text-left">
          {/* Note sur la progression dynamique */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Ce profil débute à <strong>zéro</strong> et comptabilise automatiquement chaque match terminé, tir, but, arrêt et victoire.
              </span>
            </div>
            {profile.matchesPlayed > 0 && (
              <button
                onClick={handleResetStats}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-400 transition-colors"
                title="Remettre les compteurs à zéro"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>

          {/* Grille des 6 métriques clés */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Matchs Joués</div>
              <div className="font-display text-xl sm:text-2xl font-black text-white mt-1">
                {profile.matchesPlayed}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Total duels</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Victoires</div>
              <div className="font-display text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                {profile.matchesWon}
              </div>
              <div className="text-[10px] text-emerald-500/80 mt-0.5">
                {winRate}% de winrate
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/30 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-red-400">Défaites</div>
              <div className="font-display text-xl sm:text-2xl font-black text-red-400 mt-1">
                {profile.matchesLost}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Expérience acquise</div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-cyan-400">Buts Marqués</div>
              <div className="font-display text-xl sm:text-2xl font-black text-cyan-300 mt-1">
                {profile.goalsScored}
              </div>
              <div className="text-[10px] text-cyan-500/80 mt-0.5">
                {goalsPerMatch} / match
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-blue-400">Arrêts / Saves</div>
              <div className="font-display text-xl sm:text-2xl font-black text-blue-300 mt-1">
                {profile.saves}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Défenses décisives</div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-3.5 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-400">Buts en Or</div>
              <div className="font-display text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {profile.overtimeWins}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Prolongations</div>
            </div>
          </div>

          {/* Ateliers et Sessions d'Entraînement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <Dumbbell className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                  SESSIONS FREEPLAY & ENTRAÎNEMENT
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-rajdhani mb-3">
                Nombre de sessions d'entraînement passées à peaufiner vos aerials et mécaniques.
              </p>
              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-xs text-slate-300 font-bold">Sessions lancées :</span>
                <span className="font-display text-lg font-black text-emerald-400">
                  {profile.trainingSessions}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                    COMPATIBILITÉ MULTIJOUEUR
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-rajdhani">
                  Toutes les parties jouées en duel 1v1 contre le bot ou en multijoueur local incrémentent instantanément vos points d'expérience (XP) et votre MMR.
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onSelectTab('play')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2 font-display text-xs font-black text-slate-950 uppercase shadow hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  Lancer un match maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTENU : SOUS-ONGLET PERSONNALISATION (TITRE, ICÔNE, COULEURS) */}
      {activeSubTab === 'customization' && (
        <div className="w-full flex flex-col gap-4 text-left">
          {/* Section A : Modification du Titre Équipé */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <h3 className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase">
                  CHOISIR MON TITRE
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Actuel : <strong className="text-amber-300">{profile.title}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {AVAILABLE_TITLES.map((t) => {
                const isSelected = profile.title === t;
                const isUnlocked = Boolean(profile.unlockedTitles ? profile.unlockedTitles.includes(t) : t === 'Novice de l’Arène');
                return (
                  <button
                    key={t}
                    onClick={() => {
                      if (isUnlocked) {
                        onUpdateProfile({ ...profile, title: t });
                      } else if (onSelectTab) {
                        onSelectTab('shop');
                      }
                    }}
                    className={`rounded-xl p-2.5 text-center font-rajdhani text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      !isUnlocked
                        ? 'border-slate-800/40 bg-slate-950/40 text-slate-500 opacity-60 hover:opacity-100 hover:border-amber-500/40 cursor-pointer'
                        : isSelected
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {!isUnlocked && <Lock className="h-3 w-3 text-rose-400 shrink-0" />}
                    <span className="truncate">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B : Modification de l'Icône d'Avatar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                <h3 className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase">
                  CHOISIR MON ICÔNE D'AVATAR
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                10 Icônes Sideswipe
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {AVAILABLE_AVATARS.map((av) => {
                const isSelected = profile.avatarIcon === av.id;
                const isUnlocked = Boolean(profile.unlockedAvatarIcons ? profile.unlockedAvatarIcons.includes(av.id) : av.id === 'trophy');
                return (
                  <button
                    key={av.id}
                    onClick={() => {
                      if (isUnlocked) {
                        onUpdateProfile({ ...profile, avatarIcon: av.id });
                      } else if (onSelectTab) {
                        onSelectTab('shop');
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 transition-all border ${
                      !isUnlocked
                        ? 'border-slate-800/40 bg-slate-950/40 text-slate-500 opacity-60 hover:opacity-100 hover:border-cyan-500/40 cursor-pointer'
                        : isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-[1.02]'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div style={{ color: isSelected ? profile.avatarColor : undefined }} className="relative">
                      {renderAvatarIcon(av.id, 'h-6 w-6')}
                      {!isUnlocked && (
                        <div className="absolute -top-1 -right-1 bg-slate-900/90 rounded-full p-0.5 text-rose-400">
                          <Lock className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold font-rajdhani">{av.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section C : Couleurs de l'Avatar et de la Bannière */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Couleur de lueur de l'icône */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              <h3 className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase mb-3">
                COULEUR DE L'AVATAR
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_AVATAR_COLORS.map((c) => {
                  const isSelected = profile.avatarColor === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => onUpdateProfile({ ...profile, avatarColor: c.value })}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition-all ${
                        isSelected
                          ? 'border-white bg-slate-800 shadow-md scale-105'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-white/30"
                        style={{ backgroundColor: c.value }}
                      />
                      <span className="text-[9px] font-semibold text-slate-300 truncate w-full text-center">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Couleur de Fond de la Bannière */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
              <h3 className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase mb-3">
                THÈME DE LA BANNIÈRE
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_BANNER_COLORS.map((b) => {
                  const isSelected = profile.bannerColor === b.value;
                  return (
                    <button
                      key={b.value}
                      onClick={() => onUpdateProfile({ ...profile, bannerColor: b.value })}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition-all ${
                        isSelected
                          ? 'border-white bg-slate-800 shadow-md scale-105'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="h-6 w-full rounded-lg border border-white/20"
                        style={{ backgroundColor: b.value }}
                      />
                      <span className="text-[10px] font-semibold text-slate-300 truncate w-full text-center">
                        {b.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONTENU : SOUS-ONGLET MENU CODE SECRET */}
      {activeSubTab === 'code' && (
        <div className="w-full flex flex-col gap-4 text-left animate-fadeIn">
          {/* Main Terminal Code Entry Card */}
          <div className="relative rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 p-5 sm:p-7 shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-black italic tracking-wide text-amber-300 uppercase">
                    TERMINAL DE SAISIE DE CODE SECRET
                  </h2>
                  <p className="text-xs text-slate-400 font-rajdhani">
                    Saisissez un code promotionnel ou confidentiel pour débloquer du contenu exclusif.
                  </p>
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleValidateSecretCode} className="mt-5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-400/70">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="ENTREZ VOTRE CODE SECRET..."
                    value={secretCodeInput}
                    onChange={(e) => {
                      setSecretCodeInput(e.target.value);
                      if (codeFeedback) setCodeFeedback(null);
                    }}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950/90 border border-amber-500/40 rounded-2xl font-mono text-base font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 uppercase tracking-widest shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 font-display text-sm font-black italic text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Unlock className="h-4 w-4" />
                  <span>VALIDER LE CODE</span>
                </button>
              </form>

              {/* Message de Feedback */}
              {codeFeedback && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-2xl p-4 border text-xs sm:text-sm font-rajdhani font-bold animate-fadeIn ${
                    codeFeedback.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  }`}
                >
                  {codeFeedback.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{codeFeedback.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card : Déblocage Intégral du Garage avec le Code Secret */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Gift className="h-5 w-5 text-amber-400" />
                <h3 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
                  AVANTAGES DU CODE SECRET VIP
                </h3>
              </div>
              <span className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300">
                MASTER UNLOCK
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-display text-xs font-black italic mb-1">
                  <span>🏎️ 6 VÉHICULES OFFICIELS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Octane, Fennec, Dominus, Merc Titan, Porsche 911 Turbo & Corvette C8.R débloqués.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-display text-xs font-black italic mb-1">
                  <span>🛞 6 JANTES COMPÉTITION</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Cristiano, Apex Plasma, Zomba, Astro-CSX, Dieci & Infinium Photon débloquées.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-display text-xs font-black italic mb-1">
                  <span>🚀 8 TURBOS & BOOSTS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Hyperdrive, Flamme, Plasma Néon, Arc-en-Ciel, Foudre, Crimson, Or & Émeraude.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 text-pink-400 font-display text-xs font-black italic mb-1">
                  <span>💥 4 EXPLOSIONS DE BUT</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Onde de Choc, Explosion Solaire, Électro Choc & Supernova Cosmique.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 text-yellow-400 font-display text-xs font-black italic mb-1">
                  <span>🎨 STICKERS, TITRES & AVATARS</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Tous les 6 stickers de carrosserie, 10 titres d'arène et 10 insignes d'avatar.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-amber-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-display text-xs font-black italic mb-1">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span>99 999 PIÈCES D'OR</span>
                </div>
                <p className="text-[11px] text-slate-400 font-rajdhani">
                  Solde de pièces d'or max pour ouvrir toutes les caisses de butin mystère de la boutique !
                </p>
              </div>
            </div>

            {/* Statut de progression du garage */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm shrink-0">
                  {(profile.unlockedCars?.length || 1) === 6 ? '100%' : 'PASS'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase font-display">
                    INVENTAIRE DE VOTRE GARAGE :
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Voitures : {profile.unlockedCars?.length || 1}/6 • Jantes : {profile.unlockedWheels?.length || 1}/6 • Turbos : {profile.unlockedBoosts?.length || 1}/8 • Explosions : {profile.unlockedExplosions?.length || 1}/4
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectTab('garage')}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-display text-xs font-bold text-white transition-all border border-slate-700 shrink-0 cursor-pointer"
              >
                <span>Accéder au Garage</span>
                <Unlock className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card : Réinitialisation du Compte à Zéro (Toujours visible sur le profil) */}
      <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 sm:p-5 text-left w-full shadow-lg">
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-rose-400" />
            <h4 className="font-display text-xs sm:text-sm font-black italic tracking-wide text-white uppercase">
              RÉINITIALISATION DU COMPTE
            </h4>
          </div>
          <span className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-rose-300">
            REMISE À ZÉRO
          </span>
        </div>

        <p className="text-[11px] text-slate-300 font-rajdhani mb-3.5 leading-relaxed">
          Recommencer à zéro remettra vos pièces d'or à 200, verrouillera à nouveau les objets du garage non de base, et réinitialisera vos statistiques.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 font-display text-xs font-bold transition-all cursor-pointer hover:scale-[1.01]"
          >
            <RotateCcw className="h-4 w-4 text-rose-400" />
            <span>RÉINITIALISER TOUT MON COMPTE À ZÉRO</span>
          </button>
        ) : (
          <div className="rounded-xl bg-rose-950/90 border border-rose-500/60 p-3.5 animate-fadeIn">
            <div className="text-xs font-bold text-rose-200 font-display mb-2.5 uppercase">
              ⚠️ CONFIRMATION : ÊTES-VOUS SÛR DE VOULOIR RÉINITIALISER VOTRE COMPTE ?
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleResetFullAccount}
                className="flex-1 py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-black shadow-lg transition-all cursor-pointer"
              >
                OUI, RÉINITIALISER
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-display text-xs font-bold transition-all cursor-pointer"
              >
                ANNULER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
