<script setup>
import { ref, computed } from 'vue'
import { MAPS } from '@/data/maps'
import { SECRET_ROOMS } from '@/data/secrets'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { useDevMode } from '@/composables/useDevMode'
import { useDevTools } from '@/composables/useDevTools'
import { useHotkeys } from '@/composables/useHotkeys'
import AppWindow from '@/components/AppWindow.vue'
import AppMapViewer from '@/components/AppMapViewer.vue'
import AppStatusBar from '@/components/AppStatusBar.vue'

const currentMapId = usePersistentRef('currentMapId', MAPS[0].id)
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
const statusBarVisible = usePersistentRef('statusBarVisible', true)
const cursor = ref({ visible: false, px: 0, py: 0, cell: '', col: -1, row: -1 })

const secretsCount = computed(() => (SECRET_ROOMS[currentMap.value.id] ?? []).length)

const windowRef = ref(null)

const { enabled: devMode } = useDevMode()

const { tools: devTools, dispatch: dispatchDevTool } = useDevTools()

const selectMap = (map) => {
  if (map.id === currentMap.value.id) return
  currentMap.value = map
}

useHotkeys({
  maps: MAPS,
  select: selectMap,
  toggleGrid: () => {
    gridVisible.value = !gridVisible.value
  },
  toggleSecrets: () => {
    if (secretsCount.value > 0) secretsVisible.value = !secretsVisible.value
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
      :dev-mode="devMode"
      :cursor="cursor"
      @cursor="cursor = $event"
      @map-click="onMapClick"
    />
    <AppWindow
      ref="windowRef"
      v-model:grid-visible="gridVisible"
      v-model:secrets-visible="secretsVisible"
      v-model:status-bar-visible="statusBarVisible"
      :maps="MAPS"
      :current-map="currentMap"
      :cursor="cursor"
      :secrets-count="secretsCount"
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
