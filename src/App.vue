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
    <div class="position-relative vh-100 overflow-hidden">
        <main class="d-flex flex-column h-100">
            <MapViewer
                :current-map="currentMap"
                :grid-visible="gridVisible"
                :secrets-visible="secretsVisible"
                @cursor="cursor = $event"
            />
        </main>
        <AppNavbar
            class="floating-sidebar position-absolute top-0 start-0 m-3 rounded-4 border shadow"
            :maps="MAPS"
            :current-map="currentMap"
            :secrets-available="hasSecrets"
            v-model:grid-visible="gridVisible"
            v-model:secrets-visible="secretsVisible"
            @select="selectMap"
        />
        <StatusBar
            class="position-absolute bottom-0 end-0 m-3"
            :cursor="cursor"
        />
    </div>
</template>
