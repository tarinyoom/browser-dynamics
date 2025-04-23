import * as THREE from 'three'
import { SphereEntity } from './types'

export function createObjects(scene: THREE.Scene) {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16)
  const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 })

  const meshes: THREE.Mesh[] = []
  const entities: SphereEntity[] = []

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const mesh = new THREE.Mesh(geometry, material)
        const position: [number, number, number] = [i - 0.5, j - 0.5, k - 0.5]
        const scale: [number, number, number] = [0.1, 0.1, 0.1]
        const velocity: [number, number, number] = [0, 0, 0]

        mesh.position.set(...position)
        mesh.scale.set(...scale)
        scene.add(mesh)

        meshes.push(mesh)
        entities.push({ position, scale, velocity })
      }
    }
  }

  return { entities, meshes }
}
