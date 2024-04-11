<template>
  <div id="cesiumContainer"></div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import * as Cesium from "cesium";
import { onMounted } from "vue";

let viewer: Cesium.Viewer;
const init = async () => {
  viewer = new Cesium.Viewer("cesiumContainer", {
    // 是否展示查询按钮
    geocoder: false,
    //查看器的显示模式
    sceneModePicker: false,
    // 是否展示图层选择器
    baseLayerPicker: false,
    // 是否显示帮助
    navigationHelpButton: false,
    // 是否展示home控件
    homeButton: false,
    // 是否展示动画控件
    animation: false,
    // 是否展示全屏按钮
    fullscreenButton: false,
    // 是否展示时间轴
    timeline: false,
    // // 是否展示场景控制
    // scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    // // 是否点击要素之后展示信息
    // infoBox: true,
    // // 是否展示场景的底部
    // shadows: true,
    // 启用请求渲染模式
    requestRenderMode: true,
    // 初始场景模式
    sceneMode: Cesium.SceneMode.SCENE3D,
    // 地形
    terrainProvider: await Cesium.createWorldTerrainAsync({
      requestVertexNormals: true,
      requestWaterMask: true,
    }),
  });
  // 去除版权样式
  (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none"; //去除版权样式
  //默认视角定位中国上空
  // viewer.camera.setView({
  //   destination: Cesium.Rectangle.fromDegrees(80, 22, 130, 55),
  // });
  viewer.camera.setView({
    destination: new Cesium.Cartesian3(1332761, -4662399, 4137888),
    orientation: {
      //默认（0，-90，0）角度
      heading: Cesium.Math.toRadians(30), //摇头
      pitch: Cesium.Math.toRadians(-40), //点头
      roll: Cesium.Math.toRadians(0), //歪头
    },
  });
  // 导入美国建筑
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343);
  viewer.scene.primitives.add(tileset);
  // 定义3D样式
  const heightStyle = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ["${Height}>=300", "rgba(45,0,75,0.5)"],
        ["${Height}>=200", "rgb(102,71,151)"],
        ["${Height}>=100", "rgba(170,162,204,0.5)"],
        ["${Height}>=50", "rgb(224,226,238)"],
        ["${Height}>=25", "rgb(252,230,200)"],
        ["${Height}>=10", "rgba(248,176,87,0.5)"],
        ["${Height}>=5", "rgb(198,106,11)"],
        ["true", "rgb(127,59,8)"],
      ],
    },
  });
  tileset.style = heightStyle;

  // geojson文件加载
  const neighborhoodsPromise = await Cesium.GeoJsonDataSource.load(
    "../../assets/geo/area.geojson"
  );
  viewer.dataSources.add(neighborhoodsPromise);
  let neighborhoods = neighborhoodsPromise.entities;
  for (let index = 0; index < neighborhoods.values.length; index++) {
    const element = neighborhoods.values[index];
    if (Cesium.defined(element.polygon)) {
    }
  }
};

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped></style>
