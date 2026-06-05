import { onMounted, onUnmounted, ref, shallowRef } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

interface UseThreeOptions {
  controller?: boolean;
  background?: number;
  onClick?: (intersects: THREE.Intersection[]) => void;
}

export function useThree(
  options: UseThreeOptions = {
    controller: true, // 是否启用控制器
    background: 0x1a2d4a, // 背景颜色
    onClick: undefined,
  },
) {
  const opts = {
    controller: true,
    background: 0x1a2d4a,
    onClick: undefined,
    fpsEnabled: false,
    ...options,
  };

  const el = ref<HTMLElement | null>(null);
  const scene = shallowRef<THREE.Scene | null>(null);
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const controller = shallowRef<OrbitControls | null>(null);
  let removeClick: (() => void) | null = null;
  let animationFrameId = 0;
  let stats: Stats | null = null;

  const initThree = () => {
    if (!el.value) return;

    scene.value = new THREE.Scene();
    camera.value = new THREE.PerspectiveCamera(
      75,
      el.value.offsetWidth / el.value.offsetHeight,
      0.1,
      1000,
    );
    renderer.value = new THREE.WebGLRenderer({ antialias: true });
    renderer.value.setSize(el.value.offsetWidth, el.value.offsetHeight);
    // 将渲染器DOM元素添加到容器中
    el.value.appendChild(renderer.value.domElement);
    // 设置场景背景颜色
    scene.value.background = new THREE.Color(opts.background);
    // 设置相机位置
    camera.value.position.set(0, 0, 5);
    // 渲染画面
    renderer.value.render(scene.value!, camera.value);
    // 初始化光源
    initLight();
    // 初始化控制器
    if (opts.controller) initController();
    // 持续更新
    update();
    // 注册通用点击事件
    if (opts.onClick) {
      // 注册通用点击事件，只筛选有 userData.name 的对象
      removeClick = initRaycasterClick(
        renderer.value.domElement,
        camera.value,
        scene.value,
        opts.onClick,
        // (obj) => !!obj.userData?.name,
      );
    }
    if (opts.fpsEnabled) {
      initFPS();
    }
  };

  /**
   * @description 初始化控制器
   */
  const initController = () => {
    controller.value = new OrbitControls(
      camera.value!,
      renderer.value!.domElement,
    );
  };
  /**
   * @description 初始化光源
   */
  const initLight = () => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.value?.add(ambientLight);
    // 方向光，这种光可以投射阴影
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.value?.add(directionalLight);
    // 设置光源位置
    directionalLight.position.set(10, 10, 10);
  };
  /**
   * @description 自适应页面宽度
   */
  const resetScene = () => {
    if (!el.value || !renderer.value || !camera.value) return;
    // 重置渲染器宽高比
    renderer.value.setSize(el.value.offsetWidth, el.value.offsetHeight);
    // 设置相机宽高比
    camera.value.aspect = el.value.offsetWidth / el.value.offsetHeight;
    // 更新相机投影矩阵
    camera.value.updateProjectionMatrix();
  };
  /**
   * @description 更新
   */
  const update = () => {
    if (!renderer.value || !camera.value) return;
    stats?.begin();
    renderer.value.render(scene.value!, camera.value);
    if (controller.value) controller.value.update();
    stats?.end();
    animationFrameId = requestAnimationFrame(update);
  };
  /**
   * @description 清除three
   */
  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    if (!renderer.value) return;
    // 移除场景中所有对象
    scene.value?.remove(...scene.value.children);
    // 移除渲染器
    el.value?.removeChild(renderer.value.domElement);
    // 释放渲染器资源
    renderer.value.dispose();
    stats?.dom.remove();
  };
  const initFPS = () => {
    stats = new Stats();
    stats.showPanel(0);
    el.value?.appendChild(stats.dom);
  };

  onMounted(() => {
    initThree();
    window.addEventListener("resize", resetScene);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", resetScene);
    dispose();
    if (opts.onClick) {
      removeClick?.();
    }
  });

  return {
    scene,
    camera,
    renderer,
    controller,
    el,
  };
}

