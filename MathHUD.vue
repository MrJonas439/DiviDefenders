<template>
  <div class="bg-black/70 backdrop-blur-lg border border-amber-600/40 rounded-lg p-2 shadow-2xl">
    <div class="flex items-center justify-center gap-1.5 mb-0.5">
      <ShieldCheckIcon class="w-3 h-3 text-amber-500" />
      <div class="text-[8px] font-black text-amber-400 uppercase tracking-[0.1em]">MISSION BRIEF</div>
    </div>
    <div class="text-white text-xs sm:text-sm font-bold leading-snug text-center italic">"{{ task.question }}"</div>
  </div>
</template>

<script setup>
import { ShieldCheckIcon } from '@heroicons/vue/24/solid' // Updated to match your App.vue setup!
defineProps({ task: Object })
</script>
