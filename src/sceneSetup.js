import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function createScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  
    const textureLoader = new THREE.TextureLoader()
    const spaceTexture = textureLoader.load('/textures/milkyway.jpg')
    spaceTexture.colorSpace = THREE.SRGBColorSpace

    const skyGeo = new THREE.SphereGeometry(500, 64, 64)

    // Important: flip inside
    const skyMat = new THREE.MeshBasicMaterial({
    map: spaceTexture,
    side: THREE.BackSide
    })

    const sky = new THREE.Mesh(skyGeo, skyMat)
    scene.add(sky)


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