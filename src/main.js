import * as THREE from 'three'
import { createScene } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite } from './uiPanel'

const { scene, camera, renderer } = createScene()

let currentIndex = 0
let currentPlanet
let currentText

function loadPlanet(index) {
  if (currentPlanet) {
    scene.remove(currentPlanet)
    scene.remove(currentText)
  }

  const data = planets[index]
  currentPlanet = createPlanet(data)
  currentPlanet.position.set(0, 1.6, -3)
  scene.add(currentPlanet)

  currentText = createTextSprite(data.fact)
  currentText.position.set(0, 3, -3)
  scene.add(currentText)
}

loadPlanet(currentIndex)

// Click to move to next planet
window.addEventListener("click", () => {
  currentIndex++
  if (currentIndex >= planets.length) currentIndex = 0
  loadPlanet(currentIndex)
})

renderer.setAnimationLoop(() => {
  if (currentPlanet) {
    currentPlanet.rotation.y += 0.003
  }
  renderer.render(scene, camera)
})