<template>
  <div class="lf-page" :style="themeVars">
    <header class="lf-topbar">
      <div class="lf-brand">
        <span class="lf-mark">LF</span>
        <div class="lf-brand-text">
          <h1>井场集输管网组态</h1>
          <p>LEAFER UI 2.3 · CANVAS 2D SCHEMATIC</p>
        </div>
      </div>
      <div class="lf-toolbar">
        <button class="lf-btn" type="button" title="适应画布（F）" @click="fitView">
          适应<kbd>F</kbd>
        </button>
        <div class="lf-zoom">
          <button type="button" aria-label="缩小" @click="zoomOut">−</button>
          <span>{{ zoomText }}</span>
          <button type="button" aria-label="放大" @click="zoomIn">+</button>
        </div>
        <button
          class="lf-btn"
          :class="{ 'is-active': !flowPaused }"
          type="button"
          @click="toggleFlow"
        >
          流动 {{ flowPaused ? "暂停" : "运行" }}
        </button>
        <button
          class="lf-btn"
          :class="{ 'is-active': gridVisible }"
          type="button"
          @click="toggleGrid"
        >
          网格
        </button>
        <button
          class="lf-btn"
          :class="{ 'is-active': labelsVisible }"
          type="button"
          @click="toggleLabels"
        >
          标签
        </button>
        <button class="lf-btn" type="button" @click="resetLayout">重置</button>
        <button
          class="lf-btn is-primary"
          type="button"
          :disabled="exporting"
          @click="handleExport"
        >
          {{ exporting ? "导出中…" : "导出 PNG" }}
        </button>
      </div>
    </header>

    <div class="lf-body">
      <aside class="lf-rail lf-left">
        <div class="lf-rail-head">
          <span>设备清单</span>
          <em>{{ nodeCount }} NODES</em>
        </div>
        <div class="lf-device-list" role="listbox" aria-label="设备清单">
          <button
            v-for="node in field.nodes"
            :key="node.id"
            class="lf-device-row"
            :class="{
              'is-selected':
                selection?.type === 'node' && selection.id === node.id,
            }"
            type="button"
            role="option"
            :aria-selected="
              selection?.type === 'node' && selection.id === node.id
            "
            @click="pickNode(node.id)"
          >
            <span
              class="lf-dot"
              :style="{ background: statusColor(node.status) }"
            ></span>
            <span class="lf-device-tag">{{ node.tag }}</span>
            <span class="lf-device-name">{{ node.name }}</span>
            <span class="lf-device-kind">{{ kindLabel(node.kind) }}</span>
          </button>
        </div>
        <div class="lf-rail-foot">
          <span class="lf-foot-item">
            <i
              class="lf-dot"
              :style="{ background: statusColor('running') }"
            ></i>
            运行
          </span>
          <span class="lf-foot-item">
            <i
              class="lf-dot"
              :style="{ background: statusColor('standby') }"
            ></i>
            待机
          </span>
          <span class="lf-foot-item">
            <i
              class="lf-dot"
              :style="{ background: statusColor('maintenance') }"
            ></i>
            检修
          </span>
        </div>
      </aside>

      <main class="lf-stage">
        <div
          ref="host"
          class="lf-canvas"
          role="img"
          aria-label="井场集输管网组态画布，可通过左侧设备清单选择设备"
          :class="{ 'is-pan': spaceHeld }"
        ></div>
        <div v-if="bootError" class="lf-boot-error">{{ bootError }}</div>
        <div class="lf-stage-hint">
          <span>拖拽设备重排</span>
          <span>滚轮缩放</span>
          <span>空白拖拽平移</span>
          <span>Esc 取消选择</span>
        </div>
        <transition name="lf-toast">
          <div v-if="notice" class="lf-toast" role="status" aria-live="polite">
            {{ notice }}
          </div>
        </transition>
        <footer class="lf-statusbar">
          <span>SCHEMATIC · 演示数据，非施工图</span>
          <span class="lf-status-meta">
            <span>ZOOM {{ zoomText }}</span>
            <span>X {{ cursor.x }} · Y {{ cursor.y }}</span>
            <span>{{ nodeCount }} 设备 · {{ edgeCount }} 管线</span>
          </span>
        </footer>
      </main>

      <aside class="lf-rail lf-inspector">
        <div class="lf-rail-head">
          <span>属性检查器</span>
          <em>INSPECTOR</em>
        </div>

        <div v-if="selectedNode" class="lf-inspector-body">
          <div class="lf-node-summary">
            <span class="lf-chip">{{ kindLabel(selectedNode.kind) }}</span>
            <strong>{{ selectedNode.tag }}</strong>
            <span class="lf-summary-name">{{ selectedNode.name }}</span>
          </div>

          <el-form label-position="top" size="small" class="lf-form">
            <el-form-item label="位号">
              <el-input
                v-model="selectedNode.tag"
                maxlength="16"
                @input="syncSelectedNode"
              />
            </el-form-item>
            <el-form-item label="名称">
              <el-input
                v-model="selectedNode.name"
                maxlength="20"
                @input="syncSelectedNode"
              />
            </el-form-item>
            <div class="lf-form-grid">
              <el-form-item label="运行状态">
                <el-select
                  v-model="selectedNode.status"
                  @change="syncSelectedNode"
                >
                  <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item :label="`产量 (${selectedNode.unit})`">
                <el-input-number
                  v-model="selectedNode.rate"
                  :min="0"
                  :precision="1"
                  :step="0.1"
                  :controls="false"
                  @change="syncSelectedNode"
                />
              </el-form-item>
            </div>
            <el-form-item label="压力 (MPa)">
              <el-input-number
                v-model="selectedNode.pressure"
                :min="0"
                :precision="2"
                :step="0.1"
                :controls="false"
                @change="syncSelectedNode"
              />
            </el-form-item>
          </el-form>

          <div class="lf-meta-grid">
            <div>
              <span>坐标</span>
              <strong>
                {{ Math.round(selectedNode.x) }},
                {{ Math.round(selectedNode.y) }}
              </strong>
            </div>
            <div>
              <span>状态</span>
              <strong>{{ STATUS_LABEL[selectedNode.status] }}</strong>
            </div>
          </div>

          <div class="lf-inspector-actions">
            <button
              class="lf-btn lf-btn-dark"
              type="button"
              @click="focusSelected"
            >
              聚焦设备
            </button>
            <button
              class="lf-btn lf-btn-ghost"
              type="button"
              @click="clearSelection"
            >
              取消选择
            </button>
          </div>
        </div>

        <div v-else-if="selectedEdgeInfo" class="lf-inspector-body">
          <div class="lf-node-summary">
            <span class="lf-chip">管线</span>
            <strong>
              {{ selectedEdgeInfo.from }} → {{ selectedEdgeInfo.to }}
            </strong>
          </div>
          <div class="lf-detail-list">
            <div>
              <span>介质</span>
              <strong>{{ selectedEdgeInfo.medium }}</strong>
            </div>
            <div>
              <span>管径</span>
              <strong>DN{{ selectedEdgeInfo.dn }}</strong>
            </div>
            <div>
              <span>流动</span>
              <strong :class="{ 'is-running': selectedEdgeInfo.active }">
                {{ selectedEdgeInfo.active ? "运行中" : "未流动" }}
              </strong>
            </div>
          </div>
          <p class="lf-tip">
            管线路由随设备位置自动重算；本演示仅支持设备参数编辑。
          </p>
          <div class="lf-inspector-actions">
            <button
              class="lf-btn lf-btn-ghost"
              type="button"
              @click="clearSelection"
            >
              取消选择
            </button>
          </div>
        </div>

        <div v-else class="lf-empty">
          <p>点击画布中的设备或管线查看参数。</p>
          <ul>
            <li><kbd>F</kbd> 适应画布</li>
            <li><kbd>+</kbd> / <kbd>-</kbd> 缩放</li>
            <li><kbd>空格</kbd> + 拖拽 平移</li>
            <li><kbd>Esc</kbd> 取消选择</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Leafer" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Leafer } from "leafer-ui";
