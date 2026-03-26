<template>
  <div class="p-4 bg-black/80 border-t border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-4 select-none touch-none">
    
    <div class="flex flex-wrap justify-center gap-3 min-h-[120px] max-w-lg w-full p-3 bg-white/5 rounded-xl border border-white/10">
      <div 
        v-for="idx in monsterCount" 
        :key="idx" 
        class="flex flex-col items-center p-2 rounded-lg transition-all"
        :class="idx === activeMonsterIdx ? 'bg-amber-600/30 border border-amber-500' : 'bg-black/40 border border-white/10'"
        @click="activeMonsterIdx = idx"
      >
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-black text-sm text-white mb-2">
          M{{ idx }}
        </div>

        <div class="flex flex-wrap gap-1 max-w-[60px] justify-center min-h-[20px]">
          <div 
            v-for="aIdx in perMonster" 
            :key="aIdx" 
            class="w-1.5 h-3 bg-yellow-400 rounded-sm"
          ></div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-6 max-w-xl w-full">
      
      <div class="flex flex-col items-center gap-1.5">
        <div class="text-[10px] font-black tracking-wider text-white/60 uppercase">Monsters</div>
        <div class="flex items-center bg-black/50 rounded-lg border border-white/20 h-11 overflow-hidden">
          <button @click="adjustMonster(-1)" class="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors font-bold text-xl">-</button>
          <span class="w-10 text-center font-black text-lg text-white border-x border-white/10 h-full flex items-center justify-center bg-white/5">{{ monsterCount }}</span>
          <button @click="adjustMonster(1)" class="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors font-bold text-xl">+</button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-1.5">
        <div class="text-[10px] font-black tracking-wider text-white/60 uppercase">Arrows/Each</div>
        <div class="flex items-center bg-black/50 rounded-lg border border-white/20 h-11 overflow-hidden">
          <button @click="adjustArrow(-1)" class="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors font-bold text-xl">-</button>
          <span class="w-10 text-center font-black text-lg text-white border-x border-white/10 h-full flex items-center justify-center bg-white/5">{{ perMonster }}</span>
          <button @click="adjustArrow(1)" class="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors font-bold text-xl">+</button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-1.5 pt-4 sm:pt-0">
        <button 
          @click="fireVolley" 
          class="h-12 px-8 font-black rounded-lg tracking-widest text-sm shadow-xl transition-all flex items-center justify-center gap-2"
          :class="isConsistent ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:scale-105 hover:shadow-orange-500/30' : 'bg-neutral-800 text-white/30 cursor-not-allowed'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" />
          </svg>
          LAUNCH VOLLEY
        </button>
      </div>
    </div>

    <div class="text-[11px] font-bold text-white/50 tracking-wide mt-1">
      Total Projected Arrows: <span :class="isConsistent ? 'text-green-400 font-black' : 'text-white/70'">{{ totalArrows }}</span> 
      <span class="text-white/30 mx-1">/</span> 
      Target: <span class="text-white font-black">{{ task ? task.total : '?' }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  task: Object
})
const emit = defineEmits(['submit'])

const monsterCount = ref(1)
const perMonster = ref(1)
const activeMonsterIdx = ref(1)

const totalArrows = computed(() => monsterCount.value * perMonster.value)
const isConsistent = computed(() => props.task && totalArrows.value === props.task.total)

function adjustMonster(dir) {
  monsterCount.value = Math.max(1, Math.min(20, monsterCount.value + dir))
}

function adjustArrow(dir) {
  perMonster.value = Math.max(1, Math.min(20, perMonster.value + dir))
}

function fireVolley() {
  emit('submit', {
    monsterCount: monsterCount.value,
    perMonster: perMonster.value,
    totalArrows: totalArrows.value,
    isConsistent: isConsistent.value
  })
}
</script>
