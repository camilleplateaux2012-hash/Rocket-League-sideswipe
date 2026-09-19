import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ARENA, PHYSICS, MATCH_DURATION } from '../physics/constants';
import { PhysicsEngine } from '../physics/physicsEngine';
import { GameRenderer } from '../renderer/gameRenderer';
import { BotController } from '../ai/botController';
import { sound } from '../audio/soundEngine';
import { screenAdapter, ScreenMetrics } from '../utils/screenAdapter';
import {
  Ball,
  BotDifficulty,
  CameraFramingMode,
  Car,
  CarCustomization,
  GameMode,
  GoalEvent,
  InputControls,
  MatchState,
  Team,
  PlayerProfile,
  OpponentProfile,
} from '../types/game';
import { Scoreboard } from './Scoreboard';
import { GoalOverlay } from './GoalOverlay';
import { TouchControls } from './TouchControls';
import { PauseModal } from './PauseModal';
import { Pause, RotateCcw, Maximize, Minimize, Eye, Smartphone, X } from 'lucide-react';

interface GameCanvasProps {
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  carCustomization: CarCustomization;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onReturnToMenu: () => void;
  playerProfile?: PlayerProfile;
  opponentProfile?: OpponentProfile | null;
  rankedResult?: {
    mmrChange: number;
    newMmr: number;
    won: boolean;
    winStreak?: number;
    promoted?: boolean;
    newRankName?: string;
  } | null;
  onRecordMatchFinish?: (result: {
    won: boolean;
    blueScore: number;
    orangeScore: number;
    isOvertime: boolean;
    gameMode: GameMode;
  }) => void;
  onRecordGoal?: (team: Team) => void;
  onRecordSave?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  botDifficulty,
  carCustomization,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onReturnToMenu,
  playerProfile,
  opponentProfile,
  rankedResult,
  onRecordMatchFinish,
  onRecordGoal,
  onRecordSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Screen metrics & display state
  const [screenMetrics, setScreenMetrics] = useState<ScreenMetrics>(() => screenAdapter.getMetrics());
  const [framingMode, setFramingMode] = useState<CameraFramingMode>('auto');
  const [dismissPortraitTip, setDismissPortraitTip] = useState(false);

  // Subscribe to screen and viewport changes
  useEffect(() => {
    return screenAdapter.subscribe(setScreenMetrics);
  }, []);

  // Engines
  const physicsRef = useRef(new PhysicsEngine());
  const rendererRef = useRef(new GameRenderer());
  const botRef = useRef(new BotController());

  // Input states
  const p1InputsRef = useRef<InputControls>({
    steerX: 0,
    steerY: 0,
    jumpPressed: false,
    jumpJustPressed: false,
    boostPressed: false,
    airRollPressed: false,
  });

  const p2InputsRef = useRef<InputControls>({
    steerX: 0,
    steerY: 0,
    jumpPressed: false,
    jumpJustPressed: false,
    boostPressed: false,
    airRollPressed: false,
  });

  // Keyboard keys set
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Input source tracking to prevent keyboard and touch inputs from fighting
  const lastInputSourceRef = useRef<'keyboard' | 'touch' | 'gamepad'>('keyboard');

  // Cars and Ball
  const carsRef = useRef<Car[]>([]);
  const ballRef = useRef<Ball>({
    x: ARENA.width / 2,
    y: ARENA.groundY - 50,
    vx: 0,
    vy: 0,
    radius: PHYSICS.ball.radius,
    angle: 0,
    angularVelocity: 0,
    lastHitBy: null,
    lastHitTeam: null,
    lastHitSpeed: 0,
    specialShot: 'none',
    trailHistory: [],
  });

  // Match State
  const [matchState, setMatchState] = useState<MatchState>({
    status: 'countdown',
    blueScore: 0,
    orangeScore: 0,
    timeRemaining: MATCH_DURATION, // 2 minutes (120 seconds)
    isOvertime: false,
    countdownTimer: 3,
    gameMode,
    botDifficulty,
    lastGoal: null,
    stats: {
      blueGoals: 0,
      orangeGoals: 0,
      blueShots: 0,
      orangeShots: 0,
      blueSaves: 0,
      orangeSaves: 0,
    },
  });

  const [matchWinner, setMatchWinner] = useState<Team | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const recordedMatchEndRef = useRef(false);
  const [p1Boost, setP1Boost] = useState(100);
  const [p1CanFlip, setP1CanFlip] = useState(true);

  // Time tracking ref
  const lastTimeRef = useRef<number>(performance.now());
  const goalCooldownRef = useRef<number>(0);
  const countdownTimerRef = useRef<number>(3);
  const matchTimeRemainingRef = useRef<number>(MATCH_DURATION);

