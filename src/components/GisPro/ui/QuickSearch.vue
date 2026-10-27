<script lang="ts" setup>
import { computed, ref } from "vue";
import AfIcon from "./AfIcon.vue";
import { actions, state } from "./store";

const query = ref("");
const open = ref(false);
let blurTimer = 0;

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return [];
  return state.search
    .filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword),
    )
    .slice(0, 6);
});

function focusItem(id: string): void {
  actions.focus(id);
  open.value = false;
  query.value = "";
}

function show(): void {
  window.clearTimeout(blurTimer);
  open.value = true;
}

function scheduleHide(): void {
  blurTimer = window.setTimeout(() => {
    open.value = false;
  }, 160);
}
</script>

<template>
  <div class="af-search">
    <AfIcon name="search" :size="15" class="af-search__icon" />
    <input
      v-model="query"
      class="af-search__input"
      type="text"
      name="gispro-feature-search"
      placeholder="搜索井 / 站 / 管线"
      aria-label="搜索井、站库或管线"
      autocomplete="off"
      @focus="show"
      @blur="scheduleHide"
      @keydown.esc="open = false"
    />
    <span class="af-search__hint">SEARCH</span>

    <transition name="af-drop">
      <div v-if="open && query.trim()" class="af-search__drop">
        <button
          v-for="item in results"
          :key="item.id"
          type="button"
          class="af-search__item"
          @mousedown.prevent
          @click="focusItem(item.id)"
        >
          <span class="af-search__type">
            <AfIcon
              :name="item.kind === 'well' ? 'well' : item.kind === 'station' ? 'station' : 'pipeline'"
              :size="14"
            />
          </span>
          <span class="af-search__copy">
            <strong>{{ item.name }}</strong>
            <small>{{ item.sub }}</small>
          </span>
          <em>{{ item.id }}</em>
        </button>
        <div v-if="!results.length" class="af-search__empty">未找到匹配目标</div>
      </div>
    </transition>
  </div>
</template>