/**
 * 相机跟随模式：第一视角 / 第三视角
 */
export type CameraFollowMode = "first-person" | "third-person";

/** 相机跟随参数 */
export interface CameraFollowOptions {
  curve: THREE.CatmullRomCurve3;
  /** 动画进度 0-1 */
  progress: number;
  camera: THREE.PerspectiveCamera | THREE.Camera;
  controller: OrbitControls;
  mode?: CameraFollowMode;
  /** 第三视角：法线方向距离偏移，默认 150 */
  thirdPersonDistance?: number;
}

/**
 * 通用相机跟随函数，支持第一视角和第三视角
 * 沿曲线自动定位相机位置和朝向
 */
export function updateCameraFollow(options: CameraFollowOptions): void {
  const {
    curve,
    progress,
    camera,
    controller,
    mode = "third-person",
    thirdPersonDistance = 150,
  } = options;

  const t = Math.max(progress, 0.001);
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();

  // 目标点始终为曲线当前位置
  controller.target.copy(point);

  if (mode === "first-person") {
    // 第一视角：相机在管道正中心偏后，沿切线方向向前看管道内壁
    // 后移 3 单位（管道半径 4），使前方管壁清晰可见
    const behind = tangent.clone().multiplyScalar(-8);
    camera.position.copy(point).add(behind);
    // 注意：controller.target 要设在相机前方，避免 OrbitControls.update()
    // 内部 lookAt(target) 覆盖视角方向（相机看向自身位置会丢失朝向）
    const lookTarget = point.clone().add(tangent.clone().multiplyScalar(10));
    controller.target.copy(lookTarget);
    camera.lookAt(lookTarget);
  } else {
    // 第三视角：正对点，垂直于轨迹方向观察
    // 计算切线的一个法线方向（与切线垂直）
    const up = new THREE.Vector3(0, 1, 0);
    // 若切线平行于 Y 轴，改用 Z 轴作为参考方向
    const ref = Math.abs(tangent.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : up;
    const perpendicular = new THREE.Vector3()
      .crossVectors(tangent, ref)
      .normalize();

    // 沿法线方向偏移
    const offset = perpendicular.multiplyScalar(thirdPersonDistance);

    camera.position.copy(point).add(offset);
    camera.lookAt(point);
  }

  controller.update();
}

export function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controller: OrbitControls,
  object: THREE.Object3D,
  offset: number = 1.4,
) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  distance *= offset;

  camera.position.set(center.x, center.y, center.z + distance);
  camera.lookAt(center);
  controller.target.copy(center);
  controller.update();
}

// ============================================================
// flyTo — CesiumJS 风格的相机平滑飞行
// ============================================================