  // Initialize Cars and Ball
  const resetToKickoff = useCallback(
    (announceCountdown: boolean = true) => {
      const isTraining = gameMode === 'training';

      // Player 1 (Blue)
      const p1: Car = {
        id: 'p1',
        name: playerProfile?.username || 'Joueur 1',
        team: 'blue',
        x: isTraining ? ARENA.width * 0.35 : 620,
        y: ARENA.groundY - 30,
        vx: 0,
        vy: 0,
        angle: 0,
        facing: 1,
        angularVelocity: 0,
        width: PHYSICS.car.width,
        height: PHYSICS.car.height,
        isGrounded: true,
        isOnCeiling: false,
        isOnWall: false,
        canFlip: true,
        jumpCount: 0,
        flipCooldown: 0,
        isFlipping: false,
        flipProgress: 0,
        flipDir: { x: 1, y: 0 },
        boost: 100,
        isBoosting: false,
        customization: carCustomization,
        trailHistory: [],
        wheelRotation: 0,
        suspensionOffset: 0,
      };

      const newCars: Car[] = [p1];

      if (gameMode === 'vs-bot-2v2' || gameMode === 'ranked-2v2') {
        const teammateBot: Car = {
          id: 'p2',
          name: 'Bot Coéquipier',
          team: 'blue',
          x: 380,
          y: ARENA.groundY - 30,
          vx: 0,
          vy: 0,
          angle: 0,
          facing: 1,
          angularVelocity: 0,
          width: PHYSICS.car.width,
          height: PHYSICS.car.height,
          isGrounded: true,
          isOnCeiling: false,
          isOnWall: false,
          canFlip: true,
          jumpCount: 0,
          flipCooldown: 0,
          isFlipping: false,
          flipProgress: 0,
          flipDir: { x: 1, y: 0 },
          boost: 100,
          isBoosting: false,
          customization: {
            carModel: 'octane',
            bodyColor: '#3b82f6',
            accentColor: '#93c5fd',
            wheelType: 'standard',
            wheelColor: '#60a5fa',
            boostType: 'blue-flame',
            explosionType: 'nova',
          },
          trailHistory: [],
          wheelRotation: 0,
          suspensionOffset: 0,
        };
        newCars.push(teammateBot);

        const opp1: Car = {
          id: 'p3',
          name: `Bot 1 (${botDifficulty.toUpperCase()})`,
          team: 'orange',
          x: 1600,
          y: ARENA.groundY - 30,
          vx: 0,
          vy: 0,
          angle: 0,
          facing: -1,
          angularVelocity: 0,
          width: PHYSICS.car.width,
          height: PHYSICS.car.height,
          isGrounded: true,
          isOnCeiling: false,
          isOnWall: false,
          canFlip: true,
          jumpCount: 0,
          flipCooldown: 0,
          isFlipping: false,
          flipProgress: 0,
          flipDir: { x: -1, y: 0 },
          boost: 100,
          isBoosting: false,
          customization: {
            carModel: 'dominus',
            bodyColor: '#ea580c',
            accentColor: '#fbbf24',
            wheelType: 'dieci',
            wheelColor: '#facc15',
            boostType: 'orange-flame',
            explosionType: 'solar',
          },
          trailHistory: [],
          wheelRotation: 0,
          suspensionOffset: 0,
        };
        newCars.push(opp1);

        const opp2: Car = {
          id: 'p4',
          name: `Bot 2 (${botDifficulty.toUpperCase()})`,
          team: 'orange',
          x: 1820,
          y: ARENA.groundY - 30,
          vx: 0,
          vy: 0,
          angle: 0,
          facing: -1,
          angularVelocity: 0,
          width: PHYSICS.car.width,
          height: PHYSICS.car.height,
          isGrounded: true,
          isOnCeiling: false,
          isOnWall: false,
          canFlip: true,
          jumpCount: 0,
          flipCooldown: 0,
          isFlipping: false,
          flipProgress: 0,
          flipDir: { x: -1, y: 0 },
          boost: 100,
          isBoosting: false,
          customization: {
            carModel: 'fennec',
            bodyColor: '#c2410c',
            accentColor: '#fdba74',
            wheelType: 'tuners',
            wheelColor: '#f97316',
            boostType: 'orange-flame',
            explosionType: 'solar',
          },
          trailHistory: [],
          wheelRotation: 0,
          suspensionOffset: 0,
        };
        newCars.push(opp2);
      } else if (gameMode !== 'training') {
        const opponentName = opponentProfile
          ? opponentProfile.name
          : gameMode === 'local-2p'
          ? 'Joueur 2'
          : `Bot ${botDifficulty.toUpperCase()}`;

        const opponentCustomization: CarCustomization = opponentProfile?.carCustomization || {
          carModel: 'dominus',
          bodyColor: '#ea580c',
          accentColor: '#fbbf24',
          wheelType: 'dieci',
          wheelColor: '#facc15',
          boostType: 'orange-flame',
          explosionType: 'solar',
        };

        const p2: Car = {
          id: 'p2',
          name: opponentName,
          team: 'orange',
          x: 1780,
          y: ARENA.groundY - 30,
          vx: 0,
          vy: 0,
          angle: 0,
          facing: -1, // facing left towards Blue goal
          angularVelocity: 0,
          width: PHYSICS.car.width,
          height: PHYSICS.car.height,
          isGrounded: true,
          isOnCeiling: false,
          isOnWall: false,
          canFlip: true,
          jumpCount: 0,
          flipCooldown: 0,
          isFlipping: false,
          flipProgress: 0,
          flipDir: { x: -1, y: 0 },
          boost: 100,
          isBoosting: false,
          customization: opponentCustomization,
          trailHistory: [],
          wheelRotation: 0,
          suspensionOffset: 0,
        };
        newCars.push(p2);
      }

      carsRef.current = newCars;

      // Reset Ball
      ballRef.current = {
        x: ARENA.width / 2,
        y: isTraining ? ARENA.groundY - 80 : ARENA.groundY - 50,
        vx: 0,
        vy: 0,
        radius: PHYSICS.ball.radius,
        angle: 0,
        angularVelocity: 0,
        lastHitBy: null,
        lastHitTeam: null,
        lastHitSpeed: 0,
        specialShot: 'none',
        trailHistory: [],
      };

      // Reset particles
      physicsRef.current.particles = [];

      if (announceCountdown && !isTraining) {
        countdownTimerRef.current = 3;
        setMatchState((prev) => ({
          ...prev,
          status: 'countdown',
          countdownTimer: 3,
          lastGoal: null,
        }));
        sound.playCountdown(false);
      } else {
        countdownTimerRef.current = 0;
        setMatchState((prev) => ({
          ...prev,
          status: 'playing',
          countdownTimer: 0,
          lastGoal: null,
        }));
      }
    },
    [gameMode, botDifficulty, carCustomization]
  );

