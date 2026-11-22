<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { MAPS } from '@/data/maps'
import { SECRET_ROOMS } from '@/data/secrets'
import { unplacedVehicles, vehicleSpotCount } from '@/lib/vehicles'
import { mapIdFromPath, pathForMap } from '@/lib/route'
import { pageMeta } from '@/lib/seo'
import { applyPageMeta } from '@/lib/head'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { useDevMode } from '@/composables/useDevMode'
import { useDevTools } from '@/composables/useDevTools'
import { useHotkeys } from '@/composables/useHotkeys'
import AppWindow from '@/components/AppWindow.vue'
import AppMapViewer from '@/components/AppMapViewer.vue'
import AppStatusBar from '@/components/AppStatusBar.vue'

const currentMapId = usePersistentRef('currentMapId', MAPS[0].id)
// a map address (/taego) wins over the remembered map; the home page keeps showing the last one used
const mapInPath = () => mapIdFromPath(window.location.pathname, MAPS)
const onHome = ref(mapInPath() === null)
if (!onHome.value) currentMapId.value = mapInPath()
// normalize an unknown persisted id so storage never keeps a stale one across sessions
if (!MAPS.some((m) => m.id === currentMapId.value)) currentMapId.value = MAPS[0].id
const currentMap = computed({
  get: () => MAPS.find((m) => m.id === currentMapId.value) ?? MAPS[0],
  set: (map) => {
    currentMapId.value = map.id
  },
})

const gridVisible = usePersistentRef('gridVisible', true)
const secretsVisible = usePersistentRef('secretsVisible', true)
const vehiclesVisible = usePersistentRef('vehiclesVisible', false)
const statusBarVisible = usePersistentRef('statusBarVisible', true)
const cursor = ref({ visible: false, px: 0, py: 0, cell: '', col: -1, row: -1 })

const secretsCount = computed(() => (SECRET_ROOMS[currentMap.value.id] ?? []).length)
const vehiclesCount = computed(() => vehicleSpotCount(currentMap.value.id))
const vehiclesUnplaced = computed(() => unplacedVehicles(currentMap.value.id))

const windowRef = ref(null)

const { enabled: devMode } = useDevMode()

const { tools: devTools, dispatch: dispatchDevTool } = useDevTools()

const selectMap = (map) => {
  if (map.id === currentMap.value.id && !onHome.value) return
  currentMap.value = map
  onHome.value = false
  if (mapInPath() !== map.id) {
    window.history.pushState(null, '', pathForMap(map.id) + window.location.search + window.location.hash)
  }
}

// Back and Forward walk through the maps that were opened
const onPopState = () => {
  const id = mapInPath()
  onHome.value = id === null
  if (id) currentMapId.value = id
}
window.addEventListener('popstate', onPopState)
onBeforeUnmount(() => window.removeEventListener('popstate', onPopState))

// the title, description and canonical address follow the map; on the home page they describe the site
const page = computed(() => pageMeta(onHome.value ? null : currentMap.value))
watch(page, applyPageMeta, { immediate: true })

useHotkeys({
  maps: MAPS,
  select: selectMap,
  toggleGrid: () => {
    gridVisible.value = !gridVisible.value
  },
  toggleSecrets: () => {
    if (secretsCount.value > 0) secretsVisible.value = !secretsVisible.value
  },
  toggleVehicles: () => {
    if (vehiclesCount.value > 0) vehiclesVisible.value = !vehiclesVisible.value
  },
  toggleWindow: () => windowRef.value?.toggle(),
})

const onMapClick = (point) => {
  if (!devMode.value) return
  dispatchDevTool('onMapClick', { ...point, mapId: currentMap.value.id })
}
</script>

<template>
  <main class="app">
    <AppMapViewer
      :current-map="currentMap"
      :grid-visible="gridVisible"
      :secrets-visible="secretsVisible"
      :vehicles-visible="vehiclesVisible"
      :dev-mode="devMode"
      :cursor="cursor"
      @cursor="cursor = $event"
      @map-click="onMapClick"
    />
    <AppWindow
      ref="windowRef"
      v-model:grid-visible="gridVisible"
      v-model:secrets-visible="secretsVisible"
      v-model:vehicles-visible="vehiclesVisible"
      v-model:status-bar-visible="statusBarVisible"
      :maps="MAPS"
      :current-map="currentMap"
      :page="page"
      :cursor="cursor"
      :secrets-count="secretsCount"
      :vehicles-count="vehiclesCount"
      :vehicles-unplaced="vehiclesUnplaced"
      :dev-mode="devMode"
      :dev-tools="devTools"
      @select="selectMap"
    />
    <AppStatusBar v-if="devMode && statusBarVisible" class="status" :cursor="cursor" />
  </main>
</template>

<style scoped>
.app {
  position: relative;
  height: 100vh;
  height: 100dvh;
  /* clip, not hidden: a hidden box can still be scrolled by focus or scrollIntoView, which shifted
     the whole map when a focused control in the window briefly hung past the screen edge */
  overflow: hidden;
  overflow: clip;
}

/* above the bottom row of grid letters */
.status {
  position: absolute;
  left: 12px;
  bottom: 36px;
  z-index: 1000;
}
</style>
