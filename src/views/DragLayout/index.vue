<template>
  <div ref="rootEl" class="drag-layout">
    <aside class="left-container">
      <Left @add="addCard" />
    </aside>

    <main class="main-container">
      <div class="canvas-toolbar">
        <span class="canvas-title">拖拽布局</span>
        <div class="canvas-actions">
          <el-button @click="resetToDefault">恢复默认布局</el-button>
          <el-button type="danger" plain :disabled="!items.length" @click="clearAll">
            清空画布
          </el-button>
        </div>
      </div>

      <div class="canvas-body">
        <GridStackVue
          ref="gridRef"
          :options="gridOptions"
          @added="onAdded"
          @change="schedulePersist"
          @dragstart="onDragStart"
        >
          <GridStackItem
            v-for="item in items"
            :key="item.id"
            :id="item.id"
            :options="{ id: item.id }"
          >
            <ChartCard
              :title="item.props.title"
              :chart-type="item.props.chartType"
              :theme="item.props.theme"
              :selected="item.id === selectedId"
              @select="selectCard(item.id)"
              @remove="removeCard(item.id)"
            />
          </GridStackItem>
        </GridStackVue>
        <div v-if="!items.length" class="canvas-empty">
          从左侧拖入图表，或点击「恢复默认布局」
        </div>
      </div>
    </main>

    <aside class="right-container">
      <PropertyPanel :item="selectedItem" @update="updateSelected" @remove="removeSelected" />
    </aside>
  </div>
</template>

<script lang="ts">
export default { name: "DragLayout" };
</script>
<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { GridStack as GridStackCore, Utils, type GridStack } from "gridstack";
import {
  GridStack as GridStackVue,
  GridStackItem,
  type GridStackNode,
  type GridStackOptions,
  type GridStackWidget,
} from "gridstack/dist/vue";
import "gridstack/dist/gridstack.min.css";
import Left from "./components/left.vue";
import ChartCard from "./components/ChartCard.vue";
import PropertyPanel from "./components/PropertyPanel.vue";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  GRID_COLUMNS,
  GRID_MARGIN,
  PANELS,
  createId,
  createProps,
  defaultCards,
  type CardItem,
  type CardProps,
  type ChartType,
} from "./types";
import { loadLayout, saveLayout } from "./layout-storage";

type NodeWithProps = GridStackNode & { props?: Partial<CardProps> };
type WidgetSpec = GridStackWidget & { props?: Record<string, unknown> };

const rootEl = ref<HTMLElement>();
const gridRef = shallowRef<{ getGrid: () => GridStack | null }>();
const getGrid = () => gridRef.value?.getGrid() ?? null;

const initialItems = loadLayout() ?? defaultCards();
const items = ref<CardItem[]>(initialItems);
const selectedId = ref<string | null>(null);
const selectedItem = computed(
  () => items.value.find((item) => item.id === selectedId.value) ?? null,
);

const toWidget = (card: CardItem): GridStackWidget => ({
  id: card.id,
  x: card.x,
  y: card.y,
  w: card.w,
  h: card.h,
});

const gridOptions: GridStackOptions = {
  column: GRID_COLUMNS,
  cellHeight: 100,
  margin: GRID_MARGIN,
  animate: true,
  mode: "float",
  acceptWidgets: true,
  draggable: { handle: ".card-head" },
  resizable: { handles: "all" },
  children: initialItems.map(toWidget),
};

let dragGhost: HTMLElement | null = null;

function getDropSize() {
  const grid = getGrid();
  const cellWidth = grid?.cellWidth() ?? 110;
  const cellHeight = grid?.getCellHeight(true) ?? 100;
  return {
    width: CARD_WIDTH * cellWidth - GRID_MARGIN * 2,
    height: CARD_HEIGHT * cellHeight - GRID_MARGIN * 2,
  };
}

function createDragGhost(source: HTMLElement) {
  const { width, height } = getDropSize();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.style.width = `${width}px`;
  ghost.style.height = `${height}px`;

  const head = document.createElement("div");
  head.className = "drag-ghost-head";
  head.textContent = source.querySelector(".left-item-title")?.textContent?.trim() ?? "";

  const body = document.createElement("div");
  body.className = "drag-ghost-body";
  const sourceImage = source.querySelector("img");
  if (sourceImage) {
    const image = document.createElement("img");
    image.src = sourceImage.getAttribute("src") ?? "";
    image.alt = sourceImage.getAttribute("alt") ?? "";
    body.appendChild(image);
  }

  ghost.append(head, body);
  dragGhost = ghost;
  return ghost;
}

function syncDragGhost(event: Event) {
  if (!dragGhost) return;

  const pointer = event as MouseEvent;
  const { width, height } = getDropSize();

  // gridstack 会用源元素尺寸覆盖 helper，这里改回目标格子大小，并让光标落在预览中心
  dragGhost.style.width = `${width}px`;
  dragGhost.style.height = `${height}px`;
  dragGhost.style.left = `${pointer.clientX - width / 2}px`;
  dragGhost.style.top = `${pointer.clientY - height / 2}px`;
}

function resetDragGhost() {
  dragGhost = null;
}

let saveTimer: number | undefined;

