import * as THREE from 'three'
import { Howl, Howler } from 'howler'
import { createScene, createStarfield, createSpaceAudio } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite, createInteractiveIntroText, updateInteractiveIntroText, createFactTextBox, updateFactTextBox, createSelectionMessageBox, createNameLabel, createResultBox, updateResultBox, createPlanetHopLogo } from './uiPanel'

const forwardSound = new Howl({ src: ['/audio/front_arrow.ogg'] })
const backSound = new Howl({ src: ['/audio/back_arrow.ogg'] })
const resultSound = new Howl({ src: ['/audio/result.ogg'] })
const successSound = new Howl({ src: ['/audio/success.ogg'] })


const { scene, camera, renderer, controls, vrButton } = createScene()

// ─── Responsive layout constants (1 unit ≈ 1 metre in VR) ──────────────────
let isVRMode = false
const DESKTOP = {
  introPos:      [0, 0.8, -1.5],  introScale:    [8, 4, 1],
  planetPos:     [-2, 0, 0],      planetScale:   2.2,
  factPos:       [4, 0, 0],       factScale:     [5.33, 3, 1],
  resultPos:     [0, 0.8, -1.5],  resultScale:   [8, 4, 1],
  selZ:          0,    selScale:  1.6,  selSpacing: 6.2,
  selPlanetY:    -0.8, selLabelY: -3.4, selMsgY:   6.0,
  selMsgScale:   [22, 5, 1],      selLabelScale: [4.0, 1.1, 1]
}
const VR_LAYOUT = {
  introPos:      [0, 1.6, -5],    introScale:    [4.5, 2.25, 1],
  planetPos:     [-1.2, 1.6, -4], planetScale:   1.0,
  factPos:       [1.8, 1.6, -4],  factScale:     [3.0, 1.7, 1],
  resultPos:     [0, 1.6, -5],    resultScale:   [4.5, 2.25, 1],
  selZ:          -6,   selScale:  0.5,  selSpacing: 1.6,
  selPlanetY:    1.6,  selLabelY: 0.5,  selMsgY:   3.6,
  selMsgScale:   [6, 1.4, 1],     selLabelScale: [1.2, 0.33, 1]
}
function curLayout() { return isVRMode ? VR_LAYOUT : DESKTOP }

// Disable OrbitControls in VR; switch layout on enter/exit
renderer.xr.addEventListener('sessionstart', () => {
  controls.enabled = false
  isVRMode = true
  applyLayout()
})
renderer.xr.addEventListener('sessionend', () => {
  controls.enabled = true
  isVRMode = false
  applyLayout()
})

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
let planetHopLogo = null  // no longer a 3D sprite — logo is the HTML #planet-hop-logo element
const logoEl = document.getElementById('planet-hop-logo')

// Typewriter state
const introBodyTexts = [
  "For many years, people burned too many fossil fuels, cut down forests, and polluted the air.",
  "This caused climate change. There were huge storms, wildfires, floods, and droughts.",
  "Earth is in danger. Explore space to find a new home. Your mission begins now!"
]
const typewriter = {
  active: false,
  fullText: '',
  visibleChars: 0,
  charsPerFrame: 0.3,
  mode: null // 'intro', 'fact', 'result'
}

function startTypewriter(text, mode) {
  typewriter.active = true
  typewriter.fullText = text
  typewriter.visibleChars = 0
  typewriter.mode = mode
}

function applyTypewriterFrame() {
  const chars = typewriter.visibleChars
  if (typewriter.mode === 'intro' && introText) {
    updateInteractiveIntroText(introText, introTextState, chars)
  } else if (typewriter.mode === 'fact' && currentText) {
    const data = planets[currentIndex]
    updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, data.facts.length, chars)
  } else if (typewriter.mode === 'result' && resultSprite) {
    updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length, chars)
  }
}

function completeTypewriter() {
  if (typewriter.active) {
    typewriter.visibleChars = typewriter.fullText.length
    typewriter.active = false
    applyTypewriterFrame()
  }
}

