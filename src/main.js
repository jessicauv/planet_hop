import * as THREE from 'three'
import { createScene, createStarfield, createSpaceAudio } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite, createInteractiveIntroText, updateInteractiveIntroText, createFactTextBox, updateFactTextBox, createSelectionMessageBox, createNameLabel, createResultBox, updateResultBox, createPlanetHopLogo } from './uiPanel'


const { scene, camera, renderer, controls } = createScene()

// Create stars + Milky Way - this will be visible throughout the entire experience
const { milkyWaySphere, closeStars, farStars, distantStars } = createStarfield(scene)

let currentIndex = 0
let currentFactIndex = 0
let currentPlanet
let currentText

// Selection screen state
let selectionMode = false
let selectionPlanets = []
let selectionNameLabels = []
let selectionMessageSprite = null
let resultSprite = null
let resultMessages = []
let resultMessageIndex = 0
let planetHopLogo = null

function showPlanetHopLogo() {
  if (!planetHopLogo) {
    planetHopLogo = createPlanetHopLogo()
    // Position in top-left corner of camera view
    planetHopLogo.position.set(-4.0, 3.0, 0)
    scene.add(planetHopLogo)
  }
}

function hidePlanetHopLogo() {
  if (planetHopLogo) {
    scene.remove(planetHopLogo)
    planetHopLogo = null
  }
}

function showPlanetSelection() {
  // Hide Planet Hop logo for selection screen
  hidePlanetHopLogo()
  
  // Clear current planet and text
  if (currentPlanet) { scene.remove(currentPlanet); currentPlanet = null }
  if (currentText) { scene.remove(currentText); currentText = null }

  // Zoom camera out to see all planets
  camera.position.set(0, 1.6, 13)
  controls.target.set(0, 0, 0)
  controls.update()

  // Show selection message
  selectionMessageSprite = createSelectionMessageBox()
  selectionMessageSprite.position.set(0, 3.5, 0)
  scene.add(selectionMessageSprite)

  // Lay out all planets in a row
  const spacing = 2.5
  const startX = -(planets.length - 1) * spacing / 2

  planets.forEach((planetData, i) => {
    const planet = createPlanet(planetData)
    planet.position.set(startX + i * spacing, 0, 0)
    planet.scale.set(0.65, 0.65, 0.65)
    planet.userData = { planetName: planetData.name, planetData }
    scene.add(planet)
    selectionPlanets.push(planet)

    const label = createNameLabel(planetData.name)
    label.position.set(startX + i * spacing, -1.3, 0)
    scene.add(label)
    selectionNameLabels.push(label)
  })

  selectionMode = true
}

function clearSelectionScreen() {
  if (selectionMessageSprite) { scene.remove(selectionMessageSprite); selectionMessageSprite = null }
  selectionPlanets.forEach(p => scene.remove(p))
  selectionNameLabels.forEach(l => scene.remove(l))
  selectionPlanets = []
  selectionNameLabels = []
  selectionMode = false
}

function loadPlanet(index, factIndex = 0) {
  if (currentPlanet) {
    scene.remove(currentPlanet)
    scene.remove(currentText)
  }

  currentFactIndex = factIndex

  const data = planets[index]
  currentPlanet = createPlanet(data)
  currentPlanet.position.set(-2, 0, 0)
  currentPlanet.scale.set(2.2, 2.2, 2.2)
  scene.add(currentPlanet)

  // Create fact text box showing the first fact
  currentText = createFactTextBox(data.facts[factIndex], data.name, index, factIndex, data.facts.length)
  currentText.position.set(4, 0, 0)
  currentText.scale.set(5.33, 3, 1)
  scene.add(currentText)
  
  // Show Planet Hop logo for planet fact screens
  showPlanetHopLogo()
}

const introScreen = document.getElementById("introScreen")
const launchBtn = document.getElementById("launchBtn")

let gameStarted = false
let spaceAudio
let introText
let introTextState = 0

