import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PALETTE, TOTAL_DEPTH } from "./tokens";

/** 高 DPI 屏上的像素比封顶，再高只是把 fill-rate 烧在看不见的细节上 */
const MAX_DPR = 1.5;

const HOME = {
  position: new THREE.Vector3(205, 118, 235),
  target: new THREE.Vector3(0, -TOTAL_DEPTH * 0.28, 0),
};

export interface StageStats {
  fps: number;
  /** 每秒真实渲染次数，按需渲染时会明显低于 fps */
  renderHz: number;
  /** 提交绘制命令的 CPU 耗时，不含 GPU 时间 */
  frameMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  dpr: number;
}

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  invalidate(): void;
  setPostProcessing(on: boolean): void;
  setOnDemand(on: boolean): void;
  setAutoRotate(on: boolean): void;
  setShadows(on: boolean): void;
  flyTo(position: THREE.Vector3, target: THREE.Vector3): void;
  resetView(): void;
  stats(): StageStats;
  dispose(): void;
}

interface Flight {
  from: THREE.Vector3;
  to: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  startedAt: number;
  duration: number;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = (mesh as THREE.Mesh).material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    list.forEach((item) => {
      const withMaps = item as THREE.MeshStandardMaterial;
      if (withMaps.map) withMaps.map.dispose();
      item.dispose();
    });
  });
}

