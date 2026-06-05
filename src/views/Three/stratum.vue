<template>
  <div class="three">
    <div class="three-demo" ref="threeDemo"></div>
  </div>
</template>

<script lang="ts">
export default { name: "Demo" };
</script>
<script lang="ts" setup>
import * as THREE from "three";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ThreeConfig } from ".";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import p002 from "/three/stratum/3d66Model-23184475-files-002.png";
import p001 from "/three/stratum/3d66Model-23184475-files-001.png";
import p003 from "/three/stratum/3d66Model-23184475-files-003.png";
import p004 from "/three/stratum/3d66Model-23184475-files-004.png";
import p005 from "/three/stratum/3d66Model-23184475-files-005.png";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

const threeConfig: ThreeConfig = {
  scene: null,
  camera: null,
  renderder: null,
  cube: null,
  controller: null,
  material: null,
};

const threeDemo = ref();
let gui: GUI;

// 配置常量
const AXIS_WIDTH = 200;
const AXIS_OFFSET = 50; // 坐标轴距离模型的偏移量

const initThree = () => {
  const el = threeDemo.value;
  // 场景
  threeConfig.scene = new THREE.Scene();
  // 相机
  threeConfig.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  );
  threeConfig.camera.position.set(2, 2, 20);
  // threeConfig.camera.lookAt(0, 0, 0);
  // 渲染器
  threeConfig.renderder = new THREE.WebGLRenderer({ antialias: true }); //抗锯齿

  threeConfig.renderder.setSize(el.offsetWidth, el.offsetHeight);

  // initLight();
  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  threeConfig.scene?.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  threeConfig.scene?.add(directionalLight);

  // 设置暗蓝色背景
  threeConfig.scene!.background = new THREE.Color(0x1a2d4a);

  initController();

  initGLTF();

  el.appendChild(threeConfig.renderder.domElement);

  // 渲染场景
  threeConfig.renderder.render(threeConfig.scene, threeConfig.camera);

  // 动画
  update();
};
/**
 * @description 初始化环境
 */
const initLight = () => {
  // 几何体
  // const geometry = new THREE.PlaneGeometry(1, 1);
  // 材质
  // 纹理贴图
  const textureLoader = new THREE.TextureLoader();
  let map = textureLoader.load("./three/wood/wood5.jpg");
  // ao贴图
  let aoMap = textureLoader.load("./three/wood/wood4.png");
  // 透明图
  // let alphaMap = textureLoader.load("./three/wood/wood.png");
  // 光照
  // let lightMap = textureLoader.load("./three/wood/wood3.png");
  // 高光 黑色不反光 白色反光
  let highlightMap = textureLoader.load("./three/wood/wood.png");
  threeConfig.material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    // 纹理
    map: map,
    // ao
    aoMap: aoMap,
    // alpha
    // alphaMap: alphaMap,
    // 光照
    // lightMap: lightMap,
    // 高光
    specularMap: highlightMap,
  });

  // exrloader
  const loader = new EXRLoader();
  loader.load("./three/quarry_03_4k.exr", (texture) => {
    // 设置球形映射
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // 设置背景贴图
    threeConfig.scene!.background = texture;
    // 设置环境贴图
    threeConfig.scene!.environment = texture;
    // 给物体材质设置环境贴图 反射光
    threeConfig.material!.envMap = texture;
  });

  // 网格
  // threeConfig.cube = new THREE.Mesh(geometry, threeConfig.material);
  // 添加到场景中
  // threeConfig.scene?.add(threeConfig.cube);
};

