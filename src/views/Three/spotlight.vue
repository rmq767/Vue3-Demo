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
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

// 灯光阴影
// 1、材质要满足能够对光照有反应
// 2、设置渲染器开启阴影计算 render.shadowMap.enabled = true;
// 3、设置光照投射阴影 light.castShadow = true;
// 4、设置物体投射阴影 sphere.castShadow = true;
// 4、设置物体接收阴影 plane.receiveShadow = true;

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

const initThree = () => {
  const el = threeDemo.value;
  // 场景
  threeConfig.scene = new THREE.Scene();
  // 相机
  threeConfig.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  threeConfig.camera.position.set(2, 2, 5);
  threeConfig.camera.lookAt(0, 0, 0);
  // 渲染器
  threeConfig.renderder = new THREE.WebGLRenderer({ antialias: true }); //抗锯齿
  // 开启投射阴影
  (threeConfig.renderder as any).shadowMap.enabled = true;

  threeConfig.renderder.setSize(el.offsetWidth, el.offsetHeight);

  initCircle();

  initAxesHelper();

  initController();

  el.appendChild(threeConfig.renderder.domElement);

  // 渲染场景
  threeConfig.renderder.render(threeConfig.scene, threeConfig.camera);

  // 动画
  update();
};
/**
 * @description 初始化物体
 */
const initCircle = () => {
  // 添加物体
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({});
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(0, 0, 0);
  // 投射阴影
  sphere.castShadow = true;
  threeConfig.scene?.add(sphere);
  // 创建平面
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const plane = new THREE.Mesh(planeGeometry, sphereMaterial);
  plane.position.set(0, -1, 0);
  plane.rotation.x = -Math.PI / 2;
  //平面接收阴影
  plane.receiveShadow = true;
  threeConfig.scene?.add(plane);
  // 添加光源
  const light = new THREE.AmbientLight(0xffffff, 1);
  threeConfig.scene?.add(light);
  // 添加直线光
  const spotLight = new THREE.SpotLight(0xffffff, 2);
  spotLight.position.set(5, 5, 5);
  // 衰减 0才能展示出来
  spotLight.decay = 0;
  spotLight.distance = 0;
  // 阴影模糊度
  spotLight.shadow.radius = 20;
  // 阴影贴图分辨率
  spotLight.shadow.mapSize.set(2048, 2048);
  // 投射阴影
  spotLight.castShadow = true;
  // 投射目标
  spotLight.target = sphere;
  threeConfig.scene?.add(spotLight);

  gui = new GUI();
  gui.add(sphere.position, "x").min(-10).max(10).step(0.01).name("x");
  gui
    .add(spotLight, "angle")
    .min(0)
    .max(Math.PI / 2)
    .step(0.01)
    .name("angle");
  gui.add(spotLight, "distance").min(0).max(20).step(0.01).name("distance");
  gui.add(spotLight, "penumbra").min(0).max(1).step(0.01).name("penumbra");
  gui.add(spotLight, "decay").min(0).max(10).step(0.01).name("decay");
};
/**
 * @description 世界坐标辅助器
 */
const initAxesHelper = () => {
  const axesHelper = new THREE.AxesHelper(10);
  threeConfig.scene?.add(axesHelper);
};
/**
 * @description 初始化控制器
 */
const initController = () => {
  threeConfig.controller = new OrbitControls(
    threeConfig.camera!,
    threeConfig.renderder?.domElement
  );
  // 自动旋转
  // threeConfig.controller.autoRotate = true;
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