  // Initialize on mount
  useEffect(() => {
    resetToKickoff(true);
  }, [resetToKickoff]);

  // Focus container on mount to immediately capture keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      lastInputSourceRef.current = 'keyboard';
      // Prevent scrolling on arrows/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
        return;
      }

      // Quick Fullscreen Toggle (Key F)
      if (e.code === 'KeyF') {
        screenAdapter.toggleFullscreen(containerRef.current);
        return;
      }

      // Quick Kickoff Reset (Key R)
      if (e.code === 'KeyR') {
        resetToKickoff(gameMode !== 'training');
        return;
      }

      keysPressedRef.current.add(e.code);

      // Player 1 Jump trigger (Space, KeyJ, Numpad0, or Up ONLY when grounded)
      const isJumpKey = e.code === 'Space' || e.code === 'KeyJ' || e.code === 'Numpad0';
      const isUpKey = e.code === 'KeyW' || e.code === 'ArrowUp';
      const p1Car = carsRef.current[0];

      if (isJumpKey || (isUpKey && p1Car && p1Car.isGrounded)) {
        if (!p1InputsRef.current.jumpPressed) {
          p1InputsRef.current.jumpJustPressed = true;
        }
        p1InputsRef.current.jumpPressed = true;
      }

      // Player 1 Air Roll (Key C, KeyE, or KeyK)
      if (e.code === 'KeyC' || e.code === 'KeyE') {
        p1InputsRef.current.airRollPressed = true;
        if (carsRef.current[0]) {
          carsRef.current[0].facing = carsRef.current[0].facing === 1 ? -1 : 1;
          if (carsRef.current[0].isGrounded) {
            carsRef.current[0].angle = 0;
          }
          sound.playFlip();
        }
      }

      // Player 2 Jump trigger
      if (e.code === 'KeyO' || e.code === 'Numpad5') {
        if (!p2InputsRef.current.jumpPressed) {
          p2InputsRef.current.jumpJustPressed = true;
        }
        p2InputsRef.current.jumpPressed = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      lastInputSourceRef.current = 'keyboard';
      keysPressedRef.current.delete(e.code);

      if (['Space', 'KeyJ', 'Numpad0', 'KeyW', 'ArrowUp'].includes(e.code)) {
        p1InputsRef.current.jumpPressed = false;
      }

      if (e.code === 'KeyO' || e.code === 'Numpad5') {
        p2InputsRef.current.jumpPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode, resetToKickoff]);

  // Sync keyboard states into input objects
  const updateKeyboardControls = () => {
    const keys = keysPressedRef.current;

    // Player 1 Steering (ZQSD + Arrows)
    let steerX = 0;
    let steerY = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('KeyQ')) steerX -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) steerX += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ')) steerY -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) steerY += 1;

    // Player 1 Boost (Shift, X, K, or Space if used)
    const isBoost = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX') || keys.has('KeyK');

    // Only overwrite if keyboard is the active input source
    if (lastInputSourceRef.current === 'keyboard') {
      p1InputsRef.current.steerX = steerX;
      p1InputsRef.current.steerY = steerY;
      p1InputsRef.current.boostPressed = isBoost;
    }

    // Player 2 Steering (for Local 2P: IJKL or Numpad)
    if (gameMode === 'local-2p') {
      let p2SteerX = 0;
      let p2SteerY = 0;
      if (keys.has('KeyJ') || keys.has('Numpad4')) p2SteerX -= 1;
      if (keys.has('KeyL') || keys.has('Numpad6')) p2SteerX += 1;
      if (keys.has('KeyI') || keys.has('Numpad8')) p2SteerY -= 1;
      if (keys.has('KeyK') || keys.has('Numpad2')) p2SteerY += 1;

      const p2Boost = keys.has('KeyP') || keys.has('Numpad1');

      p2InputsRef.current.steerX = p2SteerX;
      p2InputsRef.current.steerY = p2SteerY;
      p2InputsRef.current.boostPressed = p2Boost;
    }
  };

  // Gamepad API Polling
  const pollGamepads = () => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads[0]) return;

    const gp = gamepads[0];
    if (!gp) return;

    // Left analog stick
    const stickX = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
    const stickY = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;

    if (stickX !== 0 || stickY !== 0) {
      lastInputSourceRef.current = 'gamepad';
      p1InputsRef.current.steerX = stickX;
      p1InputsRef.current.steerY = stickY;
    }

    // A button (button 0) for jump
    const jumpBtn = gp.buttons[0]?.pressed;
    if (jumpBtn) {
      lastInputSourceRef.current = 'gamepad';
      if (!p1InputsRef.current.jumpPressed) {
        p1InputsRef.current.jumpJustPressed = true;
      }
    }
    if (lastInputSourceRef.current === 'gamepad') {
      p1InputsRef.current.jumpPressed = jumpBtn;
    }

    // B button (button 1) or RT (button 7) or RB (button 5) for boost
    const boostBtn = gp.buttons[1]?.pressed || gp.buttons[5]?.pressed || gp.buttons[7]?.pressed;
    if (boostBtn) {
      lastInputSourceRef.current = 'gamepad';
    }
    if (lastInputSourceRef.current === 'gamepad') {
      p1InputsRef.current.boostPressed = boostBtn;
    }
  };

  // Process Car Inputs (Jump, Flip, Drive, Steer, Boost)
  const applyCarControls = (car: Car, controls: InputControls, dt: number) => {
    // 1. Boost
    car.isBoosting = controls.boostPressed && car.boost > 0;

    // 2. Jump / Double Jump / Flip
    if (controls.jumpJustPressed) {
      controls.jumpJustPressed = false;

      if (car.isGrounded) {
        // First Jump off ground
        car.vy = -PHYSICS.car.jumpForce;
        car.isGrounded = false;
        car.jumpCount = 1;
        sound.playJump();
      } else if (car.canFlip && car.jumpCount < 2) {
        // Second Jump: Mandatory Forward Flip / Dodge!
        car.canFlip = false;
        car.jumpCount = 2;
        car.isFlipping = true;
        car.flipProgress = 0;

        // Always flip FORWARD in the direction the car is facing
        const facing = car.facing || 1;
        const dirX = facing;
        const dirY = -0.4; // Forward and slightly upward dash arc

        car.flipDir = { x: dirX, y: dirY };

        // Apply powerful forward dash impulse
        car.vx = dirX * PHYSICS.car.flipImpulse * 1.15;
        car.vy = dirY * PHYSICS.car.flipImpulse;

        // Clean forward 360° frontflip spin
        car.angularVelocity = facing * (Math.PI * 2.2) / PHYSICS.car.flipDuration;

        sound.playFlip();
      }
    }

    // 2b. Air Roll / 180° Direction Turnaround
    if (controls.airRollPressed) {
      controls.airRollPressed = false;
      car.facing = car.facing === 1 ? -1 : 1;
      if (car.isGrounded) {
        car.angle = 0;
      }
      sound.playFlip();
    }

    // 3. Ground Driving (Forward & Marche Arrière / Reverse)
    if (car.isGrounded) {
      // Level car on ground (wheels firmly down, roof up)
      car.angle = 0;
      car.angularVelocity = 0;

      if (controls.steerX !== 0) {
        // Automatically face the steering direction on the ground
        const targetFacing = controls.steerX > 0 ? 1 : -1;
        if (car.facing !== targetFacing) {
          car.facing = targetFacing;
        }

        car.vx += controls.steerX * PHYSICS.car.driveAccel * dt;

        // Cap drive speed
        if (Math.abs(car.vx) > PHYSICS.car.maxDriveSpeed) {
          car.vx = Math.sign(car.vx) * PHYSICS.car.maxDriveSpeed;
        }
      }
    } else {
      // In-air direct angle tracking & aerial maneuvering authority
      if (!car.isFlipping) {
        if (controls.steerX !== 0 || controls.steerY !== 0) {
          const localSteerX = car.facing === 1 ? controls.steerX : -controls.steerX;
          const targetAngle = Math.atan2(controls.steerY, localSteerX);
          let angleDiff = targetAngle - car.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          // Snappy, ultra-responsive rotation towards input direction
          car.angle += angleDiff * Math.min(1, dt * 22);
          car.angularVelocity = 0;

          // Sideswipe aerial glide authority: allows agile micro-corrections and air dribble adjustments
          car.vx += controls.steerX * PHYSICS.car.aerialControlForce * dt;
          car.vy += controls.steerY * (PHYSICS.car.aerialControlForce * 0.65) * dt;
        } else {
          // In air with no stick input: damp rotational velocity to prevent wild drifting
          car.angularVelocity *= 0.88;
        }
      }
    }
  };

  // Main Game Loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const gameLoop = (currentTime: number) => {
      animId = requestAnimationFrame(gameLoop);

      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      // Clamp dt to avoid spiral of death on lag
      const dt = Math.min(0.04, Math.max(0.001, rawDt));

      if (isPaused) return;

      const cars = carsRef.current;
      const ball = ballRef.current;
      const isTraining = gameMode === 'training';

      // 1. Handle Inputs
      updateKeyboardControls();
      pollGamepads();

      // 2. Countdown phase
      if (matchState.status === 'countdown') {
        countdownTimerRef.current -= dt;
        const currentSec = Math.ceil(countdownTimerRef.current);

        if (currentSec !== matchState.countdownTimer && currentSec > 0) {
          sound.playCountdown(false);
          setMatchState((prev) => ({ ...prev, countdownTimer: currentSec }));
        }

        if (countdownTimerRef.current <= 0) {
          sound.playCountdown(true);
          setMatchState((prev) => ({
            ...prev,
            status: 'playing',
            countdownTimer: 0,
          }));
        }
      }

      // 3. Match Playing / Goal Celebration Phase
      if (matchState.status === 'playing' || matchState.status === 'goal-scored') {
        if (matchState.status === 'playing') {
          // Player 1 controls
          if (cars[0]) {
            applyCarControls(cars[0], p1InputsRef.current, dt);
            sound.updateBoostSound(cars[0].isBoosting);
            setP1Boost(cars[0].boost);
            setP1CanFlip(cars[0].canFlip);
          }

          // Car 2 (Teammate Bot in 2v2, P2 in local-2p, or Opponent Bot in 1v1)
          if (cars[1]) {
            if (gameMode === 'vs-bot-2v2' || gameMode === 'ranked-2v2') {
              const teamBotControls = botRef.current.getControls(cars[1], ball, botDifficulty, dt, 'blue');
              applyCarControls(cars[1], teamBotControls, dt);
            } else if (gameMode === 'local-2p') {
              applyCarControls(cars[1], p2InputsRef.current, dt);
            } else {
              const botControls = botRef.current.getControls(cars[1], ball, botDifficulty, dt, 'orange');
              applyCarControls(cars[1], botControls, dt);
            }
          }

          // Car 3 (Opponent Bot 1 in 2v2)
          if (cars[2]) {
            const oppBot1Controls = botRef.current.getControls(cars[2], ball, botDifficulty, dt, 'orange');
            applyCarControls(cars[2], oppBot1Controls, dt);
          }

          // Car 4 (Opponent Bot 2 in 2v2)
          if (cars[3]) {
            const oppBot2Controls = botRef.current.getControls(cars[3], ball, botDifficulty, dt, 'orange');
            applyCarControls(cars[3], oppBot2Controls, dt);
          }
        } else {
          // During goal celebration:
          sound.updateBoostSound(false);
          for (const car of cars) {
            if (car) {
              car.isBoosting = false;
              car.isFlipping = false;
            }
          }
        }

        // Run Physics (keeps updating positions, ball motion, bouncing, and goal blast particles!)
        const isUnlimitedBoost = isTraining || gameMode === 'ranked-overdrive';
        const { goalScored, hitSpeed, shotType } = physicsRef.current.update(
          cars,
          ball,
          dt,
          isUnlimitedBoost
        );

        // Goal Scored Event (Only triggers when state is active 'playing')
        if (matchState.status === 'playing' && goalScored) {
          sound.playGoalExplosion();
          rendererRef.current.addScreenShake(26);

          // Symmetrical goal explosion blast particles in both camps with the correct customized explosionType
          const netMouthX = goalScored === 'blue' ? ARENA.rightWallX : ARENA.leftWallX;
          const netMouthY = (ARENA.goal.mouthYTop + ARENA.goal.mouthYBottom) / 2;
          const explosionType = goalScored === 'blue'
            ? (carCustomization.explosionType || 'shockwave')
            : (opponentProfile?.carCustomization?.explosionType || 'shockwave');
          physicsRef.current.emitGoalBlast(netMouthX, netMouthY, goalScored, explosionType);

          // Blast impulse on cars (now works perfectly as physics continues to update!)
          for (const car of cars) {
            const cdx = car.x - netMouthX;
            const cdy = car.y - netMouthY;
            const cdist = Math.hypot(cdx, cdy) || 1;
            car.vx += (cdx / cdist) * 920;
            car.vy += (cdy / cdist) * 920 - 300;
          }

          const scorerName =
            goalScored === 'blue'
              ? (playerProfile?.username || 'Joueur 1')
              : (opponentProfile ? opponentProfile.name : (gameMode === 'local-2p' ? 'Joueur 2' : `Bot ${botDifficulty.toUpperCase()}`));

          const newBlueScore = goalScored === 'blue' ? matchState.blueScore + 1 : matchState.blueScore;
          const newOrangeScore = goalScored === 'orange' ? matchState.orangeScore + 1 : matchState.orangeScore;

          const goalEvent: GoalEvent = {
            scoringTeam: goalScored,
            scorerName,
            speedKmh: hitSpeed,
            specialShot: shotType,
            timer: 2.5,
          };

          goalCooldownRef.current = 2.5;

          setMatchState((prev) => ({
            ...prev,
            status: 'goal-scored',
            blueScore: newBlueScore,
            orangeScore: newOrangeScore,
            lastGoal: goalEvent,
          }));

          // Notify goal
          if (onRecordGoal) {
            onRecordGoal(goalScored);
          }

          // In Overtime: Sudden Death Golden Goal!
          if (matchState.isOvertime) {
            setMatchWinner(goalScored);
            if (!recordedMatchEndRef.current && onRecordMatchFinish) {
              recordedMatchEndRef.current = true;
              onRecordMatchFinish({
                won: goalScored === 'blue',
                blueScore: newBlueScore,
                orangeScore: newOrangeScore,
                isOvertime: true,
                gameMode,
              });
            }
          }
        }

        // Match Clock
        if (matchState.status === 'playing' && !isTraining && !matchState.isOvertime) {
          matchTimeRemainingRef.current = Math.max(0, matchTimeRemainingRef.current - dt);
          const currentSecond = Math.ceil(matchTimeRemainingRef.current);

          if (currentSecond !== matchState.timeRemaining) {
            setMatchState((prev) => ({ ...prev, timeRemaining: currentSecond }));
            // Play countdown sound on last 10 seconds (10, 9, ..., 1)
            if (currentSecond <= 10 && currentSecond > 0) {
              sound.playCountdown(false);
            }
          }

          // Zero-second rule: when time hits 0, wait until ball hits the ground!
          if (matchTimeRemainingRef.current <= 0) {
            if (ball.y + ball.radius >= ARENA.groundY - 1) {
              // Ball touched ground at 0:00!
              if (matchState.blueScore === matchState.orangeScore) {
                // Enter Overtime Golden Goal!
                setMatchState((prev) => ({
                  ...prev,
                  isOvertime: true,
                  timeRemaining: 0,
                }));
              } else {
                // End Match!
                const winner: Team = matchState.blueScore > matchState.orangeScore ? 'blue' : 'orange';
                setMatchWinner(winner);
                setMatchState((prev) => ({ ...prev, status: 'ended' }));
                if (!recordedMatchEndRef.current && onRecordMatchFinish) {
                  recordedMatchEndRef.current = true;
                  onRecordMatchFinish({
                    won: winner === 'blue',
                    blueScore: matchState.blueScore,
                    orangeScore: matchState.orangeScore,
                    isOvertime: false,
                    gameMode,
                  });
                }
              }
            }
          }
        }
      }

      // 4. Goal Scored Pause / Reset to Kickoff
      if (matchState.status === 'goal-scored') {
        goalCooldownRef.current -= dt;
        if (goalCooldownRef.current <= 0 && !matchWinner) {
          resetToKickoff(true);
        }
      }

      // 5. Render Scene with dynamic Screen Adapter & HiDPI scaling
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logicalW = container.clientWidth || window.innerWidth;
          const logicalH = container.clientHeight || window.innerHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

          rendererRef.current.updateCamera(
            cars,
            ball,
            logicalW,
            logicalH,
            dt,
            framingMode,
            matchState.status === 'goal-scored',
            matchState.lastGoal?.scoringTeam
          );

          ctx.save();
          ctx.scale(dpr, dpr);
          rendererRef.current.render(
            ctx,
            logicalW,
            logicalH,
            cars,
            ball,
            physicsRef.current.particles,
            matchState.status === 'goal-scored'
          );
          ctx.restore();
        }
      }
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      sound.updateBoostSound(false);
    };
  }, [matchState, isPaused, gameMode, botDifficulty, matchWinner, resetToKickoff, framingMode]);

  const toggleLandscapeFullscreen = useCallback(async () => {
    await screenAdapter.toggleFullscreen(containerRef.current);
  }, []);

  // Handle Canvas Resize with HiDPI and safe bounds tracking
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);

        if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };

    const handleOrientation = () => {
      handleResize();
      setTimeout(handleResize, 100);
      setTimeout(handleResize, 250);
      setTimeout(handleResize, 500);
    };

    handleResize();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleOrientation);
    }
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleOrientation);
      }
      observer.disconnect();
    };
  }, []);

  // Touch control callbacks
  const handleTouchControlsChange = (c: Partial<InputControls>) => {
    lastInputSourceRef.current = 'touch';
    if (c.steerX !== undefined) p1InputsRef.current.steerX = c.steerX;
    if (c.steerY !== undefined) p1InputsRef.current.steerY = c.steerY;
  };

  const handleTouchJumpPress = () => {
    lastInputSourceRef.current = 'touch';
    if (!p1InputsRef.current.jumpPressed) {
      p1InputsRef.current.jumpJustPressed = true;
    }
    p1InputsRef.current.jumpPressed = true;
  };

  const handleTouchJumpRelease = () => {
    lastInputSourceRef.current = 'touch';
    p1InputsRef.current.jumpPressed = false;
  };

  const handleTouchBoostPress = () => {
    lastInputSourceRef.current = 'touch';
    p1InputsRef.current.boostPressed = true;
  };

  const handleTouchBoostRelease = () => {
    lastInputSourceRef.current = 'touch';
    p1InputsRef.current.boostPressed = false;
  };

  const handleTouchAirRoll = () => {
    lastInputSourceRef.current = 'touch';
    if (carsRef.current[0]) {
      carsRef.current[0].facing = carsRef.current[0].facing === 1 ? -1 : 1;
      if (carsRef.current[0].isGrounded) {
        carsRef.current[0].angle = 0;
      }
      sound.playFlip();
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      tabIndex={0}
      onClick={() => containerRef.current?.focus()}
      className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-slate-950 select-none outline-none touch-none focus:ring-1 focus:ring-cyan-500/20"
    >
      {/* 2D Canvas */}
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Top Scoreboard HUD */}
      <Scoreboard
        matchState={matchState}
        playerBoost={p1Boost}
        playerCanFlip={p1CanFlip}
        isTraining={gameMode === 'training'}
        blueName={playerProfile?.username || 'Joueur 1'}
        orangeName={opponentProfile?.name || (gameMode === 'local-2p' ? 'Joueur 2' : `Bot ${botDifficulty.toUpperCase()}`)}
        isRanked={gameMode.startsWith('ranked')}
      />

      {/* Keyboard Controls Bar (Bottom Center) */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 hidden md:flex items-center gap-3 rounded-full border border-slate-700/60 bg-slate-950/70 px-4 py-1.5 backdrop-blur-md text-[11px] font-medium text-slate-300 shadow-lg">
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">ZQSD</span> / <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">Flèches</span> Conduire / Viser
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-blue-400 font-bold">
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">ESPACE</span> Saut & Flip
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-orange-400 font-bold">
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">SHIFT</span> Boost
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-purple-400 font-bold">
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">C</span> 180°
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-emerald-400 font-bold">
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-white">R</span> Reset
        </span>
      </div>

      {/* Quick Pause, Camera Mode, Fullscreen & Reset Buttons (Top Right) */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
        {gameMode === 'training' && (
          <button
            onClick={() => resetToKickoff(false)}
            className="flex h-9 sm:h-10 items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 px-2.5 sm:px-3 font-display text-[11px] sm:text-xs font-bold text-slate-300 backdrop-blur hover:bg-slate-800"
            title="Réinitialiser la balle"
          >
            <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        )}

        {/* Camera Framing Preset Selector */}
        <button
          onClick={() => {
            setFramingMode((prev) => (prev === 'auto' ? 'wide' : prev === 'wide' ? 'action' : 'auto'));
          }}
          className="flex h-9 sm:h-10 items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 px-2 sm:px-2.5 text-slate-300 backdrop-blur hover:bg-slate-800 hover:text-white"
          title={`Cadrage Caméra: ${
            framingMode === 'auto'
              ? 'Auto Adaptatif (Recommandé)'
              : framingMode === 'wide'
              ? 'Stade Large'
              : 'Action Rapide'
          }`}
        >
          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
          <span className="font-display text-[10px] sm:text-[11px] font-bold text-slate-200">
            {framingMode === 'auto' ? 'AUTO' : framingMode === 'wide' ? 'LARGE' : 'ACTION'}
          </span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleLandscapeFullscreen}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 backdrop-blur hover:bg-slate-800 hover:text-white"
          title={screenMetrics.isFullscreen ? "Quitter le plein écran (Touche F)" : "Plein écran / Mode Paysage (Touche F)"}
        >
          {screenMetrics.isFullscreen ? (
            <Minimize className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
          ) : (
            <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Pause Button */}
        <button
          onClick={() => setIsPaused(true)}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 backdrop-blur hover:bg-slate-800 hover:text-white"
          title="Pause (Touche Echap ou P)"
        >
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Portrait Screen Helper Banner on Mobile */}
      {screenMetrics.isPortrait && screenMetrics.isMobile && !dismissPortraitTip && (
        <div className="absolute top-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-amber-500/40 bg-slate-900/95 px-3 py-2 text-xs text-amber-200 shadow-xl backdrop-blur-md max-w-[92vw]">
          <Smartphone className="h-4 w-4 shrink-0 text-amber-400 animate-pulse rotate-90" />
          <span className="font-medium text-[11px] leading-tight">
            Mode paysage conseillé pour voir toute l'arène.
          </span>
          <button
            onClick={toggleLandscapeFullscreen}
            className="shrink-0 rounded-lg bg-cyan-600 px-2 py-1 font-display text-[10px] font-bold text-white shadow hover:bg-cyan-500 active:scale-95"
          >
            PLEIN ÉCRAN
          </button>
          <button
            onClick={() => setDismissPortraitTip(true)}
            className="shrink-0 p-1 text-slate-400 hover:text-white"
            title="Masquer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Touch / Virtual Joystick Controls */}
      <TouchControls
        onControlsChange={handleTouchControlsChange}
        onJumpPress={handleTouchJumpPress}
        onJumpRelease={handleTouchJumpRelease}
        onBoostPress={handleTouchBoostPress}
        onBoostRelease={handleTouchBoostRelease}
        onAirRoll={handleTouchAirRoll}
      />

      {/* Goal & Winner Overlay */}
      <GoalOverlay
        goalEvent={matchState.lastGoal}
        countdown={matchState.countdownTimer}
        matchWinner={matchWinner}
        isRanked={gameMode.startsWith('ranked')}
        rankedResult={rankedResult}
        onRestartMatch={() => {
          recordedMatchEndRef.current = false;
          setMatchWinner(null);
          matchTimeRemainingRef.current = MATCH_DURATION;
          setMatchState((prev) => ({
            ...prev,
            blueScore: 0,
            orangeScore: 0,
            timeRemaining: MATCH_DURATION,
            isOvertime: false,
          }));
          resetToKickoff(true);
        }}
        onReturnToMenu={onReturnToMenu}
      />

      {/* In-Game Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onResetKickoff={() => {
            setIsPaused(false);
            resetToKickoff(true);
          }}
          onReturnToMenu={onReturnToMenu}
          onOpenGuide={onOpenGuide}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          isFullscreen={screenMetrics.isFullscreen}
          onToggleFullscreen={toggleLandscapeFullscreen}
          framingMode={framingMode}
          onChangeFramingMode={setFramingMode}
        />
      )}
    </div>
  );
};
