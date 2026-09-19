import React from 'react';
import { X, Gamepad2, Zap, Sparkles, Flame, Shield, ArrowUp } from 'lucide-react';

interface ControlsGuideModalProps {
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ onClose }) => {
  return (
    <div id="controls-guide-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 text-blue-400" />
            <h2 className="font-display text-2xl font-black italic tracking-wide text-white">
              GUIDE DU JEU & ASTUCES SIDESWIPE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 flex flex-col gap-6">
          {/* Controls section */}
          <div>
            <h3 className="font-display text-sm font-bold tracking-wider text-cyan-400 uppercase">
              Commandes Clavier / Tactile
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5">
                <span className="font-display text-xs font-bold text-blue-400">JOUEUR 1 (CLAVIER)</span>
                <ul className="mt-2 space-y-1.5 font-rajdhani text-sm text-slate-300">
                  <li><span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">Z Q S D</span> ou <span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">Flèches</span> : Diriger / Orienter en l'air</li>
                  <li><span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">Espace</span> : Sauter (réappuyer en l'air pour Flip)</li>
                  <li><span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">Shift</span> ou <span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">J</span> : Boost Fusée</li>
                  <li><span className="font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">K</span> : Demi-tour / Air Roll</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3.5">
                <span className="font-display text-xs font-bold text-orange-400">JOUEUR 2 (MODE 2 JOUEURS LOCAL)</span>
                <ul className="mt-2 space-y-1.5 font-rajdhani text-sm text-slate-300">
                  <li><span className="font-mono text-orange-300 bg-slate-800 px-1.5 py-0.5 rounded">I J K L</span> : Diriger / Orienter</li>
                  <li><span className="font-mono text-orange-300 bg-slate-800 px-1.5 py-0.5 rounded">O</span> : Sauter & Flip</li>
                  <li><span className="font-mono text-orange-300 bg-slate-800 px-1.5 py-0.5 rounded">P</span> : Boost Fusée</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sideswipe signature mechanics */}
          <div>
            <h3 className="font-display text-sm font-bold tracking-wider text-yellow-400 uppercase">
              Mécaniques Emblématiques de Sideswipe
            </h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-800/30 p-3">
                <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-bold text-white">Ball Flip Reset</h4>
                  <p className="font-rajdhani text-xs text-slate-300">
                    Touchez la balle avec le ventre de la voiture (les 4 roues) en plein vol pour récupérer instantanément votre saut / flip sans avoir à atterrir au sol !
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-red-900/40 bg-red-950/20 p-3">
                <Flame className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-bold text-red-300">Tir Puissant Rouge (Red Power Shot)</h4>
                  <p className="font-rajdhani text-xs text-slate-300">
                    Frappez la balle avec le pare-choc avant (le nez de l'Octane) tout en déclenchant un flip vers l'avant. La balle part à très grande vitesse avec une traînée écarlate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-purple-900/40 bg-purple-950/20 p-3">
                <Zap className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-bold text-purple-300">Purple Pop Shot</h4>
                  <p className="font-rajdhani text-xs text-slate-300">
                    Tapez la balle avec les roues de la voiture tout en effectuant un dodge vers l'arrière ou vers le haut pour lober le gardien dans une onde de choc violette.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-3">
                <Shield className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display text-sm font-bold text-amber-300">Buts Élevés & La Règle des 0 Seconde</h4>
                  <p className="font-rajdhani text-xs text-slate-300">
                    Les cages sont surélevées ! À 0:00 au chronomètre, le match ne se termine pas tant que la balle est maintenue en l'air. Dès qu'elle touche le sol, le match s'arrête !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-display text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            COMPRIS, C'EST PARTI !
          </button>
        </div>
      </div>
    </div>
  );
};
