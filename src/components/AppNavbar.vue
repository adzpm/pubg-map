<script setup>
import {ref} from 'vue'

defineProps({
  maps: {type: Array, required: true},
  currentMap: {type: Object, required: true},
  secretsAvailable: {type: Boolean, default: false},
})

const emit = defineEmits(['select'])

const gridVisible = defineModel('gridVisible', {type: Boolean, required: true})
const secretsVisible = defineModel('secretsVisible', {type: Boolean, required: true})

const panelCollapsed = ref(false)
const layersCollapsed = ref(false)
const mapsCollapsed = ref(false)
</script>

<template>
    <aside class="control-panel card border-0 shadow-lg" :class="{'control-panel--collapsed': panelCollapsed}">
        <div class="card-body p-3 p-sm-4">
            <div class="control-panel__topbar d-flex align-items-center gap-2 mb-3">
                <button
                    class="btn btn-control-icon d-inline-flex align-items-center justify-content-center flex-shrink-0"
                    type="button"
                    :aria-expanded="String(!panelCollapsed)"
                    @click="panelCollapsed = !panelCollapsed"
                >
                    <i class="bi" :class="panelCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                </button>

                <div class="control-panel__brand d-flex align-items-center">
                    <span class="control-panel__brand-title d-inline-flex align-items-center">
                        <strong class="control-panel__brand-title-strong">PUBG</strong>
                        <span class="control-panel__brand-title-rest">Maps</span>
                    </span>
                </div>
            </div>

            <div v-if="!panelCollapsed" class="d-flex flex-column gap-3">
                <section class="control-section">
                    <div class="control-panel__header d-flex align-items-center justify-content-between gap-2 mb-2">
                        <h2 class="control-panel__title mb-0">Layers</h2>
                        <button
                            class="btn btn-control-icon btn-control-icon--sm d-inline-flex align-items-center justify-content-center flex-shrink-0"
                            type="button"
                            :aria-expanded="String(!layersCollapsed)"
                            @click="layersCollapsed = !layersCollapsed"
                        >
                            <i class="bi" :class="layersCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                        </button>
                    </div>

                    <div v-show="!layersCollapsed" class="control-section__body collapse show">
                        <div class="list-group list-group-flush control-list">
                            <label
                                class="list-group-item control-list-item d-flex align-items-center justify-content-between gap-3"
                                :class="{'is-active': gridVisible}"
                            >
                                <span class="control-row__label d-inline-flex align-items-center gap-2">
                                    <i class="bi bi-grid-3x3-gap"></i>
                                    <span>Grid</span>
                                </span>
                                <span class="form-check form-switch control-switch-wrap m-0">
                                    <input
                                        v-model="gridVisible"
                                        class="form-check-input control-switch float-none ms-0"
                                        type="checkbox"
                                        role="switch"
                                        aria-label="Toggle grid visibility"
                                    >
                                </span>
                            </label>

                            <label
                                class="list-group-item control-list-item d-flex align-items-center justify-content-between gap-3"
                                :class="{'is-active': secretsVisible}"
                            >
                                <span class="control-row__label d-inline-flex align-items-center gap-2">
                                    <i class="bi bi-bullseye"></i>
                                    <span>Secrets</span>
                                </span>
                                <span class="form-check form-switch control-switch-wrap m-0">
                                    <input
                                        v-model="secretsVisible"
                                        class="form-check-input control-switch float-none ms-0"
                                        type="checkbox"
                                        role="switch"
                                        aria-label="Toggle secret rooms visibility"
                                    >
                                </span>
                            </label>
                        </div>
                    </div>
                </section>

                <section class="control-section control-panel__section--maps">
                    <div class="control-panel__header d-flex align-items-center justify-content-between gap-2 mb-2">
                        <h2 class="control-panel__title mb-0">Maps</h2>
                        <button
                            class="btn btn-control-icon btn-control-icon--sm d-inline-flex align-items-center justify-content-center flex-shrink-0"
                            type="button"
                            :aria-expanded="String(!mapsCollapsed)"
                            @click="mapsCollapsed = !mapsCollapsed"
                        >
                            <i class="bi" :class="mapsCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"></i>
                        </button>
                    </div>

                    <div v-show="!mapsCollapsed" class="control-section__body collapse show">
                        <div class="list-group list-group-flush control-list">
                            <button
                                v-for="map in maps"
                                :key="map.id"
                                class="list-group-item list-group-item-action control-list-item control-list-item--button d-flex align-items-center justify-content-between gap-3"
                                :class="{active: map.id === currentMap.id}"
                                type="button"
                                @click="emit('select', map)"
                            >
                                <span class="control-row__label d-inline-flex align-items-center gap-2">
                                    <i class="bi bi-map"></i>
                                    <span>{{ map.name }}</span>
                                </span>
                                <span class="badge rounded-pill control-row__badge flex-shrink-0">{{ map.cells.x }}×{{ map.cells.y }}</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </aside>
</template>
