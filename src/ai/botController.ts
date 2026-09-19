import { ARENA, PHYSICS } from '../physics/constants';
import { Ball, BotDifficulty, Car, InputControls, Team } from '../types/game';

export class BotController {
  private flipTimer = 0;
  private jumpHoldTimer = 0;
  private decisionTimer = 0;

  public getControls(bot: Car, ball: Ball, difficulty: BotDifficulty, dt: number, team: Team = 'orange'): InputControls {
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

    const isOrange = team === 'orange';

    // Opponent Goal & Own Goal based on team
    const opponentGoalX = isOrange ? (ARENA.leftWallX + 30) : (ARENA.rightWallX - 30);
    const opponentGoalY = (ARENA.goal.mouthYTop + ARENA.goal.mouthYBottom) / 2;
    const ownGoalX = isOrange ? (ARENA.rightWallX - 40) : (ARENA.leftWallX + 40);
    const ownGoalY = (ARENA.goal.mouthYTop + ARENA.goal.mouthYBottom) / 2;

    const desiredFacing = isOrange ? -1 : 1;
    if (bot.facing !== desiredFacing && bot.isGrounded && Math.random() < 0.25) {
      controls.airRollPressed = true;
    }

    // Enhanced stronger bot prediction based on difficulty
    let predTime = 0.35;
    if (difficulty === 'novice') predTime = 0.18;
    if (difficulty === 'pro') predTime = 0.55;
    if (difficulty === 'all-star') predTime = 0.85;

    const predictedBallX = Math.max(ARENA.leftWallX + 40, Math.min(ARENA.rightWallX - 40, ball.x + ball.vx * predTime));
    const predictedBallY = Math.max(ARENA.ceilingY + 40, Math.min(ARENA.groundY - ball.radius, ball.y + ball.vy * predTime));

    const aimDx = opponentGoalX - predictedBallX;
    const aimDy = opponentGoalY - predictedBallY;
    const aimDist = Math.hypot(aimDx, aimDy) || 1;
    const aimNormX = aimDx / aimDist;
    const aimNormY = aimDy / aimDist;

    const offsetDist = ball.radius + 35;
    const strikePointX = predictedBallX - aimNormX * offsetDist;
    const strikePointY = predictedBallY - aimNormY * (ball.radius + 15);

    const distToBall = Math.hypot(predictedBallX - bot.x, predictedBallY - bot.y);

    const isBehindBall = isOrange ? (bot.x > predictedBallX + 25) : (bot.x < predictedBallX - 25);
    const isThreatToOwnGoal = isOrange
      ? (predictedBallX > ARENA.rightWallX - 600 || (ball.vx > 60 && predictedBallX > 1300))
      : (predictedBallX < ARENA.leftWallX + 600 || (ball.vx < -60 && predictedBallX < 1100));

    if (!isBehindBall) {
      if (isThreatToOwnGoal) {
        const inGoalArea = isOrange ? (bot.x > ARENA.rightWallX - 280) : (bot.x < ARENA.leftWallX + 280);
        if (inGoalArea) {
          if (bot.isGrounded) {
            if (predictedBallY < ARENA.groundY - 60) {
              controls.jumpPressed = true;
              controls.jumpJustPressed = true;
              controls.steerX = isOrange ? -1 : 1;
              controls.steerY = -1;
              if (bot.boost > 10) controls.boostPressed = true;
            } else {
              controls.steerX = isOrange ? -0.5 : 0.5;
            }
          } else {
            controls.steerX = isOrange ? -1 : 1;
            controls.steerY = predictedBallY < bot.y ? -0.8 : 0.2;
            controls.boostPressed = bot.boost > 8;
          }
          return controls;
        } else {
          if (Math.abs(predictedBallX - bot.x) < 90) {
            controls.steerX = isOrange ? -0.2 : 0.2;
            controls.steerY = -1;
            controls.jumpPressed = true;
            controls.jumpJustPressed = bot.isGrounded;
          } else {
            controls.steerX = isOrange ? 1 : -1;
          }
          return controls;
        }
      } else {
        const safeRotateTargetX = isOrange ? (strikePointX + 120) : (strikePointX - 120);
        const needMove = isOrange ? (bot.x < safeRotateTargetX) : (bot.x > safeRotateTargetX);
        if (needMove) {
          controls.steerX = isOrange ? 1 : -1;
          if (distToBall > 140 && bot.boost > 35 && difficulty !== 'novice') {
            controls.boostPressed = true;
          }
        }
        return controls;
      }
    }

    // Offensive & Clearing Play
    const dxToStrike = strikePointX - bot.x;
    if (isOrange) {
      if (dxToStrike < -15) controls.steerX = -1;
      else if (dxToStrike > 30) controls.steerX = 1;
      else controls.steerX = -1;
    } else {
      if (dxToStrike > 15) controls.steerX = 1;
      else if (dxToStrike < -30) controls.steerX = -1;
      else controls.steerX = 1;
    }

    if (!bot.isGrounded) {
      const targetAngle = Math.atan2(predictedBallY - bot.y, predictedBallX - bot.x);
      const localSteerX = bot.facing === 1 ? Math.cos(targetAngle) : -Math.cos(targetAngle);
      const localSteerY = Math.sin(targetAngle);

      controls.steerX = isOrange ? -1 : 1;
      controls.steerY = localSteerY;

      const shouldAerial = difficulty !== 'novice' && predictedBallY < ARENA.groundY - 90;
      if (shouldAerial && distToBall > 60 && bot.boost > 8) {
        controls.boostPressed = true;
      }

      const canFlipDodge = difficulty === 'all-star' || (difficulty === 'pro' && Math.random() < 0.75);
      if (canFlipDodge && distToBall < 120 && bot.canFlip && this.flipTimer <= 0) {
        controls.jumpJustPressed = true;
        controls.steerX = isOrange ? -1 : 1;
        controls.steerY = predictedBallY < bot.y ? -0.85 : 0.4;
        this.flipTimer = 1.0;
      }
    } else {
      const maxJumpHeight = difficulty === 'novice' ? 150 : 380;
      const isBallInAir = predictedBallY < ARENA.groundY - 60 && predictedBallY > ARENA.groundY - maxJumpHeight;
      const isCloseEnoughToJump = distToBall < 260 && (isOrange ? (bot.x > predictedBallX - 15) : (bot.x < predictedBallX + 15));

      if (isBallInAir && isCloseEnoughToJump) {
        controls.jumpPressed = true;
        controls.jumpJustPressed = true;
        if (difficulty !== 'novice' && bot.boost > 10) {
          controls.steerY = -1;
        }
      }

      if (distToBall > 280 && bot.boost > 25 && difficulty !== 'novice') {
        controls.boostPressed = true;
      }
    }

    return controls;
  }
}
