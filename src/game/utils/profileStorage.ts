import { PlayerProfile, PlayerAvatarIcon } from '../types/game';

export const PROFILE_STORAGE_KEY = 'sideswipe_player_profile_v5';
export const LEGACY_PROFILE_STORAGE_KEY = 'sideswipe_player_profile_v2';

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  username: 'Pilote Sideswipe',
  title: 'Novice de l’Arène',
  avatarIcon: 'trophy',
  avatarColor: '#06b6d4', // Cyan
  bannerColor: '#2563eb', // Blue
  matchesPlayed: 0,
  matchesWon: 0,
  matchesLost: 0,
  goalsScored: 0,
  saves: 0,
  shots: 0,
  overtimeWins: 0,
  trainingSessions: 0,
  xp: 0,
  mmr: 600, // Bronze default starting rating
  winStreak: 0,
  highestMmr: 600,
  rankedHistory: [],
  coins: 2500,
  unlockedCars: ['octane'], // Only starter Octane car is free
  unlockedWheels: ['cristiano'], // Only starter Cristiano wheels are free
  unlockedBoosts: ['orange-flame'], // Only standard Orange Flame boost is free
  unlockedExplosions: ['shockwave'], // Only standard Shockwave explosion is free
  unlockedTitles: ['Novice de l’Arène'], // Only starter title is free
  unlockedAvatarIcons: ['trophy'], // Only starter Trophy icon is free
  unlockedDecals: ['none'], // Only standard clean body is free
};

export const AVAILABLE_TITLES = [
  'Novice de l’Arène',
  'As de l’Aérien',
  'Légende du Boost',
  'Gardien Infranchissable',
  'Artificier Flip Reset',
  'Sniper Gold Shot',
  'Tireur d’Élite',
  'Maître du Kickoff',
  'Défenseur du Mur',
  'Champion Supersonique',
];

export const AVAILABLE_AVATARS: Array<{ id: PlayerAvatarIcon; name: string }> = [
  { id: 'trophy', name: 'Trophée' },
  { id: 'shield', name: 'Bouclier' },
  { id: 'zap', name: 'Éclair Électrique' },
  { id: 'flame', name: 'Flamme Turbo' },
  { id: 'star', name: 'Étoile Champion' },
  { id: 'crown', name: 'Couronne Royale' },
  { id: 'target', name: 'Viseur Précision' },
  { id: 'sparkles', name: 'Étincelles' },
  { id: 'rocket', name: 'Fusée Supersonique' },
  { id: 'swords', name: 'Lames de Duel' },
];

export const AVAILABLE_AVATAR_COLORS = [
  { name: 'Cyan Néon', value: '#06b6d4' },
  { name: 'Bleu Électrique', value: '#2563eb' },
  { name: 'Émeraude', value: '#10b981' },
  { name: 'Violet Sombre', value: '#8b5cf6' },
  { name: 'Rose Cyber', value: '#ec4899' },
  { name: 'Orange Flamboyant', value: '#f97316' },
  { name: 'Or Pur', value: '#eab308' },
  { name: 'Rouge Crimson', value: '#ef4444' },
];

export const AVAILABLE_BANNER_COLORS = [
  { name: 'Abyssal Bleu', value: '#1e3a8a' },
  { name: 'Néon Cyan', value: '#0891b2' },
  { name: 'Obsidienne Violette', value: '#581c87' },
  { name: 'Magma Orange', value: '#9a3412' },
  { name: 'Vert Matrice', value: '#065f46' },
  { name: 'Noir Carbone', value: '#0f172a' },
];

export interface RankTierInfo {
  name: string;
  division: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  minMmr: number;
  maxMmr: number;
  progressPercent: number;
  nextTierName: string;
}

export function getRankTier(mmr: number): RankTierInfo {
  if (mmr < 700) {
    const isDiv1 = mmr < 650;
    const min = isDiv1 ? 550 : 650;
    const max = isDiv1 ? 650 : 700;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Bronze',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-amber-500',
      badgeBg: 'bg-amber-950/40',
      badgeBorder: 'border-amber-700/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Bronze II' : 'Argent I',
    };
  }
  if (mmr < 900) {
    const isDiv1 = mmr < 800;
    const min = isDiv1 ? 700 : 800;
    const max = isDiv1 ? 800 : 900;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Argent',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-slate-300',
      badgeBg: 'bg-slate-800/60',
      badgeBorder: 'border-slate-500/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Argent II' : 'Or I',
    };
  }
  if (mmr < 1150) {
    const isDiv1 = mmr < 1000;
    const min = isDiv1 ? 900 : 1000;
    const max = isDiv1 ? 1000 : 1150;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Or',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-yellow-400',
      badgeBg: 'bg-yellow-950/40',
      badgeBorder: 'border-yellow-500/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Or II' : 'Platine I',
    };
  }
  if (mmr < 1400) {
    const isDiv1 = mmr < 1250;
    const min = isDiv1 ? 1150 : 1250;
    const max = isDiv1 ? 1250 : 1400;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Platine',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-cyan-300',
      badgeBg: 'bg-cyan-950/40',
      badgeBorder: 'border-cyan-500/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Platine II' : 'Diamant I',
    };
  }
  if (mmr < 1700) {
    const isDiv1 = mmr < 1550;
    const min = isDiv1 ? 1400 : 1550;
    const max = isDiv1 ? 1550 : 1700;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Diamant',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-950/50',
      badgeBorder: 'border-blue-500/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Diamant II' : 'Champion I',
    };
  }
  if (mmr < 2000) {
    const isDiv1 = mmr < 1850;
    const min = isDiv1 ? 1700 : 1850;
    const max = isDiv1 ? 1850 : 2000;
    const pct = Math.min(100, Math.max(0, Math.round(((mmr - min) / (max - min)) * 100)));
    return {
      name: 'Champion',
      division: isDiv1 ? 'I' : 'II',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-950/50',
      badgeBorder: 'border-purple-500/60',
      minMmr: min,
      maxMmr: max,
      progressPercent: pct,
      nextTierName: isDiv1 ? 'Champion II' : 'Grand Champion',
    };
  }
  const pct = Math.min(100, Math.max(0, Math.round(((mmr - 2000) / 500) * 100)));
  return {
    name: 'Grand Champion',
    division: '★',
    color: 'text-red-400',
    badgeBg: 'bg-red-950/60',
    badgeBorder: 'border-red-500/80',
    minMmr: 2000,
    maxMmr: 2500,
    progressPercent: pct,
    nextTierName: 'Légende Élite',
  };
}

