import { SphereEntity } from './types'

export function updatePositions(entities: SphereEntity[]) {
  for (const e of entities) {
    e.position[0] += e.velocity[0]
    e.position[1] += e.velocity[1]
    e.position[2] += e.velocity[2]
  }
}
