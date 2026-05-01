<script setup>
defineProps({
    maps: {type: Array, required: true},
    currentMap: {type: Object, required: true},
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', {type: Boolean, required: true})
const secretsVisible = defineModel('secretsVisible', {type: Boolean, required: true})
</script>

<template>
    <aside class="app-sidebar bg-dark text-light d-flex flex-column flex-shrink-0 p-3 border-secondary border-opacity-25 overflow-auto">
        <div class="navbar-brand mb-4 d-flex align-items-center">
            <i class="bi bi-map-fill me-2 fs-4"></i>
            <span class="h5 mb-0">PUBG Maps</span>
        </div>

        <div class="mb-4">
            <h6 class="text-secondary text-uppercase small mb-2">Map</h6>
            <ul class="list-unstyled mb-0">
                <li v-for="map in maps" :key="map.id" class="mb-1">
                    <a
                        href="#"
                        class="d-flex justify-content-between align-items-center px-2 py-2 rounded text-decoration-none sidebar-map-item"
                        :class="map.id === currentMap.id ? 'active bg-primary text-white' : 'text-light'"
                        @click.prevent="$emit('select', map)"
                    >
                        <span>{{ map.name }}</span>
                        <small class="ms-2" :class="map.id === currentMap.id ? 'text-white-50' : 'text-secondary'">
                            {{ map.cells.x }}×{{ map.cells.y }}
                        </small>
                    </a>
                </li>
            </ul>
        </div>

        <div>
            <h6 class="text-secondary text-uppercase small mb-2">Layers</h6>
            <div class="form-check form-switch mb-2">
                <input
                    id="gridSwitch"
                    v-model="gridVisible"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                >
                <label class="form-check-label" for="gridSwitch">Grid</label>
            </div>
            <div class="form-check form-switch">
                <input
                    id="secretsSwitch"
                    v-model="secretsVisible"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                >
                <label class="form-check-label" for="secretsSwitch">Secrets</label>
            </div>
        </div>
    </aside>
</template>