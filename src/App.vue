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
    <AppNavbar
        :maps="MAPS"
        :current-map="currentMap"
        v-model:grid-visible="gridVisible"
        v-model:secrets-visible="secretsVisible"
        @select="selectMap"
    />
    <MapViewer
        :current-map="currentMap"
        :grid-visible="gridVisible"
        :secrets-visible="secretsVisible"
        @cursor="cursor = $event"
    />
    <StatusBar :cursor="cursor"/>
</template>
