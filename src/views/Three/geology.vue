<template>
  <div class="geo" :style="cssVars()">
    <div class="geo-stage" ref="host"></div>

    <aside class="geo-panel geo-left">
      <h2 class="geo-title">程序化地质体</h2>
      <p class="geo-sub">
        {{ extentText }} m 块段 · {{ STRATA.length }} 套岩性层 ·
        {{ STATION_COUNT }} 座站库
      </p>

      <h3 class="geo-group">地形垂直夸张</h3>
      <el-slider
        v-model="exaggeration"
        :min="0.5"
        :max="3"
        :step="0.1"
        :format-tooltip="(v: number) => `${v.toFixed(1)} 倍`"
        @input="onExaggeration"
      />

      <h3 class="geo-group">剖切</h3>
      <div class="geo-row">
        <span>启用</span>
        <el-switch v-model="clipEnabled" @change="applyClip" />
      </div>
      <el-button-group class="geo-axis">
        <el-button
          size="small"
          :type="clipAxis === 'x' ? 'primary' : 'default'"
          @click="setClipAxis('x')"
          >沿 X 切</el-button
        >
        <el-button
          size="small"
          :type="clipAxis === 'z' ? 'primary' : 'default'"
          @click="setClipAxis('z')"
          >沿 Z 切</el-button
        >
      </el-button-group>
      <el-slider
        v-model="clipKeep"
        :min="0"
        :max="100"
        :disabled="!clipEnabled"
        :format-tooltip="(v: number) => `保留 ${v}%`"
        @input="applyClip"
      />

      <h3 class="geo-group">渲染</h3>
      <div class="geo-row">
        <span>后处理 SMAA</span>
        <el-switch v-model="postProcessing" @change="onPost" />
      </div>
      <div class="geo-row">
        <span>按需出图</span>
        <el-switch v-model="onDemand" @change="onOnDemand" />
      </div>
      <div class="geo-row">
        <span>阴影</span>
        <el-switch v-model="shadows" @change="onShadows" />
      </div>
      <div class="geo-row">
        <span>自动旋转</span>
        <el-switch v-model="autoRotate" @change="onAutoRotate" />
      </div>
      <div class="geo-row">
        <span>地形线框</span>
        <el-switch v-model="wireframe" @change="onWireframe" />
      </div>

      <h3 class="geo-group">
        岩心层组
        <el-switch
          v-model="layerNames"
          size="small"
          @change="onLayerNames"
          title="层名标签"
        />
      </h3>
      <ul class="geo-layers">
        <li v-for="(layer, i) in layerMeta" :key="layer.name">
          <button
            class="geo-layer"
            :class="{ 'is-off': !layerVisible[i] }"
            @click="toggleLayer(i)"
          >
            <i class="sw" :style="{ background: layer.color }"></i>
            <span class="nm">{{ layer.name }}</span>
            <span class="dp">{{ layer.top }}–{{ layer.bottom }} m</span>
          </button>
        </li>
      </ul>

      <el-button size="small" class="geo-reset" @click="resetView"
        >重置视角</el-button
      >
    </aside>

    <aside class="geo-panel geo-right">
      <h3 class="geo-group">渲染指标</h3>
      <dl class="geo-kpi">
        <div>
          <dt>刷新</dt>
          <dd>{{ metrics.fps.toFixed(0) }} <i>fps</i></dd>
        </div>
        <div>
          <dt>出图</dt>
          <dd>{{ metrics.renderHz.toFixed(0) }} <i>次/秒</i></dd>
        </div>
        <div>
          <dt>CPU 提交</dt>
          <dd>{{ metrics.frameMs.toFixed(1) }} <i>ms</i></dd>
        </div>
        <div>
          <dt>Draw Call</dt>
          <dd>{{ metrics.drawCalls }}</dd>
        </div>
        <div>
          <dt>三角面</dt>
          <dd>{{ metrics.triangles.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>几何体</dt>
          <dd>{{ metrics.geometries }}</dd>
        </div>
        <div>
          <dt>纹理</dt>
          <dd>{{ metrics.textures }}</dd>
        </div>
        <div>
          <dt>像素比</dt>
          <dd>{{ metrics.dpr.toFixed(2) }}</dd>
        </div>
      </dl>

      <h3 class="geo-group">选中对象</h3>
      <div v-if="selection" class="geo-sel">
        <p class="geo-sel-title">{{ selection.title }}</p>
        <dl>
          <div v-for="row in selection.rows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </div>
      <p v-else class="geo-empty">点击地形、岩层、井眼或站库</p>
    </aside>

    <footer class="geo-status">
      <span>{{ pointerText }}</span>
      <span>拖动旋转 · 滚轮缩放 · F 聚焦 · Esc 取消选中</span>
      <span class="geo-tag">程序化生成 · 零外部资源</span>
    </footer>
  </div>
</template>

<script lang="ts">
export default { name: "ThreeGeology" };
</script>
<script lang="ts" setup>
import * as THREE from "three";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createStage, type Stage } from "./geology/core/stage";
import { createTerrain, type Terrain } from "./geology/core/terrain";
import { createGeology, type GeologyBody } from "./geology/core/geology";
import { createPicker, type PickResult } from "./geology/core/picking";
import {
  cssVars,
  PALETTE,
  SCENE,
  STATION_COUNT,
  STRATA,
} from "./geology/core/tokens";

interface SelectionInfo {
  title: string;
  rows: { label: string; value: string }[];
  /** 只存数字，Three 对象一律不进响应式 */
  point: [number, number, number];
}

const host = ref<HTMLElement>();
// 引擎对象用普通引用持有，避免 Vue 深度遍历整个场景图
let stage: Stage | null = null;
let terrain: Terrain | null = null;
let body: GeologyBody | null = null;
let picker: ReturnType<typeof createPicker> | null = null;
let marker: THREE.Mesh | null = null;
let metricsTimer = 0;
let highlighted: {
  material: THREE.MeshStandardMaterial;
  emissive: number;
  intensity: number;
} | null = null;

const exaggeration = ref(1);
const clipEnabled = ref(true);
const clipAxis = ref<"x" | "z">("x");
const clipKeep = ref(50);
const postProcessing = ref(false);
const onDemand = ref(true);
const shadows = ref(true);
const autoRotate = ref(false);
const wireframe = ref(false);
const layerNames = ref(true);
const layerVisible = ref<boolean[]>(STRATA.map(() => true));
const selection = ref<SelectionInfo | null>(null);
const pointerText = ref("光标未命中场景");
const metrics = ref({
  fps: 0,
  renderHz: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  dpr: 1,
});

const extentText = `${SCENE.width}×${SCENE.depth}`;

/** 层顶/层底只依赖静态配置，挂载前算一次即可 */
let acc = 0;
const layerMeta = STRATA.map((s) => {
  const top = acc;
  acc += s.thickness;
  return { name: s.name, color: s.color, top, bottom: acc };
});

const clipPlane = new THREE.Plane();
const NORMAL_X = new THREE.Vector3(-1, 0, 0);
const NORMAL_Z = new THREE.Vector3(0, 0, -1);
/** 只有岩体、层界线和站库参与剖切，井眼被排除在外 */
let clipTargets: THREE.Material[] = [];

/** keep% 表示保留多少宽度的岩体；法线取负方向，切掉的是 +X / +Z 那半边 */
const applyClip = () => {
  if (!stage || !body) return;
  const half = clipAxis.value === "x" ? SCENE.width / 2 : SCENE.depth / 2;
  const limit = THREE.MathUtils.lerp(-half, half, clipKeep.value / 100);
  clipPlane.set(clipAxis.value === "x" ? NORMAL_X : NORMAL_Z, limit);
  const planes = clipEnabled.value ? [clipPlane] : [];
  clipTargets.forEach((material) => {
    material.clippingPlanes = planes;
  });
  // 关掉剖切时，深度轴和层名退回岩体自身的角点
  body.placeAxis(clipAxis.value, clipEnabled.value ? limit : half);
  stage.invalidate();
  layoutLabels();
};

const setClipAxis = (axis: "x" | "z") => {
  clipAxis.value = axis;
  applyClip();
};

/** 剖切掉的那半边照样能被射线命中，按裁剪面把假命中剔掉 */
const acceptHit = (point: THREE.Vector3) =>
  !clipEnabled.value || clipPlane.distanceToPoint(point) >= 0;

const labelScratch = new THREE.Vector3();
/** 俯视时 9 个层名会挤成一叠，按屏幕间距逐个隐藏，保留先出现的 */
const layoutLabels = () => {
  const current = stage;
  if (!body || !current) return;
  current.camera.updateMatrixWorld();
  const height = current.renderer.domElement.clientHeight;
  const kept: number[] = [];
  body.layers.forEach((layer) => {
    const element = layer.label.element as HTMLElement;
    if (!layerNames.value || !layer.mesh.visible) {
      element.style.visibility = "hidden";
      return;
    }
    layer.label.getWorldPosition(labelScratch).project(current.camera);
    const y = ((1 - labelScratch.y) / 2) * height;
    if (labelScratch.z > 1 || kept.some((used) => Math.abs(used - y) < 18)) {
      element.style.visibility = "hidden";
      return;
    }
    kept.push(y);
    element.style.visibility = "visible";
  });
};

const onExaggeration = (value: number | number[]) => {
  body?.setExaggeration(Number(value));
  stage?.invalidate();
};
// el-switch 的 change 会带出联合类型，v-model 已经写好 ref，处理器直接读 ref
const onPost = () => stage?.setPostProcessing(postProcessing.value);
const onOnDemand = () => stage?.setOnDemand(onDemand.value);
const onShadows = () => stage?.setShadows(shadows.value);
const onAutoRotate = () => stage?.setAutoRotate(autoRotate.value);
const onWireframe = () => {
  terrain?.setWireframe(wireframe.value);
  stage?.invalidate();
};
const onLayerNames = () => {
  body?.setLayerNameVisible(layerNames.value);
  stage?.invalidate();
  layoutLabels();
};
const toggleLayer = (index: number) => {
  const next = !layerVisible.value[index];
  layerVisible.value[index] = next;
  body?.setLayerVisible(index, next);
  if (!layerNames.value) body?.setLayerNameVisible(false);
  stage?.invalidate();
  layoutLabels();
};
const resetView = () => stage?.resetView();

const clearHighlight = () => {
  if (highlighted) {
    highlighted.material.emissive.setHex(highlighted.emissive);
    highlighted.material.emissiveIntensity = highlighted.intensity;
    highlighted = null;
  }
  body?.setStationHighlight(null);
  if (marker) marker.visible = false;
};

const describe = (hit: PickResult): SelectionInfo | null => {
  if (!body || !terrain) return null;
  const kind = hit.object.userData.kind as string;
  const p = hit.point;

  if (kind === "stratum") {
    const layer = body.layers[hit.object.userData.layerIndex as number];
    if (!layer) return null;
    return {
      title: layer.stratum.name,
      point: [p.x, p.y, p.z],
      rows: [
        { label: "层顶埋深", value: `${layer.topDepth.toFixed(1)} m` },
        { label: "层底埋深", value: `${layer.bottomDepth.toFixed(1)} m` },
        { label: "层厚", value: `${layer.stratum.thickness.toFixed(1)} m` },
        { label: "命中深度", value: `${(-p.y).toFixed(1)} m` },
      ],
    };
  }

  if (kind === "well") {
    const readout = body.wellReadout(p);
    return {
      title: "井眼轨迹",
      point: [p.x, p.y, p.z],
      rows: [
        { label: "测深", value: `${readout.measured.toFixed(1)} m` },
        { label: "垂深", value: `${readout.vertical.toFixed(1)} m` },
        {
          label: "水平位移",
          value: `${(readout.measured - readout.vertical).toFixed(1)} m`,
        },
        { label: "完钻井深", value: `${body.wellDepth.toFixed(0)} m` },
      ],
    };
  }

  if (kind === "station") {
    const index = hit.instanceId;
    if (index === null || !body.stations[index]) return null;
    const station = body.stations[index];
    return {
      title: station.name,
      point: [p.x, p.y, p.z],
      rows: [
        { label: "实例下标", value: String(index) },
        { label: "状态", value: station.status === "busy" ? "运行中" : "正常" },
        { label: "地面高程", value: `${station.elevation.toFixed(1)} m` },
        {
          label: "平面坐标",
          value: `${station.x.toFixed(0)}, ${station.z.toFixed(0)}`,
        },
      ],
    };
  }

  const normalized = terrain.normalizedAt(p.x, p.z);
  return {
    title: "地表高程",
    point: [p.x, p.y, p.z],
    rows: [
      { label: "高程", value: `${p.y.toFixed(1)} m` },
      { label: "归一化高程", value: `${(normalized * 100).toFixed(1)} %` },
      {
        label: "平面坐标",
        value: `${p.x.toFixed(0)}, ${p.z.toFixed(0)}`,
      },
      { label: "高程场", value: `${SCENE.relief} m 幅值 · 5 阶 fBm` },
    ],
  };
};

const select = (hit: PickResult) => {
  const info = describe(hit);
  clearHighlight();
  if (!info) {
    selection.value = null;
    return;
  }
  selection.value = info;

  const kind = hit.object.userData.kind as string;
  // 发光只给「选中了哪一层」这个语义；井眼和地形靠命中点标记指示就够了
  if (kind === "stratum") {
    const material = (hit.object as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    highlighted = {
      material,
      emissive: material.emissive.getHex(),
      intensity: material.emissiveIntensity,
    };
    material.emissive.set(PALETTE.select);
    material.emissiveIntensity = 0.34;
  } else if (kind === "station" && hit.instanceId !== null) {
    body?.setStationHighlight(hit.instanceId);
  }
  if (marker) {
    marker.position.copy(hit.point);
    marker.visible = true;
  }
  stage?.invalidate();
};

const clearSelection = () => {
  clearHighlight();
  selection.value = null;
  stage?.invalidate();
};

const focusSelection = () => {
  if (!stage || !selection.value) return;
  const target = new THREE.Vector3(...selection.value.point);
  // 保持当前观察方位与距离，只把视线挪到目标上；
  // 固定小距离会让镜头在垂直夸张后直接扎进岩体
  const direction = new THREE.Vector3()
    .subVectors(stage.camera.position, stage.controls.target)
    .normalize();
  const distance = THREE.MathUtils.clamp(
    stage.camera.position.distanceTo(stage.controls.target),
    220,
    520
  );
  stage.flyTo(target.clone().addScaledVector(direction, distance), target);
};

let downX = 0;
let downY = 0;
const onClick = (event: MouseEvent) => {
  // 轨道拖拽结束时也会派发 click，位移超过阈值就不算选中
  if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return;
  const hit = picker?.pick(event.clientX, event.clientY, pickTargets(), acceptHit);
  if (hit) select(hit);
  else clearSelection();
};

const onPointerDown = (event: PointerEvent) => {
  downX = event.clientX;
  downY = event.clientY;
};

let lastHoverAt = 0;
const pickTargets = (): THREE.Object3D[] => {
  const list: THREE.Object3D[] = [];
  if (terrain) list.push(terrain.mesh);
  if (body) list.push(body.group);
  return list;
};

const onPointerMove = (event: PointerEvent) => {
  if (!picker || !stage || !terrain) return;
  const now = performance.now();
  if (now - lastHoverAt < 60) return;
  lastHoverAt = now;
  const hit = picker.pick(event.clientX, event.clientY, pickTargets(), acceptHit);
  stage.renderer.domElement.style.cursor = hit ? "pointer" : "grab";
  if (!hit) {
    pointerText.value = "光标未命中场景";
    return;
  }
  if (hit.object.userData.kind === "station" && hit.instanceId !== null) {
    const station = body?.stations[hit.instanceId];
    if (station) {
      pointerText.value = `悬停 ${station.name} · 高程 ${station.elevation.toFixed(1)} m`;
      return;
    }
  }
  const level =
    hit.point.y < 0
      ? `深度 ${(-hit.point.y).toFixed(1)} m`
      : `高程 ${hit.point.y.toFixed(1)} m`;
  pointerText.value = `悬停 x ${hit.point.x.toFixed(0)} / z ${hit.point.z.toFixed(
    0
  )} · ${level}`;
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") clearSelection();
  else if (event.key === "f" || event.key === "F") focusSelection();
};

onMounted(() => {
  const element = host.value!;
  terrain = createTerrain();
  stage = createStage(element);
  stage.scene.add(terrain.mesh);
  body = createGeology(terrain);
  stage.scene.add(body.group);

  marker = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 12),
    new THREE.MeshBasicMaterial({
      color: PALETTE.select,
      depthTest: false,
      transparent: true,
      opacity: 0.92,
    })
  );
  // 标记只是命中指示，不参与拾取
  marker.raycast = () => {};
  marker.renderOrder = 999;
  marker.visible = false;
  stage.scene.add(marker);

  picker = createPicker(stage.renderer.domElement, stage.camera);
  clipTargets = [terrain.material, ...body.clipMaterials];
  applyClip();

  const dom = stage.renderer.domElement;
  dom.style.cursor = "grab";
  dom.addEventListener("pointerdown", onPointerDown);
  dom.addEventListener("click", onClick);
  dom.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKeyDown);
  stage.controls.addEventListener("change", layoutLabels);
  layoutLabels();

  metricsTimer = window.setInterval(() => {
    if (stage) metrics.value = stage.stats();
  }, 500);
});