// 加载gltf
const initGLTF = () => {
  const loader = new GLTFLoader();
  loader.load("./three/stratum/3d66.com_23184475.gltf", (gltf) => {
    console.log(gltf);
    threeConfig.scene!.add(gltf.scene);

    // 计算模型的中心点或包围盒
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // // 方法1：先设置lookAt，再更新控制器
    // threeConfig.camera?.lookAt(center);
    // threeConfig.controller?.target.copy(center);
    // threeConfig.controller?.update();

    // 方法2：或者调整相机位置，让模型在视野中
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = threeConfig.camera!.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.4; // 增加一些距离
    threeConfig.camera!.position.set(center.x, center.y, center.z + cameraZ);
    threeConfig.controller!.target.copy(center);
    threeConfig.controller!.update();

    // 创建动态坐标轴（基于模型高度）
    createDepthAxis(box);

    // 创建井轨迹（与坐标轴同一平面）
    createWellTrajectory(box);

    const textureLoader = new THREE.TextureLoader();
    //找到3d66-PolyMeshObject-23184475-001
    const mesh1 = gltf.scene.getObjectByName("3d66-PolyMeshObject-23184475-001")
      ?.children[0] as THREE.Mesh;
    // 设置材质贴图为某个图片
    mesh1.material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(p002),
    });
    const mesh2 = gltf.scene.getObjectByName("3d66-PolyMeshObject-23184475-002")
      ?.children[0] as THREE.Mesh;
    mesh2.material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(p003),
      combine: THREE.MultiplyOperation,
    });
    const mesh3 = gltf.scene.getObjectByName("3d66-PolyMeshObject-23184475-003")
      ?.children[0] as THREE.Mesh;
    mesh3.material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(p004),
    });
    const mesh4 = gltf.scene.getObjectByName("3d66-PolyMeshObject-23184475-004")
      ?.children[0] as THREE.Mesh;
    mesh4.material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(p005),
    });
    const mesh5 = gltf.scene.getObjectByName("3d66-PolyMeshObject-23184475-005")
      ?.children[0] as THREE.Mesh;
    mesh5.material = new THREE.MeshBasicMaterial({
      map: textureLoader.load(p001),
    });

    gui = new GUI();
    // 颜色控制
    const colorConfig = {
      color: "transparent",
    };
    gui
      .addColor(colorConfig, "color")
      .name("第一层颜色")
      .onChange((value) => {
        if (mesh1.material && "color" in mesh1.material) {
          (mesh1.material as THREE.MeshBasicMaterial).color.set(value);
        }
      });

    gui
      .addColor(colorConfig, "color")
      .name("第二层颜色")
      .onChange((value) => {
        if (mesh2.material && "color" in mesh2.material) {
          (mesh2.material as THREE.MeshBasicMaterial).color.set(value);
        }
      });
    gui
      .addColor(colorConfig, "color")
      .name("第三层颜色")
      .onChange((value) => {
        if (mesh3.material && "color" in mesh3.material) {
          (mesh3.material as THREE.MeshBasicMaterial).color.set(value);
        }
      });
    gui
      .addColor(colorConfig, "color")
      .name("第四层颜色")
      .onChange((value) => {
        if (mesh4.material && "color" in mesh4.material) {
          (mesh4.material as THREE.MeshBasicMaterial).color.set(value);
        }
      });
    gui
      .addColor(colorConfig, "color")
      .name("第五层颜色")
      .onChange((value) => {
        if (mesh5.material && "color" in mesh5.material) {
          (mesh5.material as THREE.MeshBasicMaterial).color.set(value);
        }
      });
  });
};

/**
 * @description 初始化控制器
 */
const initController = () => {
  threeConfig.controller = new OrbitControls(
    threeConfig.camera!,
    threeConfig.renderder?.domElement,
  );
  // 自动旋转
  // threeConfig.controller.autoRotate = true;
};

