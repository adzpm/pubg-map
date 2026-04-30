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
    <nav class="navbar navbar-dark bg-dark px-3 py-2 flex-shrink-0">
        <span class="navbar-brand mb-0 h1">
            <i class="bi bi-map-fill me-3"></i>
            <span class="text-light">PUBG Maps</span>
        </span>
        <div class="d-flex align-items-center gap-3">
            <div class="form-check form-switch text-light mb-0">
                <input
                    id="gridSwitch"
                    v-model="gridVisible"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                >
                <label class="form-check-label" for="gridSwitch">Grid</label>
            </div>
            <div class="form-check form-switch text-light mb-0">
                <input
                    id="secretsSwitch"
                    v-model="secretsVisible"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                >
                <label class="form-check-label" for="secretsSwitch">Secrets</label>
            </div>
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    {{ currentMap.name }}
                </button>
                <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
                    <li v-for="map in maps" :key="map.id">
                        <a
                            class="dropdown-item"
                            :class="{active: map.id === currentMap.id}"
                            href="#"
                            @click.prevent="$emit('select', map)"
                        >
                            {{ map.name }}
                            <small class="text-secondary ms-2">{{ map.cells.x }}×{{ map.cells.y }} km</small>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>