launchBtn.addEventListener("click", (event) => {
  event.stopPropagation()  // Prevent click from bubbling up to window click handler
  console.log('Launch button clicked')
  introScreen.style.opacity = "0"
  setTimeout(() => {
    introScreen.style.display = "none"
  }, 500)
  
  // Create and play space audio when launching
  console.log('Creating space audio...')
  spaceAudio = createSpaceAudio()
  console.log('Audio object created:', spaceAudio)
  
  // Resume audio context if needed
  if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
    const audioCtx = new (AudioContext || webkitAudioContext)();
    audioCtx.resume().then(() => {
      console.log('Audio context resumed')
    }).catch(err => {
      console.error('Failed to resume audio context:', err)
    })
  }
  
  console.log('Attempting to play audio...')
  spaceAudio.play()
  console.log('Audio play method called')
  
  // Show intro text before showing planets
  console.log('Creating interactive intro text...')
  introText = createInteractiveIntroText(introTextState)
  console.log('Interactive intro text created:', introText)
  console.log('Intro text material:', introText.material)
  console.log('Intro text map:', introText.material.map)
  
  // Position intro text properly in camera view
  introText.position.set(0, 0.8, -1.5)  // Move closer to camera for better visibility
  introText.scale.set(8, 4, 1)          // Set appropriate scale for the scene
  scene.add(introText)
  console.log('Interactive intro text added to scene at position:', introText.position)
  
  // Show Planet Hop logo for 3D scenes
  showPlanetHopLogo()
  
  // Don't load the planet yet - wait for user click
  
  gameStarted = true
})

