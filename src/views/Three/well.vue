<template>
  <div class="simple-geology">
    <div class="three-container" ref="el"></div>
    <!-- 段信息浮窗 -->
    <div v-if="infoEnabled" class="segment-info-panel">
      <div class="info-header">
        <svg
          class="info-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span class="info-badge">{{ information.name }}</span>
      </div>
      <div class="info-body">
        <div class="info-row">
          <span class="info-label">名称</span>
          <span class="info-value">{{ information.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">井深</span>
          <span class="info-value">{{ information.wellDepth }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">垂深</span>
          <span class="info-value">{{ information.verticalDepth }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">井斜</span>
          <span class="info-value">{{ information.wellDeviation }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">方位</span>
          <span class="info-value">{{ information.azimuth }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">地层</span>
          <span class="info-value">
            <span class="formation-tag">{{ information.stratum }}</span>
          </span>
        </div>
        <div class="info-desc">{{ information.description }}</div>
      </div>
      <!-- 进度条 -->
      <div class="info-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: (currentIndex / data.length) * 100 + '%',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "SimpleGeology" };
</script>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import {
  useThree,
  fitCameraToObject,
  createGrowAnimation,
  flyToFitGroup,
  type GrowAnimationControls,
  createTextSprite,
  createDrillingRig,
  updateCameraFollow,
  loadHeightmap,
  heightmapScale,
  setSurfaceExtent,
  applySurfaceUndulations,
  applyLayerUndulations,
  resetMeshVertices,
  applySurfaceVertexColors,
  getMaxMin,
} from "./three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { data } from "./index";

// ============================================
// 1. 类型 & 配置
// ============================================

interface SegmentInfo {
  name: string;
  wellDepth: string;
  verticalDepth: string;
  wellDeviation: string;
  azimuth: string;
  stratum: string;
  description: string;
}

interface LayerMeshInfo {
  mesh: THREE.Mesh;
  originalPositions: Float32Array;
  isSurface: boolean;
}

// ============================================
// 2. Three.js 场景对象
// ============================================

const pipelineConfig = {
  tubularSegments: 100,
  indicesPerSegment: 16 * 6,
  radius: 20,
  radialSegments: 16,
};

const guiState = {
  animationEnabled: false,
  animationDuration: 3,
};

const { scene, camera, renderer, el, controller } = useThree({
  onClick: handleClick,
});

const layersGroup = new THREE.Group();
const pipelineGroup = new THREE.Group();
const rigGroup = new THREE.Group();
const labelsGroup = new THREE.Group();
const pointsGroup = new THREE.Group();

const layerMeshInfos: LayerMeshInfo[] = [];

/** 按地层归类数据点 */
const layerData = [] as any[];
data.forEach((item: any) => {
  const idx = layerData.findIndex(
    (layer: any) => layer.stratum === item.stratum,
  );
  if (idx > -1) {
    layerData[idx].position.push(item.position);
  } else {
    layerData.push({
      stratum: item.stratum,
      position: [item.position],
      color: Math.floor(Math.random() * 0xffffff),
    });
  }
});

let animControls: GrowAnimationControls | null = null;

// ============================================
// 3. 相机飞行控制
// ============================================

const isFlying = ref(false);
let cancelFly: (() => void) | null = null;

/** 远距离阈值：相机距注视点超过此值视为"很远"，点击自动回中 */
const FAR_DISTANCE_THRESHOLD = 5000;

/** 递归查找 object 的祖先链中是否包含 rig 组 */
function findRigObject(intersects: THREE.Intersection[]) {
  return intersects.find((i) => {
    let obj: THREE.Object3D | null = i.object;
    while (obj) {
      if (obj.userData?.name) return true;
      obj = obj.parent;
    }
    return false;
  });
}

/** 远距离：飞行到场景中心并自动适配视野 */
function flyToSceneCenter() {
  cancelFly?.();
  isFlying.value = true;

  cancelFly = flyToFitGroup(
    camera.value!,
    controller.value!,
    [layersGroup, pipelineGroup],
    {
      duration: 2,
      arcRatio: 0.3,
      offset: 1.4,
      onComplete: () => {
        isFlying.value = false;
        cancelFly = null;
      },
    },
  );
}

const addPointInfo = (obj: THREE.Object3D) => {
  const { sprite, width, height, updateText } = createTextSprite(
    `名称：${obj.userData?.name}\n井深：${obj.userData?.wellDepth}\n垂深：${obj.userData?.verticalDepth}\n井斜：${obj.userData?.wellDeviation}\n方位：${obj.userData?.azimuth}\n地层：${obj.userData?.stratum}`,
    {
      fontSize: 32,
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgba(0,0,0,1)",
    },
  );
  sprite.position.set(
    obj.position.x + width / 1.4,
    obj.position.y + height / 1.4,
    obj.position.z,
  );
  sprite.scale.set(width, height, 0);
  pointsGroup.add(sprite);
  pointsGroup.renderOrder = 200;

  const points = [obj.position, sprite.position];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      // transparent: true,
      // opacity: 0.4,
    }),
  );
  pointsGroup.add(line);
  return { sprite, line, updateText };
};

/** 近距离：飞行到被点击的部件位置 */
function flyToPart(intersect: THREE.Intersection) {
  const obj = intersect.object;
  const pos = obj.userData?.position || obj.position;
  if (!pos) {
    return;
  }

  cancelFly?.();
  pointsGroup.remove(...pointsGroup.children);
  isFlying.value = true;

  cancelFly = flyToFitGroup(camera.value!, controller.value!, [obj], {
    duration: 1.5,
    arcRatio: 0.15,
    offset: 20,
    onComplete: () => {
      isFlying.value = false;
      cancelFly = null;
      addPointInfo(obj);
    },
  });
}

/** 点击事件入口：远距离回中，近距离飞向部件 */
function handleClick(intersects: THREE.Intersection[]) {
  if (!camera.value || !controller.value) return;

  const dist = camera.value.position.distanceTo(controller.value.target);
  if (dist > FAR_DISTANCE_THRESHOLD) {
    flyToSceneCenter();
    return;
  }

  const hit = findRigObject(intersects);
  if (hit) {
    flyToPart(hit);
  } else {
    pointsGroup.remove(...pointsGroup.children);
  }
}

// ============================================
// 4. GUI 状态
// ============================================

const gui = new GUI();
const layerEnabled = ref(true);
const labelEnabled = ref(true);
const infoEnabled = ref(true);
const clippingEnabled = ref(false);
const rigEnabled = ref(true);
const terrainEnabled = ref(true);
const information = ref<SegmentInfo>({} as SegmentInfo);
const currentIndex = ref(0);

/**
 * 创建深度刻度标签，类似刻度轴显示在各层边界
 * @param layerData 地层数据
 * @param maxX 地层X轴半宽，用于确定标签偏移位置
 * @returns 包含刻度线和标签的 Group
 */
function createDepthLabels(layerData: any[], maxX: number): THREE.Group {
  const group = new THREE.Group();
  const axisX = maxX + 16; // 在地层右侧紧贴边缘
  const tickExtent = 16; // 刻度线半长

  // 收集所有需要标注的深度边界
  const marks: { y: number; label: string }[] = [];

  for (let i = 0; i < layerData.length; i++) {
    const topY = layerData[i].position[0][1];

    if (i === 0) {
      // 第一层顶面 = 地表
      marks.push({ y: topY, label: "地表 0m" });
    }

    // 计算该层底面深度
    let bottomY: number;
    if (i === layerData.length - 1) {
      // 最后一层：底面为该层最深的点
      const minY = Math.min(...layerData[i].position.map((p: any) => p[1]));
      bottomY = minY;
    } else {
      // 中间层：底面为下一层的顶面
      bottomY = layerData[i + 1].position[0][1];
    }

    marks.push({ y: bottomY, label: `${Math.abs(Math.floor(bottomY))}m` });
  }

  // 垂直轴线（从地表到最深处）
  const axisPts = [
    new THREE.Vector3(axisX, marks[0].y, 0),
    new THREE.Vector3(axisX, marks[marks.length - 1].y, 0),
  ];
  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(axisPts),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      // transparent: true,
      // opacity: 0.4,
    }),
  );
  group.add(axisLine);

  // 刻度线与标签
  marks.forEach(({ y, label }) => {
    // 刻度线（垂直于轴线）
    const tickPts = [
      new THREE.Vector3(axisX - tickExtent, y, 0),
      new THREE.Vector3(axisX + tickExtent, y, 0),
    ];
    const tickLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(tickPts),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    );
    group.add(tickLine);

    // 文字标签
    const { sprite, width, height } = createTextSprite(label);
    sprite.scale.set(width, height, 0);
    sprite.position.set(axisX + sprite.scale.x / 2, y, 0);
    group.add(sprite);
  });

  return group;
}

