import * as THREE from 'three'
import { Howl, Howler } from 'howler'
import { createScene, createStarfield, createSpaceAudio } from './sceneSetup'
import { createPlanet, preloadPlanetTextures } from './planetFactory'
import { planets, introBodyTexts as introBodyTextsData, resultMessages as resultMessagesData, wrongPlanetMessages, selectionMessage } from './storyData'
import { createInteractiveIntroText, updateInteractiveIntroText, createFactTextBox, updateFactTextBox, createSelectionMessageBox, createNameLabel, createResultBox, updateResultBox, createResourcesBox, createVRInstructionsSprite } from './uiPanel'

// ─── Language detection ───────────────────────────────────────────────────────
// Reads the browser/device language setting; falls back to English for unsupported locales.
const lang = (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en'
document.documentElement.lang = lang

// t() — picks the localized variant from a bilingual {en, es} object
function t(obj) { return (obj[lang] ?? obj['en']) }

// localName() — returns the planet's display name in the current language
function localName(data) { return (lang === 'es' && data.nameEs) ? data.nameEs : data.name }

// ─── Translate static HTML intro screen at page load ─────────────────────────
if (lang === 'es') {
  const subtitle = document.querySelector('.typing-text')
  if (subtitle) subtitle.textContent = 'UNA AVENTURA ESPACIAL CON UNA MISIÓN CLIMÁTICA'
  const launchBtnEl = document.getElementById('launchBtn')
  if (launchBtnEl) launchBtnEl.textContent = 'LANZAR'
  const homeBtnEl = document.getElementById('home-btn')
  if (homeBtnEl) homeBtnEl.textContent = '⟵ VOLVER AL INICIO'

  // Translate resources panel heading and back button
  const resourcesH2 = document.querySelector('#resources-panel h2')
  if (resourcesH2) resourcesH2.textContent = 'Descubre más formas de proteger la Tierra con estos recursos.'
  const resourcesBackBtnEl = document.getElementById('resources-back-btn')
  if (resourcesBackBtnEl) resourcesBackBtnEl.textContent = 'Atrás'

  // Replace resource links with Spanish equivalents
  const links = document.querySelectorAll('#resources-panel .resource-link')
  if (links[0]) {
    links[0].href = 'https://kidsandclimate.stanford.edu/sites/g/files/sbiybj24441/files/media/file/spanish_activity_book.pdf'
    links[0].innerHTML = '<span class="res-icon">📗</span>Libro de Actividades sobre el Clima'
  }
  if (links[1]) {
    links[1].href = 'https://accionverde.org.co/cambio-climatico/'
    links[1].innerHTML = '<span class="res-icon">🌿</span>Cambio climático explicado'
  }
  if (links[2]) {
    links[2].href = 'https://www.youtube.com/watch?v=FeKld35Pxhg'
    links[2].innerHTML = '<span class="res-icon">▶️</span>El Cambio Climático para Niños'
  }
}

const forwardSound = new Howl({ src: ['/audio/front_arrow.mp3'], html5: true })
const backSound = new Howl({ src: ['/audio/back_arrow.mp3'], html5: true })
const resultSound = new Howl({ src: ['/audio/result.mp3'], html5: true })
const successSound = new Howl({ src: ['/audio/success.mp3'], html5: true })


const { scene, camera, renderer, controls, vrButton } = createScene()

// Translate the VR button text when Spanish is detected.
// Three.js VRButton updates its text dynamically (ENTER VR / EXIT VR / VR NOT SUPPORTED),
// so a MutationObserver is used to catch every change and swap the text.
if (lang === 'es' && vrButton) {
  const translateVRBtn = () => {
    if (vrButton.textContent === 'ENTER VR')        vrButton.textContent = 'ENTRAR EN VR'
    else if (vrButton.textContent === 'EXIT VR')    vrButton.textContent = 'SALIR DE VR'
    else if (vrButton.textContent === 'VR NOT SUPPORTED') vrButton.textContent = 'VR NO COMPATIBLE'
  }
  translateVRBtn()  // run once on init in case text is already set
  new MutationObserver(translateVRBtn).observe(vrButton, { childList: true, subtree: true, characterData: true })
}

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
  introPos:      [0, 0.8, -1.5],  introScale:    [4.5, 2.25, 1],
  planetPos:     [0, 1.4, -2],    planetScale:   1.3,
  factPos:       [0, -2.0, -1.5], factScale:     [4.5, 2.5, 1],
  resultPos:     [0, 0.8, -1.5],  resultScale:   [3.5, 1.75, 1],
  selZ:          -2,   selScale:  0.7,  selSpacing: 2.3,
  // 2-row planet selection: row1 = first 4 planets, row2 = remaining 3
  selRow1Y:      1.4,  selRow1LabelY:  0.1,
  selRow2Y:     -1.6,  selRow2LabelY: -2.9,
  selPlanetY:    0.8,  selLabelY:     -0.5, selMsgY:   4.2,
  selMsgScale:   [8.0, 2.0, 1],   selLabelScale: [1.2, 0.33, 1]
}
const MOBILE_ROW1_COUNT = 4   // first N planets go on row 1; rest on row 2
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
  // Hide look-around hint — it's meaningless inside a VR headset
  lookHintEl.style.display = 'none'
  applyLayout()
  // Show VR controls instructions — only if the game has launched
  if (gameStarted) {
    vrInstructionsSprite = createVRInstructionsSprite(lang)
    vrInstructionsSprite.position.set(...VR_LAYOUT.introPos)
    scene.add(vrInstructionsSprite)
    // Hide ALL current scene content so only the VR instructions show
    if (introText)              introText.visible = false
    if (currentText)            currentText.visible = false
    if (currentPlanet)          currentPlanet.visible = false
    if (resultSprite)           resultSprite.visible = false
    // If resources HTML panel was showing, swap it for the VR canvas sprite
    if (resourcesPanelOpen) {
      resourcesPanelEl.style.display = 'none'
      resourcesSprite = createResourcesBox(TOTAL_RESULT_MESSAGES, lang)
      resourcesSprite.position.set(...VR_LAYOUT.resultPos)
      resourcesSprite.scale.set(...VR_LAYOUT.resultScale)
      scene.add(resourcesSprite)
      resourcesSprite.visible = false  // hidden behind VR instructions
    }
    selectionPlanets.forEach(p  => p.visible = false)
    selectionNameLabels.forEach(l => l.visible = false)
    if (selectionMessageSprite) selectionMessageSprite.visible = false
  }
})
renderer.xr.addEventListener('sessionend', () => {
  controls.enabled = true
  isVRMode = false
  // If resources VR sprite was showing, remove it and restore the HTML overlay
  if (resourcesSprite) { scene.remove(resourcesSprite); resourcesSprite = null }
  if (resourcesPanelOpen) resourcesPanelEl.style.display = 'block'
  // Restore look-around hint now that we're back in non-VR mode
  if (gameStarted) lookHintEl.style.display = 'block'
  applyLayout()
})

