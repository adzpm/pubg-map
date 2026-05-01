<script setup>
import {ref} from 'vue'
import {MAPS} from '@/data/maps'
import AppNavbar from '@/components/AppNavbar.vue'
import MapViewer from '@/components/MapViewer.vue'
import StatusBar from '@/components/StatusBar.vue'

const currentMap = ref(MAPS[0])
const gridVisible = ref(true)
const secretsVisible = ref(true)
const cursor = ref({visible: false, px: 0, py: 0, cell: ''})

const selectMap = (map) => {
    if (map.id === currentMap.value.id) return
    currentMap.value = map
}
</script>

<template>
    <div class="d-flex flex-column flex-md-row vh-100 bg-dark">
        <AppNavbar
            :maps="MAPS"
            :current-map="currentMap"
            v-model:grid-visible="gridVisible"
            v-model:secrets-visible="secretsVisible"
            @select="selectMap"
        />
        <main class="d-flex flex-column flex-grow-1 min-w-0">
            <MapViewer
                :current-map="currentMap"
                :grid-visible="gridVisible"
                :secrets-visible="secretsVisible"
                @cursor="cursor = $event"
            />
            <StatusBar :cursor="cursor"/>
        </main>
    </div>
</template>
