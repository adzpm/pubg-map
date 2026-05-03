<script setup>
defineProps({
    cursor: {type: Object, required: true},
})
</script>

<template>
    <div v-if="cursor.visible" class="map-status card border-0 text-light shadow-sm">
        <div class="card-body d-flex gap-4 align-items-center small flex-shrink-0 font-monospace py-2 px-3">
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
    </div>
</template>
