import {
  OpponentProfile,
  PlayerProfile,
  PlayerAvatarIcon,
  BotDifficulty,
  CarModel,
  WheelType,
  BoostType,
  ExplosionType,
} from '../types/game';
import { AVAILABLE_TITLES, AVAILABLE_AVATARS, AVAILABLE_AVATAR_COLORS } from '../utils/profileStorage';

const OPPONENT_NAMES = [
  'Vortex_Pilot',
  'ApexStriker',
  'Kylian_RL',
  'ShadowDrifter',
  'PulseRunner',
  'FrenchTouch_99',
  'Skyline_Pro',
  'VoltSpecter',
  'AeroKing',
  'HyperNova_RL',
  'TurboViper',
  'PixelRacer',
  'Zenith_Air',
  'FlashDrift',
  'BlazePhantom',
  'CyberStrike_7',
  'NeonSpeedster',
  'AeroMawkzy',
];

const CAR_MODELS: CarModel[] = ['octane', 'fennec', 'dominus', 'merc', 'porsche', 'corvette'];
const WHEEL_TYPES: WheelType[] = ['cristiano', 'apex', 'zomba', 'astro', 'dieci', 'infinium'];
const BOOST_TYPES: BoostType[] = [
  'orange-flame',
  'cyan-hyper',
  'neon-plasma',
  'rainbow',
  'electric-bolt',
  'crimson-thermal',
  'golden-spark',
  'ion-green',
];
const EXPLOSIONS: ExplosionType[] = ['shockwave', 'solar', 'electro', 'supernova'];

const CAR_COLORS = [
  { body: '#ea580c', accent: '#facc15' }, // Orange / Gold
  { body: '#dc2626', accent: '#fca5a5' }, // Red / Pink
  { body: '#7c3aed', accent: '#c084fc' }, // Purple / Violet
  { body: '#059669', accent: '#6ee7b7' }, // Emerald / Green
  { body: '#e11d48', accent: '#ffe4e6' }, // Crimson
  { body: '#d97706', accent: '#fde68a' }, // Amber
];

/**
 * Generate a realistic competitive opponent based on player MMR.
 * Scales bot difficulty and MMR around the player's rating.
 */
export function generateCompetitiveOpponent(playerMmr: number): OpponentProfile {
  const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
  const title = AVAILABLE_TITLES[Math.floor(Math.random() * AVAILABLE_TITLES.length)];
  const avatarItem = AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
  const colorItem = AVAILABLE_AVATAR_COLORS[Math.floor(Math.random() * AVAILABLE_AVATAR_COLORS.length)];

  // MMR close to player's rating (± 30 points)
  const mmrOffset = Math.floor(Math.random() * 61) - 30;
  const opponentMmr = Math.max(500, playerMmr + mmrOffset);

  // Scaled AI difficulty based on MMR
  let botDifficulty: BotDifficulty = 'novice';
  if (opponentMmr >= 1300) {
    botDifficulty = 'all-star';
  } else if (opponentMmr >= 800) {
    botDifficulty = 'pro';
  }

  const palette = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  const carModel = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
  const wheelType = WHEEL_TYPES[Math.floor(Math.random() * WHEEL_TYPES.length)];
  const boostType = BOOST_TYPES[Math.floor(Math.random() * BOOST_TYPES.length)];
  const explosionType = EXPLOSIONS[Math.floor(Math.random() * EXPLOSIONS.length)];

  const ping = Math.floor(Math.random() * 26) + 18; // 18ms - 44ms

  return {
    name,
    title,
    avatarIcon: avatarItem.id,
    avatarColor: colorItem.value,
    bannerColor: '#9a3412',
    mmr: opponentMmr,
    isBot: true,
    ping,
    botDifficulty,
    carCustomization: {
      carModel,
      bodyColor: palette.body,
      accentColor: palette.accent,
      wheelType,
      wheelColor: '#f1f5f9',
      boostType,
      explosionType,
    },
  };
}

/**
 * BroadcastChannel helper to detect if another tab is actively searching in competitive matchmaking.
 */
export class MatchmakingQueueManager {
  private channel: BroadcastChannel | null = null;
  private myId: string;
  private onPeerFoundCallback: ((peer: OpponentProfile) => void) | null = null;

  constructor() {
    this.myId = 'player_' + Math.random().toString(36).substring(2, 9);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('sideswipe_ranked_matchmaking');
        this.channel.onmessage = this.handleMessage.bind(this);
      }
    } catch (e) {
      console.warn('BroadcastChannel not available, using single-session matchmaking:', e);
    }
  }

  public searchMatch(
    playerProfile: PlayerProfile,
    gameMode: string,
    onPeerFound: (opponent: OpponentProfile) => void
  ) {
    this.onPeerFoundCallback = onPeerFound;

    // Broadcast search to other open tabs
    if (this.channel) {
      this.channel.postMessage({
        type: 'QUEUE_SEARCH',
        senderId: this.myId,
        gameMode,
        profile: playerProfile,
      });
    }
  }

  public cancelSearch() {
    this.onPeerFoundCallback = null;
    if (this.channel) {
      this.channel.postMessage({
        type: 'QUEUE_CANCEL',
        senderId: this.myId,
      });
    }
  }

  private handleMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.senderId === this.myId) return;

    if (data.type === 'QUEUE_SEARCH' && this.onPeerFoundCallback) {
      // Respond to peer that we found each other!
      const peerProfile: PlayerProfile = data.profile;
      const opponent: OpponentProfile = {
        name: peerProfile.username,
        title: peerProfile.title,
        avatarIcon: peerProfile.avatarIcon,
        avatarColor: peerProfile.avatarColor,
        bannerColor: peerProfile.bannerColor,
        mmr: peerProfile.mmr,
        isBot: false, // Real player in another tab!
        ping: 15,
        botDifficulty: 'pro',
        carCustomization: {
          carModel: 'octane',
          bodyColor: '#ea580c',
          accentColor: '#fbbf24',
          wheelType: 'dieci',
          wheelColor: '#ffffff',
          boostType: 'orange-flame',
          explosionType: 'solar',
        },
      };

      if (this.channel) {
        this.channel.postMessage({
          type: 'MATCH_ACK',
          senderId: this.myId,
        });
      }

      this.onPeerFoundCallback(opponent);
      this.onPeerFoundCallback = null;
    }
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
