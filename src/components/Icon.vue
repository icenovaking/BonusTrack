<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  cards: 'M4 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm2-4h14a2 2 0 0 1 2 2v8M2 12h18M6 16h3',
  plus: 'M12 5v14M5 12h14', arrow: 'm9 5 7 7-7 7', back: 'm15 5-7 7 7 7',
  settings: 'M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v12H6a3 3 0 0 1-3-3V6m17 7h-5v4h5',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  archive: 'M3 3h18v5H3zM5 8v13h14V8M10 12h4',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
  offline: 'm3 3 18 18M8 8a8 8 0 0 1 10 3M3 8a14 14 0 0 1 3-2m6-2a14 14 0 0 1 10 4M6 13a8 8 0 0 1 4-2m-1 6a4 4 0 0 1 5-1M12 21h.01',
}
</script>
<template><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.cards" /></svg></template>
