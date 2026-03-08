import * as THREE from 'three'

const loader = new THREE.TextureLoader()

// Cache of pre-loaded textures keyed by URL.
// Populated by preloadPlanetTextures() at startup so all textures are ready
// before the first planet animation plays.
const textureCache = new Map()

// Fallback colors used when a planet texture image fails to load.
// Each value is a hex color that approximates the planet's real appearance.
const PLANET_FALLBACK_COLORS = {
  mercury: 0x9e9e9e, // grey rocky surface
  venus:   0xe8c07d, // pale golden-yellow
  mars:    0xb5451b, // rusty red
  jupiter: 0xc88b3a, // orange-tan
  saturn:  0xe4d191, // pale gold
  uranus:  0x7de8e8, // cyan-blue
  neptune: 0x3f54ba, // deep blue
}

/**
 * Creates a solid-colour fallback texture when a planet image fails to load.
 * @param {number} color - hex colour integer
 * @returns {THREE.CanvasTexture}
 */
function createFallbackTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const hex = '#' + color.toString(16).padStart(6, '0')
  ctx.fillStyle = hex
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Returns the fallback colour for a texture URL, matched by planet name in the path.
 * @param {string} url - texture path, e.g. "/textures/mars.jpg"
 * @returns {number} hex colour integer
 */
function fallbackColorForUrl(url) {
  const lower = url.toLowerCase()
  for (const [name, color] of Object.entries(PLANET_FALLBACK_COLORS)) {
    if (lower.includes(name)) return color
  }
  return 0x555555 // generic grey if planet name not matched
}

export function preloadPlanetTextures(planetsData) {
  planetsData.forEach(planet => {
    if (!textureCache.has(planet.texture)) {
      const tex = loader.load(
        planet.texture,
        // onLoad — apply quality settings once the image has decoded
        (loadedTex) => {
          loadedTex.anisotropy = 16
          loadedTex.colorSpace = THREE.SRGBColorSpace
          loadedTex.needsUpdate = true
        },
        // onProgress — not used but required positional arg
        undefined,
        // onError — swap in the fallback solid-colour texture
        () => {
          console.warn(`Planet.Hop: texture failed to load — "${planet.texture}". Using fallback colour.`)
          const fallback = createFallbackTexture(fallbackColorForUrl(planet.texture))
          tex.image  = fallback.image
          tex.needsUpdate = true
        }
      )
      tex.anisotropy = 16
      tex.colorSpace = THREE.SRGBColorSpace
      textureCache.set(planet.texture, tex)
    }
  })
}

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

  // Use the pre-loaded cached texture if available; fall back to loading on demand.
  let texture = textureCache.get(data.texture)
  if (!texture) {
    texture = loader.load(
      data.texture,
      // onLoad — apply quality settings once the image has decoded
      (loadedTex) => {
        loadedTex.anisotropy = 16
        loadedTex.colorSpace = THREE.SRGBColorSpace
        loadedTex.needsUpdate = true
      },
      // onProgress — not used
      undefined,
      // onError — swap in a solid-colour fallback so the planet still renders
      () => {
        console.warn(`Planet.Hop: texture failed to load — "${data.texture}". Using fallback colour.`)
        const fallback = createFallbackTexture(fallbackColorForUrl(data.texture))
        texture.image = fallback.image
        texture.needsUpdate = true
      }
    )
    texture.anisotropy = 16
    texture.colorSpace = THREE.SRGBColorSpace
    textureCache.set(data.texture, texture)
  }

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