onBeforeUnmount(() => {
  window.clearInterval(metricsTimer);
  window.removeEventListener("keydown", onKeyDown);
  if (stage) {
    const dom = stage.renderer.domElement;
    dom.removeEventListener("pointerdown", onPointerDown);
    dom.removeEventListener("click", onClick);
    dom.removeEventListener("pointermove", onPointerMove);
    stage.controls.removeEventListener("change", layoutLabels);
  }
  highlighted = null;
  stage?.dispose();
  stage = null;
  terrain = null;
  body = null;
  picker = null;
  marker = null;
});
</script>

<style lang="scss" scoped>
.geo {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--geo-canvas);
  color: var(--geo-ink);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.geo-stage {
  position: absolute;
  inset: 0;
}

.geo-panel {
  position: absolute;
  padding: 12px 14px;
  background: var(--geo-panel);
  border: 1px solid var(--geo-hairline);
  border-radius: 2px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 26px rgba(20, 40, 60, 0.08);
}

.geo-left {
  top: 16px;
  left: 16px;
  width: 258px;
  max-height: calc(100% - 60px);
  overflow-y: auto;
  scrollbar-width: thin;

  :deep(.el-slider) {
    height: 24px;
  }
}

.geo-right {
  top: 16px;
  right: 16px;
  width: 232px;
}

