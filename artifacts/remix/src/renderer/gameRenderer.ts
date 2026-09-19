import { ARENA, PHYSICS } from '../physics/constants';
import { Ball, Car, CameraFramingMode, Particle, SpecialShotType, WheelType } from '../types/game';

interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetZoom: number;
  shake: number;
}

export class GameRenderer {
  public camera: Camera = {
    x: ARENA.width / 2,
    y: ARENA.height / 2,
    zoom: 0.65,
    targetZoom: 0.65,
    shake: 0,
  };

  private crowdFlashTimer = 0;
  private crowdFlashes: Array<{ x: number; y: number; life: number }> = [];

  public updateCamera(
    cars: Car[],
    ball: Ball,
    canvasWidth: number,
    canvasHeight: number,
    dt: number,
    framingMode: CameraFramingMode = 'auto'
  ) {
    // 1. Calculate bounding box of primary action (cars + ball)
    let minX = ball.x;
    let maxX = ball.x;
    let minY = ball.y;
    let maxY = ball.y;

    for (const car of cars) {
      minX = Math.min(minX, car.x);
      maxX = Math.max(maxX, car.x);
      minY = Math.min(minY, car.y);
      maxY = Math.max(maxY, car.y);
    }

    // Camera target center (lerp towards center of action)
    const targetCenterX = (minX + maxX) / 2;
    const targetCenterY = (minY + maxY) / 2;

    // 2. Aspect Ratio and Screen-Adaptive Camera Sizing
    const aspectRatio = canvasWidth / Math.max(1, canvasHeight);
    const isPortrait = aspectRatio < 0.95;
    const isUltraWide = aspectRatio > 2.1;
    const isCompactLandscape = canvasHeight < 550 && aspectRatio >= 1.2;

    // Dynamic base spans based on screen orientation & display aspect ratio
    let baseSpanX: number;
    let baseSpanY: number;

    if (isPortrait) {
      // Portrait screen: broaden horizontal span so cars and ball aren't cut off
      baseSpanX = 1350;
      baseSpanY = 620;
    } else if (isUltraWide) {
      // 21:9 or wider ultra-wide monitors / panoramic mobile
      baseSpanX = 1100;
      baseSpanY = 460;
    } else if (isCompactLandscape) {
      // Mobile in landscape (e.g. 844x390)
      baseSpanX = 980;
      baseSpanY = 480;
    } else {
      // Standard desktop / tablet 16:9, 16:10, 4:3
      baseSpanX = 880;
      baseSpanY = 500;
    }

    // Adjust for user-selected framing preset
    if (framingMode === 'wide') {
      baseSpanX *= 1.35;
      baseSpanY *= 1.35;
    } else if (framingMode === 'action') {
      baseSpanX *= 0.82;
      baseSpanY *= 0.82;
    }

    const paddingX = isPortrait ? 400 : (isCompactLandscape ? 440 : 360);
    const paddingY = isPortrait ? 280 : 300;

    const spanX = Math.max(baseSpanX, maxX - minX + paddingX);
    const spanY = Math.max(baseSpanY, maxY - minY + paddingY);

    const zoomX = canvasWidth / spanX;
    const zoomY = canvasHeight / spanY;

    // Dynamic min/max zoom caps matching display
    let minZoomCap = 0.22;
    let maxZoomCap = 0.85;

    if (isPortrait) {
      maxZoomCap = 0.58;
      minZoomCap = 0.20;
    } else if (isCompactLandscape) {
      maxZoomCap = 0.68;
    }

    if (framingMode === 'wide') {
      maxZoomCap = 0.55;
    } else if (framingMode === 'action') {
      minZoomCap = 0.35;
      maxZoomCap = 0.95;
    }

    const idealZoom = Math.max(minZoomCap, Math.min(maxZoomCap, Math.min(zoomX, zoomY)));

    // Smooth lerp for zoom
    this.camera.zoom += (idealZoom - this.camera.zoom) * Math.min(1, dt * 4.5);

    // Adaptive boundary clamp to keep camera inside the stadium
    const visibleHalfW = (canvasWidth / 2) / Math.max(0.1, this.camera.zoom);
    const visibleHalfH = (canvasHeight / 2) / Math.max(0.1, this.camera.zoom);

    let clampedTargetX: number;
    if (visibleHalfW * 2 >= ARENA.width - 100) {
      clampedTargetX = ARENA.width / 2;
    } else {
      const minCamX = ARENA.leftWallX + Math.min(visibleHalfW * 0.85, 450);
      const maxCamX = ARENA.rightWallX - Math.min(visibleHalfW * 0.85, 450);
      clampedTargetX = Math.max(minCamX, Math.min(maxCamX, targetCenterX));
    }

    let clampedTargetY: number;
    if (visibleHalfH * 2 >= ARENA.height - 50) {
      clampedTargetY = ARENA.height / 2;
    } else {
      const minCamY = ARENA.ceilingY + Math.min(visibleHalfH * 0.7, 300);
      const maxCamY = ARENA.groundY - Math.min(visibleHalfH * 0.7, 240);
      clampedTargetY = Math.max(minCamY, Math.min(maxCamY, targetCenterY));
    }

    const panSpeed = dt * 5.5;
    this.camera.x += (clampedTargetX - this.camera.x) * panSpeed;
    this.camera.y += (clampedTargetY - this.camera.y) * panSpeed;

    // Camera shake decay
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 25);
    }

    // Crowd light flashes
    this.crowdFlashTimer += dt;
    if (this.crowdFlashTimer > 0.08) {
      this.crowdFlashTimer = 0;
      if (Math.random() < 0.6) {
        this.crowdFlashes.push({
          x: ARENA.leftWallX + Math.random() * (ARENA.rightWallX - ARENA.leftWallX),
          y: ARENA.ceilingY - 30 - Math.random() * 80,
          life: 0.15,
        });
      }
    }

    for (let i = this.crowdFlashes.length - 1; i >= 0; i--) {
      this.crowdFlashes[i].life -= dt;
      if (this.crowdFlashes[i].life <= 0) {
        this.crowdFlashes.splice(i, 1);
      }
    }
  }

  public addScreenShake(amount: number) {
    this.camera.shake = Math.max(this.camera.shake, amount);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cars: Car[],
    ball: Ball,
    particles: Particle[],
    isGoalScored: boolean
  ) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();

    // Screen Shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.camera.shake > 0) {
      shakeOffsetX = (Math.random() - 0.5) * this.camera.shake;
      shakeOffsetY = (Math.random() - 0.5) * this.camera.shake;
    }

    // Center on canvas
    ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Stadium Backdrop & Lighting
    this.drawStadiumBackground(ctx);

    // 2. Draw Pitch & Markings
    this.drawPitchAndWalls(ctx);

    // 3. Draw Elevated Goals
    this.drawElevatedGoals(ctx, isGoalScored);

    // 4. Draw Particles (underneath cars & ball for smoke/boost)
    this.drawParticles(ctx, particles, 'under');

    // 5. Draw Cars
    for (const car of cars) {
      this.drawCar(ctx, car);
    }

    // 6. Draw Ball
    this.drawBall(ctx, ball);

    // 7. Draw Particles (above cars for sparks & shockwaves)
    this.drawParticles(ctx, particles, 'over');

    ctx.restore();

    // 8. Draw Screen-Space HUD / Off-screen Ball Indicator
    this.drawOffscreenBallIndicator(ctx, width, height, ball);

    ctx.restore();
  }

  private drawStadiumBackground(ctx: CanvasRenderingContext2D) {
    // Deep stadium backdrop gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ARENA.height);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.4, '#090d1f');
    bgGrad.addColorStop(0.85, '#0b132b');
    bgGrad.addColorStop(1, '#020617');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(-400, -200, ARENA.width + 800, ARENA.height + 400);

    // Distant Stadium Crowd Seating Rows (tiered perspective)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    for (let row = 0; row < 5; row++) {
      const y = ARENA.ceilingY - 20 - row * 24;
      ctx.fillRect(ARENA.leftWallX - 100, y, ARENA.width - ARENA.leftWallX * 2 + 200, 18);
    }

    // Crowd light / camera flashes
    for (const flash of this.crowdFlashes) {
      const alpha = flash.life / 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Volumetric Overhead Floodlights
    this.drawFloodlightCone(ctx, ARENA.width * 0.25, -60, ARENA.width * 0.25, ARENA.groundY, '#38bdf8');
    this.drawFloodlightCone(ctx, ARENA.width * 0.75, -60, ARENA.width * 0.75, ARENA.groundY, '#fb923c');
    this.drawFloodlightCone(ctx, ARENA.width * 0.5, -80, ARENA.width * 0.5, ARENA.groundY, '#818cf8');
  }

  private drawFloodlightCone(
    ctx: CanvasRenderingContext2D,
    topX: number,
    topY: number,
    bottomX: number,
    bottomY: number,
    color: string
  ) {
    ctx.save();
    const grad = ctx.createLinearGradient(topX, topY, bottomX, bottomY);
    grad.addColorStop(0, color.replace(')', ', 0.22)').replace('rgb', 'rgba'));
    grad.addColorStop(0.8, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(topX - 60, topY);
    ctx.lineTo(topX + 60, topY);
    ctx.lineTo(bottomX + 420, bottomY);
    ctx.lineTo(bottomX - 420, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawPitchAndWalls(ctx: CanvasRenderingContext2D) {
    const left = ARENA.leftWallX;
    const right = ARENA.rightWallX;
    const ground = ARENA.groundY;
    const ceiling = ARENA.ceilingY;

    // 1. Neon Turf Surface
    const turfGrad = ctx.createLinearGradient(0, ground - 100, 0, ground + 60);
    turfGrad.addColorStop(0, '#0a192f');
    turfGrad.addColorStop(0.4, '#0f2744');
    turfGrad.addColorStop(1, '#050c18');

    ctx.fillStyle = turfGrad;
    ctx.fillRect(left - 200, ground, (right - left) + 400, 200);

    // Turf High-Tech Hexagonal Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1.5;
    const hexSize = 50;
    for (let x = left; x <= right; x += hexSize * 1.5) {
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.lineTo(x, ground + 120);
      ctx.stroke();
    }

    // 2. Pitch Markings (Sideswipe vibrant neon lines)
    ctx.save();
    // Center Circle & Halfway Line
    const midX = (left + right) / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    // Halfway vertical beam
    ctx.beginPath();
    ctx.moveTo(midX, ground);
    ctx.lineTo(midX, ceiling);
    ctx.stroke();

    // Center Kickoff Circle
    ctx.beginPath();
    ctx.arc(midX, (ground + ceiling) / 2, 140, 0, Math.PI * 2);
    ctx.stroke();

    // Center kick-off podium ring
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.arc(midX, (ground + ceiling) / 2, 28, 0, Math.PI * 2);
    ctx.fill();

    // Ground Pitch Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(left, ground);
    ctx.lineTo(right, ground);
    ctx.stroke();

    // Ceiling Pitch Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, ceiling);
    ctx.lineTo(right, ceiling);
    ctx.stroke();

    // Outer Energy Walls (Left & Right)
    // Left blue wall line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(left, ceiling);
    ctx.lineTo(left, ARENA.goal.mouthYTop);
    ctx.moveTo(left, ARENA.goal.mouthYBottom);
    ctx.lineTo(left, ground);
    ctx.stroke();

    // Right orange wall line
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(right, ceiling);
    ctx.lineTo(right, ARENA.goal.mouthYTop);
    ctx.moveTo(right, ARENA.goal.mouthYBottom);
    ctx.lineTo(right, ground);
    ctx.stroke();

    ctx.restore();
  }

  private drawElevatedGoals(ctx: CanvasRenderingContext2D, isGoalScored: boolean) {
    const goalCfg = ARENA.goal;
    const topY = goalCfg.mouthYTop;
    const botY = goalCfg.mouthYBottom;
    const depth = goalCfg.depth;

    // LEFT GOAL (Blue Team Defense, Orange Scores Here)
    ctx.save();
    const leftX = ARENA.leftWallX;

    // Goal Net Interior Glow
    const leftNetGrad = ctx.createLinearGradient(leftX, topY, leftX - depth, topY);
    leftNetGrad.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    leftNetGrad.addColorStop(1, 'rgba(30, 58, 138, 0.85)');
    ctx.fillStyle = leftNetGrad;
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX - depth, topY + 20);
    ctx.lineTo(leftX - depth, botY - 20);
    ctx.lineTo(leftX, botY);
    ctx.closePath();
    ctx.fill();

    // Net Hexagonal Mesh / Grid
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
    ctx.lineWidth = 1.5;
    for (let gy = topY + 25; gy < botY; gy += 30) {
      ctx.beginPath();
      ctx.moveTo(leftX, gy);
      ctx.lineTo(leftX - depth, gy);
      ctx.stroke();
    }
    for (let gx = leftX - 25; gx > leftX - depth; gx -= 30) {
      ctx.beginPath();
      ctx.moveTo(gx, topY);
      ctx.lineTo(gx, botY);
      ctx.stroke();
    }

    // Lower ramp under goal (from ground up to goal mouth)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX - depth, ARENA.groundY);
    ctx.lineTo(leftX, ARENA.groundY);
    ctx.lineTo(leftX, botY);
    ctx.lineTo(leftX - depth, botY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper crossbar roof (cars can drive on it)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX - depth, topY);
    ctx.lineTo(leftX, topY);
    ctx.stroke();

    // Glowing Goal Posts
    this.drawGoalPost(ctx, leftX, topY, '#60a5fa', isGoalScored);
    this.drawGoalPost(ctx, leftX, botY, '#60a5fa', isGoalScored);

    // Goal Mouth Pulsing Energy Shield Barrier
    const shieldGrad = ctx.createLinearGradient(leftX, topY, leftX + 18, topY);
    shieldGrad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    shieldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shieldGrad;
    ctx.fillRect(leftX, topY, 18, botY - topY);

    ctx.restore();

    // RIGHT GOAL (Orange Team Defense, Blue Scores Here)
    ctx.save();
    const rightX = ARENA.rightWallX;

    // Goal Net Interior Glow
    const rightNetGrad = ctx.createLinearGradient(rightX, topY, rightX + depth, topY);
    rightNetGrad.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    rightNetGrad.addColorStop(1, 'rgba(154, 52, 18, 0.85)');
    ctx.fillStyle = rightNetGrad;
    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX + depth, topY + 20);
    ctx.lineTo(rightX + depth, botY - 20);
    ctx.lineTo(rightX, botY);
    ctx.closePath();
    ctx.fill();

    // Net Hexagonal Mesh / Grid
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
    ctx.lineWidth = 1.5;
    for (let gy = topY + 25; gy < botY; gy += 30) {
      ctx.beginPath();
      ctx.moveTo(rightX, gy);
      ctx.lineTo(rightX + depth, gy);
      ctx.stroke();
    }
    for (let gx = rightX + 25; gx < rightX + depth; gx += 30) {
      ctx.beginPath();
      ctx.moveTo(gx, topY);
      ctx.lineTo(gx, botY);
      ctx.stroke();
    }

    // Lower ramp under right goal
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX + depth, ARENA.groundY);
    ctx.lineTo(rightX, ARENA.groundY);
    ctx.lineTo(rightX, botY);
    ctx.lineTo(rightX + depth, botY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper crossbar roof
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX, topY);
    ctx.lineTo(rightX + depth, topY);
    ctx.stroke();

    // Glowing Goal Posts
    this.drawGoalPost(ctx, rightX, topY, '#fb923c', isGoalScored);
    this.drawGoalPost(ctx, rightX, botY, '#fb923c', isGoalScored);

    // Goal Mouth Pulsing Energy Shield Barrier
    const rightShieldGrad = ctx.createLinearGradient(rightX, topY, rightX - 18, topY);
    rightShieldGrad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
    rightShieldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rightShieldGrad;
    ctx.fillRect(rightX - 18, topY, 18, botY - topY);

    ctx.restore();
  }

  private drawGoalPost(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isGoal: boolean) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = isGoal ? 30 : 16;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, ARENA.goal.postRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  private drawCar(ctx: CanvasRenderingContext2D, car: Car) {
    ctx.save();

    // 1. Motion Trail / Speed Ghosting
    for (let i = 0; i < car.trailHistory.length; i++) {
      const ghost = car.trailHistory[i];
      const ghostAlpha = (1 - i / car.trailHistory.length) * 0.28;
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      const ghostFacing = ghost.facing ?? car.facing ?? 1;
      ctx.scale(ghostFacing, 1);
      ctx.rotate(ghost.angle);
      ctx.globalAlpha = ghostAlpha;
      this.drawCarBodyVector(ctx, car, true);
      ctx.restore();
    }

    // 2. Position and Orient Main Car
    ctx.translate(car.x, car.y);
    const facing = car.facing ?? 1;
    ctx.scale(facing, 1);
    ctx.rotate(car.angle);

    // 3. Neon Underglow
    const underglowColor = car.team === 'blue' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(249, 115, 22, 0.6)';
    ctx.save();
    ctx.shadowColor = car.team === 'blue' ? '#3b82f6' : '#f97316';
    ctx.shadowBlur = car.canFlip ? 22 : 8;
    ctx.fillStyle = underglowColor;
    ctx.beginPath();
    ctx.ellipse(0, 14, car.width * 0.48, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Draw Octane Chassis & Wheels
    this.drawCarBodyVector(ctx, car, false);

    // 5. Draw Wheels (Front and Back)
    this.drawCarWheels(ctx, car);

    // 6. Flip Reset Indicator (Aura glow on wheels when flip is available)
    if (car.canFlip && !car.isGrounded) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
      ctx.strokeRect(-car.width * 0.52, -car.height * 0.52, car.width * 1.04, car.height * 1.04);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawCarBodyVector(ctx: CanvasRenderingContext2D, car: Car, isGhost: boolean) {
    const w = car.width;
    const h = car.height;
    const halfW = w * 0.5;
    const halfH = h * 0.5;

    const baseColor = car.customization.bodyColor || '#2563eb';
    const accentColor = car.customization.accentColor || '#38bdf8';
    const model = car.customization.carModel || 'octane';

    ctx.save();
    if (!isGhost) {
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 10;
    }

    switch (model) {
      case 'fennec':
        this.drawFennecChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
      case 'dominus':
        this.drawDominusChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
      case 'merc':
        this.drawMercChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
      case 'porsche':
        this.drawPorscheChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
      case 'corvette':
        this.drawCorvetteChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
      case 'octane':
      default:
        this.drawOctaneChassis(ctx, halfW, halfH, baseColor, accentColor, isGhost);
        break;
    }

    ctx.restore();
  }

  // --- 1. OCTANE (Iconic All-Rounder Sports Buggy) ---
  private drawOctaneChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Main Chassis
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.85, halfH * 0.7);
    ctx.lineTo(halfW * 0.8, halfH * 0.7);
    ctx.lineTo(halfW, halfH * 0.2);
    ctx.lineTo(halfW * 0.35, -halfH * 0.25);
    ctx.lineTo(-halfW * 0.1, -halfH * 0.95);
    ctx.lineTo(-halfW * 0.55, -halfH * 0.9);
    ctx.lineTo(-halfW * 0.9, -halfH * 0.2);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cockpit Windshield (Tinted Cyan Glass)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.3, -halfH * 0.2);
      ctx.lineTo(-halfW * 0.05, -halfH * 0.82);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.8);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.2);
      ctx.closePath();
      ctx.fill();

      // Specular Reflection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.2, -halfH * 0.3);
      ctx.lineTo(0, -halfH * 0.75);
      ctx.stroke();

      // Roll Cage Tube Detail
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.5, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.75, -halfH * 0.2);
      ctx.stroke();

      // Exposed Engine V-Block
      ctx.fillStyle = '#334155';
      ctx.fillRect(-halfW * 0.82, -halfH * 0.5, 12, 12);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.8, -halfH * 0.55, 8, 4);

      // Elevated Rear Wing
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.95, -halfH * 1.15, 14, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfW * 0.88, -halfH * 1.15, 3, halfH * 0.8);

      // Front Headlight
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fillRect(halfW * 0.88, halfH * 0.05, 6, 6);

      // Rocket Exhaust Nozzle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.98, halfH * 0.1, 7, 10);
    }
  }

  // --- 2. FENNEC (Modern Rally Hatchback with Octane Hitbox) ---
  private drawFennecChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Angular, boxier hatchback body
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.9, halfH * 0.7);
    ctx.lineTo(halfW * 0.88, halfH * 0.7);
    // Vertical flat front rally bumper
    ctx.lineTo(halfW * 0.98, halfH * 0.4);
    ctx.lineTo(halfW * 0.98, halfH * 0.05);
    // Flat rally hood with slight bevel
    ctx.lineTo(halfW * 0.4, -halfH * 0.15);
    // Upright rally windshield
    ctx.lineTo(halfW * 0.08, -halfH * 0.9);
    // Boxy roofline
    ctx.lineTo(-halfW * 0.65, -halfH * 0.9);
    // Hatchback angled rear
    ctx.lineTo(-halfW * 0.95, -halfH * 0.1);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front Rally Honeycomb Grille
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(halfW * 0.92, halfH * 0.12, 5, 14);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(halfW * 0.92, halfH * 0.12, 5, 14);

      // Dual Aggressive Rectangular Headlights
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 9;
      ctx.fillRect(halfW * 0.88, halfH * 0.02, 7, 5);

      // Front Windshield & Hatchback Side Quarter Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -halfH * 0.1);
      ctx.lineTo(halfW * 0.1, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.2, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      // Rear Passenger/Quarter Glass
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.25, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.26, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.58, -halfH * 0.78);
      ctx.lineTo(-halfW * 0.6, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      // Glass specular sheen
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.28, -halfH * 0.2);
      ctx.lineTo(halfW * 0.15, -halfH * 0.7);
      ctx.stroke();

      // Fennec High-Mount Rear Roof Wing
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.98, 16, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-halfW * 0.7, -halfH * 0.98, 3, 5);

      // Rally Decal Stripe on Door
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.55, halfH * 0.25, halfW * 1.1, 4);

      // Dual Rally Exhaust
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.98, halfH * 0.25, 6, 8);
    }
  }

  // --- 3. DOMINUS (Classic American Muscle Car) ---
  private drawDominusChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Low, elongated aerodynamic muscle profile
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.92, halfH * 0.7);
    ctx.lineTo(halfW * 0.92, halfH * 0.7);
    // Low aggressive front splitter
    ctx.lineTo(halfW, halfH * 0.35);
    ctx.lineTo(halfW * 0.98, halfH * 0.05);
    // Long flat muscle hood
    ctx.lineTo(halfW * 0.15, -halfH * 0.05);
    // Low raked cockpit
    ctx.lineTo(-halfW * 0.1, -halfH * 0.7);
    // Sleek flat roof
    ctx.lineTo(-halfW * 0.52, -halfH * 0.7);
    // Fastback slope to trunk
    ctx.lineTo(-halfW * 0.85, -halfH * 0.1);
    ctx.lineTo(-halfW * 0.98, halfH * 0.1);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Twin Racing Stripes along the full body
      ctx.fillStyle = accentColor;
      ctx.fillRect(halfW * 0.1, -halfH * 0.08, halfW * 0.85, 3.5);
      ctx.fillRect(-halfW * 0.48, -halfH * 0.72, halfW * 0.35, 3);
      ctx.fillRect(-halfW * 0.92, -halfH * 0.12, halfW * 0.25, 3);

      // Low Muscle Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.12, -halfH * 0.03);
      ctx.lineTo(-halfW * 0.06, -halfH * 0.6);
      ctx.lineTo(-halfW * 0.46, -halfH * 0.6);
      ctx.lineTo(-halfW * 0.35, -halfH * 0.03);
      ctx.closePath();
      ctx.fill();

      // Windshield Specular Reflection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.05, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.02, -halfH * 0.5);
      ctx.stroke();

      // Front Quad Muscle Headlights
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(halfW * 0.94, halfH * 0.12, 3, 0, Math.PI * 2);
      ctx.arc(halfW * 0.94, halfH * 0.24, 3, 0, Math.PI * 2);
      ctx.fill();

      // Front Recessed Muscle Grille
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(halfW * 0.96, halfH * 0.08, 4, 12);

      // High-Downforce Wide GT Carbon Wing
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.95, 20, 4.5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfW * 0.9, -halfH * 0.95, 3, halfH * 0.9);
      ctx.fillRect(-halfW * 0.8, -halfH * 0.95, 3, halfH * 0.9);

      // Dual Muscle Chrome Exhaust
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-halfW * 0.99, halfH * 0.25, 7, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW * 0.99, halfH * 0.27, 4, 4);
    }
  }

  // --- 4. MERC (Massive Heavy Duty Van / Transport) ---
  private drawMercChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Big boxy truck/van profile
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.92, halfH * 0.7);
    ctx.lineTo(halfW * 0.9, halfH * 0.7);
    // Vertical steep front nose
    ctx.lineTo(halfW * 0.98, halfH * 0.5);
    ctx.lineTo(halfW * 0.98, -halfH * 0.1);
    // Short high hood
    ctx.lineTo(halfW * 0.45, -halfH * 0.25);
    // Steep windshield
    ctx.lineTo(halfW * 0.25, -halfH * 0.95);
    // Flat tall roof
    ctx.lineTo(-halfW * 0.85, -halfH * 0.95);
    // Near vertical rear cargo door
    ctx.lineTo(-halfW * 0.96, -halfH * 0.1);
    ctx.lineTo(-halfW * 0.96, halfH * 0.4);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Front Big Chrome Van Grille with Vertical Slats
      ctx.fillStyle = '#334155';
      ctx.fillRect(halfW * 0.93, -halfH * 0.05, 5, 20);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      for (let gy = -halfH * 0.02; gy < 18; gy += 4) {
        ctx.beginPath();
        ctx.moveTo(halfW * 0.93, gy);
        ctx.lineTo(halfW * 0.98, gy);
        ctx.stroke();
      }

      // Dual High-Mount Heavy Headlights
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.fillRect(halfW * 0.9, -halfH * 0.2, 7, 7);

      // Merc Large Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.4, -halfH * 0.22);
      ctx.lineTo(halfW * 0.23, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.1, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.05, -halfH * 0.22);
      ctx.closePath();
      ctx.fill();

      // Side Passenger Window
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.15, -halfH * 0.22);
      ctx.lineTo(-halfW * 0.16, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.85);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.22);
      ctx.closePath();
      ctx.fill();

      // Roof Utility Rails & Cab Clearance Lights
      ctx.fillStyle = '#475569';
      ctx.fillRect(-halfW * 0.75, -halfH * 1.05, halfW * 0.9, 3);
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 6;
      ctx.fillRect(halfW * 0.18, -halfH * 1.02, 4, 3);
      ctx.fillRect(halfW * 0.05, -halfH * 1.02, 4, 3);

      // Heavy Side Protective Accent Plate
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.75, halfH * 0.3, halfW * 1.3, 5);

      // Heavy Rear Vertical Exhaust Stack
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.99, -halfH * 0.3, 6, 25);
    }
  }

  // --- 5. PORSCHE (Porsche 911 Turbo - Sleek European Aerodynamic Supercar) ---
  private drawPorscheChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Iconic aerodynamic curved 911 silhouette with rear engine arches
    ctx.beginPath();
    // Bottom rocker
    ctx.moveTo(-halfW * 0.9, halfH * 0.7);
    ctx.lineTo(halfW * 0.85, halfH * 0.7);
    // Low aerodynamic chin splitter
    ctx.lineTo(halfW * 0.98, halfH * 0.45);
    ctx.lineTo(halfW * 0.98, halfH * 0.2);
    // Sloping front nose with iconic headlight bulge
    ctx.lineTo(halfW * 0.75, 0);
    ctx.lineTo(halfW * 0.4, -halfH * 0.15);
    // Smooth aerodynamic curved windshield
    ctx.lineTo(halfW * 0.05, -halfH * 0.8);
    // Curved teardrop roofline
    ctx.lineTo(-halfW * 0.35, -halfH * 0.82);
    // Fastback slope over rear engine
    ctx.lineTo(-halfW * 0.75, -halfH * 0.25);
    // Rear curved whale-tail spoiler housing
    ctx.lineTo(-halfW * 0.98, -halfH * 0.1);
    ctx.lineTo(-halfW * 0.95, halfH * 0.4);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Iconic Porsche Teardrop Cockpit Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.35, -halfH * 0.1);
      ctx.lineTo(halfW * 0.06, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.32, -halfH * 0.72);
      ctx.lineTo(-halfW * 0.55, -halfH * 0.1);
      ctx.closePath();
      ctx.fill();

      // Specular Glass Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.25, -halfH * 0.2);
      ctx.lineTo(halfW * 0.05, -halfH * 0.65);
      ctx.stroke();

      // Iconic Round Porsche Headlight with 4-Point LED Halo
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(halfW * 0.8, halfH * 0.06, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Side Turbo Air Intake Scoops (In front of rear wheels)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.3, halfH * 0.1);
      ctx.lineTo(-halfW * 0.45, halfH * 0.15);
      ctx.lineTo(-halfW * 0.45, halfH * 0.45);
      ctx.lineTo(-halfW * 0.3, halfH * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Legendary Porsche Whale-Tail / Tea-Tray Rear Spoiler
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.45, 18, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-halfW * 0.88, -halfH * 0.4, 10, 3); // Intercooler grille slats

      // Continuous Full-Width Red LED Taillight Bar
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.05, 5, 4);

      // Twin Chrome Sport Exhaust Pipes
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-halfW * 0.99, halfH * 0.28, 6, 4);
      ctx.fillRect(-halfW * 0.99, halfH * 0.4, 6, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW * 0.99, halfH * 0.29, 3, 2);
      ctx.fillRect(-halfW * 0.99, halfH * 0.41, 3, 2);
    }
  }

  // --- 6. CORVETTE (Chevrolet Corvette C8.R - Mid-Engine Track Supercar) ---
  private drawCorvetteChassis(
    ctx: CanvasRenderingContext2D,
    halfW: number,
    halfH: number,
    baseColor: string,
    accentColor: string,
    isGhost: boolean
  ) {
    // Low, razor-sharp wedge GT supercar profile
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.94, halfH * 0.7);
    ctx.lineTo(halfW * 0.9, halfH * 0.7);
    // Sharp carbon front splitter & aerodynamic dive planes
    ctx.lineTo(halfW * 1.04, halfH * 0.42);
    ctx.lineTo(halfW * 1.02, halfH * 0.15);
    // Pointed C8 nose cone
    ctx.lineTo(halfW * 0.78, -halfH * 0.05);
    // Aggressive low hood rake
    ctx.lineTo(halfW * 0.38, -halfH * 0.2);
    // Fighter-jet raked windshield & forward cockpit
    ctx.lineTo(halfW * 0.08, -halfH * 0.78);
    // Low flat roofline
    ctx.lineTo(-halfW * 0.32, -halfH * 0.78);
    // Elongated mid-engine rear hatch cover with glass window
    ctx.lineTo(-halfW * 0.75, -halfH * 0.2);
    // Muscular sculpted rear quarters
    ctx.lineTo(-halfW * 0.98, -halfH * 0.1);
    ctx.lineTo(-halfW * 0.96, halfH * 0.35);
    ctx.closePath();

    ctx.fillStyle = baseColor;
    ctx.fill();

    if (!isGhost) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Iconic C8 Boomerang / Wishbone Side Door Air Intake Scoop
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.15, halfH * 0.05);
      ctx.lineTo(-halfW * 0.4, -halfH * 0.1);
      ctx.lineTo(-halfW * 0.45, halfH * 0.45);
      ctx.lineTo(-halfW * 0.32, halfH * 0.45);
      ctx.lineTo(-halfW * 0.25, halfH * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Darkened Stealth Jet Windshield
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.34, -halfH * 0.15);
      ctx.lineTo(halfW * 0.09, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.28, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.45, -halfH * 0.15);
      ctx.closePath();
      ctx.fill();

      // Specular Glass Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.22, -halfH * 0.25);
      ctx.lineTo(halfW * 0.07, -halfH * 0.65);
      ctx.stroke();

      // Mid-Engine Glass Hatch Vented Heat Extractors
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.65, -halfH * 0.4, 12, 3);
      ctx.fillRect(-halfW * 0.60, -halfH * 0.3, 10, 3);

      // Slanted C8 High-Intensity LED Laser Projector Headlight
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(halfW * 0.88, halfH * 0.1);
      ctx.lineTo(halfW * 0.74, -halfH * 0.02);
      ctx.lineTo(halfW * 0.84, -halfH * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Elevated Carbon GT3 Racing Wing on Uprights
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-halfW * 0.88, -halfH * 1.05, 3.5, halfH * 0.9);
      ctx.fillRect(-halfW * 0.72, -halfH * 1.05, 3.5, halfH * 0.9);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfW * 0.98, -halfH * 1.15, 22, 5);
      ctx.fillRect(-halfW * 1.0, -halfH * 1.25, 4, 10);

      // Angular Red LED Taillights
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(-halfW * 0.98, -halfH * 0.05, 5, 4);
      ctx.shadowBlur = 0;

      // Aggressive Quad Exhaust System
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-halfW * 0.99, halfH * 0.25, 6, 4);
      ctx.fillRect(-halfW * 0.99, halfH * 0.38, 6, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW * 0.99, halfH * 0.26, 3, 2);
      ctx.fillRect(-halfW * 0.99, halfH * 0.39, 3, 2);
    }
  }

  // --- WHEEL RENDERING WITH CUSTOM RIMS & GLOW ---
  private drawCarWheels(ctx: CanvasRenderingContext2D, car: Car) {
    const halfW = car.width * 0.5;
    const halfH = car.height * 0.5;
    const model = car.customization.carModel || 'octane';
    const wheelType = car.customization.wheelType || 'cristiano';
    const wheelColor = car.customization.wheelColor || '#38bdf8';

    // Model-tailored wheelbases & tire sizing
    let wheelRadius = 14;
    let rearWheelX = -halfW * 0.55;
    let frontWheelX = halfW * 0.55;
    let wheelY = halfH * 0.72;

    if (model === 'dominus') {
      rearWheelX = -halfW * 0.62;
      frontWheelX = halfW * 0.62;
      wheelRadius = 13.5;
      wheelY = halfH * 0.72;
    } else if (model === 'merc') {
      rearWheelX = -halfW * 0.56;
      frontWheelX = halfW * 0.56;
      wheelRadius = 15;
      wheelY = halfH * 0.75;
    } else if (model === 'porsche') {
      rearWheelX = -halfW * 0.58;
      frontWheelX = halfW * 0.56;
      wheelRadius = 13.5;
      wheelY = halfH * 0.72;
    } else if (model === 'corvette') {
      rearWheelX = -halfW * 0.62;
      frontWheelX = halfW * 0.60;
      wheelRadius = 13.5;
      wheelY = halfH * 0.72;
    } else if (model === 'fennec') {
      rearWheelX = -halfW * 0.54;
      frontWheelX = halfW * 0.56;
      wheelRadius = 14;
      wheelY = halfH * 0.72;
    }

    this.drawSingleWheel(ctx, rearWheelX, wheelY, wheelRadius, car.wheelRotation, car.canFlip, wheelType, wheelColor);
    this.drawSingleWheel(ctx, frontWheelX, wheelY, wheelRadius, car.wheelRotation, car.canFlip, wheelType, wheelColor);
  }

  private drawSingleWheel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    rotation: number,
    canFlip: boolean,
    wheelType: WheelType = 'cristiano',
    wheelColor: string = '#38bdf8'
  ) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Tire Outer Rubber with tread grooves
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Tire tread rim
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 2. Wheel Rim Base
    ctx.save();
    ctx.rotate(rotation);

    const innerRadius = radius * 0.75;

    switch (wheelType) {
      case 'apex': {
        // High-Tech Radiant Neon Energy Blades
        ctx.shadowColor = wheelColor;
        ctx.shadowBlur = canFlip ? 15 : 8;
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 2.5;

        // 6 Curved Turbine Blades
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
          ctx.quadraticCurveTo(
            Math.cos(a + 0.3) * (innerRadius * 0.6),
            Math.sin(a + 0.3) * (innerRadius * 0.6),
            Math.cos(a) * innerRadius,
            Math.sin(a) * innerRadius
          );
          ctx.stroke();
        }

        // Inner glowing ring
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'zomba': {
        // Hypnotic Concentric Spiral Neon Rims
        ctx.shadowColor = wheelColor;
        ctx.shadowBlur = 12;

        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.strokeStyle = i % 2 === 0 ? wheelColor : '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, innerRadius * (0.35 + i * 0.18), a, a + Math.PI * 0.8);
          ctx.stroke();
        }
        break;
      }

      case 'astro': {
        // Aggressive Tuner Mesh Wheels (Cross-Laced Y-Spokes)
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a - 0.2) * innerRadius, Math.sin(a - 0.2) * innerRadius);
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a + 0.2) * innerRadius, Math.sin(a + 0.2) * innerRadius);
          ctx.stroke();
        }

        // Colored Outer Lip
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'dieci': {
        // 10-Spoke Championship Racing Wheels
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
          ctx.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
          ctx.stroke();
        }
        break;
      }

      case 'infinium': {
        // Infinite Mirrored Neon Tunnel Rings
        ctx.shadowColor = wheelColor;
        ctx.shadowBlur = 12;
        for (let r = 2; r <= innerRadius; r += 3) {
          ctx.strokeStyle = wheelColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }

      case 'cristiano':
      default: {
        // Classic 5-Spoke Motorsport Alloy Rims
        ctx.strokeStyle = canFlip ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * innerRadius, Math.sin(a) * innerRadius);
          ctx.stroke();
        }

        // Colored Lip Accent
        ctx.strokeStyle = wheelColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();

    // 3. Glowing Center Hubcap & Flip Status
    ctx.fillStyle = canFlip ? '#facc15' : wheelColor;
    ctx.shadowColor = canFlip ? '#facc15' : wheelColor;
    ctx.shadowBlur = canFlip ? 10 : 4;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
    ctx.save();

    // 1. Dynamic Ball Speed Trail
    for (let i = 0; i < ball.trailHistory.length; i++) {
      const trail = ball.trailHistory[i];
      const trailAlpha = (1 - i / ball.trailHistory.length) * 0.35;
      const trailRadius = ball.radius * (1 - i * 0.05);

      ctx.save();
      ctx.translate(trail.x, trail.y);
      let trailColor = 'rgba(56, 189, 248, ';
      if (trail.shotType === 'red-power') trailColor = 'rgba(239, 68, 68, ';
      else if (trail.shotType === 'purple-pop') trailColor = 'rgba(168, 85, 247, ';
      else if (trail.shotType === 'gold-shot') trailColor = 'rgba(234, 179, 8, ';

      ctx.fillStyle = `${trailColor}${trailAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, trailRadius), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Position & Rotate Ball
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);

    // Dynamic Outer Glow based on ball speed & special shot
    const speed = Math.hypot(ball.vx, ball.vy);
    let glowColor = '#38bdf8';
    if (ball.specialShot === 'red-power') glowColor = '#ef4444';
    else if (ball.specialShot === 'purple-pop') glowColor = '#a855f7';
    else if (ball.specialShot === 'gold-shot') glowColor = '#eab308';
    else if (speed > 600) glowColor = '#facc15';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.min(35, 12 + speed * 0.025);

    // Ball Base Sphere (Futuristic High-Tech Soccer Ball)
    const sphereGrad = ctx.createRadialGradient(-ball.radius * 0.3, -ball.radius * 0.3, 4, 0, 0, ball.radius);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.5, '#e2e8f0');
    sphereGrad.addColorStop(0.85, '#94a3b8');
    sphereGrad.addColorStop(1, '#334155');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Hexagonal Pattern on Ball
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.2;

    // Center hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const hx = Math.cos(a) * (ball.radius * 0.45);
      const hy = Math.sin(a) * (ball.radius * 0.45);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Connecting seam lines to ball perimeter
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (ball.radius * 0.45), Math.sin(a) * (ball.radius * 0.45));
      ctx.lineTo(Math.cos(a) * ball.radius, Math.sin(a) * ball.radius);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], layer: 'under' | 'over') {
    ctx.save();
    for (const p of particles) {
      const isUnderLayer = p.type === 'boost' || p.type === 'smoke';
      if (layer === 'under' && !isUnderLayer) continue;
      if (layer === 'over' && isUnderLayer) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'shockwave') {
        // Expanding holographic shockwave ring
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(2, 8 * (1 - p.life / p.maxLife));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
      } else {
        // Boost / Sparks
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  private drawOffscreenBallIndicator(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ball: Ball
  ) {
    // Project ball coordinates into screen space
    const screenX = (ball.x - this.camera.x) * this.camera.zoom + width / 2;
    const screenY = (ball.y - this.camera.y) * this.camera.zoom + height / 2;

    const margin = 36;
    const isOffscreen =
      screenX < margin || screenX > width - margin || screenY < margin || screenY > height - margin;

    if (!isOffscreen) return;

    // Clamp indicator to edge
    const clampedX = Math.max(margin, Math.min(width - margin, screenX));
    const clampedY = Math.max(margin, Math.min(height - margin, screenY));

    // Direction vector from screen center to ball
    const angle = Math.atan2(screenY - height / 2, screenX - width / 2);

    ctx.save();
    ctx.translate(clampedX, clampedY);
    ctx.rotate(angle);

    // Glowing Neon Pointer Arrow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();

    // Mini ball icon inside indicator
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-14, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
