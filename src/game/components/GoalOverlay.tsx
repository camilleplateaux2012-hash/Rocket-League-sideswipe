import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoalEvent, Team } from '../types/game';
import { Trophy, Zap, Flame, RotateCcw } from 'lucide-react';

interface GoalOverlayProps {
  goalEvent: GoalEvent | null;
  countdown: number;
  matchWinner: Team | null;
  onRestartMatch: () => void;
  onReturnToMenu: () => void;
  isRanked?: boolean;
  rankedResult?: {
    mmrChange: number;
    newMmr: number;
    won: boolean;
    winStreak?: number;
    promoted?: boolean;
    newRankName?: string;
  } | null;
}

export const GoalOverlay: React.FC<GoalOverlayProps> = ({
  goalEvent,
  countdown,
  matchWinner,
  onRestartMatch,
  onReturnToMenu,
  isRanked = false,
  rankedResult = null,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none">
      {/* 1. Countdown (3, 2, 1, GO!) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {countdown > 0 && !goalEvent && !matchWinner && (
              <motion.div
                key={countdown}
                initial={{ scale: 2.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="relative">
                  <span className="font-display text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.9)]">
                    {countdown}
                  </span>
                </div>
                <span className="font-rajdhani text-sm font-bold tracking-widest text-cyan-300 uppercase">
                  Préparez-vous
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Goal Scored Banner */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full">
        <AnimatePresence>
          {goalEvent && !matchWinner && (
            <motion.div
              initial={{ y: -80, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 14 }}
              className="flex flex-col items-center"
            >
            <div
              className={`rounded-2xl border-2 px-8 py-3.5 shadow-xl backdrop-blur-xl ${
                goalEvent.scoringTeam === 'blue'
                  ? 'border-blue-400 bg-blue-950/90 shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                  : 'border-orange-400 bg-orange-950/90 shadow-[0_0_30px_rgba(249,115,22,0.6)]'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {/* Sleeker BUT text */}
                <h1 className="font-display text-4xl sm:text-5xl font-black italic tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                  BUT !
                </h1>

                {/* Scorer Info */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-display text-2xl font-bold tracking-wide text-white">
                    {goalEvent.scorerName}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                      goalEvent.scoringTeam === 'blue' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {goalEvent.scoringTeam === 'blue' ? 'Équipe Bleue' : 'Équipe Orange'}
                  </span>
                </div>

                {/* Speed & Special Hit Badge */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="font-display text-lg font-bold">
                      {goalEvent.speedKmh} <span className="text-xs text-slate-400 font-semibold">KM/H</span>
                    </span>
                  </div>

                  {goalEvent.specialShot === 'red-power' && (
                    <div className="flex items-center gap-1 rounded-full bg-red-600/40 border border-red-500 px-3 py-0.5 text-xs font-bold text-red-200">
                      <Flame className="h-3.5 w-3.5 text-red-400" />
                      <span>TIR PUISSANT ROUGE</span>
                    </div>
                  )}

                  {goalEvent.specialShot === 'purple-pop' && (
                    <div className="flex items-center gap-1 rounded-full bg-purple-600/40 border border-purple-500 px-3 py-0.5 text-xs font-bold text-purple-200">
                      <Zap className="h-3.5 w-3.5 text-purple-400" />
                      <span>PURPLE POP SHOT</span>
                    </div>
                  )}

                  {goalEvent.specialShot === 'gold-shot' && (
                    <div className="flex items-center gap-1 rounded-full bg-yellow-600/40 border border-yellow-500 px-3 py-0.5 text-xs font-bold text-yellow-200">
                      <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                      <span>GOLD SHOT</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* 3. Match Winner Screen */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {matchWinner && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="pointer-events-auto flex flex-col items-center rounded-3xl border-2 border-slate-700 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl max-w-lg w-full text-center"
            >
            <Trophy className={`h-14 w-14 mb-2 ${matchWinner === 'blue' ? 'text-amber-400' : 'text-orange-400'} animate-bounce`} />

            {isRanked ? (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-black tracking-widest text-amber-300 uppercase font-display mb-2">
                MATCH COMPÉTITIF CLASSÉ
              </span>
            ) : null}

            <h2 className="font-display text-3xl sm:text-4xl font-black italic tracking-wider text-white">
              {matchWinner === 'blue' ? 'VICTOIRE !' : 'DÉFAITE'}
            </h2>
            <p className="mt-1 font-rajdhani text-sm text-slate-300">
              {matchWinner === 'blue'
                ? "Félicitations pour cette belle performance sur le terrain !"
                : "Match disputé jusqu'au bout. Continuez l'entraînement pour rebondir !"}
            </p>

            {/* Section Spécifique Compétition & MMR */}
            {isRanked && rankedResult && (
              <div className="mt-5 w-full rounded-2xl bg-slate-950/80 p-4 border border-slate-800 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs font-bold text-slate-400 uppercase">
                    Ajustement de votre classement
                  </span>
                  <span
                    className={`font-display text-base font-black ${
                      rankedResult.mmrChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {rankedResult.mmrChange > 0 ? `+${rankedResult.mmrChange}` : rankedResult.mmrChange} MMR
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-rajdhani text-slate-300">
                  <span>Nouveau total MMR :</span>
                  <span className="font-bold text-white font-mono text-sm">{rankedResult.newMmr} MMR</span>
                </div>

                {rankedResult.winStreak && rankedResult.winStreak >= 2 ? (
                  <div className="mt-2 text-[11px] font-bold text-emerald-400 font-rajdhani flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                    <span>🔥 Série de victoires en cours : x{rankedResult.winStreak} (+5 MMR bonus actif !)</span>
                  </div>
                ) : null}

                {rankedResult.promoted && rankedResult.newRankName && (
                  <div className="mt-2 text-xs font-black text-amber-300 font-display flex items-center justify-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl animate-pulse">
                    <span>👑 PROMOTION ! NOUVEAU RANG : {rankedResult.newRankName.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                id="btn-rematch"
                onClick={onRestartMatch}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 font-display text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                REJOUER LE MATCH
              </button>
              <button
                id="btn-return-menu"
                onClick={onReturnToMenu}
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-3 font-display text-sm font-bold text-slate-200 transition-colors"
              >
                MENU PRINCIPAL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};
