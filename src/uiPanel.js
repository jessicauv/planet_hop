import * as THREE from 'three'

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

export function createIntroText() {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = 800
  canvas.height = 400

  // Draw background box
  context.fillStyle = "rgba(0, 0, 0, 0.8)"
  context.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw border
  context.strokeStyle = "#ff3333"
  context.lineWidth = 4
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

  // Draw title
  context.fillStyle = "#ff3333"
  context.font = "bold 48px Arial"
  context.textAlign = "center"
  context.fillText("Oh no! Something terrible has happened!", canvas.width / 2, 80)

  // Draw subtitle
  context.fillStyle = "white"
  context.font = "36px Arial"
  context.fillText("A giant explosion has damaged Earth!", canvas.width / 2, 160)

  // Draw instructions
  context.fillStyle = "#cccccc"
  context.font = "24px Arial"
  context.fillText("Click anywhere to continue your journey...", canvas.width / 2, 280)

  const texture = new THREE.CanvasTexture(canvas)

  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4, 2, 1)

  return sprite
}
