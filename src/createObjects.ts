import * as THREE from 'three'

export function createObjects(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 })

  const cubes: THREE.Mesh[] = []

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const cube = new THREE.Mesh(geometry, material)
        cube.position.set(i - 0.5, j - 0.5, k - 0.5)
        cube.scale.set(0.1, 0.1, 0.1)
        scene.add(cube)
        cubes.push(cube)
      }
    }
  }

  return { cubes }
}
