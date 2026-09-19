import React, { useEffect, useRef, useState } from 'react';
import { ShopItem } from './ShopScreen';
import { PlayerProfile } from '../types/game';
import { sound } from '../audio/soundEngine';
import { Coins, Check, X, Sparkles, Lock, Volume2, Play } from 'lucide-react';
import { renderAvatarIcon } from './ProfileScreen';
import { PlayerAvatarIcon } from '../types/game';

interface ItemInspectModalProps {
  item: ShopItem | null;
  playerProfile: PlayerProfile;
  onClose: () => void;
  onBuyItem: (item: ShopItem) => void;
  isUnlocked: boolean;
}

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  playerProfile,
  onClose,
  onBuyItem,
  isUnlocked,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [goalExplosionTriggerCount, setGoalExplosionTriggerCount] = useState(0);
  const [isPlayingBoost, setIsPlayingBoost] = useState(false);

  useEffect(() => {
    if (!item) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;
    let explosionTime = 0;
    let isExploding = false;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Arena Grid Background
      ctx.save();
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.2);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subgrid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      const cx = w / 2;
      const cy = h / 2 + 10;

      // Draw item-specific interactive stage
      if (item.type === 'car' || item.type === 'decal') {
        drawStageCar(ctx, cx, cy, item.id, item.type === 'decal' ? item.id : 'none', time);
      } else if (item.type === 'wheels') {
        drawStageWheel(ctx, cx, cy, item.id, time);
      } else if (item.type === 'boost') {
        drawStageBoost(ctx, cx, cy, item.id, time, isPlayingBoost);
      } else if (item.type === 'explosion') {
        drawStageExplosion(ctx, w, h, item.id, time, goalExplosionTriggerCount);
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [item, goalExplosionTriggerCount, isPlayingBoost]);

  if (!item) return null;

  const canAfford = playerProfile.coins >= item.cost;

  const handleTriggerGoalExplosion = () => {
    setGoalExplosionTriggerCount((prev) => prev + 1);
    sound.playGoalExplosion();
  };

  const handleTestBoost = () => {
    setIsPlayingBoost(true);
    sound.startBoost();
    setTimeout(() => {
      sound.stopBoost();
      setIsPlayingBoost(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-left">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider ${item.rarityBg} ${item.rarityColor} border ${item.rarityBorder}`}
            >
              {item.rarity}
            </span>
            <span className="font-display text-xs font-bold uppercase text-slate-400">
              {item.typeLabel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Main Visual Stage (Canvas / Interactive Preview) */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="relative flex h-72 sm:h-80 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
              {item.type === 'avatarIcon' || item.type === 'banner' ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  {item.type === 'avatarIcon' ? (
                    <div
                      className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 shadow-2xl"
                      style={{
                        borderColor: item.glowColor,
                        background: `radial-gradient(circle, ${item.glowColor}55 0%, rgba(15,23,42,0.95) 100%)`,
                        boxShadow: `0 0 30px ${item.glowColor}`,
                      }}
                    >
                      <div className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                        {renderAvatarIcon(item.id as PlayerAvatarIcon, 'h-16 w-16')}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="h-24 w-80 rounded-2xl border-2 shadow-2xl flex items-center justify-center font-display text-xl font-black text-white italic tracking-wider"
                      style={{
                        borderColor: item.glowColor,
                        background: `linear-gradient(135deg, ${item.id} 0%, rgba(15,23,42,0.95) 100%)`,
                        boxShadow: `0 0 25px ${item.glowColor}`,
                      }}
                    >
                      {item.name}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 font-rajdhani">
                    Aperçu sur la carte du joueur
                  </span>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={350}
                  className="h-full w-full object-contain"
                />
              )}

              {/* Action overlays on stage */}
              {item.type === 'explosion' && (
                <button
                  onClick={handleTriggerGoalExplosion}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 font-display text-xs font-black text-white shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>💥 DÉCLENCHER L'EXPLOSION EN MATCH</span>
                </button>
              )}

              {item.type === 'boost' && (
                <button
                  onClick={handleTestBoost}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-display text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>TESTER LE BOOST</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-rajdhani flex items-center justify-between px-1">
              <span>Rendu haute-fidélité 2D/3D Sideswipe</span>
              <span>Tournez les yeux pour observer tous les détails !</span>
            </div>
          </div>

          {/* Right Details Panel */}
          <div className="md:col-span-5 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase">
                  {item.name}
                </h2>
                <p className="text-xs text-slate-400 font-rajdhani mt-1">
                  {getItemDescription(item)}
                </p>
              </div>

              {/* Rarity and Specs Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Rareté :</span>
                  <span className={`font-black ${item.rarityColor}`}>{item.rarity}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Catégorie :</span>
                  <span className="text-white font-bold">{item.typeLabel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Statut de possession :</span>
                  <span className={isUnlocked ? 'text-emerald-400 font-black' : 'text-amber-400 font-bold'}>
                    {isUnlocked ? '✓ Débloqué dans le Garage' : '🔒 Non possédé'}
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                <span className="text-xs text-slate-400 font-bold uppercase">Prix en Boutique</span>
                <div className="flex items-center gap-2">
                  <Coins className="h-6 w-6 text-amber-400" />
                  <span className="font-display text-2xl font-black text-white">
                    {item.cost}
                  </span>
                  <span className="text-xs text-amber-400 font-bold">Pièces</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-3">
              {isUnlocked ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-3.5 text-center font-display text-sm font-black text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>CET OBJET EST DÉJÀ DANS VOTRE INVENTAIRE</span>
                  </div>
                </div>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    onBuyItem(item);
                    onClose();
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl p-4 font-display text-sm font-black uppercase tracking-wider transition-all shadow-xl ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/25 hover:brightness-110 active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {canAfford ? (
                    <>
                      <Coins className="h-5 w-5 text-slate-950" />
                      <span>ACHETER POUR {item.cost} PIÈCES</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>SOLDE INSUFFISANT ({playerProfile.coins} / {item.cost} 🪙)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STAGE DRAWING HELPERS ---

function getItemDescription(item: ShopItem): string {
  switch (item.type) {
    case 'car':
      return `Modèle officiel Sideswipe avec châssis aérodynamique haute précision, suspension réactive et hitbox équilibrée pour les aerial resets.`;
    case 'wheels':
      return `Jantes de compétition haute adhérence en alliage forgé avec finition brillante et gravure spéciale Sideswipe.`;
    case 'boost':
      return `Propulseur de puissance produisant une traînée de particules lumineuses uniques et un son d'accélération distinctif.`;
    case 'decal':
      return `Motif de finition et sticker personnalisé s'appliquant sur la carrosserie de tous vos véhicules débloqués.`;
    case 'explosion':
      return `Célébration spectaculaire de but déclenchant une onde d'énergie gigantesque et un effet visuel saisissant dans l'arène.`;
    case 'avatarIcon':
      return `Insigne d'avatar exclusif à afficher fièrement sur votre carte de joueur et dans le tableau des scores.`;
    case 'banner':
      return `Finition de bannière de profil illuminant votre nom lors de chaque but et fin de match.`;
    default:
      return `Élément de personnalisation exclusif Sideswipe.`;
  }
}

function drawStageCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  carId: string,
  decalId: string,
  time: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Showroom Metallic Platform with Glowing Ring
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 50, 150, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 50, 150, 28, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Car Vector dimensions
  const halfW = 95;
  const halfH = 42;
  let bodyColor = '#06b6d4';
  let accentColor = '#38bdf8';
  let spoilerType = 'standard';

  if (carId === 'dominus') {
    bodyColor = '#ef4444';
    accentColor = '#f97316';
    spoilerType = 'lip';
  } else if (carId === 'merc') {
    bodyColor = '#3b82f6';
    accentColor = '#60a5fa';
    spoilerType = 'none';
  } else if (carId === 'fennec') {
    bodyColor = '#a855f7';
    accentColor = '#c084fc';
    spoilerType = 'roof';
  } else if (carId === 'porsche') {
    bodyColor = '#ec4899';
    accentColor = '#f472b6';
    spoilerType = 'ducktail';
  } else if (carId === 'corvette') {
    bodyColor = '#eab308';
    accentColor = '#fde047';
    spoilerType = 'gt';
  }

  // Slight suspension bounce
  const bounceY = Math.sin(time * 3) * 2.5;
  ctx.translate(0, bounceY);

  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 24;

  // Car Body Base according to car model
  ctx.beginPath();
  switch (carId) {
    case 'fennec':
      // Rally hatchback
      ctx.moveTo(-halfW * 0.9, halfH * 0.65);
      ctx.lineTo(halfW * 0.88, halfH * 0.65);
      ctx.lineTo(halfW * 0.98, halfH * 0.35);
      ctx.lineTo(halfW * 0.98, -halfH * 0.1);
      ctx.lineTo(halfW * 0.45, -halfH * 0.25);
      ctx.lineTo(halfW * 0.15, -halfH * 0.95);
      ctx.lineTo(-halfW * 0.75, -halfH * 0.95);
      ctx.lineTo(-halfW * 0.95, -halfH * 0.2);
      break;

    case 'dominus':
      // Low muscle car
      ctx.moveTo(-halfW * 0.96, halfH * 0.65);
      ctx.lineTo(halfW * 0.96, halfH * 0.65);
      ctx.lineTo(halfW * 1.05, halfH * 0.25);
      ctx.lineTo(halfW * 1.02, -halfH * 0.05);
      ctx.lineTo(halfW * 0.25, -halfH * 0.12);
      ctx.lineTo(-halfW * 0.05, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.55, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.88, -halfH * 0.15);
      ctx.lineTo(-halfW * 0.98, halfH * 0.1);
      break;

    case 'merc':
      // Heavy van
      ctx.moveTo(-halfW * 0.92, halfH * 0.7);
      ctx.lineTo(halfW * 0.92, halfH * 0.7);
      ctx.lineTo(halfW * 0.98, halfH * 0.45);
      ctx.lineTo(halfW * 0.98, -halfH * 0.2);
      ctx.lineTo(halfW * 0.55, -halfH * 0.35);
      ctx.lineTo(halfW * 0.35, -halfH * 1.05);
      ctx.lineTo(-halfW * 0.88, -halfH * 1.05);
      ctx.lineTo(-halfW * 0.96, -halfH * 0.2);
      break;

    case 'porsche':
      // Porsche 911 flyline
      ctx.moveTo(-halfW * 0.9, halfH * 0.65);
      ctx.lineTo(halfW * 0.88, halfH * 0.65);
      ctx.lineTo(halfW * 1.02, halfH * 0.38);
      ctx.lineTo(halfW * 1.0, halfH * 0.1);
      ctx.lineTo(halfW * 0.45, -halfH * 0.2);
      ctx.lineTo(halfW * 0.1, -halfH * 0.82);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.82, -halfH * 0.3);
      ctx.lineTo(-halfW * 0.96, halfH * 0.2);
      break;

    case 'corvette':
      // Supercar wedge
      ctx.moveTo(-halfW * 0.95, halfH * 0.65);
      ctx.lineTo(halfW * 0.92, halfH * 0.65);
      ctx.lineTo(halfW * 1.08, halfH * 0.32);
      ctx.lineTo(halfW * 1.05, halfH * 0.05);
      ctx.lineTo(halfW * 0.75, -halfH * 0.15);
      ctx.lineTo(halfW * 0.35, -halfH * 0.28);
      ctx.lineTo(halfW * 0.08, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.42, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.82, -halfH * 0.22);
      ctx.lineTo(-halfW * 0.98, -halfH * 0.08);
      break;

    case 'octane':
    default:
      // Octane dune buggy
      ctx.moveTo(-halfW * 0.92, halfH * 0.65);
      ctx.lineTo(halfW * 0.85, halfH * 0.65);
      ctx.lineTo(halfW * 0.98, halfH * 0.35);
      ctx.lineTo(halfW * 0.94, halfH * 0.05);
      ctx.lineTo(halfW * 0.3, -halfH * 0.22);
      ctx.lineTo(halfW * 0.05, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.55, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.88, -halfH * 0.15);
      break;
  }
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Glass Windshield
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  if (carId === 'merc') {
    ctx.moveTo(halfW * 0.32, -halfH * 0.35);
    ctx.lineTo(halfW * 0.22, -halfH * 0.95);
    ctx.lineTo(-halfW * 0.3, -halfH * 0.95);
    ctx.lineTo(-halfW * 0.2, -halfH * 0.35);
  } else {
    ctx.moveTo(halfW * 0.28, -halfH * 0.2);
    ctx.lineTo(halfW * 0.08, -halfH * 0.7);
    ctx.lineTo(-halfW * 0.3, -halfH * 0.7);
    ctx.lineTo(-halfW * 0.22, -halfH * 0.2);
  }
  ctx.closePath();
  ctx.fill();

  // Decal overlay if inspecting decal
  if (decalId !== 'none') {
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-halfW * 0.5, -halfH * 0.3, halfW * 0.8, 12);
  }

  // Spoilers
  ctx.fillStyle = accentColor;
  if (spoilerType === 'gt') {
    ctx.fillRect(-halfW * 0.95, -halfH * 1.25, 24, 6);
    ctx.fillRect(-halfW * 0.82, -halfH * 1.25, 5, 18);
  } else if (spoilerType === 'roof') {
    ctx.fillRect(-halfW * 0.82, -halfH * 1.15, 20, 5);
  } else if (spoilerType === 'ducktail') {
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.75, -halfH * 0.3);
    ctx.lineTo(-halfW * 0.95, -halfH * 0.7);
    ctx.lineTo(-halfW * 0.7, -halfH * 0.3);
    ctx.fill();
  } else if (spoilerType === 'standard') {
    ctx.fillRect(-halfW * 0.85, -halfH * 1.1, 20, 4);
    ctx.fillRect(-halfW * 0.75, -halfH * 1.1, 4, 12);
  }

  // Headlights
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 18;
  ctx.fillRect(halfW * 0.85, -halfH * 0.1, 14, 9);

  // Large Wheels
  ctx.shadowBlur = 0;
  drawStageWheelDisc(ctx, -halfW * 0.58, halfH * 0.55, time);
  drawStageWheelDisc(ctx, halfW * 0.58, halfH * 0.55, time);

  ctx.restore();
}

function drawStageWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, wheelId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const radius = 75;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, radius + 10, radius + 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rubber Tire
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Rim Glow
  let rimColor = '#38bdf8';
  if (wheelId === 'dieci') rimColor = '#facc15';
  else if (wheelId === 'apex') rimColor = '#ec4899';
  else if (wheelId === 'zomba') rimColor = '#a855f7';
  else if (wheelId === 'infinium') rimColor = '#d946ef';

  ctx.shadowColor = rimColor;
  ctx.shadowBlur = 25;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Animated Spokes
  ctx.rotate(time * 2.5);
  const spokes = wheelId === 'dieci' ? 10 : wheelId === 'astro' ? 8 : 5;
  for (let i = 0; i < spokes; i++) {
    ctx.rotate((Math.PI * 2) / spokes);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-3, -radius * 0.65, 6, radius * 0.65);
  }

  ctx.restore();
}

function drawStageWheelDisc(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(time * 4);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.stroke();
  }

  ctx.restore();
}

function drawStageBoost(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boostId: string,
  time: number,
  isPlaying: boolean
) {
  ctx.save();
  ctx.translate(cx - 80, cy);

  // Driving Car
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-50, -20, 100, 40, 12);
  ctx.fill();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Wheels
  drawStageWheelDisc(ctx, -30, 20, time);
  drawStageWheelDisc(ctx, 30, 20, time);

  // Exhaust Stream
  let colors = ['#f97316', '#ef4444', '#facc15'];
  if (boostId === 'cyan-hyper') colors = ['#06b6d4', '#3b82f6', '#67e8f9'];
  else if (boostId === 'ion-green') colors = ['#22c55e', '#10b981', '#4ade80'];
  else if (boostId === 'neon-plasma') colors = ['#a855f7', '#d946ef', '#e879f9'];
  else if (boostId === 'electric-bolt') colors = ['#eab308', '#38bdf8', '#fef08a'];

  const count = isPlaying ? 50 : 25;
  const speed = isPlaying ? 6 : 3;

  for (let i = 0; i < count; i++) {
    const pTime = (time * speed + i * 0.2) % 3;
    const px = -50 - pTime * 50;
    const py = Math.sin(time * 8 + i) * 12;
    const pSize = (1 - pTime / 3) * 20 + 4;
    const col = colors[i % colors.length];

    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 15;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawStageExplosion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  expId: string,
  time: number,
  triggerCount: number
) {
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();

  // Subtle camera shake on trigger
  const blastCycle = (time * 1.5 + triggerCount * 0.5) % 2;
  const shake = blastCycle < 0.3 ? Math.sin(time * 50) * 4 : 0;
  ctx.translate(shake, shake);

  // Metallic Goal Cage Frame
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.strokeRect(cx - 130, cy - 90, 260, 180);

  // Goal Net Mesh with wave vibration
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.15)';
  ctx.lineWidth = 2;
  for (let x = cx - 110; x <= cx + 110; x += 22) {
    const offsetX = Math.sin(yToDist(x, cx) + blastCycle * 10) * (blastCycle < 0.5 ? 4 : 0);
    ctx.beginPath();
    ctx.moveTo(x + offsetX, cy - 90);
    ctx.lineTo(x + offsetX, cy + 90);
    ctx.stroke();
  }
  for (let y = cy - 70; y <= cy + 70; y += 22) {
    ctx.beginPath();
    ctx.moveTo(cx - 130, y);
    ctx.lineTo(cx + 130, y);
    ctx.stroke();
  }

  const blastRadius = blastCycle * 140 + 15;
  const opacity = 1 - blastCycle / 2;

  if (expId === 'solar') {
    // Blazing Sun flare with 360-degree solar fireballs & ember shards
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 45;

    // Solar Prominence Arcs
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 1.5);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, blastRadius * 0.9);
      ctx.stroke();
    }
    ctx.restore();

    // Concentric Thermal Rings
    ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(253, 224, 71, ${opacity * 0.8})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
  } else if (expId === 'electro') {
    // High Voltage Lightning Strike & Arc Sparks
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 45;

    // Branching Lightning to Goal Posts
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 3;
    const posts = [
      { x: cx - 130, y: cy - 90 },
      { x: cx + 130, y: cy - 90 },
      { x: cx - 130, y: cy + 90 },
      { x: cx + 130, y: cy + 90 },
    ];
    posts.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo((cx + p.x) / 2 + Math.random() * 20 - 10, (cy + p.y) / 2 + Math.random() * 20 - 10);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    // Expanding Plasma Shockwave
    ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Core Flash
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (expId === 'supernova') {
    // Cosmic Black Hole Spiral & Supernova Expansion Ring
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 50;

    // Spinning Spiral Galaxy Arms
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * -2.5);
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 30; i++) {
      const a = i * 0.4;
      const d = a * 8;
      ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d, 5, 5);
      ctx.fillRect(-Math.cos(a) * d, -Math.sin(a) * d, 5, 5);
    }
    ctx.restore();

    // Supernova Blast Wave
    ctx.strokeStyle = `rgba(217, 70, 239, ${opacity})`;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Black Hole Event Horizon
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    // Standard Onde de Choc
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 40;

    ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.7})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, blastRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function yToDist(val: number, center: number) {
  return Math.abs(val - center) * 0.05;
}