export interface FlyToOptions {
  /** 目标点（最终 controller.target） */
  target: THREE.Vector3 | (() => THREE.Vector3);
  /** 相机最终位置，若不传则自动根据目标计算 */
  cameraPosition?: THREE.Vector3;
  /** 飞行持续秒数，默认自动根据距离计算（最大 maxDuration） */
  duration?: number;
  /** 自动计算时长时的上限（秒），默认 3 */
  maxDuration?: number;
  /** 弧线抬升比例（相对于飞行距离），默认 0.2；设为 0 则为直线 */
  arcRatio?: number;
  /** 飞行完成回调 */
  onComplete?: () => void;
  /** 每帧回调，传入当前进度 0-1 */
  onProgress?: (progress: number) => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * CesiumJS 风格的 flyTo 效果
 * - 相机从当前位置弧线飞向目标位置
 * - 同时 controller.target 平滑过渡到目标点
 * - 飞行期间禁用 OrbitControls，到达后自动恢复
 * - 返回 cancel 函数可随时中止飞行
 */
export function flyTo(
  camera: THREE.PerspectiveCamera,
  controller: OrbitControls,
  options: FlyToOptions,
): () => void {
  const {
    target,
    cameraPosition,
    duration,
    maxDuration = 3,
    arcRatio = 0.2,
    onComplete,
    onProgress,
  } = options;

  const startPos = camera.position.clone();
  const startTarget = controller.target.clone();
  const finalTarget = typeof target === "function" ? target() : target.clone();

  // 计算最终相机位置
  let finalPos: THREE.Vector3;
  if (cameraPosition) {
    finalPos = cameraPosition.clone();
  } else {
    // 从当前相机看向目标的方向自动推算一个合适的距离
    const dir = startPos.clone().sub(startTarget).normalize();
    // 到目标点的距离大约是当前到注视点距离的 1.2 倍
    const currentDist = startPos.distanceTo(startTarget);
    finalPos = finalTarget
      .clone()
      .add(dir.multiplyScalar(Math.max(currentDist, 500)));
  }

  // 计算飞行时长
  const totalDist = startPos.distanceTo(finalPos);
  const flyDuration =
    duration ?? Math.max(Math.min(totalDist / 500, maxDuration), 0.5);
  const startTime = performance.now();
  let frameId = 0;
  let isCancelled = false;

  // 飞行期间禁用 OrbitControls
  controller.enabled = false;
  controller.update();

  const tick = () => {
    if (isCancelled) return;

    const elapsed = (performance.now() - startTime) / 1000;
    const t = Math.min(elapsed / flyDuration, 1);
    const easedT = easeInOutCubic(t);

    // 插值相机位置（带弧线抬升）
    const currentPos = new THREE.Vector3().lerpVectors(
      startPos,
      finalPos,
      easedT,
    );
    const arcHeight = totalDist * arcRatio;
    currentPos.y += Math.sin(t * Math.PI) * arcHeight;
    camera.position.copy(currentPos);

    // 插值 target
    const currentTarget = new THREE.Vector3().lerpVectors(
      startTarget,
      finalTarget,
      easedT,
    );
    controller.target.copy(currentTarget);
    camera.lookAt(currentTarget);
    controller.update();

    onProgress?.(t);

    if (t >= 1) {
      controller.enabled = true;
      controller.update();
      onComplete?.();
      return;
    }

    frameId = requestAnimationFrame(tick);
  };

  tick();

  // 返回取消函数
  return () => {
    isCancelled = true;
    cancelAnimationFrame(frameId);
    controller.enabled = true;
    controller.update();
  };
}

/**
 * flyTo 的便捷版：自动根据物体的包围盒计算合适的相机位置
 */
export function flyToObject(
  camera: THREE.PerspectiveCamera,
  controller: OrbitControls,
  object: THREE.Object3D,
  options?: Omit<FlyToOptions, "target" | "cameraPosition">,
): () => void {
  return flyToFitGroup(camera, controller, [object], options);
}

export interface FlyToFitGroupOptions extends Omit<
  FlyToOptions,
  "target" | "cameraPosition"
> {
  /** fitCameraToObject 的 offset 倍数，默认 1.4 */
  offset?: number;
}

/**
 * flyTo 的增强版：合并多个 Group/Object3D 的包围盒，
 * 自动计算相机位置使所有物体完整可见
 */
export function flyToFitGroup(
  camera: THREE.PerspectiveCamera,
  controller: OrbitControls,
  groups: THREE.Object3D[],
  options?: FlyToFitGroupOptions,
): () => void {
  const box = new THREE.Box3();
  groups.forEach((g) => box.expandByObject(g));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const dist =
    Math.abs(maxDim / 2 / Math.tan(fov / 2)) * (options?.offset ?? 1.4);

  // 从当前相机方向飞向目标
  const currentDir = camera.position.clone().sub(controller.target).normalize();
  const cameraPos = center.clone().add(currentDir.multiplyScalar(dist));

  return flyTo(camera, controller, {
    target: center,
    cameraPosition: cameraPos,
    ...options,
  });
}

/**
 * 管道生长动画控制器
 * 通过 setDrawRange 控制几何体逐步绘制，实现从起点到终点的生长效果
 */
export interface GrowAnimationParams {
  geometry: THREE.BufferGeometry;
  /** 构成管子的段数，越多动画越平滑 */
  tubularSegments: number;
  /** 构成横截面的段数，越多管道横截面越圆，横截面段数（四边形个数）*2个三角形（一个四边形=2个三角形）*3个索引（一个三角形=3个索引） */
  indicesPerSegment: number;
  /** 完整生长一次所需秒数，默认 3 */
  duration?: number;
  /** 生长完成后停顿秒数，默认 1 */
  pauseDuration?: number;
  /** 每帧回调，提供当前进度 0-1 */
  onProgress?: (progress: number) => void;
}

export interface GrowAnimationControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  isPlaying: () => boolean;
}

