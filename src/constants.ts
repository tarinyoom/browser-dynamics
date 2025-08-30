export const globals: CalculationParameters = {
  timestep: 1/2000,
  maxTimestepsPerFrame: 5,
  numParticles: 1000,
  smoothingRadius: 0.3,
  dim: 2,
  boxMin: -1.6,
  boxMax: 1.6,
  gravity: -200.0,
  taitC: 10.0,
  taitGamma: 7.0
} as const;

export const debug: DebugParameters = {
  recordUntil: 7000,
  pauseAfter: 50000,
  colorMode: 'pressure'
} as const;
