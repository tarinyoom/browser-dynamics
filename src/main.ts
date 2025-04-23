import * as THREE from 'three'

import { initScene } from './initScene'
import { createObjects } from './createObjects'
import { updatePositions } from './updatePositions'

function startAnimation(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  sceneObjects: ReturnType<typeof createObjects>
) {
  function animate() {
    requestAnimationFrame(animate)
    updatePositions(sceneObjects)
    renderer.render(scene, camera)
  }

  animate()
}

const { scene, camera, renderer } = initScene()
const sceneObjects = createObjects(scene)
startAnimation(renderer, scene, camera, sceneObjects)
