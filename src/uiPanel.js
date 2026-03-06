import * as THREE from 'three'

// Draws word-wrapped text onto a canvas context, breaking at maxWidth.
function drawWrappedText(context, text, x, y, maxWidth, fontSize, lineHeight) {
  context.font = `${fontSize}px 'Space Grotesk', sans-serif`
  context.textAlign = "center"

  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const testWidth = context.measureText(testLine).width

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }

  context.fillText(line, x, currentY)
}

// ─── Fact text box ────────────────────────────────────────────────────────────

function drawFactBoxCanvas(context, canvas, factText, planetName, planetIndex, factIndex, totalFacts, visibleChars = Infinity) {
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Planet name title
  context.fillStyle = "lightblue"
  context.font = "bold 80px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText(planetName, canvas.width / 2, 130)

  // Fact body text
  const displayFactText = Number.isFinite(visibleChars) ? factText.slice(0, visibleChars) : factText
  drawWrappedText(context, displayFactText, canvas.width / 2, 220, canvas.width - 100, 60, 72)

  // Page indicator dots
  const dotRadius = 16
  const dotSpacing = 50
  const dotsStartX = canvas.width / 2 - ((totalFacts - 1) * dotSpacing) / 2
  const dotsY = canvas.height - 130
  for (let i = 0; i < totalFacts; i++) {
    context.beginPath()
    context.arc(dotsStartX + i * dotSpacing, dotsY, dotRadius, 0, Math.PI * 2)
    context.fillStyle = i === factIndex ? "lightblue" : "rgba(173, 216, 230, 0.3)"
    context.fill()
  }

  // Navigation arrows
  const buttonSize = 80
  const bottomY = canvas.height - 80
  const isFirst = planetIndex === 0 && factIndex === 0

  // Back arrow — dimmed on first fact of first planet
  context.fillStyle = isFirst ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(140, bottomY - buttonSize / 2)
  context.lineTo(80, bottomY)
  context.lineTo(140, bottomY + buttonSize / 2)
  context.fill()

  // Forward arrow
  context.fillStyle = "lightblue"
  context.beginPath()
  context.moveTo(canvas.width - 140, bottomY - buttonSize / 2)
  context.lineTo(canvas.width - 80, bottomY)
  context.lineTo(canvas.width - 140, bottomY + buttonSize / 2)
  context.fill()
}

export function createFactTextBox(factText, planetName = "Planet Fact", planetIndex = 0, factIndex = 0, totalFacts = 3, visibleChars = Infinity) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 1280
  canvas.height = 720

  drawFactBoxCanvas(context, canvas, factText, planetName, planetIndex, factIndex, totalFacts, visibleChars)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(9, 5, 1)
  sprite.userData = {
    isFactBox: true,
    factText,
    backButtonArea:    { x: 50,               y: canvas.height - 150, width: 120, height: 120 },
    forwardButtonArea: { x: canvas.width - 170, y: canvas.height - 150, width: 120, height: 120 }
  }
  return sprite
}

export function updateFactTextBox(sprite, factText, planetName, planetIndex, factIndex, totalFacts = 3, visibleChars = Infinity) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 1280
  canvas.height = 720

  drawFactBoxCanvas(context, canvas, factText, planetName, planetIndex, factIndex, totalFacts, visibleChars)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  sprite.material.map = texture
  sprite.material.needsUpdate = true
  sprite.userData.factText = factText
}

// ─── Selection message box ────────────────────────────────────────────────────

export function createSelectionMessageBox(text) {
  const lines = (text || "Explorer, you've seen all the planets.\nSelect the best possible future home.").split('\n')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 620

  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  context.fillStyle = "lightblue"
  context.textAlign = "center"
  context.font = "bold 105px 'Space Grotesk', sans-serif"
  context.fillText(lines[0], canvas.width / 2, 200)
  context.font = "90px 'Space Grotesk', sans-serif"
  context.fillText(lines[1] || '', canvas.width / 2, 360)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(22, 5, 1)
  return sprite
}

// ─── Planet name label ────────────────────────────────────────────────────────

export function createNameLabel(name) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 512
  canvas.height = 160

  context.fillStyle = "lightblue"
  context.font = "bold 96px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText(name, canvas.width / 2, 130)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4.0, 1.1, 1)
  return sprite
}

// ─── Result box ───────────────────────────────────────────────────────────────

function drawResultBoxCanvas(context, canvas, text, messageIndex, totalMessages, visibleChars = Infinity) {
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  const displayResultText = Number.isFinite(visibleChars) ? text.slice(0, visibleChars) : text
  context.fillStyle = "lightblue"
  context.textAlign = "center"
  drawWrappedText(context, displayResultText, canvas.width / 2, 320, canvas.width - 400, 120, 144)

  // Page indicator dots
  const dotRadius = 20
  const dotSpacing = 70
  const dotsStartX = canvas.width / 2 - ((totalMessages - 1) * dotSpacing) / 2
  const dotsY = canvas.height - 160
  for (let i = 0; i < totalMessages; i++) {
    context.beginPath()
    context.arc(dotsStartX + i * dotSpacing, dotsY, dotRadius, 0, Math.PI * 2)
    context.fillStyle = i === messageIndex ? "lightblue" : "rgba(173, 216, 230, 0.3)"
    context.fill()
  }

  // Navigation arrows (2× size vs planet fact box)
  const buttonSize = 160
  const bottomY = canvas.height - 160

  // Back arrow — dimmed on first message
  context.fillStyle = messageIndex === 0 ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(280, bottomY - buttonSize / 2)
  context.lineTo(160, bottomY)
  context.lineTo(280, bottomY + buttonSize / 2)
  context.fill()

  // Forward arrow — dimmed on last message
  context.fillStyle = messageIndex === totalMessages - 1 ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(canvas.width - 280, bottomY - buttonSize / 2)
  context.lineTo(canvas.width - 160, bottomY)
  context.lineTo(canvas.width - 280, bottomY + buttonSize / 2)
  context.fill()
}

