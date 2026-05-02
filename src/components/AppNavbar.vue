<script setup>
import {ref} from 'vue'

defineProps({
    maps: {type: Array, required: true},
    currentMap: {type: Object, required: true},
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', {type: Boolean, required: true})
const secretsVisible = defineModel('secretsVisible', {type: Boolean, required: true})

const panelCollapsed = ref(false)
const layersCollapsed = ref(false)
const mapsCollapsed = ref(false)
</script>

<template>
    <aside class="control-panel" :class="{'control-panel--collapsed': panelCollapsed}">
        <div class="control-panel__topbar">
            <button
                class="control-panel__collapse"
                type="button"
                :aria-expanded="String(!panelCollapsed)"
                @click="panelCollapsed = !panelCollapsed"
            >
                <i class="bi" :class="panelCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
            </button>
            <div class="control-panel__brand">
                <span class="control-panel__brand-title">
                    <strong class="control-panel__brand-title-strong">PUBG</strong>
                    <span class="control-panel__brand-title-rest">Maps</span>
                </span>
            </div>
        </div>

        <template v-if="!panelCollapsed">
            <div class="control-panel__section">
                <div class="control-panel__header">
                    <h2 class="control-panel__title">Layers</h2>
                    <button
                        class="control-panel__icon"
                        type="button"
                        :aria-expanded="String(!layersCollapsed)"
                        @click="layersCollapsed = !layersCollapsed"
                    >
                        <i class="bi" :class="layersCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                    </button>
                </div>

                <div v-if="!layersCollapsed">
                    <button
                        class="control-row"
                        :class="{'control-row--active': gridVisible}"
                        type="button"
                        :aria-pressed="String(gridVisible)"
                        @click="gridVisible = !gridVisible"
                    >
                        <span class="control-row__label">
                            <i class="bi bi-grid-3x3-gap"></i>
                            <span>Grid</span>
                        </span>
                        <span class="control-row__toggle" :class="{'control-row__toggle--on': gridVisible}">
                            <span class="control-row__toggle-thumb"></span>
                        </span>
                    </button>

                    <button
                        class="control-row"
                        :class="{'control-row--active': secretsVisible}"
                        type="button"
                        :aria-pressed="String(secretsVisible)"
                        @click="secretsVisible = !secretsVisible"
                    >
                        <span class="control-row__label">
                            <i class="bi bi-bullseye"></i>
                            <span>Secrets</span>
                        </span>
                        <span class="control-row__toggle" :class="{'control-row__toggle--on': secretsVisible}">
                            <span class="control-row__toggle-thumb"></span>
                        </span>
                    </button>
                </div>
            </div>

            <div class="control-panel__section control-panel__section--maps">
                <div class="control-panel__header">
                    <h2 class="control-panel__title">Maps</h2>
                    <button
                        class="control-panel__icon"
                        type="button"
                        :aria-expanded="String(!mapsCollapsed)"
                        @click="mapsCollapsed = !mapsCollapsed"
                    >
                        <i class="bi" :class="mapsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                    </button>
                </div>

                <div v-if="!mapsCollapsed">
                    <button
                        v-for="map in maps"
                        :key="map.id"
                        class="control-row"
                        :class="{'control-row--selected': map.id === currentMap.id}"
                        type="button"
                        @click="$emit('select', map)"
                    >
                        <span class="control-row__label">
                            <i class="bi bi-map"></i>
                            <span>{{ map.name }}</span>
                        </span>
                        <span class="control-row__badge">{{ map.cells.x }}×{{ map.cells.y }}</span>
                    </button>
                </div>
            </div>
        </template>
    </aside>
</template>
