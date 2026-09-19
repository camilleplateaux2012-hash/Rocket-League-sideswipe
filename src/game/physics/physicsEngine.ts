import { ARENA, PHYSICS } from './constants';
import { Ball, Car, Particle, SpecialShotType, Vector2D, ExplosionType } from '../types/game';
import { sound } from '../audio/soundEngine';

export class PhysicsEngine {
  public particles: Particle[] = [];
  private particleIdCounter = 0;

  /**
   * Update cars, ball, and handle all collisions
   */
  public update(
    cars: Car[],
    ball: Ball,
    dt: number,
    unlimitedBoost: boolean = false
  ): { goalScored: 'blue' | 'orange' | null; hitSpeed: number; shotType: SpecialShotType } {
    let goalScored: 'blue' | 'orange' | null = null;
    let hitSpeed = 0;
    let specialShotScored: SpecialShotType = 'none';

    // 1. Update Cars
    for (const car of cars) {
      this.updateCar(car, dt, unlimitedBoost);
    }

    // 2. Update Ball
    this.updateBall(ball, dt);

    // 3. Car vs Arena Bounds & Elevated Goal Collisions
    for (const car of cars) {
      this.resolveCarArenaCollisions(car);
    }

    // 4. Ball vs Arena Bounds & Elevated Goals
    const goalResult = this.resolveBallArenaCollisions(ball);
    if (goalResult) {
      goalScored = goalResult;
      hitSpeed = ball.lastHitSpeed || Math.round(Math.hypot(ball.vx, ball.vy) * 0.1);
      specialShotScored = ball.specialShot;
    }

    // 5. Car vs Ball Collision
    for (const car of cars) {
      this.resolveCarBallCollision(car, ball);
    }

    // 6. Car vs Car Collision (All pairs)
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        this.resolveCarCarCollision(cars[i], cars[j]);
      }
    }

    // 7. Update Particles
    this.updateParticles(dt);

    return {
      goalScored,
      hitSpeed,
      shotType: specialShotScored,
    };
  }

  private updateCar(car: Car, dt: number, unlimitedBoost: boolean) {
    // Gravity: lighter when airborne/boosting for fluid Sideswipe aerial control
    if (!car.isGrounded && !car.isOnCeiling && !car.isOnWall) {
      const aerialGravity = car.isBoosting ? PHYSICS.gravity * 0.78 : PHYSICS.gravity * 0.90;
      car.vy += aerialGravity * dt;
    }

    // Apply Boost
    if (car.isBoosting && (car.boost > 0 || unlimitedBoost)) {
      if (!unlimitedBoost) {
        car.boost = Math.max(0, car.boost - PHYSICS.car.boostDrainRate * dt);
      }

      // Thrust direction matches car angle and facing
      const facing = car.facing || 1;
      const thrustX = facing * Math.cos(car.angle);
      const thrustY = Math.sin(car.angle);

      car.vx += thrustX * PHYSICS.car.boostAccel * dt;
      car.vy += thrustY * PHYSICS.car.boostAccel * dt;

      // Cap speed when boosting
      const currentSpeed = Math.hypot(car.vx, car.vy);
      if (currentSpeed > PHYSICS.car.maxBoostSpeed) {
        car.vx = (car.vx / currentSpeed) * PHYSICS.car.maxBoostSpeed;
        car.vy = (car.vy / currentSpeed) * PHYSICS.car.maxBoostSpeed;
      }

      // Spawn boost thruster particles from rear exhaust
      const exhaustDist = car.width * 0.52;
      const exhaustX = car.x - facing * Math.cos(car.angle) * exhaustDist;
      const exhaustY = car.y - Math.sin(car.angle) * exhaustDist;
      const exhaustAngle = facing === 1 ? car.angle : Math.PI - car.angle;
      this.emitBoostParticles(exhaustX, exhaustY, exhaustAngle, car.customization.boostType);
    }

    // Flip action execution
    if (car.isFlipping) {
      car.flipProgress += dt / PHYSICS.car.flipDuration;
      // High rotational speed during flip
      car.angle += car.angularVelocity * dt;

      if (car.flipProgress >= 1.0) {
        car.isFlipping = false;
        car.flipProgress = 0;
        car.angularVelocity = 0;
      }
    } else {
      // Normal rotation damping in air
      car.angle += car.angularVelocity * dt;
      if (!car.isGrounded) {
        car.angularVelocity *= 0.88;
      }
    }

    // Drag and friction
    if (car.isGrounded) {
      car.vx *= Math.pow(PHYSICS.groundFriction, dt * 60);
      // Wheels touch ground: recharge boost & restore flip
      car.boost = Math.min(100, car.boost + PHYSICS.car.boostRechargeRate * dt);
      car.canFlip = true;
      car.jumpCount = 0;
      // Align car angle with horizontal on ground (0 rad = wheels firmly on ground)
      if (Math.abs(car.angle) > 0.02) {
        car.angle = this.lerpAngle(car.angle, 0, dt * 12);
      } else {
        car.angle = 0;
      }
    } else if (car.isOnCeiling || car.isOnWall) {
      car.boost = Math.min(100, car.boost + PHYSICS.car.boostRechargeRate * dt);
      car.canFlip = true;
      car.jumpCount = 0;
    } else {
      // In air drag
      car.vx *= Math.pow(PHYSICS.airDrag, dt * 60);
      car.vy *= Math.pow(PHYSICS.airDrag, dt * 60);
    }

    // Position integration
    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // Wheel rotation follows actual horizontal velocity
    car.wheelRotation += (car.vx * dt) / 12;

    // Trail history for motion blur / speed lines
    const speed = Math.hypot(car.vx, car.vy);
    if (speed > 400 || car.isBoosting || car.isFlipping) {
      car.trailHistory.unshift({ x: car.x, y: car.y, angle: car.angle, facing: car.facing, alpha: 0.7 });
      if (car.trailHistory.length > 8) car.trailHistory.pop();
    } else if (car.trailHistory.length > 0) {
      car.trailHistory.pop();
    }

    // Reset touch flags for next collision pass
    car.isGrounded = false;
    car.isOnCeiling = false;
    car.isOnWall = false;
  }

  private updateBall(ball: Ball, dt: number) {
    // Ball gravity: tuned for readable aerial hang-time and controllable setup
    ball.vy += PHYSICS.ball.gravity * dt;

    // Ball drag
    ball.vx *= Math.pow(PHYSICS.ball.airDrag, dt * 60);
    ball.vy *= Math.pow(PHYSICS.ball.airDrag, dt * 60);

    // Ball speed cap
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > PHYSICS.ball.maxSpeed) {
      ball.vx = (ball.vx / speed) * PHYSICS.ball.maxSpeed;
      ball.vy = (ball.vy / speed) * PHYSICS.ball.maxSpeed;
    }

    // Position integration
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Ball rotation follows horizontal velocity
    ball.angle += (ball.vx * dt) / ball.radius;

    // Trail history
    ball.trailHistory.unshift({
      x: ball.x,
      y: ball.y,
      speed: Math.round(speed * 0.1),
      shotType: ball.specialShot,
    });
    if (ball.trailHistory.length > 12) ball.trailHistory.pop();

    // Degrade special shot glow after 1.5 seconds if slow
    if (speed < 450 && ball.specialShot !== 'none') {
      ball.specialShot = 'none';
    }
  }

  private resolveCarArenaCollisions(car: Car) {
    const halfW = car.width * 0.45;
    const halfH = car.height * 0.45;

    // Ground collision (Main pitch)
    if (car.y + halfH >= ARENA.groundY) {
      car.y = ARENA.groundY - halfH;
      car.vy = 0;
      car.isGrounded = true;
    }

    // Ceiling collision
    if (car.y - halfH <= ARENA.ceilingY) {
      car.y = ARENA.ceilingY + halfH;
      car.vy = Math.max(0, car.vy * -PHYSICS.car.bounceRestitution);
      car.isOnCeiling = true;
    }

    // Left Wall
    if (car.x - halfW <= ARENA.leftWallX) {
      // Check if entering goal mouth
      const inGoalMouth = car.y > ARENA.goal.mouthYTop && car.y < ARENA.goal.mouthYBottom;
      if (!inGoalMouth) {
        car.x = ARENA.leftWallX + halfW;
        car.vx = Math.max(0, car.vx * -PHYSICS.car.bounceRestitution);
        car.isOnWall = true;
      } else {
        // Inside goal net, clamp to net back
        if (car.x - halfW <= ARENA.leftWallX - ARENA.goal.depth + 30) {
          car.x = ARENA.leftWallX - ARENA.goal.depth + 30 + halfW;
          car.vx = 0;
        }
      }
    }

    // Right Wall
    if (car.x + halfW >= ARENA.rightWallX) {
      const inGoalMouth = car.y > ARENA.goal.mouthYTop && car.y < ARENA.goal.mouthYBottom;
      if (!inGoalMouth) {
        car.x = ARENA.rightWallX - halfW;
        car.vx = Math.min(0, car.vx * -PHYSICS.car.bounceRestitution);
        car.isOnWall = true;
      } else {
        // Inside orange goal net
        if (car.x + halfW >= ARENA.rightWallX + ARENA.goal.depth - 30) {
          car.x = ARENA.rightWallX + ARENA.goal.depth - 30 - halfW;
          car.vx = 0;
        }
      }
    }

    // Elevated Goal Crossbars & Ramps Collision for Car
    this.resolveCarGoalStructures(car, ARENA.leftWallX, true);
    this.resolveCarGoalStructures(car, ARENA.rightWallX, false);
  }

  private resolveCarGoalStructures(car: Car, wallX: number, isLeft: boolean) {
    const halfH = car.height * 0.45;
    const halfW = car.width * 0.45;
    const topBarY = ARENA.goal.mouthYTop;
    const bottomRampY = ARENA.goal.mouthYBottom;

    // 1. Crossbar Roof (Top of goal): cars can drive/land on top of the net!
    const inNetX = isLeft
      ? car.x >= wallX - ARENA.goal.depth && car.x <= wallX + 20
      : car.x >= wallX - 20 && car.x <= wallX + ARENA.goal.depth;

    if (inNetX) {
      // Determine if the car is within the interior height of the goal mouth/cage
      const isInsideGoalY = car.y > topBarY + 5 && car.y < bottomRampY - 5;

      if (isInsideGoalY) {
        // --- INSIDE THE GOAL CAGE ---
        // Solid bottom floor: Land inside the cage!
        if (car.y + halfH >= bottomRampY && car.vy >= 0) {
          car.y = bottomRampY - halfH;
          car.vy = 0;
          car.isGrounded = true;
        }
        // Solid top ceiling: Block going up past the roof from inside!
        else if (car.y - halfH <= topBarY && car.vy < 0) {
          car.y = topBarY + halfH;
          car.vy = 0;
        }
      } else {
        // --- OUTSIDE THE GOAL CAGE ---
        // Landing on top of goal (roof) from above
        if (car.y + halfH >= topBarY && car.y < topBarY + 25 && car.vy >= 0) {
          car.y = topBarY - halfH;
          car.vy = 0;
          car.isGrounded = true;
        }
        // Hitting bottom of net structure from below
        else if (car.y - halfH <= bottomRampY + 20 && car.y > bottomRampY && car.vy < 0) {
          car.y = bottomRampY + 20 + halfH;
          car.vy = 0;
        }
      }
    }

    // Crossbar circle posts
    const postRadius = ARENA.goal.postRadius;
    const posts = [
      { x: wallX, y: topBarY },
      { x: wallX, y: bottomRampY },
    ];

    for (const post of posts) {
      const dx = car.x - post.x;
      const dy = car.y - post.y;
      const dist = Math.hypot(dx, dy);
      const minDist = halfW * 0.65 + postRadius;
      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        car.x = post.x + nx * minDist;
        car.y = post.y + ny * minDist;
        const dot = car.vx * nx + car.vy * ny;
        if (dot < 0) {
          car.vx -= 1.3 * dot * nx;
          car.vy -= 1.3 * dot * ny;
        }
      }
    }
  }

  private resolveBallArenaCollisions(ball: Ball): 'blue' | 'orange' | null {
    const r = ball.radius;

    // Ground bounce
    if (ball.y + r >= ARENA.groundY) {
      ball.y = ARENA.groundY - r;
      ball.vy = -Math.abs(ball.vy) * PHYSICS.ball.bounceRestitution;
      ball.vx *= PHYSICS.ball.groundFriction;
      if (Math.abs(ball.vy) > 100) {
        sound.playBallHit(Math.min(1, Math.abs(ball.vy) / 600));
      }
    }

    // Ceiling bounce
    if (ball.y - r <= ARENA.ceilingY) {
      ball.y = ARENA.ceilingY + r;
      ball.vy = Math.abs(ball.vy) * PHYSICS.ball.bounceRestitution;
      if (Math.abs(ball.vy) > 120) {
        sound.playBallHit(Math.min(1, Math.abs(ball.vy) / 600));
      }
    }

    // Left elevated goal check
    const inLeftGoalMouthY = ball.y - r * 0.5 > ARENA.goal.mouthYTop && ball.y + r * 0.5 < ARENA.goal.mouthYBottom;

    if (ball.x - r <= ARENA.leftWallX) {
      if (inLeftGoalMouthY) {
        // Inside Blue Goal Mouth! If ball enters deep enough -> ORANGE SCORES!
        if (ball.x <= ARENA.leftWallX - 45) {
          return 'orange'; // Orange scored in Blue goal!
        }
      } else {
        // Hits left wall above or below goal
        ball.x = ARENA.leftWallX + r;
        ball.vx = Math.abs(ball.vx) * PHYSICS.ball.wallRestitution;
        sound.playBallHit(Math.min(1, Math.abs(ball.vx) / 600));
        this.emitWallSparks(ball.x - r, ball.y, '#3b82f6');
      }
    }

    // Right elevated goal check
    const inRightGoalMouthY = ball.y - r * 0.5 > ARENA.goal.mouthYTop && ball.y + r * 0.5 < ARENA.goal.mouthYBottom;

    if (ball.x + r >= ARENA.rightWallX) {
      if (inRightGoalMouthY) {
        // Inside Orange Goal Mouth! If ball enters deep enough -> BLUE SCORES!
        if (ball.x >= ARENA.rightWallX + 45) {
          return 'blue'; // Blue scored in Orange goal!
        }
      } else {
        // Hits right wall above or below goal
        ball.x = ARENA.rightWallX - r;
        ball.vx = -Math.abs(ball.vx) * PHYSICS.ball.wallRestitution;
        sound.playBallHit(Math.min(1, Math.abs(ball.vx) / 600));
        this.emitWallSparks(ball.x + r, ball.y, '#f97316');
      }
    }

    // Goal Post Circle & Roof Collisions for Ball
    this.resolveBallGoalStructures(ball, ARENA.leftWallX, true);
    this.resolveBallGoalStructures(ball, ARENA.rightWallX, false);

    return null;
  }

  private resolveBallGoalStructures(ball: Ball, wallX: number, isLeft: boolean) {
    const r = ball.radius;
    const topBarY = ARENA.goal.mouthYTop;
    const bottomRampY = ARENA.goal.mouthYBottom;

    // Roof of goal collision (ball bouncing on top of the crossbar net)
    const inNetX = isLeft
      ? ball.x >= wallX - ARENA.goal.depth && ball.x <= wallX
      : ball.x >= wallX && ball.x <= wallX + ARENA.goal.depth;

    if (inNetX) {
      // Bounce off roof
      if (ball.y + r >= topBarY && ball.y < topBarY + 15 && ball.vy > 0) {
        ball.y = topBarY - r;
        ball.vy = -Math.abs(ball.vy) * PHYSICS.ball.bounceRestitution;
        sound.playCrossbarHit();
      }
      // Bounce off bottom ramp
      else if (ball.y - r <= bottomRampY && ball.y > bottomRampY - 15 && ball.vy < 0) {
        ball.y = bottomRampY + r;
        ball.vy = Math.abs(ball.vy) * PHYSICS.ball.bounceRestitution;
        sound.playCrossbarHit();
      }
    }

    // Crossbar circle posts
    const postRadius = ARENA.goal.postRadius;
    const posts = [
      { x: wallX, y: topBarY },
      { x: wallX, y: bottomRampY },
    ];

    for (const post of posts) {
      const dx = ball.x - post.x;
      const dy = ball.y - post.y;
      const dist = Math.hypot(dx, dy);
      const minDist = r + postRadius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        ball.x = post.x + nx * minDist;
        ball.y = post.y + ny * minDist;

        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 1.35 * dot * nx;
          ball.vy -= 1.35 * dot * ny;
          sound.playCrossbarHit();
          this.emitWallSparks(post.x, post.y, '#ffffff');
        }
      }
    }
  }

  private resolveCarBallCollision(car: Car, ball: Ball) {
    const dx = ball.x - car.x;
    const dy = ball.y - car.y;
    const dist = Math.hypot(dx, dy);

    // Approximate car as an oriented capsule / box
    const carEffectiveRadius = car.width * 0.44;
    const minDist = carEffectiveRadius + ball.radius;

    if (dist >= minDist || dist <= 0.001) {
      return;
    }

    // Normal vector from car to ball
    const nx = dx / dist;
    const ny = dy / dist;

    // Car forward vector
    const facing = car.facing || 1;
    const carFwdX = facing * Math.cos(car.angle);
    const carFwdY = Math.sin(car.angle);

    // Car bottom / wheels normal vector (pointing down relative to car orientation)
    const carWheelsX = -facing * Math.sin(car.angle);
    const carWheelsY = Math.cos(car.angle);

    // Check hit location relative to car orientation
    const noseAlignment = nx * carFwdX + ny * carFwdY; // 1 = directly on nose, -1 = directly on tail
    const wheelsAlignment = nx * carWheelsX + ny * carWheelsY; // 1 = directly on wheels/belly, -1 = roof

    // 1. FLIP RESET ON BALL (Sideswipe core mechanic!)
    // If car wheels/belly hit the ball, grant immediate flip reset!
    if (wheelsAlignment > 0.35) {
      car.canFlip = true;
      car.jumpCount = 0;
      this.emitFlipResetSparkles(car.x, car.y);
    }

    // 2. DETECT SPECIAL SHOT TYPES (Sideswipe signature shots!)
    let shotType: SpecialShotType = 'none';
    let forceMultiplier = PHYSICS.ball.hitForceMultiplier;

    if (car.isFlipping) {
      // A. RED POWER SHOT: Nose hits ball while flipping forward!
      if (noseAlignment > 0.45) {
        shotType = 'red-power';
        forceMultiplier = PHYSICS.ball.redShotMultiplier;
        this.emitPowerShotShockwave(ball.x, ball.y, '#ef4444');
      }
      // B. PURPLE POP SHOT: Belly/wheels hit ball while dodging!
      else if (wheelsAlignment > 0.4) {
        shotType = 'purple-pop';
        forceMultiplier = PHYSICS.ball.purpleShotMultiplier;
        this.emitPowerShotShockwave(ball.x, ball.y, '#a855f7');
      }
      // C. GOLD SHOT: Tail hits ball while backflipping!
      else if (noseAlignment < -0.4) {
        shotType = 'gold-shot';
        forceMultiplier = PHYSICS.ball.goldShotMultiplier;
        this.emitPowerShotShockwave(ball.x, ball.y, '#eab308');
      }
    }

    // Separate overlapping ball and car
    const overlap = minDist - dist;
    ball.x += nx * overlap * 0.65;
    ball.y += ny * overlap * 0.65;
    car.x -= nx * overlap * 0.35;
    car.y -= ny * overlap * 0.35;

    // Relative velocity
    const rvx = ball.vx - car.vx;
    const rvy = ball.vy - car.vy;
    const velAlongNormal = rvx * nx + rvy * ny;

    // Impulse: energetic contact and progressive dynamic impulse for lively speed
    const baseImpulse = 340;
    const dynamicImpulse = Math.max(0, -velAlongNormal * 1.05);
    const totalImpulse = (baseImpulse + dynamicImpulse) * forceMultiplier;

    // Apply impulse to ball
    ball.vx += nx * totalImpulse * (1 / PHYSICS.ball.mass);
    ball.vy += ny * totalImpulse * (1 / PHYSICS.ball.mass);

    // Apply gentle recoil to car (prevents jarring bounce-back during aerial follow-ups)
    car.vx -= nx * totalImpulse * 0.10;
    car.vy -= ny * totalImpulse * 0.10;

    // Record shot metadata
    const ballSpeedKmh = Math.round(Math.hypot(ball.vx, ball.vy) * 0.11);
    ball.lastHitBy = car.name;
    ball.lastHitTeam = car.team;
    ball.lastHitSpeed = ballSpeedKmh;
    ball.specialShot = shotType;

    // Sound effect
    sound.playBallHit(Math.min(1, totalImpulse / 1200), shotType);

    // Impact sparks
    const sparkColor = shotType === 'red-power' ? '#ef4444' : shotType === 'purple-pop' ? '#a855f7' : shotType === 'gold-shot' ? '#facc15' : '#38bdf8';
    this.emitImpactSparks(ball.x, ball.y, sparkColor, shotType !== 'none' ? 24 : 12);
  }

  private resolveCarCarCollision(carA: Car, carB: Car) {
    const dx = carB.x - carA.x;
    const dy = carB.y - carA.y;
    const dist = Math.hypot(dx, dy);
    const minDist = carA.width * 0.8;

    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      carA.x -= nx * overlap * 0.5;
      carA.y -= ny * overlap * 0.5;
      carB.x += nx * overlap * 0.5;
      carB.y += ny * overlap * 0.5;

      // Exchange speed with bump force
      const bumpForce = 220;
      carA.vx -= nx * bumpForce;
      carA.vy -= ny * bumpForce;
      carB.vx += nx * bumpForce;
      carB.vy += ny * bumpForce;

      sound.playBallHit(0.3);
      this.emitImpactSparks((carA.x + carB.x) / 2, (carA.y + carB.y) / 2, '#94a3b8', 8);
    }
  }

  // Particle Emitters
  public emitBoostParticles(x: number, y: number, angle: number, boostType: string) {
    const colors: Record<string, string[]> = {
      'orange-flame': ['#f97316', '#fbbf24', '#ef4444'],
      'cyan-hyper': ['#06b6d4', '#38bdf8', '#e0f2fe'],
      'neon-plasma': ['#a855f7', '#ec4899', '#f43f5e'],
      'rainbow': ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      'electric-bolt': ['#facc15', '#67e8f9', '#ffffff', '#38bdf8'],
      'crimson-thermal': ['#dc2626', '#991b1b', '#f87171', '#450a0a'],
      'golden-spark': ['#eab308', '#fef08a', '#ca8a04', '#ffffff'],
      'ion-green': ['#10b981', '#4ade80', '#84cc16', '#a3e635'],
    };

    const colorPalette = colors[boostType] || colors['orange-flame'];

    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 0.45;
      const speed = 250 + Math.random() * 220;
      const pAngle = angle + Math.PI + spread;

      this.particles.push({
        id: ++this.particleIdCounter,
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        size: 5 + Math.random() * 7,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 0.22 + Math.random() * 0.12,
        type: 'boost',
        growth: -12,
      });
    }
  }

  public emitPowerShotShockwave(x: number, y: number, color: string) {
    // Large expanding ring shockwave
    this.particles.push({
      id: ++this.particleIdCounter,
      x,
      y,
      vx: 0,
      vy: 0,
      size: 20,
      color,
      alpha: 1.0,
      life: 0,
      maxLife: 0.45,
      type: 'shockwave',
      growth: 320,
    });
  }

  public emitFlipResetSparkles(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 120 + Math.random() * 90;
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: '#facc15', // gold sparkle
        alpha: 1.0,
        life: 0,
        maxLife: 0.35,
        type: 'spark',
      });
    }
  }

  public emitImpactSparks(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 320;
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        type: 'spark',
      });
    }
  }

  public emitWallSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 180;
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color,
        alpha: 0.8,
        life: 0,
        maxLife: 0.2,
        type: 'spark',
      });
    }
  }

  public emitGoalBlast(x: number, y: number, team: 'blue' | 'orange', explosionType: ExplosionType = 'shockwave') {
    const isBlue = team === 'blue';
    const primaryColor = isBlue ? '#3b82f6' : '#f97316';
    const secondaryColor = isBlue ? '#60a5fa' : '#fb923c';

    if (explosionType === 'solar') {
      // --- SOLAR EXPLOSION ---
      // 1. Core Shop-style animated solar-ray particle
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 50,
        color: '#f59e0b',
        alpha: 1.0,
        life: 0,
        maxLife: 1.4,
        type: 'solar-ray',
      });

      // 1. Huge Golden-white expanding shockwave core
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 50,
        color: '#f59e0b', // Gold
        alpha: 1.0,
        life: 0,
        maxLife: 1.0,
        type: 'shockwave',
        growth: 750,
      });
      // Secondary inner hot yellow shockwave
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 20,
        color: '#fef08a', // Hot yellow
        alpha: 1.0,
        life: 0.1,
        maxLife: 0.8,
        type: 'shockwave',
        growth: 600,
      });

      // 2. Solar fire sparks
      for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 200 + Math.random() * 800;
        const color = Math.random() > 0.6 ? '#ffffff' : (Math.random() > 0.3 ? '#facc15' : '#ef4444');
        this.particles.push({
          id: ++this.particleIdCounter,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 8,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 0.5 + Math.random() * 0.5,
          type: 'spark',
        });
      }

      // 3. Gold confetti
      const goldConfetti = ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'];
      for (let i = 0; i < 40; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;
        const speed = 250 + Math.random() * 450;
        this.particles.push({
          id: ++this.particleIdCounter,
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 5,
          color: goldConfetti[Math.floor(Math.random() * goldConfetti.length)],
          alpha: 1.0,
          life: 0,
          maxLife: 1.0 + Math.random() * 0.8,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
        });
      }

    } else if (explosionType === 'electro') {
      // --- ELECTRO EXPLOSION ---
      // 1. Core Shop-style animated electro-lightning particle
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 30,
        color: '#a855f7',
        alpha: 1.0,
        life: 0,
        maxLife: 1.4,
        type: 'electro-lightning',
      });

      // 1. High-voltage Cyan & Purple shockwave ring
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 30,
        color: '#22d3ee', // Cyan electric
        alpha: 1.0,
        life: 0,
        maxLife: 0.6,
        type: 'shockwave',
        growth: 900, // Super fast expansion!
      });
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 15,
        color: '#a855f7', // Electro violet
        alpha: 1.0,
        life: 0.05,
        maxLife: 0.5,
        type: 'shockwave',
        growth: 800,
      });

      // 2. High-frequency crackling electric lightning sparks
      for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        // High variation in speed to simulate crackling lightning bolt tips
        const speed = 400 + Math.random() * 1000;
        const color = Math.random() > 0.5 ? '#22d3ee' : (Math.random() > 0.3 ? '#c084fc' : '#ffffff');
        this.particles.push({
          id: ++this.particleIdCounter,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.4,
          type: 'spark',
        });
      }

      // 3. Cyber Confetti
      const cyberColors = ['#06b6d4', '#8b5cf6', '#ec4899', '#ffffff'];
      for (let i = 0; i < 30; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
        const speed = 300 + Math.random() * 500;
        this.particles.push({
          id: ++this.particleIdCounter,
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 5,
          color: cyberColors[Math.floor(Math.random() * cyberColors.length)],
          alpha: 1.0,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.6,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
        });
      }

    } else if (explosionType === 'supernova') {
      // --- SUPERNOVA COSMIC BURST ---
      // 1. Core Shop-style animated supernova-spiral particle
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 40,
        color: '#ec4899',
        alpha: 1.0,
        life: 0,
        maxLife: 1.6,
        type: 'supernova-spiral',
      });

      // 1. Triple concentric stellar expanding rings
      const supernovaColors = ['#ec4899', '#a855f7', '#6366f1'];
      supernovaColors.forEach((col, index) => {
        this.particles.push({
          id: ++this.particleIdCounter,
          x,
          y,
          vx: 0,
          vy: 0,
          size: 40 - index * 10,
          color: col,
          alpha: 1.0,
          life: index * 0.08, // staggered starts
          maxLife: 1.2 - index * 0.1,
          type: 'shockwave',
          growth: 500 - index * 50,
        });
      });

      // 2. Expanding swirling cosmic stardust
      for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 700;
        const color = Math.random() > 0.6 ? '#ec4899' : (Math.random() > 0.3 ? '#818cf8' : '#f472b6');
        this.particles.push({
          id: ++this.particleIdCounter,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 8,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.5, // longer lived!
          type: 'spark',
        });
      }

      // 3. Stardust confetti
      const starColors = ['#f472b6', '#c084fc', '#818cf8', '#ffffff', '#fdba74'];
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2; // omnidirectional stardust!
        const speed = 150 + Math.random() * 400;
        this.particles.push({
          id: ++this.particleIdCounter,
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 4,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          alpha: 1.0,
          life: 0,
          maxLife: 1.5 + Math.random() * 1.0,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
        });
      }

    } else {
      // --- SHOCKWAVE (CLASSIC / DEFAULT) ---
      // 1. Expanding shockwave ring
      this.particles.push({
        id: ++this.particleIdCounter,
        x,
        y,
        vx: 0,
        vy: 0,
        size: 40,
        color: primaryColor,
        alpha: 1.0,
        life: 0,
        maxLife: 0.8,
        type: 'shockwave',
        growth: 650,
      });

      // 2. High-speed blast sparks
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 650;
        this.particles.push({
          id: ++this.particleIdCounter,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: Math.random() > 0.5 ? primaryColor : secondaryColor,
          alpha: 1.0,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.4,
          type: 'spark',
        });
      }

      // 3. Celebratory confetti
      const confettiColors = ['#facc15', '#3b82f6', '#f97316', '#10b981', '#ec4899', '#ffffff'];
      for (let i = 0; i < 45; i++) {
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.4;
        const speed = 300 + Math.random() * 500;
        this.particles.push({
          id: ++this.particleIdCounter,
          x: x + (Math.random() - 0.5) * 80,
          y: y + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 6,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          alpha: 1.0,
          life: 0,
          maxLife: 1.2 + Math.random() * 0.8,
          type: 'confetti',
          rotation: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Linear fade out
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.type === 'shockwave') {
        p.size += (p.growth || 200) * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.type === 'confetti') {
          p.vy += PHYSICS.gravity * 0.4 * dt;
          p.vx *= 0.98;
          if (p.rotation !== undefined) {
            p.rotation += 4 * dt;
          }
        } else if (p.type === 'spark') {
          p.vx *= 0.95;
          p.vy *= 0.95;
        }
      }
    }
  }

  private lerpAngle(current: number, target: number, speed: number): number {
    const diff = (target - current + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return current + diff * Math.min(1, speed);
  }
}