// 创建深度坐标轴（动态适配模型高度）
const createDepthAxis = (modelBox: THREE.Box3) => {
  // 获取模型的高度和边界
  const modelHeight = modelBox.max.y - modelBox.min.y;
  const modelMinY = modelBox.min.y;
  const modelMaxY = modelBox.max.y;
  const modelMaxX = modelBox.max.x;
  const modelMinZ = modelBox.min.z;
  const modelMaxZ = modelBox.max.z;

  // 坐标轴位置：面向相机的最前面 + 左侧
  // 假设相机在 Z 轴正方向，所以取 minZ 作为前面（左侧）
  const axisX = modelBox.min.x - AXIS_OFFSET; // 模型左侧
  const axisZ = modelMaxZ + AXIS_OFFSET; // 面向相机的最前面

  // 坐标轴的固定显示范围（可配置）
  const axisStartDepth = 0; // 起始深度
  const axisEndDepth = 1000; // 结束深度
  const axisDisplayHeight = modelHeight; // 坐标轴显示的固定高度（使用模型高度）

  const axisTopY = modelMaxY; // 顶部位置
  const axisBottomY = modelMaxY - axisDisplayHeight; // 底部位置（固定高度）

  console.log("模型信息:", {
    height: modelHeight,
    minX: modelBox.min.x,
    maxX: modelMaxX,
    minY: modelMinY,
    maxY: modelMaxY,
    minZ: modelMinZ,
    maxZ: modelMaxZ,
    axisX,
    axisZ,
    axisDisplayHeight,
    axisStartDepth,
    axisEndDepth,
    axisTopY,
    axisBottomY,
  });

  // 不再创建背景板，直接创建刻度线和主线

  // 动态生成刻度（根据起始和结束值计算）
  const { ticks: mainTicks } = calculateTicks(
    axisStartDepth,
    axisEndDepth,
    axisDisplayHeight,
  );

  const tickMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });

  mainTicks.forEach((depth) => {
    // 将深度值映射到坐标轴的 Y 位置
    // depth=0 -> axisTopY, depth=axisEndDepth -> axisBottomY
    const normalizedDepth =
      (depth - axisStartDepth) / (axisEndDepth - axisStartDepth);
    const yPos = axisTopY - normalizedDepth * axisDisplayHeight;

    // 只绘制左侧的刻度线（从轴线向左延伸）
    const tickPoints = [
      new THREE.Vector3(axisX + 50, yPos, axisZ - 50),
      new THREE.Vector3(axisX, yPos, axisZ - 50),
    ];
    const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);
    const tickLine = new THREE.Line(tickGeometry, tickMaterial);
    tickLine.renderOrder = 101;
    // 启用抗锯齿
    tickLine.frustumCulled = false;
    threeConfig.scene?.add(tickLine);

    const textLabel = createTextLabel(`${Math.round(depth)} m`, {
      fontsize: 12,
      textColor: { r: 255, g: 255, b: 255, a: 1 },
    });
    // 文字在刻度线左侧
    textLabel.position.set(axisX, yPos, axisZ - 50);
    textLabel.renderOrder = 102;
    threeConfig.scene?.add(textLabel);
  });

  // 坐标轴主线（垂直线）
  const axisLinePoints = [
    new THREE.Vector3(axisX + 50, axisTopY, axisZ - 50),
    new THREE.Vector3(axisX + 50, axisBottomY, axisZ - 50),
  ];
  const axisLineGeometry = new THREE.BufferGeometry().setFromPoints(
    axisLinePoints,
  );
  const axisLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 3,
  });
  const axisLine = new THREE.Line(axisLineGeometry, axisLineMaterial);
  axisLine.renderOrder = 101;
  axisLine.frustumCulled = false; // 禁用视锥剔除，避免闪烁
  threeConfig.scene?.add(axisLine);

  // 底部横线
  const bottomLinePoints = [
    new THREE.Vector3(axisX + 50, axisBottomY, axisZ - 50),
    new THREE.Vector3(axisX, axisBottomY, axisZ - 50),
  ];
  const bottomLineGeometry = new THREE.BufferGeometry().setFromPoints(
    bottomLinePoints,
  );
  const bottomLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
  });
  const bottomLine = new THREE.Line(bottomLineGeometry, bottomLineMaterial);
  bottomLine.renderOrder = 101;
  bottomLine.frustumCulled = false; // 禁用视锥剔除，避免闪烁
  threeConfig.scene?.add(bottomLine);
};

// 井轨迹数据接口
interface TrajectoryPoint {
  verticalDepth: number;
  horizontalDisplacement: number;
  azimuth: number;
}

