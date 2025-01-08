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
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  threeConfig.camera.position.set(2, 2, 20);
  threeConfig.camera.lookAt(0, 0, 0);
  // 渲染器
  threeConfig.renderder = new THREE.WebGLRenderer({ antialias: true }); //抗锯齿

  threeConfig.renderder.setSize(el.offsetWidth, el.offsetHeight);

  initBox();

  initAxesHelper();

  initController();

  // initFog();

  initGLTF();

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

  gui = new GUI();
  gui
    .add(threeConfig.material, "aoMapIntensity")
    .min(0)
    .max(1)
    .step(0.1)
    .name("ao强度");
};

// 加载gltf
const initGLTF = () => {
  const loader = new GLTFLoader();
  loader.load("./three/dpf/大牌坊.gltf", (gltf) => {
    console.log(gltf);
    // threeConfig.scene!.add(gltf.scene);
    // 获取group里面的所有几何体 转化成线框
    gltf.scene.traverse((child: any) => {
      if (child.isObject3D) {
        const geo = child.geometry;
        const edgesGeo = new THREE.EdgesGeometry(geo);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const wireframe = new THREE.LineSegments(edgesGeo, edgesMaterial);
        threeConfig.scene!.add(wireframe);
      }
    });
    // const groupChild = gltf.scene.children[0].children;
    // groupChild.forEach((element) => {
    //   const geo = element.geometry;
    //   const edgesGeo = new THREE.EdgesGeometry(geo);
    //   const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    //   const wireframe = new THREE.LineSegments(edgesGeo, edgesMaterial);
    //   threeConfig.scene!.add(wireframe);
    // });
  });
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
  threeConfig.scene!.fog = new THREE.Fog(0x999999, 0.1, 30);
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
