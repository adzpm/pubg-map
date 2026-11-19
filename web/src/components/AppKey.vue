<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** A key ("G") or a combination ("Alt+M"); each part gets its own cap. */
  keys: { type: String, required: true },
})

const parts = computed(() => props.keys.split('+'))
</script>

<template>
  <span class="keys" aria-hidden="true">
    <template v-for="(part, i) in parts" :key="i">
      <span v-if="i > 0" class="plus">+</span>
      <kbd>{{ part }}</kbd>
    </template>
  </span>
</template>

<style scoped>
.keys {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: none;
}

kbd {
  display: inline-grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px 1px;
  background: var(--case-2);
  color: var(--sand);
  border: 1px solid var(--sand-dim);
  border-bottom-width: 2px;
  border-radius: 3px;
  font-family: var(--font-condensed);
  font-weight: 600;
  font-size: 12px;
  line-height: 1;
}

.plus {
  font-size: 11px;
  color: var(--sand-dim);
}
</style>