.geo-title {
  margin: 0;
  font: 600 17px/1.2 Bahnschrift, "DIN Alternate", sans-serif;
  letter-spacing: 0.04em;
}

.geo-sub {
  margin: 4px 0 12px;
  font-size: 11px;
  color: var(--geo-ink-soft);
}

.geo-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 6px;
  padding-left: 8px;
  border-left: 3px solid var(--geo-accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.geo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--geo-ink-soft);
  padding: 2px 0;
}

.geo-axis {
  display: flex;
  margin: 6px 0 2px;
}

.geo-layers {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.geo-layer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 3px 6px;
  font: 400 12px/1.4 inherit;
  color: var(--geo-ink);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  text-align: left;

  .sw {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex: none;
  }

  .nm {
    flex: 1;
    white-space: nowrap;
  }

  .dp {
    font: 500 11px/1 Bahnschrift, sans-serif;
    color: var(--geo-ink-soft);
    font-variant-numeric: tabular-nums;
  }

  &:hover {
    border-color: var(--geo-accent);
  }

  &.is-off {
    opacity: 0.42;
  }
}

.geo-reset {
  width: 100%;
  margin-top: 12px;
}

.geo-kpi,
.geo-sel dl {
  display: grid;
  gap: 2px;
  margin: 0;

  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 2px 0;
  }

  dt {
    font-size: 11px;
    color: var(--geo-ink-soft);
  }

  dd {
    margin: 0;
    font: 500 13px/1.2 Bahnschrift, "DIN Alternate", sans-serif;
    font-variant-numeric: tabular-nums;

    i {
      font-size: 10px;
      font-style: normal;
      color: var(--geo-ink-soft);
    }
  }
}

.geo-sel-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--geo-select);
}

.geo-empty {
  margin: 0;
  font-size: 11px;
  color: var(--geo-ink-soft);
}

.geo-status {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 16px;
  align-items: center;
  height: 28px;
  padding: 0 16px;
  font-size: 11px;
  color: var(--geo-ink-soft);
  background: var(--geo-panel);
  border-top: 1px solid var(--geo-hairline);
  font-variant-numeric: tabular-nums;
}

.geo-tag {
  margin-left: auto;
  color: var(--geo-accent);
}

@media (max-width: 1280px) {
  .geo-left {
    width: 226px;
  }

  .geo-right {
    width: 196px;
  }
}
</style>