import { CameraController } from "./camera";
import {
  KIND_LABEL,
  MEDIUM_LABEL,
  STATUS_LABEL,
  createField,
  isEdgeActive,
  resetField,
} from "./data";
import { exportSheetPng } from "./export-png";
import { createInteraction } from "./interaction";
import type { InteractionApi } from "./interaction";
import { buildScene, setLabelsVisible } from "./scene";
import { STATUS_COLOR, themeCssVars } from "./theme";
import type {
  Field,
  NodeKind,
  NodeStatus,
  SceneHandles,
  Selection,
} from "./types";

const themeVars = themeCssVars();
const field = reactive<Field>(createField());
const host = ref<HTMLDivElement>();
const selection = ref<Selection>(null);
const zoom = ref(1);
const cursor = ref({ x: 0, y: 0 });
const spaceHeld = ref(false);
const flowPaused = ref(
  typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
);
const gridVisible = ref(true);
const labelsVisible = ref(true);
const exporting = ref(false);
const notice = ref("");
const bootError = ref("");

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  value: value as NodeStatus,
  label,
}));

let leafer: Leafer | null = null;
let scene: SceneHandles | null = null;
let camera: CameraController | null = null;
let api: InteractionApi | null = null;
let resizeObserver: ResizeObserver | null = null;
let noticeTimer = 0;
let previousWidth = 0;
let previousHeight = 0;

