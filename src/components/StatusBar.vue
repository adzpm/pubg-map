<script setup>
defineProps({
    cursor: {type: Object, required: true},
})
</script>

<template>
    <div v-if="cursor.visible" class="map-status text-light px-3 py-1 d-flex gap-4 align-items-center small flex-shrink-0 font-monospace">
        <span class="d-flex gap-2">
            <span class="text-secondary">Cell:</span>
            <strong>{{ cursor.cell }}</strong>
        </span>
        <span class="d-flex gap-2">
            <span class="text-secondary">X:</span>
            <strong>{{ cursor.px }}</strong>
        </span>
        <span class="d-flex gap-2">
            <span class="text-secondary">Y:</span>
            <strong>{{ cursor.py }}</strong>
        </span>
    </div>
</template>