function flushPersist() {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }

  const grid = getGrid();
  saveLayout(
    items.value.map((item) => {
      const node = grid ? Utils.findInGrid(grid, item.id) : undefined;
      return {
        ...item,
        x: node?.x ?? item.x,
        y: node?.y ?? item.y,
        w: node?.w ?? item.w,
        h: node?.h ?? item.h,
      };
    }),
  );
}

function schedulePersist() {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flushPersist, 300);
}

watch(items, schedulePersist, { deep: true });

async function refreshDragHandles() {
  await nextTick();
  const grid = getGrid();
  if (!grid) return;

  items.value.forEach((item) => {
    const node = Utils.findInGrid(grid, item.id);
    if (node?.el) grid.refreshDragHandles(node.el);
  });
}

function onAdded(_event: Event, nodes: GridStackNode[]) {
  let changed = false;

  nodes.forEach((rawNode) => {
    const node = rawNode as NodeWithProps;
    if (node.id && items.value.some((item) => item.id === node.id)) return;

    const id = node.id ?? createId();
    node.id = id;

    const props = createProps(node.props?.chartType ?? "line", node.props?.title);
    node.props = props;

    items.value.push({
      id,
      x: node.x ?? 0,
      y: node.y ?? 0,
      w: node.w ?? CARD_WIDTH,
      h: node.h ?? CARD_HEIGHT,
      props,
    });
    changed = true;
  });

  if (!changed) return;
  void refreshDragHandles();
  schedulePersist();
}

function onDragStart(_event: Event, element: HTMLElement) {
  const id = (element as HTMLElement & { gridstackNode?: GridStackNode }).gridstackNode?.id;
  if (id) selectedId.value = id;
}

function selectCard(id: string) {
  selectedId.value = id;
}

function addCard(type: ChartType) {
  const spec: WidgetSpec = {
    w: CARD_WIDTH,
    h: CARD_HEIGHT,
    autoPosition: true,
    props: { chartType: type },
  };
  getGrid()?.addWidget(spec);
}

function removeCard(id: string) {
  const grid = getGrid();
  const node = grid ? Utils.findInGrid(grid, id) : undefined;
  // 先移除 grid 节点，再删数组项，避免 GridStackItem 卸载时留下孤儿 DOM
  if (grid && node?.el) grid.removeWidget(node.el);

  items.value = items.value.filter((item) => item.id !== id);
  if (selectedId.value === id) selectedId.value = null;
  schedulePersist();
}

function removeSelected() {
  if (selectedId.value) removeCard(selectedId.value);
}

function clearAll() {
  const grid = getGrid();
  if (!grid) return;

  grid.removeAll(true);
  items.value = [];
  selectedId.value = null;
  flushPersist();
}

function resetToDefault() {
  const grid = getGrid();
  if (!grid) return;

  const next = defaultCards();
  grid.removeAll(true);
  items.value = next;
  grid.batchUpdate();
  next.forEach((card) => grid.addWidget(toWidget(card)));
  grid.batchUpdate(false);

  selectedId.value = null;
  void refreshDragHandles();
  schedulePersist();
}

function updateSelected(patch: Partial<CardProps>) {
  const item = selectedItem.value;
  if (!item) return;
  item.props = { ...item.props, ...patch };
}

onMounted(() => {
  const paletteElements = Array.from(
    rootEl.value?.querySelectorAll<HTMLElement>(".left-item") ?? [],
  );
  if (paletteElements.length) {
    const dragInWidgets: WidgetSpec[] = PANELS.map((panel) => ({
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
      props: { chartType: panel.type },
    }));
    GridStackCore.setupDragIn(
      paletteElements,
      {
        appendTo: "body",
        helper: createDragGhost,
        start: syncDragGhost,
        drag: syncDragGhost,
        stop: resetDragGhost,
      },
      dragInWidgets,
    );
  }

  window.addEventListener("beforeunload", flushPersist);
  void refreshDragHandles();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", flushPersist);
  flushPersist();
});
</script>

<style lang="scss" scoped>
.drag-layout {
  display: flex;
  min-height: 100%;
  overflow-x: hidden;
}

.left-container {
  flex: 0 0 400px;
  background-color: #ccc;
}

.main-container {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 900px;
  background-color: #eee;
}

.right-container {
  flex: 0 0 400px;
  padding: 10px;
  overflow: auto;
  background-color: #ccc;
}

.canvas-toolbar {
  display: flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.canvas-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.canvas-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px;
  overflow: auto;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
  pointer-events: none;
}

:deep(.gs-wrapper) {
  height: 100%;
}

:deep(.grid-stack) {
  min-height: 100%;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: var(--gs-column-width) var(--gs-cell-height);
}

:deep(.grid-stack-placeholder > .placeholder-content) {
  background: rgba(64, 158, 255, 0.2);
  border: 1px dashed #409eff;
}

:deep(.grid-stack > .grid-stack-item > .grid-stack-item-content) {
  overflow: hidden;
}

:global(.drag-ghost) {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: none;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px dashed #409eff;
  border-radius: 4px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

:global(.drag-ghost-head) {
  display: flex;
  flex: 0 0 34px;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
}

:global(.drag-ghost-body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

:global(.drag-ghost-body img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
