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
import { onMounted, ref } from "vue";
import { ThreeConfig } from ".";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as TWEEN from "three/examples/jsm/libs/tween.module.js";
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
  const geometry1 = new THREE.BoxGeometry(1, 1, 1);
  // 材质
  threeConfig.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // 网格
  threeConfig.cube = new THREE.Mesh(geometry1, threeConfig.material);
  // 添加到场景中
  threeConfig.scene?.add(threeConfig.cube);

  const geometry2 = new THREE.BoxGeometry(1, 1, 1);
  const material2 = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const cube2 = new THREE.Mesh(geometry2, material2);
  cube2.position.set(-4, 0, 0);
  threeConfig.scene?.add(cube2);

  const geometry3 = new THREE.BoxGeometry(1, 1, 1);
  const material3 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const cube3 = new THREE.Mesh(geometry3, material3);
  cube3.position.set(4, 0, 0);
  threeConfig.scene?.add(cube3);

  cube2.position.set(0, 0, 2);
  console.log(cube2);
  geometry3.translate(0, 0, 2);
  console.log(geometry3);

  // 创建射线
  const raycaster = new THREE.Raycaster();
  // 创建鼠标向量
  const mouse = new THREE.Vector2();

  // 监听鼠标移动
  window.addEventListener("click", (e) => {
    // 计算鼠标在canvas画布上的位置
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // 通过鼠标向量和射线计算出射线和物体的交点
    raycaster.setFromCamera(mouse, threeConfig.camera!);
    const intersects = raycaster.intersectObjects(threeConfig.scene!.children);

    if (intersects.length > 0) {
      if (intersects[0].object._isSelect) {
        intersects[0].object._isSelect = false;
        intersects[0].object.material.color.set(intersects[0].object._orgColor);
      } else {
        intersects[0].object._isSelect = true;
        intersects[0].object._orgColor =
          intersects[0].object.material.color.getHex();
        intersects[0].object.material.color.set(0xff0000);
      }
    }
  });

  // 创建补间动画
  const tween = new TWEEN.Tween(threeConfig.cube!.position);
  tween.to({ y: 3 }, 2000);
  // 重复次数
  // tween.repeat(Infinity);
  // 循环往复
  // tween.yoyo(true);
  // 运动函数
  const tween2 = new TWEEN.Tween(threeConfig.cube!.position);
  tween2.to({ y: 0 }, 2000);
  // 链接动画
  tween.chain(tween2);
  tween.easing(TWEEN.Easing.Quadratic.InOut);
  tween.start();
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
  TWEEN.update();
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