export function getEstimatedRankPosition(mmr: number): number {
  if (mmr >= 2200) return Math.max(1, Math.round(15 - (mmr - 2200) / 30));
  if (mmr >= 2000) return Math.max(16, Math.round(99 - (mmr - 2000) * 0.4));
  if (mmr >= 1700) return Math.round(500 - (mmr - 1700) * 1.3);
  if (mmr >= 1400) return Math.round(2000 - (mmr - 1400) * 5);
  if (mmr >= 1150) return Math.round(5000 - (mmr - 1150) * 12);
  if (mmr >= 900) return Math.round(15000 - (mmr - 900) * 40);
  if (mmr >= 700) return Math.round(30000 - (mmr - 700) * 75);
  return Math.max(30000, Math.round(50000 - (mmr - 600) * 200));
}

export function getPlayerLevel(xp: number): {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const XP_PER_LEVEL = 250;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpForNextLevel) * 100));

  return {
    level,
    currentLevelXp,
    xpForNextLevel,
    progressPercent,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PLAYER_PROFILE };
  }
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PLAYER_PROFILE,
        ...parsed,
        coins: parsed.coins !== undefined ? parsed.coins : DEFAULT_PLAYER_PROFILE.coins,
        unlockedCars: parsed.unlockedCars || DEFAULT_PLAYER_PROFILE.unlockedCars,
        unlockedWheels: parsed.unlockedWheels || DEFAULT_PLAYER_PROFILE.unlockedWheels,
        unlockedBoosts: parsed.unlockedBoosts || DEFAULT_PLAYER_PROFILE.unlockedBoosts,
        unlockedExplosions: parsed.unlockedExplosions || DEFAULT_PLAYER_PROFILE.unlockedExplosions,
        unlockedTitles: parsed.unlockedTitles || DEFAULT_PLAYER_PROFILE.unlockedTitles,
        unlockedAvatarIcons: parsed.unlockedAvatarIcons || DEFAULT_PLAYER_PROFILE.unlockedAvatarIcons,
        unlockedDecals: parsed.unlockedDecals || DEFAULT_PLAYER_PROFILE.unlockedDecals,
      };
    }

    // Migrate from legacy v1 storage if available
    const legacySaved = localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    if (legacySaved) {
      const legacyParsed = JSON.parse(legacySaved);
      const migratedProfile: PlayerProfile = {
        ...DEFAULT_PLAYER_PROFILE,
        username: legacyParsed.username || DEFAULT_PLAYER_PROFILE.username,
        mmr: legacyParsed.mmr || DEFAULT_PLAYER_PROFILE.mmr,
        highestMmr: legacyParsed.highestMmr || DEFAULT_PLAYER_PROFILE.highestMmr,
        xp: legacyParsed.xp || DEFAULT_PLAYER_PROFILE.xp,
        matchesPlayed: legacyParsed.matchesPlayed || 0,
        matchesWon: legacyParsed.matchesWon || 0,
        matchesLost: legacyParsed.matchesLost || 0,
        goalsScored: legacyParsed.goalsScored || 0,
        saves: legacyParsed.saves || 0,
        shots: legacyParsed.shots || 0,
        overtimeWins: legacyParsed.overtimeWins || 0,
        trainingSessions: legacyParsed.trainingSessions || 0,
        rankedHistory: legacyParsed.rankedHistory || [],
        coins: legacyParsed.coins !== undefined ? legacyParsed.coins : DEFAULT_PLAYER_PROFILE.coins,
        unlockedCars: DEFAULT_PLAYER_PROFILE.unlockedCars,
        unlockedWheels: DEFAULT_PLAYER_PROFILE.unlockedWheels,
        unlockedBoosts: DEFAULT_PLAYER_PROFILE.unlockedBoosts,
        unlockedExplosions: DEFAULT_PLAYER_PROFILE.unlockedExplosions,
        unlockedTitles: DEFAULT_PLAYER_PROFILE.unlockedTitles,
        unlockedAvatarIcons: DEFAULT_PLAYER_PROFILE.unlockedAvatarIcons,
        unlockedDecals: DEFAULT_PLAYER_PROFILE.unlockedDecals,
      };
      savePlayerProfile(migratedProfile);
      return migratedProfile;
    }
  } catch (e) {
    console.error('Error loading player profile:', e);
  }
  return { ...DEFAULT_PLAYER_PROFILE };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving player profile:', e);
  }
}