const initLayers = () => {
  const { maxX, maxZ, minZ } = getMaxMin(layerData);
  // 几何体 Z 范围为 [-maxZ, +maxZ]，灰度图采样需匹配此对称范围
  const zExtent = Math.max(Math.abs(minZ), maxZ);
  setSurfaceExtent({ maxX, maxZ: zExtent, minZ: -zExtent });
  for (let i = 0; i < layerData.length; i++) {
    const layer = layerData[i];
    let height = 0;
    if (i === layerData.length - 1) {
      // 最后一层：使用该层自身数据点的垂直跨度
      const positions = layer.position;
      const maxY = Math.max(...positions.map((p: any) => p[1]));
      const minY = Math.min(...positions.map((p: any) => p[1]));
      height = Math.floor(Math.abs(maxY - minY));
    } else {
      // 非最后一层：从当前层起点延伸到下一层起点
      const topY = layer.position[0][1];
      const bottomY = layerData[i + 1].position[0][1];
      height = Math.floor(Math.abs(topY - bottomY)) - 1; // 减1避免相邻面精确重合导致z-fighting
    }
    const segments = 30;
    const geometry = new THREE.BoxGeometry(
      maxX * 2,
      height,
      maxZ * 2,
      segments,
      1,
      segments,
    );
    // 将几何体向下平移 height/2，使顶面位于局部坐标 y=0 处
    // 配合 mesh.position 设在地层起始深度，直观表示"从此深度向下延伸"
    geometry.translate(0, -height / 2, 0);
    //  定义裁剪平面
    renderer.value!.localClippingEnabled = clippingEnabled.value;
    // 创建裁剪平面,z轴负方向裁minZ
    const clippingPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, -1), minZ);
    const clippingPlane2 = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1);
    const material = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      clippingPlanes: [clippingPlane1, clippingPlane2],
      clipIntersection: true, // 设置裁剪交集，默认并集
      // vertexColors: i === 0, // 地表层启用 vertex colors
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 80; // 设置渲染顺序
    mesh.position.set(0, layer.position[0][1], 0); // 位置=地层起始深度
    layersGroup.add(mesh);
    // 保存原始顶点位置用于起伏切换
    const pos = new Float32Array(geometry.attributes.position.array);
    layerMeshInfos.push({
      mesh,
      originalPositions: pos,
      isSurface: false,
    });
  }
  addTopLayer(maxX, maxZ, minZ);

  // 应用起伏（根据当前开关状态）
  if (terrainEnabled.value) {
    layerMeshInfos.forEach((info) => {
      const positions = info.mesh.geometry.attributes.position
        .array as Float32Array;
      if (info.isSurface) {
        applySurfaceUndulations(positions, info.originalPositions);
      } else {
        applyLayerUndulations(positions, info.originalPositions);
      }
      info.mesh.geometry.attributes.position.needsUpdate = true;
      info.mesh.geometry.computeVertexNormals();

      // 为地表层应用高程 vertex colors
      if (info.isSurface) {
        applySurfaceVertexColors(
          info.mesh.geometry as THREE.BoxGeometry,
          info.originalPositions,
        );
        (info.mesh.material as THREE.MeshBasicMaterial).vertexColors = true;
      }
    });
  }
  // 创建并添加深度刻度标签
  labelsGroup.add(createDepthLabels(layerData, maxX));
  // 调整标签组位置，使其位于地层最前面
  labelsGroup.translateZ(maxZ);
  scene.value?.add(labelsGroup);

  scene.value?.add(layersGroup);
  camera.value!.far = 30000;
  camera.value!.updateProjectionMatrix();
  fitCameraToObject(camera.value!, controller.value!, layersGroup);
};

