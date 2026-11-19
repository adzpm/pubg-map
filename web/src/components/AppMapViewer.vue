<script setup>
import { computed, ref, toRefs } from 'vue'
import { useLeafletMap } from '@/composables/useLeafletMap'

const props = defineProps({
  currentMap: { type: Object, required: true },
  gridVisible: { type: Boolean, default: true },
  secretsVisible: { type: Boolean, default: true },
  vehiclesVisible: { type: Boolean, default: false },
  devMode: { type: Boolean, default: false },
  cursor: { type: Object, default: () => ({ col: -1, row: -1 }) },
})

const emit = defineEmits(['cursor', 'map-click'])

const mapEl = ref(null)

const { axes } = useLeafletMap(
  mapEl,
  toRefs(props),
  (cursor) => emit('cursor', cursor),
  (point) => emit('map-click', point),
)

// keep a label this far from the screen ends so it never sits under the corner
const EDGE_PAD = 28

// a column/row label sits at the middle of the part of its cell that is on screen
const pinned = (items, size) =>
  items.flatMap((item) => {
    const lo = Math.max(item.a, EDGE_PAD)
    const hi = Math.min(item.b, size - EDGE_PAD)
    return hi > lo ? [{ ...item, at: (lo + hi) / 2 }] : []
  })

// axes changes on every move, zoom and resize, so reading the element size here stays current
const edgeCols = computed(() => pinned(axes?.value.cols ?? [], mapEl.value?.clientWidth ?? 0))
const edgeRows = computed(() => pinned(axes?.value.rows ?? [], mapEl.value?.clientHeight ?? 0))
</script>

<template>
  <div class="map-viewer">
    <div ref="mapEl" class="map" :class="{ 'dev-mode-cursor': devMode }"></div>
    <template v-if="gridVisible">
      <div class="edge edge-x" aria-hidden="true">
        <span
          v-for="col in edgeCols"
          :key="col.index"
          :class="{ on: col.index === cursor.col }"
          :style="{ left: `${col.at}px` }"
          >{{ col.label }}</span
        >
      </div>
      <div class="edge edge-y" aria-hidden="true">
        <span
          v-for="row in edgeRows"
          :key="row.index"
          :class="{ on: row.index === cursor.row }"
          :style="{ top: `${row.at}px` }"
          >{{ row.label }}</span
        >
      </div>
    </template>
  </div>
</template>

<style scoped>
.map-viewer {
  position: absolute;
  inset: 0;
}

.map {
  position: absolute;
  inset: 0;
}

.dev-mode-cursor :deep(.leaflet-grab),
.dev-mode-cursor :deep(.leaflet-interactive) {
  cursor: crosshair;
}

.edge {
  position: absolute;
  z-index: 900;
  pointer-events: none;
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 15px;
  line-height: 1;
  color: var(--sand);
  text-shadow:
    0 0 2px #000,
    0 0 6px rgb(0 0 0 / 80%);
}

.edge-x {
  left: 0;
  right: 0;
  bottom: 10px;
  height: 16px;
}

.edge-y {
  top: 0;
  bottom: 0;
  right: 12px;
  width: 20px;
}

.edge span {
  position: absolute;
}

.edge-x span {
  transform: translateX(-50%);
}

.edge-y span {
  right: 0;
  transform: translateY(-50%);
}

.edge span.on {
  color: var(--signal);
  font-size: 19px;
}
</style>
