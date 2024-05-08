<template>
  <div class="cesium">
    <div id="cesium-container"></div>
    <div class="tooltips" ref="tooltips">1</div>
  </div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import * as Cesium from "cesium";
import { onMounted, ref } from "vue";
import danger from "../../assets/danger.svg";
import CesiumNavigation from "cesium-navigation-es6";

let viewer: Cesium.Viewer;
const tooltips = ref<HTMLElement>();
const init = async () => {
  viewer = new Cesium.Viewer("cesium-container", {
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
    infoBox: true,
    // // 是否展示场景的底部
    // shadows: true,
    // 启用请求渲染模式
    requestRenderMode: true,
    // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
    sceneMode: Cesium.SceneMode.SCENE3D,
    // 地形
    // terrainProvider: await Cesium.createWorldTerrainAsync({
    //   requestVertexNormals: true,
    //   requestWaterMask: true,
    // }),

    baseLayer: new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
      })
    ),
  });
  // 最小缩放高度（米）
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 200;
  // 最大缩放高度（米）
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;
  // 去除版权样式
  (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none"; //去除版权样式
  // 再加上高德影像注记地图
  // viewer.imageryLayers.addImageryProvider(
  //   new Cesium.UrlTemplateImageryProvider({
  //     url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
  //   })
  // );
  //默认视角定位中国上空
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.045034, 30.540885, 1000),
  });
  const options = {
    duration: 1, // 默认为3s 相机延时
    enableCompass: true, //罗盘
    enableZoomControls: true, //缩放
    enableDistanceLegend: true, //比例尺
    enableCompassOuterRing: true, //指南针外环
    // 修改重置视图的tooltip
    resetTooltip: "重置视图",
    // 修改放大按钮的tooltip
    zoomInTooltip: "放大",
    // 修改缩小按钮的tooltip
    zoomOutTooltip: "缩小",
  };
  console.log(CesiumNavigation);
  let thing = new CesiumNavigation(viewer, options);
  initPoint();
  initBox();
  initEvent();
  // viewer.scene.globe.depthTestAgainstTerrain = true;
};

const initPoint = () => {
  const pointInfo = [
    {
      id: "1",
      latitude: 30.54037,
      longitude: 104.060738,
      psName: "有限公司1",
    },
    {
      id: "2",
      latitude: 30.540812,
      longitude: 104.075105,
      psName: "有限公司2",
    },
    {
      id: "3",
      latitude: 30.574852,
      longitude: 104.065799,
      psName: "有限公司3",
    },
  ];
  // 清除上一次加载的点位
  viewer.entities.removeAll();
  // foreach循环加载点位
  pointInfo.forEach((pointObj: any) => {
    viewer.entities.add({
      name: pointObj.psName,
      // code: pointObj.id,
      id: pointObj.id,
      position: Cesium.Cartesian3.fromDegrees(
        pointObj.longitude,
        pointObj.latitude,
        40
      ),
      // 点
      point: {
        pixelSize: 5,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: pointObj.psName,
        font: "16px monospace",
        fillColor: Cesium.Color.WHITE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直方向以底部来计算标签的位置
        pixelOffset: new Cesium.Cartesian2(0, -20), // 偏移量
      },
      // 图标
      billboard: {
        image: danger,
        width: 40,
        height: 40,
      },
    });
    // 连接线
    viewer.entities.add({
      name: pointObj.psName,
      // id: pointObj.id,
      position: Cesium.Cartesian3.fromDegrees(
        pointObj.longitude,
        pointObj.latitude,
        0
      ),
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          pointObj.longitude,
          pointObj.latitude,
          0,
          pointObj.longitude,
          pointObj.latitude,
          40,
        ]),
        width: 1,
        material: Cesium.Color.fromCssColorString("#108de7"),
      },
    });
  });
};

const initBox = () => {
  const position = Cesium.Cartesian3.fromDegrees(104.045034, 30.540885, 250);
  viewer.entities.add({
    name: "box",
    position: position,
    box: {
      dimensions: new Cesium.Cartesian3(80, 80, 500),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
    },
  });
};

// 初始化事件
const initEvent = () => {
  // 监听地图点击事件
  viewer.screenSpaceEventHandler.setInputAction((click) => {
    // 获取点击位置笛卡尔坐标
    const cartesian = viewer.camera.pickEllipsoid(
      click.position,
      viewer.scene.globe.ellipsoid
    );
    // 获取点击位置的经纬度坐标
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian!);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    // 获取地图上的点位实体(entity)坐标
    const pick = viewer.scene.pick(click.position);
    // 如果pick不是undefined，那么就是点到点位了
    if (pick && pick.id) {
      // 定位到地图中心
      // const data = {
      //   layerId: "layer1", // 英文，且唯一,内部entity会用得到
      //   lon: longitude,
      //   lat: latitude,
      //   element: "#one", // 弹框的唯一id
      //   boxHeightMax: 0, // 中间立方体的最大高度
      // };
      tooltips.value!.style.display = "block";
      tooltips.value!.style.left = `${click.position.x}px`;
      tooltips.value!.style.top = `${click.position.y}px`;
      tooltips.value!.innerHTML = `${pick.id.name}`;

      // 定位到地图中心
      const pointLocation = new Cesium.BoundingSphere(
        Cesium.Cartesian3.fromDegrees(longitude, latitude, 100),
        1000
      ); // 120.55538, 31.87532
      viewer.camera.flyToBoundingSphere(pointLocation);
    } else {
      // 移除弹框
      tooltips.value!.style.display = "none";
    }

    viewer.scene.preRender.addEventListener((e) => {
      var scratch = new Cesium.Cartesian2();
      var canvasPosition = viewer.scene.cartesianToCanvasCoordinates(
        cartesian!,
        scratch
      ); // cartesianToCanvasCoordinates 笛卡尔坐标（3维度）到画布坐标
      if (canvasPosition) {
        tooltips.value!.style.left = `${canvasPosition.x}px`;
        tooltips.value!.style.top = `${canvasPosition.y}px`;
      }
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 鼠标移入事件
  viewer.screenSpaceEventHandler.setInputAction((move) => {
    // 获取地图上的点位实体(entity)坐标
    const pick = viewer.scene.pick(move.endPosition);
    // 如果pick不是undefined，那么就是点到点位了
    if (pick && pick.id) {
      (viewer as any)._container.style.cursor = "pointer";
    } else {
      // 移除弹框
      (viewer as any)._container.style.cursor = "default";
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
#cesium-container {
  height: 100vh;
}
.cesium {
  position: relative;
  .tooltips {
    position: absolute;
    padding: 10px;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 0 5px #ccc;
    display: none;
  }
}
</style>
