import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { MatchState } from '../types/game';

interface ScoreboardProps {
  matchState: MatchState;
  playerBoost: number;
  playerCanFlip: boolean;
  isTraining?: boolean;
  blueName?: string;
  orangeName?: string;
  isRanked?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  matchState,
  playerBoost,
  playerCanFlip,
  isTraining = false,
  blueName = 'BLEU',
  orangeName = 'ORANGE',
  isRanked = false,
}) => {
  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="game-scoreboard-hud" className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center p-1.5 sm:p-3 select-none pt-[env(safe-area-inset-top)]">
      {/* Top Banner */}
      <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/85 px-3 sm:px-6 py-1 sm:py-2 shadow-2xl backdrop-blur-md">
        {/* Blue Team */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex flex-col items-end max-w-[90px] sm:max-w-[130px] truncate">
            <span className="font-display text-[10px] sm:text-xs font-bold tracking-wider text-blue-400 truncate">
              {blueName}
            </span>
            <span className="font-rajdhani text-[9px] sm:text-xs text-slate-400 hidden sm:block">
              {isRanked ? 'COMPÉTITEUR' : 'DOMICILE'}
            </span>
          </div>
          <div className="flex h-8 w-9 sm:h-10 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600/30 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.5)]">
            <span className="font-display text-lg sm:text-2xl font-black text-white">{matchState.blueScore}</span>
          </div>
        </div>

        {/* Center Clock / Overtime */}
        <div className="flex min-w-[70px] sm:min-w-[90px] flex-col items-center px-1 sm:px-2">
          {isTraining ? (
            <span className="font-display text-xs sm:text-sm font-bold tracking-widest text-emerald-400">FREEPLAY</span>
          ) : matchState.isOvertime ? (
            <div className="flex flex-col items-center animate-pulse">
              <span className="font-display text-[9px] sm:text-xs font-bold text-amber-400 tracking-wider">+ PROLONGATION</span>
              <span className="font-display text-sm sm:text-lg font-black text-amber-300">BUT EN OR</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className={`font-display text-lg sm:text-2xl font-black tracking-wider ${matchState.timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                {formatTime(matchState.timeRemaining)}
              </span>
              <span className="text-[8px] sm:text-[10px] tracking-widest text-slate-400 font-semibold uppercase">
                {isRanked ? 'CLASSÉ' : 'TEMPS'}
              </span>
            </div>
          )}
        </div>

        {/* Orange Team */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex h-8 w-9 sm:h-10 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-orange-600/30 border border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.5)]">
            <span className="font-display text-lg sm:text-2xl font-black text-white">{matchState.orangeScore}</span>
          </div>
          <div className="flex flex-col items-start max-w-[90px] sm:max-w-[130px] truncate">
            <span className="font-display text-[10px] sm:text-xs font-bold tracking-wider text-orange-400 truncate">
              {orangeName}
            </span>
            <span className="font-rajdhani text-[9px] sm:text-xs text-slate-400 hidden sm:block">
              {isRanked ? 'ADVERSAIRE' : 'EXTÉRIEUR'}
            </span>
          </div>
        </div>
      </div>

      {/* Boost Gauge & Flip Reset Status (Integrated Top HUD) */}
      <div className="mt-1 sm:mt-2 flex items-center gap-2">
        {/* Boost Horizontal Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-700/80 bg-slate-950/85 px-2.5 sm:px-3 py-0.5 sm:py-1 shadow-lg backdrop-blur-md">
          <Flame className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${playerBoost > 20 ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="h-2 sm:h-2.5 w-20 sm:w-32 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                playerBoost > 25 ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, playerBoost))}%` }}
            />
          </div>
          <span className="font-display text-[11px] sm:text-xs font-black text-white w-6 sm:w-7 text-right">
            {Math.round(playerBoost)}
          </span>
        </div>

        {/* Flip Reset Indicator */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 transition-all ${
            playerCanFlip
              ? 'border-yellow-400/80 bg-yellow-500/20 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
              : 'border-slate-800 bg-slate-900/60 text-slate-500'
          }`}
        >
          <Sparkles className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${playerCanFlip ? 'animate-bounce text-yellow-300' : 'text-slate-600'}`} />
          <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-wider uppercase">
            {playerCanFlip ? 'Flip Prêt' : 'Flip Utilisé'}
          </span>
        </div>
      </div>
    </div>
  );
};
