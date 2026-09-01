<script setup>
import { ref, computed } from 'vue'
import { MAPS } from '@/data/maps'
import { SECRET_ROOMS } from '@/data/secrets'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { useDevMode } from '@/composables/useDevMode'
import { useDevTools } from '@/composables/useDevTools'
import AppSidebar from '@/components/AppSidebar.vue'
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
const cursor = ref({ visible: false, px: 0, py: 0, cell: '' })

const hasSecrets = computed(() => (SECRET_ROOMS[currentMap.value.id] ?? []).length > 0)

const { enabled: devMode } = useDevMode()

const { tools: devTools, dispatch: dispatchDevTool } = useDevTools()

const selectMap = (map) => {
  if (map.id === currentMap.value.id) return
  currentMap.value = map
}

const onMapClick = (point) => {
  if (!devMode.value) return
  dispatchDevTool('onMapClick', { ...point, mapId: currentMap.value.id })
}
</script>

<template>
  <div class="position-relative vh-100 overflow-hidden">
    <main class="d-flex flex-column h-100">
      <AppMapViewer
        :current-map="currentMap"
        :grid-visible="gridVisible"
        :secrets-visible="secretsVisible"
        :dev-mode="devMode"
        @cursor="cursor = $event"
        @map-click="onMapClick"
      />
    </main>
    <AppSidebar
      v-model:grid-visible="gridVisible"
      v-model:secrets-visible="secretsVisible"
      v-model:status-bar-visible="statusBarVisible"
      class="floating-panel floating-sidebar position-absolute top-0 start-0 m-3"
      :maps="MAPS"
      :current-map="currentMap"
      :secrets-available="hasSecrets"
      :dev-mode="devMode"
      :dev-tools="devTools"
      @select="selectMap"
    />
    <AppStatusBar
      v-if="devMode && statusBarVisible"
      class="floating-panel position-absolute bottom-0 end-0 m-3"
      :cursor="cursor"
    />
  </div>
</template>
