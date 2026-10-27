<script lang="ts" setup>
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    flush?: boolean;
  }>(),
  { subtitle: "", flush: false },
);
</script>

<template>
  <section class="af-panel" :class="{ 'af-panel--flush': flush }">
    <header class="af-panel__head">
      <div class="af-panel__title">
        <span class="af-panel__bar"></span>
        <span>{{ title }}</span>
        <small v-if="subtitle">{{ subtitle }}</small>
      </div>
      <div class="af-panel__extra">
        <slot name="extra" />
      </div>
    </header>
    <div class="af-panel__body">
      <slot />
    </div>
  </section>
</template>
