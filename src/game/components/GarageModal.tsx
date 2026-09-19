import React from 'react';
import { BoostType, CarCustomization, ExplosionType } from '../types/game';
import { X, Sparkles, Flame, Check } from 'lucide-react';

interface GarageModalProps {
  customization: CarCustomization;
  onUpdate: (updated: CarCustomization) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  customization,
  onUpdate,
  onClose,
}) => {
  const bodyColors = [
    { name: 'Bleu Cobalt', value: '#2563eb' },
    { name: 'Rouge Crimson', value: '#dc2626' },
    { name: 'Vert Néon', value: '#16a34a' },
    { name: 'Violet Cyber', value: '#9333ea' },
    { name: 'Or Solaire', value: '#ca8a04' },
    { name: 'Orange Sunset', value: '#ea580c' },
    { name: 'Rose Synthwave', value: '#db2777' },
    { name: 'Noir Carbone', value: '#1e293b' },
  ];

  const accentColors = [
    { name: 'Blanc Titane', value: '#ffffff' },
    { name: 'Cyan Électrique', value: '#38bdf8' },
    { name: 'Jaune Racing', value: '#facc15' },
    { name: 'Rouge Écarlate', value: '#f87171' },
    { name: 'Vert Émeraude', value: '#4ade80' },
  ];

  const boostTypes: Array<{ id: BoostType; label: string; desc: string }> = [
    { id: 'orange-flame', label: 'Flamme Standard', desc: 'Le propulseur classique de Rocket League' },
    { id: 'cyan-hyper', label: 'Hyperdrive Cyan', desc: 'Plasma froid haute vélocité' },
    { id: 'neon-plasma', label: 'Plasma Néon', desc: 'Énergie ionique violette et rose' },
    { id: 'rainbow', label: 'Warp Multicolore', desc: 'Spectre lumineux chromatique' },
  ];

  return (
    <div id="garage-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <h2 className="font-display text-2xl font-black italic tracking-wide text-white">
              GARAGE OCTANE SIDESWIPE
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
          {/* 1. Body Color */}
          <div>
            <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
              Couleur Principale (Carrosserie)
            </label>
            <div className="mt-2.5 grid grid-cols-4 gap-3 sm:grid-cols-8">
              {bodyColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ ...customization, bodyColor: color.value })}
                  className={`group relative flex h-12 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                    customization.bodyColor === color.value
                      ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                      : 'border-transparent hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {customization.bodyColor === color.value && <Check className="h-5 w-5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Decal Accent Color */}
          <div>
            <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
              Couleur des Stickers & Aileron
            </label>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ ...customization, accentColor: color.value })}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                    customization.accentColor === color.value
                      ? 'border-white bg-slate-800 text-white shadow-md'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-slate-600" style={{ backgroundColor: color.value }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Boost Trail */}
          <div>
            <label className="font-display text-xs font-bold tracking-wider text-slate-300 uppercase">
              Traînée de Boost
            </label>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {boostTypes.map((boost) => (
                <button
                  key={boost.id}
                  onClick={() => onUpdate({ ...customization, boostType: boost.id })}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                    customization.boostType === boost.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Flame
                    className={`h-5 w-5 mt-0.5 ${
                      customization.boostType === boost.id ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="font-display text-sm font-bold text-white">{boost.label}</div>
                    <div className="text-xs text-slate-400 font-rajdhani">{boost.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 font-display text-sm font-bold text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            VALIDER ET JOUER
          </button>
        </div>
      </div>
    </div>
  );
};
