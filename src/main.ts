import { initScene } from './initScene'
import { createObjects } from './createObjects'
import { updatePositions } from './updatePositions'

function startAnimation(renderer, scene, camera, sceneObjects) {
  function animate() {
    requestAnimationFrame(animate)

    updatePositions(sceneObjects.entities)

    for (let i = 0; i < sceneObjects.entities.length; i++) {
      const entity = sceneObjects.entities[i]
      const mesh = sceneObjects.meshes[i]
    
      mesh.position.set(...entity.position)
      mesh.scale.set(...entity.scale)
    }    

    renderer.render(scene, camera)
  }

  animate()
}

const { scene, camera, renderer } = initScene()
const sceneObjects = createObjects(scene)
startAnimation(renderer, scene, camera, sceneObjects)
