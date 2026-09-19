export interface Vector2D {
  x: number;
  y: number;
}

export type Team = 'blue' | 'orange';
export type GameMode =
  | 'vs-bot'
  | 'local-2p'
  | 'training'
  | 'ranked-1v1'
  | 'ranked-hoops'
  | 'ranked-overdrive';
export type MainMenuTab =
  | 'home'
  | 'play'
  | 'competition'
  | 'profile'
  | 'garage'
  | 'mechanics'
  | 'settings'
  | 'shop';
export type BotDifficulty = 'novice' | 'pro' | 'all-star';
export type CameraFramingMode = 'auto' | 'wide' | 'action';
export type SpecialShotType = 'none' | 'red-power' | 'purple-pop' | 'gold-shot';

export type PlayerAvatarIcon =
  | 'trophy'
  | 'shield'
  | 'zap'
  | 'flame'
  | 'star'
  | 'crown'
  | 'target'
  | 'sparkles'
  | 'rocket'
  | 'swords';

export interface RankedMatchHistoryItem {
  id: string;
  timestamp: number;
  modeName: string;
  opponentName: string;
  opponentAvatar: PlayerAvatarIcon;
  opponentAvatarColor: string;
  opponentTitle: string;
  opponentMmr: number;
  isBot: boolean;
  playerScore: number;
  opponentScore: number;
  won: boolean;
  mmrChange: number;
  newMmr: number;
}

export interface OpponentProfile {
  name: string;
  title: string;
  avatarIcon: PlayerAvatarIcon;
  avatarColor: string;
  bannerColor: string;
  mmr: number;
  isBot: boolean;
  ping: number;
  carCustomization: CarCustomization;
  botDifficulty: BotDifficulty;
}

export interface PlayerProfile {
  username: string;
  title: string;
  avatarIcon: PlayerAvatarIcon;
  avatarColor: string;
  bannerColor: string;
  // Dynamic stats that start at 0 and increase by playing
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  goalsScored: number;
  saves: number;
  shots: number;
  overtimeWins: number;
  trainingSessions: number;
  xp: number;
  mmr: number;
  winStreak?: number;
  highestMmr?: number;
  rankedHistory?: RankedMatchHistoryItem[];
  // Shop & loot system state
  coins?: number;
  unlockedCars?: string[]; // e.g. ['octane']
  unlockedWheels?: string[]; // e.g. ['cristiano']
  unlockedBoosts?: string[]; // e.g. ['orange-flame', 'cyan-hyper']
  unlockedExplosions?: string[]; // e.g. ['shockwave']
  unlockedTitles?: string[]; // e.g. ['Novice de l’Arène']
  unlockedAvatarIcons?: string[]; // e.g. ['trophy']
  unlockedDecals?: string[]; // e.g. ['none', 'stripes']
}
export type CarModel = 'octane' | 'fennec' | 'dominus' | 'merc' | 'porsche' | 'corvette';
export type WheelType = 'cristiano' | 'apex' | 'zomba' | 'astro' | 'dieci' | 'infinium';
export type BoostType =
  | 'orange-flame'
  | 'cyan-hyper'
  | 'neon-plasma'
  | 'rainbow'
  | 'electric-bolt'
  | 'crimson-thermal'
  | 'golden-spark'
  | 'ion-green';
export type ExplosionType = 'shockwave' | 'solar' | 'electro' | 'supernova';

export interface CarCustomization {
  carModel: CarModel;
  bodyColor: string;
  accentColor: string;
  wheelType: WheelType;
  wheelColor: string;
  boostType: BoostType;
  explosionType: ExplosionType;
  selectedDecal?: string; // none, stripes, flames, tribal, lightning, stars
}

export interface Car {
  id: string;
  name: string;
  team: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians, tilt/pitch angle
  facing: 1 | -1; // 1 = facing right, -1 = facing left
  angularVelocity: number;
  width: number;
  height: number;
  
  // State flags
  isGrounded: boolean;
  isOnCeiling: boolean;
  isOnWall: boolean;
  canFlip: boolean;
  jumpCount: number; // 0, 1 (first jump), 2 (flip consumed)
  flipCooldown: number;
  isFlipping: boolean;
  flipProgress: number; // 0..1
  flipDir: Vector2D;

  // Boost
  boost: number; // 0 to 100
  isBoosting: boolean;
  
  // Customization & Visuals
  customization: CarCustomization;
  trailHistory: Array<{ x: number; y: number; angle: number; facing?: 1 | -1; alpha: number }>;
  wheelRotation: number;
  suspensionOffset: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  angularVelocity: number;
  lastHitBy: string | null;
  lastHitTeam: Team | null;
  lastHitSpeed: number; // km/h
  specialShot: SpecialShotType;
  trailHistory: Array<{ x: number; y: number; speed: number; shotType: SpecialShotType }>;
}

export interface GoalNet {
  team: Team; // team that defends this net
  x: number;
  y: number;
  width: number;
  height: number;
  postTopRadius: number;
  postBottomRadius: number;
  mouthX: number;
  depthX: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'boost' | 'spark' | 'smoke' | 'shockwave' | 'confetti' | 'shield-hit' | 'ring';
  rotation?: number;
  growth?: number;
}

export interface MatchStats {
  blueGoals: number;
  orangeGoals: number;
  blueShots: number;
  orangeShots: number;
  blueSaves: number;
  orangeSaves: number;
}

export interface GoalEvent {
  scoringTeam: Team;
  scorerName: string;
  speedKmh: number;
  specialShot: SpecialShotType;
  timer: number;
}

export interface MatchState {
  status: 'menu' | 'countdown' | 'playing' | 'goal-scored' | 'ended' | 'paused';
  blueScore: number;
  orangeScore: number;
  timeRemaining: number; // seconds
  isOvertime: boolean;
  countdownTimer: number; // 3, 2, 1
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  lastGoal: GoalEvent | null;
  stats: MatchStats;
}

export interface InputControls {
  steerX: number; // -1 (left) to +1 (right)
  steerY: number; // -1 (up) to +1 (down)
  jumpPressed: boolean;
  jumpJustPressed: boolean;
  boostPressed: boolean;
  airRollPressed: boolean;
}
