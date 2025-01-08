<template>
  <div class="three">
    <div class="three-demo" ref="threeDemo"></div>
    <el-button
      type="primary"
      size="small"
      @click="triggerFullScreen"
      class="to-full"
      >{{ toFullScreen }}</el-button
    >
  </div>
</template>

<script lang="ts">
export default { name: "Demo" };
</script>
<script lang="ts" setup>
import * as THREE from "three";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
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
const fullscreen = ref(false);
const toFullScreen = computed(() => {
  return fullscreen.value ? "退出全屏" : "进入全屏";
});
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

  threeConfig.renderder.setSize(el.offsetWidth, el.offsetHeight);

  initBox();

  initAxesHelper();

  initController();

  initGUI();

  cubeBuffer();

  el.appendChild(threeConfig.renderder.domElement);

  // 渲染场景
  threeConfig.renderder.render(threeConfig.scene, threeConfig.camera);

  // 动画
  animate();
};
/**
 * @description 初始化物体
 */
const initBox = () => {
  // 几何体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // 材质
  threeConfig.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const childMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  // 网格
  threeConfig.cube = new THREE.Mesh(geometry, threeConfig.material);
  // 添加到场景中
  threeConfig.scene?.add(threeConfig.cube);
  let childCube = new THREE.Mesh(geometry, childMaterial);
  threeConfig.cube.add(childCube);
  childCube.position.set(-3, 0, 0);
  // threeConfig.cube.position.set(0, 2, 0);
  threeConfig.cube.rotation.set(Math.PI / 4, 0, 0);
  threeConfig.cube.rotation.set(0, Math.PI / 4, 0);
};
/**
 * @description 动画
 */
const animate = () => {
  threeConfig.controller?.update();
  requestAnimationFrame(animate);
  // let x = threeConfig.cube?.rotation.x!;
  // let y = threeConfig.cube?.rotation.y!;
  // threeConfig.cube?.rotation.set(x + 0.01, y + 0.01, 0);
  threeConfig.renderder?.render(threeConfig.scene!, threeConfig.camera!);
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
 * @description 自适应页面宽度
 */
const resetScene = () => {
  // 重置渲染器宽高比
  threeConfig.renderder?.setSize(window.innerWidth, window.innerHeight);
  // 设置相机宽高比
  threeConfig.camera!.aspect = window.innerWidth / window.innerHeight;
  // 更新相机投影矩阵
  threeConfig.camera!.updateProjectionMatrix();
};
/**
 * @description 全屏
 */
const triggerFullScreen = () => {
  if (!fullscreen.value) {
    document.body.requestFullscreen();
    fullscreen.value = true;
  } else {
    document.exitFullscreen();
    fullscreen.value = false;
  }
};
/**
 * @description 初始化GUI
 */
const initGUI = () => {
  const eventObj = {
    fullScreen: () => {
      document.body.requestFullscreen();
      fullscreen.value = true;
    },
    exitFullscreen: () => {
      document.exitFullscreen();
      fullscreen.value = false;
    },
  };
  gui = new GUI();
  // 自定义事件
  gui.add(eventObj, "fullScreen").name("全屏");
  gui.add(eventObj, "exitFullscreen").name("退出全屏");
  // 控制立方体位置
  const folder = gui.addFolder("立方体位置");
  folder
    .add(threeConfig.cube!.position, "x")
    .name("x轴位置")
    .min(-10)
    .max(10)
    .step(1)
    .onChange((value) => {
      console.log("x:", value);
    });
  folder
    .add(threeConfig.cube!.position, "y")
    .name("y轴位置")
    .min(-10)
    .max(10)
    .step(1)
    .onFinishChange((value) => {
      console.log("y:", value);
    });
  folder
    .add(threeConfig.cube!.position, "z")
    .name("z轴位置")
    .min(-10)
    .max(10)
    .step(1);
  // 线框模式
  gui.add(threeConfig.material!, "wireframe").name("线框模式");
  // 颜色
  const colorConfig = {
    color: "#00ff00",
  };
  gui.addColor(colorConfig, "color").onChange((value) => {
    threeConfig.material?.color.set(value);
  });
  //
};
/**
 * @description 几何体 顶点 索引 面
 */
const cubeBuffer = () => {
  // // 顶点为6，不共用顶点
  // const geometry = new THREE.BufferGeometry();
  // // 创建顶点数据 每三个为一个顶点，每个顶点包含x,y,z坐标，逆时针为正面 看得到，顺时针为反面 看不到
  // const vertices = new Float32Array([
  //   1, -1.0, -2, 3.0, -1.0, -2, 3.0, 1.0, -2, 1, -1.0, -2, 1.0, 1.0, -2, 3.0,
  //   1.0, -2,
  // ]);
  // // 创建顶点数据
  // geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // // 材质
  // const material = new THREE.MeshBasicMaterial({
  //   color: 0xff0000,
  //   // wireframe: true,
  //   // side: THREE.DoubleSide, //2面都能看到
  // });
  // const mesh = new THREE.Mesh(geometry, material);
  // threeConfig.scene?.add(mesh);

  // 顶点为4，共用顶点
  const geometry = new THREE.BufferGeometry();
  // 创建顶点数据 每三个为一个顶点，每个顶点包含x,y,z坐标，逆时针为正面 看得到，顺时针为反面 看不到
  const vertices = new Float32Array([
    1, -1.0, -2, 3.0, -1.0, -2, 3.0, 1.0, -2, 1, 1.0, -2,
  ]);
  // 创建顶点数据
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // 创建索引
  const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);
  // 设置索引
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  // 材质
  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    // wireframe: true,
    // side: THREE.DoubleSide, //2面都能看到
  });
  const material1 = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    // wireframe: true,
    // side: THREE.DoubleSide, //2面都能看到
  });
  // 添加顶点组
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  // 每个组设置不同颜色
  const mesh = new THREE.Mesh(geometry, [material, material1]);
  threeConfig.scene?.add(mesh);
};

onMounted(() => {
  initThree();
  window.addEventListener("resize", resetScene);
});
onBeforeUnmount(() => {
  gui.destroy();
  window.removeEventListener("resize", resetScene);
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
