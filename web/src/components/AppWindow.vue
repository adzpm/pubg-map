<script setup>
import { computed, ref } from 'vue'
import { useFloatingWindow } from '@/composables/useFloatingWindow'

const props = defineProps({
  maps: { type: Array, required: true },
  currentMap: { type: Object, required: true },
  cursor: { type: Object, required: true },
  secretsCount: { type: Number, default: 0 },
  devMode: { type: Boolean, default: false },
  devTools: { type: Array, default: () => [] },
})

defineEmits(['select'])

const gridVisible = defineModel('gridVisible', { type: Boolean, required: true })
const secretsVisible = defineModel('secretsVisible', { type: Boolean, required: true })
const statusBarVisible = defineModel('statusBarVisible', { type: Boolean, required: true })

const windowEl = ref(null)
const { style, collapsed, dragging, toggle, handle } = useFloatingWindow(windowEl)

const km = (map) => `${map.cells.x}×${map.cells.y} km`
const cell = computed(() => (props.cursor.visible ? props.cursor.cell : ''))
</script>

<template>
  <section
    ref="windowEl"
    class="field-window"
    :class="{ collapsed, dragging }"
    :style="style"
    aria-label="Map controls"
  >
    <header
      class="head"
      tabindex="0"
      title="Drag to move, double-click to fold. Arrow keys move it, Enter folds it."
      :aria-expanded="!collapsed"
      v-bind="handle"
    >
      <span class="grip" aria-hidden="true"></span>
      <span class="title">
        {{ currentMap.name }}<small>{{ km(currentMap) }}</small>
      </span>
      <span class="cell" :class="{ idle: !cell }" aria-live="polite">{{ cell || '—' }}</span>
      <button type="button" class="fold" :aria-label="collapsed ? 'Unfold window' : 'Fold window'" @click="toggle">
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path d="M1 7l5-5 5 5" />
        </svg>
      </button>
    </header>

    <div v-if="!collapsed" class="body">
      <nav class="maps" aria-label="Maps">
        <button
          v-for="(map, i) in maps"
          :key="map.id"
          type="button"
          :aria-pressed="map.id === currentMap.id"
          :aria-keyshortcuts="i < 9 ? String(i + 1) : undefined"
          @click="$emit('select', map)"
        >
          <span v-if="i < 9" class="key" aria-hidden="true">{{ i + 1 }}</span>
          <span class="name">{{ map.name }}</span>
          <span class="km">{{ km(map) }}</span>
        </button>
      </nav>

      <div class="toggles">
        <button type="button" :aria-pressed="gridVisible" aria-keyshortcuts="G" @click="gridVisible = !gridVisible">
          <span class="box"></span>Grid
        </button>
        <button
          type="button"
          :aria-pressed="secretsCount > 0 && secretsVisible"
          :disabled="secretsCount === 0"
          aria-keyshortcuts="R"
          @click="secretsVisible = !secretsVisible"
        >
          <span class="box"></span>{{ secretsCount > 0 ? `Secret rooms ${secretsCount}` : 'No secret rooms' }}
        </button>
      </div>

      <div v-if="devMode" class="toggles dev" aria-label="Dev tools">
        <button type="button" :aria-pressed="statusBarVisible" @click="statusBarVisible = !statusBarVisible">
          <span class="box"></span>Status bar
        </button>
        <button
          v-for="entry in devTools"
          :key="entry.tool.id"
          type="button"
          :aria-pressed="entry.enabled.value"
          :title="entry.tool.description"
          @click="entry.enabled.value = !entry.enabled.value"
        >
          <span class="box"></span>{{ entry.tool.name }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.field-window {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 300px;
  max-width: calc(100vw - 24px);
  background: var(--case);
  color: var(--sand);
  border: 1px solid rgb(0 0 0 / 60%);
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 1px var(--rule),
    0 14px 40px rgb(0 0 0 / 55%);
}

.field-window.dragging {
  box-shadow:
    inset 0 0 0 1px var(--signal),
    0 20px 50px rgb(0 0 0 / 60%);
}

.head {
  display: flex;
  align-items: stretch;
  height: 46px;
  cursor: grab;
  touch-action: none;
}

.dragging .head {
  cursor: grabbing;
}

.grip {
  width: 22px;
  margin: 9px 0 9px 10px;
  background: repeating-linear-gradient(90deg, var(--sand-dim) 0 2px, transparent 2px 5px);
  opacity: 0.45;
}

.title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 21px;
  white-space: nowrap;
  overflow: hidden;
}

.title small {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 11px;
  color: var(--sand-dim);
}

.cell {
  width: 64px;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--case-2);
  border-left: 1px solid var(--rule);
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 24px;
  color: var(--signal);
}

.cell.idle {
  color: var(--sand-dim);
  font-size: 18px;
}

.fold {
  width: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border-left: 1px solid var(--rule);
  color: var(--sand-dim);
}

.fold:hover {
  color: var(--sand);
  background: var(--case-2);
}

.fold svg {
  transition: transform 0.15s;
}

.collapsed .fold svg {
  transform: rotate(180deg);
}

.body {
  border-top: 1px solid var(--rule);
}

.maps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.maps button {
  position: relative;
  padding: 10px 10px 9px;
  text-align: left;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.maps button:nth-child(3n) {
  border-right: 0;
}

.maps button:hover,
.maps button[aria-pressed='true'] {
  background: var(--case-2);
}

.maps button[aria-pressed='true']::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--signal);
}

.maps .name {
  display: block;
  font-family: var(--font-condensed);
  font-weight: 600;
  font-size: 17px;
  color: var(--sand-dim);
}

.maps button:hover .name,
.maps button[aria-pressed='true'] .name {
  color: var(--sand);
}

.maps .km {
  font-size: 11px;
  color: var(--sand-dim);
}

.maps .key {
  position: absolute;
  top: 7px;
  right: 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--sand-dim);
  opacity: 0.6;
}

.toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.toggles.dev {
  border-top: 1px solid var(--rule);
}

.toggles button {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sand-dim);
  text-align: left;
}

.toggles button:nth-child(even) {
  border-left: 1px solid var(--rule);
}

.toggles button:nth-child(n + 3) {
  border-top: 1px solid var(--rule);
}

.toggles button:hover {
  background: var(--case-2);
}

.toggles .box {
  width: 14px;
  height: 14px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1.5px solid currentColor;
}

.toggles button[aria-pressed='true'] {
  color: var(--sand);
}

.toggles button[aria-pressed='true'] .box {
  border-color: var(--signal);
}

.toggles button[aria-pressed='true'] .box::after {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--signal);
}

.toggles button:disabled {
  opacity: 0.35;
  cursor: default;
}

.toggles button:disabled:hover {
  background: none;
}

@media (prefers-reduced-motion: reduce) {
  .fold svg {
    transition: none;
  }
}
</style>
