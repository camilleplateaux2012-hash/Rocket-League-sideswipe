import { ARENA, PHYSICS } from '../physics/constants';
import { Ball, BotDifficulty, Car, InputControls } from '../types/game';

export class BotController {
  private flipTimer = 0;
  private jumpHoldTimer = 0;
  private decisionTimer = 0;

  public getControls(bot: Car, ball: Ball, difficulty: BotDifficulty, dt: number): InputControls {
    this.decisionTimer += dt;
    this.flipTimer = Math.max(0, this.flipTimer - dt);
    this.jumpHoldTimer = Math.max(0, this.jumpHoldTimer - dt);

    const controls: InputControls = {
      steerX: 0,
      steerY: 0,
      jumpPressed: false,
      jumpJustPressed: false,
      boostPressed: false,
      airRollPressed: false,
    };

    // Orange Bot coordinates:
    // Opponent (Blue) Goal is on the LEFT: X = ARENA.leftWallX (180), Y = 715
    const opponentGoalX = ARENA.leftWallX + 30;
    const opponentGoalY = (ARENA.goal.mouthYTop + ARENA.goal.mouthYBottom) / 2; // ~715
    // Own (Orange) Goal is on the RIGHT: X = ARENA.rightWallX (2220), Y = 715
    const ownGoalX = ARENA.rightWallX - 40;
    const ownGoalY = (ARENA.goal.mouthYTop + ARENA.goal.mouthYBottom) / 2; // ~715

    // Ensure bot faces left (towards opponent net) during play
    if (bot.facing === 1 && bot.isGrounded && Math.random() < 0.2) {
      controls.airRollPressed = true;
    }

    // Ball trajectory prediction based on difficulty
    let predTime = 0.25;
    if (difficulty === 'novice') predTime = 0.12;
    if (difficulty === 'all-star') predTime = 0.45;

    // Clamp predicted ball inside arena bounds
    const predictedBallX = Math.max(ARENA.leftWallX + 50, Math.min(ARENA.rightWallX - 50, ball.x + ball.vx * predTime));
    const predictedBallY = Math.max(ARENA.ceilingY + 50, Math.min(ARENA.groundY - ball.radius, ball.y + ball.vy * predTime));

    // Vector from ball towards opponent net (we ALWAYS want to push the ball in this direction!)
    const aimDx = opponentGoalX - predictedBallX;
    const aimDy = opponentGoalY - predictedBallY;
    const aimDist = Math.hypot(aimDx, aimDy) || 1;
    const aimNormX = aimDx / aimDist; // negative (< 0), pointing left
    const aimNormY = aimDy / aimDist;

    // Strike point: optimal contact spot is on the RIGHT side of the ball, so any hit sends it LEFT towards Blue goal
    const offsetDist = ball.radius + 32;
    const strikePointX = predictedBallX - aimNormX * offsetDist; // to the right (since aimNormX < 0)
    const strikePointY = predictedBallY - aimNormY * (ball.radius + 15);

    const distToBall = Math.hypot(predictedBallX - bot.x, predictedBallY - bot.y);
    const distToStrike = Math.hypot(strikePointX - bot.x, strikePointY - bot.y);

    // Ball relative position:
    // Is bot safely behind the ball (i.e. between ball and own Orange goal)?
    const isBehindBall = bot.x > predictedBallX + 25;
    // Is the ball a dangerous threat heading toward or near our own goal?
    const isThreatToOwnGoal = predictedBallX > ARENA.rightWallX - 550 || (ball.vx > 80 && predictedBallX > 1400);

    // =========================================================================
    // CASE 1: DANGEROUS SITUATION - Ball is BEHIND bot (between bot and own goal)
    // =========================================================================
    if (!isBehindBall) {
      // STRICT ANTI-OWN-GOAL DIRECTIVE:
      // NEVER flip right into the ball.
      // NEVER boost right directly into the ball when close.

      if (isThreatToOwnGoal) {
        // Goalkeeper Emergency Defense!
        if (bot.x > ARENA.rightWallX - 250) {
          // Bot is already in its goal area: act as a stone wall / goalkeeper!
          // Face outward (left) towards the incoming ball
          if (bot.facing === 1) {
            controls.airRollPressed = true;
          }

          // Move to intercept the ball height
          const goalCenterY = ownGoalY;
          const targetDefendY = Math.max(ARENA.goal.mouthYTop - 20, Math.min(ARENA.goal.mouthYBottom, predictedBallY));

          if (bot.isGrounded) {
            if (predictedBallY < ARENA.groundY - 70) {
              // Jump up to make the save!
              controls.jumpPressed = true;
              controls.jumpJustPressed = true;
              controls.steerX = -1; // Leap LEFT to swat the ball out!
              controls.steerY = -1;
              if (bot.boost > 15) controls.boostPressed = true;
            } else {
              // Ground block: position slightly out from net
              controls.steerX = -0.5; // push slightly leftward into the ball
            }
          } else {
            // Aerial save: push ball LEFT away from net
            controls.steerX = -1;
            controls.steerY = predictedBallY < bot.y ? -0.8 : 0.2;
            controls.boostPressed = bot.boost > 10;
          }
          return controls;
        } else {
          // Bot is caught forward while ball is threatening goal!
          // If ball is high up, bot can sprint under it back to goal
          if (predictedBallY < bot.y - 70 && Math.abs(predictedBallX - bot.x) < 200) {
            controls.steerX = 1; // sprint right underneath the ball without touching it
            if (bot.boost > 20 && difficulty !== 'novice') {
              controls.boostPressed = true;
            }
          } else if (Math.abs(predictedBallX - bot.x) < 80) {
            // Ball is right on top/ahead of bot: Pop it straight UP to buy time!
            controls.steerX = -0.2; // slight bias away from net
            controls.steerY = -1;
            controls.jumpPressed = true;
            controls.jumpJustPressed = bot.isGrounded;
          } else {
            // Retreat to backpost / goal mouth
            controls.steerX = 1;
          }
          return controls;
        }
      } else {
        // Midfield situation: ball is behind bot, but NOT an immediate goal threat.
        // The bot should rotate back to get behind the ball (to the right of strikePointX)
        const safeRotateTargetX = strikePointX + 110;
        if (bot.x < safeRotateTargetX) {
          // Drive right to get behind the ball
          controls.steerX = 1;

          // If jumping or dodging right would hit the ball, DO NOT JUMP OR BOOST
          const isNearBall = distToBall < 130;
          if (!isNearBall && bot.boost > 45 && difficulty === 'all-star') {
            controls.boostPressed = true;
          }
        }
        return controls;
      }
    }

    // =========================================================================
    // CASE 2: SAFE OFFENSIVE & CLEARING POSITION (Bot is behind the ball)
    // All momentum here safely pushes the ball toward the opponent (Blue) goal!
    // =========================================================================

    // 1. Horizontal steering: drive left towards strike position
    const dxToStrike = strikePointX - bot.x;
    if (dxToStrike < -15) {
      controls.steerX = -1; // drive left into ball
    } else if (dxToStrike > 30) {
      controls.steerX = 1; // slight positioning
    } else {
      controls.steerX = -1; // follow-through left
    }

    // 2. Aerial & In-Air Play
    if (!bot.isGrounded) {
      // Calculate target angle to strike ball toward opponent goal
      const targetAngle = Math.atan2(predictedBallY - bot.y, predictedBallX - bot.x);
      const localSteerX = bot.facing === 1 ? Math.cos(targetAngle) : -Math.cos(targetAngle);
      const localSteerY = Math.sin(targetAngle);

      controls.steerX = -1; // Keep leftward thrust/orientation
      controls.steerY = localSteerY;

      // Aerial Boost:
      // If car is pointing towards ball and ball is in air
      const shouldAerial = difficulty !== 'novice' && predictedBallY < ARENA.groundY - 110;
      if (shouldAerial && distToBall > 70 && bot.boost > 10) {
        controls.boostPressed = true;
      }

      // Flip Dodge into ball:
      // STRICT RULE: ONLY FLIP LEFT (towards opponent goal), NEVER RIGHT!
      const canFlipDodge = difficulty === 'all-star' || (difficulty === 'pro' && Math.random() < 0.6);
      if (canFlipDodge && distToBall < 110 && bot.canFlip && this.flipTimer <= 0) {
        controls.jumpJustPressed = true;
        controls.steerX = -1; // 100% Guaranteed forward strike toward Blue net
        controls.steerY = predictedBallY < bot.y ? -0.8 : 0.4;
        this.flipTimer = 1.2;
      }
    } else {
      // 3. Ground Play
      // Jump if ball is airborne and in striking range
      const maxJumpHeight = difficulty === 'novice' ? 140 : 350;
      const isBallInAir = predictedBallY < ARENA.groundY - 65 && predictedBallY > ARENA.groundY - maxJumpHeight;
      const isCloseEnoughToJump = distToBall < 230 && bot.x > predictedBallX - 10;

      if (isBallInAir && isCloseEnoughToJump) {
        controls.jumpPressed = true;
        controls.jumpJustPressed = true;

        if (difficulty !== 'novice' && bot.boost > 15) {
          controls.steerY = -1; // angle nose up for aerial
        }
      }

      // Ground boost to close in on shot
      if (distToBall > 320 && bot.boost > 35 && difficulty !== 'novice') {
        controls.boostPressed = true;
      }
    }

    return controls;
  }
}
