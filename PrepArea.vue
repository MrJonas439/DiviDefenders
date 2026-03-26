<template>
  <div class="prep-area w-full bg-amber-950/95 border-t-4 border-amber-600 p-2 flex flex-col gap-1.5 select-none touch-none h-60 shadow-xl">
    <div class="flex justify-between px-2 shrink-0">
      <div class="text-amber-200 text-[9px] font-black uppercase tracking-widest">Tactical Workbench</div>
      <button @click="resetPrep" class="text-amber-400 text-[9px] font-bold"><ArrowPathIcon class="w-2.5 h-2.5 inline" /> RESET</button>
    </div>
    <div class="flex-1 flex gap-1.5 min-h-0">
      <div class="w-14 shrink-0 flex flex-col gap-1">
        <div class="flex-1 bg-amber-900/40 border-2 border-amber-600/50 rounded-lg flex items-center justify-center cursor-pointer border-dashed" @click="addMonster">
          <div class="w-8 h-8 bg-green-500/30 rounded border-2 border-green-500/50"></div>
        </div>
      </div>
      <div ref="fieldEl" class="flex-1 bg-black/60 border-2 border-amber-600/20 rounded-xl relative flex flex-wrap items-center justify-center gap-1.5 p-1.5 cursor-pointer" @click="onFieldClick">
        <div v-for="(m, i) in stagedMonsters" :key="m.id" class="relative w-12 h-20 bg-white/5 border border-amber-400/30 rounded flex flex-col items-center p-1" @click.stop="assignArrow(i)">
          <div class="flex flex-wrap justify-center gap-[1px]">
            <div v-for="a in m.arrows" :key="a" class="w-[2px] h-4 bg-amber-400"></div>
          </div>
          <div class="mt-auto text-[10px] text-white/60 font-black">{{ m.arrows }}</div>
          <button @click.stop="removeMonster(i)" class="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 text-[10px]">×</button>
        </div>
      </div>
      <div class="w-12 shrink-0"><Button label="FIRE" class="h-full bg-red-700 font-black text-[10px]" @click="fire" /></div>
    </div>
    <div class="bg-black/40 rounded px-2 h-10 flex flex-wrap gap-0.5 items-center justify-center border border-amber-600/20">
      <div v-for="a in arrowSupply.slice(0, 40)" :key="a.id" class="w-0.5 h-6 bg-amber-400 opacity-60"></div>
      <div class="text-[8px] text-amber-500 font-black">{{ arrowSupply.length }} ARROWS</div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/16/solid'
import { Button } from 'elements'
const props = defineProps({ task: Object }); const emit = defineEmits(['submit'])
const stagedMonsters = ref([]); const arrowSupply = ref([])
watch(() => props.task, (t) => { if (t) resetPrep() }, { immediate: true })
function addMonster() { if (stagedMonsters.value.length < 10) stagedMonsters.value.push({ id: Math.random(), arrows: 0 }) }
function onFieldClick() { addMonster() }
function assignArrow(i) { if (arrowSupply.value.length > 0) { arrowSupply.value.pop(); stagedMonsters.value[i].arrows++ } }
function removeMonster(i) { for (let x=0; x<stagedMonsters.value[i].arrows; x++) arrowSupply.value.push({ id: Math.random() }); stagedMonsters.value.splice(i, 1) }
function resetPrep() { stagedMonsters.value = []; arrowSupply.value = Array.from({ length: props.task?.total || 0 }, (_, i) => ({ id: i })) }
function fire() {
  const m = stagedMonsters.value; const consistent = m.length > 0 && m.every(x => x.arrows === m[0].arrows)
  emit('submit', { monsterCount: m.length, totalArrows: m.reduce((s, x) => s + x.arrows, 0), perMonster: m[0]?.arrows || 0, isConsistent: consistent })
}
</script>
