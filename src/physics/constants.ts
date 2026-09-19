export const MATCH_DURATION = 120; // 2 minutes in seconds (sideswipe standard)

export const ARENA = {
  width: 2400,
  height: 1100,
  groundY: 960,
  ceilingY: 140,
  leftWallX: 180,
  rightWallX: 2220,

  // Elevated Goal configuration (Authentic Sideswipe geometry)
  goal: {
    width: 140,
    mouthYTop: 580,
    mouthYBottom: 850,
    depth: 140,
    postRadius: 16,
    rampWidth: 100,
  }
};

export const PHYSICS = {
  gravity: 1050,
  airDrag: 0.993,
  groundFriction: 0.94,

  // Car Physics
  car: {
    width: 82,
    height: 38,
    mass: 1.0,
    driveAccel: 3200,
    maxDriveSpeed: 740,
    turnSpeed: 11.0, // radians/sec in air (snappy aerial orientation)
    jumpForce: 700,
    flipImpulse: 720,
    flipDuration: 0.30, // seconds
    boostAccel: 2250, // smooth, controllable aerial thrust
    maxBoostSpeed: 980,
    boostDrainRate: 22, // % per second (~4.5s of boost for sustained aerials)
    boostRechargeRate: 85, // % per second on surface
    bounceRestitution: 0.14,
    aerialControlForce: 440, // fine aerial glide maneuvering authority
  },

  // Ball Physics
  ball: {
    radius: 34,
    mass: 0.74, // balanced weight for lively speed and authentic contact
    bounceRestitution: 0.74, // energetic ground bounce
    wallRestitution: 0.76, // punchy rebounds off walls
    groundFriction: 0.97, // smooth roll with sustained momentum
    airDrag: 0.995, // balanced drag so ball carries speed nicely through the air
    gravity: 880, // good hang-time for aerial plays
    maxSpeed: 1350, // snappy, energetic top speed
    hitForceMultiplier: 1.18,
    redShotMultiplier: 1.62,
    purpleShotMultiplier: 1.45,
    goldShotMultiplier: 1.50,
  }
};