// ─── Planet warp-zoom transition ────────────────────────────────────────────
const WARP_FRAMES = 22  // frames per phase (~0.37s at 60fps)

const planetTransition = {
  active: false,
  phase: null,      // 'out' | 'in'
  progress: 0,
  outPlanet: null,
  inData: null      // { index, factIndex }
}

function setGroupOpacity(group, opacity) {
  group.traverse(child => {
    if (child.isMesh && child.material) {
      // Respect each mesh's intended base opacity (e.g. glow spheres at 0.09)
      const base = child.userData.baseOpacity !== undefined ? child.userData.baseOpacity : 1
      child.material.transparent = true
      child.material.opacity = base * opacity
      child.material.needsUpdate = true
    }
  })
}

function showPlanetHopLogo() {
  logoEl.style.display = 'block'
}

function hidePlanetHopLogo() {
  logoEl.style.display = 'none'
}

// Reposition all active scene content to the current (desktop or VR) layout
function applyLayout() {
  const lay = curLayout()
  if (introText) {
    introText.position.set(...lay.introPos)
    introText.scale.set(...lay.introScale)
  }
  if (currentPlanet) {
    currentPlanet.position.set(...lay.planetPos)
    currentPlanet.scale.setScalar(lay.planetScale)
  }
  if (currentText) {
    currentText.position.set(...lay.factPos)
    currentText.scale.set(...lay.factScale)
  }
  if (resultSprite) {
    resultSprite.position.set(...lay.resultPos)
    resultSprite.scale.set(...lay.resultScale)
  }
  // Reposition selection screen planets if active
  if (selectionMode && selectionPlanets.length > 0) {
    const spacing = lay.selSpacing
    const startX = -(planets.length - 1) * spacing / 2
    selectionPlanets.forEach((p, i) => {
      p.position.set(startX + i * spacing, lay.selPlanetY, lay.selZ)
      p.scale.setScalar(lay.selScale)
    })
    selectionNameLabels.forEach((l, i) => {
      l.position.set(startX + i * spacing, lay.selLabelY, lay.selZ)
      l.scale.set(...lay.selLabelScale)
    })
    if (selectionMessageSprite) {
      selectionMessageSprite.position.set(0, lay.selMsgY, lay.selZ)
      selectionMessageSprite.scale.set(...lay.selMsgScale)
    }
  }
}

