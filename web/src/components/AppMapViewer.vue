<script setup>
import { ref, toRefs } from 'vue'
import { useLeafletMap } from '@/composables/useLeafletMap'

const props = defineProps({
  currentMap: { type: Object, required: true },
  gridVisible: { type: Boolean, default: true },
  secretsVisible: { type: Boolean, default: true },
  devMode: { type: Boolean, default: false },
})

const emit = defineEmits(['cursor', 'map-click'])

const mapEl = ref(null)

useLeafletMap(
  mapEl,
  toRefs(props),
  (cursor) => emit('cursor', cursor),
  (point) => emit('map-click', point),
)
</script>

<template>
  <div ref="mapEl" class="flex-fill" :class="{ 'dev-mode-cursor': devMode }"></div>
</template>

<style scoped>
.dev-mode-cursor :deep(.leaflet-grab),
.dev-mode-cursor :deep(.leaflet-interactive) {
  cursor: crosshair;
}
</style>