/**
 * Three.js 通用点击事件封装
 * 使用 Raycaster 实现鼠标点击获取 3D 对象信息
 * 自动处理点击与拖拽（OrbitControls）的区分
 * @param domElement 渲染器的 DOM 元素
 * @param camera 透视相机
 * @param scene 场景对象
 * @param onClick 点击回调，返回所有射线击中的对象列表
 * @param filter 可选过滤函数，只在满足条件的物体上触发
 * @returns 清除函数，用于 onUnmounted 时移除事件监听
 *
 * @example
 * const removeClick = initRaycasterClick(
 *   renderer.value!.domElement,
 *   camera.value!,
 *   scene.value!,
 *   (intersects) => {
 *     const object = intersects[0].object;
 *     console.log(object.userData);
 *   },
 *   (obj) => !!obj.userData?.name,
 * );
 * onUnmounted(removeClick);
 */
function initRaycasterClick(
  domElement: HTMLElement,
  camera: THREE.Camera,
  scene: THREE.Scene,
  onClick: (intersects: THREE.Intersection[]) => void,
  filter?: (object: THREE.Object3D) => boolean,
): () => void {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let mouseDownPos = { x: 0, y: 0 };

  const handlePointerDown = (event: MouseEvent) => {
    mouseDownPos.x = event.clientX;
    mouseDownPos.y = event.clientY;
  };

  const handleClick = (event: MouseEvent) => {
    // 区分点击与拖拽（防止 OrbitControls 拖拽时误触）
    const dx = event.clientX - mouseDownPos.x;
    const dy = event.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return;
    // 将鼠标在屏幕上的像素坐标转换为 NDC（Normalized Device Coordinates，标准化设备坐标）
    const rect = domElement.getBoundingClientRect();
    // X 轴：画布左边缘→右边缘 映射为 -1 → +1
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    // Y 轴：画布上边缘→下边缘 映射为 +1 → -1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // 递归检测场景中所有子对象，按距离从近到远排序
    const intersects = raycaster.intersectObjects(scene.children, true);

    // 只检测最近的物体：如果最近的物体不满足 filter，说明被其他物体遮挡，不触发
    // 避免点击被遮挡的物体（例如管道挡在球体前面穿透点击到球体）
    // if (intersects.length > 0) {
    const nearest = intersects[0];
    if (!filter || filter(nearest.object)) {
      onClick(intersects);
    }
    // }
  };

  domElement.addEventListener("pointerdown", handlePointerDown);
  domElement.addEventListener("click", handleClick);

  return () => {
    domElement.removeEventListener("pointerdown", handlePointerDown);
    domElement.removeEventListener("click", handleClick);
  };
}
/**
 * @description 创建动画
 * @export
 * @param {GrowAnimationParams} params
 * @return {*}  {GrowAnimationControls}
 */
export function createGrowAnimation(
  params: GrowAnimationParams,
): GrowAnimationControls {
  const {
    geometry,
    tubularSegments,
    indicesPerSegment,
    duration = 3,
    pauseDuration = 1,
  } = params;

  const cycleDuration = duration + pauseDuration;
  let frameId = 0;
  let startTime = Date.now();
  let pauseTime = 0;
  let playing = false;

  const applyProgress = (t: number) => {
    const segments = Math.floor(t * tubularSegments);
    geometry.setDrawRange(0, segments * indicesPerSegment);
  };

  const tick = () => {
    if (!playing) return;
    const elapsed = (Date.now() - startTime) * 0.001;
    const cycleTime = elapsed % cycleDuration;
    const progress = Math.min(cycleTime / duration, 1);
    applyProgress(progress);
    params.onProgress?.(progress);
    frameId = requestAnimationFrame(tick);
  };

  return {
    /** 播放/继续动画 */
    play() {
      if (playing) return;
      playing = true;
      if (pauseTime > 0) {
        // 恢复：推移 startTime 跳过暂停时长，保持进度连续
        startTime += Date.now() - pauseTime;
        pauseTime = 0;
      }
      tick();
    },
    /** 暂停动画，保留当前进度 */
    pause() {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(frameId);
      pauseTime = Date.now();
    },
    /** 停止并重置到起点 */
    stop() {
      playing = false;
      cancelAnimationFrame(frameId);
      pauseTime = 0;
      startTime = Date.now();
      applyProgress(0);
      params.onProgress?.(0);
    },
    isPlaying() {
      return playing;
    },
  };
}

