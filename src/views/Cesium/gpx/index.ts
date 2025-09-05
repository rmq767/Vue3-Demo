import { onMounted, onUnmounted, shallowRef } from "vue";
import * as Cesium from "cesium";
import SC from "@/assets/geo/四川省1.json";
import * as turf from "@turf/turf";
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
    // 四川边界
    addSCRegion(viewer.value!);
    addCesiumTerrain(viewer.value!);
    addGPX(viewer.value!);
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
 * @description 添加四川区域
 * @param {Cesium.Viewer} viewer
 */
function addSCRegion(viewer: Cesium.Viewer) {
  viewer.scene.skyAtmosphere!.show = false; // 大气
  const coors = SC.features[0].geometry.coordinates[0];
  const geojson = turf.polygon(coors);
  const simplified = turf.simplify(geojson, {
    tolerance: 0.05, // 简化容差，值越小，越精确
    highQuality: true, // 是否花费更多时间使用其他算法创建更高质量的简化
  });
  // 根据简化后的几何体创建裁剪区域
  const areas = new Cesium.ClippingPolygon({
    positions: Cesium.Cartesian3.fromDegreesArray(
      simplified.geometry.coordinates[0].flat()
    ),
  });
  // 设置裁剪区域
  viewer.scene.globe.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [areas],
    inverse: true,
  });

  // 设置30度向下视角 (pitch = -30度)
  const pitch = (-40 * Math.PI) / 180; // 转换为弧度
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(103.06, 22.45, 600000),
    orientation: {
      heading: 0,
      pitch: pitch,
      roll: 0,
    },
  });
}

function addGPX(viewer: Cesium.Viewer) {
  const gpx = new Cesium.GpxDataSource();
  viewer.dataSources.add(gpx).then((dataSource) => {
    viewer.zoomTo(dataSource.entities);
    // const entity = dataSource.entities.values[0];
    // viewer.trackedEntity = entity;
    console.log(dataSource.entities);
  });
  gpx
    .load("/gpx/bike.gpx", {
      clampToGround: true,
      trackColor: Cesium.Color.YELLOW as any,
      waypointImage: pinBuilder.fromMakiIconId(
        "bicycle",
        Cesium.Color.BLUE,
        48
      ) as any,
    })
    .then((res) => {});
  viewer.clock.shouldAnimate = true;
}

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
