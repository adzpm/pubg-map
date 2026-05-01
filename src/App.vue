<script setup>
import {ref, computed} from 'vue'
import {MAPS} from '@/data/maps'
import {SECRET_ROOMS} from '@/data/secrets'
import AppNavbar from '@/components/AppNavbar.vue'
import MapViewer from '@/components/MapViewer.vue'
import StatusBar from '@/components/StatusBar.vue'

const currentMap = ref(MAPS[0])
const gridVisible = ref(true)
const secretsVisible = ref(true)
const cursor = ref({visible: false, px: 0, py: 0, cell: ''})

const hasSecrets = computed(() => (SECRET_ROOMS[currentMap.value.id] ?? []).length > 0)

const selectMap = (map) => {
    if (map.id === currentMap.value.id) return
    currentMap.value = map
}
</script>

<template>
    <div class="d-flex flex-column flex-md-row vh-100">
        <AppNavbar
            :maps="MAPS"
            :current-map="currentMap"
            :secrets-available="hasSecrets"
            v-model:grid-visible="gridVisible"
            v-model:secrets-visible="secretsVisible"
            @select="selectMap"
        />
        <main class="d-flex flex-column flex-grow-1">
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
