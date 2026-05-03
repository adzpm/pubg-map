<script setup>
import {ref, toRefs} from 'vue'
import {useLeafletMap} from '@/composables/useLeafletMap'

const props = defineProps({
    currentMap: {type: Object, required: true},
    gridVisible: {type: Boolean, default: true},
    secretsVisible: {type: Boolean, default: true},
})

const emit = defineEmits(['cursor'])

const mapEl = ref(null)

useLeafletMap(mapEl, toRefs(props), (cursor) => emit('cursor', cursor))
</script>

<template>
    <div ref="mapEl" class="map-viewport"></div>
</template>
