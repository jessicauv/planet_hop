import * as THREE from 'three'

const loader = new THREE.TextureLoader()

export function createPlanet(data) {
  const geometry = new THREE.SphereGeometry(data.size, 64, 64)

  const material = new THREE.MeshStandardMaterial({
    map: loader.load(data.texture),
    roughness: 1,
    metalness: 0
  })

  const planet = new THREE.Mesh(geometry, material)

  return planet
}