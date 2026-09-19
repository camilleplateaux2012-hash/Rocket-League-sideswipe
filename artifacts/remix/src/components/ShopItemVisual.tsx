import React, { useEffect, useRef } from 'react';
import { ShopItem } from './ShopScreen';
import { renderAvatarIcon } from './ProfileScreen';
import { PlayerAvatarIcon } from '../types/game';

interface ShopItemVisualProps {
  item: ShopItem;
  className?: string;
  animate?: boolean;
}

export const ShopItemVisual: React.FC<ShopItemVisualProps> = ({
  item,
  className = 'h-24 w-full',
  animate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background ambient glow matching rarity
      ctx.save();
      const bgGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        5,
        width / 2,
        height / 2,
        width / 1.5
      );
      bgGlow.addColorStop(0, item.glowColor || 'rgba(59,130,246,0.3)');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      const cx = width / 2;
      const cy = height / 2;

      switch (item.type) {
        case 'car':
          drawCarItem(ctx, cx, cy, item.id, time);
          break;
        case 'wheels':
          drawWheelItem(ctx, cx, cy, item.id, time);
          break;
        case 'boost':
          drawBoostItem(ctx, cx, cy, item.id, time);
          break;
        case 'decal':
          drawDecalItem(ctx, cx, cy, item.id, time);
          break;
        case 'explosion':
          drawExplosionItem(ctx, cx, cy, item.id, time);
          break;
        case 'banner':
          drawBannerItem(ctx, width, height, item.id);
          break;
        default:
          break;
      }

      if (animate) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [item, animate]);

  // For avatar icons, render Lucide badge cleanly
  if (item.type === 'avatarIcon') {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-slate-900/80 p-3 shadow-inner border border-slate-700/50 ${className}`}>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg transition-transform hover:scale-105"
          style={{
            borderColor: item.glowColor,
            background: `radial-gradient(circle, ${item.glowColor}44 0%, rgba(15,23,42,0.9) 100%)`,
            boxShadow: `0 0 15px ${item.glowColor}`,
          }}
        >
          <div className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {renderAvatarIcon(item.id as PlayerAvatarIcon, 'h-8 w-8')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950/70 ${className}`}>
      <canvas
        ref={canvasRef}
        width={180}
        height={110}
        className="h-full w-full object-contain"
      />
    </div>
  );
};

// --- DRAWING HELPERS FOR SHOP ITEMS ---

function drawCarItem(ctx: CanvasRenderingContext2D, cx: number, cy: number, carId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy + 4);

  // Showroom shadow platform with animated glow ring
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 58, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const halfW = 46;
  const halfH = 20;

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

  // Floating hover bounce effect
  const bounceY = Math.sin(time * 3) * 1.5;
  ctx.translate(0, bounceY);

  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 14;

  // Render specific car body shape
  ctx.beginPath();
  switch (carId) {
    case 'fennec':
      // Compact boxy rally hatchback
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
      // Low wide muscle car with flat long hood
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
      // Massive tall van / truck box
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
      // Sleek sloping Porsche 911 flyline
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
      // Low supercar wedge nose & sharp cuts
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
      // Slanted dune buggy nose
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
  ctx.lineWidth = 2.5;
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

  // Rear Spoilers
  ctx.fillStyle = accentColor;
  if (spoilerType === 'gt') {
    ctx.fillRect(-halfW * 0.95, -halfH * 1.2, 18, 4);
    ctx.fillRect(-halfW * 0.85, -halfH * 1.2, 4, 12);
  } else if (spoilerType === 'roof') {
    ctx.fillRect(-halfW * 0.82, -halfH * 1.1, 14, 4);
  } else if (spoilerType === 'ducktail') {
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.75, -halfH * 0.3);
    ctx.lineTo(-halfW * 0.92, -halfH * 0.65);
    ctx.lineTo(-halfW * 0.7, -halfH * 0.3);
    ctx.fill();
  } else if (spoilerType === 'standard') {
    ctx.fillRect(-halfW * 0.8, -halfH * 1.05, 14, 3);
    ctx.fillRect(-halfW * 0.72, -halfH * 1.05, 3, 8);
  }

  // Headlight Glow
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.fillRect(halfW * 0.82, -1, 7, 5);

  // Wheels
  ctx.shadowBlur = 0;
  drawMiniWheel(ctx, -halfW * 0.58, halfH * 0.65, time);
  drawMiniWheel(ctx, halfW * 0.58, halfH * 0.65, time);

  ctx.restore();
}