/** 文本 Sprite 样式配置 */
export interface TextSpriteOptions {
  /** 字号，默认 56 */
  fontSize?: number;
  /** 字体族，默认 "Arial, sans-serif" */
  fontFamily?: string;
  /** 字重，默认 "Bold" */
  fontWeight?: string;
  /** 字体颜色，默认 "#ffffff" */
  fontColor?: string;
  /** 背景色，默认 "rgba(0,0,0,0.35)" */
  backgroundColor?: string;
  /** 水平内边距，默认 20 */
  paddingX?: number;
  /** 垂直内边距，默认 16 */
  paddingY?: number;
  /** 行高倍数（相对于 fontSize），默认 1.4 */
  lineHeight?: number;
}

/**
 * @description 创建文本 Sprite，支持多行文本（\n 换行）和可配置字体样式
 * @description 返回的 updateText/updateOptions 方法可动态更新文本内容和样式
 * @export
 * @param {string} text 文本内容，支持 \n 换行
 * @param {TextSpriteOptions} [options] 可选的样式配置
 * @return {*}  {{
 *   sprite: THREE.Sprite;
 *   width: number;
 *   height: number;
 *   updateText: (newText: string) => void;
 *   updateOptions: (newOptions: Partial<TextSpriteOptions>) => void;
 * }}
 */
export function createTextSprite(
  text: string,
  options?: TextSpriteOptions,
): {
  sprite: THREE.Sprite;
  width: number;
  height: number;
  updateText: (newText: string) => void;
  updateOptions: (newOptions: Partial<TextSpriteOptions>) => void;
} {
  const {
    fontSize = 56,
    fontFamily = "Arial, sans-serif",
    fontWeight = "Bold",
    fontColor = "#ffffff",
    backgroundColor = "rgba(0,0,0,0.4)",
    paddingX = 20,
    paddingY = 16,
    lineHeight = 1.4,
  } = options ?? {};

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // 将样式存入对象，供后续更新使用
  const style: Required<TextSpriteOptions> = {
    fontSize,
    fontFamily,
    fontWeight,
    fontColor,
    backgroundColor,
    paddingX,
    paddingY,
    lineHeight,
  };

  // 当前文本
  let currentText = text;

  // 渲染函数：根据当前文本和样式重新绘制 canvas
  function render() {
    const lines = currentText.split("\n");
    const font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.font = font;

    // 计算最大行宽
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    }

    // 动态计算画布尺寸
    const totalTextHeight = lines.length * style.fontSize * style.lineHeight;
    const canvasW = Math.ceil(maxWidth + style.paddingX * 2);
    const canvasH = Math.ceil(totalTextHeight + style.paddingY * 2);
    canvas.width = canvasW;
    canvas.height = canvasH;

    // 背景
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 绘制每一行
    ctx.font = font;
    ctx.fillStyle = style.fontColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const startY =
      canvasH / 2 -
      ((lines.length - 1) * style.fontSize * style.lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * style.fontSize * style.lineHeight;
      ctx.fillText(lines[i], canvasW / 2, y);
    }

    texture.needsUpdate = true;
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  // 设置sprite始终在顶层，不被其他遮挡
  sprite.renderOrder = 1;

  // 首次渲染
  render();

  return {
    sprite,
    width: canvas.width,
    height: canvas.height,
    /** 更新文本内容，保持现有样式 */
    updateText(newText: string) {
      currentText = newText;
      render();
    },
    /** 更新样式配置，传入的属性将覆盖原有样式 */
    updateOptions(newOptions: Partial<TextSpriteOptions>) {
      Object.assign(style, newOptions);
      render();
    },
  };
}

