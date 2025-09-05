import { onMounted, onUnmounted, shallowRef } from "vue";
import * as Cesium from "cesium";
const pinBuilder = new Cesium.PinBuilder();

export const useCesium = (el: string) => {
  const viewer = shallowRef<Cesium.Viewer>();
  /**
   * @description 初始化地图
   */
  const init = async () => {
    viewer.value = new Cesium.Viewer(el, {
      // 是否展示查询按钮 如果设置为false，将不会创建右上角查询(放大镜)按钮。
      geocoder: false,
      //查看器的显示模式 如果设置为false，将不会创建右上角投影方式控件(显示二三维切换按钮)。
      sceneModePicker: false,
      // 是否展示图层选择器 如果设置为false，将不会创建右上角图层按钮。
      baseLayerPicker: false,
      // 是否显示帮助 如果设置为false，则不会创建右上角帮助(问号)按钮。
      navigationHelpButton: false,
      // 是否展示home控件 如果设置为false，将不会创建右上角主页(房子)按钮。
      homeButton: false,
      // 是否展示动画控件 如果设置为false，将不会创建左下角动画小部件。
      animation: false,
      // 是否展示全屏按钮 如果设置为false，将不会创建右下角全屏按钮。
      fullscreenButton: false,
      // 是否展示时间轴 如果设置为false，则不会创建正下方时间轴小部件。
      timeline: false,
      // 是否展示场景控制 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存。
      scene3DOnly: true,
      // 是否点击要素之后展示信息
      infoBox: false,
      // 是否展示场景的底部
      shadows: false,
      // 启用请求渲染模式
      requestRenderMode: true,
      // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
      sceneMode: Cesium.SceneMode.SCENE3D,
      // 点击选中元素
      selectionIndicator: false,
    });
    // 去除版权样式
    (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display =
      "none"; //去除版权样式
    // 最小缩放高度（米）
    // viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 10_0000;
    // 最大缩放高度（米）
    viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 100_0000;
    addCesiumTerrain(viewer.value!);
    addCZML(viewer.value!);
  };

  onMounted(() => {
    init();
  });
  onUnmounted(() => {
    viewer.value!.destroy();
  });

  return {
    viewer,
  };
};

/**
 * @description 添加山地地形
 * @param {Cesium.Viewer} viewer
 */
async function addCesiumTerrain(viewer: Cesium.Viewer) {
  // 关闭一些不必要的视觉效果，优化性能
  viewer.scene.sun!.show = false; // 太阳
  viewer.scene.moon!.show = false; // 月亮
  viewer.scene.skyBox!.show = false; // 天空盒
  viewer.scene.fog.enabled = false; // 雾
  viewer.scene.skyAtmosphere!.show = false; // 大气
  // 加载默认地形
  const terrain = await Cesium.createWorldTerrainAsync({
    requestVertexNormals: true,
    requestWaterMask: false,
  });
  viewer.terrainProvider = terrain;
  viewer.scene.globe.depthTestAgainstTerrain = true; //地形可以遮挡模型
  // 现在垂直地形夸张的操作，默认值0
  viewer.scene.verticalExaggeration = 1;
  // 垂直地形夸张相对高度，默认值0
  viewer.scene.verticalExaggerationRelativeHeight = 0.1;
}

async function addCZML(viewer: Cesium.Viewer) {
  const startTime = Cesium.JulianDate.fromIso8601("2012-03-15T10:00:00Z");
  const droneStopTime = Cesium.JulianDate.fromIso8601("2012-03-15T10:00:30Z");
  viewer.dataSources
    .add(Cesium.CzmlDataSource.load("/tracking/fly.czml"))
    .then((dataSource) => {
      const drone = dataSource.entities.getById("CesiumDrone");
      // drone.viewFrom = new Cesium.Cartesian3(-50, 0, 0);
      drone!.trackingReferenceFrame = Cesium.TrackingReferenceFrame.VELOCITY;
      viewer.clock.stopTime = droneStopTime;
      viewer.clock.currentTime = startTime;
      // viewer.clock.multiplier = 1;
      viewer.trackedEntity = drone;
      viewer.clock.shouldAnimate = true;
    });
}

/**
 * @description 根据笛卡尔坐标获取经纬度
 * @param {Cesium.Cartesian3} cartesian
 * @return {*}
 */
export const getDegreesFromCartesian3 = (cartesian: Cesium.Cartesian3) => {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Number(
    Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)
  );
  const latitude = Number(
    Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)
  );
  return [longitude, latitude];
};

/**
 * @description 根据经纬度获取笛卡尔坐标
 * @param {number[]} degrees
 * @param {number} height 渲染高度 防止重叠
 * @return {*}
 */
export const getCartesian3FromDegrees = (
  degrees: number[],
  height?: number
) => {
  const cartesian = Cesium.Cartesian3.fromDegrees(
    degrees[0],
    degrees[1],
    height
  );
  return cartesian;
};

/**
 * @description 根据经纬度获取笛卡尔坐标
 * @param {Cesium.Cartographic} cartographic
 * @return {*}
 */
export const getCartes3FromCartographic = (
  cartographic: Cesium.Cartographic
) => {
  const cartesian3 = Cesium.Cartesian3.fromDegrees(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );
  return cartesian3;
};

/**
 * @description 根据笛卡尔坐标获取屏幕位置
 * @param {Cesium.Cartesian3} position
 * @param {Cesium.Viewer} viewer
 * @return {*}
 */
export const getScreenPositionFromCartesian3 = (
  position: Cesium.Cartesian3,
  viewer: Cesium.Viewer
) => {
  const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
    viewer.scene,
    position
  );
  return screenPosition;
};
