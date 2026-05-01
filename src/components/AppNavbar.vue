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
  <aside class="d-flex flex-column flex-shrink-0 overflow-auto">
    <div class="p-3 py-1">
      <span class="text-secondary text-uppercase small ">Map</span>
    </div>
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item" v-for="map in maps" :key="map.id">
        <a href="#" class="nav-link rounded-0" @click.prevent="$emit('select', map)"
           :class="map.id === currentMap.id ? 'active' : ''"
        >{{ map.name }} [{{ map.cells.x }}×{{ map.cells.y }}]</a>
      </li>
    </ul>

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