function showPlanetSelection() {
  // Hide Planet Hop logo for selection screen
  hidePlanetHopLogo()
  
  // Clear current planet and text
  if (currentPlanet) { scene.remove(currentPlanet); currentPlanet = null }
  if (currentText) { scene.remove(currentText); currentText = null }

  const lay = curLayout()

  // Zoom camera out on desktop; VR camera is headset-controlled so no change needed
  if (!isVRMode) {
    camera.position.set(0, 1.6, 36)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  // Show selection message
  selectionMessageSprite = createSelectionMessageBox()
  selectionMessageSprite.position.set(0, lay.selMsgY, lay.selZ)
  selectionMessageSprite.scale.set(...lay.selMsgScale)
  scene.add(selectionMessageSprite)

  // Lay out all planets in a row using layout spacing/scale/z
  const spacing = lay.selSpacing
  const startX = -(planets.length - 1) * spacing / 2

  planets.forEach((planetData, i) => {
    const planet = createPlanet(planetData)
    planet.position.set(startX + i * spacing, lay.selPlanetY, lay.selZ)
    planet.scale.setScalar(lay.selScale)
    planet.userData = { planetName: planetData.name, planetData }
    scene.add(planet)
    selectionPlanets.push(planet)

    const label = createNameLabel(planetData.name)
    label.position.set(startX + i * spacing, lay.selLabelY, lay.selZ)
    label.scale.set(...lay.selLabelScale)
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

function loadPlanetInstant(index, factIndex = 0) {
  currentFactIndex = factIndex
  const data = planets[index]
  const lay = curLayout()

  currentPlanet = createPlanet(data)
  currentPlanet.position.set(...lay.planetPos)
  currentPlanet.scale.setScalar(lay.planetScale)
  scene.add(currentPlanet)

  currentText = createFactTextBox(data.facts[factIndex], data.name, index, factIndex, data.facts.length)
  currentText.position.set(...lay.factPos)
  currentText.scale.set(...lay.factScale)
  scene.add(currentText)

  showPlanetHopLogo()
}

function loadPlanet(index, factIndex = 0) {
  if (currentPlanet) {
    // Hide text immediately; keep old planet for warp-out animation
    if (currentText) { scene.remove(currentText); currentText = null }

    planetTransition.active = true
    planetTransition.phase = 'out'
    planetTransition.progress = 0
    planetTransition.outPlanet = currentPlanet
    planetTransition.inData = { index, factIndex }
    currentPlanet = null
  } else {
    // First planet — load instantly then warp in
    loadPlanetInstant(index, factIndex)
    currentPlanet.scale.setScalar(0.1)
    setGroupOpacity(currentPlanet, 0)
    currentText.visible = false

    planetTransition.active = true
    planetTransition.phase = 'in'
    planetTransition.progress = 0
  }
}

const introScreen = document.getElementById("introScreen")
const launchBtn = document.getElementById("launchBtn")

let gameStarted = false
let spaceAudio
let introText
let introTextState = 0

const hyperspaceEl = document.getElementById('hyperspace')
const sceneFadeEl = document.getElementById('scene-fade')
const volumeBtn = document.getElementById('volume-btn')
const homeBtn = document.getElementById('home-btn')

homeBtn.addEventListener('click', () => {
  location.reload()
})

const volumeImg = volumeBtn.querySelector('img')
let isMuted = false
volumeBtn.addEventListener('click', (event) => {
  event.stopPropagation()
  isMuted = !isMuted
  Howler.mute(isMuted)
  volumeImg.src = isMuted ? '/textures/audio_off.png' : '/textures/audio_on.png'
  volumeImg.alt = isMuted ? 'Sound off' : 'Sound on'
})

function fadeToScene(callback) {
  // Fade to black
  sceneFadeEl.classList.add('black')
  setTimeout(() => {
    // Execute the scene change while screen is black
    callback()
    // Fade back in
    setTimeout(() => {
      sceneFadeEl.classList.remove('black')
    }, 50)
  }, 500)
}

launchBtn.addEventListener("click", (event) => {
  event.stopPropagation()  // Prevent click from bubbling up to window click handler
  console.log('Launch button clicked')

  // Trigger hyperspace flash transition
  hyperspaceEl.classList.add('active')
  hyperspaceEl.addEventListener('animationend', () => {
    hyperspaceEl.classList.remove('active')
  }, { once: true })

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
  
  // Position intro text using current layout (desktop or VR)
  introText.position.set(...curLayout().introPos)
  introText.scale.set(...curLayout().introScale)
  scene.add(introText)
  console.log('Interactive intro text added to scene at position:', introText.position)
  
  // Show Planet Hop logo for 3D scenes
  showPlanetHopLogo()
  
  // Show volume button now that the game has started
  volumeBtn.style.display = 'flex'
  volumeBtn.style.alignItems = 'center'
  volumeBtn.style.justifyContent = 'center'

  // Show VR button if WebXR is available
  if (vrButton) {
    vrButton.style.display = 'block'
  }

  // Start typewriter for the first intro page
  startTypewriter(introBodyTexts[introTextState], 'intro')
  
  // Don't load the planet yet - wait for user click
  
  gameStarted = true
})

// Raycaster for interactive text navigation
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Track hovered planet on selection screen
let hoveredSelectionPlanet = null

window.addEventListener('mousemove', (event) => {
  if (!selectionMode || selectionPlanets.length === 0) return

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(selectionPlanets, true)
  if (intersects.length > 0) {
    let root = intersects[0].object
    while (root && !root.userData.planetName) root = root.parent
    if (root && root !== hoveredSelectionPlanet) {
      hoveredSelectionPlanet = root
      document.body.style.cursor = 'pointer'
    }
  } else {
    hoveredSelectionPlanet = null
    document.body.style.cursor = 'default'
  }
})

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
      // New arrow positions (2x scaled, bottomY = height - 160 = 1120)
      // Back arrow: x=160→280, y=1040→1200
      // Forward arrow: x=2280→2400, y=1040→1200
      const backButtonArea = { x: 160, y: 1040, width: 120, height: 160 }
      const forwardButtonArea = { x: canvasWidth - 280, y: 1040, width: 120, height: 160 }
      
      const inBackButton = clickX >= backButtonArea.x && clickX <= backButtonArea.x + backButtonArea.width &&
                          clickY >= backButtonArea.y && clickY <= backButtonArea.y + backButtonArea.height
      
      const inForwardButton = clickX >= forwardButtonArea.x && clickX <= forwardButtonArea.x + forwardButtonArea.width &&
                             clickY >= forwardButtonArea.y && clickY <= forwardButtonArea.y + forwardButtonArea.height
      
      if (inBackButton && introTextState > 0) {
        // Go back to first state — always navigate immediately
        backSound.play()
        introTextState = 0
        typewriter.active = false
        updateInteractiveIntroText(introText, introTextState, 0)
        startTypewriter(introBodyTexts[introTextState], 'intro')
        console.log('Navigated back to state:', introTextState)
      } else if (inForwardButton) {
        forwardSound.play()
        if (typewriter.active) {
          // First click while typing: skip to full text
          completeTypewriter()
        } else if (introTextState < 2) {
          // Go forward to next state
          introTextState++
          updateInteractiveIntroText(introText, introTextState, 0)
          startTypewriter(introBodyTexts[introTextState], 'intro')
          console.log('Navigated forward to state:', introTextState)
        } else {
          // On final state — fade to black, then show first planet
          typewriter.active = false
          fadeToScene(() => {
            scene.remove(introText)
            introText = null
            currentIndex = 0
            loadPlanet(currentIndex)
          })
        }
      }
      // If clicked on main text area, do nothing (keep current state)
    }
  } else if (gameStarted && selectionMode) {
    // Handle planet selection click
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(selectionPlanets, true)
    if (intersects.length > 0) {
      // Walk up hierarchy to find the group that has planetName userData
      let root = intersects[0].object
      while (root && !root.userData.planetName) {
        root = root.parent
      }
      if (!root) return
      const { planetName, planetData } = root.userData

      clearSelectionScreen()

      // Play success sound for the correct planet choice
      if (planetName === 'Mars') successSound.play()

      // Build 3-message result sequence
      const firstMessage = planetName === 'Mars'
        ? "Correct! Humans may be able to live on Mars but only with technology and protection!"
        : "Not quite. Most planets are too hot, too cold, or made of gas. Mars is one of the best options."

      resultMessages = [
        firstMessage,
        "Now, the real mission is protecting Earth. Earth is our best home. It has liquid water, oxygen, forests, animals and a protective atmosphere.",
        "We must work together to protect our planet. You can help by planting trees, using clean energy, walking or biking, reducing waste, and saving electricity. This is climate action."
      ]
      resultMessageIndex = 0

      // Reset camera to intro-screen position so result box matches intro layout
      camera.position.set(0, 1.6, 5)
      controls.target.set(0, 0, 0)
      controls.update()

      resultSprite = createResultBox(resultMessages[0], 0, resultMessages.length)
      resultSprite.position.set(...curLayout().resultPos)
      resultSprite.scale.set(...curLayout().resultScale)
      scene.add(resultSprite)

      // Show Planet Hop logo for result screens
      showPlanetHopLogo()

      // Show the Return Home button
      homeBtn.style.display = 'block'
    }
  } else if (gameStarted && resultSprite) {
    // Navigate result messages via arrows
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObject(resultSprite)
    if (intersects.length > 0) {
      const uv = intersects[0].uv
      const canvasWidth = 2560
      const canvasHeight = 1280
      const clickX = uv.x * canvasWidth
      const clickY = (1 - uv.y) * canvasHeight

      const { backButtonArea, forwardButtonArea } = resultSprite.userData

      const inBack = clickX >= backButtonArea.x && clickX <= backButtonArea.x + backButtonArea.width &&
                     clickY >= backButtonArea.y && clickY <= backButtonArea.y + backButtonArea.height
      const inForward = clickX >= forwardButtonArea.x && clickX <= forwardButtonArea.x + forwardButtonArea.width &&
                        clickY >= forwardButtonArea.y && clickY <= forwardButtonArea.y + forwardButtonArea.height

      if (inForward && resultMessageIndex < resultMessages.length - 1) {
        forwardSound.play()
        resultMessageIndex++
        updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length)
      } else if (inBack && resultMessageIndex > 0) {
        backSound.play()
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
          // Advancing to the last fact — play result sound; otherwise silent
          if (currentFactIndex === totalFacts - 2) {
            resultSound.play()
          }
          currentFactIndex++
          updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, totalFacts)
        } else if (currentIndex < planets.length - 1) {
          // Last fact of this planet — advance to next planet (play sound)
          forwardSound.play()
          currentIndex++
          loadPlanet(currentIndex, 0)
        } else {
          // Last fact of last planet — fade to black, then show planet selection screen
          forwardSound.play()
          fadeToScene(() => showPlanetSelection())
        }
      } else if (inBack) {
        if (currentFactIndex > 0 || currentIndex > 0) {
          backSound.play()
        }
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
  if (planetTransition.outPlanet) planetTransition.outPlanet.rotation.y += 0.003
  // Selection planet rotation + hover scale effect
  const NORMAL_SCALE = curLayout().selScale
  const HOVER_SCALE = NORMAL_SCALE * 1.25
  selectionPlanets.forEach(p => {
    p.rotation.y += 0.005
    const target = p === hoveredSelectionPlanet ? HOVER_SCALE : NORMAL_SCALE
    const current = p.scale.x
    const next = current + (target - current) * 0.12
    p.scale.setScalar(next)
  })
  controls.update()

  // --- subtle rotation for motion ---
  closeStars.rotation.y += 0.0005
  farStars.rotation.y += 0.0002
  distantStars.rotation.y += 0.0001
  milkyWaySphere.rotation.y += 0.00005

  // --- Planet warp-zoom transition ---
  if (planetTransition.active) {
    planetTransition.progress += 1 / WARP_FRAMES
    const t = Math.min(planetTransition.progress, 1)

    if (planetTransition.phase === 'out') {
      // Scale up and fade out old planet
      const targetScale = curLayout().planetScale
      const scale = targetScale + t * (14 - targetScale)
      planetTransition.outPlanet.scale.setScalar(scale)
      setGroupOpacity(planetTransition.outPlanet, 1 - t)

      if (t >= 1) {
        // Remove old planet and start warp-in with new planet
        scene.remove(planetTransition.outPlanet)
        planetTransition.outPlanet = null

        const { index, factIndex } = planetTransition.inData
        loadPlanetInstant(index, factIndex)

        // Start new planet tiny and invisible
        currentPlanet.scale.setScalar(0.1)
        setGroupOpacity(currentPlanet, 0)
        currentText.visible = false

        planetTransition.phase = 'in'
        planetTransition.progress = 0
      }
    } else if (planetTransition.phase === 'in') {
      // Scale up and fade in new planet
      const targetScale = curLayout().planetScale
      const scale = 0.1 + t * (targetScale - 0.1)
      currentPlanet.scale.setScalar(scale)
      setGroupOpacity(currentPlanet, t)

      if (t >= 1) {
        currentPlanet.scale.setScalar(targetScale)
        setGroupOpacity(currentPlanet, 1)
        if (currentText) currentText.visible = true
        planetTransition.active = false
        planetTransition.phase = null
      }
    }
  }

  // --- Typewriter animation ---
  if (typewriter.active) {
    typewriter.visibleChars = Math.min(
      typewriter.visibleChars + typewriter.charsPerFrame,
      typewriter.fullText.length
    )
    applyTypewriterFrame()
    if (typewriter.visibleChars >= typewriter.fullText.length) {
      typewriter.active = false
    }
  }

  renderer.render(scene, camera)
})