const selectedNode = computed(() => {
  const current = selection.value;
  if (current?.type !== "node") return null;
  return field.nodes.find((node) => node.id === current.id) ?? null;
});

const selectedEdgeInfo = computed(() => {
  const current = selection.value;
  if (current?.type !== "edge") return null;
  const edge = field.edges.find((item) => item.id === current.id);
  if (!edge) return null;
  const from = field.nodes.find((node) => node.id === edge.from);
  const to = field.nodes.find((node) => node.id === edge.to);
  if (!from || !to) return null;
  return {
    from: from.tag,
    to: to.tag,
    medium: MEDIUM_LABEL[edge.medium],
    dn: edge.dn,
    active: isEdgeActive(edge, field),
  };
});

const zoomText = computed(() => `${Math.round(zoom.value * 100)}%`);
const nodeCount = computed(() => field.nodes.length);
const edgeCount = computed(() => field.edges.length);

const statusColor = (status: NodeStatus): string => STATUS_COLOR[status];
const kindLabel = (kind: NodeKind): string => KIND_LABEL[kind];

onMounted(() => {
  if (!host.value) return;

  try {
    leafer = new Leafer({
      view: host.value,
      pixelRatio: Math.min(2, window.devicePixelRatio || 1),
      wheel: { disabled: true },
      move: { disabled: true },
      zoom: { disabled: true },
    });

    scene = buildScene(field);
    leafer.add(scene.world);

    camera = new CameraController(leafer, scene.world, (state) => {
      zoom.value = state.scale;
    });

    api = createInteraction({
      leafer,
      field,
      scene,
      camera,
      onSelect: (next) => {
        selection.value = next;
      },
      onCursor: (x, y) => {
        cursor.value = { x, y };
      },
      onSpace: (held) => {
        spaceHeld.value = held;
      },
    });
    api.setFlowPaused(flowPaused.value);

    resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(host.value);
    resizeCanvas();
  } catch (error) {
    bootError.value =
      error instanceof Error ? error.message : "Leafer 画布初始化失败";
  }
});

onBeforeUnmount(() => {
  window.clearTimeout(noticeTimer);
  resizeObserver?.disconnect();
  api?.destroy();
  camera?.destroy();
  leafer?.destroy();
  api = null;
  scene = null;
  camera = null;
  leafer = null;
});