// Raycaster for interactive text navigation
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Click to interact with intro text or move to next planet - only after game has started
window.addEventListener("click", (event) => {
  if (gameStarted && introText) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera)
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(introText)
    
    if (intersects.length > 0) {
      // User clicked on the intro text
      const intersection = intersects[0]
      const uv = intersection.uv
      
      // Convert UV coordinates to canvas coordinates
      const canvasWidth = 2560
      const canvasHeight = 1280
      const clickX = uv.x * canvasWidth
      const clickY = (1 - uv.y) * canvasHeight
      
      // Check if clicked on navigation buttons (now at bottom)
      const backButtonArea = { x: 50, y: canvasHeight - 150, width: 100, height: 100 }
      const forwardButtonArea = { x: canvasWidth - 150, y: canvasHeight - 150, width: 100, height: 100 }
      
      const inBackButton = clickX >= backButtonArea.x && clickX <= backButtonArea.x + backButtonArea.width &&
                          clickY >= backButtonArea.y && clickY <= backButtonArea.y + backButtonArea.height
      
      const inForwardButton = clickX >= forwardButtonArea.x && clickX <= forwardButtonArea.x + forwardButtonArea.width &&
                             clickY >= forwardButtonArea.y && clickY <= forwardButtonArea.y + forwardButtonArea.height
      
      if (inBackButton && introTextState > 0) {
        // Go back to first state
        introTextState = 0
        updateInteractiveIntroText(introText, introTextState)
        console.log('Navigated back to state:', introTextState)
      } else if (inForwardButton) {
        if (introTextState < 2) {
          // Go forward to next state
          introTextState++
          updateInteractiveIntroText(introText, introTextState)
          console.log('Navigated forward to state:', introTextState)
        } else {
          // On final state, remove intro text and show planets
          scene.remove(introText)
          introText = null
          
          // Now show the first planet (Sun)
          currentIndex = 0
          loadPlanet(currentIndex)
        }
      }
      // If clicked on main text area, do nothing (keep current state)
    }
  } else if (gameStarted && selectionMode) {
    // Handle planet selection click
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(selectionPlanets)
    if (intersects.length > 0) {
      const clicked = intersects[0].object
      const { planetName, planetData } = clicked.userData

      clearSelectionScreen()

      // Build 3-message result sequence
      const firstMessage = planetName === 'Mars'
        ? "Correct! Humans may be able to live on Mars but only with technology and protection!"
        : planetData.facts[2]

      resultMessages = [
        firstMessage,
        "Now, the real mission is protecting Earth. Earth is our best home. It has Liquid water, Oxygen, Forests, Animals, A protective atmosphere.",
        "We need to work together to cool the planet and protect our future. You can help by: 🌳 Planting trees, ⚡ Using clean energy, 🚲 Riding bikes or walking, ♻️ Reducing waste, 💡 Saving electricity. This is called Climate Action."
      ]
      resultMessageIndex = 0

      resultSprite = createResultBox(resultMessages[0], 0, resultMessages.length)
      resultSprite.position.set(0, 0, 0)
      scene.add(resultSprite)
      
      // Show Planet Hop logo for result screens
      showPlanetHopLogo()
    }
  } else if (gameStarted && resultSprite) {
    // Navigate result messages via arrows
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObject(resultSprite)
    if (intersects.length > 0) {
      const uv = intersects[0].uv
      const canvasWidth = 1920
      const canvasHeight = 720
      const clickX = uv.x * canvasWidth
      const clickY = (1 - uv.y) * canvasHeight

      const { backButtonArea, forwardButtonArea } = resultSprite.userData

      const inBack = clickX >= backButtonArea.x && clickX <= backButtonArea.x + backButtonArea.width &&
                     clickY >= backButtonArea.y && clickY <= backButtonArea.y + backButtonArea.height
      const inForward = clickX >= forwardButtonArea.x && clickX <= forwardButtonArea.x + forwardButtonArea.width &&
                        clickY >= forwardButtonArea.y && clickY <= forwardButtonArea.y + forwardButtonArea.height

      if (inForward && resultMessageIndex < resultMessages.length - 1) {
        resultMessageIndex++
        updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length)
      } else if (inBack && resultMessageIndex > 0) {
        resultMessageIndex--
        updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length)
      }
    }
  } else if (gameStarted && currentText) {
    // Navigate planets via arrows on the fact text box
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(currentText)

    if (intersects.length > 0) {
      const uv = intersects[0].uv
      const canvasWidth = 1280
      const canvasHeight = 720
      const clickX = uv.x * canvasWidth
      const clickY = (1 - uv.y) * canvasHeight

      const { backButtonArea, forwardButtonArea } = currentText.userData

      const inBack = clickX >= backButtonArea.x && clickX <= backButtonArea.x + backButtonArea.width &&
                     clickY >= backButtonArea.y && clickY <= backButtonArea.y + backButtonArea.height

      const inForward = clickX >= forwardButtonArea.x && clickX <= forwardButtonArea.x + forwardButtonArea.width &&
                        clickY >= forwardButtonArea.y && clickY <= forwardButtonArea.y + forwardButtonArea.height

      const data = planets[currentIndex]
      const totalFacts = data.facts.length

      if (inForward) {
        if (currentFactIndex < totalFacts - 1) {
          // Show next fact for same planet
          currentFactIndex++
          updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, totalFacts)
        } else if (currentIndex < planets.length - 1) {
          // All facts seen — advance to next planet
          currentIndex++
          loadPlanet(currentIndex, 0)
        } else {
          // Last fact of last planet — show planet selection screen
          showPlanetSelection()
        }
      } else if (inBack) {
        if (currentFactIndex > 0) {
          // Go to previous fact on same planet
          currentFactIndex--
          updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, totalFacts)
        } else if (currentIndex > 0) {
          // Go to previous planet at its last fact
          currentIndex--
          const prevData = planets[currentIndex]
          loadPlanet(currentIndex, prevData.facts.length - 1)
        }
      }
    }
  }
})

renderer.setAnimationLoop(() => {
  if (currentPlanet) currentPlanet.rotation.y += 0.003
  selectionPlanets.forEach(p => p.rotation.y += 0.005)
  controls.update()

  // --- subtle rotation for motion ---
  closeStars.rotation.y += 0.0005
  farStars.rotation.y += 0.0002
  distantStars.rotation.y += 0.0001
  milkyWaySphere.rotation.y += 0.00005

  renderer.render(scene, camera)
})