/**
 * @description 创建钻井
 * @export
 * @return {*}  {THREE.Group}
 */
export function createDrillingRig(): THREE.Group {
  const group = new THREE.Group();

  const rigColor = 0xcc8844;
  const steelColor = 0x7788aa;

  // 井架参数：底部宽顶部窄的梯形四柱结构
  const baseW = 80;
  const topW = 20;
  const height = 300;
  const levels = 10;

  // 计算某高度比例 t 处四角的位置（线性收窄）
  const getCorners = (t: number) => {
    const w = baseW + (topW - baseW) * t;
    const y = t * height;
    return [
      new THREE.Vector3(-w / 2, y, -w / 2),
      new THREE.Vector3(w / 2, y, -w / 2),
      new THREE.Vector3(w / 2, y, w / 2),
      new THREE.Vector3(-w / 2, y, w / 2),
    ];
  };

  // █ 底部平台
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(baseW + 40, 8, baseW + 40),
    new THREE.MeshBasicMaterial({ color: 0x555555 }),
  );
  baseMesh.position.set(0, -4, 0);
  group.add(baseMesh);

  // █ 四根斜立柱（从底部角延伸到顶部角）
  const legMat = new THREE.MeshBasicMaterial({ color: steelColor });
  for (let c = 0; c < 4; c++) {
    const p0 = getCorners(0)[c];
    const p1 = getCorners(1)[c];
    const mid = new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5);
    const dir = new THREE.Vector3().copy(p1).sub(p0);
    const len = dir.length();
    dir.normalize();
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3, len, 8),
      legMat,
    );
    leg.position.copy(mid);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(leg);
  }

  // █ 水平横梁与对角斜撑
  const beamMat = new THREE.LineBasicMaterial({ color: rigColor });
  const diagMat = new THREE.LineBasicMaterial({ color: 0x996644 });

  for (let i = 0; i < levels; i++) {
    const t = i / levels;
    const corners = getCorners(t);
    const nextCorners = getCorners((i + 1) / levels);

    for (let c = 0; c < 4; c++) {
      const next = (c + 1) % 4;

      // 水平横梁（当前层四边）
      const beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([corners[c], corners[next]]),
        beamMat,
      );
      group.add(beam);

      // 对角斜撑（当前层 → 下一层，X形交叉）
      const d1 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          corners[c],
          nextCorners[next],
        ]),
        diagMat,
      );
      group.add(d1);

      const d2 = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          corners[next],
          nextCorners[c],
        ]),
        diagMat,
      );
      group.add(d2);
    }
  }

  // 顶层水平环（最后一条）
  const topCorners = getCorners(1);
  for (let c = 0; c < 4; c++) {
    const next = (c + 1) % 4;
    const beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        topCorners[c],
        topCorners[next],
      ]),
      beamMat,
    );
    group.add(beam);
  }

  // █ 天车（顶部平台）
  const crownBlock = new THREE.Mesh(
    new THREE.BoxGeometry(topW + 12, 5, topW + 12),
    new THREE.MeshBasicMaterial({ color: steelColor }),
  );
  crownBlock.position.set(0, height + 2.5, 0);
  group.add(crownBlock);

  // █ 顶部滑轮
  const pulley = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 6, 12),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
  );
  pulley.position.set(0, height + 8, 0);
  group.add(pulley);

  // █ 游动滑车 / 钻杆（从顶部悬垂下来）
  const drillPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, height, 6),
    new THREE.MeshBasicMaterial({ color: 0x999999 }),
  );
  drillPipe.position.set(0, height / 2, 0);
  group.add(drillPipe);

  // 地面固定锚点装饰
  for (let c = 0; c < 4; c++) {
    const anchor = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 6, 4, 6),
      new THREE.MeshBasicMaterial({ color: 0x666666 }),
    );
    const pos = getCorners(0)[c];
    anchor.position.set(pos.x, -2, pos.z);
    group.add(anchor);
  }

  return group;
}

