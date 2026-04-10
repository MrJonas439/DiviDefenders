<template>
  <div class="fixed inset-0 h-[100dvh] w-full bg-neutral-900 text-white overflow-hidden flex flex-col font-sans select-none touch-none">
    
    <Motion
      class="flex-1 relative overflow-hidden"
      :animate="damageFlash ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }"
      :transition="{ duration: 0.3 }"
    >
      <GameWorld
        ref="world"
        :viewAngle="viewAngle"
        :gameState="gameState"
        :sides="sides"
        :difficulty="difficulty"
        @monster-hit="handleMonsterHit"
      />

      <Motion
        v-if="damageFlash"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: [0, 0.6, 0] }"
        :transition="{ duration: 0.3 }"
        class="absolute inset-0 bg-red-600/40 pointer-events-none z-50"
      />

      <div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-50">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-xl">
            <HeartIcon class="w-5 h-5 text-red-500 fill-current" />
            <span class="text-lg font-black">{{ lives }}/{{ maxLives }}</span>
          </div>
          <div class="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-xl">
            <CurrencyDollarIcon class="w-5 h-5 text-yellow-400" />
            <span class="text-lg font-black">{{ gold }}</span>
          </div>
          
          <div class="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-xl">
            <ClockIcon class="w-5 h-5 text-cyan-400" />
            <span class="text-lg font-black font-mono" :class="timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-white'">{{ formatTime(timeLeft) }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end gap-1">
          <button @click="pauseGame" class="pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg border border-white/20 shadow-xl flex items-center justify-center">
            <PauseIcon class="w-6 h-6" />
          </button>

          <div class="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 text-right shadow-xl mt-1">
            <div class="text-[10px] uppercase opacity-70 tracking-widest font-bold">Defense Side</div>
            <div class="text-base font-black text-amber-400">{{ currentSideName }}</div>
          </div>
          
          <div class="bg-blue-900/60 backdrop-blur-md p-2 rounded-lg border border-blue-400/30 text-right shadow-xl min-w-[140px] relative pointer-events-auto">
            <div class="text-[8px] uppercase font-black text-blue-200 tracking-[0.2em]">Rank: Commander Lvl {{ commanderLevel }}</div>
            <div class="w-full bg-blue-950 h-1.5 rounded-full mt-1 overflow-hidden border border-blue-800">
              <div class="bg-blue-400 h-full transition-all duration-500" :style="{ width: (commanderXp / xpToNextLevel) * 100 + '%' }"></div>
            </div>

            <button @click="showStatsSheet = !showStatsSheet" class="mt-1.5 w-full text-[9px] font-bold tracking-wider text-center bg-blue-500/30 hover:bg-blue-500/60 py-1 rounded border border-blue-400/30 text-white transition-colors">
              {{ showStatsSheet ? '✕ CLOSE STATS' : '📋 VIEW PERKS' }}
            </button>

            <div v-if="showStatsSheet" class="absolute top-full right-0 mt-2 w-56 p-3 bg-black/90 backdrop-blur-md rounded-xl border-2 border-blue-500/50 shadow-2xl z-[80] text-left flex flex-col gap-2">
              <div class="text-xs font-black tracking-widest text-blue-300 uppercase border-b border-blue-500/30 pb-1">Army Statistics</div>
              
              <div class="flex justify-between items-center text-xs">
                <span class="text-white/70">Passive Gold:</span>
                <span class="text-yellow-400 font-bold">+{{ currentPassiveIncome }}/Tick</span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-white/70">Wall HP Buff:</span>
                <span class="text-red-400 font-bold">+{{ Math.floor(commanderLevel / 5) }} HP</span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-white/70">Archer Proficiency:</span>
                <span class="text-green-400 font-bold">Lvl {{ commanderLevel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute inset-0 z-20 touch-none" @pointerdown="onPointerDown" @pointerup="onPointerUp"></div>

      <div v-if="gameState === 'active' && activeSideWave.task && activeSideKey !== 'shop'" class="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-xs px-2 z-40 pointer-events-none">
        <MathHUD :task="activeSideWave.task" />
      </div>

      <div class="absolute inset-y-0 left-0 flex items-center p-2 z-[60] pointer-events-none">
        <button class="pointer-events-auto bg-black/60 text-white w-12 h-12 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md shadow-2xl hover:scale-110 active:scale-95 transition-transform" @click="changeView(-1)">
          <ChevronLeftIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="absolute inset-y-0 right-0 flex items-center p-2 z-[60] pointer-events-none">
        <button class="pointer-events-auto bg-black/60 text-white w-12 h-12 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md shadow-2xl hover:scale-110 active:scale-95 transition-transform" @click="changeView(1)">
          <ChevronRightIcon class="w-6 h-6" />
        </button>
      </div>

      <div v-if="activeSideKey === 'shop'" class="absolute inset-0 flex items-center justify-center p-4 z-40 pointer-events-none">
        <div class="bg-black/80 backdrop-blur-xl border-2 border-amber-600/50 rounded-2xl w-full max-w-2xl h-[70%] overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
          <div class="p-4 border-b border-amber-600/30 flex justify-between items-center bg-amber-900/20">
            <div>
              <h2 class="text-2xl font-black text-amber-500 uppercase tracking-widest">Castle Merchant</h2>
              <p class="text-[10px] text-amber-200/60 font-bold uppercase tracking-widest">Invest gold to survive the siege</p>
            </div>
            <div class="flex items-center gap-2 bg-amber-950/80 px-4 py-2 rounded-xl border border-amber-600/40">
              <CurrencyDollarIcon class="w-6 h-6 text-yellow-400" />
              <span class="text-2xl font-black text-white">{{ gold }}</span>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="item in shopItems" :key="item.id" class="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex flex-col justify-between transition-all">
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-amber-900/30 flex items-center justify-center border border-amber-600/20">
                  <component :is="getShopIcon(item.icon)" class="w-7 h-7 text-amber-500" />
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-base text-amber-100">{{ item.name }}</h3>
                  <p class="text-[10px] text-amber-100/60 leading-tight">{{ item.description }}</p>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-lg font-black text-yellow-400">{{ getPrice(item) }}G</span>
                <button :disabled="gold < getPrice(item)" class="text-xs py-1.5 px-4 font-black rounded-lg transition-all" :class="gold >= getPrice(item) ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-white/5 text-white/20'" @click="buyItem(item)">BUY</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Motion>

    <div v-if="gameState === 'active'" class="shrink-0 z-50 relative bg-neutral-900 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
      
      <PrepArea 
        v-if="activeSideKey !== 'shop' && activeSideWave.task" 
        :task="activeSideWave.task" 
        @submit="handleSubmission" 
      />
      
      <div 
        v-else-if="activeSideKey !== 'shop' && !activeSideWave.task" 
        class="h-32 w-full bg-neutral-950 border-t border-white/10 flex flex-col items-center justify-center gap-2"
      >
        <div class="w-6 h-6 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        <div class="text-amber-600/60 text-xs font-black tracking-[0.2em] uppercase animate-pulse">
          Scouting Enemy Formation...
        </div>
      </div>
    </div>

    <div v-if="gameState !== 'active'" class="absolute inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
      <div class="max-w-sm w-full space-y-6">
        <h1 class="text-4xl font-black tracking-tighter text-yellow-500">LEGEND OF DIVISION</h1>
        
        <div v-if="gameState === 'start'" class="space-y-4">
          <p class="text-lg text-amber-100 italic">"Choose your path, Commander. The castle's fate rests on your precision."</p>
          <div class="grid grid-cols-2 gap-3">
            <button class="bg-green-700 hover:bg-green-600 border-b border-green-900 text-sm py-3 rounded-lg font-bold" @click="startGame('easy')">EASY</button>
            <button class="bg-blue-700 hover:bg-blue-600 border-b border-blue-900 text-sm py-3 rounded-lg font-bold" @click="startGame('medium')">MEDIUM</button>
            <button class="bg-red-700 hover:bg-red-600 border-b border-red-900 text-sm py-3 rounded-lg font-bold" @click="startGame('hard')">HARD</button>
            <button class="bg-purple-700 hover:bg-purple-600 border-b border-purple-900 text-sm py-3 rounded-lg font-bold" @click="startGame('remix')">REMIX</button>
          </div>
          <button @click="viewLeaderboard" class="w-full text-md py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-bold border border-neutral-600 text-white">🏆 View Leaderboards</button>
        </div>

        <div v-if="gameState === 'paused'" class="space-y-4">
          <h2 class="text-3xl font-bold text-amber-500 uppercase">Game Paused</h2>
          <button class="w-full text-lg py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold" @click="resumeGame">Resume Battle</button>
          <button class="w-full text-lg py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-bold border border-neutral-600" @click="quitToMenu">Quit to Menu</button>
        </div>

        <div v-if="gameState === 'leaderboard'" class="space-y-4">
          <h2 class="text-3xl font-bold text-yellow-500 uppercase">Leaderboards</h2>
          <div class="bg-black/50 border border-white/20 rounded-lg p-4 h-64 overflow-y-auto text-left flex flex-col gap-2">
            <div v-if="isLoadingLeaderboard" class="text-xs text-white/50 text-center italic mt-10">Connecting to Cloud Spreadsheet...</div>
            <div v-else-if="leaderboardData.length === 0" class="text-xs text-white/50 text-center italic mt-10">No commanders on the board yet. Play a game to be the first!</div>
            
            <div v-else v-for="(player, index) in leaderboardData" :key="index" class="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
              <span class="text-sm font-bold text-white"><span class="text-yellow-400 mr-1">#{{ index + 1 }}</span> {{ player.username }}</span>
              <span class="text-sm font-black text-amber-400">{{ player.score }} G</span>
            </div>
          </div>
          <button class="w-full text-lg py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-bold" @click="quitToMenu">Back to Menu</button>
        </div>

        <div v-if="gameState === 'victory'" class="space-y-4">
          <h2 class="text-3xl font-bold text-green-500 uppercase tracking-widest">Siege Survived!</h2>
          <div class="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
            <div class="flex justify-between text-sm"><span class="text-white/60">Waves Defeated:</span> <span class="text-white font-bold">{{ wavesCleared }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-white/60">Gold Saved:</span> <span class="text-white font-bold">{{ gold }}</span></div>
            <div class="flex justify-between text-lg font-black border-t border-white/10 mt-2 pt-2"><span class="text-yellow-400">Final Score:</span> <span class="text-yellow-400">{{ calculatedScore }}</span></div>
          </div>

          <div class="flex flex-col gap-2 bg-black/50 p-3 rounded-lg border border-white/20">
            <label class="text-xs text-white/50 font-bold uppercase tracking-wider text-left">Enter Your Name:</label>
            <input type="text" v-model="playerName" placeholder="Commander Name" class="p-2 bg-neutral-800 border border-white/30 rounded text-white font-bold" maxlength="15" />
          </div>

          <button @click="submitScoreToSupabase" class="w-full text-lg py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold" :disabled="!playerName">Save & Submit Score</button>
        </div>

        <div v-if="gameState === 'gameOver'" class="space-y-4">
          <h2 class="text-3xl font-bold text-red-500 uppercase tracking-widest">The Wall Has Fallen</h2>
          <div class="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
            <div class="flex justify-between text-lg font-black"><span class="text-red-400">Final Score:</span> <span class="text-red-400">{{ calculatedScore }}</span></div>
          </div>

          <div class="flex flex-col gap-2 bg-black/50 p-3 rounded-lg border border-white/20">
            <label class="text-xs text-white/50 font-bold uppercase tracking-wider text-left">Enter Your Name:</label>
            <input type="text" v-model="playerName" placeholder="Commander Name" class="p-2 bg-neutral-800 border border-white/30 rounded text-white font-bold" maxlength="15" />
          </div>

          <button @click="submitScoreToSupabase" class="w-full text-lg py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold" :disabled="!playerName">Save & Submit Score</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, reactive } from 'vue'
import {
  HeartIcon, ChevronLeftIcon, ChevronRightIcon,
  CurrencyDollarIcon, WrenchIcon, ShieldCheckIcon, BanknotesIcon,
  BoltIcon, FireIcon, DocumentTextIcon, SparklesIcon, PauseIcon, ClockIcon
} from '@heroicons/vue/24/solid'
import { Motion } from 'motion-v'
import GameWorld from './GameWorld.vue'
import PrepArea from './PrepArea.vue'
import MathHUD from './MathHUD.vue'
import { supabase } from './supabase.js'

const toast = {
  info: (msg) => console.log('INFO:', msg),
  error: (msg) => console.log('ERROR:', msg)
}

const gameState = ref('start')
const difficulty = ref('easy')
const viewAngle = ref(0)
const damageFlash = ref(false)
const isFiring = ref(false)
const world = ref(null)
let startX = 0

const lives = ref(3)
const maxLives = ref(3)
const gold = ref(100)
const commanderLevel = ref(1)
const commanderXp = ref(0)
const xpToNextLevel = computed(() => commanderLevel.value * 500)
const battleCombo = ref(0)
const wavesCleared = ref(0) 

const timeLeft = ref(300)
let survivalTimer = null
const showStatsSheet = ref(false)

const playerName = ref('')
const leaderboardData = ref([])
const isLoadingLeaderboard = ref(false)

const calculatedScore = computed(() => {
  return (wavesCleared.value * 1000) + gold.value
})

const currentPassiveIncome = computed(() => {
  const base = 1 + (activeUpgrades.alchemist || 0) + commanderLevel.value
  return base + Math.floor(commanderLevel.value / 3)
})

const shopItems = reactive([
  { id: 'masonry', name: 'Masonry Tools', price: 150, description: 'Repair the wall: +1 Life', icon: 'WrenchIcon' },
  { id: 'fortify', name: 'Steel Grates', price: 400, description: 'Stronger wall: +1 Max Life', icon: 'ShieldCheckIcon' },
  { id: 'quiver', name: 'Golden Quiver', price: 300, description: '+20% Gold per wave', icon: 'BanknotesIcon' },
  { id: 'ice', name: 'Frost Tincture', price: 450, description: 'Ice arrows: 20% monster slow', icon: 'BoltIcon' },
  { id: 'phoenix', name: 'Phoenix Feather', price: 200, description: 'Clear active side\'s wave', icon: 'FireIcon' },
  { id: 'contract', name: 'Guild Contract', price: 350, description: '20% shop discount', icon: 'DocumentTextIcon' },
  { id: 'alchemist', name: 'Alchemist\'s Coin', price: 100, description: '+1 Gold periodically', icon: 'CurrencyDollarIcon' },
  { id: 'dragon', name: 'Dragon\'s Breath', price: 600, description: 'Clear all active waves', icon: 'SparklesIcon' }
])

const activeUpgrades = reactive({ quiver: 0, ice: 0, contract: 0, alchemist: 0 })
const sides = reactive({
  left: { angle: 90, task: null, monsters: [], status: 'locked', monsterType: 'slime' },
  center: { angle: 0, task: null, monsters: [], status: 'locked', monsterType: 'slime' },
  right: { angle: 270, task: null, monsters: [], status: 'locked', monsterType: 'slime' },
  shop: { angle: 180, status: 'active' }
})

const activeSideKey = computed(() => {
  const normalized = ((viewAngle.value % 360) + 360) % 360
  if (normalized === 90) return 'left'
  if (normalized === 270) return 'right'
  if (normalized === 180) return 'shop'
  return 'center'
})
const activeSideWave = computed(() => sides[activeSideKey.value] || { task: null })

function onPointerDown(e) { if (!isFiring.value) startX = e.clientX }
function onPointerUp(e) { if (!isFiring.value && Math.abs(e.clientX - startX) > 50) changeView(e.clientX > startX ? -1 : 1) }
function changeView(dir) { if (!isFiring.value) viewAngle.value -= (dir * 90) }
const currentSideName = computed(() => ({ left: 'Left Tower', right: 'Right Tower', center: 'Center Gate', shop: 'The Shop' }[activeSideKey.value]))
function getShopIcon(name) { return { WrenchIcon, ShieldCheckIcon, BanknotesIcon, BoltIcon, FireIcon, DocumentTextIcon, CurrencyDollarIcon, SparklesIcon }[name] || WrenchIcon }

function getPrice(item) {
  const discountFactor = Math.max(0.2, 1 - (activeUpgrades.contract * 0.2))
  return Math.floor(item.price * discountFactor)
}

function buyItem(item) {
  const finalPrice = getPrice(item)
  if (gold.value < finalPrice) return
  gold.value -= finalPrice
  if (item.id === 'masonry') lives.value = Math.min(maxLives.value, lives.value + 1)
  else if (item.id === 'fortify') { maxLives.value++; lives.value++ }
  else if (item.id === 'phoenix' && ['left', 'center', 'right'].includes(activeSideKey.value)) { sides[activeSideKey.value].monsters = []; safeGenerateNextTask(activeSideKey.value) }
  else if (item.id === 'dragon') ['left', 'center', 'right'].forEach(k => { sides[k].monsters = []; safeGenerateNextTask(k) })
  else activeUpgrades[item.id]++
  toast.info(`Purchased ${item.name}!`)
}

let gameTickInterval = null
let lastGoldTick = Date.now()
const isGeneratingTask = reactive({ left: false, center: false, right: false })

function startGame(diff) {
  difficulty.value = typeof diff === 'string' ? diff : 'easy'
  lives.value = 3; maxLives.value = 3; gold.value = 100; wavesCleared.value = 0; viewAngle.value = 0; gameState.value = 'active'; commanderLevel.value = 1; commanderXp.value = 0; battleCombo.value = 0;
  timeLeft.value = 300 
  playerName.value = ''

  lastGoldTick = Date.now()
  isGeneratingTask.left = false
  isGeneratingTask.center = false
  isGeneratingTask.right = false

  resetSide('center')
  setTimeout(() => { if (gameState.value === 'active') resetSide('left') }, 15000)
  setTimeout(() => { if (gameState.value === 'active') resetSide('right') }, 30000)

  if (gameTickInterval) clearInterval(gameTickInterval)
  if (survivalTimer) clearInterval(survivalTimer)

  gameTickInterval = setInterval(updateMonsters, 100)
  survivalTimer = setInterval(updateTimer, 1000)
}

function pauseGame() {
  if (gameState.value === 'active') {
    gameState.value = 'paused'
    clearInterval(gameTickInterval)
    clearInterval(survivalTimer)
  }
}

function resumeGame() {
  if (gameState.value === 'paused') {
    gameState.value = 'active'
    gameTickInterval = setInterval(updateMonsters, 100)
    survivalTimer = setInterval(updateTimer, 1000)
  }
}

function quitToMenu() {
  gameState.value = 'start'
  clearInterval(gameTickInterval)
  clearInterval(survivalTimer)
}

async function viewLeaderboard() {
  gameState.value = 'leaderboard'
  leaderboardData.value = []
  isLoadingLeaderboard.value = true 

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10)

    if (error) {
      toast.error('Could not pull leaderboard')
      console.error(error)
    } else {
      leaderboardData.value = data || []
    }
  } catch (err) {
    console.error('Leaderboard Fetch Error:', err)
  } finally {
    isLoadingLeaderboard.value = false 
  }
}

async function submitScoreToSupabase() {
  if (!playerName.value) return

  try {
    const { error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          username: playerName.value, 
          score: calculatedScore.value, 
          difficulty: difficulty.value 
        }
      ])

    if (error) {
      toast.error('Could not submit score!')
      console.error(error)
    } else {
      toast.info('Score Saved to Cloud!')
    }
  } catch (err) {
    console.error('Submit Error:', err)
  }

  quitToMenu()
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function updateTimer() {
  if (timeLeft.value > 0) {
    timeLeft.value--
  } else {
    gameState.value = 'victory'
    clearInterval(gameTickInterval)
    clearInterval(survivalTimer)
  }
}

