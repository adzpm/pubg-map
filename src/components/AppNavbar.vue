<script setup>
defineProps({
  maps: {type: Array, required: true},
  currentMap: {type: Object, required: true},
  secretsAvailable: {type: Boolean, default: false},
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', {type: Boolean, required: true})
const secretsVisible = defineModel('secretsVisible', {type: Boolean, required: true})
</script>

<template>
  <div class="d-flex flex-column flex-shrink-0 overflow-auto py-3 gap-3">
    <div class="px-3 d-flex align-items-center gap-2 fw-medium">
      <i class="bi bi-map"></i>
      <span>PUBG maps</span>
    </div>
    <div class="d-flex flex-column gap-2">
      <h6 class="text-secondary text-uppercase px-3 m-0 small">Map</h6>
      <div class="d-flex flex-column">
        <a href="#"
           class="px-3 py-2 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
           @click.prevent="$emit('select', map)"
           :class="map.id === currentMap.id ? 'text-bg-light link-dark' : ''"
           v-for="map in maps" :key="map.id">
          <span class="">{{ map.name }}</span>
          <span class="small opacity-50">{{ map.cells.x }}×{{ map.cells.y }}</span>
        </a>
      </div>
    </div>
    <div class="d-flex flex-column gap-2">
      <h6 class="text-secondary text-uppercase px-3 m-0 small">Layers</h6>
      <div class="d-flex flex-column gap-1 px-3">
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" role="switch" id="switchGrid" v-model="gridVisible">
          <label class="form-check-label" for="switchGrid">Grid</label>
        </div>
        <div class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" role="switch" id="switchSecrets"
                 :disabled="!secretsAvailable" v-model="secretsVisible">
          <label class="form-check-label" for="switchSecrets" :class="{'opacity-50': !secretsAvailable}">Secrets</label>
        </div>
      </div>
    </div>
  </div>
</template>