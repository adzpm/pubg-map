<script setup>
import { usePersistentRef } from '@/composables/usePersistentRef'

defineProps({
  maps: { type: Array, required: true },
  currentMap: { type: Object, required: true },
  secretsAvailable: { type: Boolean, default: false },
  devMode: { type: Boolean, default: false },
  devTools: { type: Array, default: () => [] },
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', { type: Boolean, required: true })
const secretsVisible = defineModel('secretsVisible', { type: Boolean, required: true })
const statusBarVisible = defineModel('statusBarVisible', { type: Boolean, required: true })

const collapsed = usePersistentRef('sidebar.collapsed', false)
const mapsCollapsed = usePersistentRef('sidebar.mapsCollapsed', false)
const layersCollapsed = usePersistentRef('sidebar.layersCollapsed', false)
const devToolsCollapsed = usePersistentRef('sidebar.devToolsCollapsed', false)
</script>

<template>
  <div class="d-flex flex-column flex-shrink-0 overflow-auto rounded-4 border shadow bg-body bg-opacity-50 py-2">
    <button
      type="button"
      class="btn btn-link text-decoration-none text-body d-flex align-items-center gap-1 text-start px-3 w-100 rounded-0"
      :aria-expanded="!collapsed"
      aria-label="Toggle sidebar"
      @click="collapsed = !collapsed"
    >
      <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 lh-1">
        <i class="bi" :class="collapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
      </span>
      <span class="fw-bold ms-1">PUBG</span>
      <span>Maps</span>
    </button>

    <template v-if="!collapsed">
      <div class="d-flex flex-column">
        <button
          type="button"
          class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
          :aria-expanded="!mapsCollapsed"
          @click="mapsCollapsed = !mapsCollapsed"
        >
          <span class="text-secondary text-uppercase fw-semibold d-inline-flex align-items-center gap-2">
            <i class="bi bi-map"></i>
            <span>Map</span>
          </span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 lh-1">
            <i class="bi" :class="mapsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div v-if="!mapsCollapsed" class="d-flex flex-column">
          <a
            v-for="map in maps"
            :key="map.id"
            href="#"
            class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
            :class="map.id === currentMap.id ? 'text-bg-light link-dark' : ''"
            @click.prevent="$emit('select', map)"
          >
            <span class="d-inline-flex align-items-center gap-2">
              <i class="bi bi-geo-alt"></i>
              <span>{{ map.name }}</span>
            </span>
            <span class="opacity-50">{{ map.cells.x }}×{{ map.cells.y }}</span>
          </a>
        </div>
      </div>

      <div class="d-flex flex-column">
        <button
          type="button"
          class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
          :aria-expanded="!layersCollapsed"
          @click="layersCollapsed = !layersCollapsed"
        >
          <span class="text-secondary text-uppercase fw-semibold d-inline-flex align-items-center gap-2">
            <i class="bi bi-stack"></i>
            <span>Layers</span>
          </span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 lh-1">
            <i class="bi" :class="layersCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div v-if="!layersCollapsed" class="d-flex flex-column">
          <a
            href="#"
            class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
            :class="gridVisible ? 'text-bg-light link-dark' : ''"
            @click.prevent="gridVisible = !gridVisible"
          >
            <span class="d-inline-flex align-items-center gap-2">
              <i class="bi bi-grid-3x3"></i>
              <span>Grid</span>
            </span>
          </a>
          <a
            href="#"
            class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
            :class="[secretsVisible ? 'text-bg-light link-dark' : '', !secretsAvailable ? 'opacity-50 pe-none' : '']"
            :aria-disabled="!secretsAvailable"
            @click.prevent="secretsAvailable && (secretsVisible = !secretsVisible)"
          >
            <span class="d-inline-flex align-items-center gap-2">
              <i class="bi bi-key"></i>
              <span>Secrets</span>
            </span>
          </a>
        </div>
      </div>

      <div v-if="devMode" class="d-flex flex-column">
        <button
          type="button"
          class="btn btn-link text-decoration-none text-body d-flex justify-content-between align-items-center gap-2 px-3 w-100 text-start rounded-0"
          :aria-expanded="!devToolsCollapsed"
          @click="devToolsCollapsed = !devToolsCollapsed"
        >
          <span class="text-secondary text-uppercase fw-semibold d-inline-flex align-items-center gap-2">
            <i class="bi bi-tools"></i>
            <span>Dev Tools</span>
          </span>
          <span class="d-inline-flex align-items-center justify-content-center flex-shrink-0 lh-1">
            <i class="bi" :class="devToolsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
          </span>
        </button>
        <div v-if="!devToolsCollapsed" class="d-flex flex-column">
          <a
            href="#"
            class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
            :class="statusBarVisible ? 'text-bg-light link-dark' : ''"
            @click.prevent="statusBarVisible = !statusBarVisible"
          >
            <span class="d-inline-flex align-items-center gap-2">
              <i class="bi bi-info-circle"></i>
              <span>Status bar</span>
            </span>
          </a>
          <a
            v-for="entry in devTools"
            :key="entry.tool.id"
            href="#"
            class="px-3 py-1 link-light text-decoration-none d-flex justify-content-between align-items-center gap-3"
            :class="entry.enabled.value ? 'text-bg-light link-dark' : ''"
            :title="entry.tool.description"
            @click.prevent="entry.enabled.value = !entry.enabled.value"
          >
            <span class="d-inline-flex align-items-center gap-2">
              <i class="bi" :class="entry.tool.icon || 'bi-gear'"></i>
              <span>{{ entry.tool.name }}</span>
            </span>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>