const addTopLayer = (maxX: number, maxZ: number, minZ: number) => {
  const segments = 30;
  const geometry = new THREE.BoxGeometry(
    maxX * 2,
    2,
    maxZ * 2,
    segments,
    1,
    segments,
  );
  geometry.translate(0, -1, 0);
  renderer.value!.localClippingEnabled = clippingEnabled.value;
  // 创建裁剪平面,z轴负方向裁minZ
  const clippingPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, -1), minZ);
  const clippingPlane2 = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1);
  const material = new THREE.MeshBasicMaterial({
    clippingPlanes: [clippingPlane1, clippingPlane2],
    clipIntersection: true, // 设置裁剪交集，默认并集
    vertexColors: true, // 地表层启用 vertex colors
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 80; // 设置渲染顺序
  mesh.position.set(0, 2, 0); // 位置=地层起始深度
  layersGroup.add(mesh);
  // 保存原始顶点位置用于起伏切换
  const pos = new Float32Array(geometry.attributes.position.array);
  layerMeshInfos.unshift({
    mesh,
    originalPositions: pos,
    isSurface: true,
  });
};

const initPipeline = () => {
  pipelineGroup.remove(...pipelineGroup.children);
  // 三维路径曲线
  const curve = new THREE.CatmullRomCurve3(
    data.map((d: any) => new THREE.Vector3(...d.position)),
  );
  // 管道几何体
  const pipeline = new THREE.TubeGeometry(
    curve,
    pipelineConfig.tubularSegments,
    pipelineConfig.radius,
    pipelineConfig.radialSegments,
    false,
  );
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(pipeline, material);
  pipelineGroup.renderOrder = 100;
  pipelineGroup.add(mesh);
  scene.value?.add(pipelineGroup);

  if (!guiState.animationEnabled) {
    // 添加测点标记（红点），点击触发 flyTo
    data.forEach((d: any) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(pipelineConfig.radius * 1.2, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          // transparent: true,
          // opacity: 0.5,
          side: THREE.DoubleSide,
        }),
      );
      sphere.position.set(d.position[0], d.position[1], d.position[2]);
      sphere.userData = { ...d };
      pipelineGroup.add(sphere);
    });
  }
  let sprite: THREE.Sprite | null = null;
  let updateText: ((newText: string) => void) | null = null;
  // 动画控制
  if (guiState.animationEnabled) {
    pipeline.setDrawRange(0, 0);

    // 创建跟随管道终点的文本 sprite
    const textResult = createTextSprite(
      `名称：${data[0].name}\n井深：${data[0].wellDepth}\n垂深：${data[0].verticalDepth}\n井斜：${data[0].wellDeviation}\n方位：${data[0].azimuth}\n地层：${data[0].stratum}`,
      {
        fontSize: 32,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "rgba(0,0,0,1)",
      },
    );
    sprite = textResult.sprite;
    updateText = textResult.updateText;
    sprite.scale.set(textResult.width, textResult.height, 0);
    pipelineGroup.add(sprite);

    animControls = createGrowAnimation({
      geometry: pipeline,
      tubularSegments: pipelineConfig.tubularSegments,
      indicesPerSegment: pipelineConfig.indicesPerSegment,
      duration: guiState.animationDuration,
      onProgress: (progress: number) => {
        // 镜头跟随
        updateCameraFollowFn(progress, curve);
        // 更新 sprite 跟随管道终点
        const point = curve.getPoint(progress);
        sprite!.position.set(
          point.x + textResult.width / 1.4,
          point.y + textResult.height / 1.4,
          point.z,
        );
        // 根据绘制的分段数计算对应的数据点
        const segment = Math.floor(progress * pipelineConfig.tubularSegments);
        const index = getDataIndexFromSegments(segment);
        if (index !== currentIndex.value) {
          currentIndex.value = index;
          updateInfo(index);
          // 更新 sprite 文本为当前段信息
          const info = data[index - 1];
          if (info) {
            updateText!(
              `名称：${info.name}\n井深：${info.wellDepth}\n垂深：${info.verticalDepth}\n井斜：${info.wellDeviation}\n方位：${info.azimuth}\n地层：${info.stratum}`,
            );
          }
        }
      },
    });
    animControls.play();
  } else {
    animControls?.stop();
    currentIndex.value = data.length;
    updateInfo(data.length);
  }
};
/**
 * @description 根据绘制的分段数计算对应的数据点
 */
