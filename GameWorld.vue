<template>
  <div ref="container" class="w-full h-full bg-black"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'https://esm.sh/three@0.170.0'

const props = defineProps({ viewAngle: Number, gameState: String, sides: Object, difficulty: String })
const emit = defineEmits(['monster-hit'])
const container = ref(null)
let scene, camera, renderer, clock, monsterGroup, bowGroup, targetRotation = 0, currentRotation = 0, animationFrameId = null
let monsterMaterial, arrowMaterial, activeArrows = []

onMounted(() => { initThree(); animate(); window.addEventListener('resize', onResize) })

function initThree() {
  scene = new THREE.Scene(); 
  scene.background = new THREE.Color(0x050a14); 
  scene.fog = new THREE.Fog(0x050a14, 40, 150)
  
  // 👇 Added fallback width (800) and height (600) so it doesn't divide by zero!
  const width = container.value?.clientWidth || 800;
  const height = container.value?.clientHeight || 600;

  camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000); 
  camera.position.set(0, 2.5, 0); 
  scene.add(camera)
  
  renderer = new THREE.WebGLRenderer({ antialias: true }); 
  renderer.setSize(width, height); 
  container.value.appendChild(renderer.domElement)
  
  monsterMaterial = new THREE.MeshPhongMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 0.4 })
  arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xf59e0b })
  scene.add(new THREE.AmbientLight(0x404060, 1.5)); 
  const l = new THREE.DirectionalLight(0xffffff, 1.2); 
  l.position.set(20, 100, 20); 
  scene.add(l)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x052e16 })); 
  floor.rotation.x = -Math.PI / 2; 
  scene.add(floor)
  
  const angles = [-90, 0, 90, 180]
  angles.forEach(a => {
    const rad = a * Math.PI / 180
    if (a !== 180) {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(12, 200), new THREE.MeshPhongMaterial({ color: 0xd2b48c })); 
      path.rotation.x = -Math.PI/2; 
      path.position.set(0, 0.01, -100).applyAxisAngle(new THREE.Vector3(0,1,0), rad); 
      scene.add(path)
      for (let i=0; i<50; i++) { 
        const tree = createTree(); 
        const dist = 20 + Math.random()*150; 
        const x = (Math.random()-0.5)*80; 
        if (Math.abs(x) > 10) { 
          tree.position.set(x, 0, -dist).applyAxisAngle(new THREE.Vector3(0,1,0), rad); 
          scene.add(tree) 
        } 
      }
    }
  })
  bowGroup = createBowModel(); 
  bowGroup.position.set(0.6, -0.6, -1.0); 
  camera.add(bowGroup)
  monsterGroup = new THREE.Group(); 
  scene.add(monsterGroup); 
  clock = new THREE.Clock()
}

function createTree() {
  const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3), new THREE.MeshPhongMaterial({ color: 0x4b3832 })); t.position.y = 1.5; g.add(t)
  const f = new THREE.Mesh(new THREE.ConeGeometry(2, 6), new THREE.MeshPhongMaterial({ color: 0x064e3b })); f.position.y = 5; g.add(f); return g
}

function createBowModel() {
  const g = new THREE.Group(); const m = new THREE.MeshPhongMaterial({ color: 0x4d3220 })
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.22), m); g.add(r)
  const limb = (up) => {
    const pts = []; const s = up ? 1 : -1; for(let i=0; i<=20; i++) { const t = i/20; pts.push(new THREE.Vector3(-Math.sin(t*Math.PI*0.8)*0.5, s*(0.55+t*2.8), 0)) }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.06, 8, false), m); g.add(mesh); return pts[pts.length-1]
  }
  const u = limb(true), l = limb(false); const str = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([u, l]), 2, 0.005, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(str); return g
}

function createArrowMesh() {
  const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1), new THREE.MeshPhongMaterial({ color: 0x5d4037 })); s.rotation.x = Math.PI/2; g.add(s)
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15), arrowMaterial); t.position.z = -0.5; t.rotation.x = -Math.PI/2; g.add(t); return g
}

