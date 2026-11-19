<script setup>
defineProps({
  cursor: { type: Object, required: true },
})
</script>

<template>
  <div v-if="cursor.visible" class="status-bar">
    <span class="item">
      <span class="label">Cell:</span>
      <strong>{{ cursor.cell }}</strong>
    </span>
    <span class="item">
      <span class="label">X:</span>
      <strong>{{ cursor.px }}</strong>
    </span>
    <span class="item">
      <span class="label">Y:</span>
      <strong>{{ cursor.py }}</strong>
    </span>
  </div>
</template>

<style scoped>
.status-bar {
  display: inline-flex;
  gap: 16px;
  padding: 7px 12px;
  background: var(--case);
  color: var(--sand);
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 1px var(--rule),
    0 8px 24px rgb(0 0 0 / 45%);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.item {
  display: inline-flex;
  gap: 6px;
}

.label {
  color: var(--sand-dim);
}

strong {
  font-weight: 600;
}
</style>