const getDataIndexFromSegments = (segments: number) => {
  const t = segments / pipelineConfig.tubularSegments;
  const totalPoints = data.length;
  return Math.min(Math.ceil(t * (totalPoints - 1)) + 1, totalPoints);
};
/**
 * @description 更新信息
 */
const updateInfo = (index: number) => {
  const info = data[index - 1];
  information.value = {
    name: info.name,
    wellDepth: info.wellDepth,
    verticalDepth: info.verticalDepth,
    wellDeviation: info.wellDeviation,
    azimuth: info.azimuth,
    stratum: info.stratum,
    description: `当前处于 ${info.stratum}，${info.name}，井深 ${info.wellDepth}`,
  };
};

/** 初始化钻井装置 */
function initRig(): void {
  rigGroup.remove(...rigGroup.children);
  const rig = createDrillingRig();
  rigGroup.userData = { name: "rig" };
  rigGroup.add(rig);
  scene.value?.add(rigGroup);
}

const addGUI = () => {
  gui
    .add(layerEnabled, "value")
    .name("地层是否启用")
    .onChange(() => {
      layersGroup.visible = layerEnabled.value;
    });
  gui
    .add(labelEnabled, "value")
    .name("标签刻度是否启用")
    .onChange(() => {
      labelsGroup.visible = labelEnabled.value;
    });
  gui
    .add(guiState, "animationEnabled")
    .name("动画是否启用")
    .onChange(() => {
      initPipeline();
    });
  gui
    .add(infoEnabled, "value")
    .name("信息是否启用")
    .onChange((value) => {
      infoEnabled.value = value;
    });
  gui
    .add(terrainEnabled, "value")
    .name("地层起伏")
    .onChange((value) => {
      layerMeshInfos.forEach((info) => {
        const positions = info.mesh.geometry.attributes.position
          .array as Float32Array;
        if (value) {
          if (info.isSurface) {
            applySurfaceUndulations(positions, info.originalPositions);
          } else {
            applyLayerUndulations(positions, info.originalPositions);
          }
        } else {
          resetMeshVertices(positions, info.originalPositions);
        }
        info.mesh.geometry.attributes.position.needsUpdate = true;
        info.mesh.geometry.computeVertexNormals();

        // 处理地表层 vertex colors
        if (info.isSurface) {
          if (value) {
            applySurfaceVertexColors(
              info.mesh.geometry as THREE.BoxGeometry,
              info.originalPositions,
            );
            (info.mesh.material as THREE.MeshBasicMaterial).vertexColors = true;
          } else {
            info.mesh.geometry.deleteAttribute("color");
            (info.mesh.material as THREE.MeshBasicMaterial).vertexColors =
              false;
          }
        }
      });
    });
  gui
    .add(heightmapScale, "value", 10, 300)
    .name("起伏幅度")
    .onChange(() => {
      // 重新应用起伏
      layerMeshInfos.forEach((info) => {
        if (!info.isSurface) return;
        const positions = info.mesh.geometry.attributes.position
          .array as Float32Array;
        if (terrainEnabled.value) {
          applySurfaceUndulations(positions, info.originalPositions);
        } else {
          resetMeshVertices(positions, info.originalPositions);
        }
        info.mesh.geometry.attributes.position.needsUpdate = true;
        info.mesh.geometry.computeVertexNormals();

        if (terrainEnabled.value) {
          applySurfaceVertexColors(
            info.mesh.geometry as THREE.BoxGeometry,
            info.originalPositions,
          );
        }
      });
    });
  gui
    .add(clippingEnabled, "value")
    .name("裁剪是否启用")
    .onChange((value) => {
      renderer.value!.localClippingEnabled = value;
    });
  gui
    .add(rigEnabled, "value")
    .name("钻井装置")
    .onChange((value) => {
      rigGroup.visible = value;
    });
};

