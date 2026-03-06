import * as THREE from 'three'
import { Howl, Howler } from 'howler'
import { createScene, createStarfield, createSpaceAudio } from './sceneSetup'
import { createPlanet } from './planetFactory'
import { planets } from './storyData'
import { createTextSprite, createInteractiveIntroText, updateInteractiveIntroText, createFactTextBox, updateFactTextBox, createSelectionMessageBox, createNameLabel, createResultBox, updateResultBox, createPlanetHopLogo, createVRInstructionsSprite } from './uiPanel'

const forwardSound = new Howl({ src: ['/audio/front_arrow.mp3'] })
const backSound = new Howl({ src: ['/audio/back_arrow.mp3'] })
const resultSound = new Howl({ src: ['/audio/result.mp3'] })
const successSound = new Howl({ src: ['/audio/success.mp3'] })


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
// Mobile portrait layout — everything centered in x, stacked vertically
const MOBILE_LAYOUT = {
  introPos:      [0, 0.8, -1.5],  introScale:    [3.5, 1.75, 1],
  planetPos:     [0, 1.2, -2],    planetScale:   1.0,
  factPos:       [0, -1.6, -1.5], factScale:     [3.5, 2.0, 1],
  resultPos:     [0, 0.8, -1.5],  resultScale:   [3.5, 1.75, 1],
  selZ:          -2,   selScale:  0.7,  selSpacing: 1.2,
  selPlanetY:    0.8,  selLabelY: -0.5, selMsgY:   3.2,
  selMsgScale:   [6.5, 1.5, 1],   selLabelScale: [1.2, 0.33, 1]
}
function isMobileView() { return window.innerWidth < 768 }
function curLayout() {
  if (isVRMode) return VR_LAYOUT
  if (isMobileView()) return MOBILE_LAYOUT
  return DESKTOP
}

// Disable OrbitControls in VR; switch layout on enter/exit
renderer.xr.addEventListener('sessionstart', () => {
  controls.enabled = false
  isVRMode = true
  applyLayout()
  // Show VR controls instructions — only if the game has launched
  if (gameStarted) {
    vrInstructionsSprite = createVRInstructionsSprite()
    vrInstructionsSprite.position.set(...VR_LAYOUT.introPos)
    scene.add(vrInstructionsSprite)
    // Hide whatever content is currently showing so it doesn't overlap
    if (introText) introText.visible = false
    if (currentText) currentText.visible = false
    if (resultSprite) resultSprite.visible = false
  }
})
renderer.xr.addEventListener('sessionend', () => {
  controls.enabled = true
  isVRMode = false
  applyLayout()
})

// Create stars + Milky Way
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
let vrInstructionsSprite = null  // shown when entering VR, dismissed with X
let planetHopLogo = null  // logo is the HTML #planet-hop-logo element
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
const WARP_FRAMES = 22

const planetTransition = {
  active: false,
  phase: null,      // 'out' | 'in'
  progress: 0,
  outPlanet: null,
  inData: null
}