// 生成模拟井轨迹数据 - 先竖直向下，再水平向右
const generateTrajectory = (): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];

  // 第一段：竖直向下 (50m - 1000m)
  for (let i = 50; i <= 1000; i += 50) {
    points.push({
      verticalDepth: i,
      horizontalDisplacement: 0, // 没有水平位移
      azimuth: 0,
    });
  }

  // 第二段：水平向右 (1000m - 3200m)
  for (let i = 1050; i <= 3200; i += 50) {
    const verticalDepth = 1000; // 保持深度不变
    const horizontalDisplacement = (i - 1000) * 1.5; // 水平位移增加

    points.push({
      verticalDepth,
      horizontalDisplacement,
      azimuth: 90, // 向东
    });
  }

  return points;
};

const trajectoryData = generateTrajectory();

// 创建井轨迹（与坐标轴同一平面）
const createWellTrajectory = (modelBox: THREE.Box3) => {
  const modelMaxZ = modelBox.max.z;
  const axisZ = modelMaxZ + AXIS_OFFSET; // 与坐标轴相同的 Z 位置
  const modelMinY = modelBox.min.y;
  const modelMaxY = modelBox.max.y;
  const modelMinX = modelBox.min.x;
  const modelMaxX = modelBox.max.x;
  const modelWidth = modelMaxX - modelMinX;

  // 计算轨迹的 X 起始位置（在坐标轴右侧一定距离）
  const trajectoryStartX = modelMinX - AXIS_OFFSET + 100; // 距离坐标轴 100 单位

  // 计算最大水平位移，确保不超过模型宽度
  const maxHorizontalDisplacement = Math.max(
    ...trajectoryData.map((p) => p.horizontalDisplacement),
  );
  // 动态计算缩放比例，确保轨迹不超出模型宽度（留出一些边距）
  const availableWidth = modelWidth * 0.8; // 使用模型宽度的 80%
  const scaleFactor = availableWidth / maxHorizontalDisplacement;

  console.log("轨迹信息:", {
    maxHorizontalDisplacement,
    modelWidth,
    availableWidth,
    scaleFactor,
  });

  const points: THREE.Vector3[] = [];

  trajectoryData.forEach((point) => {
    // 将垂直深度映射到模型的 Y 坐标范围，向下偏移一些
    const normalizedDepth = point.verticalDepth / 3200; // 归一化到 0-1
    const y = modelMaxY - normalizedDepth * (modelMaxY - modelMinY) - 50; // 向下偏移 50 单位

    // 水平位移作为 X 方向的偏移，使用动态缩放比例
    const x = trajectoryStartX + point.horizontalDisplacement * scaleFactor;

    // Z 坐标与坐标轴相同
    const z = axisZ - 50;

    points.push(new THREE.Vector3(x, y, z));
  });

  console.log("井轨迹点数:", points.length);
  console.log("起点:", points[0]);
  console.log("终点:", points[points.length - 1]);

  // 创建管道路径
  const curve = new THREE.CatmullRomCurve3(points);

  // 创建管道几何体（ TubeGeometry ）
  const tubeRadius = 8; // 管道半径
  const tubeSegments = 256; // 管道分段数
  const tubeRadialSegments = 16; // 管道径向分段数
  const tubeGeometry = new THREE.TubeGeometry(
    curve,
    tubeSegments,
    tubeRadius,
    tubeRadialSegments,
    false, // 不闭合
  );

  // 管道材质（带发光效果）
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.7,
  });

  const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
  tubeMesh.renderOrder = 1000;
  threeConfig.scene?.add(tubeMesh);

  // 在顶部添加井口（垂直段的起点）
  const wellheadPosition = points[0]; // 第一个点是井口位置
  const wellheadGeometry = new THREE.CylinderGeometry(15, 15, 30, 16);
  const wellheadMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.4,
    metalness: 0.8,
  });
  const wellhead = new THREE.Mesh(wellheadGeometry, wellheadMaterial);
  wellhead.position.copy(wellheadPosition);
  wellhead.position.y += 15; // 向上偏移一半高度
  wellhead.renderOrder = 1003;
  threeConfig.scene?.add(wellhead);

  // 井口法兰盘
  const flangeGeometry = new THREE.CylinderGeometry(20, 20, 8, 16);
  const flangeMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.3,
    metalness: 0.9,
  });
  const flange = new THREE.Mesh(flangeGeometry, flangeMaterial);
  flange.position.copy(wellheadPosition);
  flange.position.y += 30; // 在井口顶部
  flange.renderOrder = 1003;
  threeConfig.scene?.add(flange);

  // 钻头（终点标记）- 根据管道方向调整，避免穿模
  const lastPoint = points[points.length - 1];
  const secondLastPoint = points[points.length - 2];

  // 计算管道在终点的方向向量
  const direction = new THREE.Vector3()
    .subVectors(lastPoint, secondLastPoint)
    .normalize();

  const drillBitGeometry = new THREE.ConeGeometry(10, 20, 8); // 稍微减小尺寸
  const drillBitMaterial = new THREE.MeshStandardMaterial({
    color: 0xff9800,
    emissive: 0xff9800,
    emissiveIntensity: 0.8,
  });
  const drillBit = new THREE.Mesh(drillBitGeometry, drillBitMaterial);

  // 将钻头位置沿管道方向向前偏移，避免与管道穿模
  const offsetDistance = 10; // 偏移距离（圆锥高度的一半）
  const drillPosition = lastPoint
    .clone()
    .add(direction.clone().multiplyScalar(offsetDistance));
  drillBit.position.copy(drillPosition);

  // 让圆锥体指向管道方向
  // 圆锥体默认朝上(Y轴正方向)，需要旋转到管道方向
  const upVector = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    upVector,
    direction,
  );
  drillBit.quaternion.copy(quaternion);

  drillBit.renderOrder = 1002;
  threeConfig.scene?.add(drillBit);
};

