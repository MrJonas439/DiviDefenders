<template>
  <div class="p-4 bg-black/80 border-t border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-4 select-none touch-none h-[280px]">
    
    <div class="flex justify-center items-center gap-4 w-full max-w-2xl h-[140px] bg-white/5 rounded-xl border border-white/10 p-2 relative overflow-x-auto">
      
      <div v-if="monsters.length === 0" class="absolute inset-0 flex items-center justify-center text-white/40 text-sm font-bold tracking-wider cursor-pointer hover:bg-white/10 transition-colors" @click="addMonster">
        + CLICK HERE TO SPAWN MONSTERS +
      </div>

      <div 
        v-for="(monster, mIdx) in monsters" 
        :key="mIdx" 
        class="relative flex flex-col items-center justify-start p-2 w-24 h-[120px] rounded-lg border bg-black/40 cursor-pointer transition-all hover:border-amber-500/50"
        :class="activeMonsterIdx === mIdx ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-white/10'"
        @click="activeMonsterIdx = mIdx"
      >
        <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black text-sm text-white mb-2 shadow-md relative">
          <span class="absolute -top-1 -right-1 bg-black text-xs px-1 rounded">M{{ mIdx + 1 }}</span>
          👾
        </div>

        <div class="flex flex-wrap gap-1 justify-center w-full max-h-[50px] overflow-y-auto">
          <div 
            v-for="aIdx in monster.arrows" 
            :key="aIdx" 
            class="w-1.5 h-6 bg-yellow-400 rounded-sm shadow-sm relative cursor-pointer hover:bg-red-400"
            @click.stop="returnArrow(mIdx)"
          ></div>
        </div>
      </div>

      <button v-if="monsters.length > 0 && monsters.length < 10" @click="addMonster" class="w-12 h-12 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white text-xl font-bold">
        +
      </button>
    </div>

    <div class="w-full max-w-2xl flex flex-col items-center gap-2">
      <div class="text-[10px] font-black text-white/50 tracking-widest uppercase">Arrow Supply (Click arrow to assign to active monster)</div>
      
      <div class="flex flex-wrap justify-center items-center gap-1.5 p-3 bg-black/60 rounded-lg border border-white/20 min-h-[48px] w-full">
        <div 
          v-for="idx in unassignedArrows" 
          :key="idx" 
          class="w-2 h-8 bg-yellow-500 rounded-sm cursor-pointer hover:bg-yellow-300 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center relative"
          @click="assignArrow"
        >
          <div class="absolute top-0 w-3 h-1 bg-neutral-400 rounded-sm"></div>
        </div>
        <div v-if="unassignedArrows === 0" class="text-xs text-green-400 font-bold">All arrows deployed!</div>
      </div>
    </div>

    <div class="flex items-center justify-between w-full max-w-2xl mt-1">
      <button @click="resetPrep" class="px-3 py-1.5 text-xs text-white/50 hover:text-white font-bold bg-white/5 rounded border border-white/10 hover:bg-white/10">Reset</button>

      <button 
        @click="fireVolley" 
        class="h-11 px-8 font-black rounded-lg tracking-widest text-sm shadow-xl transition-all flex items-center justify-center gap-2"
        :class="canFire ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:scale-105 hover:shadow-orange-500/30' : 'bg-neutral-800 text-white/30 cursor-not-allowed'"
        :disabled="!canFire"
      >
        LAUNCH VOLLEY
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  task: Object // Should contain { total: 12, question: "Divide 12 by 4" }
})
const emit = defineEmits(['submit'])

const monsters = ref([]) // Format: [{ id: 1, arrows: 3 }]
const unassignedArrows = ref(0)
const activeMonsterIdx = ref(0)

// Reset supply whenever the problem changes
watch(() => props.task, (newTask) => {
  if (newTask) {
    resetPrep()
  }
}, { immediate: true })

function resetPrep() {
  monsters.value = []
  unassignedArrows.value = props.task ? props.task.total : 0
  activeMonsterIdx.value = 0
}

function addMonster() {
  if (monsters.value.length >= 10) return
  monsters.value.push({ id: Date.now(), arrows: 0 })
  if (monsters.value.length === 1) activeMonsterIdx.value = 0
}

function assignArrow() {
  if (monsters.value.length === 0) return alert("Add a monster first!")
  if (unassignedArrows.value <= 0) return

  monsters.value[activeMonsterIdx.value].arrows++
  unassignedArrows.value--
}

function returnArrow(monsterIdx) {
  if (monsters.value[monsterIdx].arrows > 0) {
    monsters.value[monsterIdx].arrows--
    unassignedArrows.value++
  }
}

// Validation: Are all arrows used AND evenly distributed?
const canFire = computed(() => {
  if (unassignedArrows.value !== 0) return false
  if (monsters.value.length === 0) return false

  const firstCount = monsters.value[0].arrows
  return monsters.value.every(m => m.arrows === firstCount && m.arrows > 0)
})

function fireVolley() {
  emit('submit', {
    monsterCount: monsters.value.length,
    perMonster: monsters.value[0].arrows,
    totalArrows: props.task.total,
    isConsistent: true
  })
}
</script>
