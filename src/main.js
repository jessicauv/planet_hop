import * as THREE from 'three'
import { createScene, createStarfield, createSpaceAudio } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite, createInteractiveIntroText, updateInteractiveIntroText, createFactTextBox, updateFactTextBox } from './uiPanel'


const { scene, camera, renderer, controls } = createScene()

// Create stars + Milky Way - this will be visible throughout the entire experience
const { milkyWaySphere, closeStars, farStars, distantStars } = createStarfield(scene)

let currentIndex = 0
let currentFactIndex = 0
let currentPlanet
let currentText

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
  controls.update()

  // --- subtle rotation for motion ---
  closeStars.rotation.y += 0.0005
  farStars.rotation.y += 0.0002
  distantStars.rotation.y += 0.0001
  milkyWaySphere.rotation.y += 0.00005

  renderer.render(scene, camera)
})