function drawMiniWheel(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Tire rubber
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Metallic Rim
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  // Spokes rotation
  ctx.rotate(time * 3);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWheelItem(ctx: CanvasRenderingContext2D, cx: number, cy: number, wheelId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const radius = 32;

  // Outer Tire Tread
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Outer Rim Lip
  let rimGlow = '#38bdf8';
  let spokeColor = '#e2e8f0';

  if (wheelId === 'dieci') {
    rimGlow = '#a855f7';
    spokeColor = '#facc15';
  } else if (wheelId === 'apex') {
    rimGlow = '#ec4899';
    spokeColor = '#f472b6';
  } else if (wheelId === 'zomba') {
    rimGlow = '#eab308';
    spokeColor = '#38bdf8';
  } else if (wheelId === 'infinium') {
    rimGlow = '#d946ef';
    spokeColor = '#f43f5e';
  }

  ctx.shadowColor = rimGlow;
  ctx.shadowBlur = 12;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rimGlow;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Rotating Spokes
  ctx.rotate(time * 2);
  const spokeCount = wheelId === 'dieci' ? 10 : wheelId === 'astro' ? 8 : 5;

  for (let i = 0; i < spokeCount; i++) {
    ctx.rotate((Math.PI * 2) / spokeCount);
    ctx.fillStyle = spokeColor;
    ctx.fillRect(-2, -radius * 0.65, 4, radius * 0.65);

    if (wheelId === 'zomba' || wheelId === 'infinium') {
      ctx.fillStyle = rimGlow;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.45, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center Hub Cap
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rimGlow;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawBoostItem(ctx: CanvasRenderingContext2D, cx: number, cy: number, boostId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Exhaust Nozzle
  ctx.fillStyle = '#334155';
  ctx.fillRect(-50, -10, 20, 20);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(-50, -10, 20, 20);

  let colors = ['#f97316', '#ef4444', '#facc15'];

  if (boostId === 'cyan-hyper') colors = ['#06b6d4', '#3b82f6', '#67e8f9'];
  else if (boostId === 'ion-green') colors = ['#22c55e', '#10b981', '#4ade80'];
  else if (boostId === 'neon-plasma') colors = ['#a855f7', '#d946ef', '#e879f9'];
  else if (boostId === 'electric-bolt') colors = ['#eab308', '#38bdf8', '#fef08a'];
  else if (boostId === 'crimson-thermal') colors = ['#dc2626', '#f97316', '#f43f5e'];
  else if (boostId === 'rainbow') colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#a855f7'];
  else if (boostId === 'golden-spark') colors = ['#f59e0b', '#fbbf24', '#fef08a'];

  // Stream of Particles
  for (let i = 0; i < 25; i++) {
    const pTime = (time * 3 + i * 0.3) % 2;
    const px = -30 + pTime * 45;
    const py = Math.sin(time * 5 + i) * 6;
    const pSize = (1 - pTime / 2) * 12 + 2;
    const col = colors[i % colors.length];

    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawDecalItem(ctx: CanvasRenderingContext2D, cx: number, cy: number, decalId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy + 2);

  // Base Car Silhouette
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-45, -16, 90, 32, 10);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Decal Graphics
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 8;

  if (decalId === 'stripes') {
    ctx.fillRect(-35, -14, 70, 6);
    ctx.fillRect(-35, -4, 70, 6);
  } else if (decalId === 'flames') {
    ctx.beginPath();
    ctx.moveTo(25, -10);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-35, 10);
    ctx.lineTo(25, 10);
    ctx.closePath();
    ctx.fill();
  } else if (decalId === 'lightning') {
    ctx.beginPath();
    ctx.moveTo(30, -12);
    ctx.lineTo(5, 2);
    ctx.lineTo(12, 2);
    ctx.lineTo(-30, 14);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
  } else if (decalId === 'tribal') {
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 1.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();
  } else if (decalId === 'stars') {
    for (let i = 0; i < 5; i++) {
      const sx = -30 + i * 15;
      const sy = Math.sin(i * 2 + time * 3) * 6;
      ctx.fillRect(sx, sy, 5, 5);
    }
  }

  ctx.restore();
}

function drawExplosionItem(ctx: CanvasRenderingContext2D, cx: number, cy: number, expId: string, time: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Metallic Goal Frame
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.strokeRect(-45, -28, 90, 56);

  // Goal net mesh
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1;
  for (let x = -35; x <= 35; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, -28);
    ctx.lineTo(x, 28);
    ctx.stroke();
  }
  for (let y = -20; y <= 20; y += 10) {
    ctx.beginPath();
    ctx.moveTo(-45, y);
    ctx.lineTo(45, y);
    ctx.stroke();
  }

  const loop = (time * 1.8) % 2;

  if (expId === 'solar') {
    // Blazing Solar Fireball & Prominence Arcs
    const r = 8 + loop * 20;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 22;

    // Solar Rays
    ctx.save();
    ctx.rotate(time * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, r * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    // Solar Expansion Ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Hot Core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (expId === 'electro') {
    // Violet Lightning Arcs & Electric Plasma
    const r = 10 + loop * 18;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 22;

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const angle = (time * 4 + i * 1.2) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (r + 8), Math.sin(angle) * (r + 8));
      ctx.stroke();
    }

    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (expId === 'supernova') {
    // Cosmic Black Hole Spiral & Fuchsia Supernova
    const r = 6 + loop * 22;
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 26;

    // Spiral Nebula Arms
    ctx.save();
    ctx.rotate(time * -3);
    ctx.fillStyle = '#ec4899';
    for (let i = 0; i < 12; i++) {
      const a = i * 0.5;
      const dist = a * 3.5;
      ctx.fillRect(Math.cos(a) * dist, Math.sin(a) * dist, 3, 3);
    }
    ctx.restore();

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Event Horizon Core
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Standard Shockwave Energy Burst
    const r = 8 + loop * 18;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBannerItem(ctx: CanvasRenderingContext2D, width: number, height: number, colorHex: string) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colorHex || '#2563eb');
  grad.addColorStop(0.6, '#0f172a');
  grad.addColorStop(1, '#020617');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = colorHex || '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.restore();
}