function resizeCanvas(): void {
  if (!leafer || !camera || !host.value) return;
  const width = host.value.clientWidth;
  const height = host.value.clientHeight;
  if (!width || !height) return;

  leafer.resize({
    width,
    height,
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
  });
  camera.handleResize(previousWidth, previousHeight);
  previousWidth = width;
  previousHeight = height;
}

function fitView(): void {
  camera?.fitAnimated();
}

function zoomIn(): void {
  camera?.zoomBy(1.2);
}

function zoomOut(): void {
  camera?.zoomBy(1 / 1.2);
}

function toggleFlow(): void {
  flowPaused.value = !flowPaused.value;
  api?.setFlowPaused(flowPaused.value);
}

function toggleGrid(): void {
  gridVisible.value = !gridVisible.value;
  if (scene) scene.grid.visible = gridVisible.value;
}

function toggleLabels(): void {
  labelsVisible.value = !labelsVisible.value;
  if (scene) setLabelsVisible(scene, labelsVisible.value);
}

function resetLayout(): void {
  resetField(field);
  api?.syncAll();
  api?.clearSelection();
  camera?.fitAnimated();
  notify("已恢复初始布局");
}

function pickNode(id: string): void {
  api?.selectNode(id, true);
}

function focusSelected(): void {
  if (selection.value?.type === "node") {
    api?.selectNode(selection.value.id, true);
  }
}

function clearSelection(): void {
  api?.clearSelection();
}

function syncSelectedNode(): void {
  if (selection.value?.type === "node") {
    api?.syncNode(selection.value.id);
  }
}

async function handleExport(): Promise<void> {
  if (!leafer || !scene || !camera || exporting.value) return;
  exporting.value = true;
  try {
    const result = await exportSheetPng(leafer, scene, camera);
    notify(`已导出 ${result.filename}`);
  } catch (error) {
    notify(error instanceof Error ? error.message : "导出失败");
  } finally {
    exporting.value = false;
  }
}

function notify(message: string): void {
  notice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.value = "";
  }, 2600);
}
</script>

<style lang="scss" scoped>
.lf-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--lf-page);
  background-image:
    linear-gradient(rgba(29, 42, 47, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(29, 42, 47, 0.045) 1px, transparent 1px);
  background-size: 24px 24px;
  color: var(--lf-ink);
  font-family: var(--lf-font-body);
}

.lf-topbar {
  flex: none;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  background: var(--lf-panel);
  border-bottom: 1px solid #33454b;
  color: #e6ece8;
}

.lf-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.lf-mark {
  flex: none;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid #7fb3ad;
  color: #b7dcd5;
  font-family: var(--lf-font-display);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.lf-brand-text {
  min-width: 0;
}

.lf-brand-text h1 {
  margin: 0;
  font-family: var(--lf-font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f2f6f3;
  white-space: nowrap;
}

.lf-brand-text p {
  margin: 2px 0 0;
  font-family: var(--lf-font-display);
  font-size: 8px;
  letter-spacing: 1.8px;
  color: #8fa3a4;
  white-space: nowrap;
}

.lf-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.lf-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 9px;
  border: 1px solid rgba(230, 236, 232, 0.2);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.04);
  color: #d7e0db;
  font-family: var(--lf-font-body);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.lf-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(230, 236, 232, 0.36);
}

.lf-btn.is-active {
  background: rgba(47, 125, 110, 0.3);
  border-color: #6fa9a1;
  color: #dff1ec;
}

.lf-btn.is-primary {
  background: #1f6f78;
  border-color: #2f8b91;
  color: #ffffff;
}

.lf-btn.is-primary:hover {
  background: #26808a;
}

.lf-btn:focus-visible,
.lf-zoom button:focus-visible {
  outline: 2px solid #7fb3ad;
  outline-offset: 1px;
}

.lf-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.lf-btn kbd {
  font-family: var(--lf-font-mono);
  font-size: 8px;
  padding: 1px 3px;
  border: 1px solid rgba(230, 236, 232, 0.28);
  border-radius: 2px;
  color: #a9bbba;
}