// ============================================
// DEM 高程图 · 地形起伏 · 通用工具
// ============================================

// ---------- 类型定义 ----------

export interface HeightmapData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface SurfaceExtent {
  maxX: number;
  maxZ: number;
  minZ: number;
}

// ---------- 模块级状态 ----------

export let heightmapData: HeightmapData | null = null;
export const heightmapScale = ref(120);
export let surfaceExtent: SurfaceExtent = { maxX: 1, maxZ: 1, minZ: -1 };

export function setSurfaceExtent(extent: SurfaceExtent) {
  surfaceExtent = extent;
}

// ---------- 高程着色色带 ----------

const ELEVATION_STOPS = [
  { t: 0.0, color: new THREE.Color(0x1a3a5c) },
  { t: 0.15, color: new THREE.Color(0x1a6b3c) },
  { t: 0.3, color: new THREE.Color(0x3d9e4a) },
  { t: 0.45, color: new THREE.Color(0x8ab83a) },
  { t: 0.6, color: new THREE.Color(0xd4b83a) },
  { t: 0.75, color: new THREE.Color(0x9a6a2a) },
  { t: 0.88, color: new THREE.Color(0x6a4a2a) },
  { t: 1.0, color: new THREE.Color(0xf0f0f0) },
];

/** 根据归一化高度获取色带颜色 */
export function getElevationColor(t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < ELEVATION_STOPS.length - 1; i++) {
    const lo = ELEVATION_STOPS[i];
    const hi = ELEVATION_STOPS[i + 1];
    if (clamped >= lo.t && clamped <= hi.t) {
      const localT = (clamped - lo.t) / (hi.t - lo.t);
      return lo.color.clone().lerp(hi.color, localT);
    }
  }
  return ELEVATION_STOPS[ELEVATION_STOPS.length - 1].color.clone();
}

// ---------- 高程图加载 · 采样 ----------

/** 加载灰度高程图并读取像素数据 */
export function loadHeightmap(src = "/three/stratum/m1.png"): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      heightmapData = {
        data: imageData.data,
        width: img.width,
        height: img.height,
      };
      console.log(`[DEM] 高程图加载完成: ${img.width}x${img.height}`);
      resolve();
    };
    img.onerror = () => {
      console.warn("[DEM] 高程图加载失败，使用数学模拟起伏");
      resolve();
    };
    img.src = src;
  });
}

/** 双线性插值采样高程图，返回归一化高度 [0, 1] */
export function sampleHeightmap(
  x: number,
  z: number,
  extent: SurfaceExtent,
): number {
  if (!heightmapData) return 0;

  const { maxX, maxZ, minZ } = extent;

  const u = (x + maxX) / (2 * maxX);
  const v = (z - minZ) / (maxZ - minZ);
  const uClamped = Math.max(0, Math.min(1, u));
  const vClamped = Math.max(0, Math.min(1, v));

  const px = uClamped * (heightmapData.width - 1);
  const py = (1 - vClamped) * (heightmapData.height - 1);

  const x0 = Math.floor(px);
  const x1 = Math.min(x0 + 1, heightmapData.width - 1);
  const y0 = Math.floor(py);
  const y1 = Math.min(y0 + 1, heightmapData.height - 1);
  const fx = px - x0;
  const fy = py - y0;

  const getGray = (px2: number, py2: number) => {
    const idx = (py2 * heightmapData!.width + px2) * 4;
    return heightmapData!.data[idx] / 255;
  };

  const h00 = getGray(x0, y0);
  const h10 = getGray(x1, y0);
  const h01 = getGray(x0, y1);
  const h11 = getGray(x1, y1);

  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  return h0 * (1 - fy) + h1 * fy;
}

// ---------- 地表 vertex colors ----------

