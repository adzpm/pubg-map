<script setup>
import {usePersistentRef} from '@/composables/usePersistentRef'

defineProps({
  maps: {type: Array, required: true},
  currentMap: {type: Object, required: true},
  secretsAvailable: {type: Boolean, default: false},
  devMode: {type: Boolean, default: false},
  devTools: {type: Array, default: () => []},
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', {type: Boolean, required: true})
const secretsVisible = defineModel('secretsVisible', {type: Boolean, required: true})

const collapsed = usePersistentRef('sidebar.collapsed', false)
const mapsCollapsed = usePersistentRef('sidebar.mapsCollapsed', false)
const layersCollapsed = usePersistentRef('sidebar.layersCollapsed', false)
const devToolsCollapsed = usePersistentRef('sidebar.devToolsCollapsed', false)
</script>

<template>
  <div class="d-flex flex-column flex-shrink-0 overflow-auto rounded-4 border shadow bg-body bg-opacity-50 py-2">
    <button type="button"
            class="btn btn-link text-decoration-none text-body d-flex align-items-center gap-1 text-start px-3 w-100 rounded-0"
            @click="collapsed = !collapsed"
            :aria-expanded="!collapsed"
            aria-label="Toggle sidebar">
      <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded bg-secondary bg-opacity-25 lh-1"
            style="width: 1.75rem; height: 1.75rem;">
        <i class="bi" :class="collapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
      </span>
      <span class="fw-bold ms-1">PUBG</span>
      <span>Maps</span>
    </button>

    <template v-if="!collapsed">
      <div class="d-flex flex-column gap-2">
        <button type="button"
                class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
                @click="mapsCollapsed = !mapsCollapsed"
                :aria-expanded="!mapsCollapsed">
          <span class="text-secondary text-uppercase fw-semibold">Map</span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded bg-secondary bg-opacity-25 lh-1"
                style="width: 1.75rem; height: 1.75rem;">
            <i class="bi" :class="mapsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div class="d-flex flex-column" v-if="!mapsCollapsed">
          <a href="#"
             class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
             @click.prevent="$emit('select', map)"
             :class="map.id === currentMap.id ? 'text-bg-light link-dark' : ''"
             v-for="map in maps" :key="map.id">
            <span>{{ map.name }}</span>
            <span class="opacity-50">{{ map.cells.x }}×{{ map.cells.y }}</span>
          </a>
        </div>
      </div>

      <div class="">
        <button type="button"
                class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
                @click="layersCollapsed = !layersCollapsed"
                :aria-expanded="!layersCollapsed">
          <span class="text-secondary text-uppercase fw-semibold">Layers</span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded bg-secondary bg-opacity-25 lh-1"
                style="width: 1.75rem; height: 1.75rem;">
            <i class="bi" :class="layersCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div class="d-flex flex-column gap-1 px-3" v-if="!layersCollapsed">
          <div class="form-check form-switch m-0 d-flex justify-content-between align-items-center ps-0">
            <label class="form-check-label" for="switchGrid">Grid</label>
            <input class="form-check-input" type="checkbox" role="switch" id="switchGrid" v-model="gridVisible">
          </div>
          <div class="form-check form-switch m-0 d-flex justify-content-between align-items-center ps-0">
            <label class="form-check-label" for="switchSecrets" :class="{'opacity-50': !secretsAvailable}">Secrets</label>
            <input class="form-check-input" type="checkbox" role="switch" id="switchSecrets"
                   :disabled="!secretsAvailable" v-model="secretsVisible">
          </div>
        </div>
      </div>

      <div v-if="devMode && devTools.length">
        <button type="button"
                class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
                @click="devToolsCollapsed = !devToolsCollapsed"
                :aria-expanded="!devToolsCollapsed">
          <span class="text-secondary text-uppercase fw-semibold">Dev Tools</span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded bg-secondary bg-opacity-25 lh-1"
                style="width: 1.75rem; height: 1.75rem;">
            <i class="bi" :class="devToolsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div class="d-flex flex-column gap-1 px-3" v-if="!devToolsCollapsed">
          <div v-for="entry in devTools" :key="entry.tool.id"
               class="form-check form-switch m-0 d-flex justify-content-between align-items-center ps-0">
            <label class="form-check-label" :for="`devTool-${entry.tool.id}`"
                   :title="entry.tool.description">{{ entry.tool.name }}</label>
            <input class="form-check-input" type="checkbox" role="switch"
                   :id="`devTool-${entry.tool.id}`"
                   :checked="entry.enabled.value"
                   @change="entry.enabled.value = $event.target.checked">
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