.lf-zoom {
  display: flex;
  align-items: center;
  height: 28px;
  border: 1px solid rgba(230, 236, 232, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.lf-zoom button {
  width: 26px;
  height: 100%;
  border: 0;
  background: rgba(255, 255, 255, 0.04);
  color: #d7e0db;
  font-size: 13px;
  cursor: pointer;
}

.lf-zoom button:hover {
  background: rgba(255, 255, 255, 0.12);
}

.lf-zoom span {
  min-width: 46px;
  text-align: center;
  font-family: var(--lf-font-mono);
  font-size: 10px;
  color: #b9c8c5;
  font-variant-numeric: tabular-nums;
}

.lf-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 286px;
  gap: 10px;
  padding: 10px;
}

.lf-rail {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--lf-paper);
  border: 1px solid #c7c0ae;
  border-radius: 2px;
  overflow: hidden;
}

.lf-rail-head {
  flex: none;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--lf-hairline);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.lf-rail-head em {
  font-family: var(--lf-font-mono);
  font-style: normal;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: var(--lf-ink-faint);
}

.lf-device-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lf-device-row {
  appearance: none;
  width: 100%;
  display: grid;
  grid-template-columns: 7px 58px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  color: var(--lf-ink);
  font-family: var(--lf-font-body);
  text-align: left;
  cursor: pointer;
}

.lf-device-row:hover {
  background: #ece7da;
}

.lf-device-row.is-selected {
  background: var(--lf-accent-soft);
  border-color: #a8c9c4;
}

.lf-device-row:focus-visible {
  outline: 2px solid var(--lf-accent);
  outline-offset: -2px;
}

.lf-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.lf-device-tag {
  font-family: var(--lf-font-display);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.lf-device-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--lf-ink-soft);
}

.lf-device-kind {
  font-size: 9px;
  color: var(--lf-ink-faint);
  white-space: nowrap;
}

.lf-rail-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--lf-hairline);
  font-size: 10px;
  color: var(--lf-ink-soft);
}

.lf-foot-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.lf-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid #b8b09d;
  border-radius: 2px;
  background:
    radial-gradient(circle at 50% 40%, #eee9dd 0%, #e3ddce 100%);
  overflow: hidden;
}

.lf-canvas {
  position: absolute;
  inset: 0 0 30px 0;
  touch-action: none;
  user-select: none;
}

.lf-canvas.is-pan,
.lf-canvas.is-pan-ready {
  cursor: grab;
}

.lf-canvas.is-dragging {
  cursor: grabbing;
}

.lf-stage-hint {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 5px 9px;
  background: rgba(245, 242, 233, 0.86);
  border: 1px solid rgba(185, 177, 158, 0.6);
  border-radius: 2px;
  font-size: 9px;
  letter-spacing: 0.03em;
  color: var(--lf-ink-soft);
  pointer-events: none;
}

.lf-statusbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  background: rgba(245, 242, 233, 0.94);
  border-top: 1px solid var(--lf-hairline);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--lf-ink-faint);
  font-variant-numeric: tabular-nums;
}

.lf-status-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--lf-font-mono);
}

.lf-boot-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(245, 242, 233, 0.94);
  color: #b24a3f;
  font-size: 12px;
  text-align: center;
}

.lf-toast {
  position: absolute;
  left: 50%;
  bottom: 44px;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 7px 14px;
  background: var(--lf-panel);
  border: 1px solid #3c5258;
  border-radius: 2px;
  color: #dfe8e4;
  font-size: 11px;
  box-shadow: 0 6px 18px rgba(20, 30, 32, 0.18);
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lf-toast-enter-active,
.lf-toast-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.lf-toast-enter-from,
.lf-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}

.lf-inspector-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.lf-node-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--lf-hairline);
}