// Preload all planet textures immediately so they're cached before the first animation plays.
// This runs in the background while the intro screen and story panels are showing.
preloadPlanetTextures(planets)

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
const logoEl = document.getElementById('planet-hop-logo')

// ─── Resources panel state ────────────────────────────────────────────────────
// TOTAL_RESULT_MESSAGES = 3 text slides + 1 resources slide
// The dot indicators on all result slides show 4 dots so users see the full journey.
const TOTAL_RESULT_MESSAGES = 4
let resourcesPanelOpen = false
let resourcesSprite = null      // VR-only canvas sprite; null on desktop/mobile
const resourcesPanelEl = document.getElementById('resources-panel')
const resourcesBackBtn = document.getElementById('resources-back-btn')

// Localized intro body texts (resolved once from storyData based on detected language)
const introBodyTexts = t(introBodyTextsData)

// Typewriter state
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
    updateInteractiveIntroText(introText, introTextState, chars, introBodyTexts, lang)
  } else if (typewriter.mode === 'fact' && currentText) {
    const data = planets[currentIndex]
    const facts = t(data.facts)
    updateFactTextBox(currentText, facts[currentFactIndex], localName(data), currentIndex, currentFactIndex, facts.length, chars)
  } else if (typewriter.mode === 'result' && resultSprite) {
    updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, TOTAL_RESULT_MESSAGES, chars)
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
    const mobileGrid = isMobileView() && !isVRMode
    selectionPlanets.forEach((p, i) => {
      let px, py
      if (mobileGrid) {
        const inRow1 = i < MOBILE_ROW1_COUNT
        const rowCount = inRow1 ? MOBILE_ROW1_COUNT : (planets.length - MOBILE_ROW1_COUNT)
        const posInRow = inRow1 ? i : i - MOBILE_ROW1_COUNT
        px = -(rowCount - 1) * spacing / 2 + posInRow * spacing
        py = inRow1 ? lay.selRow1Y : lay.selRow2Y
      } else {
        px = -(planets.length - 1) * spacing / 2 + i * spacing
        py = lay.selPlanetY
      }
      p.position.set(px, py, lay.selZ)
      p.scale.setScalar(lay.selScale)
    })
    selectionNameLabels.forEach((l, i) => {
      let px, labelY
      if (mobileGrid) {
        const inRow1 = i < MOBILE_ROW1_COUNT
        const rowCount = inRow1 ? MOBILE_ROW1_COUNT : (planets.length - MOBILE_ROW1_COUNT)
        const posInRow = inRow1 ? i : i - MOBILE_ROW1_COUNT
        px = -(rowCount - 1) * spacing / 2 + posInRow * spacing
        labelY = inRow1 ? lay.selRow1LabelY : lay.selRow2LabelY
      } else {
        px = -(planets.length - 1) * spacing / 2 + i * spacing
        labelY = lay.selLabelY
      }
      l.position.set(px, labelY, lay.selZ)
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
  hidePlanetHopLogo()   // briefly hidden during fade; restored below after planets are added

  if (currentPlanet) { scene.remove(currentPlanet); currentPlanet = null }
  if (currentText) { scene.remove(currentText); currentText = null }

  const lay = curLayout()

  if (!isVRMode) {
    // Mobile needs camera closer; desktop uses far z to see wide planet spread
    camera.position.set(0, 1.6, isMobileView() ? 12 : 36)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  selectionMessageSprite = createSelectionMessageBox(t(selectionMessage))
  selectionMessageSprite.position.set(0, lay.selMsgY, lay.selZ)
  selectionMessageSprite.scale.set(...lay.selMsgScale)
  scene.add(selectionMessageSprite)

  const spacing = lay.selSpacing
  const mobileGrid = isMobileView() && !isVRMode  // 2-row grid on mobile only

  planets.forEach((planetData, i) => {
    let px, py
    if (mobileGrid) {
      // Row 1: indices 0..MOBILE_ROW1_COUNT-1, Row 2: the rest (centered)
      const inRow1 = i < MOBILE_ROW1_COUNT
      const rowCount = inRow1 ? MOBILE_ROW1_COUNT : (planets.length - MOBILE_ROW1_COUNT)
      const posInRow = inRow1 ? i : i - MOBILE_ROW1_COUNT
      px = -(rowCount - 1) * spacing / 2 + posInRow * spacing
      py = inRow1 ? lay.selRow1Y : lay.selRow2Y
    } else {
      px = -(planets.length - 1) * spacing / 2 + i * spacing
      py = lay.selPlanetY
    }

    const planet = createPlanet(planetData)
    planet.position.set(px, py, lay.selZ)
    planet.scale.setScalar(lay.selScale)
    planet.userData = { planetName: planetData.name, planetData }
    scene.add(planet)
    selectionPlanets.push(planet)

    const labelY = mobileGrid
      ? (i < MOBILE_ROW1_COUNT ? lay.selRow1LabelY : lay.selRow2LabelY)
      : lay.selLabelY
    const label = createNameLabel(localName(planetData))
    label.position.set(px, labelY, lay.selZ)
    label.scale.set(...lay.selLabelScale)
    scene.add(label)
    selectionNameLabels.push(label)
  })

  selectionMode = true
  showPlanetHopLogo()
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

  // Use localized result messages from storyData
  const localizedResults = t(planetName === 'Mars' ? resultMessagesData : wrongPlanetMessages)
  resultMessages = [...localizedResults]
  resultMessageIndex = 0

  camera.position.set(0, 1.6, 5)
  controls.target.set(0, 0, 0)
  controls.update()

  resultSprite = createResultBox(resultMessages[0], 0, TOTAL_RESULT_MESSAGES)
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

  const facts = t(data.facts)
  currentText = createFactTextBox(facts[factIndex], localName(data), index, factIndex, facts.length)
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

// ─── Resources panel open / close ────────────────────────────────────────────

function openResourcesPanel() {
  resourcesPanelOpen = true
  if (isVRMode) {
    // VR: show canvas sprite, hide result sprite
    if (resultSprite) resultSprite.visible = false
    resourcesSprite = createResourcesBox(TOTAL_RESULT_MESSAGES, lang)
    resourcesSprite.position.set(...curLayout().resultPos)
    resourcesSprite.scale.set(...curLayout().resultScale)
    scene.add(resourcesSprite)
  } else {
    // Desktop/Mobile: show HTML overlay, hide result sprite
    if (resultSprite) resultSprite.visible = false
    resourcesPanelEl.style.display = 'block'
    announceToScreenReader(
      lang === 'es'
        ? 'Descubre más formas de proteger la Tierra con estos recursos. Libro de actividades de Climate Kids. Podcast Earth Rangers. La Gran Muralla Verde.'
        : 'Discover more ways to help protect Earth with these resources. Climate Kids Activity Book. Earth Rangers Podcast. The Great Green Wall Initiative.'
    )
  }
}

function closeResourcesPanel() {
  resourcesPanelOpen = false
  if (isVRMode) {
    if (resourcesSprite) { scene.remove(resourcesSprite); resourcesSprite = null }
  } else {
    resourcesPanelEl.style.display = 'none'
  }
  // Restore result sprite at last text message
  if (resultSprite) {
    updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, TOTAL_RESULT_MESSAGES)
    resultSprite.visible = true
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
    if (introText)              introText.visible = true
    if (currentText)            currentText.visible = true
    if (currentPlanet)          currentPlanet.visible = true
    // Restore result or resources sprite depending on current state
    if (resultSprite)           resultSprite.visible = !resourcesPanelOpen
    if (resourcesSprite)        resourcesSprite.visible = resourcesPanelOpen
    selectionPlanets.forEach(p  => p.visible = true)
    selectionNameLabels.forEach(l => l.visible = true)
    if (selectionMessageSprite) selectionMessageSprite.visible = true
    return
  }

  // Resources panel: in VR, forward arrow goes home; on desktop/mobile the HTML panel
  // has no forward arrow so nothing extra is needed.
  if (resourcesPanelOpen) {
    if (isVRMode) location.reload()
    return
  }

  if (introText) {
    forwardSound.play()
    if (typewriter.active) {
      completeTypewriter()
      announceToScreenReader(introBodyTexts[introTextState])
    } else if (introTextState < 2) {
      introTextState++
      updateInteractiveIntroText(introText, introTextState, 0, introBodyTexts, lang)
      startTypewriter(introBodyTexts[introTextState], 'intro')
      announceToScreenReader(introBodyTexts[introTextState])
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
      updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, TOTAL_RESULT_MESSAGES)
      announceToScreenReader(resultMessages[resultMessageIndex])
    } else {
      // Last text result message → show resources panel
      forwardSound.play()
      openResourcesPanel()
    }
  } else if (currentText) {
    const data = planets[currentIndex]
    const facts = t(data.facts)
    const totalFacts = facts.length
    if (currentFactIndex < totalFacts - 1) {
      if (currentFactIndex === totalFacts - 2) resultSound.play()
      currentFactIndex++
      updateFactTextBox(currentText, facts[currentFactIndex], localName(data), currentIndex, currentFactIndex, totalFacts)
      announceToScreenReader(`${localName(data)}. ${facts[currentFactIndex]}`)
    } else if (currentIndex < planets.length - 1) {
      forwardSound.play()
      currentIndex++
      loadPlanet(currentIndex, 0)
    } else {
      forwardSound.play()
      fadeToScene(() => {
        showPlanetSelection()
        announceToScreenReader(t(selectionMessage))
      })
    }
  }
}

function navigateBackward() {
  if (!gameStarted) return

  // Dismiss VR instructions with Y button too
  if (vrInstructionsSprite) {
    scene.remove(vrInstructionsSprite)
    vrInstructionsSprite = null
    if (introText)              introText.visible = true
    if (currentText)            currentText.visible = true
    if (currentPlanet)          currentPlanet.visible = true
    // Restore result or resources sprite depending on current state
    if (resultSprite)           resultSprite.visible = !resourcesPanelOpen
    if (resourcesSprite)        resourcesSprite.visible = resourcesPanelOpen
    selectionPlanets.forEach(p  => p.visible = true)
    selectionNameLabels.forEach(l => l.visible = true)
    if (selectionMessageSprite) selectionMessageSprite.visible = true
    return
  }

  if (introText) {
    if (introTextState > 0) {
      backSound.play()
      introTextState = 0
      typewriter.active = false
      updateInteractiveIntroText(introText, introTextState, 0, introBodyTexts, lang)
      startTypewriter(introBodyTexts[introTextState], 'intro')
    }
  } else if (selectionMode) {
    // Nothing to go back to from selection screen
  } else if (resourcesPanelOpen) {
    // Back from resources panel → return to last text result message
    backSound.play()
    closeResourcesPanel()
  } else if (resultSprite) {
    if (resultMessageIndex > 0) {
      backSound.play()
      resultMessageIndex--
      updateResultBox(resultSprite, resultMessages[resultMessageIndex], resultMessageIndex, TOTAL_RESULT_MESSAGES)
    }
  } else if (currentText) {
    const data = planets[currentIndex]
    const facts = t(data.facts)
    const totalFacts = facts.length
    if (currentFactIndex > 0 || currentIndex > 0) backSound.play()
    if (currentFactIndex > 0) {
      currentFactIndex--
      updateFactTextBox(currentText, facts[currentFactIndex], localName(data), currentIndex, currentFactIndex, totalFacts)
    } else if (currentIndex > 0) {
      currentIndex--
      const prevData = planets[currentIndex]
      loadPlanet(currentIndex, t(prevData.facts).length - 1)
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

  // Must be roughly centered in view (within ~46°) — forgiving enough for VR head-tracking
  return bestDot > 0.70 ? bestPlanet : null
}

const introScreen = document.getElementById("introScreen")
const launchBtn = document.getElementById("launchBtn")
const srLive = document.getElementById("sr-live")

// ─── Screen reader helper ─────────────────────────────────────────────────
// Updates the aria-live region so screen readers announce the current content.
function announceToScreenReader(text) {
  if (!srLive) return
  // Clear then set — some screen readers require the content to actually change
  srLive.textContent = ''
  requestAnimationFrame(() => { srLive.textContent = text })
}

let gameStarted = false
let spaceAudio
let introText
let introTextState = 0

const hyperspaceEl = document.getElementById('hyperspace')
const sceneFadeEl = document.getElementById('scene-fade')
const volumeBtn = document.getElementById('volume-btn')
const homeBtn = document.getElementById('home-btn')
const lookHintEl = document.getElementById('look-hint')

// Apply localized text to the look-around hint spans
if (lang === 'es') {
  const hintDesktop = lookHintEl.querySelector('.hint-desktop')
  const hintMobile  = lookHintEl.querySelector('.hint-mobile')
  if (hintDesktop) hintDesktop.textContent = '🖱 Mueve el cursor para mirar'
  if (hintMobile)  hintMobile.textContent  = '👆 Arrastra para mirar'
}

logoEl.addEventListener('click', () => {
  location.reload()
})

homeBtn.addEventListener('click', () => {
  location.reload()
})

// Resources back button — closes the resources panel (desktop/mobile)
resourcesBackBtn.addEventListener('click', (event) => {
  event.stopPropagation()
  backSound.play()
  closeResourcesPanel()
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

  spaceAudio.play()

  introText = createInteractiveIntroText(introTextState, 0, introBodyTexts, lang)
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

  // Show look-around hint (non-VR only; VR session hides it via sessionstart)
  lookHintEl.style.display = 'block'

  startTypewriter(introBodyTexts[introTextState], 'intro')
  announceToScreenReader(
    lang === 'es'
      ? "Alerta: La Tierra ha sido gravemente dañada. " + introBodyTexts[0]
      : "Alert: Earth has been badly damaged. " + introBodyTexts[0]
  )
  gameStarted = true

  // Give the canvas an accessible label so screen readers identify it
  renderer.domElement.setAttribute('role', 'application')
  renderer.domElement.setAttribute('aria-label', 'Planet Hop — interactive 3D space exploration. Use arrow keys or tap the left and right edges to navigate.')
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

// Deduplication: prevent touchend + synthesized click from both firing on touch devices
let lastTouchTime = 0

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
  // Skip synthesized click events that follow a touchend (prevents double-fire on Chrome mobile)
  if (Date.now() - lastTouchTime < 300) return
  // Skip 3D canvas interaction while the resources HTML overlay is showing (desktop/mobile)
  if (resourcesPanelOpen && !isVRMode) return

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

// ─── iOS Safari touch fallback ────────────────────────────────────────────
// Safari only fires 'click' on interactive elements (cursor:pointer).
// OrbitControls overrides the canvas cursor via inline style, breaking that
// heuristic. touchend fires unconditionally, so we use it as a reliable fallback.
window.addEventListener("touchend", (event) => {
  lastTouchTime = Date.now()  // Record time so the synthesized 'click' that follows is suppressed
  if (!gameStarted) return
  if (event.target.closest('#launchBtn, #home-btn, #volume-btn, #planet-hop-logo, #vr-btn, #resources-panel')) return
  if (event.changedTouches.length === 0) return
  // Skip 3D canvas interaction while the resources HTML overlay is showing (desktop/mobile)
  if (resourcesPanelOpen && !isVRMode) return

  const touch = event.changedTouches[0]
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1
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
}, { passive: true })

// ─── Keyboard navigation (← → arrow keys, Space) ─────────────────────────
// Allows keyboard-only users to navigate through the experience.
window.addEventListener('keydown', (event) => {
  if (!gameStarted) return
  // Don't hijack input when an HTML element has focus (e.g. a button)
  if (document.activeElement && document.activeElement !== document.body) return

  if (event.key === 'ArrowRight' || event.key === ' ') {
    event.preventDefault()
    navigateForward()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    navigateBackward()
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
