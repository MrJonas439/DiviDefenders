<template>
  <div ref="container" class="w-full h-full bg-black"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'https://esm.sh/three@0.170.0'

const props = defineProps({ viewAngle: Number, gameState: String, sides: Object, difficulty: String })
const emit = defineEmits(['monster-hit', 'world-ready'])
const container = ref(null)

let scene, camera, renderer, clock, monsterGroup, bowGroup, targetRotation = 0, currentRotation = 0, animationFrameId = null
let activeArrows = []
let ambientLight, directionalLight

// Biome Definitions
const biomes = {
  easy: { fog: 0x051a14, sky: 0x0f2922, ground: 0x143a28, treeCone: 0x064e3b, treeTrunk: 0x4b3832 },
  medium: { fog: 0x0c051a, sky: 0x1a0f2e, ground: 0x1d1433, treeCone: 0x2e1a47, treeTrunk: 0x2b1b3d },
  hard: { fog: 0x1a0505, sky: 0x2b0a0a, ground: 0x3d0c0c, treeCone: 0x541414, treeTrunk: 0x1f0b0b },
  remix: { fog: 0x000000, sky: 0x0a0514, ground: 0x0d061f, treeCone: 0x0d061f, treeTrunk: 0x1a113d }
}

onMounted(() => { 
  initThree()
  animate()
  window.addEventListener('resize', onResize)
  setTimeout(() => emit('world-ready'), 500)
})

function initThree() {
  const currentBiome = biomes[props.difficulty] || biomes.easy

  scene = new THREE.Scene()
  scene.background = new THREE.Color(currentBiome.sky)
  scene.fog = new THREE.Fog(currentBiome.fog, 40, 150)

  const width = container.value?.clientWidth || 800
  const height = container.value?.clientHeight || 600

  camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000)
  camera.position.set(0, 2.5, 0)
  scene.add(camera)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  container.value.appendChild(renderer.domElement)

  // Dynamic Lighting Setup
  ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  directionalLight.position.set(20, 100, 20)
  scene.add(directionalLight)

  // Ground Setup
  const floorMaterial = new THREE.MeshStandardMaterial({ color: currentBiome.ground, roughness: 0.8 })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  // Build the 4 lanes (Left, Center, Right, Shop)
  const angles = [-90, 0, 90, 180]
  angles.forEach(a => {
    const rad = a * Math.PI / 180
    if (a !== 180) {
      // Draw Paths
      const path = new THREE.Mesh(new THREE.PlaneGeometry(12, 200), new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 }))
      path.rotation.x = -Math.PI / 2
      path.position.set(0, 0.01, -100).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
      scene.add(path)

      // Spawn Trees based on Biome
      for (let i = 0; i < 40; i++) {
        const tree = createTree(currentBiome)
        const dist = 20 + Math.random() * 150
        const x = (Math.random() - 0.5) * 80
        if (Math.abs(x) > 10) {
          tree.position.set(x, 0, -dist).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
          scene.add(tree)
        }
      }
    }
  })

  bowGroup = createBowModel()
  bowGroup.position.set(0.6, -0.6, -1.0)
  camera.add(bowGroup)

  monsterGroup = new THREE.Group()
  scene.add(monsterGroup)
  clock = new THREE.Clock()
}

// 🌲 Procedural Tree Function (Changes colors based on difficulty!)
function createTree(biome) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3, 5), new THREE.MeshStandardMaterial({ color: biome.treeTrunk }))
  trunk.position.y = 1.5
  g.add(trunk)

  const leaves = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 5), new THREE.MeshStandardMaterial({ color: biome.treeCone, roughness: 0.8 }))
  leaves.position.y = 5
  g.add(leaves)
  return g
}

// 👾 MONSTER FACTORY
function createMonsterModel(type) {
  const g = new THREE.Group()

  if (type === 'slime') {
    // 🟢 Squishy Slime
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x4ade80, transparent: true, opacity: 0.8, roughness: 0.2 }))
    g.add(body)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat); eyeL.position.set(0.4, 0.4, -1); g.add(eyeL)
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat); eyeR.position.set(-0.4, 0.4, -1); g.add(eyeR)
  } else if (type === 'skeleton') {
    // 🔵 Blocky Skeleton
    const skull = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xd6d3d1 }))
    skull.position.y = 1.5
    g.add(skull)
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xd6d3d1 }))
    spine.position.y = 0.5
    g.add(spine)
    const ribs = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0xd6d3d1 }))
    ribs.position.y = 1
    g.add(ribs)
  } else if (type === 'golem') {
    // 🔴 Spiky Fire Golem
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 }))
    g.add(body)
    const magma = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 2.1), new THREE.MeshBasicMaterial({ color: 0xff3300 }))
    magma.position.y = 0.4
    g.add(magma)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), eyeMat); eyeL.position.set(0.6, 0.6, -1); g.add(eyeL)
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), eyeMat); eyeR.position.set(-0.6, 0.6, -1); g.add(eyeR)
  }

  return g
}

