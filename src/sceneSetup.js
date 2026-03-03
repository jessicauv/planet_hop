import * as THREE from 'three'
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
  camera.position.set(0, 1.6, 5)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  renderer.physicallyCorrectLights = true

  document.body.appendChild(renderer.domElement)
  document.body.appendChild(VRButton.createButton(renderer))

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

  const sunLight = new THREE.PointLight(0xffffff, 3, 200)
  sunLight.position.set(0, 1.6, -3) // near planet position
  scene.add(sunLight)

  return { scene, camera, renderer, controls }
}

// Function to create layered starfield + Milky Way
export function createStarfield(scene) {
  const textureLoader = new THREE.TextureLoader()

  // --- 1️⃣ Optimized Milky Way Sphere ---
  const milkyWayTexture = textureLoader.load('/textures/milkyway.jpg')
  milkyWayTexture.colorSpace = THREE.SRGBColorSpace
  milkyWayTexture.minFilter = THREE.LinearFilter
  milkyWayTexture.magFilter = THREE.LinearFilter
  milkyWayTexture.anisotropy = 4

  const skyGeo = new THREE.SphereGeometry(500, 64, 64)
  const skyMat = new THREE.MeshBasicMaterial({
    map: milkyWayTexture,
    side: THREE.BackSide
  })
  const milkyWaySphere = new THREE.Mesh(skyGeo, skyMat)
  scene.add(milkyWaySphere)

  // --- 2️⃣ Optimized Particle Stars Function ---
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
      depthTest: false,  // Fix for flickering through Milky Way
      blending: THREE.AdditiveBlending,  // Better blending for stars
      sizeAttenuation: true
    })

    const stars = new THREE.Points(geometry, material)
    scene.add(stars)
    return stars
  }

  // --- 3️⃣ Create Layers of Stars ---
  const closeStars = createStars(1000, 200, 0.5)   // close, big
  const farStars   = createStars(2000, 1000, 0.25) // far, smaller
  const distantStars = createStars(3000, 3000, 0.1) // very far, tiny

  // Position all star layers behind the planets (z < 0)
  closeStars.position.z = -10
  farStars.position.z = -50
  distantStars.position.z = -100

  return { milkyWaySphere, closeStars, farStars, distantStars }
}

// Function to create a 3D rocket model
export function createRocket() {
  const rocketGroup = new THREE.Group()

  // Rocket body (cylinder)
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 1
  rocketGroup.add(body)

  // Rocket nose (cone)
  const noseGeo = new THREE.ConeGeometry(0.3, 0.8, 16)
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.8, roughness: 0.2 })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.position.y = 2.4
  rocketGroup.add(nose)

  // Rocket fins (3 sides)
  const finGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1)
  const finMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 })

  const fin1 = new THREE.Mesh(finGeo, finMat)
  fin1.position.set(0, 0.5, 0.3)
  fin1.rotation.z = Math.PI / 6
  rocketGroup.add(fin1)

  const fin2 = new THREE.Mesh(finGeo, finMat)
  fin2.position.set(0, 0.5, -0.3)
  fin2.rotation.z = -Math.PI / 6
  rocketGroup.add(fin2)

  const fin3 = new THREE.Mesh(finGeo, finMat)
  fin3.position.set(0.3, 0.5, 0)
  fin3.rotation.x = Math.PI / 6
  rocketGroup.add(fin3)

  // Rocket flames (particles)
  const flameGeo = new THREE.ConeGeometry(0.2, 0.6, 16)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = -0.4
  flame.rotation.x = Math.PI
  rocketGroup.add(flame)

  return rocketGroup
}
