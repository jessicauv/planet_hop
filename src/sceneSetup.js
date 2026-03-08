import * as THREE from 'three'
import { Howl } from 'howler';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function createScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 1.6, 8)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)   // Sharp on Retina/HiDPI displays
  renderer.xr.enabled = true
  renderer.physicallyCorrectLights = true

  document.body.appendChild(renderer.domElement)
  
  // VR button — styled to match space theme, hidden until game launches
  let vrButton = null
  if (navigator.xr) {
    vrButton = VRButton.createButton(renderer)
    vrButton.id = 'vr-btn'
    vrButton.classList.add('vr-hidden')  // hide until after LAUNCH
    // Override default inline styles to match the space aesthetic
    vrButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      padding: 12px 28px;
      font-size: 14px;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: 1px;
      background: rgba(0, 0, 40, 0.75);
      color: lightblue;
      border: 2px solid lightblue;
      border-radius: 8px;
      cursor: pointer;
      z-index: 30;
      box-shadow: 0 0 12px rgba(100, 180, 255, 0.35);
      transition: background 0.2s ease;
    `
    document.body.appendChild(vrButton)
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  const controls = new OrbitControls(camera, renderer.domElement)

  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.rotateSpeed = 0.5
  controls.enablePan = false
  controls.minDistance = 2
  controls.maxDistance = 20

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambient)

  // Main key light — off to upper-right so texture shadows create surface depth
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5)
  sunLight.position.set(6, 4, 3)
  scene.add(sunLight)

  // Soft fill light from left to avoid pitch-black dark side
  const fillLight = new THREE.DirectionalLight(0x8899cc, 0.4)
  fillLight.position.set(-4, -1, 2)
  scene.add(fillLight)

  return { scene, camera, renderer, controls, vrButton }
}

// Creates and returns the looping background space audio track.
// html5: true bypasses the Web Audio context lock on mobile browsers.
export function createSpaceAudio() {
  return new Howl({
    src: ['/audio/space.mp3'],
    html5: true,
    loop: true,
    volume: 0.1
  })
}

// Function to create layered starfield
export function createStarfield(scene) {
  // Three depth layers of particle stars for parallax depth
  function createStars(count, spread, size) {
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread
      const y = (Math.random() - 0.5) * spread
      const z = (Math.random() - 0.5) * spread
      positions.push(x, y, z)

      // minimal color variation to keep stars bright white
      const color = new THREE.Color(0xffffff)
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05)
      colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthTest: true,
      blending: THREE.AdditiveBlending,  // Better blending for stars
      sizeAttenuation: true
    })

    const stars = new THREE.Points(geometry, material)
    scene.add(stars)
    return stars
  }

  const closeStars = createStars(1000, 200, 0.5)   // close, big
  const farStars   = createStars(2000, 1000, 0.25) // far, smaller
  const distantStars = createStars(3000, 3000, 0.1) // very far, tiny

  // Position all star layers behind the planets (z < 0)
  closeStars.position.z = -10
  farStars.position.z = -50
  distantStars.position.z = -100

  return { closeStars, farStars, distantStars }
}

