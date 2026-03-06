import * as THREE from 'three'

function drawWrappedText(context, text, x, y, maxWidth, fontSize, lineHeight) {
  context.font = `${fontSize}px 'Space Grotesk', sans-serif`
  context.textAlign = "center"
  
  const words = text.split(' ')
  let line = ''
  let currentY = y
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = context.measureText(testLine)
    const testWidth = metrics.width
    
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

export function createTextSprite(message) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = 512
  canvas.height = 256

  context.fillStyle = "white"
  context.font = "40px Arial"
  context.fillText(message, 20, 100)

  const texture = new THREE.CanvasTexture(canvas)

  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2, 1, 1)

  return sprite
}

function drawFactBoxCanvas(context, canvas, factText, planetName, planetIndex, factIndex, totalFacts, visibleChars = Infinity) {
  // Draw background box with 60% opacity
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Draw border
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Draw planet name title
  context.fillStyle = "lightblue"
  context.font = "bold 80px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText(planetName, canvas.width / 2, 130)

  // Draw fact text with wrapping
  context.fillStyle = "lightblue"
  context.font = "60px 'Space Grotesk', sans-serif"
  const maxWidth = canvas.width - 100
  const fontSize = 60
  const lineHeight = fontSize * 1.2
  const displayFactText = Number.isFinite(visibleChars) ? factText.slice(0, visibleChars) : factText
  drawWrappedText(context, displayFactText, canvas.width / 2, 220, maxWidth, fontSize, lineHeight)

  // Draw page indicator dots (e.g. ● ● ○)
  const dotRadius = 16
  const dotSpacing = 50
  const totalDots = totalFacts
  const dotsStartX = canvas.width / 2 - ((totalDots - 1) * dotSpacing) / 2
  const dotsY = canvas.height - 130
  for (let i = 0; i < totalDots; i++) {
    context.beginPath()
    context.arc(dotsStartX + i * dotSpacing, dotsY, dotRadius, 0, Math.PI * 2)
    context.fillStyle = i === factIndex ? "lightblue" : "rgba(173, 216, 230, 0.3)"
    context.fill()
  }

  // Draw navigation arrows
  const buttonSize = 80
  const bottomY = canvas.height - 80

  // Back arrow (left) - dimmed on first fact of first planet
  const isFirst = planetIndex === 0 && factIndex === 0
  context.fillStyle = isFirst ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(140, bottomY - buttonSize / 2)
  context.lineTo(80, bottomY)
  context.lineTo(140, bottomY + buttonSize / 2)
  context.fill()

  // Forward arrow (right)
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
  
  // Store fact information and button areas on the sprite
  sprite.userData = { 
    isFactBox: true,
    factText: factText,
    backButtonArea: { x: 50, y: canvas.height - 150, width: 120, height: 120 },
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

export function createSelectionMessageBox() {
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
  context.fillText("Explorer, you've seen all the planets.", canvas.width / 2, 200)
  context.font = "90px 'Space Grotesk', sans-serif"
  context.fillText("Select the best possible future home.", canvas.width / 2, 360)

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

export function createPlanetHopLogo() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 1024
  canvas.height = 256

  // Set smaller font size for all text
  const fontSize = 50
  context.font = `bold ${fontSize}px 'Press Start 2P', cursive`
  context.textAlign = "left"
  context.fillStyle = "lightblue"
  context.shadowColor = "rgba(0, 100, 255, 0.5)"
  context.shadowBlur = 10

  // Calculate positions based on text width for proper spacing
  const planetWidth = context.measureText("PLANET").width
  const dotWidth = context.measureText(".").width
  const hopWidth = context.measureText("HOP").width
  
  // Starting position
  let currentX = 40
  const y = 160

  // Draw "Planet" text
  context.fillText("PLANET", currentX, y)
  currentX += planetWidth + 5 // Minimal gap

  // Draw "." with enhanced glow
  context.shadowColor = "rgba(0, 100, 255, 0.8)"
  context.shadowBlur = 15
  context.fillText(".", currentX, y)
  currentX += dotWidth + 5 // Minimal gap

  // Draw "Hop" text
  context.shadowColor = "rgba(0, 100, 255, 0.5)"
  context.shadowBlur = 10
  context.fillText("HOP", currentX, y)

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
  sprite.scale.set(4, 1, 1)
  
  // Store logo information
  sprite.userData = { isPlanetHopLogo: true }
  
  return sprite
}

function drawResultBoxCanvas(context, canvas, text, messageIndex, totalMessages, visibleChars = Infinity) {
  // Background + border — same style as intro text box
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Body text — 120px to match intro style, centered vertically
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

  // Navigation arrows — same 2× size as intro text box
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

  // Hit areas match intro text box layout: bottomY=1120, arrows at x=160–280 and x=2280–2400
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

export function createInteractiveIntroText(textState = 0, visibleChars = 0) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = 2560
  canvas.height = 1280

  // Draw background box with 60% opacity
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw border
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Draw title (always present) - ONE THAT ACTUALLY WORKS
  context.fillStyle = "lightblue"
  context.font = "bold 120px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText("🚨 ALERT", canvas.width / 2, 200)
  context.fillText("Earth has been badly damaged", canvas.width / 2, 340)

  // Draw body text based on state
  context.fillStyle = "lightblue"
  context.font = "72px 'Space Grotesk', sans-serif"
  
  if (textState === 0) {
    // First state: "For many years, people burned too many fossil fuels, cut down forests, and polluted the air."
    // Wrap long text into multiple lines with tighter spacing
    const longText = "For many years, people burned too many fossil fuels, cut down forests, and polluted the air."
    const displayIntroText0 = Number.isFinite(visibleChars) ? longText.slice(0, visibleChars) : longText
    const maxWidth = canvas.width - 400 // Reduce padding to make text more squished
    const fontSize = 120
    const lineHeight = fontSize * 1.1 // Reduce line height for tighter spacing
    
    drawWrappedText(context, displayIntroText0, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  } else if (textState === 1) {
    // Second state: Climate change message
    const climateText = "This caused climate change. There were huge storms, wildfires, floods, and droughts."
    const displayIntroText1 = Number.isFinite(visibleChars) ? climateText.slice(0, visibleChars) : climateText
    const maxWidth = canvas.width - 400 // Leave some padding
    const fontSize = 120
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, displayIntroText1, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  } else {
    // Third state: Mission message
    const missionText = "Earth is in danger. Explore space to find a new home. Your mission begins now!"
    const displayIntroText2 = Number.isFinite(visibleChars) ? missionText.slice(0, visibleChars) : missionText
    const maxWidth = canvas.width - 400 // More padding to match visual appearance of climateText
    const fontSize = 120
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, displayIntroText2, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  }

  // Draw navigation buttons
  drawNavigationButtons(context, canvas.width, canvas.height, textState)

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
  
  // Store state information on the sprite for interaction
  // bottomY = canvas.height - 160 = 1120, arrows centered at that y
  // Back arrow: x=160→280 (120px wide), y=1120 ± 80 (160px tall)
  // Forward arrow: x=(width-280)→(width-160), same y
  sprite.userData = { 
    textState: textState,
    isInteractive: true,
    backButtonArea: { x: 160, y: 1040, width: 120, height: 160 },
    forwardButtonArea: { x: canvas.width - 280, y: 1040, width: 120, height: 160 }
  }

  return sprite
}

function drawNavigationButtons(context, width, height, textState) {
  // Scale factor: canvas is 2560 wide vs 1280 for planet pages (2x scale)
  // Planet arrows: buttonSize=80, x positions 80→140 (60px wide)
  // Here scaled 2x: buttonSize=160, x positions 160→280 (120px wide)
  const buttonSize = 160
  const bottomY = height - 160  // Position at bottom of text box
  
  // Back button (left) - arrow pointing left (same style as planet pages, 2x scaled)
  context.fillStyle = textState === 0 ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(280, bottomY - buttonSize / 2)
  context.lineTo(160, bottomY)
  context.lineTo(280, bottomY + buttonSize / 2)
  context.fill()
  
  // Forward button (right) - arrow pointing right (same style as planet pages, 2x scaled)
  context.fillStyle = "lightblue"
  context.beginPath()
  context.moveTo(width - 280, bottomY - buttonSize / 2)
  context.lineTo(width - 160, bottomY)
  context.lineTo(width - 280, bottomY + buttonSize / 2)
  context.fill()
}

export function createVRInstructionsSprite() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = 2560
  canvas.height = 1280

  // Background + border — same dark-blue style as all other panels
  context.fillStyle = 'rgba(0, 0, 128, 0.6)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = 'lightblue'
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  context.fillStyle = 'lightblue'
  context.textAlign = 'center'

  // Title
  context.font = "bold 130px 'Press Start 2P', cursive"
  context.fillText('VR CONTROLS', canvas.width / 2, 200)

  // Divider
  context.strokeStyle = 'rgba(173, 216, 230, 0.4)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(100, 260)
  context.lineTo(canvas.width - 100, 260)
  context.stroke()

  // Controls list
  context.fillStyle = 'lightblue'
  context.font = "85px 'Space Grotesk', sans-serif"
  const lx = 200   // left column
  const rx = 1480  // right column
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

  // "Press X to begin" prompt
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

export function updateInteractiveIntroText(sprite, textState, visibleChars = Infinity) {
  // Update the sprite's text state and recreate the texture
  sprite.userData.textState = textState
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  canvas.width = 2560
  canvas.height = 1280

  // Draw background box with 60% opacity
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw border
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Draw title (always present)
  context.fillStyle = "lightblue"
  context.font = "bold 120px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText("🚨 ALERT", canvas.width / 2, 200)
  context.fillText("Earth has been badly damaged", canvas.width / 2, 340)

  // Draw body text based on state
  context.fillStyle = "lightblue"
  context.font = "72px 'Space Grotesk', sans-serif"
  
  if (textState === 0) {
    // First state: "For many years, people burned too many fossil fuels, cut down forests, and polluted the air."
    // Wrap long text into multiple lines with tighter spacing
    const longText = "For many years, people burned too many fossil fuels, cut down forests, and polluted the air."
    const displayUpdateText0 = Number.isFinite(visibleChars) ? longText.slice(0, visibleChars) : longText
    const maxWidth = canvas.width - 400 // Reduce padding to make text more squished
    const fontSize = 120
    const lineHeight = fontSize * 1.1 // Reduce line height for tighter spacing
    
    drawWrappedText(context, displayUpdateText0, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  } else if (textState === 1) {
    // Second state: Climate change message
    const climateText = "This caused climate change. There were huge storms, wildfires, floods, and droughts."
    const displayUpdateText1 = Number.isFinite(visibleChars) ? climateText.slice(0, visibleChars) : climateText
    const maxWidth = canvas.width - 400 // Leave some padding
    const fontSize = 120
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, displayUpdateText1, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  } else {
    // Third state: Mission message
    const missionText = "Earth is in danger. Explore space to find a new home. Your mission begins now!"
    const displayUpdateText2 = Number.isFinite(visibleChars) ? missionText.slice(0, visibleChars) : missionText
    const maxWidth = canvas.width - 400 // More padding to match visual appearance of climateText
    const fontSize = 120
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, displayUpdateText2, canvas.width / 2, 580, maxWidth, fontSize, lineHeight)
  }

  // Draw navigation buttons
  drawNavigationButtons(context, canvas.width, canvas.height, textState)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  
  sprite.material.map = texture
  sprite.material.needsUpdate = true
}
