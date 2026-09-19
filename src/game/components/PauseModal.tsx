import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, HelpCircle, MessageCircle, Maximize, Minimize, Tv, Eye } from 'lucide-react';
import { CameraFramingMode } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onResetKickoff: () => void;
  onReturnToMenu: () => void;
  onOpenGuide: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  framingMode?: CameraFramingMode;
  onChangeFramingMode?: (mode: CameraFramingMode) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onResetKickoff,
  onReturnToMenu,
  onOpenGuide,
  isMuted,
  onToggleMute,
  isFullscreen = false,
  onToggleFullscreen,
  framingMode = 'auto',
  onChangeFramingMode,
}) => {
  const handleShareWhatsApp = () => {
    const appUrl = 'https://ais-pre-rrqiyz36esmgeidrsworxp-742873452231.europe-west2.run.app';
    const text = `Salut Camille ! Viens tester ce jeu Rocket League Sideswipe 2D jouable directement sur mobile et navigateur : ${appUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div id="pause-modal-backdrop" className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none overflow-y-auto">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-slate-700 bg-slate-900/95 p-5 sm:p-6 shadow-2xl my-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-black italic tracking-wider text-white">
          PARTIE EN PAUSE
        </h2>
        <p className="mt-1 font-rajdhani text-xs sm:text-sm text-slate-400 text-center">
          Affichage adaptatif & options d'écran
        </p>

        {/* Display & Screen Adaptation Options */}
        <div className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display text-xs font-bold text-slate-300">
              <Tv className="h-3.5 w-3.5 text-cyan-400" />
              MODE D'ÉCRAN
            </span>
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 font-display text-[10px] font-bold text-cyan-300 hover:bg-cyan-900/60 active:scale-95"
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="h-3 w-3 text-cyan-400" />
                    FENÊTRÉ
                  </>
                ) : (
                  <>
                    <Maximize className="h-3 w-3 text-cyan-400" />
                    PLEIN ÉCRAN
                  </>
                )}
              </button>
            )}
          </div>

          {onChangeFramingMode && (
            <div className="mt-1 flex flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <Eye className="h-3 w-3 text-cyan-400" />
                Cadrage Caméra :
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['auto', 'wide', 'action'] as CameraFramingMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChangeFramingMode(mode)}
                    className={`rounded-lg py-1 text-center font-display text-[10px] font-bold transition-all ${
                      framingMode === mode
                        ? 'border border-cyan-400 bg-cyan-600/30 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'auto' ? 'Auto Adapt' : mode === 'wide' ? 'Stade Large' : 'Action 1v1'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex w-full flex-col gap-2 sm:gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 sm:py-3 font-display text-sm font-bold text-white shadow-lg transition-transform hover:scale-102 active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            REPRENDRE
          </button>

          <button
            onClick={onResetKickoff}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            RÉINITIALISER L'ENGAGEMENT
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
            COMMANDES DU JEU
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
            {isMuted ? 'ACTIVER LE SON' : 'COUPER LE SON'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-current" />
            PARTAGER SUR WHATSAPP
          </button>

          <button
            onClick={onReturnToMenu}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/30 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-bold text-red-300 transition-colors hover:bg-red-900/50"
          >
            <Home className="h-3.5 w-3.5" />
            QUITTER AU MENU
          </button>
        </div>
      </div>
    </div>
  );
};
