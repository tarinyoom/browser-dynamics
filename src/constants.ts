export const globals: CalculationParameters = {
  timestep: 1/60,
  maxTimestepsPerFrame: 5,
  numParticles: 1000,
  smoothingRadius: 0.2,
  dim: 2,
  boxMin: -1.6,
  boxMax: 1.6,
  gravity: -1.0,
  taitC: 10.0,
  taitGamma: 7.0
} as const;

export const debug: DebugParameters = {
  recordUntil: 5000,
  pauseAfter: 1000
} as const;
