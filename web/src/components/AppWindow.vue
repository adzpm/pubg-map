<script setup>
import { computed, ref } from 'vue'
import { useFloatingWindow } from '@/composables/useFloatingWindow'
import { isOverlay } from '@/lib/overlay'
import { pathForMap } from '@/lib/route'
import AppKey from '@/components/AppKey.vue'

const props = defineProps({
  maps: { type: Array, required: true },
  currentMap: { type: Object, required: true },
  /** What the page is about (lib/seo pageMeta): heading, about, fact lines and sections. */
  page: { type: Object, default: null },
  cursor: { type: Object, required: true },
  secretsCount: { type: Number, default: 0 },
  vehiclesCount: { type: Number, default: 0 },
  /** Spawn-table rows with no points in the data, e.g. "Garage (8 per match)". */
  vehiclesUnplaced: { type: Array, default: () => [] },
  devMode: { type: Boolean, default: false },
  devTools: { type: Array, default: () => [] },
})

const emit = defineEmits(['select'])

const gridVisible = defineModel('gridVisible', { type: Boolean, required: true })
const secretsVisible = defineModel('secretsVisible', { type: Boolean, required: true })
const vehiclesVisible = defineModel('vehiclesVisible', { type: Boolean, default: false })
const statusBarVisible = defineModel('statusBarVisible', { type: Boolean, required: true })

const windowEl = ref(null)
const { style, collapsed, dragging, toggle, handle } = useFloatingWindow(windowEl)

// F folds the window from anywhere; the hotkey lives in App next to the others
defineExpose({ toggle })

const overlay = isOverlay()