.lf-node-summary strong {
  font-family: var(--lf-font-display);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.lf-summary-name {
  font-size: 10px;
  color: var(--lf-ink-soft);
}

.lf-chip {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  background: var(--lf-accent-soft);
  border: 1px solid #b9d4cf;
  border-radius: 2px;
  font-size: 9px;
  color: #25656d;
}

.lf-form {
  margin-top: 2px;
}

.lf-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.lf-form :deep(.el-form-item__label) {
  padding-bottom: 2px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--lf-ink-soft);
}

.lf-form :deep(.el-input__wrapper),
.lf-form :deep(.el-select__wrapper) {
  background: #fbf9f3;
  box-shadow: 0 0 0 1px var(--lf-hairline) inset;
  border-radius: 2px;
}

.lf-form :deep(.el-input__wrapper.is-focus),
.lf-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--lf-accent) inset;
}

.lf-form :deep(.el-input__inner),
.lf-form :deep(.el-select__placeholder) {
  font-size: 11px;
  color: var(--lf-ink);
}

.lf-form :deep(.el-input-number) {
  width: 100%;
}

.lf-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.lf-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px 0;
  margin-top: 2px;
  border-top: 1px solid var(--lf-hairline);
}

.lf-meta-grid div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lf-meta-grid span {
  font-size: 9px;
  color: var(--lf-ink-faint);
}

.lf-meta-grid strong {
  font-family: var(--lf-font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--lf-ink-soft);
  font-variant-numeric: tabular-nums;
}

.lf-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lf-detail-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--lf-hairline);
  font-size: 11px;
}

.lf-detail-list span {
  color: var(--lf-ink-faint);
  font-size: 10px;
}

.lf-detail-list strong {
  font-family: var(--lf-font-display);
  font-weight: 500;
  color: var(--lf-ink);
}

.lf-detail-list strong.is-running {
  color: #2f7d6e;
}

.lf-tip {
  margin: 12px 0 0;
  font-size: 10px;
  line-height: 1.6;
  color: var(--lf-ink-faint);
}

.lf-inspector-actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.lf-btn-dark {
  flex: 1;
  justify-content: center;
  background: var(--lf-panel);
  border-color: var(--lf-panel);
  color: #e8eeea;
}

.lf-btn-dark:hover {
  background: #2b3d42;
  border-color: #2b3d42;
}

.lf-btn-ghost {
  flex: 1;
  justify-content: center;
  background: transparent;
  border-color: #c3bcaa;
  color: var(--lf-ink-soft);
}

.lf-btn-ghost:hover {
  background: #ece7da;
  border-color: #b5ad99;
}

.lf-empty {
  flex: 1;
  padding: 18px 14px;
  color: var(--lf-ink-soft);
}

.lf-empty p {
  margin: 0 0 14px;
  font-size: 11px;
  line-height: 1.7;
}

.lf-empty ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lf-empty li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--lf-ink-faint);
}

.lf-empty kbd {
  min-width: 36px;
  padding: 2px 5px;
  border: 1px solid var(--lf-hairline);
  border-bottom-width: 2px;
  border-radius: 2px;
  background: #fbf9f3;
  font-family: var(--lf-font-mono);
  font-size: 9px;
  color: var(--lf-ink-soft);
  text-align: center;
}

@media (max-width: 1240px) {
  .lf-body {
    grid-template-columns: 200px minmax(0, 1fr) 250px;
  }

  .lf-device-row {
    grid-template-columns: 7px 54px minmax(0, 1fr);
  }

  .lf-device-kind {
    display: none;
  }

  .lf-btn kbd {
    display: none;
  }
}

@media (max-width: 1080px) {
  .lf-brand-text p {
    display: none;
  }

  .lf-toolbar {
    gap: 4px;
  }

  .lf-btn {
    padding: 0 7px;
  }
}

@media (max-width: 940px) {
  .lf-body {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .lf-inspector {
    display: none;
  }

  .lf-device-name {
    display: none;
  }

  .lf-device-row {
    grid-template-columns: 7px minmax(0, 1fr);
  }
}
</style>