/** 为地表网格应用基于高程的 vertex colors */
export function applySurfaceVertexColors(
  geometry: THREE.BoxGeometry | THREE.BufferGeometry,
  orig: Float32Array,
): void {
  const positions = geometry.attributes.position.array as Float32Array;
  const count = positions.length / 3;
  const colors = new Float32Array(count * 3);

  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(orig[i + 1]) < 0.1) {
      minH = Math.min(minH, positions[i + 1]);
      maxH = Math.max(maxH, positions[i + 1]);
    }
  }
  const range = maxH - minH || 1;

  for (let i = 0; i < count; i++) {
    const idx3 = i * 3;
    if (Math.abs(orig[idx3 + 1]) < 0.1) {
      const t = (positions[idx3 + 1] - minH) / range;
      const color = getElevationColor(t);
      colors[idx3] = color.r;
      colors[idx3 + 1] = color.g;
      colors[idx3 + 2] = color.b;
    } else {
      colors[idx3] = 0.5;
      colors[idx3 + 1] = 0.5;
      colors[idx3 + 2] = 0.5;
    }
  }

  const existing = geometry.attributes.color;
  if (existing) {
    (existing.array as Float32Array).set(colors);
    existing.needsUpdate = true;
  } else {
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
}

// ---------- 地表起伏 ----------

/** 地表起伏数学模拟回退方案 */
export function applySurfaceUndulationsFallback(
  positions: Float32Array,
  orig: Float32Array,
): void {
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(orig[i + 1]) < 0.1) {
      const x = orig[i];
      const z = orig[i + 2];
      const h1 = 65 * Math.sin(x / 120) * Math.cos(z / 100);
      const h2 = 40 * Math.sin(x / 250 + 1.5) * Math.cos(z / 200 + 0.8);
      const h3 = 25 * Math.sin(x / 400 + 3) * Math.cos(z / 300 + 2);
      positions[i + 1] = orig[i + 1] + h1 + h2 + h3;
    }
  }
}

/** 给地表层(第一层)添加基于 DEM 的起伏 */
export function applySurfaceUndulations(
  positions: Float32Array,
  orig: Float32Array,
): void {
  if (!heightmapData) {
    applySurfaceUndulationsFallback(positions, orig);
    return;
  }
  const scale = heightmapScale.value;
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(orig[i + 1]) < 0.1) {
      const x = orig[i];
      const z = orig[i + 2];
      const h = sampleHeightmap(x, z, surfaceExtent);
      positions[i + 1] = orig[i + 1] + h * scale;
    }
  }
}

// ---------- 地下各层波浪起伏 ----------

/** 给地下各层添加波浪起伏 */
export function applyLayerUndulations(
  positions: Float32Array,
  orig: Float32Array,
): void {
  for (let i = 0; i < positions.length; i += 3) {
    if (Math.abs(orig[i + 1]) < 0.1) {
      const x = orig[i];
      const z = orig[i + 2];
      const w1 = 20 * Math.sin(x / 150 + z / 120);
      const w2 = 12 * Math.sin(x / 80 - z / 70 + 1.2);
      const w3 = 8 * Math.sin(x / 250 + z / 200 + 0.5);
      positions[i + 1] = orig[i + 1] + w1 + w2 + w3;
    }
  }
}

/** 恢复顶点到原始位置 */
export function resetMeshVertices(
  positions: Float32Array,
  orig: Float32Array,
): void {
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = orig[i];
    positions[i + 1] = orig[i + 1];
    positions[i + 2] = orig[i + 2];
  }
}

// ---------- 通用工具 ----------

/** 从地层数据中计算 X / Z 轴范围 */
export function getMaxMin(layerData: any[]) {
  let maxX = 0;
  let maxZ = 0;
  let minZ = 0;
  layerData.forEach((layer: any) => {
    const maxXX = Math.max(
      ...layer.position.map((position: any) => position[0]),
    );
    const maxZZ = Math.max(
      ...layer.position.map((position: any) => position[2]),
    );
    const minZZ = Math.min(
      ...layer.position.map((position: any) => position[2]),
    );
    if (maxXX > maxX) maxX = maxXX;
    if (maxZZ > maxZ) maxZ = maxZZ;
    if (minZZ < minZ) minZ = minZZ;
  });
  return { maxX, maxZ, minZ };
}
