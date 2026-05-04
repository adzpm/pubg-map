<script setup>
defineProps({
  cursor: {type: Object, required: true},
})
</script>

<template>
  <div v-if="cursor.visible"
       class="px-3 py-2 d-inline-flex gap-3 align-items-center small font-monospace rounded-4 border shadow bg-body bg-opacity-50">
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
