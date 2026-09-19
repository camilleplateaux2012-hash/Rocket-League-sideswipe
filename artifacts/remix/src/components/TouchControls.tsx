import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowUp, Flame, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, RotateCw, X, Maximize } from 'lucide-react';
import { InputControls } from '../types/game';

interface TouchControlsProps {
  onControlsChange: (controls: Partial<InputControls>) => void;
  onJumpPress: () => void;
  onJumpRelease: () => void;
  onBoostPress: () => void;
  onBoostRelease: () => void;
  onAirRoll: () => void;
}

const triggerHaptic = (ms = 15) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore unsupported
  }
};

export const TouchControls: React.FC<TouchControlsProps> = ({
  onControlsChange,
  onJumpPress,
  onJumpRelease,
  onBoostPress,
  onBoostRelease,
  onAirRoll,
}) => {
  // Floating Dynamic Joystick State
  const leftZoneRef = useRef<HTMLDivElement>(null);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const [isSteering, setIsSteering] = useState(false);
  const steerPointerIdRef = useRef<number | null>(null);

  // Portrait orientation warning on mobile
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissRotateTip, setDismissRotateTip] = useState(false);

  const maxRadius = 46;

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      setIsPortrait(portrait);
    };

    const handleOrientChange = () => {
      checkOrientation();
      setTimeout(checkOrientation, 150);
      setTimeout(checkOrientation, 350);
      setTimeout(checkOrientation, 600);
    };

    checkOrientation();
    window.addEventListener('resize', handleOrientChange);
    window.addEventListener('orientationchange', handleOrientChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleOrientChange);
    }

    return () => {
      window.removeEventListener('resize', handleOrientChange);
      window.removeEventListener('orientationchange', handleOrientChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleOrientChange);
      }
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      const doc = document.documentElement;
      if (doc.requestFullscreen) {
        await doc.requestFullscreen();
      } else if ((doc as any).webkitRequestFullscreen) {
        await (doc as any).webkitRequestFullscreen();
      }
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // Safe fallback
    }
    setDismissRotateTip(true);
  };

  // Left-Zone Touch Handler (Dynamic Floating Joystick)
  const handleZonePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      // Only capture primary pointer on the left side
      if (steerPointerIdRef.current !== null) return;
      steerPointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }

      setJoystickCenter({ x: e.clientX, y: e.clientY });
      setStickOffset({ x: 0, y: 0 });
      setIsSteering(true);
      triggerHaptic(10);
    },
    []
  );

  const handleZonePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isSteering || steerPointerIdRef.current !== e.pointerId || !joystickCenter) return;
      e.preventDefault();

      const dx = e.clientX - joystickCenter.x;
      const dy = e.clientY - joystickCenter.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxRadius);

      const nx = Math.cos(angle) * clampedDist;
      const ny = Math.sin(angle) * clampedDist;

      setStickOffset({ x: nx, y: ny });
      onControlsChange({
        steerX: nx / maxRadius,
        steerY: ny / maxRadius,
      });
    },
    [isSteering, joystickCenter, onControlsChange]
  );

  const handleZonePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (steerPointerIdRef.current === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Safe ignore
        }
        steerPointerIdRef.current = null;
        setIsSteering(false);
        setStickOffset({ x: 0, y: 0 });
        setJoystickCenter(null);
        onControlsChange({ steerX: 0, steerY: 0 });
      }
    },
    [onControlsChange]
  );

  // Aerial Combo Button (Jump + Boost simultaneously)
  const comboPointerIdRef = useRef<number | null>(null);

  const handleComboDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    comboPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    triggerHaptic(20);
    onJumpPress();
    onBoostPress();
  };

  const handleComboUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (comboPointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      comboPointerIdRef.current = null;
      onJumpRelease();
      onBoostRelease();
    }
  };

  return (
    <div
      id="touch-controls-layer"
      onContextMenu={(e) => e.preventDefault()}
      className="pointer-events-none absolute inset-0 z-20 select-none touch-none"
    >
      {/* Portrait Mode Mobile Tip / Landscape Activator */}
      {isPortrait && !dismissRotateTip && (
        <div className="pointer-events-auto absolute top-16 left-1/2 -translate-x-1/2 z-40 flex w-[92%] max-w-sm flex-col items-center rounded-2xl border border-cyan-500/60 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                <RotateCw className="h-5 w-5 animate-spin" style={{ animationDuration: '5s' }} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display text-xs font-black tracking-wider text-white uppercase">MODE PAYSAGE CONSEILLÉ</span>
                <span className="font-rajdhani text-[11px] text-slate-300">Pivotez votre téléphone pour une vue panoramique</span>
              </div>
            </div>
            <button
              onClick={() => setDismissRotateTip(true)}
              className="rounded-full p-1 text-slate-400 hover:text-white"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex w-full gap-2">
            <button
              onClick={handleRequestLandscape}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2 font-display text-[11px] font-bold text-white shadow-lg active:scale-95"
            >
              <Maximize className="h-3.5 w-3.5" />
              <span>PLEIN ÉCRAN PAYSAGE</span>
            </button>
            <button
              onClick={() => setDismissRotateTip(true)}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 font-display text-[11px] font-bold text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {/* LEFT HALF SCREEN: Dynamic Floating Joystick Touch Zone */}
      <div
        ref={leftZoneRef}
        onPointerDown={handleZonePointerDown}
        onPointerMove={handleZonePointerMove}
        onPointerUp={handleZonePointerUp}
        onPointerCancel={handleZonePointerUp}
        className="pointer-events-auto absolute left-0 top-12 bottom-0 w-[42%] touch-none pl-[env(safe-area-inset-left)]"
      >
        {/* Dynamic Joystick Visual (Follows finger when dragging, or rests in corner when idle) */}
        {isSteering && joystickCenter ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/40 bg-slate-950/70 shadow-[0_0_25px_rgba(6,182,212,0.3)] backdrop-blur-md"
            style={{
              left: `${joystickCenter.x}px`,
              top: `${joystickCenter.y}px`,
              width: `${maxRadius * 2 + 28}px`,
              height: `${maxRadius * 2 + 28}px`,
            }}
          >
            {/* Directional ticks */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ChevronUp className="absolute top-1.5 h-3.5 w-3.5 text-cyan-400/60" />
              <ChevronDown className="absolute bottom-1.5 h-3.5 w-3.5 text-cyan-400/60" />
              <ChevronLeft className="absolute left-1.5 h-3.5 w-3.5 text-cyan-400/60" />
              <ChevronRight className="absolute right-1.5 h-3.5 w-3.5 text-cyan-400/60" />
              <div className="h-7 w-7 rounded-full border border-cyan-400/30" />
            </div>

            {/* Inner Stick */}
            <div
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-200 bg-cyan-500/90 shadow-[0_0_16px_rgba(6,182,212,0.9)] scale-105"
              style={{
                transform: `translate(calc(-50% + ${stickOffset.x}px), calc(-50% + ${stickOffset.y}px))`,
              }}
            >
              <div className="h-3.5 w-3.5 rounded-full bg-white/90" />
            </div>
          </div>
        ) : (
          /* Default Resting Joystick (Bottom Left with Safe-Area support) */
          <div className="pointer-events-none absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-col items-center opacity-70">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-slate-950/50 backdrop-blur-sm shadow-lg">
              <ChevronUp className="absolute top-1.5 h-3.5 w-3.5 text-cyan-500/40" />
              <ChevronDown className="absolute bottom-1.5 h-3.5 w-3.5 text-cyan-500/40" />
              <ChevronLeft className="absolute left-1.5 h-3.5 w-3.5 text-cyan-500/40" />
              <ChevronRight className="absolute right-1.5 h-3.5 w-3.5 text-cyan-500/40" />
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-cyan-400/70 bg-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                <div className="h-3 w-3 rounded-full bg-white/60" />
              </div>
            </div>
            <span className="mt-1 font-display text-[9px] font-bold tracking-widest text-cyan-400/70 uppercase">
              Direction
            </span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Ergonomic Action Buttons Cluster (Arc tailored for right thumb in landscape) */}
      <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-5 sm:right-6 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
        {/* Upper Row: Air Roll (180°) & Fast Aerial Combo */}
        <div className="flex items-center gap-2 pr-1 sm:pr-2">
          {/* Air Roll / 180° Turn */}
          <button
            id="btn-air-roll"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              triggerHaptic(15);
              onAirRoll();
            }}
            className="flex h-10 w-10 sm:h-12 sm:w-12 touch-none flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/85 text-slate-300 shadow-xl backdrop-blur-md active:scale-90 active:border-cyan-400 active:text-cyan-400"
            title="Air Roll 180°"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="font-display text-[7px] sm:text-[8px] font-bold">180°</span>
          </button>

          {/* Fast Aerial Combo Button (Jump + Boost simultané) */}
          <button
            id="btn-aerial-combo"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handleComboDown}
            onPointerUp={handleComboUp}
            onPointerCancel={handleComboUp}
            className="flex h-11 w-11 sm:h-13 sm:w-13 touch-none flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 border-fuchsia-400 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] backdrop-blur-md active:scale-90 active:from-indigo-500 active:to-fuchsia-500"
            title="Fast Aerial (Saut + Boost simultané)"
          >
            <Zap className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current" />
            <span className="font-display text-[7px] sm:text-[8px] font-black tracking-wider uppercase">
              Aerial
            </span>
          </button>
        </div>

        {/* Lower Row: Jump / Flip & Boost */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Jump / Flip Button */}
          <button
            id="btn-jump"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Safe fallback
              }
              triggerHaptic(15);
              onJumpPress();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                // Safe fallback
              }
              onJumpRelease();
            }}
            onPointerCancel={onJumpRelease}
            className="flex h-14 w-14 sm:h-18 sm:w-18 touch-none flex-col items-center justify-center rounded-full border-2 border-blue-400 bg-blue-600/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] backdrop-blur-md active:scale-90 active:bg-blue-500"
          >
            <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-display text-[8px] sm:text-[9px] font-extrabold tracking-wider">SAUT</span>
          </button>

          {/* Boost Button */}
          <button
            id="btn-boost"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Safe fallback
              }
              triggerHaptic(20);
              onBoostPress();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                // Safe fallback
              }
              onBoostRelease();
            }}
            onPointerCancel={onBoostRelease}
            className="flex h-16 w-16 sm:h-20 sm:w-20 touch-none flex-col items-center justify-center rounded-full border-2 border-orange-400 bg-orange-600/90 text-white shadow-[0_0_25px_rgba(249,115,22,0.7)] backdrop-blur-md active:scale-90 active:bg-orange-500"
          >
            <Flame className="h-7 w-7 sm:h-8 sm:w-8 fill-current animate-pulse" />
            <span className="font-display text-[9px] sm:text-[10px] font-black tracking-widest">BOOST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
