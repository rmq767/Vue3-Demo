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

const threeConfig: ThreeConfig = {
  scene: null,
  camera: null,
  renderder: null,
  cube: null,
  controller: null,
  material: null,
};

const threeDemo = ref();

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

  threeConfig.renderder.setSize(el.offsetWidth, el.offsetHeight);

  initBox();

  initAxesHelper();

  initController();

  initFog();

  el.appendChild(threeConfig.renderder.domElement);

  // 渲染场景
  threeConfig.renderder.render(threeConfig.scene, threeConfig.camera);

  // 动画
  update();
};
/**
 * @description 初始化物体
 */
const initBox = () => {
  // 几何体
  const geometry = new THREE.BoxGeometry(1, 1, 100);
  // 材质
  threeConfig.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // 网格
  threeConfig.cube = new THREE.Mesh(geometry, threeConfig.material);
  // 添加到场景中
  threeConfig.scene?.add(threeConfig.cube);
  threeConfig.cube.rotation.set(Math.PI / 4, 0, 0);
  threeConfig.cube.rotation.set(0, Math.PI / 4, 0);
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
/**
 * @description 设置雾
 */
const initFog = () => {
  // 雾
  threeConfig.scene!.fog = new THREE.Fog(0x999999, 0.1, 50);
  // 指数雾
  // threeConfig.scene!.fog = new THREE.FogExp2(0x999999, 0.5);
  threeConfig.scene!.background = new THREE.Color(0x999999);
};

const update = () => {
  threeConfig.controller?.update();
  threeConfig.renderder?.render(threeConfig.scene!, threeConfig.camera!);
  requestAnimationFrame(update);
};
onMounted(() => {
  initThree();
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