// a modified click opens the map in a new tab, as links do; the overlay has no tabs, and players
// often hold Ctrl or Shift, so there every click picks the map
const onMapClick = (event, map) => {
  if (!overlay && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return
  event.preventDefault()
  emit('select', map)
}

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
      <button
        type="button"
        class="fold"
        :aria-label="collapsed ? 'Unfold window' : 'Fold window'"
        aria-keyshortcuts="F"
        @click="toggle"
      >
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
        <a
          v-for="(map, i) in maps"
          :key="map.id"
          :href="pathForMap(map.id)"
          :aria-current="map.id === currentMap.id ? 'page' : undefined"
          :aria-keyshortcuts="i < 9 ? String(i + 1) : undefined"
          draggable="false"
          @click="onMapClick($event, map)"
        >
          <AppKey v-if="i < 9" class="key" :keys="String(i + 1)" />
          <span class="name">{{ map.name }}</span>
          <span class="km">{{ km(map) }}</span>
        </a>
      </nav>

      <div class="toggles">
        <button type="button" :aria-pressed="gridVisible" aria-keyshortcuts="G" @click="gridVisible = !gridVisible">
          <span class="box"></span>Grid<AppKey class="end" keys="G" />
        </button>
        <button
          type="button"
          :aria-pressed="secretsCount > 0 && secretsVisible"
          :disabled="secretsCount === 0"
          aria-keyshortcuts="R"
          @click="secretsVisible = !secretsVisible"
        >
          <span class="box"></span>{{ secretsCount > 0 ? `Secret rooms ${secretsCount}` : 'No secret rooms' }}
          <AppKey class="end" keys="R" />
        </button>
        <button
          type="button"
          class="wide"
          :aria-pressed="vehiclesCount > 0 && vehiclesVisible"
          :disabled="vehiclesCount === 0"
          aria-keyshortcuts="V"
          @click="vehiclesVisible = !vehiclesVisible"
        >
          <span class="box"></span>{{ vehiclesCount > 0 ? `Vehicle spawns ${vehiclesCount}` : 'No vehicle spawns' }}
          <AppKey class="end" keys="V" />
        </button>
      </div>

      <dl v-if="vehiclesCount > 0 && vehiclesVisible" class="legend">
        <div>
          <dt class="vehicle-spot land guaranteed">100</dt>
          <dd>fixed spawn</dd>
        </div>
        <div>
          <dt class="vehicle-spot land">34</dt>
          <dd>chance, about %</dd>
        </div>
        <div>
          <dt class="vehicle-spot water">27</dt>
          <dd>boat</dd>
        </div>
        <div>
          <dt class="vehicle-spot air">20</dt>
          <dd>glider</dd>
        </div>
      </dl>
      <p v-if="vehiclesCount > 0 && vehiclesVisible" class="legend-note">
        Estimated from the game files for normal and ranked matches: vehicles per match divided by spawn points.
        <template v-if="vehiclesUnplaced.length > 0">
          Not on the map, the files give no points for them: {{ vehiclesUnplaced.join(', ') }}.
        </template>
      </p>

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

      <!-- the page in words: what this map shows. Closed by default, it is still part of the page -->
      <details v-if="page && !overlay" class="about">
        <summary>{{ page.id ? 'About this map' : 'About these maps' }}</summary>
        <h1>{{ page.heading }}</h1>
        <p>{{ page.about }}</p>
        <ul>
          <li v-for="line in page.lines" :key="line.text + (line.href ?? '')">
            <template v-if="line.href">{{ line.label }}: </template>{{ line.text }}
          </li>
        </ul>
        <template v-for="section in page.sections" :key="section.heading">
          <h2>{{ section.heading }}</h2>
          <ul>
            <li v-for="line in section.lines" :key="line.text">{{ line.text }}</li>
          </ul>
        </template>
      </details>

      <ul class="hints" aria-label="Keyboard shortcuts">
        <li><AppKey keys="F" />Fold window</li>
        <template v-if="overlay">
          <li><AppKey keys="Alt+M" />Show or hide overlay</li>
          <li><AppKey keys="Esc" />Hide overlay</li>
        </template>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.field-window {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 340px;
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

/* real links, so each map has an address a search engine can follow and a tab can open */
.maps a {
  position: relative;
  color: inherit;
  text-decoration: none;
  padding: 10px 10px 9px;
  text-align: left;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.maps a:nth-child(3n) {
  border-right: 0;
}

.maps a:hover,
.maps a[aria-current='page'] {
  background: var(--case-2);
}

.maps a[aria-current='page']::before {
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

.maps a:hover .name,
.maps a[aria-current='page'] .name {
  color: var(--sand);
}

.maps .km {
  font-size: 11px;
  color: var(--sand-dim);
}

.maps .key {
  position: absolute;
  top: 7px;
  right: 7px;
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
  gap: 8px;
  padding: 12px 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sand-dim);
  text-align: left;
  white-space: nowrap;
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

.toggles button.wide {
  grid-column: 1 / -1;
  border-left: 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 0;
  padding: 10px 12px;
  border-top: 1px solid var(--rule);
  font-size: 12px;
  color: var(--sand-dim);
}

.legend div {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend dd {
  margin: 0;
}

.legend-note {
  margin: -2px 0 0;
  padding: 0 12px 10px;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--sand-dim);
}

.toggles .end {
  margin-left: auto;
}

.about {
  border-top: 1px solid var(--rule);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--sand-dim);
}

.about[open] {
  max-height: min(46vh, 420px);
  overflow-y: auto;
}

.about h2 {
  margin: 0;
  padding: 0 12px;
  font-family: var(--font-condensed);
  font-weight: 600;
  font-size: 15px;
  color: var(--sand);
}

.about summary {
  /* stays in reach while the text scrolls under it */
  position: sticky;
  top: 0;
  background: var(--case);
  padding: 9px 12px;
  cursor: pointer;
  font-size: 12px;
}

.about summary:hover,
.about[open] summary {
  color: var(--sand);
}

.about h1 {
  margin: 0;
  padding: 0 12px;
  font-family: var(--font-condensed);
  font-weight: 700;
  font-size: 17px;
  color: var(--sand);
}

.about p {
  margin: 4px 0 0;
  padding: 0 12px;
}

.about ul {
  margin: 6px 0 0;
  padding: 0 12px 10px 28px;
}

.hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
  padding: 10px 12px;
  list-style: none;
  border-top: 1px solid var(--rule);
  font-size: 12px;
  color: var(--sand-dim);
}

.hints li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