async function fireVolley(sideKey, mCount, pMonster) {
  camera.updateMatrixWorld(); const start = new THREE.Vector3(0.6, 2.0, -1).applyMatrix4(camera.matrixWorld)
  const side = props.sides[sideKey]; for (let j=0; j<mCount; j++) {
    const m = monsterGroup.children.find(x => x.name === `${sideKey}-${side.monsters[j]?.id}`)
    if (m) for (let i=0; i<pMonster; i++) {
      const a = createArrowMesh(); a.position.copy(start); const target = m.position.clone().add(new THREE.Vector3((Math.random()-0.5)*2, Math.random()*2, 0)); a.lookAt(target); scene.add(a)
      activeArrows.push({ mesh: a, startPos: start.clone(), targetPos: target, startTime: Date.now(), duration: 800 })
    }
  }
  await new Promise(r => setTimeout(r, 1000))
}

function fireDeflect(sideKey) {
  camera.updateMatrixWorld(); const start = new THREE.Vector3(0.6, 2.0, -1).applyMatrix4(camera.matrixWorld)
  const m = monsterGroup.children.find(x => x.userData.sideKey === sideKey); if (!m) return
  const a = createArrowMesh(); a.position.copy(start); a.lookAt(m.position); scene.add(a)
  activeArrows.push({ mesh: a, startPos: start.clone(), targetPos: m.position.clone(), startTime: Date.now(), duration: 500, deflect: true })
}

defineExpose({ fireVolley, fireDeflect })

watch(() => props.viewAngle, v => targetRotation = v * Math.PI / 180)
watch(() => props.sides, n => {
  monsterGroup.children.forEach(c => { if (!Object.values(n).some(s => s.monsters?.some(m => `${s.angle === 90 ? 'left' : s.angle === 270 ? 'right' : 'center'}-${m.id}` === c.name))) monsterGroup.remove(c) })
  Object.keys(n).forEach(k => n[k].monsters?.forEach(m => {
    const id = `${k}-${m.id}`; if (monsterGroup.getObjectByName(id)) return
    const g = new THREE.Group(); g.name = id; const b = new THREE.Mesh(new THREE.SphereGeometry(1), monsterMaterial); g.add(b)
    const rad = n[k].angle * Math.PI / 180; g.position.set((m.idx - (m.count-1)/2)*5, 1, -120).applyAxisAngle(new THREE.Vector3(0,1,0), rad); g.userData = { sideKey: k, monsterId: m.id, orig: g.position.clone() }; monsterGroup.add(g)
  }))
}, { deep: true })

function animate() {
  animationFrameId = requestAnimationFrame(animate); if (!renderer) return
  currentRotation += (targetRotation - currentRotation) * 0.08; camera.rotation.y = currentRotation
  monsterGroup.children.forEach(m => {
    const side = props.sides[m.userData.sideKey]; const mData = side?.monsters.find(x => x.id === m.userData.monsterId)
    if (mData) { m.position.lerpVectors(m.userData.orig, new THREE.Vector3(0, 2, 0), mData.progress); m.scale.y = 1 + Math.sin(Date.now()*0.005)*0.1 }
  })
  activeArrows = activeArrows.filter(a => {
    const t = Math.min((Date.now()-a.startTime)/a.duration, 1); a.mesh.position.lerpVectors(a.startPos, a.targetPos, t); a.mesh.lookAt(a.targetPos)
    if (a.deflect && t > 0.8) a.mesh.position.y += 0.2
    if (t >= 1) { scene.remove(a.mesh); return false } return true
  })
  renderer.render(scene, camera)
}

function onResize() { if (!container.value || !camera) return; camera.aspect = container.value.clientWidth / container.value.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.value.clientWidth, container.value.clientHeight) }
onUnmounted(() => { if (animationFrameId) cancelAnimationFrame(animationFrameId); renderer?.dispose() })
</script>
