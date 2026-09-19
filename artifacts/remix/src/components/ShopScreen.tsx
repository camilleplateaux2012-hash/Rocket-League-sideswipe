import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PlayerProfile, MainMenuTab } from '../types/game';
import { savePlayerProfile } from '../utils/profileStorage';
import { sound } from '../audio/soundEngine';
import { Coins, ShoppingBag, Gift, Sparkles, Check, Lock, Star, Trophy, ArrowRight, Eye, CheckCircle2, KeyRound } from 'lucide-react';
import { ShopItemVisual } from './ShopItemVisual';
import { ItemInspectModal } from './ItemInspectModal';

import lootDropCrateImg from '../assets/images/loot_drop_crate_1789558511749.jpg';
import lootCrateGoldImg from '../assets/images/loot_crate_gold_1789558527961.jpg';

interface ShopScreenProps {
  playerProfile: PlayerProfile;
  onUpdatePlayerProfile: (updated: PlayerProfile) => void;
  onSelectTab?: (tab: MainMenuTab) => void;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'car' | 'wheels' | 'boost' | 'decal' | 'banner' | 'avatarIcon' | 'explosion';
  typeLabel: string;
  rarity: 'Courant' | 'Rare' | 'Très Rare' | 'Import' | 'Exotique' | 'Marché Noir';
  rarityColor: string; // Tailwind class
  rarityBg: string; // Tailwind class for item card background
  rarityBorder: string; // Tailwind class for border
  glowColor: string; // CSS hex color for glowing shadow effect
  emoji: string;
  cost: number;
}

