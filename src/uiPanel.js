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

export function createFactTextBox(factText) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = 1280
  canvas.height = 720

  // Draw background box with 60% opacity
  context.fillStyle = "rgba(0, 0, 128, 0.6)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw border
  context.strokeStyle = "lightblue"
  context.lineWidth = 6
  context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  // Draw title
  context.fillStyle = "lightblue"
  context.font = "bold 80px 'Space Grotesk', sans-serif"
  context.textAlign = "center"
  context.fillText("Planet Fact", canvas.width / 2, 100)

  // Draw fact text with wrapping
  context.fillStyle = "lightblue"
  context.font = "60px 'Space Grotesk', sans-serif"
  
  const maxWidth = canvas.width - 100
  const fontSize = 60
  const lineHeight = fontSize * 1.2
  
  drawWrappedText(context, factText, canvas.width / 2, 220, maxWidth, fontSize, lineHeight)

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
  
  // Store fact information on the sprite
  sprite.userData = { 
    isFactBox: true,
    factText: factText
  }

  return sprite
}

export function createInteractiveIntroText(textState = 0) {
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
  context.font = "bold 100px 'Space Grotesk', sans-serif"
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
    const maxWidth = canvas.width - 200 // Reduce padding to make text more squished
    const fontSize = 72
    const lineHeight = fontSize * 1.1 // Reduce line height for tighter spacing
    
    drawWrappedText(context, longText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
  } else if (textState === 1) {
    // Second state: Climate change message
    const climateText = "This caused climate change. There were huge storms, wildfires, floods, and droughts."
    const maxWidth = canvas.width - 100 // Leave some padding
    const fontSize = 48
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, climateText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
  } else {
    // Third state: Mission message
    const missionText = "Now Earth is in danger…\nAnd we must explore space to see if another planet could be our new home. Explorer, your mission begins now!"
    const maxWidth = canvas.width - 100 // Leave some padding
    const fontSize = 48
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, missionText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
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
  sprite.userData = { 
    textState: textState,
    isInteractive: true,
    backButtonArea: { x: 50, y: canvas.height / 2, width: 100, height: 100 },
    forwardButtonArea: { x: canvas.width - 150, y: canvas.height / 2, width: 100, height: 100 }
  }

  return sprite
}

function drawNavigationButtons(context, width, height, textState) {
  const buttonSize = 80
  const bottomY = height - 100  // Position at bottom of text box
  
  // Back button (left) - arrow pointing left
  context.fillStyle = textState === 0 ? "rgba(255, 255, 255, 0.3)" : "lightblue"
  context.beginPath()
  context.moveTo(140, bottomY - buttonSize/2)
  context.lineTo(80, bottomY)
  context.lineTo(140, bottomY + buttonSize/2)
  context.fill()
  
  // Forward button (right) - arrow pointing right
  context.fillStyle = "lightblue"
  context.beginPath()
  context.moveTo(width - 140, bottomY - buttonSize/2)
  context.lineTo(width - 80, bottomY)
  context.lineTo(width - 140, bottomY + buttonSize/2)
  context.fill()
}

export function updateInteractiveIntroText(sprite, textState) {
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
  context.font = "bold 100px 'Space Grotesk', sans-serif"
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
    const maxWidth = canvas.width - 200 // Reduce padding to make text more squished
    const fontSize = 72
    const lineHeight = fontSize * 1.1 // Reduce line height for tighter spacing
    
    drawWrappedText(context, longText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
  } else if (textState === 1) {
    // Second state: Climate change message
    const climateText = "This caused climate change. There were huge storms, wildfires, floods, and droughts."
    const maxWidth = canvas.width - 100 // Leave some padding
    const fontSize = 72
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, climateText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
  } else {
    // Third state: Mission message
    const missionText = "Now Earth is in danger…\nAnd we must explore space to see if another planet could be our new home. Explorer, your mission begins now!"
    const maxWidth = canvas.width - 100 // Leave some padding
    const fontSize = 72
    const lineHeight = fontSize * 1.2
    
    drawWrappedText(context, missionText, canvas.width / 2, 480, maxWidth, fontSize, lineHeight)
  }

  // Draw navigation buttons
  drawNavigationButtons(context, canvas.width, canvas.height, textState)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  
  sprite.material.map = texture
  sprite.material.needsUpdate = true
}