// 根据高度动态计算刻度间隔和刻度数组
const calculateTicks = (
  startValue: number,
  endValue: number,
  height: number,
): { ticks: number[]; interval: number } => {
  // 根据总范围计算合适的刻度间隔
  const range = endValue - startValue;
  let interval: number;

  if (range <= 100) interval = 10;
  else if (range <= 500) interval = 50;
  else if (range <= 1000) interval = 100;
  else if (range <= 5000) interval = 500;
  else if (range <= 10000) interval = 1000;
  else interval = 2000;

  // 生成刻度数组
  const ticks: number[] = [];
  for (let value = startValue; value <= endValue; value += interval) {
    ticks.push(value);
  }

  // 确保包含结束值（如果最后一个刻度不等于结束值）
  if (ticks[ticks.length - 1] !== endValue) {
    ticks.push(endValue);
  }

  return { ticks, interval };
};

// 创建文字Sprite（总是面向相机，避免闪烁）
const createTextLabel = (text: string, parameters: any) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;

  const fontsize = parameters.fontsize || 24;
  context.font = `${fontsize}px Arial`;

  const metrics = context.measureText(text);
  const textWidth = metrics.width;

  canvas.width = textWidth + 50;
  canvas.height = fontsize + 30;

  context.font = `${fontsize}px Arial`;
  context.fillStyle = `rgba(${parameters.textColor.r}, ${parameters.textColor.g}, ${parameters.textColor.b}, ${parameters.textColor.a})`;
  context.textAlign = "right";
  context.textBaseline = "top";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(material);
  // 设置合适的缩放比例
  const scale = 60;
  sprite.scale.set((canvas.width * scale) / canvas.height, scale, 1);

  return sprite;
};

const update = () => {
  threeConfig.controller?.update();
  threeConfig.renderder?.render(threeConfig.scene!, threeConfig.camera!);
  requestAnimationFrame(update);
};
onMounted(() => {
  initThree();
});
onBeforeUnmount(() => {
  gui.destroy();
});
</script>

<style lang="scss" scoped>
.three {
  width: 100%;
  height: 100%;
  position: relative;
  .three-demo {
    width: 100%;
    height: 100%;
  }
  .to-full {
    position: absolute;
    left: 5px;
    top: 5px;
  }
}
</style>