export function createResultBox(text, messageIndex = 0, totalMessages = 3, visibleChars = Infinity) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  drawResultBoxCanvas(context, canvas, text, messageIndex, totalMessages, visibleChars)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(18, 9, 1)
  // Hit areas: bottomY=1120, arrows at x=160–280 and x=2280–2400
  sprite.userData = {
    backButtonArea:    { x: 160,  y: 1040, width: 120, height: 160 },
    forwardButtonArea: { x: 2280, y: 1040, width: 120, height: 160 }
  }
  return sprite
}

export function updateResultBox(sprite, text, messageIndex, totalMessages = 3, visibleChars = Infinity) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  drawResultBoxCanvas(context, canvas, text, messageIndex, totalMessages, visibleChars)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  sprite.material.map = texture
  sprite.material.needsUpdate = true
}

// ─── Intro text panels ────────────────────────────────────────────────────────
// Default English body texts — used as fallback when no localized array is passed.
const DEFAULT_INTRO_BODIES = [
  "For many years, people burned too many fossil fuels, cut down forests, and polluted the air.",
  "This caused climate change. There were huge storms, wildfires, floods, and droughts.",
  "Earth is in danger. Explore space to find a new home. Your mission begins now!"
]

function drawNavigationButtons(context, width, height, textState) {
  // Arrows are 2× the size of planet fact box arrows to match the larger canvas (2560 vs 1280).
  // Back arrow is dimmed on the first panel (textState === 0).
  const buttonSize = 160
  const bottomY = height - 160

  context.fillStyle = textState === 0 ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(280, bottomY - buttonSize / 2)
  context.lineTo(160, bottomY)
  context.lineTo(280, bottomY + buttonSize / 2)
  context.fill()

  context.fillStyle = "lightblue"
  context.beginPath()
  context.moveTo(width - 280, bottomY - buttonSize / 2)
  context.lineTo(width - 160, bottomY)
  context.lineTo(width - 280, bottomY + buttonSize / 2)
  context.fill()
}

function drawIntroCanvas(context, canvas, textState, visibleChars, bodies) {
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  context.fillStyle = "lightblue"
  context.font = "bold 120px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText("🚨 ALERT", canvas.width / 2, 200)
  context.fillText("Earth has been badly damaged", canvas.width / 2, 340)

  const bodyText = bodies[textState] || bodies[0]
  const displayText = Number.isFinite(visibleChars) ? bodyText.slice(0, visibleChars) : bodyText
  const lineHeight = textState === 0 ? 120 * 1.1 : 120 * 1.2
  drawWrappedText(context, displayText, canvas.width / 2, 580, canvas.width - 400, 120, lineHeight)

  drawNavigationButtons(context, canvas.width, canvas.height, textState)
}

export function createInteractiveIntroText(textState = 0, visibleChars = 0, bodyTexts = null) {
  const bodies = bodyTexts || DEFAULT_INTRO_BODIES
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  drawIntroCanvas(context, canvas, textState, visibleChars, bodies)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(18, 9, 1)
  // Hit areas: bottomY=1120, arrows at x=160–280 and x=2280–2400
  sprite.userData = {
    textState,
    isInteractive: true,
    backButtonArea:    { x: 160,              y: 1040, width: 120, height: 160 },
    forwardButtonArea: { x: canvas.width - 280, y: 1040, width: 120, height: 160 }
  }
  return sprite
}

export function updateInteractiveIntroText(sprite, textState, visibleChars = Infinity, bodyTexts = null) {
  const bodies = bodyTexts || DEFAULT_INTRO_BODIES
  sprite.userData.textState = textState

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  drawIntroCanvas(context, canvas, textState, visibleChars, bodies)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  sprite.material.map = texture
  sprite.material.needsUpdate = true
}

// ─── VR instructions panel ────────────────────────────────────────────────────

export function createVRInstructionsSprite() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  context.fillStyle = 'rgba(0, 0, 128, 0.6)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = 'lightblue'
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  context.fillStyle = 'lightblue'
  context.textAlign = 'center'

  context.font = "bold 130px 'Press Start 2P', cursive"
  context.fillText('VR CONTROLS', canvas.width / 2, 200)

  // Divider line
  context.strokeStyle = 'rgba(173, 216, 230, 0.4)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(100, 260)
  context.lineTo(canvas.width - 100, 260)
  context.stroke()

  // Controls list (two-column layout)
  context.fillStyle = 'lightblue'
  context.font = "85px 'Space Grotesk', sans-serif"
  const lx = 200
  let y = 410
  const gap = 130

  const rows = [
    ['X Button',               'Next / Select'],
    ['Y Button',               'Back'],
    ['Right Thumbstick Press', 'Mute / Unmute'],
    ['Gaze at planet + X',     'Choose that planet'],
  ]

  rows.forEach(([label, value]) => {
    context.textAlign = 'left'
    context.fillText(label, lx, y)
    context.textAlign = 'right'
    context.fillText(value, canvas.width - lx, y)
    y += gap
  })

  context.textAlign = 'center'
  context.font = "bold 95px 'Space Grotesk', sans-serif"
  context.fillStyle = 'rgba(173, 216, 230, 0.75)'
  context.fillText('Press  X  to begin', canvas.width / 2, 1150)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4.5, 2.25, 1)
  return sprite
}