function setGroupOpacity(group, opacity) {
  group.traverse(child => {
    if (child.isMesh && child.material) {
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

function fadeToScene(callback) {
  if (isVRMode) {
    // HTML overlays don't render in the XR compositor — skip fade in VR
    callback()
    return
  }
  sceneFadeEl.classList.add('black')
  setTimeout(() => {
    callback()
    setTimeout(() => {
      sceneFadeEl.classList.remove('black')
    }, 50)
  }, 500)
}

function showPlanetSelection() {
  hidePlanetHopLogo()

  if (currentPlanet) { scene.remove(currentPlanet); currentPlanet = null }
  if (currentText) { scene.remove(currentText); currentText = null }

  const lay = curLayout()

  if (!isVRMode) {
    // Mobile needs camera closer; desktop uses far z to see wide planet spread
    camera.position.set(0, 1.6, isMobileView() ? 12 : 36)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  selectionMessageSprite = createSelectionMessageBox()
  selectionMessageSprite.position.set(0, lay.selMsgY, lay.selZ)
  selectionMessageSprite.scale.set(...lay.selMsgScale)
  scene.add(selectionMessageSprite)

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

function selectPlanet(planetName) {
  clearSelectionScreen()
  if (planetName === 'Mars') successSound.play()

  const firstMessage = planetName === 'Mars'
    ? "Correct! Humans may be able to live on Mars but only with technology and protection!"
    : "Not quite. Most planets are too hot, too cold, or made of gas. Mars is one of the best options."

  resultMessages = [
    firstMessage,
    "Now, the real mission is protecting Earth. Earth is our best home. It has liquid water, oxygen, forests, animals and a protective atmosphere.",
    "We must work together to protect our planet. You can help by planting trees, using clean energy, walking or biking, reducing waste, and saving electricity. This is climate action."
  ]
  resultMessageIndex = 0

  camera.position.set(0, 1.6, 5)
  controls.target.set(0, 0, 0)
  controls.update()

  resultSprite = createResultBox(resultMessages[0], 0, resultMessages.length)
  resultSprite.position.set(...curLayout().resultPos)
  resultSprite.scale.set(...curLayout().resultScale)
  scene.add(resultSprite)

  showPlanetHopLogo()
  homeBtn.style.display = 'block'
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
    if (currentText) { scene.remove(currentText); currentText = null }

    planetTransition.active = true
    planetTransition.phase = 'out'
    planetTransition.progress = 0
    planetTransition.outPlanet = currentPlanet
    planetTransition.inData = { index, factIndex }
    currentPlanet = null
  } else {
    loadPlanetInstant(index, factIndex)
    currentPlanet.scale.setScalar(0.1)
    setGroupOpacity(currentPlanet, 0)
    currentText.visible = false

    planetTransition.active = true
    planetTransition.phase = 'in'
    planetTransition.progress = 0
  }
}

// ─── Navigation actions ──────────────────────────────────────────────────────
// Used by both mouse click (via handleInteraction) and VR buttons (X/Y)

function navigateForward() {
  if (!gameStarted) return

  // Dismiss VR instructions first, then restore whatever was showing
  if (vrInstructionsSprite) {
    scene.remove(vrInstructionsSprite)
    vrInstructionsSprite = null
    if (introText) introText.visible = true
    if (currentText) currentText.visible = true
    if (resultSprite) resultSprite.visible = true
    return
  }

  if (introText) {
    forwardSound.play()
    if (typewriter.active) {
      completeTypewriter()
    } else if (introTextState < 2) {
      introTextState++
      updateInteractiveIntroText(introText, introTextState, 0)
      startTypewriter(introBodyTexts[introTextState], 'intro')
    } else {
      typewriter.active = false
      fadeToScene(() => {
        scene.remove(introText)
        introText = null
        currentIndex = 0
        loadPlanet(currentIndex)
      })
    }
  } else if (selectionMode) {
    // Gaze-based selection in VR; mouse click handles this separately
    const planet = getGazedPlanet()
    if (planet) {
      selectPlanet(planet.userData.planetName)
    }
  } else if (resultSprite) {
    if (resultMessageIndex < resultMessages.length - 1) {
      forwardSound.play()
      resultMessageIndex++
      updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length)
    } else {
      // Last result message — X returns home
      location.reload()
    }
  } else if (currentText) {
    const data = planets[currentIndex]
    const totalFacts = data.facts.length
    if (currentFactIndex < totalFacts - 1) {
      if (currentFactIndex === totalFacts - 2) resultSound.play()
      currentFactIndex++
      updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, totalFacts)
    } else if (currentIndex < planets.length - 1) {
      forwardSound.play()
      currentIndex++
      loadPlanet(currentIndex, 0)
    } else {
      forwardSound.play()
      fadeToScene(() => showPlanetSelection())
    }
  }
}

function navigateBackward() {
  if (!gameStarted) return

  // Dismiss VR instructions with Y button too
  if (vrInstructionsSprite) {
    scene.remove(vrInstructionsSprite)
    vrInstructionsSprite = null
    if (introText) introText.visible = true
    if (currentText) currentText.visible = true
    if (resultSprite) resultSprite.visible = true
    return
  }

  if (introText) {
    if (introTextState > 0) {
      backSound.play()
      introTextState = 0
      typewriter.active = false
      updateInteractiveIntroText(introText, introTextState, 0)
      startTypewriter(introBodyTexts[introTextState], 'intro')
    }
  } else if (selectionMode) {
    // Nothing to go back to from selection screen
  } else if (resultSprite) {
    if (resultMessageIndex > 0) {
      backSound.play()
      resultMessageIndex--
      updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, resultMessages.length)
    }
  } else if (currentText) {
    const data = planets[currentIndex]
    const totalFacts = data.facts.length
    if (currentFactIndex > 0 || currentIndex > 0) backSound.play()
    if (currentFactIndex > 0) {
      currentFactIndex--
      updateFactTextBox(currentText, data.facts[currentFactIndex], data.name, currentIndex, currentFactIndex, totalFacts)
    } else if (currentIndex > 0) {
      currentIndex--
      const prevData = planets[currentIndex]
      loadPlanet(currentIndex, prevData.facts.length - 1)
    }
  }
}

// ─── Gaze-based planet selection (VR) ───────────────────────────────────────
// Returns the planet whose center is closest to the camera's forward direction

function getGazedPlanet() {
  if (selectionPlanets.length === 0) return null
  const cameraDir = new THREE.Vector3()
  camera.getWorldDirection(cameraDir)
  const cameraPos = new THREE.Vector3()
  camera.getWorldPosition(cameraPos)

  let bestPlanet = null
  let bestDot = -Infinity

  selectionPlanets.forEach(p => {
    const toP = p.position.clone().sub(cameraPos).normalize()
    const dot = toP.dot(cameraDir)
    if (dot > bestDot) {
      bestDot = dot
      bestPlanet = p
    }
  })

  // Must be roughly centered in view (within ~30°)
  return bestDot > 0.85 ? bestPlanet : null
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

logoEl.addEventListener('click', () => {
  location.reload()
})

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

launchBtn.addEventListener("click", (event) => {
  // No stopPropagation — Howler needs the click to bubble to document to unlock iOS Web Audio

  hyperspaceEl.classList.add('active')
  hyperspaceEl.addEventListener('animationend', () => {
    hyperspaceEl.classList.remove('active')
  }, { once: true })

  introScreen.style.opacity = "0"
  setTimeout(() => {
    introScreen.style.display = "none"
  }, 500)

  spaceAudio = createSpaceAudio()

  // Resume Howler's own AudioContext — this is what actually unlocks audio on iOS Safari.
  // (Creating a separate AudioContext manually does NOT unlock Howler's internal one.)
  if (Howler.ctx && Howler.ctx.state === 'suspended') {
    Howler.ctx.resume().catch(err => console.error('Failed to resume Howler audio context:', err))
  }

  spaceAudio.play()

  introText = createInteractiveIntroText(introTextState)
  introText.position.set(...curLayout().introPos)
  introText.scale.set(...curLayout().introScale)
  scene.add(introText)

  showPlanetHopLogo()

  volumeBtn.style.display = 'flex'
  volumeBtn.style.alignItems = 'center'
  volumeBtn.style.justifyContent = 'center'

  if (vrButton) {
    vrButton.classList.remove('vr-hidden')
  }

  startTypewriter(introBodyTexts[introTextState], 'intro')
  gameStarted = true
})

// Re-apply layout on orientation change / window resize (mobile rotation etc.)
window.addEventListener('resize', () => {
  if (gameStarted && !isVRMode) applyLayout()
})

// ─── Mouse raycaster ────────────────────────────────────────────────────────
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

// ─── Mouse / touch click handler ─────────────────────────────────────────────
// Uses UV percentage thresholds so it works on any screen size / device:
//   UV.x < 0.20  → left zone  → back
//   UV.x > 0.80  → right zone → forward
// No hardcoded canvas pixel coordinates needed.
window.addEventListener("click", (event) => {
  if (!gameStarted) return
  // Skip clicks on HTML UI elements so they don't trigger 3D raycasting
  if (event.target.closest('#launchBtn, #home-btn, #volume-btn, #planet-hop-logo, #vr-btn')) return

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)

  if (introText) {
    const hits = raycaster.intersectObject(introText)
    if (hits.length === 0) return
    const { x } = hits[0].uv
    if (x < 0.20) navigateBackward()
    else if (x > 0.80) navigateForward()

  } else if (selectionMode) {
    const hits = raycaster.intersectObjects(selectionPlanets, true)
    if (hits.length === 0) return
    let root = hits[0].object
    while (root && !root.userData.planetName) root = root.parent
    if (root) selectPlanet(root.userData.planetName)

  } else if (resultSprite) {
    const hits = raycaster.intersectObject(resultSprite)
    if (hits.length === 0) return
    const { x } = hits[0].uv
    if (x < 0.20) navigateBackward()
    else if (x > 0.80) navigateForward()

  } else if (currentText) {
    const hits = raycaster.intersectObject(currentText)
    if (hits.length === 0) return
    const { x } = hits[0].uv
    if (x < 0.20) navigateBackward()
    else if (x > 0.80) navigateForward()
  }
})

// ─── VR Button navigation (X/Y on Quest controllers) ────────────────────────
// X (left button 4) or A (right button 4) = forward
// Y (left button 5) or B (right button 5) = backward
// Polled each frame; fires on press (not hold)

const vrButtonPrev = { forward: false, backward: false, mute: false }

function pollVRButtons() {
  if (!isVRMode) return
  const session = renderer.xr.getSession()
  if (!session) return

  let forwardPressed = false
  let backwardPressed = false
  let mutePressed = false

  for (const source of session.inputSources) {
    if (!source.gamepad) continue
    const buttons = source.gamepad.buttons

    // X (left[4]) or A (right[4]) = forward
    if (buttons[4]?.pressed) forwardPressed = true
    // Y (left[5]) or B (right[5]) = backward
    if (buttons[5]?.pressed) backwardPressed = true
    // Right thumbstick press (right[3]) = mute toggle
    if (source.handedness === 'right' && buttons[3]?.pressed) mutePressed = true
  }

  // Rising-edge detection — fire once on press, not continuously while held
  if (forwardPressed  && !vrButtonPrev.forward)  navigateForward()
  if (backwardPressed && !vrButtonPrev.backward) navigateBackward()
  if (mutePressed && !vrButtonPrev.mute) {
    isMuted = !isMuted
    Howler.mute(isMuted)
  }

  vrButtonPrev.forward  = forwardPressed
  vrButtonPrev.backward = backwardPressed
  vrButtonPrev.mute     = mutePressed
}

// ─── Render loop ─────────────────────────────────────────────────────────────
renderer.setAnimationLoop(() => {
  if (currentPlanet) currentPlanet.rotation.y += 0.003
  if (planetTransition.outPlanet) planetTransition.outPlanet.rotation.y += 0.003

  // Selection planet rotation + hover scale effect
  const NORMAL_SCALE = curLayout().selScale
  const HOVER_SCALE = NORMAL_SCALE * 1.25
  selectionPlanets.forEach(p => {
    p.rotation.y += 0.005
    const target = p === hoveredSelectionPlanet ? HOVER_SCALE : NORMAL_SCALE
    const next = p.scale.x + (target - p.scale.x) * 0.12
    p.scale.setScalar(next)
  })

  controls.update()

  closeStars.rotation.y  += 0.0005
  farStars.rotation.y    += 0.0002
  distantStars.rotation.y += 0.0001
  milkyWaySphere.rotation.y += 0.00005

  // Planet warp-zoom transition
  if (planetTransition.active) {
    planetTransition.progress += 1 / WARP_FRAMES
    const t = Math.min(planetTransition.progress, 1)

    if (planetTransition.phase === 'out') {
      const targetScale = curLayout().planetScale
      planetTransition.outPlanet.scale.setScalar(targetScale + t * (14 - targetScale))
      setGroupOpacity(planetTransition.outPlanet, 1 - t)

      if (t >= 1) {
        scene.remove(planetTransition.outPlanet)
        planetTransition.outPlanet = null

        const { index, factIndex } = planetTransition.inData
        loadPlanetInstant(index, factIndex)

        currentPlanet.scale.setScalar(0.1)
        setGroupOpacity(currentPlanet, 0)
        currentText.visible = false

        planetTransition.phase = 'in'
        planetTransition.progress = 0
      }
    } else if (planetTransition.phase === 'in') {
      const targetScale = curLayout().planetScale
      currentPlanet.scale.setScalar(0.1 + t * (targetScale - 0.1))
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

  // Typewriter animation
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

  // VR button polling (X = forward, Y = backward)
  pollVRButtons()

  renderer.render(scene, camera)
})
