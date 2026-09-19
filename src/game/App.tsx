/**
 * Rocket League Sideswipe 2D Arcade Game
 * Built with HTML5 Canvas, Web Audio API, and Tailwind CSS.
 */

import React, { useState, useEffect } from 'react';
import {
  BotDifficulty,
  CarCustomization,
  GameMode,
  MainMenuTab,
  PlayerProfile,
  Team,
  OpponentProfile,
  RankedMatchHistoryItem,
} from './types/game';
import { GameMenu } from './components/GameMenu';
import { GameCanvas } from './components/GameCanvas';
import { GarageScreen } from './components/GarageScreen';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { sound } from './audio/soundEngine';
import { loadPlayerProfile, savePlayerProfile, getRankTier, DEFAULT_PLAYER_PROFILE } from './utils/profileStorage';

const STORAGE_KEY = 'sideswipe_car_customization_v2';

const DEFAULT_CUSTOMIZATION: CarCustomization = {
  carModel: 'octane',
  bodyColor: '#2563eb', // Blue Cobalt
  accentColor: '#38bdf8', // Cyan Electric
  wheelType: 'cristiano',
  wheelColor: '#38bdf8',
  boostType: 'orange-flame', // Default starter boost
  explosionType: 'shockwave',
  selectedDecal: 'none',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'hub' | 'game'>('hub');
  const [mainTab, setMainTab] = useState<MainMenuTab>('home');
  const [gameMode, setGameMode] = useState<GameMode>('vs-bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('pro');
  const [currentOpponent, setCurrentOpponent] = useState<OpponentProfile | null>(null);
  const [rankedResult, setRankedResult] = useState<{
    mmrChange: number;
    newMmr: number;
    won: boolean;
    winStreak?: number;
    promoted?: boolean;
    newRankName?: string;
  } | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Player Profile state (Starts at DEFAULT_PLAYER_PROFILE to avoid SSR hydration mismatches, then loads on mount)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(DEFAULT_PLAYER_PROFILE);

  useEffect(() => {
    setPlayerProfile(loadPlayerProfile());
  }, []);

  const handleUpdatePlayerProfile = (updated: PlayerProfile) => {
    setPlayerProfile(updated);
    savePlayerProfile(updated);
  };

  // Record a goal scored by the player
  const handleRecordGoal = (team: Team) => {
    // Player 1 is always Blue team
    if (team === 'blue') {
      setPlayerProfile((prev) => {
        const oldLevel = Math.floor(prev.xp / 250) + 1;
        const newXp = prev.xp + 50; // +50 XP per goal scored
        const newLevel = Math.floor(newXp / 250) + 1;
        const levelsGained = newLevel - oldLevel;
        const coinBonus = levelsGained * 300;

        const next: PlayerProfile = {
          ...prev,
          goalsScored: prev.goalsScored + 1,
          shots: prev.shots + 1,
          xp: newXp,
          coins: (prev.coins || 0) + coinBonus,
        };
        savePlayerProfile(next);
        return next;
      });
    }
  };

  // Record a save performed by the player
  const handleRecordSave = () => {
    setPlayerProfile((prev) => {
      const oldLevel = Math.floor(prev.xp / 250) + 1;
      const newXp = prev.xp + 40; // +40 XP per save
      const newLevel = Math.floor(newXp / 250) + 1;
      const levelsGained = newLevel - oldLevel;
      const coinBonus = levelsGained * 300;

      const next: PlayerProfile = {
        ...prev,
        saves: prev.saves + 1,
        xp: newXp,
        coins: (prev.coins || 0) + coinBonus,
      };
      savePlayerProfile(next);
      return next;
    });
  };

  // Record match finish (win/loss, overtime, MMR adjustment, XP gain)
  const handleRecordMatchFinish = (result: {
    won: boolean;
    blueScore: number;
    orangeScore: number;
    isOvertime: boolean;
    gameMode: GameMode;
  }) => {
    setPlayerProfile((prev) => {
      // Training mode
      if (result.gameMode === 'training') {
        const oldLevel = Math.floor(prev.xp / 250) + 1;
        const newXp = prev.xp + 30;
        const newLevel = Math.floor(newXp / 250) + 1;
        const levelsGained = newLevel - oldLevel;
        const coinBonus = levelsGained * 300;

        const next: PlayerProfile = {
          ...prev,
          trainingSessions: prev.trainingSessions + 1,
          xp: newXp,
          coins: (prev.coins || 0) + coinBonus,
        };
        savePlayerProfile(next);
        return next;
      }

      const isWin = result.won;
      const isRanked = result.gameMode.startsWith('ranked');
      const earnedXp = isWin ? 160 : 70 + (result.isOvertime ? 30 : 0);

      const oldLevel = Math.floor(prev.xp / 250) + 1;
      const newXp = prev.xp + earnedXp;
      const newLevel = Math.floor(newXp / 250) + 1;
      const levelsGained = newLevel - oldLevel;

      // 300 coins per level gained, plus 100 coins for winning a match!
      const winCoins = isWin ? 100 : 0;
      const coinBonus = (levelsGained * 300) + winCoins;

      let calculatedDelta = isWin ? 25 : -15;
      let newMmr = Math.max(100, prev.mmr + calculatedDelta);
      const newWinStreak = isWin ? (prev.winStreak || 0) + 1 : 0;
      let isPromoted = false;
      let newRankName = '';
      let newHistory = prev.rankedHistory || [];

      if (isRanked) {
        const streakBonus = isWin && (prev.winStreak || 0) >= 2 ? 6 : 0;
        const overtimeBonus = isWin && result.isOvertime ? 4 : 0;
        const baseDelta = isWin ? 24 : -14;
        calculatedDelta = isWin ? baseDelta + streakBonus + overtimeBonus : baseDelta;
        newMmr = Math.max(100, prev.mmr + calculatedDelta);

        const oldTier = getRankTier(prev.mmr);
        const newTier = getRankTier(newMmr);
        isPromoted = newTier.name !== oldTier.name || (newMmr > prev.mmr && newTier.division !== oldTier.division);
        newRankName = `${newTier.name} ${newTier.division}`;

        const historyItem: RankedMatchHistoryItem = {
          id: `match_${Date.now()}`,
          timestamp: Date.now(),
          modeName:
            result.gameMode === 'ranked-hoops'
              ? 'Hoops Dunk Classé'
              : result.gameMode === 'ranked-overdrive'
              ? 'Turbo Overdrive'
              : 'Duel Classé 1v1',
          opponentName: currentOpponent?.name || 'Adversaire',
          opponentAvatar: currentOpponent?.avatarIcon || 'swords',
          opponentAvatarColor: currentOpponent?.avatarColor || '#ea580c',
          opponentTitle: currentOpponent?.title || 'Pilote',
          opponentMmr: currentOpponent?.mmr || prev.mmr,
          isBot: currentOpponent?.isBot ?? true,
          playerScore: result.blueScore,
          opponentScore: result.orangeScore,
          won: isWin,
          mmrChange: calculatedDelta,
          newMmr,
        };

        newHistory = [historyItem, ...(prev.rankedHistory || [])].slice(0, 25);

        setRankedResult({
          mmrChange: calculatedDelta,
          newMmr,
          won: isWin,
          winStreak: newWinStreak,
          promoted: isPromoted,
          newRankName: isPromoted ? newRankName : undefined,
        });
      }

      const next: PlayerProfile = {
        ...prev,
        matchesPlayed: prev.matchesPlayed + 1,
        matchesWon: isWin ? prev.matchesWon + 1 : prev.matchesWon,
        matchesLost: !isWin ? prev.matchesLost + 1 : prev.matchesLost,
        overtimeWins: isWin && result.isOvertime ? prev.overtimeWins + 1 : prev.overtimeWins,
        xp: newXp,
        coins: (prev.coins || 0) + coinBonus,
        mmr: isRanked ? newMmr : prev.mmr,
        highestMmr: Math.max(prev.highestMmr || prev.mmr, isRanked ? newMmr : prev.mmr),
        winStreak: isRanked ? newWinStreak : prev.winStreak,
        rankedMatches: (prev.rankedMatches || 0) + (isRanked ? 1 : 0),
        rankedWins: (prev.rankedWins || 0) + (isRanked && isWin ? 1 : 0),
        rankedHistory: newHistory,
      };

      savePlayerProfile(next);
      return next;
    });
  };

  // Car Customization state with local storage persistence (initialized with defaults to prevent SSR hydration mismatches)
  const [customization, setCustomization] = useState<CarCustomization>(DEFAULT_CUSTOMIZATION);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomization({ ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateCustomization = (updated: CarCustomization) => {
    setCustomization(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleStartMatch = (mode: GameMode, diff: BotDifficulty) => {
    setGameMode(mode);
    setBotDifficulty(diff);
    setCurrentOpponent(null);
    setRankedResult(null);
    setCurrentScreen('game');
  };

  const handleStartCompetitiveMatch = (mode: GameMode, opponent: OpponentProfile) => {
    setGameMode(mode);
    setBotDifficulty(opponent.botDifficulty);
    setCurrentOpponent(opponent);
    setRankedResult(null);
    setCurrentScreen('game');
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  return (
    <main className={`fixed inset-0 h-[100dvh] w-full bg-slate-950 font-rajdhani text-white select-none ${currentScreen === 'game' ? 'overflow-hidden touch-none' : 'overflow-y-auto'}`}>
      {currentScreen === 'hub' && mainTab !== 'garage' && (
        <GameMenu
          activeTab={mainTab}
          onSelectTab={setMainTab}
          onStartMatch={handleStartMatch}
          onStartCompetitiveMatch={handleStartCompetitiveMatch}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          difficulty={botDifficulty}
          onChangeDifficulty={setBotDifficulty}
          carCustomization={customization}
          playerProfile={playerProfile}
          onUpdatePlayerProfile={handleUpdatePlayerProfile}
        />
      )}

      {currentScreen === 'hub' && mainTab === 'garage' && (
        <GarageScreen
          customization={customization}
          onUpdate={handleUpdateCustomization}
          onBackToMenu={() => setMainTab('home')}
          onStartMatch={handleStartMatch}
          onSelectTab={setMainTab}
          onOpenGuide={() => setIsGuideOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          playerProfile={playerProfile}
        />
      )}

      {currentScreen === 'game' && (
        <GameCanvas
          gameMode={gameMode}
          botDifficulty={botDifficulty}
          carCustomization={customization}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenGuide={() => setIsGuideOpen(true)}
          onReturnToMenu={() => {
            setCurrentScreen('hub');
            setMainTab('competition');
          }}
          playerProfile={playerProfile}
          opponentProfile={currentOpponent}
          rankedResult={rankedResult}
          onRecordMatchFinish={handleRecordMatchFinish}
          onRecordGoal={handleRecordGoal}
          onRecordSave={handleRecordSave}
        />
      )}

      {/* Controls & Mechanics Guide Modal (Accessible from inside the match) */}
      {isGuideOpen && (
        <ControlsGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </main>
  );
}