function updateCameraFollowFn(progress: number, curve: THREE.CatmullRomCurve3) {
  if (
    !curve ||
    !camera.value ||
    !controller.value ||
    !guiState.animationEnabled
  )
    return;

  updateCameraFollow({
    curve,
    progress,
    camera: camera.value,
    controller: controller.value,
    mode: "third-person",
    thirdPersonDistance: 1000,
  });
}
onMounted(async () => {
  await loadHeightmap();
  initLayers();
  initPipeline();
  initRig();
  addGUI();
  scene.value?.add(pointsGroup);
});
onUnmounted(() => {
  animControls?.stop();
  gui.destroy();
});
</script>

<style lang="scss" scoped>
.simple-geology {
  width: 100%;
  height: 100vh;

  .three-container {
    width: 100%;
    height: 100%;
  }
}
/* 段信息浮窗 */
.segment-info-panel {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 260px;
  background: rgba(10, 20, 40, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: #e0e8f0;
  font-size: 13px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  user-select: none;
  pointer-events: none;
  transition: opacity 0.3s;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.info-icon {
  color: #4fc3f7;
  flex-shrink: 0;
}

.info-badge {
  font-size: 11px;
  font-weight: 600;
  color: #4fc3f7;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-segment-idx {
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-family: "Courier New", monospace;
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  min-width: 36px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
}

.info-value {
  color: #e0e8f0;
  font-weight: 500;
}

.formation-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
  font-size: 12px;
  font-weight: 600;
}

.info-desc {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.65);
}

.info-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #29b6f6);
  border-radius: 2px;
  transition: width 0.1s linear;
}
</style>
