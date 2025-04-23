export type Vec3 = [number, number, number]

export interface CubeEntity {
  position: Vec3
  rotation: Vec3
  scale: Vec3
  velocity: Vec3
  angularVelocity: Vec3
}
