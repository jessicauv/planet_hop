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