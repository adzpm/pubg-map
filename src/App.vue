<script setup>
import {ref, computed, watch} from 'vue'
import {MAPS} from '@/data/maps'
import {SECRET_ROOMS} from '@/data/secrets'
import {usePersistentRef} from '@/composables/usePersistentRef'
import AppSidebar from '@/components/AppSidebar.vue'
import AppMapViewer from '@/components/AppMapViewer.vue'
import AppStatusBar from '@/components/AppStatusBar.vue'

const currentMapId = usePersistentRef('currentMapId', MAPS[0].id)
const initialMap = MAPS.find((m) => m.id === currentMapId.value) ?? MAPS[0]
const currentMap = ref(initialMap)
currentMapId.value = currentMap.value.id

const gridVisible = usePersistentRef('gridVisible', true)
const secretsVisible = usePersistentRef('secretsVisible', true)
const cursor = ref({visible: false, px: 0, py: 0, cell: ''})

const hasSecrets = computed(() => (SECRET_ROOMS[currentMap.value.id] ?? []).length > 0)

watch(currentMap, (map) => {
  currentMapId.value = map.id
})

const selectMap = (map) => {
  if (map.id === currentMap.value.id) return
  currentMap.value = map
}
</script>

<template>
  <div class="position-relative vh-100 overflow-hidden">
    <main class="d-flex flex-column h-100">
      <AppMapViewer
          :current-map="currentMap"
          :grid-visible="gridVisible"
          :secrets-visible="secretsVisible"
          @cursor="cursor = $event"
      />
    </main>
    <AppSidebar
        class="floating-panel floating-sidebar position-absolute top-0 start-0 m-3"
        :maps="MAPS"
        :current-map="currentMap"
        :secrets-available="hasSecrets"
        v-model:grid-visible="gridVisible"
        v-model:secrets-visible="secretsVisible"
        @select="selectMap"
    />
    <AppStatusBar
        class="floating-panel position-absolute bottom-0 end-0 m-3"
        :cursor="cursor"
    />
  </div>
</template>