function resetSide(k) { sides[k].status = 'active'; sides[k].monsters = []; generateTaskForSide(k) }
function generateTaskForSide(k) {
  const side = sides[k]; const sets = { easy: [2, 5, 10], medium: [3, 4], hard: [6, 7, 8, 9] }
  let diff = difficulty.value === 'remix' ? (Math.random() < 0.4 ? 'easy' : Math.random() < 0.75 ? 'medium' : 'hard') : difficulty.value
  side.monsterType = { easy: 'slime', medium: 'skeleton', hard: 'golem' }[diff]
  const divisors = sets[diff]; const isSharing = Math.random() > 0.5
  let mCount, pMonster; if (isSharing) { mCount = divisors[Math.floor(Math.random() * divisors.length)]; pMonster = Math.floor(Math.random() * 5) + 2 }
  else { pMonster = divisors[Math.floor(Math.random() * divisors.length)]; mCount = Math.floor(Math.random() * 5) + 2 }
  const total = mCount * pMonster
  side.task = isSharing ? { type: 'sharing', total, count: mCount, question: `I need ${total} arrows for ${mCount} monsters. How many per monster?`, answer: pMonster }
                       : { type: 'grouping', total, perMonster: pMonster, question: `I have ${total} arrows. Each monster needs ${pMonster}. How many monsters?`, answer: mCount }
  side.monsters = Array.from({ length: mCount }, (_, i) => ({ id: Math.random().toString(36).substr(2, 9), progress: 0, idx: i, count: mCount }))
}