export function createStage(host: HTMLElement): Stage {
  const getSize = () => ({
    width: host.clientWidth || 1,
    height: host.clientHeight || 1,
  });
  const { width, height } = getSize();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 剖切走材质级 clippingPlanes 而非全局，这样能把井眼排除在切割之外
  renderer.localClippingEnabled = true;
  // 后处理一帧内会多次调用 render，自动复位会把统计读成最后一个 pass
  renderer.info.autoReset = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  Object.assign(labelRenderer.domElement.style, {
    position: "absolute",
    top: "0",
    left: "0",
    pointerEvents: "none",
  });
  host.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.canvas);
  // 不加雾：块体对角半径约 165 m，任何按距离衰减的雾都会在拉远时把
  // 整块岩体洗成背景色，看起来像「缩放后模型消失」

  const camera = new THREE.PerspectiveCamera(
    48,
    width / height,
    0.5,
    3000
  );
  camera.position.copy(HOME.position);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 190;
  controls.maxDistance = 720;
  controls.maxPolarAngle = Math.PI * 0.93;
  controls.autoRotateSpeed = 0.55;
  // OrbitControls 的 dolly 不吃 enableDamping（阻尼只作用于旋转与平移），
  // handleMouseWheel 会立刻 update() 把 scale 消费掉，所以原生滚轮是一格一跳。
  // 这里关掉它的缩放，改由下方 stepZoom 自己缓动。
  controls.enableZoom = false;
  controls.update();

  // 浅底棚光环境：半球光给天光地面反，主光出阴影，补光把背光面抬回可读亮度
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb6c0c8, 1.15);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff6e8, 2.1);
  key.position.set(180, 300, 150);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -220;
  key.shadow.camera.right = 220;
  key.shadow.camera.top = 220;
  key.shadow.camera.bottom = -220;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 900;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.8;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce9ff, 0.5);
  fill.position.set(-200, 90, -160);
  scene.add(fill);

  let composer: EffectComposer | null = null;
  const buildComposer = () => {
    const built = new EffectComposer(renderer);
    built.addPass(new RenderPass(scene, camera));
    built.addPass(new SMAAPass(width, height));
    built.addPass(new OutputPass());
    const { width: w, height: h } = getSize();
    built.setSize(w, h);
    return built;
  };

  let postProcessing = false;
  let onDemand = true;
  let needsRender = true;
  let rafId = 0;
  let disposed = false;
  let flight: Flight | null = null;

  let frames = 0;
  let renders = 0;
  let windowStart = performance.now();
  let fps = 0;
  let renderHz = 0;
  let frameMs = 0;

  const invalidate = () => {
    needsRender = true;
  };

  // OrbitControls 的 handleMouseWheel 内部会自己调一次 update() 把位移消费掉，
  // 之后 rAF 里的 update() 返回 false —— 只靠返回值置脏会整帧漏掉滚轮，
  // 必须听 change 事件。
  controls.addEventListener("change", invalidate);

  // ---- 自管缩放：以光标下的世界点为锚位，逐帧缓动半径与 target ----
  const ZOOM_SPEED = 1;
  /** 每 16.7ms 收敛掉的剩余差距比例，越大越跟手 */
  const ZOOM_EASE = 0.22;
  const zoomRay = new THREE.Raycaster();
  const zoomNdc = new THREE.Vector2();
  const anchorPoint = new THREE.Vector3();
  const viewDir = new THREE.Vector3();
  const idealTarget = new THREE.Vector3().copy(controls.target);
  let idealRadius = camera.position.distanceTo(controls.target);

  const normalizeWheel = (event: WheelEvent): number => {
    if (event.deltaMode === 1) return event.deltaY * 16;
    if (event.deltaMode === 2) return event.deltaY * 100;
    return event.deltaY;
  };

  const onWheel = (event: WheelEvent) => {
    const delta = normalizeWheel(event);
    if (delta === 0) return;
    event.preventDefault();

    const rect = renderer.domElement.getBoundingClientRect();
    zoomNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    zoomRay.setFromCamera(zoomNdc, camera);

    const current = camera.position.distanceTo(controls.target);
    const factor = Math.pow(0.95, ZOOM_SPEED * Math.abs(delta * 0.01));
    const next = THREE.MathUtils.clamp(
      delta < 0 ? current * factor : current / factor,
      controls.minDistance,
      controls.maxDistance
    );
    // 锚位取光标射线上、当前 target 深度处；缩放时让它留在屏幕同一点
    zoomRay.ray.at(current, anchorPoint);
    idealRadius = next;
    idealTarget
      .copy(controls.target)
      .sub(anchorPoint)
      .multiplyScalar(next / current)
      .add(anchorPoint);
    invalidate();
  };

  const stepZoom = (dt: number) => {
    if (flight) return;
    const current = camera.position.distanceTo(controls.target);
    const radiusGap = idealRadius - current;
    if (Math.abs(radiusGap) < 0.05 && idealTarget.distanceTo(controls.target) < 0.05) {
      return;
    }
    const t = 1 - Math.pow(1 - ZOOM_EASE, dt * 60);
    viewDir.subVectors(camera.position, controls.target).normalize();
    controls.target.lerp(idealTarget, t);
    camera.position
      .copy(controls.target)
      .addScaledVector(viewDir, current + radiusGap * t);
    invalidate();
  };

  const stepFlight = () => {
    if (!flight) return;
    const t = (performance.now() - flight.startedAt) / flight.duration;
    if (t >= 1) {
      camera.position.copy(flight.to);
      controls.target.copy(flight.toTarget);
      flight = null;
      // 飞行结束后把缩放理想值对齐到当前状态，否则 stepZoom 会把镜头拽回去
      idealRadius = camera.position.distanceTo(controls.target);
      idealTarget.copy(controls.target);
    } else {
      // easeOutCubic：起步快、落点稳，和大屏镜头时间线一致
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(flight.from, flight.to, eased);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
    }
    invalidate();
  };

  const sampleStats = () => {
    const elapsed = performance.now() - windowStart;
    if (elapsed < 500) return;
    fps = (frames * 1000) / elapsed;
    renderHz = (renders * 1000) / elapsed;
    frames = 0;
    renders = 0;
    windowStart = performance.now();
  };

  let lastFrameAt = performance.now();

  const loop = () => {
    if (disposed) return;
    rafId = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - lastFrameAt) / 1000, 0.1);
    lastFrameAt = now;
    frames++;
    if (controls.update()) invalidate();
    stepFlight();
    stepZoom(dt);
    // 常开模式每帧都渲染；按需模式只在交互/动画置脏后出图
    if (onDemand && !needsRender) {
      sampleStats();
      return;
    }
    needsRender = false;

    const startedAt = performance.now();
    renderer.info.reset();
    if (postProcessing && composer) composer.render();
    else renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    frameMs = performance.now() - startedAt;
    renders++;
    sampleStats();
  };

  const resize = () => {
    const { width: w, height: h } = getSize();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    composer?.setSize(w, h);
    invalidate();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  const setShadows = (on: boolean) => {
    renderer.shadowMap.enabled = on;
    // 开关阴影会改变着色器定义，不重建程序的话材质会停在旧阴影状态
    scene.traverse((node) => {
      const material = (node as THREE.Mesh).material;
      if (!material) return;
      (Array.isArray(material) ? material : [material]).forEach(
        (item) => (item.needsUpdate = true)
      );
    });
    invalidate();
  };

  const setPostProcessing = (on: boolean) => {
    postProcessing = on;
    if (on && !composer) composer = buildComposer();
    invalidate();
  };

  const setOnDemand = (on: boolean) => {
    onDemand = on;
    if (!on) needsRender = true;
    invalidate();
  };

  const setAutoRotate = (on: boolean) => {
    controls.autoRotate = on;
    invalidate();
  };

  const flyTo = (position: THREE.Vector3, target: THREE.Vector3) => {
    flight = {
      from: camera.position.clone(),
      to: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone(),
      startedAt: performance.now(),
      duration: 700,
    };
  };

  const resetView = () => {
    flyTo(HOME.position, HOME.target);
  };

  const stats = (): StageStats => ({
    fps,
    renderHz,
    frameMs,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    dpr: renderer.getPixelRatio(),
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    observer.disconnect();
    renderer.domElement.removeEventListener("wheel", onWheel);
    controls.removeEventListener("change", invalidate);
    controls.dispose();
    disposeObject(scene);
    composer?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    labelRenderer.domElement.remove();
  };

  invalidate();
  loop();

  return {
    scene,
    camera,
    renderer,
    controls,
    invalidate,
    setPostProcessing,
    setOnDemand,
    setAutoRotate,
    setShadows,
    flyTo,
    resetView,
    stats,
    dispose,
  };
}
