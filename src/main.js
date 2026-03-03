import * as THREE from 'three'
import { createScene, createStarfield } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite } from './uiPanel'

const { scene, camera, renderer, controls } = createScene()

// Create stars + Milky Way - this will be visible throughout the entire experience
const { milkyWaySphere, closeStars, farStars, distantStars } = createStarfield(scene)

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
  currentPlanet.position.set(0, 1.6, 0)  // Move planet to z=0 (closer to camera)
  scene.add(currentPlanet)

  currentText = createTextSprite(data.fact)
  currentText.position.set(0, 3, 0)  // Move text to z=0 (closer to camera)
  scene.add(currentText)
}

const introScreen = document.getElementById("introScreen")
const launchBtn = document.getElementById("launchBtn")

let gameStarted = false

launchBtn.addEventListener("click", () => {
  introScreen.style.opacity = "0"
  setTimeout(() => {
    introScreen.style.display = "none"
  }, 500)
  loadPlanet(currentIndex)
  gameStarted = true
})

// Click to move to next planet - only after game has started
window.addEventListener("click", () => {
  if (gameStarted) {
    currentIndex++
    if (currentIndex >= planets.length) currentIndex = 0
    loadPlanet(currentIndex)
  }
})

renderer.setAnimationLoop(() => {
  if (currentPlanet) currentPlanet.rotation.y += 0.003
  controls.update()

  // --- subtle rotation for motion ---
  closeStars.rotation.y += 0.0005
  farStars.rotation.y += 0.0002
  distantStars.rotation.y += 0.0001
  milkyWaySphere.rotation.y += 0.00005

  renderer.render(scene, camera)
})