function updateMonsters() {
  if (gameState.value !== 'active') return
  const now = Date.now(); 
  const tick = activeUpgrades.alchemist ? 3000 : 5000
  if (now - lastGoldTick > tick) { gold.value += currentPassiveIncome.value; lastGoldTick = now }
  
  const slowFactor = Math.max(0.4, 1 - (activeUpgrades.ice * 0.2))
  const dt = (1 / 1200) * slowFactor 
  
  Object.keys(sides).forEach(k => {
    if (k === 'shop' || sides[k].status !== 'active' || isGeneratingTask[k]) return
    
    let failed = false; 
    sides[k].monsters.forEach(m => { 
      m.progress += dt; 
      if (m.progress >= 1.0) failed = true 
    })
    
    if (failed) handleMonsterHit(k)
  })
}

function safeGenerateNextTask(k) {
  if (isGeneratingTask[k] || gameState.value !== 'active') return
  isGeneratingTask[k] = true
  
  sides[k].monsters = []
  sides[k].task = null 

  setTimeout(() => {
    if (gameState.value !== 'active') {
      isGeneratingTask[k] = false
      return
    }
    generateTaskForSide(k)
    isGeneratingTask[k] = false
  }, 3000)
}

async function handleSubmission(prep) {
  if (isFiring.value) return
  const sideKey = activeSideKey.value
  const side = sides[sideKey]; 
  const t = side.task; 
  if (!t || isGeneratingTask[sideKey]) return

  const calculatedTotal = prep.monsterCount * prep.perMonster

  const correct = t.type === 'sharing' 
    ? (prep.monsterCount === t.count && prep.perMonster === t.answer) 
    : (calculatedTotal === t.total && prep.monsterCount === t.answer)

  if (correct) {
    isFiring.value = true; 
    wavesCleared.value++; 
    battleCombo.value++; 
    commanderXp.value += 25 * battleCombo.value
    
    if (commanderXp.value >= xpToNextLevel.value) { 
      commanderXp.value -= xpToNextLevel.value; 
      commanderLevel.value++; 
      gold.value += 200; 
      toast.info(`Level ${commanderLevel.value}!`);
    }
    
    const quiverBonus = 1 + (activeUpgrades.quiver * 0.2)
    gold.value += Math.floor(50 * quiverBonus * (1 + battleCombo.value * 0.1))
    
    try { 
      const activeWorld = world.value || document.querySelector('canvas')?.__vueParentComponent?.exposed

      if (activeWorld && typeof activeWorld.fireVolley === 'function') {
        await activeWorld.fireVolley(sideKey, prep.monsterCount, prep.perMonster) 
      } else {
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (e) {
      console.error("Three.js Volley Error:", e)
    } finally { 
      isFiring.value = false; 
      safeGenerateNextTask(sideKey)
    }
  } else { 
    battleCombo.value = 0; 
    if (world.value) world.value.fireDeflect(sideKey); 
    toast.error('Deflected!') 
  }
}

function handleMonsterHit(k) {
  if (gameState.value !== 'active' || isGeneratingTask[k]) return
  
  lives.value = Math.max(0, lives.value - 1); 
  damageFlash.value = true; 
  setTimeout(() => damageFlash.value = false, 300)
  
  safeGenerateNextTask(k)
  
  if (lives.value <= 0) { 
    gameState.value = 'gameOver'
    clearInterval(gameTickInterval) 
    clearInterval(survivalTimer)
  }
}

onUnmounted(() => {
  clearInterval(gameTickInterval)
  clearInterval(survivalTimer)
})
</script>
