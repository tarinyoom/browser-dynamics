import * as THREE from 'three'

export function updatePositions(objects: { cubes: THREE.Mesh[] }) {
  objects.cubes.forEach(cube => {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  })
}