function createBowModel() {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: 0x4d3220 })
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.22), m); g.add(r)
  const limb = (up) => {
    const pts = []
    const s = up ? 1 : -1
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new THREE.Vector3(-Math.sin(t * Math.PI * 0.8) * 0.5, s * (0.55 + t * 2.8), 0))
    }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.06, 8, false), m)
    g.add(mesh)
    return pts[pts.length - 1]
  }
  const u = limb(true), l = limb(false)
  const str = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([u, l]), 2, 0.005, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  g.add(str)
  return g
}

function createArrowMesh() {
  const g = new THREE.Group()
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), new THREE.MeshStandardMaterial({ color: 0x5d4037 }))
  s.rotation.x = Math.PI / 2
  g.add(s)
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 }))
  t.position.z = -0.75
  t.rotation.x = -Math.PI / 2
  g.add(t)
  return g
}

async function fireVolley(sideKey, mCount, pMonster) {
  camera.updateMatrixWorld()
  const start = new THREE.Vector3(0.6, 2.0, -1).applyMatrix4(camera.matrixWorld)
  const side = props.sides[sideKey]
  
  for (let j = 0; j < mCount; j++) {
    const m = monsterGroup.children.find(x => x.name === `${sideKey}-${side.monsters[j]?.id}`)
    if (m) {
      for (let i = 0; i < pMonster; i++) {
        const a = createArrowMesh()
        a.position.copy(start)
        const target = m.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, 0))
        a.lookAt(target)
        scene.add(a)
        activeArrows.push({ mesh: a, startPos: start.clone(), targetPos: target, startTime: Date.now(), duration: 800 })
      }
    }
  }
  await new Promise(r => setTimeout(r, 1000))
}

function fireDeflect(sideKey) {
  camera.updateMatrixWorld()
  const start = new THREE.Vector3(0.6, 2.0, -1).applyMatrix4(camera.matrixWorld)
  const m = monsterGroup.children.find(x => x.userData.sideKey === sideKey)
  if (!m) return
  const a = createArrowMesh()
  a.position.copy(start)
  a.lookAt(m.position)
  scene.add(a)
  activeArrows.push({ mesh: a, startPos: start.clone(), targetPos: m.position.clone(), startTime: Date.now(), duration: 500, deflect: true })
}

defineExpose({ fireVolley, fireDeflect })

// 🌲 Refresh biome when difficulty changes
watch(() => props.difficulty, (newDiff) => {
  if (!scene) return
  const b = biomes[newDiff] || biomes.easy
  scene.background.setHex(b.sky)
  scene.fog.color.setHex(b.fog)
  ambientLight.color.setHex(b.sky) // ambient glow matches sky
}, { immediate: true })

watch(() => props.viewAngle, v => targetRotation = v * Math.PI / 180)

watch(() => props.sides, n => {
  monsterGroup.children.forEach(c => { 
    if (!Object.values(n).some(s => s.monsters?.some(m => `${s.angle === 90 ? 'left' : s.angle === 270 ? 'right' : 'center'}-${m.id}` === c.name))) monsterGroup.remove(c) 
  })

  Object.keys(n).forEach(k => n[k].monsters?.forEach(m => {
    const id = `${k}-${m.id}`
    if (monsterGroup.getObjectByName(id)) return

    // Find difficulty type (Slime, Skeleton, Golem)
    const mType = n[k].monsterType || 'slime'
    const g = createMonsterModel(mType)
    
    g.name = id
    const rad = n[k].angle * Math.PI / 180
    g.position.set((m.idx - (m.count - 1) / 2) * 4, 1, -120).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
    g.userData = { sideKey: k, monsterId: m.id, orig: g.position.clone(), type: mType }
    monsterGroup.add(g)
  }))
}, { deep: true })

function animate() {
  animationFrameId = requestAnimationFrame(animate)
  if (!renderer) return

  currentRotation += (targetRotation - currentRotation) * 0.08
  camera.rotation.y = currentRotation

  // Monster animations (Slimes bounce, Golems tilt)
  monsterGroup.children.forEach(m => {
    const side = props.sides[m.userData.sideKey]
    const mData = side?.monsters.find(x => x.id === m.userData.monsterId)
    if (mData) {
      m.position.lerpVectors(m.userData.orig, new THREE.Vector3(0, 1, 0), mData.progress)
      
      if (m.userData.type === 'slime') {
        m.scale.y = 1 + Math.sin(Date.now() * 0.008) * 0.15 // Bounce
      } else if (m.userData.type === 'skeleton') {
        m.rotation.y = Math.sin(Date.now() * 0.004) * 0.3 // Shambling
      } else if (m.userData.type === 'golem') {
        m.rotation.z = Math.sin(Date.now() * 0.002) * 0.1 // Heavy tilt
      }
    }
  })

  activeArrows = activeArrows.filter(a => {
    const t = Math.min((Date.now() - a.startTime) / a.duration, 1)
    a.mesh.position.lerpVectors(a.startPos, a.targetPos, t)
    a.mesh.lookAt(a.targetPos)
    if (a.deflect && t > 0.8) a.mesh.position.y += 0.2
    if (t >= 1) { scene.remove(a.mesh); return false } 
    return true
  })

  renderer.render(scene, camera)
}

function onResize() { 
  if (!container.value || !camera) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight) 
}

onUnmounted(() => { 
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  renderer?.dispose() 
})
</script>
