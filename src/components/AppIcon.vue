<script setup lang="ts">
import { computed } from 'vue'

export type IconName =
  'settings' | 'database' | 'alert' | 'filter' | 'list' | 'shield' | 'user' | 'sun' | 'moon'

interface IconShape {
  tag: 'path' | 'circle' | 'ellipse' | 'line' | 'polygon'
  attributes: Record<string, string>
}

const props = defineProps<{ name: IconName }>()

const iconShapes: Record<IconName, IconShape[]> = {
  settings: [
    { tag: 'circle', attributes: { cx: '12', cy: '12', r: '3' } },
    {
      tag: 'path',
      attributes: {
        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
      }
    }
  ],
  database: [
    { tag: 'ellipse', attributes: { cx: '12', cy: '5', rx: '9', ry: '3' } },
    { tag: 'path', attributes: { d: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' } },
    { tag: 'path', attributes: { d: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' } }
  ],
  alert: [
    {
      tag: 'path',
      attributes: {
        d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
      }
    },
    { tag: 'line', attributes: { x1: '12', y1: '9', x2: '12', y2: '13' } },
    { tag: 'line', attributes: { x1: '12', y1: '17', x2: '12.01', y2: '17' } }
  ],
  filter: [
    { tag: 'polygon', attributes: { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' } }
  ],
  list: [
    { tag: 'line', attributes: { x1: '8', y1: '6', x2: '21', y2: '6' } },
    { tag: 'line', attributes: { x1: '8', y1: '12', x2: '21', y2: '12' } },
    { tag: 'line', attributes: { x1: '8', y1: '18', x2: '21', y2: '18' } },
    { tag: 'line', attributes: { x1: '3', y1: '6', x2: '3.01', y2: '6' } },
    { tag: 'line', attributes: { x1: '3', y1: '12', x2: '3.01', y2: '12' } },
    { tag: 'line', attributes: { x1: '3', y1: '18', x2: '3.01', y2: '18' } }
  ],
  shield: [{ tag: 'path', attributes: { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' } }],
  sun: [
    { tag: 'circle', attributes: { cx: '12', cy: '12', r: '4' } },
    { tag: 'line', attributes: { x1: '12', y1: '2', x2: '12', y2: '4' } },
    { tag: 'line', attributes: { x1: '12', y1: '20', x2: '12', y2: '22' } },
    { tag: 'line', attributes: { x1: '4.93', y1: '4.93', x2: '6.34', y2: '6.34' } },
    { tag: 'line', attributes: { x1: '17.66', y1: '17.66', x2: '19.07', y2: '19.07' } },
    { tag: 'line', attributes: { x1: '2', y1: '12', x2: '4', y2: '12' } },
    { tag: 'line', attributes: { x1: '20', y1: '12', x2: '22', y2: '12' } },
    { tag: 'line', attributes: { x1: '4.93', y1: '19.07', x2: '6.34', y2: '17.66' } },
    { tag: 'line', attributes: { x1: '17.66', y1: '6.34', x2: '19.07', y2: '4.93' } }
  ],
  moon: [{ tag: 'path', attributes: { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' } }],
  user: [
    { tag: 'path', attributes: { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' } },
    { tag: 'circle', attributes: { cx: '12', cy: '7', r: '4' } }
  ]
}

const shapes = computed(() => iconShapes[props.name])
</script>

<template>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <component
      :is="shape.tag"
      v-for="(shape, shapeIndex) in shapes"
      :key="shapeIndex"
      v-bind="shape.attributes"
    />
  </svg>
</template>