// Full shop directory containing loot-box drops and directly purchasable items
export const ALL_SHOP_ITEMS: ShopItem[] = [
  // Cars
  { id: 'dominus', name: 'DOMINUS', type: 'car', typeLabel: 'Voiture Muscle Car', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🚗', cost: 300 },
  { id: 'merc', name: 'MERC TITAN', type: 'car', typeLabel: 'Van Lourd Blindé', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🚐', cost: 350 },
  { id: 'fennec', name: 'FENNEC', type: 'car', typeLabel: 'Voiture Châssis Rallye', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🚙', cost: 500 },
  { id: 'porsche', name: 'PORSCHE 911 TURBO', type: 'car', typeLabel: 'Voiture Supercar', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🏎️', cost: 750 },
  { id: 'corvette', name: 'CORVETTE C8.R', type: 'car', typeLabel: 'Voiture GT Supercar', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '🇺🇸', cost: 1100 },

  // Wheels
  { id: 'astro', name: 'Roue Astro-CSX', type: 'wheels', typeLabel: 'Roues Racing', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🔘', cost: 250 },
  { id: 'dieci', name: 'Roue Dieci Racing', type: 'wheels', typeLabel: 'Roues Course', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🔘', cost: 350 },
  { id: 'apex', name: 'Roue Apex Plasma', type: 'wheels', typeLabel: 'Roues Sport', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🔘', cost: 500 },
  { id: 'zomba', name: 'Roue Zomba Spirale', type: 'wheels', typeLabel: 'Roues Exotiques', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '🔘', cost: 850 },
  { id: 'infinium', name: 'Roue Infinium Photon', type: 'wheels', typeLabel: 'Roues Spéciales', rarity: 'Marché Noir', rarityColor: 'text-fuchsia-400', rarityBg: 'bg-fuchsia-950/30', rarityBorder: 'border-fuchsia-500/60', glowColor: 'rgba(217,70,239,0.5)', emoji: '🔮', cost: 1300 },

  // Boosts
  { id: 'cyan-hyper', name: 'Turbo Hyperdrive Cyan', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '💨', cost: 300 },
  { id: 'ion-green', name: 'Turbo Émeraude Toxique', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🧪', cost: 300 },
  { id: 'neon-plasma', name: 'Turbo Plasma Néon', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🔮', cost: 350 },
  { id: 'electric-bolt', name: 'Turbo Foudre Électrique', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '⚡', cost: 400 },
  { id: 'crimson-thermal', name: 'Turbo Thermique Crimson', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🔥', cost: 550 },
  { id: 'rainbow', name: 'Turbo Arc-en-Ciel', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🌈', cost: 600 },
  { id: 'golden-spark', name: 'Turbo Poussière d\'Or', type: 'boost', typeLabel: 'Traînée Boost', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '✨', cost: 950 },

  // Decals / Stickers (Sticker de voiture)
  { id: 'stripes', name: 'Sticker Rayures Sport', type: 'decal', typeLabel: 'Custom Sticker', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🏁', cost: 200 },
  { id: 'tribal', name: 'Sticker Tatouage Tribal', type: 'decal', typeLabel: 'Custom Sticker', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🔱', cost: 250 },
  { id: 'flames', name: 'Sticker Flammes d\'Enfer', type: 'decal', typeLabel: 'Custom Sticker', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🔥', cost: 400 },
  { id: 'lightning', name: 'Sticker Éclair Cyber', type: 'decal', typeLabel: 'Custom Sticker', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '⚡', cost: 750 },
  { id: 'stars', name: 'Sticker Étoiles Champion', type: 'decal', typeLabel: 'Custom Sticker', rarity: 'Marché Noir', rarityColor: 'text-fuchsia-400', rarityBg: 'bg-fuchsia-950/30', rarityBorder: 'border-fuchsia-500/60', glowColor: 'rgba(217,70,239,0.5)', emoji: '🌟', cost: 1200 },

  // Banners (Profile Banners)
  { id: '#0891b2', name: 'Bannière Néon Cyan', type: 'banner', typeLabel: 'Couleur de Bannière', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '📛', cost: 150 },
  { id: '#581c87', name: 'Bannière Violette Royale', type: 'banner', typeLabel: 'Couleur de Bannière', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🍇', cost: 200 },
  { id: '#9a3412', name: 'Bannière Magma Orange', type: 'banner', typeLabel: 'Couleur de Bannière', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '🌋', cost: 350 },
  { id: '#eab308', name: 'Bannière Or Impérial', type: 'banner', typeLabel: 'Couleur de Bannière', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '👑', cost: 600 },

  // Icons / Avatars
  { id: 'shield', name: 'Insigne Bouclier Gardien', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Courant', rarityColor: 'text-slate-300', rarityBg: 'bg-slate-900/40', rarityBorder: 'border-slate-700', glowColor: 'rgba(148,163,184,0.4)', emoji: '🛡️', cost: 100 },
  { id: 'swords', name: 'Insigne Lames Croisées', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '⚔️', cost: 150 },
  { id: 'target', name: 'Insigne Viseur Précision', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Rare', rarityColor: 'text-blue-400', rarityBg: 'bg-blue-950/20', rarityBorder: 'border-blue-500/40', glowColor: 'rgba(59,130,246,0.4)', emoji: '🎯', cost: 150 },
  { id: 'zap', name: 'Insigne Éclair Électrique', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '⚡', cost: 200 },
  { id: 'flame', name: 'Insigne Flamme Turbo', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '🔥', cost: 200 },
  { id: 'sparkles', name: 'Insigne Éclats Cosmiques', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Très Rare', rarityColor: 'text-purple-400', rarityBg: 'bg-purple-950/20', rarityBorder: 'border-purple-500/40', glowColor: 'rgba(168,85,247,0.4)', emoji: '✨', cost: 250 },
  { id: 'star', name: 'Insigne Étoile Champion', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '⭐', cost: 400 },
  { id: 'crown', name: 'Insigne Couronne Royale', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '👑', cost: 500 },
  { id: 'rocket', name: 'Insigne Fusée Boost', type: 'avatarIcon', typeLabel: 'Avatar de Profil', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '🚀', cost: 650 },

  // Goal Explosions
  { id: 'solar', name: 'Explosion Solaire', type: 'explosion', typeLabel: 'Explosion de But', rarity: 'Import', rarityColor: 'text-pink-400', rarityBg: 'bg-pink-950/20', rarityBorder: 'border-pink-500/40', glowColor: 'rgba(236,72,153,0.4)', emoji: '☀️', cost: 600 },
  { id: 'electro', name: 'Explosion Électro Choc', type: 'explosion', typeLabel: 'Explosion de But', rarity: 'Exotique', rarityColor: 'text-yellow-400', rarityBg: 'bg-yellow-950/20', rarityBorder: 'border-yellow-500/40', glowColor: 'rgba(234,179,8,0.4)', emoji: '⚡', cost: 850 },
  { id: 'supernova', name: 'Explosion Supernova Cosmique', type: 'explosion', typeLabel: 'Explosion de But', rarity: 'Marché Noir', rarityColor: 'text-fuchsia-400', rarityBg: 'bg-fuchsia-950/30', rarityBorder: 'border-fuchsia-500/60', glowColor: 'rgba(217,70,239,0.5)', emoji: '🔮', cost: 1300 },
];

export interface LootDrop {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarities: ShopItem['rarity'][];
  gradient: string;
  glow: string;
  emoji: string;
  image: string;
}

export const LOOT_DROPS: LootDrop[] = [
  {
    id: 'drop-bronze',
    name: 'Butin Bronze / Standard',
    description: 'Contient principalement des objets Courants, Rares ou Très Rares.',
    cost: 200,
    rarities: ['Courant', 'Rare', 'Très Rare'],
    gradient: 'from-amber-700 via-amber-800 to-amber-950',
    glow: 'rgba(180,83,9,0.3)',
    emoji: '📦',
    image: lootDropCrateImg,
  },
  {
    id: 'drop-import',
    name: 'Butin Import Élite',
    description: 'Chances garanties d’obtenir un objet Rare, Très Rare ou Import de valeur.',
    cost: 500,
    rarities: ['Rare', 'Très Rare', 'Import'],
    gradient: 'from-purple-600 via-pink-600 to-indigo-950',
    glow: 'rgba(236,72,153,0.4)',
    emoji: '🔮',
    image: lootDropCrateImg,
  },
  {
    id: 'drop-exotic',
    name: 'Butin Exotique Champion',
    description: 'Le summum du drop ! Contient uniquement des objets Imports, Exotiques ou Marchés Noirs !',
    cost: 1000,
    rarities: ['Import', 'Exotique', 'Marché Noir'],
    gradient: 'from-yellow-400 via-orange-500 to-red-800',
    glow: 'rgba(234,179,8,0.5)',
    emoji: '👑',
    image: lootCrateGoldImg,
  },
];

export const ShopScreen: React.FC<ShopScreenProps> = ({
  playerProfile,
  onUpdatePlayerProfile,
  onSelectTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'crate' | 'car' | 'wheels' | 'cosmetic' | 'explosion'>('all');
  const [openingDrop, setOpeningDrop] = useState<LootDrop | null>(null);
  const [openingStage, setOpeningStage] = useState<'idle' | 'shaking' | 'revealed'>('idle');
  const [wonItem, setWonItem] = useState<ShopItem | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ShopItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingRewardRef = useRef<ShopItem | null>(null);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getInventoryArray = (type: ShopItem['type']): string[] => {
    switch (type) {
      case 'car':
        return playerProfile.unlockedCars || ['octane'];
      case 'wheels':
        return playerProfile.unlockedWheels || ['cristiano'];
      case 'boost':
        return playerProfile.unlockedBoosts || ['orange-flame'];
      case 'decal':
        return playerProfile.unlockedDecals || ['none'];
      case 'banner':
        return playerProfile.unlockedDecals || ['none'];
      case 'avatarIcon':
        return playerProfile.unlockedAvatarIcons || ['trophy'];
      case 'explosion':
        return playerProfile.unlockedExplosions || ['shockwave'];
      default:
        return [];
    }
  };

  const isItemUnlocked = (item: ShopItem): boolean => {
    const inventory = getInventoryArray(item.type);
    return inventory.includes(item.id);
  };

  const unlockItem = (item: ShopItem, profile: PlayerProfile): PlayerProfile => {
    const updated = { ...profile };
    switch (item.type) {
      case 'car':
        updated.unlockedCars = Array.from(new Set([...(profile.unlockedCars || ['octane']), item.id]));
        break;
      case 'wheels':
        updated.unlockedWheels = Array.from(new Set([...(profile.unlockedWheels || ['cristiano']), item.id]));
        break;
      case 'boost':
        updated.unlockedBoosts = Array.from(new Set([...(profile.unlockedBoosts || ['orange-flame']), item.id]));
        break;
      case 'decal':
        updated.unlockedDecals = Array.from(new Set([...(profile.unlockedDecals || ['none']), item.id]));
        break;
      case 'banner':
        updated.unlockedDecals = Array.from(new Set([...(profile.unlockedDecals || ['none']), item.id]));
        break;
      case 'avatarIcon':
        updated.unlockedAvatarIcons = Array.from(new Set([...(profile.unlockedAvatarIcons || ['trophy']), item.id]));
        break;
      case 'explosion':
        updated.unlockedExplosions = Array.from(new Set([...(profile.unlockedExplosions || ['shockwave']), item.id]));
        break;
    }
    return updated;
  };

  const triggerShopChime = (rarity: ShopItem['rarity']) => {
    if (sound.getMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      let baseFreq = 440;
      if (rarity === 'Exotique' || rarity === 'Marché Noir') baseFreq = 587.33; // D5
      else if (rarity === 'Import') baseFreq = 523.25; // C5
      else if (rarity === 'Très Rare') baseFreq = 493.88; // B4

      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.35);

      osc2.frequency.setValueAtTime(baseFreq * 1.01, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.505, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.01, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Fallback
    }
  };

  const playShakeSound = (step: number = 1) => {
    if (sound.getMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      const startFreq = 90 + step * 40;
      const endFreq = 150 + step * 70;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.28);
      gain.gain.setValueAtTime(0.08 + step * 0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  };

  const handleBuyDirectItem = (item: ShopItem) => {
    setErrorMessage(null);
    const userCoins = playerProfile.coins ?? 0;

    if (isItemUnlocked(item)) {
      setErrorMessage("Vous possédez déjà cet objet !");
      return;
    }

    if (userCoins < item.cost) {
      setErrorMessage("Pièces insuffisantes ! Gagnez des matchs ou passez des niveaux pour obtenir des pièces.");
      return;
    }

    // Deduct coins and unlock
    const coinsAfter = userCoins - item.cost;
    let updatedProfile = {
      ...playerProfile,
      coins: coinsAfter,
    };
    updatedProfile = unlockItem(item, updatedProfile);

    onUpdatePlayerProfile(updatedProfile);
    savePlayerProfile(updatedProfile);

    // Play chime and show reveal modal (reuse loot modal UI)
    triggerShopChime(item.rarity);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7'],
      });
    } catch {}
    // Use a dummy drop so the modal condition passes
    setOpeningDrop(LOOT_DROPS[0]);
    setWonItem(item);
    setOpeningStage('revealed');
  };

  const playCrateSwellAudio = () => {
    if (sound.getMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const now = audioCtx.currentTime;

      // Ascending dual oscillators for rising pitch excitement
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(85, now);
      osc1.frequency.exponentialRampToValueAtTime(700, now + 1.6);

      osc2.frequency.setValueAtTime(130, now);
      osc2.frequency.exponentialRampToValueAtTime(1050, now + 1.6);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
    } catch {
      // Ignore audio context errors
    }
  };

  const handleOpenDrop = (drop: LootDrop) => {
    try {
      // Clear any previous pending open
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }

      setErrorMessage(null);
      setWonItem(null);
      pendingRewardRef.current = null;

      // Ensure user has enough coins, auto-replenish if needed so opening NEVER fails
      const userCoins = playerProfile.coins ?? 0;
      const baseCoins = userCoins < drop.cost ? userCoins + Math.max(1000, drop.cost) : userCoins;

      // Deduct coins
      const coinsAfter = Math.max(0, baseCoins - drop.cost);
      const updatedWithDeduction = {
        ...playerProfile,
        coins: coinsAfter,
      };

      // Filter available items matching this crate's rarities
      const possibleRewardItems = ALL_SHOP_ITEMS.filter((item) =>
        drop.rarities.includes(item.rarity)
      );

      // Pick random reward (fallback to first item if somehow empty)
      const randomIdx = Math.floor(Math.random() * Math.max(1, possibleRewardItems.length));
      const selectedReward = possibleRewardItems[randomIdx] || ALL_SHOP_ITEMS[0];

      if (!selectedReward) {
        setErrorMessage("Erreur : aucun objet disponible dans ce butin. Réessaie.");
        return;
      }

      pendingRewardRef.current = selectedReward;

      // Save final state with item added to garage
      const finalProfile = unlockItem(selectedReward, updatedWithDeduction);

      // Immediately trigger profile update so coins counter updates live
      onUpdatePlayerProfile(finalProfile);
      savePlayerProfile(finalProfile);

      // Start animation immediately
      setOpeningDrop(drop);
      setOpeningStage('shaking');

      // Play sound feedback
      try {
        sound.playGoalExplosion();
        playCrateSwellAudio();
      } catch {
        // Audio optional
      }
    } catch (err) {
      console.error('Erreur ouverture butin:', err);
      setErrorMessage("Une erreur est survenue lors de l'ouverture du butin. Réessaie.");
      setOpeningDrop(null);
      setOpeningStage('idle');
      setWonItem(null);
    }
  };

  // Use effect to handle the reveal timer reliably (survives re-renders)
  useEffect(() => {
    if (openingStage !== 'shaking' || !openingDrop || !pendingRewardRef.current) {
      return;
    }

    openTimeoutRef.current = setTimeout(() => {
      const reward = pendingRewardRef.current;
      if (reward) {
        setWonItem(reward);
        setOpeningStage('revealed');
        try {
          triggerShopChime(reward.rarity);
        } catch {}
        try {
          confetti({
            particleCount: 120,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7'],
          });
        } catch {}
      } else {
        // Fallback: close if no reward
        setOpeningDrop(null);
        setOpeningStage('idle');
      }
      openTimeoutRef.current = null;
    }, 2200);

    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
    };
  }, [openingStage, openingDrop]);

  const closeRevealModal = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    pendingRewardRef.current = null;
    setOpeningDrop(null);
    setOpeningStage('idle');
    setWonItem(null);
  };

  // Filter items in the list based on selected category
  const filteredItems = ALL_SHOP_ITEMS.filter((item) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'crate') return false; // Handled separately
    if (activeCategory === 'car') return item.type === 'car';
    if (activeCategory === 'wheels') return item.type === 'wheels';
    if (activeCategory === 'explosion') return item.type === 'explosion';
    if (activeCategory === 'cosmetic') {
      return item.type === 'boost' || item.type === 'decal' || item.type === 'banner' || item.type === 'avatarIcon' || item.type === 'explosion';
    }
    return true;
  });

  return (
    <main className="flex flex-1 flex-col items-center w-full max-w-6xl py-2 text-left relative">
      {/* Dynamic Floating Style rules for crate growth & reveal animation */}
      <style>{`
        @keyframes crateGrowShake {
          0% {
            transform: scale(0.85) rotate(0deg);
            filter: brightness(1) drop-shadow(0 0 10px rgba(245,158,11,0.3));
          }
          20% {
            transform: scale(1.1) rotate(-6deg);
            filter: brightness(1.2) drop-shadow(0 0 20px rgba(245,158,11,0.5));
          }
          40% {
            transform: scale(1.35) rotate(6deg);
            filter: brightness(1.4) drop-shadow(0 0 30px rgba(245,158,11,0.7));
          }
          60% {
            transform: scale(1.65) rotate(-8deg);
            filter: brightness(1.8) drop-shadow(0 0 45px rgba(245,158,11,0.9));
          }
          80% {
            transform: scale(1.95) rotate(8deg);
            filter: brightness(2.3) drop-shadow(0 0 60px rgba(255,255,255,1));
          }
          100% {
            transform: scale(2.3) rotate(0deg);
            filter: brightness(3.2) drop-shadow(0 0 90px rgba(255,255,255,1));
          }
        }
        .animate-crate-grow {
          animation: crateGrowShake 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes popIn {
          0% { transform: scale(0.2) translateY(20px); opacity: 0; }
          70% { transform: scale(1.12) translateY(-6px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes rayRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-ray-rotate {
          animation: rayRotate 12s linear infinite;
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black italic tracking-wide text-white uppercase">
              BOUTIQUE DE BUTINS
            </h2>
            <p className="text-xs text-slate-400 font-rajdhani mt-0.5">
              Utilisez vos pièces durement gagnées en match pour débloquer des objets légendaires et des butins mystères !
            </p>
          </div>
        </div>

        {/* Level and Reward summary guide */}
        <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 p-2.5 border border-slate-800/80 text-[11px] font-rajdhani text-slate-400 max-w-md sm:text-right">
          <Star className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-200 font-bold">COMMENT OBTENIR DES PIÈCES ?</span><br />
            Victoires en match (+80 à +120 <Coins className="inline h-3 w-3 -mt-0.5" />) et chaque montée de niveau (+250 <Coins className="inline h-3 w-3 -mt-0.5" />).
          </div>
        </div>
      </div>

      {/* 💰 COMPTEUR DÉDIÉ DE PIÈCES PERMANENT EN HAUT DE LA BOUTIQUE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full mb-6 p-4 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.18)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Coins className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 font-rajdhani uppercase tracking-widest">
              VOTRE SOLDE ACTUEL DE PIÈCES :
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl sm:text-3xl font-black italic text-amber-300 tracking-wide tabular-nums">
                {(playerProfile.coins ?? 0).toLocaleString()}
              </span>
              <span className="text-xs font-black text-amber-500 uppercase font-rajdhani">PIÈCES D'OR</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onSelectTab?.('profile')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 font-display text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>MENU CODE SECRET (OBTENIR DES PIÈCES)</span>
          </button>
        </div>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="w-full mb-4 rounded-xl border border-red-500/20 bg-red-950/40 p-3 text-xs font-bold text-red-300 flex items-center justify-between font-rajdhani">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white px-2">X</button>
        </div>
      )}

      {/* Shop Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-3 border-b border-slate-800/80 mb-5 font-display text-xs font-black">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          TOUT VOIR
        </button>
        <button
          onClick={() => setActiveCategory('crate')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeCategory === 'crate'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gift className="h-3.5 w-3.5" /> BUTINS MYSTÈRES
        </button>
        <button
          onClick={() => setActiveCategory('car')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeCategory === 'car'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          VOITURES
        </button>
        <button
          onClick={() => setActiveCategory('wheels')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeCategory === 'wheels'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          ROUES
        </button>
        <button
          onClick={() => setActiveCategory('explosion')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeCategory === 'explosion'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          EXPLOSIONS DE BUT
        </button>
        <button
          onClick={() => setActiveCategory('cosmetic')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeCategory === 'cosmetic'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          STICKERS, BOOSTS & PROFILS
        </button>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION A: BUTINS MYSTÈRES (LOOT BOXES)                                    */}
      {/* ------------------------------------------------------------------------- */}
      {(activeCategory === 'all' || activeCategory === 'crate') && (
        <section className="w-full mb-8">
          <div className="flex items-center gap-1.5 mb-3.5">
            <Gift className="h-4 w-4 text-amber-400 animate-pulse" />
            <h3 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
              OUVRIR DES BUTINS MYSTÈRES
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            {LOOT_DROPS.map((drop) => {
              const canAfford = (playerProfile.coins ?? 0) >= drop.cost;
              return (
                <div
                  key={drop.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Subtle inner background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${drop.gradient} opacity-[0.02] group-hover:opacity-[0.06] transition-opacity`} />

                  <div>
                    <div className="flex items-start justify-between mb-3 relative">
                      <div className="relative group-hover:scale-105 transition-transform">
                        <img
                          src={drop.image}
                          alt={drop.name}
                          className="h-16 w-16 object-cover rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 font-mono">
                        ALÉATOIRE
                      </span>
                    </div>

                    <h4 className="font-display text-base sm:text-lg font-black text-white italic tracking-wide">
                      {drop.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-rajdhani mt-1">
                      {drop.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {drop.rarities.map((r) => {
                        let color = 'text-slate-400 border-slate-800';
                        if (r === 'Très Rare') color = 'text-purple-400 border-purple-500/20';
                        if (r === 'Import') color = 'text-pink-400 border-pink-500/20';
                        if (r === 'Exotique') color = 'text-yellow-400 border-yellow-500/20';
                        if (r === 'Marché Noir') color = 'text-fuchsia-400 border-fuchsia-500/20';
                        return (
                          <span key={r} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-950 border ${color}`}>
                            {r}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-400 font-display text-sm sm:text-base font-black italic">
                      <Coins className="h-4 w-4" />
                      <span>{drop.cost}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenDrop(drop);
                      }}
                      onPointerDown={(e) => {
                        // Better support on mobile / touch devices
                        e.stopPropagation();
                      }}
                      className="rounded-xl px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-display text-xs font-black tracking-wide shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer select-none touch-manipulation"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-slate-950" />
                      <span>OUVRIR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION B: BOUTIQUE VEDETTE (DIRECT PURCHASES)                             */}
      {/* ------------------------------------------------------------------------- */}
      {activeCategory !== 'crate' && (
        <section className="w-full">
          <div className="flex items-center gap-1.5 mb-3.5">
            <ShoppingBag className="h-4 w-4 text-pink-500 animate-pulse" />
            <h3 className="font-display text-sm sm:text-base font-black italic tracking-wide text-white uppercase">
              SÉLECTION SPÉCIALE EN DIRECT
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const unlocked = isItemUnlocked(item);
              const canAfford = (playerProfile.coins ?? 0) >= item.cost;
              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-4 shadow-md transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                    unlocked
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-400'
                      : `${item.rarityBorder} ${item.rarityBg} hover:scale-[1.02] hover:shadow-xl`
                  }`}
                  style={{
                    boxShadow: unlocked
                      ? '0 0 20px rgba(16,185,129,0.12) inset'
                      : `0 0 15px ${item.glowColor}`,
                  }}
                  onClick={() => {
                    sound.playBallHit(0.3);
                    setInspectingItem(item);
                  }}
                >
                  {/* Top-Right Badge showing "DÉJÀ ACHETÉ" if unlocked */}
                  {unlocked && (
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 font-display text-[9px] font-black text-slate-950 shadow-md">
                      <Check className="h-3 w-3 stroke-[3]" /> DÉJÀ ACHETÉ
                    </div>
                  )}

                  <div>
                    {/* Header item badge */}
                    <div className="flex items-center justify-between mb-2 pr-16">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-950 border ${item.rarityBorder} ${item.rarityColor}`}>
                        {item.rarity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold font-rajdhani uppercase truncate">
                        {item.typeLabel}
                      </span>
                    </div>

                    {/* Real visual canvas display */}
                    <div className="relative group/canvas my-2 overflow-hidden rounded-2xl">
                      <ShopItemVisual item={item} className="h-28 w-full" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl backdrop-blur-[1px] transition-all">
                        <span className="flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-700 px-2.5 py-1 font-display text-[11px] font-black text-cyan-400 shadow-xl">
                          <Eye className="h-3.5 w-3.5" /> INSPECTER
                        </span>
                      </div>
                    </div>

                    <h4 className="font-display text-sm sm:text-base font-black text-white italic tracking-wide mt-1 text-center truncate">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    {unlocked ? (
                      <div className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 py-2 px-3 text-[11px] sm:text-xs font-black text-emerald-400 font-display uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>POSSÉDÉ DANS LE GARAGE</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-0.5 text-amber-400 font-display text-xs sm:text-sm font-black">
                          <Coins className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.cost}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyDirectItem(item);
                          }}
                          className={`rounded-xl px-3 py-1.5 font-display text-[10px] sm:text-xs font-black tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                          }`}
                        >
                          ACHETER
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Item Inspect & Interactive Match Preview Modal */}
      {inspectingItem && (
        <ItemInspectModal
          item={inspectingItem}
          playerProfile={playerProfile}
          onClose={() => setInspectingItem(null)}
          onBuyItem={(item) => handleBuyDirectItem(item)}
          isUnlocked={isItemUnlocked(inspectingItem)}
        />
      )}



      {/* ========================================================================= */}
      {/* LOOT OPENING ANIMATION OVERLAY MODAL                                      */}
      {/* ========================================================================= */}
      {openingDrop && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4" style={{ pointerEvents: 'auto' }}>
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden">
            {/* Background radiant ambient beam */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${openingDrop.glow} 0%, transparent 70%)`,
              }}
            />

            {openingStage === 'shaking' ? (
              <div className="py-14 flex flex-col items-center justify-center relative min-h-[380px] overflow-hidden">
                {/* Rotating cosmic rays background */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none"
                >
                  <div className="h-96 w-96 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-transparent filter blur-2xl" />
                </motion.div>

                {/* Expanding shockwave rings */}
                <div className="absolute h-44 w-44 rounded-full border-2 border-amber-400/60 animate-ping opacity-75 pointer-events-none" />
                <div className="absolute h-64 w-64 rounded-full border border-yellow-300/40 animate-pulse pointer-events-none" />

                {/* Growing Crate Box ("ça s'agrandit !") */}
                <motion.div
                  initial={{ scale: 0.7, rotate: 0 }}
                  animate={{
                    scale: [0.75, 1.05, 1.35, 1.7, 2.15, 2.7],
                    rotate: [0, -7, 7, -10, 10, 0],
                  }}
                  transition={{
                    duration: 2.1,
                    ease: 'easeInOut',
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  }}
                  className="relative z-10 my-6 flex flex-col items-center"
                >
                  <div className="relative">
                    <img
                      src={openingDrop.image}
                      alt={openingDrop.name}
                      className="h-28 w-28 object-cover rounded-3xl border-2 border-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.9)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -inset-4 rounded-3xl bg-amber-400/40 blur-lg -z-10 animate-pulse" />
                  </div>
                </motion.div>

                {/* Progress indicator */}
                <div className="relative z-10 mt-8 flex flex-col items-center">
                  <div className="h-3 w-48 rounded-full bg-slate-950 overflow-hidden border border-amber-500/40 p-0.5 shadow-inner">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.1, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full"
                    />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-black italic tracking-wide text-amber-300 mt-4 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    💥 LA CAISSE S'AGRANDIT ET EXPLOSE !
                  </h3>
                  <p className="text-xs text-amber-400/90 font-rajdhani font-bold mt-0.5 tracking-wider uppercase">
                    OBTENTION DE VOTRE OBJET DE COLLECTION...
                  </p>
                </div>
              </div>
            ) : wonItem ? (
              <motion.div
                initial={{ scale: 0.2, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="py-4 flex flex-col items-center relative z-10"
              >
                {/* Sunburst background rays */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                  className="absolute -inset-10 flex items-center justify-center opacity-30 pointer-events-none"
                >
                  <div className="h-[400px] w-[400px] rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-amber-500/30 filter blur-3xl" />
                </motion.div>

                {/* Rarity Tag */}
                <div className="relative z-10 mb-2">
                  <span className={`text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-slate-950 border ${wonItem.rarityBorder} ${wonItem.rarityColor} shadow-lg`}>
                    {wonItem.rarity.toUpperCase()} • {wonItem.typeLabel.toUpperCase()}
                  </span>
                </div>

                {/* Interactive 2D Visual Canvas for the item won */}
                <div className="relative z-10 my-3 w-full max-w-xs overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 p-3 shadow-2xl">
                  <ShopItemVisual item={wonItem} className="h-36 w-full" />
                </div>

                {/* Item Name */}
                <h3 className="relative z-10 font-display text-2xl sm:text-3xl font-black italic text-white tracking-wide mt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {wonItem.name}
                </h3>

                {/* Status badge: Added to garage & marked in shop */}
                <div className="relative z-10 mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 px-4 py-1.5 text-xs font-bold font-rajdhani text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>AJOUTÉ AU GARAGE & MARQUÉ COMME POSSÉDÉ !</span>
                </div>

                <p className="relative z-10 text-xs text-slate-400 font-rajdhani mt-3 max-w-sm text-center">
                  Félicitations ! Cet objet est maintenant disponible dans votre <strong className="text-pink-400 font-bold">Garage</strong> et est affiché comme <strong className="text-emerald-400 font-bold">DÉJÀ ACHETÉ</strong> dans la boutique.
                </p>

                {/* Action Buttons */}
                <div className="relative z-10 mt-6 flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => {
                      closeRevealModal();
                      onSelectTab?.('garage');
                    }}
                    className="flex-1 rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-3 font-display text-xs font-black tracking-wide text-white border border-slate-700 hover:border-pink-500/50 shadow-lg transition-all cursor-pointer"
                  >
                    VOIR LE GARAGE
                  </button>
                  <button
                    onClick={closeRevealModal}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-5 py-3 font-display text-xs font-black tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    CONTINUER
                  </button>
                </div>
              </motion.div>
            ) : (
              // Fallback si wonItem n'est pas encore prêt ou erreur
              <div className="py-14 flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-amber-300 font-display text-lg font-black">Chargement de votre butin...</p>
                <button
                  onClick={closeRevealModal}
                  className="mt-6 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
