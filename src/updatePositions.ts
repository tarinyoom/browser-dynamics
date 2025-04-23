import { CubeEntity } from './types'

export function updatePositions(cubes: CubeEntity[]) {
  for (const cube of cubes) {
    cube.rotation[0] += cube.angularVelocity[0]
    cube.rotation[1] += cube.angularVelocity[1]
    cube.rotation[2] += cube.angularVelocity[2]

    cube.position[0] += cube.velocity[0]
    cube.position[1] += cube.velocity[1]
    cube.position[2] += cube.velocity[2]
  }
}
