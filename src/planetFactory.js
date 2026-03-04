import * as THREE from 'three'

const loader = new THREE.TextureLoader()

function createRingTexture(colorStops) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, size, 0)
  colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, 1)
  return new THREE.CanvasTexture(canvas)
}

function addRings(targetGroup, planetSize, colorStops, innerMult, outerMult) {
  const ringTex = createRingTexture(colorStops)
  const ringGeom = new THREE.RingGeometry(planetSize * innerMult, planetSize * outerMult, 128)
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
  })
  const ring = new THREE.Mesh(ringGeom, ringMat)
  ring.rotation.x = -Math.PI / 2  // Lay flat in equatorial (XZ) plane
  targetGroup.add(ring)
}

function addGlow(group, planetSize, color, sizeMult, opacity) {
  const glowGeom = new THREE.SphereGeometry(planetSize * sizeMult, 32, 32)
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.BackSide,
    depthWrite: false
  })
  const glowMesh = new THREE.Mesh(glowGeom, glowMat)
  // Tag with the intended opacity so warp-zoom transitions respect it
  glowMesh.userData.baseOpacity = opacity
  group.add(glowMesh)
}

export function createPlanet(data) {
  const group = new THREE.Group()

  const geometry = new THREE.SphereGeometry(data.size, 64, 64)

  const texture = loader.load(data.texture)
  texture.anisotropy = 16   // Max anisotropy for crisp texture at oblique angles
  texture.colorSpace = THREE.SRGBColorSpace

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,  // Slightly less rough so lighting reveals more surface detail
    metalness: 0
  })
  const planetMesh = new THREE.Mesh(geometry, material)

  if (data.name === 'Saturn') {
    // Tilted sub-group so planet body + rings tilt together (~27° axial tilt)
    const tiltGroup = new THREE.Group()
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(27)
    tiltGroup.add(planetMesh)

    // Wide, golden/tan ring system — classic Saturn look, starts right at planet surface
    addRings(tiltGroup, data.size, [
      [0,    'rgba(180,150,90,0.15)'],
      [0.08, 'rgba(200,165,100,0.55)'],
      [0.22, 'rgba(220,185,115,0.85)'],
      [0.42, 'rgba(230,195,125,0.92)'],
      [0.60, 'rgba(215,180,110,0.85)'],
      [0.78, 'rgba(200,165,95,0.60)'],
      [0.90, 'rgba(185,150,80,0.30)'],
      [1,    'rgba(0,0,0,0)']
    ], 1.02, 2.35)

    group.add(tiltGroup)

  } else if (data.name === 'Uranus') {
    // ~98° axial tilt — "on its side" — mentioned in the story!
    const tiltGroup = new THREE.Group()
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(98)
    tiltGroup.add(planetMesh)

    // Faint thin rings — starts right at planet surface, fades in quickly
    addRings(tiltGroup, data.size, [
      [0,    'rgba(160,210,230,0.10)'],
      [0.12, 'rgba(160,210,230,0.35)'],
      [0.35, 'rgba(170,220,240,0.50)'],
      [0.60, 'rgba(165,215,235,0.45)'],
      [0.80, 'rgba(155,205,225,0.30)'],
      [0.92, 'rgba(0,0,0,0)'],
      [1,    'rgba(0,0,0,0)']
    ], 1.02, 1.65)

    group.add(tiltGroup)

  } else if (data.name === 'Jupiter') {
    group.add(planetMesh)
    // Warm orange atmospheric glow — gas giant ambiance
    addGlow(group, data.size, 0xff9944, 1.09, 0.09)

  } else if (data.name === 'Neptune') {
    group.add(planetMesh)
    // Deep blue atmospheric glow — icy gas giant
    addGlow(group, data.size, 0x2244ff, 1.07, 0.13)

  } else {
    group.add(planetMesh)
  }

  return group
}
